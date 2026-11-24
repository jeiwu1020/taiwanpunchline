// Fixed media lanes keep main fighters and helpers independent. An accepted
// phrase plays to completion; later phrases from that same source wait in FIFO
// order. Explicit lifecycle stops discard every waiting phrase. Preview remains
// exclusive and uses the player lane, without allocating another media element.
export class VoiceChannels {
 constructor(elements,{fetchImpl=globalThis.fetch}={}){
  this.lanes=Object.fromEntries(Object.entries(elements).map(([id,media])=>[id,{media,token:0,busy:false,priming:false,primed:false,queue:[]}]));
  this.preview=false;this.volume=1;
  this.fetchImpl=fetchImpl;this.buffers=new Map();this.preparing=new Map();this.loads=[];this.loading=0;
 }
 setVolume(value){
  this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;
  for(const [id,lane] of Object.entries(this.lanes))this.applyVolume(id,lane);
 }
 applyVolume(id,lane){
  const value=(id==='player'||id==='assist-player'?.68:.46)*this.volume;
  if(lane.output){lane.media.volume=1;lane.output.gain.gain.setValueAtTime(value,lane.output.context.currentTime);}
  else lane.media.volume=value;
 }
 // GainNodes provide real voice volume on iOS, which may ignore media.volume.
 // The graph is created at most once per media element, from a user audio gesture.
 connectAudio(context){
  if(typeof context?.createMediaElementSource!=='function'||typeof context?.createGain!=='function')return false;
  for(const [id,lane] of Object.entries(this.lanes)){
   if(lane.audioBound)continue;let source,gain;
   try{gain=context.createGain();gain.connect(context.destination);source=context.createMediaElementSource(lane.media);lane.audioBound=true;source.connect(gain);lane.output={source,gain,context};this.applyVolume(id,lane);}
   catch{if(source){try{source.connect(context.destination);}catch{}}try{gain?.disconnect?.();}catch{}lane.output=null;this.applyVolume(id,lane);}
  }
  this.context=context;
  return Object.values(this.lanes).every(lane=>!!lane.output);
 }
 // Fetch/decode only. Never resume a context or play a phrase while preparing.
 // The caller supplies the current lineup, not the whole voice archive. Two
 // concurrent jobs keep preparation from flooding a slow mobile connection.
 preload(clips){
  const context=this.context;
  if(typeof context?.decodeAudioData!=='function'||typeof context?.createBufferSource!=='function'||typeof this.fetchImpl!=='function')return Promise.resolve();
  const jobs=[];
  for(const clip of clips){
   const src=clip?.src;if(!src)continue;if(this.buffers.has(src)){const cached=this.buffers.get(src);this.buffers.delete(src);this.buffers.set(src,cached);continue;}
   if(!this.preparing.has(src)){
    let finish;const promise=new Promise(resolve=>{finish=resolve;});
    this.preparing.set(src,promise);this.loads.push({src,context,finish});
   }
   jobs.push(this.preparing.get(src));
  }
  this.loadNext();return Promise.all(jobs);
 }
 loadNext(){
  while(this.loading<2&&this.loads.length){
   const {src,context,finish}=this.loads.shift();this.loading++;
   Promise.resolve().then(()=>{const request=this.fetchImpl;return request(src);}).then(response=>{
    if(!response.ok)throw Error('Voice request failed');return response.arrayBuffer();
   }).then(bytes=>new Promise((resolve,reject)=>{
    const pending=context.decodeAudioData(bytes,resolve,reject);pending?.then?.(resolve,reject);
   })).then(buffer=>{
    if(Number.isFinite(buffer?.duration)&&buffer.duration>0){this.buffers.delete(src);this.buffers.set(src,buffer);while(this.buffers.size>32){const oldest=this.buffers.keys().next().value;this.buffers.delete(oldest);}}
   }).catch(()=>{}).finally(()=>{
    this.loading--;this.preparing.delete(src);finish();this.loadNext();
   });
  }
 }
 stopLane(lane,{clearQueue=true}={}){
  lane.token++;lane.busy=false;lane.priming=false;if(clearQueue)lane.queue=[];
  if(lane.bufferSource){const source=lane.bufferSource;lane.bufferSource=null;source.onended=null;try{source.stop();}catch{}try{source.disconnect();}catch{}}
  const media=lane.media;media.onended=null;media.onerror=null;media.pause();
  try{media.currentTime=0;}catch{} // Unloaded media can reject seeking.
 }
 canPlay(actor){return !!this.lanes[actor]&&!this.preview;}
 stopAll(){this.preview=false;for(const lane of Object.values(this.lanes))this.stopLane(lane);}
 // Automatic round end keeps an audible sentence intact, but never brings old
 // requests into the result screen or the next round.
 clearQueued(){for(const lane of Object.values(this.lanes)){lane.queue=[];if(lane.priming)this.stopLane(lane);}}
 prime(src){
  for(const lane of Object.values(this.lanes)){
   if(lane.primed||lane.busy||lane.priming||this.preview)continue;
   const media=lane.media,token=++lane.token;lane.priming=true;
   media.src=src;media.muted=true;
   const finish=success=>{
    if(lane.token!==token)return;
    this.stopLane(lane);media.muted=false;lane.primed=success;
   };
   try{const pending=media.play();if(pending?.then)pending.then(()=>finish(true),()=>finish(false));else finish(true);}catch{finish(false);}
  }
 }
 play(actor,clip,{preview=false,onStart=()=>{},onError=()=>{}}={}){
  const lane=this.lanes[preview?'player':actor];if(!lane||!clip?.src)return false;
  if(preview){this.stopAll();this.preview=true;}else if(this.preview)return false;
  // A silent unlock is expendable. Spoken phrases are never replaced by a cast.
  if(lane.priming)this.stopLane(lane);
  const request={clip,preview,onStart,onError};
  if(lane.busy){lane.queue.push(request);return true;}
  this.start(preview?'player':actor,lane,request);return true;
 }
 start(actor,lane,{clip,preview,onStart,onError}){
  const media=lane.media,token=++lane.token;lane.busy=true;
  const current=()=>lane.token===token;
  const release=(failed=false)=>{
   if(!current())return;
   this.stopLane(lane,{clearQueue:false});if(preview)this.preview=false;
   const releasedToken=lane.token;
   if(failed)onError();
   // A lifecycle change inside a callback can cancel the queue too.
   if(lane.token!==releasedToken)return;
   const next=lane.queue.shift();if(next)this.start(actor,lane,next);
  };
  const buffer=this.buffers.get(clip.src),context=lane.output?.context;if(buffer){this.buffers.delete(clip.src);this.buffers.set(clip.src,buffer);}
  if(buffer&&context?.state==='running'){
   let source;
   try{
    source=context.createBufferSource();source.buffer=buffer;source.connect(lane.output.gain);
    this.applyVolume(actor,lane);lane.bufferSource=source;source.onended=()=>release();
    // Keep the complete file at its original speed, from frame zero to its end.
    source.start(0);lane.primed=true;onStart();return;
   }catch{if(source){source.onended=null;try{source.stop();}catch{}try{source.disconnect();}catch{}}lane.bufferSource=null;}
  }
  // Unsupported, failed or still-cold preparation retains the existing media
  // path. A slow download must never hold up the game or swallow a cast.
  media.onended=()=>release();media.onerror=()=>release(true);
  media.src=clip.src;this.applyVolume(actor,lane);media.muted=false;
  const started=()=>{if(current()){lane.primed=true;onStart();}};
  try{const pending=media.play();if(pending?.then)pending.then(started,()=>release(true));else started();}catch{release(true);}
 }
}
