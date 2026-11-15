import {fitChallengeCamera} from '../../challenge-camera.mjs?v=campaign-boot-20261112-r3';
import {GROUND} from '../../core.mjs?v=rally-consistency-20261115-r1';
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
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Inner HP fills and duplicate roster boxes are not changes to the safe area.
// Canonical outer rectangles keep damage/labels from invalidating the scale.
function cameraObstacles(rectangles){
 const valid=rectangles.filter(r=>r&&[r.left,r.top,r.right,r.bottom].every(Number.isFinite)&&r.left<r.right&&r.top<r.bottom)
  .map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}));
 return valid.filter((r,i)=>!valid.some((q,j)=>j!==i&&q.left<=r.left&&q.right>=r.right&&q.top<=r.top&&q.bottom>=r.bottom&&(j<i||q.left<r.left||q.right>r.right||q.top<r.top||q.bottom>r.bottom)))
  .sort((a,b)=>a.left-b.left||a.top-b.top||a.right-b.right||a.bottom-b.bottom);
}
export function finaleCameraFrame(width,height,world,{previous=null,occlusions=[],safeRect={left:8,top:8,right:width-8,bottom:height-8},paused=false,camera='classic',cameraMode=camera}={}){
 const mode=cameraMode==='stable'?'stable':'classic',obstacles=cameraObstacles(occlusions);
 const key=JSON.stringify([width,height,safeRect.left,safeRect.top,safeRect.right,safeRect.bottom,obstacles]);
 const old=previous?.arenaProfile==='player-follow'&&previous.arenaGeometryKey===key?previous:null;
 if(paused&&old)return old;
 const retained=world.actors.find(a=>a.id===old?.arenaFocusId&&a.team===0&&a.hp>0);
 const focus=(world.player.hp>0?world.player:retained??world.actors.find(a=>a.team===0&&a.hp>0))??world.actors.find(a=>a.hp>0)??world.player;
 let pocket=old?.arenaPocket;
 if(!pocket){
  // Solve one standing body, once per layout. Remote actors and helper entrance
  // coordinates never affect this scale. A generous deadzone is preferred;
  // on a narrow phone pocket, readability takes priority over camera slack.
  const fit=(rx,ry)=>({...fitChallengeCamera({width,height,x:0,y:-136,zoom:Math.min(1.25,width/520,height/480)},[{x:0,y:ry,depth:0,vy:0,supportY:ry}],null,0,{safeRect,occlusions:obstacles,occlusionPadding:4,cameraMode:'classic',touch:false,measuredCameraSafety:false,prediction:0,head:300+ry*2,halfWidth:132+rx}),reserveX:rx,reserveY:ry});
  pocket=fit(48,24);
  if(pocket.zoom*300*.82<96)pocket=fit(0,0);
 }
 const foot=finalePoint(focus.x,GROUND,focus.depth??0),body=finalePoint(focus.x,focus.y,focus.depth??0),z=pocket.zoom;
 const anchor={x:width/2-pocket.x*z,y:height/2-pocket.y*z};
 const factor=mode==='stable'?1:.5,rx=pocket.reserveX*factor,ry=pocket.reserveY*factor;
 let x=foot.x+pocket.x,y=foot.y+pocket.y;
 if(old&&old.arenaFocusId===focus.id){
  // Follow only when the focused foot leaves the reserved deadzone. This is a
  // minimum correction, so a stationary player never causes camera drift.
  x=clamp(old.x,foot.x+pocket.x-rx,foot.x+pocket.x+rx);
  y=clamp(old.y,foot.y+pocket.y-ry,foot.y+pocket.y+ry);
 }
 // A player's own jump may leave the standing pocket. Move vertically only
 // as much as needed to show that body; never zoom out for anybody's jump.
 y=clamp(y,body.y+pocket.y-ry,body.y+pocket.y+ry);
 return {width,height,x,y,zoom:z,challengeCameraMode:mode,cameraSafetyFit:pocket.cameraSafetyFit,
  arenaProfile:'player-follow',arenaGeometryKey:key,arenaPocket:pocket,arenaFocusId:focus.id,arenaAnchor:anchor,
  left:x-width/(2*z),base:height/2+(GROUND-y)*z};
}
