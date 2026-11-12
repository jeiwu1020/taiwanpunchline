import {CAST} from '../dist/core.mjs';
import {noviceRound} from '../tests/helpers/novice-bot-v55.mjs';
const report={description:'Deterministic limited-input scripts, not human/child playtesting. All seven player characters and all seven enemies; three scripts; four seeds. Same health, damage and legal combat for every difficulty.',runs:[]};
for(const assists of [false,true]){
 const summary=Object.fromEntries(['beginner','easy','normal'].map(k=>[k,{received:0,dealt:0,wins:0,draws:0,losses:0,unfinished:0,count:0,elapsed:0,byScript:Object.fromEntries(['jab','mash','guard'].map(k=>[k,{wins:0,draws:0,losses:0,unfinished:0,count:0}]))}]));
 for(const player of Object.keys(CAST))for(const enemy of Object.keys(CAST))for(const bot of ['jab','mash','guard'])for(const seed of [4,18,42,99])for(const difficulty of Object.keys(summary)){
  const r=noviceRound(enemy,difficulty,seed,bot,player,assists),s=summary[difficulty];s.received+=r.received;s.dealt+=r.dealt;s.wins+=r.won?1:0;s.count++;s.elapsed+=r.elapsed;
  const result=r.status!=='over'?'unfinished':r.winner==='player'?'wins':r.winner==='draw'?'draws':'losses';if(result!=='wins')s[result]++;s.byScript[bot][result]++;s.byScript[bot].count++;
 }
 report.runs.push({assists,summary:Object.fromEntries(Object.entries(summary).map(([difficulty,s])=>[difficulty,{...s,meanDamageReceived:+(s.received/s.count).toFixed(2),meanDamageDealt:+(s.dealt/s.count).toFixed(2),winRate:+(s.wins/s.count).toFixed(3),meanElapsed:+(s.elapsed/s.count).toFixed(2)}]))});
}
console.log(JSON.stringify(report,null,2));
