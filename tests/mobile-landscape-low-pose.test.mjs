import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {loadLowPoseArt,lowPoseActor,lowPoseSamples,rasterLowPose,alphaCoverage} from './helpers/camera-low-pose-raster.mjs';
const small=JSON.parse(readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles,measured=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const images=await loadLowPoseArt();
test('review I2 low roll can overlap every head pixel while retaining part of the actual body outside translucent-control rectangles',()=>{
 const player=lowPoseActor('wang',{attack:{kind:'rush',age:.48}}),opponent={x:206,y:430,vy:0,depth:0,hp:100},g=small['native568-vs'];
 const f=fullStageCameraFrame(cameraFrame,568,320,[player,opponent],null,1000/60,{...g,touch:true,cameraMode:'classic'}),controls=g.occlusions.filter(r=>r.kind==='control');
 const body=alphaCoverage(rasterLowPose(images,player),f,player,controls),head=alphaCoverage(rasterLowPose(images,player,{headOnly:true}),f,player,controls);
 assert.equal(head.covered,head.total,'fixed standing proxy is not an animated-head guarantee');assert.ok(body.fraction>.70&&body.fraction<.73);assert.ok(body.outside>body.total*.25,'this observed overlap is partial-body, not the complete actor');
 const onScreen=alphaCoverage(rasterLowPose(images,player),f,player,[g.safeRect]);assert.equal(onScreen.covered,onScreen.total);
});
test('seven original crouches and existing knee/roll poses are measured independently from the standing camera proxy',()=>{
 for(const type of ['wang','han','ma','su','huang','chen','ko']){const actor=lowPoseActor(type,{crouchBlend:1}),head=rasterLowPose(images,actor,{headOnly:true});assert.ok(head.bottom>-140&&head.bottom<=-110,`${type} crouched head crosses the fixed standing cutoff`);}
 for(const [kind,type,ages] of [['rush','wang',[.24,.28,.44,.48]],['han_knee','han',[.12,.4,.7,.97]]])for(const age of ages){const head=rasterLowPose(images,lowPoseActor(type,{attack:{kind,age}}),{headOnly:true});assert.ok(head.bottom>-140,`${kind} ${age} is not represented by a standing-head envelope`);}
});
test('real low-pose alpha never lies wholly in the control union across recorded short/wide VS and street positional cases',()=>{
 const rasters=lowPoseSamples().flatMap(sample=>[-1,1].map(face=>{const actor={...sample.actor,face};return {...sample,actor,raster:rasterLowPose(images,actor)};}));
 let cases=0,maxFraction=0,worst=null,offscreenCases=0,maxOffscreenFraction=0,worstOffscreen=null,wholeControlCases=0;
 for(const [name,width,height,g] of [['native-vs',844,390,measured['native-vs'].cameraSafety],['native-street',844,390,measured['native-street'].cameraSafety],['native568-vs',568,320,small['native568-vs']],['native568-street',568,320,small['native568-street']]])for(const mode of ['classic','stable'])for(const x of [68,206,450,700,892])for(const enemyX of [68,206,450,700,892]){
  if(Math.abs(enemyX-x)<88)continue;const street=name.endsWith('street');
  for(const depth of street?[-65,0,65]:[0]){const player={x,y:430,vy:0,depth,hp:100},enemy={x:enemyX,y:430,vy:0,depth:0,hp:100},world={player,enemy,enemies:[enemy],worldWidth:3600,section:{spawns:[]},spawned:new Set()},options={...g,touch:true,cameraMode:mode,camera:mode,fullStage:true};
   const f=street?depthRouteCameraFrame(width,height,world,options):fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,width,height,[player,enemy],null,1000/60,options),controls=g.occlusions.filter(r=>r.kind==='control');
   for(const sample of rasters){const actor={...sample.actor,x,y:430,depth},cover=alphaCoverage(sample.raster,f,actor,controls);cases++;if(cover.fraction>maxFraction){maxFraction=cover.fraction;worst={name,mode,x,enemyX,depth,pose:sample.name,face:actor.face,fraction:cover.fraction};}
    if(cover.outside===0)wholeControlCases++;const screen=alphaCoverage(sample.raster,f,actor,[g.safeRect]);if(screen.outside){offscreenCases++;if(screen.outside/screen.total>maxOffscreenFraction){maxOffscreenFraction=screen.outside/screen.total;worstOffscreen={name,mode,x,enemyX,depth,pose:sample.name,face:actor.face,screen,frame:f,raster:{left:sample.raster.left,right:sample.raster.right,top:sample.raster.top,bottom:sample.raster.bottom}};}}
   }
  }
 }
 assert.equal(cases,24960);console.log('LOW_POSE_POSITIONAL_EVIDENCE',JSON.stringify({cases,maxFraction,worst,wholeControlCases,offscreenCases,maxOffscreenFraction,worstOffscreen}));assert.equal(wholeControlCases,0);assert.equal(offscreenCases,0);
});
test('fixed mobile roll side reserve contains edge alpha without changing zoom on pose entry or exit',()=>{
 const g=measured['native-vs'].cameraSafety,enemy={x:892,y:430,vy:0,depth:0,hp:100};let standing;
 for(const age of [null,.12,.24,.4,.48,.56,null]){
  const player=lowPoseActor('wang',{x:68,face:-1,...(age===null?{}:{attack:{kind:'rush',age}})});
  const f=fullStageCameraFrame(cameraFrame,844,390,[player,enemy],null,1000/60,{...g,touch:true,cameraMode:'classic'});
  standing??=f;for(const key of ['x','y','zoom'])assert.equal(f[key],standing[key],`${key} does not depend on the roll pose`);
  const screen=alphaCoverage(rasterLowPose(images,player),f,player,[g.safeRect]);assert.equal(screen.outside,0,`roll ${age} fits including its edge alpha`);
 }
});

