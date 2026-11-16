import test from 'node:test';
import assert from 'node:assert/strict';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {streetTrialFrame} from '../dist/preview/chapter2/street-trial-view.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {challengeActorBounds,challengeCameraSubjects} from '../dist/challenge-camera.mjs';
const actor=x=>({x,y:430,depth:0,hp:100});
const geometry=(w,h,touch=true)=>({safeRect:{left:8,top:8,right:w-8,bottom:h-8},occlusions:[{left:8,top:8,right:w-8,bottom:Math.min(120,h*.23)},...(touch?[{left:8,top:h-130,right:w*.27,bottom:h-8},{left:w*.65,top:h-154,right:w-8,bottom:h-8}]:[])]});
function safe(f,actors,g,close=false){assert.equal(!!f.playerCloseCamera,close,'close ownership only on expected phone street');if(close)assert.deepEqual(f.playerCloseCamera.pose,{x:actors[0].x,displayY:actors[0].y+(actors[0].depth||0)*.65},'close pose is the actual controlled player');const playerOnly=close||f.playerFixedCamera||f.challengeCameraMode==='stable';for(const a of playerOnly?actors.slice(0,1):actors){const b=challengeActorBounds(a,{prediction:0,halfWidth:close||f.playerFixedCamera?132:130}),r={left:f.width/2+(b.left-f.x)*f.zoom,right:f.width/2+(b.right-f.x)*f.zoom,top:f.height/2+(b.top-f.y)*f.zoom,bottom:f.height/2+(b.bottom-f.y)*f.zoom};assert.ok(r.left>=g.safeRect.left-1e-5&&r.right<=g.safeRect.right+1e-5&&r.top>=g.safeRect.top-1e-5&&r.bottom<=g.safeRect.bottom+1e-5,'whole current bodies remain safe');for(const o of g.occlusions)assert.ok(!(r.left<o.right-1e-6&&r.right>o.left+1e-6&&r.top<o.bottom-1e-6&&r.bottom>o.top+1e-6),'whole bodies avoid controls');}}

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

function laterBoss(w,h,p,e){const portrait=w<h,zoom=Math.max(.3,Math.min(portrait?w/660:w/1060,(h-(portrait?90:115))/390,w/(Math.abs(e.x-p.x)+340)));return {zoom,left:Math.max(0,Math.min(960-w/zoom,(p.x+e.x)/2-w/zoom/2)),base:portrait?h*.8:h-115};}
// A solver that freely switches between disjoint legal pockets at maximum
// zoom fails this smooth motion trace, despite every individual frame fitting.
for(const path of ['main','later'])for(const nativeLandscape of [true,false])for(const direction of [-1,1])test(`${path} stable VS continuous lateral traversal, native=${nativeLandscape}, direction=${direction}`,()=>{
 const w=844,h=390,p=actor(direction>0?68:892),e=actor(480),world={player:p,enemy:e},adapter=createMobileCameraAdapter(),g=geometry(w,h);let previous=null;
 for(let i=0;i<420;i++){p.x+=direction*1.8;const options={...g,touch:true,nativeLandscape,portrait:false,camera:'stable',cameraMode:'stable',delta:1000/60};const f=path==='main'?fullStageCameraFrame(fixedStableCameraFrame,w,h,[p,e],previous,1000/60,options):adapter.frame(laterBoss(w,h,p,e),world,{...options,width:w,height:h}).cameraFrame;safe(f,[p,e],g);if(previous){assert.ok(Math.hypot(f.x-previous.x,f.y-previous.y)*f.zoom<=8,`frame ${i}: pan ${Math.hypot(f.x-previous.x,f.y-previous.y)*f.zoom}`);if(f.playerFixedCamera)assert.equal(f.zoom,previous.zoom,'ordinary lateral motion keeps exact player scale');else assert.ok(Math.abs(f.zoom/previous.zoom-1)<=.0200001,'ordinary lateral motion has no scale snap');}previous=f;}
});
// Retaining a forecast's smallest scale for the entire route, or applying the
// old 400-unit vertical reserve again, leaves a close encounter needlessly tiny.
for(const path of ['main','later'])for(const camera of ['classic','stable'])for(const [w,h] of [[390,844],[844,390]])test(`${path} ${camera} ${w}x${h} restores close street framing after distant approach`,()=>{
 const p=actor(1000),e=actor(1550),world={player:p,enemy:e,enemies:[e],worldWidth:3600},adapter=createMobileCameraAdapter(),g=geometry(w,h);let previous=null;
 for(let i=0;i<420;i++){e.x=1550-Math.min(450,i*3);const opts={...g,width:w,height:h,fullStage:true,touch:true,portrait:w<h,landscapePreview:w>h,camera,route:true,previous,delta:1000/60};const f=path==='main'?depthRouteCameraFrame(w,h,world,opts):adapter.frame(streetTrialFrame({width:w,height:h,portrait:w<h,player:p,worldWidth:3600}),world,opts).cameraFrame;safe(f,[p,e],g,w<h||camera==='classic');previous=f;}
 assert.ok(previous.zoom*300>=200,`close bodies should occupy at least 200 logical pixels, got ${previous.zoom*300}`);
});
// Engine knockback is real; it must not be copied as camera feed-forward.
for(const path of ['main','later'])for(const camera of ['classic','stable'])test(`${path} ${camera} actual street hits do not become camera position jumps`,()=>{
 const w=390,h=844,r=new ChallengeDepthRoute('wang','easy',()=>.2),adapter=createMobileCameraAdapter(),g=geometry(w,h);let previous=null;
 for(let i=0;i<900;i++){r.step(1/60,{right:true});const opts={...g,width:w,height:h,fullStage:true,touch:true,portrait:true,camera,route:true,previous,delta:1000/60};const f=path==='main'?depthRouteCameraFrame(w,h,r,opts):adapter.frame(streetTrialFrame({width:w,height:h,portrait:true,player:r.player,worldWidth:r.worldWidth}),r,opts).cameraFrame;safe(f,challengeCameraSubjects(r,{route:true}),g,true);if(previous)closeMotion(f,previous);previous=f;if(r.status!=='active')break;}
});

