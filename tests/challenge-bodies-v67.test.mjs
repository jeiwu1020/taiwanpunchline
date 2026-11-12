import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {GROUND} from '../dist/core.mjs';

const advance=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.step(1/60,input);};
function scene(xs=[550]){
 const g=new ChallengeRoute('wang','easy',()=>.5);
 g.player.x=480;g.spawn();const template=g.enemies[0];
 g.enemies=xs.map((x,i)=>({...template,id:`body-${i}`,x,aiWait:999,cooldowns:[0,0,0],spec:{...template.spec,speed:0}}));
 g.section={...g.section,spawns:[]};g.platforms=[];
 return g;
}
const outsideAll=g=>g.enemies.filter(e=>e.hp>0).every(e=>Math.abs(g.player.x-e.x)>=62-1e-6);

test('a living street body stops walking from either side without being pushed through',()=>{
 for(const right of [true,false]){
  const g=scene();g.player.x=right?480:620;
  advance(g,1,right?{right:true}:{left:true});
  assert.ok(right?g.player.x<550:g.player.x>550,'walking must retain its original side');
  assert.ok(outsideAll(g),'feet retain a full body gap');
  assert.equal(g.enemies[0].x,550,'walking does not bulldoze an idle mob');
 }
});

test('even a movement slice spanning the whole body cannot tunnel through it',()=>{
 const g=scene();g.growth.moveMultiplier=100;g.step(1/60,{right:true});
 assert.ok(g.player.x<=488,'swept movement stops on the near edge');
});

test('a jump clears the same street body and lands freely on the other side',()=>{
 const g=scene();advance(g,.3,{right:true});assert.ok(g.press('jump'));
 advance(g,1.3,{right:true});
 assert.ok(g.player.x>612);assert.equal(g.player.y,GROUND);assert.ok(outsideAll(g));
});

test('dead mobs do not block walking even before their fade has completed',()=>{
 const g=scene();g.enemies[0].hp=0;advance(g,.6,{right:true});
 assert.ok(g.player.x>612);
});

test('a player on a raised platform does not collide with a body on the street below',()=>{
 const g=scene();g.platforms=[{left:400,right:800,y:370}];
 g.player.y=g.player.supportY=370;advance(g,.6,{right:true});
 assert.ok(g.player.x>612);assert.equal(g.player.y,370);
});

test('bodies on the same raised platform still block walking',()=>{
 const g=scene();g.platforms=[{left:400,right:800,y:370}];
 for(const f of [g.player,...g.enemies])f.y=f.supportY=370;
 advance(g,.6,{right:true});assert.ok(g.player.x<550);assert.ok(outsideAll(g));
});

test('mobs on different platform heights do not nudge each other sideways',()=>{
 const g=scene([550,550]);g.platforms=[{left:400,right:800,y:370}];
 g.player.x=140;g.enemies[1].y=g.enemies[1].supportY=370;
 advance(g,.3);assert.deepEqual(g.enemies.map(e=>e.x),[550,550]);
});

test('landing in an overlapping enemy cluster resolves outside every body in either array order',()=>{
 for(const reverse of [false,true]){
  const g=scene([500,570,640]);if(reverse)g.enemies.reverse();
  g.player.x=570;g.player.y=GROUND-3;g.player.vy=180;
  g.step(1/60);
  assert.equal(g.player.y,GROUND);assert.ok(outsideAll(g),'landing is not embedded in an adjacent mob');
 }
});

test('cluster resolution uses the legal side at the left and right world boundaries',()=>{
 for(const edge of ['left','right']){
  const g=scene();const x=edge==='left'?70:g.worldWidth-95;
  g.enemies[0].x=x;g.player.x=x;g.player.y=GROUND-3;g.player.vy=180;
  g.step(1/60);
  assert.ok(outsideAll(g));assert.ok(g.player.x>=55&&g.player.x<=g.worldWidth-80);
 }
});
