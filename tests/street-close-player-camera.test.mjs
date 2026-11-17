import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as candidate from '../dist/challenge-camera.mjs';
import {depthRouteCameraFrame as depth} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter as adapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {offscreenOpponentHints as hints} from '../dist/camera-direction-hints.mjs';
import {streetTrialFrame} from '../dist/preview/chapter2/street-trial-view.mjs';
const measured=JSON.parse(fs.readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const small=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles;
const preservation=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-preservation-v68.json',import.meta.url)));
const snapshot=f=>Object.fromEntries(preservation.snapshotKeys.filter(k=>f[k]!==undefined).map(k=>[k,f[k]]));
const actor=(x=436,y=430,depth=0)=>({x,y,depth,vy:0,hp:100,supportY:430});
const world=()=>{const p=actor(),e=actor(524);return{player:p,enemy:e,enemies:[e],assists:[],section:{spawns:[]},spawned:new Set(),worldWidth:3600,status:'active'};};
const profiles=[['portrait',390,844,0,measured['portrait-street'].cameraSafety],['native',844,390,0,measured['native-street'].cameraSafety],['plus90',844,390,90,measured['rotated-street'].cameraSafety],['minus90',844,390,-90,measured['rotated-street'].cameraSafety],['small',568,320,0,small['native568-street']]];
const options=(profile,mode)=>{const[,width,height,rotation,g]=profile;return{...g,width,height,rotation,touch:true,portrait:width<height,fullStage:true,route:true,camera:mode,cameraMode:mode,nativeLandscape:rotation===0,landscapePreview:rotation===0,delta:1000/60};};
const project=(f,p)=>{const x=f.width/2+(p.x-f.x)*f.zoom,y=f.height/2+(p.y+p.depth*.65-f.y)*f.zoom;return{left:x-132*f.zoom,right:x+132*f.zoom,top:y-300*f.zoom,bottom:y+28*f.zoom};};
const overlap=(a,b)=>a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6;
function safe(f,p,g){assert.equal(f.cameraSafetyFit,true);const b=project(f,p),r=g.safeRect;assert.ok(b.left>=r.left-1e-6&&b.right<=r.right+1e-6&&b.top>=r.top-1e-6&&b.bottom<=r.bottom+1e-6,'entire current player stays inside content');for(const o of g.occlusions){const padded={left:Math.max(r.left,o.left-6),right:Math.min(r.right,o.right+6),top:Math.max(r.top,o.top-6),bottom:Math.min(r.bottom,o.bottom+6)};if(padded.left>=padded.right||padded.top>=padded.bottom)continue;assert.equal(overlap(f.controlOverlay==='soft'&&o.kind==='control'?{...b,bottom:b.bottom-168*f.zoom}:b,padded),false,'HUD/body and control protection');}}
for(const p of profiles)for(const mode of ['classic','stable']){
 if(p[0]!=='portrait'&&mode==='stable')continue;
 test(`${p[0]} ${mode}: player scale cannot collapse for mobs, forecasts, assists or jumps; four shared chapter entries agree`,()=>{
  const w=world(),o=options(p,mode),ads=[adapter(),adapter(),adapter()];let prev=null,first;
  const stable={zoom:preservation.landscapeStableZoom[p[0]]};
  for(let i=0;i<25;i++){
   Object.assign(w.player,{x:436+i*31,y:430-377*Math.max(0,Math.sin(i/5)),depth:i%2?-90:100,vy:-720,assist:{helper:'han',charge:i*20}});
   w.enemies=[actor(w.player.x-520),actor(w.player.x+520,-300),actor(w.player.x+5000)];w.enemy=w.enemies[0];w.assists=[{phase:'attack',actor:actor(w.player.x-65,-300)}];w.section.spawns=[['street',w.player.x+490,w.player.x+10]];
   const f=depth(o.width,o.height,w,{...o,previous:prev});assert.ok(f.playerCloseCamera,'street-only close state is present');safe(f,w.player,o);
   if(o.portrait)assert.ok(f.zoom>=.75&&f.zoom<=.85,'portrait body scale is near 0.78 (390/500), not mob-fit');else assert.ok(f.zoom>=stable.zoom*.9-1e-9&&f.zoom<=stable.zoom+1e-9,'dynamic pullback stays within 10% of approved stable geometry');
   if(first)assert.equal(f.zoom,first.zoom,'actors never select scale');else first=f;
   for(const ad of ads){const legacy=streetTrialFrame({width:o.width,height:o.height,portrait:o.portrait,player:w.player,worldWidth:w.worldWidth}),later=ad.frame(legacy,w,o).cameraFrame;for(const key of ['x','y','zoom','backdropZoom','backdropTop','backdropBottom'])assert.equal(later[key],f[key],`all chapter entries share ${key}`);assert.deepEqual(later.playerCloseCamera,f.playerCloseCamera);}
   assert.equal(f.backdropTop,f.y-f.height/(2*f.zoom),'only own viewport top, no legacy far envelope');assert.equal(f.backdropBottom,f.y+f.height/(2*f.zoom));assert.ok(f.backdropZoom>=f.zoom);
   prev=f;
  }
 });
 test(`${p[0]} ${mode}: pause freezes pose and mode, geometry rebase is safe, resume takes selected mode`,()=>{
  const w=world(),o=options(p,mode);const f=depth(o.width,o.height,w,o);w.player.x+=75;const lag=depth(o.width,o.height,w,{...o,previous:f});Object.assign(w.player,{x:1800,y:20,depth:-90});
  const selected=mode==='stable'?'classic':'stable',frozen=depth(o.width,o.height,w,{...o,previous:lag,paused:true,camera:selected,cameraMode:selected});assert.deepEqual(frozen,lag);
  const reflow={...o,safeRect:{...o.safeRect,left:o.safeRect.left+1,right:o.safeRect.right-1}};
  const rebased=depth(o.width,o.height,w,{...reflow,previous:lag,paused:true,camera:selected,cameraMode:selected});assert.equal(rebased.challengeCameraMode,mode);assert.deepEqual(rebased.playerCloseCamera.pose,lag.playerCloseCamera.pose);assert.equal(rebased.zoom,lag.zoom);safe(rebased,{x:lag.playerCloseCamera.pose.x,y:lag.playerCloseCamera.pose.displayY,depth:0},reflow);
  const resumed=depth(o.width,o.height,w,{...reflow,previous:rebased,camera:selected,cameraMode:selected});assert.equal(resumed.challengeCameraMode,selected);safe(resumed,w.player,reflow);
 });
}
test('invalid or completely blocked geometry cannot silently produce microscopic safe cameras',()=>{for(const p of [profiles[0],profiles[1]])for(const g of [{safeRect:{left:400,right:100,top:0,bottom:390},occlusions:[]},{safeRect:{left:0,right:p[1],top:0,bottom:p[2]},occlusions:[{left:-20,right:p[1]+20,top:-20,bottom:p[2]+20,kind:'hud'}]}]){const o={...options(p,'classic'),...g},f=candidate.streetPlayerCameraFrame(o.width,o.height,world(),o);assert.equal(f.cameraSafetyFit,false);assert.equal(f.cameraBlocked,true);assert.equal(f.zoom,undefined);assert.equal(f.x,undefined);assert.equal(f.y,undefined);assert.ok(f.cameraGeometry);}});
test('hints work for new profiles without letting other actors size the camera',()=>{for(const p of [profiles[0],profiles[1]]){const w=world(),o=options(p,'classic');w.enemies=[actor(w.player.x-520,-100),actor(w.player.x+520,-100)];const f=depth(o.width,o.height,w,o);const result=hints(f,w,{route:true,geometry:{...o}});assert.equal(result.length,2);for(const h of result)assert.equal(overlap({left:h.left,right:h.left+h.width,top:h.top,bottom:h.top+h.height},project(f,w.player)),false);}});
test('paused stable landscape rotates into portrait using its saved pose, not the changed live actor',()=>{
 const w=world(),land=options(profiles[1],'stable'),portrait=options(profiles[0],'classic');const first=depth(land.width,land.height,w,land),saved=first.playerFixedCamera.pose;Object.assign(w.player,{x:2000,y:-200,depth:90});
 const turned=depth(portrait.width,portrait.height,w,{...portrait,previous:first,paused:true});assert.ok(turned.playerCloseCamera);assert.equal(turned.challengeCameraMode,'stable');assert.deepEqual(turned.playerCloseCamera.pose,saved);safe(turned,{x:saved.x,y:saved.displayY,depth:0},portrait);
});
test('paused stable portrait rotates into approved stable landscape preserving saved pose',()=>{
 const w=world(),portrait=options(profiles[0],'stable'),land=options(profiles[1],'classic');const first=depth(portrait.width,portrait.height,w,portrait),saved=first.playerCloseCamera.pose;Object.assign(w.player,{x:2000,y:-200,depth:90});
 const turned=depth(land.width,land.height,w,{...land,previous:first,paused:true});assert.ok(turned.playerFixedCamera);assert.equal(turned.challengeCameraMode,'stable');assert.deepEqual(turned.playerFixedCamera.pose,saved);safe(turned,{x:saved.x,y:saved.displayY,depth:0},land);
});
test('logical equivalent rotations and rebuilt geometry do not create a camera epoch or change scale',()=>{
 const w=world(),o=options(profiles[1],'classic'),first=depth(o.width,o.height,w,o);for(const rotation of [90,-90,0]){const f=depth(o.width,o.height,w,{...structuredClone(o),rotation,viewportEpoch:99,occlusions:[...o.occlusions].reverse(),previous:first});assert.deepEqual(f.playerCloseCamera,first.playerCloseCamera);}
});
test('close route reads no enemy, spawn, assist, velocity, support or predictive sizing input',()=>{
 const w=world(),o=options(profiles[0],'classic'),fail=()=>{throw Error('forbidden non-player sizing read');};for(const key of ['enemy','enemies','section','assists','spawned'])Object.defineProperty(w,key,{get:fail});for(const key of ['assist','vy','supportY'])Object.defineProperty(w.player,key,{get:fail});const f=depth(o.width,o.height,w,o);assert.ok(f.playerCloseCamera);assert.equal(f.zoom,390/500);
});
test('bounded classic follow settles and teleports use mandatory safety translation without scale change',()=>{
 const w=world(),o=options(profiles[1],'classic'),first=depth(o.width,o.height,w,o);w.player.x+=75;const next=depth(o.width,o.height,w,{...o,previous:first});assert.ok(Math.abs((next.x-first.x)*next.zoom-6)<1e-8);assert.equal(next.zoom,first.zoom);assert.equal(next.playerCloseCamera.follow.clamped,false);
 w.player.x+=2000;const teleported=depth(o.width,o.height,w,{...o,previous:next});assert.equal(teleported.zoom,first.zoom);assert.equal(teleported.playerCloseCamera.follow.clamped,true);safe(teleported,w.player,o);
});
test('phone predicate stops at600 portrait and500 landscape; no touch or no measured geometry stays legacy',()=>{
 for(const[width,height,touch,measured,want]of[[600,900,true,true,true],[601,900,true,true,false],[844,500,true,true,true],[844,501,true,true,false],[390,844,false,true,false],[390,844,true,false,false]]){const w=world(),o={width,height,touch,fullStage:true,route:true,camera:'classic',safeRect:{left:0,right:width,top:0,bottom:height},...(measured?{occlusions:[]}:{})},f=depth(width,height,w,o);assert.equal(!!f.playerCloseCamera,want);}
});
test('exiting close phone profile does not leak previous camera or backdrop reserve into desktop',()=>{
 const w=world(),o=options(profiles[0],'classic'),ad=adapter(),legacy={left:0,base:500,zoom:.7};const first=depth(o.width,o.height,w,o);ad.frame(legacy,w,o);const desktop={...o,width:1280,height:720,touch:false,portrait:false,safeRect:{left:0,right:1280,top:0,bottom:720},occlusions:[]};
 assert.deepEqual(snapshot(depth(1280,720,w,{...desktop,previous:first})),preservation.exitToDesktop.main);assert.deepEqual(snapshot(ad.frame(legacy,w,desktop).cameraFrame),preservation.exitToDesktop.later);
});

const recorded320=JSON.parse(fs.readFileSync(new URL('./fixtures/street-close-portrait320-geometry.json',import.meta.url)));
for(const mode of ['classic','stable'])test(`recorded320 portrait ${mode} uses the available single-player pocket without following mob separation`,()=>{const w=world(),o={...recorded320.cameraSafety,width:320,height:568,touch:true,portrait:true,fullStage:true,route:true,camera:mode,cameraMode:mode};let previous=null;for(let i=0;i<20;i++){w.player.x+=20;w.player.y=430-i*15;w.enemy.x=2000;const f=depth(320,568,w,{...o,previous});safe(f,w.player,o);assert.ok(Math.abs(f.zoom-320/500)<1e-8);assert.ok(f.zoom>.6325878594);assert.equal(f.playerCloseCamera.referenceZoom,f.zoom);previous=f;}});
test('extremely unusable small safe geometry is blocked instead of rendered at near-zero or unsafe scale',()=>{const w=world(),o={...options(profiles[0],'classic'),safeRect:{left:170,right:220,top:200,bottom:230},occlusions:[]},f=candidate.streetPlayerCameraFrame(o.width,o.height,w,o);assert.equal(f.cameraBlocked,true);assert.equal(f.zoom,undefined);assert.throws(()=>adapter().frame({left:0,base:500,zoom:.7},w,o),e=>e.code==='STREET_CAMERA_BLOCKED');});
// Derived reflows preserve the recorded320 rectangles except the stated safe
// insets/status extent. They are synthetic stress cases, not new DOM captures.
for(const [statusBottom,want,blocked]of[[200,172/328,false],[250,122/328,false],[300,null,true]])test(`recorded320 geometry with status ending${statusBottom} reports the actual available pocket`,()=>{
 const w=world(),g=recorded320.cameraSafety,occlusions=g.occlusions.map(r=>r.kind==='hud'&&r.top===140?{...r,bottom:statusBottom,height:statusBottom-r.top}:r),o={...g,occlusions,touch:true,portrait:true,fullStage:true,camera:'classic',route:true},f=candidate.streetPlayerCameraFrame(320,568,w,o);assert.equal(!!f.cameraBlocked,blocked);if(blocked)assert.equal(f.zoom,undefined);else{safe(f,w.player,o);assert.ok(Math.abs(f.zoom-want)<1e-8);}
});
test('recorded320 safe-area reflows either fit the actual player or explicitly block; no unsafe projection escapes',()=>{
 const w=world(),g=recorded320.cameraSafety;for(const [safeRect,blocked]of[[{left:0,right:320,top:24,bottom:548},false],[{left:84,right:236,top:180,bottom:400},false],[{left:120,right:200,top:180,bottom:400},true]]){const o={...g,safeRect,touch:true,portrait:true,fullStage:true,camera:'stable',route:true},f=candidate.streetPlayerCameraFrame(320,568,w,o);assert.equal(!!f.cameraBlocked,blocked);if(blocked){assert.equal(f.zoom,undefined);assert.equal(f.x,undefined);}else safe(f,w.player,o);}
});
test('both street entry points throw only the shared typed blocked case before consumers can read projection',()=>{
 const w=world(),o={...options(profiles[0],'classic'),safeRect:{left:170,right:220,top:200,bottom:230},occlusions:[]};for(const call of[()=>depth(o.width,o.height,w,o),()=>adapter().frame({left:0,base:500,zoom:.7},w,o)])assert.throws(call,error=>error.code==='STREET_CAMERA_BLOCKED'&&error.reason==='NO_READABLE_PLAYER_POCKET'&&error.geometry.minimumBodyPixels===96);
 assert.equal(typeof candidate.requireStreetCameraFrame,'function');const legacy={cameraSafetyFit:false,x:0,y:0,zoom:.5};assert.equal(candidate.requireStreetCameraFrame(legacy),legacy,'legacy diagnostics are not newly thrown');assert.equal(candidate.requireStreetCameraFrame(null),null);
});
