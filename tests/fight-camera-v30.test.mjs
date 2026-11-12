import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame,stableCameraFrame,backgroundFrame} from '../dist/arena-presentation.mjs';

const standing=[{x:436,y:430},{x:524,y:430}];
const cameras=[cameraFrame,stableCameraFrame];
const viewports=[[160,80],[160,120],[568,120],[568,148],[160,150],[298,180],[320,220],[568,180],[640,260],[800,330],[1180,550],[1440,800],[370,575]];
function assertBodiesFit(frame,fighters,label=''){
 const {width:w,height:h,zoom:z,x,y}=frame;
 for(const fighter of fighters){
  assert.ok(w/2+(fighter.x-130-x)*z>=0,`${label}: left art edge`);
  assert.ok(w/2+(fighter.x+130-x)*z<=w,`${label}: right art edge`);
  assert.ok(h/2+(fighter.y-285-y)*z>=0,`${label}: head`);
 }
 assert.ok(h/2+(458-y)*z<=h-8,`${label}: feet and floor`);
}
function assertBackdropFits(frame,backdrop){
 const {width:w,height:h,zoom:z,x,y}=frame;
 assert.ok(backdrop.x-backdrop.width/2<=x-w/2/z);
 assert.ok(backdrop.x+backdrop.width/2>=x+w/2/z);
 assert.ok(backdrop.top<=y-h/2/z);
 assert.ok(backdrop.bottom>=y+h/2/z);
}

test('fight-only canvas reserves no second HUD strip',()=>{
 for(const camera of cameras)for(const [w,h] of viewports){
  const frame=camera(w,h,standing);
  assert.equal(frame.hud,0,`${camera.name} ${w}x${h}`);
 }
});

test('short fight canvases use their actual size and can zoom below the inherited floor',()=>{
 const fighters=[{x:68,y:160},{x:892,y:430}];
 for(const camera of cameras)for(const [w,h] of [[160,80],[568,120],[568,148],[160,60]]){
  const frame=camera(w,h,fighters);
  assert.equal(frame.width,w);
  assert.equal(frame.height,h);
  assertBodiesFit(frame,fighters,`${camera.name} actual ${w}x${h}`);
  assertBackdropFits(frame,backgroundFrame(w,h,frame));
  if(h===60)assert.ok(frame.zoom<.08,'a zoom floor must not crop a very short canvas');
 }
});

test('short close-up fights reclaim the old HUD space for visibly larger fighters',()=>{
 // Hand-recorded V29 frames for an 88-unit gap, before moving HUD out of canvas.
 for(const [camera,w,h,oldZoom] of [
  [cameraFrame,320,220,.3865814696485623],
  [cameraFrame,640,260,.5143769968051118],
  [cameraFrame,800,330,.6129032258064516],
  [stableCameraFrame,640,260,.4952076677316294],
  [stableCameraFrame,800,330,.6677316293929713]
 ]){
  const frame=camera(w,h,standing);
  assert.ok(frame.zoom>oldZoom*1.25,`${camera.name} ${w}x${h} should grow at least 25%`);
  assertBodiesFit(frame,standing);
 }
});

test('both complete fighter envelopes fit immediately during near, far, edge and jump changes',()=>{
 const positions=[
  standing,[{x:68,y:430},{x:152,y:430}],[{x:68,y:430},{x:892,y:430}],
  [{x:68,y:160},{x:892,y:430}],[{x:808,y:160},{x:892,y:160}],
  [{x:808,y:430},{x:892,y:430}],standing
 ];
 for(const camera of cameras)for(const [w,h] of viewports){
  let frame;
  for(const fighters of positions)for(let tick=0;tick<8;tick++){
   frame=camera(w,h,fighters,frame);
   assertBodiesFit(frame,fighters,`${camera.name} ${w}x${h}`);
  }
 }
});

test('classic camera retains midpoint following and frame-rate-independent 12 percent zoom recovery',()=>{
 const far=[{x:68,y:430},{x:892,y:430}],near=[{x:68,y:430},{x:156,y:430}];
 const old=cameraFrame(640,260,far),target=cameraFrame(640,260,near);
 assert.ok(target.zoom>old.zoom);
 const next=cameraFrame(640,260,near,old);
 assert.equal(next.x,112);
 assert.ok(Math.abs(next.zoom-(old.zoom+(target.zoom-old.zoom)*.12))<1e-12);
 const half=cameraFrame(640,260,near,old,1000/120);
 const twice=cameraFrame(640,260,near,half,1000/120);
 assert.ok(Math.abs(twice.zoom-next.zoom)<1e-12);
});

test('background remains fixed in world space and covers every fitted camera frame',()=>{
 for(const camera of cameras)for(const [w,h] of viewports){
  let frame=camera(w,h,standing);
  const backdrop=backgroundFrame(w,h,frame);
  for(const [x1,x2] of [[68,152],[68,892],[808,892]])for(const [y1,y2] of [[430,430],[160,430],[160,160]])for(let tick=0;tick<30;tick++){
   frame=camera(w,h,[{x:x1,y:y1},{x:x2,y:y2}],frame);
   assert.deepEqual(backgroundFrame(w,h,frame),backdrop);
   assertBackdropFits(frame,backdrop);
  }
 }
});
