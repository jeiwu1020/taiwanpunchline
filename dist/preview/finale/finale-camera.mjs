import {fitChallengeCamera} from '../../challenge-camera.mjs?v=campaign-boot-20261112-r3';
import {GROUND} from '../../core.mjs?v=campaign-boot-20261112-r3';
import {ARENA} from './finale-engine.mjs?v=campaign-boot-20261112-r3';
// The engine limits foot anchors; visible shoes/rings need a safety apron.
// This changes scenery only, never the legal movement range.
export const FINALE_FLOOR=Object.freeze({left:ARENA.left-80,right:ARENA.right+80,back:ARENA.back-40,front:ARENA.front+40});
// Display-only shallow perspective. Floor, fighters, effects and camera safety
// all consume this projection. Combat coordinates and collision remain intact.
export function finalePoint(x,y=GROUND,depth=0){
 const scale=.91+.09*depth/ARENA.front;
 return {x:480+(x-480)*scale,y:GROUND+depth*1.05+(y-GROUND)*scale,scale};
}
export function finaleSubject(actor){
 const p=finalePoint(actor.x,actor.y,actor.depth??0);
 return {...actor,x:p.x,y:p.y,depth:0,vy:(actor.vy??0)*p.scale,supportY:finalePoint(actor.x,actor.supportY??GROUND,actor.depth??0).y};
}
export function finaleTacticalMarkers(world){
 return world.actors.map(a=>({id:a.id,type:a.type,team:a.team,alive:a.hp>0,controlled:a===world.player,
  x:Math.max(0,Math.min(1,(a.x-ARENA.left)/(ARENA.right-ARENA.left))),
  y:Math.max(0,Math.min(1,(a.depth-ARENA.back)/(ARENA.front-ARENA.back)))}));
}
export function finaleCameraFrame(width,height,world,{previous=null,delta=1000/60,occlusions=[],safeRect={left:8,top:8,right:width-8,bottom:height-8},paused=false,camera='classic',cameraMode=camera,touch=false,fixedCameraGeometry}={}){
 const mode=cameraMode==='stable'?'stable':'classic';
 const compact=touch&&width>height&&height<=420;
 if(compact&&mode==='stable'){
  const focus=(world.player.hp>0?world.player:world.actors.find(a=>a.team===0&&a.hp>0))??world.actors.find(a=>a.hp>0)??world.player;
  // Fit the REAL ground-to-jump envelope once per measured layout. Unlike a
  // displaced virtual actor, this includes standing feet AND apex name/head.
  // The pocket remains fixed while the world follows the grounded footprint.
  const compactSafe={left:Math.max(10,safeRect.left),top:Math.max(10,safeRect.top),right:Math.min(width-10,safeRect.right),bottom:Math.min(height-10,safeRect.bottom)};
  const key=JSON.stringify([width,height,compactSafe,occlusions]);
  const prior=previous?.arenaProfile==='player-stable'&&previous.arenaGeometryKey===key?previous:null;
  if(paused&&prior)return prior;
  const pocket=prior?.arenaPocket??fitChallengeCamera({width,height,x:0,y:-270,zoom:Math.min(.7,width/480,height/640)},[{x:0,y:0,depth:0,vy:0,supportY:0}],null,delta,{safeRect:compactSafe,occlusions,occlusionPadding:10,cameraMode:'classic',touch:false,measuredCameraSafety:false,prediction:0,head:590,halfWidth:132});
  const foot=finalePoint(focus.x,GROUND,focus.depth??0);
  const frame={...pocket,x:pocket.x+foot.x,y:pocket.y+foot.y};
  return {...frame,challengeCameraMode:'stable',arenaProfile:'player-stable',arenaGeometryKey:key,arenaPocket:pocket,arenaFocusId:focus.id,left:frame.x-width/(2*frame.zoom),base:height/2+(GROUND-frame.y)*frame.zoom};
 }
 // Stable protects the complete arena plus jump height, not a moving actor.
 const subjects=mode==='stable'?[...[ARENA.back,ARENA.front].flatMap(depth=>[ARENA.left,ARENA.right].flatMap(x=>[GROUND,GROUND-280].map(y=>finaleSubject({x,y,depth,vy:0}))))]:[...world.actors.filter(a=>a.hp>0),...world.assists.map(a=>a.actor)].map(finaleSubject);
 if(!subjects.length)subjects.push(finaleSubject(world.player));
 const key=JSON.stringify([width,height,mode,safeRect,occlusions]);
 const old=previous?.arenaGeometryKey===key?previous:null;
 if(old&&(paused||mode==='stable'))return old;
 const frame=fitChallengeCamera({width,height,x:480,y:GROUND-135,zoom:Math.min(1.4,width/900,height/470)},subjects,old,delta,{safeRect,occlusions,paused,cameraMode:'classic',touch:false,measuredCameraSafety:false,prediction:.12});
 return {...frame,challengeCameraMode:mode,arenaGeometryKey:key,left:frame.x-width/(2*frame.zoom),base:height/2+(GROUND-frame.y)*frame.zoom};
}
