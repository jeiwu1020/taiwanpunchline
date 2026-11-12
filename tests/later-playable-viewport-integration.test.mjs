import {createCanvasViewportSurface} from '../dist/viewport-lifecycle.mjs';
import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

// Execute each real entry module with deterministic DOM geometry and external
// adapters. Its actual canvas, HUD, readiness and callback functions run here.
async function fixture(n,t){
 const file=new URL(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-playable.mjs`,import.meta.url),source=readFileSync(file,'utf8');
 const dom=new JSDOM(readFileSync(new URL('index.html',file),'utf8'),{url:`https://game.test/preview/chapter${n}/?previewOnly=1`,pretendToBeVisual:true}),w=dom.window,d=w.document,stage=d.querySelector('#stage'),canvas=d.querySelector('canvas');
 let width=640,height=360,canvasWrites=0,uiResizes=0,viewportOptions,touchOptions,paintCount=0,failures=0,scheduled=0,throwDraw=false,lastError=null;
 Object.defineProperties(stage,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
 for(const key of ['width','height']){let value=canvas[key];Object.defineProperty(canvas,key,{get:()=>value,set:v=>{canvasWrites++;value=v;}});}
 Object.defineProperties(canvas,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});Object.defineProperty(w,'devicePixelRatio',{value:2});
 let matrix={a:1,b:0,c:0,d:1,e:0,f:0};const ctx=new Proxy({},{get:(_target,key)=>key==='getTransform'?()=>matrix:key==='setTransform'?(a,b,c,d,e,f)=>{matrix={a,b,c,d,e,f};}:key==='measureText'?()=>({width:100}):key==='clearRect'?()=>{if(throwDraw){throwDraw=false;throw new Error('injected draw failure');}}:()=>{}});canvas.getContext=()=>ctx;
 const surface=createCanvasViewportSurface({window:w,stage,canvas,context:ctx,getLifecycle:()=>null});
 const imported={};for(const match of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?$/gm)){
  const namespace=await import(new URL(match[2],file));for(const name of match[1].split(',')){const [remote,local]=name.trim().split(/\s+as\s+/);imported[local||remote]=namespace[remote];}
 }
 const ui={viewport:{rotation:0,width,height},ready:false,epoch:1,preferences:{},resize:()=>uiResizes++,setCameraAvailable(){},refreshAccess(){},cancelRestart(){},syncMedia(){},render(){},renderCameraHints(){},clearCameraHints(){},logicalRect:r=>r,prepareSurface:()=>surface.prepare(),beginFrame:()=>({epoch:ui.epoch}),paintFrame:()=>paintCount++,failFrame:error=>{lastError=error;failures++;ui.ready=false;}};
 Object.assign(imported,{mountChapterInterface:options=>(viewportOptions=options,ui),createChapterMedia:()=>({unlock(){},sync(){},setPreferences(){},handleEvents(){}}),mountSpecialNameFit(){},mountCampaignTouch(){},mountContinuationControls:()=>({render(){},assetsReady(){},openPreparation(){},returnOverview(){}}),bindTouchControls:options=>(touchOptions=options,{clear(){}})});
 const context=vm.createContext({...imported,window:w,document:d,devicePixelRatio:2,performance:w.performance,Image:class{},requestAnimationFrame(){scheduled++;},URL,console});
 vm.runInContext(source.replace(/^import.*$/gm,'')+'\nglobalThis.entry={tick,setHeld:value=>{held=value;},sync,resizeCanvas:typeof resizeCanvas===\'function\'?resizeCanvas:resize,hud,active,getChapter:()=>chapter,start:()=>document.querySelector(\'#start\').onclick()};',context);
 t.after(()=>w.close());
 return {source,w,d,ui,entry:context.entry,get lastError(){return lastError;},get paintCount(){return paintCount;},get failures(){return failures;},get scheduled(){return scheduled;},throwNextDraw:()=>{throwDraw=true;},get viewportOptions(){return viewportOptions;},get touchOptions(){return touchOptions;},get canvasWrites(){return canvasWrites;},get uiResizes(){return uiResizes;},setWidth:v=>width=v};
}
for(const n of [2,3,4]){
 test(`chapter ${n} playable gates input on shared readiness and reports the committed touch epoch`,async t=>{
  const f=await fixture(n,t);f.entry.start();const c=f.entry.getChapter();while(c.view().mode==='story')c.nextStory(c.view().token);
  assert.equal(!!f.entry.active(),false);f.ui.ready=true;assert.equal(!!f.entry.active(),true);
  assert.equal(typeof f.viewportOptions.clearHold,'function');assert.equal(typeof f.touchOptions.viewport,'function');assert.deepEqual(JSON.parse(JSON.stringify(f.touchOptions.viewport())),{ready:true,epoch:1,rotation:0});
  f.ui.ready=false;f.ui.epoch=2;assert.equal(!!f.entry.active(),false);assert.equal(f.touchOptions.viewport().epoch,2);
 });
 test(`chapter ${n} viewport callbacks never re-invalidate layout and identical canvas sizes are untouched`,async t=>{
  const f=await fixture(n,t),writes=f.canvasWrites,resizes=f.uiResizes;
  f.entry.resizeCanvas();f.viewportOptions.onViewportChange({frame:f.ui.viewport,epoch:2});assert.equal(f.canvasWrites,writes);assert.equal(f.uiResizes,resizes);
  f.setWidth(720);f.viewportOptions.onViewportChange({frame:f.ui.viewport,epoch:3});assert.equal(f.canvasWrites,writes+1);
  const before=f.canvasWrites;f.w.dispatchEvent(new f.w.Event('resize'));assert.equal(f.canvasWrites,before,'the shared lifecycle, not an entry listener, owns resize');
 });
 test(`chapter ${n} repeated route/objective HUD values do not rewrite text nodes`,async t=>{
  const f=await fixture(n,t);f.entry.start();const c=f.entry.getChapter();while(c.view().mode==='story')c.nextStory(c.view().token);f.entry.hud();
  const observer=new f.w.MutationObserver(()=>{});for(const id of ['route-progress','objective'])observer.observe(f.d.getElementById(id),{subtree:true,childList:true,characterData:true});
  f.entry.hud();assert.equal(observer.takeRecords().length,0);c.world.player.x=c.world.worldWidth/2;f.entry.hud();assert.ok(observer.takeRecords().length>0);observer.disconnect();
 });
 test(`chapter ${n} loads one shared viewport core before its module`,()=>{
  const html=readFileSync(new URL(`../dist/preview/chapter${n}/index.html`,import.meta.url),'utf8');const dom=new JSDOM(html),scripts=[...dom.window.document.scripts];
  const boot=scripts.filter(s=>s.src.includes('viewport-core.js'));assert.equal(boot.length,1);assert.ok(scripts.indexOf(boot[0])<scripts.findIndex(s=>s.type==='module'));assert.equal(boot[0].getAttribute('src'),`../../viewport-core.js?v=${RUNTIME_VERSION}`);dom.window.close();
 });
}
for(const n of [2,3,4])test(`chapter ${n} pause keeps settings and overview outside collapsed extras`,()=>{
 const dom=new JSDOM(readFileSync(new URL(`../dist/preview/chapter${n}/index.html`,import.meta.url),'utf8')),d=dom.window.document;
 for(const id of ['pause-settings','pause-home']){assert.equal(d.getElementById(id).closest('details'),null);assert.equal(d.getElementById(id).closest('#pause-panel')?.id,'pause-panel');}dom.window.close();
});

