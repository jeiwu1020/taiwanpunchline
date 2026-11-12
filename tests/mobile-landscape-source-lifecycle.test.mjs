import rawTest from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
const {invalidateStreetStaticCaches,streetStaticCacheDiagnostics}=await import(`../dist/preview/campaign/street-static-cache.mjs?v=${RUNTIME_VERSION}`);

function fixture(policy){
 const canvas=createCanvas(1688,780),ctx=canvas.getContext('2d'),allocated=[],sources=[];
 canvas.ownerDocument={createElement(){const c=createCanvas(1,1);allocated.push(c);return c;}};
 ctx.setTransform(2,0,0,2,0,0);ctx.drawImage=()=>{};
 const source=(w,h)=>{const c=createCanvas(w,h);sources.push(c);return c;};
 return {ctx,allocated,source,presentation:{width:844,height:390,touch:policy==='finite'},scene(index=0){return {image:source(1536,1024),extension:source(768,1536),seam:source(1024,1536),edge:index===2?source(768,768):null,identity:{},index};},dispose(){invalidateStreetStaticCaches(ctx);for(const c of [...allocated,...sources,canvas]){c.width=1;c.height=1;}}};
}
const masks=f=>f.allocated.filter(c=>(c.width===768&&[2304,3072].includes(c.height))||(c.width===1536&&[96,256].includes(c.height)));
const pixels=canvases=>canvases.reduce((n,c)=>n+c.width*c.height,0);
function draw(mod,f,s,{base=296.4,zoom=.8,width=844,height=390,curb=700}={}){
 return mod.drawStreetBackdrop(f.ctx,s.image,{zoom,left:300,base,backdropScene:s.identity,presentation:f.presentation},width,height,curb,s.extension,s.seam,s.index,s.edge);
}
for(const policy of ['retained','finite']){
 const test=(name,run)=>rawTest(policy+': '+name,run);
for(const chapter of [2,3,4])test(`chapter ${chapter}: three bypass scenes release stale source helpers and fit the reservation`,async()=>{
 const mod=await import(`../dist/preview/chapter${chapter}/street-backdrop.mjs`),f=fixture(policy);
 try{let old=[];for(let index=0;index<3;index++){
  const s=f.scene(index),options=chapter===2?{curb:[695,700,690][index]}:{};draw(mod,f,s,options);
  assert.ok(old.every(c=>c.width===1&&c.height===1),'previous bypass scene helpers are released before the next scene');
  const live=masks(f),diag=streetStaticCacheDiagnostics(f.ctx);assert.ok(live.length>0,'original helper masks are still cached');assert.equal(diag.tiles,0,'the scene really used native-image bypass');assert.ok(pixels(live)<=diag.reservedMaskPixels,'one current set of helpers, not every historical source');
  const count=f.allocated.length;for(let i=0;i<20;i++)draw(mod,f,s,options);assert.equal(f.allocated.length,count,'same-source bypass reuses helper pixels each frame');old=live;
 }}finally{f.dispose();}
});
test('bypass to cached to bypass preserves unchanged helpers, then releases them on scene replacement',async()=>{
 const mod=await import('../dist/preview/chapter3/street-backdrop.mjs'),f=fixture(policy),s=f.scene(0);
 try{draw(mod,f,s);const originalSeam=masks(f)[0];draw(mod,f,s,{base:500});assert.ok(streetStaticCacheDiagnostics(f.ctx).tiles>0);assert.equal(originalSeam.width,768,'merely becoming cached does not discard an unchanged source');
 const count=f.allocated.length;for(let i=0;i<20;i++){draw(mod,f,s);draw(mod,f,s,{base:500});}assert.equal(f.allocated.length,count,'same identity does not repeatedly rebuild during bypass changes');
 const old=masks(f);draw(mod,f,f.scene(1));assert.ok(old.every(c=>c.width===1&&c.height===1));assert.equal(streetStaticCacheDiagnostics(f.ctx).tiles,0);assert.ok(pixels(masks(f))<=streetStaticCacheDiagnostics(f.ctx).reservedMaskPixels);
 }finally{f.dispose();}
});
for(const change of ['seam','edge','extension','source','scene identity','scene index','viewport','DPR'])test(`bypassed source ownership notices ${change} without an allocated street bitmap`,async()=>{
 const mod=await import('../dist/preview/chapter3/street-backdrop.mjs'),f=fixture(policy),s=f.scene(2);
 try{draw(mod,f,s);const old=masks(f);let options={};
  if(change==='seam')s.seam=f.source(1024,1536);if(change==='edge')s.edge=f.source(768,768);if(change==='extension')s.extension=f.source(768,1536);if(change==='source')s.image=f.source(1536,1024);if(change==='scene identity')s.identity={};if(change==='scene index')s.index=1;if(change==='viewport')options.width=843;if(change==='DPR')f.ctx.setTransform(3,0,0,3,0,0);
  draw(mod,f,s,options);assert.ok(old.every(c=>c.width===1&&c.height===1),'obsolete helpers must not outlive ownership');assert.ok(pixels(masks(f))<=streetStaticCacheDiagnostics(f.ctx).reservedMaskPixels);
 }finally{f.dispose();}
});
test('budget fallback owns and replaces source helpers without allocating street tiles',async()=>{
 const mod=await import('../dist/preview/chapter3/street-backdrop.mjs'),f=fixture(policy),options={zoom:100,base:55000};
 try{const first=f.scene(2);draw(mod,f,first,options);assert.equal(streetStaticCacheDiagnostics(f.ctx).tiles,0);const old=masks(f);assert.ok(old.length>=2,'fallback actually prepares original transition and seam helpers');
 const count=f.allocated.length;for(let i=0;i<10;i++)draw(mod,f,first,options);assert.equal(f.allocated.length,count,'unchanged budget fallback still reuses original helpers');draw(mod,f,f.scene(2),options);assert.ok(old.every(c=>c.width===1&&c.height===1));assert.ok(pixels(masks(f))<=streetStaticCacheDiagnostics(f.ctx).reservedMaskPixels);
 }finally{f.dispose();}
});

}
