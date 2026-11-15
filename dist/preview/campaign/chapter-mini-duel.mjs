import {Duel} from '../../core.mjs?v=rally-consistency-20261115-r1';
import {challengeOpponentStats} from '../../challenge-opponent-policy.mjs?v=campaign-boot-20261112-r3';
// One telegraph/recovery implementation; chapters supply only pattern data.
export class ChapterMiniDuel extends Duel{
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
   if(e.rally>=100&&!e.attack){this.aiAction='rally';this.aiInput={};this.miniPhase='rest';this.miniWait=1.4;this.warning=null;return;}
   this.miniPhase='warning';this.miniWait=spec.warning*(this.difficulty==='beginner'?1.3:1);this.warning={name:spec.name,action:spec.action,remaining:this.miniWait};
   this.events.push({type:'minibossWarning',name:spec.name,action:spec.action,f:e});return;
  }
  if(this.warning)this.warning.remaining=this.miniWait;
  if(this.miniWait>0)return;
  const idx=Number(spec.action.at(-1))-1;this.aiAction=spec.action==='punch'||e.cooldowns[idx]<=0?spec.action:'punch';
  this.miniPhase='rest';this.miniWait=spec.rest;this.warning=null;
 }
 thinkAssist(){} // Fictional solo minibosses do not summon politician helpers.
 drainEvents(){return this.events.splice(0).map(e=>e.type==='move'&&e.f===this.enemy?{...e,name:this.miniSpec.pattern[this.miniPattern%this.miniSpec.pattern.length].name,fictionalMini:true}:e);}
}
