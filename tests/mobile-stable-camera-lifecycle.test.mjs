import test from 'node:test';
import assert from 'node:assert/strict';
import {fitChallengeCamera} from '../dist/challenge-camera.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {gameHarness} from './helpers/game-harness.mjs';
const geometry={safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[]};
const tight={safeRect:{left:250,top:170,right:450,bottom:310},occlusions:[]};
const initialPose={x:450,displayY:449.5};
const copy=value=>JSON.parse(JSON.stringify(value));
const cameraSnapshot=({cameraTracking,...frame})=>copy(frame);
function safe(frame,pose,g){
 assert.equal(frame.cameraSafetyFit,true);const x=frame.width/2+(pose.x-frame.x)*frame.zoom,y=frame.height/2+(pose.displayY-frame.y)*frame.zoom,r=g.safeRect;
 assert.ok(x-132*frame.zoom>=r.left-1e-6&&x+132*frame.zoom<=r.right+1e-6&&y-300*frame.zoom>=r.top-1e-6&&y+28*frame.zoom<=r.bottom+1e-6,'frozen canonical pose fits changed safe content');
}
function wrapper(kind){
 const world={player:{x:450,y:430,depth:30,hp:100,vy:0},enemy:{x:540,y:430,hp:100,vy:0},enemies:[],worldWidth:3600,section:{spawns:[]},spawned:new Set(),assists:[],status:'active'};world.enemies=[world.enemy];
 const adapter=createMobileCameraAdapter();let previous=null;
 return {world,reset(){previous=null;adapter.reset();},frame(extra={}){
  const o={width:844,height:390,touch:true,portrait:false,fullStage:true,nativeLandscape:true,landscapePreview:true,camera:'stable',cameraMode:'stable',delta:1000/60,...geometry,...extra};
  const {width:w,height:h}=o,legacy={zoom:.3,left:0,base:h-115},preferred={...legacy,width:w,height:h,x:480,y:300};
  if(kind==='solver')previous=fitChallengeCamera(preferred,[world.player,world.enemy],previous,o.delta,o);
  else if(kind==='fullStage')previous=fullStageCameraFrame(o.cameraMode==='stable'?fixedStableCameraFrame:cameraFrame,w,h,[world.player,world.enemy],previous,o.delta,o);
  else if(kind==='depthRoute')previous=depthRouteCameraFrame(w,h,world,{...o,previous});
  else previous=adapter.frame(legacy,world,{...o,route:kind==='laterRoute'}).cameraFrame;
  return previous;
 }};
}
for(const kind of ['solver','fullStage','depthRoute','laterBattle','laterRoute']){
 test(`${kind}: paused mode, player and equivalent native/sideways geometry stay frozen`,()=>{
  const h=wrapper(kind),first=h.frame(),snapshot=copy(first);assert.deepEqual(first.playerFixedCamera.pose,initialPose);
  Object.assign(h.world.player,{x:1800,y:52,depth:-90});h.world.enemy.x=-4000;
  for(const rotation of [90,-90,0]){const f=h.frame({paused:true,camera:'classic',cameraMode:'classic',rotation,nativeLandscape:rotation===0,viewportEpoch:rotation+200,...copy(geometry)});assert.deepEqual(copy(f),snapshot);}
 });
 test(`${kind}: reordered measured blockers and a new viewport epoch reuse the frozen frame`,()=>{
  const h=wrapper(kind),occlusions=[{left:0,top:0,right:844,bottom:60,kind:'hud'},{left:0,top:280,right:150,bottom:390,kind:'control'}],first=h.frame({occlusions}),snapshot=copy(first);h.world.player.x=1600;
  const next=h.frame({paused:true,camera:'classic',cameraMode:'classic',occlusions:copy(occlusions).reverse(),viewportEpoch:99,rotation:-90});assert.deepEqual(copy(next),snapshot);
 });
 test(`${kind}: same-size safe-area change repairs frozen pose and preserves stable until resume`,()=>{
  const h=wrapper(kind),first=h.frame();Object.assign(h.world.player,{x:1800,y:52,depth:-90});
  const changed=h.frame({paused:true,camera:'classic',cameraMode:'classic',...tight});
  assert.notEqual(changed.playerFixedCamera.geometryKey,first.playerFixedCamera.geometryKey);assert.deepEqual(changed.playerFixedCamera.pose,initialPose);assert.equal(changed.challengeCameraMode,'stable');assert.ok(changed.zoom<first.zoom);safe(changed,initialPose,tight);
  const again=h.frame({paused:true,camera:'classic',cameraMode:'classic',...copy(tight)});assert.deepEqual(copy(again),copy(changed));
  const live=h.frame({paused:false,...tight});assert.deepEqual(live.playerFixedCamera.pose,{x:1800,displayY:-6.5});assert.equal(live.zoom,changed.zoom);
  const classic=h.frame({paused:false,camera:'classic',cameraMode:'classic',...tight});assert.equal(classic.playerFixedCamera,undefined);assert.equal(classic.challengeCameraMode,'classic');
 });
 test(`${kind}: same-size HUD reflow moves only the frozen anchor when old zoom remains safe`,()=>{
  const h=wrapper(kind),first=h.frame();h.world.player.x=3000;
  const next=h.frame({paused:true,occlusions:[{left:370,right:474,top:80,bottom:220,kind:'hud'}]});
  assert.notEqual(next.playerFixedCamera.geometryKey,first.playerFixedCamera.geometryKey);assert.notDeepEqual(next.playerFixedCamera.anchor,first.playerFixedCamera.anchor);assert.equal(next.zoom,first.zoom);assert.deepEqual(next.playerFixedCamera.pose,initialPose);
 });
 test(`${kind}: compact resize rebuilds a safe scale from the frozen pose`,()=>{
  const h=wrapper(kind),first=h.frame();Object.assign(h.world.player,{x:1800,y:52,depth:-90});
  const g={safeRect:{left:0,top:0,right:568,bottom:320},occlusions:[]},next=h.frame({paused:true,camera:'classic',cameraMode:'classic',width:568,height:320,...g});
  assert.equal(next.width,568);assert.equal(next.height,320);assert.equal(next.zoom,320*.68/328);assert.notEqual(next.zoom,first.zoom);assert.deepEqual(next.playerFixedCamera.pose,initialPose);safe(next,initialPose,g);
 });
 test(`${kind}: leaving measured compact profile discards fixed state`,()=>{
  for(const changed of [{touch:false},{measuredCameraSafety:false},{width:390,height:844,portrait:true,safeRect:{left:0,top:0,right:390,bottom:844}},{width:960,height:540,safeRect:{left:0,top:0,right:960,bottom:540}}]){
   const h=wrapper(kind);h.frame();const next=h.frame({paused:true,...changed});assert.equal(next.playerFixedCamera,undefined);
  }
 });
 test(`${kind}: legacy paused frames keep their freeze while close street safely rebases measured changes`,()=>{
  for(const options of [{camera:'classic',cameraMode:'classic'},{touch:false},{measuredCameraSafety:false},{width:390,height:844,portrait:true,safeRect:{left:0,top:0,right:390,bottom:844}}]){
   const h=wrapper(kind),first=h.frame(options),snapshot=cameraSnapshot(first);assert.equal(first.playerFixedCamera,undefined);h.world.player.x=1600;
   const close=(kind==='depthRoute'||kind==='laterRoute')&&(options.camera==='classic'||options.width===390);
   assert.equal(!!first.playerCloseCamera,close,'changed ownership is limited to measured phone street');
   const next=h.frame({...options,paused:true,camera:'stable',cameraMode:'stable',...tight});
   if(close){assert.ok(next.playerCloseCamera);assert.equal(next.challengeCameraMode,first.challengeCameraMode);assert.deepEqual(next.playerCloseCamera.pose,first.playerCloseCamera.pose);assert.notEqual(next.playerCloseCamera.geometryKey,first.playerCloseCamera.geometryKey);safe(next,first.playerCloseCamera.pose,tight);}
   else assert.deepEqual(cameraSnapshot(next),snapshot);
  }
 });
 test(`${kind}: world reset does not inherit a paused pose or reduced geometry scale`,()=>{
  const h=wrapper(kind);h.frame(tight);h.reset();h.world.player.x=1200;const next=h.frame();assert.equal(next.zoom,390*.68/328);assert.equal(next.playerFixedCamera.pose.x,1200);
 });
}
// A nonzero follow residual must survive every existing wrapper unchanged.
for(const kind of ['solver','fullStage','depthRoute','laterBattle','laterRoute'])for(const sign of [-1,1])test(`${kind}: nonzero ${sign} lag freezes, rebases, resumes and resets`,()=>{
 const h=wrapper(kind),first=h.frame();h.world.player.x+=sign*75;const lag=h.frame(),pose=copy(lag.playerFixedCamera.pose);
 const shown=f=>f.width/2+(f.playerFixedCamera.pose.x-f.x)*f.zoom;
 assert.ok(Math.abs(shown(lag)-lag.playerFixedCamera.anchor.x)>40,'start with real bounded-follow residual');
 h.world.player.x=1800;
 const frozen=h.frame({paused:true,camera:'classic',cameraMode:'classic',delta:60000,viewportEpoch:500,rotation:-90,...copy(geometry)});assert.deepEqual(frozen,lag,'no paused settling or banked delta');
 // Change the same-size safe area without changing the feasible target/zoom.
 const reflow={safeRect:{left:1,top:0,right:843,bottom:390},occlusions:[]},rebased=h.frame({paused:true,...reflow,delta:60000});
 assert.notEqual(rebased.playerFixedCamera.geometryKey,lag.playerFixedCamera.geometryKey);assert.equal(rebased.zoom,lag.zoom);assert.equal(rebased.x,lag.x);assert.deepEqual(rebased.playerFixedCamera.pose,pose);assert.equal(rebased.playerFixedCamera.follow.clamped,false);safe(rebased,pose,reflow);
 // Move the pocket: frozen rebase is the minimum necessary safety clamp,
 // never a rate step toward the target and never a chase of the live player.
 const shifted={safeRect:{left:sign<0?350:0,top:0,right:sign<0?844:494,bottom:390},occlusions:[]},moved=h.frame({paused:true,...shifted,delta:60000}),a=moved.playerFixedCamera.anchor,z=moved.zoom;
 assert.equal(z,lag.zoom);const beforeX=844/2+(pose.x-rebased.x)*z,expected=Math.max(a.x-80*z,Math.min(a.x+80*z,beforeX));assert.ok(Math.abs(shown(moved)-expected)<1e-7);assert.deepEqual(moved.playerFixedCamera.pose,pose);assert.equal(moved.playerFixedCamera.follow.clamped,true);safe(moved,pose,shifted);
 h.world.player.x=pose.x;const resumed=h.frame({...shifted,delta:1000/60});assert.ok(Math.abs(resumed.x-moved.x)*z<=8+1e-7);assert.equal(resumed.zoom,z);
 const resized=h.frame({paused:true,width:568,height:320,safeRect:{left:0,top:0,right:568,bottom:320},occlusions:[]});assert.ok(Math.abs(shown(resized)-resized.playerFixedCamera.anchor.x)<1e-7);
 const classic=h.frame({camera:'classic',cameraMode:'classic'});assert.equal(classic.playerFixedCamera,undefined);const stable=h.frame();assert.ok(Math.abs(shown(stable)-stable.playerFixedCamera.anchor.x)<1e-7);
 h.world.player.x+=sign*75;h.frame();h.reset();h.world.player.x=1200;const reset=h.frame();assert.equal(reset.playerFixedCamera.pose.x,1200);assert.ok(Math.abs(shown(reset)-reset.playerFixedCamera.anchor.x)<1e-7);assert.equal(reset.zoom,first.zoom);
});
// Execute the real game update and finish lifecycle. Stop at the renderer
// boundary after camera selection, without replacing the camera or timers.
async function mainFinish(camera='stable',{width=844,height=390,touch=true,measuredCameraSafety,lag=false}={}){
 const h=await gameHarness(),stop=new Error('camera selected'),part=()=>({setVisible(){}}),viewport={frame:{width,height,touch},camera,nativeLandscape:width>height};
 const scene={artTime:6000,textPool:[],scale:{width,height},time:{now:0},cameras:{main:{setViewport(){},setZoom(){},centerOn(){}}},combatOverlay:{cameraSafety:{safeRect:{left:0,top:0,right:width,bottom:height},occlusions:[],measuredCameraSafety},draw(){throw stop;}},arenaBackdrop:part(),backdropExtensions:[],boundaryGraphics:part(),ambient:part()};
 h.ui.setScene(scene);h.ui.setViewport(viewport);h.ui.startGame();while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}h.ui.duel.status='paused';
 const draw=delta=>{assert.throws(()=>h.ui.Arena.prototype.updateFrame.call(scene,0,delta),e=>e===stop);return scene.cameraView;};
 draw(0);if(lag){h.ui.duel.status='active';h.ui.duel.player.x+=75;draw(0);h.ui.duel.status='paused';}h.ui.duel.status='over';h.ui.duel.winner='player';h.ui.beginMatchFinish();return {h,scene,viewport,draw};
}
test('real root finish keeps the exact cached frame and sequence while animation time advances',async()=>{
 const {h,scene,viewport,draw}=await mainFinish(),finish=h.ui.matchFinish,first=finish.camera,snapshot=copy(first);assert.ok(first.playerFixedCamera);
 Object.assign(h.ui.duel.player,{x:1800,y:52,depth:-90});viewport.camera='classic';
 for(const delta of Array(40).fill(60)){assert.equal(draw(delta),first);assert.equal(h.ui.matchFinish,finish);assert.deepEqual(copy(finish.camera),snapshot);}assert.equal(finish.elapsed,2400);assert.equal(h.$('#match-finish').dataset.phase,'announce');assert.equal(h.timers.size,0);assert.equal(scene.artTime,6000);
});
test('real root finish only reprojects fixed geometry and never restarts sequence/timers or follows live actors',async()=>{
 const {h,scene,viewport,draw}=await mainFinish(),finish=h.ui.matchFinish,first=finish.camera,pose=copy(first.playerFixedCamera.pose);draw(80);
 Object.assign(h.ui.duel.player,{x:1800,y:52,depth:-90});viewport.camera='classic';scene.combatOverlay.cameraSafety=copy(tight);
 const changed=draw(40);assert.notEqual(changed,first);assert.notEqual(changed.playerFixedCamera.geometryKey,first.playerFixedCamera.geometryKey);assert.deepEqual(changed.playerFixedCamera.pose,pose);assert.equal(changed.challengeCameraMode,'stable');safe(changed,pose,tight);
 assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,120);assert.equal(h.timers.size,0);assert.equal(draw(20),changed);assert.equal(finish.elapsed,140);
 scene.scale={width:568,height:320};scene.combatOverlay.cameraSafety={safeRect:{left:0,top:0,right:568,bottom:320},occlusions:[]};
 const resized=draw(20);assert.deepEqual(resized.playerFixedCamera.pose,pose);assert.equal(resized.zoom,320*.68/328);assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,160);assert.equal(h.timers.size,0);
});
test('real root classic finish retains legacy same-size freeze even when measured geometry changes',async()=>{
 const {h,scene,draw}=await mainFinish('classic'),finish=h.ui.matchFinish,first=finish.camera;scene.combatOverlay.cameraSafety=copy(tight);h.ui.duel.player.x=2000;
 assert.equal(draw(30),first);assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,30);assert.equal(first.playerFixedCamera,undefined);
});

