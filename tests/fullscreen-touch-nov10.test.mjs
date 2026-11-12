import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as zoom from '../dist/page-zoom-gestures.mjs';
import {challengeDialogFrame} from '../dist/challenge-dialog-viewport.mjs';
import {applyCombatPresentationLayout} from '../dist/challenge-layout.mjs';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');

test('page gesture ownership includes body-appended challenge, story and growth dialogs, backdrop targets and text nodes',()=>{
 assert.equal(typeof zoom.ownsGamePageTarget,'function');
 const {window}=new JSDOM('<body><main id="viewport-shell"></main><dialog id="help-dialog"></dialog></body>'),doc=window.document;
 for(const className of ['challenge-dialog','challenge-story','campaign-growth-dialog']){
  const dialog=doc.createElement('dialog');dialog.className=className;dialog.innerHTML='<p>背景文字</p><button>繼續</button>';doc.body.append(dialog);
  for(const target of [dialog,dialog.firstElementChild,dialog.firstElementChild.firstChild])assert.equal(zoom.ownsGamePageTarget(doc,target),true,className);
 }
 assert.equal(zoom.ownsGamePageTarget(doc,doc),true);assert.equal(zoom.ownsGamePageTarget(doc,doc.body),true);assert.equal(zoom.ownsGamePageTarget(doc,doc.documentElement),true);
 assert.equal(zoom.ownsGamePageTarget(doc,new JSDOM('<body/>').window.document.body),false);
 assert.equal(zoom.ownsGamePageTarget(doc,null),false);
});
test('real document capture cancels repeated modal background taps and pinch but preserves button clicks and scroll',()=>{
 assert.equal(typeof zoom.ownsGamePageTarget,'function');
 const {window}=new JSDOM('<body><dialog class="challenge-dialog"><p>背景</p><button>繼續</button></dialog></body>'),doc=window.document;let allow=false;
 const guard=zoom.mountPageZoomGuard({root:doc,ownsTarget:target=>zoom.ownsGamePageTarget(doc,target),allowsZoom:()=>allow});
 const fire=(type,target,changed,touches,time)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.defineProperties(e,{changedTouches:{value:changed},touches:{value:touches},timeStamp:{value:time}});target.dispatchEvent(e);return e;};
 const p=doc.querySelector('p'),button=doc.querySelector('button'),finger=(target,x=30)=>({identifier:1,target,clientX:x,clientY:30});
 const tap=(target,time)=>{const f=finger(target);fire('touchstart',target,[f],[f],time);return fire('touchend',target,[f],[],time+40);};
 assert.equal(tap(p,100).defaultPrevented,false);assert.equal(tap(p,250).defaultPrevented,true);
 assert.equal(tap(button,400).defaultPrevented,false);assert.equal(tap(button,550).defaultPrevented,false);
 const a=finger(p),b={...finger(p,60),identifier:2};fire('touchstart',p,[a],[a],700);assert.equal(fire('touchmove',p,[{...a,clientY:80}],[{...a,clientY:80}],730).defaultPrevented,false);fire('touchend',p,[a],[],750);
 fire('touchstart',p,[a],[a],800);assert.equal(fire('touchstart',p,[b],[a,b],820).defaultPrevented,true);fire('touchend',p,[a,b],[],850);
 allow=true;fire('touchstart',p,[a],[a],900);assert.equal(fire('touchstart',p,[b],[a,b],920).defaultPrevented,false);guard.destroy();window.close();
});
test('full-bleed modal content uses safe rectangle while its native backdrop covers the viewport',()=>{
 const frame=challengeDialogFrame({width:844,height:390,fullBleed:true,safeLeft:47,safeRight:47,safeBottom:21,anchor:'center'});
 assert.equal(frame.width,734);assert.equal(frame.maxHeight,353);assert.equal(frame.left,422);assert.equal(frame.top,184.5);
 const asymmetric=challengeDialogFrame({width:844,height:390,left:3,top:12,fullBleed:true,safeLeft:59,safeRight:0,safeTop:3,safeBottom:21,anchor:'top'});
 assert.equal(asymmetric.width,769);assert.equal(asymmetric.left,454.5);assert.equal(asymmetric.top,23);assert.equal(asymmetric.maxHeight,350);
});
test('all primary game screens request native full bleed without changing the legacy street HUD flag',()=>{
 const runtime=read('game-viewport.mjs');
 assert.match(runtime,/fullBleed:window\.innerWidth>window\.innerHeight\s*\}/);
 assert.match(runtime,/dataset\.fullBleed/);
 assert.match(runtime,/applyCombatPresentationLayout\(app\)/);
 for(const fullBleed of [false,true])for(const titleOpen of [false,true])for(const depthRoute of [false,true]){
  const root={dataset:{fullBleed:String(fullBleed),titleOpen:String(titleOpen),depthRoute:String(depthRoute)}};
  applyCombatPresentationLayout(root);
  assert.equal(root.dataset.landscapePreview,String(fullBleed&&!titleOpen&&depthRoute),'the shared function preserves the exact legacy street-only condition');
 }
 assert.match(read('game.mjs'),/ownsGamePageTarget\(document,target\)/);
});
test('landscape-only CSS protects HUD and controls without changing their fonts or disabling browser zoom globally',()=>{
 const css=read('landscape-full-bleed.css');
 assert.match(css,/data-full-bleed/);assert.match(css,/--landscape-safe-left/);assert.match(css,/--landscape-safe-bottom/);
 assert.doesNotMatch(css,/font-size|line-height|user-scalable|maximum-scale/);
 assert.match(read('index.html'),/landscape-full-bleed\.css/);
});
test('chapters 2–4 use the same gesture guard and full-bleed safe overlay rules',()=>{
 for(const [dir,entry] of [['chapter2','chapter2-playable'],['chapter3','chapter2-playable'],['chapter4','chapter4-playable']]){
  assert.match(read(`preview/${dir}/index.html`),/landscape-safe\.css/);
  assert.match(read(`preview/${dir}/${entry}.mjs`),/mountCampaignTouch/);
  const entrySource=read(`preview/${dir}/${entry}.mjs`);
  assert.match(entrySource,/mountChapterInterface\(\{document,window,cast:CAST,media,clearHold/);
  assert.match(entrySource,/onViewportChange:\(\{frame,epoch\}\)=>resizeCanvas\(\)/);
  assert.match(entrySource,/ui\?\.ready!==false/);
  assert.match(entrySource,/viewport:\(\)=>\(\{ready:ui.ready,epoch:ui.epoch,rotation:ui.viewport.rotation\}\)/);
  assert.doesNotMatch(entrySource,/window\.addEventListener\('(?:resize|orientationchange)'/);
  assert.doesNotMatch(entrySource,/ui\.resize\(\)/);
  assert.match(read('preview/campaign/chapter-ui.mjs'),/fullBleed:!!viewport\.fullBleed/);
 }
 const css=read('preview/campaign/landscape-safe.css');assert.match(css,/safe-area-inset-bottom/);assert.doesNotMatch(css,/font-size|line-height/);
});
test('top-layer growth modal CSS beats its class pinch policy while reading zoom remains opt-in',()=>{
 const css=read('mobile-game.css')+read('preview/campaign/growth-ui.css')+read('preview/campaign/landscape-safe.css');
 assert.match(css,/:root body>dialog\{touch-action:pan-x pan-y\}/);
 assert.match(css,/html\[data-allow-page-zoom="true"\] body>dialog\{touch-action:manipulation\}/);
});
test('every changed runtime entry and dialog dependency has the new cache key',()=>{
 for(const file of ['challenge-ui.mjs','challenge-story.mjs','starter-opening.mjs','game-viewport.mjs'])assert.ok(read('game.mjs').includes(file+'?v='+RUNTIME_VERSION),file);
 assert.ok(read('game.mjs').includes(`page-zoom-gestures.mjs?v=${RUNTIME_VERSION}`),'gesture module shares the frozen runtime identity');
 for(const [dir,entry]of [['chapter2','chapter2-playable'],['chapter3','chapter2-playable'],['chapter4','chapter4-playable']])assert.ok(read(`preview/${dir}/index.html`).includes(entry+'.mjs?v='+RUNTIME_VERSION));
});
test('later-chapter changed transitive dependencies have candidate cache keys',()=>{
 const key='?v='+RUNTIME_VERSION;
 for(const [dir,entry]of [['chapter2','chapter2'],['chapter3','chapter2'],['chapter4','chapter4']]){
  const runtime=read(`preview/${dir}/${entry}-playable.mjs`),html=read(`preview/${dir}/index.html`);
  for(const file of ['../campaign/page-bridge.mjs',`./${entry}-controller.mjs`])assert.ok(runtime.includes(file+key),file);
  assert.ok(html.includes('../campaign/continuation.css'+key));
 }
 const bridge=read('preview/campaign/page-bridge.mjs');for(const file of ['playable-bridge.mjs','fresh-router.mjs'])assert.ok(bridge.includes(file+key));
});
test('top-layer growth cards center inside asymmetric safe insets, not the raw viewport',()=>{
 for(const file of ['landscape-full-bleed.css','preview/campaign/landscape-safe.css'])assert.match(read(file),/html body>\.campaign-growth-dialog\{inset:env\(safe-area-inset-top,0px\) env\(safe-area-inset-right,0px\) env\(safe-area-inset-bottom,0px\) env\(safe-area-inset-left,0px\);/);
});
