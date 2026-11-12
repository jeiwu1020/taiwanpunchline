import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {PointerControls} from '../dist/touch-controls.mjs';

const moduleURL=new URL('../dist/battle-gestures.mjs',import.meta.url);
const {mountBattleGestures}=existsSync(moduleURL)?await import(moduleURL):{};

// Node has real Event/EventTarget cancellation and listener dispatch, but no DOM
// or TouchEvent. Only the element tree and browser touch payload are substituted.
class Element extends EventTarget{
 constructor(tag='div',attributes={}){super();this.tagName=tag.toUpperCase();this.attributes=attributes;this.parentElement=null;this.children=[];this.registrations=[];this.rect={left:20,top:60,right:820,bottom:370,width:800,height:310};}
 append(tag,attributes={}){const node=new Element(tag,attributes);node.parentElement=this;this.children.push(node);return node;}
 getAttribute(name){return this.attributes[name]??null;}
 matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s[0]==='#')return this.attributes.id===s.slice(1);if(s[0]==='.')return(this.attributes.class||'').split(' ').includes(s.slice(1));if(s[0]==='[')return Object.hasOwn(this.attributes,s.slice(1,-1));return this.tagName.toLowerCase()===s;});}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
 contains(node){for(;node;node=node.parentElement)if(node===this)return true;return false;}
 querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;const found=child.querySelector(selector);if(found)return found;}return null;}
 getBoundingClientRect(){return this.rect;}
 addEventListener(type,handler,options){this.registrations.push({type,options});super.addEventListener(type,handler,options);}
}

function fixture(){
 assert.equal(typeof mountBattleGestures,'function','battle gesture fallback must be implemented');
 const body=new Element('body'),root=body.append('div',{id:'viewport-shell'}),app=root.append('main',{class:'app'});
 const header=app.append('header'),toolbar=header.append('div',{class:'toolbar'}),help=toolbar.append('button');
 const cabinet=app.append('section',{class:'cabinet'}),stage=cabinet.append('div',{class:'stage-wrap'}),game=stage.append('div',{id:'game'}),canvas=game.append('canvas');
 const menu=stage.append('div',{id:'menu',class:'screen menu'}),menuButton=menu.append('button');
 const pause=stage.append('div',{id:'pause-screen',class:'screen'}),resume=pause.append('button');
 const result=stage.append('div',{id:'result',class:'screen'}),resultText=result.append('p');
 const deck=cabinet.append('div',{class:'control-deck'}),pad=deck.append('div',{class:'touch-pad'}),stick=pad.append('div',{id:'touch-stick'}),knob=stick.append('span');
 const punch=deck.append('button',{'data-hold':'punch'}),special=deck.append('button',{'data-action':'special1'}),specialText=special.append('strong');
 const under=app.append('div',{class:'under'}),text=under.append('p');
 const dialog=body.append('dialog',{id:'help-dialog'}),input=dialog.append('input');
 let active=true;
 const options={root,isProtected:()=>active},api=mountBattleGestures(options);
 const touch=(identifier,target,x=100,y=200)=>({identifier,target,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y,radiusX:6,radiusY:6,rotationAngle:0,force:1});
 const fire=(type,target=stick,properties={})=>{
  const event=new Event(type,{cancelable:true,bubbles:true});
  Object.defineProperties(event,Object.fromEntries(Object.entries({target,...properties}).map(([key,value])=>[key,{value,configurable:true}])));
  root.dispatchEvent(event);return event;
 };
 const touchEvent=(type,changed,touches=changed,extra={})=>fire(type,changed[0]?.target||root,{changedTouches:changed,touches,targetTouches:touches.filter(t=>t.target===changed[0]?.target),...extra});
 return{body,root,app,header,help,cabinet,stage,canvas,menuButton,resume,resultText,deck,pad,stick,knob,punch,specialText,text,dialog,input,api,options,touch,fire,touchEvent,setActive:value=>{active=value;}};
}

test('each protected tap cancels its native default, including repeated near-stick taps',()=>{
 const h=fixture();
 for(const target of[h.stick,h.knob,h.pad,h.canvas,h.deck,h.cabinet])for(let tap=0;tap<3;tap++){
  const finger=h.touch(1,target);
  assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
  assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,true);
 }
});

