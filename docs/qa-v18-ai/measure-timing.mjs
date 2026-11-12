import {Duel} from '../../dist/core.mjs';
const observations=[];
for(const difficulty of ['normal','easy'])for(const roll of [0,.999999]){
 let draws=0;const g=new Duel('su',difficulty,()=>draws++===0?roll:0,'han');g.player.x=400;g.enemy.x=510;g.aiWait=10;g.press('special3');let observedAt;
 for(let n=0;n<130&&!g.enemy.guard;n++){g.step(1/120,{},true);if(observedAt===undefined&&g.aiThreats.size)observedAt=g.elapsed;}
 observations.push({difficulty,delayRoll:roll,observedAt:+observedAt.toFixed(6),guardAt:+g.elapsed.toFixed(6),observedToGuard:+(g.elapsed-observedAt).toFixed(6)});
}
const recovery=[];
for(const difficulty of ['normal','easy'])for(const roll of [0,.999999]){
 const g=new Duel('wang',difficulty,()=>roll,'han');g.player.x=400;g.enemy.x=510;g.aiWait=0;g.enemy.cooldowns=[9,9,9];g.request(g.enemy,'punch');const first=g.enemy.attack;
 while(g.enemy.attack===first)g.step(1/120,{},true);const ended=g.elapsed;g.player.x=g.enemy.x-90;
 for(let n=0;n<240&&!g.enemy.attack;n++)g.step(1/120,{},true);
 recovery.push({difficulty,gapRoll:roll,endedAt:+ended.toFixed(6),followupAt:+g.elapsed.toFixed(6),gap:+(g.elapsed-ended).toFixed(6)});
}
console.log(JSON.stringify({observations,recovery},null,2));
