const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function captureRoundState(duel){
 const side=f=>({rally:clamp(f.rally??0,0,100),assist:{used:!!f.assist?.used,charge:clamp(f.assist?.charge??100,0,100),damageTaken:Math.max(0,f.assist?.damageTaken??0),cursor:Math.max(0,f.assistCursor??0)}});
 return {player:side(duel.player),enemy:side(duel.enemy)};
}
export function restoreRoundState(duel,state){
 if(!state)return false;
 for(const key of ['player','enemy']){
  const f=duel[key],saved=state[key];if(!saved)continue;
  f.rally=clamp(saved.rally??0,0,100);
  if(f.assist){f.assist.used=!!saved.assist?.used;f.assist.charge=clamp(saved.assist?.charge??100,0,100);f.assist.damageTaken=Math.max(0,saved.assist?.damageTaken??0);f.assist.active=false;}
  const count=f.assistRoster?.length??0;f.assistCursor=count?Math.max(0,saved.assist?.cursor??0)%count:0;
 }
 return true;
}
