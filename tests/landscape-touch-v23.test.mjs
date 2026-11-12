import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame} from '../dist/arena-presentation.mjs';
const geom=await import('../dist/viewport-geometry.mjs').catch(()=>({}));
const touch=await import('../dist/touch-controls.mjs').catch(()=>({}));
test('safe portrait game uses swapped logical dimensions and native landscape does not rotate',()=>{
 assert.equal(typeof geom.gameViewport,'function');
 const f=geom.gameViewport({width:390,height:750,left:0,top:20,touch:true,safe:{top:47,bottom:34,left:0,right:0}});
 assert.deepEqual([f.width,f.height,f.rotation,f.left,f.top],[669,390,90,0,67]);
 const l=geom.gameViewport({width:844,height:390,touch:true,safe:{left:47,right:47,bottom:21}});
 assert.deepEqual([l.width,l.height,l.rotation],[750,369,0]);
 assert.equal(geom.gameViewport({width:390,height:750,touch:true,rotate:false}).rotation,0);
 assert.equal(geom.gameViewport({width:390,height:750,touch:false}).rotation,0);
});
test('clockwise portrait pointers map visual movement back into game directions',()=>{
 assert.equal(typeof geom.logicalPointer,'function');
 const box={left:10,top:20,width:100,height:100};
 assert.deepEqual(geom.logicalPointer(60,95,box,90,100,100),{x:75,y:50});
 assert.deepEqual(geom.logicalPointer(85,70,box,90,100,100),{x:50,y:25});
 assert.deepEqual(geom.logicalPointer(35,70,box,0,100,100),{x:25,y:50});
});
test('independent fingers retain directions and attacks until their own release; cancel clears all',()=>{
 assert.equal(typeof touch.PointerControls,'function');
 const actions=[],states=[];const c=new touch.PointerControls({onAction:a=>actions.push(a),onHold:(a,on)=>states.push([a,on])});
 c.stick(1,40,0,50);c.button(2,'punch',true);assert.equal(c.held.has('right'),true);assert.equal(c.held.has('punch'),true);
 c.release(9);assert.equal(c.held.size,2);c.release(2);assert.equal(c.held.has('right'),true);assert.equal(c.held.has('punch'),false);
 c.stick(1,0,-40,50);c.stick(1,0,-40,50);assert.equal(actions.filter(a=>a==='jump').length,1);
 c.stick(8,-40,0,50);assert.equal(c.held.has('left'),false);
 c.clear();assert.equal(c.held.size,0);assert.equal(c.owner,null);assert.ok(states.some(([a,on])=>a==='right'&&!on));
});
test('classic camera tracks midpoint and pushes in when opponents approach',()=>{
 const start=[{x:260,y:430},{x:700,y:430}],near=[start[0],{x:348,y:430}];
 let c=cameraFrame(370,575,start);const z=c.zoom;
 for(let i=0;i<180;i++)c=cameraFrame(370,575,near,c);
 assert.equal(c.x,304);assert.ok(c.zoom>z*1.7);assert.ok(c.zoom<=1.45);
});
test('classic camera recovers after a jump and keeps all body bounds under HUD',()=>{
 for(const [w,h]of[[800,330],[540,260],[1134,550],[298,292]]){
 const stand=[{x:260,y:430},{x:700,y:430}];let c=cameraFrame(w,h,stand),base=c.zoom;
 for(let i=0;i<70;i++)c=cameraFrame(w,h,[stand[0],{x:700,y:170}],c);
 for(let i=0;i<160;i++)c=cameraFrame(w,h,stand,c);
 assert.ok(Math.abs(base-c.zoom)<.00001);
 for(const f of stand){assert.ok(h/2+(f.y-285-c.y)*c.zoom>=c.hud-1);assert.ok(h/2+(458-c.y)*c.zoom<=h-8);}
 }
});

