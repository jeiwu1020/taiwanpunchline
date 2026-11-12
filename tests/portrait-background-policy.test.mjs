import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
const shared=await import(`../dist/preview/campaign/street-static-cache.mjs?v=${RUNTIME_VERSION}`);
const profiles=[['portrait',390,844,true,'retained'],['native',844,390,true,'finite'],['sideways +90',844,390,true,'finite',90],['desktop',844,390,false,'retained'],['500',844,500,true,'finite'],['501',844,501,true,'retained'],['unknown',844,390,undefined,'retained']];
const bg={width:600,height:900,camera:10,top:-700,bottom:200,curbY:350,buildingHeight:489},reserve={width:390,height:844,scaleX:1.4,scaleY:1.4,top:-1100,bottom:650};
for(const [name,width,height,touch,policy,rotation=0] of profiles)test(`main and chapters 2–4 share explicit ${name} background policy`,async()=>{
 const presentation={width,height,touch,rotation},f=sceneFixture(),r=createDepthBackdropRenderer(f.scene,artImages);
 r.draw(bg,.7,.7,reserve,presentation);assert.equal(r.diagnostics.policy,policy);
 if(policy==='retained'){assert.equal(r.diagnostics.pending,0);assert.equal(r.diagnostics.tiles,1);assert.ok([...f.textures.values()].some(t=>t.height>2000),'#66 reserve and retained coverage remain');}
 for(const chapter of [2,3,4]){
  const mod=await import(`../dist/preview/chapter${chapter}/street-backdrop.mjs`),canvas=createCanvas(width*2,height*2),ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.drawImage=()=>{};
  mod.drawStreetBackdrop(ctx,createCanvas(1536,1024),{zoom:.5,backdropZoom:.9,left:0,base:500,backdropScene:{},presentation},width,height);
  const d=shared.streetStaticCacheDiagnostics(ctx);assert.equal(d.policy,policy);assert.ok(d.density>=2*(policy==='retained'?.9:.5));if(policy==='retained')assert.equal(d.tiles,1);
  shared.invalidateStreetStaticCaches(ctx);
 }
});
test('paused same-size camera frames update explicit profile without changing camera numbers',()=>{
 const world={player:{x:480,y:430,depth:0,hp:100},worldWidth:3600},options={touch:true,fullStage:true},a=depthRouteCameraFrame(844,390,world,options),b=depthRouteCameraFrame(844,390,world,{...options,touch:false,paused:true,previous:a});
 assert.equal(a.presentation.touch,true);assert.equal(b.presentation.touch,false);for(const k of ['x','y','zoom','base'])assert.equal(b[k],a[k]);
 const adapter=createMobileCameraAdapter(),legacy={zoom:.5,left:0,base:300},c=adapter.frame(legacy,world,{width:844,height:390,touch:true}),d=adapter.frame(legacy,world,{width:844,height:390,touch:false,paused:true});
 assert.equal(c.presentation.touch,true);assert.equal(d.presentation.touch,false);for(const k of ['left','base','zoom'])assert.equal(d[k],c[k]);
});
test('single main factory releases old backings before policy allocation and clears pending/crops',()=>{
 const f=sceneFixture(),keys=new Set(),create=f.scene.textures.createCanvas.bind(f.scene.textures);f.scene.textures.createCanvas=(key,...args)=>{assert.ok(!keys.has(key),'no duplicate Phaser texture key');keys.add(key);return create(key,...args);};
 const add=f.scene.add.image;f.scene.add.image=(...args)=>{const d=add(...args);d.setCrop=(...crop)=>{d.crop=crop.length?crop:null;return d;};return d;};
 const r=createDepthBackdropRenderer(f.scene,artImages),finite={width:844,height:390,touch:true},retained={width:390,height:844,touch:true};
 r.draw(bg,.7,.7,reserve,retained);const old=[...f.textures.values()];let allocated=false;
 for(const t of old){const size=t.setSize;t.setSize=function(w,h){if(w>1&&!allocated){assert.ok(old.every(o=>o.width===1&&o.height===1),'old strategy released first');allocated=true;}return size.call(this,w,h);};}
 r.draw(bg,.7,.7,reserve,finite);assert.equal(r.diagnostics.policy,'finite');assert.ok(allocated);
 r.draw(bg,.7,.7,reserve,retained);assert.equal(r.diagnostics.policy,'retained');assert.equal(r.diagnostics.pending,0);assert.deepEqual(r.diagnostics.pendingBands,[]);assert.ok(f.images.filter(d=>d.visible).every(d=>!d.crop));
 r.reset();assert.equal(r.diagnostics.lastBuildPixels,0);assert.equal(r.diagnostics.pending,0);
});
test('main route wrapper never turns its historical touch default into an explicit phone profile',async()=>{
 const {routeCameraFrame}=await import('../dist/challenge-render.mjs'),world={depthMode:true,player:{x:480,y:430,depth:0,hp:100},worldWidth:3600};
 const unknown=routeCameraFrame(844,390,world),phone=routeCameraFrame(844,390,world,{touch:true}),desktop=routeCameraFrame(844,390,world,{touch:false});
 assert.equal(unknown.presentation.touch,false);assert.equal(phone.presentation.touch,true);assert.equal(desktop.presentation.touch,false);
 for(const key of ['x','y','zoom','base'])assert.equal(unknown[key],phone[key],'preserve historical camera arithmetic for unknown callers');
 for(const [frame,policy] of [[unknown,'retained'],[desktop,'retained'],[phone,'finite']]){const f=sceneFixture(),renderer=createDepthBackdropRenderer(f.scene,artImages);renderer.draw(bg,.7,.7,reserve,frame.presentation);assert.equal(renderer.diagnostics.policy,policy);}
});
