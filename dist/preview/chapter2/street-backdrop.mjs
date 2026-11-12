import {prepareStreetStaticCaches,paintCachedStreetLayer,paintCachedPaperGrain,registerStreetSourceCacheInvalidator} from '../campaign/street-static-cache.mjs?v=campaign-visuals-20261112-r2';
const sourceSurfaces=new Set();
export function invalidateStreetBackdropSourceCaches(){for(const canvas of sourceSurfaces){canvas.width=1;canvas.height=1;}sourceSurfaces.clear();seamCache=new WeakMap();transitionCache=new WeakMap();}
registerStreetSourceCacheInvalidator(invalidateStreetBackdropSourceCaches);
// Sky-r4 repair: register the sky and soften only its narrow source-edge join.
// Original assets, horizontal phase, scale, curb and world stay exact.
export const SKY_PALETTES=Object.freeze({695:{blue:'#a4c2d2'},700:{blue:'#9ab8c6'},690:{blue:'#97c4dc'}});
export const SKY_EXTENSIONS=Object.freeze({
  "695": {
    "key": "chapter2-sky-695",
    "file": "chapter2/chapter2-market-arcade-sky-r4.png",
    "generatedScale": 0.4713541666666667,
    "originX": -1,
    "originY": 1721
  },
  "700": {
    "key": "chapter2-sky-700",
    "file": "chapter2/chapter2-temple-lane-sky-r4.png",
    "generatedScale": 0.4713541666666667,
    "originX": -1,
    "originY": 1570
  },
  "690": {
    "key": "chapter2-sky-690",
    "file": "chapter2/chapter2-assembly-square-sky-r4.png",
    "generatedScale": 0.81640625,
    "originX": 0,
    "originY": 1045
  }
});
export const SKY_EXTENSION_FILES=Object.freeze(Object.fromEntries(Object.values(SKY_EXTENSIONS).map(v=>[v.key,v.file])));
// Separate, locally repainted joins preserve every original tile and its scale.
export const STREET_SEAM_FILES=Object.freeze({
 'chapter2-seam-695':'chapter2/chapter2-market-arcade-seam-r5.png',
 'chapter2-seam-700':'chapter2/chapter2-temple-lane-seam-r5.png',
 'chapter2-seam-690':'chapter2/chapter2-assembly-square-seam-r5.png'
});
let seamCache=new WeakMap();
function sideSeam(ctx,image){
 if(seamCache.has(image))return seamCache.get(image);
 const width=768,height=2304,owner=ctx.canvas?.ownerDocument;
 const canvas=owner?owner.createElement('canvas'):typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):new ctx.canvas.constructor(width,height);
 canvas.width=width;canvas.height=height;sourceSurfaces.add(canvas);const brush=canvas.getContext('2d');
 // The source repair is the same 1536x2304 registration, exported at 2/3 size.
 brush.drawImage(image,256,0,512,1536,0,0,width,height);
 brush.globalCompositeOperation='destination-in';
 const fade=brush.createLinearGradient(0,0,width,0);
 fade.addColorStop(0,'transparent');fade.addColorStop(128/width,'black');fade.addColorStop(1-128/width,'black');fade.addColorStop(1,'transparent');
 brush.fillStyle=fade;brush.fillRect(0,0,width,height);
 seamCache.set(image,canvas);return canvas;
}
function paintSideSeams(ctx,image,{x,y,w,h,tileWidth,scale}){
 const patch=sideSeam(ctx,image),half=patch.width*scale/2,top=y-1280*scale;
 // Use the same unwrapped camera phase as the facade. Neighbouring tiles
 // share one patch, rather than each drawing a mirrored half of a tree.
 for(let n=x-tileWidth;n<w+half;n+=tileWidth){
  if(n+half<=0)continue;
  ctx.drawImage(patch,n-half,top,patch.width*scale,patch.height*scale);
  const band=112*scale;
  for(let yy=y+1024*scale-1;yy<h;yy+=band-1)ctx.drawImage(patch,0,2304-112,patch.width,112,n-half,yy,patch.width*scale,band);
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
export function paintOverscanSky(ctx,frame,width,height,exposedHeight,im,curb=700){
 // Last-resort sky for dimensions beyond the measured extension envelope.
 // No replicated clouds, mirrored patches or repeated picture rows.
 ctx.save();ctx.fillStyle=(SKY_PALETTES[curb]||SKY_PALETTES[700]).blue;ctx.fillRect(0,0,width,height);
 paintCachedPaperGrain(ctx,width,height,Math.max(0,Math.min(height,exposedHeight)),paperGrain);ctx.restore();
}
// Only registered static imagery is cached. Road-strip overlap and seam order
// remain in screen space, preserving the original one-CSS-pixel joins.
export function drawStreetBackdrop(ctx,im,f,w,h,curb=700,extension=null,seam=null){
 prepareStreetStaticCaches(ctx,f);
 const scale=489*f.zoom/curb,curbY=f.base-80*f.zoom,y=curbY-curb*scale;
 paintOverscanSky(ctx,f,w,h,y,im,curb);
 if(!im)return {sourceTop:y,skyCoveredTo:h,extensionApplied:false};
 const tileWidth=im.width*scale,tileHeight=im.height*scale,x=-((f.left*f.zoom)%tileWidth),mapping=SKY_EXTENSIONS[curb];
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
 };
 const cached=paintCachedStreetLayer(ctx,{image:im,extension,edge:null,seam,frame:f,width:w,height:h,curb,mapping,scene:curb},paintStatic);
 if(!cached)paintStatic(ctx,f,w,h,0);
 for(let n=x-tileWidth;n<w;n+=tileWidth){const band=112*scale;for(let yy=y+tileHeight-1;yy<h;yy+=band-1)ctx.drawImage(im,0,im.height-112,im.width,112,n,yy,tileWidth,band);}
 if(seam)paintSideSeams(ctx,seam,{x,y,w,h,tileWidth,scale});
 return {sourceTop:y,skyCoveredTo:h,extensionApplied:!!extension&&y>0,extensionTop:extension&&y>0?extensionTop:null,seamApplied:!!seam};
}
