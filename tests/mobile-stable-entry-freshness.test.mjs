import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
import {mountCombatOverlayLayout} from '../dist/combat-overlay-layout.mjs';
import {applyChallengeLayout} from '../dist/challenge-layout.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {canReuseCameraFrame} from '../dist/challenge-camera.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {Duel,CAST} from '../dist/core.mjs';
import {MatchSeries} from '../dist/match-modes.mjs';
import {challengeOpponentStats} from '../dist/challenge-opponent-policy.mjs';
import {routeCameraFrame} from '../dist/challenge-render.mjs';

const pair=JSON.parse(readFileSync(new URL('./fixtures/mobile-stable-entry-geometry.json',import.meta.url))),source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const fit=(geometry,previous=null,actors=pair.fresh.actors)=>fullStageCameraFrame(fixedStableCameraFrame,568,320,actors,previous,0,{...geometry,touch:true,cameraMode:'stable'});
async function fixture(){
 const f=await starterGameEntry({width:568,height:320}),c=f.context,app=f.$('.app'),canvas=f.document.createElement('canvas');f.$('#game').append(canvas);
 const raf=new Map();let rafId=0,reads=0,selected='stable',frozen=null;
 f.window.requestAnimationFrame=fn=>{raf.set(++rafId,fn);return rafId;};f.window.cancelAnimationFrame=id=>raf.delete(id);f.window.HTMLCanvasElement.prototype.getContext=()=>null;
 Object.defineProperties(app,{clientWidth:{get:()=>parseFloat(app.style.width)},clientHeight:{get:()=>parseFloat(app.style.height)}});
 Object.assign(app.dataset,{touch:'true',layout:'landscape',rotation:'0',gameMode:'battle',depthRoute:'false',titleOpen:'false',compact:'true',fullBleed:'true',landscapePreview:'false'});
 const physical=r=>{reads++;return app.dataset.rotation==='90'?box(app.clientHeight-r.bottom,r.left,r.height,r.width):r;};
 app.getBoundingClientRect=canvas.getBoundingClientRect=()=>physical(box(0,0,app.clientWidth,app.clientHeight));
 f.$('.dom-hud').getBoundingClientRect=()=>physical(app.dataset.gameMode==='challenge'?app.dataset.landscapePreview==='true'?box(8,28,552,40):box(8,40,552,48):box(8,48,552,64));
 const nodes=[],seen=new Set();for(const selector of [':scope > header','.challenge-save-slot','.dom-hud .hud-side,.dom-hud .timer,.dom-hud .hud-status,.dom-hud > [class*="status"],.dom-hud > [role="status"]','.chapter-objective,.route-hud','.control-deck button,.control-deck #touch-stick,.control-deck .specials,.control-deck .guard-hint'])for(const el of app.querySelectorAll(selector)){
  if(seen.has(el))continue;seen.add(el);if(el.matches('.movement button')){el.style.display='none';continue;}if(el.matches('.hud-status')&&el.closest('.hud-side'))continue;nodes.push(el);
 }
 assert.equal(nodes.length,pair.stale.options.fixedCameraGeometry.occlusions.length);
 nodes.forEach((el,i)=>el.getBoundingClientRect=()=>physical({...((app.dataset.gameMode==='challenge'?pair.fresh:pair.stale).options.fixedCameraGeometry.occlusions[i])}));
 const overlay=mountCombatOverlayLayout({document:f.document,getCameraMode:()=>frozen??selected});
 const noop=()=>{},timers=new Map();let ti=0;Object.assign(c,{Duel,CAST,MatchSeries,challengeOpponentStats,opponent:'han',enemyAssist:'wang',roundFormat:'single',trainingBehavior:'stand',trainingInfinite:true,trainingRepeat:true,trainingRestartGate:null,sanitizeSelections:noop,sfx:noop,unlockMusic:noop,setTimeout:fn=>{timers.set(++ti,fn);return ti;},clearTimeout:id=>timers.delete(id)});
 const section=(x,y)=>source.slice(source.indexOf(x),source.indexOf(y));vm.runInNewContext(section('function nextRound()','function pauseGame()')+'\n'+section('function syncModeHUD()','function result()')+'\n'+source.split('\n').find(x=>x.startsWith('function newDuel()')),c);
 const scene={game:{events:new EventEmitter()},sys:{events:new EventEmitter()},scale:{width:568,height:320},cameras:{main:{setViewport(){},setZoom(z){this.zoom=z;},centerOn(){}}},combatOverlay:overlay,arenaBackdrop:{setVisible(){}},backdropExtensions:[],boundaryGraphics:{setVisible(){}},ambient:{setVisible(){}}};c.scene=scene;
 // Execute the actual root camera-selection AND cameraDuel/cameraView commit
 // statements, rather than choosing a later solver result after history reset.
 c.viewportUI={frame:{width:568,height:320,touch:true,fullBleed:true},camera:'stable',nativeLandscape:true,ready:false};Object.assign(c,{fullStageCameraFrame,fixedStableCameraFrame,canReuseCameraFrame,routeCameraFrame,matchFinish:null});
 const cameraSource=section('  const isRoute=duel instanceof ChallengeRoute','  this.combatOverlay?.draw(');
 const commit=()=>vm.runInNewContext('(function(){'+cameraSource+'return frame;}).call(scene)',{...c,delta:0});
 return {...f,app,canvas,overlay,scene,raf,timers,commit,get reads(){return reads;},select(value){selected=value;c.viewportUI.camera=value;},freeze(value){frozen=value;},cleanup(){c.cancelChallengeSceneHandoff();overlay.destroy();f.close();}};
}

