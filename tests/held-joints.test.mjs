import {fighterPose,solveArm} from '../dist/art-motion.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
const root=process.env.JOINT_ROOT??new URL('../dist/',import.meta.url).href;
const {drawChallengeMob}=await import(root+'challenge-art.mjs');
const {drawChapter2Miniboss:draw2}=await import(root+'preview/chapter2/chapter2-mob-art.mjs');
const {drawChapter2Miniboss:draw3}=await import(root+'preview/chapter3/chapter2-mob-art.mjs');
const {drawChapter4Miniboss:draw4}=await import(root+'preview/chapter4/chapter4-mob-art.mjs');
import {anchors} from './helpers/joint-test-fixtures.mjs';
function recorder(){let m=[1,0,0,1,0,0],stack=[],calls=[];const mul=b=>{let [a,c,d,e,x,y]=m;m=[a*b[0]+d*b[1],c*b[0]+e*b[1],a*b[2]+d*b[3],c*b[2]+e*b[3],a*b[4]+d*b[5]+x,c*b[4]+e*b[5]+y]};return {calls,ctx:new Proxy({save(){stack.push([...m])},restore(){m=stack.pop()},translate(x,y){mul([1,0,0,1,x,y])},scale(x,y){mul([x,0,0,y,0,0])},rotate(a){mul([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},drawImage(img,...a){calls.push({m:[...m],a})}},{get:(o,k)=>o[k]??(()=>{})})}}
const cases=[['placard',drawChallengeMob,'placard'],['leaflet',drawChallengeMob,'leaflet'],['barricade',drawChallengeMob,'barricade'],['c1-mic',drawChallengeMob,'mini_mic'],['c1-guard',drawChallengeMob,'mini_guard'],['c2-mic',draw2,'mini_mic'],['c2-guard',draw2,'mini_guard'],['c3-mic',draw3,'mini_mic'],['c3-guard',draw3,'mini_guard'],['c4-mic',draw4,'mini_schedule'],['c4-guard',draw4,'mini_marshal']];
for(const [id,draw,kind] of cases)test(`${id}: visible cuff inlet follows the forearm wrist and angle`,()=>{for(const face of [-1,1])for(const attack of [null,{kind:'punch',age:.15},{kind:'coin',age:.2},{kind:'huang_shout',age:.3}]){
 const {ctx,calls}=recorder();ctx.scale(face,1);const mob={mobKind:kind,y:430,attack};const p=draw(ctx,{'challenge-mobs':{},'challenge-captains':{},'chapter2-miniboss-atlas':{},'chapter4-miniboss-atlas':{}},mob,0,{shadow:false});
 const last=calls.at(-1),[ax,ay,angle]=anchors[id],a=last.a,m=last.m,local={x:a[4]+a[6]*ax,y:a[5]+a[7]*ay},point={x:m[0]*local.x+m[2]*local.y+m[4],y:m[1]*local.x+m[3]*local.y+m[5]},sx=id.startsWith('c')?1.1:1,sy=id.startsWith('c')?1.06:1;
 const expected={x:(p.arm.wrist.x+p.bodyX)*sx*face,y:(p.arm.wrist.y+p.bodyY)*sy};assert.ok(Math.hypot(point.x-expected.x,point.y-expected.y)<.01,`cuff inlet misses wrist by ${Math.hypot(point.x-expected.x,point.y-expected.y)}`);
 const sourceAngle=Math.atan2(Math.sin(angle)*a[7],Math.cos(angle)*a[6]);const u={x:Math.cos(sourceAngle),y:Math.sin(sourceAngle)};const world={x:m[0]*u.x+m[2]*u.y,y:m[1]*u.x+m[3]*u.y};const arm={x:(p.arm.wrist.x-p.arm.elbow.x)*sx*face,y:(p.arm.wrist.y-p.arm.elbow.y)*sy};assert.ok((world.x*arm.x+world.y*arm.y)/Math.hypot(world.x,world.y)/Math.hypot(arm.x,arm.y)>.999,'hand axis follows forearm');
}});

test('all held-joint repairs leave the actor and its skeleton unchanged',()=>{
 for(const [id,draw,mobKind] of cases)for(const state of [{},{move:1},{guard:true},{attack:{kind:'punch',age:.15}},{attack:{kind:'coin',age:.2}},{attack:{kind:'huang_queue',age:.3}},{reaction:.1},{crouch:true,crouchBlend:1},{y:350}]){
 const mob={mobKind,y:430,...state},snapshot=structuredClone(mob),expected=fighterPose({...mob,type:'wang',supportY:430},112);
 if(['c2-guard','c3-guard','c4-guard'].includes(id)&&!expected.kind&&!mob.guard)expected.arm=solveArm(expected.arm.shoulder,{x:21,y:-88+expected.bob});
 const {ctx}=recorder(),actual=draw(ctx,{'challenge-mobs':{},'challenge-captains':{},'chapter2-miniboss-atlas':{},'chapter4-miniboss-atlas':{}},mob,112,{shadow:false});
 assert.deepEqual(actual,expected,id);assert.deepEqual(mob,snapshot,id+' must not mutate its gameplay actor');
 }
});
