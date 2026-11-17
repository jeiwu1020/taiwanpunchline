import {impactY} from '../../combat-view.mjs?v=chapter-combat-feedback-20261115-r1';
import {GROUND,CAST} from '../../core.mjs?v=chapter-combat-feedback-20261115-r1';

const COLORS=Object.freeze({supply:'#b6f1ba',assist:'#ffe49a',assistEnemy:'#a7f5ff',hit:'#fff6c9',block:'#a7ece3',damage:'#fff6c9',counter:'#fff0be',miss:'#bddfe1',heal:'#a5f0bc',break:'#ffbb96',reflect:'#ffe1a1',reject:'#e4c8ef',erase:'#e1d9c4',capture:'#f4d58c',queue:'#ffd9a6',armor:'#b8f0ed',calm:'#d4efd6',wall:'#e4c8ef',slow:'#bbe5e4',rally:'#ffe084'});

export function rememberCombatFeedback(queue,event,now=performance.now()){
 if(!event||!queue)return;
 const add=(x,y,depth,text,color,size,duration=850)=>{if(!Number.isFinite(x)||!Number.isFinite(y)||!text)return;queue.push({x,y,depth:depth??0,text,color,size,started:now,duration,rise:20});};
 const actor=(f,offset,text,color,size,x=f?.x)=>{if(f)add(x,f.y+offset,f.depth,text,color,size);};
 if(event.type==='hit'||event.type==='block'){
  const target=event.to;if(!target)return;
  const text=event.type==='block'?(event.assist?'助拳被擋住':'擋住了'):event.assist?'助拳命中！':event.impact==='item_rubber_duck'?'嘎！':event.impact==='item_paper'?'紙花！':event.combo>1?`${event.combo} 連段！`:'啪！';
  add(target.x,impactY(event)-14,target.depth,text,event.type==='block'?COLORS.block:COLORS.hit,event.combo>1?29:36);
  add(target.x+40,target.y-220,target.depth,'−'+Math.round(event.amount??0),COLORS.damage,22);
 }else if(event.type==='counter')actor(event.f,-150,event.f?.type==='wang'?'游刃有餘':'反擊成功！',COLORS.counter,24);
 else if(event.type==='counterMiss')actor(event.f,-255,event.f?.type==='wang'?'從容失敗':'等太久了',COLORS.miss,23);
 else if(event.type==='spit')actor(event.f,-220,'水還沒喝到，先喝了一拳。','#fff6c9',20);
 else if(event.type==='heal')actor(event.f,-245,'喝到了！ +'+(event.amount??10),COLORS.heal,28);
 else if(event.type==='arrowMark')add(event.x,GROUND-34,0,'離開落點！','#ffe0a1',20);
 else if(event.type==='arrowMiss')add(event.x,GROUND-45,0,'沒中','#fff6df',22);
 else if(event.type==='guardBreak')actor(event.f,-205,'破防！',COLORS.break,29);
 else if(event.type==='reflect')actor(event.f,-272,'拒收，原路退回！',COLORS.reflect,22);
 else if(event.type==='reject')actor(event.f,-185,'不欠你，擋回去！',COLORS.reject,22);
 else if(event.type==='erase')actor(event.f,-250,'咳掉了！',COLORS.erase,20);
 else if(event.type==='capture'&&event.from&&event.to)add((event.from.x+event.to.x)/2,Math.min(event.from.y,event.to.y)-90,((event.from.depth??0)+(event.to.depth??0))/2,'握住了！',COLORS.capture,30);
 else if(event.type==='queuePlant')actor(event.f,-110,'先排隊！',COLORS.queue,21,event.f.x+(event.f.face||1)*85);
 else if(event.type==='queueBreak')add(event.x,GROUND-90,0,'隊線散了','#f4d4b1',19);
 else if(event.type==='armor')actor(event.f,-88,'護甲就緒',COLORS.armor,22,event.f.x+(event.f.face||1)*90);
 else if(event.type==='armorAbsorb')actor(event.f,-88,'痛，但不停手',COLORS.armor,22,event.f.x+(event.f.face||1)*90);
 else if(event.type==='calm')actor(event.f,-250,'大事化小…',COLORS.calm,22);
 else if(event.type==='wallBounce'||event.type==='wallHit')actor(event.f,-230,'牆也聽到了！',COLORS.wall,22);
 else if(event.type==='slow')actor(event.f,-220,'被字絆一下',COLORS.slow,21);
 else if(event.type==='itemPickup')actor(event.f,-220,'拿到'+(event.item?.kind==='rubber_duck'?'吱吱鴨':'紙團')+'！',COLORS.heal,22);
 else if(event.type==='itemThrow')actor(event.f,-220,event.kind==='rubber_duck'?'橡皮鴨出勤，嘎！':'紙團出動，請收件！',COLORS.hit,22);
 else if(event.type==='rallyResult')add(event.result==='miss'?event.r?.x:event.to?.x,GROUND-100,event.to?.depth??event.r?.depth??0,event.result==='miss'?(event.r?.tooHigh?'桌上太高啦！':'躲開了！'):event.result==='blocked'?'格擋 −'+event.amount:'命中 −'+event.amount,event.result==='hit'?COLORS.rally:'#d0f7fa',22);
 else if(event.type==='performanceGuard')actor(event.f,-280,'讓我演完這一下！','#ffe29a',18);
 else if(event.type==='supply')actor(event.f,-300,'補給到手！HP 全滿',COLORS.supply,23);
 else if(event.type==='assistStart'&&event.assist?.actor){const helper=event.assist.actor;add(helper.x,helper.y-250,helper.depth,`${event.assist.displayName??CAST[event.helper]?.name??'助拳'} · ${event.name??'援護到場'}`,event.assist.owner?.id==='enemy'?COLORS.assistEnemy:COLORS.assist,22,1300);}
 while(queue.length>32)queue.shift();
}

export function paintCombatFeedback(ctx,queue,frame,ground,width,now=performance.now()){
 while(queue.length&&now-queue[0].started>=queue[0].duration)queue.shift();
 const zoom=Math.max(.1,frame.zoom||1),viewHeight=frame.height??frame.cameraFrame?.height??0;
 for(const item of queue){
  const progress=Math.max(0,Math.min(1,(now-item.started)/item.duration)),alpha=(1-progress)**2,x=(item.x-frame.left)*zoom,y=frame.base+(item.y-ground+(item.depth??0)*.65-item.rise*(1-(1-progress)**3))*zoom,size=Math.min(item.size*zoom,width*.09);
  if(x<-width*.25||x>width*1.25||y<-80||y>viewHeight+80)continue;
  ctx.save();ctx.globalAlpha*=alpha;ctx.font=`900 ${size}px "Microsoft JhengHei",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(2,4*zoom);ctx.strokeStyle='#142b32';ctx.fillStyle=item.color;ctx.strokeText(item.text,x,y);ctx.fillText(item.text,x,y);ctx.restore();
 }
}
