import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {Duel} from '../dist/core.mjs';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {createMainCampaignBridge,prepareMainContinuation} from '../dist/main-campaign-bridge.mjs';
import {createFinaleSession} from '../dist/preview/finale/finale-session.mjs';
import {installBossEncounter,ensureChapterEncounter} from '../dist/chapter-encounters.mjs';
import {CHAPTER_METADATA,mountChapterLoadingOverlay} from '../dist/chapter-unified-presentation.mjs';
import {challengeResultActions} from '../dist/series-presentation.mjs';
import {mountContinuationControls} from '../dist/preview/campaign/page-bridge.mjs';
import {createCampaignHandoff} from '../dist/preview/campaign/navigation.mjs';
import {createPlayableChapter as createChapter2} from '../dist/preview/chapter2/chapter2-controller.mjs';
import {CAST} from '../dist/preview/chapter2/core.mjs';
import {memoryStorage,serialLocks,freshCampaignAt} from './helpers/formal-flow-fixtures.mjs';

const readText = rel => readFileSync(new URL('../' + rel, import.meta.url), 'utf8');

test('Item 1: #challenge-unlock-hint is shown in both battle and training modes', () => {
 const gameSource = readText('dist/game.mjs');
 assert.match(gameSource, /unlockHint\.hidden\s*=\s*!\['battle',\s*'training'\]\.includes\(gameMode\)/);
 const html = readText('dist/index.html');
 assert.match(html, /id="challenge-unlock-hint"[^>]*>遊玩挑戰模式，可解鎖更多角色。/);
});

test('Item 2: Custom game-styled replay dropdown lists all cleared chapters + completed Finale and preserves cursor on replay', async () => {
 const storage = memoryStorage();
 const locks = serialLocks();
 const {api} = await freshCampaignAt({storage, locks, chapterId: 'finale-3v4'});
 let result = await api.beginChallenge({chapterId: 'finale-3v4'});
 assert.equal(result.accepted, true);
 for (const action of [
  {type: 'finale-start', team: ['wang', 'han', 'huang']},
  {type: 'finale-win'},
  {type: 'story-complete'}
 ]) {
  result = await api.dispatchChallenge(result.token, action);
  assert.equal(result.accepted, true);
 }
 assert.equal(api.readProfile().campaign.finale.status, 'completed');
 const cursorBefore = structuredClone(api.readProfile().campaign.cursor);

 const dom = new JSDOM('<!doctype html><html><body></body></html>', {url: 'https://example.test/'});
 const doc = dom.window.document;
 doc.defaultView.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
 doc.defaultView.HTMLDialogElement.prototype.close = function() { this.open = false; };
 const launched = [];
 const ui = mountChallengeUI({
  parent: doc.body,
  controller: api,
  characters: CAST,
  onStart: opts => { launched.push(opts); return {accepted: true, persisted: true}; },
  onContinue: () => ({accepted: true, persisted: true}),
  onReview: () => {},
  onClose: () => {},
  onChange: () => {}
 });
 ui.open({view: 'chapter'});

 const picker = ui.element.querySelector('[data-replay-picker]');
 assert.ok(picker, 'custom .challenge-replay-picker must exist');
 assert.equal(ui.element.querySelectorAll('select').length, 0, 'must not use native <select> for replay selector');
 const options = [...ui.element.querySelectorAll('[data-replay-option]')].map(el => el.dataset.replayOption);
 assert.deepEqual(options, ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'finale-3v4']);

 // Select chapter-4 from custom dropdown and launch replay
 ui.element.querySelector('[data-replay-trigger]').click();
 assert.equal(ui.element.querySelector('[data-replay-menu]').hidden, false);
 ui.element.querySelector('[data-replay-option="chapter-4"]').click();
 assert.equal(ui.element.querySelector('[data-replay-trigger]').textContent.includes('第四章'), true);
 ui.element.querySelector('[data-action="replay-selected"]').click();
 assert.equal(launched.length, 1);
 assert.deepEqual({replay: launched[0].replay, chapterId: launched[0].chapterId}, {replay: true, chapterId: 'chapter-4'});

 // Now select finale-3v4 and verify finale replay session preserves cursor
 ui.open({view: 'chapter'});
 ui.element.querySelector('[data-replay-trigger]').click();
 ui.element.querySelector('[data-replay-option="finale-3v4"]').click();
 ui.element.querySelector('[data-action="replay-selected"]').click();
 assert.equal(launched.length, 2);
 assert.deepEqual({replay: launched[1].replay, chapterId: launched[1].chapterId}, {replay: true, chapterId: 'finale-3v4'});

 // Verify main-campaign-bridge prepares cleared chapter replay cleanly
 createMainCampaignBridge(api);
 const prepCh3 = await prepareMainContinuation({progress: api, characterId: 'han', helperId: 'wang', chapterId: 'chapter-3', replay: true});
 assert.equal(prepCh3.accepted, true);
 assert.equal(prepCh3.replay, true);
 assert.match(prepCh3.url, /chapter3/);

 // Verify finale replay session runs team-select -> battle -> ending -> complete without corrupting cursor
 const finale = await createFinaleSession({progress: api, replay: true});
 assert.equal(finale.accepted, true);
 assert.equal(finale.chapter.view().replay, true);
 assert.equal(finale.chapter.view().mode, 'team-select');
 const started = await finale.chapter.start(['wang', 'han', 'ko']);
 assert.equal(started.accepted, true);
 finale.chapter.world.status = 'over';
 finale.chapter.world.winner = 'enemy';
 finale.chapter.step(0, {});
 assert.equal(finale.chapter.view().mode, 'result');
 await finale.chapter.continueResult();
 finale.chapter.world.status = 'over';
 finale.chapter.world.winner = 'player';
 finale.chapter.step(0, {});
 await finale.chapter.flush();
 await finale.chapter.continueResult();
 while (finale.chapter.view().mode === 'story') await finale.chapter.nextStory();
 assert.equal(finale.chapter.view().mode, 'complete');
 assert.deepEqual(api.readProfile().campaign.cursor, cursorBefore);
 ui.destroy();
 dom.window.close();
});

