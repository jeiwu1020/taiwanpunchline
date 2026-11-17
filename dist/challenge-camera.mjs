import {isMobileLandscapePresentation,streetPlayerCameraProfile} from './challenge-layout.mjs?v=chapter-presentation-20261117-r1';
import {MOB_TYPES} from './challenge-content.mjs?v=rally-consistency-20261115-r1';
// Shared, display-only challenge framing. All rectangles are in logical canvas
// coordinates. safeRect has already consumed the OS inset, so it is never
// applied a second time here. World collision and depth coordinates are intact.
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const finite=(v,fallback)=>Number.isFinite(v)?v:fallback;
const depthY=a=>finite(a.depth,0)*.65;
// The standing proxy remains 300 above / 28 below the anchor. Soft mobile
// controls protect its top 160 units (through y-140): measured seven-character
// standing/jump heads end at y-153..-156, leaving 13..16 units of collar room.
// This is a standing head/collar proxy, not animated-head or chest protection.
// Low crouch/knee/roll heads can briefly overlap translucent controls entirely;
// the sampled full actor still has alpha outside the control rectangles.
const SOFT_CONTROL_LOWER_BODY=168;
// Ordinary melee mobs enter the local shot before striking; ranged threats
// retain their real attack reach. Unknown actors keep the conservative legacy
// envelope. This is framing only, never a change to engine activation or AI.
const threatRadius=a=>a?.spec?Math.max(260,finite(a.spec.range,496)+64):560;
export function challengeCameraSubjects(world,{route=false}={}){
 const player=world?.player;if(!player)return [];
 const living=a=>a&&a!==player&&a.hp!==0&&!(a.hp<0);
 const nearby=a=>Math.abs(a.x-player.x)<=threatRadius(a)&&Math.abs(finite(a.depth,0)-finite(player.depth,0))<=190;
 const enemies=route?(world.enemies?.length?world.enemies:[world.enemy]).filter(a=>living(a)&&nearby(a)):[world.enemy].filter(living);
 const actors=[player,...enemies];
 // Helpers matter during their local attack, not while a distant effect or
 // crowd crosses the world. Projectiles never set the size of the camera.
 for(const episode of world.assists||[]){const a=episode.actor;
  if(a&&['warning','attack'].includes(episode.phase)&&actors.some(b=>Math.abs(a.x-b.x)<=360&&Math.abs(finite(a.depth,0)-finite(b.depth,0))<=190)&&!actors.includes(a))actors.push(a);
 }
 return actors;
}
// Display state belongs to the frame, never to the combat world. Pending
// spawns are read from the very schedule used by the engine; no RNG, spawn,
// position, collision, or simulation clock is changed by this forecast.
export function challengeCameraPlan(world,{route=false,previous=null,delta=1000/60}={}){
 const subjects=challengeCameraSubjects(world,{route});
 if(!route||!world?.player)return {subjects,anticipated:subjects,state:null};
 const player=world.player,old=previous?.cameraTracking?.world===world?previous.cameraTracking:null;
 const elapsed=clamp(finite(delta,1000/60),0,100),retained=[];
 const live=(world.enemies?.length?world.enemies:[world.enemy]).filter(a=>a&&a.hp>0);
 // Start composing before each actor's local threat boundary. Once engaged, use a
 // wider exit boundary and a short release hold, including deaths/assist exit.
 for(const entry of old?.retained||[]){
  const a=entry.actor,active=subjects.includes(a)||(live.includes(a)&&Math.abs(a.x-player.x)<=threatRadius(a)+80&&Math.abs(depthY(a)-depthY(player))<=140);
  const remaining=active?600:entry.remaining-elapsed;
  if(remaining>0)retained.push({actor:a,remaining,pose:active?{x:a.x,y:a.y,depth:a.depth,vy:a.vy,supportY:a.supportY}:entry.pose});
 }
 for(const a of subjects.slice(1))if(!retained.some(e=>e.actor===a))retained.push({actor:a,remaining:600,pose:{x:a.x,y:a.y,depth:a.depth,vy:a.vy,supportY:a.supportY}});
 const anticipated=[player,...retained.map(e=>e.pose)];
 for(const a of live)if(Math.abs(a.x-player.x)<=threatRadius(a)+200&&Math.abs(finite(a.depth,0)-finite(player.depth,0))<=230&&!retained.some(e=>e.actor===a))anticipated.push({...a,x:player.x+clamp(a.x-player.x,-threatRadius(a)-64,threatRadius(a)+64)});
 for(const [index,spawn] of (world.section?.spawns||[]).entries()){
  if(world.spawned?.has(index))continue;
  const x=spawn[1],trigger=spawn[2]??x-560,gap=trigger-player.x;
  if(gap>160||gap<0||!Number.isFinite(x))continue;
  // Reserve the known entry offset locally while approaching its trigger.
  // This also handles the existing explicitly-triggered rear ambushes.
  const offset=x-trigger,sign=Math.sign(offset)||1,radius=threatRadius({spec:MOB_TYPES[spawn[0]]});
  // Far melee spawns walk into the local shot normally. Only an entry that
  // can become a nearby threat before gradual admission needs a forecast.
  if(Math.abs(offset)>radius+200)continue;
  anticipated.push({x:player.x+sign*Math.min(Math.abs(offset)+65,radius+64),y:430,depth:[0,-65,65,0][index%4],vy:0});
 }
 const engaged=anticipated.length>1;
 // A ready assist can be accepted before the next simulation step. Its real
 // route origin is player.x - player.face * 65. Reserve both legal facings
 // whenever a helper is equipped, including while it recharges, so a turn or
 // charge completion cannot introduce an unannounced body envelope. These
 // soft poses never become actors and do not create an encounter by themselves.
 if(player.assist?.helper)for(const offset of [-65,65])anticipated.push({x:player.x+offset,y:player.y,depth:player.depth,vy:0,supportY:player.supportY});
 return {subjects,anticipated,velocityX:old&&elapsed>0?clamp((player.x-old.playerX)/(elapsed/1000),-500,500):0,state:{world,retained,playerX:player.x,engaged}};
}
export function challengeActorBounds(actor,{head=300,prediction=.12,halfWidth=130}={}){
 const y=finite(actor.y,430)+depthY(actor),rise=Math.min(0,finite(actor.vy,0))*prediction;
 const landing=Math.max(y,finite(actor.supportY,430)+depthY(actor)),fall=Math.min(landing-y,Math.max(0,finite(actor.vy,0))*prediction);
 return {left:actor.x-halfWidth,right:actor.x+halfWidth,top:y-head+rise,bottom:y+28+fall};
}
function groundedActorBounds(actor,{head=300,halfWidth=130}={}){
 const y=finite(actor.supportY,430)+depthY(actor);
 return {left:actor.x-halfWidth,right:actor.x+halfWidth,top:y-head,bottom:y+28};
}
// One standing-size preference across main/later VS and streets. The safety
// solver, not legacy chapter-specific reserves, handles separation and jumps.
export function mobileLandscapeCameraFrame(width,height,actors){
 const zoom=Math.min(1.4,width/440,height*.74/328);
 return {width,height,zoom,x:(Math.min(...actors.map(a=>a.x))+Math.max(...actors.map(a=>a.x)))/2,y:430-(height*.84-height/2)/zoom};
}
// A reduced feasibility union is not an ordering-equivalent candidate list.
// Keep its original padded blockers separately: equal-cost camera choices must
// still follow the legacy actor/overlay/edge order. Weak keys share only this
// geometry snapshot and do not retain old per-frame inputs.
const occlusionCandidateOrder=new WeakMap();
function geometry(frame,options){
 const {width,height}=frame;
 const safe=options.safeRect??{left:0,top:0,right:width,bottom:height};
 const rect={left:clamp(finite(safe.left,0),0,width),right:clamp(finite(safe.right,width),0,width),top:clamp(finite(safe.top,0),0,height),bottom:clamp(finite(safe.bottom,height),0,height)};
 const pad=finite(options.occlusionPadding,6);
 const occlusions=(options.occlusions||[]).filter(o=>[o.left,o.right,o.top,o.bottom].every(Number.isFinite)&&o.right>o.left&&o.bottom>o.top).map(o=>({softControl:options.softControls&&o.kind==='control',left:Math.max(rect.left,o.left-pad),right:Math.min(rect.right,o.right+pad),top:Math.max(rect.top,o.top-pad),bottom:Math.min(rect.bottom,o.bottom+pad)})).filter(o=>o.left<o.right&&o.top<o.bottom);
 // Padding precedes containment. Do not replace a union with its bounding
 // rectangle: genuine holes and gaps remain available to the camera. Different
 // control/body policies must retain separate constraints, even if nested.
 const reduced=occlusions.filter((a,i)=>!occlusions.some((b,j)=>i!==j&&a.softControl===b.softControl&&a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom&&(j<i||a.left>b.left||a.right<b.right||a.top>b.top||a.bottom<b.bottom)));
 // Two rectangles can merge only if their union is itself a rectangle:
 // identical vertical span with overlapping x, or identical horizontal span
 // with overlapping y. This never fills an L-shaped hole. Strict overlap also
 // leaves epsilon-width boundary gaps unchanged for the solver's open tests.
 for(let changed=true;changed;){changed=false;
  outer:for(let i=0;i<reduced.length;i++)for(let j=i+1;j<reduced.length;j++){
   const a=reduced[i],b=reduced[j];if(a.softControl!==b.softControl)continue;
   const horizontal=a.top===b.top&&a.bottom===b.bottom&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>2e-7;
   const vertical=a.left===b.left&&a.right===b.right&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2e-7;
   if(!horizontal&&!vertical)continue;
   reduced[i]={...a,left:Math.min(a.left,b.left),right:Math.max(a.right,b.right),top:Math.min(a.top,b.top),bottom:Math.max(a.bottom,b.bottom)};
   reduced.splice(j,1);changed=true;break outer;
  }
 }
 if(reduced.length!==occlusions.length)occlusionCandidateOrder.set(reduced,occlusions);
 return {rect,occlusions:reduced};
}
// At a fixed scale, each actor/overlay pair defines a forbidden translation
// rectangle. Its boundaries are the only extra x candidates needed. For each
// x, choose the nearest legal y. This preserves size whenever translation can
// solve the overlap, including open space between asymmetric control groups.
function placeAtScale(boxes,zoom,rect,occlusions,wanted,limits=null){
 let minX=-Infinity,maxX=Infinity,minY=-Infinity,maxY=Infinity;
 for(const b of boxes){minX=Math.max(minX,rect.left-b.left*zoom);maxX=Math.min(maxX,rect.right-b.right*zoom);minY=Math.max(minY,rect.top-b.top*zoom);maxY=Math.min(maxY,rect.bottom-b.bottom*zoom);}
 if(limits){minX=Math.max(minX,limits.left);maxX=Math.min(maxX,limits.right);minY=Math.max(minY,limits.top);maxY=Math.min(maxY,limits.bottom);}
 if(minX>maxX||minY>maxY)return null;
 const forbiddenFor=overlays=>{const list=[];for(const b of boxes)for(const o of overlays)list.push({left:o.left-b.right*zoom,right:o.right-b.left*zoom,top:o.top-(o.softControl?b.bottom-SOFT_CONTROL_LOWER_BODY:b.bottom)*zoom,bottom:o.bottom-b.top*zoom});return list;};
 const forbidden=forbiddenFor(occlusions),original=occlusionCandidateOrder.get(occlusions),ordered=original?forbiddenFor(original):forbidden;
 const x0=clamp(wanted.x,minX,maxX),y0=clamp(wanted.y,minY,maxY);
 const legal=(x,y)=>!forbidden.some(r=>x>r.left+1e-7&&x<r.right-1e-7&&y>r.top+1e-7&&y<r.bottom-1e-7);
 if(legal(x0,y0))return {x:x0,y:y0};
 const xs=[x0,minX,maxX];for(const r of ordered)for(const x of [r.left,r.right])if(x>=minX&&x<=maxX)xs.push(x);
 let best=null,bestCost=Infinity;
 const vertical=[...forbidden].sort((a,b)=>a.top-b.top);
 for(const x of new Set(xs)){
  const minimumCost=(x-wanted.x)**2+(y0-wanted.y)**2;
  if(minimumCost>=bestCost)continue;
  const cuts=vertical.filter(r=>x>r.left+1e-7&&x<r.right-1e-7);
  // Reject a completely covered vertical interval before enumerating original
  // candidate priorities. Strict overlap retains legal epsilon seam points.
  let end=-Infinity,covering=false;
  for(const r of cuts){const top=r.top+1e-7,bottom=r.bottom-1e-7;
   if(!covering){if(top<minY&&bottom>minY){covering=true;end=bottom;}else if(top>=minY)break;}
   else if(top<end)end=Math.max(end,bottom);else break;
  }
  if(covering&&end>maxY)continue;
  if(!cuts.some(r=>y0>r.top+1e-7&&y0<r.bottom-1e-7)){bestCost=minimumCost;best={x,y:y0};continue;}
  const ys=[y0,minY,maxY];
  const orderedCuts=ordered.filter(r=>x>r.left+1e-7&&x<r.right-1e-7);
  for(const r of orderedCuts)for(const y of [r.top,r.bottom])if(y>=minY&&y<=maxY)ys.push(y);
  for(const y of new Set(ys)){const cost=(x-wanted.x)**2+(y-wanted.y)**2;if(cost>=bestCost||cuts.some(r=>y>r.top+1e-7&&y<r.bottom-1e-7))continue;bestCost=cost;best={x,y};}
 }
 return best;
}
// Reserve horizontal follow travel at geometry initialization. The true player
// remains ±132; any displayed x within anchor ±80*zoom retains body/HUD/head
// safety. Neither encounter membership nor pose participates in this envelope.
const PLAYER_FOLLOW_RESERVE_X=80;
const PLAYER_FIXED_BOX={left:-132-PLAYER_FOLLOW_RESERVE_X,right:132+PLAYER_FOLLOW_RESERVE_X,top:-300,bottom:28};
export function isPlayerFixedCameraProfile(width,height,options={}){
 return (options.cameraMode??options.camera??'classic')==='stable';
}
function playerFixedGeometry(width,height,options){
 const source=options.fixedCameraGeometry??options;
 // The union reducer can take different rectangular merge paths. Sort only
 // this new profile's inputs first; legacy solver priorities stay untouched.
 const occlusions=(source.occlusions||[]).filter(o=>[o.left,o.top,o.right,o.bottom].every(Number.isFinite)&&o.left<o.right&&o.top<o.bottom).slice().sort((a,b)=>{
  for(const key of ['left','top','right','bottom'])if(a[key]!==b[key])return a[key]-b[key];
  return Number(a.kind==='control')-Number(b.kind==='control');
 });
 return {...geometry({width,height},{safeRect:source.safeRect,occlusions,occlusionPadding:options.occlusionPadding,softControls:true}),layoutKey:source.layoutKey};
}
function fixedGeometryKey(width,height,{rect,occlusions,layoutKey}){
 const tuples=occlusions.map(o=>[o.left,o.top,o.right,o.bottom,!!o.softControl]);
 tuples.sort((a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i]?-1:1;return 0;});
 return JSON.stringify([2,width,height,rect.left,rect.top,rect.right,rect.bottom,tuples,...(layoutKey?[layoutKey]:[])]);
}
export function playerFixedGeometryKey(width,height,options={}){
 return fixedGeometryKey(width,height,playerFixedGeometry(width,height,options));
}
function compatiblePlayerFixedState(frame){
 const state=frame?.playerFixedCamera;
 if(frame?.challengeCameraMode!=='stable'||state?.version!==2||!([frame.width,frame.height,frame.x,frame.y,frame.zoom,state.zoom,state.anchor?.x,state.anchor?.y,state.pose?.x,state.pose?.displayY,state.follow?.left,state.follow?.right].every(Number.isFinite))||!(state.zoom>0)||frame.zoom!==state.zoom)return null;
 // Reject old geometry policy and malformed history even while frozen. The
 // current normalized geometry is compared separately; reflows can reuse z.
 let key;try{key=JSON.parse(state.geometryKey);}catch{return null;}
 if(!Array.isArray(key)||key[0]!==2||key[1]!==frame.width||key[2]!==frame.height||state.follow.left!==state.anchor.x-PLAYER_FOLLOW_RESERVE_X*state.zoom||state.follow.right!==state.anchor.x+PLAYER_FOLLOW_RESERVE_X*state.zoom||typeof state.follow.clamped!=='boolean')return null;
 return state;
}
export function canReuseCameraFrame(frame,width,height,options={}){
 if(!frame||frame.width!==width||frame.height!==height)return false;
 // Combat framing depends on live fighter positions. Reuse it only while the
 // encounter is frozen; active frames must advance follow and camera-mode
 // transitions even when the HUD geometry is unchanged.
 if(frame.controlledCombatCamera)return !!options.paused&&frame.controlledCombatCamera.version===3&&frame.controlledCombatCamera.geometryKey===controlledCombatGeometry(width,height,options).key;
 if(frame.playerCloseCamera)return canReuseCloseFrame(frame,width,height,options);
 if(!frame.playerFixedCamera)return true;
 // A paused frame owns its existing mode; a UI selection takes effect only
 // on resume. Touch/measurement/profile changes still invalidate fixed state.
 return !!compatiblePlayerFixedState(frame)&&isPlayerFixedCameraProfile(width,height,options)&&frame.playerFixedCamera.geometryKey===playerFixedGeometryKey(width,height,options);
}

