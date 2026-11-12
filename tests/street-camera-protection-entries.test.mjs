import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountGameViewport} from '../dist/game-viewport.mjs';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
const base=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const failure=()=>Object.assign(new Error('blocked camera'),{code:'STREET_CAMERA_BLOCKED'});
function main(t){
 const dom=new JSDOM('<body><main id="viewport-shell"><div class="app"><div id="game"></div></div></main><dialog id="help-dialog"></dialog><div id="safe-insets"></div><button id="camera-mode"></button><button id="rotate-mode"></button></body>',{url:'https://fixture.invalid/',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let time=0,id=0,clears=0;const frames=new Map();w.requestAnimationFrame=fn=>(frames.set(++id,fn),id);w.cancelAnimationFrame=i=>frames.delete(i);w.performance.now=()=>time;w.matchMedia=()=>({matches:true});Object.defineProperty(w,'innerWidth',{value:390,writable:true});Object.defineProperty(w,'innerHeight',{value:844,writable:true});Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});
 const stage=d.querySelector('#game');Object.defineProperties(stage,{clientWidth:{value:390},clientHeight:{value:844}});
 w.HTMLElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:390,bottom:844,width:390,height:844};};
 const old={};const globals={document:d,window:w,navigator:w.navigator,getComputedStyle:()=>({paddingTop:'0',paddingRight:'0',paddingBottom:'0',paddingLeft:'0'}),ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:w.requestAnimationFrame,cancelAnimationFrame:w.cancelAnimationFrame};for(const[k,v]of Object.entries(globals)){old[k]=Object.getOwnPropertyDescriptor(globalThis,k);Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}
 const events=new EventEmitter(),context={setTransform(){},isContextLost:()=>false},scene={scale:{width:390,height:844,resize(w,h){this.width=w;this.height=h;}},game:{events,canvas:{width:390,height:844},renderer:{width:390,height:844,gameContext:context,resize(w,h){this.width=w;this.height=h;}}}};
 const ui=mountGameViewport({scene,clearHold:()=>clears++,initialSettings:{rotate:false}});
 t.after(()=>{ui.destroy();for(const[k,descriptor]of Object.entries(old)){if(descriptor)Object.defineProperty(globalThis,k,descriptor);else delete globalThis[k];}w.close();});
 return {ui,d,get clears(){return clears;},tick(paint=true){time+=16;const batch=[...frames.values()];frames.clear();for(const f of batch)f(time);if(paint){ui.frameDrawn(ui.token);events.emit('postrender');}}};
}
function later(t,chapter){
 const dom=new JSDOM(readFileSync(base+`/dist/preview/chapter${chapter}/index.html`,'utf8'),{url:'https://fixture.invalid/?previewOnly=1',pretendToBeVisual:true}),w=dom.window,d=w.document;let time=0,id=0,clears=0;const frames=new Map();w.requestAnimationFrame=fn=>(frames.set(++id,fn),id);w.cancelAnimationFrame=id=>frames.delete(id);w.performance.now=()=>time;w.matchMedia=()=>({matches:true});Object.defineProperty(w,'innerWidth',{value:390,writable:true});Object.defineProperty(w,'innerHeight',{value:844,writable:true});Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});w.visualViewport=Object.assign(new w.EventTarget(),{width:390,height:844,offsetTop:0,offsetLeft:0,scale:1});w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const shell=d.querySelector('#trial-app');w.HTMLElement.prototype.getBoundingClientRect=function(){const rot=Number(shell.dataset.rotation),width=parseFloat(shell.style.width)||844,height=parseFloat(shell.style.height)||390,left=parseFloat(shell.style.left)||0,top=parseFloat(shell.style.top)||0;return{left,top,width:rot?height:width,height:rot?width:height,right:left+(rot?height:width),bottom:top+(rot?width:height)};};
 const stage=d.querySelector('#stage');Object.defineProperties(stage,{clientWidth:{value:844,writable:true},clientHeight:{value:390,writable:true}});const surfaceContext={setTransform(){},isContextLost:()=>false};
 const ui=mountChapterInterface({document:d,window:w,surfaceContext,cast:{wang:{name:'恰吉王',moves:[{name:'衝',kind:'rush',cooldown:8},{name:'反',kind:'counter',cooldown:8},{name:'水',kind:'heal',cooldown:8}]}},getCharacter:()=> 'wang',clearHold(){clears++;}});t.after(()=>{ui.destroy();w.close();});
 return{ui,d,get clears(){return clears;},tick(paint=true){time+=16;const batch=[...frames.values()];frames.clear();for(const f of batch)f(time);if(paint)ui.paintFrame(ui.surfaceToken);}};
}
for(const entry of ['root',2,3,4])test(`actual ${entry} catch forwards known camera cause while retaining one draw-failed deadline`,t=>{
 const h=entry==='root'?main(t):later(t,entry);for(let i=0;i<80;i++)h.tick();assert.equal(h.ui.ready,true);
 h.ui.failFrame(failure());const clears=h.clears;for(let i=0;i<170;i++){h.tick(false);h.ui.failFrame(failure());}
 assert.equal(h.ui.ready,false);assert.equal(h.ui.status,'blocked');assert.ok(h.clears>clears);const notice=h.d.querySelector('[data-viewport-protection]');assert.equal(notice.hidden,false);assert.match(notice.textContent,/可用畫面太小/);
 for(let i=0;i<80;i++)h.tick();assert.equal(h.ui.ready,true);assert.equal(notice.hidden,true);
 h.ui.failFrame(new Error('ordinary drawing failure'));for(let i=0;i<170;i++){h.tick(false);h.ui.failFrame(new Error('ordinary drawing failure'));}assert.match(notice.textContent,/畫面尺寸尚未穩定/);assert.doesNotMatch(notice.textContent,/可用畫面太小/);
});
