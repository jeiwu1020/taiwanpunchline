import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterPose,solveArm,activeSpitAge,retainSpitEpisode,arrowPresentation} from '../dist/art-motion.mjs';
const durations={punch:.32,rush:.72,counter:.84,heal:1.2,coin:.48,shout:.6,arrow:.55};
const f=()=>({type:'wang',y:430,move:0,guard:false,stun:0,reaction:0});
test('every attack uses finite fixed-length arm poses without elbow branch reversal',()=>{
 for(const [kind,duration]of Object.entries(durations))for(let age=0;age<=duration;age+=1/240){
  const p=fighterPose({...f(),attack:{kind,age}},age*1000),a=p.arm;
  for(const point of[a.shoulder,a.elbow,a.wrist])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  assert.ok(Math.abs(Math.hypot(a.elbow.x-a.shoulder.x,a.elbow.y-a.shoulder.y)-57)<1e-6);
  assert.ok(Math.abs(Math.hypot(a.wrist.x-a.elbow.x,a.wrist.y-a.elbow.y)-57)<1e-6);
  const cross=(a.wrist.x-a.shoulder.x)*(a.elbow.y-a.shoulder.y)-(a.wrist.y-a.shoulder.y)*(a.elbow.x-a.shoulder.x);
  assert.ok(cross>0,`${kind} elbow branch reversed at ${age}`);
 }
});
test('active arm interpolation is continuous within each move',()=>{
 for(const [kind,duration]of Object.entries(durations)){let previous;for(let age=0;age<=duration;age+=1/240){
  const p=fighterPose({...f(),attack:{kind,age}},age*1000);if(previous)assert.ok(Math.hypot(p.arm.elbow.x-previous.x,p.arm.elbow.y-previous.y)<6,`${kind} elbow jumped`);previous=p.arm.elbow;
 }}
});
test('heal stays lifted through its one-second reward and lowers by1.2 seconds',()=>{
 const at=age=>fighterPose({...f(),attack:{kind:'heal',age}},0);
 assert.equal(at(0).arm.wrist.y,-126.6);assert.equal(at(.4).arm.wrist.y,-171);
 assert.ok(Math.abs(at(1.2).arm.wrist.y+126.6)<1e-6);
});
test('interrupt keeps connected drinking arm and shocked expression',()=>{
 const p=fighterPose(f(),0,.2);assert.equal(p.head,'shock');assert.equal(p.spit,.2);assert.ok(p.arm.wrist.x>38);
});
test('degenerate or distant IK targets stay finite',()=>{
 for(const w of[{x:0,y:0},{x:1000,y:500}])for(const p of Object.values(solveArm({x:0,y:0},w)))assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
});
test('early, full and late heal interruptions begin at impact and return smoothly',()=>{
 const idle=fighterPose(f(),0);
 for(const age of [.05,.4,.95]){
  const hit=fighterPose({...f(),attack:{kind:'heal',age}},0),impact={wrist:hit.arm.wrist,headAngle:hit.headAngle};
  let prior=hit;
  for(let t=.001;t<.52;t+=1/240){const p=fighterPose(f(),0,t,impact);
   for(const key of ['wrist','elbow'])assert.ok(Math.hypot(p.arm[key].x-prior.arm[key].x,p.arm[key].y-prior.arm[key].y)<6,`${age}: ${key} jumped at ${t}`);
   assert.ok(p.arm.wrist.y>=prior.arm.wrist.y-1e-6,'interrupted cup must not lift back toward the mouth');
   if(t===.001)assert.ok(Math.hypot(p.arm.wrist.x-hit.arm.wrist.x,p.arm.wrist.y-hit.arm.wrist.y)<1);
   prior=p;
  }
  for(const key of ['wrist','elbow'])assert.ok(Math.hypot(idle.arm[key].x-prior.arm[key].x,idle.arm[key].y-prior.arm[key].y)<1);
 }
});
test('a newer attack or guard retires spit instead of allowing it to return',()=>{
 for(const action of ['punch','rush','counter','guard']){
  let record={time:0,impact:{wrist:{x:10,y:-130}}};
  const next=action==='guard'?{...f(),guard:true}:{...f(),attack:{kind:action,age:0}};
  record=retainSpitEpisode(record,next,280);assert.equal(record,null);
  record=retainSpitEpisode(record,f(),330);assert.equal(record,null);
  assert.equal(activeSpitAge(f(),330,record?.time),0);
 }
});
test('spit age is tied to the supplied frozen animation clock',()=>{
 assert.equal(activeSpitAge(f(),1200,1000),.2);assert.equal(activeSpitAge(f(),1200,1000),.2);assert.equal(activeSpitAge(f(),1530,1000),0);
});
test('arrow presentation begins on nocked shaft and converges to unchanged impact path',()=>{
 for(const face of [1,-1]){
  const start=arrowPresentation({x:face*45,y:-140,vx:face*200,vy:-495,age:0});
  assert.equal(start.x,face*86);assert.equal(start.y,-155);assert.equal(start.width,150);assert.equal(start.angle,face>0?0:Math.PI);
  const end=arrowPresentation({x:face*285,y:380,vx:face*200,vy:645,age:1.2});assert.equal(end.x,face*285);assert.equal(end.y,380);
 }
});
test('arrow clears the bow horizontally before turning into its arc',()=>{
 for(const face of [1,-1]){
  const age=.10,v=arrowPresentation({x:face*(45+187.5*age),y:-140-495*age+475*age*age,vx:face*187.5,vy:-495+950*age,age});
  assert.equal(v.angle,face>0?0:Math.PI);
  assert.ok(face*v.x-v.width/2>80,'tail clears the forward bow silhouette before rotation');
  assert.ok(Math.abs(v.y+155)<2);
 }
});
