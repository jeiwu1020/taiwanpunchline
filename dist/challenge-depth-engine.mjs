// Four-way street simulation for chapter routes and the isolated movement trial.
import {ChallengeRoute} from './challenge-engine.mjs?v=campaign-boot-20261112-r3';
import {CAST,GROUND} from './core.mjs?v=campaign-boot-20261112-r3';
import {COMBAT} from './combat-rules.mjs?v=campaign-boot-20261112-r3';
import {RALLY} from './stage-expansion.mjs?v=campaign-boot-20261112-r3';
import {ensureChapterEncounter,updateChapterEncounter,interactChapterProp} from './chapter-encounters.mjs?v=chapter-upgrade-r1';
export const DEPTH=Object.freeze({min:-90,max:100,speed:190,hit:36,rally:48,bodyLane:38,bodyWidth:62,clearance:65,platform:36});
// Side contact uses the neutral lower-body/shadow radius, not a zero-width foot point.
// Keep the actual tabletop support/landing footprint unchanged.
export const TABLE_SIDE_CLEARANCE=44;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const alive=f=>f.hp>0;
const grounded=f=>f.y>=(f.supportY??GROUND)-1&&f.vy>=0;
export const depthDrawOrder=actors=>[...actors].sort((a,b)=>(a.depth??0)-(b.depth??0));
export class ChallengeDepthRoute extends ChallengeRoute {
 constructor(character='wang',difficulty='easy',rng=Math.random,options={}){
  super(character,difficulty,rng,options);
  this.mode='challenge-depth';this.depthMode=true;this.player.depth=0;this.player.invulnerable=0;this.cleared=0;
  // A table occupies a strip of street, never the whole depth of the world.
  this.platforms=this.platforms.map(t=>({...t,depth:t.depth??0,depthHalf:t.depthHalf??DEPTH.platform}));
 }
 attackSharesLane(a,b){return Math.abs((a.depth??0)-(b.depth??0))<=DEPTH.hit;}
 physics(f,dt){
  this.resolveTableMotion(f,{x:f.x,depth:f.depth});
  const all=this.platforms;
  this.platforms=all.filter(t=>Math.abs((f.depth??0)-(t.depth??0))<=(t.depthHalf??DEPTH.platform));
  try{super.physics(f,dt);}finally{this.platforms=all;}
 }
 // Resolve swept body motion against the table sides; landing stays foot-based. Actors
 // above the top may jump onto it; occupants may walk off without snapping.
 resolveTableMotion(f,from){
  if(!from)return;
  for(const axis of ['x','depth']){
   const other=axis==='x'?'depth':'x',start=from[axis]??0,end=f[axis]??0;
   if(start===end)continue;
   let stop=end;
   for(const t of this.platforms){
    if(f.y<=t.y+1)continue;
    const half=t.depthHalf??DEPTH.platform,d=t.depth??0;
    const lo=axis==='x'?t.left-TABLE_SIDE_CLEARANCE:d-half,hi=axis==='x'?t.right+TABLE_SIDE_CLEARANCE:d+half;
    const cross=axis==='x'?(from.depth??0):f.x;
    const otherLo=other==='x'?t.left-TABLE_SIDE_CLEARANCE:d-half,otherHi=other==='x'?t.right+TABLE_SIDE_CLEARANCE:d+half;
    // Boundary contact allows sliding around a corner, not entry through it.
    if(cross<=otherLo||cross>=otherHi)continue;
    const entryLo=axis==='x'?t.left:lo,entryHi=axis==='x'?t.right:hi;
    if(start<=entryLo&&end>lo&&end>start)stop=Math.min(stop,lo);
    else if(start>=entryHi&&end<hi&&end<start)stop=Math.max(stop,hi);
   }
   f[axis]=stop;
  }
  // A saved/spawned actor or an interrupted forced move can begin inside.
  // Recover to the nearest edge, never lift it onto the table or trap it.
  for(const t of this.platforms){
   const half=t.depthHalf??DEPTH.platform,d=t.depth??0,z=f.depth??0;
   const left=t.left-TABLE_SIDE_CLEARANCE,right=t.right+TABLE_SIDE_CLEARANCE;
   if(f.y<=t.y+1||f.x<=left||f.x>=right||z<=d-half||z>=d+half)continue;
   // A partial side overlap recovers sideways, never teleports to another lane.
   const edges=f.x<t.left?[['x',left,f.x-left]]:f.x>t.right?[['x',right,right-f.x]]:[['x',left,f.x-t.left],['x',right,t.right-f.x],['depth',d-half,z-d+half],['depth',d+half,d+half-z]];
   edges.sort((a,b)=>a[2]-b[2]);f[edges[0][0]]=edges[0][1];
  }
 }
 resolveBodies(oldX){super.resolveBodies(oldX);this.resolveTableMotion(this.player,{x:oldX,depth:this.player.depth});}
 separateEnemy(e,dt){
  if(!e.attack)super.separateEnemy(e,dt);
  const previous=this.tablePositions?.get(e);
  if(previous)this.resolveTableMotion(e,{x:previous.x,depth:e.depth});
 }
 bodiesOverlapLane(a,b){return super.bodiesOverlapLane(a,b)&&Math.abs((a.depth??0)-(b.depth??0))<=DEPTH.bodyLane;}
 spawn(){super.spawn();for(const [i,e] of this.enemies.entries())if(e.depth===undefined){e.depth=[0,-65,65,0][i%4];e.invulnerable=0;}}
 press(action){
  const oldAssist=this.assists.length,oldRally=this.rallies.length;
  const ok=super.press(action);if(!ok)return false;
  if(action==='punch'){ensureChapterEncounter(this);interactChapterProp(this);}
  for(const a of this.assists.slice(oldAssist))a.actor.depth=this.player.depth;
  for(const r of this.rallies.slice(oldRally))r.depth=this.player.depth;
  return true;
 }
 hit(source,target,damage,knock=25,options={}){
  const origin=options.origin??source,tolerance=options.category==='rally'?DEPTH.rally:DEPTH.hit;
  if(Math.abs((origin.depth??source.depth??0)-(target.depth??0))>tolerance||target.invulnerable>0)return;
  const before=target.hp,position={x:target.x,depth:target.depth};
  super.hit(source,target,damage,knock,options);
  // Stunned enemies skip movement/separation in the base tick. Clip knockback
  // and defensive retreats at the hit site, before that skip can happen.
  this.resolveTableMotion(target,position);
  if(target===this.player&&target.hp<before){target.invulnerable=.38;}
  if(before>0&&target.hp<=0&&target!==this.player)this.cleared++;
 }
 attackPlayer(dt,actor=this.player,assist=null){
  // Filter contacts before the base attack records per-cast hits. An off-lane
  // opponent never consumes a hit, so moving into the lane can still connect.
  const all=this.enemies,shots=this.projectiles.length,props=this.obstacles.length;
  this.enemies=all.filter(e=>Math.abs((e.depth??0)-(actor.depth??0))<=DEPTH.hit);
  const previousEnemy=this.enemy;
  this.enemy=this.enemies.filter(alive).sort((a,b)=>Math.abs(a.x-actor.x)-Math.abs(b.x-actor.x))[0]??{hp:0,x:actor.x+actor.face*240};
  try{super.attackPlayer(dt,actor,assist);}finally{this.enemies=all;this.enemy=previousEnemy;}
  for(const q of this.projectiles.slice(shots))q.depth=actor.depth??0;
  for(const q of this.obstacles.slice(props))q.depth=actor.depth??0;
 }
 tick(dt,input={}){
  ensureChapterEncounter(this);updateChapterEncounter(this,dt);
  const p=this.player,oldX=p.x,oldDepth=p.depth;
  p.invulnerable=Math.max(0,(p.invulnerable??0)-dt);
  const dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up),diagonal=!!dx&&!!dy;
  const movementAllowed=p.stun<=0&&!p.attack&&!input.guard;
  if(dy&&movementAllowed)p.depth=clamp(p.depth+dy*DEPTH.speed*this.growth.moveMultiplier*(p.slow>0?.75:1)*(diagonal?Math.SQRT1_2:1)*dt,DEPTH.min,DEPTH.max);
  this.resolveTableMotion(p,{x:oldX,depth:oldDepth});
  this.spawn();
  const positions=new Map(this.enemies.map(e=>[e,{x:e.x,depth:e.depth,hp:e.hp}]));
  for(const e of this.enemies){
   if(!alive(e)||e.stun>0||e.attack||this.chapterEncounter?.hazards.some(h=>h.kind==='rush'&&h.owner===e&&!h.dead))continue;
   const delta=p.depth-e.depth;
   if(e.aiWait<.8&&Math.abs(p.x-e.x)<680&&Math.abs(delta)>8)e.depth=clamp(e.depth+Math.sign(delta)*Math.min(Math.abs(delta),72*dt),DEPTH.min,DEPTH.max);
   this.resolveTableMotion(e,positions.get(e));
   if(Math.abs(p.depth-e.depth)>DEPTH.hit)e.aiWait=Math.max(e.aiWait,.2+dt);
  }
  const oldMultiplier=this.growth.moveMultiplier;
  if(diagonal)this.growth.moveMultiplier*=Math.SQRT1_2;
  const hideSupply=!this.supplyUsed&&Math.abs(p.depth-(this.section.supplyDepth??0))>DEPTH.hit;
  if(hideSupply)this.supplyUsed=true;
  this.tablePositions=positions;
  try{super.tick(dt,{...input,down:false,crouch:false});}finally{this.tablePositions=null;this.growth.moveMultiplier=oldMultiplier;if(hideSupply)this.supplyUsed=false;}
  p.crouch=false;p.crouchBlend=0;
  // A walking pose follows displacement, including depth-only approach. An
  // attack, hit reaction or blocked body must not skate with an idle/walk pose.
  const playerMoved=Math.hypot(p.x-oldX,p.depth-oldDepth)>.001;
  p.move=playerMoved&&p.stun<=0?(p.move||p.face):0;
  for(const e of this.enemies){
   const previous=positions.get(e),moved=previous&&Math.hypot(e.x-previous.x,e.depth-previous.depth)>.001;
   e.move=alive(e)&&e.stun<=0&&!e.attack&&moved&&e.hp===previous.hp?e.face:0;
  }
 }
 updateEffects(dt){
  const p=this.player;
  for(const q of this.projectiles)q.depth??=q.owner.depth??0;
  for(const q of this.obstacles){q.life-=dt;for(const e of this.enemies)if(alive(e)&&Math.abs(e.depth-q.depth)<=DEPTH.hit&&grounded(e)&&Math.abs(e.y-q.y)<35&&Math.abs(e.x-q.x)<45&&!q.hits.has(e.id)){q.hits.add(e.id);this.hit(q.owner,e,q.damage,q.knock,{category:'special',impact:'huang_queue',contact:false,origin:q});}}
  this.obstacles=this.obstacles.filter(q=>!q.dead&&q.life>0);
  for(const q of this.projectiles){
   if(q.dead)continue;
   q.age+=dt;const old=q.x;q.x+=q.vx*dt;
   if(q.kind==='dream'&&!q.lob&&q.phase==='outbound'&&Math.abs(q.x-q.originX)>=q.travel){q.phase='return';q.vx=-q.vx;q.hits.clear();q.damage=COMBAT.chen_dream.returnDamage;}
   if(q.lob){q.x=q.targetX;q.y=GROUND-220*(1-q.age/q.flight);if(q.age<q.flight)continue;}
   for(const f of q.owner===p?this.enemies:[p]){
    if(!alive(f)||q.hits.has(f.id)||Math.abs(f.depth-q.depth)>DEPTH.hit)continue;
    const touches=q.lob?Math.abs(f.x-q.targetX)<75&&f.y>GROUND-85: f.x>=Math.min(old,q.x)-32&&f.x<=Math.max(old,q.x)+32&&q.y+13>=f.y-(f.crouch?175:277)&&q.y-13<=f.y-28;
    if(touches){
     // Collision is swept: the projectile may already have crossed the target
     // this frame. Its travel direction, not that overshoot or its owner after
     // moving, determines the side to guard and the direction of knockback.
     const direction=Math.sign(q.vx)||q.face||1,origin={x:f.x-direction,face:direction,depth:q.depth};
     const forward=(origin.x-f.x)*f.face>=0;
     if(f.reject>0&&forward&&['coin','dream'].includes(q.kind)){
      f.reject=0;q.owner=f;q.vx=-q.vx;q.direction=f.face;q.reflected=true;q.hits.clear();q.hits.add(f.id);this.events.push({type:'reflect',f,p:q});break;
     }
     const guarded=f.guard&&grounded(f)&&forward;q.hits.add(f.id);
     this.hit(q.owner,f,q.damage,q.knock,{projectile:true,contact:false,origin,impact:q.kind,assist:this.assists.find(a=>a.id===q.assistId),category:q.category??'special'});
     if(q.slow&&!guarded){f.slow=q.slow;this.events.push({type:'slow',f});}
     q.dead=guarded||q.kind!=='dream';break;
    }
   }
   if(q.lob||q.age>q.life)q.dead=true;
  }
  this.projectiles=this.projectiles.filter(q=>!q.dead);
  for(const a of this.assists){this.physics(a.actor,dt);a.age+=dt;a.phaseAge+=dt;
   if(a.phase==='warning'&&a.age>=a.warning){a.fired=true;a.phase='attack';a.phaseAge=0;
    a.actor.attack={kind:a.kind,age:0,idx:CAST[a.helper].moves.findIndex(m=>m.kind===a.kind),fired:false,routeHits:new Set(),routeDirection:a.actor.face};
    a.actor.performance={kind:a.kind,age:0,duration:COMBAT[a.kind]?.duration??.8};
    this.events.push({type:'assistStart',f:p,helper:a.helper,kind:a.kind,assist:a});
   }
   if(a.phase==='attack'){this.attackPlayer(dt,a.actor,a);if(!a.actor.attack&&!this.projectiles.some(q=>q.assistId===a.id)){a.phase='exit';a.phaseAge=0;a.exitAge=0;}}
   if(a.phase==='exit')a.exitAge+=dt;
  }
  this.assists=this.assists.filter(a=>a.phase!=='exit'||a.exitAge<a.exitDuration);p.assist.active=this.assists.length>0;
  for(const r of this.rallies){r.age+=dt;if(r.age<RALLY.warning)continue;r.previousX=r.x;r.x+=r.direction*RALLY.speed*dt;
   for(const e of this.enemies)if(alive(e)&&Math.abs(e.depth-r.depth)<=DEPTH.rally&&e.y>=GROUND-65&&!r.hits.has(e.id)&&e.x>Math.min(r.previousX,r.x)-70&&e.x<Math.max(r.previousX,r.x)+70){r.hits.add(e.id);this.hit(p,e,RALLY.damage,32,{category:'rally',impact:'rally',contact:false,origin:{x:r.x,face:r.direction,depth:r.depth}});}
  }
  this.rallies=this.rallies.filter(r=>r.age<RALLY.duration);
 }
}

