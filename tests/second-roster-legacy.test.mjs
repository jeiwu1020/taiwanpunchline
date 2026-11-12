import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from '../dist/core.mjs';
// V9 byte-for-byte hashes are obsolete: V13 explicitly changes all shared
// contact/guard rules and all five previously untouched Wang/Han moves.
// Retain their lifecycle, seeded repeatability, pause and orientation coverage.
const tick=(g,s)=>{for(let t=0;t<s-1e-9;t+=1/120)g.step(Math.min(1/120,s-t),{},false);};
for(const id of Object.keys(CAST))for(let slot=1;slot<=3;slot++)test(`${id} special${slot}: V13 lifecycle, no refund and pause safety`,()=>{for(const who of ['player','enemy']){const g=new Duel(id,'normal',()=>.5,id),f=g[who];g.player.x=68;g.enemy.x=892;assert.equal(g.request(f,'special'+slot),true);const cd=f.cooldowns[slot-1];assert.ok(cd>0);assert.equal(g.request(f,'special'+slot),false);tick(g,.04);g.status='paused';const before=JSON.stringify([f,g.remaining,g.projectiles,g.obstacles]);tick(g,.6);assert.equal(JSON.stringify([f,g.remaining,g.projectiles,g.obstacles]),before);assert.equal(g.press('jump'),false);g.status='active';tick(g,1.7);assert.equal(f.attack,null);assert.ok(f.cooldowns[slot-1]>0);tick(g,cd);assert.equal(f.cooldowns[slot-1],0);assert.equal(g.request(f,'special'+slot),true);}});
test('seeded AI choices and combat remain deterministic',()=>{const run=()=>{let seed=18;const g=new Duel('chen','normal',()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),'ko');for(let i=0;i<1800;i++){if(i%55===0)g.press('special'+(i%3+1));g.step(1/120,{right:i<120});}return JSON.stringify([g.player,g.enemy,g.stats,g.projectiles.map(p=>({...p,owner:p.owner.id})),g.obstacles.map(p=>({...p,owner:p.owner.id}))]);};assert.equal(run(),run());});
