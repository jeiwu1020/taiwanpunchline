import {Duel,CAST,GROUND} from '../../core.mjs?v=rally-consistency-20261115-r1';
import {COMBAT,GRAVITY} from '../../combat-rules.mjs?v=campaign-boot-20261112-r3';
import {CHARACTER_IDS} from '../campaign/core/catalog.mjs?v=campaign-boot-20261112-r3';
import {RALLY} from '../../stage-expansion.mjs?v=rally-consistency-20261115-r1';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const alive=f=>f.hp>0;
const lane=(a,b,tolerance=36)=>Math.abs((a.depth??0)-(b.depth??0))<=tolerance;
const ground=f=>f.y>=GROUND-1&&f.vy>=0;
export const ARENA=Object.freeze({left:68,right:892,back:-135,front:135,duration:150});

/** Seven world actors, with the accepted Duel's cast, defense and damage rules.
 * Only team targeting, four-way world iteration, AI and victory are new here.
 * No changes are made to the existing two-fighter or street simulations. */
export class FinaleArena extends Duel{
 constructor({team=['wang','han','huang'],difficulty='easy',rng=Math.random,statsForCharacter}={}){
  if(!Array.isArray(team)||team.length!==3||new Set(team).size!==3||!team.every(id=>CHARACTER_IDS.includes(id)))throw new RangeError('Choose three distinct fighters');
  if(!['beginner','easy','hard'].includes(difficulty))throw new RangeError('Unknown difficulty');
  const opponents=CHARACTER_IDS.filter(id=>!team.includes(id));
  super(team[0],difficulty,rng,opponents[0],{playerStats:statsForCharacter?.(team[0])});
  this.mode='finale';this.depthMode=true;this.team=[...team];this.aiEnabled=true;this.remaining=ARENA.duration;this.nextItemAt=Infinity;
  this.actors=[this.player,...[...team.slice(1),...opponents].map(id=>new Duel(id,difficulty,rng,team[0],{playerStats:team.includes(id)?statsForCharacter?.(id):undefined}).player)];
  const positions=[[210,0],[150,-90],[150,90],[690,-105],[770,-35],[770,45],[690,115]];
  this.actors.forEach((f,i)=>{
   const same=team.includes(f.type);
   Object.assign(f,{id:i===0?'player':'arena-'+f.type,team:same?0:1,x:positions[i][0],depth:positions[i][1],aiWait:.7+i*.11,invulnerable:0});
   f.assist={helper:null,used:false,active:false,charge:0,damageTaken:0};
  });
  this.enemy=this.targetFor(this.player);this.enemies=this.actors.filter(f=>f.team===1);this.platforms=[];this.routeProgress=0;
 }
 targetFor(f){
  return this.actors?.filter(t=>t!==f&&t.team!==f.team&&alive(t)).sort((a,b)=>Math.hypot(a.x-f.x,(a.depth-f.depth)*1.6)-Math.hypot(b.x-f.x,(b.depth-f.depth)*1.6)||a.id.localeCompare(b.id))[0]??null;
 }
 other(f){
  if(!this.actors)return super.other(f);
  const forced=this.contactPair??this.projectilePair;
  if(forced){if(f===forced.from)return forced.to;if(f===forced.to)return forced.from;}
  return this.targetFor(f)??this.actors.find(t=>t.team!==f.team)??super.other(f);
 }
 request(f,action){
  if(action==='assist')return false;
  if(!this.actors)return super.request(f,action);
  if(!this.actors.includes(f)||!alive(f)||!this.targetFor(f))return false;
  const enemy=this.enemy;this.enemy=f===this.player?this.targetFor(f):f;
  const before=this.assists.length,count=this.rallies.length;
  try{return super.request(f,action);}finally{
   for(const a of this.assists.slice(before)){a.actor.depth=f.depth;a.actor.team=f.team;}
   for(const r of this.rallies.slice(count))r.depth=f.depth;
   this.enemy=enemy;
  }
 }
 // All seven fighters are already on the field. Block both the ordinary
 // command path and direct calls to the inherited helper API.
 assistReady(){return false;}
 requestAssist(){return false;}
 canMelee(c){return c.from.team!==c.to.team&&alive(c.to)&&lane(c.origin??c.from,c.to)&&super.canMelee(c);}
 resolveHit(c){
  if(!alive(c.to)||c.from.team===c.to.team||!lane(c.p??c.rally??c.origin??c.from,c.to,c.rally?48:36))return false;
  const old=this.contactPair;this.contactPair={from:c.from,to:c.to};
  const scale=c.from.team===1?(this.difficulty==='beginner'?.55:this.difficulty==='easy'?.8:1):1;
  try{return super.resolveHit({...c,raw:c.raw*scale,groundDamage:c.groundDamage==null?undefined:c.groundDamage*scale,airDamage:c.airDamage==null?undefined:c.airDamage*scale});}finally{this.contactPair=old;}
 }
 launch(f,a,m,o,assist){super.launch(f,a,m,o,assist);const p=this.projectiles.at(-1);p.depth=f.depth??0;p.originDepth=p.depth;p.targetDepth=o.depth??0;}
 moveFighter(f,x){f.x=clamp(x,ARENA.left,ARENA.right);}
 separate(){
  if(!this.actors)return;
  const live=this.actors.filter(alive);
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j];if(!lane(a,b,30)||Math.abs(a.y-b.y)>160||Math.abs(a.x-b.x)>=78)continue;
   const dir=a.x<b.x?-1:a.x>b.x?1:a.id<b.id?-1:1,push=(78-Math.abs(a.x-b.x))/2;
   this.moveFighter(a,a.x+dir*push);this.moveFighter(b,b.x-dir*push);
  }
 }
 updateProjectiles(dt){
  const all=this.projectiles;
  for(const p of all){
   if(p.dead)continue;
   if(p.phase==='lob')p.depth=p.originDepth+(p.targetDepth-p.originDepth)*Math.min(1,(p.age+dt)/p.flight);
   const next=p.x+p.vx*dt,depth=p.phase==='lob'?p.targetDepth:p.depth;
   const candidates=this.actors.filter(t=>alive(t)&&t.team!==p.owner.team&&Math.abs(t.depth-depth)<=36);
   const target=candidates.sort((a,b)=>Math.abs(a.x-(p.phase==='lob'?p.targetX:(p.x+next)/2))-Math.abs(b.x-(p.phase==='lob'?p.targetX:(p.x+next)/2)))[0]??this.targetFor(p.owner);
   if(!target){p.dead=true;continue;}
   this.projectilePair={from:p.owner,to:target};this.projectiles=[p];
   const queues=this.obstacles;this.obstacles=queues.filter(q=>q.owner.team!==p.owner.team&&lane(p,q));
   try{super.updateProjectiles(dt);}finally{this.projectilePair=null;this.projectiles=all;this.obstacles=queues;}
  }
 }
 projectileTouches(p,f,x,y){return lane(p,f)&&super.projectileTouches(p,f,x,y);}
 queueCrossings(f,previous,next){
  if(!ground(f))return;
  for(const q of this.obstacles)if(!q.dead&&q.owner.team!==f.team&&lane(q,f)&&Math.min(previous,next)<=q.x+18&&Math.max(previous,next)>=q.x-18){q.dead=true;this.contacts.push({from:q.owner,to:f,raw:q.damage,knock:q.knock,height:'low',contact:false,impact:'huang_queue',castId:q.castId,direction:q.direction,guardCost:1,origin:q});}
 }
 animateAttack(f,dt,context){
  const source=this.effectSource,origin=this.effectOrigin;this.effectSource=context?.owner??f;this.effectOrigin=f;
  try{return super.animateAttack(f,dt,context);}finally{this.effectSource=source;this.effectOrigin=origin;}
 }
 stageWorld(effect,spawn=false){
  const source=this.effectSource,origin=this.effectOrigin;
  return super.stageWorld(()=>{
   const queues=this.obstacles,shots=this.projectiles;
   if(!spawn&&source){
    this.obstacles=queues.filter(q=>q.owner.team!==source.team&&lane(q,origin));
    this.projectiles=shots.filter(p=>p.owner.team!==source.team&&lane(p,origin));
   }
   const count=this.obstacles.length;
   try{effect();for(const q of this.obstacles.slice(count))q.depth=q.owner.depth??0;}
   finally{
    // Changes to existing objects survive filtering; any genuinely new world
    // objects are merged without duplicating or discarding unrelated lanes.
    for(const q of this.obstacles)if(!queues.includes(q))queues.push(q);
    for(const p of this.projectiles)if(!shots.includes(p))shots.push(p);
    this.obstacles=queues;this.projectiles=shots;
   }
  },spawn);
 }

 aiInputFor(f,dt){
  const t=this.targetFor(f);if(!t)return {};
  f.aiWait=Math.max(0,f.aiWait-dt);const dx=t.x-f.x,dz=t.depth-f.depth;
  const move={left:dx< -110,right:dx>110,up:dz< -12,down:dz>12};
  if(f.stun>0||f.guardBroken>0||f.attack)return {};
  if(t.attack&&Math.abs(dx)<190&&lane(f,t)&&this.rng()<dt*3)return {guard:true};
  if(f.aiWait===0&&Math.abs(dx)<340&&Math.abs(dz)<55){
   const interval=f.team===1?(this.difficulty==='beginner'?1.6:this.difficulty==='easy'?1.0:.7):.8;
   f.aiWait=interval+this.rng()*.5;
   if(f.rally>=100&&this.rng()<.45)this.request(f,'rally');
   else{
    const available=CAST[f.type].moves.map((m,i)=>({m,i})).filter(({m,i})=>f.cooldowns[i]<=0&&(Math.abs(dx)<(m.range??340)||['projectile','lob','word'].includes(m.behavior))&&(m.behavior!=='heal'||f.hp<f.maxHp-10));
    const pick=available[Math.min(available.length-1,Math.floor(this.rng()*available.length))];
    this.request(f,pick&&this.rng()<.7?'special'+(pick.i+1):'punch');
   }
  }return move;
 }
 step(delta,input={}){
  if(this.status!=='active')return;
  const dt=Math.min(.034,Math.max(0,delta));if(!dt)return;
  if(this.freeze>0){this.freeze=Math.max(0,this.freeze-dt);return;}
  this.elapsed+=dt;this.remaining=Math.max(0,this.remaining-dt);this.collecting=true;this.contacts=[];this.worldSpawns=[];this.worldEffects=[];
  const positions=new Map(this.actors.map(f=>[f,f.x]));
  for(const f of this.actors){
   if(!alive(f)){f.attack=null;f.performance=null;this.setGuard(f,false);continue;}
   for(const k of ['land','basicTime','reaction','stun','flash','counter','brace','armor','slow','calm','reject','comboTime','guardBroken','guardGrace','grabPose','grabbedPose'])f[k]=Math.max(0,f[k]-dt);
   if(f.guardBroken===0&&f.guardPips===0){f.guardPips=2;f.guardGrace=.65;}
   f.cooldowns=f.cooldowns.map(t=>Math.max(0,t-dt));
   if(f.performance){const p=f.performance;p.age=f.attack?.castId===p.castId?f.attack.age+dt:p.age+dt;p.outcomeAge+=dt;if(p.age>=p.duration)f.performance=null;}
   const keys=f===this.player?input:this.aiEnabled?this.aiInputFor(f,dt):{};
   this.setInput(f,{...keys,down:false,crouch:false},dt);
   const dx=Number(!!keys.right)-Number(!!keys.left),dz=Number(!!keys.down)-Number(!!keys.up),norm=dx&&dz?Math.SQRT1_2:1;
   if(!f.attack&&!f.stun&&!f.guardBroken){
    const target=this.targetFor(f);if(target)f.face=target.x>=f.x?1:-1;
    const speed=(f.guard?85:245)*f.combatStats.moveMultiplier*(f.slow>0?.75:1)*dt*norm;
    this.moveFighter(f,f.x+dx*speed);f.depth=clamp(f.depth+dz*speed,ARENA.back,ARENA.front);f.move=dx||dz?f.face:0;
   }
   if(f.y<GROUND||f.vy<0){f.vy+=GRAVITY*dt;f.y+=f.vy*dt;if(f.y>=GROUND){f.y=GROUND;f.vy=0;f.land=.18;}}
   f.supportY=GROUND;
   if(f.attack)this.animateAttack(f,dt);
   this.moveFighter(f,f.x);
   if(!f.guard&&!f.guardBroken&&this.elapsed-f.guardBlockedAt>=1.2&&this.elapsed-f.guardReleasedAt>=1.2){f.guardRegen+=dt;if(f.guardRegen>=.8){f.guardPips=Math.min(3,f.guardPips+1);f.guardRegen=0;}}
  }
  if(this.buffer){this.buffer.ttl-=dt;if(this.buffer.ttl<=0||this.request(this.player,this.buffer.action))this.buffer=null;}
  this.updateAssists(dt);this.separate();
  for(const spawn of this.worldSpawns)spawn();for(const effect of this.worldEffects)effect();this.worldSpawns=[];this.worldEffects=[];
  this.contacts=this.contacts.filter(c=>this.canMelee(c));
  for(const q of this.obstacles)q.life-=dt;for(const f of this.actors.filter(alive))this.queueCrossings(f,positions.get(f),f.x);
  this.updateProjectiles(dt);
  for(const r of this.rallies){
   const old=r.x;r.age+=dt;r.x+=r.direction*RALLY.speed*Math.max(0,r.age-Math.max(r.age-dt,RALLY.warning));
   if(!r.fired&&r.age>=RALLY.warning){const t=this.actors.filter(f=>alive(f)&&f.team!==r.owner.team&&lane(r,f,48)&&ground(f)&&f.x>=Math.min(old,r.x)-RALLY.radius&&f.x<=Math.max(old,r.x)+RALLY.radius).sort((a,b)=>Math.abs(a.x-old)-Math.abs(b.x-old))[0];if(t){r.fired=true;this.contacts.push({from:r.owner,to:t,raw:RALLY.damage,knock:32,height:'mid',contact:false,impact:'rally',castId:r.castId,direction:r.direction,guardCost:1,rally:r});}}
  }
  this.collecting=false;this.resolveContacts();
  this.projectiles=this.projectiles.filter(p=>!p.dead&&p.life>0&&p.x>-100&&p.x<1060&&p.y<500);this.obstacles=this.obstacles.filter(p=>!p.dead&&p.life>0);this.rallies=this.rallies.filter(r=>r.age<RALLY.duration&&r.x> -120&&r.x<1080);
  this.enemy=this.targetFor(this.player)??this.enemies.find(alive)??this.enemies[0];
  this.finish();
 }
 finish(){
  if(!this.actors||this.status!=='active')return;
  const teams=[0,1].map(team=>this.actors.filter(f=>f.team===team&&alive(f)));
  if(teams.every(t=>t.length)&&this.remaining>0)return;
  if(!teams[0].length||!teams[1].length)this.winner=teams[0].length?'player':teams[1].length?'enemy':'draw';
  else{const count=teams[0].length-teams[1].length,hp=teams[0].reduce((n,f)=>n+f.hp/f.maxHp,0)-teams[1].reduce((n,f)=>n+f.hp/f.maxHp,0),diff=count||hp;this.winner=Math.abs(diff)<1e-10?'draw':diff>0?'player':'enemy';}
  this.status='over';this.buffer=null;this.events.push({type:'over',winner:this.winner});
 }
 drainEvents(){return this.events.splice(0);}
}
