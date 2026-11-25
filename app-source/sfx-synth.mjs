import {SFX_FREQUENCIES} from './sfx-frequencies.mjs?v=chapter-presentation-20261117-r1';

const POSITIVE_FREQ=n=>Math.max(24,Number.isFinite(n)?n:200);
const noiseBuffers=new WeakMap();

function getNoiseBuffer(ctx){
 if(typeof ctx.createBuffer!=='function'||!ctx.sampleRate)return null;
 if(noiseBuffers.has(ctx))return noiseBuffers.get(ctx);
 const length=Math.max(1,Math.floor(ctx.sampleRate*0.18));
 const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
 const data=buffer.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(length*0.42));
 noiseBuffers.set(ctx,buffer);
 return buffer;
}

function playTone(ctx,destination,now,{type='triangle',startFreq=200,endFreq=100,delay=0,duration=0.14,peak=0.045,trackNode,untrackNode}){
 const t=now+Math.max(0,delay);
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;
 o.frequency.setValueAtTime(POSITIVE_FREQ(startFreq),t);
 o.frequency.exponentialRampToValueAtTime(POSITIVE_FREQ(endFreq),t+Math.max(0.02,duration*0.86));
 g.gain.setValueAtTime(0.0001,t);
 g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+0.006);
 g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
 o.connect(g);
 g.connect(destination);
 trackNode?.(o,g);
 o.onended=()=>{
  untrackNode?.(o,g);
  try{o.disconnect();}catch{}
  try{g.disconnect();}catch{}
 };
 o.start(t);
 o.stop(t+duration+0.02);
}

function playNoise(ctx,destination,now,{delay=0,duration=0.08,peak=0.032,filterFreq=1400,trackNode,untrackNode}){
 if(typeof ctx.createBufferSource!=='function')return;
 const buffer=getNoiseBuffer(ctx);
 if(!buffer)return;
 const t=now+Math.max(0,delay);
 const src=ctx.createBufferSource(),g=ctx.createGain();
 src.buffer=buffer;
 g.gain.setValueAtTime(0.0001,t);
 g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+0.004);
 g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
 if(typeof ctx.createBiquadFilter==='function'){
  const filter=ctx.createBiquadFilter();
  filter.type='bandpass';
  filter.frequency.setValueAtTime(POSITIVE_FREQ(filterFreq),t);
  src.connect(filter);
  filter.connect(g);
 }else{
  src.connect(g);
 }
 g.connect(destination);
 trackNode?.(src,g);
 src.onended=()=>{
  untrackNode?.(src,g);
  try{src.disconnect();}catch{}
  try{g.disconnect();}catch{}
 };
 src.start(t);
 src.stop(t+duration+0.02);
}

/**
 * Multi-layered procedural Web Audio synthesizer for comedic arcade impact.
 * Safe with both full browser AudioContexts and minimal unit-test mocks.
 */