test('captured r4 entry replay distinguishes poisoned history from the fresh initial solution',()=>{
 const stale=fit(pair.stale.options),retained=fit(pair.fresh.options,stale),fresh=fit(pair.fresh.options);
 assert.ok(Math.abs(stale.zoom-.375)<1e-8);assert.equal(retained.zoom,stale.zoom);assert.ok(Math.abs(fresh.zoom-.525)<1e-8);
});
test('real startRound/syncModeHUD/newDuel commits fresh Boss geometry on its FIRST camera read, before observers or RAF',async()=>{
 const f=await fixture();try{
  assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:battle:false');
  const run=await AsyncChallengeSession.create({progress:f.profiles,characterId:'wang'});for(let i=0;i<5;i++)await(run.phase.kind==='route'?run.routeComplete({}):run.bossWon({}));
  Object.assign(f.context,{challengeRun:run,gameMode:'challenge'});const pending=f.context.startRound();
  assert.equal(f.app.dataset.gameMode,'challenge');assert.equal(f.context.duel.enemy.type,'huang');assert.equal(f.context.duel.status,'countdown');assert.equal(f.timers.size,0,'scene has not acknowledged its first paint');
  const first=f.commit();assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:challenge:false');
  assert.ok(Math.abs(first.zoom-.525)<1e-8,`first committed zoom ${first.zoom}, not a later repaired sample`);assert.equal(f.scene.cameraView,first);assert.equal(f.scene.cameraDuel,f.context.duel);assert.equal(f.scene.cameras.main.zoom,first.zoom);
  assert.equal(f.commit().zoom,first.zoom);f.overlay.refresh();assert.equal(f.commit().zoom,first.zoom,'late layout callback cannot reveal a smaller poisoned owner');f.context.viewportUI.ready=true;assert.equal(f.commit().zoom,first.zoom,'the same owner remains correct after ready; not a claim about native first-visible pixels');
  // Retry/next round creates another real duel and must not inherit this owner.
  const owner=f.scene.cameraDuel;const retry=f.context.startRound();assert.notEqual(f.context.duel,owner);assert.ok(Math.abs(f.commit().zoom-.525)<1e-8);assert.equal(f.scene.cameraDuel,f.context.duel);
  f.context.cancelChallengeSceneHandoff();await pending;await retry;
 }finally{f.cleanup();}
});
test('structural identity synchronously covers game mode, route, title and applied street presentation',async()=>{
 const f=await fixture();try{
  let previous=f.overlay.cameraSafety;
  for(const change of [{gameMode:'challenge'},{depthRoute:'true'},{titleOpen:'true'},{titleOpen:'false'},{depthRoute:'false'},{gameMode:'battle'},{gameMode:'training'}]){
   Object.assign(f.app.dataset,change);const current=f.overlay.cameraSafety;assert.notEqual(current,previous,JSON.stringify(change));
   assert.equal(current.fixedCameraGeometry.layoutKey,`compact-stable-slots-v1:${f.app.dataset.gameMode}:${f.app.dataset.depthRoute}`);
   assert.equal(f.app.dataset.landscapePreview,String(f.app.dataset.titleOpen==='false'&&f.app.dataset.depthRoute==='true'));
   const first=fit(current);f.overlay.refresh();assert.deepEqual(first,fit(f.overlay.cameraSafety),'first solution equals an explicit fresh solve, including VS/training');previous=f.overlay.cameraSafety;
  }
 }finally{f.cleanup();}
});
test('real street and Boss world transitions and challenge exit use their first current geometry without inherited history',async()=>{
 const f=await fixture();try{
  const run=await AsyncChallengeSession.create({progress:f.profiles,characterId:'wang'});Object.assign(f.context,{challengeRun:run,gameMode:'challenge'});
  assert.equal(run.phase.kind,'route');const streetPending=f.context.startChallengePhase(),street=f.commit(),streetWorld=f.context.duel;
  assert.equal(f.app.dataset.landscapePreview,'true');assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:challenge:true');assert.equal(f.scene.cameraDuel,streetWorld);
  f.overlay.refresh();assert.equal(f.commit().zoom,street.zoom);
  await run.routeComplete({});assert.equal(run.phase.kind,'boss');const bossPending=f.context.startRound(),boss=f.commit();assert.notEqual(f.context.duel,streetWorld);assert.equal(f.app.dataset.landscapePreview,'false');assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:challenge:false');
  assert.ok(Math.abs(boss.zoom-.525)<1e-8);assert.equal(boss.zoom,fit(f.overlay.cameraSafety,null,[f.context.duel.player,f.context.duel.enemy]).zoom);
  const bossWorld=f.context.duel;await run.bossWon({});assert.equal(run.phase.kind,'route');const nextStreetPending=f.context.startChallengePhase(),nextStreet=f.commit();assert.notEqual(f.context.duel,bossWorld);assert.equal(f.app.dataset.landscapePreview,'true');assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:challenge:true');
  const current=f.scene.cameraView;f.scene.cameraDuel=null;assert.deepEqual(f.commit(),current,'new-world solution already equals a no-history solution');assert.equal(nextStreet.zoom,current.zoom);
  f.context.endChallenge();f.context.startRound();const vs=f.commit();assert.equal(f.context.gameMode,'battle');assert.equal(f.app.dataset.landscapePreview,'false');assert.equal(f.overlay.cameraSafety.fixedCameraGeometry.layoutKey,'compact-stable-slots-v1:battle:false');assert.equal(vs.zoom,fit(f.overlay.cameraSafety,null,[f.context.duel.player,f.context.duel.enemy]).zoom,'VS uses its own taller HUD, not a forced Boss scale');
  await Promise.all([streetPending,bossPending,nextStreetPending]);
 }finally{f.cleanup();}
});
test('unchanged getter is layout-read/write free; transient text/press changes do not invalidate structural identity',async()=>{
 const f=await fixture();try{
  const g=f.overlay.cameraSafety,reads=f.reads,observer=new f.window.MutationObserver(()=>{});observer.observe(f.app,{attributes:true,subtree:true});
  for(let i=0;i<100;i++)assert.equal(f.overlay.cameraSafety,g);assert.equal(f.reads,reads);assert.equal(observer.takeRecords().length,0);
  const item=f.$('#item-status');item.textContent='你持有吱吱橡皮鴨 · 按攻擊丟出';item.getBoundingClientRect=()=>box(150,91,260,80);const button=f.$('.control-deck button');button.style.transform='translateY(2px)';const old=button.getBoundingClientRect;button.getBoundingClientRect=()=>{const r=old();return {...r,top:r.top+2,bottom:r.bottom+2};};
  observer.takeRecords();for(let i=0;i<100;i++)assert.equal(f.overlay.cameraSafety,g);assert.equal(f.reads,reads);assert.equal(observer.takeRecords().length,0);observer.disconnect();
  f.app.dataset.gameMode='challenge';const changed=f.overlay.cameraSafety,count=f.reads;await Promise.resolve();assert.equal(f.overlay.cameraSafety,changed);assert.equal(f.reads,count,'the delayed structural observer must not repeat a synchronous refresh');assert.equal(f.raf.size,0);
 }finally{f.cleanup();}
});
test('effective frozen mode stays cached, active mode and applied viewport dimensions/safe/rotation/surface changes refresh synchronously',async()=>{
 const f=await fixture();try{
  const initial=f.overlay.cameraSafety;f.freeze('stable');f.select('classic');assert.equal(f.overlay.cameraSafety,initial);assert.equal(f.app.dataset.fixedCameraLayout,'true');f.freeze(null);assert.notEqual(f.overlay.cameraSafety,initial);assert.equal(f.app.dataset.fixedCameraLayout,'false');f.select('stable');void f.overlay.cameraSafety;
  // Root preserves its existing safe-area policy: street full-bleed geometry
  // uses these insets; this test does not broaden VS/Boss legacy safe metrics.
  Object.assign(f.app.dataset,{gameMode:'challenge',depthRoute:'true'});void f.overlay.cameraSafety;
  const frame={width:568,height:320,touch:true,rotation:0,fullBleed:true,safeTop:0,safeRight:0,safeBottom:0,safeLeft:0};
  for(const change of [{safeLeft:12},{width:600},{rotation:90},{safeTop:8}]){
   const previous=f.overlay.cameraSafety;Object.assign(frame,change);applyChallengeLayout(f.app,frame);f.app.style.width=frame.width+'px';f.app.style.height=frame.height+'px';f.app.dataset.rotation=String(frame.rotation);
   const current=f.overlay.cameraSafety;assert.notEqual(current,previous,JSON.stringify(change));assert.equal(current.safeRect.width,frame.width-(frame.rotation===90?frame.safeTop+frame.safeBottom:frame.safeLeft+frame.safeRight));
  }
  for(const [key,value]of [['surfaceGeneration','2'],['viewportEpoch','3'],['touch','false'],['fullBleed','false'],['landscapePreview','true']]){const previous=f.overlay.cameraSafety;f.app.dataset[key]=value;assert.notEqual(f.overlay.cameraSafety,previous,key);}
  const beforeReplacement=f.overlay.cameraSafety,replacement=f.canvas.cloneNode();replacement.getBoundingClientRect=f.canvas.getBoundingClientRect;f.canvas.replaceWith(replacement);assert.notEqual(f.overlay.cameraSafety,beforeReplacement,'same-size canvas replacement is a new measurement target');
 }finally{f.cleanup();}
});
