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
 {speaker:'電火球',title:'人有力，麥沒電',copy:'在那叫什麼！燈都不亮了，沒電啦！難怪一路越喊越小聲。人跑了一整天，電池倒先下班！'},
 {speaker:'旁白',title:'保固到此為止',copy:'阿扁仔旋開底蓋，倒出一顆方形電池。正面印著「議會無限城製造」，底下的紅字亮得刺眼：「過保失效」。',shot:'battery'},
 {speaker:'咆哮哥',title:'這是哪一條規定',copy:'我請教一下，電池一過保就罷工？還有，議會裡什麼時候有座無限城？誰聽過？',shot:'battery'},
 {speaker:'旁白',title:'翻面才有路',copy:'七人面面相覷。柯P翻過電池，背面竟畫著地圖：議場東廊、第三盞燈、壁畫後的階梯。終點圈著「無限城」，旁註「議會內密道」。',shot:'battery-map'},
 {speaker:'柯P',title:'不是回收標誌',copy:'不是啦，這是路線圖。我以前也不知道議會裡有這條密道。東廊就在那邊，先去對一下。',shot:'battery-map'},
 {speaker:'旁白',title:'牆後真的有路',copy:'七人循圖走到東廊，在第三盞燈下推開壁畫。一道向下的石階露了出來，冷風從深處吹過，連最會喊的人都暫時閉嘴。',shot:'corridor'},
 {speaker:'小馬哥',title:'請注意腳下',copy:'請扶著牆走，小心腳下。我原以為議會的路已經夠繞，沒想到還有地下版本。',shot:'corridor'},
 {speaker:'旁白',title:'最後一扇門',copy:'石階盡頭，一扇刻著「無限城」的厚木門擋住去路。七人輪流推、拉、敲，門紋絲不動；門邊只有一道方形凹槽。',shot:'sealed-door'},
 {speaker:'電火球',title:'再推一次',copy:'門也要申請才肯開？我數到三，你們一起推！一、二——後面不要只顧著喊！',shot:'sealed-door'},
 {speaker:'韓國魚',title:'便當先別犧牲',copy:'鄉親啊，人進得來，門就要打得開！……欸，都別推了，我的便當被擠成飯糰了！',shot:'sealed-door'},
 {speaker:'旁白',title:'不是這樣開的吧',copy:'韓國魚一縮手，撞掉阿扁仔手裡的電池。電池彈上門邊凸出的石沿，滑進方形凹槽——喀！七人同時停手。',shot:'battery-key'},
 {speaker:'阿扁仔',title:'過保還有用途',copy:'阿扁拿它來認路，沒叫它開門啊！過保不能發電，倒還能當鑰匙？這個用途怎麼不印在正面？',shot:'battery-key'},
 {speaker:'柯P',title:'先不要拔',copy:'七個人推半天，還不如一顆沒電的。先別拔，它不是卡住，是把鎖打開了。',shot:'battery-key'},
 {speaker:'旁白',title:'門後比想像更深',copy:'厚木門向兩側退開。門後的空間遠比議會寬，層層走廊懸在黑暗裡。遠處，一盞不知誰點亮的燈忽然晃了一下。',shot:'open-door'},
 {speaker:'player',voiceKey:'ending.last',title:'這次，先看清楚',copy:'先別擠，裡面還看不清楚。大家跟緊，這回誰也別落單。',shot:'open-door'},
 {speaker:'旁白',title:'多出的一個回音',copy:'七人跨過門檻，沒電的神麥仍安安靜靜。腳步聲沿長廊傳開，卻多出了一個回音。誰也沒再說「最後一站」。',shot:'open-door'}
]);
