import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as camera from '../dist/challenge-camera.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const measured=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const small=JSON.parse(readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles;
const pose=(x=450,y=430,depth=0,vy=0)=>({x,y,depth,vy,hp:100,supportY:430});
const preferred=(width=844,height=390)=>({width,height,x:480,y:300,zoom:.3});
const overlap=(a,b)=>a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6;
function safe(frame,p,g){
 assert.equal(frame.cameraSafetyFit,true);
 const x=frame.width/2+(p.x-frame.x)*frame.zoom,y=frame.height/2+(p.y+(Number.isFinite(p.depth)?p.depth:0)*.65-frame.y)*frame.zoom;
 const r={left:x-132*frame.zoom,right:x+132*frame.zoom,top:y-300*frame.zoom,bottom:y+28*frame.zoom};
 const rect=g.safeRect||{left:0,top:0,right:frame.width,bottom:frame.height},padding=g.occlusionPadding??6;
 assert.ok(r.left>=rect.left-1e-6&&r.right<=rect.right+1e-6&&r.top>=rect.top-1e-6&&r.bottom<=rect.bottom+1e-6,'canonical full player body fits safe content');
 for(const o of g.occlusions||[]){const padded={left:Math.max(rect.left,o.left-padding),right:Math.min(rect.right,o.right+padding),top:Math.max(rect.top,o.top-padding),bottom:Math.min(rect.bottom,o.bottom+padding)};if(padded.left>=padded.right||padded.top>=padded.bottom)continue;assert.equal(overlap(o.kind==='control'?{...r,bottom:y-140*frame.zoom}:r,padded),false,'player avoids padded HUD and standing head/collar avoids soft controls');}
}
function fixed(frame){assert.ok(frame.playerFixedCamera,'measured compact mobile stable frame has a fixed player state');assert.equal(frame.playerFixedCamera.version,2);assert.equal(frame.playerFixedCamera.zoom,frame.zoom);assert.equal(frame.challengeCameraMode,'stable');assert.equal(frame.controlOverlay,'soft');}
function fit(p=pose(),previous=null,g={},dims=preferred(),extra={}){return camera.fitChallengeCamera(dims,[p,pose(940)],previous,1000/60,{touch:true,cameraMode:'stable',...g,...extra});}
const profiles=[];
for(const scene of ['vs','street']){
 for(const rotation of [0,90,-90])profiles.push({name:`${scene}-${rotation}`,scene,rotation,width:844,height:390,geometry:measured[(rotation===0?'native':'rotated')+'-'+scene].cameraSafety});
 profiles.push({name:`${scene}-568`,scene,rotation:0,width:568,height:320,geometry:small['native568-'+scene]});
}
// Catches enemy/forecast-driven zoom or anchor changes, prediction-driven jump shrinkage,
// and differences between the main entry and later chapter adapter.
for(const profile of profiles)test(`fixed player scale survives poses and encounter transitions ${profile.name}`,()=>{
 const {width,height,rotation,geometry:g,scene}=profile,route=scene==='street',p=pose(),e=pose(510),world={player:p,enemy:e,enemies:[e],assists:[],section:{spawns:[]},spawned:new Set(),worldWidth:3600,status:'active'},adapter=createMobileCameraAdapter();
 const o={...g,width,height,rotation,touch:true,portrait:false,nativeLandscape:rotation===0,landscapePreview:rotation===0,camera:'stable',cameraMode:'stable',route,fullStage:true,delta:1000/60};let previous=null,first;
 const states=[{},{x:525},{x:375},{enemyX:940},{enemyX:-40},{enemyX:4000},{y:54,vy:-720},{y:169,depth:-65,vy:-240,supportY:342},{y:-82,depth:90,vy:360},{action:'roll',y:430,depth:-90},{hp:0},{spawn:true},{phase:'warning'},{phase:'attack'},{phase:'exit'},{x:1800,y:54,depth:90,vy:0}];
 for(const [i,s]of states.entries()){
  Object.assign(p,pose(s.x??450,s.y??430,s.depth??0,s.vy??0),{supportY:s.supportY??430,action:s.action??'idle',assist:{helper:'han',charge:i*10}});Object.assign(e,pose(s.enemyX??940),{hp:s.hp??100});
  world.section.spawns=s.spawn?[['street',p.x+490,p.x+10]]:[];world.assists=s.phase?[{phase:s.phase,actor:pose(p.x-65,p.y,p.depth)}]:[];
  const f=route?depthRouteCameraFrame(width,height,world,{...o,previous}):fullStageCameraFrame(fixedStableCameraFrame,width,height,[p,e],previous,o.delta,{...o,assists:world.assists});
  const later=adapter.frame({zoom:.3,left:0,base:height-115},world,o).cameraFrame;
  fixed(f);fixed(later);safe(f,p,g);safe(later,p,g);
  if(!first)first=f;
  assert.equal(f.zoom,first.zoom,`exact scale at state ${i}`);assert.deepEqual(f.playerFixedCamera.anchor,first.playerFixedCamera.anchor);
  assert.deepEqual(f.playerFixedCamera.pose,{x:p.x,displayY:p.y+p.depth*.65});
  for(const key of ['x','y','zoom'])assert.equal(later[key],f[key],`main/later ${key} at state ${i}`);
  assert.deepEqual(later.playerFixedCamera,f.playerFixedCamera);
  if(previous&&i===states.length-1){assert.ok(Math.abs(f.x-previous.x)>1000,'beyond-reserve teleport is followed by mandatory safety translation, never a zoom fallback');assert.equal(f.y-previous.y,(p.y+p.depth*.65)-previous.playerFixedCamera.pose.displayY);assert.equal(f.playerFixedCamera.follow.clamped,true);}
  if('base'in f){assert.equal(f.base,height/2+(430-f.y)*f.zoom);assert.equal(f.jumpPan,0);assert.ok(f.backdropTop<=f.y-height/(2*f.zoom));assert.ok(f.backdropBottom>=f.y+height/(2*f.zoom));}
  previous=f;
 }
});
test('logical native and both side rotations are equivalent for identical measured rectangles',()=>{
 const g=measured['native-vs'].cameraSafety;
 const frames=[0,90,-90].map(rotation=>fit(pose(),null,g,preferred(),{rotation,nativeLandscape:rotation===0}));
 for(const frame of frames){fixed(frame);assert.deepEqual(frame.playerFixedCamera,frames[0].playerFixedCamera);assert.equal(frame.x,frames[0].x);assert.equal(frame.y,frames[0].y);}
});
test('fixed branch does not read enemy, plan, predictions, support height or helper state',()=>{
 const p=pose(),forbidden=()=>{throw Error('fixed branch read a non-player sizing input');};
 for(const key of ['vy','supportY','assist'])Object.defineProperty(p,key,{get:forbidden});
 const options={touch:true,cameraMode:'stable',occlusions:[]};Object.defineProperty(options,'cameraPlan',{get:forbidden});
 const f=camera.fitChallengeCamera(preferred(),[p,new Proxy({},{get:forbidden})],null,16.7,options);fixed(f);safe(f,p,options);
});
test('natural player motion has only the corresponding translation, while canonical scale and anchor stay exact',()=>{
 const g=measured['native-street'].cameraSafety,p=pose();let f=fit(p,null,g),first=f;fixed(f);
 for(let i=0;i<120;i++){p.x+=2;p.y-=1;p.depth+=.5;const next=fit(p,f,g);assert.equal(next.zoom,first.zoom);assert.deepEqual(next.playerFixedCamera.anchor,first.playerFixedCamera.anchor);assert.ok(Math.abs(next.x-f.x-2)<1e-10);assert.ok(Math.abs(next.y-f.y+.675)<1e-10);assert.ok(Math.hypot(next.x-f.x,next.y-f.y)*next.zoom<2);safe(next,p,g);f=next;}
});
test('profile excludes classic, desktop, portrait, tall touch and explicitly unmeasured safety',()=>{
 assert.equal(typeof camera.isPlayerFixedCameraProfile,'function');
 for(const [w,h,o,want]of [[844,390,{touch:true,camera:'stable'},true],[844,500,{touch:true,cameraMode:'stable'},true],[844,390,{touch:true,camera:'classic'},false],[844,390,{touch:false,camera:'stable'},false],[844,390,{camera:'stable'},false],[390,844,{touch:true,camera:'stable'},false],[844,501,{touch:true,camera:'stable'},false],[844,0,{touch:true,camera:'stable'},false],[844,390,{touch:true,camera:'stable',measuredCameraSafety:false},false]])assert.equal(camera.isPlayerFixedCameraProfile(w,h,o),want);
});
test('equivalent geometry identities and occlusion order keep the exact epoch and fixed state',()=>{
 assert.equal(typeof camera.playerFixedGeometryKey,'function');
 const g=structuredClone(measured['native-vs'].cameraSafety),p=pose(),f=fit(p,null,g);fixed(f);
 const rebuilt={...structuredClone(g),occlusions:[...g.occlusions].reverse().map((o,i)=>({...o,label:'changed '+i,hp:i,style:{width:i+'%'}})),hudBottom:900,viewportEpoch:888,assist:{helper:'ko'}};
 const next=fit(p,f,rebuilt);assert.equal(camera.playerFixedGeometryKey(844,390,{...g,touch:true}),camera.playerFixedGeometryKey(844,390,{...rebuilt,touch:true}));assert.equal(next.playerFixedCamera.geometryKey,f.playerFixedCamera.geometryKey);assert.equal(next.zoom,f.zoom);assert.deepEqual(next.playerFixedCamera.anchor,f.playerFixedCamera.anchor);
 const tiny={...g,safeRect:{...g.safeRect,left:g.safeRect.left+1e-8}};assert.notEqual(camera.playerFixedGeometryKey(844,390,g),camera.playerFixedGeometryKey(844,390,tiny),'real subpixel bounds cannot be rounded away');
 const hard={...g,occlusions:g.occlusions.map(o=>({...o,kind:'hud'}))};assert.notEqual(camera.playerFixedGeometryKey(844,390,g),camera.playerFixedGeometryKey(844,390,hard),'soft-control policy is part of geometry');
});
test('same-size HUD reflow preserves a feasible old zoom but moves to a safe anchor',()=>{
 const g={safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[]},p=pose(),f=fit(p,null,g);fixed(f);
 const changed={...g,occlusions:[{kind:'hud',left:370,right:474,top:80,bottom:220}]};
 const next=fit(p,f,changed);fixed(next);assert.equal(next.zoom,f.zoom);assert.notEqual(next.playerFixedCamera.geometryKey,f.playerFixedCamera.geometryKey);assert.notDeepEqual(next.playerFixedCamera.anchor,f.playerFixedCamera.anchor);safe(next,p,changed);
});
test('less available room selects a smaller fixed zoom once and keeps it when same-size room opens',()=>{
 const p=pose(),g={safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[]},first=fit(p,null,g),smallG={...g,safeRect:{left:250,top:200,right:410,bottom:310}};
 const smaller=fit(p,first,smallG);fixed(smaller);assert.ok(smaller.zoom<first.zoom);safe(smaller,p,smallG);
 const repeated=fit(p,smaller,structuredClone(smallG));assert.equal(repeated.zoom,smaller.zoom);assert.deepEqual(repeated.playerFixedCamera.anchor,smaller.playerFixedCamera.anchor);
 const opened=fit(p,smaller,g);assert.equal(opened.zoom,smaller.zoom);safe(opened,p,g);
 const resized=fit(p,smaller,{occlusions:[]},preferred(568,320));assert.ok(resized.zoom>smaller.zoom);assert.equal(resized.zoom,Math.min(1.4,568/440,320*.68/328));
});
test('profile changes reinitialize fixed state and enforce a new dimension upper bound',()=>{
 const p=pose(),g={occlusions:[]},f=fit(p,null,g),classic=fit(p,f,g,preferred(),{cameraMode:'classic'});assert.equal(classic.playerFixedCamera,undefined);
 const restored=fit(p,classic,g);fixed(restored);assert.equal(restored.zoom,Math.min(1.4,844/440,390*.68/328));
 const resized=fit(p,f,g,preferred(568,100));assert.equal(resized.zoom,Math.min(1.4,568/440,100*.68/328));safe(resized,p,g);
});
test('reuse validates existing fixed geometry without applying a newly selected paused camera mode',()=>{
 assert.equal(typeof camera.canReuseCameraFrame,'function');
 const g=measured['native-vs'].cameraSafety,o={...g,touch:true,cameraMode:'stable'},f=fit(pose(),null,g);
 assert.equal(camera.canReuseCameraFrame(null,844,390,o),false);assert.equal(camera.canReuseCameraFrame(f,568,320,o),false);
 assert.equal(camera.canReuseCameraFrame(f,844,390,{...o,cameraMode:'classic'}),true);
 assert.equal(camera.canReuseCameraFrame(f,844,390,{...o,touch:false}),false);assert.equal(camera.canReuseCameraFrame(f,844,390,{...o,measuredCameraSafety:false}),false);
 assert.equal(camera.canReuseCameraFrame(f,844,390,{...o,safeRect:{...g.safeRect,top:g.safeRect.top+1}}),false);
 assert.equal(camera.canReuseCameraFrame({width:844,height:390},844,390,{...o,touch:false}),true);
});
test('invalid or completely blocked finite geometry never claims a successful safety fit',()=>{
 for(const g of [{safeRect:{left:400,right:100,top:0,bottom:390},occlusions:[]},{safeRect:{left:100,right:100,top:0,bottom:390},occlusions:[]},{safeRect:{left:0,right:844,top:200,bottom:100},occlusions:[]},{safeRect:{left:0,right:844,top:0,bottom:390},occlusions:[{kind:'hud',left:-10,right:854,top:-10,bottom:400}]}]){const f=fit(pose(),null,g);assert.equal(f.cameraSafetyFit,false);assert.equal(f.playerFixedCamera,undefined);}
});
test('reordering overlapping rectangular unions cannot create a geometry epoch',()=>{
 const p=pose(),rectangles=[{left:0,right:100,top:0,bottom:100},{left:50,right:150,top:0,bottom:100},{left:50,right:150,top:50,bottom:150}],g={occlusions:rectangles,occlusionPadding:0};
 const first=fit(p,null,g);fixed(first);
 for(const indices of [[2,1,0],[1,0,2],[1,2,0],[0,2,1],[2,0,1]]){
  const reordered={...g,occlusions:indices.map(i=>({...rectangles[i]}))};
  assert.equal(camera.playerFixedGeometryKey(844,390,reordered),first.playerFixedCamera.geometryKey,'same rectangles must normalize in a deterministic order before rectangular unions merge');
  const next=fit(p,first,reordered);assert.equal(next.zoom,first.zoom);assert.deepEqual(next.playerFixedCamera.anchor,first.playerFixedCamera.anchor);
 }
});
test('fixed base frames reserve canonical maximum backdrop density even in a smaller safe pocket',()=>{
 const p=pose(),g=small['native568-street'],dims={...preferred(568,320),base:205};
 const f=fit(p,null,g,dims);fixed(f);assert.equal(f.zoom,0.5437500001817215,'recorded pocket constrains the actor below its maximum preference');
 assert.equal(f.backdropZoom,0.6634146341463415,'retain maximum mobile street density without consulting the encounter plan');
 let previous=f;
 for(let i=0;i<120;i++){p.x+=2;p.y=430-250*Math.sin(i/30);const next=fit(p,previous,g,dims);assert.equal(next.zoom,0.5437500001817215);assert.equal(next.backdropZoom,0.6634146341463415,'ordinary follow cannot vary the reserve');assert.equal(next.base,160+(430-next.y)*next.zoom);assert.equal(next.jumpPan,0);assert.ok(next.backdropTop<=next.y-160/next.zoom&&next.backdropBottom>=next.y+160/next.zoom);previous=next;}
 const higher=fit(p,null,g,{...dims,backdropZoom:1.1});assert.equal(higher.backdropZoom,1.1,'never lower an existing scene density reserve');
});
