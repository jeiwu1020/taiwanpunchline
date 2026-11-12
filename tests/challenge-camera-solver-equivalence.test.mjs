import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {placeAtScale as reference} from './fixtures/challenge-camera-solver-reference.mjs';
// Exercise private solver internals without adding test hooks to production.
const url=new URL('../dist/challenge-camera.mjs',import.meta.url);
const source=readFileSync(url,'utf8').replace(/from (['"])([^'"]+)\1/g,(m,q,p)=>`from ${q}${new URL(p,url).href}${q}`)+'\nexport {geometry,placeAtScale};';
const {geometry,placeAtScale}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const frame={width:500,height:350},safeRect={left:0,top:0,right:500,bottom:350};

test('padding and clipping happen before contained overlays are removed, keeping one duplicate',()=>{
 const occlusions=[{left:-20,right:160,top:-20,bottom:100},{left:0,right:154,top:0,bottom:94},{left:-20,right:160,top:-20,bottom:100},{left:220,right:270,top:210,bottom:260}];
 const g=geometry(frame,{safeRect,occlusions,occlusionPadding:6});assert.equal(g.occlusions.length,2,'redundant constraints are removed once before the hot fixed-scale search');
 assert.deepEqual(g.occlusions.map(({left,top,right,bottom})=>({left,top,right,bottom})),[{left:0,top:0,right:166,bottom:106},{left:214,top:204,right:276,bottom:266}]);
});
test('hard HUD and soft control constraints are not confused by containment',()=>{
 const g=geometry(frame,{softControls:true,occlusions:[{kind:'control',left:0,top:0,right:500,bottom:100},{kind:'hud',left:10,top:10,right:490,bottom:90}]});assert.equal(g.occlusions.length,2);
});
test('solver keeps a real hole and respects padding rather than replacing the union with a bounding rectangle',()=>{
 const ring=[{left:80,right:420,top:50,bottom:90},{left:80,right:420,top:260,bottom:300},{left:80,right:120,top:50,bottom:300},{left:380,right:420,top:50,bottom:300}];
 const boxes=[{left:-20,right:20,top:-20,bottom:20}],wanted={x:250,y:175};
 for(const padding of [0,6,54,64]){const g=geometry(frame,{occlusions:ring,occlusionPadding:padding});assert.deepEqual(placeAtScale(boxes,1,g.rect,g.occlusions,wanted),reference(boxes,1,g.rect,g.occlusions,wanted));}
 assert.deepEqual(placeAtScale(boxes,1,safeRect,ring,wanted),wanted);
});
test('randomized exact candidate solver equivalence includes holes, large overlay counts, limits and epsilon contacts',()=>{
 let seed=0x1badb002;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<320;i++){
  const boxes=Array.from({length:1+i%4},()=>{const x=random()*120,y=random()*100;return {left:x-25,right:x+25,top:y-40,bottom:y+30};});
  const raw=Array.from({length:i%11===0?70:4+i%17},()=>{const left=random()*480,top=random()*330;return {left,top,right:left+random()*85+1,bottom:top+random()*65+1};});
  if(i%3===0)raw.push({...raw[0]},{left:raw[0].left+1e-8,right:raw[0].right,top:raw[0].top,bottom:raw[0].bottom});
  const zoom=.1+random()*1.8,wanted={x:random()*500,y:random()*350},limits=i%3===0?{left:100,right:450,top:80,bottom:320}:null;
  const original=raw.map(o=>({left:Math.max(0,o.left-6),right:Math.min(500,o.right+6),top:Math.max(0,o.top-6),bottom:Math.min(350,o.bottom+6)})).filter(o=>o.left<o.right&&o.top<o.bottom),g=geometry(frame,{occlusions:raw});
  const expected=reference(boxes,zoom,g.rect,original,wanted,limits),actual=placeAtScale(boxes,zoom,g.rect,g.occlusions,wanted,limits);
  assert.equal(!!actual,!!expected,`same feasible result case ${i}`);if(expected){assert.deepEqual(actual,expected,`same selected translation case ${i}`);}
 }
});
test('aligned overlapping padded rows coalesce exactly, without filling L-shaped holes',()=>{
 const row=[{left:100,top:200,right:150,bottom:250},{left:156,top:200,right:206,bottom:250},{left:100,top:256,right:206,bottom:306}];
 const g=geometry(frame,{occlusions:row});assert.equal(g.occlusions.length,1);assert.deepEqual(g.occlusions.map(({left,top,right,bottom})=>({left,top,right,bottom})),[{left:94,top:194,right:212,bottom:312}]);
 const l=geometry(frame,{occlusions:[row[0],{left:100,top:230,right:206,bottom:306}]});assert.equal(l.occlusions.length,2,'an L cannot be replaced by its bounding rectangle');
 const separated=geometry(frame,{occlusions:[row[0],{left:163,top:200,right:213,bottom:250}]});assert.equal(separated.occlusions.length,2,'a real 1px padded gap stays open');
});
test('random aligned rectangle unions retain holes and exact original selected coordinates after padding',()=>{
 let seed=74;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<200;i++){
  const raw=[];for(let row=0;row<5;row++)for(let col=0;col<7;col++)if(rnd()>.32)raw.push({left:col*60+5,right:col*60+59,top:row*60+5,bottom:row*60+59});
  const pad=i%2?6:0,original=raw.map(o=>({left:Math.max(0,o.left-pad),right:Math.min(500,o.right+pad),top:Math.max(0,o.top-pad),bottom:Math.min(350,o.bottom+pad)})),g=geometry(frame,{occlusions:raw,occlusionPadding:pad}),boxes=[{left:-11,right:11,top:-23,bottom:12}],wanted={x:rnd()*500,y:rnd()*350},z=.2+rnd();
  const a=reference(boxes,z,safeRect,original,wanted),b=placeAtScale(boxes,z,g.rect,g.occlusions,wanted);assert.equal(!!a,!!b);if(a)assert.deepEqual(b,a,`same selected coordinates for aligned union ${i}`);
 }
});

test('review I1 symmetric union and containment retain original selected side, not only cost',()=>{
 const cases=[
  ['union',[{left:250,right:300,top:0,bottom:350},{left:200,right:280,top:0,bottom:350}]],
  ['contained',[{left:250,right:300,top:0,bottom:350},{left:200,right:300,top:0,bottom:350}]]
 ];
 for(const [name,list] of cases)for(const reverse of [false,true])for(const vertical of [false,true])for(const multi of [false,true]){
  const raw=(reverse?[...list].reverse():list).map(r=>vertical?{left:r.top,right:r.bottom,top:r.left,bottom:r.right}:r),f=vertical?{width:350,height:500}:frame,rect={left:0,top:0,right:f.width,bottom:f.height};
  const boxes=multi?[{left:-20,right:20,top:-20,bottom:20},{left:-10,right:10,top:-10,bottom:10}]:[{left:-20,right:20,top:-20,bottom:20}],wanted=vertical?{x:175,y:250}:{x:250,y:175};
  const g=geometry(f,{occlusions:raw,occlusionPadding:0}),expected=reference(boxes,1,rect,raw,wanted);
  assert.deepEqual(placeAtScale(boxes,1,rect,g.occlusions,wanted),expected,`${name} reversed=${reverse} vertical=${vertical} multi=${multi}`);
 }
});
test('review I1 public desktop and portrait cameras retain the original equal-cost selection',async()=>{
 const {fitChallengeCamera}=await import('../dist/challenge-camera.mjs');
 for(const [width,height] of [[1000,390],[1000,600],[1000,1200]])for(const touch of height<=500?[false,undefined]:[false,undefined,true])for(const secondRight of [30,50])for(const reverse of [false,true]){
  const raw=[{left:width/2,right:width/2+50,top:0,bottom:height},{left:width/2-50,right:width/2+secondRight,top:0,bottom:height}],occlusions=reverse?[...raw].reverse():raw;
  // A tall viewport with touch=true is deliberately outside the mobile profile.
  const f=fitChallengeCamera({width,height,x:0,y:294,zoom:1},[{x:0,y:430,vy:0,hp:100}],null,1000/60,{touch,occlusions,occlusionPadding:0});
  assert.deepEqual({x:f.x,y:f.y,zoom:f.zoom},{x:reverse?180:-180,y:294,zoom:1},`touch=${touch} containment=${secondRight===50} reverse=${reverse}`);
 }
});
