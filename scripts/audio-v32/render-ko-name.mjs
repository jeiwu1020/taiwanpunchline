// Reproduce the user's voice-studio selections with the unmodified editor DSP.
// Requires ffmpeg/ffprobe and the retained voice-studio dist directory as argv[2].
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {renderClip,wavBytes,measure} from '../audio-v31/audio-core.mjs';
const root=resolve(import.meta.dirname,'../..');
const sourceRoot=resolve(process.argv[2]||'../brawl-voice-studio/dist');
const spec=JSON.parse(readFileSync(join(root,'docs/audio-v32/user-selection.json')));
const catalog=JSON.parse(readFileSync(join(root,'docs/audio-v32/source-catalog-snapshot.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const records=[];
for(const c of spec.selections){
 const slot=catalog.slots.find(s=>s.id===c.slot),variant=slot?.variants.find(v=>v.id===c.sourceId);if(!variant)throw Error('Missing source ID '+c.sourceId);
 const file=join(sourceRoot,variant.url),bytes=readFileSync(file);if(hash(bytes)!==variant.sha256)throw Error('Source hash mismatch '+c.sourceId);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels','-of','json',file],{encoding:'utf8'})).streams[0];
 const rate=+meta.sample_rate,channelCount=meta.channels;
 if(rate!==variant.sampleRate||channelCount!==variant.channels)throw Error('Source format mismatch '+c.sourceId);
 // Preserve native sample rate/channels, including floating samples above 0 dBFS.
 const raw=execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-f','f32le','pipe:1'],{maxBuffer:100*1024*1024});
 const frameCount=raw.length/4/channelCount;
 const channels=Array.from({length:channelCount},()=>new Float32Array(frameCount));
 for(let i=0;i<frameCount;i++)for(let ch=0;ch<channelCount;ch++)channels[ch][i]=raw.readFloatLE((i*channelCount+ch)*4);
 if(c.start<0||c.end>frameCount/rate+.001)throw Error('Cut outside source '+c.sourceId);
 const rendered=renderClip(channels,rate,c.start,c.end,{normalize:true,targetDb:spec.targetDb,fadeMs:spec.fadeMs});
 const wav=wavBytes(rendered.channels,rate),name=c.slot.replaceAll('_','-')+'-user-selected-v32.wav',output=join(root,'dist/assets/voice',name);
 writeFileSync(output,wav);
 const quantized=rendered.channels.map(ch=>Float32Array.from(ch,x=>Math.round(x<0?x*32768:x*32767)/32768));
 const afterPcm16=measure(quantized,rate);
 if(afterPcm16.peak>=1||!Number.isFinite(afterPcm16.activeDb))throw Error('Invalid output '+c.sourceId);
 const entry={...c,label:slot.label,sourceUrl:variant.url,sourceFile:variant.sourceFile,sourceSha256:variant.sha256,originalFileSha256:variant.originalFileSha256||null,upstreamRange:variant.sourceRange||null,output:'assets/voice/'+name,outputSha256:hash(wav),sampleRate:rate,channels:channelCount,sourceFrames:frameCount,frames:rendered.frames,outputFrames:rendered.channels[0].length,duration:rendered.channels[0].length/rate,targetDb:spec.targetDb,fadeMs:spec.fadeMs,gainDb:rendered.gainDb,limiterReductionDb:rendered.limiterReduction,before:rendered.before,after:rendered.after,afterPcm16,endClampedSeconds:Math.max(0,c.end-frameCount/rate),dspSha256:hash(readFileSync(join(root,'scripts/audio-v31/audio-core.mjs')))};
 records.push(entry);console.log(c.slot,entry.duration.toFixed(6),afterPcm16.activeDb.toFixed(3),afterPcm16.peakDb.toFixed(3),'limiter',entry.limiterReductionDb.toFixed(3));
}
const report={messageId:spec.messageId,dsp:'Exact voice-studio audio-core.mjs; native-rate decoding; 50 ms gated RMS; linked-channel 5 ms lookahead sample-peak limiter, -1 dBFS; 80 ms release; 5 ms fades; PCM16 WAV',limitation:'Source MP3 decoding uses ffmpeg; browser decoder may differ microscopically. No transcoding after DSP. Sample peak limiting is not a true-peak guarantee.',pending:spec.pending,clips:records};
writeFileSync(join(root,'docs/audio-v32/render-report.json'),JSON.stringify(report,null,2)+'\n');
const selected=Object.fromEntries(records.map(r=>[r.slot,{source:null,requestedTime:null,referenceNote:'使用者後補新錄影「賴祥德v2.mp4」；先前影片僅作參考，未核實與本次音檔關係。',src:r.output,sha256:r.outputSha256,sourceFile:r.sourceFile,cue:0,decoded:true,reviewNeeded:false,selection:{sourceId:r.sourceId,sourceFile:r.sourceFile,sourceSha256:r.sourceSha256,range:{start:r.start,end:r.end},frames:r.frames,sampleRate:r.sampleRate,channels:r.channels,duration:r.duration,targetDb:r.targetDb,fadeMs:r.fadeMs,actualDb:r.afterPcm16.activeDb,peakDb:r.afterPcm16.peakDb,upstreamRange:r.upstreamRange,endClampedSeconds:r.endClampedSeconds},sourceRange:{start:r.start,end:r.end},status:`依使用者指定切點，從語音工作室 ${r.sourceId}（${r.sourceFile}）取 ${r.start.toFixed(3)}–${r.end.toFixed(3)} 秒，長約 ${r.duration.toFixed(3)} 秒。統一以有效段 RMS −20 dBFS 為目標，加入 5 毫秒淡入淡出與防爆音限制；使用者確認區間，未獨立聽驗、認證發言者或再利用權。原檔及前版保留可回復。${r.endClampedSeconds?'文字秒數四捨五入超過原檔不足 1 毫秒，依原檔末端保留，不補入空白。':''}`}])) ;
writeFileSync(join(root,'dist/voice-selections-v32.mjs'),'// User-reviewed ranges, relative to the exact voice-studio source ID. V32 adds the replacement ko_name recording only.\nexport const V32_VOICE_SELECTIONS='+JSON.stringify(selected,null,2)+';\n');
