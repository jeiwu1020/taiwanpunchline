// Only intact generated pose images belong here. Never import a combat rig,
// reassemble body parts, or load the rejected Su/Ma/Chen likeness candidates.
export const STORY_COMIC_IMAGE_FILES=Object.freeze({...Object.fromEntries(['wang','han','huang','ko'].map(id=>[
 `story-pose-${id}`,`challenge/story-poses-v1/${id}.png`
])),...Object.fromEntries(['ma','chen'].map(id=>[`story-pose-${id}`,`challenge/story-poses-v2/${id}.png`])),
 'story-pose-su':'challenge/story-poses-v3/su.png',
 'story-pose-ko-battery':'challenge/story-poses-v3/ko-battery.png'});
export const STORY_COMIC_POSE_VARIANTS=Object.freeze({'ko-battery':Object.freeze([0,0,1024,1536])});
export const comicActorImageKey=actor=>`story-pose-${actor.variant??actor.id}`;
export const STORY_COMIC_PENDING_CAST=Object.freeze([]);
export const comicMinibossKey=(chapterId,id)=>id==='stagehand'?'story-crew-stagehand':`story-${chapterId}-${id}`;

// One complete generated announcing/carrying pose per supporting character.
// Source bytes and full-image crops were checked against the delivery manifest.
export const STORY_COMIC_MINIBOSSES=Object.freeze({"story-chapter-4-mini_marshal":{"file":"challenge/story-support-v1/chapter-4-mini_marshal-v1.png","crop":[0,0,1145,1374]},"story-chapter-4-mini_schedule":{"file":"challenge/story-support-v1/chapter-4-mini_schedule-v1.png","crop":[0,0,1199,1312]},"story-chapter-5-mini_marshal":{"file":"challenge/story-support-v1/chapter-5-mini_marshal-v1.png","crop":[0,0,1136,1385]},"story-chapter-5-mini_schedule":{"file":"challenge/story-support-v1/chapter-5-mini_schedule-v1.png","crop":[0,0,1086,1448]},"story-chapter-1-mini_guard":{"file":"challenge/story-support-v1/chapter1-mini-guard.png","crop":[0,0,1199,1312]},"story-chapter-1-mini_mic":{"file":"challenge/story-support-v1/chapter1-mini-mic.png","crop":[0,0,1217,1292]},"story-chapter-2-mini_guard":{"file":"challenge/story-support-v1/chapter2-mini-guard.png","crop":[0,0,1199,1312]},"story-chapter-2-mini_mic":{"file":"challenge/story-support-v1/chapter2-mini-mic.png","crop":[0,0,1237,1271]},"story-chapter-3-mini_guard":{"file":"challenge/story-support-v1/chapter3-mini-guard.png","crop":[0,0,1145,1374]},"story-chapter-3-mini_mic":{"file":"challenge/story-support-v1/chapter3-mini-mic.png","crop":[0,0,1199,1312]},"story-crew-stagehand":{"file":"challenge/story-support-v1/stagehand-v1.png","crop":[0,0,1254,1254]}});
const decoded=image=>{const w=image?.naturalWidth??image?.width,h=image?.naturalHeight??image?.height;return Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0;};
export function comicAssetRequirements(scene){
 const keys=[scene.backdrop==='corridor'?'finale-corridor':scene.backdrop];
 for(const actor of scene.actors)keys.push(actor.mob?comicMinibossKey(scene.chapterId,actor.id):comicActorImageKey(actor));
 return [...new Set(keys)];
}
export function comicMinibossReady(actor,images,chapterId,registry=STORY_COMIC_MINIBOSSES){
 const key=comicMinibossKey(chapterId,actor.id),source=registry[key],image=images[key];
 if(!source||!decoded(image)||!Array.isArray(source.crop)||source.crop.length!==4)return false;
 const [x,y,w,h]=source.crop??[],iw=image.naturalWidth??image.width,ih=image.naturalHeight??image.height;
 return [x,y,w,h,iw,ih].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=iw&&y+h<=ih;
}
export function paintComicMiniboss(ctx,images,actor,scene,_options,registry=STORY_COMIC_MINIBOSSES){
 if(!comicMinibossReady(actor,images,scene.chapterId,registry))return false;
 const key=comicMinibossKey(scene.chapterId,actor.id),crop=registry[key].crop;
 // Contain the entire painted figure; its aspect ratio is never distorted.
 const scale=Math.min(actor.width/crop[2],actor.height/crop[3]),w=crop[2]*scale,h=crop[3]*scale;
 ctx.save();try{ctx.translate(actor.center,actor.foot-h);ctx.scale(actor.face===-1?-1:1,1);ctx.drawImage(images[key],...crop,-w/2,0,w,h);}finally{ctx.restore();}
 return true;
}

/** Same URLs and loader for normal play and quick view. No storage or campaign
 * writes; one decoded request per file, failures remain visible to the caller. */
export function createComicImageLoader({ImageClass=globalThis.Image,files=STORY_COMIC_IMAGE_FILES,baseURL=new URL('../../assets/',import.meta.url).href,timeoutMs=15000}={}){
 const pending=new Map(),failed=new Set();
 return async function load(images,{retry=false}={}){
  const results=await Promise.all(Object.entries(files).map(async([key,file])=>{
   if(decoded(images[key]))return {key,status:'ready'};
   if(retry&&failed.delete(key))pending.delete(key);
   if(!pending.has(key))pending.set(key,new Promise((resolve,reject)=>{
    let image,timer;const finish=(error)=>{clearTimeout(timer);if(image)image.onload=image.onerror=null;if(error){failed.add(key);reject(error);}else resolve(image);};
    try{image=new ImageClass();timer=setTimeout(()=>finish(Error(`Comic image timed out: ${key}`)),timeoutMs);
     image.onload=()=>finish(decoded(image)?null:Error(`Empty comic image: ${key}`));
     image.onerror=()=>finish(Error(`Comic image unavailable: ${key}`));image.src=new URL(file,baseURL).href;
    }catch(error){finish(error);}
   }));
   try{images[key]=await pending.get(key);return {key,status:'ready'};}catch(error){return {key,status:'failed',error};}
  }));
  return {ready:results.every(r=>r.status==='ready'),results};
 };
}