// A distant real melee mob must not shrink the local fight, but a real ranged
// enemy able to attack from the same distance must remain a camera subject.
test('street admission uses original mob attack reach instead of every spawned body',()=>{
 const r=new ChallengeDepthRoute('wang','easy',()=>.2);r.spawn();const melee=r.enemies[0];r.player.x=1000;melee.x=1500;
 assert.equal(challengeCameraSubjects(r,{route:true}).includes(melee),false,'500-unit melee mob is an approach, not the local encounter');
 melee.x=1240;assert.ok(challengeCameraSubjects(r,{route:true}).includes(melee),'nearby actual melee threat remains visible');
 const ranged={...melee,x:1420,spec:{...melee.spec,range:430,behavior:'thrower'}};r.enemies.push(ranged);
 assert.ok(challengeCameraSubjects(r,{route:true}).includes(ranged),'real ranged attack reach is never discarded for a closer shot');
 assert.deepEqual(challengeCameraSubjects({player:r.player,enemy:melee},{route:false}),[r.player,melee],'duels always retain both fighters');
});
for(const path of ['main','later'])for(const camera of ['classic','stable'])test(`${path} ${camera} normal seeded local street play is actually readable`,()=>{
 const w=390,h=844,r=new ChallengeDepthRoute('wang','easy',()=>.2),adapter=createMobileCameraAdapter(),g=geometry(w,h),sizes=[];let previous=null;
 for(let i=0;i<900;i++){if(i%21===0)r.press('punch');r.step(1/60,{right:i<600,left:i>=600});const opts={...g,width:w,height:h,fullStage:true,touch:true,portrait:true,camera,route:true,previous,delta:1000/60};const f=path==='main'?depthRouteCameraFrame(w,h,r,opts):adapter.frame(streetTrialFrame({width:w,height:h,portrait:true,player:r.player,worldWidth:r.worldWidth}),r,opts).cameraFrame;safe(f,challengeCameraSubjects(r,{route:true}),g,true);sizes.push(f.zoom*300);if(previous)closeMotion(f,previous);previous=f;if(r.status!=='active')break;}
 assert.ok(sizes.some(size=>size>=230),'near melee encounter reaches a readable close scale');sizes.sort((a,b)=>a-b);assert.ok(sizes[Math.floor(sizes.length/2)]>=160,`ordinary playable median character height is ${sizes[Math.floor(sizes.length/2)]}px`);
});

for(const path of ['main','later'])test(`${path} close street camera reserves full backdrop density before zoom recovery`,()=>{
 const p=actor(1000),e=actor(1500),world={player:p,enemy:e,enemies:[e],worldWidth:3600},adapter=createMobileCameraAdapter();const opts={...geometry(390,844),width:390,height:844,fullStage:true,touch:true,portrait:true,camera:'classic',route:true};let previous=null,density=null;
 for(let i=0;i<240;i++){e.x=1500-Math.min(400,i*3);const f=path==='main'?depthRouteCameraFrame(390,844,world,{...opts,previous}):adapter.frame(streetTrialFrame({width:390,height:844,portrait:true,player:p,worldWidth:3600}),world,opts);const camera=f.cameraFrame||f;if(density===null)density=f.backdropZoom;assert.ok(density>=camera.zoom-1e-8,'first raster density covers eventual close camera; no enlarged low-density art');assert.equal(f.backdropZoom,density,'ordinary zoom recovery cannot rerasterize the backdrop each frame');previous=camera;}
});
