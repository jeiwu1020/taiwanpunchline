// Native Canvas and production placement checks. This is not browser/device QA.
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createProloguePlayer} from '../dist/starter-prologue.mjs';
import {paintStarterComic} from '../dist/starter-comic-layout.mjs';
import {routeMicPlacement,feedbackPlacement} from '../dist/combat-overlay-layout.mjs';
import {mainRouteMicPlan} from '../dist/challenge-depth-render.mjs';
import {flyingMicLayout,drawFlyingMic} from '../dist/preview/chapter2/flying-mic.mjs';
const out=new URL('../../evidence/native/',import.meta.url);mkdirSync(out,{recursive:true});
const news=await loadImage(new URL('../dist/assets/starter-prologue/news-chamber-b.png',import.meta.url).pathname),props=await loadImage(new URL('../dist/assets/challenge/opening-props-v75.png',import.meta.url).pathname);
const sizes=[[320,568],[390,844],[430,932],[568,320],[844,390],[932,430],[1280,720],[1920,1080]],result=[];
for(const [width,height]of sizes){
 const portrait=width<height,touch=width<1000,hudBottom=portrait?153:131,place=routeMicPlacement({width,height,hudBottom});
 assert.ok(place.top>hudBottom);assert.equal(place.size,44);
 for(const dpr of [1,1.5,2]){
  const canvas=createCanvas(64*dpr,64*dpr),ctx=canvas.getContext('2d'),base=mainRouteMicPlan({width,height},dpr),plan={...base,visible:place.visible,center:{x:32,y:32}};
  for(const time of [0,500,1122,2244,3366,4488,9000])for(const reducedMotion of [false,true]){
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,64,64);drawFlyingMic(ctx,props,flyingMicLayout({plan,time,reducedMotion}),time);
   const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height;
   let count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]){count++;assert.ok(x>0&&x<w-1&&y>0&&y<h-1,'mic must remain inside its independent overlay');}
   assert.ok(count>100,'real mic pixels exist');
  }
  if(width===390&&dpr===2)writeFileSync(new URL('mic-overlay-2x.png',out),canvas.toBuffer('image/png'));
 }
 const specials=[{left:portrait?170:width*.6,top:height-(portrait?188:126)}],stick={right:portrait?108:140},buttons=specials;
 const feedback=feedbackPlacement({width,height,touch,portrait,specials,buttons,stick});
 if(touch&&!portrait){assert.ok(feedback.left-feedback.width/2>=stick.right+12);assert.ok(feedback.left+feedback.width/2<=specials[0].left-12);assert.equal(feedback.bottom,10);}else assert.equal(height-feedback.bottom,specials[0].top-8);
 result.push({width,height,place,feedback});
}
for(const [width,height]of [[390,844],[844,390],[1280,720]])for(const characterId of ['wang','han']){
 const p=createProloguePlayer({characterId});for(let i=0;i<4;i++)p.next();
 for(const name of ['sealed','missing']){
  const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),calls=[],draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...args)=>{calls.push(args);return draw(...args);};
  paintStarterComic(ctx,{news},p.scene,width,height,{reducedMotion:true});
  const source=calls.find(a=>a[0]===news);assert.ok(name==='sealed'?source[1]<768&&source[1]+source[3]<=768:source[1]>=768&&source[1]+source[3]<=1536);
  if(characterId==='wang')writeFileSync(new URL(`comic-${name}-${width}x${height}.png`,out),canvas.toBuffer('image/png'));
  p.next();
 }
}
writeFileSync(new URL('results.json',out),JSON.stringify({scope:'Native Canvas, actual assets, pure geometry; not a browser or a physical iPhone run',viewports:result,micFrames:8*3*7*2,comicCases:12},null,2));
console.log(JSON.stringify({viewports:result.length,micFrames:8*3*7*2,comicCases:12,passed:true}));
