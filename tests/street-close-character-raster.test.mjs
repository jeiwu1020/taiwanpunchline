import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{depthRouteCameraFrame}from'../dist/challenge-depth-render.mjs';
import {loadLowPoseArt,lowPoseSamples,lowPoseActor,rasterLowPose,alphaCoverage} from './helpers/camera-low-pose-raster.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
const profiles=JSON.parse(fs.readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const images=await loadLowPoseArt(),characters=['wang','han','ma','su','huang','chen','ko'];
const evidence={limit:'Original raster alpha against recorded Chromium logical geometry. No browser performance or physical-phone claim.',standing:[],cases:0,offscreen:0,hudOverlap:0,portraitControlsOverlap:0,landscapeWholeActorControlOverlap:0};
test('seven original character standing raster heights match near-pair classic VS within1% at390 portrait; stable VS remains smaller',()=>{
 const g=profiles['portrait-street'].cameraSafety,vs=profiles['portrait-vs'].cameraSafety;
 for(const type of characters){const player=lowPoseActor(type,{x:436}),enemy=lowPoseActor('han',{x:524}),world={player,enemy,enemies:[enemy],worldWidth:3600},options={...g,touch:true,portrait:true,fullStage:true,camera:'classic'},f=depthRouteCameraFrame(390,844,world,options),classic=fullStageCameraFrame(cameraFrame,390,844,[player,enemy],null,16.7,{...options,...vs,cameraMode:'classic'}),stable=fullStageCameraFrame(fixedStableCameraFrame,390,844,[player,enemy],null,16.7,{...options,...vs,cameraMode:'stable'}),r=rasterLowPose(images,player),pixels=r.height*f.zoom,classicPixels=r.height*classic.zoom,stablePixels=r.height*stable.zoom;
 assert.ok(pixels/classicPixels>.99&&pixels/classicPixels<1.01);assert.ok(pixels/stablePixels>1.29&&pixels/stablePixels<1.31);evidence.standing.push({type,sourceBounds:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},candidatePixels:pixels,classicVsPixels:classicPixels,stableVsPixels:stablePixels});}
});
test('original seven-character low-pose rasters retain actual alpha within screen and outside hard HUD, portrait controls',()=>{
 const rasters=lowPoseSamples().flatMap(s=>[-1,1].map(face=>{const actor={...s.actor,face};return{name:s.name,actor,raster:rasterLowPose(images,actor)};}));
 for(const [name,width,height]of[['portrait',390,844],['native',844,390]])for(const mode of['classic','stable']){
  if(name==='native'&&mode==='stable')continue;const g=profiles[name+'-street'].cameraSafety,world={player:lowPoseActor('wang',{x:436}),enemies:[],worldWidth:3600},o={...g,touch:true,portrait:width<height,fullStage:true,camera:mode},first=depthRouteCameraFrame(width,height,world,o),reserve=name==='portrait'?32:80;
  for(const offset of[-reserve,0,reserve])for(const elevation of[{y:430,depth:0},{y:53,depth:-90},{y:430,depth:100}]){Object.assign(world.player,{x:436+offset,...elevation});const frame=depthRouteCameraFrame(width,height,world,{...o,previous:first,delta:0});
   for(const sample of rasters){const actor={...sample.actor,x:world.player.x,...elevation},screen=alphaCoverage(sample.raster,frame,actor,[g.safeRect]),hud=alphaCoverage(sample.raster,frame,actor,g.occlusions.filter(r=>r.kind!=='control')),controls=alphaCoverage(sample.raster,frame,actor,g.occlusions.filter(r=>r.kind==='control'));evidence.cases++;if(screen.outside)evidence.offscreen++;if(hud.covered)evidence.hudOverlap++;if(name==='portrait'&&controls.covered)evidence.portraitControlsOverlap++;if(name==='native'&&!controls.outside)evidence.landscapeWholeActorControlOverlap++;}
  }
 }
 assert.equal(evidence.offscreen,0);assert.equal(evidence.hudOverlap,0);assert.equal(evidence.portraitControlsOverlap,0);assert.equal(evidence.landscapeWholeActorControlOverlap,0);
});
