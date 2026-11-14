import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Duel} from '../dist/core.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const profiles=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const names=['desktop-vs','portrait-vs','native-vs','rotated-vs'];
function setup(name,mode='stable'){
 const p=profiles[name],{width,height}=p.frame;
 const options={...p.cameraSafety,touch:p.dataset.touch==='true',portrait:width<height,nativeLandscape:p.dataset.nativeLandscape==='true',cameraMode:mode};
 return {width,height,options,frame:(actors,previous,extra={})=>fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,width,height,actors,previous,1000/120,{...options,...extra})};
}
function playerVisible(f,a,g){
 const x=f.width/2+(a.x-f.x)*f.zoom,y=f.height/2+(a.y+(a.depth||0)*.65-f.y)*f.zoom;
 const b={left:x-132*f.zoom,right:x+132*f.zoom,top:y-300*f.zoom,bottom:y+28*f.zoom};
 assert.ok(b.left>=g.safeRect.left-1e-5&&b.right<=g.safeRect.right+1e-5,'controlled body width');
 assert.ok(b.top>=g.safeRect.top-1e-5&&b.bottom<=g.safeRect.bottom+1e-5,'controlled head and feet');
 for(const o of g.occlusions){const bottom=o.kind==='control'&&f.controlOverlay==='soft'?b.bottom-168*f.zoom:b.bottom;
  assert.ok(!(b.right>o.left-6+1e-5&&b.left<o.right+6-1e-5&&bottom>o.top-6+1e-5&&b.top<o.bottom+6-1e-5),'controlled body clears HUD / protected control region');
 }
}
for(const name of names){
 test(`${name}: stable scale is exactly fixed through real jump, landing and separation`,()=>{
  const q=setup(name),d=new Duel('wang','easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});d.nextItemAt=Infinity;
  d.player.x=480;d.player.y=DESK.y;d.player.supportY=DESK.y;d.enemy.x=750;
  let f=q.frame([d.player,d.enemy]),base=f.zoom;assert.ok(f.controlledCombatCamera,'uses the approved player camera');assert.ok(d.press('jump'));
  for(let i=0;i<420;i++){d.step(1/120,{left:i>190&&i<300});d.enemy.x=i%2?892:68;f=q.frame([d.player,d.enemy],f);assert.equal(f.zoom,base);playerVisible(f,d.player,q.options);}
  assert.equal(d.player.y,d.player.supportY,'lands on the real support surface');assert.equal(d.player.vy,0);
 });
 test(`${name}: dynamic single jump has exactly the same zoom trace as standing`,()=>{
  const q=setup(name,'classic'),a=new Duel('han','easy',()=>.2,'wang',{mode:'training',trainingBehavior:'stand'}),b=new Duel('han','easy',()=>.2,'wang',{mode:'training',trainingBehavior:'stand'});
  a.nextItemAt=b.nextItemAt=Infinity;a.player.x=b.player.x=170;a.enemy.x=b.enemy.x=320;
  let fa=q.frame([a.player,a.enemy]),fb=q.frame([b.player,b.enemy]);assert.ok(a.press('jump'));
  for(let i=0;i<420;i++){a.step(1/120,{});b.step(1/120,{});fa=q.frame([a.player,a.enemy],fa);fb=q.frame([b.player,b.enemy],fb);assert.equal(fa.zoom,fb.zoom);playerVisible(fa,a.player,q.options);}
 });
 test(`${name}: dynamic separation is limited to five percent and recovers smoothly`,()=>{
  const q=setup(name,'classic'),actors=[{x:260,y:430,vy:0},{x:400,y:430,vy:0}];let f=q.frame(actors),base=f.zoom,min=base,maxStep=0;
  for(let i=0;i<800;i++){actors[1].x=i<400?892:400;const n=q.frame(actors,f);assert.ok(n.zoom>=base*.95-1e-9&&n.zoom<=base+1e-9);maxStep=Math.max(maxStep,Math.abs(n.zoom-f.zoom)/base);min=Math.min(min,n.zoom);f=n;playerVisible(f,actors[0],q.options);}
  assert.ok(min<base*.99);assert.ok(maxStep<.003);assert.ok(Math.abs(f.zoom-base)<1e-5);
 });
}
test('a stationary controlled player does not pan for an opponent or helper; distant opponents may leave view',()=>{
 const q=setup('portrait-vs'),actors=[{x:68,y:430},{x:320,y:430}];let f=q.frame(actors),initial={x:f.x,y:f.y,zoom:f.zoom};
 for(let i=0;i<80;i++){actors[1]={x:i%2?892:500,y:i%2?50:430,vy:-700};f=q.frame(actors,f,{assists:[{phase:'attack',actor:{x:1400,y:80}}]});assert.deepEqual({x:f.x,y:f.y,zoom:f.zoom},initial);}
 const opponentX=f.width/2+(892-f.x)*f.zoom;assert.ok(opponentX>f.width,'no forced all-actor fit');
});
test('resize and HUD reflow rebase once; pause keeps its pose and the engine is never mutated',()=>{
 const q=setup('native-vs'),actors=[{x:260,y:430},{x:700,y:430}];let f=q.frame(actors),before=JSON.stringify(actors);
 assert.equal(q.frame(actors,f,{paused:true}),f);assert.equal(JSON.stringify(actors),before);
 const next=setup('portrait-vs');f=next.frame(actors,f);const z=f.zoom;
 for(let i=0;i<20;i++){f=next.frame(actors,f);assert.equal(f.zoom,z);playerVisible(f,actors[0],next.options);}
 const changed={...next.options,safeRect:{...next.options.safeRect,left:12,right:next.width-12}};
 f=next.frame(actors,f,changed);const reflow=f.zoom;for(let i=0;i<20;i++){f=next.frame(actors,f,changed);assert.equal(f.zoom,reflow);}
 assert.equal(JSON.stringify(actors),before);
});
for(const name of names){
 test(`${name}: all seven real fighters retain a fixed scale through ground and desk jumps`,()=>{
  for(const character of ['wang','han','huang','su','ko','ma','chen'])for(const desk of [false,true])for(const mode of ['stable','classic']){
   const q=setup(name,mode),d=new Duel(character,'easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});d.nextItemAt=Infinity;
   d.player.x=desk?480:170;d.enemy.x=desk?750:320;
   if(desk)d.player.y=d.player.supportY=DESK.y;
   let f=q.frame([d.player,d.enemy]),base=f.zoom;assert.ok(d.press('jump'));
   for(let i=0;i<320;i++){d.step(1/120,{});f=q.frame([d.player,d.enemy],f);assert.equal(f.zoom,base,`${character}/${desk}/${mode}`);playerVisible(f,d.player,q.options);}
  }
 });
 test(`${name}: shared chapter duel adapter obeys the same camera as ordinary combat`,()=>{
  for(const mode of ['stable','classic']){
   const q=setup(name,mode),adapter=createMobileCameraAdapter(),world={player:{x:260,y:430},enemy:{x:400,y:430},status:'playing'};
   const legacy={zoom:.65,left:0,base:q.height*.8};let direct,adapted;
   for(let i=0;i<200;i++){
    world.player.y=430-Math.sin(Math.PI*i/199)*400;world.enemy.x=i<100?892:400;
    direct=q.frame([world.player,world.enemy],direct);
    adapted=adapter.frame(legacy,world,{...q.options,width:q.width,height:q.height,camera:mode,route:false,delta:1000/120});
    assert.deepEqual(adapted.cameraFrame,direct);playerVisible(direct,world.player,q.options);
   }
   const frozen=adapter.frame(legacy,world,{...q.options,width:q.width,height:q.height,camera:mode,route:false,paused:true});
   assert.equal(frozen.cameraFrame,adapted.cameraFrame);
   adapter.reset();const reset=adapter.frame(legacy,world,{...q.options,width:q.width,height:q.height,camera:mode,route:false});
   assert.equal(reset.zoom,direct.controlledCombatCamera.baseline);
  }
 });
}
test('a paused viewport change keeps the captured pose, then resumes at the new fixed scale',()=>{
 const q=setup('native-vs'),actors=[{x:170,y:180},{x:320,y:430}];const captured=q.frame(actors);
 actors[0]={x:800,y:430};const portrait=setup('portrait-vs');
 const resized=portrait.frame(actors,captured,{paused:true});
 assert.deepEqual(resized.controlledCombatCamera.pose,captured.controlledCombatCamera.pose);
 assert.equal(portrait.frame(actors,resized,{paused:true}),resized);
 const resumed=portrait.frame(actors,resized);assert.equal(resumed.zoom,resized.zoom);playerVisible(resumed,actors[0],portrait.options);
});
