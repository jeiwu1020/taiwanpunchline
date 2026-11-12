import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST} from '../dist/core.mjs';
import {fighterPose} from '../dist/art-motion.mjs';
const base=type=>({type,y:430,move:0,guard:false,stun:0,reaction:0});
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const type of ['ma','su','huang','chen','ko'])for(const m of CAST[type].moves)test(`${m.kind} has connected, distinct and continuous animation`,()=>{
 const rest=fighterPose(base(type),0);let prev,moved=0;
 for(let t=0;t<=m.duration;t+=1/240){const p=fighterPose({...base(type),attack:{kind:m.kind,age:t}},t*1000);assert.ok(p.rosterAction,'new action must have an authored pose');for(const key of ['arm','farArm']){const a=p[key];assert.ok(Number.isFinite(a.wrist.x)&&Number.isFinite(a.elbow.y));assert.ok(Math.abs(d(a.shoulder,a.elbow)-(key==='arm'?57:42))<1e-6);if(prev)assert.ok(d(a.wrist,prev[key].wrist)<12,m.kind+' wrist jump');moved=Math.max(moved,d(a.wrist,rest[key].wrist));}prev=p;}
 assert.ok(moved>8,'not a static reskin');
});
