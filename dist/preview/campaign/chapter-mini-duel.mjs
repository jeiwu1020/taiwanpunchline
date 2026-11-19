import {Duel} from '../../core.mjs?v=chapter-presentation-20261117-r1';
import {challengeOpponentStats} from '../../challenge-opponent-policy.mjs?v=chapter-presentation-20261117-r1';
// One telegraph/recovery implementation; chapters supply only pattern data.
export class ChapterMiniDuel extends Duel{
 constructor(spec,{characterId,helperId,difficulty,rng,stats}){
  super(characterId,difficulty,rng,spec.type,{playerAssist:helperId,playerStats:stats,enemyStats:challengeOpponentStats(spec.type,{kind:'miniboss'}),enemyKind:'miniboss',enemyMoves:spec.moves});
  this.nextItemAt=Infinity;this.enemy.noRally=true;this.enemy.mobKind=spec.mobKind;this.enemy.displayName=spec.name;this.miniSpec=spec;this.miniPattern=0;this.miniPhase='approach';this.miniWait=.5;this.miniPendingAction=null;this.miniLastWarningName=null;this.warning=null;
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
   const idx=spec.action==='punch'?-1:Number(spec.action.at(-1))-1;
   const ready=idx<0||e.cooldowns[idx]<=0;
   const actualAction=ready?spec.action:'punch';
   const warningName=ready?spec.name:(spec.fallbackName||'順勢補拳！');
   this.miniPendingAction=actualAction;
   this.miniLastWarningName=warningName;
   this.miniPhase='warning';this.miniWait=spec.warning*(this.difficulty==='beginner'?1.3:1);this.warning={name:warningName,action:actualAction,remaining:this.miniWait};
   this.events.push({type:'minibossWarning',name:warningName,action:actualAction,f:e});return;
  }
  if(this.warning)this.warning.remaining=this.miniWait;
  if(this.miniWait>0)return;
  this.aiAction=this.miniPendingAction||'punch';
  this.miniPhase='rest';this.miniWait=spec.rest;this.warning=null;
 }
 thinkAssist(){} // Fictional solo minibosses do not summon politician helpers.
 drainEvents(){return this.events.splice(0).map(e=>e.type==='move'&&e.f===this.enemy?{...e,name:this.miniLastWarningName||this.miniSpec.pattern[this.miniPattern%this.miniSpec.pattern.length].name,fictionalMini:true}:e);}
}
