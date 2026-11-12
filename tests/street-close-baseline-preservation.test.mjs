import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {depthRouteCameraFrame as depth} from '../dist/challenge-depth-render.mjs';
import {fullStageCameraFrame as full} from '../dist/combat-presentation.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {createMobileCameraAdapter as adapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const reference=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-preservation-v68.json',import.meta.url)));
const profiles=JSON.parse(fs.readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const small=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles;
const snapshot=f=>Object.fromEntries(reference.snapshotKeys.filter(k=>f[k]!==undefined).map(k=>[k,f[k]]));
const actor=(x=436)=>({x,y:430,depth:0,vy:0,hp:100,supportY:430});
for(const spec of reference.cases)test(`#68 preserved ${spec.kind} ${spec.geometryKey} ${spec.mode}: main and later trace`,()=>{
 const geometry=spec.geometryKey==='small-street'?small['native568-street']:spec.geometryKey==='tall-touch'?{safeRect:{left:0,right:960,top:0,bottom:540},occlusions:[]}:profiles[spec.geometryKey].cameraSafety;
 const {width,height,rotation}=spec,options={...geometry,width,height,rotation,touch:spec.touch,portrait:width<height,fullStage:true,route:spec.kind==='street',camera:spec.mode,cameraMode:spec.mode,nativeLandscape:rotation===0,landscapePreview:rotation===0,delta:1000/60};
 const player=actor(),enemy=actor(524),world={player,enemy,enemies:[enemy],assists:[],section:{spawns:[]},spawned:new Set(),worldWidth:3600,status:'active'},later=adapter();let previous=null;
 for(const [i,pose]of reference.poses.entries()){
  Object.assign(player,pose.player);Object.assign(enemy,pose.enemy);
  previous=spec.kind==='street'?depth(width,height,world,{...options,previous}):full(spec.mode==='stable'?fixedStableCameraFrame:cameraFrame,width,height,[player,enemy],previous,options.delta,options);
  assert.deepEqual(snapshot(previous),spec.frames[i],`main frame${i}`);
  const adapted=later.frame({left:0,base:height-115,zoom:.3},world,options).cameraFrame;
  assert.deepEqual(snapshot(adapted),spec.laterFrames[i],`later frame${i}`);
 }
});