test('two battle fingers stay protected through pinch moves and independent releases',()=>{
 const h=fixture(),stick=h.touch(4,h.stick),attack=h.touch(9,h.punch,700,300);
 assert.equal(h.touchEvent('touchstart',[stick]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchstart',[attack],[stick,attack]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchmove',[{...stick,clientX:50},{...attack,clientX:780}],[stick,attack]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchend',[attack],[stick]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchmove',[stick],[stick]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchend',[stick],[]).defaultPrevented,true);
});

test('a protected touch may drag outside the battle without losing its original ownership',()=>{
 const h=fixture(),finger=h.touch(1,h.stick);
 h.touchEvent('touchstart',[finger]);
 assert.equal(h.touchEvent('touchmove',[{...finger,clientX:2,clientY:4}],[finger]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,true);
});

test('shell-targeted empty battle space is guarded by the live physical cabinet rectangle',()=>{
 const h=fixture();
 for(const [x,y,want]of[[20,60,true],[819,369,true],[19,200,false],[100,59,false],[821,200,false],[100,371,false]]){
  const finger=h.touch(1,h.root,x,y);
  assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,want,`${x}, ${y}`);
  h.touchEvent('touchend',[finger],[]);
 }
 // A 90-degree-transformed cabinet reports physical coordinates, not logical game axes.
 h.cabinet.rect={left:60,top:20,right:370,bottom:820,width:310,height:800};
 const finger=h.touch(2,h.app,200,700);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
});

test('toolbar, menu, pause, result and outside text retain native gestures even during combat',()=>{
 const h=fixture();
 for(const target of[h.help,h.header,h.menuButton,h.resume,h.resultText,h.text,h.dialog,h.input,h.body]){
  const finger=h.touch(1,target);
  for(const kind of['touchstart','touchmove','touchend'])assert.equal(h.touchEvent(kind,[finger],kind==='touchend'?[]:[finger]).defaultPrevented,false,kind+' on '+target.tagName);
  for(const kind of['gesturestart','gesturechange','gestureend'])assert.equal(h.fire(kind,target).defaultPrevented,false);
 }
});

test('links, text fields, editable text and opt-out regions inside the cabinet remain native',()=>{
 const h=fixture();
 for(const [tag,attributes]of[['a',{href:'#'}],['input',{}],['textarea',{}],['select',{}],['label',{}],['button',{}],['summary',{}],['div',{contenteditable:''}],['div',{contenteditable:'plaintext-only'}],['div',{'data-native-gestures':''}]]){
  const target=h.cabinet.append(tag,attributes).append('span'),finger=h.touch(1,target);
  assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,false,tag);
  assert.equal(h.touchEvent('touchmove',[finger]).defaultPrevented,false,tag);
  assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,false,tag);
 }
 const literal=h.cabinet.append('span',{contenteditable:'false'}),finger=h.touch(2,literal);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
});

test('game action button descendants stay protected despite native-button exclusions',()=>{
 const h=fixture(),finger=h.touch(1,h.specialText);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
 assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,true);
});

test('menu-origin touches never become protected by moving inside or activating combat',()=>{
 const h=fixture(),finger=h.touch(1,h.canvas);
 h.setActive(false);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,false);
 h.setActive(true);
 assert.equal(h.touchEvent('touchmove',[finger]).defaultPrevented,false);
 assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,false);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true,'the next independent battle sequence is protected');
});

test('opening settings releases protection and closing it cannot capture an old touch',()=>{
 const h=fixture(),finger=h.touch(1,h.canvas);
 h.touchEvent('touchstart',[finger]);h.fire('gesturestart',h.canvas);
 h.setActive(false);
 assert.equal(h.touchEvent('touchmove',[finger]).defaultPrevented,false);
 assert.equal(h.fire('gesturechange',h.canvas).defaultPrevented,false);
 h.setActive(true);
 assert.equal(h.touchEvent('touchmove',[finger]).defaultPrevented,false);
 assert.equal(h.fire('gesturechange',h.canvas).defaultPrevented,false);
 assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,false);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
});

test('a sequence including an outside/native finger is never hijacked by a battle finger',()=>{
 for(const startOutside of[true,false]){
  const h=fixture(),battle=h.touch(1,h.stick),outside=h.touch(2,h.input);
  if(!startOutside)h.touchEvent('touchstart',[battle]);
  const changed=startOutside?[battle]:[outside];
  assert.equal(h.touchEvent('touchstart',changed,[battle,outside]).defaultPrevented,false);
  assert.equal(h.touchEvent('touchmove',[battle],[battle,outside]).defaultPrevented,false);
  assert.equal(h.fire('gesturestart',h.stick).defaultPrevented,false);
  assert.equal(h.touchEvent('touchend',[outside],[battle]).defaultPrevented,false);
  assert.equal(h.touchEvent('touchmove',[battle]).defaultPrevented,false,'mixed ownership stays native until all fingers lift');
  h.touchEvent('touchend',[battle],[]);
  assert.equal(h.touchEvent('touchstart',[battle]).defaultPrevented,true);
 }
});

test('a native contact arriving after gesturestart also releases the Safari gesture latch',()=>{
 const h=fixture(),battle=h.touch(1,h.stick),outside=h.touch(2,h.input);
 h.touchEvent('touchstart',[battle]);
 assert.equal(h.fire('gesturestart',h.stick).defaultPrevented,true);
 h.touchEvent('touchmove',[battle],[battle,outside]);
 assert.equal(h.fire('gesturechange',h.stick).defaultPrevented,false);
 assert.equal(h.fire('gestureend',h.stick).defaultPrevented,false);
});

