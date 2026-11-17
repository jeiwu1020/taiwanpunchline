import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as layout from '../dist/challenge-layout.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {fitChallengeCamera,challengeActorBounds,challengeCameraPlan} from '../dist/challenge-camera.mjs';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const actor=(x,y=430,depth=0)=>({x,y,depth,hp:100,vy:0});
const project=(f,b)=>({left:f.width/2+(b.left-f.x)*f.zoom,right:f.width/2+(b.right-f.x)*f.zoom,top:f.height/2+(b.top-f.y)*f.zoom,bottom:f.height/2+(b.bottom-f.y)*f.zoom});
const overlaps=(a,b)=>a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6;
function assertSafety(f,actors,g,close=false){assert.equal(f.cameraSafetyFit,true);assert.equal(!!f.playerCloseCamera,close,'only expected phone street owns close framing');if(close)assert.deepEqual(f.playerCloseCamera.pose,{x:actors[0].x,displayY:actors[0].y+(actors[0].depth||0)*.65},'close pose is the actual controlled player');for(const a of close||f.playerFixedCamera?actors.slice(0,1):actors){const box=challengeActorBounds(a,{prediction:0,halfWidth:close||f.controlOverlay==='soft'?132:130}),r=project(f,box),upper=project(f,{...box,bottom:box.bottom-168});assert.ok(r.left>=g.safeRect.left-1e-5&&r.right<=g.safeRect.right+1e-5&&r.top>=g.safeRect.top-1e-5&&r.bottom<=g.safeRect.bottom+1e-5,'complete body proxy remains on screen');for(const o of g.occlusions)assert.equal(overlaps(o.kind==='control'&&f.controlOverlay==='soft'?upper:r,o),false,`standing head/collar proxy avoids controls; full body proxy avoids ${o.kind}`);}}


// A close player camera follows height exactly. Horizontal movement is bounded
// unless the current player needs the minimum translation back into reserved travel.
function closeMotion(next,previous){
 const now=next.playerCloseCamera,before=previous.playerCloseCamera;assert.ok(now&&before);
 assert.equal(next.zoom,previous.zoom,'actors cannot change close scale');assert.deepEqual(now.anchor,before.anchor);
 assert.ok(Math.abs((next.y-previous.y)-(now.pose.displayY-before.pose.displayY))<1e-8,'no unrelated vertical camera motion');
 const reserve=next.width<next.height?32:80,left=before.anchor.x-reserve*next.zoom,right=before.anchor.x+reserve*next.zoom,oldScreen=next.width/2+(now.pose.x-previous.x)*next.zoom,needed=Math.max(left-oldScreen,oldScreen-right,0),budget=next.challengeCameraMode==='classic'?6:8;
 assert.ok(Math.abs(next.x-previous.x)*next.zoom<=Math.max(budget,needed)+1e-7,'horizontal motion is bounded or the minimum necessary player-safety translation');
 const shown=next.width/2+(now.pose.x-next.x)*next.zoom;assert.ok(shown>=left-1e-7&&shown<=right+1e-7,'player remains in reserved travel');
}

