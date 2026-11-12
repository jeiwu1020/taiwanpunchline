// Unpublished presentation-only candidate. CSS pixel inputs, no game imports.
export const MIC_CROP=Object.freeze([1186,543,192,444]);
export const MIN_MIC_SIZE=44;
// The unchanged atlas handle already tilts right: alpha-silhouette midpoints
// at source-crop y=220 and y=420 are x=78 and x=32 respectively.
export const MIC_SOURCE_TILT=Math.atan2(78-32,420-220);
export const MIC_VISUAL_TILT=Math.PI/6;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const grow=(r,p)=>({left:r.left-p,top:r.top-p,right:r.right+p,bottom:r.bottom+p});
export function micFootprint(size,angle,time=0){
 const w=size*192/444,c=Math.cos(angle),s=Math.sin(angle),points=[];
 const put=(x,y,r=0)=>{const xx=x*c-y*s,yy=x*s+y*c;points.push([xx-r,yy-r],[xx+r,yy+r]);};
 // Exactly the same source rectangle, wind endpoints/stroke radii and glints
 // used by drawFlyingMic, transformed before taking their union.
 for(const x of [-w/2,w/2])for(const y of [-size/2,size/2])put(x,y);
 for(let i=0;i<3;i++){const y=(i-1)*size*.18;put(-w/2-size*.16,y,1.2);put(-w/2-2,y-2,1.2);}
 for(let i=0;i<2;i++)put((i?1:-1)*(w/2+3),(i?1:-1)*size*.3,1.75);
 // Two CSS pixels include antialiasing at any supported device pixel ratio.
 return {x:Math.max(...points.map(p=>Math.abs(p[0])))+2,y:Math.max(...points.map(p=>Math.abs(p[1])))+2};
}
// The measured padded top of 63,828 starter poses is -281.972 local units.
// -285 adds ~3 local units. streetTrialFrame maps local -300 to y >=55,
// independently of X, depth, jump, platform support and camera position.
// Sampling is a practical guard, not a continuous-time proof. Runtime checks
// report any unmodeled geometry without moving/scaling the microphone.
export const ACTOR_LOCAL_TOP=-285;
export const FLOAT_AMPLITUDE=.75;
export function createMicPlan({width,height,zoom=1,dpr=1,safeInsets={}}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return {visible:false,reason:'INVALID_VIEWPORT',requiredMinimumSize:MIN_MIC_SIZE};
 dpr=Number.isFinite(dpr)&&dpr>0?Math.min(2,dpr):1;
 const size=44,angle=MIC_VISUAL_TILT-MIC_SOURCE_TILT,e=micFootprint(size,angle);
 // Integer device-pixel centers retain the exact same cached raster. Reserve
 // the entire ±1px float plus rounding, never the current actor pose.
 const actorSkyFloor=55+(300+ACTOR_LOCAL_TOP)*zoom;
 let result;
 for(const floatAmplitude of [FLOAT_AMPLITUDE,0]){
  // Reserve the actual reachable snapped displacement, including DPR below1
  // from browser zoom. If one physical pixel cannot fit, keep the same44px
  // artwork stationary rather than hide it or change camera/gameplay.
  const travel=Math.floor(floatAmplitude*dpr+.5)/dpr;
  const center={x:Math.floor((width-6-e.x-travel-(safeInsets.right||0))*dpr)/dpr,y:Math.ceil((6+e.y+travel+(safeInsets.top||0))*dpr)/dpr};
  const travelBounds={left:center.x-e.x-travel,right:center.x+e.x+travel,top:center.y-e.y-travel,bottom:center.y+e.y+travel};
  const valid=travelBounds.left>=Math.max(6+(safeInsets.left||0),width*.55)&&travelBounds.right<=width-6-(safeInsets.right||0)&&travelBounds.top>=6+(safeInsets.top||0)&&travelBounds.bottom<Math.min(height-6-(safeInsets.bottom||0),actorSkyFloor);
  result={visible:valid,reason:valid?null:'NO_SAFE_SKY_SPACE',message:valid?'':'目前視窗無法同時容納固定神麥、完整介面與角色安全範圍，請調整視窗。',size,angle,visualTilt:MIC_VISUAL_TILT,center,travelBounds,extent:e,dpr,actorSkyFloor,floatAmplitude,motionLimited:floatAmplitude===0,minimumSize:MIN_MIC_SIZE,requiredMinimumSize:MIN_MIC_SIZE,compressed:false,key:[width,height,dpr].join('x')};
  if(valid)return result;
 }
 return result;
}
export function flyingMicLayout(options){
 const {time=0,reducedMotion=false,playerBounds=null,hudRects=[]}=options,plan=options.plan||createMicPlan(options);
 if(!plan.visible)return {...plan};
 const snap=v=>Math.round(v*plan.dpr)/plan.dpr;
 const center={x:snap(plan.center.x+(reducedMotion?0:Math.sin(time*.0011)*plan.floatAmplitude)),y:snap(plan.center.y+(reducedMotion?0:Math.sin(time*.0014)*plan.floatAmplitude))};
 const e=plan.extent,bounds={left:center.x-e.x,right:center.x+e.x,top:center.y-e.y,bottom:center.y+e.y};
 const conflicts=[...(playerBounds&&overlap(bounds,playerBounds)?['PLAYER_ENVELOPE_EXCEEDED']:[]),...(hudRects.some(r=>overlap(bounds,r))?['HUD_RESERVATION_EXCEEDED']:[])];
 return {...plan,center,bounds,reducedMotion,safe:!conflicts.length,conflicts,message:conflicts.length?'固定神麥與目前畫面元素的安全留位不足；候選保留位置並明示衝突，不瞬移或縮放。':plan.message};
}
const rasters=new WeakMap();
export function invalidateFlyingMicRaster(ctx){const cached=rasters.get(ctx);if(cached){cached.canvas.width=1;cached.canvas.height=1;rasters.delete(ctx);}}
export function micRasterInfo(ctx){const r=rasters.get(ctx);return r?{generation:r.generation,key:r.key,width:r.canvas.width,height:r.canvas.height,crop:[...MIC_CROP]}:null;}
export function drawFlyingMic(ctx,image,layout,time=0){
 if(!layout.visible||!image)return false;
 const {size,angle,dpr=1}=layout,key=[layout.key,size,angle,dpr].join('/');let cached=rasters.get(ctx);
 if(!cached||cached.key!==key||cached.image!==image){
  const e=micFootprint(size,angle),halfW=Math.ceil(e.x*dpr),halfH=Math.ceil(e.y*dpr);
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(halfW*2,halfH*2):ctx.canvas.ownerDocument?ctx.canvas.ownerDocument.createElement('canvas'):new ctx.canvas.constructor(halfW*2,halfH*2);
  canvas.width=halfW*2;canvas.height=halfH*2;const brush=canvas.getContext('2d'),w=size*192/444;
  brush.scale(dpr,dpr);brush.translate(halfW/dpr,halfH/dpr);brush.rotate(angle);
  brush.strokeStyle='#fff6bc';brush.lineWidth=2.4;brush.lineCap='round';
  for(let i=0;i<3;i++){const yy=(i-1)*size*.18;brush.beginPath();brush.moveTo(-w/2-size*.16,yy);brush.lineTo(-w/2-2,yy-2);brush.stroke();}
  brush.drawImage(image,...MIC_CROP,-w/2,-size/2,w,size);
  brush.fillStyle='#ffe79b';
  for(let i=0;i<2;i++){const px=(i?1:-1)*(w/2+3),py=(i?1:-1)*size*.3;brush.beginPath();brush.arc(px,py,1.75,0,Math.PI*2);brush.fill();}
  cached={canvas,image,key,generation:(cached?.generation||0)+1};rasters.set(ctx,cached);
 }
 const {x,y}=layout.center,canvas=cached.canvas;
 ctx.drawImage(canvas,x-canvas.width/dpr/2,y-canvas.height/dpr/2,canvas.width/dpr,canvas.height/dpr);
 return true;
}

export const usesHighFlyingMic=s=>s?.stepId==='entry'&&['sound-trail','market-trail','anonymous-broadcast'].includes(s.storyFrame?.shot);