test('Regression: Challenge Mode overview mounts & opens cleanly inside real dist/index.html (.app present)', async () => {
 const storage = memoryStorage();
 const locks = serialLocks();
 const api = await openChallengeProgress({storage, locks});
 const bridge = createMainCampaignBridge(api);
 const html = readText('dist/index.html');
 const dom = new JSDOM(html, {url: 'https://example.test/', pretendToBeVisual: true});
 const doc = dom.window.document;
 doc.defaultView.HTMLDialogElement.prototype.showModal = function() { this.open = true; this.setAttribute('open', ''); };
 doc.defaultView.HTMLDialogElement.prototype.close = function() { this.open = false; this.removeAttribute('open'); };
 const app = doc.querySelector('.app');
 assert.ok(app, 'real index.html must contain .app');
 let started = null;
 const ui = mountChallengeUI({
  controller: api,
  progress: bridge,
  characters: CAST,
  parent: app,
  onStart: opts => { started = opts; return {accepted: true, persisted: true}; },
  onContinue: () => ({accepted: true, persisted: true}),
  onReview: () => {},
  onChange: () => {}
 });
 const snap = api.preparationSnapshot();
 assert.equal(ui.open({characterId: snap.characterId, helperId: snap.helperId, selectionExplicit: true}), true);
 assert.equal(ui.isOpen, true);
 assert.equal(ui.element.querySelector('h2')?.textContent, '挑戰總覽');
 ui.element.querySelector('[data-view="preparation"]').click();
 assert.equal(ui.element.querySelector('[data-embedded="true"]')?.hidden, false);
 ui.element.querySelector('[data-view="save"]').click();
 assert.equal(ui.element.querySelector('h2')?.textContent, '存檔管理');
 ui.element.querySelector('[data-view="chapter"]').click();
 ui.element.querySelector('[data-action="start"]').click();
 assert.deepEqual(started, {characterId: 'wang', helperId: 'han', intent: 'start'});
 ui.destroy();
 dom.window.close();
});

test('Item 3: Save Management UI removes v4 from labels while backup filenames retain v4', async () => {
 const storage = memoryStorage();
 const locks = serialLocks();
 const api = await openChallengeProgress({storage, locks});
 const dom = new JSDOM('<!doctype html><html><body></body></html>', {url: 'https://example.test/'});
 const doc = dom.window.document;
 doc.defaultView.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
 doc.defaultView.HTMLDialogElement.prototype.close = function() { this.open = false; };
 const ui = mountChallengeUI({
  parent: doc.body,
  controller: api,
  characters: CAST,
  onStart: () => ({accepted: true}),
  onClose: () => {},
  onChange: () => {}
 });
 ui.open({view: 'save'});
 const saveSection = ui.element.querySelector('.challenge-save');
 assert.ok(saveSection);
 assert.match(saveSection.textContent, /還原同槽備份/);
 assert.doesNotMatch(saveSection.textContent, /v4/i);

 const challengeUiSource = readText('dist/challenge-ui.mjs');
 assert.match(challengeUiSource, /punchline-v4-recovery-all-slots\.json/);
 assert.match(challengeUiSource, /punchline-v4-\$\{id\}-backup\.json/);
 const pageBridgeSource = readText('dist/preview/campaign/page-bridge.mjs');
 assert.match(pageBridgeSource, /punchline-challenge-v4-backup\.json/);
 ui.destroy();
 dom.window.close();
});

