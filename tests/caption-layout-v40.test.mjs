import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../dist/move-readability.mjs';
const view={x:480,y:270,width:960,height:540,zoom:1};
const fighter=(x,face=1)=>({id:face===1?'player':'enemy',type:'ma',x,y:430,face});
const entry=f=>({f,caption:layout.moveCaption('ma_gaze')});
const overlap=(a,b)=>Math.min(a.x+a.width/2,b.x+b.width/2)>Math.max(a.x-a.width/2,b.x-b.width/2)&&Math.min(a.y+a.height/2,b.y+b.height/2)>Math.max(a.y-a.height/2,b.y-b.height/2);
test('caption layout exists for joint head-aware placement',()=>assert.equal(typeof layout.layoutMoveCaptions,'function'));
test('head anchor follows the rendered head pose and facing',()=>{
 assert.equal(typeof layout.captionHead,'function');
 const a=layout.captionHead(fighter(400),{bodyX:18,bodyY:20,bob:1,headAngle:.25,roll:0});
 const b=layout.captionHead(fighter(400,-1),{bodyX:18,bodyY:20,bob:1,headAngle:.25,roll:0});
 assert.ok(a.x>400);assert.equal(a.x-400,400-b.x);assert.ok(a.y>200);
});
test('single title prefers behind the head, with an attached tail',()=>{
 const f=fighter(480),[p]=layout.layoutMoveCaptions([entry(f)],[f],view);
 assert.ok(p.x<p.head.x-70);assert.ok(p.y<p.head.y);assert.ok(p.tail.tip.x<p.head.x);assert.ok(p.tail.tip.x>p.x);
});
test('both titles avoid heads, bodies, each other and viewport at edges and sideways',()=>{
 for(const width of [667,844,960])for(const xs of [[95,175],[410,475],[790,865]])for(const flip of [1,-1]){
  const fs=[fighter(xs[0],flip),fighter(xs[1],-flip)],v={...view,width,height:320};
  const out=layout.layoutMoveCaptions(fs.map(entry),fs,v);
  assert.ok(!overlap(out[0],out[1]),JSON.stringify({width,xs,out}));
  for(const p of out){assert.ok(p.x-p.width/2>=v.x-width/2);assert.ok(p.x+p.width/2<=v.x+width/2);assert.ok(p.y-p.height/2>=v.y-160);assert.ok(p.y+p.height/2<=v.y+160);for(const f of fs){const h=layout.captionHead(f);assert.ok(!overlap(p,{...h,width:116,height:120}));}}
 }
});
test('small movement eases without oscillating slots and leaves combat and camera intact',()=>{
 const f=fighter(480),before=JSON.stringify({f,view});const [p]=layout.layoutMoveCaptions([entry(f)],[f],view);
 const moved={...f,x:490};const [q]=layout.layoutMoveCaptions([{...entry(moved),previous:p}],[moved],view,16);
 assert.equal(q.slot,p.slot);assert.ok(q.x>p.x&&q.x<p.x+10);assert.equal(JSON.stringify({f,view}),before);
});
test('short landscape uses large main title and omits supporting subtitle',()=>{
 const f=fighter(480),[p]=layout.layoutMoveCaptions([entry(f)],[f],{...view,width:844,height:280,zoom:.8});
 assert.ok(p.size*.8>=24);assert.equal(p.showSubtitle,false);
});
import {gameHarness} from './helpers/game-harness.mjs';
test('edge fallback tails do not pass through the other title board',()=>{
 const fs=[{...fighter(190),attack:{kind:'ma_gaze',age:.3}},{...fighter(280,-1),type:'ko',attack:{kind:'ko_resolve',age:.3}}];
 const out=layout.layoutMoveCaptions(fs.map(f=>({f,caption:layout.moveCaption(f.attack.kind)})),fs,{...view,width:667,height:320});
 for(let i=0;i<2;i++){const p=out[i],other=out[1-i];for(let t=.1;t<1;t+=.1){const q={x:p.x+(p.tail.tip.x-p.x)*t,y:p.y+(p.tail.tip.y-p.y)*t,width:1,height:1};assert.ok(!overlap(q,other));}}
});
test('zoomed landscape wraps long names instead of forcing them below the fighters',()=>{
 const f=fighter(330),[p]=layout.layoutMoveCaptions([entry(f)],[f],{...view,width:1100,height:550,zoom:1.5});
 assert.ok(p.text.includes('\n'));assert.ok(p.width<=170);assert.ok(p.y<p.head.y);assert.equal(p.showSubtitle,false);
});
