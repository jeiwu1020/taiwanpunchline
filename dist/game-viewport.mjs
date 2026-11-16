import {applyChallengeLayout,applyCombatPresentationLayout} from './challenge-layout.mjs?v=campaign-boot-20261112-r3';
import {challengeDialogFrame} from './challenge-dialog-viewport.mjs?v=campaign-boot-20261112-r3';
import {createViewportLifecycle,readGameViewport,measureViewportElements,mountViewportProtection} from './viewport-lifecycle.mjs?v=campaign-boot-20261112-r3';
export function mountGameViewport({scene,clearHold,initialSettings={},onChange=()=>{},isCameraFrozen=()=>false}){
 const app=document.querySelector('.app'),shell=document.querySelector('#viewport-shell'),stage=document.querySelector('#game'),dialog=document.querySelector('#help-dialog'),probe=document.querySelector('#safe-insets');
 window.parliamentViewportBoot?.stop();
 const rotateButton=document.querySelector('#rotate-mode'),cameraButton=document.querySelector('#camera-mode');
 let rotate=initialSettings.rotate!==false,camera=initialSettings.camera==='stable'?'stable':'classic',frame=null,lifecycle=null,pendingPaint=null,contextLost=false,surfaceDirty=false;
 const renderer=scene.game?.renderer,canvas=scene.game?.canvas||renderer?.gameCanvas,events=scene.game?.events;
 const protection=mountViewportProtection(document,()=>lifecycle?.invalidate('orientation'));
 function inspectSurface(){const width=Number(stage.clientWidth)||0,height=Number(stage.clientHeight)||0,context=renderer?.gameContext,matrix=context?.getTransform?.();
  const transformValid=!matrix||[matrix.a-1,matrix.b,matrix.c,matrix.d-1,matrix.e,matrix.f].every(n=>Math.abs(n)<1e-6);
  const lost=contextLost||renderer?.contextLost===true||context?.isContextLost?.()===true;
  return {width,height,backingWidth:canvas?.width||0,backingHeight:canvas?.height||0,contextLost:lost,valid:!surfaceDirty&&transformValid&&!!context&&!!renderer&&!!canvas&&width>0&&height>0&&!lost&&scene.scale.width===width&&scene.scale.height===height&&renderer.width===width&&renderer.height===height&&canvas.width===width&&canvas.height===height};
 }
 function sizeCanvas(){const w=Number(stage.clientWidth)||0,h=Number(stage.clientHeight)||0;if(w<=0||h<=0||contextLost||renderer?.gameContext?.isContextLost?.()===true)return inspectSurface();if(surfaceDirty)resetSurface();if(!inspectSurface().valid)lifecycle?.beforeSurfaceMutation();if(scene.scale.width!==w||scene.scale.height!==h){clearHold();scene.scale.resize(w,h);scene.cameraView=null;}if(canvas){if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;}if(renderer&&(renderer.width!==w||renderer.height!==h))renderer.resize?.(w,h);renderer?.gameContext?.setTransform?.(1,0,0,1,0,0);return inspectSurface();}
 function resetSurface(){surfaceDirty=true;pendingPaint=null;scene.cameraView=null;scene.challengeRenderer?.invalidateSurface?.();const context=renderer?.gameContext;if(context&&!contextLost&&context.isContextLost?.()!==true){if(typeof context.reset==='function')context.reset();else if(canvas)canvas.width=canvas.width;context.imageSmoothingEnabled=renderer.antialias!==false;surfaceDirty=false;}}
 function lost(){contextLost=true;lifecycle?.invalidateSurface('contextlost');}
 function restored(){contextLost=false;lifecycle?.invalidateSurface('contextrestored');}
 function painted(){const token=pendingPaint;pendingPaint=null;if(token)lifecycle?.acknowledgePaint(token,inspectSurface());}
 function beginFrame(time){pendingPaint=null;lifecycle.checkActive(time);if(!inspectSurface().valid){if(lifecycle.prepared)lifecycle.invalidateSurface('surface-reset');else lifecycle.prepareCurrent();}return lifecycle.prepared&&inspectSurface().valid?lifecycle.token:null;}
 function failFrame(error){pendingPaint=null;protection.setDrawFailure(error);lifecycle?.failSurface('draw-failed');}
 canvas?.addEventListener?.('contextlost',lost);canvas?.addEventListener?.('contextrestored',restored);events?.on?.('postrender',painted);
 // Phaser's RAF requests its successor after callback returns. Catch at this
 // adapter boundary so a renderer exception cannot permanently stop that loop.
 const rafOwner=scene.game?.loop?.raf,previousCallback=rafOwner?.callback;
 const guardedCallback=typeof previousCallback==='function'?function(...args){try{return previousCallback.apply(this,args);}catch(error){failFrame(error);}}:null;
 if(guardedCallback)rafOwner.callback=guardedCallback;

 function read(){const coarse=window.matchMedia('(pointer:coarse)').matches;
  const touch=coarse||navigator.maxTouchPoints>0||(DEVELOPMENT_TOOLS&&new URLSearchParams(window.location.search).has('touchPreview'));
  const s=getComputedStyle(probe),safe={top:parseFloat(s.paddingTop),right:parseFloat(s.paddingRight),bottom:parseFloat(s.paddingBottom),left:parseFloat(s.paddingLeft)};
  return readGameViewport(window,{safe,touch,rotate,fullBleed:window.innerWidth>window.innerHeight});
 }
 function apply(next){const touch=next.touch,safe={top:next.safeTop,right:next.safeRight,bottom:next.safeBottom,left:next.safeLeft};
  if(!frame||Object.keys(next).some(k=>next[k]!==frame[k]))clearHold();frame=next;
  Object.assign(shell.style,{left:next.left+'px',top:next.top+'px',width:next.screenWidth+'px',height:next.screenHeight+'px'});
  Object.assign(app.style,{width:next.width+'px',height:next.height+'px',transform:next.rotation?`translateX(${next.screenWidth}px) rotate(90deg)`:'none'});
  app.dataset.touch=String(touch);app.dataset.nativeLandscape=String(touch&&next.rotation===0&&window.innerWidth>window.innerHeight);app.dataset.overlayControls=String(touch&&(next.rotation===90||window.innerWidth>window.innerHeight));app.dataset.layout=next.width>next.height?'landscape':'portrait';app.dataset.compact=String(next.height<=360);app.dataset.rotation=String(next.rotation);
  for(const edge of ['top','right','bottom','left'])app.style.setProperty?.('--landscape-safe-'+edge,(next.fullBleed?(safe[edge]||0):0)+'px');
  app.dataset.fullBleed=String(!!next.fullBleed);applyChallengeLayout(app,next);applyChallengeLayout(document.documentElement,next);
  // Keep the existing street-only HUD typography independent of geometry.
  applyCombatPresentationLayout(app);
  rotateButton.hidden=!touch;rotateButton.textContent=rotate?'側轉：開':'側轉：關';rotateButton.setAttribute('aria-pressed',String(rotate));
  cameraButton.textContent=camera==='classic'?'鏡頭：動態跟隨':'鏡頭：穩定視野';cameraButton.setAttribute('aria-pressed',String(camera==='classic'));
  dialog.dataset.compact=String(next.height<=500);dialog.dataset.layout=next.width>next.height?'landscape':'portrait';dialog.dataset.rotation=String(next.rotation);
  const placement=challengeDialogFrame({...next,maxWidth:1040,anchor:'center'});
  Object.assign(dialog.style,{width:placement.width+'px',maxWidth:'none',maxHeight:placement.maxHeight+'px',left:placement.left+'px',top:placement.top+'px',transform:`translate(-50%,-50%) rotate(${next.rotation}deg)`});
  sizeCanvas();

 }
 const stateChanged=state=>{protection.update(state);for(const el of [app,shell,dialog]){el.__viewportState=state;el.dataset.viewportReady=String(state.ready);el.dataset.viewportEpoch=String(state.epoch);el.dataset.surfaceGeneration=String(state.surfaceGeneration);el.dataset.viewportPainted=String(state.painted);el.dataset.viewportStatus=state.status;el.dataset.viewportReason=state.reason;}};
 rotateButton.onclick=()=>{rotate=!rotate;lifecycle.invalidate('orientation');onChange({rotate,camera});};
 // Only this profile owns a frozen pose/lag. Legacy and active mode changes
 // retain their existing resets; genuine orientation/surface work is separate.
 // Camera-mode changes are consumed by the camera solver as transitions.
 // Dropping its previous rendered frame here made Stable start from a new
 // composition and could leave the player behind the camera.
 const resetCameraPreference=()=>{};
 cameraButton.onclick=()=>{camera=camera==='classic'?'stable':'classic';cameraButton.textContent=camera==='classic'?'鏡頭：動態跟隨':'鏡頭：穩定視野';cameraButton.setAttribute('aria-pressed',String(camera==='classic'));resetCameraPreference();clearHold();onChange({rotate,camera});};
 lifecycle=createViewportLifecycle({window,document,requirePaint:true,prepare:sizeCanvas,onSurfaceReset:resetSurface,read,apply,clearInput:clearHold,onState:stateChanged,measure:next=>{const outer=measureViewportElements(next,[shell]),rect=measureViewportElements(next,[app],{allowNarrow:!next.touch});return {...rect,key:outer.key+':'+rect.key+':'+stage.clientWidth+':'+stage.clientHeight,valid:outer.valid&&rect.valid&&stage.clientWidth>0&&stage.clientHeight>0};}});
 const modeObserver=typeof MutationObserver==='function'?new MutationObserver(()=>lifecycle.invalidate('layout')):null;modeObserver?.observe(app,{attributes:true,attributeFilter:['data-title-open','data-depth-route']});
 const observer=new ResizeObserver(()=>{sizeCanvas();lifecycle.invalidate('layout');});observer.observe(stage);
 function setPreferences(next){const r=next.rotate!==false,c=next.camera==='stable'?'stable':'classic';if(r===rotate&&c===camera)return;const rotationChanged=r!==rotate;rotate=r;camera=c;if(rotationChanged)scene.cameraView=null;else resetCameraPreference();clearHold();lifecycle.invalidate('orientation');}
 return {setPreferences,beginFrame,frameDrawn:token=>{pendingPaint=token;},failFrame,get token(){return lifecycle.token;},get overlayControls(){return app.dataset.overlayControls==='true';},get nativeLandscape(){return app.dataset.nativeLandscape==='true';},get ready(){return lifecycle.ready;},get epoch(){return lifecycle.epoch;},get status(){return lifecycle.status;},get reason(){return lifecycle.reason;},subscribe:fn=>lifecycle.subscribe(fn),invalidate:kind=>lifecycle.invalidate(kind),destroy(){canvas?.removeEventListener?.('contextlost',lost);canvas?.removeEventListener?.('contextrestored',restored);events?.off?.('postrender',painted);if(guardedCallback&&rafOwner.callback===guardedCallback)rafOwner.callback=previousCallback;protection.destroy();observer.disconnect?.();modeObserver?.disconnect();lifecycle.destroy();},get rotation(){return frame?.rotation||0;},get camera(){return camera;},get frame(){return frame;}};
}
import {DEVELOPMENT_TOOLS} from './release-features.mjs';
