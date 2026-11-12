import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const read=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
// JSDOM has no browser box layout. This first layer checks the real DOM's
// resolved CSS row budget. hud-containment.mjs adds actual browser rectangles.
function withoutContainerQueries(css){return css.replace(/@container[^{}]*\{/g,match=>'@media (unsupported-container: true){');}
for(const chapter of [1,2,3,4])for(const rotation of [0,90])test(`chapter ${chapter} compact ${rotation?'sideways':'native'} HUD allocates every child within 48px`,()=>{
 const entry=chapter===1?'index.html':`preview/chapter${chapter}/index.html`,html=read(entry),dom=new JSDOM(html),d=dom.window.document;
 const root=chapter===1?d.querySelector('#viewport-shell > .app'):d.querySelector('#trial-app');
 for(const e of [root,d.body])Object.assign(e.dataset,{touch:'true',layout:'landscape',overlayControls:'true',depthRoute:'true',compact:'true',challengeLayout:'true',gameMode:'challenge',titleOpen:'false',landscapePreview:String(!rotation),rotation:String(rotation)});
 const sheets=[...d.querySelectorAll('link[rel="stylesheet"]')].map(link=>new URL(link.getAttribute('href').split('?')[0],new URL('../dist/'+entry,import.meta.url)));
 for(const file of sheets){const style=d.createElement('style');style.textContent=withoutContainerQueries(readFileSync(file,'utf8'));d.head.append(style);}
 for(const panel of root.querySelectorAll('.dom-hud .hud-side')){
  const s=dom.window.getComputedStyle(panel),rows=s.gridTemplateRows.split(/\s+/).map(parseFloat),gap=parseFloat(s.rowGap)||parseFloat(s.gap)||0;
  assert.equal(rows.length,4,'name, health, guard and live status each own one row');
  const total=rows.reduce((n,v)=>n+v,0)+gap*(rows.length-1)+parseFloat(s.paddingTop)+parseFloat(s.paddingBottom)+parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth);
  assert.ok(total<=parseFloat(s.height),`row budget ${total}px exceeds ${s.height}`);
  const selectors=['.hud-name','.hp-track','.guard-row','.hud-status'];
  for(const [i,selector]of selectors.entries()){
   const child=panel.querySelector(selector),cs=dom.window.getComputedStyle(child),outer=parseFloat(cs.height)+(parseFloat(cs.marginTop)||0)+(parseFloat(cs.marginBottom)||0);
   assert.notEqual(cs.display,'none',selector+' remains visible');
   assert.ok(outer<=rows[i],`${selector} ${outer}px exceeds its ${rows[i]}px row`);
  }
 }
 const timer=root.querySelector('.dom-hud .timer'),ts=dom.window.getComputedStyle(timer),textRows=[...timer.children].map(child=>dom.window.getComputedStyle(child)).filter(style=>style.display!=='none');
 const timerRows=textRows.reduce((sum,style)=>sum+parseFloat(style.lineHeight)+(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0),0);
 const timerTotal=timerRows+(parseFloat(ts.rowGap)||parseFloat(ts.gap)||0)*(textRows.length-1)+parseFloat(ts.paddingTop)+parseFloat(ts.paddingBottom)+parseFloat(ts.borderTopWidth)+parseFloat(ts.borderBottomWidth);
 assert.ok(timerTotal<=parseFloat(ts.height),`timer text budget ${timerTotal}px exceeds ${ts.height}`);
 dom.window.close();
});
