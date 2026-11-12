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
 let width=844,height=390,physicalWidth=844,physicalHeight=390,cameraCalls=0,canvasWrites=0,uiResizes=0,viewportOptions,touchOptions,paintCount=0,failures=0,scheduled=0,throwDraw=false,lastError=null;
 Object.defineProperties(w,{innerWidth:{get:()=>physicalWidth},innerHeight:{get:()=>physicalHeight}});
 Object.defineProperties(stage,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
 for(const key of ['width','height']){let value=canvas[key];Object.defineProperty(canvas,key,{get:()=>value,set:v=>{canvasWrites++;value=v;}});}
 Object.defineProperties(canvas,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});Object.defineProperty(w,'devicePixelRatio',{value:2});
 let matrix={a:1,b:0,c:0,d:1,e:0,f:0};const ctx=new Proxy({},{get:(_target,key)=>key==='getTransform'?()=>matrix:key==='setTransform'?(a,b,c,d,e,f)=>{matrix={a,b,c,d,e,f};}:key==='measureText'?()=>({width:100}):key==='clearRect'?()=>{if(throwDraw){throwDraw=false;throw new Error('injected draw failure');}}:()=>{}});canvas.getContext=()=>ctx;
 const surface=createCanvasViewportSurface({window:w,stage,canvas,context:ctx,getLifecycle:()=>null});
 const captured=[];const imported={};for(const match of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?$/gm)){
  const namespace=await import(new URL(match[2],file));for(const name of match[1].split(',')){const [remote,local]=name.trim().split(/\s+as\s+/);imported[local||remote]=namespace[remote];}
 }
 const ui={viewport:{rotation:0,width,height},ready:false,epoch:1,preferences:{},resize:()=>uiResizes++,setCameraAvailable(){},refreshAccess(){},cancelRestart(){},syncMedia(){},render(){},renderCameraHints(){},clearCameraHints(){},logicalRect:r=>r,prepareSurface:()=>surface.prepare(),beginFrame:()=>({epoch:ui.epoch}),paintFrame:()=>paintCount++,failFrame:error=>{lastError=error;failures++;ui.ready=false;}};
 ui.cameraOptions={touch:true};const rawCamera=imported.createMobileCameraAdapter;Object.assign(imported,{drawStreetBackdrop:(ctx,image,frame,w,h,...args)=>{const policy=prepareStreetStaticCaches(ctx,frame);captured.push({width:w,height:h,frame:{...frame},presentation:frame.presentation??null,policy,switches:streetStaticCacheDiagnostics(ctx).policySwitches});return {};},createMobileCameraAdapter:()=>{const adapter=rawCamera(),frame=adapter.frame;adapter.frame=(...args)=>{cameraCalls++;return frame(...args);};return adapter;},mountChapterInterface:options=>(viewportOptions=options,ui),createChapterMedia:()=>({unlock(){},sync(){},setPreferences(){},handleEvents(){}}),mountSpecialNameFit(){},mountCampaignTouch(){},mountContinuationControls:()=>({render(){},assetsReady(){},openPreparation(){},returnOverview(){}}),bindTouchControls:options=>(touchOptions=options,{clear(){}})});
 const context=vm.createContext({...imported,window:w,document:d,devicePixelRatio:2,performance:w.performance,Image:class{},requestAnimationFrame(){scheduled++;},URL,console});
 vm.runInContext(source.replace(/^import.*$/gm,'')+'\nglobalThis.entry={tick,draw,setHeld:value=>{held=value;},sync,resizeCanvas:typeof resizeCanvas===\'function\'?resizeCanvas:resize,hud,active,getChapter:()=>chapter,start:()=>document.querySelector(\'#start\').onclick()};',context);
 t.after(()=>w.close());
 return {source,w,d,ui,captured,entry:context.entry,get cameraCalls(){return cameraCalls;},setProfile(profile){width=profile.width;height=profile.height;physicalWidth=profile.rotation?height:width;physicalHeight=profile.rotation?width:height;ui.viewport={width,height,rotation:profile.rotation};ui.cameraOptions={...(profile.touch===undefined?{}:{touch:profile.touch}),rotation:profile.rotation};d.querySelector('#trial-app').style.transform=profile.rotation?`rotate(${profile.rotation}deg)`:'';},get lastError(){return lastError;},get paintCount(){return paintCount;},get failures(){return failures;},get scheduled(){return scheduled;},throwNextDraw:()=>{throwDraw=true;},get viewportOptions(){return viewportOptions;},get touchOptions(){return touchOptions;},get canvasWrites(){return canvasWrites;},get uiResizes(){return uiResizes;},setWidth:v=>width=v};
}


