/** Native Skia Canvas CPU workload only, not a browser/GPU/FPS measurement.
 * Usage: node scripts/benchmark-street-render-v71.mjs /absolute/path/to/@napi-rs/canvas/index.js
 * Keeps the production paint function and real decoded project assets.
 */
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {paintDepthRoute,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {ART_FILES as fighterArt} from '../dist/art-render.mjs';
import {ART_FILES as streetArt} from '../dist/challenge-art.mjs';
const modulePath=process.argv[2];if(!modulePath)throw new Error('Pass an installed @napi-rs/canvas module path. This diagnostic adds no production dependency.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(modulePath)));
const images=Object.fromEntries(await Promise.all(Object.entries({...fighterArt,...streetArt}).map(async([key,file])=>[key,await loadImage(new URL('../dist/assets/'+file,import.meta.url).pathname)])));
const route=new ChallengeRoute('wang','easy',()=>.2);route.depthMode=true;route.player.x=1100;route.spawn();route.enemies.forEach((f,i)=>{f.x=1150+i*65;f.depth=-50+i*40;});
const summarize=values=>{const s=[...values].sort((a,b)=>a-b);return {mean:+(s.reduce((a,b)=>a+b,0)/s.length).toFixed(3),p50:+s[Math.floor(s.length*.5)].toFixed(3),p95:+s[Math.floor(s.length*.95)].toFixed(3)};};
const results=[];
for(const [width,height]of [[960,540],[1200,750],[1920,1080]]){
 const ratio=Math.max(1,Math.min(2,2560/width,1800/height)),pw=Math.ceil(width*ratio),ph=Math.ceil(height*ratio),canvas=createCanvas(pw,ph),ctx=canvas.getContext('2d');
 const drawImage=ctx.drawImage.bind(ctx),labelSlots=new Map(),samples=[],bgSamples=[];let backgroundTime=0;
 ctx.drawImage=function(image,...args){if(image!==images['challenge-street-deep'])return drawImage(image,...args);const start=performance.now();const result=drawImage(image,...args);backgroundTime+=performance.now()-start;return result;};
 for(let i=0;i<150;i++){
  const t=i*1000/60;route.player.x=1100+Math.sin(t*.00035)*150;route.player.move=1;route.enemies.forEach((f,j)=>{f.move=1;f.x=1150+j*65+Math.sin(t*.0007+j)*30;});
  const frame=depthRouteCameraFrame(width,height,route),ww=width/frame.zoom,hh=height/frame.zoom;const start=performance.now();backgroundTime=0;
  ctx.clearRect(0,0,pw,ph);ctx.fillStyle='#efd8af';ctx.fillRect(0,0,pw,ph);ctx.save();ctx.scale(pw/ww,ph/hh);ctx.translate(-(frame.x-ww/2),-(frame.y-hh/2));paintDepthRoute(ctx,images,route,t,frame,{labelSlots});ctx.restore();
  if(i>=30){samples.push(performance.now()-start);bgSamples.push(backgroundTime);}
 }
 results.push({viewport:[width,height],texture:[pw,ph],pixels:pw*ph,actors:1+route.enemies.length,frames:samples.length,drawMs:summarize(samples),backdropDrawImageMs:summarize(bgSamples)});
}
console.log(JSON.stringify({scope:'Native Skia CPU drawing, not browser or Phaser frame timing; real assets and production paint function.',results},null,2));
