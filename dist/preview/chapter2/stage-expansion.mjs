import {CAST} from './roster.mjs?v=campaign-boot-20261112-r3';
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
export function supporterFormation(duel,time=0,reduced=false,view=null){
 const members=[];if(!['active','paused','countdown'].includes(duel.status))return members;
 const W=view?.width||960,H=view?.height||540,z=Math.max(.1,view?.zoom||1),cx=view?.x??480,cy=view?.y??270;
 const floor=view?.crowdBottom??H-(view?.overlayControls?70:8),size=Math.max(48,Math.min(76,H*.19)),spacing=Math.min(35,W*.06),lane=Math.min(150,Math.max(spacing+26,W*.18));
 for(const f of [duel.player,duel.enemy]){
  const cast=duel.rallies.find(r=>r.owner===f),age=cast?.age||0,count=cast?6:Math.ceil(Math.max(0,Math.min(100,f.rally))*6/100),side=f.id==='player'?1:-1,base=side===1?lane:W-lane,team=SUPPORTER_TEAMS[f.id];
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
   members.push({side:f.id,row,asset:SUPPORTER_ASSETS[i%SUPPORTER_ASSETS.length],x:cast?mix(idleX,attackX):idleX,y:cast?mix(idleY,attackY):idleY,height:cast?mix(size/z,96):size/z,rotation:reduced?0:charging?direction*.14:scatter*(-side*.32),alpha:cast?Math.max(0,Math.min(1,(RALLY.duration-age)*5)):.85,charging,scattered:!!passing,flag:i===0,name:f.mobKind?(f.displayName||f.name):CAST[f.type].name,team:team.label,color:team.color,direction});
  }
 }
 return members;
}
export function battleResultCopy(duel){
 const mirror=duel.player.type===duel.enemy.type,label=f=>(f.displayName||f.name||CAST[f.type].name)+(mirror&&!f.mobKind&&SUPPORTER_TEAMS[f.id]?`（${SUPPORTER_TEAMS[f.id].label}）`:'');
 if(duel.winner==='draw')return {title:`${label(duel.player)}、${label(duel.enemy)} 平手！`,subtitle:'兩邊都不肯下班，麥克風只好宣布加班。'};
 const winner=duel.winner==='player'?duel.player:duel.enemy,stats=duel.stats||{};
 const roast=stats.interrupts>0?'本場最佳戰術：不讓對方把水喝完。':stats.counters>0?(duel.player.type==='wang'?'墨鏡戴對時機，從容就是一種攻擊。':'等到對方出招，這一回合笑著接下。'):stats.maxCombo>=4?'拳腳沒有在辯論，但場面很有說服力。':CAST[winner.type].roast;
 return {title:`${label(winner)}${mirror?'':' '}獲勝！`,subtitle:roast};
}
