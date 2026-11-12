import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {playableVoice} from '../dist/voice-slots.mjs';

test('tighter Chen recording decodes continuously to its full declared range',()=>{
 const clip=playableVoice('chen_dream');
 const file=new URL('../dist/'+clip.src,import.meta.url).pathname;
 const pcm=execFileSync('ffmpeg',['-v','error','-i',file,'-f','f32le','-ac','1','-ar','48000','pipe:1']);
 const sampleCount=pcm.length/4;
 assert.equal(sampleCount,Math.round((clip.sourceRange.end-clip.sourceRange.start)*48000));
 let first=-1,last=-1,peak=0;
 for(let i=0;i<sampleCount;i++){
  const v=Math.abs(pcm.readFloatLE(i*4));
  assert.ok(Number.isFinite(v));peak=Math.max(peak,v);
  if(v>10**(-38/20)){if(first<0)first=i;last=i;}
 }
 assert.ok(first>=0&&first/48000<.020,'speech should begin within 20 ms');
 assert.ok(last/48000>clip.sourceRange.end-clip.sourceRange.start-.4,'retain the phrase tail');
 assert.ok(peak<.9,'normalized stereo-to-mono playback stays below full scale');
 const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags:stream_tags','-of','json',file],{encoding:'utf8'}));
 for(const tags of [info.format?.tags,...(info.streams||[]).map(x=>x.tags)])assert.equal(Object.keys(tags||{}).length,0);
});
