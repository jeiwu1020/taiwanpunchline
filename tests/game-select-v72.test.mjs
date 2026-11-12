import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const path=new URL('../dist/game-select.mjs',import.meta.url);
const missing=()=>assert.fail('The shared, rotated game chooser is not implemented');
const {mountGameSelects=missing,setGameSelectValue=missing,gameSelectFrame=missing,logicalSelectRect=missing}=existsSync(path)?await import(path):{};
const options='<option value="stand">站立</option><option value="guard">防守</option><option value="ai">AI</option>';
function fixture(content=`<label for="behavior">對手行為</label><select id="behavior">${options}</select>`,{rotation=0}={}){
 const dom=new JSDOM(`<main class="app" data-rotation="${rotation}"><section id="panel">${content}<button id="after">下一個</button></section></main>`,{pretendToBeVisual:true,url:'https://game.test/'});
 const {document}=dom.window,app=document.querySelector('.app');
 for(const[key,value]of Object.entries({clientWidth:844,clientHeight:390,offsetWidth:844,offsetHeight:390}))Object.defineProperty(app,key,{value,configurable:true});
 app.getBoundingClientRect=()=>({left:0,top:0,right:rotation?390:844,bottom:rotation?844:390,width:rotation?390:844,height:rotation?844:390});
 const ui=mountGameSelects({document});
 const $=s=>document.querySelector(s),trigger=id=>$(`[data-game-select-for="${id}"]`),menu=id=>$(`#${trigger(id).getAttribute('aria-controls')}`);
 function key(node,key,init={}){const e=new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...init});node.dispatchEvent(e);return e;}
 function pointer(node,type,init={}){const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,pointerType:'touch',clientX:100,clientY:100,isPrimary:true,...init});node.dispatchEvent(e);return e;}
 return{dom,document,app,ui,$,trigger,menu,key,pointer,flush:()=>new Promise(resolve=>dom.window.queueMicrotask(resolve)),destroy(){ui.destroy();dom.window.close();}};
}

