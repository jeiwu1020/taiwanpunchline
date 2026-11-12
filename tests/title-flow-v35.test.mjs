import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness,flush} from './helpers/game-harness.mjs';

test('first load is title, unready Start and unrelated gestures do not initialize audio',async()=>{
 const h=await gameHarness({initialize:false});let creates=0;h.window.AudioContext=class{constructor(){creates++;}};
 assert.equal(h.ui.duel.status,'title');assert.equal(h.ui.enterFromTitle(),false);
 h.document.handlers.pointerdown();h.document.handlers.keydown();
 assert.equal(creates,0);assert.equal(h.ui.entered,false);
});
test('Start tries shared audio synchronously but blocked audio cannot block roster navigation',async()=>{
 const h=await gameHarness();h.ui.setScene();let creates=0;h.window.AudioContext=class{constructor(){creates++;throw new Error('Denied');}};
 assert.equal(h.ui.enterFromTitle(),true);assert.ok(creates>0);assert.equal(h.ui.duel.status,'menu');assert.equal(h.ui.entered,true);
 await flush();assert.match(h.$('#entry-audio-status').textContent,/未能啟用|播放失敗/);assert.equal(h.$('#retry-entry-audio').hidden,false);
 assert.equal(h.ui.enterFromTitle(),false);
});
test('home clears countdown/voice/controls and does not change selected pair or preferences',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();h.$('#roster-chen').onclick();h.$('#opponent-card').onclick();h.$('#roster-ko').onclick();
 h.ui.settings.update({masterMuted:true,camera:'stable'});const prefs=h.ui.settings.get();
 h.ui.startGame();assert.equal(h.ui.duel.status,'countdown');assert.ok(h.timers.size);
 h.ui.showTitle();assert.equal(h.ui.duel.status,'title');assert.equal(h.timers.size,0);assert.equal(h.$('.cabinet').dataset.gestureLocked,'false');
 h.ui.enterFromTitle();assert.equal(h.ui.duel.player.type,'chen');assert.equal(h.ui.duel.enemy.type,'ko');assert.deepEqual(h.ui.settings.get(),prefs);
});
test('saved master mute remains muted and no audible entry cue or voice priming is started',async()=>{
 const storage={getItem:()=>JSON.stringify({masterMuted:true}),setItem(){}};
 const h=await gameHarness({storage});h.ui.setScene();let starts=0;
 h.window.AudioContext=class{constructor(){throw new Error('Audio unavailable');}};
 h.$('#move-voice').play=()=>{starts++;return Promise.resolve();};
 h.ui.enterFromTitle();await flush();assert.equal(starts,0);assert.equal(h.ui.settings.get().masterMuted,true);assert.equal(h.$('#sound').textContent,'♪ 聲音關');assert.match(h.$('#entry-audio-status').textContent,/靜音/);
});

test('entry does not immediately stop the newly primed voice lane',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();await flush();
 assert.ok(h.$('#move-voice').plays.length>0);
 assert.equal(h.$('#move-voice').muted,false,'the prime finishes and restores mute state');
});

test('initialization errors remain visible on the gated title rather than only the hidden roster',async()=>{
 const {readFile}=await import('node:fs/promises');
 const game=await readFile(new URL('../dist/game.mjs',import.meta.url),'utf8');
 assert.match(game,/catch\(e\)\{titleUI\?\.setReady\(false,'遊戲畫面無法啟動/);
});
