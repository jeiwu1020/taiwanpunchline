import {GROUND} from '../../core.mjs?v=campaign-boot-20261112-r3';
import {drawChallengeSky} from '../../challenge-art.mjs?v=campaign-boot-20261112-r3';
import {prepareStreetStaticCaches,registerStreetSourceCacheInvalidator} from '../campaign/street-static-cache.mjs?v=campaign-boot-20261112-r3';

export const CHAPTER5_ART=Object.freeze({curbs:[535,557,556],files:{
 'chapter5-scene-0':'chapter5/return-street-v1.png',
 'chapter5-scene-1':'chapter5/seal-archive-v1.png',
 'chapter5-scene-2':'chapter5/sealed-forecourt-v1.png',
 'chapter5-props':'chapter5/return-props-v1.png',
 'chapter5-miniboss-atlas':'chapter5/miniboss-atlas-v2.png'
}});
export const PROP_CROPS=Object.freeze({counter:[35,89,586,514],boxes:[706,58,457,525],ledger:[35,695,572,500],sign:[709,663,465,547]});
const SIGNS=Object.freeze([[{x:680,y:220,width:345,copy:'器材歸還處'},{x:1800,y:148,width:320,copy:'有夢先登記'}],[{x:1292,y:154,width:305,copy:'封印檔案廊'}],[{x:1005,y:158,width:420,copy:'議場保管處'},{x:1807,y:190,width:330,copy:'先看使用說明'}]]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let masks=new WeakMap();const surfaces=new Set();
registerStreetSourceCacheInvalidator(()=>{for(const c of surfaces){c.width=1;c.height=1;}surfaces.clear();masks=new WeakMap();});
function facade(ctx,image){
 if(masks.has(image))return masks.get(image);
 const owner=ctx.canvas?.ownerDocument,c=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(image.width,image.height):new ctx.canvas.constructor(image.width,image.height);
 c.width=image.width;c.height=image.height;const brush=c.getContext('2d');brush.drawImage(image,0,0);
 // A narrow paper/sky join, cached once per source; roofs and street stay exact.
 brush.globalCompositeOperation='destination-in';const fade=brush.createLinearGradient(0,0,0,32);fade.addColorStop(0,'transparent');fade.addColorStop(1,'black');brush.fillStyle=fade;brush.fillRect(0,0,c.width,c.height);
 surfaces.add(c);masks.set(image,c);return c;
}
export function panoramaFrame(image,frame,curb,worldWidth,viewportWidth=0){
 // Image landmarks and foreground props share a fixed world scale. A jump
 // changes camera zoom, never the width or horizontal anchor of the scenery.
 const scale=Math.max(worldWidth/image.width,489/curb)*frame.zoom;
 return {x:-frame.left*frame.zoom,y:frame.base-80*frame.zoom-curb*scale,width:image.width*scale,height:image.height*scale,scale};
}
/** A single chapter-owned long facade, not periodic fourth-chapter scenery.
 * Camera/viewport and all physical coordinates are supplied by shared code. */
export function drawChapter5Backdrop(ctx,image,frame,width,height,{scene=0,worldWidth=2500,sky=null}={}){
 prepareStreetStaticCaches(ctx,frame);ctx.save();ctx.fillStyle='#92b6c7';ctx.fillRect(0,0,width,height);
 if(sky)drawChallengeSky(ctx,sky,{width,top:0,bottom:height});
 if(!image){ctx.restore();return null;}
 const p=panoramaFrame(image,frame,CHAPTER5_ART.curbs[scene],worldWidth,width),source=facade(ctx,image);
 const curbY=frame.base-80*frame.zoom;
 ctx.fillStyle='#b29a80';ctx.fillRect(0,Math.max(0,curbY),width,height-Math.max(0,curbY));
 // Mirror the outer scene beyond its fixed world edges. Overscan belongs to
 // the scenery, rather than a screen-space clamp that makes props slide.
 if(p.x>0){ctx.save();ctx.translate(p.x,p.y);ctx.scale(-1,1);ctx.drawImage(source,0,0,p.width,p.height);ctx.restore();}
 if(p.x+p.width<width){ctx.save();ctx.translate(p.x+2*p.width,p.y);ctx.scale(-1,1);ctx.drawImage(source,0,0,p.width,p.height);ctx.restore();}
 ctx.drawImage(source,p.x,p.y,p.width,p.height);
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#28533e';ctx.font=`900 ${26*p.scale}px Microsoft JhengHei,system-ui`;for(const sign of SIGNS[scene])ctx.fillText(sign.copy,p.x+sign.x*p.scale,p.y+sign.y*p.scale,sign.width*p.scale);ctx.restore();
 const band=112*p.scale,start=p.y+p.height-1;
 for(let y=start;y<height;y+=band-1)ctx.drawImage(image,0,image.height-112,image.width,112,Math.min(0,p.x),y,Math.max(width,p.width),band);
 ctx.restore();return p;
}
const DECORATIONS=Object.freeze([
 [{kind:'sign',x:290,copy:'歸還 →'},{kind:'counter',x:650,copy:'清點 01'},{kind:'boxes',x:1240},{kind:'ledger',x:1840},{kind:'sign',x:2280,copy:'拿單 →'}],
 [{kind:'sign',x:260,copy:'查號 →'},{kind:'ledger',x:710},{kind:'boxes',x:1320},{kind:'counter',x:1900,copy:'封印紀錄'},{kind:'sign',x:2480,copy:'試音 →'}],
 [{kind:'sign',x:280,copy:'保管 →'},{kind:'boxes',x:760},{kind:'ledger',x:1450},{kind:'counter',x:2110,copy:'七人清點'},{kind:'sign',x:2630,copy:'前庭 →'}]
]);
export const chapter5Decorations=scene=>(DECORATIONS[scene]??DECORATIONS[0]).map(p=>({...p,depth:-195,width:p.kind==='counter'?210:p.kind==='sign'?106:120,height:p.kind==='counter'?150:p.kind==='sign'?125:125}));
export function drawChapter5Prop(ctx,images,kind,{x,y,width=110,height=120,copy=''}={}){
 const image=images['chapter5-props'],crop=PROP_CROPS[kind];if(!image||!crop)return false;
 const k=Math.min(width/crop[2],height/crop[3]),w=crop[2]*k,h=crop[3]*k;ctx.drawImage(image,...crop,x-w/2,y-h,w,h);
 if(copy){ctx.save();ctx.font=`900 ${clamp(w/(copy.length+1),10,18)}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#173c32';ctx.fillText(copy,x,y-h*(kind==='sign'?.46:.35),w*.78);ctx.restore();}return true;
}
export function drawChapter5Details(ctx,images,frame,{scene=0,worldWidth=2500}={}){
 const project=(x,y=GROUND,depth=-195)=>({x:(x-frame.left)*frame.zoom,y:frame.base+(y-GROUND+depth*.65)*frame.zoom});
 for(const p of chapter5Decorations(scene)){
  const q=project(p.x);if(q.x+p.width*frame.zoom<0||q.x-p.width*frame.zoom>ctx.canvas.width)continue;
  drawChapter5Prop(ctx,images,p.kind,{...q,width:p.width*frame.zoom,height:p.height*frame.zoom,copy:p.copy});
 }
 // Painted numbered waiting spots occupy the rear sidewalk, not collision lanes.
 ctx.save();ctx.strokeStyle='#517b5eaa';ctx.fillStyle='#fff2d6';ctx.lineWidth=2*frame.zoom;
 for(let i=0;i<7;i++){const q=project(360+i*(worldWidth-650)/7,GROUND,-165);ctx.beginPath();ctx.ellipse(q.x,q.y,24*frame.zoom,9*frame.zoom,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font=`900 ${12*frame.zoom}px system-ui`;ctx.textAlign='center';ctx.fillStyle='#315b49';ctx.fillText(String(i+1).padStart(2,'0'),q.x,q.y+4*frame.zoom);ctx.fillStyle='#fff2d6';}
 ctx.restore();
}
