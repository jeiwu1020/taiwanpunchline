import test from 'node:test';
import assert from 'node:assert/strict';
import * as signature from '../dist/art-signature.mjs';
const anchors={left:{x:-34,y:0},right:{x:34,y:0}};
test('lotus balance uses alternating grounded knees without going below floor',()=>{
 assert.equal(typeof signature.lotusBalance,'function','missing continuous lotus support rig');
 const states=[.22,.32,.43,.53].map(t=>signature.lotusBalance(t,anchors));
 assert.equal(new Set(states.map(s=>s.support)).size,2);
 for(const s of states){assert.ok(Math.abs(s.angle)<=.18);assert.ok(Math.abs(Math.max(s.knees.left.y,s.knees.right.y))<1e-7);assert.ok(Math.min(s.knees.left.y,s.knees.right.y)<0);}
});
test('lotus balance remains continuous at support handovers',()=>{
 assert.equal(typeof signature.lotusBalance,'function','missing continuous lotus support rig');
 let old=signature.lotusBalance(.18,anchors);
 for(let t=.1801;t<=.601;t+=.0001){const p=signature.lotusBalance(t,anchors);assert.ok(Math.abs(p.angle-old.angle)<.001);assert.ok(Math.abs(p.groundY-old.groundY)<.04);old=p;}
});
test('lotus support stops rocking before the end of the shout',()=>{
 assert.equal(typeof signature.lotusBalance,'function','missing continuous lotus support rig');
 for(const t of [0,.1,.65,.85,1.08]){const s=signature.lotusBalance(t,anchors);assert.equal(s.angle,0);assert.equal(s.groundY,0);}
});
test('Han correction draws one folded body and the approved shout head',()=>{
 const images={'han-lotus-body':{width:1280,height:1280,id:'lotus'},'han-head':{id:'calm'},'han-shout':{id:'shout'}},drawn=[];
 const ctx={globalAlpha:1,save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},drawImage(im,...args){drawn.push({im,args});}};
 assert.equal(signature.drawKneeArt(ctx,images,.7),true);
 assert.deepEqual(drawn.map(d=>d.im.id),['lotus','shout','lotus']); // Last draw is only the original front collar.
});
test('folded cutout is not drawn on top of the entry or recovery skeleton',()=>{
 for(const t of [0,.119,.981,1.08]){const drawn=[],ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...a){drawn.push(a);}};
  signature.drawKneeArt(ctx,{'han-lotus-body':{},'han-head':{}},t);assert.equal(drawn.length,0,'double body at '+t);}
});
test('two readable knee supports replace rapid tiny whole-body wobble',()=>{
 const states=Array.from({length:421},(_,i)=>signature.lotusBalance(.18+i*.001,anchors));
 const angles=states.map(s=>s.angle);
 assert.ok(Math.max(...angles)>.12,'left support should read at game size');
 assert.ok(Math.min(...angles)<-.12,'right support should read at game size');
 const signs=angles.filter(a=>Math.abs(a)>1e-5).map(a=>Math.sign(a));
 assert.equal(signs.slice(1).filter((s,i)=>s!==signs[i]).length,1,'one left-right pair, not four rapid knee steps');
});
test('entry and recovery wrists approach the held lotus pose without detached joints',async()=>{
 const {drawFighterArt}=await import('../dist/art-render.mjs');
 const ctx=new Proxy({globalAlpha:1},{get:(o,k)=>o[k]??(()=>{})}),images=new Proxy({},{get:()=>({})});
 const pose=t=>drawFighterArt(ctx,images,{type:'han',y:430,attack:{kind:'han_knee',age:t}},t*1000);
 for(const t of [.119,.981]){const p=pose(t);
  assert.ok(Math.hypot(p.arm.wrist.x+p.bodyX+12*122/140,p.arm.wrist.y+p.bodyY+85*122/140)<1);
  assert.ok(Math.hypot(p.farArm.wrist.x+p.bodyX-48*122/140,p.farArm.wrist.y+p.bodyY+72*122/140)<1);
  for(const a of [p.arm,p.farArm])for(const point of Object.values(a))assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
 }
 for(const [a,b] of [[0,.119],[.981,1.08]]){let prior=pose(a);for(let t=a+.001;t<=b;t+=.001){const p=pose(t);assert.ok(Math.hypot(p.arm.elbow.x-prior.arm.elbow.x,p.arm.elbow.y-prior.arm.elbow.y)<1);prior=p;}}
});
