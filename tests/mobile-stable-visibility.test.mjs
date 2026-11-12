import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {mountCombatOverlayLayout} from '../dist/combat-overlay-layout.mjs';
import {measureChallengeOcclusions} from '../dist/challenge-layout.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
import {CAST} from '../dist/core.mjs';
import {planSimulationFrame} from '../dist/simulation-frame.mjs';
import {loadChapterEntryStyles,chapterControlsDisplay} from './helpers/chapter-control-css.mjs';
const read=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),captured=JSON.parse(readFileSync(new URL('./fixtures/mobile-stable-visibility.json',import.meta.url)));
const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height}),counts=g=>[g.occlusions.length,g.fixedCameraGeometry?.occlusions.length??null];
function rootFixture(){
 const dom=new JSDOM(read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,''),{pretendToBeVisual:true}),w=dom.window,d=w.document,app=d.querySelector('.app'),pause=d.querySelector('#pause-screen');
 d.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden'));d.querySelector('.challenge-save-slot').hidden=false;Object.assign(app.dataset,captured.dataset);
 const style=d.createElement('style');style.textContent=[read('interface-v30.css').split('\n').find(s=>s.startsWith('.app .stage-wrap:has(')),read('combat-presentation-v75.css').split('\n').find(s=>s.includes('.cabinet:has(.screen:not(.hidden)) .control-deck'))].join('\n')+'\n.hidden{display:none!important}.movement button{display:none}';d.head.append(style);
 const canvas=d.createElement('canvas');d.querySelector('#game').append(canvas);let width=568,height=320,rotation=90,reads=0,styles=0,mode='stable',owner={status:'active'},rafId=0;const raf=new Map();w.requestAnimationFrame=fn=>{raf.set(++rafId,fn);return rafId;};w.cancelAnimationFrame=id=>raf.delete(id);w.HTMLCanvasElement.prototype.getContext=()=>null;
 const computed=w.getComputedStyle.bind(w);w.getComputedStyle=el=>{styles++;return computed(el);};
 const physical=r=>{reads++;return rotation===90?box(height-r.bottom,r.left,r.height,r.width):r;};Object.defineProperties(app,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});app.getBoundingClientRect=canvas.getBoundingClientRect=()=>physical(box(0,0,width,height));d.querySelector('.dom-hud').getBoundingClientRect=()=>physical(box(8,40,552,48));
 const selectors=[':scope > header','.challenge-save-slot','.dom-hud .hud-side,.dom-hud .timer,.dom-hud .hud-status,.dom-hud > [class*="status"],.dom-hud > [role="status"]','.chapter-objective,.route-hud','.control-deck button,.control-deck #touch-stick,.control-deck .specials,.control-deck .guard-hint'],nodes=selectors.flatMap(s=>[...app.querySelectorAll(s)]).filter(el=>!el.matches('.movement button'));assert.equal(nodes.length,captured.options.occlusions.length);nodes.forEach((el,i)=>el.getBoundingClientRect=()=>physical({...captured.options.occlusions[i]}));
 const actors=structuredClone(captured.actors),overlay=mountCombatOverlayLayout({document:d,getCameraMode:()=>mode,getCombatOwner:()=>owner});
 const frame=()=>({width,height,rotation,touch:app.dataset.touch==='true',camera:mode,retainCombatLayout:!!owner});
 return{dom,w,d,app,pause,overlay,raf,actors,get reads(){return reads;},get styles(){return styles;},direct:()=>measureChallengeOcclusions({document:d,root:app,canvas,frame:frame()}),fit:(g,previous=null,paused=false)=>fullStageCameraFrame(fixedStableCameraFrame,width,height,actors,previous,0,{...g,touch:app.dataset.touch==='true',cameraMode:mode,paused}),mode(v){mode=v;},owner(v){owner=v;},viewport(w,h,r,epoch){width=w;height=h;rotation=r;Object.assign(app.dataset,{layout:w>h?'landscape':'portrait',rotation:String(r),viewportEpoch:String(epoch)});Object.assign(app.style,{width:w+'px',height:h+'px'});},close(){overlay.destroy();w.close();}};
}
test('real root CSS pause mask preserves fixed17 while raw19 becomes raw2; first resume read is fresh',async()=>{
 const f=rootFixture();try{const initial=f.overlay.cameraSafety,first=f.fit(initial);assert.deepEqual(counts(initial),[19,17]);assert.ok(Math.abs(first.zoom-.525)<1e-8);
  f.pause.classList.remove('hidden');assert.equal(f.w.getComputedStyle(f.d.querySelector('.dom-hud')).visibility,'hidden');const hidden=f.overlay.cameraSafety;assert.deepEqual(counts(hidden),[2,17]);assert.deepEqual(hidden.fixedCameraGeometry,initial.fixedCameraGeometry);assert.equal(f.fit(hidden,first,true),first,'same-layout paused object, pose and follow owner stay exact');
  f.viewport(320,568,0,2);assert.equal(f.overlay.cameraSafety.fixedCameraGeometry,undefined);f.viewport(568,320,90,3);const returned=f.overlay.cameraSafety;assert.deepEqual(counts(returned),[2,17]);const rebased=f.fit(returned,null,true);assert.equal(rebased.zoom,first.zoom);assert.deepEqual(rebased.playerFixedCamera.anchor,first.playerFixedCamera.anchor);
  f.pause.classList.add('hidden');const resumed=f.overlay.cameraSafety;assert.deepEqual(counts(resumed),[19,17]);assert.deepEqual(resumed.occlusions,f.direct().occlusions);assert.equal(f.fit(resumed,rebased).zoom,first.zoom);await Promise.resolve();assert.deepEqual(counts(f.overlay.cameraSafety),[19,17]);
  const reads=f.reads,styles=f.styles,observer=new f.w.MutationObserver(()=>{});observer.observe(f.app,{attributes:true,subtree:true});for(let i=0;i<100;i++)assert.equal(f.overlay.cameraSafety,resumed);assert.equal(f.reads,reads);assert.equal(f.styles,styles);assert.equal(observer.takeRecords().length,0);observer.disconnect();
 }finally{f.close();}
});
test('root fixed retention is explicit: true hidden/display-none ancestors, menu and legacy profiles do not reserve masked slots',()=>{
 const f=rootFixture();try{f.pause.classList.remove('hidden');f.owner(null);assert.deepEqual(counts(f.overlay.cameraSafety),[2,2],'a menu/title has no retained combat world');f.owner({status:'paused'});assert.deepEqual(counts(f.overlay.cameraSafety),[2,17]);
  for(const mode of ['classic','stable']){f.mode(mode);f.app.dataset.touch=mode==='stable'?'false':'true';const g=f.overlay.cameraSafety;assert.equal(g.occlusions.length,2);assert.equal(g.fixedCameraGeometry?.occlusions.length??null,mode==='classic'?2:null);}
  f.app.dataset.touch='true';f.mode('stable');f.pause.classList.add('hidden');const side=f.d.querySelector('.hud-side');side.hidden=true;assert.equal(f.direct().fixedCameraGeometry.occlusions.some(r=>r.kind==='hud'&&r.left===8&&r.width===240),false);side.hidden=false;side.style.display='none';assert.equal(f.direct().fixedCameraGeometry.occlusions.some(r=>r.kind==='hud'&&r.left===8&&r.width===240),false);
  const controls=f.d.querySelector('.control-deck');controls.style.display='none';assert.equal(f.direct().fixedCameraGeometry.occlusions.some(r=>r.kind==='control'),false,'ancestor display:none is not a transient visibility mask');
 }finally{f.close();}
});
test('root result mask and paused refresh preserve the existing fixed pose and nonzero follow lag exactly',()=>{
 const f=rootFixture();try{const geometry=f.overlay.cameraSafety,first=f.fit(geometry);f.actors[0].x+=65;const lag=f.fit(geometry,first);assert.notEqual(lag.x,first.x+65);
  f.pause.classList.remove('hidden');assert.equal(f.fit(f.overlay.cameraSafety,lag,true),lag);f.pause.classList.add('hidden');f.d.querySelector('#result').classList.remove('hidden');f.owner({status:'over'});const result=f.overlay.cameraSafety;assert.deepEqual(counts(result),[2,17]);assert.equal(f.fit(result,lag,true),lag);assert.deepEqual(result.fixedCameraGeometry,geometry.fixedCameraGeometry);
 }finally{f.close();}
});
test('actual root selection/title/overview exits clear the production owner, including title covering a retained paused world',async()=>{
 const {gameHarness}=await import('./helpers/game-harness.mjs'),{memoryStorage}=await import('./helpers/main-unified-fixture.mjs'),{completedChallengeEnvelope}=await import('./helpers/profile-fixtures.mjs'),{CHALLENGE_KEY}=await import('../dist/preview/campaign/fresh/schema.mjs');
 const h=await gameHarness({newProfile:true,storage:memoryStorage({[CHALLENGE_KEY]:JSON.stringify(completedChallengeEnvelope())}),mountChallengeOverview:()=>({open(){},close(){}})});h.ui.setScene({artImages:{}});h.document.defaultView={innerWidth:568,innerHeight:320,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 const code=read('game.mjs').split('getCombatOwner:')[1].split(',getCameraMode:')[0],owner=()=>vm.runInNewContext('('+code+')()',{duel:h.ui.duel,$:h.$});
 h.ui.showMenu();assert.equal(owner(),null);h.ui.startGame();assert.equal(owner(),h.ui.duel);h.ui.duel.status='paused';assert.equal(owner(),h.ui.duel);
 h.$('.app').dataset.titleOpen='true';assert.equal(owner(),null,'the actual root callback must not rely on duel status alone when title owns presentation');h.$('.app').dataset.titleOpen='false';h.ui.showTitle();assert.equal(owner(),null);assert.equal(h.ui.duel.status,'title');
 await h.ui.startChallenge({replay:true});assert.ok(h.ui.challenge);assert.equal(await h.ui.returnToChallengeOverview(),true);assert.equal(h.ui.challenge,null);assert.equal(h.ui.duel.status,'title');assert.equal(owner(),null);
 h.ui.showMenu();assert.equal(owner(),null);h.ui.startGame();h.ui.duel.status='story';assert.equal(owner(),null,'a retained model behind a true story is not combat');for(const status of ['gate','lost','over']){h.ui.duel.status=status;assert.equal(owner(),h.ui.duel,'real route/battle terminal status '+status+' still owns combat presentation');}
});

async function chapterFixture(chapter,route=false,initialPaused=false){
 const dom=new JSDOM(read(`preview/chapter${chapter}/index.html`).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://chapter.test/?previewOnly=1',pretendToBeVisual:true}),w=dom.window,d=w.document,root=d.querySelector('#trial-app');
 loadChapterEntryStyles(d,new URL(`../dist/preview/chapter${chapter}/index.html`,import.meta.url));d.querySelectorAll('.overlay').forEach(e=>e.hidden=true);
 Object.defineProperties(w,{innerWidth:{value:320,writable:true},innerHeight:{value:568,writable:true}});w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};let reads=0,styles=0;const computed=w.getComputedStyle.bind(w);w.getComputedStyle=el=>{styles++;return computed(el);};
 const width=()=>parseFloat(root.style.width)||568,height=()=>parseFloat(root.style.height)||320;
 for(const el of d.querySelectorAll('#stage,#game-canvas'))Object.defineProperties(el,{clientWidth:{get:width},clientHeight:{get:height}});
 w.HTMLElement.prototype.getBoundingClientRect=function(){reads++;for(let el=this;el;el=el.parentElement)if(el.hidden||computed(el).display==='none')return box(0,0,0,0);let r=box(0,0,0,0);
  if(this===root||this.matches('#stage,#game-canvas'))r=box(0,0,width(),height());else if(this.matches('header'))r=box(8,4,width()-16,32);else if(this.matches('.hud-side'))r=box(this.id==='enemy-panel'?320:8,40,240,48);else if(this.matches('.timer'))r=box(254,40,60,48);else if(this.matches('.dom-hud'))r=box(8,40,width()-16,48);else if(this.matches('.chapter-objective'))r=box(8,108,width()-16,15);else if(this.matches('#touch-stick'))r=box(8,height()-118,112,112);else if(this.matches('.control-deck button,.specials'))r=box(266,height()-120,294,54);
  return root.dataset.rotation==='90'?box(height()-r.bottom,r.left,r.height,r.width):r;
 };
 const {createPlayableChapter}=await import(`../dist/preview/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-controller.mjs`),controller=createPlayableChapter({initialStepId:route?'route-a':'boss'});if(initialPaused)controller.setPaused(true,controller.view().token);let override=null;const state=()=>override??controller.view();
 const ui=mountChapterInterface({document:d,window:w,cast:CAST,getCharacter:()=>state().characterId,getExitState:state,surfaceContext:{setTransform(){},isContextLost:()=>false}});ui.setCameraAvailable(true);d.querySelector('#camera-mode').click();
 const entry=read(`preview/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-playable.mjs`),prefix=entry.slice(entry.indexOf('function sync(){')+'function sync(){'.length,entry.indexOf(" for(const id of ['menu'")),content=await import(`../dist/preview/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-content.mjs`);
 const hudSource=entry.slice(entry.indexOf('function hudText('),entry.indexOf('function tick(')),tickSource=entry.slice(entry.indexOf('function tick('),entry.indexOf('continuation=mountContinuationControls')),routeIndex=entry.split('\n').find(line=>line.startsWith('function routeIndex('));
 const order=[],render=ui.render;ui.render=options=>{order.push('render');return render(options);};
 function sync(){vm.runInNewContext('(function(){'+prefix+'})()',{pauseLifecycle:{sync(){}},v:state,ui,uiToken:'',clearHold(){},document:d,chaseWindow:{paint(){}},images:{},frameTime:0,storyStartedAt:0,storyToken:''});ui.invalidateGeometry();
  // The actual playable tick invokes actual hud/render BEFORE the first draw
  // consumes cameraOptions. Only simulation/audio/painting boundaries are idle.
  order.length=0;let failure;const fail=ui.failFrame;ui.failFrame=e=>{failure=e;};
  vm.runInNewContext(routeIndex+'\n'+hudSource+'\n'+tickSource+'\ntick(0);',{...content,$:s=>d.querySelector(s),v:state,chapter:controller,ui,lastTime:null,frameTime:0,active:()=>false,planSimulationFrame,chaseWindow:{paint(){}},images:{},draw(){order.push('camera');void ui.cameraOptions;},requestAnimationFrame(){}});ui.failFrame=fail;if(failure)throw failure;assert.deepEqual(order,['render','camera'],'real entry tick establishes the world before its first camera read');
 }
 sync();return{dom,w,d,root,ui,controller,state,sync,override(v){override=v;},get reads(){return reads;},get styles(){return styles;},close(){ui.destroy();w.close();}};
}
for(const chapter of [2,3,4])for(const route of [false,true])test(`chapter ${chapter} ${route?'route':'battle'} shared entry retains stable and authorized close-street controls through pause/busy/result and rotation`,async()=>{
 const f=await chapterFixture(chapter,route);try{
  const controls=f.d.querySelector('#controls'),initial=f.ui.cameraOptions,controlCount=initial.fixedCameraGeometry.occlusions.filter(r=>r.kind==='control').length;assert.ok(controlCount>0);assert.equal(chapterControlsDisplay(f.d),'grid');assert.equal(f.w.getComputedStyle(controls).display,'grid');
  assert.equal(f.controller.setPaused(true,f.state().token),true);f.sync();const paused=f.ui.cameraOptions;assert.equal(chapterControlsDisplay(f.d),'grid');assert.equal(f.w.getComputedStyle(controls).display,'grid','hidden controls retain their normal grid, not display:none');assert.equal(f.w.getComputedStyle(controls).visibility,'hidden');assert.equal(f.w.getComputedStyle(controls).pointerEvents,'none');assert.equal(paused.occlusions.some(r=>r.kind==='control'),false);assert.deepEqual(paused.fixedCameraGeometry,initial.fixedCameraGeometry);
  f.d.querySelector('#rotate-mode').click();assert.equal(f.ui.viewport.width,320);assert.equal(chapterControlsDisplay(f.d),route?'grid':'none');assert.equal(f.w.getComputedStyle(controls).display,route?'grid':'none','only the close-street portrait retains a hidden grid');if(route){assert.equal(f.w.getComputedStyle(controls).visibility,'hidden');assert.equal(f.w.getComputedStyle(controls).pointerEvents,'none');assert.ok(f.ui.cameraOptions.occlusions.some(r=>r.kind==='control'));}void f.ui.cameraOptions;f.d.querySelector('#rotate-mode').click();const rotated=f.ui.cameraOptions;assert.equal(rotated.fixedCameraGeometry.occlusions.filter(r=>r.kind==='control').length,controlCount);
  f.controller.setPaused(false,f.state().token);f.sync();const resumed=f.ui.cameraOptions;assert.ok(resumed.occlusions.some(r=>r.kind==='control'));assert.deepEqual(resumed.fixedCameraGeometry,initial.fixedCameraGeometry);
  for(const status of [{blocked:true},{busy:true},{mode:'result',result:{kind:route?'route':'battle'}}]){f.override({...f.controller.view(),...status});f.sync();const g=f.ui.cameraOptions;assert.equal(g.fixedCameraGeometry.occlusions.filter(r=>r.kind==='control').length,controlCount);assert.equal(f.w.getComputedStyle(controls).visibility,'hidden');}
  for(const mode of ['story','menu','choice','complete']){f.override({...f.controller.view(),mode,paused:true});f.sync();void f.ui.cameraOptions;assert.equal(chapterControlsDisplay(f.d),'none');assert.equal(f.w.getComputedStyle(controls).display,'none',mode+' may not borrow the prior combat world even when chapterMode says pause');}
  f.override({...f.controller.view(),paused:true});f.sync();void f.ui.cameraOptions;const reads=f.reads,styles=f.styles,observer=new f.w.MutationObserver(()=>{});observer.observe(f.root,{attributes:true,subtree:true});for(let i=0;i<100;i++)void f.ui.cameraOptions;assert.equal(f.reads,reads);assert.equal(f.styles,styles);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  if(route)assert.equal(f.ui.cameraOptions.fixedCameraGeometry.occlusions.some(r=>r.kind==='hud'&&r.left===320),false,'route enemy panel remains explicitly absent');
  f.override(null);f.sync();f.d.querySelector('#camera-mode').click();void f.ui.cameraOptions;f.controller.setPaused(true,f.state().token);f.sync();const classic=f.ui.cameraOptions;assert.equal(classic.camera,'classic');assert.equal(chapterControlsDisplay(f.d),route?'grid':'none');assert.equal(f.w.getComputedStyle(controls).display,route?'grid':'none','only close-street classic retains the masked grid');assert.equal(classic.fixedCameraGeometry.occlusions.some(r=>r.kind==='control'),route);if(route){assert.equal(f.w.getComputedStyle(controls).visibility,'hidden');assert.equal(f.w.getComputedStyle(controls).pointerEvents,'none');assert.ok(classic.occlusions.some(r=>r.kind==='control'));}
  f.controller.setPaused(false,f.state().token);f.sync();f.d.querySelector('#camera-mode').click();void f.ui.cameraOptions;f.controller.setPaused(true,f.state().token);f.sync();f.w.matchMedia=()=>({matches:false});f.w.innerWidth=1280;f.w.innerHeight=720;f.ui.resize();const desktop=f.ui.cameraOptions;assert.equal(desktop.touch,false);assert.equal(desktop.fixedCameraGeometry,undefined);assert.equal(chapterControlsDisplay(f.d),'none');assert.equal(f.w.getComputedStyle(controls).display,'none','desktop keeps the old display:none mask');
 }finally{f.close();}
});
for(const chapter of [2,3,4])test(`chapter ${chapter} cold paused owner is established by real tick/hud before the first camera read`,async()=>{
 const f=await chapterFixture(chapter,false,true);try{const g=f.ui.cameraOptions,controls=f.d.querySelector('#controls');assert.ok(g.fixedCameraGeometry.occlusions.some(r=>r.kind==='control'));assert.equal(g.occlusions.some(r=>r.kind==='control'),false);assert.equal(chapterControlsDisplay(f.d),'grid');assert.equal(f.w.getComputedStyle(controls).display,'grid');assert.equal(f.w.getComputedStyle(controls).position,'absolute');assert.equal(f.w.getComputedStyle(controls).visibility,'hidden');}finally{f.close();}
});

test('root production overlay passes its explicit street owner into hidden close-camera slot measurement',()=>{
 const f=rootFixture();try{f.app.dataset.depthRoute='true';f.mode('classic');const active=f.overlay.cameraSafety;assert.ok(active.occlusions.some(r=>r.kind==='control'));f.pause.classList.remove('hidden');const paused=f.overlay.cameraSafety;assert.deepEqual(paused.occlusions,active.occlusions);assert.deepEqual(paused.fixedCameraGeometry,active.fixedCameraGeometry);f.app.dataset.depthRoute='false';const vs=f.overlay.cameraSafety;assert.equal(vs.occlusions.some(r=>r.kind==='control'),false,'ordinary classic VS remains on its old visibility policy');}finally{f.close();}
});
