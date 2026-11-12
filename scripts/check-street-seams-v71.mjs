/** Real native Canvas regression for retained tiles at fractional screen edges.
 * Pass an installed @napi-rs/canvas/index.js path, as for the render benchmark.
 * Uses production tile construction and a Canvas compositor matching its
 * origin-zero image positions, sizes, camera transform and horizontal flips.
 */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthBackdropLayout,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
const modulePath=process.argv[2];if(!modulePath)throw new Error('Pass an installed @napi-rs/canvas module path.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(modulePath)));
const image=await loadImage(new URL('../dist/assets/challenge/street-deep-v2.webp',import.meta.url).pathname);
const results=[];
for(const [width,height,playerX,playerY,depth]of [[1200,750,1100,430,0],[390,592,1800,430,0],[390,592,1800,250,-90]]){
 const textures=new Map(),tiles=[];
 const scene={textures:{createCanvas(key,w,h){const canvas=createCanvas(w,h),texture={canvas,width:w,height:h,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,setSize(w,h){canvas.width=this.width=w;canvas.height=this.height=h;},refresh(){}};textures.set(key,texture);return texture;}},add:{image(x,y,key){const im={key,visible:true,setOrigin(){return this;},setDepth(){return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.width=w;this.height=h;return this;},setFlipX(v){this.flipX=v;return this;},setVisible(v){this.visible=v;return this;}};tiles.push(im);return im;}}};
 const renderer=createDepthBackdropRenderer(scene,{'challenge-street-deep':image}),route={player:{x:playerX,y:playerY,depth},worldWidth:3600},frame=depthRouteCameraFrame(width,height,route),bg=depthBackdropLayout(frame);
 const ratio=Math.max(1,Math.min(2,2560/width,1800/height));renderer.draw(bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);
 const output=createCanvas(width,height),ctx=output.getContext('2d');ctx.scale(frame.zoom,frame.zoom);ctx.translate(-bg.camera,-bg.top);
 for(const tile of tiles.filter(t=>t.visible)){ctx.save();ctx.translate(tile.x,tile.y);if(tile.flipX){ctx.translate(tile.width,0);ctx.scale(-1,1);}ctx.drawImage(textures.get(tile.key).canvas,0,0,tile.width,tile.height);ctx.restore();}
 const pixels=ctx.getImageData(0,0,width,height).data;let minAlpha=255,badPixels=0;
 // Exclude the viewport border; test the interior where adjacent tiles meet.
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){const a=pixels[(y*width+x)*4+3];minAlpha=Math.min(minAlpha,a);if(a<255)badPixels++;}
 results.push({viewport:[width,height],playerX,playerY,depth,minAlpha,badPixels,cache:[...textures.values()].map(t=>[t.width,t.height])});
}
console.log(JSON.stringify(results,null,2));
for(const result of results)assert.equal(result.minAlpha,255,`retained tile coverage must stay opaque at ${result.viewport.join('×')} x=${result.playerX} y=${result.playerY}`);