test('one short touch logical-landscape predicate drives soft controls including both rotations',()=>{
 assert.equal(typeof layout.isMobileLandscapePresentation,'function');
 const doc=new JSDOM('<main></main>').window.document,host=doc.querySelector('main');
 for(const [width,height,touch,expected] of [[844,390,true,true],[568,320,true,true],[844,500,true,true],[844,501,true,false],[390,844,true,false],[500,500,true,false],[844,390,false,false],[844,390,undefined,false],[844,0,true,false]])for(const rotation of [0,90,-90]){
  const frame={width,height,touch,rotation};assert.equal(layout.isMobileLandscapePresentation(frame),expected);layout.applyChallengeLayout(host,frame);assert.equal(host.dataset.controlOverlay,expected?'soft':'normal');
 }
});
for(const mode of ['classic','stable'])test(`main/later ${mode} share closer mobile landscape intent regardless of physical orientation`,()=>{
 const g=fixtures['native-vs'].cameraSafety,actors=[actor(450),actor(510)],world={player:actors[0],enemy:actors[1]};
 const frames=[0,90,-90].flatMap(rotation=>{const o={...g,touch:true,portrait:false,nativeLandscape:rotation===0,rotation,camera:mode,cameraMode:mode};return [fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,844,390,actors,null,16.7,o),createMobileCameraAdapter().frame({zoom:.3,left:0,base:275},world,{...o,width:844,height:390}).cameraFrame];});
 for(const f of frames){assert.ok(f.zoom>.75,'larger than #66 main VS close cap .50/.59 and later .71');assertSafety(f,actors,g);for(const key of ['x','y','zoom'])assert.ok(Math.abs(f[key]-frames[0][key])<1e-10,`${key} is one shared logical framing`);}
});
test('short landscape permits lower-body overlap without removing full-screen or HUD and standing head/collar proxy safety',()=>{
 const g={safeRect:{left:0,top:0,right:568,bottom:320},occlusions:[{kind:'hud',left:0,top:0,right:568,bottom:117},{kind:'control',left:8,top:200,right:120,bottom:312},{kind:'control',left:266,top:200,right:560,bottom:314}]};
 const actors=[actor(450),actor(510)],preferred={width:568,height:320,x:480,y:300,zoom:.32};
 const f=fitChallengeCamera(preferred,actors,null,16.7,{...g,touch:true});
 assert.ok(f.zoom>.42,'lower-body overlap enables a substantially closer short-screen pair');assertSafety(f,actors,g);
 assert.ok(actors.some(a=>g.occlusions.filter(o=>o.kind==='control').some(o=>overlaps(project(f,challengeActorBounds(a,{prediction:0})),o))),'the authorized lower-body overlap actually occurs');
});
for(const [width,height] of [[844,390],[568,320]])for(const cameraMode of ['classic','stable'])test(`mobile safety includes jump, depth and real distant threats ${width} ${cameraMode}`,()=>{
 const g={safeRect:{left:8,top:8,right:width-8,bottom:height-8},occlusions:[{kind:'hud',left:8,top:8,right:width-8,bottom:100},{kind:'control',left:8,top:height-120,right:120,bottom:height-8},{kind:'control',left:width-300,top:height-130,right:width-8,bottom:height-8}]};
 for(const [gap,y,depth] of [[60,430,0],[494,430,0],[300,169,-65],[60,54,90],[494,54,-90]]){
  const p=actor(450,y,depth),e={...actor(450+gap),spec:{range:430}},world={player:p,enemies:[e],section:{spawns:[]},spawned:new Set()},plan=challengeCameraPlan(world,{route:true});assert.equal(plan.subjects.length,2);
  const f=fitChallengeCamera({width,height,x:480,y:300,zoom:.35},plan.subjects,null,16.7,{...g,touch:true,cameraMode,cameraPlan:plan});assertSafety(f,[p,e],g);
 }
});

test('historical #66 inputs preserve desktop and portrait VS; portrait street enforces close player scale',async()=>{
 const {depthRouteCameraFrame}=await import('../dist/challenge-depth-render.mjs');
 const {cases,profiles}=JSON.parse(readFileSync(new URL('./fixtures/mobile-landscape-preservation-nov11.json',import.meta.url)));
 assert.equal(cases.length,32);let untouched=0,closeStreet=0;
 for(const c of cases){const options={...profiles[c.name],camera:c.mode,cameraMode:c.mode},[player,enemy]=c.actors,world={player,enemy,enemies:[enemy],section:{spawns:[]},spawned:new Set(),worldWidth:3600};
  const actual=c.route?depthRouteCameraFrame(c.width,c.height,world,options):fullStageCameraFrame(c.mode==='stable'?fixedStableCameraFrame:cameraFrame,c.width,c.height,c.actors,null,1000/60,options);
  const later=createMobileCameraAdapter().frame(c.legacy,world,options).cameraFrame;
  const close=c.route&&c.name==='portrait-street';
  if(close){closeStreet++;assertSafety(actual,[player],options,true);assertSafety(later,[player],options,true);assert.equal(actual.zoom,390/500,'portrait stays near classic VS scale rather than fitting the enemy');for(const key of ['x','y','zoom'])assert.equal(later[key],actual[key],'shared close entry '+key);continue;}
  untouched++;assert.equal(actual.playerCloseCamera,undefined);assert.equal(later.playerCloseCamera,undefined);
  for(const key of ['x','y','zoom']){assert.ok(Math.abs(actual[key]-c.expected[key])<1e-10,`${c.name} ${c.mode} ${c.pose} ${key}`);assert.ok(Math.abs(later[key]-c.expectedLater[key])<1e-10,`later ${c.name} ${c.mode} ${c.pose} ${key}`);}
 }
 assert.equal(untouched,24);assert.equal(closeStreet,8,'all historical portrait street inputs receive replacement invariants');
});

