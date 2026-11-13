import {resolveDialogueFrame} from '../../character-dialogue.mjs?v=dialogue-20261113-r1';
// Fictional comedy chapter. Public-facing opponent identity is hidden until boss-comic.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHARACTER_NAMES=freeze({wang:'恰吉王',han:'韓國魚',huang:'咆哮哥',su:'電火球',ko:'柯P',ma:'小馬哥',chen:'阿扁仔'});
export const STARTER_IDS=freeze(['wang','han','huang','su','ko']);
export const STEP_IDS=freeze(['entry','route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic','boss','handoff-comic','roster-choice']);
export const CHAPTER4=freeze({
 "id": "chapter-4",
 "campaignId": "mic-chase-season-1",
 "title": "護麥有禮",
 "status": "playable",
 "requiredClears": [
  "chapter-3"
 ],
 "nextChapterId": "chapter-5",
 "boss": {
  "characterId": "ma",
  "name": "小馬哥",
  "matchFormat": "best-of-three",
  "unlockCharacterId": "ma"
 },
 "assumptions": [
  "虛構喜劇；沿用既有美術、戰鬥與共用存檔。"
 ],
 "handoffContract": {
  "version": 1,
  "entry": {
   "sourceChapterId": "chapter-3",
   "vehicle": "sound-truck",
   "carrier": "wheeled-stand",
   "newCompanion": "ko",
   "destination": "候車街口",
   "status": "coordinated-draft"
  },
  "exit": {
   "nextChapterId": "chapter-5",
   "vehicle": "sound-truck",
   "carrier": "wheeled-stand",
   "newCompanion": "ma",
   "destination": "議場器材歸還處",
   "status": "coordinated"
  }
 },
 "routes": [
  {
   "id": "chapter-4:route-a",
   "name": "候車騎樓",
   "theme": "civic-arcade",
   "width": 2500,
   "motifs": [
    "bus-stop",
    "timetable",
    "wheeled-stand"
   ],
   "objective": "替運麥架的夥伴清出候車騎樓，別被班表拖住。",
   "visualBrief": "台北老城磁磚騎樓、停靠站、單車架、早餐店與低矮紅磚牆；街道可前後繞行。",
   "comicDetail": "候車牌寫「即將進站」，旁邊有人從早餐吃到午餐。",
   "platforms": [
    {
     "left": 930,
     "right": 1160,
     "y": 342,
     "kind": "table",
     "depth": -35,
     "depthHalf": 30
    },
    {
     "left": 1770,
     "right": 1910,
     "y": 370,
     "kind": "crate",
     "depth": 55,
     "depthHalf": 26
    }
   ],
   "spawns": [
    [
     "placard",
     520
    ],
    [
     "leaflet",
     960
    ],
    [
     "barricade",
     1600
    ]
   ],
   "supplyX": 1930,
   "supplyDepth": -45,
   "gate": {
    "id": "chapter-4:miniboss-a",
    "kind": "miniboss",
    "name": "班表主任",
    "opponent": "wang",
    "mobKind": "mini_schedule",
    "identityStatus": "fictional",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構候車區活動志工，堅信任何狀況都能靠更新班表解決。",
    "tell": "舉起班表停頓，再左右兩次蓋章拳。",
    "counterplay": "橫向對決；等班表舉起時退開，第二次出拳後反擊。",
    "dialogue": [
     [
      "班表主任",
      "神麥？牌子寫「即將抵達」，你就安心等。"
     ],
     [
      "player",
      "本來應該從容等車，現在等到豆漿變豆花！你那個「即將」是多即將？",
      "c4.mini0"
     ],
     [
      "班表主任",
      "系統沒有延誤，只是「即將」比較有彈性！先打一局，再讓你追！"
     ]
    ]
   }
  },
  {
   "id": "chapter-4:route-b",
   "name": "河濱補給道",
   "theme": "riverside-run",
   "width": 3000,
   "motifs": [
    "running-checkpoint",
    "distance-sign",
    "wheeled-stand"
   ],
   "objective": "沿河濱便道護送麥架，繞桌前進，記得在外側補水。",
   "visualBrief": "河濱堤牆、榕樹、路跑棚、紙杯補給桌與迴轉里程牌；不變成空曠天空背景。",
   "comicDetail": "每張里程牌都寫「最後一公里」，補給桌已經過了三張。",
   "platforms": [
    {
     "left": 1030,
     "right": 1320,
     "y": 342,
     "kind": "table",
     "depth": 43,
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
     520
    ],
    [
     "barricade",
     1120
    ],
    [
     "placard",
     1580
    ],
    [
     "leaflet",
     2150
    ]
   ],
   "supplyX": 2210,
   "supplyDepth": 60,
   "gate": {
    "id": "chapter-4:miniboss-b",
    "kind": "miniboss",
    "name": "里程總監",
    "opponent": "huang",
    "mobKind": "mini_marshal",
    "identityStatus": "fictional",
    "mechanicsStatus": "telegraphed-pattern-reusing-core",
    "concept": "虛構路跑工作人員，把補給證明看得比補水還重要。",
    "tell": "先舉碼表，再攔路、退件與喊話，各招有清楚空檔。",
    "counterplay": "橫向對決；跳過路牌並退開預告範圍，喊話收招後靠近。",
    "dialogue": [
     [
      "里程總監",
      "領水請出示完賽證明。"
     ],
     [
      "player",
      "沒水怎麼完賽？你要證明，先證明人不喝水也跑得到終點！",
      "c4.mini1a"
     ],
     [
      "里程總監",
      "那你先申請「尚未完賽也很渴」證明！"
     ],
     [
      "player",
      "追一支麥追出整套公文，這不是路跑，是跑公文啊！",
      "c4.mini1b"
     ]
    ]
   }
  },
  {
   "id": "chapter-4:route-c",
   "name": "城門禮賓道",
   "theme": "old-city-ceremony",
   "width": 3200,
   "motifs": [
    "covered-stage",
    "ceremony",
    "microphone"
   ],
   "objective": "到城門交接處，找到替大家鎖好麥架的人。",
   "visualBrief": "老城門、矮牆、樹蔭、藍白布幔、禮賓欄柱與後方小舞台；沒有關主肖像與姓名。",
   "comicDetail": "路牌寫「請禮讓」，每個箭頭都客氣地讓給下一個箭頭。",
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
     "left": 1730,
     "right": 2020,
     "y": 330,
     "kind": "stage",
     "depth": 40,
     "depthHalf": 30
    }
   ],
   "spawns": [
    [
     "placard",
     560
    ],
    [
     "leaflet",
     1080
    ],
    [
     "barricade",
     1610
    ],
    [
     "leaflet",
     2190
    ],
    [
     "placard",
     2710
    ]
   ],
   "supplyX": 2510,
   "supplyDepth": -55,
   "gate": {
    "id": "chapter-4:boss",
    "kind": "boss",
    "name": "小馬哥",
    "opponent": "ma",
    "identityStatus": "existing-roster",
    "mechanicsStatus": "existing-ma-duel"
   }
  }
 ],
 "story": {
  "entry": {
   "status": "playable",
   "sourceChapterId": "chapter-3",
   "frames": [
    {
     "speaker": "旁白",
     "title": "追車追到站",
     "copy": "沿著柯P標好的路線，音響車停在候車街口。工讀生先搬下線材箱，大家準備把麥架推上河濱便道，護送到城門。",
     "shot": "truck-unload",
     "direction": "接第三章音響車載走帶輪麥架；柯P已加入，沒有重播起床序章。"
    },
    {
     "speaker": "player",
     "title": "輪子比我們積極",
     "voiceKey": "c4.entry",
     "copy": "斜坡！我扶麥架，你們清路。本來要護送，別又搞得一群人連滾帶爬！",
     "shot": "rolling-stand",
     "direction": "同一座麥架沿斜坡受控推行，演出輪子移動；主角與工作人員跟隨，沒有再次失竊。"
    },
    {
     "speaker": "站務廣播",
     "title": "請依序追趕",
     "copy": "前方活動人潮較多。趕時間的民眾，請先確認自己有沒有時間排隊。",
     "shot": "anonymous-broadcast",
     "direction": "只見主角與麥架線索，關主首次出現留到戰前。"
    }
   ]
  },
  "beforeBoss": {
   "status": "playable",
   "frames": [
    {
     "speaker": "小馬哥",
     "title": "很有禮貌地攔住了",
     "copy": "各位辛苦了，輪子已鎖好。我在終點等交接，沒想到各位選了障礙賽路線。歸還前，是否先切磋一場？",
     "shot": "ma-reveal",
     "direction": "戰前三路段結束才揭曉小馬哥；神麥在鎖好的架上。"
    },
    {
     "speaker": "player",
     "title": "禮貌不能省略規則",
     "voiceKey": "c4.boss",
     "copy": "三戰兩勝，贏的帶隊！握手可以，輪鎖鑰匙先收好，別禮貌完又忙著追輪子！",
     "shot": "duel-contract",
     "direction": "保留原有小馬哥跑步、握手與反擊招式和完整骨架。"
    },
    {
     "speaker": "小馬哥",
     "title": "先握一下",
     "copy": "謝謝指教，規則我尊重。開打前先握手，打完再握手。中間的部分，可能比較不客氣。",
     "shot": "ma-ready",
     "direction": "友善虛構對決，不對真實人物作任何事實指控。"
    }
   ]
  },
  "handoff": {
   "status": "playable",
   "cause": "escorted-return",
   "nextChapterId": "chapter-5",
   "frames": [
    {
     "speaker": "小馬哥",
     "title": "輸贏都要有禮貌",
     "copy": "恭喜，請你帶隊。我保管輪鎖，柯P核對單據，電火球指路。分工如此明確，輪子應該沒有發言空間了。",
     "shot": "handover",
     "direction": "只在終Boss兩勝後播放，先解鎖小馬哥。"
    },
    {
     "speaker": "旁白",
     "title": "輪子鎖了，整台搬走",
     "copy": "鎖好的麥架重新固定在車上，工讀生收好線材箱。車頭掛著「議場器材歸還」，這回連路過的都知道他們要去哪。",
     "shot": "truck-reload",
     "direction": "保留同一麥架搬上車的演出，所有人事先知情；不是再一次失物。"
    },
    {
     "speaker": "player",
     "title": "下次連車一起看",
     "voiceKey": "c4.handoff",
     "copy": "輪子、單子、路線全顧好了！到議場找保管人，我倒要問，神麥怎麼越追越安靜？",
     "shot": "follow-truck",
     "direction": "車開往第五章議場歸還處；自由換角接續同一天。"
    }
   ]
  }
 }
});

export function storyFrames(kind,characterId='wang'){
 if(!Object.hasOwn(CHARACTER_NAMES,characterId))throw new RangeError('Unknown preview character');
 const frames=CHAPTER4.story[kind]?.frames;if(!frames)throw new RangeError('Unknown story');
 return frames.map(frame=>resolveDialogueFrame({...frame,speaker:frame.speaker==='player'?CHARACTER_NAMES[characterId]:frame.speaker},characterId));
}
