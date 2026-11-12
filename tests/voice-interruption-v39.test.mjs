import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterBaseStats} from '../dist/fighter-attributes.mjs';
import {CAST} from '../dist/roster.mjs';
import {playableVoice} from '../dist/voice-slots.mjs';
import {gameHarness,flush,deferred} from './helpers/game-harness.mjs';

// Exercise the real combat -> Arena.event -> VoiceChannels path. Only browser
// media and Phaser drawing boundaries are doubles; this is not an audible test.
function eventScene(){
 const graphics={lineStyle(){},lineBetween(){},destroy(){}};
 return {spitStart:new WeakMap(),lastArtPose:new WeakMap(),artTime:0,
  reducedMotion:true,popup(){},banner(){},wordBlast(){},
  add:{graphics:()=>graphics},tweens:{add(){}},
 };
}
function present(h,scene){
 const events=h.ui.duel.events.splice(0);
 for(const event of events)h.ui.Arena.prototype.event.call(scene,event);
 h.ui.drainVoiceCues();return events;
}
function tick(h,scene,seconds){
 const events=[];
 for(let i=0;i<Math.ceil(seconds*120);i++){
  h.ui.duel.step(1/120,{},false);
  events.push(...present(h,scene));
 }
 return events;
}
function actorMedia(h,actor){return h.$(actor.id==='player'?'#move-voice':'#han-voice');}
async function startSelectedBattle(h,selections){
 h.ui.setScene({});h.ui.showMenu();
 for(const [target,character] of Object.entries(selections)){h.$(`[data-roster-target="${target}"]`).onclick();h.$('#roster-'+character).onclick();}
 await h.ui.startGame();while(h.timers.size){const[id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}
 // Roster selection intentionally previews speech. Observe only combat playback
 // after the real start lifecycle has cancelled that menu preview.
 for(const selector of ['#move-voice','#han-voice'])h.$(selector).plays.length=0;
 h.ui.activate();
}

// Regression caught: hit/reaction routing stopping the lane, or replaying a
// phrase from the attack's current state rather than the accepted move event.
for(const [character,{moves}] of Object.entries(CAST))for(const [index,move] of moves.entries())for(const side of ['player','enemy']){
 test(`${character} ${move.kind}: ${side} accepted voice survives a damaging hit`,async()=>{
  const h=await gameHarness(),scene=eventScene();await startSelectedBattle(h,{[side==='player'?'player':'opponent']:character});
  const duel=h.ui.duel,actor=duel[side],other=duel.other(actor),media=actorMedia(h,actor);
  assert.equal(actor.type,character);assert.equal(actor.maxHp,fighterBaseStats(character).maxHp);assert.equal(actor.maxHp,({wang:95,han:105,ma:95,su:110,huang:95,chen:95,ko:105})[character]);actor.x=side==='player'?350:450;other.x=side==='player'?450:350;
  assert.equal(duel.request(actor,'special'+(index+1)),true);
  present(h,scene);await flush();
  assert.deepEqual(media.plays,[playableVoice(move.kind).src]);
  const pauses=media.pauses;
  assert.equal(duel.damage(other,actor,6,0,'punch'),true);
  const events=present(h,scene);await flush();
  assert.ok(events.some(event=>event.type==='hit'&&event.to===actor));
  const damage=6*fighterBaseStats(other.type).basicMultiplier*fighterBaseStats(actor.type).damageTakenMultiplier;assert.equal(actor.hp,fighterBaseStats(actor.type).maxHp-damage,'voice continuity does not suppress real character damage');
  assert.equal(media.playing,true);
  assert.equal(media.pauses,pauses,'ordinary hit effects never pause the phrase');
  assert.equal(media.plays.length,1,'ordinary hit effects never restart the phrase');
 });
}

test('a real punch interrupts late drinking and healing, but not its accepted voice',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 duel.player.hp=60;duel.player.x=350;duel.enemy.x=450;
 assert.equal(duel.request(duel.player,'special3'),true);present(h,scene);
 tick(h,scene,.45);assert.equal(duel.request(duel.enemy,'punch'),true);
 const media=actorMedia(h,duel.player),pauses=media.pauses;
 const events=tick(h,scene,.9);
 assert.ok(events.some(event=>event.type==='spit'),'actual collision keeps drinking counterplay');
 assert.ok(events.some(event=>event.type==='hit'&&event.to===duel.player));
 assert.ok(!events.some(event=>event.type==='heal'));
 assert.equal(duel.player.attack,null);assert.equal(duel.player.hp,60-6*fighterBaseStats('han').basicMultiplier*fighterBaseStats('wang').damageTakenMultiplier);assert.equal(duel.player.hp,54.24);
 assert.equal(media.playing,true);assert.equal(media.pauses,pauses);assert.equal(media.plays.length,1);
});

test('an accepted move still speaks when its interrupted animation is gone before presentation drains',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 duel.player.hp=60;duel.player.x=350;duel.enemy.x=450;
 assert.equal(duel.request(duel.player,'special3'),true);
 // Batch combat before presentation, as a frame with several substeps can do.
 for(let i=0;i<54;i++)duel.step(1/120,{},false);
 assert.equal(duel.request(duel.enemy,'punch'),true);
 for(let i=0;i<30;i++)duel.step(1/120,{},false);
 assert.equal(duel.player.attack,null);
 const events=present(h,scene);await flush();
 assert.ok(events.some(event=>event.type==='spit'));
 assert.deepEqual(actorMedia(h,duel.player).plays,[playableVoice('heal').src]);
 assert.equal(actorMedia(h,duel.player).playing,true);
});

