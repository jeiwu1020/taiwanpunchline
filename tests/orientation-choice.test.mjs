import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createSettingsStore,DEFAULT_SETTINGS} from '../dist/settings-state.mjs';
const source=()=>readFileSync(new URL('../dist/orientation-choice.js',import.meta.url),'utf8');
const key='parliament-settings-v1';
function page({width=390,height=844,coarse=true,hover=false,points=5,saved,session,blocked=false,sessionBlocked=false,query=''}={}){
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="safe-insets"></div><div id="viewport-shell"><main class="app"><h1 id="title-heading" tabindex="-1">拳民開講</h1></main></div></body></html>',{url:'https://game.test/'+query,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;Object.defineProperties(w,{innerWidth:{value:width,writable:true},innerHeight:{value:height,writable:true}});Object.defineProperty(w.navigator,'maxTouchPoints',{value:points});
 w.matchMedia=q=>({matches:q.includes('pointer')?coarse:q.includes('hover')?!hover:false});
 if(saved!==undefined)w.localStorage.setItem(key,typeof saved==='string'?saved:JSON.stringify(saved));if(session!==undefined)w.sessionStorage.setItem('parliament-orientation-session-v1',JSON.stringify(session));
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});if(sessionBlocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
 w.eval(source());return {dom,w,choice:w.parliamentOrientationChoice,click:value=>w.document.querySelector(`[data-orientation="${value}"]`).click()};
}
for(const [name,value,rotate]of [['portrait','portrait',false],['landscape','landscape',true]])test(`fresh phone ${name} chooses once without writing defaults`,async t=>{
 const p=page();t.after(()=>p.dom.window.close());assert.equal(p.choice.pending,true);assert.equal(p.w.localStorage.getItem(key),null);assert.equal(p.w.document.documentElement.dataset.orientationChoice,'pending');
 assert.equal(p.w.document.querySelector('dialog').getAttribute('aria-labelledby'),'orientation-choice-title');p.click(value);await p.choice.ready;
 assert.equal(p.choice.pending,false);assert.equal(p.choice.rotate,rotate);assert.deepEqual(JSON.parse(p.w.localStorage.getItem(key)),{version:1,rotate});assert.equal(p.w.document.querySelector('dialog'),null);
 p.w.dispatchEvent(new p.w.Event('orientationchange'));p.w.dispatchEvent(new p.w.Event('resize'));assert.equal(p.w.document.querySelector('dialog'),null);
 const next=page({saved:p.w.localStorage.getItem(key)});t.after(()=>next.dom.window.close());assert.equal(next.choice.pending,false);assert.equal(next.choice.rotate,rotate);
});
for(const rotate of [true,false])test(`saved valid ${rotate} is respected without writes or a card`,t=>{
 const saved={version:1,rotate,musicVolume:.37,camera:'stable',custom:'preserved'},p=page({saved});t.after(()=>p.dom.window.close());assert.equal(p.choice.pending,false);assert.deepEqual(JSON.parse(p.w.localStorage.getItem(key)),saved);assert.equal(p.w.document.querySelector('dialog'),null);
});
test('only a real small touch device prompts; query flag and touchscreen laptop do not',t=>{
 for(const options of [{coarse:false,points:0,width:1440,height:900},{coarse:false,points:0,width:390,query:'?touchPreview'},{coarse:false,hover:true,points:10,width:1366,height:768},{width:1920,height:1080}]){
  const p=page(options);t.after(()=>p.dom.window.close());assert.equal(p.choice.pending,false);assert.equal(p.w.localStorage.getItem(key),null);
 }
});
test('native landscape is described accurately and existing viewport rotates it zero times',async t=>{
 const p=page({width:844,height:390});t.after(()=>p.dom.window.close());assert.match(p.w.document.querySelector('#orientation-choice-note').textContent,/已橫拿/);p.click('landscape');await p.choice.ready;p.w.eval(readFileSync(new URL('../dist/viewport-core.js',import.meta.url),'utf8'));const r=p.w.parliamentViewportCore.gameViewport({width:844,height:390,touch:true,rotate:p.choice.rotate,fullBleed:true});assert.equal(r.rotation,0);
});
test('unavailable storage retains the choice in memory and optional tab storage, without trapping play',async t=>{
 for(const sessionBlocked of [false,true]){const p=page({blocked:true,sessionBlocked});t.after(()=>p.dom.window.close());p.click('portrait');await p.choice.ready;assert.equal(p.choice.rotate,false);assert.equal(p.choice.pending,false);
  const settings=createSettingsStore({storage:null,initialRotate:p.choice.rotate});assert.equal(settings.get().rotate,false);assert.equal(settings.get().camera,DEFAULT_SETTINGS.camera);assert.equal(settings.get().musicVolume,DEFAULT_SETTINGS.musicVolume);
  p.w.eval(source());assert.equal(p.w.document.querySelector('dialog'),null);
  if(!sessionBlocked){const next=page({blocked:true,session:JSON.parse(p.w.sessionStorage.getItem('parliament-orientation-session-v1'))});t.after(()=>next.dom.window.close());assert.equal(next.choice.pending,false);assert.equal(next.choice.rotate,false);}
 }
});
test('missing or invalid orientation is not a choice; preserve all unrelated valid preferences',async t=>{
 for(const rotate of [undefined,'false',0]){const saved={version:1,musicVolume:.4,voiceMuted:true,camera:'stable',...(rotate===undefined?{}:{rotate})},p=page({saved});t.after(()=>p.dom.window.close());assert.equal(p.choice.pending,true);p.click('landscape');await p.choice.ready;assert.deepEqual(JSON.parse(p.w.localStorage.getItem(key)),{...saved,rotate:true});}
 const p=page({saved:{version:2,rotate:false,musicVolume:.7}});t.after(()=>p.dom.window.close());p.click('portrait');await p.choice.ready;assert.equal(JSON.parse(p.w.localStorage.getItem(key)).version,2);
});
test('pending selection holds bootstrap before any auto-rotation; mounted settings get the same choice',async t=>{
 const p=page();t.after(()=>p.dom.window.close());let starts=0,read;
 p.w.parliamentViewportCore={createViewportLifecycle(options){starts++;read=options.read;return{invalidate(){},destroy(){}};},readGameViewport(w,options){return options;}};
 p.w.eval(readFileSync(new URL('../dist/viewport-boot.js',import.meta.url),'utf8'));assert.equal(starts,0);p.click('portrait');await p.choice.ready;await Promise.resolve();assert.equal(starts,1);assert.equal(read().rotate,false);
 const store=createSettingsStore({storage:p.w.localStorage,initialRotate:p.choice.rotate});assert.equal(store.get().rotate,false);store.update({rotate:true});assert.equal(store.get().rotate,true);
});
test('every player entry waits before viewport or settings construction and has head-before-body choice assets',()=>{
 const pages=['index.html',...['chapter2','chapter3','chapter4','chapter5','finale'].map(x=>`preview/${x}/index.html`)];
 for(const path of pages){const s=readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');assert.ok(s.indexOf('orientation-choice.js')<s.indexOf('</head>'),path);assert.ok(s.indexOf('orientation-choice.css')<s.indexOf('orientation-choice.js'),path);}
 const entries=['game.mjs','preview/chapter2/chapter2-playable.mjs','preview/chapter3/chapter2-playable.mjs','preview/chapter4/chapter4-playable.mjs','preview/chapter5/chapter5-playable.mjs','preview/finale/finale-playable.mjs'];
 for(const path of entries){const s=readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');assert.match(s,/if\(window\.parliamentOrientationChoice\?\.pending\)await window\.parliamentOrientationChoice\.ready;/,path);assert.ok(s.indexOf('await window.parliamentOrientationChoice.ready')<s.indexOf(path==='game.mjs'?'const $=':'mountCampaignTouch({'),path);}
});
test('choice uses buttons without a keyboard, traps focus, and remains accurate across rotation',async t=>{
 const p=page();t.after(()=>p.dom.window.close());const d=p.w.document,buttons=[...d.querySelectorAll('#orientation-choice button')];
 assert.equal(d.querySelectorAll('#orientation-choice input,#orientation-choice textarea,#orientation-choice [contenteditable]').length,0);assert.equal(d.activeElement,buttons[0]);
 buttons[0].dispatchEvent(new p.w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));assert.equal(d.activeElement,buttons[1]);
 buttons[1].dispatchEvent(new p.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(d.activeElement,buttons[0]);
 const cancel=new p.w.Event('cancel',{cancelable:true});d.querySelector('dialog').dispatchEvent(cancel);assert.equal(cancel.defaultPrevented,true);assert.equal(p.choice.pending,true);
 p.w.innerWidth=844;p.w.innerHeight=390;p.w.dispatchEvent(new p.w.Event('resize'));assert.match(d.querySelector('#orientation-choice-note').textContent,/已橫拿/);
 p.click('portrait');await p.choice.ready;assert.equal(p.choice.rotate,false);
});
test('a later saved preference wins over session fallback and initial settings never write it',t=>{
 const p=page({saved:{version:1,rotate:true},session:{version:1,rotate:false}});t.after(()=>p.dom.window.close());assert.equal(p.choice.rotate,true);
 let writes=0;const store=createSettingsStore({storage:{getItem:()=>JSON.stringify({version:1,rotate:true,camera:'stable'}),setItem(){writes++;}},initialRotate:false});assert.equal(store.get().rotate,true);assert.equal(store.get().camera,'stable');assert.equal(writes,0);
});
