import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {JSDOM} from 'jsdom';
import {createViewportLifecycle} from '../dist/viewport-lifecycle.mjs';
const source=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
const imports=file=>[...source(file).matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(m=>new URL(m[1].split('?')[0],new URL('../dist/'+file,import.meta.url)).pathname);
const path=file=>new URL('../dist/'+file,import.meta.url).pathname;
// This architecture contract deliberately tests module wiring, in addition to
// the behavioral lifecycle tests. New chapters must not fork the controller.
test('root, synchronous boot, and later chapter interface depend on the same viewport definitions',()=>{
 for(const file of ['game-viewport.mjs','preview/campaign/chapter-ui.mjs'])assert.ok(imports(file).includes(path('viewport-lifecycle.mjs')),file+' uses the shared lifecycle');
 for(const file of ['viewport-lifecycle.mjs','viewport-geometry.mjs'])assert.ok(imports(file).includes(path('viewport-core.js')),file+' uses the same core');
 const dom=new JSDOM(source('index.html'));try{const scripts=[...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src').split('?')[0]);const core=scripts.indexOf('viewport-core.js'),boot=scripts.indexOf('viewport-boot.js');assert.ok(core>=0&&boot>core,'classic bootstrap receives the same core before game content');}finally{dom.window.close();}
});
test('every chapter alias has identical geometry and pointer exports, not a copied algorithm',async()=>{
 const canonical=new Map();
 for(const chapter of [2,3,4])for(const [file,keys]of [['viewport-geometry',['gameViewport','viewportSample','logicalPointer']],['touch-controls',['bindTouchControls','PointerControls']]]){
  const url=new URL(`../dist/preview/chapter${chapter}/${file}.mjs`,import.meta.url),target=new URL(readFileSync(url,'utf8').match(/export \* from ['"]([^'"]+)['"]/)[1],url).href;
  if(!canonical.has(file))canonical.set(file,target);assert.equal(target,canonical.get(file),`chapter ${chapter} uses the same canonical URL`);
  const alias=await import(url),shared=await import(target);for(const key of keys)assert.equal(alias[key],shared[key],`chapter ${chapter}: ${key}`);
 }
});
test('shared definitions keep independent controller geometry and ownership',()=>{
 const create=width=>{let time=0,id=0,frameWidth=width;const callbacks=new Map(),win={performance:{now:()=>time},requestAnimationFrame:fn=>{callbacks.set(++id,fn);return id;},cancelAnimationFrame:id=>callbacks.delete(id)};const ui=createViewportLifecycle({window:win,read:()=>({frame:{width:frameWidth,height:390,screenWidth:frameWidth,screenHeight:390,left:0,top:0,rotation:0},valid:true}),apply(){},measure:()=>({valid:true,key:'stable'})});return{ui,set(v){frameWidth=v;ui.invalidate('orientation');},settle(){for(let i=0;i<80;i++){time+=16;const batch=[...callbacks.values()];callbacks.clear();for(const fn of batch)fn(time);}}};};
 const a=create(844),b=create(1280);try{a.settle();b.settle();const epoch=b.ui.epoch;a.set(568);assert.equal(a.ui.ready,false);assert.equal(b.ui.ready,true);assert.equal(b.ui.frame.width,1280);assert.equal(b.ui.epoch,epoch);a.settle();assert.equal(a.ui.frame.width,568);assert.equal(a.ui.ready,true);}finally{a.ui.destroy();b.ui.destroy();}
});
test('wide desktop may retain bounded max-width content without accepting a vertical offset or clipping',async()=>{const {measureViewportElements}=await import('../dist/viewport-lifecycle.mjs');const frame={left:0,top:0,screenWidth:1920,screenHeight:1080},rect={left:240,top:0,width:1440,height:1080},element={getBoundingClientRect:()=>rect};assert.equal(measureViewportElements(frame,[element],{allowNarrow:true}).valid,true);assert.equal(measureViewportElements(frame,[element]).valid,false,'touch content must still match the viewport');rect.top=95;assert.equal(measureViewportElements(frame,[element],{allowNarrow:true}).valid,false);rect.top=0;rect.left=600;assert.equal(measureViewportElements(frame,[element],{allowNarrow:true}).valid,false);});
