import test from 'node:test';
import assert from 'node:assert/strict';
import {ART_FILES,drawFighterArt} from '../dist/art-render.mjs';
import {CAST} from '../dist/core.mjs';
const images=Object.fromEntries(Object.keys(ART_FILES).map(id=>[id,{id,width:1280,height:1280}]));
const base=type=>({type,y:430,face:1,move:0,guard:false,stun:0,reaction:0});
function record(f,time=0){
 const events=[],stack=[];let transform=[1,0,0,1,0,0],clip=false;
 const mul=b=>{const[a,c,d,e,x,y]=transform;transform=[a*b[0]+d*b[1],c*b[0]+e*b[1],a*b[2]+d*b[3],c*b[2]+e*b[3],a*b[4]+d*b[5]+x,c*b[4]+e*b[5]+y];};
 const context={globalAlpha:1,save(){stack.push({transform:[...transform],clip});},restore(){({transform,clip}=stack.pop());},translate(x,y){mul([1,0,0,1,x,y]);},scale(x,y){mul([x,0,0,y,0,0]);},rotate(a){mul([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},clip(){clip=true;events.push({kind:'clip'});},drawImage(image,...args){events.push({kind:'image',id:image.id,args,transform:[...transform],clip});}};
 const ctx=new Proxy(context,{get:(o,k)=>o[k]??(()=>{})});ctx.scale(f.face,1);const p=drawFighterArt(ctx,images,f,time,{shadow:false});return{events,pose:p};
}
const torso={wang:'wang-parts',han:'han-parts',ma:'roster-costumes',su:'roster-costumes',huang:'roster-costumes',chen:'final-costumes',ko:'final-costumes'};
for(const type of Object.keys(CAST))test(type+' seats the unchanged portrait behind its own front collar',()=>{
 const {events}=record(base(type));const i=events.findIndex(e=>e.kind==='image'&&e.id===type+'-head');assert.ok(i>=0);
 const head=events[i],front=events.slice(i+1).find(e=>e.kind==='image');
 assert.equal(front?.id,torso[type],'the front collar, not an arm, must immediately cover only the neck base');
 assert.equal(front.clip,true,'collar redraw must be limited to its measured front edge');
 const original=events.slice(0,i).filter(e=>e.kind==='image'&&e.id===torso[type]).at(-1);
 assert.deepEqual(front.args,original.args,'redraw the existing costume texture at exactly its existing registration');
 assert.ok(head.transform[5]>-163.8&&head.transform[5]<=-158.8,'small seating correction only; never shrink the face');
 assert.equal(head.args.at(-1),120,'approved portrait height stays unchanged');
});
for(const [type,kind,age,body,head] of [['wang','rush',.32,'wang-roll','wang-shock'],['han','arrow',.20,'han-archery','han-aim'],['han','arrow',.4,'han-release','han-aim'],['han','han_knee',.32,'han-lotus-body','han-shout'],['han','han_knee',.70,'han-lotus-body','han-shout']])test(kind+' '+age+' has the same collar sandwich on its integrated action body',()=>{
 const {events}=record({...base(type),attack:{kind,age}},age*1000);const i=events.findIndex(e=>e.kind==='image'&&e.id===head);assert.ok(i>=0);const front=events.slice(i+1).find(e=>e.kind==='image');assert.equal(front?.id,body);assert.equal(front.clip,true);
});
test('collar placement mirrors with the torso across hit, crouch and every special, without changing arm poses',()=>{
 for(const type of Object.keys(CAST))for(const state of [{},{crouch:true,crouchBlend:1},{reaction:.38},{reaction:.10},{y:370},...CAST[type].moves.flatMap(m=>[.04,m.start||.2,m.duration*.85].map(age=>({attack:{kind:m.kind,age}})))]){
  const right=record({...base(type),...state,face:1},180),left=record({...base(type),...state,face:-1},180);assert.deepEqual(left.pose,right.pose);
  const a=right.events.filter(e=>e.kind==='image'&&e.clip&&!['art-props','signature-hands'].includes(e.id)),b=left.events.filter(e=>e.kind==='image'&&e.clip&&!['art-props','signature-hands'].includes(e.id));assert.equal(a.length,1,type+' has exactly one front collar');assert.equal(b.length,1);
  assert.ok(Math.abs(b[0].transform[0]+a[0].transform[0])<1e-9);assert.ok(Math.abs(b[0].transform[4]+a[0].transform[4])<1e-9);assert.equal(b[0].transform[5],a[0].transform[5]);
 }
});
