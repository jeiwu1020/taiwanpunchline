import {EventEmitter} from 'node:events';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mountGameViewport} from '../dist/game-viewport.mjs';

function setup(){
 const names=['document','window','navigator','getComputedStyle','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'];
 const old=Object.fromEntries(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const nodes=new Map(),listeners=new Map(),vvListeners=new Map(),frames=new Map();let seq=0,clears=0,time=0;
 const $=s=>{if(!nodes.has(s))nodes.set(s,{style:{},dataset:{},clientWidth:500,clientHeight:260,setAttribute(k,v){this[k]=v;},getBoundingClientRect(){const shell=nodes.get('#viewport-shell');return {left:parseFloat(shell?.style.left)||0,top:parseFloat(shell?.style.top)||0,width:parseFloat(shell?.style.width)||390,height:parseFloat(shell?.style.height)||720};}});return nodes.get(s);};
 const win={performance:{now:()=>time},innerWidth:390,innerHeight:720,scrollX:0,scrollY:0,location:{search:'?touchPreview=1'},matchMedia:()=>({matches:true}),
  addEventListener(n,f){listeners.set(n,f);},scrollTo(x,y){this.scrollX=typeof x==='object'?x.left:x;this.scrollY=typeof x==='object'?x.top:y;}};
 win.visualViewport={width:390,height:720,offsetLeft:0,offsetTop:0,scale:1,addEventListener(n,f){vvListeners.set(n,f);}};
 const safe={paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{querySelector:$,scrollingElement:{scrollLeft:0,scrollTop:0}}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{maxTouchPoints:1}});
 globalThis.window=win;globalThis.getComputedStyle=()=>safe;globalThis.ResizeObserver=class{observe(){}};
 globalThis.requestAnimationFrame=fn=>{frames.set(++seq,fn);return seq;};globalThis.cancelAnimationFrame=n=>frames.delete(n);
 win.requestAnimationFrame=globalThis.requestAnimationFrame;win.cancelAnimationFrame=globalThis.cancelAnimationFrame;
 const game={canvas:{width:500,height:260},events:new EventEmitter(),renderer:{width:500,height:260,resize(w,h){this.width=w;this.height=h;},gameContext:{isContextLost:()=>false}}};
 const scene={game,scale:{width:500,height:260,resize(w,h){this.width=w;this.height=h;}},cameraView:{}};
 const ui=mountGameViewport({scene,clearHold(){clears++;}});
 return {$,win,ui,safe,scene,listeners,vvListeners,frames,get clears(){return clears;},tick(){const batch=[...frames.entries()];frames.clear();time+=16;for(const[,fn]of batch)fn(time);ui.frameDrawn(ui.token);game.events.emit('postrender');},settle(){for(let n=0;frames.size&&n<160;n++)this.tick();assert.equal(frames.size,0,'settling must be bounded');},cleanup(){for(const[k,d]of Object.entries(old)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};
}

test('stale visualViewport orientation cannot strand a returned portrait phone in landscape',()=>{const h=setup();try{
 Object.assign(h.win,{innerWidth:844,innerHeight:390});Object.assign(h.win.visualViewport,{width:844,height:390});h.listeners.get('resize')();h.settle();assert.equal(h.ui.rotation,0);
 Object.assign(h.win,{innerWidth:390,innerHeight:720});h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.ui.rotation,90);assert.equal(h.ui.frame.screenWidth,390);assert.equal(h.ui.frame.screenHeight,720);
}finally{h.cleanup();}});

test('viewport invalidation releases pointers immediately and only resumes after stable geometry',()=>{const h=setup();try{
 const before=h.clears;h.listeners.get('resize')();assert.ok(h.clears>before);assert.equal(h.ui.ready,false);
 h.tick();assert.equal(h.ui.ready,false);h.settle();assert.equal(h.ui.ready,true);assert.equal(h.$('.app').dataset.viewportReady,'true');
}finally{h.cleanup();}});

test('late safe-area and viewport changes are sampled after the first orientation frame',()=>{const h=setup();try{
 h.listeners.get('orientationchange')({type:'orientationchange'});h.tick();Object.assign(h.win,{innerWidth:844,innerHeight:390});Object.assign(h.win.visualViewport,{width:844,height:390});h.safe.paddingLeft='47';h.safe.paddingRight='47';h.safe.paddingBottom='21';h.settle();
 assert.equal(h.ui.rotation,0);assert.equal(h.ui.frame.left,0);assert.equal(h.ui.frame.width,844);assert.equal(h.ui.frame.height,390);
}finally{h.cleanup();}});

test('contradictory full-height visual offset keeps a bounded shell protected',()=>{const h=setup();try{
 const before=h.clears;h.win.visualViewport.offsetTop=95;h.vvListeners.get('scroll')();assert.ok(h.clears>before);h.settle();
 assert.equal(h.$('#viewport-shell').style.top,'0px');assert.equal(h.$('#help-dialog').style.top,'360px');assert.equal(h.ui.ready,false);assert.equal(h.ui.status,'blocked');
}finally{h.cleanup();}});

test('root scroll is restored on orientation while inner settings scroll is not touched',()=>{const h=setup();try{
 h.win.scrollY=60;h.$('#help-dialog').scrollTop=125;h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.win.scrollY,0);assert.equal(h.$('#help-dialog').scrollTop,125);
}finally{h.cleanup();}});

