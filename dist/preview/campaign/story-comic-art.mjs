import {storyComicScene} from '../../story-comic-scenes.mjs';
import {STORY_COMIC_MINIBOSSES,STORY_COMIC_POSE_VARIANTS,comicActorImageKey,comicMinibossKey} from './story-comic-assets.mjs';
import {comicPropComposition,comicDoorGeometry} from './story-comic-props.mjs';

// The new native v2 Ma/Chen/Su replace the rejected v1 likeness candidates.
// Quarter-cell crops preserve their complete hair, hands and shoes.
export const COMIC_POSE_RECTS=Object.freeze({
 wang:[[127,9,384,618],[746,11,367,596],[110,627,405,620],[612,633,582,615]],
 han:[[136,10,387,607],[758,11,381,605],[125,633,515,616],[723,629,435,615]],
 huang:[[100,7,523,613],[752,6,376,614],[91,638,483,611],[670,629,474,620]],
 ko:[[205,11,288,605],[706,9,364,601],[87,658,516,582],[681,631,477,607]],
 // Preserve entire quarter cells, including hair/shoes close to the edges.
 su:[[0,0,627,627],[627,0,627,627],[0,627,627,627],[627,627,627,627]],
 ma:[[0,0,599,656],[599,0,600,656],[0,656,599,656],[599,656,600,656]],
 chen:[[0,0,627,627],[627,0,627,627],[0,627,627,627],[627,627,627,627]]
});
const backdropKey=scene=>scene.backdrop==='corridor'?'finale-corridor':scene.backdrop;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const size=image=>({width:image?.naturalWidth??image?.width??0,height:image?.naturalHeight??image?.height??0});
const decoded=image=>{const {width,height}=size(image);return Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0;};
export const comicActorCrop=(actor,poseRects=COMIC_POSE_RECTS)=>actor.variant?STORY_COMIC_POSE_VARIANTS[actor.variant]:poseRects[actor.id]?.[actor.pose];

/** Asset absence is a preparation failure, never an invitation to substitute
 * an unrelated combat pose or the rejected likeness candidates. */
export function comicArtReadiness(scene,images,{poseRects=COMIC_POSE_RECTS,prepareProps,paintProps,prepareMiniboss,paintMiniboss}={}){
 const missing=[];
 if(!decoded(images[backdropKey(scene)]))missing.push(backdropKey(scene));
 for(const actor of scene.actors){
  if(actor.mob){if(typeof paintMiniboss!=='function'||prepareMiniboss?.(actor,images,scene)!==true)missing.push(`miniboss:${scene.chapterId}:${actor.id}`);continue;}
  const key=comicActorImageKey(actor),image=images[key],dimensions=size(image);
  if(!decoded(image))missing.push(key);
  const rect=comicActorCrop(actor,poseRects);
  if(!rect||rect.length!==4||rect.some(n=>!Number.isFinite(n))||rect[0]<0||rect[1]<0||rect[2]<=0||rect[3]<=0||rect[0]+rect[2]>dimensions.width||rect[1]+rect[3]>dimensions.height)missing.push(`pose-rect:${actor.id}:${actor.pose}`);
 }
 if(scene.prop&&(typeof paintProps!=='function'||prepareProps?.(scene,images)!==true))missing.push(`prop:${scene.prop}`);
 return {ready:missing.length===0,missing:[...new Set(missing)]};
}

/** Whole bodies move together. Bounds come from the same art rectangle as the
 * opening's readable bubbles, and never depend on world/camera coordinates. */
