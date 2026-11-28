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
  queue.push({depth:0,started:time,duration:340,...spec});
 };
 if(event.type==='hit'||event.type==='block'){
  const to=event.to;if(!to)return;
  const heavy=event.type==='hit'&&((event.amount??0)>=14||to.hp<=0||(event.combo??0)>1||['arrow','han_knee','su_shout','su_dare','huang_shout','ma_handshake','rally'].includes(event.impact));
  add({kind:event.type,x:to.x,y:impactY(event),depth:to.depth??0,heavy,duration:heavy?400:260,face:event.from?.face||1});
 }else if(event.type==='counter'&&event.f){
  add({kind:'counter',x:event.f.x,y:(event.f.y??GROUND)-138,depth:event.f.depth??0,duration:520,perk:!!event.f.perk?.active});
 }else if(event.type==='guardBreak'&&event.f){
  add({kind:'guardBreak',x:event.f.x,y:(event.f.y??GROUND)-138,depth:event.f.depth??0,duration:480});
 }else if(event.type==='reflect'&&event.f){
  add({kind:'reflect',x:event.f.x+(event.f.face||1)*34,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:480,perk:!!event.f.perk?.active});
 }else if(event.type==='reject'&&event.f){
  add({kind:'reject',x:event.f.x+(event.f.face||1)*32,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:420});
 }else if(event.type==='armorAbsorb'&&event.f){
  add({kind:'armorAbsorb',x:event.f.x,y:(event.f.y??GROUND)-135,depth:event.f.depth??0,duration:460});
 }else if(event.type==='calm'&&event.f){
  add({kind:'calm',x:event.f.x,y:(event.f.y??GROUND)-135,depth:event.f.depth??0,duration:500,perk:!!event.f.perk?.active});
 }else if(event.type==='heal'&&event.f){
  add({kind:'heal',x:event.f.x,y:(event.f.y??GROUND)-150,depth:event.f.depth??0,duration:540,perk:!!event.f.perk?.active});
 }else if(event.type==='queueBreak'){
  add({kind:'queueBreak',x:event.x??480,y:GROUND-36,depth:event.depth??0,duration:420});
 }else if(event.type==='perkTrigger'&&event.f){
  add({kind:'perkTrigger',x:event.f.x,y:(event.f.y??GROUND)-145,depth:event.f.depth??0,duration:680,perkKind:event.kind||''});
 }else if(event.type==='perkImpact'){
  add({kind:'perkImpact',x:event.x??480,y:event.y??GROUND,depth:event.depth??0,duration:event.kind==='arrow'?720:680,perkKind:event.kind||'arrow'});
 }
 while(queue.length>48)queue.shift();
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
   ctx.beginPath();ctx.arc(0,0,28+u*32,-1.15,1.15);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;
   for(let i=0;i<5;i++){const a=-.9+i*.45;ctx.beginPath();ctx.moveTo(Math.cos(a)*26,Math.sin(a)*26);ctx.lineTo(Math.cos(a)*(42+u*28),Math.sin(a)*(42+u*28));ctx.stroke();}
  }else if(fx.kind==='hit'){
   const rays=fx.heavy?12:8,reach=(fx.heavy?88:58)*(0.6+u*0.7);
   ctx.strokeStyle=fx.heavy?'#ffae3d':'#ffdc65';ctx.lineWidth=(fx.heavy?6.5:4.5)*(1-u*.35);
   for(let i=0;i<rays;i++){const a=i*(Math.PI*2/rays)+u*.12;ctx.beginPath();ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a)*reach,Math.sin(a)*reach);ctx.stroke();}
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,(fx.heavy?26:18)+u*(fx.heavy?44:24),0,Math.PI*2);ctx.stroke();
   if(fx.heavy){ctx.strokeStyle='#ffe78f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,12+u*72,0,Math.PI*2);ctx.stroke();}
  }else if(fx.kind==='counter'){
   const boost=fx.perk?1.32:1;
   ctx.strokeStyle='#ffae38';ctx.lineWidth=(fx.perk?7.5:6)*(1-u*.3);ctx.beginPath();ctx.arc(0,0,(36+u*74)*boost,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#fff7d2';ctx.lineWidth=fx.perk?4.5:3.5;ctx.beginPath();ctx.arc(0,0,(22+u*50)*boost,0,Math.PI*2);ctx.stroke();
   if(fx.perk){ctx.fillStyle='#ffe87a';for(let i=0;i<6;i++){const a=i*(Math.PI/3)+u*1.2,d=(34+u*64)*boost;star4(ctx,Math.cos(a)*d,Math.sin(a)*d,9*(1-u*.4));ctx.fill();}}
  }else if(fx.kind==='guardBreak'){
   ctx.strokeStyle='#ff6b4a';ctx.lineWidth=6;
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18);ctx.lineTo(Math.cos(a)*(38+u*72),Math.sin(a)*(38+u*72));ctx.stroke();}
   ctx.strokeStyle='#ffe4a0';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,24+u*58,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='reflect'){
   const boost=fx.perk?1.25:1;
   ctx.strokeStyle='#ffe478';ctx.lineWidth=(fx.perk?7:6)*(1-u*.3);ctx.beginPath();ctx.arc(0,0,(26+u*64)*boost,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,(16+u*44)*boost,-1.1,1.1);ctx.stroke();
  }else if(fx.kind==='reject'){
   ctx.strokeStyle='#d4a6ff';ctx.lineWidth=5.5;ctx.beginPath();ctx.arc(0,0,24+u*54,-1.3,1.3);ctx.stroke();
  }else if(fx.kind==='armorAbsorb'){
   ctx.strokeStyle='#67e5f2';ctx.lineWidth=6.5;ctx.beginPath();ctx.arc(0,0,28+u*62,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe58f';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,20+u*40,0,Math.PI*2);ctx.stroke();
  }else if(fx.kind==='calm'){
   const boost=fx.perk?1.35:1;
   ctx.strokeStyle='#7ed9a4';ctx.lineWidth=fx.perk?6:4.5;ctx.beginPath();ctx.arc(0,0,(26+u*64)*boost,0,Math.PI*2);ctx.stroke();
   if(fx.perk){ctx.strokeStyle='#ffe47a';ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,0,40+u*82,0,Math.PI*2);ctx.stroke();}
  }else if(fx.kind==='heal'){
   ctx.strokeStyle='#9cf5b8';ctx.lineWidth=4.5;ctx.beginPath();ctx.arc(0,0,28+u*66,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe584';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,18+u*46,0,Math.PI*2);ctx.stroke();
   if(fx.perk){ctx.fillStyle='#ffe97d';for(let i=0;i<5;i++){star4(ctx,(i-2)*22,-20-u*(48+i*8),6*(1-u*.4));ctx.fill();}}
  }else if(fx.kind==='queueBreak'){
   ctx.strokeStyle='#e07856';ctx.lineWidth=5;
   for(let i=0;i<6;i++){const a=-Math.PI+i*(Math.PI/5);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*(26+u*48),Math.sin(a)*(26+u*48));ctx.stroke();}
  }else if(fx.kind==='perkTrigger'){
   ctx.strokeStyle='#ffe05c';ctx.lineWidth=7.5*(1-u*.3);ctx.beginPath();ctx.arc(0,0,34+u*104,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#fff9cf';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,22+u*68,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<12;i++){const a=i*(Math.PI/6)+u*.45;ctx.beginPath();ctx.moveTo(Math.cos(a)*28,Math.sin(a)*28);ctx.lineTo(Math.cos(a)*(52+u*76),Math.sin(a)*(52+u*76));ctx.stroke();}
   ctx.fillStyle='#ffe87a';
   for(let i=0;i<6;i++){const a=i*Math.PI/3+u*1.8,dist=38+u*66;star4(ctx,Math.cos(a)*dist,Math.sin(a)*dist,12*(1-u*.35));ctx.fill();}
  }else if(fx.kind==='perkImpact'){
   const arrow=fx.perkKind==='arrow';
   ctx.fillStyle=arrow?'#ff9e3b2e':'#5ee1ed2a';
   ctx.beginPath();ctx.ellipse(0,0,40+u*(arrow?96:84),12+u*18,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=arrow?'#ff6b35':'#3fc7d4';ctx.lineWidth=6.5*(1-u*.3);
   ctx.beginPath();ctx.ellipse(0,0,34+u*(arrow?92:82),10+u*16,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#ffe578';ctx.lineWidth=4;
   ctx.beginPath();ctx.ellipse(0,0,22+u*(arrow?66:58),7+u*11,0,0,Math.PI*2);ctx.stroke();
   if(arrow){
    const bw=Math.max(4,28*(1-u));
    ctx.fillStyle='#ffe88a66';ctx.fillRect(-bw,-280,bw*2,280);
    ctx.strokeStyle='#ff8a38';ctx.lineWidth=4.5;
    for(let i=0;i<7;i++){const a=-Math.PI+.35+i*((Math.PI-.7)/6);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(Math.cos(a)*(38+u*74),Math.sin(a)*(38+u*74)-8);ctx.stroke();}
   }else{
    ctx.strokeStyle='#7ee8f2';ctx.lineWidth=4;
    for(let i=0;i<6;i++){const a=i*(Math.PI/3)+u*.25;ctx.beginPath();ctx.moveTo(Math.cos(a)*16,Math.sin(a)*4);ctx.lineTo(Math.cos(a)*(42+u*64),Math.sin(a)*(12+u*16));ctx.stroke();}
   }
   ctx.fillStyle='#fff4ab';
   for(let i=0;i<4;i++){const dx=(i-1.5)*28,dy=-16-u*(58+(i%2)*22);star4(ctx,dx,dy,9*(1-u*.35));ctx.fill();}
  }
  ctx.restore();
 }
}

export function drawWorldFighterAuras(ctx,f,project,zoom=1,time=nowMs()){
 if(!f||f.hp<=0||f.mobKind)return;
 const groundY=f.supportY??GROUND,foot=project(f.x,groundY,f.depth??0),actorPos=project(f.x,f.y??GROUND,f.depth??0);
 const s=zoom*(foot.scale??1),t=time*.001;
 // Rank-5 signature soft floor spotlight + rotating emblem + attack-time rising embers
 if(f.perk?.active){
  const attackBoost=f.attack?1.24:1,pulse=.5+.5*Math.sin(t*6);
  ctx.save();
  ctx.translate(foot.x,foot.y);
  ctx.scale(s,s);
  ctx.fillStyle=f.attack?'#ffd9593a':'#ffd9591e';
  ctx.beginPath();ctx.ellipse(0,2,(50+pulse*4)*attackBoost,10.5*attackBoost,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=f.attack?'#ffe872bb':'#ffe16666';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,2,(48+pulse*3)*attackBoost,9.5*attackBoost,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=f.attack?'#fff4ba34':'#fff4ba18';
  ctx.beginPath();ctx.ellipse(0,2,30*attackBoost,6*attackBoost,0,0,Math.PI*2);ctx.fill();
  const spin=(t*2.4)%(Math.PI*2);
  ctx.fillStyle=f.attack?'#fff08c':'#ffe470aa';
  for(let i=0;i<4;i++){
   const angle=spin+i*Math.PI/2,px=Math.cos(angle)*46*attackBoost,py=2+Math.sin(angle)*8*attackBoost;
   star4(ctx,px,py,f.attack?6:4.5);ctx.fill();
  }
  if(f.attack){
   for(let i=0;i<4;i++){
    const phase=(t*1.6+i*.25)%1,angle=spin*1.4+i*Math.PI/2,px=Math.cos(angle)*42*attackBoost,py=-12-phase*102;
    ctx.globalAlpha=(1-phase)*.95;
    star4(ctx,px,py,6.5);ctx.fill();
   }
  }
  ctx.restore();
 }
 // Multi-hit Rank-5 Ko / standard comic front guard arc
 if(f.armor>0){
  const face=f.face||1,pulse=.5+.5*Math.sin(t*10);
  ctx.save();
  ctx.translate(actorPos.x,actorPos.y);
  ctx.scale(s,s);
  ctx.lineCap='round';
  ctx.strokeStyle='#67e5f2';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(face*10,-135,66+pulse*4,face>0?-.72:Math.PI-.72,face>0?.72:Math.PI+.72);ctx.stroke();
  if((f.armorCount??1)>=2){
   ctx.strokeStyle='#ffe169';ctx.lineWidth=4.5;
   ctx.beginPath();ctx.arc(face*18,-135,77+pulse*5,face>0?-.62:Math.PI-.62,face>0?.62:Math.PI+.62);ctx.stroke();
   ctx.fillStyle='#142b32f0';ctx.fillRect(22,-268,68,26);
   ctx.strokeStyle='#ffe169';ctx.lineWidth=2.5;ctx.strokeRect(22,-268,68,26);
   ctx.fillStyle='#ffe57f';ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`霸體 ×${f.armorCount}`,56,-255);
  }
  ctx.restore();
 }
 // Ko Rank-5 brace empowered fist indicator
 if(f.brace>0){
  const face=f.face||1,pulse=.5+.5*Math.sin(t*14);
  ctx.save();ctx.translate(actorPos.x+face*26*s,actorPos.y-130*s);ctx.scale(s,s);
  ctx.strokeStyle='#ffe169';ctx.lineWidth=4.5;ctx.beginPath();ctx.arc(0,0,26+pulse*7,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ffe97d55';ctx.fill();
  ctx.fillStyle='#fff7b2';
  for(let i=0;i<3;i++){const a=t*6+i*(Math.PI*2/3);star4(ctx,Math.cos(a)*28,Math.sin(a)*28,6);ctx.fill();}
  ctx.restore();
 }
 // Ma Rank-5 dizzyStar orbiting stars
 if(f.dizzyStar>0){
  ctx.save();ctx.translate(actorPos.x,actorPos.y-294*s);ctx.scale(s,s);
  ctx.strokeStyle='#ffe88099';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,38,10,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ffe45e';ctx.strokeStyle='#17353a';ctx.lineWidth=2.5;
  for(let i=0;i<3;i++){
   const a=t*5.4+i*(Math.PI*2/3),ox=Math.cos(a)*38,oy=Math.sin(a)*10;
   star4(ctx,ox,oy,13);ctx.fill();ctx.stroke();
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
  const pulse=q.perk?1+.08*Math.sin(time*.018):1;
  ctx.save();ctx.translate(m.x,m.y);ctx.scale(ms,ms);
  ctx.fillStyle=q.perk?'#ffdf6e33':color+'26';ctx.beginPath();ctx.ellipse(0,0,rx*pulse,11*pulse,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=q.perk?'#ffdf6e':color;ctx.lineWidth=q.perk?5:3.5;
  ctx.beginPath();ctx.ellipse(0,0,rx*pulse,11*pulse,0,0,Math.PI*2);ctx.stroke();
  if(q.perk){
   ctx.strokeStyle=color;ctx.lineWidth=2.5;
   ctx.beginPath();ctx.moveTo(-rx*.75,0);ctx.lineTo(rx*.75,0);ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();
  }
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
    const r=q.miniCoin?21:31;
    ctx.strokeStyle='#ffe26b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#fff6c4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-dir*72,0);ctx.lineTo(0,0);ctx.stroke();
    ctx.fillStyle='#fff6b8';star4(ctx,-dir*(r+12),Math.sin(time*.02)*6,7);ctx.fill();
   }else if(q.kind==='dream'){
    ctx.strokeStyle='#ffe26b';ctx.lineWidth=4.5;
    ctx.beginPath();ctx.moveTo(dir*40,0);ctx.lineTo(-dir*26,-26);ctx.moveTo(dir*40,0);ctx.lineTo(-dir*26,26);ctx.stroke();
    ctx.strokeStyle='#a8ffcb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-dir*86,0);ctx.lineTo(dir*18,0);ctx.stroke();
    ctx.fillStyle='#ffe87d';star4(ctx,-dir*34,0,8);ctx.fill();
   }else if(q.kind==='arrow'){
    ctx.strokeStyle='#ff9a38';ctx.lineWidth=4.5;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ffe478';star4(ctx,0,0,10);ctx.fill();
   }
  }
  if(q.reflected){
   ctx.strokeStyle=q.perk?'#ffca42':'#ffe478';ctx.lineWidth=q.perk?4.5:3;
   ctx.beginPath();ctx.arc(0,0,q.perk?32:23,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
}

export function drawWorldObstacleExtra(ctx,q,project,zoom=1,time=nowMs()){
 if(!q||q.dead||!q.perk)return;
 const p=project(q.x,q.y??GROUND,q.depth??0),s=zoom*(p.scale??1),pulse=.5+.5*Math.sin(time*.008);
 ctx.save();
 ctx.translate(p.x,p.y);
 ctx.scale(s,s);
 ctx.fillStyle='#ffd95930';ctx.beginPath();ctx.ellipse(0,2,50+pulse*4,12,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#ffe05c';ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(0,2,46+pulse*4,10,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#ffe26b';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(-36,-10);ctx.lineTo(-46,-36);ctx.lineTo(-36,-64);ctx.moveTo(36,-10);ctx.lineTo(46,-36);ctx.lineTo(36,-64);ctx.stroke();
 ctx.fillStyle='#142b32ea';ctx.fillRect(-52,-104,104,22);
 ctx.strokeStyle='#ffe05c';ctx.lineWidth=2;ctx.strokeRect(-52,-104,104,22);
 ctx.fillStyle='#ffe87a';ctx.font='900 12px "Microsoft JhengHei", system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText(`★ 黃金拒馬 ×${q.hitsLeft??1}`,0,-93);
 ctx.restore();
}
