import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameHarness as baseGameHarness} from './helpers/game-harness.mjs';
import {CAST} from '../dist/core.mjs';
const gameHarness=async options=>{const h=await baseGameHarness(options);h.ui.showMenu();return h;};
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('main selection screen uses only in-game role, character and difficulty buttons',()=>{
 const menu=html.slice(html.indexOf('<div id="menu"'),html.indexOf('<div id="countdown"'));
 assert.equal((menu.match(/<select\b/g)||[]).length,1,'only training behavior uses a compact native selector');
 assert.match(menu,/<select id="training-behavior"/);
 assert.doesNotMatch(menu,/<select[^>]*id="(?:player|opponent|difficulty)/);
 assert.match(menu,/<button[^>]+id="player-card"/);
 assert.match(menu,/<button[^>]+id="opponent-card"/);
 assert.match(menu,/id="roster-grid"/);
 assert.match(menu,/id="difficulty-easy"/);assert.match(menu,/id="difficulty-normal"/);
});
test('all seven portrait buttons are generated once with real labels and existing images',async()=>{
 const h=await gameHarness(),markup=h.$('#roster-grid').innerHTML;
 const ids=[...markup.matchAll(/data-character="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids,Object.keys(CAST));
 assert.equal((markup.match(/<button\b/g)||[]).length,7);
 for(const cast of Object.values(CAST)){assert.ok(markup.includes(cast.portrait));assert.ok(markup.includes(cast.name));}
});
test('role cards target only their side, allow mirrors, and show both role badges',async()=>{
 const h=await gameHarness();
 h.$('#roster-ma').onclick();assert.equal(h.ui.duel.player.type,'ma');assert.equal(h.ui.duel.enemy.type,'han');
 h.$('#opponent-card').onclick();h.$('#roster-ma').onclick();
 assert.equal(h.ui.duel.player.type,'ma');assert.equal(h.ui.duel.enemy.type,'ma');
 assert.equal(h.$('#roster-ma').getAttribute('aria-pressed'),'true');
 assert.equal(h.$('#roster-badge-ma').textContent,'你＋AI');
 h.$('#player-card').onclick();h.$('#roster-ko').onclick();
 assert.equal(h.ui.duel.player.type,'ko');assert.equal(h.ui.duel.enemy.type,'ma');
 assert.equal(h.$('#roster-badge-ma').textContent,'AI');
 assert.equal(h.$('#roster-badge-ko').textContent,'你');
});
test('custom difficulty persists through start, replay and return to roster',async()=>{
 const h=await gameHarness();h.ui.setScene();h.$('#difficulty-normal').onclick();
 assert.equal(h.$('#difficulty-normal').getAttribute('aria-pressed'),'true');
 assert.equal(h.$('#difficulty-easy').getAttribute('aria-pressed'),'false');
 h.ui.startGame();assert.equal(h.ui.duel.difficulty,'normal');
 h.ui.showMenu();h.ui.startGame();assert.equal(h.ui.duel.difficulty,'normal');
 h.ui.showMenu();h.$('#difficulty-easy').onclick();h.ui.startGame();assert.equal(h.ui.duel.difficulty,'easy');
});
test('hidden roster actions cannot reset a running battle or restart a countdown',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.startGame();const duel=h.ui.duel;
 h.$('#roster-ko').onclick();h.$('#difficulty-normal').onclick();h.$('#opponent-card').onclick();h.$('#start').onclick();
 assert.equal(h.ui.duel,duel);assert.equal(h.ui.duel.player.type,'wang');assert.equal(h.ui.duel.enemy.type,'han');
 assert.equal(h.ui.duel.difficulty,'easy');
});

test('loading-time roster clicks are ignored until cards have been initialized',async()=>{
 const h=await gameHarness({initialize:false});const original=h.ui.duel;
 h.$('#opponent-card').onclick();h.$('#difficulty-normal').onclick();
 assert.equal(h.ui.duel,original);assert.equal(h.ui.duel.difficulty,'easy');
 h.ui.initializeRoster();h.$('#difficulty-normal').onclick();
 assert.equal(h.ui.duel.difficulty,'normal');
});

test('difficulty selection has a visible non-color checkmark as well as pressed semantics',async()=>{
 const h=await gameHarness();assert.equal(h.$('#difficulty-mark-easy').textContent,'✓');assert.equal(h.$('#difficulty-mark-normal').textContent,'○');
 h.$('#difficulty-normal').onclick();assert.equal(h.$('#difficulty-mark-normal').textContent,'✓');assert.equal(h.$('#difficulty-mark-easy').textContent,'○');
});