test('Item 4: Loading overlay hides .chapter-loading-phase, Ch1-5 titles have no boss spoilers, and tips are player-facing', () => {
 const bossNames = ['咆哮哥', '電火球', '柯P', '小馬哥', '阿扁仔'];
 const devJargon = ['移動角色高度', '天空與遠景保持固定', '共用角色素材'];
 for (const ch of [1, 2, 3, 4, 5]) {
  const meta = CHAPTER_METADATA[ch];
  for (const boss of bossNames) {
   assert.equal(meta.title.includes(boss), false, `Ch ${ch} title must not spoil boss ${boss}`);
  }
  for (const tip of meta.tips) {
   for (const bad of devJargon) {
    assert.equal(tip.includes(bad), false, `Ch ${ch} tip must not contain dev jargon: ${bad}`);
   }
  }
 }
 const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {url: 'https://example.test/'});
 const loader = mountChapterLoadingOverlay({document: dom.window.document, chapter: 2});
 loader.setProgress(0.5, {phaseLabel: '共用角色素材', statusText: '正在載入街景…'});
 const phaseEl = dom.window.document.querySelector('.chapter-loading-phase');
 assert.equal(phaseEl.hidden, true);
 const styleText = dom.window.document.getElementById('chapter-loading-overlay-style')?.textContent || '';
 assert.match(styleText, /\.chapter-loading-phase\s*\{[^}]*display:\s*none\s*!important/);
 assert.equal(dom.window.document.querySelector('.chapter-loading-status-text').textContent, '正在載入街景…');
 loader.destroy();
 dom.window.close();
});