test('consuming a successful counter does not stop the counter actor voice',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 duel.player.x=350;duel.enemy.x=450;
 assert.equal(duel.request(duel.player,'special2'),true);present(h,scene);
 tick(h,scene,.22);assert.equal(duel.request(duel.enemy,'punch'),true);
 const media=actorMedia(h,duel.player),pauses=media.pauses,events=tick(h,scene,.3);
 assert.ok(events.some(event=>event.type==='counter'&&event.f===duel.player));
 assert.equal(duel.player.attack,null);assert.equal(duel.player.hp,fighterBaseStats('wang').maxHp);assert.equal(duel.player.hp,95);assert.ok(duel.enemy.hp<fighterBaseStats('han').maxHp);
 assert.equal(media.playing,true);assert.equal(media.pauses,pauses);assert.equal(media.plays.length,1);
});

test('natural animation completion and rejected input keep speech, next accepted cast waits for only its actor',async()=>{
 const h=await gameHarness(),scene=eventScene();await startSelectedBattle(h,{player:'ma',opponent:'ma'});const duel=h.ui.duel;
 assert.equal(duel.player.maxHp,95);assert.equal(duel.enemy.maxHp,95);
 assert.equal(duel.request(duel.player,'special3'),true);
 assert.equal(duel.request(duel.enemy,'special3'),true);present(h,scene);await flush();
 const player=actorMedia(h,duel.player),enemy=actorMedia(h,duel.enemy),playerPauses=player.pauses,enemyPauses=enemy.pauses;
 tick(h,scene,1);assert.equal(duel.player.attack,null);assert.equal(duel.enemy.attack,null);
 assert.equal(player.playing,true);assert.equal(enemy.playing,true);
 assert.equal(duel.request(duel.player,'special3'),false);present(h,scene);
 assert.equal(player.plays.length,1);assert.equal(player.pauses,playerPauses);
 assert.equal(duel.request(duel.player,'special1'),true);present(h,scene);await flush();
 assert.deepEqual(player.plays,[playableVoice('ma_cough').src]);
 assert.equal(player.pauses,playerPauses);
 assert.equal(enemy.playing,true);assert.equal(enemy.plays.length,1);assert.equal(enemy.pauses,enemyPauses);
 player.emit('ended');tick(h,scene,1);assert.deepEqual(player.plays,[playableVoice('ma_cough').src,playableVoice('ma_handshake').src]);
 assert.equal(player.playing,true);assert.equal(enemy.pauses,enemyPauses);player.emit('ended');assert.equal(player.plays.length,2);
});

test('pending accepted playback survives a hit, but late completion after home cannot resurrect either lane',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 const pending=deferred(),player=actorMedia(h,duel.player),enemy=actorMedia(h,duel.enemy);
 player.playResult=()=>pending.promise;
 assert.equal(duel.request(duel.player,'special1'),true);
 assert.equal(duel.request(duel.enemy,'special1'),true);present(h,scene);
 duel.damage(duel.enemy,duel.player,6,0,'punch');present(h,scene);
 assert.equal(player.playing,true);assert.equal(enemy.playing,true);
 h.$('#home').onclick();assert.equal(duel.status,'title');
 const status=h.$('#voice-status').textContent;
 pending.resolve();await flush();
 assert.equal(player.playing,false);assert.equal(enemy.playing,false);
 assert.equal(h.$('#voice-status').textContent,status);
});

test('real knockout lets active voices finish and cannot start queued accepted events after the round ends',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 assert.equal(duel.request(duel.player,'special1'),true);
 assert.equal(duel.request(duel.enemy,'special1'),true);present(h,scene);await flush();
 const player=actorMedia(h,duel.player),enemy=actorMedia(h,duel.enemy);
 assert.equal(player.playing,true);assert.equal(enemy.playing,true);
 duel.enemy.hp=1;duel.damage(duel.player,duel.enemy,6,0,'punch');
 const events=present(h,scene);await flush();
 assert.equal(duel.status,'over');assert.ok(events.some(event=>event.type==='over'));
 assert.equal(player.playing,true);assert.equal(enemy.playing,true);player.emit('ended');enemy.emit('ended');
 assert.equal(player.playing,false);assert.equal(enemy.playing,false);
 assert.equal(h.ui.playConfiguredVoice('coin',false,duel.enemy),false);
 assert.equal(player.plays.length,1);assert.equal(enemy.plays.length,1);
});

test('voice-volume zero cancels pending playback and unmuting does not resume stale speech',async()=>{
 const h=await gameHarness(),scene=eventScene();h.ui.activate();const duel=h.ui.duel;
 const pending=deferred(),player=actorMedia(h,duel.player),enemy=actorMedia(h,duel.enemy);
 player.playResult=()=>pending.promise;
 assert.equal(duel.request(duel.player,'special1'),true);
 assert.equal(duel.request(duel.enemy,'special1'),true);present(h,scene);
 h.ui.settings.update({voiceVolume:0});pending.resolve();await flush();
 assert.equal(player.playing,false);assert.equal(enemy.playing,false);
 h.ui.settings.update({voiceVolume:1});tick(h,scene,1);
 assert.equal(player.playing,false);assert.equal(enemy.playing,false);
 assert.equal(player.plays.length,1);assert.equal(enemy.plays.length,1);
});