for(const [width,height] of [[844,390],[568,320]])for(const camera of ['classic','stable'])test(`measured soft-controls real street admission remains continuous ${width} ${camera}`,async()=>{
 const {ChallengeDepthRoute}=await import('../dist/challenge-depth-engine.mjs'),{depthRouteCameraFrame}=await import('../dist/challenge-depth-render.mjs');
 const g=width===844?fixtures['native-street'].cameraSafety:{safeRect:{left:0,top:0,right:568,bottom:320},occlusions:[{kind:'hud',left:8,top:4,right:560,bottom:103},{kind:'control',left:8,top:202,right:120,bottom:314},{kind:'control',left:266,top:200,right:560,bottom:314}]};
 const world=new ChallengeDepthRoute('wang','easy',()=>.2),adapter=createMobileCameraAdapter();let previous=null;
 for(let i=0;i<900;i++){
  if(i%21===0)world.press('punch');world.step(1/60,{right:i<600,left:i>=600});
  const next=depthRouteCameraFrame(width,height,world,{...g,touch:true,fullStage:true,camera,previous,delta:1000/60}),later=adapter.frame({zoom:.3,left:0,base:200},world,{...g,width,height,touch:true,route:true,camera,delta:1000/60}).cameraFrame,plan=challengeCameraPlan(world,{route:true,previous});assertSafety(next,plan.subjects,g,camera==='classic');assert.equal(!!later.playerCloseCamera,camera==='classic');for(const key of ['x','y','zoom'])assert.ok(Math.abs(next[key]-later[key])<1e-9,`same main/later ${key} at frame ${i}`);
  if(previous){if(next.playerFixedCamera){assert.equal(next.zoom,previous.zoom,`frame ${i}: fixed player scale`);assert.deepEqual(next.playerFixedCamera.anchor,previous.playerFixedCamera.anchor);const before=previous.playerFixedCamera.pose,after=next.playerFixedCamera.pose;assert.ok(Math.abs((next.y-previous.y)-(after.displayY-before.displayY))<1e-10,'vertical follow remains exact');assert.ok(next.playerFixedCamera.follow.clamped||Math.abs(next.x-previous.x)*next.zoom<=8+1e-7,'horizontal follow is bounded unless safety overrides');const sx=width/2+(after.x-next.x)*next.zoom;assert.ok(sx>=next.playerFixedCamera.follow.left-1e-7&&sx<=next.playerFixedCamera.follow.right+1e-7,'actual player stays inside reserved travel');}else if(camera==='classic'){closeMotion(next,previous);}else{assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y)*next.zoom<=6.01,`frame ${i}: continuous position`);assert.ok(Math.abs(next.zoom/previous.zoom-1)<=.0200001,`frame ${i}: continuous admission scale ${next.zoom/previous.zoom-1}`);}}
  previous=next;if(world.status!=='active')break;
 }
});

test('an explicit unmeasured safety fallback also retains the main legacy preference',()=>{
 const f=fullStageCameraFrame(cameraFrame,844,390,[actor(450),actor(510)],null,1000/60,{...fixtures['native-vs'].cameraSafety,touch:true,nativeLandscape:true,cameraMode:'classic',measuredCameraSafety:false});
 assert.equal(f.controlOverlay,'normal');assert.ok(f.zoom<.6,'explicit fallback must not accidentally keep the enlarged measured preference');
});
