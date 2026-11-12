import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {partialViews,streetFrame,partialStreetFixture,boundaryRows} from './helpers/street-partial-compositor.mjs';
const rasterHash=canvas=>createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');

function drain(f,frame,visit=()=>{}){
 for(let stage=0;stage<64;stage++){
  const state=f.draw(frame);visit(state,stage);
  assert.ok(state.diagnostics.lastBuildPixels<=4*1024*1024,'unchanged per-frame build bound');
  assert.ok(state.diagnostics.pixels<=32*1024*1024,'unchanged managed surface bound');
  if(state.ready&&state.diagnostics.pending===0)return state;
 }
 assert.fail('bounded filling did not converge');
}

for(const [name,view] of Object.entries(partialViews))test(`${name}: every partial 2x-to-1x raster has uninterrupted RGB at visible row boundaries`,async t=>{
 const f=await partialStreetFixture();t.after(()=>f.dispose());
 const frame=streetFrame(view),failures=[],worldBoundaries=new Set();let partial=0,mixed=0;
 drain(f,frame,({bg,ready,diagnostics},stage)=>{
  const before=f.allocated.length,{painted}=f.paint(frame,bg);
  assert.equal(f.allocated.length,before,'pending paint allocates no new canvas');
  assert.equal(painted,!ready,'only incomplete visible coverage uses the dynamic facade');
  if(ready)return;
  partial++;
  const visibleRows=Math.ceil(bg.bottom/256)-Math.floor(bg.top/256);
  if(diagnostics.pendingBands.length<visibleRows)mixed++;
  assert.equal(diagnostics.reason,'partial');
  assert.ok(diagnostics.pendingBands.every(b=>b.bottom>b.top),'pending bands remain useful diagnostics');
  const rows=boundaryRows(f.actual,f.paintReference(frame,bg),frame,bg);
  for(const row of rows){worldBoundaries.add(row.worldY);if(row.mean>=.02)failures.push({stage,...row});}
 });
 assert.ok(partial>0,'exercise partial filling before ready coverage');
 assert.ok(mixed>0,'exercise cached-ready/pending mixtures, not just an entirely pending view');
 assert.deepEqual([...worldBoundaries],name==='near'?[0,256]:[0,256,512]);
 assert.deepEqual(failures,[],'each boundary row must have RGB mean delta < 0.02 against one continuous facade over the same sky');
});

test('partial frames hide all cached facades, keep sky, and use exactly one existing dynamic paint',async t=>{
 const f=await partialStreetFixture();t.after(()=>f.dispose());
 const frame=streetFrame(partialViews.near),failures=[];let mixed=0;
 // Pre-existing displays must also disappear when reset starts a new partial fill.
 drain(f,frame);const displays=f.displays.filter(d=>d.depth===-8);assert.ok(displays.length>0);
 f.renderer.reset();
 drain(f,frame,({bg,ready,diagnostics},stage)=>{
  const allocationCount=f.allocated.length,{painted,paintPasses}=f.paint(frame,bg);
  assert.equal(f.allocated.length,allocationCount);
  // Exactly the existing dynamic canvas, two original repair masks, pool and sky.
  assert.equal(f.allocated.length,f.textures.size+3,'no extra persistent backing surface');
  assert.ok(f.displays.some(d=>d.depth===-9&&d.visible),'sky stays visible throughout bounded filling');
  if(ready){assert.equal(painted,false);assert.equal(paintPasses,0);return;}
  if(diagnostics.pendingBands.length<Math.ceil(bg.bottom/256)-Math.floor(bg.top/256))mixed++;
  const visible=f.displays.filter(d=>d.depth===-8&&d.visible).length;
  if(visible||paintPasses!==1)failures.push({stage,visible,paintPasses});
 });
 assert.ok(mixed>0);assert.deepEqual(failures,[],'partial frames require zero cached facades and one uninterrupted dynamic pass');
});

test('visible-ready with offscreen prefetch pending immediately resumes cached facades and converges to reuse',async t=>{
 const f=await partialStreetFixture();t.after(()=>f.dispose());let prefetch=0;
 // Complete the visible composition first, then cross only a prefetch-row
 // boundary inside its coverage margin. Cold composition itself may need its
 // buffer rows, so it is no longer a reliable offscreen-only pending fixture.
 drain(f,streetFrame(partialViews.near));
 const frame=streetFrame({...partialViews.near,top:partialViews.near.top+64});
 drain(f,frame,({bg,ready,diagnostics})=>{
  if(!ready||diagnostics.pending===0)return;
  prefetch++;assert.deepEqual(diagnostics.pendingBands,[]);
  assert.notEqual(diagnostics.reason,'partial');
  assert.ok(f.displays.some(d=>d.depth===-8&&d.visible));
  assert.deepEqual(f.paint(frame,bg),{painted:false,paintPasses:0},'offscreen pending must not paint the facade');
 });
 assert.ok(prefetch>0,'fixture actually exercises visible-ready/offscreen-pending');
 const builds=f.renderer.diagnostics.builds,allocations=f.allocated.length;
 for(let i=0;i<120;i++){
  const {bg,ready,diagnostics}=f.draw(frame);assert.equal(ready,true);assert.equal(diagnostics.reason,'reuse');
  assert.equal(diagnostics.lastBuildPixels,0);assert.equal(diagnostics.pending,0);
  assert.equal(f.paint(frame,bg).painted,false);
 }
 assert.equal(f.renderer.diagnostics.builds,builds);assert.equal(f.allocated.length,allocations);
});

test('reset and same-size surface loss restore partial and final raster without retaining facade fragments',async t=>{
 const f=await partialStreetFixture();t.after(()=>f.dispose());const frame=streetFrame(partialViews.far);
 let first=f.draw(frame);assert.equal(first.ready,false);f.paint(frame,first.bg);
 const firstPixels=rasterHash(f.actual);
 const settled=drain(f,frame);f.paint(frame,settled.bg);const readyPixels=rasterHash(f.actual);
 for(const invalidation of ['reset','same-size loss']){
  if(invalidation==='same-size loss')for(const canvas of f.allocated)canvas.width=canvas.width;
  if(invalidation==='reset')f.renderer.reset();else f.renderer.invalidateSurface();
  assert.ok(f.displays.every(d=>!d.visible));
  assert.ok([...f.textures.values()].every(t=>t.width===1&&t.height===1));
  assert.equal(f.renderer.paintPending(f.dynamic.getContext('2d'),settled.bg),false);
  first=f.draw(frame);assert.equal(first.ready,false);f.paint(frame,first.bg);
  assert.equal(rasterHash(f.actual),firstPixels,'partial recovery returns to the same original-art pixels');
  assert.ok(f.displays.every(d=>d.depth!==-8||!d.visible),'no stale facade fragments during recovery');
  const complete=drain(f,frame);f.paint(frame,complete.bg);
  assert.equal(rasterHash(f.actual),readyPixels,'complete recovery preserves unchanged ready pixels');
  const live=f.allocated.filter(c=>c.width*c.height>1);
  const liveTextures=[...f.textures.values()].filter(t=>t.width*t.height>1).length;
  assert.equal(live.length,liveTextures+3,'only live textures, the dynamic canvas and two repair masks remain');
 }
});
