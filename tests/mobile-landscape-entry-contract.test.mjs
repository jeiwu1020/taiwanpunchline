import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {mountCombatOverlayLayout} from '../dist/combat-overlay-layout.mjs';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {gameHarness} from './helpers/game-harness.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {streetTrialFrame} from '../dist/preview/chapter2/street-trial-view.mjs';
function domFixture(html){
 const frames=new Map();let now=0,id=0;
 const dom=new JSDOM(readFileSync(new URL(html,import.meta.url),'utf8'),{url:'https://camera-contract.test/?previewOnly=1',pretendToBeVisual:true}),{window:w}=dom,d=w.document,app=d.querySelector('#trial-app')||d.querySelector('.app');
 Object.defineProperties(w,{innerWidth:{value:844,writable:true},innerHeight:{value:390,writable:true}});Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};w.cancelAnimationFrame=id=>frames.delete(id);w.performance.now=()=>now;w.visualViewport=Object.assign(new w.EventTarget(),{width:844,height:390,scale:1,offsetLeft:0,offsetTop:0});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.HTMLCanvasElement.prototype.getContext=()=>null;
 Object.defineProperties(app,{clientWidth:{value:844},clientHeight:{value:390}});Object.assign(app.dataset,{touch:'true',layout:'landscape',rotation:'0'});app.style.width='844px';app.style.height='390px';
 w.HTMLElement.prototype.getBoundingClientRect=function(){let left=0,top=0,width=0,height=0;
  if(this===app||this.matches('canvas,#game,#stage')){width=844;height=390;}
  else if(this.matches('header')){left=8;top=4;width=828;height=32;}
  else if(this.matches('.hud-side,.timer')){left=this.classList.contains('enemy')?458:8;top=40;width=378;height=48;}
  else if(this.matches('#touch-stick')){left=8;top=272;width=112;height=112;}
  else if(this.matches('.control-deck button,.specials')){left=542;top=270;width=294;height=114;}
  return {left,top,width,height,right:left+width,bottom:top+height};};
 for(const el of d.querySelectorAll('#stage,#game-canvas'))Object.defineProperties(el,{clientWidth:{value:844},clientHeight:{value:390}});
 return {dom,w,d,app,settle(ui){for(let i=0;i<80;i++){now+=16;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(now);ui.paintFrame(ui.surfaceToken);}assert.equal(ui.ready,true);}};
}
const count=h=>{let turns=0;while(h.timers.size&&turns++<30){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}assert.equal(h.timers.size,0);};
// The actual game constructor/entry functions choose the world and the real
// Arena.updateFrame chooses its camera. Only painting after selection is cut
// off, so this is executable source wiring, not a text/regex contract.
for(const camera of ['classic','stable'])for(const entry of ['VS','training',0,1,2,3,4,5])test(`real main ${entry} ${camera} entry consumes measured geometry`,async()=>{
 const dom=domFixture('../dist/index.html'),overlay=mountCombatOverlayLayout({document:dom.d}),h=await gameHarness();
 try{
  h.ui.setScene({artImages:{}});h.document.defaultView={innerWidth:844,innerHeight:390,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
  const route=typeof entry==='number'&&entry%2===0;
  if(typeof entry==='number'){
   const session=await AsyncChallengeSession.create({progress:h.ui.profiles});
   while(session.checkpoint<entry){session.phase.kind==='route'?await session.routeComplete({}):await session.bossWon({});}
   await h.ui.startChallenge({characterId:'wang',helperId:'han'});
   const story=h.$('.app').children?.find(el=>el.className==='challenge-story');
   if(story)for(let i=0;h.ui.duel.status==='story'&&i<12;i++){story.querySelector('[data-story-next]').onclick();await new Promise(resolve=>setImmediate(resolve));}
   await new Promise(resolve=>setImmediate(resolve));count(h);
   assert.equal(h.ui.challenge.checkpoint,entry);assert.equal(h.ui.challenge.phase.kind,route?'route':'boss');
   assert.equal(h.ui.duel instanceof h.ChallengeDepthRoute,route);
  }else{h.ui.showMenu();if(entry==='training')h.$('#mode-training').onclick();h.ui.startGame();count(h);assert.equal(h.ui.gameMode,entry==='training'?'training':'battle');}
  h.ui.duel.status='active';h.$('#result').classList.add('hidden');const stop=new Error('selected real camera'),part=()=>({setVisible(){}}),scene={scale:{width:844,height:390},time:{now:0},cameras:{main:{setViewport(){},setZoom(){},centerOn(){}}},combatOverlay:{get cameraSafety(){return overlay.cameraSafety;},draw(options){overlay.draw(options);throw stop;}},arenaBackdrop:part(),backdropExtensions:[],boundaryGraphics:part(),ambient:part()};
  h.ui.setViewport({frame:{width:844,height:390,touch:true,fullBleed:true},nativeLandscape:true,camera});
  assert.ok(overlay.cameraSafety.occlusions.some(o=>o.kind==='control'));
  assert.throws(()=>h.ui.Arena.prototype.updateFrame.call(scene,0,0),error=>error===stop);
  const result=scene.cameraView;assert.equal(scene.cameraDuel,h.ui.duel);assert.equal(result.controlOverlay,'soft');assert.equal(result.cameraSafetyFit,true);assert.ok(result.zoom>.7);
  if(route){assert.equal(h.ui.duel.depthMode,true);assert.equal(result.mode,'depth-route','every active main route reaches the depth solver, never legacy nondepth framing');}
  if(camera==='stable'){assert.ok(result.playerFixedCamera);assert.equal(result.challengeCameraMode,'stable');assert.equal(result.playerFixedCamera.pose.x,h.ui.duel.player.x);assert.equal(result.playerFixedCamera.pose.displayY,h.ui.duel.player.y+(h.ui.duel.player.depth||0)*.65);}
  else assert.equal(result.playerFixedCamera,undefined);
  assert.equal(!!result.playerCloseCamera,route&&camera==='classic','only classic phone street adds close ownership');
  const g=h.ui.duel;if(route){g.spawn();g.events.length=0;}const opponent=route?g.enemies[0]:g.enemy;assert.ok(opponent,'a real spawned opponent is available');Object.assign(opponent,{x:g.player.x+200,y:-300});
  const draw=()=>assert.throws(()=>h.ui.Arena.prototype.updateFrame.call(scene,0,0),e=>e===stop),visible=()=>dom.d.querySelectorAll('.camera-direction-hint:not([hidden])').length;
  draw();assert.equal(visible(),camera==='stable'||route?1:0,'actual root draw forwards the selected camera/world to the shared hints, including route=false');
  if(camera==='stable'||route){
   for(const status of ['paused','over','story','menu']){g.status=status;draw();assert.equal(visible(),0,status);g.status='active';draw();assert.equal(visible(),1);}
   h.ui.setViewport({frame:{width:844,height:390,touch:true},nativeLandscape:true,camera,ready:false});draw();assert.equal(visible(),0,'not ready');h.ui.setViewport({frame:{width:844,height:390,touch:true},nativeLandscape:true,camera});
   h.$('#help-dialog').open=true;draw();assert.equal(visible(),0,'settings');h.$('#help-dialog').open=false;
   h.$('#result').classList.remove('hidden');draw();assert.equal(visible(),0,'result');h.$('#result').classList.add('hidden');draw();assert.equal(visible(),1);
  }

 }finally{overlay.destroy();dom.w.close();}
});
for(const chapter of [2,3,4])for(const route of [false,true])for(const camera of ['classic','stable'])test(`real chapter ${chapter} ${route?'street':'Boss'} ${camera} draw camera and UI options retain measured geometry`,async()=>{
 const h=domFixture(`../dist/preview/chapter${chapter}/index.html`);let ui;
 try{ui=mountChapterInterface({document:h.d,window:h.w,cast:{wang:{name:'王',moves:[]}},getCharacter:()=> 'wang',clearHold(){},surfaceContext:{setTransform(){},isContextLost:()=>false}});
  if(camera==='stable')h.d.querySelector('#camera-mode').click();
  h.settle(ui);const options=ui.cameraOptions;assert.equal(options.camera,camera);assert.equal(options.touch,true);assert.ok(options.occlusions.some(o=>o.kind==='control'));assert.ok(options.safeRect.right>0);assert.notEqual(options.measuredCameraSafety,false);
  const source=readFileSync(new URL(`../dist/preview/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-playable.mjs`,import.meta.url),'utf8'),start=source.indexOf('const route=!!g.depthMode'),end=source.indexOf(' const sx=x=>',start);
  const {createPlayableChapter}=await import(new URL(`../dist/preview/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-controller.mjs`,import.meta.url));
  const controller=createPlayableChapter({initialStepId:route?'route-a':'boss',rng:()=>.2}),g=controller.world;assert.equal(controller.view().mode,route?'route':'battle');
  const adapter=createMobileCameraAdapter(),draw=()=>vm.runInNewContext(`(function(){${source.slice(start,end)}return f;})()`,{g,w:844,h:390,s:controller.view(),ui,mobileCamera:adapter,streetTrialFrame,delta:1000/60}),result=draw();assert.equal(result.cameraFrame.controlOverlay,'soft');assert.equal(result.cameraFrame.cameraSafetyFit,true);assert.ok(result.zoom>.7);
  if(camera==='stable'){assert.ok(result.cameraFrame.playerFixedCamera);assert.equal(result.cameraFrame.challengeCameraMode,'stable');assert.equal(result.cameraFrame.playerFixedCamera.pose.x,g.player.x);assert.equal(result.cameraFrame.playerFixedCamera.pose.displayY,g.player.y+(g.player.depth||0)*.65);}else assert.equal(result.cameraFrame.playerFixedCamera,undefined);
  assert.equal(!!result.cameraFrame.playerCloseCamera,route&&camera==='classic','only classic phone street adds close ownership');
  if(route)g.spawn();const enemy=route?g.enemies[0]:g.enemy;assert.ok(enemy);Object.assign(enemy,{x:g.player.x+200,y:-300});draw();
  const visible=()=>h.d.querySelectorAll('.camera-direction-hint:not([hidden])').length;assert.equal(visible(),camera==='stable'||route?1:0,'real entry invokes the shared DOM owner');
  if(camera==='stable'||route){
   const measured=JSON.stringify(ui.cameraOptions.occlusions);ui.invalidateGeometry();assert.equal(JSON.stringify(ui.cameraOptions.occlusions),measured,'badges never become camera occlusions');
   const read=h.w.HTMLElement.prototype.getBoundingClientRect;h.w.HTMLElement.prototype.getBoundingClientRect=()=>{throw Error('per-frame DOM layout read');};draw();draw();h.w.HTMLElement.prototype.getBoundingClientRect=read;
   controller.setPaused(true,controller.view().token);draw();assert.equal(visible(),0,'paused entry');controller.setPaused(false,controller.view().token);draw();assert.equal(visible(),1);
   for(const mode of ['story','choice','complete','menu']){ui.render({state:{...controller.view(),mode},world:g});assert.equal(visible(),0,mode);draw();assert.equal(visible(),1);}
   const early=source.slice(source.indexOf("if(!s||s.mode==='story'"),start);
   for(const mode of ['story','choice','complete']){vm.runInNewContext(`(function(){${early}})()`,{s:{mode},g,ui,paintStory(){},w:844,h:390,time:0});assert.equal(visible(),0,'entry early clear '+mode);draw();assert.equal(visible(),1);}
   vm.runInNewContext(`(function(){${early}})()`,{s:controller.view(),g:null,ui});assert.equal(visible(),0,'entry no world early clear');draw();assert.equal(visible(),1);
   ui.render({state:null,world:null});assert.equal(visible(),0,'no world');draw();assert.equal(visible(),1);
   ui.openSettings();assert.equal(visible(),0,'settings clears immediately');draw();assert.equal(visible(),0,'settings modal');ui.closeSettings();h.settle(ui);draw();assert.equal(visible(),1);
   ui.openHome();assert.equal(visible(),0,'home clears immediately');draw();assert.equal(visible(),0,'home modal');
   h.w.dispatchEvent(new h.w.Event('resize'));assert.equal(ui.ready,false);draw();assert.equal(visible(),0,'not-ready lifecycle');
  }

 }finally{ui?.destroy();h.w.close();}
});

for(const rotation of [0,90,-90])test(`root hint origin converts canvas offset once at rotation ${rotation}`,()=>{
 const h=domFixture('../dist/index.html'),canvas=h.d.createElement('canvas');h.d.querySelector('#game').append(canvas);h.app.dataset.rotation=String(rotation);
 const physical=(x,y,width,height)=>{const left=rotation===90?100+390-y-height:rotation===-90?100+y:100+x,top=rotation===90?200+x:rotation===-90?200+844-x-width:200+y;return {left,top,width:rotation?height:width,height:rotation?width:height,right:left+(rotation?height:width),bottom:top+(rotation?width:height)};};
 h.w.HTMLElement.prototype.getBoundingClientRect=function(){return this===h.app?physical(0,0,844,390):this===canvas?physical(17,23,844,390):physical(0,0,0,0);};
 const canvasCount=h.d.querySelectorAll('canvas').length,overlay=mountCombatOverlayLayout({document:h.d}),frame={width:844,height:390,x:422,y:195,zoom:1,playerFixedCamera:{anchor:{x:422,y:330},pose:{x:422,displayY:330}}},world={player:{x:422,y:330,hp:100},enemy:{x:844,y:300,hp:100}};
 try{overlay.draw({route:false,images:{},time:0,cameraFrame:frame,world,hintsActive:true});const badge=h.d.querySelector('.camera-direction-hint:not([hidden])');assert.ok(badge);assert.equal(badge.style.left,'756px');assert.equal(badge.style.top,'194.5px');
  const mic=h.d.querySelector('.route-mic-overlay');assert.equal(mic.width,64);assert.equal(mic.height,64);assert.equal(mic.hidden,true);assert.equal(h.d.querySelectorAll('canvas').length,canvasCount+1);
  const before=JSON.stringify(overlay.cameraSafety);overlay.refresh();assert.equal(JSON.stringify(overlay.cameraSafety),before);
  h.w.HTMLElement.prototype.getBoundingClientRect=()=>{throw Error('per-frame layout read');};overlay.draw({route:false,images:{},time:0,cameraFrame:frame,world,hintsActive:true});
 }finally{overlay.destroy();assert.equal(h.d.querySelector('.camera-direction-hints'),null);h.w.close();}
});

for(const rotation of [0,90])test(`shared later UI converts a canvas offset once at rotation ${rotation}`,()=>{
 const h=domFixture('../dist/preview/chapter2/index.html');
 if(rotation===90){h.w.innerWidth=390;h.w.innerHeight=844;Object.assign(h.w.visualViewport,{width:390,height:844});h.w.HTMLElement.prototype.getBoundingClientRect=function(){return this===h.app||this.matches('#stage,#game-canvas')?{left:0,top:0,right:390,bottom:844,width:390,height:844}:{left:0,top:0,right:0,bottom:0,width:0,height:0};};}
 const ui=mountChapterInterface({document:h.d,window:h.w,cast:{wang:{name:'王',moves:[]}},getCharacter:()=> 'wang',surfaceContext:{setTransform(){},isContextLost:()=>false}});
 try{h.settle(ui);assert.equal(ui.viewport.rotation,rotation);const canvas=h.d.querySelector('#game-canvas');
  const physical=(x,y,width,height)=>{const left=rotation===90?100+390-y-height:rotation===-90?100+y:100+x,top=rotation===90?200+x:rotation===-90?200+844-x-width:200+y;return {left,top,width:rotation?height:width,height:rotation?width:height,right:left+(rotation?height:width),bottom:top+(rotation?width:height)};};
  h.w.HTMLElement.prototype.getBoundingClientRect=function(){return this===h.app?physical(0,0,844,390):this===canvas?physical(17,23,844,390):physical(0,0,0,0);};
  ui.invalidateGeometry();ui.cameraOptions;
  const frame={width:844,height:390,x:422,y:195,zoom:1,playerFixedCamera:{anchor:{x:422,y:330},pose:{x:422,displayY:330}}},world={player:{x:422,y:330,hp:100},enemy:{x:844,y:300,hp:100}};
  h.w.HTMLElement.prototype.getBoundingClientRect=()=>{throw Error('hint update remeasured geometry');};ui.renderCameraHints(frame,world);const badge=h.d.querySelector('.camera-direction-hint:not([hidden])');assert.ok(badge);assert.equal(badge.style.left,'756px');assert.equal(badge.style.top,'194.5px');
  h.w.dispatchEvent(new h.w.Event('resize'));assert.equal(ui.ready,false);assert.equal(h.d.querySelectorAll('.camera-direction-hint:not([hidden])').length,0,'invalidation clears without another game draw');
 }finally{ui.destroy();assert.equal(h.d.querySelector('.camera-direction-hints'),null);h.w.close();}
});
