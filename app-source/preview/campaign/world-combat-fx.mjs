import {GROUND} from '../../core.mjs?v=chapter-presentation-20261117-r1';
import {impactY} from '../../combat-view.mjs?v=chapter-presentation-20261117-r1';

const nowMs=()=>typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function star4(ctx,x,y,r){
 ctx.beginPath();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,rad=i%2?r*.34:r;
  ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*rad,y+Math.sin(a)*rad);
 }
 ctx.closePath();
}

export function rememberWorldFx(queue,event,time=nowMs()){
 if(!queue||!event)return;
 const add=(spec)=>{
  if(!Number.isFinite(spec.x)||!Number.isFinite(spec.y))return;
  queue.push({depth:0,started:time,duration:300,...spec});
 };
 if(event.type==='hit'||event.type==='block'){
  const to=event.to;if(!to)return;
  const heavy=event.type==='hit'&&((event.amount??0)>=14||to.hp<=0||(event.combo??0)>1||['arrow','han_knee','su_shout','su_dare','huang_shout','ma_handshake','rally'].includes(event.impact));
  add({kind:event.type,x:to.x,y:impactY(event),depth:to.depth??0,heavy,duration:heavy?340:230,face:event.from?.face||1});
 }else if(event.type==='counter'&&event.f){
  add({kind:'counter',x:event.f.x,y:(event.f.y??GROUND)-138,depth:event.f.depth??0,duration:340});
 }else if(event.type==='guardBreak'&&event.f){
  add({kind:'guardBreak',x:event.f.x,y:(event.f.y??GROUND)-138,depth:event.f.depth??0,duration:340});
 }else if(event.type==='reflect'&&event.f){
  add({kind:'reflect',x:event.f.x+(event.f.face||1)*34,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:320});
 }else if(event.type==='reject'&&event.f){
  add({kind:'reject',x:event.f.x+(event.f.face||1)*32,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:290});
 }else if(event.type==='armorAbsorb'&&event.f){
  add({kind:'armorAbsorb',x:event.f.x,y:(event.f.y??GROUND)-135,depth:event.f.depth??0,duration:300});
 }else if(event.type==='calm'&&event.f){
  add({kind:'calm',x:event.f.x,y:(event.f.y??GROUND)-135,depth:event.f.depth??0,duration:320});
 }else if(event.type==='heal'&&event.f){
  add({kind:'heal',x:event.f.x,y:(event.f.y??GROUND)-150,depth:event.f.depth??0,duration:380});
 }else if(event.type==='queueBreak'){
  add({kind:'queueBreak',x:event.x??480,y:GROUND-36,depth:event.depth??0,duration:300});
 }else if(event.type==='perkTrigger'&&event.f){
  add({kind:'perkTrigger',x:event.f.x,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:480});
 }
 while(queue.length>40)queue.shift();
}

