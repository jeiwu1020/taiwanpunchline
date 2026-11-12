import test from 'node:test';
import assert from 'node:assert/strict';
import {bindTouchControls,PointerControls} from '../dist/touch-controls.mjs';

// Only the browser boundary is substituted: the actual production input state,
// ownership and callbacks execute for every deterministic event sequence.
function harness({directionMode=()=> 'duel'}={}){
 const events={},documentEvents={},actions=[],holds=[],elements=new Map();let active=true;
 function element(selector,dataset={}){const handlers={},captured=new Set(),classes=new Set();const el={dataset,style:{},disabled:false,offsetWidth:100,offsetHeight:100,
 classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},contains:()=>false,
 getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100,width:100,height:100}),
 addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id),
 fire(name,props={}){const event={pointerId:1,pointerType:'touch',button:0,buttons:1,clientX:50,clientY:50,preventDefault(){},...props};for(const fn of handlers[name]??[])fn(event);return event;}};elements.set(selector,el);return el;}
 const stick=element('#touch-stick'),knob=element('#touch-knob'),punch=element('#punch',{hold:'punch'}),guard=element('#guard',{hold:'guard'}),special=element('#special',{action:'special1'});
 const doc={hidden:false,querySelector:s=>elements.get(s),querySelectorAll:()=>[punch,guard,special],addEventListener:(name,fn)=>(documentEvents[name]??=[]).push(fn)};
 const win={addEventListener:(name,fn)=>(events[name]??=[]).push(fn)};
 const api=bindTouchControls({document:doc,window:win,active:()=>active,rotation:()=>0,directionMode,onAction:a=>actions.push(a),onHold:(...v)=>holds.push(v)});
 return{api,actions,holds,stick,punch,guard,special,doc,setActive:v=>active=v,emit:(name,e={})=>{for(const fn of events[name]??[])fn(e);},emitDocument:(name,e={})=>{for(const fn of documentEvents[name]??[])fn(e);}};
}

test('reproduced missing mouse-up stops attack as soon as a no-buttons move arrives',()=>{
 const h=harness();h.punch.fire('pointerdown',{pointerType:'mouse'});
 assert.ok(h.api.input.held.has('punch'));
 // Browser/OS interruptions can omit pointerup. The next event explicitly says
 // no button is down: keeping punch latched contradicts that physical state.
 h.punch.fire('pointermove',{pointerType:'mouse',buttons:0});
 assert.equal(h.api.input.held.has('punch'),false);
});
test('stale attack is released when the next no-buttons mouse event is outside its button',()=>{
 const h=harness();h.punch.fire('pointerdown',{pointerType:'mouse'});
 h.emit('pointermove',{pointerId:1,pointerType:'mouse',buttons:0});assert.equal(h.api.input.held.size,0);
});
test('each pointer lifecycle exit clears only its owned attack and cannot retrigger it',()=>{
 for(const name of ['pointerup','pointercancel','lostpointercapture']){
  const h=harness();h.stick.fire('pointerdown',{pointerId:2,clientX:90});h.punch.fire('pointerdown');
  h.emit(name,{pointerId:1});assert.ok(!h.api.input.held.has('punch'),name);assert.ok(h.api.input.held.has('right'),name);assert.deepEqual(h.actions,['punch']);
 }
});
test('blur, hidden page, orientation, explicit pause and pagehide reset all pointer ownership',()=>{
 for(const name of ['blur','visibilitychange','orientationchange','clear','pagehide']){
  const h=harness();h.stick.fire('pointerdown',{pointerId:2,clientX:90});h.punch.fire('pointerdown');
  if(name==='clear')h.api.clear();else if(name==='visibilitychange'){h.doc.hidden=true;h.emitDocument(name);}else h.emit(name);
  assert.equal(h.api.input.held.size,0,name);assert.equal(h.api.input.owner,null,name);
 }
});
test('two attack fingers produce one press edge while preserving hold until both release',()=>{
 const h=harness();h.punch.fire('pointerdown');h.punch.fire('pointerdown',{pointerId:2});assert.deepEqual(h.actions,['punch']);
 h.punch.fire('pointerup');assert.ok(h.api.input.held.has('punch'));h.punch.fire('pointerup',{pointerId:2});assert.equal(h.api.input.held.size,0);
});
test('inactive pointer input cannot prime an attack that starts after resuming',()=>{
 const h=harness();h.setActive(false);h.punch.fire('pointerdown');h.setActive(true);assert.equal(h.api.input.held.size,0);assert.deepEqual(h.actions,[]);
});
test('depth stick emits held up/down with zero punch or implicit jump, and VS keeps jump/crouch',()=>{
 let mode='depth';const h=harness({directionMode:()=>mode});
 h.stick.fire('pointerdown',{clientY:10});assert.ok(h.api.input.held.has('up'));assert.deepEqual(h.actions,[]);
 h.stick.fire('pointermove',{clientY:90});assert.ok(h.api.input.held.has('down'));assert.ok(!h.api.input.held.has('up'));assert.deepEqual(h.actions,[]);
 h.api.clear();mode='duel';h.stick.fire('pointerdown',{clientY:10});assert.deepEqual(h.actions,['jump']);h.stick.fire('pointermove',{clientY:90});assert.ok(h.api.input.held.has('crouch'));assert.ok(!h.api.input.held.has('down'));
});
test('an existing stick pointer cannot also claim a button or be stolen by a second stick finger',()=>{
 const c=new PointerControls({directionMode:()=> 'depth'});c.stick(1,40,0,50);c.button(1,'punch',true);assert.ok(!c.held.has('punch'));c.stick(2,-40,0,50);assert.ok(c.held.has('right'));assert.ok(!c.held.has('left'));
});
