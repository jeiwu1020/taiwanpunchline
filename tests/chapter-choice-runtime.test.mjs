import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {createCanvas} from '@napi-rs/canvas';

// Execute real entry markup, runtime and chapter controllers. Inert image loading
// keeps rendering out of this choice/completion lifecycle test.
async function runtime(t,n){
 const dir=resolve(`dist/preview/chapter${n}`),name=n===4?'chapter4':'chapter2';
 const dom=new JSDOM(await readFile(resolve(dir,'index.html'),'utf8'),{url:`http://runtime.test/preview/chapter${n}/?previewOnly=1`,pretendToBeVisual:true}),w=dom.window;
 t.after(()=>w.close());
 for(const method of ['play','pause','load'])w.HTMLMediaElement.prototype[method]=method==='play'?()=>Promise.resolve():()=>{};
 const ctx=createCanvas(960,540).getContext('2d');w.HTMLCanvasElement.prototype.getContext=()=>ctx;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 class UnloadedImage{set src(value){this.url=value;}}
 Object.assign(globalThis,{window:w,document:w.document,Image:UnloadedImage,innerWidth:960,innerHeight:540,devicePixelRatio:1,requestAnimationFrame:()=>1});
 const path=resolve(dir,name+'-playable.mjs'),src=(await readFile(path,'utf8')).replace(/from '(\.\.?\/[^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(path)).href}'`);
 const app=await import('data:text/javascript;base64,'+Buffer.from(src+'\nexport {chapter,sync,ui};').toString('base64'));
 const q=s=>w.document.querySelector(s);q('#start').disabled=false;q('#start').click();
 for(let i=0;i<100&&app.chapter.view().mode!=='choice';i++){
  const s=app.chapter.view();
  if(s.mode==='story')q('#story-next').click();
  else if(s.mode==='result')q('#result-next').click();
  else if(s.mode==='route'){app.chapter.world.status='gate';app.chapter.step(0,{});app.sync();}
  else if(s.mode==='battle'){app.chapter.world.status='over';app.chapter.world.winner='player';app.chapter.step(0,{});app.sync();}
 }
 assert.equal(app.chapter.view().mode,'choice');return {app,q,w};
}
for(const n of [2,3,4])test(`chapter ${n} actual choice runtime exposes only real continuation actions and removes completed preparation`,async t=>{
 const {app,q}=await runtime(t,n);
 assert.equal(q('#choice-panel').hidden,false);
 if(n<4){
  assert.equal(q('#choice-roster').hidden,false);assert.match(q('#choice-roster button').textContent,/強化技能/);
  q('#choice-roster button').click();assert.equal(q('#challengePreparationOverlay').open,true);q('#preparationCancel').click();
  assert.equal(app.chapter.view().mode,'choice');assert.equal(q('#chapter-next').textContent,`追向第${n===2?'三':'四'}章 →`);
 }else{
  assert.equal(q('#chapter-next').textContent,'完成本章');
  assert.match(q('#choice-copy').textContent,/第五章尚未開放/);
  assert.doesNotMatch(q('#choice-copy').textContent,/選好接下來|入口已保留/);
 }
 assert.equal(q('#continuation-home-link').hidden,true,'home is offered only after completion');
 q('#chapter-next').click();assert.equal(app.chapter.view().mode,'complete');
 assert.equal(q('#choice-roster').hidden,true);assert.equal(q('#choice-roster').querySelector('button'),null,'completion must not recreate a dead preparation action');
 app.sync();assert.equal(q('#choice-roster').hidden,true);assert.equal(q('#choice-roster').querySelector('button'),null);
 assert.equal(q('#chapter-next').hidden,true);assert.equal(q('#continuation-home-link').hidden,false);
 assert.equal(q('#continuation-home-link').getAttribute('href'),'../../');
 if(n===4){assert.equal(q('#continuation-choice-link').hasAttribute('href'),false);assert.match(q('#choice-copy').textContent,/第五章尚未開放/);}
});
