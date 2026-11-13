import test from 'node:test';
import assert from 'node:assert/strict';
import * as camera from '../dist/preview/finale/finale-camera.mjs';
import {FinaleArena,ARENA} from '../dist/preview/finale/finale-engine.mjs';
test('finale exposes a single floor-and-actor projection with real front/back separation',()=>{
 assert.equal(typeof camera.finalePoint,'function');
 const back=camera.finalePoint(ARENA.left,430,ARENA.back),front=camera.finalePoint(ARENA.left,430,ARENA.front);
 assert.ok(front.y-back.y>250);assert.ok(back.x>front.x);assert.ok(back.scale<front.scale);
});
test('stable finale camera does not zoom or pan when players move or die',()=>{
 const world=new FinaleArena(),a=camera.finaleCameraFrame(1280,720,world,{camera:'stable'});
 for(const actor of world.actors){actor.x=480;actor.depth=0;actor.hp=0;}world.player.hp=50;
 const b=camera.finaleCameraFrame(1280,720,world,{camera:'stable',previous:a});
 assert.equal(b.zoom,a.zoom);assert.equal(b.x,a.x);assert.equal(b.y,a.y);
});
test('dynamic finale camera responds to the remaining battle while stable remains wide',()=>{
 const world=new FinaleArena();for(const a of world.actors){a.x=480;a.depth=0;}
 const a=camera.finaleCameraFrame(1280,720,world,{camera:'classic'}),b=camera.finaleCameraFrame(1280,720,world,{camera:'stable'});
 assert.ok(a.zoom>b.zoom);
});
for(const [width,height] of [[1280,800],[390,844],[844,390],[568,320]])for(const mode of ['classic','stable'])test(`projected actors and jumps remain within HUD-safe area: ${width}x${height} ${mode}`,()=>{
 const world=new FinaleArena(),hud={left:8,top:8,right:width-8,bottom:Math.min(140,height*.32)},controls={left:0,top:height-90,right:width,bottom:height};
 for(let i=0;i<world.actors.length;i++)Object.assign(world.actors[i],{x:i%2?ARENA.left:ARENA.right,depth:i%3?ARENA.back:ARENA.front,y:i%2?430:430-262});
 const frame=camera.finaleCameraFrame(width,height,world,{camera:mode,occlusions:[hud,controls]});
 for(const actor of world.actors){const p=camera.finalePoint(actor.x,actor.y,actor.depth),x=(p.x-frame.left)*frame.zoom,y=frame.base+(p.y-430)*frame.zoom;
 assert.ok(x-130*p.scale*frame.zoom>=8-1e-4);assert.ok(x+130*p.scale*frame.zoom<=width-8+1e-4);
 assert.ok(y-300*p.scale*frame.zoom>=hud.bottom-1e-4);assert.ok(y+28*p.scale*frame.zoom<=controls.top+1e-4);}
});
test('camera choices and projection do not mutate simulation coordinates or health',()=>{
 const w=new FinaleArena(),before=JSON.stringify(w.actors);
 camera.finaleCameraFrame(844,390,w,{camera:'stable'});camera.finaleCameraFrame(844,390,w,{camera:'classic'});
 assert.equal(JSON.stringify(w.actors),before);
});
test('paused frame stays frozen but viewport reflow gets a new safe frame',()=>{
 const w=new FinaleArena(),a=camera.finaleCameraFrame(844,390,w);w.player.x=800;
 assert.equal(camera.finaleCameraFrame(844,390,w,{previous:a,paused:true}),a);
 assert.notEqual(camera.finaleCameraFrame(390,844,w,{previous:a,paused:true}),a);
});
