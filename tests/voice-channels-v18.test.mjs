import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness,flush,deferred,move} from './helpers/game-harness.mjs';

const player={id:'player',type:'su',x:200,y:430},enemy={id:'enemy',type:'su',x:600,y:430};
const media=h=>[h.$('#move-voice'),h.$('#han-voice')];
test('two actors overlap without stopping each other, including mirror coin moves',async()=>{
 for(const kind of ['su_shout','coin']){
  const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
  assert.equal(h.ui.playConfiguredVoice(kind,false,player),true);
  assert.equal(h.ui.playConfiguredVoice(kind,false,enemy),true);
  assert.equal(p.playing,true);assert.equal(e.playing,true);
  assert.equal(p.plays.length,1);assert.equal(e.plays.length,1);
  assert.equal(p.src,e.src);
 }
});
test('same actor queues pending or playing speech and completes every phrase in order',async()=>{
 const h=await gameHarness();h.ui.activate();const [p]=media(h),pending=deferred();p.playResult=()=>pending.promise;
 assert.equal(h.ui.playConfiguredVoice('su_shout',false,player),true);const pauses=p.pauses;
 assert.equal(h.ui.playConfiguredVoice('su_rush',false,player),true);assert.equal(p.plays.length,1);assert.equal(p.pauses,pauses);
 pending.resolve();await flush();assert.equal(h.ui.playConfiguredVoice('su_dare',false,player),true);assert.equal(p.plays.length,1);
 p.emit('ended');await flush();assert.equal(p.plays.length,2);assert.match(p.src,/rush/);
 p.emit('ended');await flush();assert.equal(p.plays.length,3);assert.match(p.src,/dare/);
 p.emit('ended');p.playResult=null;assert.equal(h.ui.playConfiguredVoice('su_rush',false,player),true);assert.equal(p.plays.length,4);
});
test('rejected, synchronous-error and media-error playback release only the failing actor',async()=>{
 for(const failure of ['reject','throw','error']){
  const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
  h.ui.playConfiguredVoice('su_shout',false,enemy);
  p.playResult=()=>{if(failure==='throw')throw Error('blocked');return failure==='reject'?Promise.reject(Error('blocked')):Promise.resolve();};
  assert.doesNotThrow(()=>h.ui.playConfiguredVoice('su_shout',false,player));
  if(failure==='error')p.emit('error');await flush();
  assert.equal(e.playing,true);p.playResult=null;
  assert.equal(h.ui.playConfiguredVoice('su_rush',false,player),true);
 }
});
test('late promise and old end/error callbacks cannot overwrite or release newer playback',async()=>{
 for(const outcome of ['resolve','reject']){
  const h=await gameHarness();h.ui.activate();const [p]=media(h),pending=deferred();p.playResult=()=>pending.promise;
  h.ui.playConfiguredVoice('su_shout',false,player);const oldEnd=p.onended,oldError=p.onerror;
  h.ui.stopVoice();p.playResult=null;h.ui.playConfiguredVoice('su_rush',false,player);await flush();
  const status=h.$('#voice-status').textContent;pending[outcome](Error('late'));await flush();oldEnd?.();oldError?.();
  assert.equal(h.$('#voice-status').textContent,status);assert.equal(p.playing,true);
  assert.equal(h.ui.playConfiguredVoice('su_dare',false,player),true);
 }
});
test('accepted voices keep actor identity and are independent of later attack interruption',async()=>{
 const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
 const a={...player,type:'ma',attack:{kind:'ma_cough',age:0}},b={...enemy,type:'ma',attack:{kind:'ma_cough',age:0}};
 move(h,a,'ma_cough');move(h,b,'ma_cough');a.attack=null;b.attack.age=.2;h.ui.drainVoiceCues();
 assert.equal(p.plays.length,1);assert.equal(e.plays.length,1);
 b.attack=null;h.ui.drainVoiceCues();assert.equal(e.playing,true,'an already spoken phrase is not tied to attack survival');
});
test('pause, reselect, blur, hidden, mute, voice disable and replay stop both and clear delayed cues',async()=>{
 const actions={pause:h=>h.ui.pauseGame(),reselect:h=>h.ui.showMenu(),blur:h=>h.window.handlers.blur(),hidden:h=>{h.document.hidden=true;h.document.handlers.visibilitychange();},mute:h=>h.$('#sound').onclick(),disable:h=>h.$('#voice-enabled').onchange({target:{checked:false}}),replay:h=>{h.ui.setScene();h.ui.startGame();}};
 for(const [name,act] of Object.entries(actions)){
  const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
  h.ui.playConfiguredVoice('su_shout',false,player);h.ui.playConfiguredVoice('su_rush',false,enemy);
  const a={...player,type:'ma',attack:{kind:'ma_cough',age:0}};move(h,a,'ma_cough');act(h);await flush();
  assert.equal(p.playing,false,name);assert.equal(e.playing,false,name);
  const before=p.plays.length+e.plays.length;h.ui.activate();a.attack.age=.3;h.ui.drainVoiceCues();
  assert.equal(p.plays.length+e.plays.length,before,name+' cleared delayed cue');
 }
});
test('preview is exclusive, replacement is controlled and game audio cannot become a third voice',async()=>{
 const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
 h.ui.playConfiguredVoice('su_shout',false,player);h.ui.playConfiguredVoice('su_rush',false,enemy);
 h.$('#voice-sample').value='ma_cough';h.$('#play-voice').onclick();
 assert.equal(p.playing,true);assert.equal(e.playing,false);assert.match(p.src,/cough/);
 assert.equal(h.ui.playConfiguredVoice('su_shout',false,enemy),false);
 h.$('#voice-sample').value='coin';h.$('#play-voice').onclick();assert.match(p.src,/coin-user-selected-v31/);assert.equal(e.playing,false);
 h.$('#help-dialog').handlers.close();assert.equal(p.playing,false);assert.equal(e.playing,false);
});
test('priming both lanes is silent and late priming promises cannot stop a newer accepted move',async()=>{
 const h=await gameHarness();h.ui.activate();const [p,e]=media(h),pending=deferred();p.playResult=()=>pending.promise;e.playResult=()=>Promise.resolve();
 h.ui.primeVoice();assert.equal(p.muted,true);assert.equal(e.muted,true);
 p.playResult=null;h.ui.playConfiguredVoice('su_shout',false,player);await flush();pending.resolve();await flush();
 assert.equal(p.playing,true);assert.equal(p.muted,false);assert.equal(e.playing,false);
});
test('a delayed-metadata move queues exactly once even if its attack disappears before speech starts',async()=>{
 const h=await gameHarness();h.ui.activate();const [p]=media(h);
 h.ui.playConfiguredVoice('su_shout',false,player);
 const a={...player,type:'ma',attack:{kind:'ma_cough',age:0}};move(h,a,'ma_cough');
 assert.equal(p.plays.length,1);a.attack=null;h.ui.drainVoiceCues();
 p.emit('ended');await flush();assert.equal(p.plays.length,2);assert.match(p.src,/cough/);
 a.attack={kind:'ma_cough',age:0};move(h,a,'ma_cough');h.ui.drainVoiceCues();assert.equal(p.plays.length,2);
 a.attack.age=.2;h.ui.drainVoiceCues();assert.equal(p.plays.length,2);
 p.emit('ended');await flush();assert.equal(p.plays.length,3);p.emit('ended');assert.equal(p.plays.length,3);
});
test('actor mix keeps the player clearer and the two measured-source peaks below full scale',async()=>{
 const h=await gameHarness();h.ui.activate();const [p,e]=media(h);
 h.ui.playConfiguredVoice('ma_cough',false,player);h.ui.playConfiguredVoice('ma_cough',false,enemy);
 assert.ok(p.volume>e.volume,'AI speech is quieter than player speech');
 // Independently measured 192 kHz-resampled peak ceiling (rounded upward) for
 // existing sources including V17. This checks the mixer, not perceived loudness.
 assert.ok((p.volume+e.volume)*.761<.9,'two voice peaks retain at least 10% digital headroom');
 assert.ok(p.volume>=.6&&e.volume>=.4,'the headroom must not come from muting speech');
 const playerGain=p.volume;h.$('#voice-sample').value='coin';h.$('#play-voice').onclick();assert.equal(p.volume,playerGain);assert.equal(e.playing,false);
});
