// Chapter 3 standalone candidate. All new dialogue and settings are editable fiction.
// The file names retain chapter2- prefixes for parity with the Site #53 engine.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHARACTER_NAMES=freeze({wang:'恰吉王',han:'韓國魚',huang:'咆哮哥',su:'電火球',ko:'柯P',ma:'小馬哥',chen:'阿扁仔'});
export const STEP_IDS=freeze(['entry','route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic','boss','handoff-comic','roster-choice']);
export const CHAPTER2=freeze({
 "id": "chapter-3",
 "campaignId": "mic-chase-season-1",
 "title": "神麥的歸還地址",
 "status": "playable",
 "requiredClears": [
  "chapter-2"
 ],
 "nextChapterId": "chapter-4",
 "boss": {
  "characterId": "ko",
  "name": "柯P",
  "matchFormat": "best-of-three",
  "unlockCharacterId": "ko"
 },
 "assumptions": [
  "虛構喜劇；沿用既有美術、戰鬥與共用存檔。"
 ],
 "routes": [
  {
   "id": "chapter-3:route-a",
   "name": "花車側街",
   "theme": "parade-street",
   "width": 2500,
   "motifs": [
    "ribbon-trail",
    "queue"
   ],
   "objective": "追上綵帶尾端，找出花車的器材標籤。",
   "visualBrief": "磁磚騎樓、鐵窗、停好的機車、花車旗串；延續第二章午後色調與前後走位。",
   "comicDetail": "路口告示只問「你覺得神麥往哪走？」；答案旁還要填滿意度。",
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
     500
    ],
    [
     "leaflet",
     1000
    ],
    [
     "barricade",
     1660
    ]
   ],
   "supplyX": 1940,
   "supplyDepth": -45,
   "gate": {
    "id": "chapter-3:miniboss-a",
    "kind": "miniboss",
    "name": "民調隊長",
    "opponent": "wang",
    "mobKind": "mini_mic",
    "identityStatus": "proposal-only",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構街頭民調活動主持，連問路都要做問卷；沒有指涉另一位真實人物。",
    "tell": "舉起問卷先喊題目，再用短距離兩次普通拳催交答案。",
    "counterplay": "橫向對決；看問卷預警，先退開或防守，再利用收招空檔。",
    "dialogue": [
     [
      "民調隊長",
      "這份問卷問：你為什麼追麥？想講、想贏，還是早餐吃太飽？"
     ],
     [
      "player",
      "先勾「想知道怎麼讓它停下來」。你看得懂這張器材標籤嗎？"
     ],
     [
      "民調隊長",
      "知道！但出口訪問一定要在出口打完這一局！"
     ]
    ]
   }
  },
  {
   "id": "chapter-3:route-b",
   "name": "市民服務街",
   "theme": "civic-arcade",
   "width": 2800,
   "motifs": [
    "form-counter",
    "queue"
   ],
   "objective": "帶著器材編號穿過服務街，查清神麥原本的去處。",
   "visualBrief": "磁磚騎樓、布告欄、便民服務窗口、紅塑膠椅與折疊桌；保留可繞行前後路線。",
   "comicDetail": "窗口掛著「少跑一趟」，下一張卻寫「請至隔壁領取申請表」。",
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
     "barricade",
     600
    ],
    [
     "leaflet",
     1140
    ],
    [
     "placard",
     760,
     1500
    ],
    [
     "leaflet",
     2130
    ]
   ],
   "supplyX": 2210,
   "supplyDepth": 60,
   "gate": {
    "id": "chapter-3:miniboss-b",
    "kind": "miniboss",
    "name": "程序總管",
    "opponent": "huang",
    "mobKind": "mini_guard",
    "identityStatus": "proposal-only",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構活動服務站管理員，為了減少流程又增加一張流程表。",
    "tell": "先舉牌預告，再擺路牌或蓄力喊話。",
    "counterplay": "橫向對決；跳過路牌、拉開距離，利用喊話後的空檔。",
    "dialogue": [
     [
      "程序總管",
      "查到了，編號最後寫「歸還議場」。"
     ],
     [
      "player",
      "那它怎麼一路巡迴到這裡？"
     ],
     [
      "程序總管",
      "大家都簽了借出，沒人填歸還。先打一局，我把那張表補給你！"
     ]
    ]
   }
  },
  {
   "id": "chapter-3:route-c",
   "name": "市民廣場",
   "theme": "civic-square",
   "width": 3200,
   "motifs": [
    "covered-stage",
    "ribbon"
   ],
   "objective": "到廣場解開綵帶，核對議場歸還標籤。",
   "visualBrief": "市民廣場、樹蔭、社區活動台、音箱、停在側邊的音響車；只用虛構活動圖樣。",
   "comicDetail": "綵帶已解開，麥架旁留著一張「找失物請排隊」的手寫紙。",
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
     "placard",
     600
    ],
    [
     "barricade",
     1200
    ],
    [
     "leaflet",
     1700
    ],
    [
     "placard",
     2310
    ],
    [
     "leaflet",
     2660
    ]
   ],
   "supplyX": 2510,
   "supplyDepth": -55,
   "gate": {
    "id": "chapter-3:boss",
    "kind": "boss",
    "name": "柯P",
    "opponent": "ko",
    "identityStatus": "existing-roster",
    "mechanicsStatus": "existing-ko-duel"
   }
  }
 ],
 "handoffContract": {
  "sourceChapterId": "chapter-3",
  "nextChapterId": "chapter-4",
  "vehicle": "sound-truck",
  "micCarrier": "wheeled-stand",
  "destination": "候車街口",
  "unlock": "ko",
  "status": "coordinated"
 },
 "story": {
  "entry": {
   "status": "playable",
   "sourceChapterId": "chapter-2",
   "frames": [
    {
     "speaker": "旁白",
     "title": "車在走，麥也走",
     "copy": "花車的綵帶還勾著神麥，一路晃向市民廣場。剛加入的電火球也跟著追了上來。",
     "shot": "ribbon-follow",
     "direction": "承接 #53 第二章綵帶勾麥；同一條綵帶連到花車，不換物件、不回起床序章。"
    },
    {
     "speaker": "player",
     "title": "比遊行還準時",
     "copy": "別只盯著麥！花車邊有一張舊器材標籤。這一路如果都是送貨路線，我們可能從早上就追錯方向。",
     "shot": "parade-trail",
     "direction": "主角在前景追車，神麥保持空中可見，遠處綵帶指向廣場。"
    },
    {
     "speaker": "遠處廣播",
     "title": "前方請先排隊",
     "copy": "找失物的、領號碼牌的，請排同一隊。找號碼牌的，請先別把隊伍弄丟！",
     "shot": "anonymous-broadcast",
     "direction": "只有主角、花車與綵帶線索；本章 Boss 不出現肖像、姓名或招牌動作。"
    }
   ]
  },
  "beforeBoss": {
   "status": "playable",
   "frames": [
    {
     "speaker": "柯P",
     "title": "結解了，人來了",
     "copy": "綵帶拆好了。標籤寫「議場封印器材」，下面還有一排小字，得回保管處查。先別急著搶。",
     "shot": "ko-reveal",
     "direction": "此時才揭曉柯P；神麥插回可移動麥架，綵帶已鬆落在旁。"
    },
    {
     "speaker": "player",
     "title": "先比完，再拿麥",
     "copy": "好，三戰兩勝，贏的先拿。比完一起送回保管處，這次我們自己安排車，誰都不准又偷偷搬走！",
     "shot": "duel-contract",
     "direction": "雙方點頭；遠處工讀生把音箱搬上下一站音響車，預示章尾搬錯麥架。"
    },
    {
     "speaker": "電火球",
     "title": "該大聲才大聲",
     "copy": "我去借車，你們去比。剛才廣播讓大家繞路，這回我只喊一個正確目的地！",
     "shot": "duel-contract"
    }
   ]
  },
  "handoff": {
   "status": "playable",
   "cause": "planned-return",
   "nextChapterId": "chapter-4",
   "frames": [
    {
     "speaker": "柯P",
     "title": "這局算你的",
     "copy": "這局算你的。歸還標籤我看過了，我把路線標清楚；麥給你，運送的事大家一起顧。",
     "shot": "handover",
     "direction": "只有取得兩勝後播放；柯P加入本次可選角色，鏡頭保留同一麥架。"
    },
    {
     "speaker": "場務工讀生",
     "title": "這次是自己上車",
     "copy": "照大家的安排，工讀生把同一座麥架推上音響車。目的地：候車街口，再接議場歸還處。",
     "shot": "cart-catch",
     "direction": "主角同意運送，工讀生推同一麥架上車。保留搬運演出，並非再次搬錯或搶走。"
    },
    {
     "speaker": "player",
     "title": "車資算它的",
     "copy": "終於不用追失物了，改追班車！我們跟著送，下一站誰也別只顧著看麥，忘了看路。",
     "shot": "follow-cart",
     "direction": "路牌指向第四章活動下一站；可自由換角，不重播前兩章或起床序章。"
    }
   ]
  }
 }
});

export function storyFrames(kind,characterId='wang'){
 if(!Object.hasOwn(CHARACTER_NAMES,characterId))throw new RangeError('Unknown preview character');
 const name=CHARACTER_NAMES[characterId];
 const frames=CHAPTER2.story[kind]?.frames;if(!frames)throw new RangeError('Unknown story');
 return frames.map(frame=>({...frame,speaker:frame.speaker==='player'?name:frame.speaker}));
}