export function comicActorGeometry(scene,layout,{poseRects=COMIC_POSE_RECTS,time=0,reducedMotion=false}={}){
 const r=layout.art,t=reducedMotion?2400:clamp(Number(time)||0,0,2400),u=t/2400;
 const visible=scene.actors.filter(a=>scene.focus==='door-push'?a.layer===2:scene.framing!=='close'||a.layer>0);
 return visible.map((actor,index)=>{
  // The dropped battery is baked into the stumble pose. Cut to the complete
  // pointing pose once it reaches the lock, rather than leaving two batteries.
  const displayedPose=actor.id==='chen'&&actor.action==='drop'&&u>=.62?0:actor.pose;
  const src=actor.mob?STORY_COMIC_MINIBOSSES[comicMinibossKey(scene.chapterId,actor.id)]?.crop:comicActorCrop({...actor,pose:displayedPose},poseRects);
  if(!actor.mob&&!src)return {...actor,missing:true};
  const ensemble=visible.length>4,rear=actor.layer===0;
  const heightRatio=ensemble?(rear?.42:index===0?.67:.61):actor.height;
  const footRatio=rear?.76:actor.foot;
  const maxWidth=r.width*(ensemble&&rear?.18:rear?.26:visible.length===1?.76:.59);
  const ratio=src?src[2]/src[3]:.65;
  const height=Math.min(r.height*heightRatio,maxWidth/ratio),width=height*ratio;
  if(scene.focus==='door-push'){
   // Stage the complete source figure at the left leaf. The hand positions are
   // measured within each intact painting; no body parts are moved or redrawn.
   const door=comicDoorGeometry(scene,layout),handFraction=actor.id==='su'?.79:.94;
   const handX=door.x+door.width*.32,fitWidth=Math.min(width,(handX-r.x-2)/handFraction),fitHeight=fitWidth/ratio;
   const x=handX-fitWidth*handFraction,foot=door.foot;
   return {...actor,face:1,imageKey:comicActorImageKey(actor),src,x,y:foot-fitHeight,width:fitWidth,height:fitHeight,foot,center:x+fitWidth/2};
  }
  const travel=scene.motion==='travel'?(1-u)*r.width*.06:0;
  const push=['transport','walk-in'].includes(scene.motion)?u*r.width*.025:0;
  const bump=scene.motion==='bump-drop-slide'&&actor.action==='bump'?Math.sin(u*Math.PI)*r.width*.025:0;
  const pulse=reducedMotion?0:Math.sin(t*.003+index)*Math.min(1.5,r.height*.006);
  const cx=clamp(r.x+r.width*actor.x-travel+push+bump,r.x+width/2+1,r.x+r.width-width/2-1);
  const foot=clamp(r.y+r.height*footRatio+pulse,r.y+height+1,r.y+r.height-1);
  return {...actor,imageKey:actor.mob?comicMinibossKey(scene.chapterId,actor.id):comicActorImageKey(actor),src,x:cx-width/2,y:foot-height,width,height,foot,center:cx};
 });
}

function cover(ctx,image,width,height){
 const scale=Math.max(width/image.width,height/image.height),sw=width/scale,sh=height/scale;
 ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,0,0,width,height);
}

/** The caller retains the existing game canvas and its first-paint proof.
 * Hosts can prepare/recover without falsely certifying missing narrative art. */
export function createStoryComicPainter({chapterId,poseRects=COMIC_POSE_RECTS,prepareProps,paintProps,prepareMiniboss,paintMiniboss}={}){
 return (ctx,images,state,layout,options={})=>{
  const scene=storyComicScene(chapterId,state),assets=comicArtReadiness(scene,images,{poseRects,prepareProps,paintProps,prepareMiniboss,paintMiniboss});
  if(!assets.ready)return false;
  const composition=comicPropComposition(scene,layout);
  const actors=comicActorGeometry(scene,{...layout,art:composition.actorArt},{...options,poseRects});
  ctx.save();
  try{
   ctx.beginPath();ctx.rect(8,8,layout.width-16,layout.height-16);ctx.clip();
   cover(ctx,images[backdropKey(scene)],layout.width,layout.height);
   // A paper veil supports the dialogue without replacing the illustrated room.
   const shade=ctx.createLinearGradient(0,0,layout.landscape?layout.art.x:0,layout.landscape?0:layout.art.y);
   shade.addColorStop(0,'#fff3d329');shade.addColorStop(1,'#fff3d300');ctx.fillStyle=shade;ctx.fillRect(0,0,layout.width,layout.height);
   const propOptions={...options,actors,layer:'back'};
   if(paintProps(ctx,images,scene,layout,propOptions)!==true)throw new Error('Comic back props did not paint');
   for(const actor of [...actors].sort((a,b)=>a.layer-b.layer)){
    ctx.save();
    try{
     ctx.fillStyle='#152c3424';ctx.beginPath();ctx.ellipse(actor.center,actor.foot-2,actor.width*.32,Math.max(2,actor.height*.016),0,0,Math.PI*2);ctx.fill();
     if(actor.mob){if(paintMiniboss(ctx,images,actor,scene,options)!==true)throw new Error(`Comic miniboss did not paint: ${actor.id}`);}
     else{
      ctx.translate(actor.center,actor.y);ctx.scale(actor.face===-1?-1:1,1);
      ctx.drawImage(images[actor.imageKey],...actor.src,-actor.width/2,0,actor.width,actor.height);
     }
    }finally{ctx.restore();}
   }
   if(paintProps(ctx,images,scene,layout,{...propOptions,layer:'front'})!==true)throw new Error('Comic front props did not paint');
  }finally{ctx.restore();}
  return {ready:true,scene,actors};
 };
}
