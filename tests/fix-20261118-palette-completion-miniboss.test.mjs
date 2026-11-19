import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAST, Duel, GROUND } from '../dist/core.mjs';
import { COMBAT, MINI_COMBAT } from '../dist/combat-rules.mjs';
import { PERFORMANCE_GUARD } from '../dist/stage-rules.mjs';
import { fighterPose } from '../dist/art-motion.mjs';
import { shoutCaptionLayout } from '../dist/shout-caption.mjs';
import { createFinishSequence, finishFighterView } from '../dist/match-finish.mjs';
import { CHALLENGE_SECTIONS, CHALLENGE_BOSS_ASSIST_ROSTER } from '../dist/challenge-content.mjs';
import { createChapter2Duel, MINIBOSS_PATTERNS as CH2_MINIBOSS } from '../dist/preview/chapter2/chapter2-engine.mjs';
import { createChapter2Duel as createChapter3Duel, MINIBOSS_PATTERNS as CH3_MINIBOSS } from '../dist/preview/chapter3/chapter2-engine.mjs';
import { createChapter4Duel, MINIBOSS_PATTERNS as CH4_MINIBOSS } from '../dist/preview/chapter4/chapter4-engine.mjs';
import { createChapter5Duel, MINIBOSS_PATTERNS as CH5_MINIBOSS } from '../dist/preview/chapter5/chapter5-engine.mjs';
import { moveKindForAction, makeCombatCallout } from '../dist/preview/campaign/combat-callouts.mjs';
import { drawChallengeSignatureProjectile } from '../dist/challenge-signature-projectile.mjs';

const BIG_BOSS_KINDS = new Set(Object.keys(COMBAT).filter(k => k !== 'punch'));