test('valid zoomed viewport is not mistaken for stale orientation',()=>{const h=setup();try{
 Object.assign(h.win.visualViewport,{width:300,height:200,scale:1.5,offsetLeft:20,offsetTop:30});h.vvListeners.get('resize')();h.settle();assert.equal(h.ui.frame.screenWidth,300);assert.equal(h.ui.frame.screenHeight,200);assert.equal(h.ui.frame.left,20);assert.equal(h.ui.frame.top,30);
}finally{h.cleanup();}});

test('boot-to-mounted handoff resamples late viewport changes before accepting input',()=>{const h=setup();try{
 assert.equal(h.ui.ready,false,'mount keeps an inherited orientation transition gated');
 h.tick();Object.assign(h.win,{innerWidth:844,innerHeight:390});Object.assign(h.win.visualViewport,{width:844,height:390});h.settle();
 assert.equal(h.ui.rotation,0);assert.equal(h.ui.ready,true);
}finally{h.cleanup();}});

test('overlay flag distinguishes physical landscape from rotated portrait and portrait pinch',()=>{const h=setup();try{
 h.settle();assert.equal(h.$('.app').dataset.nativeLandscape,'false');
 Object.assign(h.win,{innerWidth:844,innerHeight:390});Object.assign(h.win.visualViewport,{width:844,height:390});h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.$('.app').dataset.nativeLandscape,'true');
 Object.assign(h.win,{innerWidth:390,innerHeight:720});Object.assign(h.win.visualViewport,{width:300,height:200,scale:1.5});h.ui.setPreferences({rotate:false});h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.$('.app').dataset.nativeLandscape,'false');
}finally{h.cleanup();}});

test('V34 overlay follows rotation, repeated direction changes, and safe areas without becoming desktop or upright',()=>{const h=setup();try{
 h.settle();assert.equal(h.ui.rotation,90);assert.equal(h.ui.overlayControls,true);
 h.ui.setPreferences({rotate:false});h.settle();assert.equal(h.ui.overlayControls,false);
 h.ui.setPreferences({rotate:true});h.settle();assert.equal(h.ui.overlayControls,true);
 for(let n=0;n<3;n++){
  Object.assign(h.win,{innerWidth:844,innerHeight:390});Object.assign(h.win.visualViewport,{width:844,height:390,scale:1});h.safe.paddingLeft='47';h.safe.paddingRight='47';h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.ui.overlayControls,true);assert.equal(h.ui.frame.width,844);
  Object.assign(h.win,{innerWidth:390,innerHeight:844});Object.assign(h.win.visualViewport,{width:390,height:844});h.safe.paddingLeft='0';h.safe.paddingRight='0';h.listeners.get('orientationchange')({type:'orientationchange'});h.settle();assert.equal(h.ui.rotation,90);assert.equal(h.ui.overlayControls,true);
 }
 h.ui.setPreferences({rotate:false});Object.assign(h.win.visualViewport,{width:300,height:200,scale:1.5});h.vvListeners.get('resize')();h.settle();assert.equal(h.ui.overlayControls,false,'native text pinch does not turn upright mode into overlay');
}finally{h.cleanup();}});
