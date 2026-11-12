import test from 'node:test';
import assert from 'node:assert/strict';
import {drawChallengeMob,challengeMobKind} from '../dist/challenge-art.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';

function recorder(){
 const events=[],stack=[];let matrix=[1,0,0,1,0,0],clip=null,path=[],polygons=[];
 const mul=b=>{const[a,c,d,e,x,y]=matrix;matrix=[a*b[0]+d*b[1],c*b[0]+e*b[1],a*b[2]+d*b[3],c*b[2]+e*b[3],a*b[4]+d*b[5]+x,c*b[4]+e*b[5]+y];};
 const ctx=new Proxy({save(){stack.push({matrix:[...matrix],clip});},restore(){({matrix,clip}=stack.pop());},translate(x,y){mul([1,0,0,1,x,y]);},scale(x,y){mul([x,0,0,y,0,0]);},rotate(r){mul([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);},beginPath(){path=[];polygons=[];},moveTo(x,y){path.push([x,y]);polygons.push([[x,y]]);},lineTo(x,y){path.push([x,y]);polygons.at(-1).push([x,y]);},clip(){clip={points:[...path],polygons:polygons.map(p=>[...p])};},ellipse(){events.push({kind:'shadow'});},drawImage(image,...args){events.push({kind:'image',args,matrix:[...matrix],clip});}},{get:(o,k)=>o[k]??(()=>{})});
 return{ctx,events};
}
const images={'challenge-mobs':{}};
const overlap=(a,b)=>Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
function inside([x,y],polygon){
 let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)found=!found;
 }return found;
}

test('guard neck uses only cheek texture, never the open mouth, and stays tucked behind the collar',()=>{
 // The mouth bounds were inspected on the production atlas. Sampling this
 // feature for a neck repeats teeth/lips as a dark seam below the chin.
 const mouth=[178,706,72,69];
 for(const state of [{},{move:1},{attack:{kind:'punch',age:.15}},{reaction:.1},{crouch:true,crouchBlend:1},{y:350}])for(const face of [-1,1]){
  const {ctx,events}=recorder();ctx.scale(face,1);
  const p=drawChallengeMob(ctx,images,{mobKind:'guard',y:430,...state},112);
  const bridge=events.find(e=>e.kind==='image'&&e.args[2]<80&&e.args[3]<90);
  assert.ok(bridge,'separate skin texture connects the chin and collar');
  assert.equal(overlap(bridge.args.slice(0,4),mouth),0,'neck sampling must exclude the mouth');
  assert.ok(bridge.clip?.points.length>=4,'neck silhouette must taper rather than expose rectangular patch corners');
  const head=events.find(e=>e.kind==='image'&&e.args[0]===8&&e.args[1]===550&&e.args[2]===310);
  const collar=events.findLast(e=>e.kind==='image'&&e.clip&&e.args[2]===269);
  assert.ok(events.indexOf(bridge)<events.indexOf(head)&&events.indexOf(head)<events.indexOf(collar));
  for(const point of [[7,-154],[10,-151]]){
   assert.ok(bridge.clip.polygons.some(p=>inside(point,p)),'texture fills the right-shifted throat opening');
   assert.ok(collar.clip.polygons.every(p=>!inside(point,p)),'front collar must not cut horizontally across the throat');
  }
  // A small visible throat needs space above the collar. The old jaw reached
  // -152 and covered the whole opening, leaving the front collar on the chin.
  const jawBottom=head.matrix[5]+head.args[5]+head.args[7];
  assert.ok(jawBottom-p.bodyY-p.bob<=-157,'jaw must clear the front of the collar');
 }
});

test('guard head removes the atlas neck stump below the ear without cutting its ear or jaw',()=>{
 // Actual atlas landmarks: the ear ends at y=752, and the black jaw outline
 // follows x=64 below it. The skin at (43,764) belongs to a different neck,
 // far behind this character's collar. Keeping it creates a second stump.
 const headPoint=([x,y])=>[-55+(x-8)*111/310,-107+(y-550)*111/272];
 const poses=[{}, {move:1}, {attack:{kind:'punch',age:.15}}, {reaction:.1}, {reaction:.4}, {crouch:true,crouchBlend:1}, {y:350}];
 for(const state of poses)for(const face of [-1,1])for(const time of [0,112,300]){
  const {ctx,events}=recorder();ctx.scale(face,1);
  drawChallengeMob(ctx,images,{mobKind:'guard',y:430,...state},time);
  const head=events.find(e=>e.kind==='image'&&e.args[0]===8&&e.args[1]===550&&e.args[2]===310);
  assert.ok(head.clip,'guard head must remove the disconnected atlas neck, in head-local coordinates');
  for(const point of [[43,764],[53,773],[31,759]])assert.ok(head.clip.polygons.every(p=>!inside(headPoint(point),p)),`old neck ${point} is outside the head`);
  for(const point of [[40,724],[54,744],[65,750],[69,774],[82,792],[140,799]])assert.ok(head.clip.polygons.some(p=>inside(headPoint(point),p)),`ear and jaw ${point} remain intact`);
 }
});

test('renderer-owned ground shadows can suppress only the built-in mob shadow',()=>{
 const a=recorder(),b=recorder();
 drawChallengeMob(a.ctx,images,{mobKind:'guard',y:350},0);
 drawChallengeMob(b.ctx,images,{mobKind:'guard',y:350},0,{shadow:false});
 assert.equal(a.events.filter(e=>e.kind==='shadow').length,1);
 assert.equal(b.events.filter(e=>e.kind==='shadow').length,0);
 assert.deepEqual(b.events.filter(e=>e.kind==='image'),a.events.filter(e=>e.kind==='image'),'suppressing shadow must not remove body art');
});

test('renamed campaign mic fighters spawn under the same placard identity',()=>{
 const route=new ChallengeRoute('wang','easy',()=>.5);route.spawn();
 const mob=route.enemies.find(e=>e.template==='placard'||e.mobKind==='placard');
 assert.ok(mob);assert.equal(mob.name,'宣傳尖兵');assert.equal(challengeMobKind(mob),'mic');
});
