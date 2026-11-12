import {mountCameraDirectionHints} from './camera-direction-hints.mjs?v=workers-background-only-20261113-r1';
import {applyChallengeCameraLayout,applyCombatPresentationLayout,measureChallengeOcclusions,challengeLogicalRect} from './challenge-layout.mjs?v=workers-background-only-20261113-r1';
import {mainRouteMicPlan} from './challenge-depth-render.mjs?v=workers-background-only-20261113-r1';
import {flyingMicLayout,drawFlyingMic} from './preview/chapter2/flying-mic.mjs?v=workers-background-only-20261113-r1';

// These are display-space placements only. Combat and camera geometry stay unchanged.
export function feedbackPlacement({width,height,touch,portrait,specials,buttons,stick}){
 if(touch&&!portrait&&stick){
  const left=stick.right+12,right=Math.min(...buttons.map(r=>r.left))-12;
  if(right>left)return {left:(left+right)/2,bottom:10,width:right-left};
 }
 const top=Math.min(...specials.map(r=>r.top));
 return {left:width/2,bottom:height-top+8,width:Math.min(460,width-24)};
}
export function routeMicPlacement({width,height,hudBottom}){
 return {size:44,top:Math.ceil(hudBottom+8),right:6,width:64,height:64,visible:width>=88&&hudBottom+80<height};
}
export function mountCombatOverlayLayout({document,getCameraMode=()=>'classic',getCombatOwner=()=>null}){
 const win=document.defaultView,app=document.querySelector('.app'),banner=document.querySelector('#broadcast');
 const canvas=document.createElement('canvas');canvas.className='route-mic-overlay';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;app.append(canvas);
 const hints=mountCameraDirectionHints({document,root:app});
 const ctx=canvas.getContext('2d');let layout=null,stamp='',pending=0,cameraSafety={},measuredStructure='',measuredCanvas=null,measuredOwner=null,dirty=true;
 // Read only already-applied primitive state here, never computed style or a
 // DOM rectangle. Text, item status and pressed transforms are not structural.
 const structure=()=>JSON.stringify([getCameraMode(),...['gameMode','depthRoute','titleOpen','landscapePreview','touch','layout','rotation','fullBleed','compact','overlayControls','nativeLandscape','viewportEpoch','surfaceGeneration'].map(key=>app.dataset[key]),
  ...['width','height','transform','--challenge-width','--challenge-height','--challenge-center-x','--challenge-center-y','--challenge-rotation',...['top','right','bottom','left'].map(edge=>'--challenge-physical-safe-'+edge)].map(key=>app.style.getPropertyValue(key)),
  document.querySelector('#viewport-shell')?.style.cssText,win.devicePixelRatio,
  [...app.querySelectorAll('.screen')].map(el=>[el.id,el.className,el.hidden,el.style.display])]);
 function rect(el){
  const r=el.getBoundingClientRect(),a=app.getBoundingClientRect();
  return app.dataset.rotation==='90'?{left:r.top-a.top,right:r.bottom-a.top,top:a.right-r.right,bottom:a.right-r.left,width:r.height,height:r.width}:{left:r.left-a.left,right:r.right-a.left,top:r.top-a.top,bottom:r.bottom-a.top,width:r.width,height:r.height};
 }
 function refresh(){
  if(pending)win.cancelAnimationFrame(pending);pending=0;const width=app.clientWidth,height=app.clientHeight;if(!width||!height)return;
  applyCombatPresentationLayout(app);
  const style=win.getComputedStyle(app),physical=edge=>parseFloat(style.getPropertyValue('--challenge-physical-safe-'+edge))||0;
  const owner=getCombatOwner(),frame={width,height,touch:app.dataset.touch==='true',camera:getCameraMode(),route:app.dataset.depthRoute==='true',retainCombatLayout:!!owner,rotation:Number(app.dataset.rotation)||0,fullBleed:app.dataset.landscapePreview==='true',safeTop:physical('top'),safeRight:physical('right'),safeBottom:physical('bottom'),safeLeft:physical('left')};
  applyChallengeCameraLayout(app,frame);
  const specials=[...document.querySelectorAll('.specials button')].map(rect).filter(r=>r.width&&r.height);
  if(specials.length){
   const buttons=[...document.querySelectorAll('.control-deck button')].filter(b=>!b.closest('.movement')).map(rect).filter(r=>r.width&&r.height);
   const p=feedbackPlacement({width,height,touch:app.dataset.touch==='true',portrait:app.dataset.layout==='portrait',specials,buttons,stick:rect(document.querySelector('#touch-stick'))});
   if(app.dataset.landscapePreview==='true')p.bottom+=parseFloat(win.getComputedStyle(app).getPropertyValue('--landscape-safe-bottom'))||0;
   for(const key of ['left','bottom','width'])banner.style.setProperty('--feedback-'+key,p[key]+'px');
   banner.dataset.placed='true';
  }
  // Include every visible HUD child, such as the item status just below the bars.
  const hud=document.querySelector('.dom-hud'),hudBottom=Math.max(...[hud,...hud.querySelectorAll('*')].map(rect).filter(r=>r.width&&r.height).map(r=>r.bottom));
  const stick=rect(document.querySelector('#touch-stick'));
  const rightControls=[...document.querySelectorAll('.control-deck button')].map(rect).filter(r=>r.width&&r.height&&r.left>width*.25);
  const gameCanvas=document.querySelector('#game canvas')||app;
  cameraSafety=measureChallengeOcclusions({document,root:app,canvas:gameCanvas,frame});
  const origin=challengeLogicalRect(gameCanvas.getBoundingClientRect(),app.getBoundingClientRect(),frame.rotation);
  hints.setGeometry({width:origin.width||width,height:origin.height||height,origin,...cameraSafety});
  layout=routeMicPlacement({width,height,hudBottom});
  if(app.dataset.landscapePreview==='true'){layout.right+=parseFloat(win.getComputedStyle(app).getPropertyValue('--landscape-safe-right'))||0;}
  Object.assign(canvas.style,{top:layout.top+'px',right:layout.right+'px',width:layout.width+'px',height:layout.height+'px'});
  const dpr=Math.min(2,win.devicePixelRatio||1),next=width+':'+height+':'+dpr;
  if(next!==stamp){stamp=next;canvas.width=64*dpr;canvas.height=64*dpr;}
  const plan=mainRouteMicPlan({width,height},dpr);
  layout.plan={...plan,visible:layout.visible,center:{x:32,y:32},key:next};
  measuredStructure=structure();measuredCanvas=gameCanvas;measuredOwner=owner;dirty=false;
 }
 const schedule=()=>{dirty=true;if(!pending)pending=win.requestAnimationFrame(refresh);};
 const observer=win.ResizeObserver?new win.ResizeObserver(schedule):null;
 for(const el of [app,...app.querySelectorAll('header,.control-deck,.dom-hud,.challenge-save-slot,.route-hud')])observer?.observe(el);
 const mutation=win.MutationObserver?new win.MutationObserver(()=>{if(measuredStructure!==structure())schedule();}):null;
 mutation?.observe(app,{attributes:true,attributeFilter:['data-touch','data-layout','data-rotation','data-game-mode','data-depth-route','data-title-open','data-landscape-preview','data-full-bleed','style']});
 for(const screen of app.querySelectorAll('.screen'))mutation?.observe(screen,{attributes:true,attributeFilter:['class','hidden','style']});
 win.addEventListener('resize',schedule);refresh();
 return {refresh,get cameraSafety(){if(dirty||measuredOwner!==getCombatOwner()||measuredStructure!==structure()||measuredCanvas!==(document.querySelector('#game canvas')||app))refresh();return cameraSafety;},draw({route,images,time,reducedMotion=false,cameraFrame,world,hintsActive=false}){
  hints.update(cameraFrame,world,{route,active:hintsActive});
  canvas.hidden=!route||!layout?.visible;if(canvas.hidden||!ctx)return;
  const dpr=layout.plan.dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,64,64);
  drawFlyingMic(ctx,images['opening-props-v75'],flyingMicLayout({plan:layout.plan,time,reducedMotion}),time);
 },destroy(){hints.destroy();observer?.disconnect();mutation?.disconnect();win.removeEventListener('resize',schedule);if(pending)win.cancelAnimationFrame(pending);canvas.remove();}};
}
