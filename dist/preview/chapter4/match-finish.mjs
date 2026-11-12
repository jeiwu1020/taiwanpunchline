import {battleResultCopy} from './stage-expansion.mjs?v=campaign-visuals-20261112-r2';
import {COMBAT} from './combat-rules.mjs?v=campaign-visuals-20261112-r2';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
// Only read-only visual data crosses the boundary. Nothing here steps combat,
// changes health, calculates a winner, or schedules a delayed game action.
export function captureFinishSnapshot(duel){
 const fighters=[duel.player,duel.enemy].map(f=>Object.freeze({...Object.fromEntries(Object.entries(f).filter(([,v])=>v===null||typeof v!=='object')),attack:f.attack?Object.freeze({...f.attack}):null,performance:f.performance?Object.freeze({...f.performance}):null}));
 const reason=fighters.every(f=>f.hp<=0)?'double-ko':fighters.some(f=>f.hp<=0)?'ko':'timeout';
 return Object.freeze({winner:duel.winner,reason,fighters:Object.freeze(fighters)});
}
export function createFinishSequence(duel,{reducedMotion=false,artTime=0,camera=null}={}){
 const snapshot=duel.finishSnapshot||captureFinishSnapshot(duel);
 return {...snapshot,reducedMotion,artTime,camera:camera?{...camera}:null,elapsed:0,title:battleResultCopy(duel).title,cue:snapshot.reason==='timeout'?'時間到！':snapshot.reason==='double-ko'?'雙方倒下！':'勝負已定！'};
}
export function finishBeat(sequence,elapsed=sequence.elapsed){
 const age=Math.max(0,elapsed),reduced=sequence.reducedMotion;
 const phase=reduced?'announce':age<140?'freeze':age<1940?'slow':'announce';
 const progress=reduced?0:clamp((age-140)/1800);
 return {phase,progress,settle:ease(progress),artTime:sequence.artTime+(reduced?0:500*progress),done:age>=(reduced?650:2640)};
}
export function finishFighterView(sequence,index,beat=finishBeat(sequence)){
 const source=sequence.fighters[index],defeated=sequence.reason==='double-ko'||sequence.winner!=='draw'&&source.id!==sequence.winner,role=defeated?'defeated':sequence.winner==='draw'?'draw':'winner';
 if(sequence.reducedMotion||beat.phase==='freeze')return {fighter:{...source,flash:0},rotation:0,role};
 const p=beat.settle,collapse=defeated&&sequence.reason!=='timeout',duration=source.performance?.actionDuration||COMBAT[source.attack?.kind]?.duration||.36;
 // Finish the existing pose in visual time only, then settle the hands. The
 // action object's age is a copy, never the cleared combat action.
 const attack=source.attack?{...source.attack,age:source.attack.age+(Math.max(.5,duration+.2-source.attack.age))*p}:null;
 const fighter={...source,attack:beat.phase==='announce'?null:attack,performance:null,flash:0,move:(source.move||0)*(1-p),guard:false,stun:collapse?.4:0,reaction:collapse?.28:Math.max(0,(source.reaction||0)*(1-p)),grabPose:0,grabbedPose:0,land:0,crouch:false,crouchBlend:(source.crouchBlend||0)*(1-p)+(collapse?.92:0)*p,x:clamp(source.x+(collapse?-source.face*10:0)*p,48,912),y:source.y+Math.max(0,(source.supportY??430)-source.y)*p};
 return {fighter,rotation:-(source.face||1)*(collapse?.38:defeated?.08:sequence.winner==='draw'?.025:.025)*p,role};
}
// Pointerup/click from the finishing punch is never a new result-screen press.
export class FinishPressGate{
 constructor(){this.cancel();}
 cancel(){this.ready=false;this.pointer=null;this.key=null;this.repeat=false;}
 arm(){this.cancel();this.ready=true;}
 pointerDown(id){if(this.ready)this.pointer=id;}
 keyDown(code,repeat){if(this.ready&&['Enter','Space'].includes(code)){this.repeat=!!repeat;this.key=repeat?null:code;}}
 release(){this.pointer=null;this.key=null;this.repeat=false;}
 click(event={}){const pointer=(event.detail||0)>0||event.pointerType;const allowed=this.ready&&(pointer?this.pointer!==null&&(event.pointerId==null||event.pointerId===this.pointer):this.key!==null||event.isTrusted===true&&!this.repeat);this.release();return !!allowed;}
}
