import test from 'node:test';import assert from 'node:assert/strict';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
const fs=[{x:436,y:430},{x:524,y:430}];
// The old tests required desktop and portrait-dynamic to ignore HUD safety.
// Preferred composition is protected only while its complete bodies are safe.
test('desktop and portrait modes preserve safe preferred scale and honor measured HUD changes',()=>{
 for(const [width,height,touch]of [[1180,757,false],[390,844,true],[844,390,false],[768,1024,false]])for(const mode of ['classic','stable']){
  const camera=mode==='stable'?fixedStableCameraFrame:cameraFrame,opts={touch,portrait:width<height,cameraMode:mode,safeRect:{left:0,top:0,right:width,bottom:height},occlusions:[]};
  const preferred=fullStageCameraFrame(camera,width,height,fs,null,16.7,opts),hud=height*.35;
  const safe=fullStageCameraFrame(camera,width,height,fs,null,16.7,{...opts,occlusions:[{left:0,top:0,right:width,bottom:hud}]});
  assert.ok(safe.zoom<=preferred.zoom+1e-7);for(const actor of fs)assert.ok(height/2+(actor.y-300-safe.y)*safe.zoom>=hud+6-1e-6);
 }
});
test('street modes honor measured HUD geometry without changing preferred scale unnecessarily',()=>{
 for(const [width,height,touch]of [[1180,757,false],[390,844,true]])for(const camera of ['classic','stable']){
  const world={player:fs[0],enemy:fs[1],enemies:[fs[1]],worldWidth:3600},opts={fullStage:true,touch,portrait:width<height,camera,safeRect:{left:0,top:0,right:width,bottom:height},occlusions:[]};
  const preferred=depthRouteCameraFrame(width,height,world,opts),hud=height*.25,safe=depthRouteCameraFrame(width,height,world,{...opts,occlusions:[{left:0,top:0,right:width,bottom:hud}]});
  assert.equal(safe.zoom,preferred.zoom);for(const actor of fs)assert.ok(height/2+(actor.y-300-safe.y)*safe.zoom>=hud+6-1e-6);
 }
});
