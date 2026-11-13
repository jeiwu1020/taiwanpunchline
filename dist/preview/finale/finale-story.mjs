// All seven characters take the stage regardless of the player's three-person team.
// Avoid "our three" in a named character's line: that speaker may be an opponent.
export const FINALE_OPENING=Object.freeze([
 {speaker:'咆哮哥',title:'三打四，也叫公平？',copy:'一邊三個、一邊四個，這根本司法不公！人數不對，還敢叫我先冷靜？'},
 {speaker:'韓國魚',title:'到底是誰的頭髮？',copy:'什麼撕髮不公？只有我可以無髮無天！'},
 {speaker:'旁白',title:'公平，經過精密計算',copy:'裁判廣播：「兩邊都有一隊，非常公平！」觀眾：「你數的是隊伍，不是人啦！」七人吵成一團，裁判趕快敲鈴。'}
]);
export const FINALE_VERDICT=Object.freeze({win:'裁判：「三個打贏四個，證明非常公平！」觀眾：「你只是等贏了才宣布吧！」',loss:'裁判：「人數沒有問題，再試一次就公平了！」觀眾：「這句也太方便了吧！」'});
export const FINALE_INTRO=Object.freeze([
 {speaker:'阿扁仔',title:'車鑰匙交出來',copy:'中庭麥架固定了，車不開、帶不綁、輪不轉。東西終於肯安分，人也該輪到講話了吧？'},
 {speaker:'柯P',title:'三個人，對四個人',copy:'我想是這樣。你挑兩個隊友，其他四個一隊，哪隊最後還有人站著就贏。你先倒也能贏，這叫團隊分工。'},
 {speaker:'韓國魚',title:'連觀眾都有機會',copy:'鄉親啊，人倒下去，勝利帶回來！隊友還站著就有希望，這規則我聽懂了。便當先別少算我一份！'}
]);
export const ENDING=Object.freeze([
 {speaker:'旁白',title:'終於，不用再追',copy:'中庭安靜下來，勝隊圍到麥架前。這一次，神麥穩穩交到手裡；落敗的人也湊過來，誰都不想錯過第一句。'},
 {speaker:'player',voiceKey:'ending.first',title:'我先說一句',copy:'咳！各位聽好，我的第一個主張是——欸？怎麼沒有聲音？'},
 {speaker:'咆哮哥',title:'大聲有什麼用',copy:'太離譜了！七個人跑一天，麥竟然沒電？難怪從早市開始就越喊越小聲。我還以為終於有人肯聽勸！'},
 {speaker:'電火球',title:'一路跑的是我們',copy:'在那叫什麼，燈都不亮了！難怪試音剩一、二。叫大家衝了一整天，這支麥連電都不出！'},
 {speaker:'柯P',title:'標籤後面還有字',copy:'不是啦，先看背面。標籤寫「議會無限城，無限電池」，不是普通電池。買電池還要跑一座城？這支麥附的不是保固，是行程表。'},
 {speaker:'小馬哥',title:'這次先檢查裝備',copy:'輪鎖、單據、路線均已確認。請再帶上水。至於「最後一公里」，這個說法我們可能需要重新定義。'},
 {speaker:'阿扁仔',title:'最後一頁終於有人看',copy:'阿扁翻到供電頁了，也是「無限電池」。有夢最美，至少先讓麥有電。大家不看最後一頁，現在又要問阿扁錯了嗎？'},
 {speaker:'韓國魚',title:'早餐之後是下一餐',copy:'鄉親啊！麥找回來，人跑瘦下來！電池還沒到，便當先送來，好不好？七個人總要先吃飽！'},
 {speaker:'player',voiceKey:'ending.last',title:'有人一起走，路就不同',copy:'這回不用搶著追。我拿麥，你們看路；到了無限城，我們再把話講完。'},
 {speaker:'旁白',title:'拳民開講 · 話還沒講完',copy:'七個人帶著一支沒電的神麥，再次出發。議會無限城的門後，還有新的對手與沒講完的話。未完待續……'}
]);