test('all six shipped select surfaces load the shared game chooser, including art and legacy audio',()=>{
 let count=0;
 for(const file of readdirSync(new URL('../dist/',import.meta.url)).filter(f=>f.endsWith('.html'))){
  const html=readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'),selects=[...html.matchAll(/<select\b[^>]*id="([^"]+)"/g)];
  if(!selects.length)continue;count+=selects.length;
  assert.ok(html.includes(`src="game-select-boot.mjs?v=${RUNTIME_VERSION}"`),file);assert.ok(html.includes(`href="game-select.css?v=${RUNTIME_VERSION}"`),file);
 }
 assert.equal(count,6);
});
test('native control becomes hidden and unfocusable; the labeled trigger is the only tab stop',()=>{
 const h=fixture(),select=h.$('#behavior'),trigger=h.trigger('behavior');
 assert.equal(select.hidden,true);assert.equal(select.tabIndex,-1);assert.equal(select.getAttribute('aria-hidden'),'true');
 assert.equal(trigger.type,'button');assert.equal(trigger.getAttribute('aria-haspopup'),'listbox');assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.match(trigger.getAttribute('aria-label'),/對手行為.*站立/);
 h.$('label').click();assert.equal(h.document.activeElement,trigger);h.destroy();
});
test('choosing dispatches original input/change once, preserves the source ID and restores focus',()=>{
 const h=fixture(),select=h.$('#behavior'),events=[];select.oninput=e=>events.push([e.type,e.target.id,e.target.value]);select.onchange=e=>events.push([e.type,e.target.id,e.target.value]);
 h.trigger('behavior').click();h.menu('behavior').querySelector('[data-value="guard"]').click();
 assert.equal(select.value,'guard');assert.deepEqual(events,[['input','behavior','guard'],['change','behavior','guard']]);assert.equal(h.document.activeElement,h.trigger('behavior'));assert.match(h.trigger('behavior').textContent,/防守/);
 h.trigger('behavior').click();h.menu('behavior').querySelector('[data-value="guard"]').click();assert.equal(events.length,2);h.destroy();
});
test('keyboard arrows, Home/End, Enter and Space move or commit without leaking gameplay keys',()=>{
 const h=fixture(),trigger=h.trigger('behavior');let leaked=0;h.dom.window.addEventListener('keydown',()=>leaked++);
 h.key(trigger,'ArrowDown');const choices=[...h.menu('behavior').querySelectorAll('[role="option"]')];assert.equal(h.document.activeElement,choices[0]);
 h.key(choices[0],'End');assert.equal(h.document.activeElement,choices[2]);h.key(choices[2],'ArrowDown');assert.equal(h.document.activeElement,choices[0]);h.key(choices[0],'ArrowUp');assert.equal(h.document.activeElement,choices[2]);h.key(choices[2],'Home');assert.equal(h.document.activeElement,choices[0]);
 h.key(choices[0],'ArrowDown');h.key(choices[1],'Enter');assert.equal(h.$('#behavior').value,'guard');
 h.key(trigger,' ');h.key(h.document.activeElement,'End');h.key(h.document.activeElement,' ');assert.equal(h.$('#behavior').value,'ai');assert.equal(leaked,0);h.destroy();
});
test('Escape cancels only the chooser; Tab closes at the trigger so normal focus order continues',()=>{
 const h=fixture(),trigger=h.trigger('behavior');let escaped=0;h.dom.window.addEventListener('keydown',e=>{if(e.key==='Escape')escaped++;});
 trigger.click();h.key(h.document.activeElement,'End');const e=h.key(h.document.activeElement,'Escape');assert.equal(e.defaultPrevented,true);assert.equal(escaped,0);assert.equal(h.$('#behavior').value,'stand');assert.equal(h.document.activeElement,trigger);
 trigger.click();const tab=h.key(h.document.activeElement,'Tab');assert.equal(tab.defaultPrevented,false);assert.equal(h.document.activeElement,trigger);assert.equal(trigger.getAttribute('aria-expanded'),'false');h.destroy();
});
test('pointer outside and focus leaving dismiss without changing selection or stealing focus',()=>{
 const h=fixture(),trigger=h.trigger('behavior');trigger.click();h.pointer(h.$('#after'),'pointerdown');assert.equal(h.menu('behavior').hidden,true);
 trigger.click();h.$('#after').focus();assert.equal(h.menu('behavior').hidden,true);assert.equal(h.document.activeElement,h.$('#after'));assert.equal(h.$('#behavior').value,'stand');h.destroy();
});
test('disabled options and groups cannot be selected, while typing finds an enabled option',()=>{
 const h=fixture('<select id="behavior" aria-label="動作"><option value="stand">Stand</option><option value="guard" disabled>Guard</option><optgroup label="Locked" disabled><option value="bad">Blocked</option></optgroup><option value="ai">AI</option></select>');
 h.trigger('behavior').click();const menu=h.menu('behavior');menu.querySelector('[data-value="guard"]').click();assert.equal(h.$('#behavior').value,'stand');h.key(h.document.activeElement,'ArrowDown');assert.equal(h.document.activeElement.dataset.value,'ai');h.key(h.document.activeElement,'s');assert.equal(h.document.activeElement.dataset.value,'stand');h.destroy();
});
test('programmatic training changes sync immediately without firing change; disabled controls close',async()=>{
 const h=fixture(),select=h.$('#behavior');let changed=0;select.onchange=()=>changed++;
 setGameSelectValue(select,'ai');assert.match(h.trigger('behavior').textContent,/AI/);assert.equal(changed,0);
 h.trigger('behavior').click();select.disabled=true;await h.flush();assert.equal(h.trigger('behavior').disabled,true);assert.equal(h.menu('behavior').hidden,true);h.destroy();
});
test('dynamic move options, new selects and removed controls are reconciled without duplicates',async()=>{
 const h=fixture();h.$('#behavior').replaceChildren(new h.dom.window.Option('走路','walk'),new h.dom.window.Option('跳躍','jump'));await h.flush();assert.match(h.trigger('behavior').textContent,/走路/);
 h.$('#panel').insertAdjacentHTML('beforeend',`<select id="dynamic" aria-label="新選單">${options}</select>`);await h.flush();assert.equal(h.$('#dynamic').hidden,true);assert.ok(h.trigger('dynamic'));
 h.ui.refresh();assert.equal(h.document.querySelectorAll('[data-game-select-for="dynamic"]').length,1);
 h.trigger('dynamic').click();h.$('#dynamic').closest('[data-game-select]').remove();await h.flush();assert.equal(h.document.querySelectorAll('.game-select-menu:not([hidden])').length,0);h.destroy();
});
test('closing a screen, details section or modal closes the chooser before a later reopen',async()=>{
 const h=fixture();h.trigger('behavior').click();h.$('#panel').classList.add('hidden');await h.flush();assert.equal(h.menu('behavior').hidden,true);h.$('#panel').classList.remove('hidden');await h.flush();assert.equal(h.trigger('behavior').getAttribute('aria-expanded'),'false');h.destroy();
 const d=fixture(`<dialog open><details open><summary>歷史</summary><select id="behavior">${options}</select></details></dialog>`);d.trigger('behavior').click();assert.equal(d.menu('behavior').parentElement,d.$('dialog'));d.$('details').open=false;await d.flush();assert.equal(d.menu('behavior').hidden,true);d.$('details').open=true;await d.flush();d.trigger('behavior').click();d.$('dialog').removeAttribute('open');await d.flush();assert.equal(d.menu('behavior').hidden,true);d.destroy();
});
test('the popup stays in the app/dialog transform; rotation and resize cancel stale touch geometry',async()=>{
 const h=fixture(undefined,{rotation:90});h.trigger('behavior').click();assert.equal(h.menu('behavior').parentElement,h.app);assert.equal(h.menu('behavior').dataset.rotation,'90');
 h.app.dataset.rotation='0';await h.flush();assert.equal(h.menu('behavior').hidden,true);h.trigger('behavior').click();h.dom.window.dispatchEvent(new h.dom.window.Event('resize'));assert.equal(h.menu('behavior').hidden,true);h.destroy();
});
test('sideways touch drag scrolls logical Y, never selects the release option, and the next tap works',()=>{
 for(const rotation of [90,-90]){
  const h=fixture(undefined,{rotation}),trigger=h.trigger('behavior');trigger.click();const menu=h.menu('behavior'),option=menu.querySelector('[data-value="ai"]');
  Object.defineProperty(menu,'scrollHeight',{value:600});Object.defineProperty(menu,'clientHeight',{value:140});menu.scrollTop=100;
  h.pointer(option,'pointerdown');const move=h.pointer(option,'pointermove',{clientX:rotation===90?150:50});assert.equal(move.defaultPrevented,true);assert.equal(menu.scrollTop,150);h.pointer(option,'pointerup');
  option.dispatchEvent(new h.dom.window.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));assert.equal(h.$('#behavior').value,'stand');
  h.pointer(option,'pointerdown');h.pointer(option,'pointerup');option.click();assert.equal(h.$('#behavior').value,'ai');h.destroy();
 }
});
test('destroy restores native semantics and removes all chooser observers and listeners',()=>{
 const h=fixture();h.ui.destroy();assert.equal(h.$('#behavior').hidden,false);assert.equal(h.$('#behavior').getAttribute('tabindex'),null);assert.equal(h.$('#behavior').getAttribute('aria-hidden'),null);assert.equal(h.document.querySelectorAll('[data-game-select],.game-select-menu').length,0);h.dom.window.close();
});
test('logical rect conversion handles both side turns, borders and visual scaling',()=>{
 const host={left:20,top:30,right:410,bottom:874,width:390,height:844};
 assert.deepEqual(logicalSelectRect({left:310,top:130,right:354,bottom:230,width:44,height:100},host,{width:844,height:390,rotation:90}),{left:100,top:56,width:100,height:44});
 assert.deepEqual(logicalSelectRect({left:76,top:674,right:120,bottom:774,width:44,height:100},host,{width:844,height:390,rotation:-90}),{left:100,top:56,width:100,height:44});
 assert.deepEqual(logicalSelectRect({left:60,top:70,width:200,height:88}, {left:20,top:30,width:800,height:600},{width:400,height:300}),{left:20,top:20,width:100,height:44});
});
test('popup geometry clamps long lists and short rotated panels without escaping logical bounds',()=>{
 for(const panelWidth of [280,390,844])for(const panelHeight of [180,320,390,844])for(const top of [0,panelHeight/2,panelHeight-44]){
  const f=gameSelectFrame({left:panelWidth-70,top,width:100,height:44,panelWidth,panelHeight,optionCount:21});
  assert.ok(f.left>=6&&f.left+f.width<=panelWidth-6);assert.ok(f.top>=6&&f.top+f.maxHeight<=panelHeight-6);assert.ok(f.maxHeight>0);
 }
});
test('training value assignments explicitly refresh choosers and the gameplay keyboard excludes them',()=>{
 const game=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
 for(const id of ['training-behavior','training-live-behavior'])assert.ok(game.includes(`setGameSelectValue($('#${id}'),trainingBehavior)`));
 assert.match(game,/closest\('dialog,select,\[data-game-select\],\.game-select-menu,#result'\)/);
});

