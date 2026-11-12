import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST} from '../dist/core.mjs';
import {ART_FILES} from '../dist/art-render.mjs';
import {buildMoveDemoFrame,createMoveDemo} from '../dist/move-demo.mjs';

function finiteTree(value){
 if(typeof value==='number')assert.ok(Number.isFinite(value)&&Math.abs(value)<=10000,`Unbounded value: ${value}`);
 else if(value&&typeof value==='object')for(const child of Object.values(value))finiteTree(child);
}
for(const [character,c] of Object.entries(CAST))for(const move of c.moves)test(`${character}/${move.kind} has a bounded, deterministic one-shot model`,()=>{
 const before=JSON.stringify(CAST),initial=buildMoveDemoFrame(character,move.kind,0);
 assert.equal(initial.fighter.type,character);assert.equal(initial.fighter.attack.kind,move.kind);
 assert.equal(initial.moveDuration,move.duration);assert.ok(initial.duration>move.duration&&initial.duration<=3);
 for(const age of [-50,0,.18,.4,.8,1.2,2.7,10000,NaN,Infinity,-Infinity]){
  const frame=buildMoveDemoFrame(character,move.kind,age);
  finiteTree(frame);assert.ok(frame.age>=0&&frame.age<=frame.duration);
  assert.deepEqual(frame,buildMoveDemoFrame(character,move.kind,age));
  for(const prop of frame.props){assert.ok(prop.x>=0&&prop.x<=800);assert.ok(prop.y>=0&&prop.y<=440);}
 }
 const last=buildMoveDemoFrame(character,move.kind,10000);
 assert.equal(last.done,true);assert.equal(last.fighter.attack,null);assert.equal(last.props.length,0);
 assert.equal(JSON.stringify(CAST),before,'Preview must not alter shared combat definitions');
});

test('move ownership is checked before building a pose',()=>{
 for(const [character,kind] of [['missing','rush'],['__proto__','rush'],['wang','coin'],['han','heal'],['wang','toString']])assert.throws(()=>buildMoveDemoFrame(character,kind,0),RangeError);
});

test('projectile and obstacle demonstrations outlive their short casting animations',()=>{
 const cases=[['han','coin',1.59],['han','arrow',1.68],['huang','huang_queue',2.02],['chen','chen_dream',3],['ko','ko_name',1.89]];
 for(const [character,kind,duration] of cases)assert.ok(Math.abs(buildMoveDemoFrame(character,kind,0).duration-duration)<1e-9,kind);
 assert.equal(buildMoveDemoFrame('wang','heal',1.10).labels.some(label=>label.text.includes('+10')),true);
 assert.equal(buildMoveDemoFrame('ko','ko_resolve',.8).fighter.armor>0,true);
});

test('coin travels, arrow completes its flight, and the queue persists after recovery',()=>{
 const coinA=buildMoveDemoFrame('han','coin',.2).props[0],coinB=buildMoveDemoFrame('han','coin',.8).props[0];
 assert.equal(coinA.kind,'coin');assert.ok(coinB.x>coinA.x);
 assert.equal(buildMoveDemoFrame('han','coin',.1).props.length,0);
 const arrowA=buildMoveDemoFrame('han','arrow',.5),arrowB=buildMoveDemoFrame('han','arrow',1.40);
 assert.equal(arrowA.props[0].kind,'arrow');assert.ok(arrowB.props[0].y>arrowA.props[0].y+150);
 assert.equal(arrowA.markers[0].kind,'arrow');assert.equal(arrowB.fighter.attack,null);
 assert.equal(buildMoveDemoFrame('han','arrow',1.5).props.length,0);
 const queue=buildMoveDemoFrame('huang','huang_queue',1.1);
 assert.equal(queue.fighter.attack,null);assert.equal(queue.props[0].kind,'queue');
 assert.equal(buildMoveDemoFrame('huang','huang_queue',1.9).props.length,0);
});

test('Chen paper visibly turns around and returns before the demo ends',()=>{
 const outgoing=buildMoveDemoFrame('chen','chen_dream',1.3).props[0];
 const turning=buildMoveDemoFrame('chen','chen_dream',1.6).props[0];
 const returning=buildMoveDemoFrame('chen','chen_dream',2.5).props[0];
 assert.equal(outgoing.kind,'dream');assert.equal(outgoing.phase,'outbound');
 assert.equal(turning.phase,'return');assert.equal(returning.phase,'return');assert.equal(returning.flipX,true);
 assert.ok(returning.x<turning.x);assert.ok(returning.x>260);
 assert.equal(buildMoveDemoFrame('chen','chen_dream',2.9).props.length,0);
});

test('Ko glyph uses a visible labeled landing target and reaches it',()=>{
 const start=buildMoveDemoFrame('ko','ko_name',.31),end=buildMoveDemoFrame('ko','ko_name',.85);
 assert.equal(start.props[0].kind,'word');assert.equal(start.props[0].text,'賴祥德');
 assert.equal(start.markers[0].kind,'word');assert.ok(end.props[0].y>start.props[0].y+150);
 assert.equal(buildMoveDemoFrame('ko','ko_name',.9).props.length,0);
});

