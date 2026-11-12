import test from 'node:test';
import assert from 'node:assert/strict';
import * as arena from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame,stageInsets} from '../dist/combat-presentation.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
const portrait=(w,h,fs,prev)=>fullStageCameraFrame(arena.fixedStableCameraFrame,w,h,fs,prev,1000/60,{touch:true,portrait:true});
const bodiesFit=(f,fs,inset={top:0,bottom:0})=>{for(const a of fs){assert.ok(f.width/2+(a.x-130-f.x)*f.zoom>=-1e-8,'left edge');assert.ok(f.width/2+(a.x+130-f.x)*f.zoom<=f.width+1e-8,'right edge');assert.ok(f.height/2+(a.y-285-f.y)*f.zoom>=inset.top-1e-8,'head');assert.ok(f.height/2+(a.y+28-f.y)*f.zoom<=f.height-inset.bottom+1e-8,'feet');}};
for(const [w,h] of [[320,568],[390,844],[430,932]])test(`portrait stable ${w}x${h} keeps both actors, ordinary jumps steady and extreme jumps safely fitted`,()=>{
 let frame;const fs=[{x:260,y:430},{x:700,y:430}];let maxShift=0;
 for(let i=0;i<340;i++){fs[1].x=700-i;const next=portrait(w,h,fs,frame);bodiesFit(next,fs,stageInsets(w,h,{touch:true,portrait:true}));if(frame)maxShift=Math.max(maxShift,Math.abs((next.x-frame.x)*next.zoom));frame=next;}
 assert.ok(maxShift<3,`camera step ${maxShift}px`);for(let i=0;i<600;i++)frame=portrait(w,h,fs,frame);const near=frame.zoom;
 for(const y of [430,300,160,160,300,430]){fs[0].y=y;frame=portrait(w,h,fs,frame);assert.equal(frame.zoom,near,'jump does not drive zoom');bodiesFit(frame,fs,stageInsets(w,h,{touch:true,portrait:true}));}
 fs[0].y=430;fs[0].x=68;fs[1].x=892;frame=portrait(w,h,fs,frame);bodiesFit(frame,fs,stageInsets(w,h,{touch:true,portrait:true}));assert.ok(frame.zoom<near,'separation may zoom out to preserve both fighters');
});
test('mobile landscape VS dynamic reduces zoom amplitude while desktop, tablet and portrait stay unchanged',()=>{
 for(const [w,h,touch,portrait] of [[844,390,true,false],[1280,720,false,false],[1024,768,true,false],[390,844,true,true]]){
 const opts={touch,portrait,nativeLandscape:touch&&!portrait};const height=h-stageInsets(w,h,opts).top-stageInsets(w,h,opts).bottom;
 const ground=[{x:436,y:430},{x:524,y:430}],jump=[{x:436,y:54},{x:524,y:430}];
 const actual=fs=>fullStageCameraFrame(arena.cameraFrame,w,h,fs,null,1000/60,opts);
 const a=actual(ground),b=actual(jump),oldA=arena.cameraFrame(w,height,ground),oldB=arena.cameraFrame(w,height,jump);
 bodiesFit(a,ground,stageInsets(w,h,opts));bodiesFit(b,jump,stageInsets(w,h,opts));
 if(w===844)assert.ok((a.zoom-b.zoom)<(oldA.zoom-oldB.zoom)*.5,'less than half original zoom travel');else {assert.equal(a.zoom,oldA.zoom);assert.equal(b.zoom,oldB.zoom);}
 }
});
test('only mobile landscape street dynamic reduces jump zoom without cropping the controlled fighter',()=>{
 for(const [w,h,touch,portrait]of [[844,390,true,false],[1280,720,false,false],[1024,768,true,false],[390,844,true,true]]){
 const route=new ChallengeDepthRoute('wang','easy',()=>.2),opts={fullStage:true,touch,portrait,landscapePreview:touch&&!portrait,camera:'classic'};route.player.x=1000;
 const standing=depthRouteCameraFrame(w,h,route,opts);route.player.y=54;const jump=depthRouteCameraFrame(w,h,route,opts);
 if(w===844)assert.ok(jump.zoom/standing.zoom>.65,'retain at least 65% of standing size');
 const head=h/2+(route.player.y-300-jump.y)*jump.zoom,feet=head+300*jump.zoom;assert.ok(head>=0);assert.ok(feet<=h);
 }
});
test('new-run comic stays visible while session creation is pending, then yields to the street',async()=>{
 const f=await starterGameEntry();let release;try{
 f.context.challengeOperations=new Promise(r=>release=r);await f.start({characterId:'wang'});const root=f.$('.starter-opening');f.$('[data-starter-skip]').click();await f.settle();assert.equal(root.open,true,'the old arena must remain covered during async save');assert.equal(f.starts,0);f.$('[data-starter-skip]').click();release();for(let i=0;i<20&&root.open;i++)await f.settle();assert.equal(f.starts,1);assert.equal(f.context.duel.depthMode,true);assert.equal(root.open,false);
 }finally{release?.();f.close();}
});
test('portrait pair framing contains the real legal desk jump, including an opponent still on the ground',async()=>{
 const {Duel}=await import('../dist/core.mjs'),{DESK}=await import('../dist/stage-expansion.mjs');
 for(const [w,h]of [[320,568],[390,844],[430,932]]){
 const duel=new Duel('wang','easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});duel.player.x=480;duel.player.y=DESK.y;duel.player.supportY=DESK.y;duel.enemy.x=750;duel.nextItemAt=Infinity;
 let f=portrait(w,h,[duel.player,duel.enemy]),zoom=f.zoom;assert.equal(duel.press('jump'),true);
 for(let i=0;i<180;i++){duel.step(1/120,{});const old=f;f=portrait(w,h,[duel.player,duel.enemy],f);assert.ok(f.zoom>=zoom*.82&&f.zoom<=zoom,'extreme table jumps use a bounded safety pullback');assert.ok(Math.abs(f.zoom-old.zoom)<zoom*.02,'legal jump zoom is gradual');bodiesFit(f,[duel.player,duel.enemy],stageInsets(w,h,{touch:true,portrait:true}));}
 }
});
test('a completed old opening cannot close a replacement while its save promise resolves',async()=>{
 const f=await starterGameEntry();let release;try{
 f.context.challengeOperations=new Promise(r=>release=r);await f.start({characterId:'wang'});f.$('[data-starter-skip]').click();await f.settle();await f.start({characterId:'han',helperId:'wang'});release();await f.settle();assert.equal(f.$('.starter-opening').open,true);assert.equal(f.$('.starter-opening').dataset.character,'han');assert.equal(f.starts,0);
 f.$('[data-starter-skip]').click();for(let i=0;i<20&&f.$('.starter-opening').open;i++)await f.settle();assert.equal(f.starts,1);assert.equal(f.context.duel.player.type,'han');
 }finally{release?.();f.close();}
});
