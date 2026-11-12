import {logicalPointer} from './viewport-geometry.mjs?v=post69-street-seam-cull-20261112-r1';
export class PointerControls{
 constructor({onHold=()=>{},onAction=()=>{},onVisual=()=>{},directionMode=()=>'duel'}={}){this.directionMode=directionMode;this.onHold=onHold;this.onAction=onAction;this.onVisual=onVisual;this.owner=null;this.directions=new Set();this.buttons=new Map();this.held=new Set();this.up=false;}
 sync(){const next=new Set([...this.directions,...[...this.buttons.values()].filter(v=>v.hold).map(v=>v.action)]);for(const action of new Set([...this.held,...next]))if(this.held.has(action)!==next.has(action))this.onHold(action,next.has(action));this.held=next;}
 button(id,action,hold){if(this.buttons.has(id)||this.owner===id)return;const wasHeld=this.held.has(action);this.buttons.set(id,{action,hold});this.sync();if(!hold||(action==='punch'&&!wasHeld))this.onAction(action);}
 stick(id,x,y,radius){if((this.owner!==null&&this.owner!==id)||this.buttons.has(id))return;this.owner=id;const d=Math.hypot(x,y),limit=radius*.62,f=d>limit?limit/d:1,dx=x*f,dy=y*f,threshold=radius*.24;const next=new Set();if(dx<-threshold)next.add('left');if(dx>threshold)next.add('right');const depth=this.directionMode()==='depth';if(dy>threshold)next.add(depth?'down':'crouch');const up=dy<-threshold;if(depth&&up)next.add('up');else if(up&&!this.up)this.onAction('jump');this.up=up;this.directions=next;this.onVisual(dx,dy);this.sync();}
 release(id){this.buttons.delete(id);if(this.owner===id){this.owner=null;this.directions.clear();this.up=false;this.onVisual(0,0);}this.sync();}
 clear(){this.buttons.clear();this.owner=null;this.directions.clear();this.up=false;this.onVisual(0,0);this.sync();}
}
// DOM buttons retain browser hit testing after transforms. Only the dragged
// thumbstick needs the inverse rotation; pointer ownership is never shared.
export function bindTouchControls({document,window,active,rotation,viewport=null,onHold,onAction,directionMode=()=> 'duel',stickSelector='#touch-stick',knobSelector='#touch-knob',buttonSelector='[data-hold],[data-action]'}){
 const stick=document.querySelector(stickSelector),knob=document.querySelector(knobSelector),root=document.querySelector('#trial-app')||document.querySelector('.app');
 const targets=new Map(),gestures=new Map(),listeners=[];
 const listen=(target,type,fn,options)=>{target?.addEventListener?.(type,fn,options);listeners.push([target,type,fn,options]);};
 const state=()=>viewport?.()||{ready:root?.dataset?.viewportReady!=='false',epoch:Number(root?.dataset?.viewportEpoch)||0,rotation:rotation()};
 const input=new PointerControls({onHold,onAction,directionMode,onVisual:(x,y)=>{if(knob)knob.style.transform=`translate(${x}px,${y}px)`;}});
 const capture=(el,e)=>{try{el.setPointerCapture(e.pointerId);targets.set(e.pointerId,el);const current=state();gestures.set(e.pointerId,{epoch:current.epoch,rotation:current.rotation??rotation(),bounds:el===stick?el.getBoundingClientRect():null,width:el.offsetWidth,height:el.offsetHeight});return true;}catch{return false;}};
 const allowed=e=>active()&&state().ready!==false&&!(e.pointerType==='mouse'&&e.button!==0);
 function currentGesture(e){const gesture=gestures.get(e.pointerId),current=state();if(!active()||current.ready===false||gesture&&gesture.epoch!==current.epoch){clear();return null;}return gesture;}
 const stickMove=e=>{if(input.owner!==e.pointerId)return;const gesture=currentGesture(e);if(!gesture)return;if(e.pointerType==='mouse'&&e.buttons===0){release(e);return;}const {bounds,width:w,height:h}=gesture,p=logicalPointer(e.clientX,e.clientY,bounds,gesture.rotation,w,h);input.stick(e.pointerId,p.x-w/2,p.y-h/2,w/2);};
 if(stick){listen(stick,'pointerdown',e=>{if(!allowed(e)||input.owner!==null)return;e.preventDefault();if(!capture(stick,e))return;input.owner=e.pointerId;stickMove(e);});listen(stick,'pointermove',stickMove);listen(stick,'lostpointercapture',release);}
 for(const b of document.querySelectorAll(buttonSelector)){listen(b,'pointerdown',e=>{if(!allowed(e)||b.disabled||input.owner===e.pointerId||input.buttons.has(e.pointerId))return;e.preventDefault();if(!capture(b,e))return;input.button(e.pointerId,b.dataset.hold||b.dataset.action,!!b.dataset.hold);b.classList.add('held');});listen(b,'pointermove',checkPointer);for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(b,event,release);}
 function checkPointer(e){if((e.pointerType==='mouse'||e.pointerType==='pen')&&e.buttons===0)release(e);else currentGesture(e);}
 function release(e){input.release(e.pointerId);gestures.delete(e.pointerId);const target=targets.get(e.pointerId);targets.delete(e.pointerId);if(target){if(![...targets.values()].includes(target))target.classList.remove('held');try{if(target.hasPointerCapture?.(e.pointerId))target.releasePointerCapture(e.pointerId);}catch{}}}
 function clear(){input.clear();for(const id of [...targets.keys()])release({pointerId:id});}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(window,type,release,true);listen(window,'pointermove',checkPointer,true);
 for(const type of ['blur','pagehide','orientationchange'])listen(window,type,clear);
 listen(window,'parliamentviewportchange',()=>{const current=state();if(current.ready===false||[...gestures.values()].some(g=>g.epoch!==current.epoch))clear();});
 listen(document,'visibilitychange',()=>{if(document.hidden)clear();});
 return {input,clear,destroy(){clear();for(const [target,type,fn,options]of listeners)target?.removeEventListener?.(type,fn,options);}};
}