function canvasHarness(){
 const calls=[],stack=[];
 const ctx={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){assert.ok(stack.length);this.globalAlpha=stack.pop();}};
 for(const method of ['clearRect','fillRect','strokeRect','translate','scale','rotate','beginPath','moveTo','quadraticCurveTo','lineTo','stroke','fill','ellipse','arc','closePath','clip','setLineDash','fillText','strokeText','drawImage'])ctx[method]=(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),method);calls.push([method,...args]);};
 const images=Object.fromEntries(Object.keys(ART_FILES).map(key=>[key,{key}]));
 const pending=new Map(),callbacks=new Map(),cancelled=[];let next=0;
 return {canvas:{width:800,height:440,getContext:()=>ctx},images,calls,pending,callbacks,cancelled,stack,
  requestFrame(callback){const id=++next;pending.set(id,callback);callbacks.set(id,callback);return id;},
  cancelFrame(id){cancelled.push(id);pending.delete(id);},
  step(ts){assert.equal(pending.size,1,'Only one frame may be pending');const [id,callback]=pending.entries().next().value;pending.delete(id);callback(ts);},
 };
}

test('one run draws the real art and demo label, settles, and schedules no replay',()=>{
 const h=canvasHarness(),states=[],demo=createMoveDemo({...h,onState:state=>states.push(state)});
 assert.equal(h.pending.size,0);const first=demo.play('han','arrow');
 assert.equal(first.kind,'arrow');assert.equal(h.pending.size,1);
 h.step(100);h.step(700);h.step(2000);
 assert.deepEqual(states.map(state=>state.status),['playing','completed']);assert.equal(h.pending.size,0);
 assert.ok(h.calls.some(([method,text])=>method==='fillText'&&text==='招式示範'));
 assert.ok(h.calls.some(([method,img])=>method==='drawImage'&&img?.key==='han-archery'));
 assert.ok(h.calls.some(([method,img,sx,sy])=>method==='drawImage'&&img?.key==='art-props'&&sx===33&&sy===708),'Arrow atlas is actually drawn');
 assert.equal(h.stack.length,0);
 demo.play('han','arrow');assert.equal(h.pending.size,1);demo.stop();assert.equal(h.pending.size,0);
});

test('switching cancels the previous run and stale callbacks cannot draw or restart it',()=>{
 const h=canvasHarness(),states=[],demo=createMoveDemo({...h,onState:state=>states.push(state)});
 demo.play('han','coin');const [oldId,oldCallback]=h.pending.entries().next().value;
 demo.play('chen','chen_dream');assert.ok(h.cancelled.includes(oldId));assert.equal(h.pending.size,1);
 const count=h.calls.length;oldCallback(3000);assert.equal(h.calls.length,count);assert.equal(h.pending.size,1);
 h.step(0);h.step(3000);assert.equal(states.at(-1).status,'completed');assert.equal(states.at(-1).kind,'chen_dream');
});

test('stop and destroy release pending frames, and destroy cannot be restarted',()=>{
 const h=canvasHarness(),states=[],demo=createMoveDemo({...h,onState:state=>states.push(state)});
 demo.stop();demo.stop();assert.equal(h.pending.size,0);assert.equal(states.length,0);
 demo.play('wang','heal');const old=h.pending.values().next().value;
 demo.stop();demo.stop();assert.equal(h.pending.size,0);assert.equal(states.at(-1).status,'stopped');
 const count=h.calls.length;old(5000);assert.equal(h.calls.length,count);
 demo.play('ko','ko_name');demo.destroy();demo.destroy();
 assert.equal(h.pending.size,0);assert.equal(states.at(-1).status,'destroyed');
 assert.equal(demo.play('wang','rush'),false);assert.equal(h.pending.size,0);
});

test('every move renders all sampled frames through the existing artwork without leaked canvas saves',()=>{
 const h=canvasHarness(),demo=createMoveDemo(h);
 for(const [character,c] of Object.entries(CAST))for(const move of c.moves){
  demo.play(character,move.kind);h.step(0);for(const ms of [180,350,600,900,1400,2100,3000])if(h.pending.size)h.step(ms);
  assert.equal(h.pending.size,0);assert.equal(h.stack.length,0,move.kind);
 }
});

test('invalid selections do not cancel the current animation',()=>{
 const h=canvasHarness(),demo=createMoveDemo(h);demo.play('wang','rush');
 assert.throws(()=>demo.play('wang','arrow'),RangeError);assert.equal(h.pending.size,1);assert.equal(h.cancelled.length,0);demo.destroy();
});

test('projectile-only recovery frames draw the plane, queue and falling glyph',()=>{
 const cases=[['chen','chen_dream',2100,'dream'],['huang','huang_queue',1100,'queue'],['ko','ko_name',820,'word']];
 for(const [character,kind,time,prop] of cases){
  const h=canvasHarness(),demo=createMoveDemo(h);demo.play(character,kind);h.step(0);h.calls.length=0;h.step(time);
  if(prop==='word')assert.ok(h.calls.some(([method,text])=>method==='fillText'&&text==='賴祥德'));
  else assert.ok(h.calls.some(([method,img,x,y])=>method==='drawImage'&&img?.key==='signature-props'&&x===(prop==='dream'?0:512)&&y===0));
  demo.destroy();
 }
});

test('a stop from the playing callback cannot leave a hidden RAF running',()=>{
 const h=canvasHarness();let demo;
 demo=createMoveDemo({...h,onState:state=>{if(state.status==='playing')demo.stop();}});
 demo.play('wang','rush');assert.equal(h.pending.size,0);demo.destroy();
});
