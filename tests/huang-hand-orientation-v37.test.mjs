import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rosterMotion} from '../dist/art-roster-motion.mjs';
import {fighterPose} from '../dist/art-motion.mjs';
import * as signature from '../dist/art-signature.mjs';
import {drawFighterArt,ART_FILES} from '../dist/art-render.mjs';
import {ROSTER_SLEEVES} from '../dist/art-roster.mjs';

const images=Object.fromEntries(Object.keys(ART_FILES).map(id=>[id,{id}]));
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const boneAngle=a=>Math.atan2(a.wrist.x-a.elbow.x,a.elbow.y-a.wrist.y);
const fighter=(kind,age,face=1)=>({type:'huang',y:430,move:0,stun:0,reaction:0,face,attack:kind?{kind,age}:null});

// Observe production draw transforms at the Canvas boundary, including mirror,
// anchor and sleeve placement. The image fixture carries identity only.
function record(f){
 let m=[1,0,0,1,0,0];const stack=[],calls=[];
 const multiply=n=>{const [a,b,c,d,e,g]=m,[h,i,j,k,l,o]=n;m=[a*h+c*i,b*h+d*i,a*j+c*k,b*j+d*k,a*l+c*o+e,b*l+d*o+g];};
 const ctx=new Proxy({globalAlpha:1,save(){stack.push([...m]);},restore(){m=stack.pop();},translate(x,y){multiply([1,0,0,1,x,y]);},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},scale(x,y){multiply([x,0,0,y,0,0]);},drawImage(im,...args){calls.push({id:im.id,args,m:[...m]});}},{get:(o,k)=>o[k]??(()=>{})});
 ctx.scale(f.face,1);const pose=drawFighterArt(ctx,images,f,0,{shadow:false});return {calls,pose};
}
const point=(m,x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});

for(const [kind,hand] of [['huang_shout','point-back-right'],['huang_debt','back-right'],['huang_queue','back-right']]){
 test(`${kind} shows dorsal right-hand anatomy, not a left palm`,()=>{
  const motion=rosterMotion(kind,.3);assert.equal(motion.hand,hand);
  const frame=signature.HAND_FRAMES[motion.hand];assert.equal(frame.side,'right');assert.equal(frame.surface,'back');
  assert.notEqual(frame.image,'signature-hands','the palm atlas cannot supply a dorsal gesture');
 });
 test(`${kind} opens after startup and closes before returning to idle`,()=>{
  for(const t of [0,.001,1.1])assert.equal(rosterMotion(kind,t).hand,'fist');
  assert.notEqual(rosterMotion(kind,.3).hand,'fist');
 });
 test(`${kind} keeps the wrist within a readable bend through the whole motion`,()=>{
  assert.equal(typeof signature.signatureHandAngle,'function');let last;
  for(let t=0;t<=1.1;t+=1/240){
   const p=fighterPose(fighter(kind,t));const a=p.rosterAction;
   for(const [arm,target,turn] of [[p.arm,a.handAngle,a.handTurn],[p.farArm,a.farHandAngle,a.farHandTurn]]){
    const angle=signature.signatureHandAngle(arm,target,turn);
    assert.ok(Math.abs(delta(angle,boneAngle(arm)))<1.23,`${kind} wrist twisted at ${t}`);
   }
   const angle=signature.signatureHandAngle(p.arm,a.handAngle,a.handTurn);
   if(last!=null)assert.ok(Math.abs(delta(angle,last))<.06,'no abrupt wrist rotation');last=angle;
  }
 });
 for(const face of [1,-1])test(`${kind} hand and costume cuff meet on the wrist facing ${face}`,()=>{
  const {calls,pose}=record(fighter(kind,.3,face)),frame=signature.HAND_FRAMES[hand];assert.ok(frame);
  const draw=calls.findLast(c=>c.id===frame.image);assert.ok(draw,'dorsal sprite must actually be rendered');
  const origin=point(draw.m,0,0),want={x:face*(pose.bodyX+pose.arm.wrist.x),y:pose.bodyY+pose.arm.wrist.y};
  assert.ok(Math.hypot(origin.x-want.x,origin.y-want.y)<1e-8,'hand wrist stays on skeletal wrist');
  const s=ROSTER_SLEEVES.huang.near,cuff=calls.findLast(c=>c.id==='roster-costumes'&&c.args[0]===s.crop[0]);
  assert.deepEqual(cuff.args.slice(0,4),s.crop,'old fist must be excluded');
  const [sx,sy,sw,sh,dx,dy,dw,dh]=cuff.args;
  const seam=point(cuff.m,dx+(s.wrist[0]-sx)/sw*dw,dy+(s.wrist[1]-sy)/sh*dh);
  assert.ok(Math.hypot(seam.x-want.x,seam.y-want.y)<1e-8,'costume cuff seats on the same wrist');
  const det=draw.m[0]*draw.m[3]-draw.m[1]*draw.m[2];
  assert.equal(Math.sign(det),face*(frame.flipX?-1:1),'only the selected dorsal source is mirrored');
 });
}
test('debt keeps its separate anatomical left dorsal hand',()=>{
 const p=rosterMotion('huang_debt',.3),frame=signature.HAND_FRAMES[p.farHand];
 assert.equal(frame.side,'left');assert.equal(frame.surface,'back');assert.ok(!frame.flipX);
});
test('dorsal pointing loads its own transparent sprite without replacing the palm atlas',()=>{
 assert.equal(ART_FILES['right-hand-point'],'right-hand-point-v37.png');
 assert.equal(ART_FILES['signature-hands'],'signature-hands-v10.webp');
 const png=readFileSync(new URL('../dist/assets/'+ART_FILES['right-hand-point'],import.meta.url));
 assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png[25],6,'PNG must retain RGBA transparency');
 const h=signature.HAND_FRAMES['point-back-right'];
 assert.ok(h.r[0]>=0&&h.r[0]+h.r[2]<=png.readUInt32BE(16));
 assert.ok(h.r[1]>=0&&h.r[1]+h.r[3]<=png.readUInt32BE(20));
 assert.equal(h.includesSleeve,false);
});
test('idle, guard and ordinary punches retain the original fists',()=>{
 for(const extra of [{},{guard:true},{attack:{kind:'punch',age:.16,variant:'right'}},{attack:{kind:'punch',age:.16,variant:'left'}}]){
  const {calls}=record({...fighter(null,0),...extra});
  assert.ok(!calls.some(c=>['left-hand-back','right-hand-point'].includes(c.id)));
  assert.ok(calls.some(c=>c.id==='roster-costumes'&&c.args[0]===623&&c.args[3]===328));
 }
});
