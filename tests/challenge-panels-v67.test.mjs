import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {mountChallengeDialogViewport} from '../dist/challenge-dialog-viewport.mjs';
import {mountChallengeStory} from '../dist/challenge-story.mjs';
import {createChallengeProgress} from '../dist/challenge-progress.mjs';
import {createProfileProgress} from '../dist/profile-progress.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';

// Browser boundary only: render the real templates and exercise their handlers.
function documentFixture({rotation=0,width=390,height=844}={}){
 const doc={activeElement:null},win={innerWidth:width,innerHeight:height,addEventListener(){},removeEventListener(){}};
 function element(tag='div',attributes={}){
  const attrs=new Map(Object.entries(attributes)),listeners={},node={tagName:tag.toUpperCase(),ownerDocument:doc,dataset:{},style:{setProperty(k,v){this[k]=v;}},children:[],scrollTop:0,scrollHeight:1600,clientHeight:300,open:false,hidden:false};
  node.setAttribute=(k,v)=>{attrs.set(k,String(v));if(k==='hidden')node.hidden=true;if(k==='width'||k==='height')node[k]=Number(v);if(k.startsWith('data-'))node.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);};
  node.getAttribute=k=>attrs.get(k)??null;node.removeAttribute=k=>{attrs.delete(k);if(k==='open')node.open=false;};
  for(const[k,v]of attrs)node.setAttribute(k,v);
  node.focus=()=>{doc.activeElement=node;};node.showModal=()=>{node.open=true;};node.close=()=>{node.open=false;};node.appendChild=node.append=n=>{node.children.push(n);n.parentNode=node;};node.remove=()=>{};
  node.addEventListener=(type,fn)=>{(listeners[type]??=[]).push(fn);};node.removeEventListener=(type,fn)=>{listeners[type]=(listeners[type]||[]).filter(x=>x!==fn);};
  node.fire=(type,properties={})=>{const e={target:node,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;this.immediateStopped=true;},...properties};node['on'+type]?.(e);for(const fn of listeners[type]||[]){if(e.immediateStopped)break;fn(e);}return e;};
  node.matches=selector=>{if(selector.startsWith('.'))return(node.getAttribute('class')||'').split(' ').includes(selector.slice(1));const tests=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(tests.length)return tests.every(([,k,v])=>v===undefined?attrs.has(k):attrs.get(k)===v);return tag===selector;};
  node.querySelectorAll=selector=>node.children.filter(n=>n.matches(selector.split(/\s+/).at(-1)));node.querySelector=selector=>node.querySelectorAll(selector)[0]||null;node.closest=selector=>node.matches(selector)?node:node.parentNode?.closest(selector)||null;
  Object.defineProperty(node,'innerHTML',{get:()=>node.html||'',set(html){node.html=html;node.children=[];for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)){const a={};for(const m of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))a[m[1]]=m[2]??'';node.appendChild(element(match[1],a));}}});
  return node;
 }
 const app=element(),shell=element();app.dataset.rotation=String(rotation);app.style.width=width+'px';app.style.height=height+'px';shell.getBoundingClientRect=()=>({width:rotation?height:width,height:rotation?width:height,left:0,top:0});
 doc.defaultView=win;doc.createElement=element;doc.body=app;doc.querySelector=s=>s==='.app'?app:s==='#viewport-shell'?shell:null;
 return{doc,app,element};
}
function panel(options={}){
 const fixture=documentFixture(options);globalThis.document=fixture.doc;const values=new Map(),profiles=createProfileProgress({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}}),progress=createChallengeProgress({profiles});let started;
 const characters={wang:{name:'王世堅',portrait:'wang.webp'},han:{name:'韓國魚',portrait:'han.webp'},huang:{name:'咆哮哥',portrait:'huang.webp'}};
 const ui=mountChallengeUI({progress,characters,parent:fixture.app,onStart:value=>{started=value;}});ui.open();return{...fixture,ui,progress,profiles,get started(){return started;}};
}
test('unreached route names and bosses never enter visible or accessible panel markup',()=>{
 const h=panel();assert.match(h.ui.element.innerHTML,/巷口/);assert.doesNotMatch(h.ui.element.innerHTML,/擴音隊長|市場|封街總管|造勢|咆哮哥/);
 h.progress.rewardEncounter({encounterId:'route-0',xp:25,checkpoint:1});h.ui.refresh();assert.match(h.ui.element.innerHTML,/擴音隊長/);assert.doesNotMatch(h.ui.element.innerHTML,/市場|封街總管|造勢|咆哮哥/);
 h.progress.rewardEncounter({encounterId:'boss-0',xp:40,checkpoint:2});h.ui.refresh();assert.match(h.ui.element.innerHTML,/市場/);assert.doesNotMatch(h.ui.element.innerHTML,/封街總管|造勢|咆哮哥/);
 h.progress.rewardEncounter({encounterId:'boss-2',xp:40,checkpoint:6,boss:true});h.ui.refresh();assert.match(h.ui.element.innerHTML,/咆哮哥/);
});
test('custom chapter picks commit only available fighters and restore trigger focus',()=>{
 const h=panel({rotation:90,width:844,height:390}),d=h.ui.element;assert.doesNotMatch(d.innerHTML,/<select\b/);
 const trigger=d.querySelector('[data-pick="character"]');trigger.fire('click');assert.equal(trigger.getAttribute('aria-expanded'),'true');assert.equal(d.querySelector('[data-pick-menu="character"]').hidden,false);
 const option=d.querySelector('[data-pick-option="character"][data-value="han"]');assert.ok(option);option.fire('click');assert.equal(d.querySelector('[data-pick="character"]').getAttribute('aria-expanded'),'false');assert.equal(h.doc.activeElement,d.querySelector('[data-pick="character"]'));
 d.querySelector('[data-action="start"]').fire('click');assert.equal(h.started.characterId,'han');assert.equal(h.started.helperId,'han');
});
test('picker arrow keys, Escape and Tab preserve selection and dialog dismissal priority',()=>{
 const h=panel(),d=h.ui.element,trigger=d.querySelector('[data-pick="character"]');trigger.fire('keydown',{key:'ArrowDown'});assert.equal(trigger.getAttribute('aria-expanded'),'true');
 const first=d.querySelector('[data-pick-option="character"][data-value="wang"]'),second=d.querySelector('[data-pick-option="character"][data-value="han"]');first.fire('keydown',{key:'ArrowDown'});assert.equal(h.doc.activeElement,second);
 d.fire('cancel');assert.equal(d.open,true);assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.equal(h.doc.activeElement,trigger);
 trigger.fire('click');second.fire('keydown',{key:'Tab'});assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.equal(d.open,true);
 d.fire('cancel');assert.equal(d.open,false);
});
test('research selection uses same custom chooser without adding a separate skill screen',()=>{
 const h=panel();h.ui.open({view:'character'});assert.doesNotMatch(h.ui.element.innerHTML,/<select\b/);assert.match(h.ui.element.innerHTML,/challenge-build/);h.ui.element.querySelector('[data-pick="character"]').fire('click');h.ui.element.querySelector('[data-pick-option="character"][data-value="han"]').fire('click');assert.match(h.ui.element.innerHTML,/韓國魚 · 自由養成/);
});
test('rotated touch dragging scrolls the dialog along its logical vertical axis',()=>{
 const f=documentFixture({rotation:90,width:844,height:390}),d=f.element('dialog');const binding=mountChallengeDialogViewport(d);d.scrollTop=100;let clicks=0;d.addEventListener('click',()=>clicks++);
 d.fire('pointerdown',{pointerType:'touch',pointerId:1,clientX:100,clientY:200});const moved=d.fire('pointermove',{pointerType:'touch',pointerId:1,clientX:150,clientY:200});assert.equal(d.scrollTop,150);assert.equal(moved.defaultPrevented,true);d.fire('pointerup',{pointerId:1});const click=d.fire('click',{detail:1});assert.equal(click.defaultPrevented,true);assert.equal(click.immediateStopped,true);assert.equal(click.stopped,true);assert.equal(clicks,0,'suppressed drag-click must not reach a later listener');
 binding.destroy();d.fire('pointerdown',{pointerType:'touch',pointerId:2,clientX:100,clientY:200});d.fire('pointermove',{pointerType:'touch',pointerId:2,clientX:170,clientY:200});assert.equal(d.scrollTop,150);
});
test('portrait comic resizes its real canvas and gives paint the logical frame',()=>{
 const f=documentFixture();let next,painted;globalThis.requestAnimationFrame=fn=>{next=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
 const story=mountChallengeStory({document:f.doc,paint:(...args)=>{painted=args;}});story.show([{speaker:'主角',title:'清晨',copy:'出發',phase:0}]);next(100);assert.equal(painted[0].width,720);assert.equal(painted[0].height,680);assert.equal(painted[4].layout,'portrait');story.destroy();
});
test('logical landscape research restores two columns, intact portraits and rotational scrolling',()=>{
 const css=readFileSync(new URL('../dist/challenge.css',import.meta.url),'utf8'),viewport={width:390,height:844};
 const build=stylesAt(css,['.challenge-build','.challenge-dialog[data-layout="landscape"] .challenge-build'],viewport);assert.equal(build['grid-template-columns'],'minmax(200px,.8fr) minmax(280px,1.3fr)');
 const portrait=stylesAt(css,['.challenge-bio img','.challenge-dialog[data-layout="landscape"] .challenge-bio img'],viewport);assert.equal(portrait['object-fit'],'contain');assert.equal(portrait['flex-shrink'],'0');assert.equal(portrait.height,'155px');
 const rotated=stylesAt(css,['.challenge-dialog','.challenge-dialog[data-rotation="90"]'],viewport);assert.equal(rotated['touch-action'],'none');
 const close=stylesAt(css,['.challenge-dialog[data-layout="portrait"] .challenge-head'],viewport);assert.equal(close['align-items'],'flex-start');
 const canvas=stylesAt(css,['.challenge-story[data-layout="portrait"] .story-panel canvas'],viewport);assert.equal(canvas['object-fit'],'contain');assert.equal(canvas['aspect-ratio'],'18/17');
});
test('reopening the visible panel keeps the original launcher as its return focus',()=>{
 const h=panel(),launcher=h.element('button');h.ui.hide();launcher.focus();h.ui.open();h.ui.element.querySelector('[data-pick="character"]').fire('click');h.ui.open({view:'character'});h.ui.hide();assert.equal(h.doc.activeElement===launcher,true);
});
test('scrolling a rotated dialog does not swallow a later keyboard click',()=>{
 const f=documentFixture({rotation:-90,width:844,height:390}),d=f.element('dialog');const binding=mountChallengeDialogViewport(d);d.scrollTop=100;let clicks=0;d.addEventListener('click',()=>clicks++);
 d.fire('pointerdown',{pointerType:'touch',pointerId:1,clientX:180,clientY:200});d.fire('pointermove',{pointerType:'touch',pointerId:1,clientX:130,clientY:200});assert.equal(d.scrollTop,150);d.fire('pointerup',{pointerId:1});const click=d.fire('click',{detail:0});assert.notEqual(click.defaultPrevented,true);assert.notEqual(click.immediateStopped,true);assert.equal(clicks,1,'keyboard activation still reaches the listener after scrolling');binding.destroy();
});
test('changing from portrait to rotated landscape gives the story painter the new full canvas',()=>{
 const f=documentFixture();let next,painted;globalThis.requestAnimationFrame=fn=>{next=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};const story=mountChallengeStory({document:f.doc,paint:(...args)=>{painted=args;}}),beats=[{speaker:'主角',title:'出發',copy:'故事',phase:2}];
 story.show(beats);next(100);assert.equal(painted[0].height,680);story.close();f.app.style.width='844px';f.app.style.height='390px';f.app.dataset.rotation='90';story.show(beats);next(200);assert.equal(painted[0].width,960);assert.equal(painted[0].height,540);assert.equal(painted[4].layout,'landscape');story.destroy();
});

test('switching research to backup resets the long-page scroll and exposes the correct title',()=>{
 const h=panel({width:844,height:390});h.ui.open({view:'character'});const d=h.ui.element;d.scrollTop=650;
 d.querySelector('[data-view="save"]').fire('click');
 assert.equal(d.scrollTop,0);assert.match(d.innerHTML,/<h2>存檔備份<\/h2>/);
 assert.equal(h.doc.activeElement,d.querySelector('[data-view="save"]'));
});
test('opening and changing panel choosers leaves all three save records untouched',()=>{
 const h=panel(),d=h.ui.element;h.progress.rewardEncounter({encounterId:'layout-check',xp:125,checkpoint:1,characterId:'wang'});h.progress.allocate('wang','hp');
 const before=h.profiles.get().document;d.scrollTop=80;
 for(const view of ['chapter','character','save','chapter']){
  d.querySelector(`[data-view="${view}"]`).fire('click');
  if(view!=='save'){d.querySelector('[data-pick="character"]').fire('click');d.querySelector('[data-pick-option="character"][data-value="han"]').fire('click');}
 }
 assert.deepEqual(h.profiles.get().document,before);
});
test('opening a chooser prevents focus from shifting the parent dialog',()=>{
 const h=panel(),d=h.ui.element;const selected=d.querySelector('[data-pick-option="character"][data-value="wang"]');let focusOptions;
 selected.focus=options=>{focusOptions=options;};d.scrollTop=80;d.querySelector('[data-pick="character"]').fire('click');
 assert.deepEqual(focusOptions,{preventScroll:true});assert.equal(d.scrollTop,80);
});

test('all challenge pages expose the same independent corner close and restore the launcher',()=>{
 for(const rotation of [0,90,-90]){
  const h=panel({rotation,width:844,height:390}),d=h.ui.element,launcher=h.element('button');
  h.ui.hide();launcher.focus();
  for(const view of ['chapter','character','save']){
   h.ui.open({view});d.scrollTop=180;
   assert.ok(d.querySelector('.challenge-tools'),'close has its own scrolling overlay layer');
   const close=d.querySelector('.challenge-close');assert.ok(close);
   close.fire('click');assert.equal(d.open,false);assert.equal(h.doc.activeElement,launcher);
  }
 }
});

test('scrolled transformed dialog positions the chooser in content coordinates without a second scroll offset',()=>{
 for(const rotation of [0,90,-90]){
  const h=panel({rotation,width:390,height:600}),d=h.ui.element,trigger=d.querySelector('[data-pick="character"]'),menu=d.querySelector('[data-pick-menu="character"]');
  Object.assign(d,{clientWidth:366,clientHeight:576,scrollTop:112,scrollLeft:15});
  Object.assign(trigger,{offsetParent:d,offsetLeft:40,offsetTop:510.5,offsetWidth:160,offsetHeight:44});
  menu.children.push(...d.querySelectorAll('[data-pick-option="character"]'));
  trigger.fire('click');
  // Browser reproduction: dialog top 8 + border 4 + content top - scroll 112.
  // The list must end six pixels above the trigger at screen/logical y 410.5.
  assert.equal(menu.style.top,'371.5px');assert.equal(menu.style.left,'40px');
  assert.equal(8+4+parseFloat(menu.style.top)-112+133,404.5);
  assert.equal(menu.dataset.placement,'above');assert.equal(d.scrollTop,112);
  d.scrollTop=400;d.fire('scroll');
  assert.equal(menu.dataset.placement,'below');assert.equal(menu.style.top,'560.5px');
  assert.equal(parseFloat(menu.style.top)-d.scrollTop,160.5);
 }
});
