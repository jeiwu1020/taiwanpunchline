// CSS touch-action:none on the active cabinet is the primary gesture policy.
// This root-scoped fallback also cancels iOS Safari's legacy touch/gesture
// defaults. Gameplay and audio still receive their original PointerEvents.
const mounts=new WeakMap();
const nativeRegions='header,.toolbar,.under,.screen,dialog,a,input,textarea,select,label,summary,[data-native-gestures]';

export function mountBattleGestures({root,isProtected}){
 if(mounts.has(root))return mounts.get(root);
 const contacts=new Map();
 let blocked=false,gestureOwned=false,destroyed=false;
 const element=target=>target?.closest?target:target?.parentElement;
 const nativeTarget=target=>{
  const node=element(target);
  if(!node||!root.contains(node)||node.closest(nativeRegions))return true;
  const editable=node.closest('[contenteditable]');
  if(editable&&editable.getAttribute('contenteditable')!=='false')return true;
  const button=node.closest('button');
  return !!button&&!(button.closest('.control-deck')&&button.matches('[data-hold],[data-action]'));
 };
 const battleStart=point=>{
  const node=element(point.target);
  if(nativeTarget(node))return false;
  const cabinet=node.closest('.cabinet');
  if(cabinet&&root.contains(cabinet))return true;
  // Transparent overlay gaps can hit the shell/app instead of a game child.
  // Physical client coordinates and the transformed rectangle work at 0/90°.
  if(node!==root&&!node.matches('.app'))return false;
  const bounds=root.querySelector('.cabinet')?.getBoundingClientRect();
  return !!bounds&&bounds.width>0&&bounds.height>0&&
   point.clientX>=bounds.left&&point.clientX<=bounds.right&&
   point.clientY>=bounds.top&&point.clientY<=bounds.bottom;
 };
 const cancel=event=>{if(event.cancelable)event.preventDefault();};
 const active=()=>{
  if(isProtected())return true;
  // Never adopt a held menu/settings finger when combat resumes.
  if(contacts.size)blocked=true;
  gestureOwned=false;
  return false;
 };
 function touch(event){
  const current=Array.from(event.touches||[]),changed=Array.from(event.changedTouches||[]);
  const currentIDs=new Set(current.map(point=>point.identifier));
  const enabled=active();
  if(event.type==='touchstart'){
   const added=new Set(changed.map(point=>point.identifier));
   if(!current.some(point=>!added.has(point.identifier))){
    // A genuinely new sequence also recovers from a missing touchend.
    contacts.clear();blocked=false;gestureOwned=false;
   }
   for(const id of contacts.keys())if(!currentIDs.has(id))contacts.delete(id);
   for(const point of changed)contacts.set(point.identifier,enabled&&battleStart(point));
  }
  // touches contains contacts outside this root, whose start we did not see.
  // Never steal their native pinch/scroll, even after the outside finger lifts.
  for(const point of current)if(!contacts.has(point.identifier))contacts.set(point.identifier,false);
  if(!enabled||[...contacts.values()].some(owned=>!owned))blocked=true;
  if(blocked)gestureOwned=false;
  const involved=[...current,...changed];
  if(event.type==='touchcancel'){
   blocked=true;gestureOwned=false;
  }else if(!blocked&&involved.length&&involved.every(point=>contacts.get(point.identifier)===true)){
   // Cancel every protected start/end rather than using a tap timing heuristic.
   // This can suppress compatibility clicks; game controls already use pointers.
   cancel(event);
  }
  for(const id of contacts.keys())if(!currentIDs.has(id))contacts.delete(id);
  if(!current.length){contacts.clear();blocked=false;}
 }
 function gesture(event){
  const enabled=active();
  if(!enabled||nativeTarget(event.target)){gestureOwned=false;return;}
  if(event.type==='gesturestart'){
   // Safari can retarget a two-finger gesture to the shell and omit coordinates.
   // Prefer the touch sequence when available; otherwise own only a battle start.
   gestureOwned=contacts.size?!blocked&&[...contacts.values()].every(Boolean):battleStart(event);
  }
  if(gestureOwned)cancel(event);
  if(event.type==='gestureend')gestureOwned=false;
 }
 const options={passive:false,capture:true};
 const listeners=[...['touchstart','touchmove','touchend','touchcancel'].map(type=>[type,touch]),
  ...['gesturestart','gesturechange','gestureend'].map(type=>[type,gesture])];
 for(const[type,handler]of listeners)root.addEventListener(type,handler,options);
 const api={
  // Call when combat unlocks or the viewport is interrupted. Settings may live
  // outside root, so their events need not reach this module to release a latch.
  reset(){
   for(const id of contacts.keys())contacts.set(id,false);
   blocked=contacts.size>0;gestureOwned=false;
  },
  destroy(){
  if(destroyed)return;destroyed=true;
  for(const[type,handler]of listeners)root.removeEventListener(type,handler,options);
  contacts.clear();gestureOwned=false;mounts.delete(root);
 }};
 mounts.set(root,api);return api;
}
