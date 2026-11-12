import test from 'node:test';
import assert from 'node:assert/strict';
import {VoiceChannels} from '../dist/voice-channels.mjs';
import {playableVoice} from '../dist/voice-slots.mjs';
import {gameHarness,flush,deferred} from './helpers/game-harness.mjs';

const ids=['#move-voice','#han-voice','#assist-player-voice','#assist-enemy-voice'];
const actors=['player','enemy','assist-player','assist-enemy'];
const eventScene=()=>({spitStart:new WeakMap(),lastArtPose:new WeakMap(),artTime:0,reducedMotion:true,popup(){},banner(){},wordBlast(){},add:{graphics:()=>({lineStyle(){},lineBetween(){},destroy(){}})},tweens:{add(){}}});
function present(h,scene=eventScene()){
 const events=h.ui.duel.events.splice(0);for(const event of events)h.ui.Arena.prototype.event.call(scene,event);return events;
}

// Each fixture is a permitted attacking choice, not the helper's first roster move.
// Catch routing from helper identity/owner's move instead of assistStart.kind.
const choices={wang:['rush'],han:['coin','han_knee','arrow'],ma:['ma_handshake','ma_gaze','ma_cough'],su:['su_shout','su_rush'],huang:['huang_shout'],chen:['chen_dream','chen_question'],ko:['ko_bags','ko_name']};
for(const [helper,kinds] of Object.entries(choices))for(const [index,kind] of kinds.entries())for(const side of ['player','enemy']){
 test(`${side} helper ${kind} speaks its actual move at attack start, never at the warning`,async()=>{
  const h=await gameHarness();h.ui.activate();const d=h.ui.duel,owner=d[side],media=h.$(`#assist-${side}-voice`);
  owner.assist.helper=helper;d.rng=()=>(index+.5)/kinds.length;
  assert.equal(d.request(owner,'assist'),true);assert.equal(d.assists[0].kind,kind);
  present(h);assert.equal(media.plays.length,0);
  d.updateAssists(.89);present(h);assert.equal(media.plays.length,0);
  d.updateAssists(.02);assert.ok(present(h).some(e=>e.type==='assistStart'));await flush();
  assert.deepEqual(media.plays,[playableVoice(kind).src]);
  assert.equal(h.$('#move-voice').plays.length,0);assert.equal(h.$('#han-voice').plays.length,0);
  // Subsequent helpers' hit/exit presentation and the owner moving do not cut it.
  const pauses=media.pauses;h.ui.playConfiguredVoice('coin',false,owner);
  d.updateAssists(4);present(h);await flush();
  assert.equal(media.playing,true);assert.equal(media.pauses,pauses);
 });
}

test('all four voices overlap at unchanged levels; each source finishes before its next queued phrase',async()=>{
 const h=await gameHarness();h.ui.activate();const media=ids.map(id=>h.$(id));
 for(const id of actors)assert.equal(h.ui.playConfiguredVoice('su_shout',false,{id}),true);
 await flush();const volumes=media.map(m=>m.volume),pauses=media.map(m=>m.pauses);
 assert.equal(volumes[2],volumes[0]);assert.equal(volumes[3],volumes[1]);
 for(const id of actors)assert.equal(h.ui.playConfiguredVoice('su_rush',false,{id}),true);
 for(const [i,m] of media.entries()){
  assert.equal(m.playing,true);assert.deepEqual(m.plays,[playableVoice('su_shout').src]);
  assert.equal(m.pauses,pauses[i]);assert.equal(m.volume,volumes[i]);
 }
 media[2].emit('ended');await flush();
 assert.deepEqual(media[2].plays,[playableVoice('su_shout').src,playableVoice('su_rush').src]);
 for(const i of [0,1,3])assert.equal(media[i].plays.length,1,'a helper ending cannot change another source');
 for(const i of [0,1,3])media[i].emit('ended');await flush();
 for(const m of media){assert.equal(m.plays.length,2);assert.equal(m.playing,true);m.emit('ended');assert.equal(m.playing,false);}
});

test('same source repeats stay FIFO and waiting phrases do not report playback early',async()=>{
 const h=await gameHarness();h.ui.activate();const media=h.$('#move-voice');
 h.ui.playConfiguredVoice('su_shout',false,{id:'player'});await flush();const firstStatus=h.$('#voice-status').textContent;
 h.ui.playConfiguredVoice('su_rush',false,{id:'player'});h.ui.playConfiguredVoice('su_shout',false,{id:'player'});await flush();
 assert.equal(h.$('#voice-status').textContent,firstStatus);assert.equal(media.plays.length,1);
 media.emit('ended');await flush();assert.match(media.src,/rush/);
 media.emit('ended');await flush();assert.deepEqual(media.plays,[playableVoice('su_shout').src,playableVoice('su_rush').src,playableVoice('su_shout').src]);
});

test('media failure advances the queue, and old callbacks cannot finish the next clip',async()=>{
 for(const outcome of ['reject','error']){
  const h=await gameHarness();h.ui.activate();const media=h.$('#assist-player-voice'),pending=deferred();media.playResult=()=>pending.promise;
  h.ui.playConfiguredVoice('su_shout',false,{id:'assist-player'});const end=media.onended,error=media.onerror;
  h.ui.playConfiguredVoice('su_rush',false,{id:'assist-player'});media.playResult=null;
  if(outcome==='reject')pending.reject(Error('decode failed'));else media.emit('error');await flush();
  assert.deepEqual(media.plays,[playableVoice('su_shout').src,playableVoice('su_rush').src]);assert.equal(media.playing,true);
  const pauses=media.pauses,status=h.$('#voice-status').textContent;pending.resolve();end?.();error?.();await flush();
  assert.equal(media.playing,true);assert.equal(media.pauses,pauses);assert.equal(h.$('#voice-status').textContent,status);
 }
});

