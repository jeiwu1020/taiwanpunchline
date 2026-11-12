import {challengeActorBounds,challengeCameraSubjects} from './challenge-camera.mjs?v=post69-street-seam-cull-20261112-r1';
// Display-only logical canvas geometry. Badges never become camera blockers.
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const valid=r=>r&&[r.left,r.right,r.top,r.bottom].every(Number.isFinite)&&r.left<r.right&&r.top<r.bottom;
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function project(frame,r){return {left:frame.width/2+(r.left-frame.x)*frame.zoom,right:frame.width/2+(r.right-frame.x)*frame.zoom,top:frame.height/2+(r.top-frame.y)*frame.zoom,bottom:frame.height/2+(r.bottom-frame.y)*frame.zoom};}
function slot(side,width,safe,blockers){
 const height=24,maxX=safe.right-width,maxY=safe.bottom-height;if(maxX<safe.left||maxY<safe.top)return null;
 const edge=side==='left'?safe.left:maxX,middle=(safe.top+safe.bottom-height)/2;
 // Rectangle edges enumerate the open slots, including narrow gaps that a
 // fixed pixel grid could miss. Prefer the matching edge, then middle height.
 const xs=[edge,safe.left,maxX],ys=[middle,safe.top,maxY];
 for(const r of blockers){xs.push(r.left-width,r.right);ys.push(r.top-height,r.bottom);}
 const xValues=[...new Set(xs.map(x=>clamp(x,safe.left,maxX)))],yValues=[...new Set(ys.map(y=>clamp(y,safe.top,maxY)))];let best=null,cost=Infinity;
 for(const left of xValues)for(const top of yValues){const r={left,top,right:left+width,bottom:top+height};if(blockers.some(b=>overlaps(r,b)))continue;const next=Math.abs(left-edge)*2+Math.abs(top-middle);if(next<cost){cost=next;best={left,top,width,height};}}
 return best;
}
export function offscreenOpponentHints(frame,world,{route=false,geometry,maxHints=2}={}){
 if(!(frame?.playerFixedCamera||frame?.playerCloseCamera)||!world?.player||!geometry||!(frame.zoom>0))return [];
 const width=finite(geometry.width,frame.width),height=finite(geometry.height,frame.height),r=geometry.safeRect;
 const safe={left:Math.max(0,finite(r?.left)),top:Math.max(0,finite(r?.top)),right:Math.min(width,finite(r?.right,width)),bottom:Math.min(height,finite(r?.bottom,height))};if(!valid(safe))return [];
 const limit=clamp(Math.floor(finite(maxHints,2)),0,2),player=frame.playerCloseCamera??frame.playerFixedCamera,z=frame.zoom;
 const px=frame.width/2+(player.pose.x-frame.x)*z,py=frame.height/2+(player.pose.displayY-frame.y)*z;
 const blockers=(geometry.occlusions||[]).filter(valid).map(r=>({...r}));
 blockers.push({left:px-132*z,right:px+132*z,top:py-300*z,bottom:py+28*z});
 const live=route?(Array.isArray(world.enemies)?world.enemies:[world.enemy]):[world.enemy],subjects=route?new Set(challengeCameraSubjects(world,{route:true})):null;
 const helpers=new Set((world.assists||[]).map(a=>a.actor)),groups=new Map();
 for(const enemy of new Set(live)){
  if(!enemy||enemy===world.player||!(enemy.hp>0)||enemy.helper||helpers.has(enemy)||route&&!subjects.has(enemy))continue;
  const proxy=project(frame,challengeActorBounds(enemy,{prediction:0}));if(!valid(proxy))continue;
  const horizontal=proxy.left<safe.left?-1:proxy.right>safe.right?1:0,vertical=proxy.top<safe.top?-1:proxy.bottom>safe.bottom?1:0;
  if(!horizontal&&!vertical)continue;
  const side=enemy.x<player.pose.x?'left':'right',distance=Math.hypot(enemy.x-player.pose.x,finite(enemy.y,430)+finite(enemy.depth)*.65-player.pose.displayY);
  const arrow=vertical<0?(horizontal<0?'↖':horizontal>0?'↗':'↑'):vertical>0?(horizontal<0?'↙':horizontal>0?'↘':'↓'):(horizontal<0?'←':'→');
  const prior=groups.get(side);groups.set(side,{count:(prior?.count||0)+1,...(!prior||distance<prior.distance?{distance,arrow}:{distance:prior.distance,arrow:prior.arrow})});
 }
 const result=[];
 for(const side of ['left','right']){const group=groups.get(side);if(!group||result.length>=limit)continue;
  const place=slot(side,88,safe,blockers)||slot(side,24,safe,blockers);if(!place)continue;
  result.push({key:side,arrow:group.arrow,label:place.width===88?(route?'敵人':'對手'):'',count:group.count,...place});blockers.push({...place,right:place.left+place.width,bottom:place.top+place.height});
 }
 return result;
}
export function mountCameraDirectionHints({document,root}){
 const container=document.createElement('div');container.className='camera-direction-hints';container.setAttribute('aria-hidden','true');container.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5';
 const badges=Array.from({length:2},()=>{const el=document.createElement('span');el.className='camera-direction-hint';el.setAttribute('aria-hidden','true');el.hidden=true;el.style.cssText='position:absolute;pointer-events:none;background:#fff5dc;color:#173239;border:2px solid #173239;border-radius:4px;font:bold 12px sans-serif;line-height:20px;text-align:center;white-space:nowrap;overflow:hidden;box-sizing:border-box';container.append(el);return el;});root.append(container);
 let geometry=null,destroyed=false;
 const clear=()=>{for(const el of badges)if(!el.hidden)el.hidden=true;};
 return {setGeometry(next){geometry=next?{...next,origin:{...next.origin},safeRect:{...next.safeRect},occlusions:(next.occlusions||[]).map(r=>({...r}))}:null;},update(frame,world,{route=false,active=true}={}){
  if(destroyed)return;const hints=active?offscreenOpponentHints(frame,world,{route,geometry}):[];
  badges.forEach((el,i)=>{const h=hints[i];if(!h){if(!el.hidden)el.hidden=true;return;}
   const text=h.arrow+(h.label?' '+h.label+(h.count>1?' ×'+(h.count>99?'99+':h.count):''):'');if(el.textContent!==text)el.textContent=text;
   const origin=geometry.origin||{};for(const [key,value]of Object.entries({left:h.left+finite(origin.left),top:h.top+finite(origin.top),width:h.width,height:h.height})){const px=value+'px';if(el.style[key]!==px)el.style[key]=px;}if(el.hidden)el.hidden=false;
  });
 },clear,destroy(){if(destroyed)return;destroyed=true;container.remove();geometry=null;}};
}
