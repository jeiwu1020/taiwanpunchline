import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createDepthBackdropRenderer as current} from '../dist/challenge-backdrop-cache.mjs';
import {createDepthBackdropRenderer as published} from './helpers/baseline-cache-69.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';

// #67 introduced the finite policy. #69 retained that exact implementation.
// Freeze the independent historical oracle, not the evolving production file.
// New warm composition is authorized; density, ownership, bounds, fallback,
// unmodified presentation routes, and raster fidelity remain protected.
const publishedCommit='806f00c3f16d51708c7bd52f4da8ca57825f7b89';
const publishedSha='dcff84704a5249a4c85bd6fb1566d252ef40c092825ad73131d52cf0a9787867';
const Mi=1024*1024;
const phone={width:844,height:390,touch:true};
const base={width:1000,height:780,camera:1030.25,top:-315.25,bottom:464.75,curbY:346.5,buildingHeight:489};
function fixture(factory=current,layered=true){
 const f=sceneFixture(),art={...artImages};
 const doc=f.scene.sys.game.canvas.ownerDocument,create=doc.createElement.bind(doc);
 doc.createElement=tag=>{const canvas=create(tag),get=canvas.getContext.bind(canvas);canvas.getContext=(...args)=>{const ctx=get(...args);ctx.createLinearGradient=()=>({addColorStop(){}});return ctx;};return canvas;};
 if(layered)for(const name of ['facade','sky','left-repair','right-repair'])art['challenge-street-'+name]={id:name,width:1536,height:1024};
 const add=f.scene.add.image.bind(f.scene.add);
 f.scene.add.image=(...args)=>{const d=add(...args);d.setCrop=(...v)=>{d.crop=v.length?v:null;return d;};return d;};
 return {...f,art,renderer:factory(f.scene,art)};
}
const visible=f=>f.images.filter(d=>d.visible&&d.depth===-8);
const snapshotHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const texturePixels=f=>[...f.textures.values()].reduce((n,t)=>n+t.width*t.height,0);
function finiteEnvelope(f,bg,z){
 const d=f.renderer.diagnostics,sw=Math.max(1,Math.round(bg.width*z)),sh=Math.max(1,Math.round(bg.height*z)),budget=Math.min(32*Mi,Math.max(24*Mi,sw*sh*8));
 assert.ok(d.pixels<=budget,'all managed surfaces share the published budget');
 for(const [key,t] of f.textures){assert.ok(t.width<=8192&&t.height<=8192,'native Canvas dimension limit');if(key.startsWith('challenge-depth-backdrop')&&!key.includes('-joined-'))assert.ok(t.width*t.height<=4*Mi,'source rows retain their published allocation limit');}
 if(d.reason!=='budget')assert.ok(d.pixels>=texturePixels(f)+sw*sh+2*536*715,'account for source rows, joined surfaces, sky, dynamic surface and repair masks');
 assert.ok(d.lastBuildPixels<=4*Mi,'bounded fill work per draw');
}
function coverage(f,bg,z){
 const rects=visible(f).map(d=>{const t=f.textures.get(d.key),sx=t.width/d.width,sy=t.height/d.height,[x,y,w,h]=d.crop||[0,0,t.width,t.height];assert.ok(sx+1e-8>=z&&sy+1e-8>=z,'source density never drops below current projection');return {left:d.x+x/sx,right:d.x+(x+w)/sx,top:d.y+y/sy,bottom:d.y+(y+h)/sy};});
 assert.ok(rects.length);const ys=[bg.top,bg.bottom,...rects.flatMap(r=>[r.top,r.bottom]).filter(y=>y>bg.top&&y<bg.bottom)].sort((a,b)=>a-b);
 for(let i=1;i<ys.length;i++){if(ys[i]===ys[i-1])continue;const y=(ys[i]+ys[i-1])/2,spans=rects.filter(r=>r.top<=y&&r.bottom>=y).sort((a,b)=>a.left-b.left);let right=bg.camera;for(const s of spans){assert.ok(s.left<=right+1e-7,'no uncovered horizontal span');right=Math.max(right,s.right);}assert.ok(right>=bg.camera+bg.width-1e-7,'full viewport coverage');}
 // Observable guarantee: the visible facade has no internal horizontal
 // projected edges, independent of texture keys or the number of source rows.
 assert.ok(rects.every(r=>r.top<=bg.top&&r.bottom>=bg.bottom),'one continuous vertical extent per projected world column');
}
function settle(f,bg=base,z=1,presentation=phone){
 let partial=0;
 for(let i=0;i<64;i++){
  const ok=f.renderer.draw(bg,z,z,null,presentation),d=f.renderer.diagnostics;
  if(d.policy==='finite')finiteEnvelope(f,bg,z);
  if(!ok&&d.reason==='partial'){partial++;assert.equal(visible(f).length,0,'partial facade hides every cached fragment');assert.ok(f.images.some(d=>d.depth===-9&&d.visible),'partial facade keeps sky');}
  if(ok&&d.pending===0)return {calls:i+1,partial};
 }
 assert.fail('finite work converges within 64 draws');
}
function snapshot(f){
 const d=f.renderer.diagnostics;
 return {textures:[...f.textures].map(([key,t])=>({key,width:t.width,height:t.height})),displays:f.images.map(v=>({key:v.key,visible:v.visible,depth:v.depth,x:v.x,y:v.y,width:v.width,height:v.height,flipX:v.flipX,crop:v.crop})),paint:f.draws.map(d=>({source:d.image.id??{width:d.image.width,height:d.image.height},args:d.args})),diagnostics:Object.fromEntries(['builds','releases','fallbacks','pendingFallbacks','pixels','lastBuildPixels','pending','reason','policy','policySwitches','budgetScope','pendingBands','tiles'].map(k=>[k,d[k]]))};
}
test('the historical oracle is still exact published #67 after import normalization',()=>{
 let imports=0;const source=readFileSync(new URL('./helpers/baseline-cache-69.mjs',import.meta.url),'utf8').replace(/^import (\{[^}\r\n]+\}) from '\.\.\/\.\.\/dist\/(background-cache-policy|street-seam-repair|challenge-art)\.mjs\?v=[^'\r\n]+';$/gm,(_,symbols,module)=>{imports++;return `import ${symbols} from './${module}.mjs?v=<runtime>';`;});
 assert.equal(imports,3);assert.equal(createHash('sha256').update(source).digest('hex'),publishedSha,publishedCommit);
});
for(const [name,presentation] of [['desktop',{width:844,height:390,touch:false}],['portrait',{width:390,height:844,touch:true}],['tall touch',{width:844,height:501,touch:true}],['unknown',undefined]])test(`${name}: retained allocations, world anchors and original paint calls match the frozen published oracle`,()=>{
 const a=fixture(current),b=fixture(published);let bg={...base};
 for(const step of ['initial','motion','extent','source','viewport','budget','recovery']){
  if(step==='motion')bg={...bg,camera:bg.camera+31.25,top:bg.top+3.5,bottom:bg.bottom+3.5};
  if(step==='extent')bg={...bg,top:bg.top-1000,bottom:bg.bottom+1000,height:bg.height+2000};
  if(step==='source')for(const f of [a,b])f.art['challenge-street-facade']={id:'replacement',width:1536,height:1024};
  if(step==='viewport')bg={...bg,width:bg.width+1};
  if(step==='budget')bg={...base,width:20000,height:20000,bottom:base.top+20000};
  if(step==='recovery')bg={...base};
  assert.equal(a.renderer.draw(bg,1,1,null,presentation),b.renderer.draw(bg,1,1,null,presentation));assert.equal(snapshotHash(snapshot(a)),snapshotHash(snapshot(b)),step);
 }
});
test('legacy optional-art finite rows retain published density, allocation, projection and paint behavior',()=>{
 const a=fixture(current,false),b=fixture(published,false);
 for(const z of [.5,1,1.4,.5])for(const dy of [0,1.25,260]){
  const bg={...base,top:base.top+dy,bottom:base.bottom+dy};
  for(let i=0;i<64;i++){const x=a.renderer.draw(bg,z,z,null,phone),y=b.renderer.draw(bg,z,z,null,phone);assert.equal(x,y);assert.equal(snapshotHash(snapshot(a)),snapshotHash(snapshot(b)));if(x&&a.renderer.diagnostics.pending===0)break;}
 }
});
for(const rotation of [0,90,-90])test(`logical mobile landscape ${rotation}: cold fill is bounded; warm Y keeps continuous coverage without rebuilding`,()=>{
 const f=fixture(),bg={...base},presentation={...phone,rotation};const first=settle(f,bg,1,presentation);assert.ok(first.partial>0);
 const count=f.renderer.diagnostics.builds,copies=f.renderer.diagnostics.joinCopies,textures=f.textures.size;
 for(let i=0;i<120;i++){
  const dy=Math.sin(i/10)*.125,b={...bg,camera:bg.camera+i*.25,top:bg.top+dy,bottom:bg.bottom+dy};assert.equal(f.renderer.draw(b,1,1,null,presentation),true);coverage(f,b,1);finiteEnvelope(f,b,1);
  assert.equal(f.renderer.diagnostics.lastBuildPixels,0);assert.equal(f.renderer.diagnostics.builds,count);assert.equal(f.renderer.diagnostics.joinCopies,copies);assert.equal(f.textures.size,textures);
 }
 assert.ok(f.renderer.diagnostics.tiles<=4,'copied source rows are recycled; retain only bounded outside prefetch');assert.deepEqual(bg,base,'rendering never mutates world geometry');
});
test('near/far/near and coverage replacement preserve current density and fit the combined surface envelope',()=>{
 const f=fixture();for(const [z,top] of [[1,-315.25],[.46,-802.5],[1.76,-315.25],[1,-315.25],[1,884.75]]){const bg={...base,width:1688/z,height:780/z,top,bottom:top+780/z};settle(f,bg,z);coverage(f,bg,z);finiteEnvelope(f,bg,z);assert.ok(f.renderer.diagnostics.tiles<=4);}
});
for(const source of ['facade','sky','left-repair','right-repair'])test(`replacing ${source} invalidates same-size cached content`,()=>{
 const f=fixture();settle(f);const count=f.renderer.diagnostics.builds,copies=f.renderer.diagnostics.joinCopies;f.art['challenge-street-'+source]={...f.art['challenge-street-'+source],id:source+'-new'};
 settle(f);assert.ok(f.renderer.diagnostics.builds>count);assert.ok(f.renderer.diagnostics.joinCopies>copies);coverage(f,base,1);
 assert.ok(f.draws.some(d=>d.image.id===source+'-new'),'the replacement original artwork is actually painted');
});
for(const method of ['reset','invalidateSurface'])test(`${method}: release all stale surfaces and recover continuous coverage`,()=>{
 const f=fixture();settle(f);const count=f.renderer.diagnostics.builds;f.renderer[method]();assert.ok(f.images.every(d=>!d.visible));assert.ok([...f.textures.values()].every(t=>t.width===1&&t.height===1));assert.equal(f.renderer.diagnostics.pending,0);assert.equal(f.renderer.diagnostics.joinPlan,null);
 settle(f);assert.ok(f.renderer.diagnostics.builds>count);coverage(f,base,1);
});
test('policy switches release joined surfaces and preserve unknown/desktop fallback behavior',()=>{
 const f=fixture();settle(f);for(const presentation of [undefined,{...phone,touch:false},{width:390,height:844,touch:true}]){assert.equal(f.renderer.draw(base,1,1,null,presentation),true);assert.equal(f.renderer.diagnostics.policy,'retained');assert.equal(f.renderer.diagnostics.joinedPixels,0);assert.equal(f.renderer.diagnostics.joinPlan,null);}
 settle(f);coverage(f,base,1);
});
test('invalid and over-budget inputs hide cached fragments, release backing stores, and recover',()=>{
 const f=fixture();for(const [bg,z] of [[{...base,width:20000,height:20000,bottom:20000},4],[{...base,width:4000,height:2700,bottom:base.top+2700},1],[{...base,width:8193,height:1,top:0,bottom:1},1],[{...base,width:0},1],[{...base,top:NaN},1],[base,100]]){settle(f);assert.equal(f.renderer.draw(bg,z,z,null,phone),false);assert.equal(f.renderer.diagnostics.reason,'budget');assert.ok(f.images.every(d=>!d.visible));assert.ok([...f.textures.values()].every(t=>t.width===1&&t.height===1));assert.equal(f.renderer.diagnostics.pixels,0);}settle(f);coverage(f,base,1);
});
test('an individual legacy source row cannot exceed the published 4 Mi-pixel cap even with spare total budget',()=>{
 const f=fixture(current,false),bg={...base,width:100,height:10,camera:0,top:0,bottom:10};assert.equal(f.renderer.draw(bg,4,4,null,phone),false);assert.equal(f.renderer.diagnostics.reason,'budget');assert.ok(f.images.every(d=>!d.visible));
});
