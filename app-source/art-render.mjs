import {OPENING_ART_FILES} from './challenge-opening-assets.mjs?v=chapter-presentation-20261117-r1';
import {kneePresentation,drawKneeArt} from './art-signature.mjs?v=chapter-presentation-20261117-r1';
import {expressionFor} from './art-expression.mjs?v=chapter-presentation-20261117-r1';
import {hasRosterArt,drawRosterArt} from './art-roster.mjs?v=chapter-presentation-20261117-r1';
import {fighterPose,solveArm,ease,clamp} from './art-motion.mjs?v=chapter-presentation-20261117-r1';
import {HEAD_SEAT,drawCollarFront} from './art-collar.mjs?v=chapter-presentation-20261117-r1';
export const ART_FILES={
 'chapter-encounter-props':'challenge/encounter-props-v2.png',
 ...OPENING_ART_FILES,
 'handshake-grip':'handshake-v13.png','left-hand-back':'left-hand-back-v36.png','right-hand-point':'right-hand-point-v37.png',
 'han-lotus-body':'han-lotus-body-v11.webp','ma-cough':'ma-cough-v10.webp','ma-gaze':'ma-gaze-v10.webp','signature-hands':'signature-hands-v10.webp','signature-props':'signature-props-v10.webp',
 'ma-run':'ma-run-v9.webp','ma-counter':'ma-counter-v9.webp','han-aim':'han-aim-v9.webp','han-shout':'han-shout-v9.webp',
 'su-shout':'su-shout-v9.webp','su-slam':'su-slam-v9.webp','huang-shout':'huang-shout-v9.webp','huang-press':'huang-press-v9.webp',
 'chen-wave':'chen-wave-v9.webp','chen-step':'chen-step-v9.webp','ko-sweep':'ko-sweep-v9.webp','ko-counter':'ko-counter-v9.webp','move-accents':'move-accents-v9.webp',
 'chen-head':'chen-head-v8.webp','ko-head':'ko-head-v6.webp','final-costumes':'final-costumes-v6.webp','ko-bags':'ko-bags-v6.webp',
 'ma-head':'ma-head-v5.webp','su-head':'su-head-v8.webp','huang-head':'huang-head-v5.webp','roster-costumes':'roster-costumes-v5.webp','roster-props':'roster-props-v5.webp',
 'art-limbs':'limbs-v4.webp','wang-parts':'wang-parts-v3.webp','han-parts':'han-parts-v3.webp','left-arms':'left-arms-v3.webp',
 'wang-drink':'wang-drink-v3.webp','wang-sip':'wang-sip-v3.webp','wang-roll':'wang-roll-v3.webp',
 'han-archery':'han-archery-v3.webp','han-release':'han-release-v3.webp','art-props':'props-v3.webp',
 'wang-head':'wang-laugh-head.webp','wang-shock':'wang-shock-head.webp','han-head':'han-defiant-head.webp','han-shock':'han-shock-head.webp'
};
export const PROP_FRAMES={glasses:[28,112,720,335],coin:[923,18,472,487],arrow:[33,708,720,145],water:[801,539,704,454]};
const crops={body:[108,12,351,483],upper:[640,12,259,485],fist:[1118,0,270,505],frontLeg:[188,520,203,500],backLeg:[668,520,201,500]};
function crop(ctx,img,r,x,y,w,h){ctx.drawImage(img,...r,x,y,w,h)}
function upper(ctx,img,a,b,width=29){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,img,crops.upper,-width/2,-8,width,Math.hypot(b.x-a.x,b.y-a.y)+15);ctx.restore()}
function joined(ctx,img,rect,a,b,sourceA,sourceB){
 const scale=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(sourceB.x-sourceA.x,sourceB.y-sourceA.y);
 ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(sourceB.y-sourceA.y,sourceB.x-sourceA.x));ctx.scale(scale,scale);
 crop(ctx,img,rect,rect[0]-sourceA.x,rect[1]-sourceA.y,rect[2],rect[3]);ctx.restore();
}
// Rear temples are drawn under the head; only the lens frame and the near
// temple survive in front. This uses the original texture, never an extra pair.
function drawGlassesLayer(ctx,images,p,front){
 if(!images['art-props'])return;
 ctx.save();ctx.translate(0,-163.8+HEAD_SEAT.wang+p.bob);ctx.rotate(p.headAngle);ctx.translate(7,-64);
 ctx.scale(87/720,40/335);ctx.translate(-388,-279.5);
 ctx.save();ctx.beginPath();
 const outline=front?[[242,238],[540,217],[731,174],[744,184],[742,311],[719,368],[679,389],[607,392],[563,375],[541,285],[521,287],[505,364],[474,405],[420,434],[350,442],[295,430],[263,401],[246,350]]:[[0,0],[770,0],[770,235],[540,235],[530,220],[250,238],[0,340]];
 outline.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();ctx.clip();
 crop(ctx,images['art-props'],PROP_FRAMES.glasses,28,112,720,335);ctx.restore();
 if(front){
  // The visible temple goes from the outer hinge to the nearer ear, not around
  // the outside of the hair. The far loop is hidden by the portrait above.
  ctx.strokeStyle='#17191c';ctx.lineWidth=30;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(255,255);ctx.lineTo(149,303);ctx.stroke();
  ctx.strokeStyle='#8d9291';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(250,247);ctx.lineTo(150,293);ctx.stroke();
 }
 ctx.restore();
}
function head(ctx,images,type,p,rolling=false){
 const texture=images[type==='han'&&p.kind==='han_knee'?'han-shout':type==='han'&&p.kind?expressionFor(type,p):type+'-'+(p.head==='sip'&&type!=='wang'?'head':p.head)]||images[type+'-head'];
 if(type==='wang'&&p.kind==='counter')drawGlassesLayer(ctx,images,p,false);
 ctx.save();ctx.translate(rolling?-13:0,rolling?-131:-163.8+(p.kind==='arrow'?0:HEAD_SEAT[type])+p.bob);ctx.rotate(p.headAngle);
 const w=type==='wang'?116.4:109;ctx.drawImage(texture,-w/2,-114,w,120);ctx.restore();
}
export function drawProp(ctx,images,name,x,y,w,h,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);crop(ctx,images['art-props'],PROP_FRAMES[name],-w/2,-h/2,w,h);ctx.restore()}
// The scene and thrown-item collision sample the same current pose, including
// the folded-knee wrist transition, without needing a canvas or a previous frame.
export function fighterArtPose(f,time=0,spit=0,impact=null){
 const knee=f.attack?.kind==='han_knee'?kneePresentation(f.attack.age):null;
 const p=fighterPose(knee?{...f,crouchBlend:knee.crouch}:f,time,spit,impact);
 if(knee&&knee.blend===0){
  // Carry both wrists toward the lotus cutout before the fast leg-pose change.
  // Coordinates are the generated body's measured wrist positions in game space.
  const move=(from,to)=>({x:from.x+(to.x-from.x)*knee.transition,y:from.y+(to.y-from.y)*knee.transition});
  p.arm=solveArm(p.arm.shoulder,move(p.arm.wrist,{x:-12*122/140-p.bodyX,y:-85*122/140-p.bodyY}),57-14*knee.transition,57-34*knee.transition);
  p.farArm=solveArm(p.farArm.shoulder,move(p.farArm.wrist,{x:48*122/140-p.bodyX,y:-72*122/140-p.bodyY}),42-4*knee.transition,42-19*knee.transition);
  p.farHand='palm';
 }
 return p;
}
export function drawFighterArt(ctx,images,f,time=0,{spit=0,impact=null,shadow=true}={}){
 const knee=f.attack?.kind==='han_knee'?kneePresentation(f.attack.age):null;
 const p=fighterArtPose(f,time,spit,impact),atlas=images[f.type+'-parts'];
 ctx.save();
 if(shadow){ctx.fillStyle='#142b3230';ctx.beginPath();ctx.ellipse(0,1+Math.max(0,430-f.y),44,7,0,0,Math.PI*2);ctx.fill();}
 if(hasRosterArt(f.type)){drawRosterArt(ctx,images,f,p);ctx.restore();return p;}
 if(knee&&knee.blend>=.999){
  drawKneeArt(ctx,images,p.age);
  if(p.age>.15&&p.age<.60){
   const dustU=(p.age-.15)/.45;ctx.save();ctx.globalAlpha*=Math.sin(dustU*Math.PI)*.65;ctx.fillStyle='#fff4d6';
   for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-28-i*16-dustU*18,-6-i*3,14+i*3,6,0,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  if(p.age>=.58&&p.age<1.05){
   const shoutU=(p.age-.58)/.47;ctx.save();ctx.globalAlpha*=Math.sin(shoutU*Math.PI)*.9;
   for(let i=0;i<3;i++){ctx.strokeStyle=i%2?'#ffd56b':'#e65a3c';ctx.lineWidth=5.5-i*.9;ctx.beginPath();ctx.arc(28,-168,26+shoutU*115+i*22,-.58,.58);ctx.stroke();}
   ctx.restore();
  }
  ctx.restore();return p;
 }
 if(knee){ctx.save();ctx.globalAlpha*=1-knee.blend;}
 if(p.roll>.6){
  ctx.save();ctx.strokeStyle='#f5ae4299';ctx.lineWidth=3.5;ctx.lineCap='round';
  for(let i=0;i<3;i++){const yy=-150+i*32;ctx.beginPath();ctx.moveTo(-64-i*12,yy);ctx.lineTo(-118-i*14,yy);ctx.stroke();}
  ctx.restore();
  ctx.translate(0,-115);ctx.rotate(p.rollAngle);ctx.translate(0,115);
  ctx.drawImage(images['wang-roll'],-65,-148,140,140);head(ctx,images,f.type,p,true);
  drawCollarFront(ctx,images['wang-roll'],[0,0,1254,1254],[-65,-148,140,140],'roll');
  ctx.strokeStyle='#ffd66e';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-78,66,0,1.6);ctx.stroke();
  ctx.strokeStyle='#ff9a3d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-78,66,3.1,4.7);ctx.stroke();
  ctx.restore();return p;
 }
 if(p.roll>0){ctx.translate(0,13*p.roll);ctx.rotate(.12*p.roll);}
 const row=f.type==='wang'?0:512,limbs=images['art-limbs'];
 const segment=(r,a,b,width,cap=6)=>{ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);crop(ctx,limbs,r,-width/2,-cap,width,Math.hypot(b.x-a.x,b.y-a.y)+cap*2);ctx.restore();};
 const leg=(l,near)=>{segment([188,row+12,248,485],l.hip,l.knee,29,7);segment([669,row+16,177,426],l.knee,l.ankle,24,6);ctx.save();ctx.translate(l.ankle.x,l.ankle.y);ctx.rotate(near?-p.kick*.15:0);crop(ctx,limbs,[680,row+410,224,94],-11,-3,34,14.3);ctx.restore();};
 leg(p.legs.far,false);leg(p.legs.near,true);
 ctx.translate(p.bodyX,p.bodyY);
 if(p.kind==='arrow'){
  // The two hands, drawn bow/string and jacket share one anatomically connected action cutout.
  const recoil=p.age>.24?Math.sin(clamp((p.age-.24)/.31)*Math.PI)*2:0;
  const actionBody=images[p.age>.24?'han-release':'han-archery'];
  ctx.drawImage(actionBody,-88-recoil,-225,261,174);head(ctx,images,f.type,p);
  drawCollarFront(ctx,actionBody,[0,0,1536,1024],[-88-recoil,-225,261,174],'arrow');
  if(p.age<=.24){const chg=clamp(p.age/.24);ctx.save();ctx.globalAlpha*=.35+.4*chg;ctx.strokeStyle='#ffe282';ctx.lineWidth=3;ctx.beginPath();ctx.arc(82,-182,14+chg*12,0,Math.PI*2);ctx.stroke();ctx.restore();}
  else if(p.age<.52){const rel=(p.age-.24)/.28;ctx.save();ctx.globalAlpha*=Math.sin(rel*Math.PI)*.9;ctx.strokeStyle='#ffd66b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(92,-188,18+rel*44,-.75,.35);ctx.stroke();ctx.restore();}
 }else{
  const {shoulder:farS,elbow:farE,wrist:farW}=p.farArm;
  const kneeForearm=(a,far)=>{
   // Perspective shortening must not shrink the hand into a tiny fist.
   upper(ctx,atlas,a.elbow,a.wrist,far?17:21);
   ctx.save();ctx.translate(a.wrist.x,a.wrist.y);ctx.rotate(Math.atan2(a.wrist.y-a.elbow.y,a.wrist.x-a.elbow.x)-Math.PI/2);
   const s=far?.105:.189-.059*knee.transition;ctx.scale(s,s);
   if(far)crop(ctx,atlas,[1172,675,220,300],1172-1257,675-710,220,300);
   else crop(ctx,atlas,[1167,291,210,205],1167-1257,291-328,210,205);
   ctx.restore();
  };
  upper(ctx,atlas,farS,farE,23);
  const offset=f.type==='wang'?0:704;
  if(knee)kneeForearm(p.farArm,true);
  else if(p.farHand==='fist')joined(ctx,limbs,[1120,row,240,505],farE,farW,{x:1218,y:row+28},{x:1220,y:row+320});
  else{
   // Preserve the slim original sleeve, but size the palm independently so it
   // does not become half-sized merely because the atlas arm is much longer.
   joined(ctx,images['left-arms'],[offset+280,18,282,632],farE,farW,{x:offset+410,y:60},{x:offset+405,y:674});
   ctx.save();ctx.translate(farW.x,farW.y);ctx.rotate(Math.atan2(farW.y-farE.y,farW.x-farE.x)-Math.PI/2);ctx.scale(.104,.104);
   crop(ctx,images['left-arms'],[offset+309,649,245,363],-96,-25,245,363);ctx.restore();
  }
  crop(ctx,atlas,crops.body,-42,-169,84,113);
  head(ctx,images,f.type,p);
  drawCollarFront(ctx,atlas,crops.body,[-42,-169,84,113],f.type);
  upper(ctx,atlas,p.arm.shoulder,p.arm.elbow,29);
  if(knee)kneeForearm(p.arm,false);
  else if(p.kind==='heal'||spit>0)joined(ctx,images['wang-drink'],[0,0,1536,1024],p.arm.elbow,p.arm.wrist,{x:350,y:906},{x:884,y:470});
  else{
   const ax=f.type==='wang'?1230:1257;
   joined(ctx,atlas,p.capture?[1118,0,270,f.type==='wang'?316:326]:crops.fist,p.arm.elbow,p.arm.wrist,{x:ax,y:26},{x:ax,y:328});
  }
 }
 if(p.kind==='punch'&&p.age>.04&&p.age<.30){
  const u=(p.age-.04)/.26,alpha=Math.sin(u*Math.PI)*.85;ctx.save();ctx.globalAlpha*=alpha;
  if(p.flyingKick>0||p.variant==='kick'){
   ctx.strokeStyle='#ffe28a';ctx.lineWidth=7;ctx.beginPath();ctx.arc(24,-62,72+u*18,-.35,.55);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(24,-62,78+u*18,-.25,.45);ctx.stroke();
  }else{
   ctx.strokeStyle='#ffe696';ctx.lineWidth=6;ctx.beginPath();ctx.arc(26,-136,60+u*18,-.55,.45);ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(26,-136,66+u*18,-.45,.35);ctx.stroke();
  }
  ctx.restore();
 }
 if(p.kind==='counter'){
  drawGlassesLayer(ctx,images,p,true);
  if(p.age>.08&&p.age<.58){
   const gu=clamp((p.age-.08)/.28);ctx.save();ctx.globalAlpha*=Math.sin(gu*Math.PI)*.9;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(4,-236);ctx.lineTo(24,-218);ctx.stroke();ctx.restore();
  }
  if(p.outcome==='counter'&&(p.outcomeAge||0)<.26){
   const kU=(p.outcomeAge||0)/.26;ctx.save();ctx.globalAlpha*=1-kU*.3;ctx.strokeStyle='#ffae38';ctx.lineWidth=8*(1-kU*.4);ctx.beginPath();ctx.arc(46,-146,36+kU*84,-.75,.75);ctx.stroke();
   ctx.strokeStyle='#fff7d2';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(38,-148);ctx.lineTo(126+kU*28,-148);ctx.stroke();ctx.restore();
  }
 }
 if(p.kind==='heal'&&spit===0&&p.age>.15&&p.age<1.18){
  const u=clamp((p.age-.15)/1.0);ctx.save();ctx.globalAlpha*=Math.sin(u*Math.PI)*.85;
  ctx.strokeStyle='#88e6a6';ctx.fillStyle='#c4ffd6';ctx.lineWidth=2.5;
  for(let i=0;i<4;i++){const phase=(p.age*2.4+i*.25)%1,bx=-22+i*18,by=-120-phase*85;ctx.beginPath();ctx.arc(bx,by,3.5+(i%2)*1.5,0,Math.PI*2);ctx.fill();}
  if(p.age>=.96){const chime=(p.age-.96)/.22;ctx.globalAlpha*=1-chime;ctx.strokeStyle='#9cf5b8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(8,-165,30+chime*58,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 if(p.kind==='coin'&&p.age<.32){
  if(p.age<.16)drawProp(ctx,images,'coin',p.arm.wrist.x+40,p.arm.wrist.y+1,30,31,-.15);
  const cu=clamp(p.age/.32);ctx.save();ctx.globalAlpha*=Math.sin(cu*Math.PI)*.85;ctx.strokeStyle='#ffd659';ctx.lineWidth=5;ctx.beginPath();ctx.arc(30,-170,56+cu*24,-.95,-.05);ctx.stroke();ctx.restore();
 }
 if(f.guard||f.counter>0){
  ctx.save();ctx.strokeStyle=f.counter>0?'#f5ae42dd':'#7ce1d6bb';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-135,88,-1.18,1.18);ctx.stroke();
  if(f.counter>0){ctx.globalAlpha*=.5;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-135,98,-1.05,1.05);ctx.stroke();}
  ctx.restore();
 }
 if(spit>0&&spit<.52){
  const u=clamp(spit/.52),growth=.4+.6*ease(u*3);ctx.save();ctx.globalAlpha=Math.sin(Math.PI*u);ctx.translate(28,-207+HEAD_SEAT[f.type]+p.bob);ctx.rotate(p.headAngle);
  crop(ctx,images['art-props'],PROP_FRAMES.water,0,-30,150*growth,95*growth);ctx.restore();
 }
 if(knee){ctx.restore();drawKneeArt(ctx,images,p.age);}
 ctx.restore();return p;
}
export async function loadArtImages(base='assets/'){
 const entries=await Promise.all(Object.entries(ART_FILES).map(([key,file])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve([key,im]);im.onerror=()=>reject(new Error(file));im.src=base+file})));return Object.fromEntries(entries);
}
