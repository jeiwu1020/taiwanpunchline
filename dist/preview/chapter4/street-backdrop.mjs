import {prepareStreetStaticCaches,paintCachedStreetLayer,paintCachedPaperGrain,registerStreetSourceCacheInvalidator} from '../campaign/street-static-cache.mjs?v=campaign-complete-20261112-r1';
const sourceSurfaces=new Set();
export function invalidateStreetBackdropSourceCaches(){for(const canvas of sourceSurfaces){canvas.width=1;canvas.height=1;}sourceSurfaces.clear();horizontalCache=new WeakMap();seamCache=new WeakMap();transitionCache=new WeakMap();}
registerStreetSourceCacheInvalidator(invalidateStreetBackdropSourceCaches);
// Per-scene repair derived from the accepted chapter 2 renderer. Original geometry stays exact.
export const SKY_PALETTES=Object.freeze({"0": {"blue": "#83b2c4"}, "1": {"blue": "#9bbccb"}, "2": {"blue": "#92bac9"}});
export const SKY_EXTENSIONS=Object.freeze({
  "0": {
    "key": "chapter4-sky-0",
    "file": "chapter4/chapter4-civic-arcade-sky-r2.png",
    "generatedScale": 0.47050000000000003,
    "originX": -1,
    "originY": 1700
  },
  "1": {
    "key": "chapter4-sky-1",
    "file": "chapter4/chapter4-riverside-run-sky-r2.png",
    "generatedScale": 0.47150000000000003,
    "originX": -3,
    "originY": 1578
  },
  "2": {
    "key": "chapter4-sky-2",
    "file": "chapter4/chapter4-citygate-ceremony-sky-r2.png",
    "generatedScale": 0.47150000000000003,
    "originX": -3,
    "originY": 1671
  }
});
export const HORIZONTAL_EDGE_FILES=Object.freeze({'chapter4-edge-1':'chapter4/chapter4-riverside-run-edge-r2.png'});
export const SKY_EXTENSION_FILES=Object.freeze({...Object.fromEntries(Object.values(SKY_EXTENSIONS).map(v=>[v.key,v.file])),...HORIZONTAL_EDGE_FILES});
export const STREET_SEAM_FILES=Object.freeze({
  "chapter4-seam-0": "chapter4/chapter4-civic-arcade-seam-r2.png",
  "chapter4-seam-1": "chapter4/chapter4-riverside-run-seam-r2.png",
  "chapter4-seam-2": "chapter4/chapter4-citygate-ceremony-seam-r2.png"
});
export const SEAM_SOURCE_TOP=2048;
let horizontalCache=new WeakMap();
function horizontalEdge(ctx,image){
 if(horizontalCache.has(image))return horizontalCache.get(image);
 const width=1536,height=256,owner=ctx.canvas?.ownerDocument;
 const canvas=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):new ctx.canvas.constructor(width,height);
 canvas.width=width;canvas.height=height;sourceSurfaces.add(canvas);const brush=canvas.getContext('2d');
 brush.drawImage(image,0,image.height*.25,image.width,image.height/6,0,0,width,height);
 brush.globalCompositeOperation='destination-in';const fade=brush.createLinearGradient(0,0,0,height);
 fade.addColorStop(0,'transparent');fade.addColorStop(48/height,'black');fade.addColorStop(1-48/height,'black');fade.addColorStop(1,'transparent');brush.fillStyle=fade;brush.fillRect(0,0,width,height);
 horizontalCache.set(image,canvas);return canvas;
}
let seamCache=new WeakMap();
function sideSeam(ctx,image){
 if(seamCache.has(image))return seamCache.get(image);
 const width=768,height=3072,owner=ctx.canvas?.ownerDocument;
 const canvas=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):new ctx.canvas.constructor(width,height);
 canvas.width=width;canvas.height=height;sourceSurfaces.add(canvas);const brush=canvas.getContext('2d');
 // The source repair is the same 2048x3072 registration; consume the central 768 source pixels.
 brush.drawImage(image,image.width*640/2048,0,image.width*768/2048,image.height,0,0,width,height);
 brush.globalCompositeOperation='destination-in';
 const fade=brush.createLinearGradient(0,0,width,0);
 fade.addColorStop(0,'transparent');fade.addColorStop(128/width,'black');fade.addColorStop(1-128/width,'black');fade.addColorStop(1,'transparent');
 brush.fillStyle=fade;brush.fillRect(0,0,width,height);
 seamCache.set(image,canvas);return canvas;
}
function paintSideSeams(ctx,image,{x,y,w,h,tileWidth,scale}){
 const patch=sideSeam(ctx,image),half=patch.width*scale/2,top=y-SEAM_SOURCE_TOP*scale;
 // Use the same unwrapped camera phase as the facade. Neighbouring tiles
 // share one patch, rather than each drawing a mirrored half of a tree.
 for(let n=x-tileWidth;n<w+half;n+=tileWidth){
  if(n+half<=0)continue;
  ctx.drawImage(patch,n-half,top,patch.width*scale,patch.height*scale);
  const band=112*scale;
  for(let yy=y+1024*scale-1;yy<h;yy+=band-1)ctx.drawImage(patch,0,3072-112,patch.width,112,n-half,yy,patch.width*scale,band);
 }
}
// Keep source files immutable. Cache an alpha edge: 24 source pixels for
// foliage/ink, up to 96 for blue sky and cream clouds in both registered images.
// No camera geometry, building position or ground pixels are changed.
export const SKY_TRANSITION_HEIGHT=24;
let transitionCache=new WeakMap();
function skyTransition(ctx,source,extension,mapping){
 let cache=transitionCache.get(extension);if(cache)return cache;
 const width=source.width,height=96;
 const owner=ctx.canvas?.ownerDocument;
 const canvas=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):new ctx.canvas.constructor(width,height);
 canvas.width=width;canvas.height=height;sourceSurfaces.add(canvas);
 const brush=canvas.getContext('2d'),ratio=1/mapping.generatedScale;
 brush.drawImage(extension,-mapping.originX*ratio,-mapping.originY*ratio,extension.width*ratio,extension.height*ratio);
 const generated=brush.getImageData(0,0,width,height).data;
 brush.clearRect(0,0,width,height);brush.drawImage(source,0,0);
 const pixels=brush.getImageData(0,0,width,height),clamp=n=>Math.max(0,Math.min(1,n));
 const skyWeight=(r,g,b)=>clamp((b/Math.max(1,g)-.65)/.2)*clamp((Math.max(r,g,b)-140)/50);
 // Clouds and blue sky need a longer paper-grain transition. Warm leaves,
 // roof tiles and black ink get only the narrow edge, so they stay crisp.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
  const sky=Math.min(skyWeight(r,g,b),skyWeight(generated[i],generated[i+1],generated[i+2]));
  pixels.data[i+3]=Math.round(255*(sky*clamp(1-y/height)+(1-sky)*clamp(1-y/SKY_TRANSITION_HEIGHT)));
 }
 brush.putImageData(pixels,0,0);
 brush.globalCompositeOperation='source-in';
 brush.drawImage(extension,-mapping.originX*ratio,-mapping.originY*ratio,extension.width*ratio,extension.height*ratio);
 transitionCache.set(extension,canvas);return canvas;
}
function paperGrain(ctx,width,visible){
 // No source patch, tile, grid, mirrored edge, or periodic texture. Each height
 // band gets a different deterministic random sequence, so grain remains still
 // while jumping and newly exposed sky continues without repeating stripes.
 for(let band=0;band*64<visible;band++)for(let pass=0;pass<2;pass++){
  let seed=(Math.imul(band+17,374761393)^Math.imul(Math.round(width)+23,668265263)^Math.imul(pass+3,1274126177))>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle=pass?'#fff9e324':'#4d626813';ctx.beginPath();
  for(let i=0,n=Math.ceil(width*64*.027);i<n;i++){const x=random()*width,y=band*64+random()*64,r=.3+random()*.65;ctx.rect(x,y,r,r*(.7+random()*.7));}
  ctx.fill();
 }
}
export function paintOverscanSky(ctx,frame,width,height,exposedHeight,im,scene=0){
 // Last-resort sky for dimensions beyond the measured extension envelope.
 // No replicated clouds, mirrored patches or repeated picture rows.
 ctx.save();ctx.fillStyle=(SKY_PALETTES[scene]||SKY_PALETTES[0]).blue;ctx.fillRect(0,0,width,height);
 paintCachedPaperGrain(ctx,width,height,Math.max(0,Math.min(height,exposedHeight)),paperGrain);ctx.restore();
}
// Only registered static imagery is cached. Road-strip overlap and seam order
// remain in screen space, preserving the original one-CSS-pixel joins.
export function drawStreetBackdrop(ctx,im,f,w,h,curb=700,extension=null,seam=null,scene=0,edgeRepair=null){
 prepareStreetStaticCaches(ctx,f);
 const scale=489*f.zoom/curb,curbY=f.base-80*f.zoom,y=curbY-curb*scale;
 paintOverscanSky(ctx,f,w,h,y,im,scene);
 if(!im)return {sourceTop:y,skyCoveredTo:h,extensionApplied:false};
 const tileWidth=im.width*scale,tileHeight=im.height*scale,x=-((f.left*f.zoom)%tileWidth),mapping=SKY_EXTENSIONS[scene];
 const extensionTop=extension&&mapping?y-mapping.originY/mapping.generatedScale*scale:null;
 ctx.fillStyle='#b1a18d';ctx.fillRect(0,curbY,w,h-curbY);
 const paintStatic=(brush,frame,width,bottom,top)=>{
  const unit=489*frame.zoom/curb,origin=frame.base-569*frame.zoom,tw=im.width*unit,phase=-((frame.left*frame.zoom)%tw);
  if(extension&&mapping&&origin>top){
   const ratio=unit/mapping.generatedScale,sy=origin-mapping.originY*ratio;
   brush.save();brush.beginPath();brush.rect(-4,top-4,width+8,origin-top+6);brush.clip();
   for(let n=phase-tw*2;n<width+tw;n+=tw)brush.drawImage(extension,0,0,extension.width,mapping.originY+2/ratio,n-mapping.originX*ratio,sy,extension.width*ratio,mapping.originY*ratio+2);
   brush.restore();
  }
  for(let n=phase-tw;n<width+4;n+=tw)brush.drawImage(im,n,origin,tw,im.height*unit);
  if(extension&&mapping&&origin+96*unit>top){const transition=skyTransition(brush,im,extension,mapping);for(let n=phase-tw;n<width+4;n+=tw)brush.drawImage(transition,n,origin,tw,transition.height*unit);}
  if(edgeRepair){const edge=horizontalEdge(brush,edgeRepair);for(let n=phase-tw;n<width+4;n+=tw)brush.drawImage(edge,n,origin-128*unit,tw,256*unit);}
 };
 const cached=paintCachedStreetLayer(ctx,{image:im,extension,edge:edgeRepair,seam,frame:f,width:w,height:h,curb,mapping,scene:scene},paintStatic);
 if(!cached)paintStatic(ctx,f,w,h,0);
 for(let n=x-tileWidth;n<w;n+=tileWidth){const band=112*scale;for(let yy=y+tileHeight-1;yy<h;yy+=band-1)ctx.drawImage(im,0,im.height-112,im.width,112,n,yy,tileWidth,band);}
 if(seam)paintSideSeams(ctx,seam,{x,y,w,h,tileWidth,scale});
 return {sourceTop:y,skyCoveredTo:h,extensionApplied:!!extension&&y>0,extensionTop:extension&&y>0?extensionTop:null,seamApplied:!!seam,edgeApplied:!!edgeRepair};
}
