import test from 'node:test';import assert from 'node:assert/strict';import {fighterPose} from '../dist/art-motion.mjs';import {drawKneeArt} from '../dist/art-signature.mjs';
const f=(type,kind,age,extra={})=>({type,y:430,face:1,move:0,stun:0,reaction:0,attack:kind?{kind,age}:null,...extra});
test('V13 contact grip fixes both near wrists at a common cuff height instead of extra hands',()=>{
 for(const type of ['wang','han','ma','su','huang','chen','ko']){const p=fighterPose(f(type,null,0,{grabbedPose:.18}),0);assert.equal(p.capture,true);assert.ok(Math.abs(p.arm.wrist.x-33)<.1);assert.ok(Math.abs(p.arm.wrist.y+133)<.1);}
});
test('upward palm and low bag actually change their limb directions',()=>{
 const palm=fighterPose(f('ma','ma_gaze',.30),300);assert.ok(palm.arm.wrist.y<-190);
 const bag=fighterPose(f('ko','ko_bags',.20),200);assert.ok(bag.arm.wrist.y>-112);
 const query=fighterPose(f('chen','chen_question',.46),460);assert.ok(query.farArm.wrist.y>-115);
});
test('drinking stays at the mouth through the new one-second healing cue',()=>{
 const sip=fighterPose(f('wang','heal',.95),950);assert.ok(sip.arm.wrist.y<-164);assert.equal(sip.head,'sip');
});
test('Han folded body and attached head are low enough for high projectile clearance',()=>{
 const moves=[],ctx={save(){},restore(){},translate(x,y){moves.push([x,y])},rotate(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){}};
 drawKneeArt(ctx,{'han-lotus-body':{},'han-head':{}},.4);
 assert.ok(moves.some(([x,y])=>Math.abs(y+122)<.01),'head neck should lower coherently with folded body');
});
test('rolled cutout visibility follows the real low-profile active window',()=>{
 for(let t=0;t<.73;t+=1/240){const p=fighterPose({type:'wang',y:430,attack:{kind:'rush',age:t}},0);assert.equal(p.roll>.6,t>=.16&&t<.50,'t='+t)}
});
