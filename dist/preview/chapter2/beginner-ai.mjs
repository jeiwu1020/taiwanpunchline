import {CAST} from './roster.mjs?v=workers-background-only-20261113-r1';
import {COMBAT} from './combat-rules.mjs?v=workers-background-only-20261113-r1';
// Only decisions differ. Shared combat determines damage, health, collision,
// cooldowns and legal input on both sides.
export const BEGINNER_AI=Object.freeze({reaction:.75,reactionSpread:.35,decision:1.55,decisionSpread:.8,recovery:1.1,recoverySpread:.4,defenseChance:.12,specialChance:.28});
const grounded=f=>f.y>=(f.supportY??430)-1&&f.vy>=0;
export function thinkBeginner(g,dt){
 const f=g.enemy,o=g.player,dist=Math.abs(f.x-o.x),dir=o.x>=f.x?1:-1,rules=BEGINNER_AI;
 g.aiWait-=dt;g.aiRecovery=Math.max(0,g.aiRecovery-dt);g.trackAIRecovery();g.aiDefense=Math.max(0,g.aiDefense-dt);g.aiAction=null;g.aiBufferedDefense=null;
 const threats=[];
 if(o.attack&&o.attack.age>.05&&dist<(COMBAT[o.attack.kind]?.range??130)+15)threats.push(o.attack);
 for(const p of g.projectiles)if(p.owner===o&&!p.dead&&(p.phase==='lob'?Math.abs(p.targetX-f.x)<65:Math.abs(p.x-f.x)<290))threats.push(p);
 for(const a of g.assists)if(a.owner===o&&a.phase==='warning'&&Math.abs(a.actor.x-f.x)<260)threats.push(a);
 const visible=new Set(threats);for(const source of g.aiThreats.keys())if(!visible.has(source))g.aiThreats.delete(source);
 for(const source of threats)if(!g.aiThreats.has(source)){const readyAt=g.elapsed+rules.reaction+g.rng()*rules.reactionSpread;g.aiThreats.set(source,{seenAt:g.elapsed,readyAt,nextCheckAt:readyAt});}
 const approach=dist>118&&g.aiRecovery<=0;g.aiInput={left:approach&&dir<0,right:approach&&dir>0,guard:g.aiDefense>0};
 if(f.stun>0||f.guardBroken>0||f.attack)return;
 // An unguarded, readable opening rather than a guarded retreat.
 if(g.aiRecovery>0){g.aiInput={};return;}
 const observed=threats.find(source=>g.elapsed>=g.aiThreats.get(source).nextCheckAt);
 if(observed){g.aiThreats.get(observed).nextCheckAt=g.elapsed+rules.reaction+g.rng()*rules.reactionSpread;if(g.rng()<rules.defenseChance){g.aiDefense=.18;g.aiInput={guard:true};return;}}
 if(g.aiDefense>0||g.aiWait>0)return;g.aiWait=rules.decision+g.rng()*rules.decisionSpread;
 if(grounded(f)&&Math.abs(f.y-o.y)>60){g.aiInput={left:dir<0&&dist>115,right:dir>0&&dist>115};if(f.y>o.y)g.aiAction='jump';return;}
 if(!grounded(f))return;
 if(f.rally>=100){g.aiAction='rally';g.aiInput={};return;}
 if(f.item&&dist<420){g.aiAction='punch';g.aiInput={};return;}
 const candidates=CAST[f.type].moves.map((m,i)=>({m,i})).filter(({m,i})=>f.cooldowns[i]===0&&
  (m.behavior==='heal'?f.hp<70&&dist>220:['counter','reject','calm','armor','queue'].includes(m.behavior)?false:m.behavior==='projectile'||m.behavior==='lob'?dist>170:m.behavior==='word'?dist<260:m.behavior==='grab'?dist<130:dist<(m.range??130)+(m.behavior==='rush'||m.steps?60:0)));
 if(candidates.length&&g.rng()<rules.specialChance){const pick=candidates[Math.min(candidates.length-1,Math.floor(g.rng()*candidates.length))];g.aiAction='special'+(pick.i+1);g.aiInput={};}
 else if(dist<130){g.aiAction='punch';g.aiInput={};}
}