test('Item 5: #enemy-hp has no taller height overrides than player .hp-track across chapter & finale CSS', () => {
 for (const file of [
  'dist/preview/campaign/chapter-ui.css',
  'dist/preview/chapter2/chapter2-playable.css',
  'dist/preview/chapter3/chapter2-playable.css',
  'dist/preview/chapter4/chapter4-playable.css',
  'dist/preview/finale/finale.css',
  'dist/preview/campaign/chapter-first-interface.css'
 ]) {
  const css = readText(file);
  const matches = [...css.matchAll(/#enemy-hp\s*\{([^}]*)\}/g)];
  for (const m of matches) {
   assert.doesNotMatch(m[1], /height\s*:/i, `${file} must not override #enemy-hp height separately from .hp-track`);
  }
 }
});

test('Item 6 & 8: Unified menu copy (強化技能), pause-only 查看角色能力, and semantic button color tokens', async () => {
 // Verify challengeResultActions label
 assert.equal(challengeResultActions({challenge: true, resultReady: true, winner: 'player'}).preparationLabel, '強化技能');

 // Verify Ch2-5 & Finale HTML + JS copy
 for (const n of [2, 3, 4, 5]) {
  const html = readText(`dist/preview/chapter${n}/index.html`);
  assert.match(html, /id="result-skill"[^>]*>強化技能</);
  assert.match(html, /id="leave"[^>]*>查看角色能力</);
  assert.doesNotMatch(html, /出戰準備/);
  const mjs = readText(`dist/preview/chapter${n}/${n === 4 ? 'chapter4' : n === 5 ? 'chapter5' : 'chapter2'}-playable.mjs`);
  assert.doesNotMatch(mjs, /下一段出戰準備|調整下一段出戰準備/);
  assert.match(mjs, /prepare\.textContent='強化技能'/);
 }
 const finaleHtml = readText('dist/preview/finale/index.html');
 assert.match(finaleHtml, /id="finale-prepare"[^>]*>強化技能 · 配點與難度</);
 assert.match(finaleHtml, /id="leave"[^>]*>查看角色能力</);

 // Verify semantic colors in chapter-first-interface.css & challenge.css & finale.css
 const firstCss = readText('dist/preview/campaign/chapter-first-interface.css');
 assert.match(firstCss, /\.menu-action\{[^}]*background:#bc3f31/);
 assert.match(firstCss, /#restart-match[^}]*#campaign-retry-prepare\.menu-action\{background:#237363/);
 assert.match(firstCss, /#campaign-growth\.menu-action\{background:#315f88/);
 assert.match(firstCss, /#result-skill[^}]*#campaign-prepare\.menu-action[^}]*\{background:#315f88/);
 assert.match(firstCss, /#restart-confirm-button\{background:#e5ae46\}/);

 const challengeCss = readText('dist/challenge.css');
 assert.match(challengeCss, /\.challenge-dialog\s+\.challenge-start\{[^}]*background:#bc3f31/);
 assert.match(challengeCss, /\.challenge-replay-launch\{[^}]*background:#237363/);
 assert.match(challengeCss, /\.challenge-tabs\s+button\[aria-pressed=true\]\{[^}]*background:#e5ae46/);

 // Verify pause-only 查看角色能力 behavior in page-bridge.mjs
 const dom = new JSDOM('<div id="stage"></div><div id="menu"><div class="card"><span class="eyebrow"></span><p class="note"></p><div id="menu-roster"></div><label><select id="difficulty"><option value="easy">一般</option></select></label><button id="start"></button></div></div><div id="story-panel"><div class="story-card"></div></div><div id="result-panel"><div class="card"></div></div><div id="pause-panel"><div class="card"><button id="leave">查看角色能力</button></div></div><div id="choice-panel"><div class="card"><p id="choice-copy"></p></div></div>', {url: 'https://example.test/'});
 const storage = memoryStorage();
 const locks = serialLocks();
 const {api} = await freshCampaignAt({storage, locks, chapterId: 'chapter-2'});
 const handoff = createCampaignHandoff({window: dom.window, url: 'preview/chapter2/?campaign=1&profile=slot-1', view: {...api.get(), chapterId: 'chapter-2'}});
 dom.reconfigure({url: handoff.url});
 Object.defineProperty(dom.window, 'localStorage', {value: storage});
 Object.defineProperty(dom.window.navigator, 'locks', {value: locks});
 let chapter;
 const ui = mountContinuationControls({
  document: dom.window.document,
  window: dom.window,
  chapterId: 'chapter-2',
  characters: CAST,
  createPlayableChapter: createChapter2,
  isReady: () => true,
  onReady: c => { chapter = c; }
 });
 await ui.assetsReady();
 await ui.whenIdle();
 const d = dom.window.document;
 // Story mode: 強化技能 visible, 查看角色能力 hidden
 assert.equal(chapter.view().mode, 'story');
 assert.equal(d.querySelector('#campaign-prepare').textContent, '強化技能');
 assert.equal(d.querySelector('#campaign-prepare').hidden, false);
 assert.equal(d.querySelector('#campaign-growth').hidden, true);
 // Advance to route & pause: 查看角色能力 visible, 重新整備再重試 visible
 while (chapter.view().mode === 'story') { chapter.nextStory(chapter.view().token); await chapter.flush(); }
 chapter.setPaused(true, chapter.view().token);
 ui.render();
 assert.equal(d.querySelector('#campaign-growth').textContent, '查看角色能力');
 assert.equal(d.querySelector('#campaign-growth').hidden, false);
 assert.equal(d.querySelector('#campaign-retry-prepare').hidden, false);
 assert.equal(d.querySelector('#campaign-prepare').hidden, true);
 dom.window.close();
});

test('Item 7: Ch2 boss arena has zero push-carts while Ch2 street route and other boss props remain intact', () => {
 const bossWorld = new Duel('wang', 'easy', () => 0.5, 'su');
 installBossEncounter(bossWorld, 2);
 assert.equal(bossWorld.chapterEncounter.boss, true);
 assert.deepEqual(bossWorld.chapterEncounter.props, []);
 assert.doesNotMatch(bossWorld.chapterEncounter.hint, /推車/);

 const streetWorld = {
  runId: 'chapter-2:route-a',
  worldWidth: 2400,
  section: {id: 'chapter-2:route-a', spawns: [], supplyX: 1200},
  platforms: [],
  player: {x: 200, depth: 0, face: 1, y: 430}
 };
 ensureChapterEncounter(streetWorld, 2, false);
 assert.equal(streetWorld.chapterEncounter.boss, false);
 assert.equal(streetWorld.chapterEncounter.props.length, 3);
 assert.equal(streetWorld.chapterEncounter.props[0].kind, 'rush');

 for (const ch of [1, 3, 4, 5]) {
  const otherBoss = new Duel('wang', 'easy', () => 0.5, 'han');
  installBossEncounter(otherBoss, ch);
  assert.equal(otherBoss.chapterEncounter.props.length, 2, `Ch ${ch} boss keeps its 2 props`);
 }
});
