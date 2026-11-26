import './viewport-core.js?v=chapter-presentation-20261117-r1';
export const {createViewportLifecycle,readGameViewport,measureViewportElements}=globalThis.parliamentViewportCore;

// Only a failed stabilization needs a visible notice. Normal settling stays
// quiet; combat input is gated by the controller's ready flag.
export function mountViewportProtection(document,recheck){
 if(!document.createElement||!document.body)return {update(){},setDrawFailure(){},destroy(){}};
 const notice=document.createElement('div');notice.dataset.viewportProtection='true';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 notice.style.cssText='position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);width:min(320px,85vw);box-sizing:border-box;background:#fff5dc;color:#17353a;border:3px solid #17353a;border-radius:12px;padding:16px;font:700 15px/1.5 sans-serif;box-shadow:4px 4px 0 #17353a';
 const copy=document.createElement('p');copy.textContent='畫面尺寸尚未穩定，操作暫停。請重新旋轉裝置或調整視窗，再重新檢查。';
 const retry=document.createElement('button');retry.type='button';retry.textContent='重新檢查畫面';retry.onclick=()=>recheck();notice.append(copy,retry);document.body.append(notice);
 const defaultCopy=copy.textContent;let cameraBlocked=false;
 const updateCopy=()=>{copy.textContent=cameraBlocked?'可用畫面太小，無法安全顯示主角，操作暫停。請橫放裝置或放大視窗，再重新檢查。':defaultCopy;};
 // Only present a known cause. Recovery, paint ownership and input gating remain
 // owned by the existing draw-failed lifecycle; never restart its deadline here.
 return {setDrawFailure(error){cameraBlocked=error?.code==='STREET_CAMERA_BLOCKED';updateCopy();},update(state){if(state.ready){cameraBlocked=false;updateCopy();}const overlay=document.getElementById?.('chapter-loading-overlay');const loadingVisible=!!overlay&&!overlay.hidden;const show=state.status==='blocked'&&(!loadingVisible||cameraBlocked);if(notice.hidden===show)notice.hidden=!show;},destroy(){notice.remove();}};
}

// One Canvas2D surface adapter serves all later chapters. Its acknowledgement
// proves drawing commands completed, not that an OS compositor displayed them.
export function createCanvasViewportSurface({window,stage,canvas,context,getLifecycle,invalidateResources=()=>{}}){
 let lost=false,dirty=false;
 // Preserve the existing later-chapter backing policy; restoration must not
 // silently increase phone pixel work or change display quality.
 const density=()=>Math.min(2,Number(window.devicePixelRatio)||1);
 function inspect(){
  const width=Number(stage?.clientWidth)||0,height=Number(stage?.clientHeight)||0,d=density(),matrix=context?.getTransform?.();
  const contextLost=lost||context?.isContextLost?.()===true;
  const transformValid=!matrix||[matrix.a-d,matrix.b,matrix.c,matrix.d-d,matrix.e,matrix.f].every(n=>Math.abs(n)<1e-6);
  return {width,height,backingWidth:canvas?.width||0,backingHeight:canvas?.height||0,contextLost,valid:!!context&&!dirty&&!contextLost&&width>0&&height>0&&canvas.width===Math.round(width*d)&&canvas.height===Math.round(height*d)&&transformValid};
 }
 function prepare(){
  const w=Number(stage?.clientWidth)||0,h=Number(stage?.clientHeight)||0,d=density();
  if(!context||lost||context.isContextLost?.()===true||w<=0||h<=0)return inspect();
  if(dirty)reset();
  const width=Math.round(w*d),height=Math.round(h*d);
  if(!inspect().valid)getLifecycle()?.beforeSurfaceMutation();
  if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
  if(canvas.style.width!==w+'px')canvas.style.width=w+'px';if(canvas.style.height!==h+'px')canvas.style.height=h+'px';
  context.setTransform(d,0,0,d,0,0);return inspect();
 }
 function reset(){dirty=true;invalidateResources();if(context&&!lost&&context.isContextLost?.()!==true){if(typeof context.reset==='function')context.reset();else canvas.width=canvas.width;dirty=false;}}
 function contextLost(){lost=true;getLifecycle()?.invalidateSurface('contextlost');}
 function contextRestored(){lost=false;getLifecycle()?.invalidateSurface('contextrestored');}
 // Canvas2D restoration is the default action. Do not preventDefault as a
 // WebGL context-loss handler would: that would opt out of 2D restoration.
 canvas?.addEventListener?.('contextlost',contextLost);canvas?.addEventListener?.('contextrestored',contextRestored);
 function beginFrame(time){const lifecycle=getLifecycle();if(!lifecycle)return null;lifecycle.checkActive(time);if(!inspect().valid){if(lifecycle.prepared)lifecycle.invalidateSurface('surface-reset');else lifecycle.prepareCurrent();}return lifecycle.prepared&&inspect().valid?lifecycle.token:null;}
 return {prepare,inspect,reset,beginFrame,paint:token=>getLifecycle()?.acknowledgePaint(token,inspect())??false,fail:()=>getLifecycle()?.failSurface('draw-failed'),destroy(){canvas?.removeEventListener?.('contextlost',contextLost);canvas?.removeEventListener?.('contextrestored',contextRestored);}};
}
