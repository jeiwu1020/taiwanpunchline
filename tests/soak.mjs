import {Duel} from '../dist/core.mjs';
let seed=123456789;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
let maxProjectiles=0,maxEvents=0,maxSteps=0,winners={player:0,enemy:0,draw:0},samples=[];const before=performance.now();
for(let run=0;run<2000;run++){
 let g=new Duel(run%2?'wang':'han',run%3?'normal':'easy',rng),steps=0;
 while(g.status==='active'&&steps<8000){
  const dx=g.enemy.x-g.player.x,dist=Math.abs(dx);
  const input={left:dist>110&&dx<0,right:dist>110&&dx>0,guard:rng()<.05};
  if(steps%20===0)g.press('punch');if(steps%31===0)g.press('special'+(1+Math.floor(rng()*3)));if(steps%101===0)g.press('jump');
  g.step(1/60,input,true);steps++;
  maxProjectiles=Math.max(maxProjectiles,g.projectiles.length);maxEvents=Math.max(maxEvents,g.events.length);g.events.splice(0);
  for(const f of[g.player,g.enemy])if(!Number.isFinite(f.x)||!Number.isFinite(f.y)||!Number.isFinite(f.hp)||f.hp<0||f.hp>100)throw new Error('invalid state');
 }
 if(g.status!=='over')throw new Error('round failed to terminate');maxSteps=Math.max(maxSteps,steps);winners[g.winner]++;
 if(run%250===0){global.gc();samples.push({run,heapMB:+(process.memoryUsage().heapUsed/1048576).toFixed(2)});}
}
global.gc();console.log(JSON.stringify({rounds:2000,winners,maxProjectiles,maxEvents,maxSteps,seconds:+((performance.now()-before)/1000).toFixed(2),heapSamples:samples,finalHeapMB:+(process.memoryUsage().heapUsed/1048576).toFixed(2)},null,2));
