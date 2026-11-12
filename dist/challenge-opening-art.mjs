import {drawFighterArt} from './art-render.mjs?v=campaign-complete-20261112-r1';
import {OPENING_PAJAMA_PARTS,OPENING_PROP_PARTS} from './challenge-opening-assets.mjs?v=campaign-complete-20261112-r1';
import {solveArm} from './art-motion.mjs?v=campaign-complete-20261112-r1';
import {openingSheet} from './challenge-opening-assets.mjs?v=campaign-complete-20261112-r1';
export {openingSheet} from './challenge-opening-assets.mjs?v=campaign-complete-20261112-r1';

const INK='#173239',PAPER='#fff3d3',RED='#b73c2d',GOLD='#f2bd53';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=(a,b,t)=>a+(b-a)*t;
/** Logical dialog dimensions: the bitmap follows its exact box, never a CSS crop. */
export function openingFrame(width,height,layout){
 const innerWidth=Math.max(1,width-8),innerHeight=Math.max(1,Math.min(height-8,layout==='portrait'?1100:720));
 if(layout==='portrait'){
  const copyHeight=Math.min(160,Math.max(144,innerHeight*.19));
  return{artWidth:innerWidth,artHeight:innerHeight-copyHeight,copyWidth:innerWidth,copyHeight,height:innerHeight};
 }
 const copyWidth=Math.min(300,Math.max(220,innerWidth*.28));
 return{artWidth:Math.max(1,innerWidth-copyWidth),artHeight:innerHeight,copyWidth,copyHeight:innerHeight,height:innerHeight};
}
/** Legacy timing metrics retained for compatibility. Raster poses below own rendering. */
export function openingPose(shot,time=0,reducedMotion=false){
 const t=reducedMotion?4000:Math.max(0,time),sit=ease((t-200)/1000),reach=ease((t-1050)/650);
 const hold=1-ease((t-2200)/550),blanketLift=Math.sin(ease((t-450)/1200)*Math.PI)*.9;
 return{time:t,torsoAngle:lerp(-1.08,-.04,sit),headAngle:lerp(.13,-.07,sit),reach:reach*hold,
  hand:{x:lerp(-46,-123,reach*hold),y:lerp(-25,-44,reach*hold)},blanketLift,
  blanketSlide:ease((t-900)/900),sit,change:ease((t-450)/950),
  chase:ease(t/2400),micAngle:reducedMotion?-.4:-.4+Math.sin(Math.min(t,2600)*.003)*.16,
  shock:shot==='wake'&&t<1700,alarm:!reducedMotion&&t<2200?Math.sin(t*.032)*.045:0};
}
export function storyWakingLayout(w,h){
 const tall=h>w;return{hipX:w*(tall?.62:.51),hipY:h*.65,scale:Math.min((w-24)/(tall?430:500),h/450)};
}
/** Each state is a separately generated complete pose, not a rotated cutout. */
export function openingPanelState(shot,time=0,reducedMotion=false){
 const t=reducedMotion?4000:Math.max(0,Number.isFinite(time)?time:0);
 let panel=0,previous=0,changedAt=0;
 if(shot==='wake'){
  if(t>=1800){panel=2;previous=1;changedAt=1800;}
  else if(t>=780){panel=1;previous=0;changedAt=780;}
 }else if(shot==='wardrobe'){panel=t<1500?3:4;previous=3;changedAt=1500;}
 else if(shot==='chase'){panel=t<580?4:5;previous=4;changedAt=580;}
 const blend=reducedMotion||panel===previous?1:clamp((t-changedAt)/180);
 // Restart a visible, contained camera approach with every complete action pose.
 const age=Math.max(0,t-changedAt);
 return{panel,previous,blend,camera:reducedMotion?0:.07*(1-ease(age/700))};
}
const contain=(rect,x,y,width,height,panel,main=false)=>{
 const scale=Math.min(width/rect[2],height/rect[3]),w=rect[2]*scale,h=rect[3]*scale;
 return{panel,main,x:x+(width-w)/2,y:y+(height-h)/2,width:w,height:h};
};
/** One complete scene at a time in every orientation. Future scenes never
 * appear as thumbnails; measured source bounds preserve faces, hands and feet. */
export function openingPanelLayout(sheet,shot,time,w,h,reducedMotion=false){
 if(!sheet||w<24||h<24)return[];
 const state=openingPanelState(shot,time,reducedMotion),pad=14;
 return[contain(sheet.panels[state.panel],pad,pad,w-pad*2,h-pad*2,state.panel,true)];
}
/** Fixed-length anatomy: hands attach at wrists instead of stretching with sleeves. */
export function openingPajamaRig(p){
 const mirrored=solveArm({x:44,y:-125},{x:-p.hand.x,y:p.hand.y},57,57);
 const nearArm=Object.fromEntries(Object.entries(mirrored).map(([key,v])=>[key,{x:-v.x,y:v.y}]));
 return{
  nearArm,
  farArm:solveArm({x:44,y:-125},{x:42+18*p.blanketLift,y:-18-50*p.blanketLift},57,57),
  blanket:{x:43*p.blanketSlide,y:-45*p.blanketLift,angle:.11*p.blanketLift}
 };
}

