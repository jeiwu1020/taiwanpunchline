// Page-level zoom policy is separate from combat's exclusive pointer controls.
// Scrolls, clicks, selection and one-finger range drags remain browser-native.
const mounts=new WeakMap();
const interactive='button,a,input,textarea,select,label,summary,[role="button"],[contenteditable]';
const DOUBLE_TAP_MS=350,TAP_MS=350,TAP_TRAVEL=12,NEARBY=32;
const pointDistance=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
const element=target=>target?.closest?target:target?.parentElement;
const isPointerGameControl=target=>{const node=element(target),button=node?.closest('button');return !!button?.closest('.control-deck')&&(button.hasAttribute('data-hold')||button.hasAttribute('data-action'));};
const isInteractive=target=>!!element(target)?.closest(interactive)&&!isPointerGameControl(target);

// Native dialogs live outside the shell in the document top layer. Own the
// complete game document, including text-node and backdrop-retargeted events.
export function ownsGamePageTarget(document,target){return !!target&&(target===document||!!document?.documentElement?.contains(target));}

export function mountPageZoomGuard({root,ownsTarget,allowsZoom=()=>false}){
 if(mounts.has(root))return mounts.get(root);
 const contacts=new Map();
 let blocked=false,multiple=false,gestureOwned=false,lastTap=null,destroyed=false;
 const cancel=event=>{if(event.cancelable)event.preventDefault();};
 function touch(event){
  const current=Array.from(event.touches||[]),changed=Array.from(event.changedTouches||[]);
  const ids=new Set(current.map(point=>point.identifier));
  if(event.type==='touchstart'){
   const added=new Set(changed.map(point=>point.identifier));
   if(!current.some(point=>!added.has(point.identifier))){contacts.clear();blocked=false;multiple=false;gestureOwned=false;}
   for(const id of contacts.keys())if(!ids.has(id))contacts.delete(id);
   for(const point of changed)contacts.set(point.identifier,{owned:ownsTarget(point.target)&&!allowsZoom(),start:point,time:event.timeStamp,moved:false});
  }
  for(const point of current)if(!contacts.has(point.identifier))contacts.set(point.identifier,{owned:false,start:point,time:event.timeStamp,moved:true});
  for(const point of [...current,...changed]){
   const contact=contacts.get(point.identifier);
   if(contact&&pointDistance(contact.start,point)>TAP_TRAVEL)contact.moved=true;
  }
  if(allowsZoom()||[...contacts.values()].some(contact=>!contact.owned))blocked=true;
  if(blocked)gestureOwned=false;
  if(current.length>1||changed.length>1||contacts.size>1){multiple=true;lastTap=null;}
  if(event.type==='touchcancel'){blocked=true;gestureOwned=false;lastTap=null;}
  else if(multiple){if(!blocked)cancel(event);}
  else if(event.type==='touchend'&&!current.length&&changed.length===1){
   const point=changed[0],contact=contacts.get(point.identifier);
   // Pointer-driven game buttons do not need compatibility clicks. Other
   // native controls keep clicks. CSS pan-x pan-y (or
   // manipulation in reading mode) removes their double-tap zoom instead.
   // Keep this text/empty-space fallback active even in accessible pinch mode.
   if(contact&&!contact.moved&&ownsTarget(point.target)&&!isInteractive(point.target)&&event.timeStamp-contact.time<=TAP_MS){
    if(lastTap&&event.timeStamp-lastTap.time<=DOUBLE_TAP_MS&&pointDistance(lastTap,point)<=NEARBY)cancel(event);
    lastTap={clientX:point.clientX,clientY:point.clientY,time:event.timeStamp};
   }else lastTap=null;
  }
  for(const id of contacts.keys())if(!ids.has(id))contacts.delete(id);
  if(!current.length){contacts.clear();blocked=false;multiple=false;}
 }
 function gesture(event){
  if(allowsZoom()){gestureOwned=false;return;}
  if(event.type==='gesturestart')gestureOwned=contacts.size?!blocked&&[...contacts.values()].every(contact=>contact.owned):ownsTarget(event.target);
  if(gestureOwned)cancel(event);
  if(event.type==='gestureend')gestureOwned=false;
 }
 const options={capture:true,passive:false};
 const listeners=[...['touchstart','touchmove','touchend','touchcancel'].map(type=>[type,touch]),...['gesturestart','gesturechange','gestureend'].map(type=>[type,gesture])];
 for(const[type,handler]of listeners)root.addEventListener(type,handler,options);
 const api={
  reset(){for(const contact of contacts.values())contact.owned=false;blocked=contacts.size>0;gestureOwned=false;lastTap=null;},
  destroy(){if(destroyed)return;destroyed=true;for(const[type,handler]of listeners)root.removeEventListener(type,handler,options);contacts.clear();lastTap=null;mounts.delete(root);}
 };
 mounts.set(root,api);return api;
}

export function bindPageZoomPreference({control,root,storage}){
 const key='brawl-page-zoom-v51';
 // Some privacy modes deny localStorage entirely. The reading control must
 // continue to work for this page even if its preference cannot be persisted.
 try{storage??=globalThis.localStorage;control.checked=storage?.getItem(key)==='true';}catch{control.checked=false;}
 const apply=()=>{root.dataset.allowPageZoom=String(control.checked);};
 const change=()=>{apply();try{storage?.setItem(key,String(control.checked));}catch{}};
 apply();control.addEventListener('change',change);
 return{get enabled(){return control.checked;},destroy(){control.removeEventListener('change',change);}};
}
