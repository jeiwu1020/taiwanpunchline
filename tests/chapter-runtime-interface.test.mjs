import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {createCanvas} from '@napi-rs/canvas';
// Executes each real runtime, controller and UI. Image loading is inert because
// these lifecycle checks do not paint; it cannot create or read formal saves.
for(const n of [2,3,4])test(`chapter ${n} actual runtime clears stale restart confirmation on resume`,async()=>{
 const dir=resolve(`dist/preview/chapter${n}`),name=n===4?'chapter4':'chapter2';
 const dom=new JSDOM(await readFile(resolve(dir,'index.html'),'utf8'),{url:`http://runtime.test/preview/chapter${n}/?previewOnly=1`,pretendToBeVisual:true}),w=dom.window;
 for(const method of ['play','pause','load'])w.HTMLMediaElement.prototype[method]=method==='play'?()=>Promise.resolve():()=>{};
 const ctx=createCanvas(960,540).getContext('2d');w.HTMLCanvasElement.prototype.getContext=()=>ctx;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 class UnloadedImage{set src(value){this.url=value;}}
 Object.assign(globalThis,{window:w,document:w.document,Image:UnloadedImage,innerWidth:960,innerHeight:540,devicePixelRatio:1,requestAnimationFrame:()=>1});
 const path=resolve(dir,name+'-playable.mjs'),src=(await readFile(path,'utf8')).replace(/from '(\.\.?\/[^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(path)).href}'`);
 const app=await import('data:text/javascript;base64,'+Buffer.from(src+'\nexport {chapter,sync,ui};').toString('base64'));
 const q=s=>w.document.querySelector(s);if(n>2){const starter=n===4?'ko':'su';q('#menu-roster [data-character="'+starter+'"]').click();app.ui.openSettings();assert.equal(q('#settings-character-'+starter).disabled,false);assert.equal(q('#settings-audio-character-'+starter).disabled,false);assert.equal(q('#settings-character-'+starter).getAttribute('aria-pressed'),'true');app.ui.closeSettings();}q('#start').disabled=false;q('#start').click();let frames=0;
 while(app.chapter.view().mode==='story'&&frames++<20)q('#story-next').click();assert.equal(app.chapter.view().mode,'route');
 q('#pause').click();q('#restart-match').click();assert.equal(q('#restart-confirm').hidden,false);
 q('#resume').click();assert.equal(app.chapter.view().paused,false);assert.equal(q('#restart-confirm').hidden,true);
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));
 assert.equal(app.chapter.view().paused,true,'first Escape must pause instead of consuming stale confirmation');assert.equal(q('#restart-confirm').hidden,true);
 const original=app.chapter.restartSegment.bind(app.chapter);
 for(const kind of ['blur','hidden']){
  let release;const gate=new Promise(r=>release=r);app.chapter.restartSegment=async token=>{await gate;return original(token);};
  q('#restart-match').click();q('#restart-confirm-button').click();
  for(const selector of ['#help','#home','#resume','#pause','#restart-cancel'])assert.equal(q(selector).disabled,true,selector+' locked while retry saves');
  app.ui.openSettings();app.ui.openHome();assert.equal(q('#help-dialog').open,false);assert.equal(q('#chapter-home-confirm').open,false);
  if(kind==='blur')w.dispatchEvent(new w.Event('blur'));else{Object.defineProperty(w.document,'hidden',{configurable:true,value:true});w.document.dispatchEvent(new w.Event('visibilitychange'));}
  release();await new Promise(r=>setTimeout(r,0));assert.equal(app.chapter.view().paused,true,'retry must stay paused after '+kind);assert.equal(q('#restart-confirm').hidden,true);assert.equal(q('#help').disabled,false);
  Object.defineProperty(w.document,'hidden',{configurable:true,value:false});app.chapter.restartSegment=original;
 }
 q('#restart-match').click();q('#restart-confirm-button').click();await new Promise(r=>setTimeout(r,0));assert.equal(app.chapter.view().paused,false,'a later foreground retry may resume normally');w.close();
});
