import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {loadChapterEntryStyles,chapterControlsDisplay} from './helpers/chapter-control-css.mjs';

function fixture(chapter){
 const entry=new URL(`../dist/preview/chapter${chapter}/index.html`,import.meta.url),html=readFileSync(entry,'utf8');
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'')),d=dom.window.document;
 const expected=[...d.querySelectorAll('link[rel="stylesheet"]')].map(link=>new URL(link.getAttribute('href').split('?')[0],entry).pathname);
 assert.deepEqual(loadChapterEntryStyles(d,entry),expected,'Use all actual linked sheets in entry order');
 assert.ok(expected.some(file=>file.endsWith(`/chapter${chapter}/${chapter===4?'chapter4':'chapter2'}-playable.css`)),'Include the chapter legacy noncombat rule');
 for(const el of [d.body,d.querySelector('#trial-app')])Object.assign(el.dataset,{touch:'true',layout:'landscape',overlayControls:'true'});
 return {dom,d,root:d.querySelector('#trial-app')};
}
for(const chapter of [2,3,4]){
 test(`chapter ${chapter} actual stylesheet cascade retains the paused stable control grid`,()=>{
  const f=fixture(chapter);try{f.d.body.dataset.noncombat='true';f.root.dataset.retainedCombatLayout='true';
   assert.equal(chapterControlsDisplay(f.d),'grid','Retained controls must override the chapter-specific display:none rule');
  }finally{f.dom.window.close();}
 });
 test(`chapter ${chapter} actual stylesheet cascade preserves active and excluded profile branches`,()=>{
  const f=fixture(chapter);try{
   f.d.body.dataset.noncombat='false';f.root.dataset.retainedCombatLayout='true';assert.equal(chapterControlsDisplay(f.d),'grid');
   // These are owner-output CSS branches. The real lifecycle/owner decisions
   // and geometry checks remain in mobile-stable-visibility.test.mjs.
   for(const profile of ['portrait','desktop','classic','story','menu','choice','complete']){
    f.d.body.dataset.noncombat='true';f.root.dataset.retainedCombatLayout='false';
    for(const el of [f.d.body,f.root])Object.assign(el.dataset,{layout:profile==='portrait'?'portrait':'landscape',touch:profile==='desktop'?'false':'true'});
    assert.equal(chapterControlsDisplay(f.d),'none',profile+' retains its original noncombat display mask');
   }
  }finally{f.dom.window.close();}
 });
}
test('bounded control cascade respects ID specificity instead of jsdom source order',()=>{
 const rules=['body[data-noncombat=true] #controls{display:none}','.app[data-touch][data-layout][data-overlay-controls] .control-deck{display:grid}'];
 for(const order of [rules,[...rules].reverse()]){
  const dom=new JSDOM('<style>'+order.join('\n')+'</style><body class="app" data-noncombat="true" data-touch="true" data-layout="landscape" data-overlay-controls="true"><section id="controls" class="control-deck"></section>');
  try{assert.equal(chapterControlsDisplay(dom.window.document),'none');}finally{dom.window.close();}
 }
});
test('bounded control cascade fails closed on unreviewed selectors and conditions',()=>{
 for(const [css,error]of [['#controls{display:block}',/Unknown display selector/],['@media screen{body[data-noncombat=true] #controls{display:none}}',/Conditional display rule/]]){
  const dom=new JSDOM('<style>'+css+'</style><body data-noncombat="true"><section id="controls"></section>');
  try{assert.throws(()=>chapterControlsDisplay(dom.window.document),error);}finally{dom.window.close();}
 }
});
