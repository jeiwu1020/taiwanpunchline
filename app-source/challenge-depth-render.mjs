import {drawChapterEncounterEffects,drawChapterEncounterGuidance,drawChapterEncounterObject} from './chapter-encounter-art.mjs?v=chapter-presentation-20261117-r1';
import {streetActorNeedsPaint} from './street-actor-visibility.mjs?v=chapter-presentation-20261117-r1';
import {backgroundPresentation} from './background-cache-policy.mjs?v=chapter-presentation-20261117-r1';
import {fitChallengeCamera,challengeCameraSubjects,challengeCameraPlan,canReuseCameraFrame,streetPlayerCameraFrame,streetCameraFrozenSnapshot,requireStreetCameraFrame} from './challenge-camera.mjs?v=chapter-presentation-20261117-r1';
import {micFootprint,MIC_VISUAL_TILT,MIC_SOURCE_TILT,FLOAT_AMPLITUDE,flyingMicLayout,drawFlyingMic,invalidateFlyingMicRaster} from './preview/chapter2/flying-mic.mjs?v=chapter-presentation-20261117-r1';
import {stageInsets,fitMobilePairSafety} from './combat-presentation.mjs?v=chapter-presentation-20261117-r1';
import {createDepthBackdropRenderer} from './challenge-backdrop-cache.mjs?v=chapter-presentation-20261117-r1';
import {GROUND} from './core.mjs?v=chapter-presentation-20261117-r1';
import {drawFighterArt,drawProp} from './art-render.mjs?v=chapter-presentation-20261117-r1';
import {drawChallengeMob,drawChallengeBackdrop,drawChallengeStreetProp,drawChallengeSupply,drawChallengeTabletopBand,drawChallengeTableFront} from './challenge-art.mjs?v=chapter-presentation-20261117-r1';
import {drawSignatureProp} from './art-expression.mjs?v=chapter-presentation-20261117-r1';
import {presentationFighter,fighterGazeGlyph,drawHumanGlyph,SIGNATURE_SIZE,nameTileOffset} from './move-readability.mjs?v=chapter-presentation-20261117-r1';
import {assistView} from './assist-presentation.mjs?v=chapter-presentation-20261117-r1';
import {RALLY} from './stage-expansion.mjs?v=chapter-presentation-20261117-r1';
import {ITEM_ART,heldItemAnchor,chooseCarryHand} from './item-presentation.mjs?v=chapter-presentation-20261117-r1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const DEPTH_SCALE=.65,MIN_DEPTH=-90,MAX_DEPTH=100;
const depthOf=f=>Number(f?.depth)||0;

/** Screen-space reservation, independent of route pose/camera zoom. The main
 * fullStage camera keeps local -300 below stageInsets.top + 20, not chapter2's
 * 55px sky contract. Toolbar/HUD reserve the matching rightmost 72px in CSS. */
export function mainRouteMicPlan({width,height},dpr=1){
 dpr=Number.isFinite(dpr)&&dpr>0?Math.min(2,dpr):1;
 const size=44,angle=MIC_VISUAL_TILT-MIC_SOURCE_TILT,extent=micFootprint(size,angle);
 const travel=Math.floor(FLOAT_AMPLITUDE*dpr+.5)/dpr;
 const center={x:Math.floor((width-6-extent.x-travel)*dpr)/dpr,y:Math.ceil((6+extent.y+travel)*dpr)/dpr};
 const travelBounds={left:center.x-extent.x-travel,right:center.x+extent.x+travel,top:center.y-extent.y-travel,bottom:center.y+extent.y+travel};
 const actorSkyFloor=Math.min(118,height*.4)+20;
 const visible=Number.isFinite(width)&&Number.isFinite(height)&&travelBounds.left>=Math.max(6,width-72,width*.55)&&travelBounds.bottom<Math.min(height-6,actorSkyFloor);
 return {visible,reason:visible?null:'NO_SAFE_SKY_SPACE',message:visible?'':'視窗太小，無法安全呈現固定神麥；請放大視窗。',size,angle,visualTilt:MIC_VISUAL_TILT,extent,center,travelBounds,dpr,floatAmplitude:FLOAT_AMPLITUDE,actorSkyFloor,key:[width,height,dpr].join('x')};
}

