// Initial trial values, shared by challenge, VS and training. These are not a
// claim of balance. Move damage, timings, rush speeds and jump physics live in
// combat-rules; these attributes only scale the existing combat categories.
const row=(maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier)=>Object.freeze({maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1});
export const FIGHTER_BASE_ATTRIBUTES=Object.freeze({
 wang:row(95,1.06,.96,1),han:row(105,.94,.96,1),ma:row(95,1.04,1.02,1),
 su:row(110,.96,1.04,1.04),huang:row(95,1,.98,.96),chen:row(95,1.04,.98,.98),ko:row(105,.96,1.06,1.04),
});
const branches=Object.freeze({hp:['maxHp',.03],move:['moveMultiplier',.01],basic:['basicMultiplier',.02],defense:['damageTakenMultiplier',-.015],special:['specialMultiplier',.02],rally:['rallyMultiplier',.02],assist:['assistMultiplier',.02]});
export function fighterBaseStats(id){
 if(typeof id!=='string'||!Object.hasOwn(FIGHTER_BASE_ATTRIBUTES,id))throw new RangeError('Unknown fighter ID');
 return {...FIGHTER_BASE_ATTRIBUTES[id]};
}
export function deriveFighterStats(id,{skills={},challenge=false}={}){
 const base=fighterBaseStats(id),ranks={},bonus={},factors={},effective={};
 for(const [skill,[stat,perPoint]] of Object.entries(branches)){
  const rank=challenge?(Object.hasOwn(skills??{},skill)?skills[skill]:0):0;
  if(!Number.isInteger(rank)||rank<0||rank>5)throw new RangeError('Invalid fighter skill rank');
  ranks[skill]=rank;factors[stat]=1+perPoint*rank;effective[stat]=base[stat]*factors[stat];bonus[stat]=effective[stat]-base[stat];
 }
 return {...effective,base,bonus,factors,skills:ranks,spent:Object.values(ranks).reduce((sum,n)=>sum+n,0),challenge:!!challenge};
}
