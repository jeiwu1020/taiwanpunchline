import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {gameHarness,flush} from './helpers/game-harness.mjs';import {CAST} from '../dist/roster.mjs';import {playableVoice} from '../dist/voice-slots.mjs';
test('entry and match start prime only actual silent PCM, never a character phrase',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();await flush();h.ui.startGame();await flush();
 const p=h.$('#move-voice');assert.ok(p.plays.length);assert.ok(p.plays.every(src=>src==='assets/audio-unlock-silence-v37.wav'));
 const b=await readFile(new URL('../dist/assets/audio-unlock-silence-v37.wav',import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.ok(b.subarray(44).every(v=>v===0));
});
for(const [id,c]of Object.entries(CAST))test(`${id} portrait plays only its first move on deliberate selection`,async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();await flush();const p=h.$('#move-voice');p.plays.length=0;
 h.$('#roster-'+id).onclick();await flush();assert.deepEqual(p.plays,[playableVoice(c.moves[0].kind).src]);
});
test('mute suppresses roster voice; confirmed home clears active match and countdown',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();await flush();h.ui.settings.update({masterMuted:true});const p=h.$('#move-voice');p.plays.length=0;h.$('#roster-han').onclick();assert.equal(p.plays.length,0);
 h.ui.startGame();assert.ok(h.timers.size);h.$('#home').onclick();assert.equal(h.ui.duel.status,'countdown');const confirm=h.$('#home-confirm-button');confirm.handlers.pointerdown({pointerId:9});confirm.onclick({detail:1,pointerId:9});assert.equal(h.ui.duel.status,'title');assert.equal(h.timers.size,0);assert.equal(h.$('#pause').disabled,true);
});
test('changing selection side or difficulty never autoplays a catchphrase',async()=>{
 const h=await gameHarness();h.ui.setScene();h.ui.enterFromTitle();await flush();const p=h.$('#move-voice');p.plays.length=0;
 h.$('#opponent-card').onclick();h.$('#difficulty-normal').onclick();h.$('#player-card').onclick();assert.equal(p.plays.length,0);
 h.$('#roster-ma').onclick();await flush();assert.equal(p.plays.length,1);
 h.$('#roster-ma').onclick();await flush();assert.equal(p.plays.length,2,'explicit repeat click is a new requested audition');
});
