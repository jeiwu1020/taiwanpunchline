import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness} from './helpers/game-harness.mjs';
async function entry(mode,width,height,touch){
 const h=await gameHarness(),stop=new Error('camera selected'),part=()=>({setVisible(){}}),viewport={frame:{width,height,touch},camera:mode,nativeLandscape:width>height};
 const scene={artTime:6000,textPool:[],scale:{width,height},time:{now:0},cameras:{main:{setViewport(){},setZoom(){},centerOn(){}}},combatOverlay:{cameraSafety:{safeRect:{left:0,top:0,right:width,bottom:height},occlusions:[]},draw(){throw stop;}},arenaBackdrop:part(),backdropExtensions:[],boundaryGraphics:part(),ambient:part()};
 h.ui.setScene(scene);h.ui.setViewport(viewport);h.ui.startGame();while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}h.ui.duel.status='paused';
 const draw=delta=>{assert.throws(()=>h.ui.Arena.prototype.updateFrame.call(scene,0,delta),e=>e===stop);return scene.cameraView;};
 draw(0);h.ui.duel.status='over';h.ui.duel.winner='player';h.ui.beginMatchFinish();return {h,scene,viewport,draw};
}
for(const [width,height,touch]of [[1280,720,false],[390,844,true],[844,390,true]])for(const mode of ['stable','classic'])test(`real ${width}x${height} ${mode} finish freezes actors, retains its timer and safely rebases on resize`,async()=>{
 const {h,scene,viewport,draw}=await entry(mode,width,height,touch),finish=h.ui.matchFinish,first=finish.camera,snapshot=structuredClone(first);
 assert.ok(first.controlledCombatCamera);Object.assign(h.ui.duel.player,{x:1800,y:52,depth:-90});viewport.camera=mode==='stable'?'classic':'stable';
 for(let i=0;i<20;i++)assert.equal(draw(40),first);
 assert.deepEqual(first,snapshot);assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,800);assert.equal(h.timers.size,0);
 scene.scale={width:568,height:320};scene.combatOverlay.cameraSafety={safeRect:{left:0,top:100,right:568,bottom:300},occlusions:[]};
 const resized=draw(40);assert.equal(resized.width,568);assert.equal(resized.height,320);assert.deepEqual(resized.controlledCombatCamera.pose,first.controlledCombatCamera.pose);assert.equal(resized.challengeCameraMode,mode);
 assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,840);assert.equal(draw(20),resized);assert.equal(finish.elapsed,860);assert.equal(scene.artTime,6000);
 h.ui.cancelMatchFinish();h.ui.startGame();h.ui.duel.status='paused';const fresh=draw(0);assert.equal(fresh.controlledCombatCamera.pose.x,h.ui.duel.player.x);assert.notEqual(fresh.controlledCombatCamera.pose.x,1800);
});
