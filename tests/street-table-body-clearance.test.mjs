import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
const radius=44;
function scene(type='wang'){const g=new ChallengeDepthRoute(type,'easy',()=>.5);g.section={...g.section,spawns:[]};g.enemies=[];g.supplyUsed=true;return g;}
function advance(g,input,n=90){for(let i=0;i<n;i++)g.step(1/60,input);}
test('all seven bodies stop clear of both table sides rather than centre on the edge',()=>{
 for(const type of ['wang','han','ma','su','huang','chen','ko'])for(const sign of [-1,1]){const g=scene(type),p=g.player,t=g.platforms[0];Object.assign(p,{x:sign<0?t.left-100:t.right+100,depth:0});advance(g,sign<0?{right:true}:{left:true});assert.equal(p.x,sign<0?t.left-radius:t.right+radius);}
});
test('side clearance is swept for high speed and restored overlaps',()=>{
 for(const sign of [-1,1]){const g=scene(),p=g.player,t=g.platforms[0],edge=sign<0?t.left-radius:t.right+radius;Object.assign(p,{x:sign<0?t.right+200:t.left-200,depth:0});g.resolveTableMotion(p,{x:sign<0?t.left-200:t.right+200,depth:0});assert.equal(p.x,edge);Object.assign(p,{x:sign<0?t.left-3:t.right+3});g.resolveTableMotion(p,{x:p.x,depth:0});assert.equal(p.x,edge);}
});
test('body padding does not create an invisible tabletop or block jump landing and walkoff',()=>{
 for(const sign of [-1,1]){const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:sign<0?t.left-radius:t.right+radius,depth:0});g.press('jump');advance(g,sign<0?{right:true}:{left:true},32);advance(g,{},80);assert.equal(p.supportY,t.y);advance(g,sign<0?{left:true}:{right:true},100);assert.equal(p.y,430);assert.equal(p.supportY,430);}
 const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:t.left-20,depth:0,y:t.y-30,vy:100,supportY:430});advance(g,{},100);assert.equal(p.y,430);assert.ok(p.x<=t.left-radius);
});
test('outside lanes stay passable and corners allow depth sliding',()=>{
 for(const depth of [-85,85]){const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:t.left-100,depth});advance(g,{right:true},150);assert.ok(p.x>t.right);}
 const g=scene(),p=g.player,t=g.platforms[0];Object.assign(p,{x:t.left-radius,depth:0});advance(g,{up:true},50);assert.ok(p.depth<-36);
});
