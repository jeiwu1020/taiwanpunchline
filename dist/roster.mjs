import {COMBAT} from './combat-rules.mjs?v=post69-street-seam-cull-20261112-r1';
// Every combat action and effect is invented satire, not a historical reenactment.
// A source URL verifies only the stated text context, never reusable original audio.
const sourceNote='僅核對標題、說明或逐字稿；未聽驗，未確認影音再利用權。招式與效果為虛構。';
export const CAST={
 wang:{
  name:'恰吉王',sourceName:'王世堅',tag:'從容派',color:0xf5ae42,colorCSS:'#f5ae42',portrait:'assets/wang-laugh-head.webp',
  tip:'翻滾避高招接近；從容只反近身，喝水一秒才回氣。',roast:'從容只是外表，連滾帶爬才是日常。',
  moves:[
   {kind:'rush',purpose:'向前翻滾，貼近對手',name:'連滾帶爬',hint:'衝刺撞擊 · 近中距離',cooldown:3.5,fictional:true},
   {kind:'counter',purpose:'擺好架勢，反擊近身攻擊',name:'從從容容',hint:'短暫反擊架勢 · 等對手出手',cooldown:6,fictional:true},
   {kind:'heal',purpose:'喝水回復氣勢',name:'喝水回氣',hint:'回復 12 氣勢 · 會被打斷',cooldown:10,fictional:true},
  ],
 },
 han:{
  name:'韓國魚',sourceName:'韓國瑜',tag:'氣勢派',color:0x56c8c8,colorCSS:'#56c8c8',portrait:'assets/han-defiant-head.webp',
  tip:'高處金幣逼對手蹲低，跪步後中段喊話；穿雲箭預判固定落點。',roast:'金幣可以再賺，面子下一局再找。',
  moves:[
   {kind:'coin',purpose:'金幣直飛，牽制前方',name:'發財金幣波',hint:'直線金幣 · 可跳過',cooldown:3.5,fictional:true},
   {kind:'han_knee',purpose:'膝行接近，再喊話震退',name:'可憐哪',hint:'跪步前進後喊話 · 全程可受擊',cooldown:5.5,word:'可憐哪',source:'https://www.youtube.com/watch?v=2pzt4XbdANM',sourceText:'https://news.tvbs.com.tw/politics/1253466',sourceNote:sourceNote+' 此連結為跪步動作；「可憐哪」來自另一次 2019/12/29 辯論，遊戲將兩個事件拼接。',fictional:true,behavior:'advance',advanceStart:.18,advanceEnd:.60,speed:150,start:.62,end:.74,duration:1.08,range:170,damage:18,knock:60},
   {kind:'arrow',purpose:'鎖定落點，從空中壓制',name:'一支穿雲箭',hint:'高空拋射 · 壓制遠處',cooldown:6,fictional:true},
  ],
 },
 ma:{
  name:'小馬哥',sourceName:'馬英九',tag:'微笑派',color:0x739bd6,colorCSS:'#739bd6',portrait:'assets/ma-head-v5.webp',
  tip:'握手抓格擋但抓不到跳起；上托掌對空，兩聲咳嗽可消直線道具。',roast:'握手很有禮貌，震退純屬遊戲效果。',
  moves:[
   {kind:'ma_handshake',purpose:'近身抓住對手，穿過防守',name:'死亡之握',hint:'禮貌握手 · 一般傷害，非即死',cooldown:4,word:'謝謝指教',source:'https://news.tvbs.com.tw/politics/377788',sourceText:'https://news.tvbs.com.tw/politics/377788',sourceNote,fictional:true,behavior:'melee',start:.18,end:.30,duration:.56,range:142,damage:14,knock:72},
   {kind:'ma_gaze',purpose:'伸掌上托，攔下跳躍',name:'我把你當人看',hint:'注視伸掌 · 短距推開',cooldown:5,word:'我把你當人看',source:'https://www.youtube.com/watch?v=91lkb1cF7NY',sourceText:'https://news.tvbs.com.tw/politics/300555',sourceNote:sourceNote+' 原話為 2007/12/8 住宅與原住民議題脈絡；遊戲不重現族群對象，也沒有變身效果。',fictional:true,behavior:'melee',start:.25,end:.38,duration:.72,range:175,damage:13,knock:70},
   {kind:'ma_cough',purpose:'咳嗽連擊，擋開直線道具',name:'酷酷嫂',hint:'咳嗽聲音梗 · 掩口兩段短擊',cooldown:5.5,word:'咳、咳',memeType:'cough',source:'https://youtu.be/R8vDOQt-V4A?t=5950',sourceNote:sourceNote+' 時間點來自 PTT 轉述，尚未聽驗；「酷酷嫂」是咳嗽聲梗，不是配偶或本人說出的三字引言。',fictional:true,behavior:'combo',duration:.82,range:165,hits:[{start:.20,end:.28,damage:6,knock:5},{start:.42,end:.50,damage:7,knock:42}]},
  ],
 },
 su:{
  name:'電火球',sourceName:'蘇貞昌',tag:'震場派',color:0x6bac76,colorCSS:'#6bac76',portrait:'assets/su-head-v8.webp',
  tip:'慢喊話壓兩格耐力，三步低段突進；招手只反近身接觸。',roast:'喊話氣勢很足，收招還是要留點空間。',
  moves:[
   {kind:'su_shout',purpose:'大聲震退，壓迫防守',name:'在那叫什麼',hint:'中近距喊話 · 震退對手',cooldown:4.5,word:'在那叫什麼',source:'https://ivod.ly.gov.tw/Demand/Speech/136457',sourceNote,fictional:true,behavior:'melee',start:.22,end:.36,duration:.64,range:185,damage:16,knock:62},
   {kind:'su_rush',purpose:'低身連撞，向前逼近',name:'衝衝衝',hint:'三步突進 · 單次撞擊',cooldown:5,word:'衝衝衝',source:'https://finance.ftvnews.com.tw/news/detail/2017B01W0009',sourceNote:sourceNote+' 報導確認本人參與電影配音；尚未聽驗片段。',fictional:true,behavior:'rush',start:.18,end:.48,duration:.72,range:118,damage:16,knock:45,speed:500},
   {kind:'su_dare',purpose:'招手誘敵，反擊近身',name:'要試試看嘛',hint:'招手架勢 · 短暫防反',cooldown:7,word:'要試試看嘛',source:'https://ivod.ly.gov.tw/Demand/Speech/141607',sourceNote,fictional:true,behavior:'counter',start:.20,window:.48,duration:.88,damage:18,knock:56},
  ],
 },
 huang:{
  name:'咆哮哥',sourceName:'黃國昌',tag:'追問派',color:0x9e83cc,colorCSS:'#9e83cc',portrait:'assets/huang-head-v5.webp',
  tip:'喊話推遠，拒絕一次近身或反彈道具；排隊線攔地面突進但可破壞。',roast:'問題問得很完整，收招也要記得留空檔。',
  moves:[
   {kind:'huang_shout',purpose:'喊話推遠，拉開距離',name:'太離譜了',hint:'中距喊話 · 震退對手',cooldown:5,word:'太離譜了',source:'https://kuochang.tw/quote/Beyavja1r7',sourceNote,fictional:true,behavior:'melee',start:.24,end:.36,duration:.68,range:205,damage:16,knock:55},
   {kind:'huang_debt',purpose:'擋開近身，反彈直線道具',name:'我有欠你喔',hint:'攤開空手 · 短暫防反',cooldown:6.5,word:'我有欠你喔',source:'https://kuochang.tw/quote/ybR0opawAK',sourceText:'https://www.nownews.com/news/6414244',sourceNote,fictional:true,behavior:'counter',start:.14,window:.50,duration:.82,damage:15,knock:48},
   {kind:'huang_queue',purpose:'放下排隊線，攔住前進',name:'可以這樣插隊喔',hint:'伸掌攔停 · 短距推開，無持續牆',cooldown:5.5,word:'可以這樣插隊喔',source:'https://kuochang.tw/quote/XnVa4k06oJ',sourceText:'https://news.tvbs.com.tw/politics/2488674',sourceNote:sourceNote+' 「插隊」是當事人指控，不是遊戲對事件的認定。',fictional:true,behavior:'melee',start:.24,end:.38,duration:.74,range:175,damage:15,knock:78},
  ],
 },
 chen:{
  name:'阿扁仔',sourceName:'陳水扁',tag:'淡定派',color:0x79a888,colorCSS:'#79a888',portrait:'assets/chen-head-v8.webp',
  tip:'高處紙機去回兩次；雙掌先高後低，淡定只減傷一次並退後。',roast:'表情還很淡定，氣勢已經先請假。',
  moves:[
   {kind:'chen_dream',purpose:'紙機來回飛，牽制對手',name:'有夢最美',hint:'紙機夢想波 · 可跳過',cooldown:5.5,word:'有夢最美',source:'https://www.president.gov.tw/NEWS/9202',sourceNote,fictional:true,behavior:'projectile',start:.30,duration:.72,projectileKind:'dream',speed:350,life:1.8,damage:12,knock:30},
   {kind:'chen_question',purpose:'高低連擊，連續逼位',name:'阿扁錯了嗎',hint:'雙掌兩問 · 近身兩段短擊',cooldown:4.5,word:'阿扁錯了嗎',source:'https://news.tvbs.com.tw/politics/372946',sourceNote,fictional:true,behavior:'combo',duration:.76,range:165,hits:[{start:.18,end:.27,damage:6,knock:5},{start:.40,end:.50,damage:7,knock:35}]},
   {kind:'chen_calm',purpose:'淡定減傷，退開拉出空間',name:'有這麼嚴重嗎',hint:'攤掌淡定 · 短暫反擊架勢',cooldown:6.5,word:'有這麼嚴重嗎',source:'https://www.youtube.com/watch?v=2XE0FXgjw2s',sourceText:'https://news.pts.org.tw/article/359147',sourceNote,fictional:true,behavior:'counter',start:.12,window:.56,duration:.82,damage:13,knock:44},
  ],
 },
 ko:{
  name:'柯P',sourceName:'柯文哲',tag:'冷面派',color:0x6fbdc6,colorCSS:'#6fbdc6',portrait:'assets/ko-head-v6.webp',
  tip:'雙袋先低後中，名字落點命中緩速；站穩的一次護甲可帶進普通拳。',roast:'袋子收得俐落，收招還是要留點空間。',
  moves:[
   {kind:'ko_bags',purpose:'雙袋連掃，清開排隊線',name:'垃圾不分藍綠',hint:'雙袋兩段揮擊 · 中途可被打斷',cooldown:4.5,word:'垃圾不分藍綠',source:'https://www.cna.com.tw/news/aloc/201611140250.aspx',sourceNote,fictional:true,behavior:'combo',duration:.72,range:155,hits:[{start:.16,end:.26,damage:7,knock:6},{start:.38,end:.50,damage:9,knock:38}]},
   {kind:'ko_name',purpose:'瞄準落點，拖慢對手',name:'賴祥德',hint:'舉手喊名 · 口誤梗短擊',cooldown:5,word:'賴祥德',intendedName:'賴清德',source:'https://www.youtube.com/watch?v=IM1EGVSoRek',sourceText:'https://news.tvbs.com.tw/politics/3164547',sourceMeme:'https://www.ftvnews.com.tw/news/detail/2026330p11m1',sourceNote:sourceNote+' 原意是在喊「賴清德」；「賴祥德」是破音／口誤的迷因解讀，不是另一個人。',fictional:true,behavior:'melee',start:.26,end:.40,duration:.74,range:190,damage:15,knock:52},
   {kind:'ko_resolve',purpose:'站穩扛住，再接普攻',name:'我不會屈服',hint:'站穩擋一次 · 受 2 點傷害、免該次震退、不反傷',cooldown:7,word:'我不會屈服',source:'https://www.youtube.com/watch?v=IM1EGVSoRek',sourceText:'https://news.tvbs.com.tw/politics/3164547',sourceNote,fictional:true,behavior:'brace',start:.12,window:.65,duration:.92},
  ],
 },
};

// Mechanical V13 values override only gameplay fields; source and audio identity
// above remain unchanged. Uniform definitions also power the move guide.
for (const character of Object.values(CAST)) for (const move of character.moves) Object.assign(move,COMBAT[move.kind]);
