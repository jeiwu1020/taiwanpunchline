import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {gameViewport} from '../dist/viewport-geometry.mjs';
import {challengeDialogFrame} from '../dist/challenge-dialog-viewport.mjs';
const layout=await import('../dist/challenge-layout.mjs').catch(()=>({}));
const ready=()=>assert.equal(typeof layout.challengeContentFrame,'function','one shared logical content frame is required');

test('shrunk frames never consume physical safe insets twice',()=>{
 ready();
 for(const rotate of [false,true]){
  const frame=gameViewport({width:390,height:844,safe:{top:47,bottom:34,left:3,right:5},touch:true,rotate});
  assert.deepEqual(layout.logicalSafeInsets(frame),{top:0,right:0,bottom:0,left:0});
  assert.deepEqual(layout.challengeContentFrame(frame),{left:0,top:0,right:frame.width,bottom:frame.height,width:frame.width,height:frame.height});
 }
});
test('full bleed physical safe areas rotate into logical edges exactly once',()=>{
 ready();
 const frame={width:844,height:390,fullBleed:true,safeTop:47,safeRight:5,safeBottom:34,safeLeft:3};
 assert.deepEqual(layout.logicalSafeInsets({...frame,rotation:90}),{top:5,right:34,bottom:3,left:47});
 assert.deepEqual(layout.logicalSafeInsets({...frame,rotation:-90}),{top:3,right:47,bottom:5,left:34});
 assert.deepEqual(layout.challengeContentFrame({...frame,rotation:0}),{left:3,top:47,right:839,bottom:356,width:836,height:309});
});
test('all chapters receive the same compact breakpoint and safe CSS variables',()=>{
 ready();const doc=new JSDOM('<main></main>').window.document,host=doc.querySelector('main');
 for(const height of [320,390,500,501,720]){
  layout.applyChallengeLayout(host,{width:844,height,fullBleed:true,safeLeft:47,safeBottom:21,touch:true});
  assert.equal(host.dataset.compact,String(height<=500));
  assert.equal(host.style.getPropertyValue('--challenge-safe-left'),'47px');
 }
 layout.applyChallengeLayout(host,{width:763,height:390,rotation:90});
 assert.equal(host.style.getPropertyValue('--challenge-safe-bottom'),'0px');
});
test('dialog centered content stays inside asymmetric safe areas after rotation',()=>{
 const frame=challengeDialogFrame({width:844,height:390,screenWidth:390,screenHeight:844,fullBleed:true,rotation:90,safeTop:47,safeRight:5,safeBottom:34,safeLeft:3,anchor:'center'});
 assert.equal(frame.width,747);assert.equal(frame.maxHeight,366);
 assert.equal(frame.left,194);assert.equal(frame.top,428.5);
});
test('occlusion reads real visible controls and status without treating text length as geometry',()=>{
 ready();const dom=new JSDOM('<main id="root"><header></header><div class="dom-hud"><div class="hud-side"></div></div><div class="challenge-save-slot"></div><div class="chapter-objective"></div><canvas></canvas><section class="control-deck"><div id="touch-stick"></div><button></button><button hidden></button></section></main>');
 const {document}=dom.window,root=document.querySelector('main'),canvas=document.querySelector('canvas');
 const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 root.getBoundingClientRect=canvas.getBoundingClientRect=()=>box(0,0,844,390);
 const put=(selector,r)=>document.querySelector(selector).getBoundingClientRect=()=>r;
 put('header',box(47,6,750,38));put('.dom-hud',box(55,48,734,64));put('.hud-side',box(55,48,320,64));put('.challenge-save-slot',box(180,8,104,32));put('.chapter-objective',box(55,117,500,20));put('#touch-stick',box(61,260,104,104));put('.control-deck button',box(680,240,64,64));
 const frame={width:844,height:390,fullBleed:true,safeLeft:47,safeRight:47,safeBottom:21};
 const first=layout.measureChallengeOcclusions({document,root,canvas,frame});
 assert.equal(first.hudBottom,137);assert.equal(first.occlusions.filter(x=>x.kind==='control').length,2);
 assert.deepEqual(first.safeRect,{left:47,top:0,right:797,bottom:369,width:750,height:369});
 document.querySelector('.challenge-save-slot').textContent='需要處理'.repeat(40);
 assert.deepEqual(layout.measureChallengeOcclusions({document,root,canvas,frame}),first);
});
test('sideways preparation scrolling targets its readable body rather than a fixed dialog frame',async()=>{
 const {mountChallengeDialogViewport}=await import('../dist/challenge-dialog-viewport.mjs');
 const dom=new JSDOM('<div id="viewport-shell"><main class="app" data-rotation="90" style="width:844px;height:390px"></main></div><dialog><section class="challenge-preparation-panel"><p>Long preparation</p><button>Confirm</button></section></dialog>'),{document}=dom.window;
 const dialog=document.querySelector('dialog'),panel=dialog.querySelector('section');
 Object.defineProperties(panel,{scrollHeight:{value:900},clientHeight:{value:300}});
 Object.defineProperties(dialog,{scrollHeight:{value:300},clientHeight:{value:300}});
 const binding=mountChallengeDialogViewport(dialog),wheel=new dom.window.WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:120});
 panel.querySelector('p').dispatchEvent(wheel);
 assert.equal(panel.scrollTop,120);assert.equal(dialog.scrollTop,0);assert.equal(wheel.defaultPrevented,true);
 binding.destroy();dom.window.close();
});
test('desktop camera content is clipped to the canvas instead of including the separate toolbar and dock',()=>{
 ready();const dom=new JSDOM('<main><header></header><canvas></canvas></main>'),{document}=dom.window,root=document.querySelector('main'),canvas=document.querySelector('canvas');
 root.getBoundingClientRect=()=>({left:0,top:0,right:1280,bottom:720,width:1280,height:720});
 canvas.getBoundingClientRect=()=>({left:20,top:60,right:1260,bottom:610,width:1240,height:550});
 const actual=layout.measureChallengeOcclusions({document,root,canvas,frame:{width:1280,height:720}});
 assert.deepEqual(actual.safeRect,{left:0,top:0,right:1240,bottom:550,width:1240,height:550});dom.window.close();
});
test('sideways top-anchored preparation exposes its own placement instead of inheriting centered-dialog coordinates',async()=>{
 const {mountChallengeDialogViewport}=await import('../dist/challenge-dialog-viewport.mjs');
 const dom=new JSDOM('<body class="app" data-sideways="true"><main id="trial-app" class="app" data-rotation="90" style="width:844px;height:390px"></main><dialog class="challenge-preparation-overlay"></dialog></body>'),{document}=dom.window;
 const app=document.querySelector('#trial-app'),dialog=document.querySelector('dialog');
 app.getBoundingClientRect=()=>({left:0,top:0,width:390,height:844,right:390,bottom:844});
 const binding=mountChallengeDialogViewport(dialog);
 assert.equal(dialog.dataset.viewportAnchor,'top');
 assert.equal(dialog.style.getPropertyValue('--challenge-dialog-left'),'382px');
 assert.equal(dialog.style.getPropertyValue('--challenge-dialog-top'),'422px');
 // A 374px logical dialog body rotated clockwise from its top edge occupies
 // physical X 8..382. Generic centering at195 incorrectly gives -179..195.
 assert.equal(parseFloat(dialog.style.getPropertyValue('--challenge-dialog-left'))-parseFloat(dialog.style.maxHeight),8);
 binding.destroy();dom.window.close();
});
