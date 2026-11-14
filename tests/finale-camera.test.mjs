import test from 'node:test';
import assert from 'node:assert/strict';
import {FinaleArena} from '../dist/preview/finale/finale-engine.mjs';
import {finaleCameraFrame,finaleSubject} from '../dist/preview/finale/finale-camera.mjs';
import {challengeActorBounds} from '../dist/challenge-camera.mjs';
for(const [width,height]of [[1280,800],[390,844],[844,390],[568,320]])test(`finale whole-fight camera protects all seven bodies from HUD and controls ${width}x${height}`,()=>{
 const world=new FinaleArena(),hud={left:8,top:8,right:width-8,bottom:Math.min(140,height*.32)},controls={left:0,top:height-90,right:width,bottom:height},options={safeRect:{left:8,top:8,right:width-8,bottom:height-8},occlusions:[hud,controls]};
 const frame=finaleCameraFrame(width,height,world,options);assert.ok(frame.zoom>0);
 for(const a of world.actors){const b=challengeActorBounds(finaleSubject(a),{prediction:0}),r={left:width/2+(b.left-frame.x)*frame.zoom,right:width/2+(b.right-frame.x)*frame.zoom,top:height/2+(b.top-frame.y)*frame.zoom,bottom:height/2+(b.bottom-frame.y)*frame.zoom};assert.ok(r.left>=8-1e-5&&r.right<=width-8+1e-5);assert.ok(r.top>=hud.bottom&&r.bottom<=controls.top);}
});
