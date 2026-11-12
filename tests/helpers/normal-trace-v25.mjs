import {createHash} from 'node:crypto';
export function normalTrace(Duel,player,enemy){
 let seed=20261107;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const g=new Duel(player,'normal',rng,enemy),frames=[];
 g.player.x=400;g.enemy.x=550;
 for(let n=0;n<1800&&g.status==='active';n++){
  if(n%151===0)g.press('special'+(1+Math.floor(n/151)%3));else if(n%37===0)g.press('punch');
  if(n%233===0)g.press('jump');
  const dx=g.enemy.x-g.player.x;
  g.step(1/120,{left:Math.abs(dx)>110&&dx<0,right:Math.abs(dx)>110&&dx>0},true);
  frames.push([g.elapsed,g.status,g.player.hp,g.enemy.hp,...[g.player,g.enemy].flatMap(f=>[f.x,f.y,f.vy,f.guard,f.stun,f.attack?.kind,f.attack?.age,...f.cooldowns]),g.aiWait,g.aiRecovery,g.aiAction,g.events.map(e=>[e.type,e.kind,e.impact,e.amount,e.f?.id,e.from?.id,e.to?.id])]);g.events=[];
 }
 return createHash('sha256').update(JSON.stringify(frames)).digest('hex');
}
