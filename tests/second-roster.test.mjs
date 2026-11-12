import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from '../dist/core.mjs';

test('all 49 pairs finish complete matches on both difficulties across three deterministic seeds',()=>{
 const ids=['wang','han','ma','su','huang','chen','ko'];let completed=0;
 for(const player of ids)for(const enemy of ids)for(const difficulty of ['easy','normal'])for(let seed of [17,2026,87654321]){
  const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),g=new Duel(player,difficulty,rng,enemy);
  for(let frame=0;frame<8000&&g.status==='active';frame++){
   const dx=g.enemy.x-g.player.x,dist=Math.abs(dx);
   if(frame%20===0)g.press('punch');
   if(frame%31===0)g.press('special'+(1+Math.floor(rng()*3)));
   if(frame%101===0)g.press('jump');
   g.step(1/60,{left:dist>110&&dx<0,right:dist>110&&dx>0,crouch:frame%91<12,guard:rng()<.05},true);
   g.events.splice(0);
   for(const f of [g.player,g.enemy]){
    for(const key of ['x','y','hp','counter','brace','stun'])assert.ok(Number.isFinite(f[key]),`${player}/${enemy}: ${key}`);
    assert.ok(f.x>=68&&f.x<=892);assert.ok(f.hp>=0&&f.hp<=f.maxHp);assert.ok(f.cooldowns.every(n=>Number.isFinite(n)&&n>=0));
   }
  }
  assert.equal(g.status,'over',`${player}/${enemy} ${difficulty} must finish`);completed++;
 }
 assert.equal(completed,294);
});
