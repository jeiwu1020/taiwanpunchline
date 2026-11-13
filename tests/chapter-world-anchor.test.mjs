import test from 'node:test';
import assert from 'node:assert/strict';
import {panoramaFrame,drawChapter5Backdrop,CHAPTER5_ART} from '../dist/preview/chapter5/chapter5-scene.mjs';
import {createCanvas} from '@napi-rs/canvas';
test('chapter-five facade landmarks share the prop world transform during zoom and edge overscan',()=>{
 const image=createCanvas(2172,724),c=createCanvas(1280,800),ctx=c.getContext('2d');
 for(let scene=0;scene<3;scene++)for(const left of [-400,0,1000,2400])for(const zoom of [.42,.6,.9,1.4]){
  const frame={left,base:500,zoom},worldWidth=2800,p=drawChapter5Backdrop(ctx,image,frame,1280,800,{scene,worldWidth});
  const reference=panoramaFrame(image,{left:0,base:500,zoom:1},CHAPTER5_ART.curbs[scene],worldWidth,0);
  const landmark=680*reference.scale,propX=650;
  assert.ok(Math.abs((p.x+680*p.scale-(propX-left)*zoom)/zoom-(landmark-propX))<1e-7,`scene ${scene}, left ${left}, zoom ${zoom}`);
 }
});
