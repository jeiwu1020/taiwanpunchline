import test from 'node:test';
import assert from 'node:assert/strict';
import {createDepthChallengeRenderer,depthRouteCameraFrame,depthBackdropLayout} from '../dist/challenge-depth-render.mjs';
import {continuousCoverage,builds,backdropTiles} from './helpers/bounded-backdrop-assertions.mjs';
import {sceneFixture,artImages} from './helpers/street-render-scene.mjs';
import {finitePresentation} from './helpers/finite-backdrop-fixture.mjs';

// Regression: the shipping full-stage camera changes zoom while jumping.
// Older jump tests used the fixed-zoom preview camera and missed this workload.
const sizes=[[1280,720,false,'retained'],[1920,1080,false,'retained'],[390,844,true,'retained'],[844,390,true,'finite'],[320,568,true,'retained'],[568,320,true,'finite'],[740,320,true,'finite']];
function fixture(){
 const f=sceneFixture(),doc=f.scene.sys.game.canvas.ownerDocument,create=doc.createElement;
 doc.createElement=(tag)=>{const canvas=create(tag);canvas.getContext('2d').createLinearGradient=()=>({addColorStop(){}});return canvas;};
 const images={...artImages,...Object.fromEntries(['challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair'].map(id=>[id,{id,width:1536,height:1024}]))};
 return {...f,renderer:createDepthChallengeRenderer(f.scene,images)};
}
// #66 retained has full-height parity tiles, raster-aligned Y bounds and X-only
// bleed. A 256-unit Y-row assertion would reject the accepted original policy.
// This independent expectation uses the frozen #66 source registration and
// coverage/reserve rules. Layered finite uses the continuous-output contract;
// legacy source rows retain the original 256-unit helper in their own tests.
function retainedCoverage(f,bg,frame,previous=null){
 const ratio=Math.max(1,Math.min(2,2560/frame.width,1800/frame.height)),screenW=Math.ceil(frame.width*ratio),screenH=Math.ceil(frame.height*ratio),dx=screenW/frame.width*frame.backdropZoom,dy=screenH/frame.height*frame.backdropZoom;
 const signature=[frame.width,frame.height,dx,dy,bg.curbY,bg.buildingHeight].join(':'),old=previous?.signature===signature?previous:null;
 const tileWidth=1536*bg.buildingHeight/715,pw=Math.ceil(tileWidth*dx),sx=pw/tileWidth,bleed=2/sx;
 let expected=old;
 if(!old||bg.top<old.top||bg.bottom>old.bottom){
  const topPixel=Math.floor(Math.min(old?.top??Infinity,bg.top-256,frame.backdropTop)*dy),bottomPixel=Math.ceil(Math.max(old?.bottom??-Infinity,bg.bottom+256,frame.backdropBottom)*dy);
  expected={signature,top:topPixel/dy,height:(bottomPixel-topPixel)/dy,bottom:bottomPixel/dy,ph:bottomPixel-topPixel,builds:(previous?.builds||0)+2};
 }
 const tiles=backdropTiles(f),active=[...f.textures].filter(([key,t])=>key.startsWith('challenge-depth-backdrop')&&t.width>1);
 assert.equal(active.length,2,'both #66 repaired parity backings remain available');assert.ok(tiles.length,'retained view is fully cached');
 assert.equal(f.renderer.diagnostics.pending,0,'retained prepares whole coverage without a finite fill queue');assert.equal(builds(f),expected.builds,'exact #66 rebuild count, covered motion must reuse');
 for(const [,texture] of active){assert.equal(texture.width,pw+4,'full retained reserve density and X bleed');assert.equal(texture.height,expected.ph,'whole accumulated #66 coverage');assert.ok(texture.width<=8192&&texture.height<=8192);}
 let right=bg.camera;
 for(const tile of [...tiles].sort((a,b)=>a.x-b.x)){
  const texture=f.textures.get(tile.key),index=Math.round((tile.x+bleed)/tileWidth),near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,message);
  near(tile.x,index*tileWidth-bleed,'absolute X-world anchor');near(tile.width,tileWidth+2*bleed,'unchanged world width');near(tile.y,expected.top,'#66 raster-aligned top, without finite Y bleed');near(tile.height,expected.height,'full retained world height');
  assert.ok(tile.y<=bg.top+1e-7&&tile.y+tile.height>=bg.bottom-1e-7,'complete vertical visible coverage');near(tile.y*dy,Math.round(tile.y*dy),'top aligns to a source raster pixel');
  assert.equal(tile.depth,-8);assert.equal(tile.flipX,false,'asymmetric repaired tiles must never be mirrored');assert.equal(tile.key,active[Math.abs(index)%2][0],'original repair parity follows absolute horizontal index');
  assert.ok(texture.width/tile.width+1e-8>=screenW/bg.width&&texture.height/tile.height+1e-8>=screenH/bg.height,'current display density is never lowered');
  const left=tile.x+bleed;assert.ok(left<=right+1e-7,'no uncovered horizontal span');right=Math.max(right,left+tileWidth);
 }
 assert.ok(right>=bg.camera+bg.width-1e-7,'complete horizontal visible coverage');
 const sky=f.textures.get('challenge-depth-sky');assert.equal(sky.width,screenW);assert.equal(sky.height,screenH);
 assert.ok(active.reduce((sum,[,t])=>sum+t.width*t.height,0)+sky.width*sky.height<=32*1024*1024,'#66 static-plus-sky guard; unlike finite this excludes the actor surface');
 return expected;
}
for(const [width,height,touch,profilePolicy] of sizes)for(const explicitFinite of profilePolicy==='retained'?[false,true]:[false])test(`${explicitFinite?'explicit finite mechanism':profilePolicy+' real profile'}: full-stage jump reuses both repaired street tiles at ${width}x${height}`,()=>{
 for(const reverse of [false,true]){
  const f=fixture(),route={player:{x:1100,y:430,depth:0,hp:0,deadAge:1},worldWidth:3600,enemies:[],platforms:[],supplyUsed:true};
  const poses=Array.from({length:61},(_,i)=>({y:430-377*Math.sin(i*Math.PI/60),depth:5+95*Math.cos(i*Math.PI/60)}));
  if(reverse)poses.unshift(poses[30]);
  let minTop=Infinity,maxBottom=-Infinity,paintedFrames=0,previousBuilds=0,expectedRetained=null,finiteCoverageChecks=0;
  const policy=explicitFinite?'finite':profilePolicy;
  for(const [i,pose] of poses.entries()){
   Object.assign(route.player,pose);route.player.x=1100+i*5;
   const frame=depthRouteCameraFrame(width,height,route,{fullStage:true,touch}),bg=depthBackdropLayout(frame);
   minTop=Math.min(minTop,bg.top);maxBottom=Math.max(maxBottom,bg.bottom);
   const beforeDraw=f.draws.length;f.renderer.draw(route,i*16.67,explicitFinite?{...frame,presentation:finitePresentation}:frame);assert.equal(f.renderer.diagnostics.policy,policy,'actual profile must select its intended allocation policy');if(builds(f)!==previousBuilds){paintedFrames++;previousBuilds=builds(f);}
   const ratio=Math.max(1,Math.min(2,2560/width,1800/height));
   if(policy==='retained')expectedRetained=retainedCoverage(f,bg,frame,expectedRetained);
   else if(f.renderer.diagnostics.reason!=='partial'&&backdropTiles(f).length){continuousCoverage(f,bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);finiteCoverageChecks++;}
   else assert.ok(f.draws.slice(beforeDraw).some(d=>d.image.id==='challenge-street-facade'),'pending tiles use original-art fallback without clipping');
  }
  assert.ok(paintedFrames<poses.length,'preparation converges and steady covered frames reuse it');
  if(policy==='retained')assert.ok(expectedRetained.top<=minTop+1e-7&&expectedRetained.bottom>=maxBottom-1e-7,'retained coverage preserves the complete jump traversal');
  else assert.ok(finiteCoverageChecks>0,'finite fill converges to continuous world-anchor/coverage/density/budget assertions');
  assert.ok(f.textures.get('challenge-depth-sky').refreshes<8,'screen sky reuses between density epochs');
  const world=f.textures.get('challenge-depth-world');assert.equal(world.refreshes,poses.length,'animated actors still paint every frame');
 }
});
