// Camera and prop contacts share one transform. The complete generated balloon
// microphone stays intact; the plain pole uses only the artwork below its lock.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export const PARADE_BALLOONS=Object.freeze([102,0,790,1510]);
export const OPEN_STAND_CROP=Object.freeze([270,565,390,941]);
const TIP={x:(390-102)/790,y:1495/1510},KNOT={x:(477-102)/790,y:1144/1510};
export const isParadeProp=scene=>['resting-mic','lifting-mic','ribbon-mic'].includes(scene.prop);

export function comicBackdropGeometry(scene,layout,image){
 const iw=image.naturalWidth??image.width,ih=image.naturalHeight??image.height;
 const scale=Math.max(layout.width/iw,layout.height/ih),sw=layout.width/scale,sh=layout.height/scale;
 const sx=clamp(iw*(isParadeProp(scene)?.86:.5)-sw/2,0,iw-sw),sy=(ih-sh)/2;
 return {crop:[sx,sy,sw,sh],point:(x,y)=>({x:(x-sx)*scale,y:(y-sy)*scale})};
}

export function paradePropGeometry(scene,layout,{time=0,reducedMotion=false,background}={}){
 const r=layout.art,bubble=layout.bubbles[0],bubbleRight=layout.landscape&&bubble?.x>layout.width/2;
 const h=Math.min(r.height*.48,r.width*.44),w=h*PARADE_BALLOONS[2]/PARADE_BALLOONS[3];
 const count=scene.actors.length,gap=count<2?.72:1-1/count;
 let stemX=r.x+r.width*(layout.landscape?.74:bubbleRight?1-gap:gap);
 const standH=r.height*.32,standW=standH*OPEN_STAND_CROP[2]/OPEN_STAND_CROP[3],foot=r.y+r.height*.98;
 let restX=clamp(stemX-TIP.x*w,r.x+4,r.x+r.width-w-4);
 if(layout.landscape&&bubbleRight&&restX+w>bubble.x-10)restX=Math.max(r.x+4,bubble.x-w-10);
 stemX=restX+TIP.x*w;
 const stand={crop:OPEN_STAND_CROP,x:stemX-(473-270)/390*standW,y:foot-standH,width:standW,height:standH,stem:{x:stemX,y:foot-standH}};
 const rest={x:restX,y:stand.stem.y-TIP.y*h};
 const anchor=background.point(...(scene.chapterId==='chapter-2'?[1334,383]:[1374,531]));
 let airX=clamp(anchor.x-r.width*.13-KNOT.x*w,r.x+4,r.x+r.width-w-4);
 if(layout.landscape&&bubbleRight&&airX+w>bubble.x-10)airX=Math.max(r.x+4,bubble.x-w-10);
 const air={x:airX,y:r.y+4};
 const progress=scene.prop==='resting-mic'?0:scene.prop==='ribbon-mic'||reducedMotion?1:ease((time-300)/1800);
 const balloons={crop:PARADE_BALLOONS,x:rest.x+(air.x-rest.x)*progress,y:rest.y+(air.y-rest.y)*progress,width:w,height:h};
 const point=f=>({x:balloons.x+f.x*w,y:balloons.y+f.y*h}),knot=point(KNOT);
 return {balloons,stand:scene.prop==='ribbon-mic'?null:stand,tip:point(TIP),knot,progress,
  ribbon:{start:anchor,end:knot,slack:scene.prop==='resting-mic'?.24:(1-progress)*.24}};
}

export function paintParadeProp(ctx,images,scene,layout,options){
 const background=options.background??comicBackdropGeometry(scene,layout,images[scene.backdrop]);
 const p=paradePropGeometry(scene,layout,{...options,background}),s=p.stand,b=p.balloons;
 if(s)ctx.drawImage(images['comic-locked-stand'],...s.crop,s.x,s.y,s.width,s.height);
 const {start,end,slack}=p.ribbon,midX=(start.x+end.x)/2,midY=(start.y+end.y)/2+layout.art.height*slack;
 // A broad red cloth ribbon leaves the painted rosette and disappears beneath
 // the native rope knot. Its two endpoints follow the actual images, not HUD.
 ctx.lineCap='round';ctx.lineJoin='round';
 const width=Math.max(3,Math.min(7,layout.art.height*.018));
 for(const [color,lineWidth]of [['#653b2a',width+2],['#bb4935',width],['#ecb278',Math.max(1,width*.18)]]){
  ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(midX,midY,end.x,end.y);ctx.stroke();
 }
 ctx.drawImage(images['comic-balloon-mic'],...b.crop,b.x,b.y,b.width,b.height);
 return p;
}
