import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {gameViewport} from '../dist/viewport-geometry.mjs';

function start({width=390,height=720,touch=true,saved=null,safe={},visualViewport,blocked=false,missing=false}={}){
 const nodes=new Map(),listeners=new Map(),frames=new Map();let id=0,time=0;
 const node=()=>({style:{},dataset:{},getBoundingClientRect(){const shell=nodes.get('#viewport-shell');return {left:parseFloat(shell.style.left)||0,top:parseFloat(shell.style.top)||0,width:parseFloat(shell.style.width)||390,height:parseFloat(shell.style.height)||720};}});
 for(const name of ['.app','#viewport-shell','#safe-insets'])nodes.set(name,node());
 const window={performance:{now:()=>time},innerWidth:width,innerHeight:height,visualViewport,location:{search:''},matchMedia:()=>({matches:touch}),
  addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);},
  requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(n){frames.delete(n);}};
 Object.defineProperty(window,'localStorage',{get(){if(blocked)throw new Error('denied');return {getItem:()=>saved};}});
 const document={querySelector:s=>missing?null:nodes.get(s)};
 const getComputedStyle=()=>Object.fromEntries(['top','right','bottom','left'].map(k=>['padding'+k[0].toUpperCase()+k.slice(1),String(safe[k]||0)]));
 const context={window,document,navigator:{maxTouchPoints:touch?1:0},getComputedStyle,URLSearchParams};
 const source=readFileSync(new URL('../dist/viewport-boot.js',import.meta.url),'utf8');
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../dist/viewport-core.js',import.meta.url),'utf8'),context);vm.runInContext(source,context);
 return {window,nodes,listeners,frames,tick(){time+=16;const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(time);},boot:window.parliamentViewportBoot};
}

test('blocking bootstrap resolves portrait touch layout synchronously without Phaser or loaded images',()=>{
 const h=start();const app=h.nodes.get('.app');
 assert.equal(app.dataset.rotation,'90');assert.equal(app.dataset.layout,'landscape');assert.equal(app.dataset.touch,'true');
 assert.equal(app.style.width,'720px');assert.equal(app.style.height,'390px');assert.equal(app.style.transform,'translateX(390px) rotate(90deg)');
 assert.equal(h.frames.size,1);assert.equal(h.boot.ready,false);assert.equal(app.style.visibility,undefined);assert.equal(app.style.display,undefined);
});

test('first frame agrees with safe-area geometry for compact, native landscape, tablet and visual viewport offsets',()=>{
 for(const options of [{width:320,height:568},{width:568,height:320},{width:844,height:390,safe:{left:47,right:47,bottom:21}},{width:390,height:720,safe:{top:47,bottom:34}},{width:1440,height:900,touch:false},{width:390,height:844,visualViewport:{width:390,height:720,offsetLeft:2,offsetTop:12,addEventListener(){},removeEventListener(){}}}]){
  const h=start(options),vv=options.visualViewport;
  const expected=gameViewport({width:vv?.width||options.width,height:vv?.height||options.height,left:0,top:vv?.offsetTop||0,safe:options.safe,touch:options.touch!==false,fullBleed:options.width>options.height});
  assert.deepEqual(JSON.parse(JSON.stringify(h.boot.frame)),expected);
 }
});

test('stored version 1 rotation-off is honored before the first game content, without modifying storage',()=>{
 for(const saved of [JSON.stringify({version:1,rotate:false,camera:'stable'}),JSON.stringify({rotate:false})]){
  const h=start({saved});assert.equal(h.nodes.get('.app').dataset.rotation,'0');assert.equal(h.nodes.get('.app').dataset.layout,'portrait');assert.equal(h.boot.preferences.rotate,false);
 }
});

test('corrupt, unsupported and inaccessible settings safely keep the visible default rotation',()=>{
 for(const saved of ['{','null','[]','false',JSON.stringify({version:2,rotate:false}),JSON.stringify({version:'1',rotate:false}),JSON.stringify({version:1,rotate:'false'})]){
  const h=start({saved});assert.equal(h.boot.frame.rotation,90,saved);
 }
 assert.equal(start({blocked:true}).boot.frame.rotation,90);
 assert.doesNotThrow(()=>start({missing:true}));
});

test('bootstrap keeps sizing during image preload then releases resize ownership to scene mount',()=>{
 const h=start();h.window.innerWidth=844;h.window.innerHeight=390;h.listeners.get('resize')();
 h.tick();
 assert.equal(h.boot.frame.rotation,0);assert.equal(h.boot.frame.width,844);
 h.boot.stop();assert.equal(h.listeners.size,0);assert.equal(h.frames.size,0);
});


test('early viewport rejects stale unzoomed orientation and reconciles late safe areas',()=>{
 const vv={width:844,height:390,offsetLeft:0,offsetTop:0,scale:1,addEventListener(){},removeEventListener(){}};
 const h=start({width:390,height:720,visualViewport:vv});assert.equal(h.boot.frame.rotation,90);assert.equal(h.boot.frame.screenWidth,390);
 Object.assign(h.window,{innerWidth:844,innerHeight:390});h.listeners.get('orientationchange')({type:'orientationchange'});
 const first=[...h.frames.entries()];h.frames.clear();for(const[,fn]of first)fn();assert.ok(h.frames.size>0,'post-rotation geometry is sampled again');
 h.boot.stop();assert.equal(h.frames.size,0);assert.equal(h.listeners.size,0);
});

test('first paint marks only physical touch landscape for overlay controls',()=>{
 assert.equal(start({width:390,height:720}).nodes.get('.app').dataset.nativeLandscape,'false');
 assert.equal(start({width:844,height:390}).nodes.get('.app').dataset.nativeLandscape,'true');
 assert.equal(start({width:844,height:390,touch:false}).nodes.get('.app').dataset.nativeLandscape,'false');
});

test('V34 first paint enables identical overlays for rotated and native landscape only',()=>{
 for(const options of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  const h=start(options);assert.equal(h.nodes.get('.app').dataset.overlayControls,'true');
 }
 assert.equal(start({width:390,height:844,saved:JSON.stringify({rotate:false})}).nodes.get('.app').dataset.overlayControls,'false');
 assert.equal(start({width:844,height:390,touch:false}).nodes.get('.app').dataset.overlayControls,'false');
});
