import {createStoryComicPainter} from './story-comic-art.mjs?v=chapter-presentation-20261117-r1';
import {createComicImageLoader,STORY_COMIC_IMAGE_FILES,STORY_COMIC_MINIBOSSES,comicMinibossReady,paintComicMiniboss} from './story-comic-assets.mjs?v=chapter-presentation-20261117-r1';
import {COMIC_PROP_FILES,comicPropReady,paintComicProps} from './story-comic-props.mjs?v=chapter-presentation-20261117-r1';

/** Six hosts share exactly this presentation; quick view loads those same hosts.
 * Readiness never owns a checkpoint or falls back to a combat character rig. */
export function createComicPresentation({chapterId,files,ImageClass=globalThis.Image,window=globalThis.window}={}){
 // Chapters 4/5 intentionally reuse the canonical chapter-3 truck artwork.
 const truck=['chapter-3','chapter-4','chapter-5'].includes(chapterId)?'chapter3':null;
 const supporting=Object.fromEntries(Object.entries(STORY_COMIC_MINIBOSSES).filter(([key])=>key.startsWith(`story-${chapterId}-`)||key==='story-crew-stagehand'&&['chapter-3','chapter-4'].includes(chapterId)).map(([key,value])=>[key,value.file]));
 const main=Object.fromEntries(Object.entries(STORY_COMIC_IMAGE_FILES).filter(([key])=>chapterId==='finale-3v4'||key!=='story-pose-ko-battery'&&!key.endsWith('-held-mic')));
 const props=Object.fromEntries(Object.entries(COMIC_PROP_FILES).filter(([key])=>{
  if(/battery|door-|hidden-stairs|mural-hall/.test(key))return chapterId==='finale-3v4';
  if(key==='comic-balloon-mic')return ['chapter-1','chapter-2','chapter-3'].includes(chapterId);
  if(key==='comic-locked-stand')return ['chapter-2','chapter-3','chapter-4','chapter-5','finale-3v4'].includes(chapterId);
  return true;
 }));
 const imageFiles=files??{...main,...supporting,...props,...(truck?{'comic-truck':new URL(`../${truck}/assets/${truck}/sound-truck-v1.png`,import.meta.url).href}:{})};
 const loadImages=createComicImageLoader({ImageClass,files:imageFiles});let pendingLoads=0;
 async function load(images,options){pendingLoads++;try{return await loadImages(images,options);}finally{pendingLoads--;}}
 const paint=createStoryComicPainter({chapterId,prepareProps:comicPropReady,paintProps:paintComicProps,
  prepareMiniboss:(actor,images,scene)=>comicMinibossReady(actor,images,scene.chapterId),paintMiniboss:paintComicMiniboss});
 function paintFrame(ctx,images,state,layout,options){
  const result=paint(ctx,images,state,layout,options);if(result!==false)return result;
  // A genuine painted recovery surface can satisfy the host's first-paint
  // proof, while the reader separately keeps Next disabled until art is ready.
  ctx.save();ctx.fillStyle='#fff0cc';ctx.fillRect(0,0,layout.width,layout.height);ctx.strokeStyle='#173239';ctx.lineWidth=3;ctx.strokeRect(8,8,layout.width-16,layout.height-16);
  ctx.fillStyle='#173239';ctx.textAlign='center';ctx.font='900 24px "Microsoft JhengHei",system-ui';ctx.fillText('漫畫畫面準備中…',layout.width/2,layout.height/2);ctx.restore();return false;
 }
 return {load,isLoading:()=>pendingLoads>0,paintFrame,motionOptions:()=>({reducedMotion:!!window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches})};
}
