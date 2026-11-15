import {RALLY,SUPPORTER_TEAMS,supporterFormation} from '../../stage-expansion.mjs?v=rally-consistency-20261115-r1';
import {GROUND} from '../../core.mjs?v=rally-consistency-20261115-r1';
import {supporterFlagLayout} from '../../supporter-flags.mjs?v=campaign-boot-20261112-r3';
export function rallyCrowdFormation(world,frame,width,height,time,{route=false,reducedMotion=false}={}){
 const zoom=Math.max(.1,frame.zoom||1),cameraX=frame.left+width/(2*zoom),cameraY=430+(height/2-frame.base)/zoom;
 return supporterFormation(world,time,reducedMotion,{width,height,zoom,x:cameraX,y:cameraY,route,crowdBottom:Math.max(height*.45,frame.base-4)});
}
export function paintRallySupporters(ctx,images,members,project,zoom=1){
 for(const member of members){
  const image=images[member.asset]||images[member.side==='enemy'?'supporter-man':'supporter-woman'];if(!image)continue;
  const point=project(member),height=Math.max(18,(member.height??76)*zoom),width=height*image.width/image.height;
  ctx.save();ctx.globalAlpha*=member.alpha??1;ctx.translate(point.x,point.y);ctx.rotate(member.rotation??0);ctx.scale(member.direction<0?-1:1,1);ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();
 }
}
export function mergeRallySupporterLayers(layers,members,obstacles=[]){
 const rank=kind=>kind==='rally-supporter'?1:kind==='callout'?2:kind==='actor'?3:0;
 return [...layers,...obstacles,...members.map(member=>({kind:'rally-supporter',member,depth:member.depth??0}))]
  .sort((a,b)=>(a.depth??0)-(b.depth??0)||rank(a.kind)-rank(b.kind));
}
const teamColor=id=>`#${(SUPPORTER_TEAMS[id]?.color??SUPPORTER_TEAMS.player.color).toString(16).padStart(6,'0')}`;
function pathRoundedRect(ctx,x,y,width,height,radius){
 const r=Math.max(0,Math.min(radius,width/2,height/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+width,y,x+width,y+height,r);ctx.arcTo(x+width,y+height,x,y+height,r);ctx.arcTo(x,y+height,x,y,r);ctx.arcTo(x,y,x+width,y,r);ctx.closePath();
}
export function paintRallySupporterFlags(ctx,members,{width,height,zoom=1,left=0,base=height}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height))return;
 const z=Math.max(.1,zoom),camera={width,height,zoom:z,x:left+width/(2*z),y:GROUND+(height/2-base)/z};
 const screen=p=>({x:width/2+(p.x-camera.x)*z,y:height/2+(p.y-camera.y)*z});
 for(const member of members){
  if(!member.flag||!member.name)continue;
  const bearer=member.depth?{...member,y:member.y+member.depth*.65}:member,flag=supporterFlagLayout(bearer,camera);if(!flag.visible)continue;
  const grip=screen(flag.grip),poleTop=screen(flag.poleTop),center=screen(flag),w=flag.width*z,h=flag.height*z;
  ctx.save();ctx.globalAlpha*=member.alpha??1;ctx.strokeStyle='#17323b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(grip.x,grip.y);ctx.lineTo(poleTop.x,poleTop.y);ctx.stroke();
  pathRoundedRect(ctx,center.x-w/2,center.y-h/2,w,h,3);ctx.fillStyle=teamColor(member.side);ctx.fill();ctx.strokeStyle='#17323b';ctx.lineWidth=1.5;ctx.stroke();
  ctx.font=`bold ${flag.fontSize}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#17323b';ctx.fillText(flag.text,center.x,center.y);ctx.restore();
 }
}
export function paintRallyAttackLane(ctx,world,project,zoom=1,{route=false}={}){
 if(route)return;
 const z=Math.max(.1,zoom);
 for(const rally of world.rallies||[]){
  const warning=rally.age<RALLY.warning,color=teamColor(rally.owner?.id),x=rally.x??rally.startX??480,p=project(x,GROUND);
  ctx.save();ctx.globalAlpha*=warning ? .55 : .85;ctx.strokeStyle=color;ctx.lineWidth=warning?2:3;ctx.beginPath();ctx.ellipse(p.x,p.y,RALLY.radius*z,7*z,0,0,Math.PI*2);ctx.stroke();
  if(warning){const start=project(x,GROUND-3),end=project(x+rally.direction*RALLY.radius,GROUND-3),tip=project(x+rally.direction*(RALLY.radius-12),GROUND-10);ctx.globalAlpha*=.6;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();}
  if(rally.tooHigh&&!rally.result){const q=project(x+rally.direction*24,GROUND-104);ctx.globalAlpha=1;ctx.strokeStyle='#f77862';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x-5*z,q.y+7*z);ctx.lineTo(q.x+5*z,q.y+14*z);ctx.moveTo(q.x+5*z,q.y+7*z);ctx.lineTo(q.x-5*z,q.y+14*z);ctx.stroke();}
  ctx.restore();
 }
}
function rallyCallout(rally){
 if(rally.age<RALLY.warning)return '集合！';
 if(rally.tooHigh&&!rally.result)return '太高啦！';
 if(rally.result==='miss')return '撲空！';
 if(rally.result==='blocked')return '擋住！';
 if(rally.result==='hit')return '撞到了！';
 return '借過！';
}
export function paintRallyCallouts(ctx,world,project,{width,height,zoom=1,safeTop=0}={}){
 const z=Math.max(.1,zoom);
 for(const [index,rally] of (world.rallies||[]).entries()){
  const p=project(rally.x??rally.startX??480,GROUND);if(p.x<-45||p.x>width+45)continue;
  const x=Math.max(52,Math.min(width-52,p.x)),size=width<480?18:23,y=Math.max(40,safeTop+size+8,p.y-134*z),text=rallyCallout(rally);
  ctx.save();ctx.translate(x,y);ctx.rotate(index===0 ? .055 : -.055);ctx.font=`1000 ${size}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineWidth=4;ctx.strokeStyle='#17323b';ctx.strokeText(text,0,0);ctx.fillStyle=rally.owner?.id==='enemy'?'#a7f5ff':'#ffe49a';ctx.fillText(text,0,0);ctx.restore();
 }
}
export function rallyEventCopy(event,world,bothRallies=false){
 if(event?.type==='rally')return `${bothRallies?'雙方':event.f===world.player?'你的支持者':'對方支持者'}集合！地面衝鋒：跳躍／上桌／格擋`;
 if(event?.type!=='rallyResult')return '';
 if(event.result==='miss')return event.r?.tooHigh?'桌上太高啦！':'躲開了！';
 const amount=Math.round(event.amount??0);return event.result==='blocked'?`格擋 −${amount}`:`命中 −${amount}`;
}
