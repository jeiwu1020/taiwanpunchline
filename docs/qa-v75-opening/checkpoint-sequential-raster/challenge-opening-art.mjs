import {openingSheet} from './challenge-opening-assets.mjs?v=74';
export {openingSheet} from './challenge-opening-assets.mjs?v=74';

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
  hand:{x:lerp(28,-104,reach*hold),y:lerp(-82,-56,reach*hold)},blanketLift,
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
function drawPanel(ctx,img,sheet,p,alpha=1,camera=0){
 const source=sheet.panels[p.panel],inset=p.main?Math.abs(camera)*p.width/2:0;
 // Camera retreats slightly inside its allocated box, never crops the source.
 const scale=(p.width-inset*2)/p.width,w=p.width*scale,h=p.height*scale,x=p.x+inset,y=p.y+(p.height-h)/2;
 ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,...source,x,y,w,h);ctx.restore();
}
/** Only generated raster scenes are used for the opening. Canvas rectangles are
 * a comic-page frame, not replacement illustration or assembled anatomy.
 */
export function paintOpeningComic(ctx,images,beat,type,w,h,time=0,{reducedMotion=false}={}){
 const state=openingPanelState(beat.shot,time,reducedMotion),sheet=openingSheet(type),img=sheet&&images[sheet.key];
 ctx.clearRect(0,0,w,h);ctx.fillStyle=PAPER;ctx.fillRect(0,0,w,h);
 if(!img||!sheet){ctx.fillStyle=INK;ctx.font='700 22px sans-serif';ctx.textAlign='center';ctx.fillText('漫畫素材載入中',w/2,h/2);ctx.textAlign='left';return{...state,ready:false};}
 const layout=openingPanelLayout(sheet,beat.shot,time,w,h,reducedMotion);
 for(const p of layout){
  ctx.fillStyle=INK;ctx.fillRect(p.x-3,p.y-3,p.width+6,p.height+6);
  // A clean pose cut plus a contained camera approach avoids translucent
  // duplicate hands/heads during a dissolve between different body positions.
  drawPanel(ctx,img,sheet,p,1,state.camera);
  if(p.main){ctx.strokeStyle=GOLD;ctx.lineWidth=4;ctx.strokeRect(p.x-5,p.y-5,p.width+10,p.height+10);}
 }
 return{...state,ready:true,character:sheet.character,panels:layout};
}
