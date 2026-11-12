/** Native Canvas raster workload, not browser timing or FPS. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthRouteCameraFrame,depthBackdropLayout} from '../dist/challenge-depth-render.mjs';
if(!process.argv[2])throw new Error('Pass an installed @napi-rs/canvas module path.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(process.argv[2])));
const image=await loadImage(new URL('../dist/assets/challenge/street-deep-v2.webp',import.meta.url).pathname);
for(const [width,height] of [[1200,750],[1920,1080]])for(const direction of ['horizontal','vertical']){
 let refreshes=0,resizes=0,texture;
 const scene={textures:{createCanvas(key,w,h){const canvas=createCanvas(w,h);return texture={width:w,height:h,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,setSize(w,h){resizes++;this.width=canvas.width=w;this.height=canvas.height=h;},refresh(){refreshes++;}};}},add:{image(){return {setOrigin(){return this;},setDepth(){return this;},setPosition(){return this;},setDisplaySize(){return this;},setFlipX(){return this;},setVisible(){return this;}};}}};
 const renderer=createDepthBackdropRenderer(scene,{'challenge-street-deep':image}),ratio=Math.max(1,Math.min(2,2560/width,1800/height)),times=[],tops=[],sizes=[];let firstFrameMs;
 for(let i=0;i<150;i++){
  const depth=direction==='vertical'?Math.sin(i*.05)*90:0,route={player:{x:1100+i*2,y:430,depth},worldWidth:3600},bg=depthBackdropLayout(depthRouteCameraFrame(width,height,route)),start=performance.now();
  renderer.draw(bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);
  const elapsed=performance.now()-start;if(i===0)firstFrameMs=elapsed;if(i>=30)times.push(elapsed);tops.push(bg.top);sizes.push(texture.height);
 }
 times.sort((a,b)=>a-b);
 console.log(JSON.stringify({width,height,direction,frames:150,warmup:30,refreshes,resizes,texture:[texture.width,texture.height],rawBytes:texture.width*texture.height*4,topRange:[Math.min(...tops),Math.max(...tops)],heightRange:[Math.min(...sizes),Math.max(...sizes)],firstFrameMs,mean:times.reduce((a,b)=>a+b)/times.length,p50:times[60],p95:times[114]}));
}
