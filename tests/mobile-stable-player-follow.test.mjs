import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitChallengeCamera,canReuseCameraFrame} from '../dist/challenge-camera.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
const measured=JSON.parse(readFileSync(new URL('./fixtures/shared-camera-measured-nov11.json',import.meta.url))).profiles;
const small=JSON.parse(readFileSync(new URL('./fixtures/mobile-landscape-low-pose-geometry.json',import.meta.url))).profiles;
const profiles=[
 ['native-vs',844,390,measured['native-vs'].cameraSafety,.8085365853658538,422,365.56097560975616],
 ['rotated-vs',844,390,measured['rotated-vs'].cameraSafety,.8085365853658538,422,365.56097560975616],
 ['native-street',844,390,measured['native-street'].cameraSafety,.8085365853658538,422,351.56097560975616],
 ['rotated-street',844,390,measured['rotated-street'].cameraSafety,.8085365853658538,422,354.56097560975616],
 ['native568-vs',568,320,small['native568-vs'],.4875000002907543,156.64999993836008,264.2500000872263],
 ['native568-street',568,320,small['native568-street'],.5437500001817215,144.72499996147505,272.125000025441]
];
const p=(x=450)=>({x,y:430,depth:0,hp:100});
const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-7,`${message}: ${actual} vs ${expected}`);
const shown=f=>({x:f.width/2+(f.playerFixedCamera.pose.x-f.x)*f.zoom,y:f.height/2+(f.playerFixedCamera.pose.displayY-f.y)*f.zoom});
function fit(player,previous=null,delta=1000/60,profile=profiles[0],extra={}){const [,width,height,g]=profile;return fitChallengeCamera({width,height,x:450,y:300,zoom:.3},[player,p(940)],previous,delta,{...g,touch:true,cameraMode:'stable',...extra});}
function safe(f,g){
 assert.equal(f.cameraSafetyFit,true);const {x,y}=shown(f),z=f.zoom,r=g.safeRect,body={left:x-132*z,right:x+132*z,top:y-300*z,bottom:y+28*z};
 assert.ok(body.left>=r.left-1e-6&&body.right<=r.right+1e-6&&body.top>=r.top-1e-6&&body.bottom<=r.bottom+1e-6,'true body stays within safe bounds');
 for(const o of g.occlusions){const a=o.kind==='control'?{...body,bottom:y-140*z}:body,b={left:Math.max(r.left,o.left-(g.occlusionPadding??6)),right:Math.min(r.right,o.right+(g.occlusionPadding??6)),top:Math.max(r.top,o.top-(g.occlusionPadding??6)),bottom:Math.min(r.bottom,o.bottom+(g.occlusionPadding??6))};if(b.left>=b.right||b.top>=b.bottom)continue;assert.ok(!(a.left<b.right-1e-6&&a.right>b.left+1e-6&&a.top<b.bottom-1e-6&&a.bottom>b.top+1e-6),'full body avoids HUD; standing head/collar avoids controls');}
 close(y,f.playerFixedCamera.anchor.y,'vertical target exact');
}
// These constants come from the independently recorded geometry proof, not
// product outputs regenerated after the patch. Reverting reserve or rate fails.
for(const profile of profiles)test(`reserved geometry and bounded horizontal follow ${profile[0]}`,()=>{
 const [name,,,g,z,ax,ay]=profile,player=p(),initial=fit(player,null,undefined,profile);
 assert.equal(initial.zoom,z);assert.deepEqual(initial.playerFixedCamera.anchor,{x:ax,y:ay});assert.equal(initial.playerFixedCamera.version,2);
 assert.deepEqual(initial.playerFixedCamera.follow,{left:ax-80*z,right:ax+80*z,clamped:false});
 for(const sign of [-1,1]){
  const moved=p(450+sign*75);let f=fit(moved,initial,1000/60,profile);close((f.x-initial.x)*z,sign*8,'bounded correction');assert.equal(f.playerFixedCamera.follow.clamped,false);safe(f,g);
  assert.ok(Math.abs(shown(f).x-ax)>1,'actual player deliberately differs from resting target');
  let steps=0;
  while(Math.abs(shown(f).x-ax)>1e-7&&steps++<20){const next=fit(moved,f,1000/60,profile);assert.equal(next.zoom,z);assert.deepEqual(next.playerFixedCamera.anchor,initial.playerFixedCamera.anchor);assert.equal(next.playerFixedCamera.follow.clamped,false);assert.ok(Math.abs(next.x-f.x)*z<=8+1e-7);assert.ok(Math.abs(shown(next).x-ax)<Math.abs(shown(f).x-ax));safe(next,g);f=next;}
  assert.ok(steps<20);close(shown(f).x,ax,'stopped player settles to target');assert.equal(fit(moved,f,1000/60,profile).x,f.x);
  const teleported=p(450+sign*250),far=fit(teleported,initial,1000/60,profile),edge=sign<0?ax-80*z:ax+80*z;
  assert.equal(far.zoom,z);assert.equal(far.playerFixedCamera.follow.clamped,true);close(shown(far).x,edge,'mandatory nearest safety edge');close((far.x-initial.x)*z,sign*170*z,'minimum beyond-reserve correction');assert.ok(Math.abs(far.x-initial.x)*z>8);safe(far,g);
 }
});
for(const delta of [0,-30,NaN,Infinity,-Infinity,undefined,1000/30,1000/60,1000/120,1000,50])test(`horizontal time budget has explicit boundaries ${String(delta)}`,()=>{
 const first=fit(p()),expected=480*Math.min(50,Math.max(0,Number.isFinite(delta)?delta:1000/60))/1000;
 for(const sign of [-1,1]){const next=fit(p(450+sign*75),first,delta);close((next.x-first.x)*first.zoom,sign*expected,'delta budget');assert.equal(next.playerFixedCamera.follow.clamped,false);assert.equal(next.zoom,first.zoom);}
});
test('subbudget motion stays at target; vertical follows exactly without a 2D rate limit',()=>{
 const first=fit(p()),player={...p(452),y:54,depth:90},next=fit(player,first);close(next.x-first.x,2,'ordinary follow');close(next.y-first.y,54+90*.65-430,'exact vertical follow');close(shown(next).x,next.playerFixedCamera.anchor.x,'resting target');
});
test('enemy, forecast, pose and attack changes cannot select a settling path',()=>{
 const first=fit(p()),player=p(525),a=fit(player,first);let b=a;
 for(let i=0;i<20;i++){
  const dims={width:844,height:390,x:Math.sin(i)*8000,y:i*99,zoom:1.4},g=profiles[0][3];
  const alternate=fitChallengeCamera(dims,[{...player,vy:-900,supportY:100,attack:{age:i},assist:{helper:'han',charge:i}},p(i*1000)],b,1000/60,{...g,touch:true,cameraMode:'stable',cameraPlan:{anticipated:[p(-9000)]}});
  const reference=fit(player,b);for(const key of ['x','y','zoom','playerFixedCamera'])assert.deepEqual(alternate[key],reference[key]);b=reference;
 }
});
test('stale or nonfinite fixed state cannot freeze or seed active history',()=>{
 const first=fit(p()),g=profiles[0][3],options={...g,touch:true,cameraMode:'stable'};
 const mutations=[f=>f.playerFixedCamera.version=1,f=>f.playerFixedCamera.geometryKey=JSON.stringify([1]),f=>f.x=NaN,f=>f.y=Infinity,f=>f.zoom=NaN,f=>f.playerFixedCamera.zoom=0,f=>f.playerFixedCamera.pose.x=NaN,f=>f.playerFixedCamera.pose.displayY=Infinity,f=>f.playerFixedCamera.anchor.x=NaN,f=>f.playerFixedCamera.follow.left=Infinity,f=>f.playerFixedCamera.follow.right=NaN];
 for(const mutate of mutations){const old=structuredClone(first);old.playerFixedCamera.follow??={left:357.3170731707317,right:486.6829268292683,clamped:false};mutate(old);assert.equal(canReuseCameraFrame(old,844,390,options),false);const next=fit(p(525),old);close(shown(next).x,next.playerFixedCamera.anchor.x,'incompatible history reinitializes');assert.equal(next.playerFixedCamera.version,2);assert.equal(next.playerFixedCamera.follow.clamped,false);const frozen=fit(p(525),old,0,profiles[0],{paused:true});assert.notEqual(frozen,old);assert.ok(Number.isFinite(frozen.x)&&Number.isFinite(frozen.y));}
});
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('actual main street seed 0x671100 preserves physical correction but bounds 960 horizontal frames',()=>{
 const seed=0x671100,world=new ChallengeDepthRoute('wang','beginner',rng(seed),{section:0,playerAssist:'han'}),inputRng=rng(seed^0xabcd),g=profiles[2][3],adapter=createMobileCameraAdapter();let sign=-1,previous=null,first,maxPanX=0,overrides=0,spike,previousHp;
 for(let i=0;i<960;i++){
  assert.equal(world.status,'active');if(i%180===0)sign=-sign;
  const input={left:sign<0,right:sign>0,up:i%240<60,down:i%240>=120&&i%240<180},actions=[];
  if(i===0||i===480)actions.push('assist');if(i%120===15)actions.push('jump');if(i>180&&i%37===20)actions.push(inputRng()<.3?'special1':'punch');for(const action of actions)world.press(action);world.step(1/60,input);
  const options={...g,width:844,height:390,touch:true,portrait:false,fullStage:true,nativeLandscape:true,camera:'stable',cameraMode:'stable',route:true,delta:1000/60},f=depthRouteCameraFrame(844,390,world,{...options,previous}),later=adapter.frame({zoom:.3,left:0,base:275},world,options).cameraFrame;
  first??=f;assert.equal(f.zoom,first.zoom);assert.deepEqual(f.playerFixedCamera.anchor,first.playerFixedCamera.anchor);for(const key of ['x','y','zoom','playerFixedCamera'])assert.deepEqual(later[key],f[key]);safe(f,g);if(f.playerFixedCamera.follow?.clamped)overrides++;
  if(previous){const pan=Math.abs(f.x-previous.x)*f.zoom;maxPanX=Math.max(maxPanX,pan);if(i===825){close(previous.playerFixedCamera.pose.x,192.28,'recorded pre-collision x');close(world.player.x,117.33333333333333,'unchanged physical collision correction');close(pan,8,'known frame825 pan');assert.equal(world.player.hp,previousHp,'collision correction has no HP change');spike={beforeX:previous.playerFixedCamera.pose.x,x:world.player.x,hp:world.player.hp,panX:pan,scale:f.zoom,clamped:f.playerFixedCamera.follow.clamped};}}
  previous=f;previousHp=world.player.hp;
 }
 assert.ok(maxPanX<=8+1e-7);assert.equal(overrides,0);assert.equal(spike.clamped,false);console.log('FIXED_FOLLOW_REAL_TRACE',JSON.stringify({seed,frames:960,maxPanX,overrides,spike}));
});

for(const sign of [-1,1])test(`active same-size geometry rebase retains bounded ${sign} history before safety clamp`,()=>{
 const bare=['bare',844,390,{safeRect:{left:0,top:0,right:844,bottom:390},occlusions:[]}],player=p(),first=fit(player,null,undefined,bare);player.x+=75*sign;const lag=fit(player,first,1000/60,bare);
 const reflow={safeRect:{left:1,top:0,right:843,bottom:390},occlusions:[]},next=fit(player,lag,1000/60,bare,reflow);close((next.x-lag.x)*next.zoom,8*sign,'active rebase spends only current delta');assert.equal(next.zoom,lag.zoom);assert.equal(next.playerFixedCamera.follow.clamped,false);
 const shifted={safeRect:{left:sign<0?350:0,top:0,right:sign<0?844:494,bottom:390},occlusions:[]},clamped=fit(player,next,0,bare,shifted),edge=sign<0?clamped.playerFixedCamera.follow.left:clamped.playerFixedCamera.follow.right;
 assert.equal(clamped.zoom,next.zoom);assert.equal(clamped.playerFixedCamera.follow.clamped,true);close(shown(clamped).x,edge,'zero elapsed time still enforces nearest safe edge');safe(clamped,shifted);
});
