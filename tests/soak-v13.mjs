import assert from 'node:assert/strict';
import {Duel,CAST} from '../dist/core.mjs';
const ids=Object.keys(CAST),result={rounds:0,winners:{easy:{player:0,enemy:0,draw:0},normal:{player:0,enemy:0,draw:0}},aiMoves:{},maxProjectiles:0,maxQueues:0,maxSteps:0};
const start=performance.now();
for(const player of ids)for(const enemy of ids)for(const difficulty of ['easy','normal'])for(const initialSeed of [17,2026,87654321,42,105,999]){
 let seed=initialSeed;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),g=new Duel(player,difficulty,rng,enemy);let frame=0;
 for(;frame<8000&&g.status==='active';frame++){
  const dx=g.enemy.x-g.player.x,dist=Math.abs(dx);
  if(frame%20===0)g.press('punch');if(frame%31===0)g.press('special'+(1+Math.floor(rng()*3)));if(frame%101===0)g.press('jump');
  g.step(1/60,{left:dist>110&&dx<0,right:dist>110&&dx>0,crouch:frame%91<12,guard:rng()<.05},true);
  for(const f of [g.player,g.enemy]){
   for(const key of ['x','y','hp','guardPips','guardBroken','armor','slow','stun'])assert.ok(Number.isFinite(f[key]),`${player}/${enemy} ${key}`);
   assert.ok(f.x>=68&&f.x<=892&&f.hp>=0&&f.hp<=100);assert.ok(f.guardPips>=0&&f.guardPips<=3);
   assert.ok(g.projectiles.filter(p=>p.owner===f&&p.kind==='dream').length<=1);assert.ok(g.obstacles.filter(q=>q.owner===f).length<=1);
  }
  result.maxProjectiles=Math.max(result.maxProjectiles,g.projectiles.length);result.maxQueues=Math.max(result.maxQueues,g.obstacles.length);
  for(const e of g.events)if(e.type==='move'&&e.f===g.enemy)result.aiMoves[e.kind]=(result.aiMoves[e.kind]??0)+1;
  g.events=[];
 }
 assert.equal(g.status,'over',`${player}/${enemy} ${difficulty} seed${initialSeed}`);result.rounds++;result.winners[difficulty][g.winner]++;result.maxSteps=Math.max(result.maxSteps,frame);
}
result.seconds=+((performance.now()-start)/1000).toFixed(2);console.log(JSON.stringify(result,null,2));
