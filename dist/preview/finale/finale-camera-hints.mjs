import {offscreenOpponentHints} from '../../camera-direction-hints.mjs?v=chapter-presentation-20261117-r1';
import {challengeActorBounds} from '../../challenge-camera.mjs?v=chapter-presentation-20261117-r1';
import {finalePoint,finaleSubject} from './finale-camera.mjs?v=chapter-presentation-20261117-r1';

// Adapt projected copies to the shared edge-label placement. Never hand these
// display poses back to the arena, targeting, attacks, or save authority.
export function finaleOffscreenHints(frame,world,geometry){
 const focus=world.actors.find(a=>a.id===frame.arenaFocusId)??world.player,player=finaleSubject(focus);
 const enemies=world.actors.filter(a=>a.hp>0&&a.team!==focus.team).map(a=>({...finaleSubject(a),spec:{range:2000}}));
 const adapted={...frame,playerCloseCamera:{pose:{x:player.x,displayY:player.y}}};
 const safe=geometry.safeRect??{left:0,top:0,right:frame.width,bottom:frame.height};
 const outside=a=>{const b=challengeActorBounds(a,{prediction:0}),z=frame.zoom;return frame.width/2+(b.left-frame.x)*z<safe.left||frame.width/2+(b.right-frame.x)*z>safe.right||frame.height/2+(b.top-frame.y)*z<safe.top||frame.height/2+(b.bottom-frame.y)*z>safe.bottom;};
 // Use the same perspective as the actual painter, including allies, fallen
 // figures and visible helpers. These are badge blockers, never camera input.
 const occlusions=[...(geometry.occlusions??[])];
 for(const a of [...world.actors,...(world.assists??[]).map(v=>({...v.actor,depth:v.actor.depth??v.owner?.depth??0}))]){
  const p=finalePoint(a.x,a.y,a.depth??0),z=frame.zoom*p.scale,x=frame.width/2+(p.x-frame.x)*frame.zoom,y=frame.height/2+(p.y-frame.y)*frame.zoom;
  const b={left:x-132*z-4,right:x+132*z+4,top:y-300*z-4,bottom:y+28*z+4};
  if(b.left<safe.right&&b.right>safe.left&&b.top<safe.bottom&&b.bottom>safe.top)occlusions.push(b);
 }
 const groups=['left','right'].map(side=>{
  const members=enemies.filter(a=>(a.x<player.x?'left':'right')===side);
  return {members,urgent:members.some(a=>outside(a)&&(a.attack||a.warning>0))};
 }).sort((a,b)=>Number(b.urgent)-Number(a.urgent)),result=[];
 for(const {members,urgent} of groups){
  const hints=offscreenOpponentHints(adapted,{player,enemies:members,assists:[]},{route:true,geometry:{...geometry,occlusions},maxHints:1});
  for(const h of hints){
   result.push({...h,urgent,label:urgent?(h.width>24?'敵方出招':'!'):h.label});
   occlusions.push({left:h.left,top:h.top,right:h.left+h.width,bottom:h.top+h.height});
  }
 }
 return result;
}
export function drawFinaleCameraHints(ctx,hints){
 ctx.save();ctx.font='bold 12px Microsoft JhengHei,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=2;
 for(const h of hints){
  ctx.font=`bold ${h.width<=24?10:12}px Microsoft JhengHei,system-ui`;
  ctx.fillStyle='#fff3d6';ctx.strokeStyle='#8b332c';ctx.beginPath();ctx.roundRect(h.left,h.top,h.width,h.height,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#782b26';ctx.fillText(h.arrow+(h.label?' '+h.label+(h.count>1?'×'+h.count:''):''),h.left+h.width/2,h.top+h.height/2,h.width-6);
 }
 ctx.restore();
}
