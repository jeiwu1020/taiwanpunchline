import test from 'node:test';
import assert from 'node:assert/strict';
import {VoiceChannels} from '../dist/voice-channels.mjs';
import {readFile} from 'node:fs/promises';
const gameURL=new URL('../dist/game.mjs',import.meta.url);
const voiceImport=(await readFile(gameURL,'utf8')).match(/from ['"]([^'"]*voice-channels\.mjs[^'"]*)['"]/)[1];
const GameVoiceChannels=(await import(new URL(voiceImport,gameURL))).VoiceChannels;
import {gameHarness,flush,deferred} from './helpers/game-harness.mjs';
const actors=['player','enemy','assist-player','assist-enemy'];
function fixture({fetchImpl,decodeImpl}={}){
 const fetches=[],decoded=[],sources=[],media=Object.fromEntries(actors.map(id=>[id,{src:'',plays:[],pauses:0,currentTime:0,pause(){this.pauses++;},play(){this.plays.push(this.src);return Promise.resolve();}}]));
 const context={state:'running',currentTime:2,destination:{},resumes:0,resume(){this.resumes++;},createMediaElementSource(){return{connect(){}};},createGain(){return{gain:{value:1,setValueAtTime(v){this.value=v;}},connect(){},disconnect(){}};},decodeAudioData(bytes){decoded.push([...new Uint8Array(bytes)]);return decodeImpl?decodeImpl(bytes):Promise.resolve({duration:2,length:96000,numberOfChannels:2});},createBufferSource(){const s={starts:[],stops:0,connect(g){this.gain=g;},disconnect(){},start(...args){this.starts.push(args);},stop(){this.stops++;}};sources.push(s);return s;}};
 const c=new VoiceChannels(media,{fetchImpl:async src=>{fetches.push(src);return fetchImpl?fetchImpl(src):{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}});c.connectAudio(context);
 return{c,media,context,fetches,decoded,sources};
}
test('preload decodes each selected phrase once without playing speech or resuming audio',async()=>{
 const h=fixture();assert.equal(typeof h.c.preload,'function','actual phrases need a silent preparation path');
 await Promise.all([h.c.preload([{src:'a'},{src:'b'},{src:'a'}]),h.c.preload([{src:'a'}])]);
 assert.deepEqual(h.fetches,['a','b']);assert.deepEqual(h.decoded,[[1,2,3],[1,2,3]]);assert.equal(h.sources.length,0);assert.equal(h.context.resumes,0);assert.ok(Object.values(h.media).every(m=>m.plays.length===0));
});
test('first and repeat casts start the same complete decoded audio synchronously at original lane gain',async()=>{
 const h=fixture();assert.equal(typeof h.c.preload,'function');await h.c.preload([{src:'a'}]);h.c.setVolume(.5);
 for(const actor of actors)h.c.play(actor,{src:'a'});
 assert.equal(h.sources.length,4);assert.deepEqual(h.sources.map(s=>s.gain.gain.value),[.34,.23,.34,.23]);
 assert.ok(h.sources.every(s=>s.starts.length===1&&s.starts[0].length===1&&s.starts[0][0]===0),'no lead trim, duration limit, or scheduled delay');
 assert.ok(h.sources.every(s=>s.buffer===h.sources[0].buffer));assert.ok(Object.values(h.media).every(m=>m.plays.length===0));
 h.c.play('player',{src:'a'});assert.equal(h.sources.length,4,'same lane must wait');h.sources[0].onended();assert.equal(h.sources.length,5);assert.equal(h.fetches.length,1);
});
test('preloading has at most two outstanding requests and failure is retryable with media fallback',async()=>{
 const pending=deferred();let fail=true;const h=fixture({fetchImpl:async()=>{await pending.promise;if(fail)throw Error('offline');return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});assert.equal(typeof h.c.preload,'function');
 const prep=h.c.preload([{src:'a'},{src:'b'},{src:'c'},{src:'d'}]);await flush();assert.equal(h.fetches.length,2);h.c.play('player',{src:'a'});assert.deepEqual(h.media.player.plays,['a'],'cold failure cannot block a cast');h.c.stopAll();pending.resolve();await prep;
 fail=false;await h.c.preload([{src:'a'}]);h.c.play('player',{src:'a'});assert.equal(h.sources.length,1);
});
test('stop discards buffered queues and stale completion never restarts speech',async()=>{
 const h=fixture();assert.equal(typeof h.c.preload,'function');await h.c.preload([{src:'a'},{src:'b'}]);h.c.play('player',{src:'a'});h.c.play('player',{src:'b'});const oldEnd=h.sources[0].onended;h.c.stopAll();assert.equal(h.sources[0].stops,1);oldEnd();assert.equal(h.sources.length,1);h.c.play('player',{src:'b'});assert.equal(h.sources.length,2);
});
test('preload completion alone never emits speech after a stop or mute',async()=>{
 const pending=deferred(),h=fixture({decodeImpl:()=>pending.promise});assert.equal(typeof h.c.preload,'function');const prep=h.c.preload([{src:'a'}]);await flush();h.c.stopAll();h.c.setVolume(0);pending.resolve({duration:2});await prep;assert.equal(h.sources.length,0);assert.ok(Object.values(h.media).every(m=>m.plays.length===0));
});
test('title entry and selection prepare only participating fighters without awaiting network',async()=>{
 const original=GameVoiceChannels.prototype.preload,requests=[];GameVoiceChannels.prototype.preload=function(clips){requests.push(clips.map(c=>c.src));return new Promise(()=>{});};
 try{const h=await gameHarness();h.ui.setScene();assert.equal(requests.length,0);assert.equal(h.ui.enterFromTitle(),true);assert.ok(requests.length>0,'Start must prepare actual phrases before the first fight');assert.equal(new Set(requests.flat()).size,6,'default Wang/Han lineup has six files, not all 21');h.$('#roster-ma').onclick();assert.equal(new Set(requests.at(-1)).size,9);h.ui.startGame();assert.equal(h.ui.duel.status,'countdown','network preparation cannot block navigation/countdown');}
 finally{if(original)GameVoiceChannels.prototype.preload=original;else delete GameVoiceChannels.prototype.preload;}
});
test('saved mute prevents actual voice preloading and does not force sound on',async()=>{
 const original=GameVoiceChannels.prototype.preload,requests=[];GameVoiceChannels.prototype.preload=function(clips){requests.push(clips);return Promise.resolve();};
 try{const h=await gameHarness();h.ui.settings.update({masterMuted:true});h.ui.setScene();h.ui.enterFromTitle();h.ui.startGame();assert.equal(requests.length,0);assert.equal(h.ui.settings.get().masterMuted,true);}
 finally{if(original)GameVoiceChannels.prototype.preload=original;else delete GameVoiceChannels.prototype.preload;}
});

test('native Window fetch is invoked without the VoiceChannels receiver',async()=>{
 const h=fixture();h.c.fetchImpl=function(){if(this!==undefined)throw new TypeError('Illegal invocation');return Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});};
 await h.c.preload([{src:'a'}]);h.c.play('player',{src:'a'});assert.equal(h.sources.length,1,'successful native fetch must prepare the buffer, not silently fall back to cold media');
});