export function playProceduralSfx(ctx,destination,kind,{trackNode,untrackNode}={}){
 if(!ctx||!destination)return false;
 const now=ctx.currentTime??0;
 const base=SFX_FREQUENCIES[kind]||200;
 const opts={trackNode,untrackNode};

 if(kind==='hit'||kind==='capture'||kind==='wallBounce'||kind==='wallHit'){
  const heavy=kind!=='hit';
  playTone(ctx,destination,now,{type:'square',startFreq:heavy?160:140,endFreq:46,duration:heavy?0.16:0.12,peak:heavy?0.055:0.048,...opts});
  playTone(ctx,destination,now,{type:'triangle',startFreq:heavy?105:92,endFreq:38,duration:0.14,peak:0.06,...opts});
  playNoise(ctx,destination,now,{duration:0.07,peak:heavy?0.045:0.032,filterFreq:1600,...opts});
  if(kind==='capture')playTone(ctx,destination,now,{type:'sawtooth',startFreq:340,endFreq:680,delay:0.03,duration:0.12,peak:0.032,...opts});
  return true;
 }
 if(kind==='block'||kind==='reject'||kind==='armorAbsorb'||kind==='performanceGuard'){
  playTone(ctx,destination,now,{type:'triangle',startFreq:kind==='armorAbsorb'?320:410,endFreq:210,duration:0.11,peak:0.045,...opts});
  playTone(ctx,destination,now,{type:'square',startFreq:kind==='reject'?680:590,endFreq:kind==='reject'?890:310,delay:0.01,duration:0.09,peak:0.028,...opts});
  playNoise(ctx,destination,now,{duration:0.045,peak:0.02,filterFreq:2600,...opts});
  return true;
 }
 if(kind==='guardBreak'){
  playTone(ctx,destination,now,{type:'sawtooth',startFreq:660,endFreq:140,duration:0.18,peak:0.05,...opts});
  playTone(ctx,destination,now,{type:'square',startFreq:480,endFreq:110,delay:0.04,duration:0.16,peak:0.04,...opts});
  playNoise(ctx,destination,now,{duration:0.14,peak:0.05,filterFreq:2200,...opts});
  return true;
 }
 if(kind==='counter'||kind==='reflect'){
  playTone(ctx,destination,now,{type:'triangle',startFreq:440,endFreq:880,duration:0.11,peak:0.048,...opts});
  playTone(ctx,destination,now,{type:'sine',startFreq:660,endFreq:1320,delay:0.05,duration:0.15,peak:0.045,...opts});
  return true;
 }
 if(kind==='heal'){
  for(const [i,freq] of [523,659,880].entries()){
   playTone(ctx,destination,now,{type:'triangle',startFreq:freq,endFreq:freq*1.08,delay:i*0.045,duration:0.13,peak:0.04,...opts});
  }
  return true;
 }
 if(kind==='perkTrigger'){
  for(const [i,freq] of [523,659,784,1046].entries()){
   playTone(ctx,destination,now,{type:i===3?'triangle':'sawtooth',startFreq:freq,endFreq:freq*1.06,delay:i*0.035,duration:0.16,peak:0.038,...opts});
  }
  return true;
 }
 if(kind==='spit'){
  playTone(ctx,destination,now,{type:'sine',startFreq:760,endFreq:240,duration:0.11,peak:0.045,...opts});
  playTone(ctx,destination,now,{type:'triangle',startFreq:490,endFreq:180,delay:0.04,duration:0.12,peak:0.04,...opts});
  playNoise(ctx,destination,now,{delay:0.02,duration:0.09,peak:0.035,filterFreq:1100,...opts});
  return true;
 }
 if(kind==='erase'||kind==='whiff'||kind==='counterMiss'){
  playTone(ctx,destination,now,{type:'triangle',startFreq:kind==='erase'?340:250,endFreq:115,duration:0.12,peak:0.035,...opts});
  playNoise(ctx,destination,now,{duration:0.08,peak:0.022,filterFreq:900,...opts});
  return true;
 }
 if(kind==='calm'){
  playTone(ctx,destination,now,{type:'sine',startFreq:528,endFreq:524,duration:0.24,peak:0.042,...opts});
  playTone(ctx,destination,now,{type:'triangle',startFreq:1056,endFreq:1048,delay:0.015,duration:0.18,peak:0.022,...opts});
  return true;
 }
 if(kind==='queueBreak'){
  playTone(ctx,destination,now,{type:'square',startFreq:240,endFreq:95,duration:0.09,peak:0.04,...opts});
  playTone(ctx,destination,now,{type:'triangle',startFreq:190,endFreq:72,delay:0.055,duration:0.11,peak:0.04,...opts});
  playNoise(ctx,destination,now,{duration:0.09,peak:0.035,filterFreq:1200,...opts});
  return true;
 }
 if(kind==='jump'||kind==='launch'){
  playTone(ctx,destination,now,{type:'triangle',startFreq:base*0.85,endFreq:base*1.55,duration:0.12,peak:0.042,...opts});
  return true;
 }
 if(kind==='start'||kind==='over'){
  playTone(ctx,destination,now,{type:'triangle',startFreq:base,endFreq:kind==='over'?base*0.6:base*1.25,duration:0.14,peak:0.045,...opts});
  playTone(ctx,destination,now,{type:'sine',startFreq:base*1.5,endFreq:kind==='over'?base*0.75:base*1.5,delay:0.04,duration:0.14,peak:0.03,...opts});
  return true;
 }
 // Character specials & mini-boss moves: base tone + crisp comic overtone
 const rising=['coin','chen_dream','ko_name','ko_bags'].includes(kind);
 playTone(ctx,destination,now,{type:kind?.startsWith('su_')?'sawtooth':'triangle',startFreq:base,endFreq:rising?base*1.35:base*0.52,duration:0.14,peak:0.042,...opts});
 playTone(ctx,destination,now,{type:'sine',startFreq:base*1.5,endFreq:rising?base*1.85:base*0.8,delay:0.015,duration:0.11,peak:0.024,...opts});
 return true;
}
