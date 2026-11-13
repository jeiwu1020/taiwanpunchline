// Diagnostic sample, not a human difficulty rating. Uses ordinary AI requests,
// accepted moves and unmodified health; no quick-view or forced victory.
import assert from 'node:assert/strict';
import {FinaleArena} from '../dist/preview/finale/finale-engine.mjs';
const ids=['wang','han','huang','su','ko','ma','chen'];
for(const difficulty of ['beginner','easy','hard']){
 let wins=0,maxLock=0,completed=0;
 for(const [index,id]of ids.entries())for(let seed=1;seed<=3;seed++){
  let n=seed+index*13;const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  const team=[id,...ids.filter(x=>x!==id).slice(0,2)],g=new FinaleArena({team,difficulty,rng});let lock=0,peak=0;
  for(let step=0;step<18000&&g.status==='active';step++){
   const input=g.player.hp>0?g.aiInputFor(g.player,1/60):{};g.step(1/60,input);
   assert.ok(g.actors.every(f=>[f.hp,f.x,f.depth,f.stun,f.guardBroken].every(Number.isFinite)));
   if(g.player.hp>0&&(g.player.stun>0||g.player.guardBroken>0)){lock+=1/60;peak=Math.max(peak,lock);}else lock=0;
  }
  if(g.status==='over')completed++;if(g.winner==='player')wins++;maxLock=Math.max(maxLock,peak);
 }
 assert.equal(completed,21,'every sampled battle must finish');
 console.log(JSON.stringify({difficulty,runs:21,wins,completed,maxContinuousPlayerStunSeconds:Number(maxLock.toFixed(2))}));
}
