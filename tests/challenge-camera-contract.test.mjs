import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
let shared={};try{shared=await import('../dist/challenge-camera.mjs');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const actor=(x,y=430,depth=0)=>({x,y,depth,hp:100});
const bounds=(f,a)=>({left:f.width/2+(a.x-(f.controlOverlay==='soft'||f.playerCloseCamera?132:130)-f.x)*f.zoom,right:f.width/2+(a.x+(f.controlOverlay==='soft'||f.playerCloseCamera?132:130)-f.x)*f.zoom,top:f.height/2+(a.y+(a.depth||0)*.65-300-f.y)*f.zoom,bottom:f.height/2+(a.y+(a.depth||0)*.65+28-f.y)*f.zoom});
const overlap=(a,b)=>a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6;
function fits(f,actors,safeRect,occlusions,close=false){
 assert.equal(!!f.playerCloseCamera,close,'only explicitly selected phone street profiles own close framing');
 if(close)assert.deepEqual(f.playerCloseCamera.pose,{x:actors[0].x,displayY:actors[0].y+(actors[0].depth||0)*.65},'close pose is the actual controlled player');
 const protectedBounds=b=>f.controlOverlay==='soft'?{...b,bottom:b.bottom-168*f.zoom}:b;
 const clears=b=>occlusions.every(o=>{
  if(o.kind==='control'&&f.controlOverlay!=='soft')return true;
  return !overlap(o.kind==='control'?protectedBounds(b):b,o);
 });
 const projected=actors.map(a=>bounds(f,a)),inside=b=>b.left>=safeRect.left-1e-5&&b.right<=safeRect.right+1e-5&&b.top>=safeRect.top-1e-5&&b.bottom<=safeRect.bottom+1e-5;
 const pairSafe=projected.every(b=>inside(b)&&clears(b)),playerOnly=close||f.playerFixedCamera||f.challengeCameraMode==='stable'||!pairSafe;
 for(const a of playerOnly?actors.slice(0,1):actors){const b=bounds(f,a);assert.ok(inside(b),'controlled fighter remains inside the measured safe area');for(const o of occlusions){if(o.kind==='control'&&f.controlOverlay!=='soft')continue;assert.equal(overlap(o.kind==='control'?protectedBounds(b):b,o),false,`standing head/collar or full-body proxy avoids ${o.kind}`);}}
}
function geometry(w,h){return {safeRect:{left:8,top:8,right:w-8,bottom:h-8},occlusions:[{kind:'hud',left:8,top:8,right:w-8,bottom:Math.min(120,h*.23)},{kind:'control',left:8,top:h-130,right:w*.27,bottom:h-8},{kind:'control',left:w*.65,top:h-154,right:w-8,bottom:h-8}]};}
test('shared camera moves into upper blank space before reducing preferred character size',()=>{
 assert.equal(typeof shared.fitChallengeCamera,'function','shared safety camera is implemented');
 const preferred={width:390,height:844,x:480,y:100,zoom:.8},actors=[actor(450),actor(510)],g={safeRect:{left:0,top:0,right:390,bottom:844},occlusions:[{kind:'control',left:0,top:640,right:390,bottom:844}]};
 const f=shared.fitChallengeCamera(preferred,actors,null,16.7,g);assert.equal(f.zoom,.8);assert.ok(f.y>preferred.y);fits(f,actors,g.safeRect,g.occlusions);
});
test('shared camera uses the actual free lane instead of excluding entire control rows',()=>{
 assert.equal(typeof shared.fitChallengeCamera,'function');
 const preferred={width:844,height:390,x:480,y:300,zoom:.7},actors=[actor(480)],g={safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[{kind:'hud',left:0,top:0,right:844,bottom:110},{kind:'stick',left:0,top:220,right:160,bottom:390},{kind:'actions',left:620,top:190,right:844,bottom:390}]};
 const f=shared.fitChallengeCamera(preferred,actors,null,16.7,g);assert.equal(f.zoom,.7);fits(f,actors,g.safeRect,g.occlusions);
});
test('street subjects exclude distant crowds/projectiles and include nearby threats and active assists',()=>{
 assert.equal(typeof shared.challengeCameraSubjects,'function');
 const p=actor(1000),near=actor(1240),far=actor(2300),helper=actor(930),world={player:p,enemy:near,enemies:[near,far],assists:[{phase:'attack',actor:helper},{phase:'attack',actor:actor(3000)}],projectiles:[{x:5000,y:-1000}]};
 assert.deepEqual(shared.challengeCameraSubjects(world,{route:true}),[p,near,helper]);
 assert.deepEqual(shared.challengeCameraSubjects(world,{route:false}),[p,near,helper]);
});
for(const [w,h,touch] of [[1280,720,false],[390,844,true],[844,390,true],[568,320,true],[320,568,true]])for(const mode of ['classic','stable'])test(`all chapter cameras keep the controlled player within measured safety at ${w}x${h} ${mode}`,()=>{
 const g=geometry(w,h),p=actor(436),enemy=actor(524),world={player:p,enemy,enemies:[enemy,actor(3300)],worldWidth:3600,assists:[]},opts={...g,touch,portrait:w<h,nativeLandscape:w>h,camera:mode,cameraMode:mode};
 let main=null,route=null,laterRoute=null,laterBoss=null;const adapterRoute=createMobileCameraAdapter(),adapterBoss=createMobileCameraAdapter();
 for(const [x,y,depth] of [[524,430,0],[860,430,0],[524,53,100],[524,-82,-90],[524,430,0]]){
  enemy.x=x;p.y=y;p.depth=depth;const required=[p,...(Math.abs(enemy.x-p.x)<=560?[enemy]:[])];
  main=fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,w,h,[p,enemy],main,16.7,opts);fits(main,[p,enemy],g.safeRect,g.occlusions);
  route=depthRouteCameraFrame(w,h,world,{...opts,fullStage:true,previous:route});fits(route,required,g.safeRect,g.occlusions,touch&&(w<h||mode==='classic'));
  for(const [adapter,isRoute] of [[adapterRoute,true],[adapterBoss,false]]){const next=adapter.frame({zoom:.8,left:0,base:h*.8},world,{width:w,height:h,...opts,route:isRoute});assert.ok(next.cameraFrame,'every orientation uses shared safety');fits(next.cameraFrame,isRoute?required:[p,enemy],g.safeRect,g.occlusions,isRoute&&touch&&(w<h||mode==='classic'));if(isRoute)laterRoute=next;else laterBoss=next;}
 }
});
test('pause freezes main street and later chapters until a real resize',()=>{
 const p=actor(430),enemy=actor(600),world={player:p,enemy,enemies:[enemy],worldWidth:3000},options={...geometry(390,844),fullStage:true,touch:true,portrait:true,camera:'classic'};
 const f=depthRouteCameraFrame(390,844,world,options);p.y=54;
 assert.deepEqual(depthRouteCameraFrame(390,844,world,{...options,previous:f,paused:true}),f);
 const adapter=createMobileCameraAdapter(),first=adapter.frame({zoom:.8,left:0,base:675},world,{...options,width:390,height:844,route:true});p.x=900;
 const frozen=adapter.frame({zoom:.3,left:300,base:500},world,{...options,width:390,height:844,route:true,paused:true,camera:'stable'});assert.deepEqual(frozen,first);
 const resized=adapter.frame({zoom:.3,left:300,base:500},world,{...options,...geometry(844,390),width:844,height:390,portrait:false,route:true,paused:true});assert.notEqual(resized.cameraFrame.width,first.cameraFrame.width);
});
test('desktop preferred composition is exact when measured UI does not block it',()=>{
 const p=actor(436),enemy=actor(524),world={player:p,enemy},adapter=createMobileCameraAdapter(),legacy={zoom:.8,left:-300,base:570};
 const result=adapter.frame(legacy,world,{width:1280,height:720,touch:false,portrait:false,camera:'classic',safeRect:{left:0,top:0,right:1280,bottom:720},occlusions:[]});
 assert.equal(result.zoom,legacy.zoom);assert.equal(result.left,legacy.left);assert.equal(result.base,legacy.base);
});
test('dynamic and stable use different movement cadence with identical safety',()=>{
 assert.equal(typeof shared.fitChallengeCamera,'function');
 const actors=[actor(480)],g={safeRect:{left:0,top:0,right:1280,bottom:720},occlusions:[]},a={width:1280,height:720,x:480,y:240,zoom:1};
 const dynamic=shared.fitChallengeCamera(a,actors,null,16.7,{...g,cameraMode:'classic'}),stable=shared.fitChallengeCamera(a,actors,null,16.7,{...g,cameraMode:'stable'}),b={...a,x:560};
 const nextDynamic=shared.fitChallengeCamera(b,actors,dynamic,16.7,{...g,cameraMode:'classic'}),nextStable=shared.fitChallengeCamera(b,actors,stable,16.7,{...g,cameraMode:'stable'});
 assert.ok(nextDynamic.x>dynamic.x);assert.equal(nextStable.x,stable.x);fits(nextDynamic,actors,g.safeRect,g.occlusions);fits(nextStable,actors,g.safeRect,g.occlusions);
});
test('main chapter tries resting character scale before zooming for a jump',()=>{
 const g={safeRect:{left:0,top:0,right:390,bottom:844},occlusions:[{kind:'control',left:0,top:740,right:390,bottom:844}]};
 for(const route of [false,true])for(const mode of ['classic','stable']){
  const p=actor(436),enemy=actor(524),world={player:p,enemy,enemies:[enemy],worldWidth:3600},options={...g,fullStage:true,touch:true,portrait:true,camera:mode,cameraMode:mode};
  const frame=()=>route?depthRouteCameraFrame(390,844,world,options):fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,390,844,[p,enemy],null,16.7,options);
  const rest=frame();p.y=160;const jump=frame();assert.equal(jump.zoom,rest.zoom,'free upper area absorbs this jump at preferred scale');fits(jump,[p,enemy],g.safeRect,g.occlusions,route);
 }
});
test('rising velocity keeps stable player framing fixed and dynamic framing safe',async()=>{
 const {Duel}=await import('../dist/core.mjs');
 for(const mode of ['classic','stable'])for(const constrained of [false,true]){
  const duel=new Duel('wang','easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'});duel.player.x=430;duel.enemy.x=580;duel.nextItemAt=Infinity;
  const options={...(constrained?{safeRect:{left:0,top:110,right:844,bottom:324},occlusions:[]}:geometry(844,390)),touch:true,portrait:false,nativeLandscape:true,cameraMode:mode};
  let f=fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,844,390,[duel.player,duel.enemy],null,16.7,options);
  duel.press('jump');for(let i=0;i<140;i++){duel.step(1/120,{});const next=fullStageCameraFrame(mode==='stable'?fixedStableCameraFrame:cameraFrame,844,390,[duel.player,duel.enemy],f,1000/120,options);if(mode==='stable'){assert.equal(next.zoom,f.zoom,'stable mode keeps the controlled actor at a fixed scale');fits(next,[duel.player],options.safeRect,options.occlusions);}else{assert.ok(Math.abs(next.zoom-f.zoom)/f.zoom<.05,'dynamic zoom eases gradually');fits(next,[duel.player],options.safeRect,options.occlusions);}f=next;}
 }
});
test('measured logical safe area is authoritative and physical insets are not consumed twice',()=>{
 const world={player:actor(436),enemy:actor(524),enemies:[actor(524)],worldWidth:3600},options={...geometry(844,390),fullStage:true,touch:true,portrait:false,landscapePreview:true,camera:'classic'};
 const once=depthRouteCameraFrame(844,390,world,options),physical=depthRouteCameraFrame(844,390,world,{...options,safe:{left:40,right:40,top:12,bottom:34}});
 for(const key of ['x','y','zoom'])assert.equal(physical[key],once[key]);
});
