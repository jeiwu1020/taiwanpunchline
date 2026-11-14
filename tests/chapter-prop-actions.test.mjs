import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {ensureChapterEncounter,interactChapterProp,stepChapterMob,updateChapterEncounter} from '../dist/chapter-encounters.mjs';
function setup(n){const w=new ChallengeDepthRoute('wang','easy',()=>.5,{runId:`chapter-${n}`});w.spawn();w.spawn=()=>{};w.platforms=[];const s=ensureChapterEncounter(w),p=s.props[0];w.player.x=p.x-55;w.player.depth=p.depth;w.player.face=1;return {w,s,p,e:w.enemies[0]};}
test('the chapter-three sign opens a different physical lane; the barrier never closes on an actor',()=>{
 const {w,s,p}=setup(3),g=s.gates[0];const before=g.depth;for(const e of w.enemies)e.x=2000;
 Object.assign(w.player,{x:g.left-65,depth:before,y:430});const from={x:w.player.x,depth:w.player.depth};w.player.x=g.right+80;w.resolveTableMotion(w.player,from);assert.ok(w.player.x<g.left);
 Object.assign(w.player,{x:p.x-55,depth:p.depth,face:1});assert.equal(interactChapterProp(w),true);updateChapterEncounter(w,.5);assert.equal(g.depth,-before);
 Object.assign(w.player,{x:g.left-65,depth:before});const free={x:w.player.x,depth:before};w.player.x=g.right+80;w.resolveTableMotion(w.player,free);assert.equal(w.player.x,g.right+80);
 p.cooldown=0;Object.assign(w.player,{x:p.x-55,depth:p.depth});Object.assign(w.enemies[0],{x:g.left+10,depth:before,y:430,hp:30});interactChapterProp(w);updateChapterEncounter(w,.5);assert.equal(g.depth,-before,'occupied lane must wait instead of enclosing the actor');
});
test('ringing the valet redirects a committed grab to the empty coat',()=>{
 const {w,p,e}=setup(4);Object.assign(e,{x:p.x+100,depth:p.depth,aiWait:0});stepChapterMob(w,e,.01);assert.ok(e.chapterTell);
 interactChapterProp(w);assert.equal(e.chapterTell.x,p.x);assert.equal(e.chapterTell.depth,p.depth);
 const hp=w.player.hp;stepChapterMob(w,e,e.chapterTell.delay+.01);assert.equal(w.player.hp,hp);assert.ok(e.chapterRest>0);
});
test('an opened cabinet catches paper and sends a physical stamped return toward its sender',()=>{
 const {w,s,p,e}=setup(5);Object.assign(e,{x:p.x+150,depth:p.depth,hp:30});w.enemies=[e];interactChapterProp(w);
 s.hazards.push({kind:'paper',owner:e,x:p.x+2,depth:p.depth,direction:-1,age:0,life:1.7,damage:8,hits:new Set()});
 const hp=e.hp;updateChapterEncounter(w,1/60);assert.equal(s.hazards.length,0);assert.equal(s.parcels.length,1);
 for(let i=0;i<100;i++)updateChapterEncounter(w,1/60);
 assert.ok(e.hp<hp,'return must interact with a real target, not only show copy');assert.equal(s.parcels.length,0);
});
test('sound interception produces an absorption effect at the screen instead of only a note',()=>{
 const {w,s,p,e}=setup(1);Object.assign(e,{x:p.x+160,depth:p.depth});s.hazards.push({kind:'sound',owner:e,x:p.x+2,depth:p.depth,direction:-1,age:0,life:1.7,damage:8,hits:new Set()});
 updateChapterEncounter(w,1/60);assert.equal(s.hazards.length,0);assert.ok(s.effects.some(f=>f.kind==='absorb'&&f.x===p.x));
});
test('a pushed cart stops at a solid table in its lane',()=>{
 const {w,p}=setup(2);w.enemies=[];w.platforms=[{left:p.x+65,right:p.x+160,depth:p.depth,depthHalf:36,y:350}];interactChapterProp(w);
 for(let i=0;i<60;i++)updateChapterEncounter(w,1/60);
 assert.ok(p.x<w.platforms[0].left);assert.equal(p.vx,0);
});
