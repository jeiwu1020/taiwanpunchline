import {challengeOpponentStats} from '../../challenge-opponent-policy.mjs?v=post69-street-seam-cull-20261112-r1';
import {Duel,GROUND} from './core.mjs?v=post69-street-seam-cull-20261112-r1';
import {ChallengeDepthRoute,DEPTH} from './challenge-depth-engine.mjs?v=post69-street-seam-cull-20261112-r1';
import {CHAPTER4} from './chapter4-content.mjs?v=post69-street-seam-cull-20261112-r1';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'wang',mobKind:'mini_schedule',name:'班表主任',pattern:[{action:'punch',name:'班表更新中！',range:112,warning:.55,rest:.65},{action:'punch',name:'還是即將抵達！',range:112,warning:.85,rest:1.25}]},
 'miniboss-b':{type:'huang',mobKind:'mini_marshal',name:'里程總監',pattern:[{action:'special3',name:'完賽證明呢！',range:220,warning:1.0,rest:1.6},{action:'special2',name:'缺一份口渴證明！',range:145,warning:.9,rest:1.8},{action:'special1',name:'最後一公里！',range:190,warning:1.0,rest:1.9}]}
});

class ChapterMiniDuel extends Duel{
 constructor(spec,{characterId,helperId,difficulty,rng,stats}){
  super(characterId,difficulty,rng,spec.type,{playerAssist:helperId,playerStats:stats,enemyStats:challengeOpponentStats(spec.type,{kind:'miniboss'})});
  this.nextItemAt=Infinity;this.enemy.mobKind=spec.mobKind;this.enemy.displayName=spec.name;this.miniSpec=spec;this.miniPattern=0;this.miniPhase='approach';this.miniWait=.5;this.warning=null;
 }
 think(dt){
  this.aiAction=null;this.aiInput={};const e=this.enemy,p=this.player,spec=this.miniSpec.pattern[this.miniPattern%this.miniSpec.pattern.length];
  if(e.hp<=0||e.stun>0||e.guardBroken>0)return;
  if(e.attack)return;
  this.miniWait=Math.max(0,this.miniWait-dt);
  if(this.miniPhase==='rest'){
   if(this.miniWait>0)return;this.miniPattern++;this.miniPhase='approach';return;
  }
  const dx=p.x-e.x;
  if(this.miniPhase==='approach'){
   if(Math.abs(dx)>spec.range){this.aiInput=dx>0?{right:true}:{left:true};return;}
   if(this.miniWait>0)return;
   this.miniPhase='warning';this.miniWait=spec.warning*(this.difficulty==='beginner'?1.3:1);this.warning={name:spec.name,remaining:this.miniWait};
   this.events.push({type:'minibossWarning',name:spec.name,f:e});return;
  }
  if(this.warning)this.warning.remaining=this.miniWait;
  if(this.miniWait>0)return;
  const idx=Number(spec.action.at(-1))-1;this.aiAction=spec.action==='punch'||e.cooldowns[idx]<=0?spec.action:'punch';
  this.miniPhase='rest';this.miniWait=spec.rest;this.warning=null;
 }
 thinkAssist(){} // Fictional solo minibosses do not summon politician helpers.
 drainEvents(){return this.events.splice(0).map(e=>e.type==='move'&&e.f===this.enemy?{...e,name:this.miniSpec.pattern[this.miniPattern%this.miniSpec.pattern.length].name,fictionalMini:true}:e);}
}
export function createChapter4Duel({stepId,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,stats}={}){
 const spec=Object.hasOwn(MINIBOSS_PATTERNS,stepId)?MINIBOSS_PATTERNS[stepId]:null;
 if(spec)return new ChapterMiniDuel(spec,{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-four duel');
 const d=new Duel(characterId,difficulty,rng,'ma',{playerAssist:helperId,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='小馬哥';d.drainEvents=()=>d.events.splice(0);return d;
}
export function createChapter4Route({routeIndex,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,carry=null,stats}={}){
 if(!Number.isInteger(routeIndex)||routeIndex<0||routeIndex>2)throw new RangeError('Unknown route');
 const route=new ChallengeDepthRoute(characterId,difficulty,rng,{section:0,playerAssist:helperId,carry,stats,runId:'chapter-4'});
 route.section=CHAPTER4.routes[routeIndex];route.sectionIndex=routeIndex;route.worldWidth=route.section.width;
 route.platforms=route.section.platforms.map(p=>({...p,depthHalf:p.depthHalf??DEPTH.platform}));return route;
}

export function chapter4ActorProjection(actor,{left=0,base=430,zoom=1}={}){
 return {x:(actor.x-left)*zoom,y:base+((actor.y??GROUND)-GROUND+(actor.depth??0)*.65)*zoom};
}