test('explicit lifecycle reset releases a stale sequence even when settings produced no root events',()=>{
 const h=fixture(),finger=h.touch(1,h.stick);
 h.touchEvent('touchstart',[finger]);h.fire('gesturestart',h.stick);
 h.setActive(false);h.api.reset();h.setActive(true);
 assert.equal(h.fire('gesturechange',h.stick).defaultPrevented,false);
 assert.equal(h.fire('gesturestart',h.stick).defaultPrevented,false,'reset must retain knowledge that the old contact is now native');
 assert.equal(h.touchEvent('touchmove',[finger]).defaultPrevented,false);
 assert.equal(h.touchEvent('touchend',[finger],[]).defaultPrevented,false);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
});

test('Safari gesture events are scoped to their protected starting target',()=>{
 const h=fixture();
 for(const type of['gesturestart','gesturechange','gestureend'])assert.equal(h.fire(type,h.canvas,{scale:type==='gesturechange'?1.8:1}).defaultPrevented,true,type);
 assert.equal(h.fire('gesturechange',h.canvas).defaultPrevented,false,'stray change without a protected start');
 assert.equal(h.fire('gesturestart',h.menuButton).defaultPrevented,false);
 assert.equal(h.fire('gesturechange',h.canvas).defaultPrevented,false,'native-origin gesture stays native');
 const finger=h.touch(1,h.stick);h.touchEvent('touchstart',[finger]);
 assert.equal(h.fire('gesturestart',h.root).defaultPrevented,true,'Safari may retarget a pinch to the shell without coordinates');
 assert.equal(h.fire('gesturechange',h.root).defaultPrevented,true);
 h.touchEvent('touchend',[finger],[]);
 assert.equal(h.fire('gestureend',h.root).defaultPrevented,true,'gestureend may follow the final touchend');
});

test('noncancelable events and canceled or missed touch sequences cannot poison the next tap',()=>{
 const h=fixture(),finger=h.touch(1,h.stick);
 for(const type of['touchstart','touchmove','touchcancel'])assert.equal(h.touchEvent(type,[finger],type==='touchcancel'?[]:[finger],{cancelable:false}).defaultPrevented,false);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
 assert.equal(h.fire('gesturestart',h.stick,{cancelable:false}).defaultPrevented,false);
 assert.equal(h.fire('gesturechange',h.stick,{cancelable:false}).defaultPrevented,false);
 // A lost touchend is recovered by the next touchstart's complete active list.
 const next=h.touch(7,h.canvas);
 assert.equal(h.touchEvent('touchstart',[next],[next]).defaultPrevented,true);
 h.touchEvent('touchend',[next],[]);
 assert.equal(h.touchEvent('touchmove',[finger],[finger]).defaultPrevented,false,'unobserved start must not be adopted');
});

test('mount is idempotent and listeners are root-scoped, non-passive and removable',()=>{
 const h=fixture();
 assert.equal(mountBattleGestures(h.options),h.api);
 assert.deepEqual(h.root.registrations.map(v=>v.type).sort(),['gesturechange','gestureend','gesturestart','touchcancel','touchend','touchmove','touchstart']);
 for(const {options}of h.root.registrations){assert.equal(options.passive,false);assert.equal(options.capture,true);}
 assert.equal(h.body.registrations.length,0);
 h.api.destroy();h.api.destroy();
 const finger=h.touch(1,h.stick);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,false);
 const mounted=mountBattleGestures(h.options);
 assert.notEqual(mounted,h.api);
 assert.equal(h.touchEvent('touchstart',[finger]).defaultPrevented,true);
});

test('native event propagation, independent pointer controls and audio unlock remain untouched',()=>{
 const h=fixture(),actions=[],input=new PointerControls({onAction:a=>actions.push(a)});
 let unlocks=0,touchesSeen=0,clicks=0;
 h.root.addEventListener('pointerdown',()=>unlocks++);
 h.root.addEventListener('touchstart',()=>touchesSeen++);
 h.root.addEventListener('click',()=>clicks++);
 h.root.addEventListener('pointerdown',e=>{if(e.target===h.stick)input.stick(e.pointerId,35,0,42);else input.button(e.pointerId,'punch',true);});
 h.root.addEventListener('pointerup',e=>input.release(e.pointerId));
 h.fire('pointerdown',h.stick,{pointerId:1});
 const stick=h.touch(1,h.stick),attack=h.touch(2,h.punch);
 const start=h.touchEvent('touchstart',[stick]);
 assert.equal(start.cancelBubble,false);
 h.fire('pointerdown',h.punch,{pointerId:2});h.touchEvent('touchstart',[attack],[stick,attack]);
 h.fire('gesturestart',h.stick);h.fire('gesturechange',h.stick,{scale:1.5});
 assert.deepEqual([...input.held].sort(),['punch','right']);assert.deepEqual(actions,['punch']);
 h.fire('pointerup',h.punch,{pointerId:2});h.touchEvent('touchend',[attack],[stick]);
 assert.deepEqual([...input.held],['right']);
 h.fire('pointerup',h.stick,{pointerId:1});h.touchEvent('touchend',[stick],[]);
 assert.equal(input.held.size,0);assert.equal(unlocks,2);assert.equal(touchesSeen,2);assert.equal(clicks,0,'no compatibility clicks are synthesized');
});