// Combat preserves the arena's device-specific composition, then applies one
// shared safe-area solve. Stable zoom uses grounded poses; dynamic zoom can
// ease within a small range as the live composition changes.
function controlledCombatGeometry(width,height,options){
 const softControls=options.touch===true;
 const ordered=(options.occlusions||[]).slice().sort((a,b)=>{for(const key of ['left','top','right','bottom'])if(a[key]!==b[key])return a[key]-b[key];return Number(a.kind==='control')-Number(b.kind==='control');});
 const g=geometry({width,height},{...options,occlusions:ordered,softControls});
 return {...g,softControls,key:fixedGeometryKey(width,height,g)};
}
export function controlledCombatCameraFrame(width,height,fighters,previous=null,delta=1000/60,options={}){
 const actors=(fighters||[]).filter(actor=>actor&&Number.isFinite(actor.x));if(!actors.length)return null;
 const player=actors[0];
 const g=controlledCombatGeometry(width,height,options),{rect,occlusions,key}=g;
 const state=previous?.controlledCombatCamera,compatible=state?.version===3&&previous.width===width&&previous.height===height?state:null;
 const selected=options.paused&&state?previous.challengeCameraMode:(options.cameraMode??options.camera);
 const mode=selected==='stable'?'stable':'classic';
 const previousUsable=previous?.width===width&&previous?.height===height&&[previous.x,previous.y,previous.zoom].every(Number.isFinite);
 const modeChanged=previousUsable&&previous?.challengeCameraMode!==mode;
 const history=modeChanged?null:compatible,old=history&&state.geometryKey===key?state:null;
 if(options.paused&&old)return previous;
 const dt=clamp(finite(delta,1000/60),0,100),zoomEase=1-Math.exp(-dt/420),panEase=1-Math.exp(-dt/(mode==='stable'?140:220));
 const supportEase=1-Math.exp(-dt/160);
 const rawSupportYs=actors.map(actor=>finite(actor.supportY,430)+depthY(actor));
 const prevSupportYs=compatible?.supportYs;
 const supportYs=rawSupportYs.map((targetSY,i)=>{
  if(options.paused&&Array.isArray(prevSupportYs)&&Number.isFinite(prevSupportYs[i]))return prevSupportYs[i];
  if(!previousUsable||!Array.isArray(prevSupportYs)||!Number.isFinite(prevSupportYs[i]))return targetSY;
  return prevSupportYs[i]+(targetSY-prevSupportYs[i])*supportEase;
 });
 const pose=options.paused&&state?.pose?state.pose:{x:player.x,displayY:finite(player.y,430)+depthY(player),groundY:supportYs[0]};
 const standing={left:-132,right:132,top:-300,bottom:28};
 const scaleBaselineY=Math.max(430,...rawSupportYs);
 const scaleBodies=actors.map(actor=>{const y=previousUsable?scaleBaselineY:finite(actor.supportY,430)+depthY(actor);return {left:actor.x+standing.left,right:actor.x+standing.right,top:y+standing.top,bottom:y+standing.bottom};});
 const restingBodies=actors.map((actor,i)=>{const y=supportYs[i];return {left:actor.x+standing.left,right:actor.x+standing.right,top:y+standing.top,bottom:y+standing.bottom};});
 const left=Math.min(...actors.map(actor=>actor.x)),right=Math.max(...actors.map(actor=>actor.x)),pairCenter=(left+right)/2;
 const subjectScreenY=clamp(finite(options.subjectScreenY,.82),.55,.9);
 const portrait=width<height,mobileLandscape=options.touch===true&&!portrait&&height<=500;
 const maximum=mobileLandscape?Math.min(1.25,width/480,height*.74/328):Math.min(1.25,width/500,height/480);
 const safeAnchor={x:(rect.left+rect.right)/2,y:rect.top+(rect.bottom-rect.top)*subjectScreenY};
 const wantedFor=(centerX,groundY,z)=>({x:width/2-centerX*z,y:height/2-(groundY+(height/2-safeAnchor.y)/z)*z});
 const legacy=options.preferredCameraFrame;
 const preferredZoom=(mobileLandscape&&options.measuredCameraSafety!==false&&Array.isArray(options.occlusions))?maximum:clamp(finite(legacy?.zoom,maximum),1e-6,maximum);
 const scaleGround=scaleBodies.reduce((sum,b)=>sum+(b.top+b.bottom)/2,0)/scaleBodies.length;
 const legacyCenterX=Number.isFinite(legacy?.x)?legacy.x:pairCenter;
 const largestFit=(boxes,upper,centerX,groundY)=>{
  const place=z=>placeAtScale(boxes,z,rect,occlusions,wantedFor(centerX,groundY,z));
  if(place(upper))return upper;
  let lo=0,hi=upper;
  if(!place(1e-6))return 1e-6;
  for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(place(mid))lo=mid;else hi=mid;}
  return Math.max(1e-6,lo);
 };
 // Fit the full resting pair on opening (and on portrait) so the opponent is never
 // clipped off-screen at duel start. Airborne jump height and desk elevation never shrink scale.
 const retainedBaseline=state?.version===3&&previous?.width===width&&previous?.height===height&&state.geometryKey===key&&Number.isFinite(state.baseline)?state.baseline:null;
 let stableZoom=retainedBaseline??preferredZoom;
 const scalePlayerGround=(scaleBodies[0].top+scaleBodies[0].bottom)/2;
 const restingGround=restingBodies.reduce((sum,b)=>sum+(b.top+b.bottom)/2,0)/restingBodies.length;
 const playerGround=(restingBodies[0].top+restingBodies[0].bottom)/2;
 const playerRest=placeAtScale([scaleBodies[0]],stableZoom,rect,occlusions,wantedFor(player.x,scalePlayerGround,stableZoom));
 if(!playerRest){let lo=0,hi=stableZoom;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(placeAtScale([scaleBodies[0]],mid,rect,occlusions,wantedFor(player.x,scalePlayerGround,mid)))lo=mid;else hi=mid;}stableZoom=Math.max(1e-6,lo);}
 const dynamicCeiling=portrait?Math.min(maximum,Math.max(stableZoom,preferredZoom)):stableZoom;
 const dynamicFit=largestFit(scaleBodies,dynamicCeiling,pairCenter,scaleGround);
 const dynamicFloor=portrait?Math.min(stableZoom,dynamicFit):stableZoom*.88;
 const dynamicTarget=clamp(dynamicFit,Math.max(1e-6,dynamicFloor),dynamicCeiling);
 const stableTarget=old?.lockedZoom??stableZoom;
 const targetZoom=mode==='stable'?stableTarget:dynamicTarget;
 const startZoom=previousUsable?previous.zoom:targetZoom;
 const zoom=previousUsable?Math.max(1e-6,startZoom+(targetZoom-startZoom)*zoomEase):targetZoom;
 // Compose around the duel midpoint at battle start. After mode switch to stable,
 // recenter smoothly onto the controlled fighter; otherwise stay stationary until
 // the controlled fighter approaches the screen safe boundary.
 let targetX=mode==='stable'?legacyCenterX:pairCenter,recentering=false;
 const spanHeight=(Math.max(...restingBodies.map(b=>b.bottom))-Math.min(...restingBodies.map(b=>b.top)))*zoom;
 const rectHeight=Math.max(1,rect.bottom-rect.top);
 const topHudBottom=occlusions.reduce((m,o)=>!o.softControl&&(o.top+o.bottom)/2<(rect.top+rect.bottom)/2?Math.max(m,o.bottom):m,rect.top);
 const openVertical=Math.max(1,rect.bottom-topHudBottom);
 const shareVerticalBand=mode==='classic'&&restingBodies.length>1&&spanHeight>openVertical-4;
 const sharedFramingY=supportYs[0];
 const targetY=mode==='stable'?playerGround:(shareVerticalBand?sharedFramingY-136:restingGround);
 if(mode==='stable'){
  if(!previousUsable)targetX=pairCenter;
  else if(modeChanged||(state?.recentering&&Math.abs(previous.x-player.x)>1)){
   targetX=player.x;
   recentering=true;
  }else{
   targetX=previous.x;
   const prevPlayerX=state?.pose?.x??player.x,playerSpan=264*zoom;
   const edgeMargin=Math.min(36,Math.max(0,(rect.right-rect.left-playerSpan)*.2));
   const leftScreen=width/2+(player.x-132-previous.x)*zoom,rightScreen=width/2+(player.x+132-previous.x)*zoom;
   const prevLeft=width/2+(prevPlayerX-132-previous.x)*zoom,prevRight=width/2+(prevPlayerX+132-previous.x)*zoom;
   const minLeftScreen=Math.min(rect.left+edgeMargin,Math.max(rect.left,prevLeft));
   const maxRightScreen=Math.max(rect.right-edgeMargin,Math.min(rect.right,prevRight));
   if(leftScreen<minLeftScreen)targetX=player.x-132-(minLeftScreen-width/2)/zoom;
   else if(rightScreen>maxRightScreen)targetX=player.x+132-(maxRightScreen-width/2)/zoom;
  }
 }
 let centerX=previousUsable?previous.x+(targetX-previous.x)*panEase:targetX;
 let centerY=previousUsable?previous.y+(targetY-previous.y)*panEase:targetY;
 const wanted={x:width/2-centerX*zoom,y:height/2-centerY*zoom};
 const pairFramingBodies=shareVerticalBand?restingBodies.map(b=>({...b,top:sharedFramingY+standing.top,bottom:sharedFramingY+standing.bottom})):restingBodies;
 const framingBodies=mode==='stable'?[restingBodies[0]]:pairFramingBodies;
 const maxStepScreen=previousUsable&&!options.paused&&dt>0?Math.max(5,420*(dt/1000)):Infinity;
 const stepWorld=Number.isFinite(maxStepScreen)?maxStepScreen/Math.max(.25,zoom):Infinity;
 const motionLimits=Number.isFinite(stepWorld)?{left:width/2-(previous.x+stepWorld)*zoom,right:width/2-(previous.x-stepWorld)*zoom,top:height/2-(previous.y+stepWorld)*zoom,bottom:height/2-(previous.y-stepWorld)*zoom}:null;
 let position=placeAtScale(framingBodies,zoom,rect,occlusions,wanted,motionLimits),finalZoom=zoom;
 if(!position&&mode==='classic')position=placeAtScale(pairFramingBodies,zoom,rect,occlusions,{x:width/2-pairCenter*zoom,y:height/2-(shareVerticalBand?sharedFramingY-136:restingGround)*zoom},motionLimits);
 if(!position)position=placeAtScale([restingBodies[0]],zoom,rect,occlusions,wanted,motionLimits);
 if(!position&&motionLimits){
  const boundedPlace=z=>{
   const sw=maxStepScreen/Math.max(.25,z);
   const lim={left:width/2-(previous.x+sw)*z,right:width/2-(previous.x-sw)*z,top:height/2-(previous.y+sw)*z,bottom:height/2-(previous.y-sw)*z};
   const w={x:width/2-clamp(centerX,previous.x-sw,previous.x+sw)*z,y:height/2-clamp(centerY,previous.y-sw,previous.y+sw)*z};
   return placeAtScale([restingBodies[0]],z,rect,occlusions,w,lim);
  };
  let lo=0,hi=zoom;
  if(boundedPlace(Math.max(1e-6,zoom*.92))){
   lo=zoom*.92;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(boundedPlace(mid))lo=mid;else hi=mid;}
   finalZoom=Math.max(1e-6,lo);position=boundedPlace(finalZoom);
  }
 }
 if(!position)position=placeAtScale(framingBodies,zoom,rect,occlusions,wanted);
 if(!position&&mode==='classic')position=placeAtScale(pairFramingBodies,zoom,rect,occlusions,{x:width/2-pairCenter*zoom,y:height/2-(shareVerticalBand?sharedFramingY-136:restingGround)*zoom});
 if(!position)position=placeAtScale([restingBodies[0]],zoom,rect,occlusions,wanted);
 if(!position){
  const playerPlace=z=>placeAtScale([restingBodies[0]],z,rect,occlusions,wantedFor(player.x,pose.groundY,z));
  let lo=0,hi=zoom;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(playerPlace(mid))lo=mid;else hi=mid;}
  finalZoom=Math.max(1e-6,lo);position=playerPlace(finalZoom)||{x:wanted.x,y:wanted.y};
 }
 const safetyFit=!!position;
 let finalX=position?(width/2-position.x)/finalZoom:centerX,finalY=position?(height/2-position.y)/finalZoom:centerY;
 if(previousUsable&&!options.paused&&dt>0){
  const sw=maxStepScreen/Math.max(.25,finalZoom);
  const boundedX=clamp(finalX,previous.x-sw,previous.x+sw);
  const boundedY=clamp(finalY,previous.y-sw,previous.y+sw);
  if(boundedX!==finalX||boundedY!==finalY){
   const boundedLimits={left:width/2-(previous.x+sw)*finalZoom,right:width/2-(previous.x-sw)*finalZoom,top:height/2-(previous.y+sw)*finalZoom,bottom:height/2-(previous.y-sw)*finalZoom};
   const smoothPos=placeAtScale([restingBodies[0]],finalZoom,rect,occlusions,{x:width/2-boundedX*finalZoom,y:height/2-boundedY*finalZoom},boundedLimits);
   if(smoothPos){finalX=(width/2-smoothPos.x)/finalZoom;finalY=(height/2-smoothPos.y)/finalZoom;}
  }
 }
  return {...(legacy||{}),width,height,x:finalX,y:finalY,zoom:finalZoom,backdropZoom:stableTarget,left:finalX-width/(2*finalZoom),base:height/2+(430-finalY)*finalZoom,hud:0,mode:mode==='stable'?'stable-fixed':'classic',challengeCameraMode:mode,cameraSafetyFit:safetyFit,
   controlOverlay:g.softControls?'soft':'normal',stageView:legacy?.stageView,controlledCombatCamera:{version:3,geometryKey:key,baseline:stableZoom,lockedZoom:stableTarget,anchor:safeAnchor,pose,pairCenter,recentering,supportYs}};
}
function smoothGroundedVerticalY(width,height,zoom,anchorY,poseX,cameraX,player,rect,occlusions,previous,paused,elapsedMs,smoothedSupportY=null){
 const liveDisplayY=finite(player.y,430)+depthY(player);
 const canonicalY=liveDisplayY+(height/2-anchorY)/zoom;
 const prevUsable=previous?.width===width&&previous?.height===height&&Number.isFinite(previous.y)&&Number.isFinite(previous.zoom);
 if(paused||!prevUsable||!(elapsedMs>0))return canonicalY;
 const groundDisplayY=finite(smoothedSupportY,finite(player.supportY,finite(player.y,430)))+depthY(player);
 const groundCamY=groundDisplayY+(height/2-anchorY)/zoom;
 const easeY=1-Math.exp(-elapsedMs/150);
 let candY=previous.y+(groundCamY-previous.y)*easeY;
 const bodyTop=groundDisplayY-300,bodyBottom=groundDisplayY+28;
 const actorLeft=width/2+(poseX-132-cameraX)*zoom,actorRight=width/2+(poseX+132-cameraX)*zoom;
 let minTop=rect.top,maxBottom=rect.bottom;
 const midRectY=(rect.top+rect.bottom)/2;
 for(const o of occlusions||[]){
  if(o.softControl)continue;
  if(o.left<actorRight-1e-6&&o.right>actorLeft+1e-6){
   if((o.top+o.bottom)/2<midRectY)minTop=Math.max(minTop,o.bottom);
   else maxBottom=Math.min(maxBottom,o.top);
  }
 }
 const maxCamY=bodyTop-(minTop-height/2)/zoom,minCamY=bodyBottom-(maxBottom-height/2)/zoom;
 if(minCamY<=maxCamY)candY=clamp(candY,minCamY,maxCamY);
 else candY=Math.min(candY,maxCamY);
 const maxStepY=Math.max(3,380*(elapsedMs/1000))/Math.max(.25,zoom);
 return clamp(candY,previous.y-maxStepY,previous.y+maxStepY);
}
function fitPlayerFixedCamera(preferred,player,previous,delta,options){
 const {width,height}=preferred,g=playerFixedGeometry(width,height,options),{rect,occlusions}=g;
 const geometryKey=fixedGeometryKey(width,height,g),maximum=width<height?Math.min(1.25,width/500,height*.68/328):Math.min(1.4,width/440,height*.72/328);
 const old=previous?.width===width&&previous?.height===height?compatiblePlayerFixedState(previous):null;
 const previousUsable=!!previous&&previous.width===width&&previous.height===height&&[previous.x,previous.y,previous.zoom].every(Number.isFinite);
 const pose={x:player.x,displayY:finite(player.y,430)+depthY(player)};
 const failed=()=>({...preferred,challengeCameraMode:'stable',cameraSafetyFit:false,playerFixedCamera:undefined});
 if(!(rect.left<rect.right&&rect.top<rect.bottom)||!Number.isFinite(pose.x)||!Number.isFinite(pose.displayY))return failed();
 let zoom,targetZoom,anchor;
 const wanted=old?old.anchor:{x:width/2,y:height*.82};
 const place=z=>placeAtScale([PLAYER_FIXED_BOX],z,rect,occlusions,wanted);
 if(old&&old.geometryKey===geometryKey){zoom=old.zoom;targetZoom=old.targetZoom??old.zoom;anchor={...old.anchor};}
 else{
  // A real HUD reflow may move the safe pocket without changing scale. A
  // dimension/profile transition has no old fixed state and starts afresh.
  if(old&&old.zoom<=maximum){targetZoom=old.targetZoom??old.zoom;zoom=targetZoom;anchor=place(zoom);}
  if(!anchor){targetZoom=maximum;zoom=targetZoom;anchor=place(zoom);}
  if(!anchor){let lo=0,hi=maximum;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(place(mid))lo=mid;else hi=mid;}targetZoom=zoom=Math.max(.000001,lo);anchor=place(zoom);}
 }
 if(!anchor)return failed();
 if(previousUsable&&Math.abs(zoom-targetZoom)>1e-8){
  const ease=1-Math.exp(-clamp(finite(delta,1000/60),0,50)/360),nextZoom=previous.zoom+(targetZoom-previous.zoom)*ease,nextAnchor=place(nextZoom);
  if(nextAnchor){zoom=nextZoom;anchor=nextAnchor;}
 }
 const left=anchor.x-PLAYER_FOLLOW_RESERVE_X*zoom,right=anchor.x+PLAYER_FOLLOW_RESERVE_X*zoom;
 const targetX=pose.x+(width/2-anchor.x)/zoom,elapsedMs=clamp(finite(delta,1000/60),0,50),budget=480*elapsedMs/1000;
 // A frozen rebase keeps the previous x until the new safety interval forces
 // a minimum correction. Active history follows x only, never a 2D lerp.
 const limitedX=previousUsable&&zoom===previous.zoom?previous.x+(options.paused?0:clamp((targetX-previous.x)*zoom,-budget,budget)/zoom):targetX;
 const q=width/2+(pose.x-limitedX)*zoom,shownX=clamp(q,left,right),clamped=shownX!==q;
 // An over-reserve displacement overrides the rate bound, not safety or z.
 // Retain exact prior x when no correction is needed, including frozen lag.
 const x=clamped?pose.x+(width/2-shownX)/zoom:limitedX;
 const targetSupportY=finite(player.supportY,finite(player.y,430));
 const prevSupportY=old&&Number.isFinite(old.supportY)?old.supportY:targetSupportY;
 const smoothedSupportY=options.paused?prevSupportY:(previousUsable?prevSupportY+(targetSupportY-prevSupportY)*(1-Math.exp(-elapsedMs/150)):targetSupportY);
 const y=smoothGroundedVerticalY(width,height,zoom,anchor.y,pose.x,x,player,rect,occlusions,previous,options.paused,elapsedMs,smoothedSupportY);
 const result={...preferred,x,y,zoom,challengeCameraMode:'stable',cameraSafetyFit:true,controlOverlay:'soft',playerFixedCamera:{version:2,geometryKey,zoom,targetZoom,anchor,pose,supportY:smoothedSupportY,follow:{left,right,clamped}}};
 // Preserve the street maximum-density reserve even when its legal actor
 // pocket is smaller. The reserve is geometry-only, never encounter-driven.
 if('base' in preferred)Object.assign(result,{base:height/2+(430-y)*zoom,jumpPan:0,backdropZoom:Math.max(preferred.backdropZoom||zoom,maximum),backdropTop:Math.min(preferred.backdropTop??Infinity,y-height/(2*zoom)),backdropBottom:Math.max(preferred.backdropBottom??-Infinity,y+height/(2*zoom))});
 return result;
}
export function fitChallengeCamera(preferred,actors,previous=null,delta=1000/60,options={}){
 const {width,height}=preferred,mode=options.cameraMode??options.camera??'classic';
 const sameSize=previous?.width===width&&previous?.height===height;
 if(options.paused&&canReuseCameraFrame(previous,width,height,options))return previous;
 // A frozen fixed frame owns its displayed pose and stable mode until resume.
 // Geometry repair may reposition that snapshot, never chase live actors.
 if(options.paused&&compatiblePlayerFixedState(previous)&&isPlayerFixedCameraProfile(width,height,{...options,cameraMode:'stable'})){
  const pose=previous.playerFixedCamera.pose;
  return fitPlayerFixedCamera(preferred,{x:pose.x,y:pose.displayY},previous,delta,options);
 }
 if(!actors?.length)return preferred;
 if(isPlayerFixedCameraProfile(width,height,options))return fitPlayerFixedCamera(preferred,actors[0],previous,delta,options);
 // Anticipation reserves existing local hit knockback without changing any
 // actor. Current body proxies remain the final hard screen/HUD requirement.
 const mobileLandscape=options.measuredCameraSafety!==false&&isMobileLandscapePresentation({...options,width,height});
 const vsMobileJump=mobileLandscape&&mode==='classic'&&options.vsMobileJump===true&&!options.cameraPlan;
 if(mobileLandscape)preferred={...preferred,...mobileLandscapeCameraFrame(width,height,actors)};
 // The original roll reaches x±131 in raster samples. A fixed mobile-only
 // two-unit reserve covers it without pose-triggered zoom changes; all other
 // profiles retain the exact legacy ±130 width and camera decisions.
 const boundsOptions=mobileLandscape?{...options,halfWidth:132}:options;
 const {rect,occlusions}=geometry(preferred,{...options,softControls:mobileLandscape});
 const street=!!options.cameraPlan?.state;
 const same=sameSize&&previous?.challengeCameraMode===mode;
 const previousUsable=sameSize&&[previous?.x,previous?.y,previous?.zoom].every(Number.isFinite);
 const ease=1-Math.pow(mode==='stable'?.96:.91,clamp(delta,0,100)/(1000/60));
 const supportEase=1-Math.exp(-clamp(delta,0,100)/150);
 const prevSupportYs=previousUsable&&Array.isArray(previous?.challengeSupportY)?previous.challengeSupportY:null;
 const supportYs=actors.map((a,i)=>{
  const rawSY=finite(a.supportY,430);
  if(options.paused&&prevSupportYs&&Number.isFinite(prevSupportYs[i]))return prevSupportYs[i];
  if(!same||!previousUsable||!prevSupportYs||!Number.isFinite(prevSupportYs[i]))return rawSY;
  return prevSupportYs[i]+(rawSY-prevSupportYs[i])*supportEase;
 });
 const smoothedActors=actors.map((a,i)=>({...a,supportY:supportYs[i]}));
 if(mobileLandscape&&!street)preferred={...preferred,y:supportYs[0]+depthY(actors[0])-(height*.84-height/2)/preferred.zoom};
 const stableStreetZoom=Math.min(1.4,width/440,height*.74/328),preferredZoom=(street&&mobileLandscape)?stableStreetZoom:Math.max(.000001,finite(preferred.zoom,stableStreetZoom));
 const wantedZoom=mode==='stable'?preferredZoom:street?(mobileLandscape?Math.max(preferredZoom*.90,Math.min(preferredZoom,finite(preferred.zoom,preferredZoom))):preferredZoom):preferredZoom;
 const scaleActors=!street&&previousUsable?smoothedActors.map(a=>({...a,supportY:Math.max(430,finite(a.supportY,430))})):smoothedActors;
 const rawBoxes=smoothedActors.map(a=>groundedActorBounds(a,boundsOptions));
 const rawHeight=(Math.max(...rawBoxes.map(b=>b.bottom))-Math.min(...rawBoxes.map(b=>b.top)))*wantedZoom;
 const topHudBottom=occlusions.reduce((m,o)=>!o.softControl&&(o.top+o.bottom)/2<(rect.top+rect.bottom)/2?Math.max(m,o.bottom):m,rect.top);
 const openVertical=Math.max(1,rect.bottom-topHudBottom);
 const shareVerticalBand=!street&&rawBoxes.length>1&&rawHeight>openVertical-4;
 const sharedSupportY=supportYs[0];
 const boxes=shareVerticalBand?smoothedActors.map((a,i)=>({...rawBoxes[i],top:sharedSupportY+depthY(a)-300,bottom:sharedSupportY+depthY(a)+28})):rawBoxes;
 const anticipated=(options.cameraPlan?.anticipated||scaleActors).map((a,i)=>{const actor=i===0&&street?{...a,supportY:supportYs[0]}:a;const b=groundedActorBounds(actor,boundsOptions);return options.cameraPlan?.state?{...b,left:b.left-32,right:b.right+32}:b;});
 let center=previousUsable?{x:previous.x+(preferred.x-previous.x)*ease,y:previous.y+(preferred.y-previous.y)*ease}:{x:preferred.x,y:preferred.y};
 const wanted=z=>({x:width/2-center.x*z,y:height/2-center.y*z});
 // A maximum-scale fit can have disconnected legal pockets around controls.
 // Stay in the reachable pocket; reduce scale only as necessary, rather than
 // teleporting to a distant legal translation after the easing step.
 function fit(targetBoxes,maximum,continuous=false){
  const dt=clamp(delta,0,100)/1000,step=dt*60;
  const allowanceX=street?Math.max(3*step,265*dt*(previous?.zoom||maximum)+step):(vsMobileJump?16*step/Math.SQRT2:Math.max(4*step,480*dt*(previous?.zoom||maximum)));
  const allowanceY=street?Math.max(14*step,840*dt):Math.max(6*step,520*dt);
  const multiAllowanceY=(!mobileLandscape&&street&&targetBoxes.length>1)?Math.max(5*step,300*dt):allowanceY;
  const limitsFor=(z,ay)=>continuous&&same?{left:width/2-previous.x*z-allowanceX,right:width/2-previous.x*z+allowanceX,top:height/2-previous.y*z-ay,bottom:height/2-previous.y*z+ay}:null;
  const limits=z=>limitsFor(z,allowanceY);
  const place=(z,ay=allowanceY)=>placeAtScale(targetBoxes,z,rect,occlusions,wanted(z),limitsFor(z,ay));
  let zoom=maximum,position=place(zoom,multiAllowanceY);
  if(!position&&!mobileLandscape&&street&&targetBoxes.length>1){
   const multiFloor=continuous&&same?Math.max(previous.zoom/Math.pow(1.015,step),maximum*.72):maximum*.72;
   if(multiFloor<zoom&&place(multiFloor,multiAllowanceY)){let lo=multiFloor,hi=zoom;for(let i=0;i<24;i++){const mid=(lo+hi)/2,p=place(mid,multiAllowanceY);if(p)lo=mid;else hi=mid;}zoom=lo;position=place(zoom,multiAllowanceY);}
  }
  if(!position&&targetBoxes.length>1)position=placeAtScale([targetBoxes[0]],zoom,rect,occlusions,wanted(zoom),limits(zoom));
  if(!position&&continuous&&same&&street){
   const widened={left:width/2-previous.x*zoom-Math.max(allowanceX*3,24*step),right:width/2-previous.x*zoom+Math.max(allowanceX*3,24*step),top:height/2-previous.y*zoom-Math.max(allowanceY*3,24*step),bottom:height/2-previous.y*zoom+Math.max(allowanceY*3,24*step)};
   position=placeAtScale(targetBoxes,zoom,rect,occlusions,wanted(zoom),widened)||(targetBoxes.length>1?placeAtScale([targetBoxes[0]],zoom,rect,occlusions,wanted(zoom),widened):null)||placeAtScale(targetBoxes,zoom,rect,occlusions,wanted(zoom))||(targetBoxes.length>1?placeAtScale([targetBoxes[0]],zoom,rect,occlusions,wanted(zoom)):null);
  }
  if(!position){let lo=0,hi=zoom;for(let i=0;i<30;i++){const mid=(lo+hi)/2,p=place(mid);if(p)lo=mid;else hi=mid;}zoom=Math.max(.000001,lo);position=place(zoom);}
  return {zoom,position};
 }
 const forecast=fit(anticipated,wantedZoom);let target=forecast.zoom;
 if(!street&&mobileLandscape&&mode==='classic')target=Math.max(wantedZoom*.88,target);
 if(same&&mode==='stable'&&options.cameraPlan?.state?.retained?.some(e=>e.remaining<600))target=Math.min(target,previous.zoom);
  
 if(forecast.position&&(same||street)){const future={x:(width/2-forecast.position.x)/forecast.zoom,y:(height/2-forecast.position.y)/forecast.zoom};
  const deadZone=same&&mode==='stable'&&options.cameraPlan&&Math.abs(future.x-previous.x)*previous.zoom<8;
  if(deadZone)future.x=previous.x;
  const follow=!deadZone&&options.cameraPlan?.state?.engaged?clamp(options.cameraPlan.velocityX,-265,265)*clamp(delta,0,100)/1000:0;
  const futureY=shareVerticalBand?sharedSupportY+(depthY(smoothedActors[0]))-136:future.y;
  center=same?{x:previous.x+(future.x-previous.x)*ease+follow,y:previous.y+(futureY-previous.y)*ease}:future;}
 let zoomTarget=previousUsable?Math.min(wantedZoom,previous.zoom+(target-previous.zoom)*(target<previous.zoom?Math.max(ease,1-Math.pow(.82,clamp(delta,0,100)/(1000/60))):ease)):target;
 if(mobileLandscape&&same&&target<previous.zoom&&previous.zoom-target<1e-5)zoomTarget=target;
 if(same){const maxRatio=!mobileLandscape&&street?1.015:1.02,step=Math.pow(maxRatio,clamp(delta,0,100)/(1000/60));zoomTarget=clamp(zoomTarget,previous.zoom/step,previous.zoom*step);}
 const {zoom,position}=fit(boxes,zoomTarget,true);
 if(!position)return {...preferred,challengeCameraMode:mode,cameraSafetyFit:false};
 const x=(width/2-position.x)/zoom,y=(height/2-position.y)/zoom;
 const result={...preferred,x,y,zoom,challengeCameraMode:mode,cameraSafetyFit:true,controlOverlay:mobileLandscape?'soft':'normal',challengeSupportY:supportYs,...(options.cameraPlan?{cameraTracking:options.cameraPlan.state}:{})};
 if('base' in preferred)Object.assign(result,{base:height/2+(430-y)*zoom,jumpPan:0,backdropZoom:Math.max(preferred.backdropZoom||0,wantedZoom),backdropTop:Math.min(preferred.backdropTop??Infinity,y-height/(2*zoom)),backdropBottom:Math.max(preferred.backdropBottom??-Infinity,y+height/(2*zoom))});
 return result;
}