test('pointer DOM bindings invert portrait axes, retain second finger and clear on all lifecycle exits',()=>{
 const elements=new Map(),events={};
 const make=(id,data={})=>{const listeners={},classes=new Set(),captured=new Set();const el={dataset:data,style:{},disabled:false,offsetWidth:100,offsetHeight:100,
 classList:{add:a=>classes.add(a),remove:a=>classes.delete(a)},getBoundingClientRect:()=>({left:10,top:20,width:100,height:100}),
 addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id),
 fire:(name,props={})=>(listeners[name]||[]).forEach(fn=>fn({pointerId:1,pointerType:'touch',button:0,buttons:1,preventDefault(){},clientX:60,clientY:95,...props}))};elements.set(id,el);return el;};
 const stick=make('#touch-stick'),knob=make('#touch-knob'),punch=make('#punch',{hold:'punch'}),special=make('#special',{action:'special1'});const actions=[],states=[];let active=true;
 const api=touch.bindTouchControls({document:{querySelector:s=>elements.get(s),querySelectorAll:()=>[punch,special]},window:{addEventListener:(n,fn)=>(events[n]??=[]).push(fn)},active:()=>active,rotation:()=>90,onHold:(a,on)=>states.push([a,on]),onAction:a=>actions.push(a)});
 stick.fire('pointerdown');assert.ok(api.input.held.has('right'));punch.fire('pointerdown',{pointerId:2});assert.ok(api.input.held.has('punch'));
 special.fire('pointerdown',{pointerId:3});assert.equal(actions.at(-1),'special1');
 punch.fire('pointercancel',{pointerId:2});assert.ok(!api.input.held.has('punch'));assert.ok(api.input.held.has('right'));
 for(const fn of events.pointerup)fn({pointerId:1});assert.equal(api.input.held.size,0);assert.equal(knob.style.transform,'translate(0px,0px)');
 stick.fire('pointerdown',{pointerId:4});for(const fn of events.orientationchange)fn();assert.equal(api.input.held.size,0);assert.equal(api.input.owner,null);
 punch.fire('pointerdown',{pointerId:5});for(const fn of events.pagehide)fn();assert.equal(api.input.held.size,0);
 active=false;special.fire('pointerdown',{pointerId:6});assert.equal(actions.filter(a=>a==='special1').length,1);
});

test('classic camera background covers complete viewport at both world edges and jumps',async()=>{
 const {backgroundFrame}=await import('../dist/arena-presentation.mjs');
 for(const [w,h] of [[298,260],[640,260],[822,330],[1134,549],[1394,740]])for(const [x1,x2] of [[68,152],[68,892],[808,892]])for(const [y1,y2] of [[430,430],[160,430],[160,160]]){
 const c=cameraFrame(w,h,[{x:x1,y:y1},{x:x2,y:y2}]),bg=backgroundFrame(w,h,c);
 const label=JSON.stringify({w,h,x1,x2,y1,y2,zoom:c.zoom});
 assert.ok(bg.x-bg.width/2<=c.x-w/2/c.zoom,`left edge ${label}`);assert.ok(bg.x+bg.width/2>=c.x+w/2/c.zoom,`right edge ${label}`);
 assert.ok(bg.top<=c.y-h/2/c.zoom,`top edge ${label}`);assert.ok(bg.bottom>=c.y+h/2/c.zoom,`bottom edge ${label}`);
 }
});


test('classic backdrop has fixed world geometry while the camera follows and eases across a jump',async()=>{
 const {backgroundFrame}=await import('../dist/arena-presentation.mjs');
 for(const [w,h] of [[298,260],[640,260],[822,330],[1134,549],[1394,740]]){
  let c=cameraFrame(w,h,[{x:68,y:430},{x:152,y:430}]);const bg=backgroundFrame(w,h,c);
  for(const [x1,x2] of [[68,152],[68,892],[808,892]])for(const [y1,y2] of [[160,430],[160,160],[430,430]])for(let frame=0;frame<120;frame++){
   c=cameraFrame(w,h,[{x:x1,y:y1},{x:x2,y:y2}],c);assert.deepEqual(backgroundFrame(w,h,c),bg);
   assert.ok(bg.x-bg.width/2<=c.x-w/2/c.zoom);assert.ok(bg.x+bg.width/2>=c.x+w/2/c.zoom);
   assert.ok(bg.top<=c.y-h/2/c.zoom);assert.ok(bg.bottom>=c.y+h/2/c.zoom);
  }
 }
});