/** All route art uses the same world projection as Phaser effects/captions. */
export function depthWorldPoint(actor,{foot=false}={}){
 return {x:actor.x,y:(foot?(actor.supportY??GROUND):(actor.y??GROUND))+depthOf(actor)*DEPTH_SCALE};
}
function preferredDepthRouteCameraFrame(width,height,route,{overlay=false,portrait=width<height,fullStage=false,touch=true,landscapePreview=false,safe={},camera='classic',previous=null,delta=1000/60,hudBottom=null,lowerLane=null,skipMobileFrame=false}={}){
 if(fullStage&&!skipMobileFrame&&touch&&!portrait&&landscapePreview&&height<=500&&camera==='stable'){
  const legacy=preferredDepthRouteCameraFrame(width,height,route,{overlay,portrait,fullStage,touch,landscapePreview,safe,camera,skipMobileFrame:true});
  const actors=[route.player,...(route.enemies||[]).filter(f=>f.hp>0)];
  if(actors.length===1&&route.enemy?.hp>0&&route.enemy!==route.player)actors.push(route.enemy);
  return fitMobilePairSafety(legacy,actors,previous,delta,{top:Math.max(96+(safe.top||0),(hudBottom||0)+8),bottom:height-80-(safe.bottom||0)});
 }
 if(fullStage&&!skipMobileFrame&&touch&&((portrait&&camera==='stable')||(!portrait&&landscapePreview&&height<=500&&camera==='classic'))){
  const opts={overlay,portrait,fullStage,touch,landscapePreview,safe,camera,skipMobileFrame:true};
  const legacy=preferredDepthRouteCameraFrame(width,height,route,opts),portraitPair=portrait&&camera==='stable';
  const actors=[route.player,...(route.enemies||[]).filter(f=>f.hp>0)];
  if(actors.length===1&&route.enemy?.hp>0&&route.enemy!==route.player)actors.push(route.enemy);
  const topWorld=Math.min(...actors.map(f=>f.y+depthOf(f)*DEPTH_SCALE-300)),bottomWorld=Math.max(...actors.map(f=>f.y+depthOf(f)*DEPTH_SCALE+28));
  const leftWorld=Math.min(...actors.map(f=>f.x))-130,rightWorld=Math.max(...actors.map(f=>f.x))+130;
  const inset=portraitPair?stageInsets(width,height,{touch,portrait}):{top:88+(safe.top||0),bottom:66+(safe.bottom||0)};
  const top=Math.max(inset.top+8,Number.isFinite(hudBottom)?hudBottom+8:0),side=18;
  let bottom=height-inset.bottom-14,extra=0;
  const groundRoute={...route,player:{...route.player,y:GROUND,depth:0}};
  const rest=preferredDepthRouteCameraFrame(width,height,groundRoute,opts);
  let target=portraitPair?Math.min(rest.zoom*1.10,(height-inset.top-inset.bottom-22)/610):rest.zoom*1.12;
  if(!portraitPair&&lowerLane){
   let clearance=Math.max(0,(lowerLane.right-lowerLane.left-(rightWorld-leftWorld)*target)/2);
   if(previous?.width===width&&previous?.height===height){
    const left=width/2+(leftWorld-previous.x)*previous.zoom,right=width/2+(rightWorld-previous.x)*previous.zoom;
    clearance=Math.min(clearance,Math.max(0,Math.min(left-lowerLane.left,lowerLane.right-right)));
   }
   extra=Math.max(0,Math.min(36,lowerLane.bottom-bottom))*Math.min(1,clearance/24);
  }
  bottom+=extra;
  // Close landscape framing, with the full pair envelope as the hard limit.
  if(!portraitPair)target=rest.zoom*1.24*(1+.12*extra/36);
  let laneLimit=Infinity;
  if(extra>0&&lowerLane)laneLimit=Math.max(0,(lowerLane.right-lowerLane.left)/(rightWorld-leftWorld));
  const fit=Math.min(laneLimit,(width-2*side)/(rightWorld-leftWorld),(bottom-top)/(bottomWorld-topWorld));
  const predictedTop=Math.min(...actors.map(f=>f.y+Math.min(0,f.vy||0)*.12+depthOf(f)*DEPTH_SCALE-300));
  const wanted=Math.min(target,(bottom-top)/(bottomWorld-predictedTop));
  const same=previous?.width===width&&previous?.height===height&&previous?.mobilePairMode===camera;
  const ease=1-Math.pow(portraitPair?.92:.94,Math.max(0,Math.min(100,delta))/(1000/60));
  const zoom=Math.min(fit,same?previous.zoom+(wanted-previous.zoom)*ease:wanted);
  // Approach the open lane continuously; use its lower floor only after
  // the previous frame has clearance, never snap into a newly feasible lane.
  const useLane=!portraitPair&&extra>0;
  const safeLeft=useLane?Math.max(side,lowerLane.left):side,safeRight=useLane?Math.min(width-side,lowerLane.right):width-side;
  const loX=rightWorld-(safeRight-width/2)/zoom,hiX=leftWorld+(width/2-safeLeft)/zoom;
  let desiredX=portraitPair?(leftWorld+rightWorld)/2:legacy.x;
  if(!portraitPair&&lowerLane){
   const mid=(leftWorld+rightWorld)/2,half=(rightWorld-leftWorld)*zoom/2,legacyCenter=width/2+(mid-legacy.x)*zoom;
   const screenCenter=half*2<=lowerLane.right-lowerLane.left?clamp(legacyCenter,lowerLane.left+half,lowerLane.right-half):(lowerLane.left+lowerLane.right)/2;
   desiredX=mid+(width/2-screenCenter)/zoom;
  }
  const x=clamp(same?previous.x+(desiredX-previous.x)*ease:desiredX,loX,hiX);
  const low=bottomWorld-(bottom-height/2)/zoom,high=topWorld+(height/2-top)/zoom;
  // Ground the landscape camera; only the safety bounds may move it vertically.
  const y=portraitPair?clamp(same?previous.y+(legacy.y-previous.y)*ease:legacy.y,low,high):clamp(GROUND+MAX_DEPTH*DEPTH_SCALE+28-(bottom-height/2)/zoom,low,high);
  return {...legacy,x,y,zoom,base:height/2+(GROUND-y)*zoom,jumpPan:0,mobilePairMode:camera,backdropZoom:Math.max(legacy.backdropZoom,zoom),backdropTop:Math.min(legacy.backdropTop,y-height/zoom/2),backdropBottom:Math.max(legacy.backdropBottom,y+height/zoom/2)};
 }
 if(fullStage){
  const closer=landscapePreview&&touch&&!portrait;
  const legacyWidth=width-(safe.left||0)-(safe.right||0),legacyHeight=height-(safe.top||0)-(safe.bottom||0);
  const legacyInset=stageInsets(legacyWidth,legacyHeight,{touch,portrait}),legacyAvailable=Math.max(1,legacyHeight-legacyInset.top-legacyInset.bottom);
  const inset=closer?{top:88+(safe.top||0),bottom:66+(safe.bottom||0)}:stageInsets(width,height,{touch,portrait}),available=Math.max(1,height-inset.top-inset.bottom);
  const actorTop=route.player.y+depthOf(route.player)*DEPTH_SCALE-300;
  // Dynamic camera scale is tied to the street floor, not the current jump or
  // tabletop support. Stable framing keeps its existing support-based rule.
  const scaleActorTop=camera==='stable'?(route.player.supportY??GROUND)+depthOf(route.player)*DEPTH_SCALE-300:GROUND-300;
  const floor=GROUND+MAX_DEPTH*DEPTH_SCALE;
  const legacyZoom=Math.min(1.4,legacyWidth/(portrait?550:1050),Math.max(1,legacyAvailable-40)/Math.max(400,floor-scaleActorTop));
  const dynamicZoom=Math.min(1.4,width/(portrait?550:1050),Math.max(1,available-40)/Math.max(400,floor-scaleActorTop),closer?legacyZoom*1.18:Infinity);
  // Stable means fixed actor scale for this viewport. Height changes only pan.
  const standingZoom=Math.min(1.4,width/(portrait?550:1050),Math.max(1,available-40)/400,closer?Math.min(1.4,legacyWidth/1050,Math.max(1,legacyAvailable-40)/400)*1.18:Infinity);
  // Only native phone landscape limits the near zoom. Reserve most of the
  // table-jump range up front so grounded enemies and the floor still fit.
  const gentleLandscape=camera==='classic'&&closer&&height<=500;
  const jumpEnvelope=floor-(GROUND-377+MIN_DEPTH*DEPTH_SCALE-300);
  const farDynamicZoom=Math.min(1.4,width/1050,Math.max(1,available-40)/jumpEnvelope,Math.min(1.4,legacyWidth/1050,Math.max(1,legacyAvailable-40)/jumpEnvelope)*1.18);
  const zoom=camera==='stable'?Math.min(1.4,standingZoom*1.12,Math.max(1,available-40)/300):gentleLandscape?Math.min(dynamicZoom,farDynamicZoom*1.6):dynamicZoom,visible=width/zoom;
  const x=clamp(route.player.x+visible*.13,visible/2,Math.max(visible/2,route.worldWidth-visible/2));
  const restBase=height-inset.bottom-20-MAX_DEPTH*DEPTH_SCALE*zoom;
  const jumpPan=camera==='stable'?Math.max(0,inset.top+20-(restBase+(actorTop-GROUND)*zoom)):Math.max(0,scaleActorTop-actorTop)*zoom;
  const base=restBase+jumpPan;
  // Static art uses the highest possible camera density for this viewport.
  // Jump zoom still follows the original camera, without re-rasterizing art.
  const backdropZoom=camera==='stable'?zoom:standingZoom;
  // Cover the full lane range plus 512 world units of ascent (the current
  // table jump is <377), without retaining empty margins on both sides.
  const farZoom=Math.min(backdropZoom,Math.max(1,available-40)/(floor-(GROUND-512+MIN_DEPTH*DEPTH_SCALE-300)));
  const backdropTop=floor-(height-inset.bottom-20)/farZoom,backdropBottom=floor+(inset.bottom+20)/farZoom;
  return{x,y:GROUND+(height/2-base)/zoom,zoom,backdropZoom,backdropTop,backdropBottom,width,height,mode:'depth-route',hud:0,base,jumpPan};
 }
 // Browser chrome can make a portrait viewport's remaining canvas wide.
 // Use the logical app orientation, rather than changing to distant framing.
 const reserve=overlay?Math.min(76,height*.23):12,available=Math.max(100,height-reserve);
 const zoom=Math.min(1.4,width/(portrait?550:1050),available/440),visible=width/zoom;
 const x=clamp(route.player.x+visible*.13,visible/2,Math.max(visible/2,route.worldWidth-visible/2));
 const rawBase=available-30-MAX_DEPTH*DEPTH_SCALE*zoom-depthOf(route.player)*.08*zoom;
 const jumpPan=Math.max(0,28-(rawBase+(route.player.y-GROUND+depthOf(route.player)*DEPTH_SCALE-300)*zoom));
 const base=rawBase+jumpPan;
 return {x,y:GROUND+(height/2-base)/zoom,zoom,width,height,mode:'depth-route',hud:0,base,jumpPan};
}
export function depthRouteCameraFrame(width,height,route,options={}){
 const presentation=backgroundPresentation(width,height,{touch:options.presentationTouch??options.touch});
 const close=options.fullStage?streetPlayerCameraFrame(width,height,route,{...options,route:true}):null;
 if(close)return {...requireStreetCameraFrame(close),presentation};
 const frozen=streetCameraFrozenSnapshot(options.previous,width,height,{...options,route:true,paused:options.paused||route?.status==='paused'});
 if(frozen){route={...route,player:{...route.player,...frozen}};options={...options,camera:'stable',cameraMode:'stable',previous:null};}
 const measured=Array.isArray(options.occlusions);
 if(options.paused&&canReuseCameraFrame(options.previous,width,height,{...options,measuredCameraSafety:measured?options.measuredCameraSafety:false}))return {...options.previous,presentation};
 const plan=challengeCameraPlan(route,{route:true,previous:options.previous,delta:options.delta}),subjects=plan.subjects;
 const standing=subjects.map(actor=>({...actor,y:GROUND,vy:0,depth:0}));
 const resting=measured?{...route,player:standing[0],enemy:standing[1],enemies:standing.slice(1)}:route;
 // The reviewed native-landscape close view is the standing preference, not
 // the older far-jump reserve beneath it. Fit actual poses once, below, against
 // measured blockers; distant mobs must not influence this preferred scale.
 const nativeClose=measured&&options.touch!==false&&!(options.portrait??width<height)&&options.landscapePreview===true&&height<=500&&options.camera!=='stable';
 const preferredRoute=options.camera==='stable'?resting:route;
 const preferred=preferredDepthRouteCameraFrame(width,height,preferredRoute,{...options,...(measured?{safe:{},hudBottom:null,lowerLane:nativeClose?options.lowerLane:null}:{}),skipMobileFrame:!nativeClose});
 if(!options.fullStage)return {...preferred,presentation};
 const inset=stageInsets(width,height,options);
 const safety=measured?options:{...options,measuredCameraSafety:false,safeRect:{left:0,top:Math.max(inset.top,options.hudBottom||0),right:width,bottom:height-inset.bottom},occlusions:[]};
 // Omitting the camera setting is the legacy dynamic-follow default. Keep
 // this branch aligned with fitChallengeCamera's default instead of treating
 // older callers as stable while the vertical jump correction is applied.
 return {...fitChallengeCamera(preferred,subjects,options.previous,options.delta,{...safety,cameraPlan:plan}),presentation};
}
export function depthBackdropLayout(frame){
 const width=frame.width/frame.zoom,height=frame.height/frame.zoom,left=frame.x-width/2,top=frame.y-height/2;
 // The generated image includes pavement. Its entire tile is world-anchored,
 // so road paint, shadows and actors translate identically with the camera.
 return {width,height,camera:left,originX:left,curbY:GROUND+MIN_DEPTH*DEPTH_SCALE-25,buildingHeight:489,top,bottom:top+height};
}
export function depthRenderItems(route){
 const list=[],push=(kind,value,extra={})=>list.push({kind,value,depth:depthOf(value),...extra});
 if(!route.supplyUsed&&Number.isFinite(route.section?.supplyX))push('supply',{x:route.section.supplyX,depth:route.section.supplyDepth??0});
 if(Number.isFinite(route.gateX))push('gate',{x:route.gateX,depth:0});
 for(const f of [route.player,...route.enemies||[]])if(f&&(f.hp>0||f===route.player||(f.deadAge??1)<.6))push('actor',f);
 for(const episode of route.assists||[])if(assistView(episode))push('actor',episode.actor,{episode});
 for(const q of route.projectiles||[])if(!q.dead)push('projectile',q);
 for(const q of route.obstacles||[])if(!q.dead)push('obstacle',q);
 for(const r of route.rallies||[])push('rally',r);
 for(const prop of route.chapterEncounter?.props||[])push('encounter-prop',prop);
 for(const gate of route.chapterEncounter?.gates||[])push('encounter-gate',gate);
 // A tabletop spans several depth lanes. Cut it only at occupied lanes so
 // rear actors are covered, while feet on its top stay on the landing plane.
 const lanes=list.map(item=>item.depth);
 for(const platform of route.platforms||[]){
  const half=platform.depthHalf??36,back=depthOf(platform)-half,front=depthOf(platform)+half;
  const cuts=[back,...new Set(lanes.filter(d=>d>back&&d<front)),front].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++)push('platform',platform,{part:'top',from:cuts[i-1],to:cuts[i],sortDepth:(cuts[i-1]+cuts[i])/2});
  push('platform',platform,{part:'front',sortDepth:front});
 }
 // At exact front contact the actor is in front; surface bands occupy open
 // intervals, and jumping never changes the original actor depth order.
 const foregroundOrder=item=>['platform','encounter-prop','encounter-gate'].includes(item.kind)?0:1;
 return list.sort((a,b)=>(a.sortDepth??a.depth)-(b.sortDepth??b.depth)||foregroundOrder(a)-foregroundOrder(b));
}
export function depthMobLabelLayout(f,frame){
 return {text:f.warning>0?(f.warningText??f.chapterCaption??'要出手了！'):f.name||f.displayName||'街頭搗蛋鬼',x:f.x,y:depthWorldPoint(f).y-305,fontSize:Math.max(18,16/frame.zoom),strokeWidth:Math.max(2.5,2/frame.zoom),plate:true,hp:clamp(f.hp/(f.maxHp||1),0,1)};
}
/** Keep clustered names on stable short rows without moving their head x anchors. */
export function depthMobLabelLayouts(mobs,frame,{slots=new Map()}={}){
 const z=frame.zoom,pad=6/z,gap=4/z,left=frame.x-frame.width/(2*z)+pad,right=frame.x+frame.width/(2*z)-pad,top=frame.y-frame.height/(2*z)+pad,bottom=frame.y+frame.height/(2*z)-pad;
 const labels=mobs.filter(f=>f.hp>0&&f.x>=left-28/z&&f.x<=right+28/z).map((actor,index)=>{
  const v=depthMobLabelLayout(actor,frame),key=actor.id??actor;
  // Chinese names occupy one em per character. This conservative width also
  // includes the plate padding and the health bar, not only text baselines.
  const width=Math.min(right-left,Math.max([...v.text].length*v.fontSize+14/z,64+2/z,50/z));
  return {...v,actor,key,index,anchorY:v.y,x:clamp(v.x,left+width/2,right-width/2),width,above:v.fontSize*.67,below:v.fontSize*.88+7/z};
 }).sort((a,b)=>String(a.actor.id??a.index).localeCompare(String(b.actor.id??b.index)));
 const active=new Set(labels.map(l=>l.key));for(const key of slots.keys())if(!active.has(key))slots.delete(key);
 const placed=[],overlaps=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
 for(const v of labels){
  const step=v.above+v.below+gap,near=labels.some(o=>o!==v&&Math.abs(o.x-v.x)<(o.width+v.width)/2+16/z&&Math.abs(o.anchorY-v.anchorY)<step*3);
  const preferred=near?(slots.get(v.key)??0):0,rows=[preferred,0];
  for(let n=1;n<=Math.ceil((bottom-top)/step)+1;n++)rows.push(-n,n);
  let chosen=null;const seen=new Set();
  for(const row of rows){
   const y=clamp(v.anchorY+row*step,top+v.above,bottom-v.below),stamp=Math.round(y*z*100);if(seen.has(stamp))continue;seen.add(stamp);
   const candidate={...v,y,row,box:{left:v.x-v.width/2,right:v.x+v.width/2,top:y-v.above,bottom:y+v.below}};
   if(!placed.some(o=>overlaps(candidate.box,o.box))){chosen=candidate;break;}
  }
  // A viewport can physically hold only so many labels in one x column. Do
  // not shrink text or attach distant leaders if an extreme crowd fills it.
  chosen??={...v,y:clamp(v.anchorY,top+v.above,bottom-v.below),row:0};
  chosen.box??={left:chosen.x-v.width/2,right:chosen.x+v.width/2,top:chosen.y-v.above,bottom:chosen.y+v.below};
  slots.set(v.key,chosen.row);placed.push(chosen);
 }
 return placed;
}
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(ctx,x1,y1,x2,y2,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function label(ctx,text,x,y,zoom,{size=16,color='#fff1cc',plate=false}={}){
 const font=Math.max(size,16/zoom);ctx.save();ctx.font=`900 ${font}px "Microsoft JhengHei", system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 if(plate){const w=ctx.measureText(text).width+14/zoom;ctx.fillStyle='#17333be8';ctx.fillRect(x-w/2,y-font*.67,w,font*1.34);}
 ctx.strokeStyle='#17333b';ctx.lineWidth=Math.max(2.5,2/zoom);ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
}
function drawMobLabel(ctx,v,frame){
 const f=v.actor;label(ctx,v.text,v.x,v.y,frame.zoom,{size:v.fontSize,plate:v.plate,color:f.warning>0?'#ffda83':'#fff4d9'});
 const y=v.y+v.fontSize*.88,w=Math.max(64,48/frame.zoom),h=5/frame.zoom;
 ctx.fillStyle='#17333b';ctx.fillRect(v.x-w/2-1/frame.zoom,y,w+2/frame.zoom,h+2/frame.zoom);ctx.fillStyle='#e8aa56';ctx.fillRect(v.x-w/2,y+1/frame.zoom,w*v.hp,h);
}
function drawSupply(ctx,images,q,zoom,time){
 const p=depthWorldPoint(q);ctx.save();ctx.translate(p.x,p.y);
 ellipse(ctx,0,2,38,8,'#17333a25');drawChallengeSupply(ctx,images,{x:0,y:0});
 label(ctx,'熱心補給',0,-108,zoom,{size:18,plate:true});ctx.restore();
}
function drawRally(ctx,images,r,time,zoom,reducedMotion){
 const y=depthWorldPoint(r).y,direction=r.direction||1,warning=r.age<RALLY.warning,alpha=warning?.4:Math.min(1,(RALLY.duration-r.age)*5);
 ctx.save();ctx.globalAlpha*=Math.max(0,alpha);ctx.fillStyle='#e8a54430';ctx.fillRect(Math.min(r.x,r.x-direction*220),y-31,220,62);
 const keys=['supporter-woman','supporter-man','supporter-young','supporter-elder','supporter-grandma'];
 for(let i=4;i>=0;i--){const img=images[keys[i]];if(!img)continue;const h=104,w=h*img.width/img.height,x=r.x-direction*i*36,bounce=reducedMotion||warning?0:Math.abs(Math.sin(r.age*30+i))*5;
  ellipse(ctx,x,y,25,5,'#17333a35');ctx.save();ctx.translate(x,y-bounce);ctx.scale(direction,1);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
 }
 if(warning)label(ctx,'大家一起來！',r.x-direction*70,y-122,zoom,{plate:true});ctx.restore();
}
function drawItem(ctx,images,kind,x,y,scale=1,rotation=0,flip=false){
 const spec=ITEM_ART[kind],image=spec&&images[spec.key];if(!image)return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(flip?-1:1,1);ctx.drawImage(image,-spec.width*scale/2,-spec.height*scale/2,spec.width*scale,spec.height*scale);ctx.restore();return true;
}
function drawProjectile(ctx,images,q,time,zoom){
 const p=depthWorldPoint(q),direction=q.vx<0?-1:1;
 if(q.kind==='coin'&&images['art-props']){for(let i=2;i>=0;i--){ctx.save();ctx.globalAlpha*=i===0?1:.21;drawProp(ctx,images,'coin',p.x-direction*i*19,p.y,26,27,time*.006);ctx.restore();}}
 else if(q.kind==='dream'){ctx.save();ctx.translate(p.x,p.y);ctx.scale(direction,1);drawSignatureProp(ctx,images,'dream',0,0,SIGNATURE_SIZE.dream.width,SIGNATURE_SIZE.dream.height,Math.sin(time*.008)*.06);ctx.restore();if(q.phase==='return')label(ctx,'↶ 回程',p.x,p.y+47,zoom,{color:'#d0f4d9'});}
 else if(q.kind==='arrow'||q.kind==='word'){
  // The route engine's lob falls vertically at targetX; align its art to that
  // actual trajectory rather than the duel-only sideways arrow release arc.
  if(q.kind==='word'){const {width:w,height:h,size}=SIGNATURE_SIZE.word,x=p.x+nameTileOffset(q.age||0,.56,direction);ctx.fillStyle='#fff7e5';ctx.strokeStyle='#367e8a';ctx.lineWidth=4;ctx.fillRect(x-w/2,p.y-h/2,w,h);ctx.strokeRect(x-w/2,p.y-h/2,w,h);label(ctx,'賴祥德',x,p.y,zoom,{size,color:'#295e66'});}
  else if(images['art-props'])drawProp(ctx,images,'arrow',p.x,p.y,150,20,q.lob?Math.PI/2:Math.atan2(q.vy||0,q.vx||1));
 }else if(q.kind==='notice'){
  const w=124,h=60,x=p.x+nameTileOffset(q.age||0,q.flight||.72,direction);ctx.fillStyle='#fff6df';ctx.strokeStyle='#d4822a';ctx.lineWidth=4;ctx.fillRect(x-w/2,p.y-h/2,w,h);ctx.strokeRect(x-w/2,p.y-h/2,w,h);label(ctx,q.noticeText||'通知',x,p.y,zoom,{size:24,color:'#7d4310'});
 }else if(!drawItem(ctx,images,q.kind,p.x,p.y,1.05,q.kind==='paper'?time*.008:Math.sin(time*.013)*.12)){
  // Mob leaflets use the original paper item when available; all scene builds
  // still have a readable illustrated fallback, never an invisible attack.
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(time*.008);ctx.fillStyle='#fff6dc';ctx.strokeStyle='#17333b';ctx.lineWidth=2;ctx.fillRect(-20,-13,40,26);ctx.strokeRect(-20,-13,40,26);line(ctx,-13,-5,13,-5,'#db9858',3);line(ctx,-13,4,9,4,'#587c82',2);ctx.restore();
 }
 if(q.reflected){ctx.strokeStyle='#e8bc4a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,23,0,Math.PI*2);ctx.stroke();label(ctx,'↶ 反射',p.x,p.y+36,zoom,{color:'#ffe2a4'});}
}
function drawActorShadow(ctx,item){
 const f=item.value,p=depthWorldPoint(f,{foot:true}),scale=1-Math.min(.25,Math.max(0,(f.supportY??GROUND)-f.y)/560),alpha=item.episode?assistView(item.episode)?.alpha??0:f.hp<=0?Math.max(0,1-(f.deadAge??0)/.6):1;
 ctx.save();ctx.globalAlpha*=alpha;ellipse(ctx,p.x,p.y+1,44*scale,7*scale,'#17333b33');ctx.restore();
}
function drawGroundEffects(ctx,items,frame){
 for(const item of items){const f=item.value;
  if(item.kind==='actor'&&(f.supportY??GROUND)>=GROUND)drawActorShadow(ctx,item);
  if(item.kind==='projectile'&&(f.kind==='arrow'||f.kind==='word'||f.kind==='notice')){const y=GROUND+depthOf(f)*DEPTH_SCALE,notice=f.kind==='notice',color=f.kind==='word'?'#367e8a':notice?'#d4822a':'#be4033',x=f.targetX??f.x,rx=notice?(f.markWidth??96)/2:55;ellipse(ctx,x,y,rx,9,color+'22');ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,rx,9,0,0,Math.PI*2);ctx.stroke();label(ctx,notice?(f.markLabel||'落點'):f.kind==='word'?'落字':'落箭',x,y+20,frame.zoom,{color});}
 }
}
function drawActor(ctx,images,item,time,frame,options,poses){
 if((item.value.supportY??GROUND)<GROUND)drawActorShadow(ctx,item);
 const f=item.value,view=item.episode?assistView(item.episode,{reducedMotion:options.reducedMotion}):null,p=depthWorldPoint(f),shown=options.fighterView?.(f)??{renderF:presentationFighter(f)};
 ctx.save();ctx.translate(view?.x??p.x,p.y);ctx.scale(f.face||1,1);ctx.globalAlpha*=view?.alpha??(f.hp<=0?Math.max(0,1-(f.deadAge??0)/.6):f.invulnerable>0?.72:f.flash>0&&Math.sin(time*.09)>0?.68:1);
 if(f.mobKind&&f.hp<=0)ctx.rotate(-.8*(f.face||1));
 const pose=f.mobKind?drawChallengeMob(ctx,images,shown.renderF??f,time,{shadow:false}):drawFighterArt(ctx,images,shown.renderF??f,time,{spit:shown.spit??0,impact:shown.impact??null,shadow:false});ctx.restore();
 poses.set(f,pose);options.onPose?.(f,pose);
 if(!f.mobKind){drawHumanGlyph(ctx,fighterGazeGlyph(f),p.x,p.y,f.face);const itemArt=f.item||(f.attack?.kind==='item_throw'&&!f.attack.fired?{kind:f.attack.itemKind,carryHand:f.attack.carryHand}:null);if(itemArt&&pose){const hand=itemArt.carryHand??chooseCarryHand(pose),a=heldItemAnchor({...f,item:itemArt},pose,hand);if(a)drawItem(ctx,images,itemArt.kind,a.x,a.y+depthOf(f)*DEPTH_SCALE,a.scale,a.rotation,a.flip);}}
 if(f.armor>0){ctx.strokeStyle='#5baab6';ctx.lineWidth=3;ctx.strokeRect(p.x-53,p.y-275,106,274);}
 if(f.slow>0){ctx.strokeStyle='#43858b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y-6,38,8,0,0,Math.PI*2);ctx.stroke();}
 if(view)label(ctx,view.caption,view.x,p.y+18,frame.zoom,{color:view.color});
}
function drawClasp(ctx,images,items,poses){
 const actors=items.filter(i=>i.kind==='actor').map(i=>i.value),holder=actors.find(f=>f.grabPose>0),held=actors.find(f=>f.grabbedPose>0),image=images['handshake-grip'];if(!holder||!held||!image)return;
 const wrist=f=>{const p=poses.get(f);return {x:f.x+f.face*((p?.arm.wrist.x??33)+(p?.bodyX??0)),y:depthWorldPoint(f).y+(p?.arm.wrist.y??-133)+(p?.bodyY??0)}};
 const a=wrist(holder),b=wrist(held),x=(a.x+b.x)/2,y=(a.y+b.y)/2,w=Math.hypot(b.x-a.x,b.y-a.y)+20;ellipse(ctx,x,y,w/2+12,26,'#ffd56845');ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.y-a.y,Math.abs(b.x-a.x)));ctx.scale(holder.face<0?-1:1,1);ctx.drawImage(image,290,65,1590,610,-w/2,-SIGNATURE_SIZE.grip.height/2,w,SIGNATURE_SIZE.grip.height);ctx.restore();
}

/** Paint into a world-coordinate canvas; the host owns the viewport transform. */
export function paintDepthRoute(ctx,images,route,time,frame,options={}){
 const bg=depthBackdropLayout(frame),poses=new Map();
 // Build table cuts from every actor lane before render-only culling.
 const visible={left:bg.camera,right:bg.camera+bg.width};
 const items=depthRenderItems(route).filter(item=>item.kind!=='actor'||item.episode||streetActorNeedsPaint(item.value,visible));
 if(!options.skipBackdrop){ctx.save();ctx.translate(bg.originX,0);drawChallengeBackdrop(ctx,images,bg);ctx.restore();}
 drawGroundEffects(ctx,items,frame);
 const encounterProject=(x,y=GROUND,z=0)=>({x,y:y+z*.65});
 drawChapterEncounterEffects(ctx,route,encounterProject,1,images);
 for(const item of items){const q=item.value,p=depthWorldPoint(q);
  if(item.kind==='platform'){
   const left=q.x??q.left,w=q.width??((q.right??left+100)-left),half=q.depthHalf??36,image=images['challenge-street-props'];
   if(image&&item.part==='top'){const back=depthOf(q)-half;drawChallengeTabletopBand(ctx,image,{x:left,y:q.y+back*DEPTH_SCALE,width:w,height:half*2*DEPTH_SCALE,from:(item.from-back)/(half*2),to:(item.to-back)/(half*2)});}
   else if(image)drawChallengeTableFront(ctx,image,{x:left,y:q.y+(depthOf(q)+half)*DEPTH_SCALE,width:w,height:GROUND-q.y});
  }
  else if(item.kind==='supply')drawSupply(ctx,images,q,frame.zoom,time);
  else if(item.kind==='gate'){drawChallengeStreetProp(ctx,images,'sign',{x:p.x,y:p.y,width:88,height:108});label(ctx,'前方開講 →',p.x,p.y-132,frame.zoom,{size:21,plate:true});}
  else if(item.kind==='encounter-prop')drawChapterEncounterObject(ctx,'prop',q,encounterProject,1,images,route.chapterEncounter?.time??time);
  else if(item.kind==='encounter-gate')drawChapterEncounterObject(ctx,'gate',q,encounterProject,1,images,route.chapterEncounter?.time??time);
  else if(item.kind==='actor')drawActor(ctx,images,item,time,frame,options,poses);
  else if(item.kind==='projectile')drawProjectile(ctx,images,q,time,frame.zoom);
  else if(item.kind==='obstacle'){const y=(q.y??GROUND)+depthOf(q)*DEPTH_SCALE;line(ctx,q.x-35,y-2,q.x+35,y-2,'#ab4e3c',5);drawSignatureProp(ctx,images,'queue',q.x,y-37,92,74,0,Math.min(1,q.life*3));label(ctx,'地面攔停',q.x,y-87,frame.zoom,{color:'#ffe0ab'});}
  else if(item.kind==='rally'&&!options.externalRallyRenderer)drawRally(ctx,images,q,time,frame.zoom,options.reducedMotion);
 }
 drawClasp(ctx,images,items,poses);
 drawChapterEncounterGuidance(ctx,route,encounterProject,1,frame.zoom);
 // Names are a final overlay so a nearer actor cannot erase the identifying
 // text of a mob behind it. Their plate and stroke survive bright backgrounds.
 const mobs=items.filter(item=>item.kind==='actor'&&item.value.mobKind&&item.value.hp>0).map(item=>item.value);
 for(const v of depthMobLabelLayouts(mobs,frame,{slots:options.labelSlots}))drawMobLabel(ctx,v,frame);
 // Undo only this world's projection. The host DPR transform is retained, so
 // the shared cached sprite remains the same 44 CSS pixels at every jump.
 const mic=flyingMicLayout({plan:mainRouteMicPlan(frame,options.micDpr||1),time,reducedMotion:options.reducedMotion});
 ctx.save();ctx.translate(frame.x-frame.width/frame.zoom/2,frame.y-frame.height/frame.zoom/2);ctx.scale(1/frame.zoom,1/frame.zoom);
 if(options.skipMic){options.onMicLayout?.(mic);ctx.restore();return mic;}
 if(mic.visible)drawFlyingMic(ctx,images['opening-props-v75'],mic,time);
 else{
  // A visible limitation notice, rather than silently shrinking/hiding artwork
  // or moving the camera. This branch is only for impossible tiny viewports.
  ctx.fillStyle='#152c34';ctx.fillRect(0,0,frame.width,20);
  ctx.fillStyle='#fff6df';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('視窗太小，請放大',frame.width/2,10,Math.max(1,frame.width-4));
 }
 ctx.restore();
 options.onMicLayout?.(mic);
 return mic;
}
export function createDepthChallengeRenderer(scene,images){
 const key='challenge-depth-world',texture=scene.textures.createCanvas(key,1,1),display=scene.add.image(0,0,key).setOrigin(0).setDepth(-7).setVisible(false);
 const backdrop=createDepthBackdropRenderer(scene,images);
 let size='',lastRoute=null;const labelSlots=new Map();
 return {get diagnostics(){return backdrop.diagnostics;},releaseSurface(){invalidateFlyingMicRaster(texture.getContext());size='';lastRoute=null;labelSlots.clear();texture.setSize(1,1);display.setVisible(false);backdrop.reset('mode');},invalidateSurface(){
  invalidateFlyingMicRaster(texture.getContext());
  // Phaser setSize is a no-op at equal dimensions. Reassign the backing to
  // discard every retained save/clip without changing texture/frame metadata.
  const canvas=texture.getCanvas();canvas.width=canvas.width;
  size='';backdrop.invalidateSurface();
 },hide(){display.setVisible(false);backdrop.hide();},draw(route,time,frame,options={}){
  const width=frame.width/frame.zoom,height=frame.height/frame.zoom,left=frame.x-width/2,top=frame.y-height/2;
  // Render at twice CSS resolution (bounded on large desktop views), rather
  // than enlarging a fixed low-resolution mob or text texture with the camera.
  const ratio=Math.max(1,Math.min(2,2560/frame.width,1800/frame.height)),pw=Math.ceil(frame.width*ratio),ph=Math.ceil(frame.height*ratio),stamp=pw+':'+ph;
  if(stamp!==size){texture.setSize(pw,ph);size=stamp;}
  if(route!==lastRoute){backdrop.reset();labelSlots.clear();lastRoute=route;}
  const retained=frame.backdropZoom?{width:frame.width,height:frame.height,scaleX:pw/frame.width*frame.backdropZoom,scaleY:ph/frame.height*frame.backdropZoom,top:frame.backdropTop,bottom:frame.backdropBottom}:null;
  const cachedBackdrop=backdrop.draw(depthBackdropLayout(frame),pw/width,ph/height,retained,frame.presentation);
  const ctx=texture.getContext();ctx.clearRect(0,0,pw,ph);ctx.save();ctx.scale(pw/width,ph/height);ctx.translate(-left,-top);
  const partialBackdrop=backdrop.paintPending(ctx,depthBackdropLayout(frame));
  paintDepthRoute(ctx,images,route,time,frame,{...options,labelSlots,micDpr:ratio,skipBackdrop:cachedBackdrop!==false||partialBackdrop});ctx.restore();texture.refresh();display.setPosition(left,top).setDisplaySize(width,height).setVisible(true);
 }};
}
