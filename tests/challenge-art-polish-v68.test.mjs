import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as art from '../dist/challenge-art.mjs';

const images=Object.fromEntries(['challenge-mobs','challenge-captains','challenge-street','challenge-street-deep','challenge-arena','challenge-street-props'].map(id=>[id,{id,width:1536,height:1024}]));
function recorder(){
 const events=[],stack=[];let clipped=false,matrix=[1,0,0,1,0,0];
 const mul=b=>{const[a,c,d,e,x,y]=matrix;matrix=[a*b[0]+d*b[1],c*b[0]+e*b[1],a*b[2]+d*b[3],c*b[2]+e*b[3],a*b[4]+d*b[5]+x,c*b[4]+e*b[5]+y];};
 const ctx=new Proxy({save(){stack.push({clipped,matrix:[...matrix]});},restore(){({clipped,matrix}=stack.pop());},translate(x,y){mul([1,0,0,1,x,y]);},scale(x,y){mul([x,0,0,y,0,0]);},rotate(r){mul([Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0]);},clip(){clipped=true;},drawImage(image,...args){events.push({id:image.id,args,clipped,matrix:[...matrix]});},fillRect(x,y,w,h){events.push({id:'sky-fill',args:[0,0,1,1,x,y,w,h],clipped,matrix:[...matrix]});}},{get:(o,k)=>o[k]??(()=>{})});
 return{ctx,events};
}
function sourceAt(event,x,y){
 const [a,b,c,d,tx,ty]=event.matrix,det=a*d-b*c;
 const localX=(d*(x-tx)-c*(y-ty))/det,localY=(-b*(x-tx)+a*(y-ty))/det;
 const [sx,sy,sw,sh,dx,dy,dw,dh]=event.args,u=(localX-dx)/dw,v=(localY-dy)/dh;
 return u>=0&&u<=1&&v>=0&&v<=1?{x:sx+sw*u,y:sy+sh*v}:null;
}
test('every street mob seats its head behind its own textured collar across moving poses',()=>{
 for(const kind of ['mic','flyer','guard','mini_mic','mini_guard'])for(const state of [{},{move:1},{crouch:true,crouchBlend:1},{y:350},{reaction:.3},{attack:{kind:'punch',age:.14}}]){
  const {ctx,events}=recorder();art.drawChallengeMob(ctx,images,{mobKind:kind,y:430,...state},140);
  const collar=events.find(e=>e.clipped&&e.args.length===8&&e.args[6]===90);
  assert.ok(collar,kind+' requires a front collar over the seated head/neck');
  const i=events.indexOf(collar);assert.ok(events.slice(0,i).some(e=>e.id===collar.id&&e.args[6]>=100),'head is drawn before collar');
 }
});
test('both captains draw separate generated head and vest art instead of enlarged street heads',()=>{
 for(const kind of ['mini_mic','mini_guard']){
  const {ctx,events}=recorder();art.drawChallengeMob(ctx,images,{mobKind:kind,y:430},0);
  const captain=events.filter(e=>e.id==='challenge-captains');assert.ok(captain.length>=3,'dedicated head, vest and prop');
 }
 const {ctx,events}=recorder();art.drawChallengeMob(ctx,images,{mobKind:'mic',y:430},0);assert.ok(events.every(e=>e.id!=='challenge-captains'));
});
test('background API paints an upward or downward extended viewport without uncovered pixels',()=>{
 assert.equal(typeof art.drawChallengeBackdrop,'function');
 for(const curbY of [-200,300,850]){
  const {ctx,events}=recorder();assert.equal(art.drawChallengeBackdrop(ctx,images,{width:960,height:540,curbY,buildingHeight:400,camera:900}),true);
  for(let y=0;y<=540;y+=30)for(let x=0;x<=960;x+=30)assert.ok(events.some(e=>sourceAt(e,x,y)),`painted ${x},${y} with curb ${curbY}`);
 }
});
test('sky extension is atmospheric colour, never stretched edge pixels or a second sun',()=>{
 const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{width:800,height:1600,curbY:1000,buildingHeight:715});
 const sky=events.find(e=>sourceAt(e,400,100));assert.ok(sky);assert.equal(sky.id,'sky-fill','sky must not stretch a multicoloured scanline');assert.ok(!events.some(e=>e.id!=='sky-fill'&&e.args[3]===1));
});
test('street ground keeps its source grain proportions below the original image',()=>{
 const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{width:800,height:2200,curbY:715,buildingHeight:715});
 const road=events.filter(e=>e.id==='challenge-street-deep'&&e.args[3]!==1024);
 assert.ok(road.some(e=>sourceAt(e,400,1300)),'asphalt covers the extension');
 for(const e of road){
  const [sx,sy,sw,sh,dx,dy,dw,dh]=e.args;
  assert.ok(Math.abs(dw/sw-dh/sh)<1e-9,'asphalt pixels must not stretch vertically into columns');
  assert.ok(sy>=940&&sy+sh<=988,'sample only the unmarked asphalt, below the manhole and above the edge line');
  assert.ok(e.matrix[3]>0,'road grain is not reflected vertically');
 }
});
test('extra retained coverage cannot change the already visible ground texture',()=>{
 const render=bottom=>{const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{width:800,height:1600,curbY:715,buildingHeight:715,bottom});return events.filter(e=>e.id==='challenge-street-deep'&&e.args[3]!==1024&&e.args[5]<1500);};
 assert.deepEqual(render(1600),render(2400),'cache margins may add more road, never change its source mapping');
});
test('adjacent horizontal tiles meet at the same source edge with alternating reflection',()=>{
 const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{width:3200,height:600,curbY:715,buildingHeight:715});
 const full=events.filter(e=>e.args[3]===1024);assert.ok(full.length>=3);
 for(let i=0;i<2;i++){
  const x=1536*(i+1);const a=sourceAt(full[i],x-.001,300),b=sourceAt(full[i+1],x+.001,300);
  assert.ok(a&&b);assert.ok(Math.abs(a.x-b.x)<.01,'source-edge pixels match at the seam');
 }
});
test('tile reflection remains world-anchored as the camera crosses positive and negative tile boundaries',()=>{
 const sample=camera=>{const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{width:1100,height:600,curbY:715,buildingHeight:715,camera});return events.filter(e=>e.args[3]===1024).map(e=>sourceAt(e,400,300)).find(Boolean);};
 for(const boundary of [-1536,0,1536])assert.ok(Math.abs(sample(boundary-.25).x-sample(boundary+.25).x)<1,'half-pixel camera motion must not flip the whole scene');
});
test('arena background selects its own scene and missing textures fail safely',()=>{
 assert.equal(typeof art.drawChallengeBackdrop,'function');
 const {ctx,events}=recorder();art.drawChallengeBackdrop(ctx,images,{arena:true});assert.ok(events.every(e=>e.id==='challenge-arena'||e.id==='sky-fill'));
 assert.equal(art.drawChallengeBackdrop(ctx,{},{}),false);
});
test('generated table and sign preserve bottom-centre registration at requested collision size',()=>{
 assert.equal(typeof art.drawChallengeStreetProp,'function');
 for(const kind of ['table','sign']){
  const {ctx,events}=recorder();assert.equal(art.drawChallengeStreetProp(ctx,images,kind,{x:480,y:430,width:240,height:110}),true);
  if(kind==='sign')assert.deepEqual(events[0].args.slice(-4),[360,320,240,110]);
  else{const [front,top]=events;assert.ok(top&&front);assert.ok(Math.abs(top.args.at(-3)+top.args.at(-1)*40/513-320)<1e-9);assert.ok(Math.abs(front.args.at(-3)+front.args.at(-1)-430)<1e-9);}
 }
});
test('all registered project-bound art has a real runtime asset on disk',()=>{
 for(const key of ['challenge-street-deep','challenge-arena','challenge-street-props','challenge-captains']){
  assert.ok(art.ART_FILES[key],key+' must be registered');assert.ok(existsSync(new URL('../dist/assets/'+art.ART_FILES[key],import.meta.url)));
 }
});
