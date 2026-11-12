// Native top-layer dialogs do not inherit the game's rotated visual viewport.
// Follow its committed geometry instead of calculating a second rotation policy.
export function challengeDialogFrame({width,height,rotation=0,left=0,top=0,screenWidth=width,screenHeight=height,maxWidth=980}){
 // Anchor the logical top center, not the content-dependent dialog center.
 // Rotating this viewport offset also keeps sideways phones eight pixels in.
 const angle=rotation*Math.PI/180,offset=height/2-8;
 return{width:Math.max(1,Math.min(maxWidth,width-16)),maxHeight:Math.max(1,height-16),left:left+screenWidth/2+Math.sin(angle)*offset,top:top+screenHeight/2-Math.cos(angle)*offset,rotation,compact:height<=480,layout:width>height?'landscape':'portrait'};
}
export function mountChallengeDialogViewport(dialog,{document:doc=dialog.ownerDocument,maxWidth=980,onFrame=()=>{}}={}){
 const win=doc?.defaultView||(typeof window==='undefined'?null:window),app=doc?.querySelector?.('.app'),shell=doc?.querySelector?.('#viewport-shell');let disposed=false,gesture=null,suppressClick=false;
 function sync(){if(disposed||!app||!win)return;const rotation=Number(app.dataset.rotation)||0,width=parseFloat(app.style.width)||win.innerWidth,height=parseFloat(app.style.height)||win.innerHeight;
  const rect=shell?.getBoundingClientRect?.(),screenWidth=rect?.width||(rotation?height:width),screenHeight=rect?.height||(rotation?width:height);
  const frame=challengeDialogFrame({width,height,rotation,left:rect?.left||0,top:rect?.top||0,screenWidth,screenHeight,maxWidth});
  Object.assign(dialog.dataset,{compact:String(frame.compact),layout:frame.layout,rotation:String(rotation)});
  Object.assign(dialog.style,{position:'fixed',margin:'0',inset:'auto',width:frame.width+'px',maxWidth:'none',maxHeight:frame.maxHeight+'px',left:frame.left+'px',top:frame.top+'px',transformOrigin:'50% 0',transform:`translate(-50%,0) rotate(${rotation}deg)`});
  dialog.style.setProperty?.('--challenge-logical-height',frame.maxHeight+'px');onFrame(frame);
 }
 // A CSS-rotated modal needs screen motion mapped back to its logical Y axis.
 // Native vertical touch panning cannot do that reliably, especially on iOS.
 const rotation=()=>Number(dialog.dataset.rotation)||0;
 const scrollSurface=target=>{const menu=target?.closest?.('[data-pick-menu]');return menu&&menu.scrollHeight>menu.clientHeight?menu:dialog;};
 function down(e){suppressClick=false;if(!rotation()||e.pointerType!=='touch'||e.isPrimary===false)return;const surface=scrollSurface(e.target);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,top:surface.scrollTop,surface,angle:rotation()*Math.PI/180,moved:false};}
 function move(e){if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.moved&&Math.hypot(dx,dy)<6)return;gesture.moved=true;suppressClick=true;e.preventDefault();
  const logicalY=-Math.sin(gesture.angle)*dx+Math.cos(gesture.angle)*dy;
  gesture.surface.scrollTop=Math.max(0,Math.min(gesture.surface.scrollHeight-gesture.surface.clientHeight,gesture.top-logicalY));
 }
 function up(e){if(gesture?.id===e.pointerId)gesture=null;}
 function click(e){if(!suppressClick||e.detail===0)return;suppressClick=false;e.preventDefault();e.stopPropagation();}
 function wheel(e){if(!rotation())return;const surface=scrollSurface(e.target),unit=e.deltaMode===1?16:e.deltaMode===2?surface.clientHeight:1,delta=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:-Math.sin(rotation()*Math.PI/180)*e.deltaX)*unit;
  if(!delta)return;e.preventDefault();surface.scrollTop=Math.max(0,Math.min(surface.scrollHeight-surface.clientHeight,surface.scrollTop+delta));
 }
 const listeners=[['pointerdown',down],['pointermove',move,{passive:false}],['pointerup',up],['pointercancel',up],['click',click,true],['wheel',wheel,{passive:false}]];
 for(const args of listeners)dialog.addEventListener?.(...args);
 const Observer=win?.MutationObserver;const observer=Observer&&app?new Observer(sync):null;
 observer?.observe(app,{attributes:true,attributeFilter:['data-rotation','data-layout','data-compact','style']});
 if(shell)observer?.observe(shell,{attributes:true,attributeFilter:['style']});win?.addEventListener?.('resize',sync);sync();
 return{sync,destroy(){disposed=true;gesture=null;observer?.disconnect();win?.removeEventListener?.('resize',sync);for(const args of listeners)dialog.removeEventListener?.(...args);}};
}
