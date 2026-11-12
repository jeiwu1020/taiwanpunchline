import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {stylesAt} from './helpers/css-contracts.mjs';
import {mountChapterInterface} from '../dist/preview/campaign/chapter-ui.mjs';
import {mountContinuationControls} from '../dist/preview/campaign/page-bridge.mjs';

const read=path=>readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');
const settingsKey='parliament-settings-v1';
function mount(t,{rotate=true,chapter=2,width=390,height=844,styles=false}={}){
 const dom=new JSDOM(read(`preview/chapter${chapter}/index.html`),{url:'https://test.local/',pretendToBeVisual:true});
 const w=dom.window,d=w.document,writes=[];
 const dimensions=(width,height)=>{
  Object.defineProperty(w,'innerWidth',{value:width,configurable:true});
  Object.defineProperty(w,'innerHeight',{value:height,configurable:true});
 };
 dimensions(width,height);
 Object.defineProperty(w.navigator,'maxTouchPoints',{value:1});
 w.matchMedia=()=>({matches:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(styles){
  // Exercise the old sheet followed by its actual first-chapter override.
  // This is a CSS cascade contract, not a substitute for browser geometry QA.
  for(const path of ['preview/campaign/chapter-ui.css','preview/campaign/chapter-first-interface.css','challenge-layout.css']){
   const style=d.createElement('style');style.textContent=read(path);d.head.append(style);
  }
 }
 const ui=mountChapterInterface({document:d,window:w,cast:{},getCharacter:()=> 'wang',storage:{
  getItem:key=>key===settingsKey?JSON.stringify({version:1,rotate}):null,
  setItem:(key,value)=>writes.push({key,value})
 }});
 t.after(()=>{ui.destroy();w.close();});
 return {ui,w,d,writes,dimensions};
}

function referenceRule(d,path,selector){
 // Read the exact first-chapter rule, without asking JSDOM to lay out its game
 // or parse unrelated @container rules it does not support.
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const match=read(path).match(new RegExp('(?:^|[{}])\\s*'+escaped+'\\s*\\{([^}]+)\\}'));
 assert.ok(match,`missing first-chapter rule ${path}: ${selector}`);
 const style=d.createElement('span').style;style.cssText=match[1];return style;
}

function assertReferenceProperties(actual,reference,properties){
 for(const property of properties){
  assert.notEqual(reference.getPropertyValue(property),'',`reference defines ${property}`);
  assert.equal(actual.getPropertyValue(property),reference.getPropertyValue(property),property);
 }
}

test('portrait sideways uses a landscape logical frame and inverse DOM rectangles',t=>{
 const {ui,d,writes}=mount(t);
 assert.equal(ui.viewport.rotation,90);
 assert.equal(ui.viewport.width,844);
 assert.equal(ui.viewport.height,390);
 assert.equal(d.body.dataset.layout,'landscape');
 assert.equal(d.body.dataset.sideways,'true');
 assert.equal(d.body.dataset.nativeLandscape,'false');
 assert.equal(d.querySelector('#trial-app').style.width,'844px');
 assert.equal(d.querySelector('#trial-app').style.height,'390px');
 assert.equal(d.querySelector('#trial-app').style.transform,'translateX(390px) rotate(90deg)');
 assert.deepEqual(ui.logicalRect({left:100,top:20,right:130,bottom:70,width:30,height:50},{left:0,top:0,right:390,bottom:844,width:390,height:844}),{left:20,top:260,right:70,bottom:290,width:50,height:30});
 assert.deepEqual(ui.logicalRect({left:150,top:120,right:180,bottom:170,width:30,height:50},{left:50,top:100,right:440,bottom:944,width:390,height:844}),{left:20,top:260,right:70,bottom:290,width:50,height:30});
 assert.deepEqual(writes,[]);
});

test('real chapter-one rotate control round-trips portrait and sideways without changing game saves',t=>{
 const {ui,d,writes}=mount(t,{rotate:false});
 assert.equal(ui.viewport.rotation,0);
 assert.equal(d.body.dataset.layout,'portrait');
 ui.openSettings();d.querySelector('#settings-tab-controls').click();
 const control=d.querySelector('#settings-pane-controls #rotate-mode');
 assert.ok(control);
 assert.equal(control.hidden,false);
 assert.equal(control.getAttribute('aria-pressed'),'false');
 const before=ui.preferences;
 control.click();
 assert.equal(ui.viewport.rotation,90);
 assert.equal(d.body.dataset.layout,'landscape');
 assert.equal(control.getAttribute('aria-pressed'),'true');
 assert.deepEqual(ui.preferences,{...before,rotate:true});
 assert.equal(d.querySelector('#help-dialog').dataset.rotation,'90');
 control.click();
 assert.equal(ui.viewport.rotation,0);
 assert.equal(d.body.dataset.layout,'portrait');
 assert.deepEqual(ui.preferences,before);
 assert.equal(d.querySelector('#help-dialog').open,true);
 assert.equal(d.querySelector('#help-dialog').dataset.rotation,'0');
 assert.deepEqual(writes.map(write=>write.key),[settingsKey,settingsKey]);
 assert.deepEqual(JSON.parse(writes.at(-1).value),before);
});

test('chapter native dialogs use the rotated logical viewport and first-chapter settings constraints',t=>{
 const {ui,d,writes}=mount(t);
 assert.equal(d.body.style.getPropertyValue('--chapter-width'),'844px');
 assert.equal(d.body.style.getPropertyValue('--chapter-height'),'390px');
 ui.openSettings();
 const dialog=d.querySelector('#help-dialog');
 assert.equal(dialog.parentElement,d.body);
 assert.equal(dialog.dataset.layout,'landscape');
 assert.equal(dialog.dataset.compact,'true');
 assert.equal(dialog.dataset.rotation,'90');
 assert.equal(dialog.style.width,'828px');
 assert.equal(dialog.style.maxHeight,'374px');
 assert.equal(dialog.style.left,'195px');
 assert.equal(dialog.style.top,'422px');
 assert.equal(dialog.style.transform,'translate(-50%,-50%) rotate(90deg)');
 const settings=referenceRule(d,'preview/campaign/chapter-first-interface.css','body[data-sideways="true"]>dialog#help-dialog');
 assert.equal(settings.getPropertyValue('max-width'),'calc(var(--chapter-width) - 16px)');
 assert.equal(settings.getPropertyPriority('max-width'),'important');
 assert.equal(settings.getPropertyValue('max-height'),'calc(var(--chapter-height) - 16px)');
 assert.equal(settings.getPropertyValue('overflow'),'hidden');
 const home=referenceRule(d,'preview/campaign/chapter-first-interface.css','body[data-sideways="true"]>.chapter-home-confirm.paper');
 assert.equal(home.getPropertyValue('transform'),'translate(-50%,-50%) rotate(90deg)');
 assert.equal(home.getPropertyValue('max-width'),'min(420px,calc(var(--chapter-width) - 24px))');
 ui.openHome();
 assert.equal(dialog.open,false);
 assert.equal(d.querySelector('#chapter-home-confirm').open,true);
 assert.equal(d.querySelector('#chapter-home-confirm').parentElement,d.body);
 assert.deepEqual(writes,[]);
});

test('physical orientation changes clear sideways transforms without changing saved rotate preference',t=>{
 const {ui,d,dimensions,writes}=mount(t);ui.openSettings();
 dimensions(844,390);ui.resize();
 assert.equal(ui.viewport.rotation,0);
 assert.equal(ui.viewport.width,844);
 assert.equal(ui.viewport.height,390);
 assert.equal(d.body.dataset.sideways,'false');
 assert.equal(d.body.dataset.nativeLandscape,'true');
 assert.equal(d.body.dataset.overlayControls,'true');
 assert.equal(ui.cameraOptions.nativeLandscape,true);
 assert.equal(d.querySelector('#trial-app').style.transform,'none');
 assert.equal(d.querySelector('#help-dialog').style.transform,'translate(-50%,-50%) rotate(0deg)');
 assert.equal(d.querySelector('#help-dialog').style.left,'422px');
 assert.equal(d.querySelector('#help-dialog').style.top,'195px');
 assert.deepEqual(ui.logicalRect({left:100,top:20,right:130,bottom:70,width:30,height:50},{left:40,top:10,right:884,bottom:400,width:844,height:390}),{left:60,top:10,right:90,bottom:60,width:30,height:50});
 dimensions(390,844);ui.resize();
 assert.equal(ui.viewport.rotation,90);
 assert.equal(d.body.dataset.sideways,'true');
 assert.equal(d.body.dataset.nativeLandscape,'false');
 assert.equal(d.querySelector('#help-dialog').dataset.rotation,'90');
 assert.equal(d.querySelector('#help-dialog').open,true);
 assert.equal(ui.preferences.rotate,true);
 assert.deepEqual(writes,[]);
});

for(const chapter of [2,3,4]){
 test(`chapter ${chapter} loads the shared challenge layout last and orders brand, save, and toolbar in one portrait row`,t=>{
  const {d,w,ui,dimensions}=mount(t,{rotate:false,chapter,styles:true});
  // Mount the real save-status host, rather than inventing a CSS-only fixture.
  // Initialization remains inert: no formal save or chapter may be opened.
  mountContinuationControls({document:d,window:w,chapterId:`chapter-${chapter}`,isReady:()=>false,createPlayableChapter:()=>assert.fail('layout inspection must not start a chapter')});
  const links=[...d.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.getAttribute('href').split('?')[0]);
  assert.equal(links.at(-1),'../../challenge-layout.css');
  assert.ok(links.indexOf('../campaign/chapter-ui.css')<links.indexOf('../campaign/chapter-first-interface.css'));
  const baseline=new JSDOM(read('index.html'));t.after(()=>baseline.window.close());
  assert.deepEqual([...d.querySelectorAll('header .toolbar button')].map(button=>button.id),[...baseline.window.document.querySelectorAll('header .toolbar button')].map(button=>button.id));
  const headerElement=d.querySelector('#trial-app>header');
  assert.deepEqual([...headerElement.children].map(element=>element.matches('.brand')?'brand':element.id==='campaign-bar'?'save':element.matches('.toolbar')?'toolbar':'unexpected'),['brand','save','toolbar']);
  for(const width of [320,390,430]){
   dimensions(width,844);ui.resize();
   const header=w.getComputedStyle(headerElement);
   assert.equal(header.display,'grid');
   assert.equal(header.height,'44px');
   // jsdom does not evaluate physical media queries. Check the exact breakpoint
   // declaration with the shared contract reader, not a fabricated pixel size.
   const prefix='#trial-app.cabinet.app[data-challenge-layout][data-touch="true"][data-layout="portrait"]>header';
   const responsive=stylesAt(read('challenge-layout.css'),[prefix],{width,height:844});
   assert.equal(responsive['grid-template-columns'],width<390?'44px 44px minmax(0,1fr)':'104px 44px minmax(0,1fr)');
   assert.equal(header.gridTemplateRows,'44px');
   for(const [selector,column] of [['.brand','1'],['#campaign-bar','2'],['.toolbar','3']]){
    const cell=w.getComputedStyle(headerElement.querySelector(selector));
    assert.equal(cell.gridColumn,column,`${width}px ${selector} column`);
    assert.equal(cell.gridRow,'1',`${width}px ${selector} shares the first row`);
   }
   const toolbar=w.getComputedStyle(d.querySelector('header .toolbar'));
   assert.equal(toolbar.display,'grid');assert.equal(toolbar.gridTemplateColumns,'repeat(4,minmax(0,1fr))');assert.equal(toolbar.flexWrap,'nowrap');assert.equal(toolbar.gap,'3px');
   for(const element of d.querySelectorAll('header .toolbar button')){
    const button=w.getComputedStyle(element);
    assert.equal(button.minWidth,'44px');assert.equal(button.minHeight,'44px');assert.equal(button.height,'44px');assert.equal(button.fontSize,'0px');assert.ok(element.dataset.shortLabel);
   }
  }
 });
}

test('sideways and native landscape share chapter-one compact toolbar geometry',t=>{
 const {d,w,ui,dimensions}=mount(t,{styles:true});
 for(const [width,height] of [[390,844],[844,390]]){
  dimensions(width,height);ui.resize();
  const toolbar=w.getComputedStyle(d.querySelector('header .toolbar'));
  assert.equal(toolbar.display,'flex');
  assert.equal(toolbar.flexWrap,'nowrap');
  assertReferenceProperties(toolbar,referenceRule(d,'mobile-game.css','.app[data-touch="true"][data-layout="landscape"] .toolbar'),['gap']);
  // Native street mode has its own first-chapter-safe inset/font adjustment.
  // The common touch target dimensions remain the same in either orientation.
  const button=w.getComputedStyle(d.querySelector('header #home'));
  assertReferenceProperties(button,referenceRule(d,'interface-v30.css','.app[data-touch="true"][data-layout="landscape"] .toolbar button'),['height','min-height']);
  assertReferenceProperties(button,referenceRule(d,'mobile-game.css','.app[data-touch="true"][data-layout="landscape"] .toolbar button'),['min-width']);
 }
});

test('compact chapter entry retains a full-width start row below the chapter-specific choices',t=>{
 const {d,w}=mount(t,{styles:true});
 const card=w.getComputedStyle(d.querySelector('#menu .card'));
 assert.equal(card.display,'grid');
 const start=w.getComputedStyle(d.querySelector('#menu #start'));
 assert.equal(start.gridColumn,'1/-1');
 const roster=w.getComputedStyle(d.querySelector('#menu #menu-roster'));
 assert.equal(roster.gridColumn,'2');
 assert.equal(roster.gridRow,'1/5');
 assert.equal(w.getComputedStyle(d.querySelector('#menu .note')).display,'block');
});
