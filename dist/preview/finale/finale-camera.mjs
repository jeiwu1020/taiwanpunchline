import {fitChallengeCamera} from '../../challenge-camera.mjs?v=campaign-visuals-20261112-r2';
import {GROUND} from '../../core.mjs?v=campaign-visuals-20261112-r2';
// The finale deliberately frames the whole team fight. The same safety solver
// consumes committed logical HUD/control rectangles; it never rewrites inputs.
export function finaleCameraFrame(width,height,world,{previous=null,delta=1000/60,occlusions=[],safeRect={left:8,top:8,right:width-8,bottom:height-8},paused=false}={}){
 const subjects=[...world.actors.filter(a=>a.hp>0),...world.assists.map(a=>a.actor)];
 if(!subjects.length)subjects.push(world.player);
 const frame=fitChallengeCamera({width,height,x:480,y:GROUND-120,zoom:Math.min(1.4,width/900,height/470)},subjects,previous,delta,{safeRect,occlusions,paused,cameraMode:'classic',touch:false,prediction:.12});
 return {...frame,left:frame.x-width/(2*frame.zoom),base:height/2+(GROUND-frame.y)*frame.zoom};
}
