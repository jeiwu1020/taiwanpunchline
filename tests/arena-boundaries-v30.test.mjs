import test from 'node:test';import assert from 'node:assert/strict';
import {Duel,GROUND} from '../dist/core.mjs';
const edges=await import('../dist/arena-boundaries.mjs').catch(()=>({}));
test('natural boundary markers use unchanged world limits and sit outside the idle feet',()=>{
 assert.deepEqual(edges.ARENA_BOUNDS,{centerLeft:68,centerRight:892,ground:430,innerLeft:24,innerRight:936});
 const d=new Duel('wang','easy',()=>.5,'han');d.player.x=-100;d.enemy.x=1200;d.moveFighter(d.player,-100,false);d.moveFighter(d.enemy,1200,false);
 assert.equal(d.player.x,68);assert.equal(d.enemy.x,892);assert.equal(GROUND,430);
});
test('boundary decoration is fixed world geometry and never changes fighters',()=>{
 assert.equal(typeof edges.drawArenaBoundaries,'function');const calls=[];const g=new Proxy({}, {get:(_,key)=>(...args)=>{calls.push([key,...args]);return g;}});
 edges.drawArenaBoundaries(g);assert.ok(calls.some(c=>c[0]==='fillRoundedRect'&&c[1]===12&&c[2]===352));assert.ok(calls.some(c=>c[0]==='fillRoundedRect'&&c[1]===936&&c[2]===352));
 const a=JSON.stringify(calls);calls.length=0;edges.drawArenaBoundaries(g);assert.equal(JSON.stringify(calls),a);
});
