import {performance} from 'node:perf_hooks';
import {partialStreetFixture,streetFrame} from './helpers/street-partial-compositor.mjs';
import {createDepthBackdropRenderer as baseline} from './helpers/baseline-cache-69.mjs';
import {createDepthBackdropRenderer as candidate} from '../dist/challenge-backdrop-cache.mjs';
const summarize=a=>{const s=a.toSorted((a,b)=>a-b);return {n:a.length,p50:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1)}};
const results=[];
for(let round=0;round<2;round++)for(const [name,factory] of (round?[['candidate',candidate],['baseline69',baseline]]:[['baseline69',baseline],['candidate',candidate]])){
 const f=await partialStreetFixture(factory),all=[],partial=[],ready=[];
 for(let i=0;i<120;i++){
  // Small dynamic zoom and gentle tracking within the accepted near profile;
  // crossing the 256-unit row edge still exercises incremental cache fills.
  const zoom=.8*(.95+.05*Math.cos(i*.08)),frame=streetFrame({zoom,top:-4+12*Math.sin(i*.07)},144.416+i*2);
  const t=performance.now(),s=f.draw(frame);f.paint(frame,s.bg);const cost=performance.now()-t;
  all.push(cost);(s.ready?ready:partial).push(cost);
 }
 results.push({round,name,all:summarize(all),ready:summarize(ready),partial:summarize(partial)});f.dispose();
}
console.log(JSON.stringify({scope:'Native Skia surrogate; 120 moving/zooming frames, reversed benchmark order, no browser/CSS rotation/iPhone FPS claim',results},null,2));
