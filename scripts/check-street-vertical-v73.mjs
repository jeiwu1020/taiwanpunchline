/** Real pixels from retained production tiles across lane travel and jumps.
 * This native Canvas compositor matches Phaser's origin-zero tile geometry;
 * it does not measure the browser's render loop or GPU behavior. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthBackdropLayout,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
if(!process.argv[2])throw new Error('Pass an installed @napi-rs/canvas module path.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(process.argv[2])));
const image=await loadImage(new URL('../dist/assets/challenge/street-deep-v2.webp',import.meta.url).pathname),results=[];
for(const [width,height]of [[1200,750],[1920,1080],[390,592],[844,354]]){
 const textures=new Map(),tiles=[];let refreshes=0,resizes=0;
 const scene={textures:{createCanvas(key,w,h){const canvas=createCanvas(w,h),texture={canvas,width:w,height:h,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,setSize(w,h){resizes++;canvas.width=this.width=w;canvas.height=this.height=h;},refresh(){refreshes++;}};textures.set(key,texture);return texture;}},add:{image(x,y,key){const tile={key,visible:true,setOrigin(){return this;},setDepth(){return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.width=w;this.height=h;return this;},setFlipX(v){this.flipX=v;return this;},setVisible(v){this.visible=v;return this;}};tiles.push(tile);return tile;}}};
 const renderer=createDepthBackdropRenderer(scene,{'challenge-street-deep':image}),ratio=Math.max(1,Math.min(2,2560/width,1800/height)),output=createCanvas(width,height),ctx=output.getContext('2d');
 let minAlpha=255,badPixels=0,anchor;
 for(const [x,y,depth]of [[1100,430,0],[1250,430,100],[1550,430,-90],[1750,53,-90],[1450,169,0],[1400,430,100],[1100,430,0]]){
  const frame=depthRouteCameraFrame(width,height,{player:{x,y,depth},worldWidth:3600}),bg=depthBackdropLayout(frame);renderer.draw(bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);
  ctx.resetTransform();ctx.clearRect(0,0,width,height);ctx.scale(frame.zoom,frame.zoom);ctx.translate(-bg.camera,-bg.top);
  for(const tile of tiles.filter(t=>t.visible)){
   anchor??=tile.y;assert.equal(tile.y,anchor,'the same cached art stays fixed in world space');
   ctx.save();ctx.translate(tile.x,tile.y);if(tile.flipX){ctx.translate(tile.width,0);ctx.scale(-1,1);}ctx.drawImage(textures.get(tile.key).canvas,0,0,tile.width,tile.height);ctx.restore();
  }
  const pixels=ctx.getImageData(0,0,width,height).data;
  for(let py=2;py<height-2;py++)for(let px=2;px<width-2;px++){const alpha=pixels[(py*width+px)*4+3];minAlpha=Math.min(minAlpha,alpha);if(alpha<255)badPixels++;}
 }
 const result={viewport:[width,height],frames:7,minAlpha,badPixels,refreshes,resizes,texture:[...textures.values()].map(t=>[t.width,t.height])};results.push(result);
 assert.equal(minAlpha,255,'walking/jump/landing coverage must remain opaque');assert.equal(refreshes,1,'all seven real-art views reuse the same raster');assert.equal(resizes,1,'only initial allocation may resize');
}
console.log(JSON.stringify(results,null,2));
