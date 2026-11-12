import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {streetTrialFrame} from '../dist/preview/chapter2/street-trial-view.mjs';
import {challengeCameraSubjects,challengeActorBounds} from '../dist/challenge-camera.mjs';
const geometry=(w,h)=>({safeRect:{left:8,top:8,right:w-8,bottom:h-8},occlusions:[{left:8,top:8,right:w-8,bottom:Math.min(120,h*.23)},{left:8,top:h-130,right:w*.27,bottom:h-8},{left:w*.65,top:h-154,right:w-8,bottom:h-8}]});
function fits(frame,world,g,close=false){assert.equal(!!frame.playerCloseCamera,close,'only expected phone street owns close framing');if(close)assert.deepEqual(frame.playerCloseCamera.pose,{x:world.player.x,displayY:world.player.y+(world.player.depth||0)*.65},'close pose is the actual controlled player');for(const actor of close||frame.playerFixedCamera?[world.player]:challengeCameraSubjects(world,{route:true})){const b=challengeActorBounds(actor,{prediction:0,halfWidth:close||frame.playerFixedCamera?132:130}),r={left:frame.width/2+(b.left-frame.x)*frame.zoom,right:frame.width/2+(b.right-frame.x)*frame.zoom,top:frame.height/2+(b.top-frame.y)*frame.zoom,bottom:frame.height/2+(b.bottom-frame.y)*frame.zoom};assert.ok(r.left>=g.safeRect.left-1e-5&&r.right<=g.safeRect.right+1e-5&&r.top>=g.safeRect.top-1e-5&&r.bottom<=g.safeRect.bottom+1e-5,'current complete body inside safe content');for(const o of g.occlusions)assert.ok(!(r.left<o.right-1e-6&&r.right>o.left+1e-6&&r.top<o.bottom-1e-6&&r.bottom>o.top+1e-6),'current complete body avoids controls');}}
function encounter(face,gap,helper='han'){
 const route=new ChallengeDepthRoute('wang','easy',()=>.2,{section:2,playerAssist:helper});route.spawn();const mob=route.enemies[0];assert.ok(mob);route.spawned=new Set(route.section.spawns.map((_,i)=>i));route.player.x=2200;route.player.face=face;mob.x=route.player.x+face*gap;mob.depth=0;route.enemy=mob;return route;
}
for(const path of ['main','later'])for(const camera of ['classic','stable'])test(`${path} ${camera} actual ready assist entry preserves expected camera ownership and safety in both directions`,()=>{
 for(const [w,h] of [[320,568],[390,844],[430,932],[844,390],[568,320],[1280,720]])for(const face of [-1,1])for(const gap of [200,400,550]){
  const route=encounter(face,gap),adapter=createMobileCameraAdapter(),g=geometry(w,h);let previous;const opts={...g,width:w,height:h,fullStage:true,touch:w!==1280,portrait:w<h,landscapePreview:w>h,route:true,camera,delta:1000/60};const frame=()=>path==='main'?depthRouteCameraFrame(w,h,route,{...opts,previous}):adapter.frame(streetTrialFrame({width:w,height:h,portrait:w<h,player:route.player,worldWidth:route.worldWidth}),route,opts).cameraFrame;
  for(let i=0;i<120;i++)previous=frame();const playerBefore={x:route.player.x,y:route.player.y,depth:route.player.depth},mobBefore={x:route.enemy.x,y:route.enemy.y,depth:route.enemy.depth};assert.equal(route.press('assist'),true);assert.equal(route.assists[0].actor.x,playerBefore.x-face*65,'real engine helper origin remains unchanged');const next=frame(),close=w!==1280&&(w<h||camera==='classic');fits(next,route,g,close);if(close||next.playerFixedCamera)assert.equal(next.zoom,previous.zoom,`${w}x${h} face=${face} gap=${gap}: helper cannot change player scale`);else assert.ok(Math.abs(next.zoom/previous.zoom-1)<=.0200001,`${w}x${h} face=${face} gap=${gap}: ${previous.zoom} -> ${next.zoom}`);assert.deepEqual({x:route.player.x,y:route.player.y,depth:route.player.depth},playerBefore);assert.deepEqual({x:route.enemy.x,y:route.enemy.y,depth:route.enemy.depth},mobBefore);
 }
});
for(const camera of ['classic','stable'])test(`${camera} all seven real helpers leave the portrait player safe at fixed scale through warning attack and exit`,()=>{
 for(const helper of ['wang','han','ma','su','huang','chen','ko'])for(const face of [-1,1]){
  const route=encounter(face,400,helper),g=geometry(390,844);let previous;const frame=()=>depthRouteCameraFrame(390,844,route,{...g,fullStage:true,touch:true,portrait:true,camera,previous,delta:1000/60});for(let i=0;i<120;i++)previous=frame();assert.equal(route.press('assist'),true);
  for(let i=0;i<180;i++){const next=frame();fits(next,route,g,true);assert.equal(next.zoom,previous.zoom,`${helper} face=${face} frame=${i}: helper must not change player scale`);previous=next;route.step(1/60,{});}
 }
});
