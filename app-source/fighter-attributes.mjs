// Initial trial values, shared by challenge, VS and training. These are not a
// claim of balance. Move damage, timings, rush speeds and jump physics live in
// combat-rules; these attributes only scale the existing combat categories.
const row=(maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier)=>Object.freeze({maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1});
export const FIGHTER_BASE_ATTRIBUTES=Object.freeze({
 wang:row(95,1.06,.96,1),han:row(105,.94,.96,1),ma:row(95,1.04,1.02,1),
 su:row(110,.96,1.04,1.04),huang:row(95,1,.98,.96),chen:row(95,1.04,.98,.98),ko:row(105,.96,1.06,1.04),
});
const branches=Object.freeze({hp:['maxHp',.03],move:['moveMultiplier',.01],basic:['basicMultiplier',.02],defense:['damageTakenMultiplier',-.015],special:['specialMultiplier',.02],rally:['rallyMultiplier',.02],assist:['assistMultiplier',.02]});
export const RANK5_PERKS=Object.freeze({
 wang:Object.freeze({title:'鐵胃金鐘開麥',move:'保溫杯／跳起過肩',summary:'喝茶回復增至 14 並附金鐘硬甲；過肩反擊窗口延長且爆擊退 +10、1.3× 回擊'}),
 han:Object.freeze({title:'發財雙幣天女箭',move:'發財金幣／一支穿雲箭',summary:'噴出金光超大金幣加第 2 枚小幣；穿雲箭爆裂加寬且傷害 +4'}),
 su:Object.freeze({title:'電火球碎障三連撞',move:'三步跨衝／大聲公震場',summary:'三步跨衝可震碎排隊線並強化末擊；大聲公直接震碎全部 3 格防禦'}),
 huang:Object.freeze({title:'加倍奉還鋼鐵人龍',move:'今天我拒絕／先去排隊',summary:'成功反彈飛行道具變 1.6× 金光爆彈；排隊線持久加粗、壓 2 格防禦'}),
 ma:Object.freeze({title:'黃金神手暈眩爆震',move:'死亡之握／喉嚨卡卡',summary:'死亡之握附帶眼冒金星與重度遲緩；清嗓咳整排掃光對手飛行道具'}),
 chen:Object.freeze({title:'超音速夢想回春手',move:'夢想紙飛機／莫忘初衷',summary:'紙飛機加速 1.32×、飛距 +120 且去回 +3 傷；定神觸發立刻回復 +4 氣勢'}),
 ko:Object.freeze({title:'雙層鋼鐵大字緩速',move:'鋼鐵硬扛／亂說話點名',summary:'硬扛升格為 2 層超久霸體與下次普攻 +20%；點名大字砸地加寬且重度緩速'}),
});
export function specialPerkFor(id,specialRank=0,challenge=false){
 if(typeof id!=='string'||!Object.hasOwn(RANK5_PERKS,id))return null;
 const unlocked=!!challenge&&specialRank>=5;
 return Object.freeze({id,...RANK5_PERKS[id],rank:specialRank,requiredRank:5,unlocked,active:unlocked});
}
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
 return {...effective,base,bonus,factors,skills:ranks,spent:Object.values(ranks).reduce((sum,n)=>sum+n,0),challenge:!!challenge,perk:specialPerkFor(id,ranks.special,!!challenge)};
}
