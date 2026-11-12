import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterPose} from '../dist/art-motion.mjs';
const f=(extra={})=>({type:'wang',y:430,move:0,guard:false,stun:0,reaction:0,...extra});
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('rear arm participates in walk, guard and left jab',()=>{
 const idle=fighterPose(f(),0),walk=fighterPose(f({move:1}),120),jab=fighterPose(f({attack:{kind:'punch',age:.16,variant:'left'}}),0);
 assert.ok(idle.farArm,'far arm pose must exist');assert.ok(d(walk.farArm.wrist,idle.farArm.wrist)>5);assert.ok(jab.farArm.wrist.x>90);assert.ok(jab.arm.wrist.x<idle.arm.wrist.x);
});
test('crouch bends both knees with planted ankles and lowered body',()=>{
 const idle=fighterPose(f(),0),p=fighterPose(f({crouch:true,crouchBlend:1}),0);
 assert.ok(p.legs,'leg joints must exist');assert.ok(p.bodyY-idle.bodyY>=25);
 for(const side of ['near','far']){const l=p.legs[side];assert.ok(Math.abs(l.ankle.y+8)<1e-6);assert.ok(l.knee.x>l.hip.x);assert.ok(Math.abs(d(l.hip,l.knee)-35)<1e-6);assert.ok(Math.abs(d(l.knee,l.ankle)-40)<1e-6);}
});
test('third basic attack uses a raised kicking foot without changing support foot',()=>{
 const p=fighterPose(f({attack:{kind:'punch',age:.16,variant:'kick'}}),0);assert.ok(p.legs);assert.ok(p.legs.near.ankle.x>35);assert.ok(p.legs.near.ankle.y<-25);assert.ok(Math.abs(p.legs.far.ankle.y+8)<1e-6);
});
test('new limb poses remain finite and continuous through crouch and attack variants',()=>{
 for(const variant of ['left','right','kick']){let prev;for(let t=0;t<=.32;t+=1/240){const p=fighterPose(f({attack:{kind:'punch',age:t,variant}}),t*1000);assert.ok(p.farArm&&p.legs);for(const pt of [p.farArm.shoulder,p.farArm.elbow,p.farArm.wrist,...Object.values(p.legs.near),...Object.values(p.legs.far)])if(pt&&typeof pt==='object')assert.ok(Number.isFinite(pt.x)&&Number.isFinite(pt.y));if(prev){assert.ok(d(prev.farArm.wrist,p.farArm.wrist)<9);assert.ok(d(prev.legs.near.ankle,p.legs.near.ankle)<9);}prev=p;}}
});
test('leaving crouch keeps torso and hands continuous into jump and every attack',()=>{
 const before=fighterPose(f({crouch:true,crouchBlend:1}),0);
 const jump=fighterPose(f({y:425.27,crouchBlend:.9405}),1000/120);
 assert.ok(Math.abs(jump.bodyY-before.bodyY)<2,'crouch torso should ease out after takeoff');
 for(const kind of ['punch','heal','counter','rush','coin','shout','arrow']){
  const start=fighterPose(f({crouchBlend:1,attack:{kind,age:0,variant:'left'}}),0);
  assert.ok(d(start.arm.wrist,before.arm.wrist)<.001,kind+' near hand snaps');
  assert.ok(d(start.farArm.wrist,before.farArm.wrist)<.001,kind+' far hand snaps');
 }
});
test('crouched sip interruption starts from the recorded cup hand without double blending',()=>{
 const state=f({crouchBlend:.642857,attack:{kind:'heal',age:.05}}),before=fighterPose(state,50);
 const impact={wrist:{x:before.arm.wrist.x,y:before.arm.wrist.y-before.bob},headAngle:before.headAngle};
 const after=fighterPose({...state,attack:null,reaction:.52},50,.001,impact);
 assert.ok(d(before.arm.wrist,after.arm.wrist)<.1,'cup hand should begin at the impact pose');
});