for(const n of [2,3,4])test(`chapter ${n} formal chapter choice delegates preparation to its single shared entry`,async t=>{
 const f=await fixture(n,t);f.entry.start();const c=f.entry.getChapter();
 for(let i=0;i<100&&c.view().mode!=='choice';i++){const s=c.view();if(s.mode==='story')c.nextStory(s.token);else if(s.mode==='result')c.continueResult(s.token);else if(s.mode==='route'){c.world.status='gate';c.step(0,{});}else if(s.mode==='battle'){c.world.status='over';c.world.winner='player';c.step(0,{});}}
 assert.equal(c.view().mode,'choice');const view=c.view;c.view=()=>({...view(),campaignChapterId:`chapter-${n}`,persisted:true,canNavigate:true});f.entry.sync();assert.equal(f.d.querySelector('#choice-roster').hidden,true);assert.equal(f.d.querySelector('#choice-roster button'),null);
});

for(const n of [2,3,4]){
 test(`chapter ${n} failed drawing schedules another RAF and only later successful drawing acknowledges paint`,async t=>{
  const f=await fixture(n,t);f.entry.tick(0);const before=f.paintCount,scheduled=f.scheduled;f.throwNextDraw();f.entry.tick(16);assert.equal(f.failures,1);assert.equal(f.paintCount,before);assert.equal(f.scheduled,scheduled+1);f.entry.tick(32);assert.equal(f.paintCount,before+1);assert.equal(f.scheduled,scheduled+2);
 });
 test(`chapter ${n} bounded substeps preserve elapsed time, pause, edge commands and world-transition boundaries`,async t=>{
  const f=await fixture(n,t);f.entry.start();const c=f.entry.getChapter();while(c.view().mode==='story')c.nextStory(c.view().token);f.ui.ready=true;let elapsed=0,steps=0,presses=0;const step=c.step,press=c.press;
  c.step=(dt,input)=>{elapsed+=dt;steps++;return step(dt,input);};c.press=(...args)=>{presses++;return press(...args);};f.entry.tick(0);assert.equal(f.failures,0,f.lastError?.stack);f.entry.setHeld({punch:true,right:true});f.entry.tick(100);assert.ok(Math.abs(elapsed-.1)<1e-9);assert.equal(steps,6);assert.equal(presses,1,'held punch repeats once per rendered frame, not each substep');
  c.setPaused(true,c.view().token);f.entry.tick(200);assert.ok(Math.abs(elapsed-.1)<1e-9);c.setPaused(false,c.view().token);f.ui.ready=false;f.entry.tick(300);assert.ok(Math.abs(elapsed-.1)<1e-9);
  f.ui.ready=true;steps=0;c.step=(dt,input)=>{steps++;c.world.status='gate';return step(dt,input);};f.entry.tick(400);assert.equal(steps,1,'no old-world substeps run after the chapter changes mode/token');
 });
}
