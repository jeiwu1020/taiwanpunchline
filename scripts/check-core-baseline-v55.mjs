import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Duel as Current,CAST} from '../dist/core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),ref=process.argv[2]||'f823dc19995fc86569bbd75a2ba6178dedf6b0f8';
const original=execFileSync('git',['show',ref+':dist/core.mjs'],{cwd:root,encoding:'utf8'}).replaceAll("from './",`from '${pathToFileURL(root+'dist/').href}`);
const {Duel:Baseline}=await import('data:text/javascript;base64,'+Buffer.from(original).toString('base64'));
function run(Duel,player,enemy,difficulty,seed){
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),g=new Duel(player,difficulty,rng,enemy),trace=[];
 for(let n=0;n<4000&&g.status==='active';n++){
  if(n%30===0)g.press('punch');if(n%97===0)g.press('special'+(n/97%3+1));
  const dx=g.enemy.x-g.player.x;g.step(1/60,{left:Math.abs(dx)>110&&dx<0,right:Math.abs(dx)>110&&dx>0},true);
  trace.push([g.player.hp,g.enemy.hp,g.player.x,g.enemy.x,g.player.y,g.enemy.y,g.player.attack?.kind,g.enemy.attack?.kind,g.aiWait,g.aiRecovery,g.projectiles.length,g.obstacles.length,g.items.length]);g.events=[];
 }
 return JSON.stringify(trace);
}
let rounds=0;
for(const difficulty of ['easy','normal'])for(const player of Object.keys(CAST))for(const enemy of Object.keys(CAST))for(const seed of [4,18]){
 if(run(Baseline,player,enemy,difficulty,seed)!==run(Current,player,enemy,difficulty,seed))throw Error('Legacy trace drift '+[difficulty,player,enemy,seed].join('/'));rounds++;
}
console.log(JSON.stringify({baseline:ref,rounds,result:'identical',coverage:'All 49 pairings, both legacy difficulties, seeds 4 and 18. Every frame: HP, XY, attack, AI wait/recovery, projectile/obstacle/item counts. Assists omitted.'},null,2));
