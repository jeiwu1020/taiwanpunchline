import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as camera from '../dist/preview/finale/finale-camera.mjs';
import {FinaleArena,ARENA} from '../dist/preview/finale/finale-engine.mjs';
const geometry=JSON.parse(fs.readFileSync(new URL('./finale-small-geometry.json',import.meta.url)));
function inside(p,vertices){return vertices.every((v,i)=>{const q=vertices[(i+1)%vertices.length];return (q.x-v.x)*(p.y-v.y)-(q.y-v.y)*(p.x-v.x)>=-1e-6;});}
test('full floor rings and walking foot envelope remain within the rendered perimeter at every limit',()=>{
 assert.ok(camera.FINALE_FLOOR,'rendered floor bounds must explicitly include the foot envelope');
 const b=camera.FINALE_FLOOR,poly=[[b.left,b.back],[b.right,b.back],[b.right,b.front],[b.left,b.front]].map(([x,d])=>camera.finalePoint(x,430,d));
 for(const x of [ARENA.left,ARENA.right])for(const z of [ARENA.back,ARENA.front]){
  const p=camera.finalePoint(x,430,z);
  for(let i=0;i<64;i++){const a=i*Math.PI/32;assert.ok(inside({x:p.x+36*p.scale*Math.cos(a),y:p.y+9*p.scale*Math.sin(a)},poly));}
  for(const dx of [-65,65])for(const dy of [-16,16])assert.ok(inside({x:p.x+dx*p.scale,y:p.y+dy*p.scale},poly));
 }
});
test('recorded 568x320 landscape geometry keeps the player readable with fixed-scale stable follow',()=>{
 const w=new FinaleArena(),a=camera.finaleCameraFrame(568,320,w,geometry);
 assert.ok(a.zoom>=.20,`zoom ${a.zoom} leaves actors tiny`);assert.equal(a.arenaProfile,'player-stable');
 w.player.x=ARENA.right;w.player.depth=ARENA.front;
 const b=camera.finaleCameraFrame(568,320,w,{...geometry,previous:a});
 assert.equal(b.zoom,a.zoom);assert.notEqual(b.x,a.x);assert.ok(Number.isFinite(b.y));
});
test('small landscape spectator follows a living teammate rather than a fallen player',()=>{
 const w=new FinaleArena();w.player.hp=0;
 const a=camera.finaleCameraFrame(568,320,w,geometry);
 assert.equal(a.arenaFocusId,w.actors.find(x=>x.team===0&&x.hp>0).id);
});
test('short stable camera ignores jump height and velocity',()=>{
 const w=new FinaleArena(),a=camera.finaleCameraFrame(568,320,w,geometry);
 w.player.y=168;w.player.vy=-20;
 const b=camera.finaleCameraFrame(568,320,w,{...geometry,previous:a});
 assert.equal(b.x,a.x);assert.equal(b.y,a.y);assert.equal(b.zoom,a.zoom);
});
test('compact tactical markers preserve all seven locations including hidden opponents',()=>{
 assert.equal(typeof camera.finaleTacticalMarkers,'function');const w=new FinaleArena();
 w.actors[2].hp=0;const marks=camera.finaleTacticalMarkers(w);
 assert.equal(marks.length,7);assert.equal(marks.filter(m=>m.controlled).length,1);
 assert.equal(marks.find(m=>m.id===w.actors[2].id).alive,false);
 for(const m of marks){assert.ok(m.x>=0&&m.x<=1);assert.ok(m.y>=0&&m.y<=1);}
});

test('compact standing feet and jump/name envelope are inside actual safe pocket',()=>{
 for(const [width,height] of [[568,320],[844,390],[568,191],[844,280]]){
  const w=new FinaleArena();const opts={touch:true,camera:'stable',safeRect:{left:0,top:0,right:width,bottom:height},occlusions:[{left:0,top:0,right:width,bottom:Math.min(100,height*.4)},{left:0,top:height-100,right:100,bottom:height},{left:width-240,top:height-100,right:width,bottom:height}]};
  for(const depth of [-135,0,135])for(const x of [68,440,892]){
   Object.assign(w.player,{x,depth,y:430});const f=camera.finaleCameraFrame(width,height,w,opts);
   for(const y of [430,168]){const p=camera.finalePoint(x,y,depth),sx=(p.x-f.left)*f.zoom,sy=f.base+(p.y-430)*f.zoom;
    const box={left:sx-130*p.scale*f.zoom,right:sx+130*p.scale*f.zoom,top:sy-300*p.scale*f.zoom,bottom:sy+28*p.scale*f.zoom};
    assert.ok(box.left>=-1e-5&&box.right<=width+1e-5&&box.top>=-1e-5&&box.bottom<=height+1e-5,JSON.stringify({width,height,x,depth,y,box}));
    for(const o of opts.occlusions)assert.ok(box.right<=o.left||box.left>=o.right||box.bottom<=o.top||box.top>=o.bottom,'head/foot envelope overlaps measured UI');
   }
  }
 }
});
