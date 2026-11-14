import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Duel} from '../dist/core.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
const profiles=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
function visible(frame,actors,geometry){
 assert.equal(frame.cameraSafetyFit,true);
 for(const a of actors){
  const b={left:frame.width/2+(a.x-132-frame.x)*frame.zoom,right:frame.width/2+(a.x+132-frame.x)*frame.zoom,top:frame.height/2+(a.y-300-frame.y)*frame.zoom,bottom:frame.height/2+(a.y+28-frame.y)*frame.zoom};
  assert.ok(b.left>=geometry.safeRect.left-1e-5&&b.right<=geometry.safeRect.right+1e-5,'both bodies stay horizontally visible');
  assert.ok(b.top>=geometry.safeRect.top-1e-5&&b.bottom<=geometry.safeRect.bottom+1e-5,'head and feet remain on screen');
  for(const o of geometry.occlusions){const bottom=o.kind==='control'?b.bottom-168*frame.zoom:b.bottom;
   assert.ok(!(b.right>o.left-6+1e-5&&b.left<o.right+6-1e-5&&bottom>o.top-6+1e-5&&b.top<o.bottom+6-1e-5),'HUD and control head clearance');
  }
 }
}
function trace(profile,{pair=[170,320],gameMode='battle',character='wang',desk=false}={}){
 const p=profiles[profile],{width,height}=p.frame;
 const options={...p.cameraSafety,touch:p.dataset.touch==='true',portrait:width<height,nativeLandscape:p.dataset.nativeLandscape==='true',cameraMode:'classic',gameMode};
 const duel=new Duel(character,'easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});
 // Real jump physics with a passive opponent; no AI hits contaminate framing.
 duel.player.x=pair[0];duel.enemy.x=pair[1];duel.nextItemAt=Infinity;
 if(desk){duel.player.x=480;duel.player.y=DESK.y;duel.player.supportY=DESK.y;}
 let frame;const sample=()=>fullStageCameraFrame(cameraFrame,width,height,[duel.player,duel.enemy],frame,1000/120,options);
 for(let i=0;i<240;i++)frame=sample();
 const standing=frame.zoom;assert.equal(duel.press('jump'),true);let min=standing,maxPan=0,maxRecoveryStep=0,landedAt=null;
 for(let i=0;i<440;i++){
  duel.step(1/120,{});const next=sample();visible(next,[duel.player,duel.enemy],p.cameraSafety);
  min=Math.min(min,next.zoom);maxPan=Math.max(maxPan,Math.hypot(next.x-frame.x,next.y-frame.y)*next.zoom);
  if(next.zoom>frame.zoom)maxRecoveryStep=Math.max(maxRecoveryStep,next.zoom/frame.zoom-1);
  if(i>100&&duel.player.y===430&&landedAt===null)landedAt=i;
  frame=next;
 }
 return {standing,min,amplitude:standing-min,maxPan,maxRecoveryStep,landedAt,end:frame.zoom};
}
for(const profile of ['native-vs','rotated-vs'])test(`${profile}: real single jump reduces unnecessary pullback, then returns smoothly`,()=>{
 for(const [pair,gain]of [[[170,320],1.025],[[68,892],1.08]]){
  const before=trace(profile,{pair,gameMode:null}),after=trace(profile,{pair});
  assert.equal(after.standing,before.standing,'the ground baseline is unchanged');
  assert.ok(after.min>before.min*gain,JSON.stringify({before,after}));
  assert.ok(after.amplitude<before.amplitude,'zoom peak-to-trough is reduced');
  assert.ok(after.maxPan<7,'bounded pan, in CSS pixels per 120Hz frame');
  assert.ok(after.maxRecoveryStep<.0101,'recovery is bounded to 2% per 60Hz frame');
  assert.ok(after.landedAt!==null&&Math.abs(after.end-after.standing)<.00001,'returns to the same standing frame');
 }
});
test('all seven characters and a legal higher jump retain full body visibility',()=>{
 for(const character of ['wang','han','huang','su','ko','ma','chen'])trace('native-vs',{character});
 trace('rotated-vs',{pair:[480,750],desk:true});
});
test('stable, desktop, portrait, training, challenge and unspecified callers keep their exact frame sequences',()=>{
 const poses=[{x:170,y:430,vy:0},{x:320,y:430,vy:0}];
 for(const [name,mode,gameMode] of [['desktop-vs','classic','battle'],['portrait-vs','classic','battle'],['native-vs','stable','battle'],['rotated-vs','stable','battle'],['native-vs','classic','training'],['native-vs','classic','challenge']]){
  const p=profiles[name],{width,height}=p.frame,options={...p.cameraSafety,touch:p.dataset.touch==='true',portrait:width<height,nativeLandscape:p.dataset.nativeLandscape==='true',cameraMode:mode};
  let old,newer;for(let i=0;i<45;i++){
   const actors=poses.map((a,j)=>({...a,x:a.x+(j?i*8:0),y:a.y-(j?0:180*Math.sin(Math.PI*i/44)),vy:j?0:-200})),camera=mode==='stable'?fixedStableCameraFrame:cameraFrame;
   old=fullStageCameraFrame(camera,width,height,actors,old,1000/60,options);
   newer=fullStageCameraFrame(camera,width,height,actors,newer,1000/60,{...options,gameMode});
   assert.deepEqual(newer,old,`${name}/${mode}/${gameMode}/${i}`);
  }
 }
});
test('horizontal separation still pulls back enough to show both fighters',()=>{
 const p=profiles['native-vs'],o={...p.cameraSafety,touch:true,portrait:false,cameraMode:'classic',gameMode:'battle'};
 const near=[{x:430,y:430},{x:530,y:430}],far=[{x:68,y:430},{x:892,y:430}];
 const a=fullStageCameraFrame(cameraFrame,844,390,near,null,16,o),b=fullStageCameraFrame(cameraFrame,844,390,far,null,16,o);
 assert.ok(b.zoom<a.zoom);visible(b,far,p.cameraSafety);
});
