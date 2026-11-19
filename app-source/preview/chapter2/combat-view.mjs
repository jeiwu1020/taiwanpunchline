// UI descriptions, not an independent source of combat timings or damage.
export const MOVE_READABILITY={
 rush:{label:'低身突進',symbol:'↘',color:'#bb7a2f',action:'蜷身翻滾接近，低身時能鑽過高招，撞中後推開。',counter:'跳過衝撞或格擋；關鍵出招時仍可用低招或抓技造成傷害。'},
 counter:{label:'近身反擊',symbol:'↩',color:'#967126',action:'戴上墨鏡接一次近身打擊，回敬後自己退開。飛行物不會隔空反傷。',counter:'用抓取、飛行物，或等架勢結束再打。'},
 heal:{label:'喝完回復',symbol:'＋',color:'#41775a',action:'完整喝完才回復氣勢；受擊中斷會噴水，水花沒有傷害。',counter:'抬杯前 0.4 秒有演出保護；之後出拳、突進或飛行物仍能中斷回復。'},
 coin:{label:'高招',symbol:'↑',color:'#a77724',action:'高處送出快速金幣，迫使對手蹲下或改變站位。',counter:'蹲低躲過、格擋，或把金幣反射、吹散。'},
 han_knee:{label:'低身喊話',symbol:'↘',color:'#35888c',action:'雙腿盤在身前，以膝蓋交替支撐接近，再抬頭喊出中段震退。低姿可躲高招；關鍵膝行與喊話不因非致命受擊取消，照樣扣氣勢。',counter:'格擋喊話、離開範圍或等收招；抓技與連擊仍照常扣血。'},
 arrow:{label:'落點攻擊',symbol:'◎',color:'#b04d39',action:'拉弓指向發射時的位置，落點圈不追蹤；延遲落箭造成重擊。',counter:'離開落點最可靠，或及時格擋；不能隔空反射落箭。'},
 ma_handshake:{label:'抓取破防',symbol:'✋',color:'#b96639',action:'禮貌伸手抓住地面對手，連格擋與防反也能抓。不是即死技。',counter:'看到伸手就跳起或後退；落空後可近身懲罰。'},
 ma_gaze:{label:'抬掌對空',symbol:'↗',color:'#496f9f',action:'抬眼向上推掌，對空中的對手威力較大，地面只是較輕的推擊。',counter:'留在地面格擋，或先退到抬掌範圍外。'},
 ma_cough:{label:'兩咳清彈',symbol:'≈',color:'#8b705e',action:'掩口咳兩下，各有一次短程高段氣圈，也能吹散一枚直線飛行物；兩段關鍵動作有演出保護但照樣扣氣勢。',counter:'蹲下或格擋兩段，等收招再打；落點攻擊不會被吹走。'},
 su_shout:{label:'重壓防守',symbol:'!',color:'#ad6631',action:'麥克風前怒喊，中段震退；格擋這招會一次消耗兩格耐力；關鍵喊話有演出保護但照樣扣氣勢。',counter:'退開或跳出範圍，或等喊完抓收招；不要只一直擋。'},
 su_rush:{label:'低段三連步',symbol:'»',color:'#a7672e',action:'雙臂平衡，三次踏步依序帶出貼地衝擊；不是三拍動畫只打一拳。',counter:'跳開、格擋或近身防反造成傷害；擋完三步再抓收招。'},
 su_dare:{label:'近身重反',symbol:'↩',color:'#a7672e',action:'招手邀戰，短時間接住近身攻擊才回重拳；落空的破綻較大。',counter:'用抓取、飛行物，或假出手等架勢消失。'},
 huang_shout:{label:'震退撞牆',symbol:'⇒',color:'#835d99',action:'指向前方咆哮，長距離震退；撞牆可回彈一次，不形成無限連段。',counter:'格擋、離開喊話範圍，或等收招再出手。'},
 huang_debt:{label:'拒收反射',symbol:'↶',color:'#835d99',action:'攤手拒收一次近身打擊但不自動反傷；金幣、紙機會真的掉頭反射，最多一次。',counter:'抓取、延遲第二擊或落點攻擊；反射後的飛行物仍能躲、擋。'},
 huang_queue:{label:'地面攔停',symbol:'⌁',color:'#a84f40',action:'放下一道短暫排隊線，第一次跨越時造成傷害並消失；非演出保護中的對手會被攔退。',counter:'跳過，或用普攻、飛行物先打掉；不是永久牆。'},
 chen_dream:{label:'折返高招',symbol:'↶',color:'#628575',action:'紙飛機高處飛出再折返，去回各能命中一次；被格擋或反射就結束原本回程。',counter:'蹲下、格擋或反射；也要留意飛回來的第二次時機。'},
 chen_question:{label:'先高後低',symbol:'↕',color:'#4e7e5f',action:'雙掌先後拋出問號，第一下高、第二下低，逼對手改變姿勢。',counter:'可以格擋兩段；只一直蹲會吃第二下，跳躍需抓低段時機。'},
 chen_calm:{label:'減傷退開',symbol:'↙',color:'#4e7e5f',action:'聳肩把一次普通傷害縮小，自己退開，不反傷，也沒有後續無敵。',counter:'抓取可以突破，第二擊也能追上；牆邊退開空間有限。'},
 ko_bags:{label:'低掃連揮',symbol:'↗',color:'#39818b',action:'藍袋先低掃，綠袋再打中段；兩手交替，袋子也能掃掉排隊線。',counter:'格擋兩段後反擊，或抓時機防反造成傷害。'},
 ko_name:{label:'落字減速',symbol:'◎',color:'#39818b',action:'破音字彈拋起，落在明確圈選的位置；未格擋命中才短暫減慢腳步，不鎖按鍵。',counter:'離開落點、跳起或格擋，就不會被地面落字拖慢。'},
 ko_resolve:{label:'一次硬扛',symbol:'◇',color:'#39818b',action:'握拳站穩，護甲可帶進自己的下一次普攻；遭到一次非抓取攻擊會減傷、不停手也不後退。改出其他特殊技就取消。',counter:'第二擊、抓取或等架勢消失；不是無敵，也不自動反擊。'},
};
export const moveCue=kind=>{const v=MOVE_READABILITY[kind];return v?`${v.symbol} ${v.label}`:''};
export function guardView(f){const pips=Math.max(0,Math.min(3,Math.floor(Number.isFinite(f.guardPips)?f.guardPips:3))),broken=(f.guardBroken||0)>0;return {pips,broken,label:broken?'破防！':`防守 ${pips}/3`};}
export function combatStatus(f){if(f.guardBroken>0)return '破防空檔';if(f.armor>0)return '吃一擊不停手';if(f.slow>0)return '腳步變慢';if(f.lowProfile)return '低身躲高招';return MOVE_READABILITY[f.attack?.kind]?.label||'';}

export const impactY=e=>(e.to?.y??430)-(e.height==='high'?252:e.height==='low'?65:145);
