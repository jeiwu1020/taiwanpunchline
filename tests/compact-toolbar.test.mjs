import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
import {CAST} from '../dist/roster.mjs';
const adapter=await import('../dist/compact-toolbar.mjs').catch(()=>({}));
const ready=()=>{assert.equal(typeof adapter.compactToolbarLabel,'function','shared compact label projection is required');assert.equal(typeof adapter.mountCompactToolbar,'function','shared compact toolbar mount is required');};
const tick=()=>new Promise(r=>setImmediate(r));
const read=p=>readFileSync(new URL('../dist/'+p,import.meta.url),'utf8');
function fixture(t){ready();const dom=new JSDOM('<main><header><div class="toolbar"><button id="home">返回挑戰總覽</button><button id="sound" aria-pressed="true">♪ 聲音開</button><button id="pause">Ⅱ 暫停</button><button id="help">⚙ 設定與玩法</button><button id="other">不要修改</button></div></header><section><button id="outside">外部按鈕</button></section></main>');t.after(()=>dom.window.close());return {d:dom.window.document,w:dom.window};}

test('compact labels retain exact full accessible names, original nodes and existing handlers',t=>{
 const {d}=fixture(t),buttons=[...d.querySelectorAll('header button')],texts=buttons.map(b=>b.textContent);let clicks=0;buttons[0].onclick=()=>clicks++;buttons[1].addEventListener('click',()=>clicks++);
 const binding=adapter.mountCompactToolbar({document:d});t.after(()=>binding.destroy());
 for(const [i,short]of ['總覽','聲音開','暫停','設定'].entries()){assert.equal(buttons[i].dataset.shortLabel,short);assert.equal(buttons[i].getAttribute('aria-label'),texts[i]);assert.equal(buttons[i].textContent,texts[i]);assert.equal(d.getElementById(buttons[i].id),buttons[i]);}
 buttons[0].click();buttons[1].click();assert.equal(clicks,2);assert.equal(buttons[4].dataset.shortLabel,undefined);assert.equal(d.querySelector('#outside').getAttribute('aria-label'),null);
});
test('actual text and pressed-state mutations update labels and never leave stale accessible state',async t=>{
 const {d}=fixture(t),binding=adapter.mountCompactToolbar({document:d});t.after(()=>binding.destroy());const home=d.querySelector('#home'),sound=d.querySelector('#sound'),pause=d.querySelector('#pause');
 home.firstChild.data='回到首頁';pause.textContent='▶ 繼續';sound.setAttribute('aria-pressed','false');await tick();
 assert.equal(home.dataset.shortLabel,'首頁');assert.equal(home.getAttribute('aria-label'),'回到首頁');assert.equal(pause.dataset.shortLabel,'繼續');assert.equal(pause.getAttribute('aria-label'),'▶ 繼續');assert.equal(sound.dataset.shortLabel,'聲音關');assert.equal(sound.getAttribute('aria-label'),'♪ 聲音關');
 sound.textContent='♪ 聲音關';sound.setAttribute('aria-pressed','true');pause.textContent='Ⅱ 練習設定';await tick();
 assert.equal(sound.dataset.shortLabel,'聲音開');assert.equal(sound.getAttribute('aria-label'),'♪ 聲音開');assert.equal(pause.dataset.shortLabel,'暫停');assert.equal(pause.getAttribute('aria-label'),'Ⅱ 練習設定');
});
test('label projection uses sound text without a pressed state and ignores unrelated button IDs',t=>{
 const {d}=fixture(t),sound=d.querySelector('#sound');sound.removeAttribute('aria-pressed');sound.textContent='♪ 聲音關';assert.equal(adapter.compactToolbarLabel(sound),'聲音關');sound.textContent='♪ 聲音開';assert.equal(adapter.compactToolbarLabel(sound),'聲音開');assert.equal(adapter.compactToolbarLabel(d.querySelector('#other')),'');
});
test('observer stays on toolbar text and pressed state, is idle after sync, and disconnects on destroy',async t=>{
 const {d,w}=fixture(t),records=[],Native=w.MutationObserver;let deliveries=0,disconnects=0;
 w.MutationObserver=class{constructor(callback){this.observer=new Native(m=>{deliveries++;callback(m);});}observe(node,options){records.push({node,options});this.observer.observe(node,options);}disconnect(){disconnects++;this.observer.disconnect();}};
 const binding=adapter.mountCompactToolbar({document:d,root:d.querySelector('main')});assert.equal(records.length,4);for(const {node,options}of records){assert.ok(node.matches('header .toolbar button'));assert.deepEqual(options.attributeFilter,['aria-pressed']);assert.equal(options.characterData,true);assert.equal(options.childList,true);assert.equal(options.subtree,true);}
 const sound=d.querySelector('#sound');sound.setAttribute('aria-pressed','false');await tick();const settled=deliveries;binding.sync();sound.disabled=true;d.querySelector('#outside').textContent='不觀察';await tick();assert.equal(deliveries,settled);binding.destroy();assert.ok(disconnects>0);sound.setAttribute('aria-pressed','true');await tick();assert.equal(sound.dataset.shortLabel,'聲音關');assert.equal(deliveries,settled);
});
for(const chapter of [2,3,4])test(`chapter ${chapter} mounts the adapter once, observes real sound action and disconnects at destroy`,async t=>{
 const dom=new JSDOM(read(`preview/chapter${chapter}/index.html`),{url:`https://compact.test/preview/chapter${chapter}/?previewOnly=1`,pretendToBeVisual:true}),w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});
 const sound=d.querySelector('#sound'),home=d.querySelector('#home');const ui=mountChapterInterface({document:d,window:w,cast:CAST,getCharacter:()=> 'wang',storage:null});let destroyed=false;t.after(()=>{if(!destroyed)ui.destroy();w.close();});
 assert.equal(home.dataset.shortLabel,'總覽');assert.equal(sound.dataset.shortLabel,'聲音開');sound.click();await tick();assert.equal(ui.preferences.masterMuted,true);assert.equal(sound.dataset.shortLabel,'聲音關');assert.equal(sound.getAttribute('aria-label'),'♪ 聲音關');ui.destroy();destroyed=true;sound.setAttribute('aria-pressed','true');await tick();assert.equal(sound.dataset.shortLabel,'聲音關');
});
test('root entry installs the shared adapter exactly once outside frame rendering',()=>{const source=read('game.mjs');assert.equal((source.match(/mountCompactToolbar\(\{document\}\)/g)||[]).length,1);});
