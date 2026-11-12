// Shared challenge geometry. Physical insets belong to the viewport; only a
// full-bleed frame retains insets for readable content inside that frame.
const positive=value=>Math.max(0,Number(value)||0);
// A logical short-side limit, not a physical-orientation rule. 500px includes
// phone landscape with browser chrome/safe-area changes, but excludes ordinary
// tablet portrait and taller touch layouts. A touch capability is explicit.
export function isMobileLandscapePresentation({width,height,touch}={}){
 return touch===true&&Number.isFinite(width)&&Number.isFinite(height)&&height>0&&width>height&&height<=500;
}
// The street camera and retained combat mask use the same close-view scope.
// This is a logical viewport contract, not a browser/device-name heuristic.
export function streetPlayerCameraProfile({width,height,touch,route,cameraMode,camera}={}){
 if(route!==true||touch!==true||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 if(width<height&&width<=600)return 'portrait';
 return isMobileLandscapePresentation({width,height,touch})&&(cameraMode??camera??'classic')==='classic'?'landscape':null;
}
export function logicalSafeInsets(frame={}){
 if(!frame.fullBleed)return {top:0,right:0,bottom:0,left:0};
 const p=Object.fromEntries(['top','right','bottom','left'].map(edge=>[edge,positive(frame['safe'+edge[0].toUpperCase()+edge.slice(1)]??frame.safe?.[edge])]));
 if(frame.rotation===90)return {top:p.right,right:p.bottom,bottom:p.left,left:p.top};
 if(frame.rotation===-90)return {top:p.left,right:p.top,bottom:p.right,left:p.bottom};
 return p;
}
export function challengeContentFrame(frame={}){
 const safe=logicalSafeInsets(frame),width=Math.max(1,Number(frame.width)||1),height=Math.max(1,Number(frame.height)||1);
 const left=Math.min(safe.left,width-1),top=Math.min(safe.top,height-1),right=Math.max(left+1,width-safe.right),bottom=Math.max(top+1,height-safe.bottom);
 return {left,top,right,bottom,width:right-left,height:bottom-top};
}
export function applyChallengeLayout(host,frame={}){
 if(!host)return;const safe=logicalSafeInsets(frame),content=challengeContentFrame(frame),angle=(frame.rotation||0)*Math.PI/180;
 host.dataset.controlOverlay=isMobileLandscapePresentation(frame)?'soft':'normal';
 host.dataset.compact=String(frame.height<=500);host.dataset.challengeLayout='true';
 for(const [edge,value]of Object.entries(safe)){host.style.setProperty?.('--challenge-safe-'+edge,value+'px');host.style.setProperty?.('--challenge-physical-safe-'+edge,positive(frame.fullBleed?frame['safe'+edge[0].toUpperCase()+edge.slice(1)]:0)+'px');}
 const dx=(content.left+content.right-frame.width)/2,dy=(content.top+content.bottom-frame.height)/2;
 const centerX=(frame.left||0)+(frame.screenWidth||frame.width)/2+Math.cos(angle)*dx-Math.sin(angle)*dy;
 const centerY=(frame.top||0)+(frame.screenHeight||frame.height)/2+Math.sin(angle)*dx+Math.cos(angle)*dy;
 for(const [key,value]of Object.entries({width:frame.width,height:frame.height,'content-width':content.width,'content-height':content.height,'center-x':centerX,'center-y':centerY}))host.style.setProperty?.('--challenge-'+key,value+'px');
 host.style.setProperty?.('--challenge-rotation',(frame.rotation||0)+'deg');
 return content;
}
export function challengeLogicalRect(rect,origin,rotation=0){
 const left=rotation===90?rect.top-origin.top:rotation===-90?origin.bottom-rect.bottom:rect.left-origin.left;
 const top=rotation===90?origin.right-rect.right:rotation===-90?rect.left-origin.left:rect.top-origin.top;
 const width=Math.abs(rotation)===90?rect.height:rect.width,height=Math.abs(rotation)===90?rect.width:rect.height;
 return {left,top,right:left+width,bottom:top+height,width,height};
}
// The rendered compact stable layout and its camera contract share these CSS
// slot dimensions. Never cache a first (possibly empty) text rectangle.
const ITEM_SLOT_HEIGHT=15,ITEM_SLOT_GAP=3,ITEM_SLOT_WIDTH=.8;
function unpressedControlRect(el,r,document,root){
 // Existing button affordances translate down 2px, including transition
 // fractions on release. Child hints inherit that translation. Rectangles are
 // already in logical space, so native and ±90° use the same subtraction.
 const button=el.closest('button');if(!button||!root.contains(button))return r;
 const transform=document.defaultView?.getComputedStyle?.(button)?.transform||'';
 const values=transform.match(/^matrix\(([^)]+)\)$/)?.[1].split(',').map(Number);
 const dy=values?.length===6&&values[0]===1&&values[1]===0&&values[2]===0&&values[3]===1&&values[4]===0?values[5]:Number(transform.match(/^translateY\(([\d.]+)px\)$/)?.[1])||0;
 // Only the declared pressed affordance is presentation-only. A larger or
 // different transform remains a real geometry change, rather than ignored.
 return dy>0&&dy<=2?{...r,top:r.top-dy,bottom:r.bottom-dy}:r;
}
// Explicit layout preparation belongs to the display owner. Measurement below
// is read-only: inspectors without a selected mode cannot change the scene.
export function applyChallengeCameraLayout(root,frame={}){
 if(root)root.dataset.fixedCameraLayout=String(isMobileLandscapePresentation(frame)&&(frame.cameraMode??frame.camera)==='stable');
}
// The root viewport owns fullBleed; title/route can change synchronously before
// its observer runs. Commit this derived typography before any camera read.
// Standalone consumers without an applied viewport keep their existing flag.
export function applyCombatPresentationLayout(root){
 if(!root||root.dataset.fullBleed===undefined)return;
 const preview=String(root.dataset.fullBleed==='true'&&root.dataset.titleOpen==='false'&&root.dataset.depthRoute==='true');
 if(root.dataset.landscapePreview!==preview)root.dataset.landscapePreview=preview;
}
export function measureChallengeOcclusions({document,root,canvas,frame={}}){
 root??=document.querySelector('#trial-app')||document.querySelector('.app');canvas??=document.querySelector('#game canvas,#game-canvas,#game');
 if(!root||!canvas)return {safeRect:challengeContentFrame(frame),occlusions:[],hudBottom:0,safe:logicalSafeInsets(frame)};
 const origin=canvas.getBoundingClientRect(),rootRect=challengeLogicalRect(root.getBoundingClientRect(),origin,frame.rotation||0),content=challengeContentFrame(frame);
 const canvasWidth=(Math.abs(frame.rotation||0)===90?origin.height:origin.width)||frame.width,canvasHeight=(Math.abs(frame.rotation||0)===90?origin.width:origin.height)||frame.height;
 const left=Math.max(0,content.left+rootRect.left),top=Math.max(0,content.top+rootRect.top),right=Math.min(canvasWidth,content.right+rootRect.left),bottom=Math.min(canvasHeight,content.bottom+rootRect.top);
 const safeRect={left,top,right,bottom,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
 const visible=el=>{if(el.closest('[hidden],.hidden'))return false;const style=document.defaultView?.getComputedStyle?.(el);return style?.display!=='none'&&style?.visibility!=='hidden';};
 const occlusions=[],fixedOcclusions=[],seen=new Set(),compact=isMobileLandscapePresentation(frame);
 const retainClose=frame.retainCombatLayout===true&&!!streetPlayerCameraProfile(frame);
 const retain=frame.retainCombatLayout===true&&(compact&&(frame.cameraMode??frame.camera)==='stable'||retainClose);
 // A real combat owner keeps visibility-masked slots at their measured layout.
 // Close streets retain raw slots too; display:none and hidden remain absent.
 const laidOut=el=>{if(el.closest('[hidden],.hidden'))return false;for(let parent=el;parent;parent=parent.parentElement){if(document.defaultView?.getComputedStyle?.(parent)?.display==='none')return false;if(parent===root)break;}return true;};

 const collect=(kind,selector)=>{for(const el of root.querySelectorAll(selector)){
  if(seen.has(el))continue;seen.add(el);const shown=visible(el),reserved=retain&&laidOut(el);if(!shown&&!reserved)continue;
  const r=challengeLogicalRect(el.getBoundingClientRect(),origin,frame.rotation||0);
  if((shown||retainClose&&reserved)&&r.width>0&&r.height>0)occlusions.push({kind,...r});
  if(!compact||retain&&!reserved)continue;
  // Nested combat status is clipped inside the already-reserved HUD card.
  // Keep legacy/raw measurement intact for every other camera profile.
  if(el.matches('.hud-status')&&el.closest('.hud-side'))continue;
  let fixed=r;
  if(el.id==='item-status'){
   const hud=el.closest('.dom-hud'),h=challengeLogicalRect(hud.getBoundingClientRect(),origin,frame.rotation||0),width=h.width*ITEM_SLOT_WIDTH;
   fixed={left:h.left+(h.width-width)/2,right:h.right-(h.width-width)/2,top:h.bottom+ITEM_SLOT_GAP,bottom:h.bottom+ITEM_SLOT_GAP+ITEM_SLOT_HEIGHT,width,height:ITEM_SLOT_HEIGHT};
  }else if(kind==='control')fixed=unpressedControlRect(el,r,document,root);
  if(fixed.width>0&&fixed.height>0)fixedOcclusions.push({kind,...fixed});
 }};
 collect('toolbar',':scope > header');collect('save','.challenge-save-slot');
 collect('hud','.dom-hud .hud-side,.dom-hud .timer,.dom-hud .hud-status,.dom-hud > [class*="status"],.dom-hud > [role="status"]');
 collect('objective','.chapter-objective,.route-hud');
 collect('control','.control-deck button,.control-deck #touch-stick,.control-deck .specials,.control-deck .guard-hint');
 const controls=occlusions.filter(r=>r.kind==='control'),stick=controls.find(r=>r.left<safeRect.left+safeRect.width*.3),rightControls=controls.filter(r=>r.left>safeRect.left+safeRect.width*.35);
 const hudBottom=Math.max(safeRect.top,...occlusions.filter(r=>r.kind!=='control').map(r=>r.bottom));
 return {safeRect,occlusions,...(compact?{fixedCameraGeometry:{safeRect,occlusions:fixedOcclusions,layoutKey:['compact-stable-slots-v1',root.dataset.gameMode||'',root.dataset.depthRoute||''].join(':')}}:{}),hudBottom,safe:logicalSafeInsets(frame),lowerLane:{top:controls.length?Math.min(...controls.map(r=>r.top)):safeRect.bottom,left:stick?stick.right+8:safeRect.left+8,right:rightControls.length?Math.min(...rightControls.map(r=>r.left))-8:safeRect.right-8,bottom:safeRect.bottom-8}};
}
