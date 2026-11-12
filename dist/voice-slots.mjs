import {USER_VOICE_SELECTIONS} from './voice-selections-v31.mjs?v=campaign-visuals-20261112-r2';
import {V32_VOICE_SELECTIONS} from './voice-selections-v32.mjs?v=campaign-visuals-20261112-r2';
// Uploaded provenance and independent verification are separate. Pending links never synthesize a voice.
const pending=(label,source,requestedTime=null)=>({src:null,originalVerified:false,label,source,requestedTime,rights:'未確認再利用權',status:'來源頁面已核對；未取得音檔、未聽驗，指定秒數不是已核實切點'});
const catalog=(label,file,source,cue,duration)=>({src:'assets/voice/'+file,originalVerified:false,catalogProvided:true,decoded:true,label,speaker:'黃國昌（依語錄站標示，未獨立認證）',cue,source,rights:'未確認底層影音再利用權',status:`語錄站公開音檔，依網站標示對應此句；未獨立聽驗或認證說話者。保留全長約 ${duration} 秒，只降低音量，未剪接新發言。`});
const unverified=(label,source,requestedTime=null)=>({...pending(label,source,requestedTime),status:'使用者指定連結已記錄；未取得音檔，頁面與語句尚待核對，指定秒數未驗證'});
export const VOICE_SLOTS={
 coin:{src:'assets/voice/han-fa-da-cai-20190513.mp3',originalVerified:true,label:'高雄發大財',speaker:'韓國瑜',rights:'未確認再利用權',status:'既有議會原片私人測試片段',source:'https://ivod.kcc.gov.tw/watch/107/201905KCC0301S1080513101426VIDEOmp4?start=1817'},
 ma_cough:{src:'assets/voice/user-cough-full-v14.mp3',originalVerified:false,userProvided:true,decoded:true,label:'死亡之咳（酷酷嫂）',speaker:'使用者指定對應馬英九，未獨立認證',cue:.20,rights:'未確認再利用權',status:'使用者提供「死亡之咳.mp3」；未獨立聽驗或核實原始來源。保留全長 7.34 秒，修復編碼並降低音量，未剪接新發言。',reference:'https://www.youtube.com/watch?v=R8vDOQt-V4A&t=5950s',referenceNote:'馬英九東吳演講咳嗽候選；未確認上傳檔出自此片'},
 han_knee:{src:'assets/voice/user-ke-lian-na-v14.mp3',originalVerified:false,userProvided:true,decoded:true,label:'可憐哪',speaker:'使用者指定對應韓國瑜，未獨立認證',cue:0,rights:'未確認再利用權',status:'使用者提供「可憐哪.mp3」；未獨立聽驗或核實發言者。保留全長約 0.57 秒；招式成功接受後立即播放，不再等待膝行動畫。'},
 rush:pending('連滾帶爬','https://www.youtube.com/watch?v=d8fKRcTP2Tg&t=499s',499),
 counter:pending('從從容容','https://www.youtube.com/watch?v=d8fKRcTP2Tg&t=499s',499),
 huang_shout:catalog('太離譜了','huang-too-outrageous-v14.mp3','https://kuochang.tw/quote/Beyavja1r7',.10,3.71),
 huang_debt:catalog('我有欠你喔','huang-owe-you-v14.mp3','https://kuochang.tw/quote/ybR0opawAK',0,2.50),
 huang_queue:catalog('可以這樣插隊喔','huang-cut-in-line-v14.mp3','https://kuochang.tw/quote/XnVa4k06oJ',.10,13.03),
 su_dare:{src:null,originalVerified:false,label:'要試試看嘛',rights:'未確認再利用權',status:'尚未取得可用原音，本次沒有音檔，僅合成音效。'},
 chen_calm:unverified('有這麼嚴重嗎','https://www.youtube.com/watch?v=jfKym0Zjbtw'),
 ko_bags:unverified('垃圾不分藍綠','https://www.youtube.com/watch?v=LTNjR34kFRM&t=33s',33),
 ko_resolve:unverified('我不會屈服','https://www.youtube.com/watch?v=YhemGL_KdIk'),
 ko_name:pending('賴祥德','https://www.youtube.com/watch?v=YhemGL_KdIk'),
 chen_question:pending('阿扁錯了嗎','https://www.youtube.com/watch?v=wtkstRQdHkA&t=60s',60),
 ma_gaze:pending('我把你當人看','https://www.youtube.com/watch?v=OnkeWLCezVQ&t=7s',7),
 arrow:pending('一支穿雲箭','https://www.youtube.com/watch?v=M8Xq14fSpX0&t=16s',16),
 su_shout:pending('在那叫什麼','https://www.youtube.com/shorts/cbciI75MegY'),
 su_rush:pending('衝衝衝','https://www.youtube.com/shorts/1Vw_joOXrzw',29),
};
// V15 user-supplied screen recordings: continuous reviewable excerpts, not authenticated originals.
const driveSource='https://drive.google.com/file/d/1AUrE7GFXAuOaUoY7tBgbC0toW25vOiYb/view?usp=drive_link';
const driveCuts=[
 {
  "kind": "arrow",
  "file": "user-arrow-candidate-v15.mp3",
  "sourceFile": "一支穿雲箭.mp4",
  "start": 7.85,
  "end": 9.9,
  "confidence": "medium-high"
 },
 {
  "kind": "ko_bags",
  "file": "user-ko-bags-candidate-v15.mp3",
  "sourceFile": "垃圾不分藍綠.mp4",
  "start": 6.55,
  "end": 7.84,
  "confidence": "medium"
 },
 {
  "kind": "counter",
  "file": "user-counter-candidate-v15.mp3",
  "sourceFile": "從從容容  連滾帶爬.mp4",
  "start": 8.65,
  "end": 13.15,
  "confidence": "medium"
 },
 {
  "kind": "rush",
  "file": "user-rush-candidate-v15.mp3",
  "sourceFile": "從從容容  連滾帶爬.mp4",
  "start": 15.64,
  "end": 18.02,
  "confidence": "medium"
 },
 {
  "kind": "ma_gaze",
  "file": "user-ma-gaze-candidate-v15.mp3",
  "sourceFile": "我把你當人看.mp4",
  "start": 5.05,
  "end": 6.27,
  "confidence": "medium-high"
 },
 {
  "kind": "chen_calm",
  "file": "user-chen-calm-candidate-v15.mp3",
  "sourceFile": "有這麼嚴重嗎.mp4",
  "start": 7.14,
  "end": 8.88,
  "confidence": "medium-high"
 },
 {
  "kind": "ko_name",
  "file": "user-ko-name-candidate-v15.mp3",
  "sourceFile": "賴祥德  我不會屈服.mp4",
  "start": 5.55,
  "end": 7.15,
  "confidence": "medium-high"
 },
 {
  "kind": "ko_resolve",
  "file": "user-ko-resolve-candidate-v15.mp3",
  "sourceFile": "賴祥德  我不會屈服.mp4",
  "start": 11.15,
  "end": 13.35,
  "confidence": "medium-high"
 },
 {
  "kind": "chen_question",
  "file": "user-chen-question-candidate-v15.mp3",
  "sourceFile": "阿扁錯了嗎.mp4",
  "start": 7.7,
  "end": 9.55,
  "confidence": "medium-high"
 }
];
for(const c of driveCuts){const old=VOICE_SLOTS[c.kind];VOICE_SLOTS[c.kind]={...old,src:'assets/voice/'+c.file,userProvided:true,decoded:true,originalVerified:false,reviewNeeded:true,cue:0,requestedTime:null,source:driveSource,sourceFile:c.sourceFile,sourceRange:{start:c.start,end:c.end},reference:old.source,referenceNote:'先前提供的影片參考；本版實際取自使用者上傳錄影，未認證原始來源或權利',status:'使用者提供 Captures.zip／'+c.sourceFile+'，取 '+c.start+'–'+c.end+' 秒連續片段。依畫面、辨識時間及停頓輔助定位，未獨立聽驗或認證發言者，切點仍可校正。'+(c.kind==='counter'?'保留完整前後文句，未硬切四字。':'')+(c.kind==='ko_bags'?'字首定位約有 0.1 秒不確定性。':'')};}
Object.assign(VOICE_SLOTS.huang_shout,{src:'assets/voice/huang-too-outrageous-v15.mp3',sourceRange:{start:.20,end:1.55},reviewNeeded:true,status:'依使用者要求保留第一段發話，約 1.35 秒，移除後面重複句；以波形停頓輔助分段，未獨立聽驗或認證說話者。'});
Object.assign(VOICE_SLOTS.huang_debt,{src:'assets/voice/huang-owe-you-v15.mp3',sourceRange:{start:1.35,end:2.501882},reviewNeeded:true,status:'依使用者要求移除前兩次起頭聲，保留後段約 1.15 秒；以波形與辨識序列輔助定位，未獨立聽驗或認證完整用字與說話者。'});
Object.assign(VOICE_SLOTS.su_rush,{src:'assets/voice/su-rush-user-selected-v16.mp3',userProvided:true,decoded:true,originalVerified:false,received:true,reviewNeeded:true,cue:0,source:driveSource,sourceFile:'衝衝衝.mp4',sourceRange:{start:12,end:14.9},reference:'https://www.youtube.com/shorts/1Vw_joOXrzw',referenceNote:'先前指定影片參考；本版音訊來自使用者提供錄影，未核實與此連結的關係',requestedTime:null,status:'依使用者指定「約 12 秒到 14 秒多」取原錄影 12.00–14.90 秒，約 2.90 秒，尾端短淡出，依指定範圍截斷後續音訊。使用者提供音檔，未獨立聽驗或認證發言者與來源。'});
Object.assign(VOICE_SLOTS.su_dare,{src:'assets/voice/su-dare-user-selected-v16.mp3',userProvided:true,decoded:true,originalVerified:false,received:true,reviewNeeded:true,cue:0,source:driveSource,sourceFile:'要試試看嗎.mp4',sourceRange:{start:0,end:1},requestedTime:null,status:'依使用者指定僅取原錄影第一秒（0.00–1.00 秒），連續保留、不延長或拼接。檔名／字幕為「嗎」，遊戲暫沿用「嘛」。使用者提供音檔，未獨立聽驗或認證發言者與來源。'});
Object.assign(VOICE_SLOTS.su_shout,{src:'assets/voice/su-shout-user-upload-v16.mp3',userProvided:true,decoded:true,originalVerified:false,received:true,reviewNeeded:true,cue:0,source:null,sourceFile:'在那叫什麼.mp4',sourceRange:{start:3.96,end:6.34},requestedTime:null,reference:'https://www.youtube.com/shorts/cbciI75MegY',referenceNote:'先前指定的候選參考；本次實際音訊來自新上傳錄影，未核實與此連結的關係',speaker:'使用者指定對應蘇貞昌，未獨立認證',status:'使用者提供「在那叫什麼.mp4」，取 3.96–6.34 秒連續音軌，約 2.38 秒，去除前後靜音並降低 3 dB；招式成功接受後立即播放。未獨立聽驗或認證發言者與來源。'});
// V17 continuous user-supplied handshake phrase; visual/source context is not speaker authentication.
VOICE_SLOTS.ma_handshake={src:'assets/voice/ma-handshake-user-candidate-v17.mp3',label:'死亡之握，你已經死了',userProvided:true,decoded:true,originalVerified:false,reviewNeeded:true,cue:0,sourceFile:'死亡之握 你已經死了.mp4',sourceRange:{start:8.15,end:12.35},rights:'未確認再利用權',speaker:'使用者指定對應馬英九，未獨立認證',reference:'https://www.facebook.com/reel/1169812469747550',referenceNote:'使用者錄影畫面中的頁面網址及帳號標示，未獨立認證原始來源',status:'使用者提供「死亡之握 你已經死了.mp4」，取 8.15–12.35 秒連續片段，約 4.20 秒，保留句首句尾餘裕。畫面紙張可見完整目標句；離線辨識有同音字差異，未獨立聽驗或認證發言者。降低 6 dB，未拼接或仿聲。'};
// V20 user-supplied continuous Taiwanese program phrase; not authenticated speech.
VOICE_SLOTS.chen_dream={src:'assets/voice/chen-dream-user-candidate-v201.mp3',label:'有夢最美',userProvided:true,decoded:true,originalVerified:false,reviewNeeded:true,cue:0,sourceFile:'使用者提供的有夢上水錄影',sourceRange:{start:7.048,end:9.62},rights:'未確認再利用權',speaker:'使用者指定對應陳水扁，未獨立認證',status:'使用者提供錄影，取 7.048–9.620 秒連續首句，約 2.572 秒；依試聽回饋再縮短 28 毫秒前置數位靜音，保留完整首音與既有結尾。畫面節目名為台語「有夢上水」，招式沿用「有夢最美」；波形及語音辨識輔助定位，台語逐字辨識有不確定性，未獨立聽驗或認證發言者、原始來源與權利。降低峰值至約 −6 dBFS，未拼接、變聲或仿聲。'};
// User listened to the 0-4s preview and placed the first phrase before 2s.
Object.assign(VOICE_SLOTS.huang_queue,{src:'assets/voice/huang-queue-user-end-v25.mp3',sourceRange:{start:0,end:1.98},reviewNeeded:true,cue:0,status:'依使用者試聽前 4 秒後指出「差不多是第二秒之前結束」，取原檔 0.00–1.98 秒近似短版，結尾落在低能量區並用 20 毫秒淡出；保留原檔可回復。未獨立聽驗句尾或認證說話者，仍請使用者確認「蛤」完整保留。'});
// V25: exact user attachment, preserved byte-for-byte; not independently heard.
VOICE_SLOTS.heal={src:'assets/voice/wang-drink-user-v25.mp3',label:'喝水回氣',userProvided:true,decoded:true,originalVerified:false,reviewNeeded:true,cue:0,sourceFile:'喝水.mp3',reference:'https://memes.tw/sound?q=%E7%8E%8B%E4%B8%96',referenceNote:'使用者提供的來源參考；未核對上傳檔與網站內容是否一致',rights:'未確認再利用權',speaker:'使用者指定對應王世堅，未獨立認證',status:'依使用者要求接入「喝水.mp3」原檔，約 2.14 秒，不裁切、不拼接、不變聲。已驗證可解碼與檔案雜湊，未獨立聽驗或核對網站內容、發言者與權利。'};
// V26: the user listened to and approved the 0.80-second lead trim candidate.
Object.assign(VOICE_SLOTS.chen_dream,{src:'assets/voice/chen-dream-user-confirmed-v26.mp3',sourceRange:{start:7.848,end:9.62},reviewNeeded:false,status:'使用者提供錄影；使用者試聽並確認採用本候選：從前版音檔 0.800 秒起保留至原結尾，對應錄影 7.848–9.620 秒，約 1.772 秒。僅裁掉開頭並以 5 毫秒淡入避免切點雜音，未拼接、變聲或仿聲；舊音檔保留可回復。使用者確認的是剪輯起點，尚未獨立認證發言者、原始來源與再利用權利。'});
// V31: replace only the reviewed ranges. Full prior metadata and files are retained for rollback.
for(const [kind,selection] of Object.entries(USER_VOICE_SELECTIONS))Object.assign(VOICE_SLOTS[kind],selection);
// V32: the user reselected the replacement recording; never reuse the old recording range.
for(const [kind,selection] of Object.entries(V32_VOICE_SELECTIONS))Object.assign(VOICE_SLOTS[kind],selection);
export function playableVoice(kind){const clip=VOICE_SLOTS[kind];return (clip?.originalVerified===true||((clip?.userProvided===true||clip?.catalogProvided===true)&&clip?.decoded===true))&&typeof clip.src==='string'&&/^assets\/voice\/[a-z0-9-]+\.(?:mp3|wav)$/.test(clip.src)?clip:null;}
