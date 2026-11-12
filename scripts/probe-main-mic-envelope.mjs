import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {drawFighterArt,ART_FILES} from '../dist/art-render.mjs';
import {presentationFighter as chapter2RenderActor} from '../dist/move-readability.mjs';

import {CAST,GROUND,Duel} from '../dist/core.mjs';
import {depthRouteCameraFrame,mainRouteMicPlan} from '../dist/challenge-depth-render.mjs';
const canvas=createCanvas(1,1),ctx=canvas.getContext('2d'),texture=createCanvas(1536,1536);
ctx.beginPath();ctx.rect(0,0,0,0);ctx.clip(); // Suppress pixel work, retain exact canvas matrix operations.
const images=Object.fromEntries(Object.keys(ART_FILES).map(k=>[k,texture]));
let primitives=[];
function geometry(kind,points,pad=2){const m=ctx.getTransform(),tr=m.a*m.a+m.b*m.b+m.c*m.c+m.d*m.d,det=m.a*m.d-m.b*m.c,sigma=Math.sqrt((tr+Math.sqrt(Math.max(0,tr*tr-4*det*det)))/2);pad=Math.max(2,(pad-1)*sigma+1);points=points.map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));primitives.push({kind,points,left:Math.min(...points.map(p=>p.x))-pad,right:Math.max(...points.map(p=>p.x))+pad,top:Math.min(...points.map(p=>p.y))-pad,bottom:Math.max(...points.map(p=>p.y))+pad});}

const primitiveCtx=new Proxy(ctx,{get(t,k){const v=t[k];if(typeof v!=='function')return v;return (...a)=>{
 if(k==='arc'){
  const [x,y,r,start,end,ccw=false]=a,TAU=Math.PI*2;
  let span=ccw?start-end:end-start;if(Math.abs(end-start)>=TAU)span=TAU;else span=(span%TAU+TAU)%TAU;
  const m=ctx.getTransform(),ax=Math.atan2(m.c,m.a),ay=Math.atan2(m.d,m.b),angles=[start,end];for(const q of [ax,ax+Math.PI,ay,ay+Math.PI]){const delta=((ccw?start-q:q-start)%TAU+TAU)%TAU;if(delta<=span)angles.push(q);}
  geometry(k,angles.map(v=>[x+r*Math.cos(v),y+r*Math.sin(v)]),Math.max(2,ctx.lineWidth/2+1));
 }else if(k==='moveTo'||k==='lineTo'||k==='quadraticCurveTo'||k==='bezierCurveTo')geometry(k,Array.from({length:a.length/2},(_,i)=>a.slice(i*2,i*2+2)),Math.max(2,ctx.lineWidth/2+1));
 else if(k==='fillText'||k==='strokeText'){const m=ctx.measureText(a[0]),x=a[1],y=a[2];geometry(k,[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]],2);}
 if(k==='drawImage'){
  const [x,y,w,h]=a.length===9?a.slice(5):a.length===5?a.slice(1):[a[1],a[2],a[0].width,a[0].height];
  const m=t.getTransform(),points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));
  primitives.push({kind:k,points,left:Math.min(...points.map(p=>p.x))-2,right:Math.max(...points.map(p=>p.x))+2,top:Math.min(...points.map(p=>p.y))-2,bottom:Math.max(...points.map(p=>p.y))+2});
 }
 if(['drawImage','fill','stroke','fillText','strokeText','fillRect','strokeRect'].includes(k))return;
 return v.apply(t,a);
 };},set(t,k,v){t[k]=v;return true;}});
