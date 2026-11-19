// Presentation-only, event-driven single-line names. No game loop, timers,
// persistence, button geometry, or gameplay state is touched here.
export function fitSpecialNameSize({availableWidth,measuredWidth,maxSize,fixedWidth=0,minSize=12}){
 if(!Number.isFinite(availableWidth)||availableWidth<=0||!Number.isFinite(measuredWidth)||measuredWidth<0||!Number.isFinite(maxSize)||maxSize<=0)return null;
 const room=Math.max(0,availableWidth-1-fixedWidth);
 const needed=measuredWidth?Math.floor(Math.min(maxSize,maxSize*room/measuredWidth)*10)/10:maxSize;
 const size=Math.max(Math.min(minSize,maxSize),needed),width=measuredWidth*size/maxSize+fixedWidth;
 return{size,width,fits:width<=availableWidth-1+.001};
}
const mounts=new WeakMap();
export function mountSpecialNameFit({document=globalThis.document,onUnfit=()=>{}}={}){
 mounts.get(document)?.destroy();
 const window=document.defaultView,root=document.querySelector('.control-deck .specials')||document.querySelector('.specials'),app=document.querySelector('.app');
 const names=()=>[...(root?.querySelectorAll('.move-copy strong')||[])];
 const context=document.createElement('canvas').getContext('2d'),cache=new WeakMap();
 let queued=0,destroyed=false;
 function fit(){
  queued=0;if(destroyed)return;
  for(const name of names()){
   const width=name.clientWidth;if(width<=0)continue; // Hidden menus wait for ResizeObserver.
   const style=window.getComputedStyle(name),max=Number.parseFloat(style.getPropertyValue('--special-name-max'))||18;
   const text=name.textContent||'',font=`${style.fontStyle||'normal'} ${style.fontWeight||'900'} ${max}px ${style.fontFamily||'sans-serif'}`;
   const spacing=Number.parseFloat(style.letterSpacing)||0,fixedWidth=Math.max(0,[...text].length-1)*spacing;
   const key=[text,width,font,spacing,style.fontKerning,style.fontStretch].join('|');if(cache.get(name)===key)continue;cache.set(name,key);
   if(!context){name.dataset.nameFitOverflow='true';onUnfit({name,text,reason:'Canvas text measurement unavailable'});continue;}
   context.font=font;context.fontKerning=style.fontKerning||'auto';context.fontStretch=style.fontStretch||'normal';
   const result=fitSpecialNameSize({availableWidth:width,measuredWidth:context.measureText(text).width,maxSize:max,fixedWidth});if(!result)continue;
   name.style.setProperty('--special-name-fit',`${result.size}px`);
   name.dataset.nameFitSize=String(result.size);name.dataset.nameFitWidth=String(width);name.dataset.nameFitTextWidth=result.width.toFixed(2);name.dataset.nameFitOverflow=String(!result.fits);
   if(!result.fits){const detail={name,text,availableWidth:width,...result};onUnfit(detail);name.dispatchEvent(new window.CustomEvent('specialnamefitoverflow',{bubbles:true,detail}));}
  }
 }
 function refresh(){if(!destroyed&&!queued)queued=window.requestAnimationFrame(fit);}
 const resize=window.ResizeObserver?new window.ResizeObserver(refresh):null;
 if(root)resize?.observe(root);for(const name of names())resize?.observe(name);
 const changes=new window.MutationObserver(records=>{
  if(records.some(record=>{const target=record.target.nodeType===1?record.target:record.target.parentElement;return target?.closest('.move-copy strong')||[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.move-copy strong')||node.querySelector?.('.move-copy strong')));})){for(const name of names())resize?.observe(name);refresh();}
 });
 if(root)changes.observe(root,{childList:true,characterData:true,subtree:true});
 const layout=new window.MutationObserver(refresh);if(app)layout.observe(app,{attributes:true,attributeFilter:['data-touch','data-layout','data-overlay-controls','data-rotation']});
 const fontsChanged=()=>{for(const name of names())cache.delete(name);refresh();};
 document.fonts?.addEventListener?.('loadingdone',fontsChanged);document.fonts?.ready?.then(fontsChanged);
 window.addEventListener('resize',refresh);refresh();
 const api={refresh,destroy(){if(destroyed)return;destroyed=true;if(queued)window.cancelAnimationFrame(queued);queued=0;resize?.disconnect();changes.disconnect();layout.disconnect();window.removeEventListener('resize',refresh);document.fonts?.removeEventListener?.('loadingdone',fontsChanged);if(mounts.get(document)===api)mounts.delete(document);}};
 mounts.set(document,api);return api;
}
