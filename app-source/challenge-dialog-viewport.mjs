import {challengeContentFrame} from './challenge-layout.mjs?v=chapter-presentation-20261117-r1';
import {readGameViewport,measureViewportElements} from './viewport-lifecycle.mjs?v=chapter-presentation-20261117-r1';
// Native top-layer dialogs do not inherit the game's rotated visual viewport.
// Follow its committed geometry instead of calculating a second rotation policy.
export function challengeDialogFrame({width,height,rotation=0,left=0,top=0,screenWidth=width,screenHeight=height,maxWidth=980,anchor='top',fullBleed=false,safeLeft=0,safeRight=0,safeTop=0,safeBottom=0}){
 const content=challengeContentFrame({width,height,rotation,fullBleed,safeLeft,safeRight,safeTop,safeBottom});
 const angle=rotation*Math.PI/180,logicalX=(content.left+content.right)/2-width/2,logicalY=(anchor==='center'?(content.top+content.bottom)/2:content.top+8)-height/2;
 return{width:Math.max(1,Math.min(maxWidth,content.width-16)),maxHeight:Math.max(1,content.height-16),left:left+screenWidth/2+Math.cos(angle)*logicalX-Math.sin(angle)*logicalY,top:top+screenHeight/2+Math.sin(angle)*logicalX+Math.cos(angle)*logicalY,rotation,compact:height<=500,layout:width>height?'landscape':'portrait'};
}
export function mountChallengeDialogViewport(dialog,{document:doc=dialog.ownerDocument,maxWidth=980,anchor='top',onFrame=()=>{},unreadyActionToken=null,savedRecoveryExit=null}={}){
 const win=doc?.defaultView||(typeof window==='undefined'?null:window),candidate=doc?.querySelector?.('.app'),app=candidate?.tagName==='BODY'?doc?.querySelector?.('#trial-app'):candidate,shell=doc?.querySelector?.('#viewport-shell')||app;let disposed=false,gesture=null,suppressClick=false,press=null,committedGeometry=null,committedMetrics=null,exitCapability=null,exitSection=null,exitButton=null,exitCopy=null,protectedStyles=[],protectedChildren=[];
 const geometryKey=()=>{const state=app?.__viewportState;return JSON.stringify([state?.epoch??null,state?.frame??null]);};
 const metricKey=()=>{const v=win?.visualViewport;return JSON.stringify([win?.innerWidth,win?.innerHeight,win?.scrollX,win?.scrollY,win?.devicePixelRatio,v?.width,v?.height,v?.offsetLeft,v?.offsetTop,v?.scale]);};
 const actionToken=e=>{try{if(exitCapability){updateExit();return e.target?.closest?.('button')===exitButton&&!exitButton.disabled?exitCapability:null;}return unreadyActionToken?.(e)||null;}catch{return null;}};
 function updateExit(){if(!exitCapability)return;let safe=false;try{safe=exitCapability.isSafe?.()===true;}catch{}exitButton.disabled=!safe;exitCopy.textContent=safe?'畫面尺寸無法確認。進度已保存，可安全重新載入後接續。':'目前無法確認所有變更已保存。請保留此頁，重新旋轉裝置或調整視窗後再試；不會自動重新載入。';}
 function restoreExit(){
  for(const [key,value,priority]of protectedStyles){if(value)dialog.style.setProperty(key,value,priority);else dialog.style.removeProperty(key);}protectedStyles=[];
  for(const [node,value,priority]of protectedChildren){if(value)node.style.setProperty('display',value,priority);else node.style.removeProperty('display');}protectedChildren=[];
  if(exitSection){exitSection.hidden=true;exitSection.style.display='none';}exitCapability=null;delete dialog.dataset.viewportRecoveryExit;
 }
 function protectExit(wasProtected){
  let capability;try{capability=savedRecoveryExit?.();}catch{return;}if(!capability||app?.__viewportState?.ready!==false||unreadyGeometry())return;
  if(!exitSection){exitSection=doc.createElement('section');exitSection.dataset.viewportSavedExit='true';exitSection.style.cssText='font:700 16px/1.5 sans-serif;color:#17353a;background:#fff5dc;text-align:left';exitCopy=doc.createElement('p');exitCopy.dataset.viewportExitCopy='true';exitCopy.setAttribute('role','status');exitCopy.style.cssText='margin:0 0 12px;overflow-wrap:anywhere';exitButton=doc.createElement('button');exitButton.type='button';exitButton.dataset.viewportSavedReload='true';exitButton.textContent='重新載入已保存進度';exitButton.style.cssText='box-sizing:border-box;min-height:44px;width:100%;font:700 16px/1.3 sans-serif;padding:10px;border:2px solid #17353a;border-radius:5px;background:#fff8e7;color:#17353a;touch-action:manipulation';exitButton.onclick=()=>{updateExit();if(!exitCapability||exitButton.disabled)return;const capability=exitCapability;try{if(capability.reload?.()!==true){exitButton.disabled=true;exitCopy.textContent='尚未確認保存，已保留此頁，沒有重新載入。';}}catch{exitButton.disabled=true;exitCopy.textContent='未能安全重新載入，請保留此頁。';}};exitSection.append(exitCopy,exitButton);}
  if(exitSection.parentElement!==dialog)dialog.append(exitSection);
  exitCapability=capability;for(const child of dialog.children){if(child===exitSection||child.id==='quick-view-tools'&&child.shadowRoot)continue;protectedChildren.push([child,child.style.getPropertyValue('display'),child.style.getPropertyPriority('display')]);child.style.setProperty('display','none','important');}
  // Native viewport units and browser centering are independent of the broken
  // game frame. This one saved-only exit never marks the game viewport ready.
  const styles={position:'fixed',inset:'0',left:'0',top:'0',right:'0',bottom:'0',margin:'auto',transform:'none',height:'fit-content',width:'min(420px, calc(100vw - 24px))','max-width':'calc(100vw - 24px)','max-height':'calc(100dvh - 24px)',overflow:'auto',padding:'16px','box-sizing':'border-box'};
  for(const [key,value]of Object.entries(styles)){protectedStyles.push([key,dialog.style.getPropertyValue(key),dialog.style.getPropertyPriority(key)]);dialog.style.setProperty(key,value,'important');}
  dialog.dataset.viewportRecoveryExit='true';exitSection.hidden=false;exitSection.style.display='block';updateExit();if(!wasProtected&&!exitButton.disabled)exitButton.focus();
 }
 function nativeExitGeometry(){
  if(!exitCapability||doc?.hidden)return false;const rect=exitButton?.getBoundingClientRect?.();if(!rect||['left','top','width','height'].some(key=>!Number.isFinite(rect[key]))||rect.width<=0||rect.height<=0)return false;
  const visible=readGameViewport(win,{touch:false,rotate:false}),area=visible.valid?visible.frame:{left:0,top:0,screenWidth:win.innerWidth,screenHeight:win.innerHeight};return rect.left>=area.left-1.5&&rect.top>=area.top-1.5&&rect.left+rect.width<=area.left+area.screenWidth+1.5&&rect.top+rect.height<=area.top+area.screenHeight+1.5;
 }
 function unreadyGeometry(){
  const state=app?.__viewportState,frame=state?.frame;if(disposed||doc?.hidden||state?.readiness!=='paint'||!frame||!Number.isFinite(state.epoch)||!['','draw-failed','surface-unpainted','surface-reset','surface-prepare-failed','contextlost','contextrestored'].includes(state.reason||''))return false;
  if(geometryKey()!==committedGeometry||metricKey()!==committedMetrics||['left','top','width','height','screenWidth','screenHeight','rotation'].some(key=>!Number.isFinite(frame[key]))||['width','height','screenWidth','screenHeight'].some(key=>frame[key]<=0))return false;
  const visible=readGameViewport(win,{touch:false,rotate:false});if(!visible.valid)return false;const area=visible.frame;
  return frame.left>=area.left-1.5&&frame.top>=area.top-1.5&&frame.left+frame.screenWidth<=area.left+area.screenWidth+1.5&&frame.top+frame.screenHeight<=area.top+area.screenHeight+1.5&&measureViewportElements(frame,[shell]).valid&&measureViewportElements(frame,[app],{allowNarrow:!frame.touch}).valid;
 }
 function sync(){if(disposed||!app||!win)return;const wasProtected=!!exitCapability;restoreExit();const state=app.__viewportState;if(state?.ready===false||gesture&&gesture.epoch!==state?.epoch)gesture=null;const committed=state?.frame;const rotation=committed?.rotation??(Number(app.dataset.rotation)||0),width=committed?.width??(parseFloat(app.style.width)||win.innerWidth),height=committed?.height??(parseFloat(app.style.height)||win.innerHeight);
  const rect=committed?{left:committed.left,top:committed.top,width:committed.screenWidth,height:committed.screenHeight}:shell?.getBoundingClientRect?.(),screenWidth=rect?.width||(rotation?height:width),screenHeight=rect?.height||(rotation?width:height);
  const placement=typeof anchor==='function'?anchor():anchor,centered=placement==='center';
  const frame=challengeDialogFrame({width,height,rotation,left:rect?.left||0,top:rect?.top||0,screenWidth,screenHeight,maxWidth,anchor:placement,fullBleed:app.dataset.fullBleed==='true',...Object.fromEntries(['Left','Right','Top','Bottom'].map(edge=>['safe'+edge,Math.max(0,parseFloat((app.style.getPropertyValue?.('--challenge-physical-safe-'+edge.toLowerCase())||app.style.getPropertyValue?.('--landscape-safe-'+edge.toLowerCase())))||0)])),...(committed||{})});
  Object.assign(dialog.dataset,{compact:String(frame.compact),layout:frame.layout,rotation:String(rotation),viewportAnchor:centered?'center':'top',viewportReady:String(state?.ready!==false),viewportEpoch:String(state?.epoch||0)});
  Object.assign(dialog.style,{position:'fixed',margin:'0',inset:'auto',width:frame.width+'px',maxWidth:'none',maxHeight:frame.maxHeight+'px',left:frame.left+'px',top:frame.top+'px',transformOrigin:centered?'50% 50%':'50% 0',transform:`translate(-50%,${centered?'-50%':'0'}) rotate(${rotation}deg)`});
  dialog.style.setProperty?.('--challenge-logical-height',frame.maxHeight+'px');dialog.style.setProperty?.('--challenge-dialog-left',frame.left+'px');dialog.style.setProperty?.('--challenge-dialog-top',frame.top+'px');committedGeometry=geometryKey();committedMetrics=metricKey();onFrame(frame);protectExit(wasProtected);
 }
 // A CSS-rotated modal needs screen motion mapped back to its logical Y axis.
 // Native vertical touch panning cannot do that reliably, especially on iOS.
 const rotation=()=>Number(dialog.dataset.rotation)||0;
 const scrollSurface=target=>{let menu=target?.closest?.('[data-pick-menu],.challenge-preparation-panel,.challenge-shell-body,.settings-scroll,.detail-scroll,.story-copy>p,.story-copy');if(menu?.matches?.('.story-copy>p')&&menu.scrollHeight<=menu.clientHeight)menu=menu.closest('.story-copy');if(menu&&menu.scrollHeight>menu.clientHeight)return menu;const overviewBody=target?.closest?.('.challenge-overview-v4')?.querySelector?.('.challenge-shell-body');return overviewBody&&overviewBody.scrollHeight>overviewBody.clientHeight?overviewBody:dialog;};
 function down(e){suppressClick=false;if(unreadyActionToken||savedRecoveryExit)press={token:actionToken(e),target:e.target?.closest?.('button')||e.target,geometry:geometryKey(),metrics:metricKey(),id:e.pointerId,x:e.clientX,y:e.clientY,released:false,cancelled:e.isPrimary===false||e.button!==0};if(app?.__viewportState?.ready===false||!rotation()||e.pointerType!=='touch'||e.isPrimary===false)return;const surface=scrollSurface(e.target);gesture={epoch:app?.__viewportState?.epoch,id:e.pointerId,x:e.clientX,y:e.clientY,top:surface.scrollTop,surface,angle:rotation()*Math.PI/180,moved:false};}
 function move(e){if(press?.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>=6){press.cancelled=true;suppressClick=true;}if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.moved&&Math.hypot(dx,dy)<6)return;gesture.moved=true;suppressClick=true;e.preventDefault();
  const logicalY=-Math.sin(gesture.angle)*dx+Math.cos(gesture.angle)*dy;
  gesture.surface.scrollTop=Math.max(0,Math.min(gesture.surface.scrollHeight-gesture.surface.clientHeight,gesture.top-logicalY));
 }
 function up(e){if(press?.id===e.pointerId){press.released=true;if(e.type==='pointercancel'||Math.hypot(e.clientX-press.x,e.clientY-press.y)>=6)press.cancelled=true;}if(gesture?.id===e.pointerId)gesture=null;}
 function click(e){
  const token=actionToken(e);if(e.detail===0){if(!exitCapability||token)return;e.preventDefault();e.stopImmediatePropagation();return;}const tracked=!!(unreadyActionToken||savedRecoveryExit)&&!!press&&(!!press.token||!!token),stale=tracked&&(press.cancelled||press.consumed||!press.released||press.token!==token||press.target!==(e.target?.closest?.('button')||e.target)||press.geometry!==geometryKey()||press.metrics!==metricKey());
  const blocked=suppressClick||stale||app?.__viewportState?.ready===false&&(!token||!(exitCapability?nativeExitGeometry():unreadyGeometry())||press&&(!press.token||press.cancelled||press.consumed||!press.released));
  if(press)press.consumed=true;if(!blocked)return;suppressClick=false;e.preventDefault();e.stopImmediatePropagation();
 }
 function wheel(e){if(app?.__viewportState?.ready===false||!rotation())return;const surface=scrollSurface(e.target),unit=e.deltaMode===1?16:e.deltaMode===2?surface.clientHeight:1,delta=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:-Math.sin(rotation()*Math.PI/180)*e.deltaX)*unit;
  if(!delta)return;e.preventDefault();surface.scrollTop=Math.max(0,Math.min(surface.scrollHeight-surface.clientHeight,surface.scrollTop+delta));
 }
 const listeners=[['pointerdown',down,!!(unreadyActionToken||savedRecoveryExit)],['pointermove',move,{passive:false,capture:!!(unreadyActionToken||savedRecoveryExit)}],['pointerup',up,!!(unreadyActionToken||savedRecoveryExit)],['pointercancel',up,!!(unreadyActionToken||savedRecoveryExit)],['click',click,true],['wheel',wheel,{passive:false}]];
 // A quick-view overlay may live inside this modal to escape modal inertness.
 // Its controls use physical viewport coordinates, not the rotated game frame.
 const scopedListeners=listeners.map(([type,listener,options])=>[type,event=>{
  if(event.composedPath?.().some(node=>node.id==='quick-view-tools'&&node.shadowRoot))return;
  listener(event);
 },options]);
 for(const args of scopedListeners)dialog.addEventListener?.(...args);
 const Observer=win?.MutationObserver;const observer=Observer&&app?new Observer(sync):null;
 observer?.observe(app,{attributes:true,attributeFilter:['data-rotation','data-layout','data-compact','data-full-bleed','style']});
 if(shell)observer?.observe(shell,{attributes:true,attributeFilter:['style']});const unmanagedResize=()=>{if(!app?.__viewportState)sync();};win?.addEventListener?.('resize',unmanagedResize);win?.addEventListener?.('parliamentviewportchange',sync);sync();
 return{sync,destroy(){restoreExit();exitSection?.remove();disposed=true;gesture=null;press=null;observer?.disconnect();win?.removeEventListener?.('resize',unmanagedResize);win?.removeEventListener?.('parliamentviewportchange',sync);for(const args of scopedListeners)dialog.removeEventListener?.(...args);}};
}
