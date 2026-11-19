import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {VOICE_SLOTS,playableVoice} from '../dist/voice-slots.mjs';
import {measure} from '../scripts/audio-v31/audio-core.mjs';
import {gameHarness,move} from './helpers/game-harness.mjs';
const requested=JSON.parse(readFileSync(new URL('../docs/audio-v31/user-selections.json',import.meta.url)));
const baseline=JSON.parse(readFileSync(new URL('../docs/audio-v31/baseline-v30.json',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const c of requested.selections){
 test(`${c.slot}: user source and exact time range are routed to the playable clip`,()=>{
  const v=playableVoice(c.slot);assert.ok(v,c.slot);assert.equal(v.selection?.sourceId,c.sourceId);
  assert.deepEqual(v.selection?.range,{start:c.start,end:c.end});assert.equal(v.selection.targetDb,-20);assert.equal(v.selection.fadeMs,5);
  assert.equal(v.cue,0);assert.equal(v.reviewNeeded,false);assert.equal(v.originalVerified,baseline.slots[c.slot].originalVerified);
  const file=fileURLToPath(new URL('../dist/'+v.src,import.meta.url));
  const b=readFileSync(file);assert.equal(hash(b),v.sha256);
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=sample_rate,channels,duration:format_tags:stream_tags','-of','json',file],{encoding:'utf8'}));
  const rate=['ma_cough','huang_shout','huang_debt'].includes(c.slot)?44100:48000;assert.equal(+meta.streams[0].sample_rate,rate);assert.equal(meta.streams[0].channels,v.selection.channels);
  assert.equal(Object.keys(meta.format?.tags||{}).length,0);assert.equal(Object.keys(meta.streams[0].tags||{}).length,0);
  const expectedFrames=c.slot==='huang_debt'?50798:c.slot==='heal'?95224:Math.round(c.end*rate)-Math.round(c.start*rate);
  const raw=execFileSync('ffmpeg',['-v','error','-i',file,'-f','f32le','pipe:1'],{maxBuffer:16*1024*1024});
  const n=raw.length/4/meta.streams[0].channels;assert.equal(n,expectedFrames);
  const channels=Array.from({length:meta.streams[0].channels},()=>new Float32Array(n));
  for(let i=0;i<n;i++)for(let c=0;c<channels.length;c++){const x=raw.readFloatLE((i*channels.length+c)*4);assert.ok(Number.isFinite(x));channels[c][i]=x;}
  const m=measure(channels,rate);assert.ok(m.peak<=10**(-1/20)+1/32768);assert.ok(m.activeDb<=-19.9&&m.activeDb>=-20.7,`${m.activeDb} dBFS`);
  for(const ch of channels){assert.equal(ch[0],0);assert.equal(ch[n-1],0);assert.ok(!ch.some(x=>Math.abs(x)>=1));}
 });
 test(`${c.slot}: actual move and preview use the same new clip without extra cue delay`,async()=>{
  const h=await gameHarness();h.ui.activate();move(h,h.ui.duel.player,c.slot);assert.equal(h.$('#move-voice').src,playableVoice(c.slot).src);assert.equal(h.$('#move-voice').plays.length,1);
  h.ui.playConfiguredVoice(c.slot,true);assert.equal(h.$('#move-voice').src,playableVoice(c.slot).src);assert.equal(h.$('#move-voice').plays.length,2);
 });
}
test('all legacy V30 audio files remain byte-identical and recoverable',()=>{
 for(const old of Object.values(baseline.slots))assert.equal(hash(readFileSync(new URL('../dist/'+old.src,import.meta.url))),old.sha256);
});
