import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';
const moduleURL=new URL('../dist/page-zoom-gestures.mjs',import.meta.url);
const {mountPageZoomGuard,bindPageZoomPreference}=existsSync(moduleURL)?await import(moduleURL):{};
class Node extends EventTarget{
 constructor(tag,parent=null,attrs={}){super();this.tagName=tag.toUpperCase();this.parentElement=parent;this.attrs=attrs;this.registrations=[];}
 getAttribute(key){return this.attrs[key]??null;}
 matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s.startsWith('['))return Object.hasOwn(this.attrs,s.slice(1,-1));return s===this.tagName.toLowerCase();});}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
 contains(node){for(;node;node=node.parentElement)if(node===this)return true;return false;}
 addEventListener(type,handler,options){this.registrations.push({type,options});super.addEventListener(type,handler,options);}
}
function fixture(){
 assert.equal(typeof mountPageZoomGuard,'function','page zoom guard must be implemented');
 const root=new Node('document'),body=new Node('body',root),shell=new Node('main',body),canvas=new Node('canvas',shell),pause=new Node('section',shell),pauseText=new Node('p',pause),resume=new Node('button',pause),dialog=new Node('dialog',body),scroll=new Node('div',dialog),text=new Node('p',scroll),range=new Node('input',scroll,{type:'range'}),checkbox=new Node('input',scroll,{type:'checkbox'}),label=new Node('label',scroll),outside=new Node('article',body);
 let allowZoom=false;
 const options={root,ownsTarget:target=>target===body||shell.contains(target)||dialog.contains(target),allowsZoom:()=>allowZoom};
 const guard=mountPageZoomGuard(options);
 const point=(identifier,target,x=100,y=100)=>({identifier,target,clientX:x,clientY:y});
 const fire=(type,target,props={})=>{const event=new Event(type,{cancelable:true,bubbles:true});Object.defineProperties(event,Object.fromEntries(Object.entries({target,...props}).map(([key,value])=>[key,{value,configurable:true}])));root.dispatchEvent(event);return event;};
 const touch=(type,changed,touches=changed,timeStamp=100)=>fire(type,changed[0]?.target||shell,{changedTouches:changed,touches,timeStamp});
 const tap=(target,time=100,x=100,y=100)=>{const finger=point(1,target,x,y);touch('touchstart',[finger],[finger],time);return touch('touchend',[finger],[],time+40);};
 return{root,body,shell,canvas,pauseText,resume,dialog,scroll,text,range,checkbox,label,outside,guard,options,point,fire,touch,tap,setAllowZoom:value=>{allowZoom=value;}};
}
test('pinch is blocked in battle, pause, settings, toolbar-sized shell gaps and safe-area gutters',()=>{
 for(const area of['canvas','pauseText','text','body','shell','resume','range','checkbox']){
  const h=fixture(),a=h.point(1,h[area]),b=h.point(2,h[area],140,100);
  assert.equal(h.touch('touchstart',[a]).defaultPrevented,false,'single finger remains native: '+area);
  assert.equal(h.touch('touchstart',[b],[a,b]).defaultPrevented,true,area);
  assert.equal(h.touch('touchmove',[a,b],[a,b]).defaultPrevented,true,area);
  assert.equal(h.touch('touchend',[b],[a]).defaultPrevented,true,area);
  assert.equal(h.touch('touchend',[a],[]).defaultPrevented,true,area);
  assert.equal(h.tap(h[area],1000).defaultPrevented,false,'new single tap works: '+area);
 }
});
test('settings single-finger scrolling, slider dragging and native control activation are never canceled',()=>{
 for(const area of['scroll','text','range','checkbox','label','resume']){
  const h=fixture(),a=h.point(1,h[area]);
  assert.equal(h.touch('touchstart',[a]).defaultPrevented,false);
  const moved={...a,clientY:180};
  assert.equal(h.touch('touchmove',[moved],[moved]).defaultPrevented,false);
  assert.equal(h.touch('touchend',[moved],[],300).defaultPrevented,false);
 }
 for(const area of['range','checkbox','label','resume']){
  const h=fixture();assert.equal(h.tap(h[area]).defaultPrevented,false);assert.equal(h.tap(h[area],250).defaultPrevented,false,'repeat click stays native: '+area);
 }
});
test('rapid nearby repeated taps on text and empty surfaces suppress double-tap zoom',()=>{
 for(const area of['canvas','pauseText','text','body','shell']){
  const h=fixture();assert.equal(h.tap(h[area]).defaultPrevented,false);assert.equal(h.tap(h[area],250,112,110).defaultPrevented,true,area);assert.equal(h.tap(h[area],400).defaultPrevented,true,'third tap does not revive zoom');
 }
});
test('Safari Touch prototype getters are copied explicitly for double-tap distance',()=>{
 const h=fixture();
 const nativePoint=Object.create({identifier:1,target:h.text,clientX:100,clientY:100});
 h.touch('touchstart',[nativePoint],[nativePoint],100);h.touch('touchend',[nativePoint],[],140);
 h.touch('touchstart',[nativePoint],[nativePoint],250);
 assert.equal(h.touch('touchend',[nativePoint],[],290).defaultPrevented,true);
});
test('distant taps, long presses and drags are not misidentified as double taps',()=>{
 const h=fixture();h.tap(h.text);assert.equal(h.tap(h.text,250,200,200).defaultPrevented,false);
 assert.equal(h.tap(h.text,1000,200,200).defaultPrevented,false);
 const finger=h.point(1,h.text,200,200);h.touch('touchstart',[finger],[finger],1100);assert.equal(h.touch('touchend',[finger],[],1800).defaultPrevented,false,'long-press selection');
 h.touch('touchstart',[finger],[finger],1900);const moved={...finger,clientY:240};h.touch('touchmove',[moved],[moved],1940);assert.equal(h.touch('touchend',[moved],[],2000).defaultPrevented,false);
});
test('Safari gesture fallback covers the separate modal and follows owned touch origin across retargeting',()=>{
 const h=fixture();
 for(const area of['canvas','pauseText','dialog','body'])for(const kind of['gesturestart','gesturechange','gestureend'])assert.equal(h.fire(kind,h[area]).defaultPrevented,true,area+' '+kind);
 assert.equal(h.fire('gesturechange',h.text).defaultPrevented,false,'no stale ownership');
 const a=h.point(1,h.text),b=h.point(2,h.range);h.touch('touchstart',[a]);h.touch('touchstart',[b],[a,b]);
 assert.equal(h.fire('gesturestart',h.root).defaultPrevented,true,'Safari may retarget to document');
 h.touch('touchend',[a,b],[]);assert.equal(h.fire('gestureend',h.root).defaultPrevented,true);
});
test('outside or unknown contacts retain native gestures, even if a guarded contact is added later',()=>{
 const h=fixture(),a=h.point(1,h.text),outside=h.point(2,h.outside);
 h.touch('touchstart',[a]);assert.equal(h.touch('touchstart',[outside],[a,outside]).defaultPrevented,false);
 assert.equal(h.fire('gesturestart',h.dialog).defaultPrevented,false);
 assert.equal(h.touch('touchend',[outside],[a]).defaultPrevented,false);
 assert.equal(h.touch('touchend',[a],[]).defaultPrevented,false);
 assert.equal(h.fire('gesturestart',h.outside).defaultPrevented,false);
 assert.equal(h.fire('gesturechange',h.text).defaultPrevented,false);
 const unknown=h.point(8,h.text);assert.equal(h.touch('touchmove',[unknown],[a,unknown]).defaultPrevented,false);
});
test('explicit accessible zoom preference restores pinch while continuing to suppress double tap',()=>{
 const h=fixture();h.setAllowZoom(true);
 const a=h.point(1,h.text),b=h.point(2,h.text,140,100);h.touch('touchstart',[a]);assert.equal(h.touch('touchstart',[b],[a,b]).defaultPrevented,false);
 assert.equal(h.fire('gesturestart',h.text).defaultPrevented,false);
 h.setAllowZoom(false);assert.equal(h.touch('touchmove',[a,b],[a,b]).defaultPrevented,false,'an existing native sequence is not captured');h.touch('touchend',[a,b],[]);
 h.setAllowZoom(true);h.tap(h.text,1000);assert.equal(h.tap(h.text,1150).defaultPrevented,true);
});
test('cancel, reset, missed endings, idempotent mount and destroy leave no stuck gesture or tap latch',()=>{
 const h=fixture(),a=h.point(1,h.text),b=h.point(2,h.text,140,100);
 assert.equal(mountPageZoomGuard(h.options),h.guard);h.tap(h.text);h.guard.reset();assert.equal(h.tap(h.text,250).defaultPrevented,false);
 h.touch('touchstart',[a]);h.touch('touchstart',[b],[a,b]);h.fire('gesturestart',h.text);h.guard.reset();assert.equal(h.fire('gesturechange',h.text).defaultPrevented,false);assert.equal(h.touch('touchmove',[a,b],[a,b]).defaultPrevented,false);h.touch('touchcancel',[a,b],[]);
 const c=h.point(9,h.text);h.touch('touchstart',[c],[c],1000);assert.equal(h.touch('touchstart',[b],[c,b],1050).defaultPrevented,true,'fresh snapshot recovers');
 assert.equal(h.fire('gesturestart',h.text,{cancelable:false}).defaultPrevented,false);
 for(const entry of h.root.registrations){assert.equal(entry.options.capture,true);assert.equal(entry.options.passive,false);}
 let seen=0;h.root.addEventListener('touchstart',()=>seen++);h.touch('touchstart',[b],[c,b]);assert.equal(seen,1,'no stopPropagation');
 h.guard.destroy();h.guard.destroy();assert.equal(h.touch('touchstart',[a,b]).defaultPrevented,false);
});
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
test('game shell and settings default to scroll without pinch while accessible zoom stays opt-in',()=>{
 const css=['mobile-game.css','settings.css'].map(read).join('\n'),style=selectors=>stylesAt(css,selectors,{width:844,height:390});
 for(const selector of['#viewport-shell','#help-dialog','.settings-scroll','.detail-scroll'])assert.equal(style([selector])['touch-action'],'pan-x pan-y',selector);
 assert.equal(style(['#viewport-shell','html[data-allow-page-zoom="true"] #viewport-shell'])['touch-action'],'manipulation');
 assert.equal(style(['#help-dialog','html[data-allow-page-zoom="true"] #help-dialog'])['touch-action'],'manipulation');
 assert.equal(style(['input[type="range"]','.settings-audio-row input[type="range"]'])['touch-action'],'pan-x');
 assert.doesNotMatch(read('index.html').match(/name="viewport"[^>]+/)[0],/user-scalable|maximum-scale|minimum-scale/);
});

test('accessible pinch preference defaults off, restores saved choice and saves only user changes',()=>{
 assert.equal(typeof bindPageZoomPreference,'function');
 const values=new Map(),writes=[],storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes.push([key,value]);values.set(key,value);}};
 const control=new Node('input'),root={dataset:{}};
 const preference=bindPageZoomPreference({control,root,storage});
 assert.equal(control.checked,false);assert.equal(preference.enabled,false);assert.equal(root.dataset.allowPageZoom,'false');assert.deepEqual(writes,[]);
 control.checked=true;control.dispatchEvent(new Event('change'));assert.equal(preference.enabled,true);assert.equal(root.dataset.allowPageZoom,'true');assert.equal(writes.length,1);
 const restored=bindPageZoomPreference({control:new Node('input'),root:{dataset:{}},storage});assert.equal(restored.enabled,true);assert.equal(writes.length,1);
 preference.destroy();control.checked=false;control.dispatchEvent(new Event('change'));assert.equal(writes.length,1);
 const unavailable=bindPageZoomPreference({control:new Node('input'),root:{dataset:{}},storage:{getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}}});assert.equal(unavailable.enabled,false);
});
