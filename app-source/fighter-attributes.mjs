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
 wang:Object.freeze({title:'鐵胃金鐘開麥',move:'喝水回氣／從從容容',short:'喝水 +5 附 1.4 秒金鐘，反擊 1.5×！',summary:'喝水回氣 +5（共回 15）並附 1.4 秒金鐘硬甲；從從容容窗口延長，反擊 1.5× 爆擊退 +20！'}),
 han:Object.freeze({title:'發財雙幣天女箭',move:'發財金幣波／一支穿雲箭',short:'金幣變雙幣連發，穿雲箭範圍加大 +5 傷！',summary:'發財金幣波連噴金光大幣加第 2 枚小幣；一支穿雲箭紅金光柱加寬、擊退 +12 且傷害 +5！'}),
 su:Object.freeze({title:'電火球碎障三連撞',move:'衝衝衝／在那叫什麼',short:'衝衝衝碎拒馬末擊 +6，吼叫震碎 3 格防！',summary:'衝衝衝直接撞碎排隊拒馬，第 3 擊傷害 +6、破 2 格防；在那叫什麼加寬並一次震碎全部 3 格防禦！'}),
 huang:Object.freeze({title:'加倍奉還鋼鐵人龍',move:'我有欠你喔／可以這樣插隊喔',short:'拒馬變 2 次黃金緩速牆，彈道具 1.6×！',summary:'可以這樣插隊喔升格為黃金拒馬：可擋 2 次、+5 傷且緩速壓 2 格防；我有欠你喔反彈飛行道具變 1.6× 金光爆彈！'}),
 ma:Object.freeze({title:'黃金神手暈眩爆震',move:'死亡之握／酷酷嫂',short:'死亡之握 +4 傷重暈，清嗓全掃場並緩速！',summary:'死亡之握附 +4 震傷、眼冒金星與重度遲緩；酷酷嫂金霧掃光全場直線道具並衝擊緩速！'}),
 chen:Object.freeze({title:'超音速夢想回春手',move:'有夢最美／有這麼嚴重嗎',short:'紙飛機 1.32× 超音速 +4，定神回 +5 震退！',summary:'有夢最美紙飛機 1.32× 加速、飛距 +120、去回 +4 傷；有這麼嚴重嗎擋下攻擊回 +5 氣勢並震退近敵！'}),
 ko:Object.freeze({title:'雙層鋼鐵大字緩速',move:'我不會屈服／賴祥德',short:'2 層霸體下次重拳 1.75×，點名震暈加寬！',summary:'我不會屈服變 2 層長效霸體，下次普攻 1.75× 破 2 格防；賴祥德金框巨字砸地短暈並重度緩速！'}),
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