const summaries={},critical=[],poses=[];
let count=0;
function sample(base,patch,label,time){
 const actor=chapter2RenderActor({...base,...patch}),rec={context:primitiveCtx};primitives=[];
 ctx.save();drawFighterArt(rec.context,images,actor,time,{shadow:false});ctx.restore();
 const b=primitives.reduce((b,r)=>({left:Math.min(b.left,r.left),right:Math.max(b.right,r.right),top:Math.min(b.top,r.top),bottom:Math.max(b.bottom,r.bottom)}),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});if(!b||!Object.values(b).every(Number.isFinite))throw new Error('Invalid bounds');
 const record={type:actor.type,label,time,patch,bounds:b,highestImages:primitives.toSorted((a,b)=>a.top-b.top).slice(0,2)};
 poses.push({type:actor.type,label,patch,time,bounds:b,images:primitives}); count++;
 const key=actor.type+':'+label;let s=summaries[key];if(!s)s=summaries[key]={count:0,top:Infinity,left:Infinity,right:-Infinity,bottom:-Infinity};s.count++;
 for(const edge of ['top','left','right','bottom'])if((edge==='top'||edge==='left')?b[edge]<s[edge]:b[edge]>s[edge]){s[edge]=b[edge];s[edge+'Pose']=record;}
}
for(const type of Object.keys(CAST)){
 const base=new Duel(type,'beginner',()=>.5).player;
 for(const y of [430,429,405,380,300,250])for(let i=0;i<=120;i++){
  const time=i*20;
  for(const move of [-1,0,1])sample(base,{y,move},'locomotion',time);
  sample(base,{y,guard:true},'guard',time);
  sample(base,{y,reaction:i/120*.52,stun:.3},'reaction',time);
  sample(base,{y,crouchBlend:i/120},'crouch',time);
  sample(base,{y,land:i/120*.18},'landing',time);
  sample(base,{y,grabPose:.22},'capture',time);
 }
 for(const variant of ['left','right','kick'])for(const y of [430,380,250])for(let i=0;i<=120;i++)sample(base,{y,attack:{kind:'punch',variant,age:i/120*.4}},'punch-'+variant,i*20);
 for(const move of CAST[type].moves){
  const n=Math.ceil(move.duration*480);
  for(const y of [430,380,250])for(let i=0;i<=n;i++)for(const outcome of ['pending','hit','counter','miss']){
   const age=i/n*move.duration;
   sample(base,{y,attack:{kind:move.kind,age,presentationOutcome:outcome,outcomeAge:age}},move.kind,i*20);
  }
  for(let i=0;i<=180;i++)sample(base,{performance:{kind:move.kind,age:i/180*(move.duration+.28),duration:move.duration+.28,outcome:'hit',outcomeAge:i/180}},move.kind+'-release',i*20);
 }
}
const all={count,method:'480 Hz attack-age mesh across four outcomes and three heights; 121-phase locomotion/reaction/crouch/landing/guard/capture mesh across six heights; presentation release sampled separately. Native canvas transforms, drawing calls suppressed, conservative transformed source/destination draw rectangles including transparent crop margins. Arc bounds use actual angular sweep plus stroke/AA padding; path controls are conservative; text uses native font metrics. No image-alpha measurement. Clipping paths are not subtracted. Native primitive draw calls are suppressed after recording. Continuous-time maximum is NOT proven.',summaries,byType:{},viewports:[]};
for(const type of Object.keys(CAST)){const ps=poses.filter(p=>p.type===type);all.byType[type]={count:ps.length,top:ps.reduce((a,p)=>p.bounds.top<a.bounds.top?p:a),left:ps.reduce((a,p)=>p.bounds.left<a.bounds.left?p:a),right:ps.reduce((a,p)=>p.bounds.right>a.bounds.right?p:a)};}
for(const [width,height] of [[360,640],[390,844],[768,1024],[844,390],[932,430],[1280,720],[1920,1080]]){
 let minGap=Infinity;
 for(const y of [-1000,-100,100,250,430])for(const depth of [-90,0,100]){
 const frame=depthRouteCameraFrame(width,height,{worldWidth:3600,player:{x:3400,y,depth}},{fullStage:true});
 const top=frame.base+(y-GROUND+depth*.65+poses.reduce((m,p)=>Math.min(m,p.bounds.top),Infinity))*frame.zoom;
 const gap=top-mainRouteMicPlan(frame).travelBounds.bottom;minGap=Math.min(minGap,gap);
 if(gap<=0)throw Error('Actor reaches microphone');
 }
 all.viewports.push({width,height,minGap});
}
writeFileSync(new URL('../docs/first-chapter-mic/actor-envelope.json',import.meta.url),JSON.stringify(all,null,2));
console.log(JSON.stringify({count,byType:Object.fromEntries(Object.entries(all.byType).map(([k,v])=>[k,{count:v.count,top:v.top.bounds,topPose:{label:v.top.label,time:v.top.time,patch:v.top.patch},left:v.left.bounds.left,right:v.right.bounds.right}])),viewports:all.viewports},null,2));
