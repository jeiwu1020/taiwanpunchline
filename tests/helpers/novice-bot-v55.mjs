import {Duel} from '../../dist/core.mjs';
const rngFor=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
export function noviceRound(enemy,difficulty,seed,bot,player='wang',assists=false){
 const rng=rngFor(seed),g=new Duel(player,difficulty,rng,enemy,assists?{playerAssist:'su',enemyAssist:'su'}:{});let received=0,dealt=0;
 for(let frame=0;frame<3600&&g.status==='active';frame++){
  const dx=g.enemy.x-g.player.x,d=Math.abs(dx);
  // Limited scripts, not simulated children. No current-attack or hidden-state reading.
  if(frame%(bot==='mash'?24:48)===0)g.press('punch');
  if(bot==='mash'&&frame%150===0)g.press('special'+(1+(frame/150)%3));
  if(assists&&frame===360)g.press('assist');
  const guard=bot==='guard'&&frame%240>=160&&frame%240<190;
  g.step(1/60,{left:!guard&&d>110&&dx<0,right:!guard&&d>110&&dx>0,guard},true);
  for(const e of g.events)if(['hit','block'].includes(e.type)){if(e.to===g.player)received+=e.amount;else dealt+=e.amount;}
  g.events=[];
 }
 return {received,dealt,won:g.winner==='player',winner:g.winner,status:g.status,elapsed:g.elapsed};
}
