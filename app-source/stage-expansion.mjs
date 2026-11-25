import {CAST} from './roster.mjs?v=chapter-presentation-20261117-r1';
const GROUND=430;
// One world-space transform shared by visible chamber and desk collision.
export const CHAMBER=Object.freeze({x:480,y:430,width:1400,height:1400*941/1672,floorRatio:715/941});
export const DESK=Object.freeze({left:480+(493-836)*1400/1672,right:480+(1180-836)*1400/1672,y:430+(581-715)*1400/1672});
export const RALLY=Object.freeze({warning:.8,duration:3.1,speed:480,damage:22,radius:42});
export const SUPPORTER_TEAMS=Object.freeze({player:{color:0xffc85a,label:'玩家'},enemy:{color:0x76e0eb,label:'AI'}});
export function crowdMembers(r){return Array.from({length:6},(_,i)=>({x:(r.x??r.startX??480)+([0,-1,1][i%3]*26)-(i>=3?r.direction*8:0),y:GROUND,phase:r.age<RALLY.warning?'warning':'charge',bounce:Math.sin(r.age*15+i)*4}));}
export function paintStageCrowd(g,duel){
 g.clear();
 // A narrow edge glint makes the existing painted desktop readable, not a second table.
 g.lineStyle(3,0xffd977,.65);g.lineBetween(DESK.left,DESK.y,DESK.right,DESK.y);
 for(const r of duel.rallies){
  const warning=r.age<RALLY.warning,color=SUPPORTER_TEAMS[r.owner.id].color,x=r.x??r.startX??480;
  // The visible front travels on the exact ground collision lane, never the desk.
  g.lineStyle(warning?2:3,color,warning?.55:.85);g.strokeEllipse(x,GROUND,RALLY.radius*2,14);
  if(warning){g.lineStyle(2,color,.6);g.lineBetween(x,GROUND-3,x+r.direction*RALLY.radius,GROUND-3);g.lineBetween(x+r.direction*RALLY.radius,GROUND-3,x+r.direction*(RALLY.radius-12),GROUND-10);}
 }
}
// Idle crowds cancel the camera transform. A summoned crowd instead follows the
// actual world-space collision front, including with reduced motion enabled.
export const SUPPORTER_ASSETS=['supporter-woman','supporter-man','supporter-elder','supporter-young','supporter-grandma'];
export const SUPPORTER_IDLE_ALPHA=.82;
function supporterAlpha(cast,age){
 if(!cast)return SUPPORTER_IDLE_ALPHA;
 const progress=Math.max(0,Math.min(1,age/Math.max(.001,RALLY.warning))),ease=progress*progress*(3-2*progress),fade=Math.max(0,Math.min(1,(RALLY.duration-age)*5));
 return (SUPPORTER_IDLE_ALPHA+(1-SUPPORTER_IDLE_ALPHA)*ease)*fade;
}
export function supporterFormation(duel,time=0,reduced=false,view=null){
 const members=[];if(!['active','paused','countdown'].includes(duel.status))return members;
 const W=view?.width||960,H=view?.height||540,z=Math.max(.1,view?.zoom||1),cx=view?.x??480,cy=view?.y??270;
 const floor=view?.crowdBottom??H-(view?.overlayControls?70:8),size=Math.max(48,Math.min(76,H*.19)),spacing=Math.min(35,W*.06),lane=Math.min(150,Math.max(spacing+26,W*.18));
 for(const f of view?.route?[duel.player]:[duel.player,duel.enemy]){
  const cast=duel.rallies.find(r=>r.owner===f),age=cast?.age||0,count=cast?6:Math.ceil(Math.max(0,Math.min(100,f.rally))*6/100),side=f.id==='player'?1:-1,base=side===1?lane:W-lane,team=SUPPORTER_TEAMS[f.id];
  if(view?.route){
   const face=f.face||1,depth=f.depth??0,routeBaseX=f.x-face*90;
   for(let i=0;i<count;i++){
    const row=i<3?0:1,col=[0,-1,1][i%3],charging=!!cast&&age>=RALLY.warning,bounce=reduced||!charging?0:Math.abs(Math.sin(age*32+i*1.4))*4;
    const idleX=routeBaseX+col*28-row*face*8,idleDepth=depth-42-row*10,attackX=(cast?.x??routeBaseX)+col*26-row*(cast?.direction??face)*8;
    const t=cast?Math.min(1,age/RALLY.warning):0,ease=t*t*(3-2*t),mix=(a,b)=>a+(b-a)*ease;
    members.push({side:f.id,row,asset:SUPPORTER_ASSETS[i%SUPPORTER_ASSETS.length],x:cast?mix(idleX,attackX):idleX,y:GROUND-row*5-bounce,depth:cast?(cast.depth??depth):idleDepth,height:cast?96:84,rotation:reduced?0:charging?(cast?.direction??face)*.14:0,alpha:supporterAlpha(cast,age),charging,summoned:!!cast,scattered:false,flag:i===0,name:f.mobKind?(f.displayName||f.name):CAST[f.type].name,team:team.label,color:team.color,direction:cast?.direction??face});
   }
   continue;
  }
  const passing=!cast&&duel.rallies.find(r=>r.owner!==f&&r.age>=RALLY.warning&&Math.abs(W/2+((r.x??r.startX)-cx)*z-base)<80),scatter=passing?1-Math.abs(W/2+(passing.x-cx)*z-base)/80:0;
  for(let i=0;i<count;i++){
   const row=i<3?0:1,col=[0,-1,1][i%3],charging=!!cast&&age>=RALLY.warning,bounce=reduced||!charging?0:Math.abs(Math.sin(age*32+i*1.4))*4;
   const sx=base+col*spacing-row*side*6+(reduced?0:-side*scatter*(12+(i%2)*9)),sy=floor-(1-row)*9-(reduced?0:scatter*(i%2?14:5));
   const direction=cast?.direction??side;
   // Walk continuously from the stable supporter lane to the world attack lane.
   // No collision is active until this entrance reaches its end at warning time.
   const t=cast?Math.min(1,age/RALLY.warning):0,ease=t*t*(3-2*t),idleX=cx+(sx-W/2)/z,idleY=cy+(sy-H/2)/z;
   const attackX=(cast?.x??cast?.startX??idleX)+col*26-row*direction*8,attackY=GROUND-row*5-bounce;
   const mix=(a,b)=>a+(b-a)*ease;
   members.push({side:f.id,row,asset:SUPPORTER_ASSETS[i%SUPPORTER_ASSETS.length],x:cast?mix(idleX,attackX):idleX,y:cast?mix(idleY,attackY):idleY,depth:0,height:cast?mix(size/z,96):size/z,rotation:reduced?0:charging?direction*.14:scatter*(-side*.32),alpha:supporterAlpha(cast,age),charging,summoned:!!cast,scattered:!!passing,flag:i===0,name:f.mobKind?(f.displayName||f.name):CAST[f.type].name,team:team.label,color:team.color,direction});
  }
 }
 return members;
}
const RIVAL_PAIR_ROASTS=Object.freeze({
 'wang:han':'恰吉王：「韓國魚，我這輩子從沒對這支麥克風這麼從容過。」',
 'han:wang':'韓國魚：「可憐哪王兄，剛才連滾帶爬的姿勢差點上熱搜！」',
 'han:su':'韓國魚：「大聲公借我喊一句：發財金幣比嗓門還大聲！」',
 'su:han':'電火球蘇：「什麼穿雲箭？在我的大聲公面前都是雜訊啦！」',
 'su:huang':'電火球蘇：「有錯就要認，排隊線今天先讓我衝過去了！」',
 'huang:su':'戰神昌：「麥克風音量大不代表有道理，全部給我先去排隊！」',
 'ma:chen':'小馬哥：「報告院長，謝謝指教。剛才握完手記得多喝溫開水。」',
 'chen:ma':'阿扁仔：「喂！紙飛機飛過去的不是公文，是我莫忘初衷的氣勢啦！」',
 'ko:chen':'阿北柯：「怪怪的，這紙飛機空氣動力學明顯不對，還是我阿北比較科學。」',
 'chen:ko':'阿扁仔：「別在那邊算數據了！看我的紙飛機從從容容來回兩趟！」',
 'huang:wang':'戰神昌：「滾得再快也沒用，今天這支麥克風我正式宣布拒絕轉交！」',
 'wang:huang':'恰吉王：「排隊線畫得再直，也擋不住我從容過肩摔啦！」',
 'ma:wang':'小馬哥：「從容不是只有你會，我咳兩聲照樣把全場拉進節奏。」',
 'wang:ma':'恰吉王：「想跟我握手？我這杯保溫杯剛喝完，手滑沒握到！」',
 'ko:huang':'阿北柯：「咆哮沒有用啦，SOP 已經算出你要喊幾分貝了。」',
 'huang:ko':'戰神昌：「再點名我就把你的白板全部退件！去排隊！」',
});
const MIRROR_ROASTS=Object.freeze({
 wang:'兩個恰吉王同時戴上墨鏡——全場找不到第二個人能看破誰才是本尊。',
 han:'兩位韓國魚在場上互喊可憐哪，結果連發財金幣都搞不清楚該飛向哪一邊。',
 ma:'兩位小馬哥同時清喉嚨致詞，全場等了三十秒還沒進入第二頁簡報。',
 su:'雙電火球大聲公對轟，錄音室的隔音棉現場宣布提早離職。',
 huang:'兩個戰神互畫排隊線，排到最後兩人只好站在線上互相拒絕對方。',
 chen:'兩架夢想紙飛機在半空中互敬握手，現場突然變得很溫馨。',
 ko:'兩個阿北拿著同款點名牌互嗆不科學，最後雙雙對著麥克風說「我算錯了」。',
});
export function battleResultCopy(duel){
 const mirror=duel.player.type===duel.enemy.type,label=f=>(f.displayName||f.name||CAST[f.type].name)+(mirror&&!f.mobKind&&SUPPORTER_TEAMS[f.id]?`（${SUPPORTER_TEAMS[f.id].label}）`:'');
 if(duel.winner==='draw')return {title:`${label(duel.player)}、${label(duel.enemy)} 平手！`,subtitle:'兩邊都不肯下班，麥克風只好宣布加班。'};
 const winner=duel.winner==='player'?duel.player:duel.enemy,loser=winner===duel.player?duel.enemy:duel.player,stats=duel.stats||{};
 const bothCast=!duel.player.mobKind&&!duel.enemy.mobKind;
 const rival=bothCast&&!mirror?RIVAL_PAIR_ROASTS[`${winner.type}:${loser.type}`]:null;
 const mirrorRoast=bothCast&&mirror?MIRROR_ROASTS[winner.type]:null;
 const roast=mirrorRoast||rival||(stats.interrupts>0?'本場最佳戰術：不讓對方把水喝完。':stats.counters>0?(duel.player.type==='wang'?'墨鏡戴對時機，從容就是一種攻擊。':'等到對方出招，這一回合笑著接下。'):stats.maxCombo>=4?'拳腳沒有在辯論，但場面很有說服力。':CAST[winner.type].roast);
 return {title:`${label(winner)}${mirror?'':' '}獲勝！`,subtitle:roast};
}
