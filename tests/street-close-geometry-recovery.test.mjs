import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {depthRouteCameraFrame as depth} from '../dist/challenge-depth-render.mjs';
const g=JSON.parse(fs.readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles['portrait-street'].cameraSafety;
const small=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-portrait320-geometry.json',import.meta.url))).cameraSafety;
const preservation=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-preservation-v68.json',import.meta.url)));
const snapshot=f=>Object.fromEntries(preservation.snapshotKeys.filter(k=>f[k]!==undefined).map(k=>[k,f[k]]));
// Full-width synthetic HUD/control blockers intentionally leave a98px pocket.
// This isolates recovery policy from the exact slots in a recorded DOM layout.
const world=()=>({player:{x:436,y:430,depth:0,hp:100},enemy:{x:524,y:430,depth:0,hp:100},enemies:[],worldWidth:3600});
const opts=(mode,geometry=g)=>({...geometry,touch:true,portrait:true,fullStage:true,camera:mode,cameraMode:mode});
for(const mode of['classic','stable'])for(const paused of[false,true])test(`portrait ${mode} ${paused?'paused':'active'} tight same-size HUD restores largest legal close scale`,()=>{
 const w=world(),o=opts(mode),first=depth(390,844,w,o),tight={...o,occlusions:[{kind:'hud',left:0,right:390,top:0,bottom:550},{kind:'control',left:0,right:390,top:660,bottom:844}]};
 if(paused)Object.assign(w.player,{x:1800,y:-100,depth:90});
 const narrow=depth(390,844,w,{...tight,previous:first,paused});assert.ok(Math.abs(narrow.zoom-98/328)<1e-8,'derived pocket is98 logical px high');
 const same=depth(390,844,w,{...structuredClone(tight),previous:narrow,paused,viewportEpoch:99});assert.equal(same.zoom,narrow.zoom,'unchanged geometry stays fixed');assert.deepEqual(same.playerCloseCamera.anchor,narrow.playerCloseCamera.anchor);
 const restored=depth(390,844,w,{...o,previous:same,paused});assert.equal(restored.zoom,390/380,'restored geometry must reclaim the close view');assert.equal(restored.playerCloseCamera.referenceZoom,restored.zoom);
 if(paused){assert.deepEqual(restored.playerCloseCamera.pose,first.playerCloseCamera.pose);assert.equal(restored.challengeCameraMode,mode);}else assert.deepEqual(restored.playerCloseCamera.pose,{x:w.player.x,displayY:w.player.y+w.player.depth*.65});
 const again=depth(390,844,w,{...structuredClone(o),previous:restored,paused});assert.equal(again.zoom,restored.zoom);assert.deepEqual(again.playerCloseCamera.anchor,restored.playerCloseCamera.anchor);
});
for(const mode of['classic','stable'])test(`portrait ${mode}320→390 is a distinct dimension reinitialization`,()=>{const w=world(),first=depth(320,568,w,opts(mode,small)),next=depth(390,844,w,{...opts(mode),previous:first});assert.ok(Math.abs(first.zoom-212/328)<1e-8);assert.equal(next.zoom,390/380);assert.notEqual(next.playerCloseCamera.geometryKey,first.playerCloseCamera.geometryKey);});
test('approved landscape stable still retains smaller scale after same-size geometry opens, exactly like baseline',()=>{
 const w=world(),o={touch:true,portrait:false,fullStage:true,camera:'stable',safeRect:{left:0,right:844,top:0,bottom:390},occlusions:[]},tight={...o,safeRect:{left:250,right:410,top:200,bottom:310}};
 let a=null;for(const [i,options]of[o,tight,o].entries()){a=depth(844,390,w,{...options,previous:a});assert.deepEqual(snapshot(a),preservation.stableLandscapeReflow[i]);}assert.ok(a.zoom<.4);
});