for(const kind of ['fullStage','depthRoute','laterBattle','laterRoute'])test(`${kind}: losing measured occlusions exits fixed framing instead of reusing an empty-blocker key`,()=>{
 const h=wrapper(kind);assert.ok(h.frame().playerFixedCamera);const next=h.frame({paused:true,occlusions:undefined});assert.equal(next.playerFixedCamera,undefined);
});
test('adapter world identity replacement resets a paused fixed pose without requiring explicit reset',()=>{
 const adapter=createMobileCameraAdapter(),world={player:{x:450,y:430,hp:100},enemy:{x:540,y:430,hp:100},status:'paused'},options={width:844,height:390,touch:true,camera:'stable',...tight},legacy={zoom:.3,left:0,base:275};
 const first=adapter.frame(legacy,world,options).cameraFrame;world.player.x=1200;assert.equal(adapter.frame(legacy,world,options).cameraFrame,first);
 const next=adapter.frame(legacy,{...world}, {...options,...geometry}).cameraFrame;assert.equal(next.playerFixedCamera.pose.x,1200);assert.equal(next.zoom,390*.68/328);
});
for(const options of [{width:390,height:844},{touch:false},{measuredCameraSafety:false}])test(`real root nonfixed stable finish keeps legacy geometry freeze ${JSON.stringify(options)}`,async()=>{
 const {h,scene,draw}=await mainFinish('stable',options),finish=h.ui.matchFinish,first=finish.camera;assert.equal(first.playerFixedCamera,undefined);
 scene.combatOverlay.cameraSafety={...tight,touch:true};h.ui.duel.player.x=2000;assert.equal(draw(30),first);assert.equal(h.ui.matchFinish,finish);assert.equal(finish.elapsed,30);
});

