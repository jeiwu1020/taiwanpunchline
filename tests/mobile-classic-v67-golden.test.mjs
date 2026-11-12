// Read-only replay of the independently captured clean #67 oracle. Never regenerate from this candidate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cameraFrame} from '../dist/arena-presentation.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
import {createMobileCameraAdapter} from '../dist/preview/campaign/mobile-camera-adapter.mjs';
import {streetTrialFrame} from '../dist/preview/chapter2/street-trial-view.mjs';
const bytes=readFileSync(new URL('./fixtures/mobile-classic-v67-golden.json',import.meta.url));
const golden=JSON.parse(bytes);
const preservation=JSON.parse(readFileSync(new URL('./fixtures/street-close-preservation-v68.json',import.meta.url)));
const select=(value,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
const frameKeys=['x','y','zoom','width','height','base','jumpPan','backdropZoom','backdropTop','backdropBottom','challengeCameraMode','cameraSafetyFit','controlOverlay'];
const pose=(x,y=430,depth=0,vy=0)=>({x,y,depth,vy,hp:100,supportY:430});
function legacyFrame(path,p,e,profile){
 const {width:w,height:h}=profile;
 if(path.endsWith('street'))return streetTrialFrame({width:w,height:h,portrait:false,player:p,worldWidth:3600});
 const z=Math.max(.3,Math.min(w/1060,(h-115)/390,w/(Math.abs(e.x-p.x)+340)));
 return {zoom:z,left:Math.max(0,Math.min(960-w/z,(p.x+e.x)/2-w/z/2)),base:h-115};
}
function run(path,profile,input){
 const route=path.endsWith('street'),adapter=createMobileCameraAdapter(),player=pose(450),enemy=pose(510);
 const world={player,enemy,enemies:[enemy],worldWidth:3600,section:{spawns:[]},spawned:new Set(),assists:[],status:'active'};
 let previous=null;
 return input.map(s=>{
  Object.assign(player,s.player);Object.assign(enemy,s.enemy);world.assists=s.assist?[structuredClone(s.assist)]:[];
  const {width,height,rotation}=profile,options={...profile.geometry,width,height,touch:true,portrait:false,nativeLandscape:rotation===0,landscapePreview:rotation===0,rotation,camera:'classic',cameraMode:'classic',fullStage:true,route,delta:1000/60,assists:world.assists};
  const legacy=legacyFrame(path,player,enemy,profile);
  const result=path==='main-vs'?fullStageCameraFrame(cameraFrame,width,height,[player,enemy],previous,options.delta,options):path==='main-street'?depthRouteCameraFrame(width,height,world,{...options,previous}):adapter.frame(legacy,world,options);
  const frame=result.cameraFrame||result;previous=frame;
  return {closeState:frame.playerCloseCamera??null,frame:select(frame,frameKeys),...(result.cameraFrame?{adapter:select(result,['zoom','left','base','backdropZoom'])}:{})};
 });
}

function equalCaptured(actual,expected,label){
 assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),label+' fields');
 for(const [key,value]of Object.entries(expected)){
  const name=label+'.'+key;
  if(typeof value==='number')assert.ok(Number.isFinite(actual[key])&&Math.abs(actual[key]-value)<=1e-10,`${name}: ${actual[key]} !== ${value}`);
  else if(value&&typeof value==='object')equalCaptured(actual[key],value,name);
  else assert.equal(actual[key],value,name);
 }
}
test('classic oracle is the unchanged independently captured #67 artifact',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'584959896ba56b775dce542f500492d690906d9cbf1af2667f6a3c021db48df6');
 assert.equal(golden.baselineCommit,'806f00c3f16d51708c7bd52f4da8ca57825f7b89');
 assert.equal(golden.scenarios.length,108);assert.equal(golden.scenarios.reduce((n,s)=>n+s.steps.length,0),1536);
});
for(const scenario of golden.scenarios)test((scenario.path.endsWith('street')?'close street replays historical inputs ':'classic #67 unchanged ')+scenario.name,()=>{
 const profile=golden.profiles[scenario.profile],actual=run(scenario.path,profile,scenario.steps),close=scenario.path==='main-street'||scenario.path==='later-street';
 assert.equal(actual.length,scenario.expected.length);
 actual.forEach(({closeState, ...capture},index)=>{
  if(!close){assert.equal(closeState,null,'VS/Boss/practice never acquire street ownership');equalCaptured(capture,scenario.expected[index],scenario.name+' frame '+index);return;}
  assert.ok(closeState,'measured classic phone street must use close ownership');
  const f=capture.frame,p=scenario.steps[index].player,g=profile.geometry,r=g.safeRect,baseline=preservation.landscapeStableZoom[profile.width===568?'small':'native'];
  assert.equal(f.cameraSafetyFit,true);assert.equal(f.controlOverlay,'soft');
  assert.ok(f.zoom>=baseline*.9-1e-9&&f.zoom<=baseline+1e-9,'classic may pull back at most10% from independently captured #68 stable');
  assert.equal(f.zoom,actual[0].frame.zoom,'mobs, assists, jumps and travel never shrink the player');
  const x=f.width/2+(p.x-f.x)*f.zoom,y=f.height/2+(p.y+(p.depth||0)*.65-f.y)*f.zoom,b={left:x-132*f.zoom,right:x+132*f.zoom,top:y-300*f.zoom,bottom:y+28*f.zoom};
  assert.ok(b.left>=r.left-1e-6&&b.right<=r.right+1e-6&&b.top>=r.top-1e-6&&b.bottom<=r.bottom+1e-6,'whole controlled player remains inside measured content');
  for(const o of g.occlusions){const pad=g.occlusionPadding??6,left=Math.max(r.left,o.left-pad),right=Math.min(r.right,o.right+pad),top=Math.max(r.top,o.top-pad),bottom=Math.min(r.bottom,o.bottom+pad),protectedBottom=o.kind==='control'?b.bottom-168*f.zoom:b.bottom;if(left>=right||top>=bottom)continue;assert.ok(!(b.left<right-1e-6&&b.right>left+1e-6&&b.top<bottom-1e-6&&protectedBottom>top+1e-6),'player clears padded hard HUD and standing-head control protection');}
  assert.equal(f.backdropTop,f.y-f.height/(2*f.zoom));assert.equal(f.backdropBottom,f.y+f.height/(2*f.zoom));assert.ok(f.backdropZoom>=f.zoom);
  if(capture.adapter){assert.equal(capture.adapter.zoom,f.zoom);assert.equal(capture.adapter.left,f.x-f.width/(2*f.zoom));assert.equal(capture.adapter.base,f.base);assert.equal(capture.adapter.backdropZoom,f.backdropZoom);}
 });
});
