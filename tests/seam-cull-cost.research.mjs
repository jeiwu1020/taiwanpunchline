import {performance} from 'node:perf_hooks';
import {partialStreetFixture,partialViews,streetFrame} from './helpers/street-partial-compositor.mjs';
import {createDepthBackdropRenderer as baseline} from './helpers/baseline-cache-69.mjs';
import {createDepthBackdropRenderer as candidate} from '../dist/challenge-backdrop-cache.mjs';
const stats=a=>{a.sort((a,b)=>a-b);return {n:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
const result={scope:'Native Skia CPU raster only. Not browser or iPhone FPS.',cases:[]};
for(const [name,factory] of [['baseline69',baseline],['candidate',candidate]]){
 const f=await partialStreetFixture(factory),partial=[],ready=[];let pendingFrames=0,steadyFrames=0;
 for(let cycle=0;cycle<8;cycle++){
  f.renderer.reset();
  for(let i=0;i<35;i++){
   const frame=streetFrame(partialViews[cycle%2?'far':'near'],144.416+i*.5),t=performance.now();
   const s=f.draw(frame);f.paint(frame,s.bg);const cost=performance.now()-t;
   (s.ready?ready:partial).push(cost);s.ready?steadyFrames++:pendingFrames++;
  }
 }
 result.cases.push({name,partial:stats(partial),ready:stats(ready),pendingFrames,steadyFrames});f.dispose();
}
console.log(JSON.stringify(result,null,2));
