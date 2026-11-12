// Native CPU Canvas verification, not browser/device QA.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {ART_FILES,drawFighterArt} from '../dist/art-render.mjs';
import {ART_FILES as streetArt} from '../dist/challenge-art.mjs';
import {paintDepthRoute,depthRouteCameraFrame,mainRouteMicPlan} from '../dist/challenge-depth-render.mjs';
import {flyingMicLayout,drawFlyingMic,micRasterInfo} from '../dist/preview/chapter2/flying-mic.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {Duel} from '../dist/core.mjs';
import {presentationFighter} from '../dist/move-readability.mjs';
const dir=new URL('../docs/first-chapter-mic/',import.meta.url);
const images=Object.fromEntries(await Promise.all(Object.entries({...ART_FILES,...streetArt}).map(async([key,file])=>[key,await loadImage(new URL('../dist/assets/'+file,import.meta.url).pathname)])));
const evidence=JSON.parse(readFileSync(new URL('actor-envelope.json',dir)));
const bounds=ctx=>{const {width:w,height:h}=ctx.canvas,d=ctx.getImageData(0,0,w,h).data;let left=w,right=-1,top=h,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return {left,right,top,bottom};};
const actual=[];
for(const [type,s] of Object.entries(evidence.byType)){
 const p=s.top,ctx=createCanvas(800,800).getContext('2d');ctx.translate(400,500);
 drawFighterArt(ctx,images,presentationFighter({...new Duel(type).player,...p.patch}),p.time,{shadow:false});
 const b=bounds(ctx);assert.ok(b.top>=500+p.bounds.top-2,type+' actual pixels exceed geometry');
 writeFileSync(new URL(type+'-extreme.png',dir),ctx.canvas.toBuffer('image/png'));
 actual.push({type,pose:p.label,actualLocalTop:b.top-500,conservativeTop:p.bounds.top});
}
const snapshots=[];
for(const [width,height] of [[390,844],[844,390],[1280,720]])for(const y of [430,100]){
 const route=new ChallengeDepthRoute('wang','easy',()=>.2);route.player.x=route.worldWidth-150;route.player.y=y;route.player.depth=-90;
 const frame=depthRouteCameraFrame(width,height,route,{fullStage:true});
 const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');ctx.scale(frame.zoom,frame.zoom);ctx.translate(-(frame.x-width/frame.zoom/2),-(frame.y-height/frame.zoom/2));
 const layout=paintDepthRoute(ctx,images,route,500,frame);
 assert.equal(layout.visible,true);assert.equal(layout.size,44);
 const name=`street-${width}x${height}-${y===430?'ground':'jump'}.png`;
 writeFileSync(new URL(name,dir),canvas.toBuffer('image/png'));snapshots.push(name);
}
const ctx=createCanvas(844,390).getContext('2d'),plan=mainRouteMicPlan({width:844,height:390}),micBounds=[];
for(const time of [0,500,1122,2244,3366,4488,9000]){
 ctx.clearRect(0,0,844,390);const l=flyingMicLayout({plan,time});drawFlyingMic(ctx,images['opening-props-v75'],l,time);const b=bounds(ctx);
 assert.ok(b.left>=plan.travelBounds.left&&b.right<=plan.travelBounds.right&&b.top>=plan.travelBounds.top&&b.bottom<=plan.travelBounds.bottom);
 assert.equal(micRasterInfo(ctx).generation,1);micBounds.push({time,...b});
}
writeFileSync(new URL('native-results.json',dir),JSON.stringify({scope:'Native Canvas with real decoded assets; no browser, Safari or physical-device QA',actual,snapshots,micBounds},null,2));
console.log(JSON.stringify({actual,snapshots,micBounds},null,2));
// The actual paint caller must show the limitation, not just return a reason.
{
 const ctx=createCanvas(70,60).getContext('2d'),texts=[],fillText=ctx.fillText.bind(ctx);ctx.fillText=(text,...args)=>{texts.push(text);return fillText(text,...args);};
 const route=new ChallengeDepthRoute('wang','easy',()=>.2),frame=depthRouteCameraFrame(70,60,route,{fullStage:true});
 ctx.scale(frame.zoom,frame.zoom);ctx.translate(-(frame.x-35/frame.zoom),-(frame.y-30/frame.zoom));
 const mic=paintDepthRoute(ctx,images,route,0,frame);
 assert.equal(mic.visible,false);assert.ok(texts.includes('視窗太小，請放大'),'unavailable mic must have a visible warning');
 writeFileSync(new URL('tiny-viewport-warning.png',dir),ctx.canvas.toBuffer('image/png'));
 console.log('PASS: tiny-viewport warning is painted by the production route renderer');
}