export function paintWorldFx(ctx,queue,project,zoom=1,time=nowMs()){
 if(!queue||!queue.length)return;
 while(queue.length&&time-queue[0].started>=queue[0].duration)queue.shift();
 for(const fx of queue){
  const u=clamp((time-fx.started)/Math.max(1,fx.duration),0,1);
  if(u>=1)continue;
  const p=project(fx.x,fx.y,fx.depth??0),s=zoom*(p.scale??1),alpha=1-u*u;
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.scale(s,s);
  ctx.globalAlpha*=alpha;
  ctx.lineCap='round';
  if(fx.kind==='block'){
   ctx.strokeStyle='#7ce1d6';ctx.lineWidth=5*(1-u*.3);
   ctx.beginPath();ctx.arc(0,0,28+u*28,-1.15,1.15);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;
   for(let i=0;i<5;i++){const a=-.9+i*.45;ctx.beginPath();ctx.moveTo(Math.cos(a)*26,Math.sin(a)*26);ctx.lineTo(Math.cos(a)*(42+u*24),Math.sin(a)*(42+u*24));ctx.stroke();}
  }else if(fx.kind==='hit'){
   const rays=fx.heavy?12:8,reach=(fx.heavy?82:56)*(0.6+u*0.65);
   ctx.strokeStyle=fx.heavy?'#ffae3d':'#ffdc65';ctx.lineWidth=(fx.heavy?6.5:4.5)*(1-u*.35);
   for(let i=0;i<rays;i++){const a=i*(Math.PI*2/rays)+u*.12;ctx.beginPath();ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a)*reach,Math.sin(a)*reach);ctx.stroke();}
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,(fx.heavy?26:18)+u*(fx.heavy?38:22),0,Math.PI*2);ctx.stroke();
   if(fx.heavy){ctx.strokeStyle='#ffe78f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,12+u*64,0,Math.PI*2);ctx.stroke();}
  }else if(fx.kind==='counter'){
   ctx.strokeStyle='#ffae38';ctx.lineWidth=6*(1-u*.3);ctx.beginPath();ctx.arc(0,0,34+u*64,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#fff7d2';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,22+u*44,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='guardBreak'){
   ctx.strokeStyle='#ff6b4a';ctx.lineWidth=5.5;
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18);ctx.lineTo(Math.cos(a)*(34+u*58),Math.sin(a)*(34+u*58));ctx.stroke();}
   ctx.strokeStyle='#ffe4a0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22+u*46,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='reflect'){
   ctx.strokeStyle='#ffe478';ctx.lineWidth=6*(1-u*.3);ctx.beginPath();ctx.arc(0,0,24+u*54,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,16+u*36,-1.1,1.1);ctx.stroke();
  }else if(fx.kind==='reject'){
   ctx.strokeStyle='#d4a6ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,24+u*48,-1.3,1.3);ctx.stroke();
  }else if(fx.kind==='armorAbsorb'){
   ctx.strokeStyle='#67e5f2';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,28+u*54,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe58f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20+u*34,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='calm'){
   ctx.strokeStyle='#7ed9a4';ctx.lineWidth=4.5;ctx.beginPath();ctx.arc(0,0,24+u*52,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='heal'){
   ctx.strokeStyle='#9cf5b8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,26+u*58,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe584';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,18+u*40,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='queueBreak'){
   ctx.strokeStyle='#e07856';ctx.lineWidth=4.5;
   for(let i=0;i<6;i++){const a=-Math.PI+i*(Math.PI/5);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(24+u*42),Math.sin(a)*(24+u*42));ctx.stroke();}
  }else if(fx.kind==='perkTrigger'){
   ctx.strokeStyle='#ffe05c';ctx.lineWidth=6.5*(1-u*.35);ctx.beginPath();ctx.arc(0,0,32+u*86,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#fff9cf';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,20+u*56,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<10;i++){const a=i*(Math.PI/5)+u*.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*26,Math.sin(a)*26);ctx.lineTo(Math.cos(a)*(46+u*64),Math.sin(a)*(46+u*64));ctx.stroke();}
   ctx.fillStyle='#ffe87a';
   for(let i=0;i<4;i++){const a=i*Math.PI/2+u*1.8,dist=36+u*52;star4(ctx,Math.cos(a)*dist,Math.sin(a)*dist,11*(1-u*.4));ctx.fill();}
  }
  ctx.restore();
 }
}

