import {CHALLENGE_SECTIONS} from './challenge-content.mjs?v=post69-street-seam-cull-20261112-r1';
export const CHALLENGE_CHAPTER='chapter-1';
export function challengePhase(checkpoint=0){
 const point=Math.max(0,Math.min(6,Math.trunc(Number(checkpoint)||0)));
 return point===6?{kind:'complete',checkpoint:6}:{kind:point%2?'boss':'route',section:Math.floor(point/2),checkpoint:point,gate:CHALLENGE_SECTIONS[Math.floor(point/2)].gate};
}
export function challengeOpening(character='wang'){
 const speaker={wang:'恰吉王',han:'韓國魚',ma:'小馬哥',su:'電火球',huang:'咆哮哥',chen:'阿扁仔',ko:'柯P'}[character]||'你';
 return [
 {phase:0,shot:'bulletin',title:'議場神麥失蹤！',speaker:'晨間快報',copy:'拿到的人，全台都得聽他講。',description:'鬧鐘震動，電視快報宣布議場神麥失蹤。'},
 {phase:1,shot:'wake',title:'誰把音量開進夢裡？',speaker,copy:'我只是想睡到自然醒，不是被全台叫醒。',description:speaker+'穿著睡衣從床上坐起、掀開棉被，伸手關鬧鐘。'},
 {phase:2,shot:'wardrobe',title:'戰袍上身，早餐到手。',speaker,copy:'刷牙可以快，這口早餐不能省。',description:speaker+'換上自己的戰鬥服裝，順手抓起早餐。'},
 {phase:2,shot:'chase',title:'欸！麥克風別跑！',speaker,copy:'早餐可以外帶，發言權不能讓！',description:'神麥飛過街角，'+speaker+'追著麥克風奔向街頭。'}
 ];
}
export const BOSS_DIALOGUES=[
 [{phase:3,title:'擴音器不是通行證',speaker:'擴音隊長',copy:'前面音量管制！沒有比我大聲，誰都不准過。'}, {phase:3,title:'那就用拳頭調音量',speaker:'你',copy:'我只是路過，你連路人的發言權都要管？先把擴音器借我看一下。'}],
 [{phase:4,title:'先排隊，還是先過招？',speaker:'封街總管',copy:'這條街我在指揮。要去追麥克風？先填三份申請，再排到明天。'}, {phase:4,title:'今天不抽號碼牌',speaker:'你',copy:'我不插隊。我只是要把堵住整條街的牌子挪開！'}],
 [{phase:5,title:'神麥，就在眼前',speaker:'咆哮哥',copy:'太離譜了！我才說到重點，麥克風怎麼自己飛過來了？'}, {phase:5,title:'誰贏，誰開講',speaker:'你',copy:'那就三戰兩勝。贏的人拿麥克風，輸的人先聽一下！'}]
];
export class ChallengeSession{
 constructor({progress,characterId='wang',helperId='han',difficulty='easy',replay=false}={}){this.progress=progress;this.context=progress.context();this.characterId=characterId;this.helperId=helperId;this.difficulty=difficulty;this.checkpoint=replay?0:Math.min(5,progress.get().checkpoint||0);this.carry=null;this.finished=false;this.lastReward=null;this.attemptId=this.phase.kind==='route'?progress.beginRouteAttempt({checkpoint:this.checkpoint,restart:replay,context:this.context}):null;}
 get phase(){return challengePhase(this.finished?6:this.checkpoint);}
 rewardMob(event){if(this.phase.kind!=='route'||this.attemptId===null)return false;return this.progress.rewardEncounter({encounterId:event.encounterId,attemptId:this.attemptId,xp:event.xp??8,characterId:this.characterId,checkpoint:this.checkpoint,context:this.context});}
 routeComplete(carry){if(this.phase.kind!=='route')return false;this.carry=carry;this.checkpoint++;this.progress.rewardEncounter({encounterId:'route-'+this.phase.section,xp:25,characterId:this.characterId,checkpoint:this.checkpoint,context:this.context});return true;}
 bossWon(carry){if(this.phase.kind!=='boss')return false;const section=this.phase.section;this.carry=carry;this.checkpoint++;this.finished=this.checkpoint>=6;this.progress.rewardEncounter({encounterId:'boss-'+section,xp:section===2?160:100,characterId:this.characterId,checkpoint:this.checkpoint,boss:section===2,context:this.context});if(this.phase.kind==='route')this.attemptId=this.progress.beginRouteAttempt({checkpoint:this.checkpoint,context:this.context});return true;}
 retry(){this.carry=null;if(this.phase.kind==='route')this.attemptId=this.progress.beginRouteAttempt({checkpoint:this.checkpoint,restart:true,context:this.context});return this.phase;}
}
