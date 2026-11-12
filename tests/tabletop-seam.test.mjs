import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {drawChallengeTabletopBand} from '../dist/challenge-art.mjs';
import {chapter2SceneLayers,drawChapter2TableLayer} from '../dist/preview/chapter2/chapter2-render-rules.mjs';

// A 253-alpha wood texture must not develop a moving translucent line when an
// off-table actor introduces a fractional depth cut. Render only the surface:
// the production layer painter is responsible for preserving its pixels.
test('fractional tabletop bands match an unsplit surface across zoom, HiDPI and side rotation',async()=>{
 const images={'challenge-street-props':await loadImage('dist/assets/challenge/street-props-v2.webp')};
 for(const renderer of ['chapter2','main'])for(const zoom of [.371428571,.8,1,1.4])for(const dpr of [1,2])for(const rotate of [false,true])for(const depth of [-35.9,-17.31,0,17.3,35.9]){
  const p={left:20,right:270,y:80,depth:0,depthHalf:36},frame={left:0,base:430*zoom+20.13,zoom};
  const renders=[[],[{depth},{depth:depth+.001}]].map(actors=>{
   const canvas=createCanvas(900,900),ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
   if(rotate){ctx.translate(400,0);ctx.rotate(Math.PI/2);}
   for(const layer of chapter2SceneLayers([p],actors,true))if(layer.kind==='table-top'){
    if(renderer==='chapter2')drawChapter2TableLayer(ctx,images,layer,frame);
    else drawChallengeTabletopBand(ctx,images['challenge-street-props'],{x:20*zoom,y:20.13+(80-36*.65)*zoom,width:250*zoom,height:72*.65*zoom,from:(layer.from+36)/72,to:(layer.to+36)/72});
   }
   return ctx.getImageData(0,0,900,900).data;
  });
  let maxAlpha=0,maxColour=0,count=0;
  for(let i=0;i<renders[0].length;i+=4)if(renders[0][i+3]>=245){
   count++;maxAlpha=Math.max(maxAlpha,Math.abs(renders[0][i+3]-renders[1][i+3]));
   for(let channel=0;channel<3;channel++)maxColour=Math.max(maxColour,Math.abs(renders[0][i+channel]-renders[1][i+channel]));
  }
  assert.ok(count>100);const context=JSON.stringify({renderer,zoom,dpr,rotate,depth,maxAlpha,maxColour});
  assert.ok(maxAlpha<=2,'no translucent seam: '+context);
  assert.ok(maxColour<=2,'no resampled wood jump: '+context);
 }
});

test('fixed tabletop/front joint stays opaque at fractional zoom and DPR',async()=>{
 const {drawChallengeStreetProp}=await import('../dist/challenge-art.mjs');
 const nested=await import('../dist/preview/chapter2/challenge-art.mjs');
 const images={'challenge-street-props':await loadImage('dist/assets/challenge/street-props-v2.webp')};
 for(const draw of [drawChallengeStreetProp,nested.drawChallengeStreetProp])for(const zoom of [.371428571,.8,1,1.4])for(const dpr of [1,2]){
  const canvas=createCanvas(1200,1400),ctx=canvas.getContext('2d');ctx.scale(zoom*dpr,zoom*dpr);ctx.translate(.13,.17);
  draw(ctx,images,'table',{x:200,y:430,width:250,height:88});
  const edge=(430-88+88*40/513+.17)*zoom*dpr,x=(200+.13)*zoom*dpr;
  const alphas=[];for(let y=Math.floor(edge)-1;y<=Math.ceil(edge)+1;y++)alphas.push(ctx.getImageData(Math.round(x),y,1,1).data[3]);
  assert.ok(Math.min(...alphas)>=245,JSON.stringify({zoom,dpr,edge,alphas}));
 }
});
