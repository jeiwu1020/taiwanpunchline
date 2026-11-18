import {resolveDialogueFrame} from '../../character-dialogue.mjs?v=chapter-presentation-20261117-r1';
// Playable review draft. Reveal final opponent only at boss-comic.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHARACTER_NAMES=freeze({wang:'恰吉王',han:'韓國魚',huang:'咆哮哥',su:'電火球',ko:'柯P',ma:'小馬哥',chen:'阿扁仔'});
export const STEP_IDS=freeze(['entry','route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic','boss','handoff-comic','roster-choice']);
export const CHAPTER2=freeze({
 "id": "chapter-2",
 "campaignId": "mic-chase-season-1",
 "title": "追麥疑雲",
 "status": "playable",
 "requiredClears": [
  "chapter-1"
 ],
 "nextChapterId": "chapter-3",
 "boss": {
  "characterId": "su",
  "name": "電火球",
  "matchFormat": "best-of-three",
  "unlockCharacterId": "su"
 },
 "assumptions": [
  "虛構喜劇；沿用既有美術、戰鬥與共用存檔。"
 ],
 "routes": [
  {
   "id": "chapter-2:route-a",
   "name": "騎樓早市",
   "theme": "market",
   "width": 2600,
   "motifs": [
    "anonymous-broadcast",
    "entry-stamp"
   ],
   "objective": "神麥在騎樓高處閃光。穿過早市，別追到只剩早餐香！",
   "visualBrief": "磁磚騎樓、鐵窗、早餐蒸籠、紅塑膠椅、停好的機車；保留可繞行的前後路線。",
   "comicDetail": "催場板只寫「請先驗章」，旁邊攤販寫「湯很燙，慢慢喝」。",
   "platforms": [
    {
     "left": 940,
     "right": 1190,
     "y": 342,
     "kind": "stall",
     "depth": -32,
     "depthHalf": 30
    },
    {
     "left": 1740,
     "right": 1880,
     "y": 370,
     "kind": "crate",
     "depth": 56,
     "depthHalf": 26
    }
   ],
   "spawns": [
    [
     "placard",
     510
    ],
    [
     "leaflet",
     950
    ],
    [
     "placard",
     680,
     1350
    ],
    [
     "barricade",
     1750
    ]
   ],
   "supplyX": 1960,
   "supplyDepth": -45,
   "gate": {
    "id": "chapter-2:miniboss-a",
    "kind": "miniboss",
    "name": "催場隊長",
    "opponent": "su",
    "mobKind": "mini_mic",
    "identityStatus": "proposal-only",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構活動催場員，忙著檢查入場章；不影射另一位真實人物。",
    "tell": "先舉驗章牌、壓低身體，再連衝三步；下一輪才補一拳。",
    "counterplay": "橫向對決；看到衝刺就跳起或格擋，等三步結束再靠近反擊。",
    "dialogue": [
     [
      "催場隊長",
      "等一下！入場先驗章，驗完再蓋章！章沒乾不准走，乾了要重新驗！"
     ],
     [
      "player",
      "本來追麥就好，現在還要集章？你這不是管入場，是在開集點大會！借過！",
      "c2.mini0"
     ]
    ]
   }
  },
  {
   "id": "chapter-2:route-b",
   "name": "廟埕側巷",
   "theme": "temple-approach",
   "width": 2900,
   "motifs": [
    "anonymous-broadcast",
    "detour"
   ],
   "objective": "跟著廣播鑽進側巷，繞過場佈桌椅。神麥還在前頭！",
   "visualBrief": "廟埕外側紅磚、燈籠、帆布棚、飲料攤與折疊桌；不在神像或供桌上戰鬥。",
   "comicDetail": "「安靜通行」告示旁，擴音器正在全力試音。",
   "platforms": [
    {
     "left": 1040,
     "right": 1320,
     "y": 342,
     "kind": "table",
     "depth": 42,
     "depthHalf": 28
    },
    {
     "left": 1840,
     "right": 2060,
     "y": 350,
     "kind": "stall",
     "depth": -46,
     "depthHalf": 30
    }
   ],
   "spawns": [
    [
     "leaflet",
     540
    ],
    [
     "barricade",
     980
    ],
    [
     "placard",
     1480
    ],
    [
     "leaflet",
     1950
    ],
    [
     "barricade",
     2440
    ]
   ],
   "supplyX": 2210,
   "supplyDepth": 60,
   "gate": {
    "id": "chapter-2:miniboss-b",
    "kind": "miniboss",
    "name": "動線總管",
    "opponent": "su",
    "mobKind": "mini_guard",
    "identityStatus": "proposal-only",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構場務總管，牌子越擺越多，自己也找不到出口。",
    "tell": "直線衝三步後停頓，再吸氣喊話，最後近身補章。",
    "counterplay": "跳過低段衝刺，喊話前拉開距離或格擋；等收招再回頭，不要一直跳。",
    "dialogue": [
     [
      "動線總管",
      "往左排、往右走，再繞回來確認你有排！出口？照我的牌子走，保證還會見到我！"
     ],
     [
      "player",
      "你畫得圓滿，我跑得難看！繞一圈又見到你，這叫動線還是迴力鏢？牌子收起來！",
      "c2.mini1"
     ]
    ]
   }
  },
  {
   "id": "chapter-2:route-c",
   "name": "集合廣場",
   "theme": "public-gathering",
   "width": 3200,
   "motifs": [
    "covered-stage",
    "microphone"
   ],
   "objective": "沿廣場邊追到舞台前，別讓布幕擋住神麥的去向！",
   "visualBrief": "公共廣場、活動舞台、音箱、旗串、停在側邊的裝飾花車；旗面使用虛構圖樣。",
   "comicDetail": "沒有署名的路牌指向布幕後的舞台，台邊工作人員忙著收線。",
   "platforms": [
    {
     "left": 1040,
     "right": 1260,
     "y": 350,
     "kind": "crate",
     "depth": -44,
     "depthHalf": 26
    },
    {
     "left": 1720,
     "right": 2010,
     "y": 330,
     "kind": "stage",
     "depth": 40,
     "depthHalf": 30
    }
   ],
   "spawns": [
    [
     "leaflet",
     630
    ],
    [
     "placard",
     1020
    ],
    [
     "barricade",
     1500
    ],
    [
     "leaflet",
     2170
    ],
    [
     "placard",
     2660
    ]
   ],
   "supplyX": 2510,
   "supplyDepth": -55,
   "gate": {
    "id": "chapter-2:boss",
    "kind": "boss",
    "name": "電火球",
    "opponent": "su",
    "identityStatus": "existing-roster",
    "mechanicsStatus": "existing-su-duel"
   }
  }
 ],
 "story": {
  "entry": {
   "status": "playable",
   "sourceChapterId": "chapter-1",
   "frames": [
    {
     "speaker": "旁白",
     "title": "差一隻手，差半條街",
     "copy": "最後一波音浪「啵！」地彈過街角，神麥又竄上騎樓高處。人還在喘，它倒像來逛早市的。",
     "shot": "sound-trail",
     "direction": "接第一章咆哮哥最後一道音浪把神麥彈到早市；同一神麥，沒有回到臥室。"
    },
    {
     "speaker": "player",
     "title": "早餐先欠著",
     "voiceKey": "c2.entry",
     "copy": "本來追的是發言權，現在連早餐都沒得選！穿騎樓、走廣場，別再跟著音量繞圈！",
     "shot": "market-trail",
     "direction": "街頭視角只見主角與高處神麥，仍不確定終點；不切入臥室，不描述隔窗張望。"
    },
    {
     "speaker": "遠處廣播",
     "title": "指路還是繞路？",
     "copy": "各位街坊請注意，前往廣場請走側巷！走錯的朋友別緊張，再走一次就熟了！",
     "shot": "anonymous-broadcast",
     "direction": "畫面只有主角與神麥線索，不出現關主、肖像、姓名、口頭禪或招牌動作。"
    }
   ]
  },
  "beforeBoss": {
   "status": "playable",
   "frames": [
    {
     "speaker": "電火球",
     "title": "追麥追到台前來",
     "copy": "跑到這裡，還在那叫什麼！麥剛落到架上，誰帶隊守住它，先比一場。腳步有沒有拳頭快，要試試看嘛？",
     "shot": "su-dare",
     "direction": "神麥清楚掛在架上；電火球招手，先交代物件位置再開打。"
    },
    {
     "speaker": "player",
     "title": "先講好規則",
     "voiceKey": "c2.boss",
     "copy": "三戰兩勝，贏的帶隊，輸的盯緊麥架！別說得游刃有餘，一轉頭又讓大家連滾帶爬！",
     "shot": "duel-contract",
     "direction": "兩人點頭；旁邊裝飾花車綵帶垂過麥架，埋下章尾因果。"
    },
    {
     "speaker": "咆哮哥",
     "title": "先聽一秒",
     "copy": "等一下，封印上的燈怎麼比剛才暗？我只是在旁邊問，沒人對著麥講過話吧？",
     "shot": "duel-contract"
    }
   ]
  },
  "handoff": {
   "status": "playable",
   "cause": "parade-prop",
   "nextChapterId": "chapter-3",
   "frames": [
    {
     "speaker": "電火球",
     "title": "才加入，先別跑",
     "copy": "好，算你行，你帶隊！先看清架上那些綵帶，別急著伸手。我一起顧，這次別讓麥先衝！",
     "shot": "handover",
     "direction": "只有取得兩勝後播放；先確認電火球加入可選角色。"
    },
    {
     "speaker": "旁白",
     "title": "話才講完，麥又走了",
     "copy": "兩人還沒碰到麥，旁邊花車已經開動。氣球綵帶驟然繃緊，將勾住的神麥從架上吊起，越過眾人頭頂。",
     "shot": "ribbon-catch",
     "direction": "特寫綵帶、麥克風與花車的連接，連續演出拉緊、提起與離開，不能直接瞬移。"
    },
    {
     "speaker": "player",
     "title": "先追車，再開講",
     "voiceKey": "c2.handoff",
     "copy": "封印燈越來越暗，逃跑倒是游刃有餘！跟緊綵帶，連它從哪裡來都要問清楚！",
     "shot": "follow-parade",
     "direction": "路牌指向第三章；可自由換角，但接著追車，不回起床序章。"
    }
   ]
  }
 }
});

export function storyFrames(kind,characterId='wang'){
 if(!Object.hasOwn(CHARACTER_NAMES,characterId))throw new RangeError('Unknown preview character');
 const name=CHARACTER_NAMES[characterId];
 const frames=CHAPTER2.story[kind]?.frames;if(!frames)throw new RangeError('Unknown story');
 return frames.map(frame=>resolveDialogueFrame({...frame,speaker:frame.speaker==='player'?name:frame.speaker},characterId));
}
