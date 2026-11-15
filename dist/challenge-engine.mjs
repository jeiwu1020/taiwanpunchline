import {Duel,GROUND,CAST} from './core.mjs?v=rally-consistency-20261115-r1';
import {stepChapterMob} from './chapter-encounters.mjs?v=street-object-polish-r2';
import {chooseAssistMove,ASSIST_WARNING,ASSIST_EXIT,ASSIST_RECHARGE_RATIO} from './assist-rules.mjs?v=campaign-boot-20261112-r3';
import {RALLY} from './stage-expansion.mjs?v=rally-consistency-20261115-r1';
import {COMBAT,JUMP_SPEED,GRAVITY} from './combat-rules.mjs?v=campaign-boot-20261112-r3';
import {CHALLENGE_SECTIONS,MOB_TYPES,CHALLENGE_DIFFICULTY} from './challenge-content.mjs?v=rally-consistency-20261115-r1';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const alive=f=>f.hp>0;
const grounded=f=>f.y>=(f.supportY??GROUND)-1&&f.vy>=0;
/** A separate world-space simulation. Duel mode remains completely untouched. */
export class ChallengeRoute {
 constructor(character='wang',difficulty='easy',rng=Math.random,options={}){
  this.sectionIndex=options.section??0;this.section=CHALLENGE_SECTIONS[this.sectionIndex];
  if(!this.section)throw new RangeError('Unknown route section');
  this.duel=new Duel(character,difficulty,rng,'han',{playerAssist:options.playerAssist??null,playerStats:options.stats});
  this.player=this.duel.player;this.player.x=140;
  this.player.hp=clamp(options.carry?.hp??this.player.maxHp,0,this.player.maxHp);
  this.player.rally=clamp(options.carry?.rally??0,0,100);
  if(options.carry?.assist)this.player.assist={...this.player.assist,...options.carry.assist,active:false};
  this.attackMultiplier=clamp(options.stats?.attackMultiplier??1,1,1.25);
  this.growth={...this.player.combatStats,maxHp:this.player.maxHp};
  this.difficulty=difficulty;this.tuning=CHALLENGE_DIFFICULTY[difficulty==='normal'?'hard':difficulty]??CHALLENGE_DIFFICULTY.easy;
  this.rng=rng;this.worldWidth=this.section.width;this.platforms=this.section.platforms??[];this.cameraX=0;this.elapsed=0;this.remaining=Infinity;this.status='active';this.winner=null;
  this.enemies=[];this.enemy=this.duel.enemy;this.enemy.hp=0;this.enemy.x=99999;
  this.projectiles=[];this.assists=[];this.rallies=[];this.obstacles=[];this.items=[];this.events=[];this.worldEffects=[];this.worldSpawns=[];
  this.spawned=new Set();this.nextCast=1;this.runId=options.runId??'chapter-1';this.supplyUsed=false;this.stats={hits:0,damage:0,blocks:0,maxCombo:0,specialHits:0,interrupts:0,counters:0};
 }
 get routeProgress(){return clamp((this.player.x-140)/(this.worldWidth-280),0,1);}
 get gateX(){return this.worldWidth-140;}
 // 45-unit supply artwork plus the fighter's 37-unit foot/shadow width.
 canCollectSupply(f=this.player){return Number.isFinite(this.section.supplyX)&&Math.abs(f.x-this.section.supplyX)<=82;}
 other(f){return f===this.player?this.enemy:this.player;}
 drainEvents(){return this.events.splice(0);}
 exportCarry(){return {hp:this.player.hp,rally:this.player.rally,assist:{...this.player.assist,active:false}};}
 assistReady(f=this.player){return f===this.player&&this.status==='active'&&!!f.assist?.helper&&!f.assist.active&&!f.assist.used;}
 press(action){
  const p=this.player;if(this.status!=='active'||p.stun>0||p.guardBroken>0)return false;
  if(action==='assist'){
   if(!this.assistReady()||p.attack||p.guard||!grounded(p))return false;
   p.assist.used=true;p.assist.active=true;p.assist.charge=0;p.assist.damageTaken=0;
   const actor=new Duel(p.assist.helper,'easy',this.rng).player;actor.x=p.x-p.face*65;actor.face=p.face;actor.y=p.y;actor.supportY=p.supportY;
   const move=chooseAssistMove(p.assist.helper,this.rng);const assist={id:this.nextCast++,owner:p,target:this.enemy,helper:p.assist.helper,actor,kind:move.kind,name:move.name,move,age:0,warning:ASSIST_WARNING,exitDuration:ASSIST_EXIT,exitAge:0,phase:'warning',phaseAge:0,fired:false};this.assists.push(assist);
   this.events.push({type:'assistWarning',f:p,helper:p.assist.helper,kind:assist.kind,assist});return true;
  }
  if(action==='rally'){
   if(p.rally<100||p.attack||p.guard)return false;p.rally=0;
   this.rallies.push({owner:p,age:0,x:p.x-p.face*240,previousX:p.x-p.face*240,direction:p.face,castId:this.nextCast++,hits:new Set()});
   this.events.push({type:'rally',f:p});return true;
  }
  if(action==='jump'){
   if(!grounded(p)||p.attack)return false;p.vy=-JUMP_SPEED;p.guard=false;this.events.push({type:'jump',f:p});return true;
  }
  // Delegate acceptance/cooldowns/animation signatures, not the two-person simulation.
  this.duel.enemy=this.enemy;this.duel.status='active';const face=p.face;
  const ok=this.duel.request(p,action);p.face=face;
  if(ok&&p.attack){p.attack.routeHits=new Set();p.attack.routeDirection=face;}
  this.events.push(...this.duel.events.splice(0));return ok;
 }
 spawn(){
  this.section.spawns.forEach(([kind,x,trigger],i)=>{
   if(this.spawned.has(i)||this.player.x<(trigger??x-560))return;this.spawned.add(i);
   const spec=MOB_TYPES[kind];const f=new Duel('wang','easy',this.rng).enemy;delete f.combatStats;
   Object.assign(f,{id:`${this.section.id}-${i}`,mobKind:kind,name:spec.name,x,hp:spec.hp,maxHp:spec.hp,spec,aiWait:.65,deadAge:0,warning:0});
   this.enemies.push(f);this.events.push({type:'mobSpawn',f});
  });
 }
 hit(source,target,damage,knock=25,{projectile=false,ignoreGuard=false,category='basic',impact='punch',assist=null,origin=source,noDefense=false,contact=true,height='mid',castId=null}={}){
  if(!alive(target))return;
  const dir=Math.sign(target.x-origin.x)||origin.face||1,forward=(origin.x-target.x)*target.face>=0;
  const normal=!ignoreGuard&&!noDefense;
  if(target===this.player&&target.counter>0&&normal&&forward&&contact&&!projectile){
   const kind=target.attack?.kind??'counter',rule=COMBAT[kind]?.behavior==='counter'?COMBAT[kind]:COMBAT.counter;
   target.counter=0;target.attack=null;target.performance=null;this.events.push({type:'counter',f:target,kind});
   this.hit(target,source,rule.damage,rule.knock,{category:'special',impact:kind,noDefense:true});
   if(rule.retreat)target.x=clamp(target.x-target.face*rule.retreat,50,this.worldWidth-55);return;
  }
  if(target===this.player&&target.reject>0&&normal&&forward){target.reject=0;this.events.push({type:'reject',f:target});return;}
  const defense=target===this.player?this.growth.defenseMultiplier:1;
  const offense=source===this.player?this.attackMultiplier*(this.growth[category+'Multiplier']??1):this.tuning.damage;
  const blocking=target.guard&&normal&&grounded(target)&&forward;
  let amount=blocking?2:damage*offense,armored=false;
  if(blocking){knock=5;this.stats.blocks++;target.guardPips=Math.max(0,target.guardPips-1);if(target.guardPips===0){target.guard=false;target.guardBroken=.38;this.events.push({type:'guardBreak',f:target});}}
  if(!blocking&&normal&&target.armor>0){amount=Math.round(amount*.6);target.armor=0;target.brace=0;knock=0;armored=true;this.events.push({type:'armorAbsorb',f:target,amount});}
  else if(!blocking&&normal&&target.calm>0){amount=Math.min(4,amount);target.calm=0;knock=COMBAT.chen_calm.retreat;this.events.push({type:'calm',f:target});}
  amount*=defense;
  const hpBefore=target.hp;target.hp=Math.max(0,target.hp-amount);amount=hpBefore-target.hp;
  if(target===this.player&&target.assist.helper&&target.assist.used){const needed=target.maxHp*ASSIST_RECHARGE_RATIO;target.assist.damageTaken=Math.min(needed,(target.assist.damageTaken??0)+amount);target.assist.charge=target.assist.damageTaken/needed*100;if(target.assist.damageTaken+Number.EPSILON*target.maxHp*8>=needed){target.assist.damageTaken=needed;target.assist.charge=100;target.assist.used=false;}}target.flash=.15;target.reaction=.24;target.reactionKind='hit';target.x=clamp(target.x+dir*knock,50,this.worldWidth-55);
  if(!blocking&&!armored){target.stun=.16;target.attack=null;target.warning=0;}
  if(source===this.player){if(!blocking&&category!=='rally')this.player.rally=clamp(this.player.rally+Math.min(25,amount*2.5),0,100);this.stats.hits++;this.stats.damage+=amount;if(category==='special'||category==='assist')this.stats.specialHits++;}
  this.events.push({type:blocking?'block':'hit',f:source,from:source,to:target,source,damage:amount,amount,combo:1,impact,assist:!!assist,assistId:assist?.id,helper:assist?.helper});
  if(!alive(target)){
   target.attack=null;target.guard=false;target.warning=0;
   if(target===this.player){this.status='lost';this.winner='enemy';this.events.push({type:'routeLost'});}
   else this.events.push({type:'enemyDefeated',f:target,encounterId:target.id,key:`${this.runId}:${target.id}`,characterId:this.player.type,xp:target.spec.xp,cp:target.spec.cp});
  }
 }
 attackSharesLane(){return true;}
 attackPlayer(dt,actor=this.player,assist=null){
  const p=actor,a=p.attack;if(!a)return;const owner=assist?this.player:p;
  const rule=COMBAT[a.kind]??{...CAST[p.type].moves[a.idx],behavior:'melee'};
  const before=a.age;a.age+=dt;const crossed=t=>before<t&&a.age>=t;
  if(p.performance)p.performance.age=a.age;
  p.lowProfile=grounded(p)&&(p.crouch||(a.kind==='rush'&&a.age>=.16&&a.age<=.50)||(a.kind==='han_knee'&&a.age>=.12&&a.age<.98));
  if(rule.behavior==='rush'||rule.behavior==='advance'){
   if(a.age>=(rule.advanceStart??rule.start)&&a.age<=(rule.advanceEnd??rule.end))p.x+=p.face*(rule.speed??250)*dt;
  }
  for(const s of rule.steps??[])if(a.age>=s.start&&a.age<=s.end)p.x+=p.face*s.speed*dt;
  if(crossed(rule.start??.2)){
   if(rule.behavior==='heal'){const before=p.hp;p.hp=Math.min(p.maxHp,p.hp+(rule.heal??10));this.events.push({type:'heal',f:p,amount:p.hp-before});}
   else if(['counter','reject','calm','armor'].includes(rule.behavior)){p[rule.behavior]=rule.behavior==='armor'?1:(rule.window??.5);if(rule.behavior==='armor')this.events.push({type:'armor',f:p});}
   else if(rule.behavior==='queue'){this.obstacles.push({owner,x:p.x+p.face*rule.range,y:p.supportY??GROUND,life:rule.life,damage:rule.damage,knock:rule.knock,hits:new Set(),dead:false});this.events.push({type:'queuePlant',f:owner});}
   else if(['projectile','lob','word'].includes(rule.behavior)){
    const lob=rule.behavior!=='projectile';const target=this.enemy;
    this.projectiles.push({owner,assistId:assist?.id,category:assist?'assist':'special',slow:rule.slow??0,travel:rule.travel??0,originX:p.x+p.face*50,kind:rule.projectileKind??(rule.behavior==='word'?'word':a.kind),x:p.x+p.face*50,y:p.y-252,vx:p.face*(rule.speed??400),age:0,life:rule.life??1.5,damage:rule.damage??12,knock:rule.knock??30,face:p.face,direction:p.face,travelDir:p.face,gravity:0,vy:0,radius:13,phase:lob?'lob':'outbound',hits:new Set(),lob,targetX:clamp(target.hp>0?target.x:p.x+p.face*240,50,this.worldWidth-50),flight:rule.flight??.8,dead:false});
   }
  }
  const strikes=rule.hits??[{start:rule.start??.1,end:rule.end??((rule.start??.1)+.14),damage:rule.damage??10,knock:rule.knock??25,height:rule.height}];
  if(['melee','grab','combo','rush','advance'].includes(rule.behavior))strikes.forEach((s,i)=>{
   if(a.age<s.start||before>(s.end??s.start+.12))return;
   if(rule.erase){for(const q of this.projectiles)if(q.owner!==owner&&!q.dead&&this.attackSharesLane(p,q)&&(q.x-p.x)*p.face>=0&&Math.abs(q.x-p.x)<rule.range&&Math.abs(q.y-(p.y-252))<55){q.dead=true;this.events.push({type:'erase',f:owner,p:q});break;}}
   for(const e of this.enemies){const key=`${i}:${e.id}`,dx=(e.x-p.x)*a.routeDirection;
    const height=s.height??rule.height??'mid';
    if(!alive(e)||a.routeHits.has(key)||dx<0||dx>=(rule.range??130))continue;
    if((height==='low'||height==='grab')&&(!grounded(p)||!grounded(e)||Math.abs(p.y-e.y)>=35))continue;
    if(height==='high'&&e.lowProfile)continue;
    if(Math.abs(p.y-e.y)>=(rule.antiAir?250:140))continue;
    if(rule.behavior==='grab'){p.grabPose=.22;e.grabbedPose=.22;this.events.push({type:'capture',from:owner,to:e});}
    a.routeHits.add(key);this.hit(owner,e,rule.antiAir&&!grounded(e)?(rule.airDamage??s.damage):s.damage,s.knock,{impact:a.kind,assist,origin:p,contact:!!rule.contact,height,ignoreGuard:rule.behavior==='grab',category:assist?'assist':a.kind==='punch'?'basic':'special'});
   }
  });
  if(a.age>=(rule.duration??.65)){p.attack=null;p.performance=null;}
 }
 physics(f,dt){
  const supported=this.platforms.some(t=>f.x>=t.left&&f.x<=t.right&&Math.abs((f.supportY??GROUND)-t.y)<1);
  if(f.supportY<GROUND&&!supported)f.supportY=GROUND;
  if(f.y>=(f.supportY??GROUND)&&f.vy>=0){f.y=f.supportY??GROUND;f.vy=0;return;}
  const old=f.y;f.vy+=GRAVITY*dt;f.y+=f.vy*dt;
  if(f.vy>=0){const landing=this.platforms.filter(t=>!(f.dropThrough>0)&&f.x>=t.left&&f.x<=t.right&&old<=t.y&&f.y>=t.y).sort((a,b)=>a.y-b.y)[0];
   if(landing){f.y=landing.y;f.supportY=landing.y;f.vy=0;f.land=.15;}
   else if(f.y>=GROUND){f.y=GROUND;f.supportY=GROUND;f.vy=0;f.land=.15;}
  }
 }
 bodiesOverlapLane(a,b){
  const ay=a.supportY??GROUND,by=b.supportY??GROUND;
  return alive(a)&&alive(b)&&Math.abs(ay-by)<1&&ay-a.y<=65&&by-b.y<=65;
 }
 resolveBodies(oldX){
  const p=this.player,intervals=this.enemies.filter(e=>this.bodiesOverlapLane(p,e)).map(e=>[e.x-62,e.x+62]).sort((a,b)=>a[0]-b[0]),clusters=[];
  // Resolve the union of touching bodies so a landing cannot be pushed out of
  // one mob and into its neighbour. Subclasses can add a foot-plane lane test.
  for(const interval of intervals){const last=clusters.at(-1);if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else clusters.push([...interval]);}
  for(const [left,right] of clusters){
   const inside=p.x>left&&p.x<right,crossed=oldX<=left&&p.x>=right||oldX>=right&&p.x<=left;
   if(!inside&&!crossed)continue;
   const choices=[left,right].filter(x=>x>=55&&x<=this.worldWidth-80).sort((a,b)=>Math.abs(a-oldX)-Math.abs(b-oldX));
   p.x=choices[0]??clamp(oldX,55,this.worldWidth-80);
  }
 }
 separateEnemy(e,dt){
  // Only bodies sharing the same support and lane nudge one another.
  for(const other of this.enemies)if(other!==e&&this.bodiesOverlapLane(e,other)&&Math.abs(e.x-other.x)<40)e.x+=(e.x>=other.x?1:-1)*18*dt;
 }
 tick(dt,input){
  this.elapsed+=dt;this.spawn();const p=this.player,oldX=p.x;
  for(const f of [p,...this.enemies]){
   for(const key of ['stun','flash','reaction','counter','reject','calm','dropThrough','slow','grabPose','grabbedPose','guardBroken','land'])f[key]=Math.max(0,(f[key]??0)-dt);
   if(!f.guard&&f.guardBroken<=0){f.guardRegen+=dt;if(f.guardRegen>=1){f.guardPips=Math.min(3,f.guardPips+1);f.guardRegen=0;}}
   f.cooldowns=f.cooldowns.map(v=>Math.max(0,v-dt));f.basicTime=Math.max(0,f.basicTime-dt);
   this.physics(f,dt);
  }
  if((input.down||input.crouch)&&p.supportY<GROUND&&grounded(p)&&!p.attack){p.dropThrough=.35;p.supportY=GROUND;p.y+=3;p.vy=30;}
  const move=(input.right?1:0)-(input.left?1:0);
  if(move&&!p.attack)p.face=move;
  p.guard=!!(input.guard&&!p.attack&&p.stun<=0&&p.guardBroken<=0&&grounded(p));p.crouch=!!((input.down||input.crouch)&&!p.attack&&grounded(p));p.crouchBlend=p.crouch?1:0;p.lowProfile=p.crouch;
  p.move=0;
  if(move&&p.stun<=0&&!p.guard&&!p.crouch){const speed=p.attack?95:250;p.x+=move*speed*this.growth.moveMultiplier*(p.slow>0?.75:1)*dt;p.move=move;}
  this.enemy=this.enemies.filter(alive).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0]??this.duel.enemy;
  this.attackPlayer(dt);
  for(const e of this.enemies){
   if(!alive(e)){e.deadAge+=dt;continue;}if(e.stun>0)continue;
   if(stepChapterMob(this,e,dt)){this.separateEnemy(e,dt);continue;}
   const spec=e.spec,dx=p.x-e.x,dist=Math.abs(dx);e.move=0;e.face=dx>=0?1:-1;e.aiWait-=dt;
   e.guard=spec.behavior==='guard'&&!e.attack&&e.guardBroken<=0&&dist<220;
   if(e.attack){e.attack.age+=dt;e.warning=Math.max(0,e.attack.windup-e.attack.age);
    if(!e.attack.fired&&e.attack.age>=e.attack.windup){e.attack.fired=true;
     if(spec.behavior==='thrower')this.projectiles.push({owner:e,kind:'paper',x:e.x+e.face*35,y:e.y-252,vx:e.face*300,age:0,life:2.4,damage:spec.damage,knock:18,face:e.face,hits:new Set(),dead:false});
     else if(dist<spec.range&&Math.abs(p.y-e.y)<105)this.hit(e,p,spec.damage,30);
    }
    if(e.attack&&e.attack.age>=e.attack.windup+.3){e.attack=null;e.aiWait=spec.recovery;}
   }else if(dist<spec.range&&e.aiWait<=0){e.guard=false;e.attack={kind:'punch',age:0,windup:spec.windup*this.tuning.windup,fired:false,variant:'left'};e.warning=e.attack.windup;}
   else if(dist<660&&dist>spec.range*.8){e.move=e.face;e.x+=e.face*spec.speed*this.tuning.speed*dt;}
   this.separateEnemy(e,dt);
  }
  this.updateEffects(dt);
  p.x=clamp(p.x,55,this.worldWidth-80);this.resolveBodies(oldX);this.cameraX=clamp(p.x-340,0,this.worldWidth-960);
  if(!this.supplyUsed&&this.canCollectSupply(p)){this.supplyUsed=true;p.hp=Math.min(p.maxHp,p.hp+18);this.events.push({type:'supply',amount:18});}
  if(this.status==='active'&&p.x>=this.gateX){this.status='gate';this.events.push({type:'routeGate',gate:this.section.gate,carry:this.exportCarry(),section:this.sectionIndex});}
 }
 updateEffects(dt){
  const p=this.player;
  for(const q of this.obstacles){q.life-=dt;for(const e of this.enemies)if(alive(e)&&grounded(e)&&Math.abs(e.y-q.y)<35&&Math.abs(e.x-q.x)<45&&!q.hits.has(e.id)){q.hits.add(e.id);this.hit(q.owner,e,q.damage,q.knock,{category:'special',impact:'huang_queue',contact:false,origin:q});}}
  this.obstacles=this.obstacles.filter(q=>!q.dead&&q.life>0);
  for(const q of this.projectiles){
   if(q.dead)continue;
   q.age+=dt;const old=q.x;q.x+=q.vx*dt;
   if(q.kind==='dream'&&!q.lob&&q.phase==='outbound'&&Math.abs(q.x-q.originX)>=q.travel){q.phase='return';q.vx=-q.vx;q.hits.clear();q.damage=COMBAT.chen_dream.returnDamage;}
   if(q.lob){q.x=q.targetX;q.y=GROUND-220*(1-q.age/q.flight);if(q.age<q.flight)continue;}
   for(const f of q.owner===p?this.enemies:[p]){
    if(!alive(f)||q.hits.has(f.id))continue;
    const touches=q.lob?Math.abs(f.x-q.targetX)<75&&f.y>GROUND-85: f.x>=Math.min(old,q.x)-32&&f.x<=Math.max(old,q.x)+32&&q.y+13>=f.y-(f.crouch?175:277)&&q.y-13<=f.y-28;
    if(touches){if(f.reject>0&&(q.owner.x-f.x)*f.face>=0&&['coin','dream'].includes(q.kind)){f.reject=0;q.owner=f;q.vx=-q.vx;q.direction=f.face;q.reflected=true;q.hits.clear();q.hits.add(f.id);this.events.push({type:'reflect',f,p:q});break;}const guarded=f.guard&&grounded(f)&&(q.owner.x-f.x)*f.face>=0;q.hits.add(f.id);this.hit(q.owner,f,q.damage,q.knock,{projectile:true,contact:false,impact:q.kind,assist:this.assists.find(a=>a.id===q.assistId),category:q.category??'special'});if(q.slow&&!guarded){f.slow=q.slow;this.events.push({type:'slow',f});}q.dead=guarded||q.kind!=='dream';break;}
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
   for(const e of this.enemies)if(alive(e)&&e.y>=GROUND-65&&!r.hits.has(e.id)&&e.x>Math.min(r.previousX,r.x)-70&&e.x<Math.max(r.previousX,r.x)+70){r.hits.add(e.id);this.hit(p,e,RALLY.damage,32,{category:'rally',impact:'rally',contact:false});}
  }
  this.rallies=this.rallies.filter(r=>r.age<RALLY.duration);
 }
 step(dt,input={}){if(this.status!=='active')return;let time=clamp(Number.isFinite(dt)?dt:0,0,.1);while(time>0&&this.status==='active'){const slice=Math.min(time,1/60);this.tick(slice,input);time-=slice;}}
}
export {CHALLENGE_SECTIONS,MOB_TYPES};
