import {backgroundCachePolicy} from '../../background-cache-policy.mjs?v=workers-background-only-20261113-r1';
import {invalidateFlyingMicRaster} from '../chapter2/flying-mic.mjs?v=workers-background-only-20261113-r1';
// Each destination owns bounded periodic world strips plus screen paper.
// Original road-strip overlaps and seam overlays remain in the caller.
const streets=new WeakMap(),papers=new WeakMap(),owners=new WeakMap(),policies=new WeakMap(),invalidators=new Set();
const MAX_PIXELS=24*1024*1024,ROW=512,BLEED=2;
// Reserve the unchanged source masks (largest chapter: side seam + upper edge
// + transition), alongside the destination, paper and all world-strip pixels.
const SOURCE_MASK_PIXELS=768*3072+1536*256+1536*96;
const canvasFor=(ctx,w,h)=>{const owner=ctx.canvas?.ownerDocument;const c=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):new ctx.canvas.constructor(w,h);c.width=w;c.height=h;return c;};
const dprOf=ctx=>{const t=ctx.getTransform?.();return Number.isFinite(t?.a)&&Number.isFinite(t?.d)?Math.max(Math.hypot(t.a,t.b||0),Math.hypot(t.c||0,t.d),1):1;};
function release(entry){if(entry?.canvas){entry.canvas.width=1;entry.canvas.height=1;}for(const tile of entry?.tiles?.values()||[])release(tile);}
export function registerStreetSourceCacheInvalidator(invalidate){invalidators.add(invalidate);}
export function invalidateStreetStaticCaches(ctx){invalidateFlyingMicRaster(ctx);release(streets.get(ctx));release(papers.get(ctx));streets.delete(ctx);papers.delete(ctx);owners.delete(ctx);for(const invalidate of invalidators)invalidate();}
// Called before sky/paper, not halfway through the backdrop pass. One owner
// releases both policies and source helpers before the replacement allocates.
export function prepareStreetStaticCaches(ctx,frame){
 const policy=backgroundCachePolicy(frame?.presentation),last=policies.get(ctx);
 if(last?.policy!==policy){if(last)invalidateStreetStaticCaches(ctx);policies.set(ctx,{policy,switches:(last?.switches||0)+(last?1:0)});}
 return policy;
}
export function streetStaticCacheDiagnostics(ctx){const entry=streets.get(ctx),paper=papers.get(ctx),state=policies.get(ctx),policy=state?.policy||'retained';return {policy,policySwitches:state?.switches||0,tiles:entry?.tiles?.size||(entry?.canvas?1:0),builds:entry?.builds||0,density:entry?.density||0,pixels:[...entry?.tiles?.values()||[]].reduce((n,t)=>n+t.canvas.width*t.canvas.height,0)+(entry?.canvas?entry.canvas.width*entry.canvas.height:0)+(paper?paper.canvas.width*paper.canvas.height:0),budget:policy==='finite'?MAX_PIXELS:16*1024*1024,budgetScope:policy==='finite'?'managed-surfaces':'per-layer',reservedMaskPixels:SOURCE_MASK_PIXELS};}

