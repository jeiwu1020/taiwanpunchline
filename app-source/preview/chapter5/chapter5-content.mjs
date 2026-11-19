import {resolveDialogueFrame} from '../../character-dialogue.mjs?v=chapter-presentation-20261117-r1';
// A shared journey: no new wake-up sequence when an unlocked fighter takes over.
import {CHARACTER_NAMES,STEP_IDS} from '../chapter4/chapter4-content.mjs?v=chapter-presentation-20261117-r1';
export {CHARACTER_NAMES,STEP_IDS};
export const STARTER_IDS=Object.freeze(['wang','han','huang','su','ko','ma']);
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHAPTER5=freeze({
 id:'chapter-5',campaignId:'mic-chase-season-1',title:'最後一張保管單',status:'playable',requiredClears:['chapter-4'],nextChapterId:'finale-3v4',
 boss:{characterId:'chen',name:'阿扁仔',matchFormat:'best-of-three',unlockCharacterId:'chen'},
 handoffContract:{entry:{sourceChapterId:'chapter-4',vehicle:'sound-truck',carrier:'wheeled-stand',newCompanion:'ma',destination:'議場器材歸還處'},exit:{nextChapterId:'finale-3v4',carrier:'locked-stand',destination:'議場中庭',newCompanion:'chen'}},
 routes:[
  {id:'chapter-5:route-a',name:'器材歸還街',theme:'civic-arcade',width:2500,motifs:['return-label','wheeled-stand'],objective:'跟著器材車到歸還處。走內側繞桌，補給在外側。',visualBrief:'台南廟口的紙飛機徽記歸還櫃台、墨綠編號箱與清點動線。',comicDetail:'借出一支麥，歸還時要清點一整條街。',
   platforms:[{left:780,right:1050,y:342,kind:'table',depth:-30,depthHalf:28},{left:1540,right:1720,y:370,kind:'crate',depth:55,depthHalf:26}],spawns:[['placard',480],['leaflet',860],['barricade',1280],['placard',650,1500],['leaflet',1900]],supplyX:1840,supplyDepth:65,
   gate:{id:'chapter-5:miniboss-a',kind:'miniboss',name:'清點隊長',opponent:'wang',mobKind:'mini_schedule',identityStatus:'fictional',tell:'先舉清單，再敲兩下確認。',counterplay:'第一拳退開，第二拳收招後反擊；小頭目一局決勝。',dialogue:[['清點隊長','六個人、一座架、一支麥……誰把我的筆借走了？'],['player',"本來追神麥，現在追原子筆？你的清單越清越多，我的早餐越追越遠！",'c5.mini0'],['清點隊長','筆不用追，通行章要拿！兩下點名，站穩了！']]}
  },
  {id:'chapter-5:route-b',name:'封印檔案廊',theme:'old-city-ceremony',width:2700,motifs:['seal-record','return-label'],objective:'沿歸還編號找到封印紀錄。揪團可開路，也能繞過排隊線。',visualBrief:'綠色卷宗檔案騎樓、封印大冊、印章與眼鏡茶攤。',comicDetail:'「免附影本」的告示背面，夾著三張影本。',
   platforms:[{left:930,right:1180,y:350,kind:'stall',depth:50,depthHalf:30},{left:1730,right:1930,y:342,kind:'table',depth:-48,depthHalf:28}],spawns:[['barricade',540],['leaflet',1020],['placard',780,1400],['leaflet',1750],['barricade',2160]],supplyX:1510,supplyDepth:-65,
   gate:{id:'chapter-5:miniboss-b',kind:'miniboss',name:'試音總管',opponent:'huang',mobKind:'mini_marshal',identityStatus:'fictional',tell:'先亮試音牌，再擺線與喊話。',counterplay:'先跳過排隊線，再離開喊話範圍；長收招是反擊機會。',dialogue:[['試音總管','我試的是這台擴音器，鎖架上的神麥別動。一、二……奇怪，明明還有第三聲。'],['player',"第三聲是後面大家的肚子叫！從早餐等到現在，紀錄到底找好了沒有？",'c5.mini1a'],['試音總管','封印紀錄寫著「請勿以大喊催促解封」。你們偏偏一路喊來，難怪我要重數！'],['player',"好，小聲過招，大聲放行！最後一站，別再讓人從容進來、爬著出去！",'c5.mini1b']]}
  },
  {id:'chapter-5:route-c',name:'議場封印前庭',theme:'public-gathering',width:2850,motifs:['sealed-stage','microphone'],objective:'通過最後的場務人潮。麥架已固定，這次把保管人也找齊。',visualBrief:'議場封印保管門、七枚清點燈與紙飛機封印紀錄櫃，終戰再入議場。',comicDetail:'牌子寫「請勿移動」，旁邊又貼一張「交接時請合力搬運」。',
   platforms:[{left:1010,right:1210,y:370,kind:'crate',depth:-50,depthHalf:26},{left:1810,right:2100,y:330,kind:'stage',depth:40,depthHalf:30}],spawns:[['placard',530],['leaflet',930],['barricade',1370],['placard',1810],['leaflet',2260]],supplyX:2370,supplyDepth:-55,
   gate:{id:'chapter-5:boss',kind:'boss',name:'阿扁仔',opponent:'chen',identityStatus:'existing-roster'}
  }
 ],
 story:{
  entry:{frames:[
   {speaker:'旁白',title:'這次不是搬錯',copy:'小馬哥檢查固定帶，柯P核對歸還標籤。器材車停在議場外的廟口歸還街；紙飛機徽記下，編號箱已排好，麥架也卸下了。',shot:'truck-unload',direction:'承接第四章主動護送，工讀生停車後與大家合力卸下同一座圓底無輪麥架，封印鎖保持原狀。'},
   {speaker:'小馬哥',title:'放穩了再換手',copy:'先放穩，我檢查一下底座，等會兒換手搬。大家輪流出力，握手可以輪流，腰可不能輪流閃到。',shot:'rolling-stand'},
   {speaker:'player',title:'麥不跑，流程會跑',voiceKey:'c5.entry',copy:'本來以為追麥結束，現在換追保管單！這張紙最好不要還有下一站！',shot:'anonymous-broadcast'}
  ]},
  beforeBoss:{frames:[
   {speaker:'阿扁仔',title:'最後一個保管人',copy:'清單在這，架固定、帶拆掉、車熄火。神麥的封印鎖還沒開，先辦交接；難道連各位的腳也要點名才肯停？',shot:'chen-reveal'},
   {speaker:'player',title:'就差誰先講',voiceKey:'c5.boss',copy:'一路追到現在，麥還鎖著！三戰兩勝，贏的拿保管單帶隊。先從容把手續辦完，別又忙著追紙！',shot:'duel-contract'},
   {speaker:'阿扁仔',title:'規則也要說完',copy:'可以。最後一頁別丟，有封印就有說明書。大家不看，出了問題又要問阿扁錯了嗎？',shot:'chen-ready'}
  ]},
  handoff:{nextChapterId:'finale-3v4',frames:[
   {speaker:'阿扁仔',title:'七個人，一支麥',copy:'照約定，保管單交給你，我帶說明書。麥先鎖在架上，七個人一起到中庭；誰先用，得讓大家說清楚。',shot:'handover'},
   {speaker:'咆哮哥',title:'我還沒問完',copy:'從早上等到現在，我還沒問完！七個人一人一套規則，要吵到哪時候？一起比一場，誰先發言一次講清楚！',shot:'duel-contract'},
   {speaker:'柯P',title:'把人分好再吵',copy:'場地借了，先分隊。你挑兩個，其他四個一隊。三對四，算術沒錯；公平的部分，等打完再討論。',shot:'team-ready'},
   {speaker:'player',title:'這次誰也不用追',voiceKey:'c5.handoff',copy:'整座鎖架放穩，先固定好！最後站著的那隊，解封後先拿麥講。誰也別再忙著搬器材！',shot:'finale-ready'}
  ]}
 }
});
export function storyFrames(kind,characterId='wang'){
 if(!Object.hasOwn(CHARACTER_NAMES,characterId))throw new RangeError('Unknown character');
 const frames=CHAPTER5.story[kind]?.frames;if(!frames)throw new RangeError('Unknown story');
 return frames.map(f=>resolveDialogueFrame({...f,speaker:f.speaker==='player'?CHARACTER_NAMES[characterId]:f.speaker},characterId));
}