const {prepareStreetStaticCaches,streetStaticCacheDiagnostics}=await import(`../dist/preview/campaign/street-static-cache.mjs?v=${RUNTIME_VERSION}`);
const profiles=[
 {name:'native touch',width:844,height:390,touch:true,rotation:0,policy:'finite'},
 {name:'software +90',width:844,height:390,touch:true,rotation:90,policy:'finite'},
 {name:'software -90',width:844,height:390,touch:true,rotation:-90,policy:'finite'},
 {name:'portrait',width:390,height:844,touch:true,rotation:0,policy:'retained'},
 {name:'desktop',width:1280,height:720,touch:false,rotation:0,policy:'retained'},
 {name:'short desktop',width:844,height:390,touch:false,rotation:0,policy:'retained'},
 {name:'height500',width:844,height:500,touch:true,rotation:0,policy:'finite'},
 {name:'height501',width:844,height:501,touch:true,rotation:0,policy:'retained'},
 {name:'unknown',width:844,height:390,rotation:0,policy:'retained'}
];
// Advance the actual preview controller using its normal public transition
// methods. Only combat completion inputs are deterministic test boundaries;
// no controller state, camera frame or presentation is injected.
function visitModes(f,observe){
 observe('initial',true);f.entry.start();const chapter=f.entry.getChapter(),seen=new Set();
 for(let step=0;step<100;step++){
  const state=chapter.view(),mode=state.mode;
  if(!seen.has(mode)){seen.add(mode);observe(mode,['story','choice','complete'].includes(mode));
   if(['route','battle'].includes(mode)){assert.equal(chapter.setPaused(true,chapter.view().token),true);observe('paused '+mode,false);assert.equal(chapter.setPaused(false,chapter.view().token),true);}
  }
  if(mode==='complete')break;
  if(mode==='story')assert.equal(chapter.nextStory(chapter.view().token),true);
  else if(mode==='result')assert.equal(chapter.continueResult(chapter.view().token),true);
  else if(mode==='route'){chapter.world.status='gate';chapter.step(0,{});}
  else if(mode==='battle'){chapter.world.status='over';chapter.world.winner='player';chapter.step(0,{});}
  else if(mode==='choice')assert.equal(chapter.finishChapter(chapter.view().token),true);
  else assert.fail('unexpected controller mode '+mode);
 }
 for(const required of ['story','route','battle','result','choice','complete'])assert.ok(seen.has(required),'actual controller reached '+required);
}
for(const chapter of [2,3,4])test(`chapter ${chapter} all actual draw callers use current UI logical presentation, including paused rotation`,async t=>{
 const f=await fixture(chapter,t),observed=[];
 visitModes(f,(mode,story)=>{for(const profile of profiles){
  f.setProfile(profile);const before=f.cameraCalls,count=f.captured.length;f.entry.draw(0);assert.equal(f.captured.length,count+1,'one backdrop per actual draw');const result=f.captured.at(-1);
  assert.equal(result.policy,profile.policy,mode+' / '+profile.name);assert.deepEqual(JSON.parse(JSON.stringify(result.presentation)),{width:profile.width,height:profile.height,touch:profile.touch===true});
  assert.equal(f.cameraCalls-before,story?0:1,'story composition must not enter camera solver');
  if(story){const {width:w,height:h}=profile,compact=h<480,portrait=w<h;assert.equal(result.frame.left,0);assert.equal(result.frame.base,portrait?Math.min(h*.59,Math.max(h*.42,w*.9)):h*(compact?.53:.59));assert.equal(result.frame.zoom,Math.min(w/720,(h*(compact?.51:.55))/300));}
  observed.push(mode+' / '+profile.name);
 }});
 assert.equal(observed.length,9*profiles.length,'initial/story/route/paused route/battle/paused battle/result/choice/complete');
});
for(const chapter of [2,3,4])for(const rotation of [0,90,-90])test(`chapter ${chapter} ${rotation} degree touch landscape keeps finite across all actual mode handoffs`,async t=>{
 const f=await fixture(chapter,t);f.setProfile({...profiles[0],rotation});visitModes(f,mode=>{f.entry.draw(0);const result=f.captured.at(-1);assert.equal(result.policy,'finite',mode);assert.equal(result.switches,0,'a mode handoff must not switch background policy');});
});