// Additional cases, not a replacement or rebaseline of the 24,960 above.
// Use the unchanged original raster and actual fixed-camera history at the
// left edge, target, and right edge. Both facings and all recorded layouts.
test('original low-pose alpha remains safe across reserved left center right lag positions',()=>{
 const rasters=lowPoseSamples().flatMap(sample=>[-1,1].map(face=>{const actor={...sample.actor,face};return {...sample,actor,raster:rasterLowPose(images,actor),head:rasterLowPose(images,actor,{headOnly:true})};}));
 let cases=0,maxFraction=0,wholeControlCases=0,offscreenCases=0,hudCases=0,worst=null,maxHeadFraction=0,wholeHeadCases=0,worstHead=null,wholeHeadPositions=[];
 for(const [name,width,height,g] of [['native-vs',844,390,measured['native-vs'].cameraSafety],['rotated-vs',844,390,measured['rotated-vs'].cameraSafety],['native-street',844,390,measured['native-street'].cameraSafety],['rotated-street',844,390,measured['rotated-street'].cameraSafety],['native568-vs',568,320,small['native568-vs']],['native568-street',568,320,small['native568-street']]])for(const offset of [-80,0,80]){
  const street=name.endsWith('street'),player={x:450,y:430,depth:0,hp:100},enemy={x:940,y:430,depth:0,hp:100},world={player,enemy,enemies:[enemy],worldWidth:3600,section:{spawns:[]},spawned:new Set()},options={...g,touch:true,cameraMode:'stable',camera:'stable',fullStage:true};
  const first=street?depthRouteCameraFrame(width,height,world,options):fullStageCameraFrame(fixedStableCameraFrame,width,height,[player,enemy],null,1000/60,options);player.x+=offset;
  const f=street?depthRouteCameraFrame(width,height,world,{...options,previous:first,delta:0}):fullStageCameraFrame(fixedStableCameraFrame,width,height,[player,enemy],first,0,options),sx=width/2+(player.x-f.x)*f.zoom;
  assert.equal(f.zoom,first.zoom);assert.deepEqual(f.playerFixedCamera.anchor,first.playerFixedCamera.anchor);assert.ok(Math.abs(sx-(f.playerFixedCamera.anchor.x+offset*f.zoom))<1e-7);
  const controls=g.occlusions.filter(r=>r.kind==='control'),hud=g.occlusions.filter(r=>r.kind!=='control');
  for(const sample of rasters){const actor={...sample.actor,x:player.x,y:430,depth:0},cover=alphaCoverage(sample.raster,f,actor,controls),screen=alphaCoverage(sample.raster,f,actor,[g.safeRect]),hard=alphaCoverage(sample.raster,f,actor,hud),head=alphaCoverage(sample.head,f,actor,controls);cases++;if(head.fraction>maxHeadFraction){maxHeadFraction=head.fraction;worstHead={name,offset,pose:sample.name,face:actor.face,fraction:head.fraction};}if(head.covered===head.total){wholeHeadCases++;wholeHeadPositions.push({name,offset,pose:sample.name,face:actor.face});}if(cover.fraction>maxFraction){maxFraction=cover.fraction;worst={name,offset,pose:sample.name,face:actor.face,fraction:cover.fraction};}if(!cover.outside)wholeControlCases++;if(screen.outside)offscreenCases++;if(hard.covered)hudCases++;}
 }
 assert.equal(cases,1404);console.log('LOW_POSE_FOLLOW_EVIDENCE',JSON.stringify({cases,maxFraction,worst,wholeControlCases,offscreenCases,hudCases,maxHeadFraction,wholeHeadCases,worstHead,wholeHeadPositions}));assert.equal(wholeControlCases,0);assert.equal(offscreenCases,0);assert.equal(hudCases,0);
});
