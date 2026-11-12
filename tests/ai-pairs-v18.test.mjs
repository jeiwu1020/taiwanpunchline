import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from '../dist/core.mjs';
const rngFor=initial=>{let seed=initial;return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
function play(player,enemy,difficulty,seed,side=1){
 const g=new Duel(player,difficulty,rngFor(seed),enemy),events=[];g.player.x=side>0?260:700;g.enemy.x=side>0?700:260;
 for(let frame=0;frame<5000&&g.status==='active';frame++){
  const dx=g.enemy.x-g.player.x,dist=Math.abs(dx);
  if(frame%20===0)g.press('punch');if(frame%43===0)g.press('special'+(1+Math.floor(frame/43)%3));if(frame%109===0)g.press('jump');
  g.step(1/60,{left:dist>110&&dx<0,right:dist>110&&dx>0,guard:frame%97<6,crouch:frame%137<10},true);
  for(const f of [g.player,g.enemy]){
   for(const key of ['x','y','hp','stun','guardPips','guardBroken','armor'])assert.ok(Number.isFinite(f[key]),key);
   assert.ok(f.hp>=0&&f.hp<=f.maxHp);assert.ok(f.x>=68&&f.x<=892);assert.ok(f.guardPips>=0&&f.guardPips<=3);
   assert.ok(f.cooldowns.every(t=>Number.isFinite(t)&&t>=0));
   assert.ok(g.projectiles.filter(p=>p.owner===f&&p.kind==='dream').length<=1);
   assert.ok(g.obstacles.filter(q=>q.owner===f).length<=1);
  }
  events.push(...g.events.filter(e=>['hit','block','move','jump','counter','reject'].includes(e.type)).map(e=>[frame,e.type,e.f?.id,e.from?.id,e.kind??e.impact,e.amount]));g.events=[];
 }
 assert.equal(g.status,'over','a seeded fight must finish, not deadlock');
 assert.ok(events.some(e=>e[2]==='enemy'||e[3]==='enemy'),'the AI must participate');
 return{winner:g.winner,hp:[g.player.hp,g.enemy.hp],elapsed:g.elapsed,events};
}
// Break caught: timing state or threat identity can strand a matchup, create
// invalid physics, or make seeded behavior non-reproducible. Winners are not a
// fairness metric; the side-symmetric numerical combat tests cover the rules.
for(const player of Object.keys(CAST))for(const enemy of Object.keys(CAST))for(const difficulty of ['easy','normal'])test(`${player}/${enemy}/${difficulty}: seeded full-round smoke on both sides`,()=>{
 play(player,enemy,difficulty,17,1);play(player,enemy,difficulty,42,-1);
});
test('AI timing remains deterministic for the same seed and input sequence',()=>{
 assert.deepEqual(play('huang','chen','normal',2026),play('huang','chen','normal',2026));
});
