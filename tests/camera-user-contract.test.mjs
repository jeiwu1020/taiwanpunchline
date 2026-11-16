import test from 'node:test';
import assert from 'node:assert/strict';
import {controlledCombatCameraFrame,fitChallengeCamera} from '../dist/challenge-camera.mjs';
import {cameraFrame,fixedStableCameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {routeCameraFrame} from '../dist/challenge-render.mjs';

const profiles=[
 {name:'desktop',width:1280,height:720,touch:false,portrait:false},
 {name:'mobile landscape',width:844,height:390,touch:true,portrait:false},
 {name:'mobile portrait',width:390,height:844,touch:true,portrait:true}
];
function options(profile,cameraMode){
 return {cameraMode,touch:profile.touch,portrait:profile.portrait,nativeLandscape:profile.touch&&!profile.portrait,
  measuredCameraSafety:false,safeRect:{left:12,top:48,right:profile.width-12,bottom:profile.height-48},occlusions:[]};
}
const fighter=(x,y=430)=>({x,y,supportY:430,depth:0});
function frame(profile,actors,cameraMode,previous=null,delta=16){
 return controlledCombatCameraFrame(profile.width,profile.height,actors,previous,delta,options(profile,cameraMode));
}

for(const profile of profiles)test(`stable camera keeps one scale through mode changes, jumps and player travel on ${profile.name}`,()=>{
 const near=[fighter(460),fighter(540)],stable=frame(profile,near,'stable');
 const far=[fighter(460),fighter(460+Math.max(450,profile.width*1.15))];
 const dynamic=frame(profile,far,'classic');
 let switched=frame(profile,far,'stable',dynamic),maxStep=0;
 for(let i=0;i<240;i++){const next=frame(profile,far,'stable',switched);maxStep=Math.max(maxStep,Math.abs(next.zoom-switched.zoom));switched=next;}
 assert.ok(Math.abs(switched.zoom-stable.zoom)<stable.zoom*.0001,`stable scale ${switched.zoom} should settle at canonical ${stable.zoom}`);
 assert.ok(maxStep<=stable.zoom*.025,'switching modes eases scale instead of cutting');
 const jumped=frame(profile,[fighter(460,130),far[1]],'stable',switched);
 assert.ok(Math.abs(jumped.zoom-switched.zoom)<stable.zoom*.00001,'jump height cannot change stable character size');
 let followed=jumped;
 for(let x=500;x<=1100;x+=100)followed=frame(profile,[fighter(x),far[1]],'stable',followed);
 assert.ok(Math.abs(followed.x-jumped.x)>80,'stable view should pan with the controlled fighter');
 const playerScreenX=profile.width/2+(1100-followed.x)*followed.zoom;
 assert.ok(playerScreenX>=12+132*followed.zoom-1&&playerScreenX<=profile.width-12-132*followed.zoom+1,
  'controlled fighter remains inside the safe play area');
});

for(const profile of profiles)test(`dynamic camera caps zoom travel and eases pair changes on ${profile.name}`,()=>{
 const baseline=frame(profile,[fighter(460),fighter(540)],'classic');let current=baseline;
 const zoomFloor=baseline.zoom*.88;
 for(let x=560;x<=460+Math.max(450,profile.width*1.15);x+=20){
  const next=frame(profile,[fighter(460),fighter(x)],'classic',current);
  assert.ok(next.zoom>=zoomFloor-1e-8,'dynamic view cannot shrink by more than the configured gentle range');
  assert.ok(Math.abs(next.zoom-current.zoom)<=baseline.zoom*.025+1e-8,'dynamic scale eases instead of jumping');
  current=next;
 }
});

for(const profile of profiles)test(`gameplay entry points keep stable framing steady on ${profile.name}`,()=>{
 const near=[fighter(460),fighter(540)],opts=options(profile,'stable');let frame=fullStageCameraFrame(fixedStableCameraFrame,profile.width,profile.height,near,null,16,opts),scale=frame.zoom;
 for(const y of [130,54,130,430]){near[0].y=y;const next=fullStageCameraFrame(fixedStableCameraFrame,profile.width,profile.height,near,frame,16,opts);assert.equal(next.zoom,scale,'main Boss camera does not scale with jump height');frame=next;}
 near[0].y=430;
 for(let x=500;x<=1100;x+=100){near[0].x=x;frame=fullStageCameraFrame(fixedStableCameraFrame,profile.width,profile.height,near,frame,16,opts);}
 const shown=profile.width/2+(near[0].x-frame.x)*frame.zoom;
 assert.ok(shown>=12+132*frame.zoom-1&&shown<=profile.width-12-132*frame.zoom+1,'main Boss camera keeps the controlled fighter in frame');
 assert.equal(frame.zoom,scale,'ordinary walking keeps stable size');

 const adapter=createMobileCameraAdapter(),world={player:fighter(460),enemy:fighter(540)},legacy={zoom:.8,left:0,base:profile.height*.8};
 const adapterOptions={...opts,width:profile.width,height:profile.height,route:false};
 let later=adapter.frame(legacy,world,{...adapterOptions,camera:'classic'}).cameraFrame;
 later=adapter.frame(legacy,world,{...adapterOptions,camera:'stable'}).cameraFrame;
 const laterScale=later.zoom;world.player.y=54;
 later=adapter.frame(legacy,world,{...adapterOptions,camera:'stable'}).cameraFrame;
 assert.equal(later.zoom,laterScale,'later-chapter Boss camera does not scale with jump height');
 world.player.y=430;
 for(let x=520;x<=1100;x+=100){world.player.x=x;later=adapter.frame(legacy,world,{...adapterOptions,camera:'stable'}).cameraFrame;}
 const laterShown=profile.width/2+(world.player.x-later.x)*later.zoom;
 assert.ok(laterShown>=12+132*later.zoom-1&&laterShown<=profile.width-12-132*later.zoom+1,'later Boss camera keeps the controlled fighter in frame');
 assert.equal(later.zoom,laterScale,'later Boss stable scale does not change while walking');
});

for(const profile of profiles.filter(p=>p.touch))test(`stable fight framing keeps the full player clear of touch controls on ${profile.name}`,()=>{
 const controls=[
  {kind:'control',left:8,top:profile.height-130,right:profile.width*.27,bottom:profile.height-8},
  {kind:'control',left:profile.width*.65,top:profile.height-154,right:profile.width-8,bottom:profile.height-8}
 ];
 const opts={...options(profile,'stable'),occlusions:controls},actors=[fighter(460),fighter(540)];
 const f=fullStageCameraFrame(fixedStableCameraFrame,profile.width,profile.height,actors,null,16,opts);
 const body={left:profile.width/2+(actors[0].x-132-f.x)*f.zoom,right:profile.width/2+(actors[0].x+132-f.x)*f.zoom,
  top:profile.height/2+(actors[0].y-300-f.y)*f.zoom,bottom:profile.height/2+(actors[0].y+28-f.y)*f.zoom};
 for(const control of controls)assert.equal(body.left<control.right&&body.right>control.left&&body.top<control.bottom&&body.bottom>control.top,false,'the whole controlled fighter remains clear of touch controls');
});

test('legacy street frames honor stable and dynamic camera modes without jump zoom',()=>{
 const width=390,height=844,route={player:fighter(500),worldWidth:2600,enemies:[fighter(1100)]};
 const safe={fullStage:true,touch:true,portrait:true,camera:'stable',previous:null};
 const stable=routeCameraFrame(width,height,route,safe);
 const dynamic=routeCameraFrame(width,height,route,{...safe,camera:'classic'});
 assert.equal(stable.challengeCameraMode,'stable');
 assert.equal(dynamic.challengeCameraMode,'classic');
 assert.equal(stable.zoom,dynamic.zoom,'the first frame of each mode uses the shared baseline');
 route.player.y=130;
 const jumped=routeCameraFrame(width,height,route,{...safe,previous:stable});
 assert.equal(jumped.zoom,stable.zoom,'jump height never changes street scale');
 let walked=stable;for(let i=0;i<20;i++)walked=routeCameraFrame(width,height,{...route,player:{...route.player,x:520+i*20}},{...safe,previous:walked});
 assert.ok(Math.abs(walked.x-stable.x)>100,'stable street framing follows the player');
});

test('later-chapter camera rebases when one world object switches from street to Boss',()=>{
 const adapter=createMobileCameraAdapter(),player=fighter(2400),enemy=fighter(2700),world={player,enemy,enemies:[enemy],worldWidth:3600};
 const profile=profiles[0],opts={...options(profile,'classic'),width:profile.width,height:profile.height,camera:'classic'};
 adapter.frame({zoom:.8,left:0,base:profile.height*.8},world,{...opts,route:true});
 player.x=1400;enemy.x=1550;
 const boss=adapter.frame({zoom:1.2,left:1475-profile.width/(2*1.2),base:profile.height*.8},world,{...opts,route:false});
 assert.ok(Math.abs(boss.cameraFrame.x-1475)<220,'Boss camera starts from the new fight composition instead of easing from the street');
});

for(const profile of profiles)test(`depth street stable view fixes zoom and follows player on ${profile.name}`,()=>{
 const player=fighter(460),actors=[player,fighter(540)];
 const opts={cameraMode:'stable',touch:profile.touch,portrait:profile.portrait,nativeLandscape:profile.touch&&!profile.portrait,
  measuredCameraSafety:false,safeRect:{left:12,top:48,right:profile.width-12,bottom:profile.height-48},occlusions:[]};
 const base={width:profile.width,height:profile.height,x:500,y:430,zoom:Math.min(1.2,profile.width/500,profile.height/500)};
 let current=fitChallengeCamera(base,actors,null,16,opts),scale=current.zoom;
 player.y=130;current=fitChallengeCamera(base,actors,current,16,opts);
 assert.equal(current.zoom,scale,'jump height cannot change stable street scale');
 for(const x of [560,660,760,860]){player.x=x;current=fitChallengeCamera(base,actors,current,16,opts);}
 assert.ok(Math.abs(current.x-500)>80,'stable street framing follows the player');
 assert.equal(current.zoom,scale,'walking does not change stable street scale');
});