test('hidden options are excluded from keyboard navigation and cannot be committed',()=>{
 const h=fixture(`<select id="behavior"><option value="stand">站立</option><option value="hidden" hidden>不顯示</option><option value="ai">AI</option></select>`);
 h.trigger('behavior').click();h.key(h.document.activeElement,'ArrowDown');assert.equal(h.document.activeElement.dataset.value,'ai');h.menu('behavior').querySelector('[data-value="hidden"]').click();assert.equal(h.$('#behavior').value,'stand');h.destroy();
});
test('fieldsets disable the replacement trigger and form reset refreshes the selected value',async()=>{
 const h=fixture(`<form><fieldset><select id="behavior">${options}</select></fieldset></form>`);setGameSelectValue(h.$('#behavior'),'ai');h.$('form').reset();await h.flush();assert.match(h.trigger('behavior').textContent,/站立/);h.$('fieldset').disabled=true;await h.flush();assert.equal(h.trigger('behavior').disabled,true);h.destroy();
});
test('dialog cancellation dismisses the open list before closing the surrounding modal',()=>{
 const h=fixture(`<dialog open><select id="behavior">${options}</select></dialog>`);h.trigger('behavior').click();const event=new h.dom.window.Event('cancel',{cancelable:true,bubbles:false});h.$('dialog').dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(h.$('dialog').open,true);assert.equal(h.menu('behavior').hidden,true);h.destroy();
});
test('the actual game and art documents enhance every source and do not write settings or saves',()=>{
 const expected={'index.html':['training-behavior','training-live-behavior','voice-sample'],'art.html':['character','move','speed']};
 for(const[file,ids]of Object.entries(expected)){
  const dom=new JSDOM(readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8'),{url:'https://game.test/'}),doc=dom.window.document;
  dom.window.localStorage.setItem('save-proof','unchanged');const ui=mountGameSelects({document:doc});
  assert.deepEqual([...doc.querySelectorAll('select')].map(s=>s.id),ids);for(const id of ids){assert.equal(doc.getElementById(id).hidden,true);assert.ok(doc.querySelector(`[data-game-select-for="${id}"]`));}
  assert.equal(doc.querySelectorAll('[data-game-select-for]').length,ids.length);assert.equal(dom.window.localStorage.length,1);assert.equal(dom.window.localStorage.getItem('save-proof'),'unchanged');ui.destroy();dom.window.close();
 }
});
test('scrolled modal placement subtracts the border once and keeps the popup within visible content',()=>{
 const h=fixture(`<dialog open data-rotation="90"><select id="behavior">${options}</select></dialog>`),dialog=h.$('dialog'),trigger=h.trigger('behavior');
 for(const[key,value]of Object.entries({clientWidth:360,clientHeight:280,offsetWidth:366,offsetHeight:286,clientLeft:3,clientTop:3,scrollTop:90,scrollLeft:0}))Object.defineProperty(dialog,key,{value,configurable:true});
 dialog.getBoundingClientRect=()=>({left:10,top:20,right:296,bottom:386,width:286,height:366});
 trigger.getBoundingClientRect=()=>({left:36,top:90,right:80,bottom:190,width:44,height:100});trigger.click();
 const menu=h.menu('behavior');assert.equal(parseFloat(menu.style.left),67);assert.equal(menu.dataset.placement,'above');assert.equal(parseFloat(menu.style.top),138);assert.ok(parseFloat(menu.style.top)-dialog.scrollTop+parseFloat(menu.style.maxHeight)<=dialog.clientHeight-6);h.destroy();
});

test('removing the source select directly disposes the chooser without resurrecting the control',async()=>{
 const h=fixture();h.trigger('behavior').click();h.$('#behavior').remove();await h.flush();await h.flush();
 assert.equal(h.$('#behavior'),null);assert.equal(h.trigger('behavior'),null);assert.equal(h.document.querySelectorAll('.game-select-menu').length,0);h.destroy();
});
