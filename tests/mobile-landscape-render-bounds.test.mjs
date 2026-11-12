import {settleBackdrop} from './helpers/bounded-backdrop-assertions.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
import {createFiniteBackdropRenderer as createDepthBackdropRenderer} from './helpers/finite-backdrop-fixture.mjs';
import {createDepthChallengeRenderer} from '../dist/challenge-depth-render.mjs';
import * as street from '../dist/preview/campaign/street-static-cache.mjs';
const pixels=f=>[...f.textures.values()].reduce((n,t)=>n+t.width*t.height,0);
function bg(z=.88,top=-900){return {width:390/z,height:844/z,camera:200,top,bottom:top+844/z,curbY:346.5,buildingHeight:489};}
const retained={width:390,height:844,scaleX:1.78,scaleY:1.78,top:-2400,bottom:1000};
test('near far near backdrop work follows actual density with finite world tiles',()=>{
 const f=sceneFixture(),r=createDepthBackdropRenderer(f.scene,artImages);
 for(const z of [.88,.23,.88]){assert.equal(settleBackdrop(r,bg(z),z*2,z*2,retained),true);assert.ok(pixels(f)<12*1024*1024,'no maximum-near density multiplied by far coverage');for(const t of f.textures.values())assert.ok(t.height<=2052,'finite world strips, never a growing world-height canvas');}
 const before=[...f.textures.values()].reduce((n,t)=>n+(t.refreshes||0),0);
 for(let i=0;i<300;i++)settleBackdrop(r,bg(.88,-900+Math.sin(i)*30),1.76,1.76,retained);
 const after=[...f.textures.values()].reduce((n,t)=>n+(t.refreshes||0),0);assert.ok(after-before<=2,'boundary oscillation retains a finite prefetch ring');
 r.reset();assert.ok([...f.textures.values()].every(t=>t.width===1&&t.height===1),'route reset releases all tile backing stores');
});
test('renderer invalidation repaints same-size static backing',()=>{
 const f=sceneFixture(),r=createDepthChallengeRenderer(f.scene,artImages),route={player:{x:1100,y:430,depth:0,hp:0,deadAge:1},enemies:[],platforms:[],supplyUsed:true},frame={width:390,height:844,x:1100,y:0,zoom:.8};
 r.draw(route,0,frame);assert.equal(typeof r.invalidateSurface,'function');const before=f.draws.length;for(const t of f.textures.values())t.getCanvas().width=t.width;r.invalidateSurface();r.draw(route,0,frame);assert.ok(f.draws.length>before);assert.equal(f.textures.get('challenge-depth-world').width,780);
});
test('later street and paper share a bounded budget and explicit invalidation repaints pixels',()=>{
 const c=createCanvas(780,1688),ctx=c.getContext('2d'),alloc=[];c.ownerDocument={createElement(){const x=createCanvas(1,1);alloc.push(x);return x;}};ctx.setTransform(2,0,0,2,0,0);const image=createCanvas(1536,1024),frame={presentation:{width:844,height:390,touch:true},zoom:.23,backdropZoom:.88,left:0,base:700,backdropScene:{}};let paints=0;
 const paint=b=>{paints++;b.fillStyle='#a04020';b.fillRect(-100,-10000,10000,20000);},opts={image,frame,width:390,height:844,curb:700};
 assert.equal(street.paintCachedStreetLayer(ctx,opts,paint),true);street.paintCachedPaperGrain(ctx,390,844,100,paint);assert.ok(alloc.reduce((s,a)=>s+a.width*a.height,0)<8*1024*1024);assert.equal(typeof street.invalidateStreetStaticCaches,'function');
 for(const a of alloc)a.width=a.width;const before=paints;street.invalidateStreetStaticCaches(ctx);street.paintCachedStreetLayer(ctx,opts,paint);street.paintCachedPaperGrain(ctx,390,844,100,paint);assert.ok(paints>before);assert.ok(ctx.getImageData(100,100,1,1).data[3]>0);street.invalidateStreetStaticCaches(ctx);assert.ok(alloc.every(a=>a.width===1&&a.height===1));
});
test('one render frame fills bounded rows and falls back to original art while preparation is pending',()=>{
 const f=sceneFixture(),r=createDepthBackdropRenderer(f.scene,artImages);let ready=false;
 for(let i=0;i<40;i++){const before=[...f.textures.values()].reduce((n,t)=>n+(t.refreshes||0),0);ready=r.draw(bg(.88),1.76,1.76,retained);const after=[...f.textures.values()].reduce((n,t)=>n+(t.refreshes||0),0);assert.ok(after-before<=2,'only a bounded strip batch may paint in one frame');if(ready)break;assert.ok(f.images.every(d=>!d.visible),'partial backdrop never covers direct original fallback');}
 assert.equal(ready,true,'bounded filling converges to reusable cache');
});
test('changing arena and route modes reclaims inactive backing stores',async()=>{
 const {createChallengeRenderer}=await import('../dist/challenge-render.mjs'),f=sceneFixture(),chain=new Proxy({},{get:()=>()=>chain});f.scene.add.graphics=()=>chain;f.scene.add.text=()=>chain;
 const r=createChallengeRenderer(f.scene,artImages),frame={width:390,height:844,x:1000,y:200,zoom:.8};assert.equal(f.textures.get('challenge-route-world').width,1,'inactive legacy surface is lazy');r.drawArena(0,0,frame);assert.equal(f.textures.get('challenge-route-world').width,1600);const arena=f.textures.get('challenge-arena-facade');assert.ok(arena.width>1);
 const route={depthMode:true,player:{x:1000,y:430,depth:0,hp:0,deadAge:1},enemies:[],platforms:[],supplyUsed:true};r.draw(route,0,frame);assert.equal(arena.getCanvas().width,1);assert.equal(f.textures.get('challenge-route-world').width,1);assert.equal(f.textures.get('challenge-depth-world').width,780);r.drawArena(0,0,frame);assert.equal(f.textures.get('challenge-depth-world').width,1,'inactive actor surface is released');assert.ok([...f.textures].filter(([key])=>key.startsWith('challenge-depth-backdrop')).every(([,t])=>t.width===1));
});
test('rotated destination transforms retain the full DPR in street caches',()=>{const c=createCanvas(780,780),ctx=c.getContext('2d');ctx.setTransform(0,2,-2,0,780,0);const image=createCanvas(1536,1024);let density=0;street.paintCachedStreetLayer(ctx,{image,width:390,height:390,curb:700,frame:{zoom:.8,left:0,base:500}},brush=>{density=brush.getTransform().d;});assert.ok(density>=1.6,'orthogonal rotation must not be mistaken for DPR 1');street.invalidateStreetStaticCaches(ctx);});
