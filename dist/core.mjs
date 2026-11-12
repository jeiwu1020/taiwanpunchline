import {fighterBaseStats} from './fighter-attributes.mjs?v=campaign-complete-20261112-r1';
import {captureFinishSnapshot} from './match-finish.mjs?v=campaign-complete-20261112-r1';
import {DESK,RALLY} from './stage-expansion.mjs?v=campaign-complete-20261112-r1';
import {CAST} from './roster.mjs?v=campaign-complete-20261112-r1';
import {COMBAT,HIGH_Y,JUMP_SPEED,GRAVITY} from './combat-rules.mjs?v=campaign-complete-20261112-r1';
import {STAGE_ITEMS,ITEM_THROW,ITEM_DROP,stageRandom,performanceGuardActive} from './stage-rules.mjs?v=campaign-complete-20261112-r1';
import {PAPER_FLIGHT,itemFighterPose,itemProjectileTouches} from './item-collision.mjs?v=campaign-complete-20261112-r1';
import {heldItemAnchor} from './item-presentation.mjs?v=campaign-complete-20261112-r1';
import {ASSIST_WARNING,ASSIST_EXIT,ASSIST_RECHARGE_RATIO,chooseAssistMove} from './assist-rules.mjs?v=campaign-complete-20261112-r1';
import {BEGINNER_AI,thinkBeginner} from './beginner-ai.mjs?v=campaign-complete-20261112-r1';
export {CAST,performanceGuardActive};
export const GROUND=430;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const grounded=f=>f.y>=(f.supportY??GROUND)-1&&f.vy>=0;
const fighter=(type,x,id)=>({rally:0,dropThrough:0,downTime:0,downBlocked:false,supportY:GROUND,item:null,type,x,y:GROUND,vy:0,hp:100,maxHp:100,id,face:id==='player'?1:-1,guard:false,guardPips:3,guardBroken:0,guardGrace:0,guardBlockedAt:-10,guardReleasedAt:-10,guardRegen:0,guardCasts:new Set(),counter:0,brace:0,armor:0,slow:0,calm:0,reject:0,stun:0,flash:0,attack:null,performance:null,cooldowns:[0,0,0],move:0,combo:0,comboTime:0,reaction:0,reactionKind:'hit',crouch:false,crouchBlend:0,lowProfile:false,land:0,basicStep:0,basicTime:0,grabPose:0,grabbedPose:0});
// Contacts are collected from both actors before any damage/cancellation occurs.
// A cast ID survives attack recovery, reflections and multi-hit phases.
export class Duel {
 constructor(character='wang',difficulty='easy',rng=Math.random,opponent=character==='wang'?'han':'wang',options={}){
  for(const[role,id]of [['character',character],['opponent',opponent]])if(typeof id!=='string'||!Object.hasOwn(CAST,id))throw new RangeError(`Unknown ${role} ID`);
  const stageSeed=rng();let replayFirst=true;this.itemRng=stageRandom(stageSeed);
  this.rallies=[];this.items=[];this.itemCount=0;this.nextItemAt=ITEM_DROP.minInterval+this.itemRng()*(ITEM_DROP.maxInterval-ITEM_DROP.minInterval);this.aiItems=new Map();
  this.player=fighter(character,260,'player');this.enemy=fighter(opponent,700,'enemy');this.difficulty=difficulty;this.rng=()=>{if(replayFirst){replayFirst=false;return stageSeed;}return rng();};this.remaining=60;this.elapsed=0;this.status='active';this.winner=null;this.projectiles=[];this.obstacles=[];this.events=[];this.aiWait=.9;this.aiThreats=new Map();this.aiRecovery=0;this.aiActiveAttack=null;this.aiDefense=0;this.aiAction=null;this.aiBufferedDefense=null;this.aiReceivedHit=0;this.aiEscapeRollHit=-1;this.aiInput={};this.freeze=0;this.buffer=null;this.nextCast=1;this.contacts=[];this.worldSpawns=[];this.worldEffects=[];this.collecting=false;this.resolving=false;this.stats={hits:0,damage:0,blocks:0,maxCombo:0,interrupts:0,counters:0,specialHits:0,whiffs:0};
  if(difficulty==='beginner')this.aiWait=2.2;
  this.assists=[];this.training={enabled:options.mode==='training',opponent:options.trainingBehavior||'stand',infiniteHealth:options.infiniteHealth!==false,repeatAssist:options.repeatAssist!==false};
  for(const f of [this.player,this.enemy]){const helper=options[f.id+'Assist']??null;if(helper!==null&&!Object.hasOwn(CAST,helper))throw new RangeError('Unknown assist ID');const base=fighterBaseStats(f.type),stats=options[f.id+'Stats'];f.combatStats={};for(const key of ['moveMultiplier','basicMultiplier','specialMultiplier','rallyMultiplier','assistMultiplier','defenseMultiplier']){const value=stats?.[key]??(key==='defenseMultiplier'?stats?.damageTakenMultiplier??base.damageTakenMultiplier:base[key]);if(!Number.isFinite(value)||value<=0)throw new RangeError('Invalid combat multiplier');f.combatStats[key]=value;}const maxHp=stats?.maxHp??options[f.id+'MaxHp']??base.maxHp;if(!Number.isFinite(maxHp)||maxHp<=0)throw new RangeError('Invalid maximum HP');f.maxHp=maxHp;f.hp=maxHp;f.assist={helper,used:false,active:false,charge:100,damageTaken:0};}
  this.configureTraining({});
 }
 other(f){return f===this.player?this.enemy:this.player;}
 press(action){if(this.status!=='active')return false;if(action==='assist')return this.request(this.player,action);if(action==='jump')return this.request(this.player,action);if(!this.request(this.player,action)){this.buffer={action,ttl:.15};return false;}return true;}
 request(f,action){
  if(this.status!=='active'||(f!==this.player&&f!==this.enemy)||f.stun>0||f.guardBroken>0)return false;
  if(action==='assist')return this.requestAssist(f);
  if(action==='rally'){
   if(f.rally<100||f.attack||f.guard||this.rallies.some(r=>r.owner===f))return false;
   f.rally=0;f.performance=null;f.stun=.3;const target=this.other(f),direction=target.x>=f.x?1:-1;this.rallies.push({owner:f,age:0,castId:this.nextCast++,fired:false,x:clamp(f.x-direction*120,-60,1020),previousX:clamp(f.x-direction*120,-60,1020),startX:clamp(f.x-direction*120,-60,1020),targetX:target.x,targetY:target.supportY??GROUND,direction,result:null});this.events.push({type:'rally',f});return true;
  }
  if(action==='jump'){
   if(!grounded(f)||f.attack)return false;
   this.releaseGrabPose();f.performance=null;f.vy=-JUMP_SPEED;f.crouch=false;f.crouchBlend=0;f.lowProfile=false;this.setGuard(f,false);this.events.push({type:'jump',f});return true;
  }
  if(f.guard)return false;
  if(f.attack&&!(f.attack.kind==='punch'&&f.attack.age>.21&&action!=='punch'))return false;
  let idx=-1,kind=action,move;
  if(/^special[123]$/.test(action)){idx=Number(action.at(-1))-1;move=CAST[f.type].moves[idx];if(!move||f.cooldowns[idx]>0)return false;kind=move.kind;}
  else if(action!=='punch')return false;
  if(kind==='chen_dream'&&this.projectiles.some(p=>p.owner===f&&p.kind==='dream'&&!p.dead))return false;
  if(kind==='huang_queue'&&this.obstacles.some(p=>p.owner===f&&!p.dead))return false;
  if(move){f.cooldowns[idx]=move.cooldown;f.reaction=0;}
  const thrown=kind==='punch'?f.item:null;if(thrown){kind='item_throw';f.item=null;}
  this.releaseGrabPose();
  // Armor is an offensive one-hit resource, retained into a basic but not a special.
  if(kind!=='punch'&&kind!=='item_throw'){f.armor=0;f.brace=0;}
  f.counter=0;f.reject=0;f.calm=0;
  f.attack={kind,performanceGuardShown:false,age:0,fired:false,hit:false,idx,castId:this.nextCast++,strikes:[],erased:[]};
  // A presentation is never an attack: it cannot hit, defend, heal, move the
  // actor or delay their next legal input. Ordinary recovery hits may cancel
  // combat while this bounded visual record completes the accepted signature.
  // Preserve V36's .28s visual release, except Han's collision-led low posture.
  f.performance=move?{kind,age:0,actionDuration:move.duration,duration:move.duration+(kind==='han_knee'?0:.28),castId:f.attack.castId,outcome:'pending',outcomeAge:0}:null;
  if(thrown){f.attack.itemKind=thrown.kind;f.attack.itemId=thrown.id;f.attack.carryHand=thrown.carryHand||'farArm';}
  if(kind==='punch'){if(f.basicTime<=0)f.basicStep=0;f.attack.variant=['left','right','kick'][f.basicStep];f.basicStep=(f.basicStep+1)%3;f.basicTime=1.15;}
  f.crouch=false;f.lowProfile=false;f.face=this.other(f).x>=f.x?1:-1;
  if(move)this.events.push({type:'move',f,name:move.name,kind,word:move.word,fictional:move.fictional});
  return true;
 }
 action(role,action){const f=role==='player'?this.player:role==='enemy'?this.enemy:null;return !!f&&this.request(f,action);}
 configureTraining(patch={}){
  const opponent=patch.opponent??this.training.opponent;
  if(!['stand','guard','ai'].includes(opponent))throw new RangeError('Unknown training behavior');
  this.training={...this.training,...patch,opponent};this.aiInput={};this.aiAction=null;this.aiBufferedDefense=null;return this.training;
 }
 assistReady(f){return (f===this.player||f===this.enemy)&&this.status==='active'&&!!f.assist?.helper&&!f.assist.active&&(!f.assist.used||this.training.enabled&&this.training.repeatAssist);}
 requestAssist(f){
  if(!this.assistReady(f)||f.stun>0||f.guardBroken>0||f.guard||f.attack||!grounded(f))return false;
  const helper=f.assist.helper,m=chooseAssistMove(helper,this.rng),target=this.other(f),direction=target.x>=f.x?1:-1;
  // Fixed warned origin and facing. No chasing/teleporting after the target.
  const actor=fighter(helper,clamp(f.x-direction*40,68,892),'assist-'+f.id);actor.y=f.y;actor.supportY=f.supportY;actor.face=direction;
  const a={id:this.nextCast++,owner:f,target,helper,kind:m.kind,name:m.name,move:m,actor,age:0,warning:ASSIST_WARNING,exitDuration:ASSIST_EXIT,phase:'warning',phaseAge:0,exitAge:0};
  f.assist.used=true;f.assist.charge=0;f.assist.damageTaken=0;f.assist.active=true;this.assists.push(a);this.events.push({type:'assistWarning',f,helper,kind:m.kind,name:m.name,assist:a});return true;
 }
 updateAssists(dt){
  for(const a of this.assists){
   const before=a.age;a.age+=dt;a.phaseAge+=dt;
   const actor=a.actor,oldY=actor.y,overDesk=actor.x>=DESK.left&&actor.x<=DESK.right;
   actor.grabPose=Math.max(0,actor.grabPose-dt);actor.land=Math.max(0,actor.land-dt);
   // Stage support and gravity are real, but helpers never join body
   // separation, item pickup or player input handling.
   if(actor.supportY===DESK.y&&!overDesk)actor.supportY=GROUND;
   if(actor.y<actor.supportY||actor.vy<0){
    actor.vy+=GRAVITY*dt;actor.y+=actor.vy*dt;
    if(overDesk&&actor.vy>=0&&oldY<=DESK.y&&actor.y>=DESK.y){actor.y=DESK.y;actor.supportY=DESK.y;actor.vy=0;actor.land=.18;}
    else if(actor.y>=GROUND){actor.y=GROUND;actor.supportY=GROUND;actor.vy=0;actor.land=.18;}
   }
   if(a.phase==='warning'&&a.age>=a.warning){
    a.phase='attack';a.phaseAge=a.age-a.warning;
    a.actor.attack={kind:a.kind,age:0,fired:false,hit:false,idx:CAST[a.helper].moves.findIndex(m=>m.kind===a.kind),castId:a.id,strikes:[],erased:[]};
    a.actor.performance={kind:a.kind,age:0,actionDuration:a.move.duration,duration:a.move.duration+ASSIST_EXIT,castId:a.id,outcome:'pending',outcomeAge:0};
    this.events.push({type:'assistStart',f:a.owner,helper:a.helper,kind:a.kind,name:a.name,assist:a});
   }
   if(a.phase==='attack'){
    const activeDt=Math.max(0,a.age-Math.max(before,a.warning));this.animateAttack(a.actor,activeDt,{owner:a.owner,target:a.target,assist:a});
    if(a.actor.performance)a.actor.performance.age=Math.min(a.move.duration,a.age-a.warning);
    a.actor.x=clamp(a.actor.x,68,892);if(!a.actor.attack){a.phase='exit';a.phaseAge=0;a.exitAge=0;}
   }else if(a.phase==='exit'){a.exitAge+=dt;if(a.actor.performance)a.actor.performance.age+=dt;}
   // Resource recovery waits for body and projectiles, preventing stacking.
   const liveEffect=this.projectiles.some(p=>p.assistId===a.id&&!p.dead&&p.life>0);
   if(a.phase==='exit'&&a.exitAge>=ASSIST_EXIT&&!liveEffect){a.done=true;a.owner.assist.active=false;this.events.push({type:'assistEnd',f:a.owner,helper:a.helper,kind:a.kind,name:a.name,assist:a});}
  }
  this.assists=this.assists.filter(a=>!a.done);
 }
 performanceOutcome(f,outcome,castId=f.performance?.castId){const p=f.performance;if(p&&p.castId===castId&&p.outcome!==outcome){p.outcome=outcome;p.outcomeAge=0;}}
 releaseGrabPose(){for(const f of [this.player,this.enemy]){f.grabPose=0;f.grabbedPose=0;}}
 setGuard(f,enabled){if(f.guard&&!enabled){f.guardReleasedAt=this.elapsed;f.guardRegen=0;}f.guard=enabled;}
 setInput(f,input,dt=0){
  if(!input.crouch){f.downTime=0;f.downBlocked=false;}
  else if(input.left||input.right||input.guard){f.downBlocked=true;f.downTime=0;}
  else if(!f.downBlocked)f.downTime=(f.downTime||0)+dt;
  if(input.crouch&&!f.downBlocked&&f.downTime>=.08&&f.supportY===DESK.y&&grounded(f)&&!f.attack&&!f.stun&&!f.guardBroken){f.dropThrough=.3;f.supportY=GROUND;f.y+=2;f.vy=90;f.downBlocked=true;this.setGuard(f,false);this.events.push({type:'dropDesk',f});}
  f.move=(input.right?1:0)-(input.left?1:0);
  const retreat=f.move!==0&&f.move*(this.other(f).x-f.x)<0;
  this.setGuard(f,(!!input.guard||retreat)&&!f.attack&&!f.stun&&!f.guardBroken&&grounded(f));
  if(f.guard)f.face=this.other(f).x>=f.x?1:-1;
  f.crouch=!!input.crouch&&!f.attack&&!f.stun&&!f.guardBroken&&grounded(f);
  if(f.crouch)f.move=0;
  if(f.guard||f.crouch)this.releaseGrabPose();
  if(f.guard||f.crouch||(f.move&&!f.attack&&!f.stun&&!f.guardBroken))f.performance=null;
 }
 step(delta,input={},ai=true,enemyInput=null){
  if(this.status!=='active')return;
  const dt=Math.min(.034,Math.max(0,delta));if(dt===0)return;
  if(this.freeze>0){this.freeze=Math.max(0,this.freeze-dt);return;}
  this.remaining=this.training.enabled?60:Math.max(0,this.remaining-dt);this.elapsed+=dt;
  if(this.training.enabled&&this.training.opponent!=='ai'){ai=false;enemyInput=this.training.opponent==='guard'?{guard:true}:{};}
  const previous=[this.player.x,this.enemy.x];
  for(const f of [this.player,this.enemy]){
   const broken=f.guardBroken;
   for(const k of ['land','basicTime','reaction','stun','flash','counter','brace','armor','slow','calm','reject','comboTime','guardBroken','guardGrace','grabPose','grabbedPose','dropThrough'])f[k]=Math.max(0,f[k]-dt);
   if(broken>0&&f.guardBroken===0){f.guardPips=Math.max(2,f.guardPips);f.guardGrace=.65;f.guardReleasedAt=this.elapsed;f.guardRegen=0;this.events.push({type:'guardRecover',f});}
   f.cooldowns=f.cooldowns.map(t=>Math.max(0,t-dt));
   if(f.performance){const p=f.performance;p.age=f.attack?.castId===p.castId?f.attack.age+dt:p.age+dt;p.outcomeAge+=dt;if(p.age>=p.duration)f.performance=null;}
  }
  this.setInput(this.player,input,dt);
  if(ai){this.think(dt);this.thinkAssist();this.setInput(this.enemy,this.aiInput,dt);if(this.aiAction)this.request(this.enemy,this.aiAction);this.trackAIRecovery();}else if(enemyInput!==null)this.setInput(this.enemy,enemyInput,dt);
  if(this.buffer){this.buffer.ttl-=dt;if(this.buffer.ttl<=0||this.request(this.player,this.buffer.action))this.buffer=null;}
  this.collecting=true;this.contacts=[];this.worldSpawns=[];this.worldEffects=[];
  for(const f of [this.player,this.enemy]){
   f.crouchBlend=clamp(f.crouchBlend+(f.crouch?1:-1)*dt/.14,0,1);
   f.lowProfile=grounded(f)&&((f.crouch&&f.crouchBlend>=.95)||(f.attack?.kind==='rush'&&f.attack.age>=.16&&f.attack.age<=.50)||(f.attack?.kind==='han_knee'&&f.attack.age>=.12&&f.attack.age<.98));
   if(!grounded(f))this.releaseGrabPose();
   if(!f.attack&&!f.stun&&!f.guardBroken){if(f.move)this.releaseGrabPose();f.face=this.other(f).x>=f.x?1:-1;f.x+=f.move*(f.guard?85:245)*(f.slow>0?.75:1)*(f.combatStats?.moveMultiplier??1)*dt;}
   const oldY=f.y;
   const overDesk=f.x>=DESK.left&&f.x<=DESK.right;
   if(f.supportY===DESK.y&&!overDesk)f.supportY=GROUND;
   if(f.y<(f.supportY??GROUND)||f.vy<0){f.vy+=GRAVITY*dt;f.y+=f.vy*dt;
    if(overDesk&&!f.dropThrough&&f.vy>=0&&oldY<=DESK.y&&f.y>=DESK.y){f.y=DESK.y;f.supportY=DESK.y;f.vy=0;f.land=.18;}
    else if(f.y>=GROUND){f.y=GROUND;f.supportY=GROUND;f.vy=0;f.land=.18;}
   }
   if(f.attack)this.animateAttack(f,dt);
   f.x=clamp(f.x,68,892);
   if(!f.guard&&!f.guardBroken&&this.elapsed-f.guardBlockedAt>=1.2&&this.elapsed-f.guardReleasedAt>=1.2){f.guardRegen+=dt;if(f.guardRegen>=.8){f.guardPips=Math.min(3,f.guardPips+1);f.guardRegen=0;}}else f.guardRegen=0;
  }
  this.updateAssists(dt);
  this.separate();
  // Spawn then interact in a shared stage, independent of actor loop order.
  for(const spawn of this.worldSpawns)spawn();for(const effect of this.worldEffects)effect();
  this.worldSpawns=[];this.worldEffects=[];
  // Re-evaluate contact geometry after both actors have advanced to this frame.
  const pending=this.contacts;this.contacts=[];
  for(const c of pending)if(this.canMelee(c))this.contacts.push(c);
  this.updateObstacles(dt,previous);
  this.updateProjectiles(dt);
  for(const r of this.rallies){
   const before=r.age;r.age+=dt;r.previousX=r.x;
   r.x+=r.direction*RALLY.speed*Math.max(0,r.age-Math.max(before,RALLY.warning));
   if(!r.fired&&r.age>=RALLY.warning){const to=this.other(r.owner),within=to.x>=Math.min(r.previousX,r.x)-RALLY.radius&&to.x<=Math.max(r.previousX,r.x)+RALLY.radius;
    if(within&&to.y>=GROUND-65){r.fired=true;this.contacts.push({from:r.owner,to,raw:RALLY.damage,knock:32,height:'mid',contact:false,impact:'rally',castId:r.castId,direction:r.direction,guardCost:1,rally:r});}
    else if(within&&to.supportY===DESK.y)r.tooHigh=true;
   }
   if(!r.fired&&(r.age>=RALLY.duration||r.x< -120||r.x>1080)){r.fired=true;r.result='miss';this.events.push({type:'rallyResult',f:r.owner,to:this.other(r.owner),r,result:'miss',amount:0});}
  }
  this.rallies=this.rallies.filter(r=>r.age<RALLY.duration&&r.x>=-120&&r.x<=1080);
  this.collecting=false;this.resolveContacts();if(ai)this.trackAIRecovery();
  this.projectiles=this.projectiles.filter(p=>!p.dead&&p.life>0&&p.x>-100&&p.x<1060&&p.y<500);
  this.obstacles=this.obstacles.filter(p=>!p.dead&&p.life>0);
  if(this.player.hp<=0||this.enemy.hp<=0||this.remaining<=0)this.finish();else this.updateItems();
 }
 moveFighter(f,nextX,sweep=true){const previousX=f.x;f.x=clamp(nextX,68,892);if(sweep&&f.x!==previousX)this.queueCrossings(f,previousX,f.x);}
 separate(sweep=false){
  const a=this.player,b=this.enemy;if(Math.abs(a.x-b.x)>=88||Math.abs(a.y-b.y)>=220)return;
  const sign=a.x<=b.x?-1:1,push=(88-Math.abs(a.x-b.x))/2;let ax=clamp(a.x+sign*push,68,892),bx=clamp(b.x-sign*push,68,892);
  if(Math.abs(ax-bx)<88){if(ax<=68||ax>=892)bx=clamp(ax-sign*88,68,892);else ax=clamp(bx+sign*88,68,892);}
  // Before shared world staging, the frame's previous-position sweep handles
  // separation. During contact resolution, every forced displacement sweeps now.
  this.moveFighter(a,ax,sweep);this.moveFighter(b,bx,sweep);
 }
 canMelee(c){const{to:o,range,height,antiAir}=c,f=c.origin??c.from;if(c.a&&f.attack!==c.a)return false;if((o.x-f.x)*c.direction<0||Math.abs(o.x-f.x)>=range)return false;if(height==='grab')return grounded(f)&&grounded(o)&&Math.abs(f.y-o.y)<35;if(height==='low')return grounded(f)&&grounded(o)&&Math.abs(f.y-o.y)<35;if(height==='high'&&o.lowProfile)return false;return Math.abs(o.y-f.y)<(antiAir?250:140);}
 emitContact(c){if(this.collecting)this.contacts.push(c);else if(this.canMelee(c)){this.contacts=[c];this.resolveContacts();if(this.player.hp<=0||this.enemy.hp<=0)this.finish();}}
 stageWorld(effect,spawn=false){if(this.collecting)(spawn?this.worldSpawns:this.worldEffects).push(effect);else effect();}
 animateAttack(f,dt,context=null){
  const a=f.attack;if(!a)return;a.age+=dt;
  const m=a.kind==='item_throw'?ITEM_THROW:a.kind==='punch'?COMBAT.punch:CAST[f.type].moves[a.idx];if(!m||m.kind&&m.kind!==a.kind){f.attack=null;return;}
  const age=a.age,o=context?.target??this.other(f),owner=context?.owner??f,assist=context?.assist,metadata=assist?{assist:true,assistId:assist.id,helper:assist.helper}:{},overlap=(start,end)=>Math.max(0,Math.min(age,end)-Math.max(age-dt,start));
  // Resolve the visible miss only after the real last contact/defense window.
  const lastHit=m.hits?Math.max(...m.hits.map(h=>h.end)):m.end;
  if(f.performance?.outcome==='pending'&&((lastHit!=null&&age>=lastHit)||(['counter','reject','calm'].includes(m.behavior)&&a.fired&&f[m.behavior]===0)))this.performanceOutcome(f,'whiff',a.castId);
  if(a.kind==='item_throw'){if(age>=m.start&&!a.fired){a.fired=true;this.stageWorld(()=>this.launchItem(f,a),true);}if(age>m.duration)f.attack=null;return;}
  if(m.behavior==='rush'||m.behavior==='advance')f.x+=f.face*m.speed*overlap(m.advanceStart,m.advanceEnd);
  if(m.steps)for(const step of m.steps)f.x+=f.face*step.speed*overlap(step.start,step.end);
  f.lowProfile=grounded(f)&&((f.crouch&&f.crouchBlend>=.95)||(a.kind==='rush'&&age>=.16&&age<=.50)||(a.kind==='han_knee'&&age>=.12&&age<.98));
  const strike=(s,index)=>{
   if(a.strikes[index]||!(age>s.start&&age<s.end))return;
   const height=s.height??m.height??'mid';
   if(a.kind==='punch'||m.destroysQueue)this.stageWorld(()=>{if(grounded(f))for(const q of this.obstacles)if(!q.dead&&q.owner!==owner&&(q.x-f.x)*f.face>=0&&Math.abs(q.x-f.x)<m.range)this.breakQueue(q,owner,metadata);});
   if(m.erase&&!a.erased[index])this.stageWorld(()=>{if(a.erased[index])return;const p=this.projectiles.find(p=>!p.dead&&['coin','dream'].includes(p.kind)&&p.owner!==owner&&(p.x-f.x)*f.face>=0&&Math.abs(p.x-f.x)<m.range&&Math.abs(p.y-(f.y-HIGH_Y))<40);if(p){p.dead=true;a.erased[index]=true;this.events.push({type:'erase',f:owner,p,...metadata});}});
   this.emitContact({from:owner,to:o,...(assist?{origin:f,...metadata}:{}),raw:s.damage??m.damage,groundDamage:m.damage,airDamage:m.airDamage,knock:s.knock??m.knock??20,height,contact:!!m.contact,grab:m.behavior==='grab',range:m.range,antiAir:m.antiAir,guardCost:m.guardCost??1,impact:a.kind,castId:a.castId,direction:f.face,a,index,wallBonus:m.wallBonus??0});
  };
  if(m.behavior==='combo')m.hits.forEach(strike);
  else if(['melee','rush','advance','grab'].includes(m.behavior))strike(m,0);
  else if(['counter','reject','calm','armor'].includes(m.behavior)){
   if(age>m.start&&!a.fired){a.fired=true;f[m.behavior==='armor'?'armor':m.behavior]=m.window;if(m.behavior==='armor'){f.brace=0;this.events.push({type:'armor',f});}}
  }else if(m.behavior==='heal'){
   if(age>=m.start&&!a.fired){a.fired=true;const amount=Math.min(m.heal,f.maxHp-f.hp);f.hp+=amount;this.performanceOutcome(f,'heal',a.castId);this.events.push({type:'heal',f,amount});}
  }else if(age>m.start&&!a.fired){
   a.fired=true;
   this.stageWorld(()=>{if(m.behavior==='queue'){
    for(const q of this.obstacles)if(q.owner===f)q.dead=true;
    const obstacle={kind:'queue',owner:f,x:clamp(f.x+f.face*m.range,68,892),y:GROUND,life:m.life,castId:a.castId,damage:m.damage,knock:m.knock,direction:f.face,dead:false};this.obstacles.push(obstacle);this.events.push({type:'queuePlant',f,obstacle});
   }else this.launch(f,a,m,o,assist);},true);
  }
  if(f.attack===a&&age>m.duration){if(!a.hit&&['counter','reject','calm'].includes(m.behavior))this.events.push({type:'counterMiss',f});else if(!a.hit&&['melee','rush','advance','grab','combo'].includes(m.behavior)&&owner.id==='player')this.stats.whiffs++;f.counter=0;f.reject=0;f.calm=0;f.attack=null;f.lowProfile=false;}
 }
 updateItems(){
  for(const item of this.items){
   item.age=this.elapsed-item.spawnedAt;
   if(item.state==='falling'){
    const t=clamp(item.age/ITEM_DROP.fallTime,0,1);item.y=-40+(GROUND+40)*t*t;
    if(this.elapsed>=item.landsAt){item.state='ground';item.y=GROUND;this.events.push({type:'itemLand',item});}
   }
   if(this.elapsed>=item.expiresAt){item.state='expired';this.events.push({type:'itemExpire',item});}
  }
  this.items=this.items.filter(i=>i.state!=='expired');
  if(this.itemCount<ITEM_DROP.maxTotal&&this.elapsed>=this.nextItemAt){
   this.nextItemAt=this.elapsed+ITEM_DROP.minInterval+this.itemRng()*(ITEM_DROP.maxInterval-ITEM_DROP.minInterval);
   if(this.items.length<ITEM_DROP.maxLive){
    const positions=ITEM_DROP.positions.filter(x=>[this.player,this.enemy].every(f=>Math.abs(x-f.x)>=ITEM_DROP.avoidFighter));
    if(positions.length){
     const x=positions[Math.floor(this.itemRng()*positions.length)],kind=this.itemRng()<.5?'paper':'rubber_duck';
     const item={id:'item-'+(++this.itemCount),kind,x,y:-40,state:'falling',age:0,spawnedAt:this.elapsed,landsAt:this.elapsed+ITEM_DROP.fallTime,expiresAt:this.elapsed+ITEM_DROP.fallTime+ITEM_DROP.groundLife};
     this.items.push(item);this.events.push({type:'itemSpawn',item});
    }
   }
  }
  // Both fighters have moved and all hits have resolved. Resolve each contested
  // item by distance, never actor iteration order. An exact tie stays available.
  const eligible=[this.player,this.enemy].filter(f=>f.hp>0&&!f.item&&grounded(f)&&f.y>=GROUND-1&&!f.attack&&!f.stun&&!f.guardBroken);
  const picked=new Set();
  for(const item of this.items){
   if(item.state!=='ground')continue;
   const contenders=eligible.filter(f=>!picked.has(f)&&Math.abs(f.x-item.x)<=ITEM_DROP.pickupRange).map(f=>({f,d:Math.abs(f.x-item.x)})).sort((a,b)=>a.d-b.d);
   if(!contenders.length||contenders.length>1&&Math.abs(contenders[0].d-contenders[1].d)<1e-8)continue;
   const f=contenders[0].f;f.item={id:item.id,kind:item.kind};item.state='held';picked.add(f);this.events.push({type:'itemPickup',f,item});
  }
  this.items=this.items.filter(i=>i.state!=='held');
 }
 launchItem(f,a){
  const m=STAGE_ITEMS[a.itemKind],low=m.height==='low',pose=this.itemPose?.(f)||itemFighterPose(f,this.elapsed*1000),origin=this.itemOrigin?.(f,a)||heldItemAnchor({...f,item:{kind:a.itemKind}},pose,a.carryHand),y=origin.y;
  const p={kind:a.itemKind,itemId:a.itemId,owner:f,originalOwner:f,castId:a.castId,impact:'item_'+a.itemKind,height:m.height,direction:f.face,travelDir:f.face,x:origin.x,y,vx:f.face*m.speed,vy:low?100:0,gravity:low?950:0,life:m.life,age:0,damage:m.damage,knock:m.knock,phase:low?'falling':'outbound',reflected:false,dead:false,hits:new Set(),radius:m.radius};
  if(!low){p.startY=y;p.laneY=Math.min(y,f.y-PAPER_FLIGHT.height);}
  this.projectiles.push(p);this.events.push({type:'launch',f,p});this.events.push({type:'itemThrow',f,p,itemId:a.itemId,kind:a.itemKind});
 }
 launch(f,a,m,o,assist=null){
  const owner=assist?.owner??f,metadata=assist?{assist:true,assistId:assist.id,helper:assist.helper}:{};
  const p={kind:m.projectileKind??(m.behavior==='word'?'word':'arrow'),owner,originalOwner:owner,...metadata,castId:a.castId,impact:a.kind,height:m.height,direction:f.face,travelDir:f.face,x:f.x+f.face*60,y:f.y-HIGH_Y,vx:f.face*(m.speed??0),vy:0,gravity:0,life:m.life??2.2,age:0,damage:m.damage,knock:m.knock??30,phase:m.behavior==='projectile'?'outbound':'lob',reflected:false,dead:false,hits:new Set(),radius:13};
  if(m.behavior==='projectile'&&p.kind==='dream'){p.originX=p.x;p.turnX=p.x+f.face*m.travel;p.returnDamage=m.returnDamage;}
  if(m.behavior==='lob'||m.behavior==='word'){
   const flight=m.flight;p.flight=flight;p.targetX=m.behavior==='word'?clamp(f.x+f.face*Math.min(m.range,Math.abs(o.x-f.x)),68,892):o.x;p.startX=p.x;p.startY=p.y;p.targetY=GROUND-18;p.gravity=950;p.vx=(p.targetX-p.x)/flight;p.vy=(p.targetY-p.y-.5*p.gravity*flight*flight)/flight;p.slow=m.slow??0;p.word=m.word;
   this.events.push({type:m.behavior==='word'?'wordMark':'arrowMark',f:owner,...metadata,x:p.targetX,y:GROUND});
  }
  this.projectiles.push(p);this.events.push({type:'launch',f:owner,p,...metadata});
 }
 breakQueue(q,f,metadata={}){q.dead=true;this.events.push({type:'queueBreak',x:q.x,y:q.y,f,obstacle:q,...metadata});}
 queueCrossings(f,previousX,nextX){
  if(!grounded(f)||f.y<GROUND-1)return;
  for(const q of this.obstacles)if(!q.dead&&q.life>0&&q.owner!==f&&Math.min(previousX,nextX)<=q.x+18&&Math.max(previousX,nextX)>=q.x-18){
   q.dead=true;this.contacts.push({from:q.owner,to:f,raw:q.damage,knock:q.knock,height:'low',contact:false,impact:'huang_queue',castId:q.castId,direction:q.direction,guardCost:1});
  }
 }
 updateObstacles(dt,previous){for(const q of this.obstacles)q.life-=dt;this.queueCrossings(this.player,previous[0],this.player.x);this.queueCrossings(this.enemy,previous[1],this.enemy.x);}
 projectileTouches(p,f,oldX,oldY=p.y){if(p.itemId)return itemProjectileTouches(p,f,{x:oldX,y:oldY},this.itemPose?.(f)||itemFighterPose(f,this.elapsed*1000));const swept=Math.min(oldX,p.x)<=f.x+35&&Math.max(oldX,p.x)>=f.x-35;if(!swept)return false;const top=f.y-(f.lowProfile?(f.attack?.kind==='rush'?175:235):277),bottom=f.y-28;return p.y+p.radius>=top&&p.y-p.radius<=bottom;}
 updateProjectiles(dt){for(const p of this.projectiles){if(p.dead)continue;const time=Math.min(dt,p.life),oldX=p.x,oldY=p.y;p.life-=time;p.age+=time;
   if(p.phase==='lob'){
    const t=Math.min(p.age,p.flight);p.x=p.startX+p.vx*t;p.y=p.startY+((p.targetY-p.startY-.5*p.gravity*p.flight*p.flight)/p.flight)*t+.5*p.gravity*t*t;p.vy=(p.targetY-p.startY-.5*p.gravity*p.flight*p.flight)/p.flight+p.gravity*t;
    if(p.age>=p.flight){p.dead=true;const target=this.other(p.owner);if(Math.abs(target.x-p.targetX)<48&&target.y>=GROUND-1&&grounded(target))this.contacts.push({from:p.owner,to:target,...(p.assist?{assist:true,assistId:p.assistId,helper:p.helper}:{}),raw:p.damage,knock:p.knock,height:'low',contact:false,impact:p.impact,castId:p.castId,direction:p.travelDir,guardCost:1,p,slow:p.slow});else{if(p.owner.id==='player')this.stats.whiffs++;this.events.push({type:p.kind==='word'?'wordMiss':'arrowMiss',x:p.targetX,y:GROUND,...(p.assist?{assist:true,assistId:p.assistId,helper:p.helper}:{})});}}
    continue;
   }
   p.x+=p.vx*time;
   if(p.itemId&&p.kind==='paper'&&p.laneY!=null){const u=Math.min(1,p.age/PAPER_FLIGHT.riseTime),ease=u*u*(3-2*u);p.y=p.startY+(p.laneY-p.startY)*ease;}
   if(p.itemId&&p.phase==='falling'){p.y+=p.vy*time+.5*p.gravity*time*time;p.vy+=p.gravity*time;if(p.y>=GROUND-35){p.y=GROUND-35;p.vy=0;p.phase='ground';}}
   if(p.kind==='dream'&&!p.reflected){
    if(p.phase==='outbound'&&(p.x-p.turnX)*p.travelDir>=0){p.x=p.turnX;p.vx=-p.vx;p.phase='return';p.damage=p.returnDamage;}
    else if(p.phase==='return'&&(p.x-p.originX)*p.travelDir<=0){p.x=p.originX;p.dead=true;continue;}
   }
   // A falling duck can now reach the visible queue too; a high airborne duck
   // still clears its 74px-tall sign. Existing non-falling queue rules stay intact.
   for(const q of this.obstacles)if(!q.dead&&q.owner!==p.owner&&(!p.itemId||p.phase!=='falling'||p.y+p.radius>=GROUND-74)&&Math.min(oldX,p.x)<=q.x+15&&Math.max(oldX,p.x)>=q.x-15){this.breakQueue(q,p.owner,p.assist?{assist:true,assistId:p.assistId,helper:p.helper}:{});p.dead=true;break;}
   if(p.dead)continue;const target=this.other(p.owner),key=p.itemId?target.id:target.id+':'+p.phase;
   if(!p.hits.has(key)&&this.projectileTouches(p,target,oldX,oldY)){
    p.hits.add(key);this.contacts.push({from:p.owner,to:target,...(p.assist?{assist:true,assistId:p.assistId,helper:p.helper}:{}),raw:p.damage,knock:p.knock,height:p.height,contact:false,impact:p.impact,castId:p.castId,direction:Math.sign(p.vx)||p.travelDir,guardCost:1,p});
   }
  }}
 resolveContacts(){
  this.resolving=true;const canceledGrabs=new Set();
  // Any already-valid strike takes priority over a grab that has not captured.
  const contacts=[...this.contacts.filter(c=>!c.grab),...this.contacts.filter(c=>c.grab)];this.contacts=[];let i=0;
  for(;;){
   if(i>=contacts.length){
    // Body separation can itself cross a line. Append that one-time hazard to
    // this same finite worklist rather than resolving recursively or losing it.
    this.separate(true);if(!this.contacts.length)break;
    contacts.push(...this.contacts.splice(0));
   }
   const c=contacts[i++];if(c.grab&&(canceledGrabs.has(c.origin??c.from)||(c.a&&(c.origin??c.from).attack!==c.a)))continue;if(c.a?.strikes[c.index])continue;
   if(c.a){c.a.strikes[c.index]=true;c.a.hit=true;}
   const result=this.resolveHit(c);if(result&&!c.grab&&!performanceGuardActive(c.to))canceledGrabs.add(c.to);
   if(this.contacts.length)contacts.splice(i,0,...this.contacts.splice(0));
  }
  this.resolving=false;
 }
 // Public direct damage remains for callers; production collisions always queue
 // explicit cast, impact, direction and contact metadata above.
 damage(from,to,raw,knock=20,impactOverride){if(this.status!=='active')return false;const impact=impactOverride??from.attack?.kind??'punch',m=COMBAT[impact]??COMBAT.punch;const result=this.resolveHit({from,to,raw,knock,impact,castId:from.attack?.castId??this.nextCast++,direction:from.face,height:m.height??'mid',contact:m.contact??true,guardCost:m.guardCost??1,grab:m.behavior==='grab'});this.separate(true);if(this.contacts.length)this.resolveContacts();if(to.hp<=0||from.hp<=0)this.finish();return result;}
 resolveHit(c){
  const eventStart=this.events.length;
  try{
  const{from,to}=c;if(this.status!=='active')return false;
  if(c.antiAir)c.raw=grounded(to)?c.groundDamage:c.airDamage;
  const normal=!c.grab,p=c.p,straight=p&&['coin','dream'].includes(p.kind)&&p.phase!=='lob';
  // Defense is forward facing. Lob impacts are independent ground hazards.
  const forward=(p||c.rally)?c.direction*to.face<0:((c.origin??from).x-to.x)*to.face>=0;
  if(normal&&to.reject>0&&forward&&(c.contact||straight)){
   to.reject=0;to.counter=0;to.attack=null;
   this.performanceOutcome(to,straight&&!p.reflected?'reflect':'reject');
   if(straight&&!p.reflected){p.owner=to;p.vx=-p.vx;p.direction=Math.sign(p.vx);p.travelDir=p.direction;p.reflected=true;p.phase='reflected';p.hits.clear();p.x=to.x+p.direction*48;p.life=Math.min(1.8,p.life+.5);this.events.push({type:'reflect',f:to,p,...(c.assist?{assist:true,assistId:c.assistId,helper:c.helper}:{})});}
   else{if(p)p.dead=true;this.events.push({type:'reject',f:to,from});}
   return false;
  }
  if(normal&&c.contact&&to.counter>0&&forward){
   const responseStart=this.events.length;
   const stance=to.attack?.kind,m=COMBAT[stance];to.counter=0;to.attack=null;this.performanceOutcome(to,'counter');
   this.events.push({type:'counter',f:to,from});if(to.id==='player')this.stats.counters++;
   if(m&&Math.abs(from.x-to.x)<m.range&&(from.x-to.x)*to.face>=0){
    // Counter returns never trigger another counter/rejection recursively.
    this.applyDamage({from:to,to:from,raw:m.damage,knock:m.knock,impact:stance,castId:this.nextCast++,direction:to.face,height:'mid',contact:false,noDefense:true});
    if(m.retreat)this.retreat(to,m.retreat);
   }
   // A main fighter earned this counter; the helper is causal metadata only.
   if(c.assist)for(let i=responseStart;i<this.events.length;i++)Object.assign(this.events[i],{assistResponse:true,sourceAssistId:c.assistId,sourceHelper:c.helper});
   return false;
  }
  let blocked=normal&&!to.guardBroken&&to.guard&&grounded(to)&&(p?.phase==='lob'||forward);
  if(p){if(blocked||p.kind!=='dream'||p.reflected)p.dead=true;}
  if(c.grab){this.capture(c.origin??from,to,from,c);to.armor=0;to.brace=0;}
  return this.applyDamage({...c,blocked});
  }finally{if(c.assist)for(let i=eventStart;i<this.events.length;i++)if(!this.events[i].assistResponse)Object.assign(this.events[i],{assist:true,assistId:c.assistId,helper:c.helper});}
 }
 retreat(f,amount){const o=this.other(f),dir=f.x<=o.x?-1:1;this.moveFighter(f,f.x+dir*amount);}
 capture(from,to,owner=from,contact={}){
  const dir=from.face,move=(f,x)=>f===from&&from!==owner?f.x=clamp(x,68,892):this.moveFighter(f,x);
  // Meet at a readable handshake distance. Never exchange sides or cross walls.
  const gap=Math.abs(to.x-from.x);if(gap<136){
   const extra=136-gap;let fromX=clamp(from.x-dir*extra/2,68,892),toX=clamp(to.x+dir*extra/2,68,892);
   if(Math.abs(toX-fromX)<136){if(fromX===68||fromX===892)toX=clamp(fromX+dir*136,68,892);else fromX=clamp(toX-dir*136,68,892);}
   move(from,fromX);move(to,toX);
  }
  from.grabPose=.22;to.grabbedPose=.22;to.performance=null;to.face=-dir;to.crouch=false;to.crouchBlend=0;to.lowProfile=false;this.events.push({type:'capture',from:owner,to,duration:.22,...(contact.assist?{assist:true,assistId:contact.assistId,helper:contact.helper}:{})});
 }
 applyDamage(c){
  const{from,to}=c,blocked=!!c.blocked;
  // Grabs and earned counter returns are tactical answers, not ordinary hits.
  // Their capture/reaction must supersede both the live cast and its visual tail.
  if(c.grab||c.noDefense)to.performance=null;
  const source=c.assist?'assistMultiplier':c.impact==='rally'?'rallyMultiplier':c.impact==='punch'||c.p?.itemId||c.impact?.startsWith('item_')?'basicMultiplier':'specialMultiplier';
  const offense=from.combatStats?.[source]??1,defense=to.combatStats?.defenseMultiplier??1;
  let amount=blocked?2:c.raw*offense,armored=false,calmed=false,wallAmount=0;
  if(!blocked&&!c.grab&&to.armor>0){amount=Math.round(amount*.6);armored=true;to.armor=0;to.brace=0;this.performanceOutcome(to,'armor');this.events.push({type:'armorAbsorb',f:to,amount});}
  else if(!blocked&&!c.grab&&to.calm>0){amount=Math.min(4,amount);calmed=true;to.calm=0;this.performanceOutcome(to,'calm');this.events.push({type:'calm',f:to});}
  amount*=defense;
  if(blocked){
   to.guardBlockedAt=this.elapsed;to.guardRegen=0;
   if(!to.guardCasts.has(c.castId)){
    to.guardCasts.add(c.castId);to.guardPips=Math.max(0,to.guardPips-(c.guardCost??1));
    if(to.guardPips===0&&to.guardGrace===0){to.guardBroken=.38;this.setGuard(to,false);to.guardReleasedAt=this.elapsed;this.events.push({type:'guardBreak',f:to});}
    else if(to.guardPips===0)to.guardPips=1;
   }
  }
  const a=to.attack,knock=blocked?5:c.knock??20,next=to.x+c.direction*knock;
  const wallImpact=!blocked&&!armored&&!calmed&&c.wallBonus&&(next<68||next>892);
  wallAmount=wallImpact?Math.min(Math.min(3,c.wallBonus)*defense,Math.max(0,to.hp-amount)):0;
  const performanceGuard=!c.grab&&!c.noDefense&&!blocked&&!armored&&!calmed&&to.hp>amount+wallAmount&&performanceGuardActive(to);
  if(performanceGuard&&!a.performanceGuardShown){a.performanceGuardShown=true;this.events.push({type:'performanceGuard',f:to,kind:a.kind,castId:a.castId,amount});}
  const interrupted=to.attack?.kind==='heal'&&!performanceGuard&&!armored;if(interrupted){to.performance=null;this.events.push({type:'spit',f:to});if(from.id==='player')this.stats.interrupts++;}
  if(to===this.enemy&&this.difficulty==='easy')this.aiReceivedHit++;
  if(!blocked&&c.impact!=='rally')from.rally=Math.min(100,from.rally+Math.min(25,amount*2.5));
  if(c.rally){c.rally.result=blocked?'blocked':'hit';this.events.push({type:'rallyResult',f:from,to,r:c.rally,result:c.rally.result,amount});}
  const hpBefore=to.hp;to.hp=clamp(to.hp-amount,0,to.maxHp)-wallAmount;
  // Charge only resolved enemy HP loss, after mitigation and capped overkill.
  // Healing/training restoration happens later and never erases this progress.
  if(from===this.other(to)&&to.assist?.helper&&to.assist.used){
   const required=to.maxHp*ASSIST_RECHARGE_RATIO;
   to.assist.damageTaken=Math.min(required,to.assist.damageTaken+Math.max(0,hpBefore-to.hp));
   to.assist.charge=Math.min(100,to.assist.damageTaken/required*100);
   if(to.assist.damageTaken+Number.EPSILON*to.maxHp*8>=required){to.assist.damageTaken=required;to.assist.used=false;to.assist.charge=100;}
  }
  to.flash=.18;to.reaction=performanceGuard?0:blocked?.1:.40;to.reactionKind=c.impact;
  if(c.noDefense||(!armored&&!performanceGuard)){
   to.stun=blocked?.07:calmed?.08:.16;
   if(calmed)this.retreat(to,60);else{
    if(wallImpact){
     const wall=next>892?892:68,inward=wall-c.direction*30;
     // One spatial rebound, capped by the attacker's occupied body. At a fully
     // packed wall there may be less than30px of free room, never a side swap.
     this.moveFighter(to,c.direction>0?Math.max(inward,from.x+88):Math.min(inward,from.x-88));
    }else this.moveFighter(to,next);
   }
   to.attack=null;to.counter=0;to.reject=0;to.calm=0;to.crouch=false;to.lowProfile=false;if(!blocked)this.setGuard(to,false);
  }
  if(wallAmount>0)this.events.push({type:performanceGuard?'wallHit':'wallBounce',f:to,amount:wallAmount,x:to.x});
  if(c.slow&&!blocked){to.slow=c.slow;this.events.push({type:'slow',f:to,duration:c.slow});}
  from.combo=from.comboTime>0?from.combo+1:1;from.comboTime=1.15;this.freeze=Math.max(this.freeze,blocked?.012:.025);
  if(from.id==='player'){this.stats.hits++;this.stats.damage+=amount+wallAmount;if(c.impact!=='punch'&&!c.p?.itemId)this.stats.specialHits++;this.stats.maxCombo=Math.max(this.stats.maxCombo,from.combo);}
  if(blocked&&to.id==='player')this.stats.blocks++;
  this.performanceOutcome(c.origin??(c.assist?this.assists.find(a=>a.id===c.assistId)?.actor:null)??from,blocked?'blocked':'hit',c.castId);
  this.events.push({type:blocked?'block':'hit',from,to,amount,combo:from.combo,impact:c.impact,height:c.height,castId:c.castId,...(c.assist?{assist:true,assistId:c.assistId,helper:c.helper}:{}),...(performanceGuard?{performanceGuard:true}:{}),...(armored?{armored:true}:{}),...(calmed?{calmed:true}:{})});
  if(this.training.enabled&&this.training.infiniteHealth)to.hp=to.maxHp;
  return true;
 }
 finish(){if(this.status!=='active')return;if(this.training.enabled){for(const f of [this.player,this.enemy])if(f.hp<=0)f.hp=f.maxHp;this.remaining=60;return;}const p=this.player,e=this.enemy;if(p.hp<=0||e.hp<=0)this.winner=p.hp<=0&&e.hp<=0?'draw':p.hp>0?'player':'enemy';else{const difference=p.hp/p.maxHp-e.hp/e.maxHp;this.winner=Math.abs(difference)<1e-12?'draw':difference>0?'player':'enemy';}this.finishSnapshot=captureFinishSnapshot(this);this.status='over';this.buffer=null;this.aiInput={};this.aiAction=null;this.aiBufferedDefense=null;this.freeze=0;this.rallies=[];this.items=[];this.assists=[];this.projectiles=this.projectiles.filter(p=>!p.itemId&&!p.assistId);this.aiItems.clear();for(const f of [this.player,this.enemy]){f.assist.active=false;f.item=null;f.counter=0;f.brace=0;f.armor=0;f.reject=0;f.calm=0;this.setGuard(f,false);f.attack=null;f.performance=null;}this.events.push({type:'over',winner:this.winner});}
 // The AI calls the same request gate and spends the same round resource.
 thinkAssist(){
  const f=this.enemy;if(this.elapsed<5||this.aiRecovery>0||!this.assistReady(f)||Math.abs(f.x-this.player.x)>370)return;
  if(this.request(f,'assist')){this.aiAction=null;this.aiInput={};this.aiWait=Math.max(this.aiWait,1);}
 }
 // Recovery starts when an actual action ends, including interruption and
 // consumed counter/reject stances. It is not the offensive decision timer.
 trackAIRecovery(){
  const attack=this.enemy.attack;
  if(this.aiActiveAttack&&this.aiActiveAttack!==attack){
   const easy=this.difficulty==='easy',beginner=this.difficulty==='beginner';this.aiRecovery=beginner?BEGINNER_AI.recovery+this.rng()*BEGINNER_AI.recoverySpread:(easy?.55:.14)+this.rng()*(easy?.25:.08);
  }
  this.aiActiveAttack=attack;
 }
 think(dt){
  if(this.difficulty==='beginner')return thinkBeginner(this,dt);
  const f=this.enemy,o=this.player,dist=Math.abs(f.x-o.x),dir=o.x>=f.x?1:-1,easy=this.difficulty==='easy';
  this.aiWait-=dt;this.aiRecovery=Math.max(0,this.aiRecovery-dt);this.trackAIRecovery();this.aiDefense=Math.max(0,this.aiDefense-dt);this.aiAction=null;
  // Each currently visible cast/hazard earns its own perception deadline.
  // Seeing one threat never reveals a new attack or a different projectile.
  const threats=[],currentMove=COMBAT[o.attack?.kind];
  if(o.attack&&o.attack.age>.05&&dist<(currentMove?.range??130)+15)threats.push({source:o.attack,kind:'attack'});
  for(const p of this.projectiles)if(p.owner===o&&!p.dead&&(p.phase==='lob'?Math.abs(p.targetX-f.x)<65&&p.flight-p.age<.6:Math.abs(p.x-f.x)<290))threats.push({source:p,kind:'projectile'});
  for(const q of this.obstacles)if(q.owner!==f&&!q.dead&&(q.x-f.x)*dir>0&&Math.abs(q.x-f.x)<140)threats.push({source:q,kind:'queue'});
  for(const a of this.assists)if(a.owner===o&&a.phase!=='exit'&&Math.abs(a.actor.x-f.x)<(a.move.range??260)+80)threats.push({source:a,kind:'assist'});
  const visibleSources=new Set(threats.map(t=>t.source));
  for(const source of this.aiThreats.keys())if(!visibleSources.has(source))this.aiThreats.delete(source);
  for(const t of threats){
   if(!this.aiThreats.has(t.source)){
    const readyAt=this.elapsed+(easy?.40:.16)+this.rng()*(easy?.28:.14);
    this.aiThreats.set(t.source,{seenAt:this.elapsed,readyAt,nextCheckAt:readyAt});
   }
   t.observation=this.aiThreats.get(t.source);
  }
  const visibleItems=this.items.filter(i=>i.state==='ground'&&Math.abs(i.x-f.x)<320);
  for(const item of this.aiItems.keys())if(!visibleItems.includes(item))this.aiItems.delete(item);
  for(const item of visibleItems)if(!this.aiItems.has(item))this.aiItems.set(item,this.elapsed+(easy?.40:.16)+this.rng()*(easy?.28:.14));
  const observedAttack=this.aiThreats.get(o.attack),knowsAttack=observedAttack&&this.elapsed>=observedAttack.readyAt;
  const seekingHeal=f.type==='wang'&&f.hp<=f.maxHp*.8&&f.cooldowns[2]===0&&dist>190;
  const approach=(dist>125||!grounded(f)&&!easy)&&!seekingHeal&&(!easy||this.aiRecovery<=0);
  this.aiInput={left:approach&&dir<0,right:approach&&dir>0,guard:this.aiDefense>0&&!!this.aiInput.guard,crouch:this.aiDefense>0&&!!this.aiInput.crouch};
  if(f.guardBroken)return;
  const rallyThreat=this.rallies.find(r=>r.owner===o&&r.age>.35&&!r.fired&&(f.x-r.x)*r.direction>=-RALLY.radius);
  if(rallyThreat&&!f.attack&&!f.stun){this.aiInput={guard:true};return;}
  if(f.rally>=100&&!f.attack&&!f.stun&&this.aiWait<=0){this.aiAction='rally';this.aiInput={};this.aiWait=1.4;return;}
  if(f.stun>0){
   // Queue a response to a hit already received. It waits for the same legal
   // request/input gate as a human, rather than losing the whole input window.
   if(!this.aiBufferedDefense&&f.reaction>0&&(!easy||this.aiEscapeRollHit!==this.aiReceivedHit)){
    // Warm-up gets one chance per received contact, including a failed roll.
    // Formal mode retains the original response and random-number sequence.
    if(easy)this.aiEscapeRollHit=this.aiReceivedHit;
    if(this.rng()<(easy?.38:1))this.aiBufferedDefense=!easy&&f.reaction<=.11?'punch':this.rng()<(easy?.30:.55)?'jump':'guard';
   }
   return;
  }
  if(f.attack)return;
  if(grounded(f)&&Math.abs(f.y-o.y)>60&&this.aiRecovery<=0&&this.aiWait<=0){this.aiInput={left:dir<0&&dist>115,right:dir>0&&dist>115};if(f.y>o.y)this.aiAction='jump';else if(dist<140)this.aiAction='punch';this.aiWait=easy?.6:.3;return;}
  // Recovery delays the next offensive action, not legal movement/defense.
  // This small retreat is triggered by OUR action ending, never fresh input
  // from the opponent. Ordinary retreat guard still loses to grabs/guard break.
  // Only replace movement: an already-earned guard/crouch lasts for its
  // defense window, including the frame when offensive recovery expires.
  if(this.aiRecovery>0&&dist<170)this.aiInput={...this.aiInput,left:dir>0,right:dir<0};
  if(this.aiBufferedDefense==='punch'&&this.aiRecovery>0){this.aiInput={guard:true};return;}
  if(this.aiBufferedDefense){
   const response=this.aiBufferedDefense;this.aiBufferedDefense=null;this.aiWait=Math.min(this.aiWait,easy?.35:.12);
   if(grounded(f)){
    this.aiDefense=response==='guard'?(easy?.25:.42):0;
    this.aiInput=response==='guard'?{guard:true}:response==='punch'||easy&&this.aiRecovery>0?{}:{left:dir<0,right:dir>0};
    if(response==='jump')this.aiAction='jump';
    else if(response==='punch'){if(dist<130)this.aiAction='punch';else{this.aiInput={left:dir<0,right:dir>0};this.aiWait=0;}}
    return;
   }
  }
  if(!grounded(f)){
   if(f.vy>0&&Math.abs(f.y-o.y)<120&&dist<130&&this.aiWait<=0&&this.aiRecovery<=0){this.aiAction='punch';this.aiWait=easy?.8:.38;}
   return;
  }
  const threat=threats.find(t=>this.elapsed>=t.observation.nextCheckAt);
  // Delay the FIRST response as well as rechecks of a sustained threat. Only
  // this matured observation may inform the choice, not another fresh threat.
  if(threat){
   const helperThreat=threat.kind==='assist',visible=threat.kind==='attack'||helperThreat,current=helperThreat?threat.source.move:visible?currentMove:null,projectile=threat.kind==='projectile'?threat.source:null,queue=threat.kind==='queue';
   threat.observation.nextCheckAt=this.elapsed+(easy?.40:.16)+this.rng()*(easy?.28:.14);
   if(this.rng()<(easy?.4:.78)){
    this.aiDefense=easy?.24:.30;
    const remaining=visible?(current?.hits?.[0].start??current?.start??.1)-(helperThreat?threat.source.age-threat.source.warning:o.attack.age):0;
    const defensive=CAST[f.type].moves.map((m,i)=>({m,i})).filter(({m,i})=>f.cooldowns[i]===0&&['counter','reject','calm','armor'].includes(m.behavior)&&m.start<remaining&&dist<155&&(m.behavior==='counter'?current?.contact:m.behavior==='reject'?current?.contact:true));
    if(visible&&current?.behavior==='grab'){this.aiInput={};this.aiAction='jump';}
    else if(queue||projectile?.phase==='lob'||projectile?.height==='low'||visible&&current?.height==='low'){this.aiInput={};this.aiAction='jump';}
    else if(defensive.length&&this.rng()<.65){const pick=defensive[Math.min(defensive.length-1,Math.floor(this.rng()*defensive.length))];this.aiInput={};this.aiAction='special'+(pick.i+1);}
    else if(projectile?.height==='high'&&this.rng()<.5)this.aiInput={crouch:true};
    else this.aiInput={guard:true};
    return;
   }
  }
  if(!f.item&&!seekingHeal&&this.aiRecovery===0&&this.aiDefense===0){
   const item=visibleItems.filter(i=>this.elapsed>=this.aiItems.get(i)).sort((a,b)=>Math.abs(a.x-f.x)-Math.abs(b.x-f.x))[0];
   if(item)this.aiInput={left:item.x<f.x,right:item.x>f.x};
  }
  if(this.aiDefense>0||this.aiWait>0||this.aiRecovery>0)return;
  this.aiWait=(easy?.60:.32)+this.rng()*(easy?.55:.3);
  if(f.item&&dist<520){this.aiInput={};this.aiAction='punch';return;}
  if(seekingHeal&&this.rng()<.85){this.aiInput={};this.aiAction='special3';return;}
  const candidates=CAST[f.type].moves.map((m,i)=>({m,i})).filter(({m,i})=>f.cooldowns[i]===0&&
   (m.behavior==='heal'?f.hp<=f.maxHp*.85&&dist>190:['counter','reject','calm'].includes(m.behavior)?dist<165&&!!knowsAttack:m.behavior==='grab'?dist<145:m.behavior==='queue'?dist>150&&dist<390:m.behavior==='projectile'||m.behavior==='lob'?dist>155:m.behavior==='word'?dist<330:dist<(m.range??150)+(m.behavior==='rush'||m.steps?120:15)));
  if(candidates.length&&this.rng()<.78){const pick=candidates[Math.min(candidates.length-1,Math.floor(this.rng()*candidates.length))];this.aiInput.guard=false;this.aiInput.crouch=false;this.aiAction='special'+(pick.i+1);}
  else if(dist<130){this.aiInput.guard=false;this.aiInput.crouch=false;this.aiAction='punch';}
 }
}
