import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createDepthBackdropRenderer} from '../../dist/challenge-backdrop-cache.mjs';
import {CHALLENGE_ART_FILES,drawChallengeBackdrop} from '../../dist/challenge-art.mjs';
import {depthBackdropLayout} from '../../dist/challenge-depth-render.mjs';

export const partialViews=Object.freeze({
 near:{zoom:.8085365853658538,top:-4.811463046757154},
 far:{zoom:.45561892934506987,top:-196.40180838684654}
});
export function streetFrame({zoom,top},x=144.41666666666669){
 return {width:844,height:390,x,y:top+195/zoom,zoom};
}

// Native raster surrogate for the actual Phaser Canvas chain: static displays
// go to the final 1x canvas; the already-existing dynamic 2x canvas is sampled
// onto it once. References use the same sky, but an independent unbanded facade.
// This is not a browser/physical-phone rendering fixture.
export async function partialStreetFixture(rendererFactory=createDepthBackdropRenderer){
 const images={};
 for(const key of ['challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair']){
  images[key]=await loadImage(new URL('../../dist/assets/'+CHALLENGE_ART_FILES[key],import.meta.url).pathname);
 }
 const allocated=[],textures=new Map(),displays=[];
 const document={createElement(){const canvas=createCanvas(1,1);canvas.ownerDocument=document;allocated.push(canvas);return canvas;}};
 const scene={
  textures:{createCanvas(key,width,height){
   const canvas=document.createElement();canvas.width=width;canvas.height=height;
   const texture={
    get width(){return canvas.width;},get height(){return canvas.height;},
    getCanvas:()=>canvas,getContext:()=>canvas.getContext('2d'),
    setSize(w,h=w){if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;}return this;},
    refresh(){return this;}
   };
   textures.set(key,texture);return texture;
  }},
  add:{image(x,y,key){
   const display={x,y,key,visible:true,
    setOrigin(){return this;},setDepth(depth){this.depth=depth;return this;},
    setVisible(visible){this.visible=visible;return this;},
    setPosition(x,y){this.x=x;this.y=y;return this;},
    setDisplaySize(width,height){this.width=width;this.height=height;return this;},
    setTexture(key){this.key=key;return this;},setFlipX(flip){this.flip=flip;return this;},
    setCrop(...crop){this.crop=crop.length?crop:null;return this;}
   };
   displays.push(display);return display;
  }}
 };
 const renderer=rendererFactory(scene,images),dynamic=document.createElement();
 dynamic.width=1688;dynamic.height=780;
 // Oracle and final-output canvases are test infrastructure, not game backing stores.
 const actual=createCanvas(844,390),reference=createCanvas(844,390),referenceDynamic=createCanvas(1688,780);
 const ctx=dynamic.getContext('2d');let paintPasses=0,saveDepth=0;
 // Count facade-level clips only. Asphalt has its own nested clips and is not
 // another facade pass (important when the far viewport extends below the art).
 const save=ctx.save.bind(ctx),restore=ctx.restore.bind(ctx),clip=ctx.clip.bind(ctx);
 ctx.save=()=>{saveDepth++;return save();};
 ctx.restore=()=>{saveDepth--;return restore();};
 ctx.clip=(...args)=>{if(saveDepth===2)paintPasses++;return clip(...args);};
 function clear(canvas){const context=canvas.getContext('2d');context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);return context;}
 function composite(canvas,frame,skyOnly=false){
  const context=clear(canvas),q=Math.fround,z=q(frame.zoom);
  const camX=q(frame.width/2-z*frame.width/2),camY=q(frame.height/2-z*frame.height/2);
  const scrollX=frame.x-frame.width/2,scrollY=frame.y-frame.height/2;
  for(const d of displays.filter(d=>d.visible&&(!skyOnly||d.depth===-9)).sort((a,b)=>a.depth-b.depth)){
   const source=textures.get(d.key).getCanvas(),[x,y,w,h]=d.crop||[0,0,source.width,source.height];
   const sx=q(d.width/source.width),sy=q(d.height/source.height);
   const tx=q(q(q(d.x)-scrollX)*z+camX),ty=q(q(q(d.y)-scrollY)*z+camY);
   context.save();context.setTransform(q(z*sx)*(d.flip?-1:1),0,0,q(z*sy),tx,ty);
   context.drawImage(source,x,y,w,h,d.flip?x-source.width:x,y,w,h);context.restore();
  }
  return context;
 }
 function transform(canvas,frame,bg){
  const context=clear(canvas),scale=frame.zoom*2;
  context.setTransform(scale,0,0,scale,-bg.camera*scale,-bg.top*scale);return context;
 }
 function draw(frame){
  const bg=depthBackdropLayout(frame);
  const ready=renderer.draw(bg,frame.zoom*2,frame.zoom*2,null,{width:844,height:390,touch:true});
  return {bg,ready,diagnostics:renderer.diagnostics};
 }
 function paint(frame,bg){
  paintPasses=0;const context=transform(dynamic,frame,bg);
  const painted=renderer.paintPending(context,bg);
  composite(actual,frame).drawImage(dynamic,0,0,844,390);
  return {painted,paintPasses};
 }
 function paintReference(frame,bg){
  const context=transform(referenceDynamic,frame,bg);
  context.translate(bg.camera,0);drawChallengeBackdrop(context,images,{...bg,facadeOnly:true});
  composite(reference,frame,true).drawImage(referenceDynamic,0,0,844,390);
  return reference;
 }
 function dispose(){renderer.invalidateSurface();for(const canvas of [...allocated,actual,reference,referenceDynamic]){canvas.width=1;canvas.height=1;}}
 return {images,scene,renderer,allocated,textures,displays,dynamic,actual,reference,draw,paint,paintReference,dispose};
}

export function boundaryRows(actual,reference,frame,bg){
 const width=actual.width,height=actual.height;
 const a=actual.getContext('2d').getImageData(0,0,width,height).data;
 const b=reference.getContext('2d').getImageData(0,0,width,height).data,rows=[];
 for(let worldY=Math.ceil(bg.top/256)*256;worldY<bg.bottom;worldY+=256){
  const center=Math.floor((worldY-bg.top)*frame.zoom);
  for(let y=Math.max(0,center-1);y<=Math.min(height-1,center+1);y++){
   let delta=0,bias=0;
   for(let x=0;x<width;x++)for(let c=0;c<3;c++){const d=a[(y*width+x)*4+c]-b[(y*width+x)*4+c];delta+=Math.abs(d);bias+=d;}
   rows.push({worldY,y,mean:delta/(width*3),brightBias:bias/(width*3)});
  }
 }
 return rows;
}