test('Fix 1: button palette avoids duplicate functional colors across screens and modals', () => {
  const chapterFirstCss = readFileSync('dist/preview/campaign/chapter-first-interface.css', 'utf8');
  const matchModesCss = readFileSync('dist/match-modes.css', 'utf8');
  const challengeCss = readFileSync('dist/challenge.css', 'utf8');
  const finaleCss = readFileSync('dist/preview/finale/finale.css', 'utf8');
  const prepCss = readFileSync('dist/challenge-preparation.css', 'utf8');
  const contCss = readFileSync('dist/preview/campaign/continuation.css', 'utf8');

  assert.match(chapterFirstCss, /:is\(#pause-panel,#result-panel,#choice-panel\) \.paper \.menu-action[^{]*\{[^}]*background:#bc3f31/);
  assert.match(chapterFirstCss, /#campaign-prepare\.menu-action[^{]*\{background:#315f88/);
  assert.match(chapterFirstCss, /#campaign-retry-prepare\.menu-action\{background:#b86420/);
  assert.match(chapterFirstCss, /#pause-home\.menu-action,#trial-app #result-panel #result-home\{background:#5d4c7c/);
  assert.match(chapterFirstCss, /#campaign-growth\.menu-action\{background:#cde3e6/);
  assert.match(chapterFirstCss, /#result-panel #result-skill[^{]*\{background:#315f88/);
  assert.match(chapterFirstCss, /#campaign-retry-confirm \[data-confirm\]\{background:#e5ae46/);

  assert.match(matchModesCss, /#pause-screen #restart-match,#result #replay\{background:#237363/);
  assert.match(matchModesCss, /#result #reselect\{background:#315f88/);
  assert.match(matchModesCss, /#pause-screen #restart-prepare-button\.menu-action\{background:#b86420/);
  assert.match(matchModesCss, /#pause-screen #challenge-inspect-button\.menu-action\{background:#cde3e6/);
  assert.match(matchModesCss, /#home-confirm #home-select,#pause-screen #leave,#result #challenge-result-overview\{background:#5d4c7c/);

  assert.match(challengeCss, /\.challenge-replay-launch\{background:#237363/);
  assert.match(challengeCss, /\[data-action="retry-save"\]\{background:#b86420/);
  assert.match(challengeCss, /\[data-action="review-opening"\],[^{]*\[data-inspect\]\{background:#cde3e6/);
  assert.match(challengeCss, /\.challenge-slot-tabs \[aria-pressed="true"\]\{background:#2c6b74/);

  assert.match(finaleCss, /#finale-prepare\{background:#315f88/);
  assert.match(finaleCss, /#ending-review\{background:#cde3e6/);
  assert.match(contCss, /\.continuation-home-link\{background:#5d4c7c/);
  assert.match(prepCss, /\[data-reset-skills\][^}]*\{background:#e5ae46/);
});

test('Fix 2: chapter completion auto-redirects without flashing #choice-panel or #campaign-next', () => {
  const bridge = readFileSync('dist/preview/campaign/page-bridge.mjs', 'utf8');
  // navigateSaved() must run before renderContinuationChoice on complete
  const navIdx = bridge.indexOf("if(s?.mode==='complete'&&!s?.replay&&s.canNavigate&&!s.blocked&&!s.busy)navigateSaved();");
  const renderIdx = bridge.indexOf('renderContinuationChoice(', navIdx);
  assert.ok(navIdx !== -1 && renderIdx > navIdx);
  assert.ok(bridge.includes("const redirecting=navigating&&s?.mode==='complete';"));
  assert.ok(bridge.includes('suppressPanel:redirecting'));
  assert.ok(bridge.includes('destination=!s&&!navigating&&v.chapterId!==chapterId'));
  assert.ok(bridge.includes("chapterId==='chapter-4'&&s.campaignChapterId&&s.nextRoute?.status==='locked'"));

  for (const file of [
    'dist/preview/chapter2/chapter2-playable.mjs',
    'dist/preview/chapter3/chapter2-playable.mjs',
    'dist/preview/chapter4/chapter4-playable.mjs',
    'dist/preview/chapter5/chapter5-playable.mjs',
  ]) {
    const src = readFileSync(file, 'utf8');
    assert.ok(src.includes("s.mode==='complete'&&!!s.campaignChapterId&&!s.replay&&s.canNavigate&&!s.blocked&&!s.busy&&s.nextRoute?.status==='ready'"), file);
    assert.ok(src.includes("$('#choice-panel').hidden=autoRedirect;"), file);
  }
});

test('Fix 3a: all Ch1-5 minibosses and boss-assist rosters exclusively use mini_* moves', () => {
  for (const section of CHALLENGE_SECTIONS) {
    if (section.gate.kind === 'miniboss') {
      assert.equal(section.gate.moves.length, 3);
      for (const spec of section.gate.moves) {
        const kind = typeof spec === 'string' ? spec : spec.kind;
        assert.ok(kind.startsWith('mini_') && MINI_COMBAT[kind], `${section.gate.id}: ${kind}`);
        assert.equal(BIG_BOSS_KINDS.has(kind), false);
      }
    }
  }
  for (const assist of CHALLENGE_BOSS_ASSIST_ROSTER) {
    assert.ok(Array.isArray(assist.moves) && assist.moves.length > 0);
    for (const spec of assist.moves) {
      const kind = typeof spec === 'string' ? spec : spec.kind;
      assert.ok(kind.startsWith('mini_') && MINI_COMBAT[kind], `ch1 assist ${kind}`);
      assert.equal(BIG_BOSS_KINDS.has(kind), false);
    }
  }
  for (const [label, patterns] of [['ch2', CH2_MINIBOSS], ['ch3', CH3_MINIBOSS], ['ch4', CH4_MINIBOSS], ['ch5', CH5_MINIBOSS]]) {
    for (const [id, spec] of Object.entries(patterns)) {
      assert.equal(spec.moves.length, 3, `${label} ${id}`);
      for (const mv of spec.moves) {
        const kind = typeof mv === 'string' ? mv : mv.kind;
        assert.ok(kind.startsWith('mini_') && MINI_COMBAT[kind], `${label} ${id}: ${kind}`);
        assert.equal(BIG_BOSS_KINDS.has(kind), false);
      }
    }
  }
  // Chapter 3 & 4 copies contain no legacy ko/ma move metaphors
  const ch3Content = readFileSync('dist/preview/chapter3/chapter2-content.mjs', 'utf8');
  const ch4Content = readFileSync('dist/preview/chapter4/chapter4-content.mjs', 'utf8');
  assert.doesNotMatch(ch3Content, /兩袋/);
  assert.doesNotMatch(ch4Content, /清喉嚨|連咳兩聲|咳嗽/);
});

test('Fix 3b: minibosses never rally, never drink/heal, never cast Lai-Xiangde, and match cooldown warnings', () => {
  const ch5a = createChapter5Duel({ stepId: 'miniboss-a' });
  ch5a.enemy.hp = 20;
  ch5a.enemy.rally = 100;
  assert.equal(ch5a.enemy.noRally, true);
  assert.equal(ch5a.request(ch5a.enemy, 'rally'), false);
  // Stepping AI with low HP must never choose heal (special3 is mini_whistle_charge)
  for (let i = 0; i < 120; i++) ch5a.step(1 / 60, {});
  assert.equal(ch5a.enemy.hp <= 20, true);
  assert.equal(ch5a.rallies.length, 0);

  // Cooldown mismatch fix: when pattern special is on cooldown, warning + executed action both fall back to punch
  const ch2a = createChapter2Duel({ stepId: 'miniboss-a' });
  ch2a.player.x = ch2a.enemy.x - 100;
  ch2a.enemy.cooldowns = [5, 5, 5];
  ch2a.miniWait = 0;
  ch2a.step(1 / 60, {});
  const warnEv = ch2a.drainEvents().find(e => e.type === 'minibossWarning');
  assert.ok(warnEv);
  assert.equal(warnEv.action, 'punch');
  assert.equal(warnEv.name, '順勢補拳！');

  // Ch3 notice projectile uses custom noticeText, never 賴祥德
  const ch3b = createChapter3Duel({ stepId: 'miniboss-b' });
  ch3b.player.x = ch3b.enemy.x - 150;
  assert.equal(ch3b.request(ch3b.enemy, 'special2'), true);
  for (let i = 0; i < 25; i++) ch3b.step(1 / 60, {});
  const proj = ch3b.projectiles[0];
  assert.ok(proj);
  assert.equal(proj.kind, 'notice');
  assert.equal(proj.noticeText, '退件');
  assert.equal(proj.markLabel, '落點');
  const drawnTexts = [];
  const fakeCtx = {
    save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {},
    set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {}, set font(_) {}, set textAlign(_) {}, set textBaseline(_) {},
    fillText(txt) { drawnTexts.push(txt); },
  };
  assert.equal(drawChallengeSignatureProjectile(fakeCtx, {}, proj, 100), true);
  assert.deepEqual(drawnTexts, ['退件']);
});

test('Fix 3c: all 10 MINI_COMBAT moves simulate cleanly, animate, guard, and finish cleanly', () => {
  const kinds = Object.keys(MINI_COMBAT);
  assert.equal(kinds.length, 10);
  for (const kind of kinds) {
    assert.ok(PERFORMANCE_GUARD[kind], `PERFORMANCE_GUARD missing ${kind}`);
    const g = new Duel('wang', 'easy', () => 0.1, 'han', {
      enemyKind: 'miniboss',
      enemyMoves: [kind, kind, kind],
    });
    g.enemy.mobKind = 'mini_mic';
    g.enemy.displayName = '場務測試';
    g.player.x = 560;
    g.enemy.x = 660;
    assert.equal(moveKindForAction('special1', g.enemy), kind);
    const layout = shoutCaptionLayout('測試喊話', 'enemy', { width: 960, height: 540 }, {}, { kind, actor: 'mini' });
    assert.equal(layout.style.label, '場務');
    assert.ok(makeCombatCallout('測試', '', kind, 'mini'));

    assert.equal(g.request(g.enemy, 'special1'), true);
    for (let i = 0; i < 90; i++) g.step(1 / 60, {});
    const pose = fighterPose({ ...g.enemy, type: 'wang', attack: { kind, age: 0.2 } }, 200);
    assert.ok(pose && pose.arm && pose.farArm);
  }

  // Test finish view on mini_baton_upper
  const finDuel = new Duel('wang', 'easy', () => 0, 'wang', { enemyKind: 'miniboss', enemyMoves: ['mini_baton_upper', 'mini_megaphone_blast', 'mini_whistle_charge'] });
  finDuel.enemy.mobKind = 'mini_schedule';
  finDuel.enemy.displayName = '清點隊長';
  finDuel.request(finDuel.enemy, 'special1');
  finDuel.step(0.1, {});
  finDuel.winner = 'player';
  const seq = createFinishSequence(finDuel);
  const view = finishFighterView(seq, 1);
  assert.ok(view && view.fighter);

  // Test final boss assist roster uses mini_* moves with mobKind
  const bossCh2 = createChapter2Duel({ stepId: 'boss' });
  bossCh2.player.x = 500;
  bossCh2.enemy.x = 620;
  assert.equal(bossCh2.request(bossCh2.enemy, 'assist'), true);
  assert.ok(bossCh2.assists[0].kind.startsWith('mini_'));
  assert.equal(bossCh2.assists[0].actor.mobKind, 'mini_mic');
});
