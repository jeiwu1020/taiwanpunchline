// Chapter 3 standalone candidate. All new dialogue and settings are editable fiction.
// The file names retain chapter2- prefixes for parity with the Site #53 engine.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHARACTER_NAMES=freeze({wang:'恰吉王',han:'韓國魚',huang:'咆哮哥',su:'電火球',ko:'柯P',ma:'小馬哥',chen:'阿扁仔'});
export const STEP_IDS=freeze(['entry','route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic','boss','handoff-comic','roster-choice']);
export const CHAPTER2=freeze({
 id:'chapter-3',campaignId:'mic-chase-season-1',title:'麥到請排隊',status:'playable-review-draft',
 requiredClears:['chapter-2'],nextChapterId:'chapter-4',
 boss:{characterId:'ko',name:'柯P',matchFormat:'best-of-three',unlockCharacterId:'ko'},
 assumptions:['獨立預覽假設第二章已通關，恰吉王、韓國魚、咆哮哥、電火球可選；不讀寫正式存檔。','街景、小 Boss、對白與章尾去向均為可修改草案；虛構活動喜劇，不影射犯罪或添加政治立場。','沿用 #53 角色骨架與操作，三張新場景由免費內建生圖製作；瀏覽器與手機實機另待驗收。'],
 routes:[
  {id:'chapter-3:route-a',name:'花車側街',theme:'parade-street',width:2800,motifs:['ribbon-trail','queue'],
   objective:'沿花車留下的綵帶，追向市民廣場。',
   visualBrief:'磁磚騎樓、鐵窗、停好的機車、花車旗串；延續第二章午後色調與前後走位。',
   comicDetail:'路口告示只問「你覺得神麥往哪走？」；答案旁還要填滿意度。',
   platforms:[{left:940,right:1190,y:342,kind:'stall',depth:-32,depthHalf:30},{left:1740,right:1880,y:370,kind:'crate',depth:56,depthHalf:26}],
   spawns:[['placard',520],['leaflet',900],['barricade',1340],['placard',1720],['leaflet',2150]],supplyX:1940,supplyDepth:-45,
   gate:{id:'chapter-3:miniboss-a',kind:'miniboss',name:'民調隊長',opponent:'wang',mobKind:'mini_mic',identityStatus:'proposal-only',mechanicsStatus:'telegraphed-pattern-reusing-core',
    concept:'虛構街頭民調活動主持，連問路都要做問卷；沒有指涉另一位真實人物。',
    tell:'舉起問卷先喊題目，再用短距離兩次普通拳催交答案。',counterplay:'橫向對決；看問卷預警，先退開或防守，再利用收招空檔。',
    dialogue:[['民調隊長','追麥之前先回答：你支持向左、向右，還是再問一遍？'],['player','麥都往右飛了，你這民調再慢一點，只能問它的背影！']]}
  },
  {id:'chapter-3:route-b',name:'市民服務街',theme:'civic-arcade',width:3000,motifs:['form-counter','queue'],
   objective:'穿過服務騎樓，跟上綵帶晃動的方向。',
   visualBrief:'磁磚騎樓、布告欄、便民服務窗口、紅塑膠椅與折疊桌；保留可繞行前後路線。',
   comicDetail:'窗口掛著「少跑一趟」，下一張卻寫「請至隔壁領取申請表」。',
   platforms:[{left:1040,right:1320,y:342,kind:'table',depth:42,depthHalf:28},{left:1840,right:2060,y:350,kind:'stall',depth:-46,depthHalf:30}],
   spawns:[['leaflet',540],['barricade',980],['placard',1480],['leaflet',1950],['barricade',2440]],supplyX:2210,supplyDepth:60,
   gate:{id:'chapter-3:miniboss-b',kind:'miniboss',name:'程序總管',opponent:'huang',mobKind:'mini_guard',identityStatus:'proposal-only',mechanicsStatus:'telegraphed-pattern-reusing-core',
    concept:'虛構活動服務站管理員，為了減少流程又增加一張流程表。',
    tell:'先舉牌預告，再擺路牌或蓄力喊話。',counterplay:'橫向對決；跳過路牌、拉開距離，利用喊話後的空檔。',
    dialogue:[['程序總管','領麥請填表。沒有表？先填一張「我要領表」的表！'],['player','等你蓋完章，麥克風都要領敬老卡了！先讓我過！']]}
  },
  {id:'chapter-3:route-c',name:'市民廣場',theme:'civic-square',width:3200,motifs:['covered-stage','ribbon'],
   objective:'追到花車停靠處，找出替神麥解結的人。',
   visualBrief:'市民廣場、樹蔭、社區活動台、音箱、停在側邊的音響車；只用虛構活動圖樣。',
   comicDetail:'綵帶已解開，麥架旁留著一張「找失物請排隊」的手寫紙。',
   platforms:[{left:1040,right:1260,y:350,kind:'crate',depth:-44,depthHalf:26},{left:1720,right:2010,y:330,kind:'stage',depth:40,depthHalf:30}],
   spawns:[['placard',560],['leaflet',940],['barricade',1380],['placard',1840],['leaflet',2360],['barricade',2700]],supplyX:2510,supplyDepth:-55,
   gate:{id:'chapter-3:boss',kind:'boss',name:'柯P',opponent:'ko',identityStatus:'existing-roster',mechanicsStatus:'existing-ko-duel'}
  }
 ],
 handoffContract:{sourceChapterId:'chapter-3',nextChapterId:'chapter-4',vehicle:'sound-truck',micCarrier:'wheeled-stand',destination:'候車街口',unlock:'ko',status:'proposal-only'},
 story:{
  entry:{status:'proposal-only',sourceChapterId:'chapter-2',frames:[
   {speaker:'旁白',title:'車在走，麥也走',copy:'花車的綵帶還勾著神麥，一路晃向市民廣場。剛加入的電火球也跟著追了上來。',shot:'ribbon-follow',direction:'承接 #53 第二章綵帶勾麥；同一條綵帶連到花車，不換物件、不回起床序章。'},
   {speaker:'player',title:'比遊行還準時',copy:'人家遊行是沿路揮手，我們是沿路伸手！先追上那台車，別讓它繞完一圈。',shot:'parade-trail',direction:'主角在前景追車，神麥保持空中可見，遠處綵帶指向廣場。'},
   {speaker:'遠處廣播',title:'前方請先排隊',copy:'找失物的、領號碼牌的，請排同一隊。找號碼牌的，請先別把隊伍弄丟！',shot:'anonymous-broadcast',direction:'只有主角、花車與綵帶線索；本章 Boss 不出現肖像、姓名或招牌動作。'}
  ]},
  beforeBoss:{status:'proposal-only',frames:[
   {speaker:'柯P',title:'結解了，人來了',copy:'我才剛把綵帶解開，你們就追到了。這支麥比整台花車還會加班。',shot:'ko-reveal',direction:'此時才揭曉柯P；神麥插回可移動麥架，綵帶已鬆落在旁。'},
   {speaker:'player',title:'先比完，再拿麥',copy:'三戰兩勝，贏的人拿麥，輸的人一起追。先說好，這次誰都別替它叫車！',shot:'duel-contract',direction:'雙方點頭；遠處工讀生把音箱搬上下一站音響車，預示章尾搬錯麥架。'}
  ]},
  handoff:{status:'proposal-only',cause:'sound-cart-mixup',nextChapterId:'chapter-4',frames:[
   {speaker:'柯P',title:'這局算你的',copy:'好，照約定。麥給你，我也一起走。總不能追了半天，連一句都還沒講到。',shot:'handover',direction:'只有取得兩勝後播放；柯P加入本次可選角色，鏡頭保留同一麥架。'},
   {speaker:'場務工讀生',title:'連架一起收！',copy:'下一站要開場囉！工讀生把麥架當成待搬器材，連神麥一起推上音響車，開往候車街口。',shot:'cart-catch',direction:'鏡頭連續演出工讀生推麥架上車；從當前位置移走，禁止神麥瞬移。'},
   {speaker:'player',title:'車資算它的',copy:'我們才剛說別叫車，它連司機都找好了！往下一站追，這趟車資算麥克風的！',shot:'follow-cart',direction:'路牌指向第四章活動下一站；可自由換角，不重播前兩章或起床序章。'}
  ]}
 }
});
export function storyFrames(kind,characterId='wang'){
 if(!Object.hasOwn(CHARACTER_NAMES,characterId))throw new RangeError('Unknown preview character');
 const name=CHARACTER_NAMES[characterId];
 const frames=CHAPTER2.story[kind]?.frames;if(!frames)throw new RangeError('Unknown story');
 return frames.map(frame=>({...frame,speaker:frame.speaker==='player'?name:frame.speaker}));
}
