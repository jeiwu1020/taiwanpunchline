import {backgroundPresentation} from '../../background-cache-policy.mjs?v=campaign-boot-20261112-r3';
import {fitChallengeCamera,controlledCombatCameraFrame,challengeCameraSubjects,challengeCameraPlan,canReuseCameraFrame,streetPlayerCameraFrame,streetCameraFrozenSnapshot,requireStreetCameraFrame} from '../../challenge-camera.mjs?v=pair-center-20261115-r1';
import {stageInsets} from '../../combat-presentation.mjs?v=pair-center-20261115-r1';
// The chapter renderer supplies its preferred composition. Keep that exact
// desktop size/placement when safe, and apply the same camera in every profile.
export function createMobileCameraAdapter(){
 let previous=null,lastWorld=null,lastResult=null;
 return {reset(){previous=null;lastWorld=null;lastResult=null;},frame(legacyFrame,world,options={}){
  const {width,height,camera='classic',route=false,delta=1000/60}=options;
  const presentation=backgroundPresentation(width,height,options);
  if(!world?.player||!width||!height)return {...legacyFrame,presentation};
  if(world!==lastWorld){previous=null;lastResult=null;}
  const paused=options.paused||world.status==='paused',measured=Array.isArray(options.occlusions);
  const close=streetPlayerCameraFrame(width,height,world,{...options,route,previous,paused});
  if(close){requireStreetCameraFrame(close);previous=close;lastWorld=world;lastResult={...legacyFrame,presentation,backdropScene:world,backdropZoom:close.backdropZoom,backdropTop:close.backdropTop,backdropBottom:close.backdropBottom,zoom:close.zoom,left:close.x-width/(2*close.zoom),base:close.base,cameraFrame:close};return lastResult;}
  const frozen=streetCameraFrozenSnapshot(previous,width,height,{...options,route,paused});
  const cameraWorld=frozen?{...world,player:{...world.player,...frozen}}:world;
  if(previous?.playerCloseCamera){previous=null;lastResult=null;}
  if(frozen)options={...options,cameraMode:'stable',camera:'stable'};
  if(paused&&canReuseCameraFrame(previous,width,height,{...options,measuredCameraSafety:measured?options.measuredCameraSafety:false})){lastResult={...lastResult,presentation};return lastResult;}
  const preferred={...legacyFrame,width,height,x:legacyFrame.left+width/(2*legacyFrame.zoom),y:430+(height/2-legacyFrame.base)/legacyFrame.zoom};
  const inset=stageInsets(width,height,options);
  const safety=measured?options:{...options,measuredCameraSafety:false,safeRect:{left:0,top:Math.max(inset.top,options.hudBottom||0),right:width,bottom:height-inset.bottom},occlusions:[]};
  const plan=challengeCameraPlan(cameraWorld,{route,previous,delta});
  const frame=route?fitChallengeCamera(preferred,plan.subjects,previous,delta,{...safety,cameraMode:frozen?'stable':camera,paused,cameraPlan:plan}):controlledCombatCameraFrame(width,height,[cameraWorld.player,cameraWorld.enemy],previous,delta,{...safety,cameraMode:camera,paused});
  previous=frame;lastWorld=world;
  lastResult={...legacyFrame,presentation,backdropScene:world,backdropZoom:Math.max(legacyFrame.zoom,frame.backdropZoom||frame.zoom,lastResult?.cameraFrame?.width===width&&lastResult?.cameraFrame?.height===height?lastResult.backdropZoom||0:0),zoom:frame.zoom,left:frame.x-width/(2*frame.zoom),base:height/2+(430-frame.y)*frame.zoom,cameraFrame:frame};
  return lastResult;
 }};
}
