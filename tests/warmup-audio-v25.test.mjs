// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Duel} from './helpers/neutral-combat.mjs';
import {COMBAT} from '../dist/combat-rules.mjs';
import {playableVoice,VOICE_SLOTS} from '../dist/voice-slots.mjs';
import {normalTrace} from './helpers/normal-trace-v25.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/normal-v24-traces.json',import.meta.url),'utf8'));
// V39 changes only earned counter/grab interruption, not normal AI. Keep the
// historical V24 fixture intact; a single reviewed trace has a scoped override.
const rallyBaseline=JSON.parse(readFileSync(new URL('./fixtures/normal-v52-rally-traces.json',import.meta.url),'utf8'));
const stageBaseline=JSON.parse(readFileSync(new URL('./fixtures/normal-v44-stage-traces.json',import.meta.url),'utf8'));
const counterBaseline=JSON.parse(readFileSync(new URL('./fixtures/normal-v39-counter-traces.json',import.meta.url),'utf8'));
for(const [pair,expected] of Object.entries(baseline.traces))test(`formal mode trace: ${pair}`,()=>{const [p,e]=pair.split('/');assert.equal(normalTrace(Duel,p,e),rallyBaseline.traces[pair]??stageBaseline.traces[pair]??counterBaseline.traces[pair]??expected);});
const hitGame=()=>{const g=new Duel('wang','easy',()=>.9,'han');g.player.x=100;g.enemy.x=800;g.aiWait=10;return g;};
test('warm-up failed escape chance is sampled once per received hit, not every frame',()=>{
 const g=hitGame();let calls=0;const rolls=[.7,.1,.8];g.rng=()=>{calls++;return rolls[calls-1]??.9;};
 g.damage(g.player,g.enemy,6,0);for(let n=0;n<20;n++)g.think(1/120);
 assert.equal(calls,1);assert.equal(g.aiBufferedDefense,null);
 g.damage(g.player,g.enemy,6,0);g.think(1/120);assert.equal(calls,3);assert.equal(g.aiBufferedDefense,'guard');
});
test('warm-up successful hit escape is not selected again during the same stun',()=>{
 const g=hitGame();let calls=0;g.rng=()=>++calls===1?.1:.8;
 g.damage(g.player,g.enemy,6,0);for(let n=0;n<20;n++)g.think(1/120);assert.equal(calls,2);assert.equal(g.aiBufferedDefense,'guard');
});
test('warm-up gets 0.55 to 0.80 seconds after an action and does not chase during breathing',()=>{
 const g=hitGame();g.rng=()=>.5;g.request(g.enemy,'punch');
 for(let n=0;n<100&&g.enemy.attack;n++)g.step(1/120,{},true);
 assert.ok(g.aiRecovery>=.55&&g.aiRecovery<=.8,String(g.aiRecovery));
 g.player.x=g.enemy.x-200;g.think(1/120);assert.equal(g.aiInput.left,false);assert.equal(g.aiInput.right,false);
 for(let n=0;n<100&&g.aiRecovery>0;n++)g.step(1/120,{},true);
 g.player.x=g.enemy.x-200;g.think(1/120);assert.equal(g.aiInput.left,true,'pursuit resumes after breathing');
});
test('Chen question copy describes high/low attacks without pretending there are two voice lines',()=>{
 assert.doesNotMatch(COMBAT.chen_question.hint,/第一問|第二問/);assert.match(COMBAT.chen_question.hint,/高段5.*低段8/);
 assert.equal(COMBAT.chen_question.duration,.80);assert.deepEqual(COMBAT.chen_question.hits,[{start:.18,end:.27,damage:5,knock:4,height:'high'},{start:.42,end:.52,damage:8,knock:32,height:'low'}]);
 assert.equal(VOICE_SLOTS.chen_question.src,'assets/voice/chen-question-user-selected-v31.wav');
});
test('drinking uses the reviewed supplied-file range while the untrimmed original remains byte-identical',()=>{
 const voice=playableVoice('heal');assert.ok(voice);assert.equal(voice.userProvided,true);assert.equal(voice.originalVerified,false);assert.equal(voice.cue,0);assert.equal(voice.sourceFile,'喝水.mp3');assert.match(voice.status,/未獨立聽驗/);
 const actual=createHash('sha256').update(readFileSync(new URL('../dist/assets/voice/wang-drink-user-v25.mp3',import.meta.url))).digest('hex');assert.equal(actual,'2a4627f3a434ee1a1983af9765557e6db0bd11c5c214d0bfa7b51b6618bda96f');
});
test('warm-up buffered jump does not resume chasing inside action recovery',()=>{
 const g=hitGame();g.rng=()=>.1;g.request(g.enemy,'punch');g.step(1/120,{},true);g.damage(g.player,g.enemy,6,0);
 for(let n=0;n<100&&!g.events.some(e=>e.type==='jump'&&e.f===g.enemy);n++)g.step(1/120,{},true);
 assert.ok(g.events.some(e=>e.type==='jump'&&e.f===g.enemy));assert.ok(g.aiRecovery>0);
 assert.notEqual(g.aiInput.left,true);assert.notEqual(g.aiInput.right,true);
});
test('current guide no longer calls the supplied drinking audio synthesized',()=>{
 const page=readFileSync(new URL('../dist/moves.html',import.meta.url),'utf8');assert.doesNotMatch(page,/20 招保留|喝水(?:只有|使用)合成音效/);assert.match(page,/喝水.mp3/);
});
test('an accepted drinking move routes the user file immediately to the correct actor',async()=>{
 const {gameHarness,move}=await import('./helpers/game-harness.mjs');const h=await gameHarness();h.ui.activate();
 const p=h.$('#move-voice'),e=h.$('#han-voice');move(h,h.ui.duel.player,'heal');
 assert.equal(p.plays.length,1);assert.match(p.src,/heal-user-selected-v31\.wav$/);assert.equal(e.plays.length,0);
 move(h,{...h.ui.duel.enemy,type:'wang'},'heal');assert.equal(e.plays.length,1);assert.match(e.src,/heal-user-selected-v31\.wav$/);
});
test('queue short candidate follows the user-confirmed near-two-second endpoint without authenticating it',()=>{
 const v=playableVoice('huang_queue');assert.match(v.src,/huang-queue-user-selected-v31\.wav$/);assert.equal(v.sourceRange.start,0);assert.equal(v.sourceRange.end,1.98);assert.equal(v.reviewNeeded,false);assert.equal(v.originalVerified,false);assert.match(v.status,/使用者確認區間/);assert.equal(v.selection.sourceId,'huang_queue-current');assert.match(v.status,/未獨立聽驗/);
});