// Isolated close-street experiment. The approved v2 stable-landscape path above
// remains byte-for-byte unchanged. Phone portrait and classic landscape opt in
// explicitly; this state is never accepted as a v2 fixed-camera state.
function streetCloseProfile(width,height,options={}){
 if(options.measuredCameraSafety===false||!Array.isArray(options.occlusions))return null;
 return streetPlayerCameraProfile({...options,width,height});
}
function closeGeometry(width,height,options,profile){
 if(profile==='landscape')return playerFixedGeometry(width,height,options);
 const occlusions=(options.occlusions||[]).slice().sort((a,b)=>{for(const key of ['left','top','right','bottom'])if(a[key]!==b[key])return a[key]-b[key];return Number(a.kind==='control')-Number(b.kind==='control');});
 return {...geometry({width,height},{...options,occlusions,softControls:false}),layoutKey:options.closeCameraLayoutKey};
}
function closeKey(width,height,g,profile){return JSON.stringify([1,profile,JSON.parse(fixedGeometryKey(width,height,g))]);}
function compatibleCloseState(frame){
 const s=frame?.playerCloseCamera;
 if(s?.version!==1||!['portrait','landscape'].includes(s.profile)||!['classic','stable'].includes(frame.challengeCameraMode)||!([frame.width,frame.height,frame.x,frame.y,frame.zoom,s.zoom,s.referenceZoom,s.maximumDensity,s.anchor?.x,s.anchor?.y,s.pose?.x,s.pose?.displayY,s.reserveX,s.follow?.left,s.follow?.right].every(Number.isFinite))||s.zoom<=0||s.zoom!==frame.zoom||s.maximumDensity<s.zoom||s.referenceZoom<=0||typeof s.follow.clamped!=='boolean')return null;
 let key;try{key=JSON.parse(s.geometryKey);}catch{return null;}
 if(!Array.isArray(key)||key[0]!==1||key[1]!==s.profile||key[2]?.[1]!==frame.width||key[2]?.[2]!==frame.height||s.reserveX!==(s.profile==='landscape'?80:32)||s.follow.left!==s.anchor.x-s.reserveX*s.zoom||s.follow.right!==s.anchor.x+s.reserveX*s.zoom)return null;
 return s;
}
function canReuseCloseFrame(frame,width,height,options){
 const s=compatibleCloseState(frame);if(!s)return false;
 const profile=streetCloseProfile(width,height,{...options,cameraMode:frame.challengeCameraMode});
 return profile===s.profile&&s.geometryKey===closeKey(width,height,closeGeometry(width,height,options,profile),profile);
}
// Return null for every legacy route; wrappers then execute the original code.
// The only world fields read here are the controlled actor and paused status.
export function streetPlayerCameraFrame(width,height,world,options={}){
 const previous=options.previous,paused=options.paused||world?.status==='paused',saved=compatibleCloseState(previous),fixed=compatiblePlayerFixedState(previous),snapshot=saved??fixed,mode=paused&&snapshot?previous.challengeCameraMode:(options.cameraMode??options.camera??'classic');
 const profile=streetCloseProfile(width,height,{...options,cameraMode:mode});
 if(!profile||!world?.player)return null;
 // Existing v2 frozen frames own their stable mode, including a reflow. Let
 // the unchanged owner perform that repair before a selected classic resumes.
 if(paused&&fixed&&isPlayerFixedCameraProfile(width,height,{...options,cameraMode:'stable'}))return null;
 if(paused&&previous?.width===width&&previous?.height===height&&canReuseCloseFrame(previous,width,height,options))return previous;
 const p=paused&&snapshot?{x:snapshot.pose.x,y:snapshot.pose.displayY}:world.player;
 const pose={x:p.x,displayY:finite(p.y,430)+depthY(p)},g=closeGeometry(width,height,options,profile),key=closeKey(width,height,g,profile),{rect,occlusions}=g;
 const maximumDensity=profile==='landscape'?Math.min(1.4,width/440,height*.72/328):Math.min(1.25,width/500,height*.68/328);
 const old=previous?.width===width&&previous?.height===height&&saved?.profile===profile?saved:null;
 let referenceZoom=maximumDensity,zoom,anchor;
 const reserveX=profile==='landscape'?80:32,box={left:-132-reserveX,right:132+reserveX,top:-300,bottom:28};
 const wanted=old?old.anchor:{x:width/2,y:profile==='landscape'?height*.84:height*.74};
 const place=z=>placeAtScale([box],z,rect,occlusions,wanted);
 if(old&&old.geometryKey===key){zoom=old.zoom;anchor={...old.anchor};referenceZoom=old.referenceZoom;}
 else{
  if(profile==='landscape'){
   const stable=fitPlayerFixedCamera({width,height,x:0,y:0,zoom:maximumDensity},p,null,0,{...options,cameraMode:'stable'});
   if(stable.cameraSafetyFit)referenceZoom=stable.zoom;else referenceZoom=NaN;
  }
  const minimum=profile==='landscape'?referenceZoom*.90:Math.min(maximumDensity,96/328);
  if(profile==='portrait'&&!place(maximumDensity)){
   if(place(minimum)){let lo=minimum,hi=maximumDensity;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(place(mid))lo=mid;else hi=mid;}referenceZoom=lo;}
   else referenceZoom=NaN;
  }
  const target=profile==='landscape'?referenceZoom*.95:referenceZoom;
  if(profile==='landscape'&&old&&old.zoom>=minimum&&old.zoom<=target){zoom=old.zoom;anchor=place(zoom);}
  if(!anchor){zoom=target;anchor=place(zoom);}
  // Bound the search by an explicit readable-scale floor. A blocked or tiny
  // safe region is a geometry failure, never permission for a near-zero view.
  if(!anchor&&Number.isFinite(minimum)&&minimum>0&&place(minimum)){
   let lo=minimum,hi=target;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(place(mid))lo=mid;else hi=mid;}zoom=lo;anchor=place(zoom);
  }
 }
 const valid=rect.left<rect.right&&rect.top<rect.bottom&&Number.isFinite(pose.x)&&Number.isFinite(pose.displayY)&&Number.isFinite(zoom)&&zoom*328>=96&&!!anchor&&referenceZoom>=maximumDensity*.20;
 if(!valid){
  // An explicit non-renderable result for the existing draw boundary. There
  // is deliberately no projection to accidentally display under blocked HUD.
  return{width,height,mode:'depth-route',challengeCameraMode:mode,cameraSafetyFit:false,cameraBlocked:true,cameraSafetyReason:'NO_READABLE_PLAYER_POCKET',cameraGeometry:{profile,safeRect:{...rect},occlusions:occlusions.map(r=>({...r})),preferredZoom:maximumDensity,minimumBodyPixels:96}};
 }
 const left=anchor.x-reserveX*zoom,right=anchor.x+reserveX*zoom,targetX=pose.x+(width/2-anchor.x)/zoom,elapsed=clamp(finite(options.delta,1000/60),0,50),budget=(mode==='classic'?360:480)*elapsed/1000;
 const limitedX=old&&zoom===old.zoom?previous.x+(paused?0:clamp((targetX-previous.x)*zoom,-budget,budget)/zoom):targetX;
 const q=width/2+(pose.x-limitedX)*zoom,shownX=clamp(q,left,right),clamped=shownX!==q;
 const x=clamped?pose.x+(width/2-shownX)/zoom:limitedX;
 const y=smoothGroundedVerticalY(width,height,zoom,anchor.y,pose.x,x,p,rect,occlusions,previous,paused,elapsed);
 return{width,height,x,y,zoom,mode:'depth-route',hud:0,base:height/2+(430-y)*zoom,jumpPan:0,challengeCameraMode:mode,cameraSafetyFit:true,controlOverlay:profile==='landscape'?'soft':'normal',playerCloseCamera:{version:1,profile,geometryKey:key,zoom,referenceZoom,maximumDensity,anchor,pose,reserveX,follow:{left,right,clamped}},backdropZoom:maximumDensity,backdropTop:y-height/(2*zoom),backdropBottom:y+height/(2*zoom)};
}

// The original v2 solver owns landscape STABLE. A paused portrait-close owner
// supplies only its snapshot for that crossover; legacy preferences and density
// are then computed by the unchanged entry, rather than invented here.
export function streetCameraFrozenSnapshot(frame,width,height,options={}){
 const s=compatibleCloseState(frame);
 return s&&options.paused&&options.route===true&&frame.challengeCameraMode==='stable'&&Array.isArray(options.occlusions)&&isPlayerFixedCameraProfile(width,height,{...options,cameraMode:'stable'})?{x:s.pose.x,y:s.pose.displayY,depth:0}:null;
}

export class StreetCameraBlockedError extends Error{
 constructor(frame){super('Street camera has no readable safe player pocket');this.name='StreetCameraBlockedError';this.code='STREET_CAMERA_BLOCKED';this.reason=frame.cameraSafetyReason;this.geometry=frame.cameraGeometry;}
}
// Call before publishing a projection to either renderer. The existing draw
// boundary must keep its established failSurface('draw-failed') recovery path.
export function requireStreetCameraFrame(frame){if(frame?.cameraBlocked===true)throw new StreetCameraBlockedError(frame);return frame;}
