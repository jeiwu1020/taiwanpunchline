import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {VOICE_SLOTS,playableVoice} from '../dist/voice-slots.mjs';
import {USER_VOICE_SELECTIONS} from '../dist/voice-selections-v31.mjs';
import {measure} from '../scripts/audio-v31/audio-core.mjs';
import {gameHarness,move} from './helpers/game-harness.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
test('ko_name uses exactly the new v2 source and user-selected end-exclusive range',()=>{
 const v=playableVoice('ko_name');assert.ok(v);
 assert.equal(v.selection?.sourceId,'ko-name-user-v2-original');
 assert.equal(v.selection.sourceSha256,'acb162f0ecc3899e0bab75a940244d67290414c1a1135e903d2738e9fabb4cb3');
 assert.deepEqual(v.selection.range,{start:5.177,end:6.219});
 assert.equal(v.sourceFile,'賴祥德v2.mp4');assert.equal(v.source,null);
 assert.equal(v.selection.targetDb,-20);assert.equal(v.selection.fadeMs,5);
 assert.equal(v.selection.sampleRate,48000);assert.equal(v.selection.duration,1.042);
 assert.deepEqual(v.selection.frames,{start:248496,end:298512});
 assert.equal(v.cue,0);assert.equal(v.reviewNeeded,false);assert.equal(v.originalVerified,false);
});
test('ko_name rendered PCM has exact length, balanced loudness, silent endpoints and no clipping',()=>{
 const v=playableVoice('ko_name'),file=new URL('../dist/'+v.src,import.meta.url);
 const b=readFileSync(file);assert.equal(hash(b),v.sha256);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=sample_rate,channels:format_tags:stream_tags','-of','json',file.pathname],{encoding:'utf8'}));
 assert.equal(+meta.streams[0].sample_rate,48000);assert.equal(meta.streams[0].channels,2);
 assert.equal(Object.keys(meta.format?.tags||{}).length,0);assert.equal(Object.keys(meta.streams[0].tags||{}).length,0);
 const raw=execFileSync('ffmpeg',['-v','error','-i',file.pathname,'-f','f32le','pipe:1']);
 const frames=raw.length/8;assert.equal(frames,50016);
 const channels=Array.from({length:2},()=>new Float32Array(frames));
 for(let i=0;i<frames;i++)for(let c=0;c<2;c++)channels[c][i]=raw.readFloatLE((i*2+c)*4);
 const m=measure(channels,48000);assert.ok(m.activeDb>=-20.7&&m.activeDb<=-19.9,`${m.activeDb}`);
 assert.ok(m.peak<=10**(-1/20)+1/32768);
 for(const c of channels){assert.equal(c[0],0);assert.equal(c.at(-1),0);assert.ok(c.every(x=>Number.isFinite(x)&&Math.abs(x)<1));}
});
test('all twenty V31 routes, metadata and bytes remain unchanged',()=>{
 for(const [slot,selection] of Object.entries(USER_VOICE_SELECTIONS)){
  const v=VOICE_SLOTS[slot];for(const key of Object.keys(selection))assert.deepEqual(v[key],selection[key],`${slot}.${key}`);
  assert.equal(hash(readFileSync(new URL('../dist/'+v.src,import.meta.url))),selection.sha256);
 }
});
test('ko_name battle and preview route to the same new clip without delay',async()=>{
 const h=await gameHarness();h.ui.activate();move(h,h.ui.duel.player,'ko_name');
 assert.equal(h.$('#move-voice').src,playableVoice('ko_name').src);assert.match(h.$('#move-voice').src,/-v32\.wav$/);
 assert.equal(h.$('#move-voice').plays.length,1);h.ui.playConfiguredVoice('ko_name',true);
 assert.equal(h.$('#move-voice').src,playableVoice('ko_name').src);assert.equal(h.$('#move-voice').plays.length,2);
});