export function drawWorldFighterAuras(ctx,f,project,zoom=1,time=nowMs()){
 if(!f||f.hp<=0||f.mobKind)return;
 const groundY=f.supportY??GROUND,foot=project(f.x,groundY,f.depth??0),actorPos=project(f.x,f.y??GROUND,f.depth??0);
 const s=zoom*(foot.scale??1),t=time*.001;
 // Rank-5 signature golden ring & rising embers around feet
 if(f.perk?.active){
  const attackBoost=f.attack?1.2:1,spin=(t*2.4)%(Math.PI*2),pulse=.5+.5*Math.sin(t*7);
  ctx.save();
  ctx.translate(foot.x,foot.y);
  ctx.scale(s,s);
  ctx.fillStyle=f.attack?'#ffd95930':'#ffd9591c';
  ctx.beginPath();ctx.ellipse(0,2,56*attackBoost,13*attackBoost,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ffe266';ctx.lineWidth=3.2;
  ctx.beginPath();ctx.ellipse(0,2,(48+pulse*5)*attackBoost,(10.5+pulse*1.5)*attackBoost,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#fff8c9';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,2,42*attackBoost,8.5*attackBoost,0,spin,spin+1.25);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,2,42*attackBoost,8.5*attackBoost,0,spin+Math.PI,spin+Math.PI+1.25);ctx.stroke();
  ctx.fillStyle='#ffe97d';
  for(let i=0;i<4;i++){
   const phase=(t*1.1+i*.25)%1,angle=spin+i*Math.PI/2,px=Math.cos(angle)*38*attackBoost,py=-10-phase*85;
   ctx.globalAlpha=(1-phase)*.85;
   star4(ctx,px,py,5.5);ctx.fill();
  }
  ctx.restore();
 }
 // Multi-hit Rank-5 Ko / standard armor shell
 if(f.armor>0){
  const pulse=.5+.5*Math.sin(t*10);
  ctx.save();
  ctx.translate(actorPos.x,actorPos.y);
  ctx.scale(s,s);
  ctx.strokeStyle='#67e5f2';ctx.fillStyle='#67e5f21c';ctx.lineWidth=3.5;
  ctx.beginPath();ctx.ellipse(0,-136,56+pulse*4,132,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  if((f.armorCount??1)>=2){
   ctx.strokeStyle='#ffe169';ctx.lineWidth=3.5;
   ctx.beginPath();ctx.ellipse(0,-136,64+pulse*5,140,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#142b32e8';ctx.fillRect(34,-262,38,24);
   ctx.strokeStyle='#ffe169';ctx.lineWidth=2;ctx.strokeRect(34,-262,38,24);
   ctx.fillStyle='#ffe57f';ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('×'+f.armorCount,53,-250);
  }
  ctx.restore();
 }
 // Ko Rank-5 brace empowered fist indicator
 if(f.brace>0){
  const face=f.face||1,pulse=.5+.5*Math.sin(t*14);
  ctx.save();ctx.translate(actorPos.x+face*26*s,actorPos.y-130*s);ctx.scale(s,s);
  ctx.strokeStyle='#ffe169';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,22+pulse*6,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ffe97d44';ctx.fill();
  ctx.restore();
 }
 // Ma Rank-5 dizzyStar orbiting stars
 if(f.dizzyStar>0){
  ctx.save();ctx.translate(actorPos.x,actorPos.y-292*s);ctx.scale(s,s);
  ctx.fillStyle='#ffe45e';ctx.strokeStyle='#17353a';ctx.lineWidth=2;
  for(let i=0;i<3;i++){
   const a=t*5.4+i*(Math.PI*2/3),ox=Math.cos(a)*34,oy=Math.sin(a)*9;
   star4(ctx,ox,oy,11);ctx.fill();ctx.stroke();
  }
  ctx.restore();
 }
}

export function drawWorldProjectileExtra(ctx,q,project,zoom=1,time=nowMs()){
 if(!q||q.dead)return;
 // Lobbing target indicator (replaces basic ellipse with shrinking countdown halo)
 if(q.targetX!=null&&(q.kind==='arrow'||q.kind==='word'||q.kind==='notice')){
  const m=project(q.targetX,GROUND,q.targetDepth??q.depth??0),ms=zoom*(m.scale??1);
  const notice=q.kind==='notice',word=q.kind==='word',color=word?'#367e8a':notice?'#d4822a':'#be4033';
  const rx=(q.markWidth??(word?92:notice?96:110))/2,rem=1-clamp((q.age||0)/(q.flight||1.2),0,1);
  ctx.save();ctx.translate(m.x,m.y);ctx.scale(ms,ms);
  ctx.fillStyle=color+'26';ctx.beginPath();ctx.ellipse(0,0,rx,10,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=q.perk?'#ffdf6e':color;ctx.lineWidth=q.perk?4.5:3.5;
  ctx.beginPath();ctx.ellipse(0,0,rx,10,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#fff3c4';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,0,Math.max(8,rx*rem),Math.max(3,10*rem),0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
 // Rank-5 boosted projectile aura/streaks + reflected double aura
 if(q.perk||q.reflected){
  const p=project(q.x,q.y,q.depth??0),s=zoom*(p.scale??1),dir=q.vx<0?-1:1;
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
  if(q.perk){
   if(q.kind==='coin'){
    const r=q.miniCoin?19:27;
    ctx.strokeStyle='#ffe26b';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#fff6c4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-dir*54,0);ctx.lineTo(0,0);ctx.stroke();
   }else if(q.kind==='dream'){
    ctx.strokeStyle='#ffe26b';ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(dir*34,0);ctx.lineTo(-dir*22,-22);ctx.moveTo(dir*34,0);ctx.lineTo(-dir*22,22);ctx.stroke();
   }else if(q.kind==='arrow'){
    ctx.strokeStyle='#ff9a38';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.stroke();
   }
  }
  if(q.reflected){
   ctx.strokeStyle=q.perk?'#ffca42':'#ffe478';ctx.lineWidth=q.perk?4:3;
   ctx.beginPath();ctx.arc(0,0,q.perk?28:23,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
}