const crop=(ctx,img,r,x,y,w,h)=>{if(img)ctx.drawImage(img,...r,x,y,w,h);};
function cover(ctx,img,x,y,w,h,focus=.5){
 if(!img)return;const s=Math.max(w/img.width,h/img.height),sw=w/s,sh=h/s;
 ctx.drawImage(img,(img.width-sw)*focus,(img.height-sh)*.5,sw,sh,x,y,w,h);
}
function polygon(ctx,points,fill,stroke=INK,line=5){ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function text(ctx,value,x,y,size=28,color=INK,align='left'){ctx.fillStyle=color;ctx.font=`900 ${size}px "Microsoft JhengHei","Noto Sans CJK TC",system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y);ctx.textAlign='left';}
function stamp(ctx,value,x,y,size=25,color=GOLD,angle=-.04){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font=`900 ${size}px "Microsoft JhengHei","Noto Sans CJK TC",system-ui,sans-serif`;const width=ctx.measureText(value).width+24;ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.fillRect(-10,-size,width,size+15);ctx.strokeRect(-10,-size,width,size+15);text(ctx,value,2,3,size,color===RED?PAPER:INK);ctx.restore();}
function rays(ctx,x,y,r,outer,count=20,alpha=.35){ctx.save();ctx.strokeStyle=INK;ctx.globalAlpha=alpha;ctx.lineWidth=2;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*outer,y+Math.sin(a)*outer);ctx.stroke();}ctx.restore();}
function hatch(ctx,x,y,w,h,step=12){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='#17323935';ctx.lineWidth=1.4;for(let i=-h;i<w;i+=step){ctx.beginPath();ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);ctx.stroke();}ctx.restore();}
function prop(ctx,images,name,x,y,width,angle=0){
 const img=images['opening-props-v75'],r=OPENING_PROP_PARTS[name];if(!img||!r)return;
 const height=width*r[3]/r[2];ctx.save();ctx.translate(x,y);ctx.rotate(angle);crop(ctx,img,r,-width/2,-height/2,width,height);ctx.restore();
}
function mic(ctx,images,x,y,size,angle=0){prop(ctx,images,'microphone',x,y,size*.58,angle);}
function breakfast(ctx,images,x,y,size=1,angle=0){prop(ctx,images,'breakfast',x,y,size*68,angle);}
function clock(ctx,images,x,y,size,angle=0){prop(ctx,images,'clock',x,y,size*.76,angle);}

function portrait(ctx,images,type,x,y,size,shock=false,angle=0){const img=images[type+(shock?'-shock':'-head')]||images[type+'-head'];if(!img)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-size*.5,-size,size,size);ctx.restore();}
function segment(ctx,img,source,a,b,width){if(!img)return;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,img,source,-width/2,-4,width,Math.hypot(b.x-a.x,b.y-a.y)+8);ctx.restore();}
/** Independently generated pieces, never cuts through a complete person's anatomy. */
function pajamas(ctx,images,type,p){
 const img=images['opening-pajamas-v75'];if(!img)return;
 const parts=OPENING_PAJAMA_PARTS,rig=openingPajamaRig(p);
 const bone=(name,a,b,width)=>segment(ctx,img,parts[name],a,b,width);
 const hand=(name,arm,reach=false)=>{
  const r=parts[name],width=reach?38:28,height=width*r[3]/r[2];
  ctx.save();ctx.translate(arm.wrist.x,arm.wrist.y);
  // A palm-down reach keeps its anatomy rigid; relaxed hands follow the forearm.
  if(!reach)ctx.rotate(Math.atan2(arm.wrist.y-arm.elbow.y,arm.wrist.x-arm.elbow.x)-Math.PI/2);
  crop(ctx,img,r,-width/2,-5,width,height);ctx.restore();
 };
 for(const [side,label]of [[-1,'left'],[1,'right']]){
  const hip={x:side*24,y:-8},knee={x:side*43+28*p.sit,y:38},ankle={x:side*38+22*p.sit,y:103};
  bone(label+'Thigh',hip,knee,44);bone(label+'Shin',knee,ankle,36);
  const r=parts[label+'Slipper'];crop(ctx,img,r,ankle.x-24,ankle.y-7,58,58*r[3]/r[2]);
 }
 ctx.save();ctx.rotate(p.torsoAngle);
 const far=rig.farArm,near=rig.nearArm;
 bone('rightUpper',far.shoulder,far.elbow,31);bone('rightFore',far.elbow,far.wrist,30);hand('rightHand',far);
 crop(ctx,img,parts.torso,-56,-150,112,158);
 portrait(ctx,images,type,0,-140,118,p.shock,p.headAngle);
 bone('leftUpper',near.shoulder,near.elbow,36);bone('leftFore',near.elbow,near.wrist,32);hand(p.reach>.6?'leftReach':'leftHand',near,p.reach>.6);
 ctx.restore();
}

function panel(ctx,w,h,images,key,focus=.5){cover(ctx,images[key],0,0,w,h,focus);ctx.fillStyle='#f9d98718';ctx.fillRect(0,0,w,h);}
function bulletin(ctx,images,type,w,h,p){
 panel(ctx,w,h,images,'challenge-bedroom',.22);
 ctx.fillStyle='#17323966';ctx.fillRect(0,0,w,h);
 const portraitMode=h>w,tx=w*(portraitMode?.13:.38),ty=h*.12,tw=w*(portraitMode?.78:.56),th=h*(portraitMode?.57:.73);
 // A skewed, full-sized television close-up, with its own news strip.
 ctx.save();ctx.translate(tx,ty);ctx.rotate(.025);ctx.fillStyle='#9d6139';ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.fillRect(-10,-10,tw+20,th+20);ctx.strokeRect(-10,-10,tw+20,th+20);hatch(ctx,-10,-10,tw+20,th+20,16);
 ctx.fillStyle='#223e43';ctx.fillRect(6,6,tw-12,th-12);ctx.fillStyle='#e1eadb';ctx.fillRect(16,18,tw-32,th-92);rays(ctx,tw*.52,th*.37,35,tw*.5,22,.28);
 mic(ctx,images,tw*.54,th*.35,Math.min(tw*.40,th*.39),-.25);stamp(ctx,'失蹤！',tw*.09,th*.25,Math.min(36,tw*.12),RED,-.10);
 ctx.fillStyle=RED;ctx.fillRect(14,th-72,tw-28,58);text(ctx,'議場神麥失蹤',tw*.5,th-31,Math.min(31,tw*.105),PAPER,'center');
 ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(tw*.38,-10);ctx.lineTo(tw*.25,-ty*.8);ctx.moveTo(tw*.49,-10);ctx.lineTo(tw*.68,-ty*.7);ctx.stroke();ctx.restore();
 // The enlarged clock is sampled from the actual bedroom painting.
 const clockSize=Math.min(w*(portraitMode?.40:.30),h*.48),cx=w*(portraitMode?.28:.18),cy=h*(portraitMode?.83:.68);
 clock(ctx,images,cx,cy,clockSize,p.alarm-.10);
 stamp(ctx,'鈴鈴鈴！',w*.06,h*(portraitMode?.59:.29),Math.min(37,w*.075),GOLD,-.13);
 stamp(ctx,'清晨 06:00',w*.07,h*.10,Math.min(26,w*.055));
 if(portraitMode){portrait(ctx,images,type,w*.79,h*.98,w*.29,true,.12);text(ctx,'……蛤？',w*.73,h*.75,Math.min(30,w*.065),PAPER,'center');}
 else{text(ctx,'全台注意，這不是晨間促銷。',w*.5,h*.95,Math.min(26,w*.045),PAPER,'center');}
}
function wake(ctx,images,type,w,h,p){
 const tall=h>w;panel(ctx,w,h,images,images['opening-bedroom-v75']?'opening-bedroom-v75':'challenge-bedroom',.2);
 const {hipX,hipY,scale}=storyWakingLayout(w,h);
 // Raster bed, pillow and cloth move independently of the articulated figure.
 ctx.save();ctx.translate(hipX,hipY);ctx.scale(scale,scale);
 prop(ctx,images,'bed',-40,42,310);prop(ctx,images,'pillow',-125,-25,126);
 pajamas(ctx,images,type,p);
 const cloth=openingPajamaRig(p).blanket;
 prop(ctx,images,'blanket',5+cloth.x,45+cloth.y,250,cloth.angle);
 ctx.restore();
 // Clock sits within reach of the left hand, in the foreground.
 const clockSize=scale*62;clock(ctx,images,hipX-scale*127,hipY-scale*17,clockSize);
 stamp(ctx,p.sit<.55?'坐起來⋯':'啪！關掉！',w*.07,h*.12,Math.min(31,w*.065),GOLD,-.06);
 stamp(ctx,'被全台叫醒',w*.10,h*.89,Math.min(30,w*.062),RED,.025);
}
function fighter(ctx,images,type,x,y,scale,time=0,move=0){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);drawFighterArt(ctx,images,{type,face:1,y:430,supportY:430,move,attack:null,performance:null,crouchBlend:0},time,{shadow:false});ctx.restore();}
function wardrobe(ctx,images,type,w,h,p){
 const tall=h>w;panel(ctx,w,h,images,images['opening-bedroom-v75']?'opening-bedroom-v75':'challenge-bedroom',.80);ctx.fillStyle='#ffefd34a';ctx.fillRect(0,0,w,h);
 const foot=h*.91,scale=Math.min(h*.77/280,w/(tall?210:420)),x=w*(tall?.51:.64);
 // The hanging jacket on the actual wall becomes the wardrobe wipe.
 ctx.save();ctx.beginPath();ctx.rect(0,0,w*(1-p.change),h);ctx.clip();ctx.translate(x,foot);ctx.scale(scale*.73,scale*.73);ctx.translate(0,-123);pajamas(ctx,images,type,{...p,torsoAngle:0,headAngle:0,sit:1,reach:0,blanketLift:0,hand:{x:-48,y:-58},shock:false});ctx.restore();
 ctx.save();ctx.beginPath();ctx.rect(w*(1-p.change),0,w,h);ctx.clip();fighter(ctx,images,type,x,foot,scale,0,0);ctx.restore();
 if(p.change<1){const seam=w*(1-p.change);polygon(ctx,[[seam-15,0],[seam+31,0],[seam+8,h*.33],[seam+36,h*.45],[seam-14,h],[seam-32,h]],GOLD,INK,4);}
 // A single breakfast prop enters beside the wardrobe action, no future panel.
 breakfast(ctx,images,x+scale*52,foot-scale*100,scale*.62,-.10);
 stamp(ctx,'咻！換裝！',w*.07,h*.12,Math.min(33,w*.065),RED,-.04);
 stamp(ctx,'早餐，拿了！',w*.08,h*.91,Math.min(27,w*.055),GOLD,.03);
}
function chase(ctx,images,type,w,h,p,reduced){
 const tall=h>w;panel(ctx,w,h,images,'challenge-street',.62);
 ctx.fillStyle='#fff2ce26';ctx.fillRect(0,0,w,h);
 const scale=Math.min(h*.68/280,w/(tall?200:450)),foot=h*.94;
 // The hero runs in place within a composed frame; no face or foot exits the panel.
 const x=w*(tall?.35:.34)+p.chase*w*.06;
 fighter(ctx,images,type,x,foot,scale,reduced?800:Math.min(p.time,2600),reduced?0:1);
 breakfast(ctx,images,x+scale*46,foot-scale*112,scale*.44,-.13);
 const mx=w*(tall?.64:.67)+p.chase*w*.12,my=h*(tall?.44:.50)-p.chase*h*.16,ms=Math.min(w*.23,h*.28);
 rays(ctx,mx,my,ms*.5,ms*.95,12,.28);mic(ctx,images,mx,my,ms,p.micAngle);
 ctx.save();ctx.strokeStyle=PAPER;ctx.lineWidth=6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(mx-ms*.35,my+ms*1.04+i*12);ctx.quadraticCurveTo(mx-ms*.72,my+ms*1.12+i*12,mx-ms*.87,my+ms*1.42+i*12);ctx.stroke();}ctx.restore();
 stamp(ctx,'神麥，別跑！',w*.06,h*.12,Math.min(33,w*.067),RED,-.05);
 stamp(ctx,'追啊！',w*.64,h*.78,Math.min(36,w*.075),GOLD,.07);
}

/** Restore the original four-shot animation with isolated raster anatomy and props. */
export function paintOpeningComic(ctx,images,beat,type,w,h,time=0,{reducedMotion=false}={}){
 if(!images['opening-pajamas-v75']||!images['opening-props-v75']||!images[type+'-head']){
  ctx.clearRect(0,0,w,h);ctx.fillStyle=PAPER;ctx.fillRect(0,0,w,h);ctx.fillStyle=INK;ctx.font='700 22px sans-serif';ctx.textAlign='center';ctx.fillText('漫畫素材載入中',w/2,h/2);ctx.textAlign='left';
  return{ready:false,scenes:0,character:type};
 }
 const p=openingPose(beat.shot,time,reducedMotion);ctx.clearRect(0,0,w,h);ctx.fillStyle=PAPER;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(9,9,w-18,h-18);ctx.clip();
 if(beat.shot==='bulletin')bulletin(ctx,images,type,w,h,p);
 else if(beat.shot==='wake')wake(ctx,images,type,w,h,p);
 else if(beat.shot==='wardrobe')wardrobe(ctx,images,type,w,h,p);
 else chase(ctx,images,type,w,h,p,reducedMotion);
 ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.strokeRect(9,9,w-18,h-18);
 return{...p,mode:'articulated',ready:true,scenes:1,character:type};
}