test('real root finish preserves nonzero lag across equivalent geometry and rebase',async()=>{
 const {h,scene,draw}=await mainFinish('stable',{lag:true}),finish=h.ui.matchFinish,first=finish.camera;
 const shown=f=>f.width/2+(f.playerFixedCamera.pose.x-f.x)*f.zoom;
 assert.ok(Math.abs(shown(first)-first.playerFixedCamera.anchor.x)>40);
 for(let i=0;i<20;i++)assert.equal(draw(50),first);
 scene.combatOverlay.cameraSafety={safeRect:{left:1,top:0,right:843,bottom:390},occlusions:[]};
 const rebase=draw(40);assert.equal(rebase.x,first.x);assert.equal(rebase.zoom,first.zoom);assert.deepEqual(rebase.playerFixedCamera.pose,first.playerFixedCamera.pose);assert.equal(h.ui.matchFinish,finish);assert.equal(h.timers.size,0);assert.equal(finish.elapsed,1040);assert.equal(draw(20),rebase);
});

test('adapter replacement world discards a nonzero lag while paused',()=>{
 const adapter=createMobileCameraAdapter(),world={player:{x:450,y:430,hp:100},enemy:{x:540,y:430,hp:100},status:'active'},options={width:844,height:390,touch:true,camera:'stable',...geometry},legacy={zoom:.3,left:0,base:275};
 adapter.frame(legacy,world,options);world.player.x+=75;const lag=adapter.frame(legacy,world,options).cameraFrame;assert.ok(Math.abs(lag.x-world.player.x)>50);world.status='paused';assert.equal(adapter.frame(legacy,world,options).cameraFrame,lag);
 const next=adapter.frame(legacy,{...world},options).cameraFrame;assert.equal(next.x,world.player.x);assert.equal(next.playerFixedCamera.follow.clamped,false);
});
test('real root new duel discards cached nonzero lag and finished pose',async()=>{
 const {h,scene,draw}=await mainFinish('stable',{lag:true}),oldWorld=h.ui.duel,old=scene.cameraView;
 assert.ok(Math.abs(old.x-old.playerFixedCamera.pose.x)>50);
 await h.ui.startGame();while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}h.ui.duel.status='paused';h.ui.duel.player.x=1200;
 const next=draw(0);assert.notEqual(h.ui.duel,oldWorld);assert.equal(h.ui.matchFinish,null);assert.equal(next.playerFixedCamera.pose.x,1200);assert.equal(next.x,1200);assert.equal(next.playerFixedCamera.follow.clamped,false);
});