const lifecycle={pause:h=>h.ui.pauseGame(),menu:h=>h.ui.showMenu(),home:h=>h.ui.showTitle(),hidden:h=>{h.document.hidden=true;h.document.handlers.visibilitychange();},blur:h=>h.window.handlers.blur(),mute:h=>h.ui.settings.update({masterMuted:true}),disable:h=>h.ui.settings.update({voiceMuted:true}),zero:h=>h.ui.settings.update({voiceVolume:0}),restart:h=>{h.ui.setScene({});h.ui.startGame();}};
for(const [name,act] of Object.entries(lifecycle))test(`${name} discards all four voice queues and late callbacks cannot resurrect them`,async()=>{
 const h=await gameHarness();h.ui.activate();const media=ids.map(id=>h.$(id)),pending=deferred();
 for(const m of media)m.playResult=()=>pending.promise;
 for(const id of actors){h.ui.playConfiguredVoice('su_shout',false,{id});h.ui.playConfiguredVoice('su_rush',false,{id});}
 const ends=media.map(m=>m.onended),errors=media.map(m=>m.onerror);act(h);pending.resolve();await flush();
 const counts=media.map(m=>m.plays.length);for(const fn of [...ends,...errors])fn?.();await flush();
 for(const [i,m] of media.entries()){assert.equal(m.playing,false);assert.equal(m.plays.length,counts[i]);assert.ok(!m.plays.includes(playableVoice('su_rush').src));}
});

test('a trusted prime calls all four media elements synchronously and is silent',async()=>{
 const h=await gameHarness();h.ui.activate();const media=ids.map(id=>h.$(id)),pending=deferred();for(const m of media)m.playResult=()=>pending.promise;
 h.ui.primeVoice();for(const m of media){assert.deepEqual(m.plays,['assets/audio-unlock-silence-v37.wav']);assert.equal(m.muted,true);}
 media[2].playResult=null;h.ui.playConfiguredVoice('su_shout',false,{id:'assist-player'});pending.resolve();await flush();
 assert.equal(media[2].playing,true);assert.equal(media[2].muted,false);for(const i of [0,1,3])assert.equal(media[i].playing,false);
});

test('all four elements bind their own Web Audio output once, with no ducking during overlap',()=>{
 const media=actors.map(()=>({muted:false,volume:1,currentTime:0,pause(){},play(){}})),gains=[],sources=[];
 const context={currentTime:0,destination:{},createGain(){const node={gain:{value:1,setValueAtTime(value){this.value=value;}},connect(){}};gains.push(node);return node;},createMediaElementSource(element){sources.push(element);return{connect(){}};}};
 const channels=new VoiceChannels(Object.fromEntries(actors.map((id,i)=>[id,media[i]])));channels.connectAudio(context);channels.connectAudio(context);
 assert.equal(sources.length,4);assert.equal(new Set(sources).size,4);const volumes=gains.map(g=>g.gain.value);
 for(const actor of actors)channels.play(actor,{src:actor});assert.deepEqual(gains.map(g=>g.gain.value),volumes);
 channels.setVolume(.5);assert.deepEqual(gains.map(g=>g.gain.value),volumes.map(v=>v*.5));
});

for(const phase of ['finish','result'])test(`${phase} lets all active phrases finish but discards waiting speech`,async()=>{
 const h=await gameHarness();h.ui.activate();const media=ids.map(id=>h.$(id));
 for(const id of actors){h.ui.playConfiguredVoice('su_shout',false,{id});h.ui.playConfiguredVoice('su_rush',false,{id});}
 await flush();const pauses=media.map(m=>m.pauses);h.ui.duel.status='over';h.ui.duel.winner='player';
 if(phase==='finish')h.ui.beginMatchFinish();else h.ui.result();
 for(const [i,m] of media.entries()){assert.equal(m.playing,true);assert.equal(m.pauses,pauses[i]);assert.equal(m.plays.length,1);m.emit('ended');}
 await flush();for(const m of media){assert.equal(m.playing,false);assert.equal(m.plays.length,1);}
 assert.equal(h.ui.playConfiguredVoice('coin',false,{id:'assist-player'}),false);
});

test('mirrored main fighters and helpers speak concurrently through real accepted events',async()=>{
 const h=await gameHarness();h.ui.activate();const d=h.ui.duel;
 d.player.type=d.enemy.type='su';d.player.assist.helper=d.enemy.assist.helper='su';d.rng=()=>0;
 for(const owner of [d.player,d.enemy])assert.equal(d.request(owner,'special1'),true);present(h);await flush();
 for(let i=0;i<240;i++){d.step(1/120,{},false);present(h);}
 for(const owner of [d.player,d.enemy])assert.equal(d.request(owner,'assist'),true);present(h);
 d.updateAssists(.91);present(h);await flush();
 const media=ids.map(id=>h.$(id));
 for(const m of media){assert.equal(m.playing,true);assert.deepEqual(m.plays,[playableVoice('su_shout').src]);}
 const pauses=media.map(m=>m.pauses);d.updateAssists(2);present(h);
 for(const [i,m] of media.entries()){assert.equal(m.playing,true);assert.equal(m.pauses,pauses[i]);}
});
