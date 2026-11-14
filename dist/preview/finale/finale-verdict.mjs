// Explain the existing count-first rule; this module never adjudicates a match.
export function finaleVerdictText(world){
 const teams=[0,1].map(team=>world.actors.filter(f=>f.team===team&&f.hp>0));
 const counts=teams.map(team=>team.length),health=teams.map(team=>team.reduce((sum,f)=>sum+f.hp/f.maxHp,0));
 if(!counts[0]||!counts[1])return !counts[0]&&!counts[1]?'雙方同時倒下，本場重試。':!counts[1]?'對手全員倒下，我方獲勝。':'我方全員倒下。';
 const score=`時間到：我方 ${counts[0]} 人、對手 ${counts[1]} 人。`;
 return score+(counts[0]!==counts[1]?'先比存活人數，人多的一隊獲勝；血量再高也不能抵掉人數差。':`人數相同，再比剩餘生命比例總和：我方 ${(health[0]*100).toFixed(1)}%、對手 ${(health[1]*100).toFixed(1)}%。`);
}
