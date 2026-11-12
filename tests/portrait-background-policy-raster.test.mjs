import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {CHALLENGE_ART_FILES,drawChallengeBackdrop} from '../dist/challenge-art.mjs';
import {nativeScene} from './helpers/policy-native-scene.mjs';
import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
const shared=await import(`../dist/preview/campaign/street-static-cache.mjs?v=${RUNTIME_VERSION}`);
const presentation=policy=>({width:844,height:390,touch:policy==='finite'});
const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
function poison(ctx){ctx.save();ctx.save();ctx.beginPath();ctx.rect(0,0,1,1);ctx.clip();throw new Error('nested policy cache fault');}
function settle(r,bg,profile){for(let i=0;i<64;i++){if(r.draw(bg,1,1,{width:300,height:300,scaleX:1.5,scaleY:1.5,top:-900,bottom:400},profile)&&!r.diagnostics.pending)return;}assert.fail('cache must converge');}
test('both main policies and transition faults recover complete original-art raster, not only alpha',async()=>{
 const images={};for(const key of ['challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair'])images[key]=await loadImage(new URL('../dist/assets/'+CHALLENGE_ART_FILES[key],import.meta.url).pathname);
 const f=nativeScene(),r=createDepthBackdropRenderer(f.scene,images),output=createCanvas(300,300),bg={width:300,height:300,camera:1040.25,top:-301.25,bottom:-1.25,curbY:346.5,buildingHeight:489};
 const reference=createCanvas(300,300),brush=reference.getContext('2d');brush.translate(0,-bg.top);drawChallengeBackdrop(brush,images,bg);const original=pixels(reference);
 try{for(const policy of ['retained','finite','retained']){
  const profile=presentation(policy);settle(r,bg,profile);f.composite(output.getContext('2d'),bg,1);const expected=Uint8ClampedArray.from(pixels(output));assert.ok(new Set(expected).size>100);let delta=0,large=0;for(let i=0;i<expected.length;i++){delta+=Math.abs(expected[i]-original[i]);if(Math.abs(expected[i]-original[i])>30)large++;if(i%4===3)assert.equal(expected[i],255,'complete visible original art');}assert.ok(delta/expected.length<4);assert.ok(large/expected.length<.025);
  for(let attempt=0;attempt<2;attempt++){
   r.reset();const t=f.textures.get('challenge-depth-backdrop'),ctx=t.getContext(),draw=ctx.drawImage;ctx.drawImage=function(...args){this.drawImage=draw;poison(this);};
   assert.throws(()=>r.draw(bg,1,1,{width:300,height:300,scaleX:1.5,scaleY:1.5,top:-900,bottom:400},profile),/nested policy cache fault/);
   r.invalidateSurface();assert.ok([...f.textures.values()].every(t=>t.width===1&&t.height===1),'partially built offscreen backing must also be released');assert.equal(r.diagnostics.pending,0);assert.equal(r.diagnostics.lastBuildPixels,0);
  }
  settle(r,bg,profile);f.composite(output.getContext('2d'),bg,1);assert.deepEqual(pixels(output),expected,'recovered complete original artwork before any paint acknowledgment');
 }}finally{r.invalidateSurface();for(const c of f.allocated){c.width=1;c.height=1;}}
});

const assetFiles={2:['chapter2/chapter2-market-arcade-v1.png','chapter2/chapter2-market-arcade-sky-r4.png','chapter2/chapter2-market-arcade-seam-r5.png'],3:['chapter3/parade-street-v1.png','chapter3/chapter3-parade-street-sky-r2.png','chapter3/chapter3-parade-street-seam-r2.png'],4:['chapter4/chapter4-civic-arcade-v1.png','chapter4/chapter4-civic-arcade-sky-r2.png','chapter4/chapter4-civic-arcade-seam-r2.png']};
for(const chapter of [2,3,4])test(`chapter ${chapter} native original pixels survive retained/finite/+90 transitions and nested cache faults`,async()=>{
 const mod=await import(`../dist/preview/chapter${chapter}/street-backdrop.mjs`),sources=await Promise.all(assetFiles[chapter].map(file=>loadImage(new URL(`../dist/preview/chapter${chapter}/assets/${file}`,import.meta.url).pathname))),canvas=createCanvas(600,600),ctx=canvas.getContext('2d'),allocated=[];let fail=false,releaseCheck=null;
 canvas.ownerDocument={createElement(){if(releaseCheck){assert.ok(releaseCheck.every(c=>c.width===1&&c.height===1),'paper/source/street of old policy released before first replacement allocation');releaseCheck=null;}const c=createCanvas(1,1),b=c.getContext('2d'),draw=b.drawImage;allocated.push(c);b.drawImage=function(...args){if(fail){fail=false;poison(this);}return draw.apply(this,args);};return c;}};
 const identity={},draw=(policy,rotate)=>{ctx.setTransform(rotate?0:2,rotate?2:0,rotate?-2:0,rotate?0:2,rotate?600:0,0);mod.drawStreetBackdrop(ctx,...[sources[0],{zoom:.5,backdropZoom:.7,left:1050,base:330,backdropScene:identity,presentation:presentation(policy)},300,300,chapter===2?695:700,sources[1],sources[2],0]);};
 try{let last=null;for(const [policy,rotate] of [['retained',false],['finite',false],['retained',false],['finite',true],['retained',true]]){
  if(last!==null&&last!==policy)releaseCheck=allocated.filter(c=>c.width>1);draw(policy,rotate);last=policy;
  assert.equal(shared.streetStaticCacheDiagnostics(ctx).policy,policy);assert.ok(shared.streetStaticCacheDiagnostics(ctx).density>=2*(policy==='retained'?.7:.5));
  const expected=Uint8ClampedArray.from(pixels(canvas));assert.ok(new Set(expected).size>100);
  shared.invalidateStreetStaticCaches(ctx);fail=true;assert.throws(()=>draw(policy,rotate),/nested policy cache fault/);shared.invalidateStreetStaticCaches(ctx);assert.ok(allocated.every(c=>c.width===1&&c.height===1),'all partially painted helper backings are released');
  canvas.width=canvas.width;draw(policy,rotate);assert.deepEqual(pixels(canvas),expected,'exact original source, extension, seam and paper pixels after reset');
 }}finally{shared.invalidateStreetStaticCaches(ctx);for(const c of allocated){c.width=1;c.height=1;}}
});