export function paintCachedStreetLayer(ctx,{image,extension=null,edge=null,seam=null,frame,width,height,curb,mapping,scene=0},paint){
 const policy=prepareStreetStaticCaches(ctx,frame);
 const unit=489/curb,tileWidth=image.width*unit,dpr=dprOf(ctx),required=dpr*frame.zoom;
 const key=[width,height,dpr,curb,scene,tileWidth,mapping?.originX,mapping?.originY,mapping?.generatedScale].join(':'),last=streets.get(ctx);
 // Source helpers can be painted after native-image bypass or budget fallback,
 // when no street bitmap exists. Their ownership must survive both paths.
 let owner=owners.get(ctx);
 const sameOwner=owner?.key===key&&owner.sceneIdentity===frame.backdropScene&&owner.image===image&&owner.extension===extension&&owner.edge===edge&&owner.seam===seam&&owner.mapping===mapping;
 if(!sameOwner){
  if(owner){release(last);streets.delete(ctx);for(const invalidate of invalidators)invalidate();}
  owner={key,sceneIdentity:frame.backdropScene,image,extension,edge,seam,mapping};owners.set(ctx,owner);
 }
 const same=last?.owner===owner;
 if(policy==='retained')return paintRetainedStreetLayer(ctx,{image,extension,edge,frame,width,height,curb,mapping,unit,tileWidth,dpr,last,same,owner},paint);
 const sourceTop=-569,sourceBottom=sourceTop+image.height*unit,upper=extension&&mapping?sourceTop-mapping.originY*unit/mapping.generatedScale:sourceTop-(edge?128*unit:0);
 const visibleTop=Math.max(upper,-frame.base/frame.zoom),visibleBottom=Math.min(sourceBottom,(height-frame.base)/frame.zoom);
 if(frame.base+sourceTop*frame.zoom+Math.max(96*unit,edge?128*unit:0)*frame.zoom<=0)return false;
 if(![required,visibleTop,visibleBottom].every(Number.isFinite)||required<=0||visibleTop>=visibleBottom)return false;
 let density=same?last.density:Math.ceil(required*unit*64)/(unit*64);
 // Retain adequate density across small motion; halve only after a generous
 // downward boundary. Crossing it repeatedly cannot rebuild on every frame.
 if(required>density||required<density*.45)density*=2**(Math.ceil(Math.log2(required/density)*2)/2);
 const pw=Math.ceil(tileWidth*density),sx=pw/tileWidth,ph=Math.ceil(ROW*density),first=Math.floor((visibleTop-sourceTop)/ROW),end=Math.ceil((visibleBottom-sourceTop)/ROW)-1;
 const minRow=Math.floor((upper-sourceTop)/ROW),maxRow=Math.ceil((sourceBottom-sourceTop)/ROW)-1,ids=[];
 for(let row=Math.max(minRow,first-1);row<=Math.min(maxRow,end+1);row++)ids.push(row);
 const screenPixels=Math.ceil(width*dpr)*Math.ceil(height*dpr),paperPixels=papers.get(ctx)?.canvas.width*papers.get(ctx)?.canvas.height||0;
 const cost=screenPixels+SOURCE_MASK_PIXELS+paperPixels+ids.length*(pw+2*BLEED)*(ph+2*BLEED);
 if(ids.length>64||pw+2*BLEED>8192||ph+2*BLEED>8192||cost>MAX_PIXELS){release(last);streets.delete(ctx);return false;}
 let entry=same?last:null;
 if(!entry||entry.density!==density){release(entry);entry={owner,density,tiles:new Map(),builds:0};streets.set(ctx,entry);}
 for(const [row,tile] of entry.tiles)if(!ids.includes(row)){release(tile);entry.tiles.delete(row);}
 for(const row of ids){
  if(entry.tiles.has(row))continue;const top=sourceTop+row*ROW,canvas=canvasFor(ctx,pw+2*BLEED,ph+2*BLEED),brush=canvas.getContext('2d');brush.setTransform(sx,0,0,density,BLEED,BLEED-top*density);
  entry.tiles.set(row,{canvas,top});
  paint(brush,{zoom:1,left:0,base:0},tileWidth,top+ROW+BLEED/density,top-BLEED/density);entry.builds++;
 }
 const z=frame.zoom,start=Math.floor(frame.left/tileWidth)-1,finish=Math.ceil((frame.left+width/z)/tileWidth)+1;
 // Sample real neighbour pixels outside each core, but composite each core
 // exactly once. World anchors and translucent joins do not shift or double.
 for(let row=first;row<=end;row++){const tile=entry.tiles.get(row);for(let i=start;i<finish;i++)ctx.drawImage(tile.canvas,0,BLEED,tile.canvas.width,ROW*density,(i*tileWidth-frame.left-BLEED/sx)*z,frame.base+tile.top*z,tile.canvas.width/sx*z,ROW*z);}
 return true;
}
// Preserve #66 highest-density, accumulated whole-layer allocation. The
// historical 16 Mi-pixel guard applies independently to street and paper.
function paintRetainedStreetLayer(ctx,{image,extension,edge,frame,width,height,mapping,unit,tileWidth,dpr,last,same,owner},paint){
 if(frame.base-569*frame.zoom+Math.max(96*unit,edge?128*unit:0)*frame.zoom<=0)return false;
 const preferred=Math.max(frame.zoom,frame.backdropZoom??frame.zoom),density=Math.max(Math.ceil(dpr*preferred*unit*64)/(unit*64),same?last.density:0),pw=Math.ceil(tileWidth*density),sx=pw/tileWidth;
 const sourceTop=-569,sourceBottom=sourceTop+image.height*unit,upper=extension&&mapping?sourceTop-mapping.originY*unit/mapping.generatedScale:sourceTop-(edge?128*unit:0);
 const visibleTop=-frame.base/frame.zoom,visibleBottom=(height-frame.base)/frame.zoom;
 let top=Math.max(upper,visibleTop-256),bottom=Math.min(sourceBottom,visibleBottom+256);
 top=sourceTop+Math.floor((top-sourceTop)*density)/density;bottom=sourceTop+Math.ceil((bottom-sourceTop)*density)/density;
 if(same&&density===last.density){top=visibleTop<last.top?Math.min(top,last.top):last.top;bottom=visibleBottom>last.bottom?Math.max(bottom,last.bottom):last.bottom;}
 const ph=Math.max(1,Math.round((bottom-top)*density));
 if(![density,top,bottom].every(Number.isFinite)||density<=0||top>=bottom||pw+2*BLEED>8192||ph>8192||(pw+2*BLEED)*ph>16*1024*1024){release(last);streets.delete(ctx);return false;}
 let entry=same?last:null;
 if(!entry||density!==entry.density||top!==entry.top||bottom!==entry.bottom){
  const canvas=entry?.canvas||canvasFor(ctx,1,1),builds=entry?.builds||0;canvas.width=pw+2*BLEED;canvas.height=ph;
  const brush=canvas.getContext('2d');brush.setTransform(sx,0,0,density,BLEED,-top*density);
  entry={owner,density,top,bottom,canvas,pw,sx,tileWidth,builds};streets.set(ctx,entry);
  paint(brush,{zoom:1,left:0,base:0},tileWidth,bottom,top);entry.builds++;
 }
 const z=frame.zoom,start=Math.floor(frame.left/tileWidth)-1,end=Math.ceil((frame.left+width/z)/tileWidth)+1;
 for(let i=start;i<end;i++)ctx.drawImage(entry.canvas,(i*tileWidth-frame.left-BLEED/entry.sx)*z,frame.base+entry.top*z,entry.canvas.width/entry.sx*z,(entry.bottom-entry.top)*z);
 return true;
}
export function paintCachedPaperGrain(ctx,width,height,visible,paint){
 const dpr=dprOf(ctx),h=Math.ceil(height/64)*64,key=[width,h,dpr].join(':'),count=Math.ceil(Math.max(0,visible)/64)*64;
 if(!count)return;
 let entry=papers.get(ctx);
 if(entry?.key!==key){
  release(entry);papers.delete(ctx);const pw=Math.ceil(width*dpr),ph=Math.ceil(h*dpr),streetPixels=streetStaticCacheDiagnostics(ctx).pixels;
  if((policies.get(ctx)?.policy==='finite'?pw*ph+streetPixels+width*height*dpr*dpr+SOURCE_MASK_PIXELS>MAX_PIXELS:pw*ph>16*1024*1024)||pw>8192||ph>8192){paint(ctx,width,visible);return;}
  const canvas=canvasFor(ctx,pw,ph),brush=canvas.getContext('2d');brush.setTransform(dpr,0,0,dpr,0,0);entry={key,canvas,dpr};papers.set(ctx,entry);paint(brush,width,h);
 }
 const clipped=Math.min(count,h);ctx.drawImage(entry.canvas,0,0,width*dpr,clipped*dpr,0,0,width,clipped);
}
