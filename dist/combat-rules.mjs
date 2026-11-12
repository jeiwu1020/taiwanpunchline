// V13 numerical rules. Source attribution and display/audio identities remain in
// roster.mjs. All timings and damage are shared by both sides and difficulties.
export const COMBAT={
 punch:{behavior:'melee',start:.10,end:.23,duration:.32,range:130,damage:6,knock:15,height:'mid',contact:true},
 rush:{behavior:'rush',start:.16,end:.50,duration:.72,range:120,damage:14,knock:45,height:'low',contact:true,speed:620,advanceStart:.12,advanceEnd:.50,cooldown:4,hint:'低身翻滾接近 · 起手照常受傷，可跳起或格擋'},
 counter:{behavior:'counter',start:.08,window:.40,duration:.84,damage:12,knock:22,range:150,retreat:45,cooldown:6,hint:'只反近身接觸 · 不擋飛行道具或抓技'},
 heal:{behavior:'heal',start:1,duration:1.20,heal:10,cooldown:10,hint:'抬杯短保護，喝滿一秒回復10 · 後段受擊會吐水'},
 coin:{behavior:'projectile',start:.16,duration:.48,projectileKind:'coin',speed:520,life:2,damage:11,knock:28,height:'high',cooldown:4,hint:'高處直線金幣 · 蹲低、跳躍、格擋可閃避'},
 han_knee:{behavior:'advance',advanceStart:.18,advanceEnd:.60,speed:150,start:.62,end:.74,duration:1.08,range:170,damage:14,knock:60,height:'mid',contact:false,cooldown:5.5,hint:'盤腿膝行後中段喊話 · 關鍵動作不斷招，照常扣血'},
 arrow:{behavior:'lob',start:.24,duration:.60,flight:1.2,damage:20,knock:48,height:'low',cooldown:7,hint:'固定落點穿雲箭 · 離開標記、跳起或格擋'},
 ma_handshake:{behavior:'grab',start:.28,end:.36,duration:.80,range:145,damage:12,knock:0,height:'grab',cooldown:5,hint:'近身抓技穿過格擋 · 起跳或拉開距離可躲'},
 ma_gaze:{behavior:'melee',start:.25,end:.38,duration:.72,range:150,damage:9,airDamage:14,knock:48,height:'mid',contact:true,antiAir:true,cooldown:5.5,hint:'上托手掌對空14 · 地面9，可格擋或拉開'},
 ma_cough:{behavior:'combo',duration:.90,range:165,height:'high',contact:false,cooldown:6,hits:[{start:.20,end:.28,damage:4,knock:4,height:'high'},{start:.44,end:.52,damage:6,knock:32,height:'high'}],erase:true,hint:'高處咳兩聲4+6 · 關鍵動作不斷招，可消除直線道具'},
 su_shout:{behavior:'melee',start:.32,end:.44,duration:.76,range:190,damage:14,knock:68,height:'mid',contact:false,guardCost:2,cooldown:5,hint:'中段喊話壓兩格防守 · 關鍵動作不斷招但照樣扣血'},
 su_rush:{behavior:'combo',duration:.96,range:125,height:'low',contact:true,cooldown:5.5,hits:[{start:.22,end:.29,damage:6,knock:6,height:'low'},{start:.42,end:.49,damage:5,knock:6,height:'low'},{start:.62,end:.69,damage:5,knock:38,height:'low'}],steps:[{start:.12,end:.22,speed:330},{start:.32,end:.42,speed:330},{start:.52,end:.62,speed:330}],hint:'三步低段撞擊6+5+5 · 跳起或格擋，再抓收招空檔'},
 su_dare:{behavior:'counter',start:.20,window:.30,duration:1.0,damage:18,knock:45,range:150,cooldown:7,hint:'招手後短暫近身反擊 · 抓技、遠攻或等收招可破'},
 huang_shout:{behavior:'melee',start:.30,end:.42,duration:.78,range:205,damage:14,knock:88,height:'mid',contact:false,wallBonus:3,cooldown:5.5,hint:'中段震波推遠 · 撞牆最多另加3，可格擋或拉開'},
 huang_debt:{behavior:'reject',start:.14,window:.35,duration:.76,range:155,cooldown:6,hint:'短暫拒絕一次近身攻擊 · 實體反彈金幣或紙機'},
 huang_queue:{behavior:'queue',start:.28,duration:.72,range:110,life:1.5,damage:10,knock:65,height:'low',cooldown:6.5,hint:'擺一條短暫排隊線 · 跳過或用拳與道具打掉'},
 chen_dream:{behavior:'projectile',start:.30,duration:.72,projectileKind:'dream',speed:350,life:3,travel:450,damage:8,returnDamage:6,knock:14,height:'high',cooldown:6,hint:'高處紙機去8回6 · 蹲低或跳過，格擋或反彈終止回程'},
 chen_question:{behavior:'combo',duration:.80,range:165,contact:true,cooldown:4.5,hits:[{start:.18,end:.27,damage:5,knock:4,height:'high'},{start:.42,end:.52,damage:8,knock:32,height:'low'}],hint:'高低連擊 · 高段5、低段8，可格擋或看準跳蹲'},
 chen_calm:{behavior:'calm',start:.12,window:.45,duration:.82,retreat:60,cooldown:7,hint:'一次普通攻擊最多受4並退後 · 第二擊或抓技可破'},
 ko_bags:{behavior:'combo',duration:.78,range:155,contact:true,cooldown:4.5,hits:[{start:.16,end:.26,damage:6,knock:4,height:'low'},{start:.40,end:.51,damage:8,knock:32,height:'mid'}],destroysQueue:true,hint:'雙袋低段6接中段8 · 可打掉排隊線，兩段可格擋'},
 ko_name:{behavior:'word',start:.30,duration:.78,flight:.56,range:230,damage:12,knock:25,height:'low',slow:.7,cooldown:6,hint:'弧線文字落在固定標記 · 命中緩速25%，可跳離或格擋'},
 ko_resolve:{behavior:'armor',start:.16,window:.90,duration:.46,cooldown:7,hint:'一次普通傷害減為60%且不退不斷招 · 可帶入普通拳'},
};
export const HIGH_Y=252;
export const JUMP_SPEED=900;
export const GRAVITY=1550;
