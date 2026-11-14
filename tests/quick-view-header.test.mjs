import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {createQuickViewTools,bindQuickViewSize} from '../dist/preview/quick-view/header.mjs';
import {setupQuickView} from '../dist/preview/quick-view/viewer.mjs';
import {registerQuickView} from '../dist/preview/quick-view/hook.mjs';
import {mountChallengeDialogViewport} from '../dist/challenge-dialog-viewport.mjs';
const html=readFileSync(new URL('../dist/preview/quick-view/index.html',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../dist/preview/quick-view/bootstrap.js',import.meta.url),'utf8');
const origin='https://codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function loadedDocument(session){const d=session.frame.contentDocument;d.open();d.write('<!doctype html><body></body>');d.close();return d;}
function fixture(t,url=origin+'/preview/quick-view/'){
 const dom=new JSDOM(html,{url,pretendToBeVisual:true});t.after(()=>dom.window.close());
 Object.defineProperty(dom.window,'localStorage',{get(){throw Error('real localStorage must not be read');}});
 Object.defineProperty(dom.window,'sessionStorage',{get(){throw Error('real sessionStorage must not be read');}});
 return dom.window;
}
test('auto iframe fills the viewport and toggling never changes its dimensions or navigation',t=>{
 const w=fixture(t),d=w.document,tools=createQuickViewTools(d);t.after(()=>tools.destroy());bindQuickViewSize(tools.root,d);
 const frame=d.querySelector('iframe'),toggle=tools.root.querySelector('#toggle');frame.src='/preview/finale/';
 const before=frame.outerHTML;
 assert.equal(d.querySelector('header'),null);
 assert.equal(w.getComputedStyle(d.querySelector('#view-host')).position,'fixed');
 assert.equal(w.getComputedStyle(d.querySelector('#view-host')).inset,'0');
 assert.equal(frame.style.width,'100%');assert.equal(frame.style.height,'100%');
 assert.equal(w.getComputedStyle(tools.host).position,'fixed');assert.equal(tools.host.style.pointerEvents,'none');
 assert.equal(tools.root.querySelector('#panel').hidden,true);
 toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');
 toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(frame.outerHTML,before);
});
test('escape closes the tool panel, restores focus and does not reach game shortcuts',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());let gameKeys=0;
 w.document.addEventListener('keydown',()=>gameKeys++);tools.open();
 tools.root.querySelector('#chapter').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,composed:true}));
 assert.equal(tools.root.querySelector('#panel').hidden,true);assert.equal(tools.root.activeElement,tools.root.querySelector('#toggle'));assert.equal(gameKeys,0);
});
test('all six chapter options and advance are in the floating panel, separate from game toolbar',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());
 assert.equal(tools.root.querySelectorAll('#chapter option').length,6);assert.ok(tools.root.querySelector('#advance'));assert.equal(tools.root.querySelector('a').getAttribute('target'),'_top');assert.equal(w.document.querySelector('#advance'),null);
});
test('collapsed entrance moves away from a game tab at the preferred top-center position',async t=>{
 const w=fixture(t),d=w.document,button=d.createElement('button');d.body.append(button);button.getBoundingClientRect=()=>({left:450,right:600,top:10,bottom:60,width:150,height:50});
 const tools=createQuickViewTools(d);t.after(()=>tools.destroy());await new Promise(resolve=>w.requestAnimationFrame(resolve));
 assert.equal(tools.root.querySelector('#toggle').style.top,'730px');
});
test('releasing a held movement key over tools reaches the game without leaking a new keydown',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const held=new Set();
 w.addEventListener('keydown',event=>held.add(event.code));w.addEventListener('keyup',event=>held.delete(event.code));
 w.document.body.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyD',bubbles:true}));assert.equal(held.has('KeyD'),true);
 tools.open();const select=tools.root.querySelector('#chapter');select.focus();
 select.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyA',bubbles:true,composed:true}));assert.equal(held.has('KeyA'),false);
 select.dispatchEvent(new w.KeyboardEvent('keyup',{code:'KeyD',bubbles:true,composed:true}));assert.equal(held.size,0);
});
test('tools follow modal dialogs and return to the wrapper before navigation without changing game markup',async t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentDocument;
 child.body.innerHTML='<div class="toolbar"><button>原有選單</button></div><dialog><button>下一句</button></dialog>';
 const toolbar=child.querySelector('.toolbar').outerHTML;tools.mount(child);
 assert.equal(tools.host.ownerDocument,child);assert.equal(tools.host.parentNode,child.body);
 child.querySelector('dialog').setAttribute('open','');await tick();assert.equal(tools.host.parentNode,child.querySelector('dialog'));
 child.querySelector('dialog').removeAttribute('open');await tick();assert.equal(tools.host.parentNode,child.body);
 tools.mount(w.document);assert.equal(tools.host.ownerDocument,w.document);assert.equal(child.querySelector('.toolbar').outerHTML,toolbar);
});
test('opt-in dimensions change only the frame size and auto restores the full viewport',t=>{
 const w=fixture(t),d=w.document,tools=createQuickViewTools(d);t.after(()=>tools.destroy());bindQuickViewSize(tools.root,d);
 const frame=d.querySelector('iframe'),select=tools.root.querySelector('#view-size');frame.src='/preview/chapter5/';
 for(const [value,width,height]of [['portrait','390px','844px'],['landscape','844px','390px'],['desktop','1280px','720px'],['auto','100%','100%']]){
  select.value=value;select.dispatchEvent(new w.Event('change'));assert.equal(frame.style.width,width);assert.equal(frame.style.height,height);assert.equal(frame.getAttribute('src'),'/preview/chapter5/');
 }
});
test('early capture protects tool keys from game modal shortcuts without cancelling native select keys',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentWindow;tools.prepare(child.document);
 let intercepted=0;child.addEventListener('keydown',event=>{intercepted++;event.preventDefault();},true);tools.mount(child.document);tools.open();
 const select=tools.root.querySelector('#chapter'),arrow=new child.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,composed:true,cancelable:true});select.dispatchEvent(arrow);
 assert.equal(intercepted,0);assert.equal(arrow.defaultPrevented,false);
 select.dispatchEvent(new child.KeyboardEvent('keydown',{key:'Escape',bubbles:true,composed:true,cancelable:true}));assert.equal(intercepted,0);assert.equal(tools.root.querySelector('#panel').hidden,true);
});
test('tools follow actual modal opening order instead of dialog DOM order',async t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentDocument;
 child.body.innerHTML='<dialog id="first"></dialog><dialog id="second"></dialog>';tools.mount(child);
 child.querySelector('#second').setAttribute('open','');await tick();assert.equal(tools.host.parentNode.id,'second');
 child.querySelector('#first').setAttribute('open','');await tick();assert.equal(tools.host.parentNode.id,'first');
 child.querySelector('#first').removeAttribute('open');await tick();assert.equal(tools.host.parentNode.id,'second');
});
test('tool scrolling and pointer gestures stay native without reaching rotated game handlers',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentWindow;tools.prepare(child.document);
 let captured=0;for(const type of ['pointerdown','wheel'])child.addEventListener(type,event=>{captured++;event.preventDefault();},true);
 tools.mount(child.document);tools.open();const panel=tools.root.querySelector('#panel');
 for(const type of ['pointerdown','wheel']){const event=new child.Event(type,{bubbles:true,composed:true,cancelable:true});panel.dispatchEvent(event);assert.equal(event.defaultPrevented,false);}
 assert.equal(captured,0);
});
test('foreign host rejects loading and exposes its warning even with tools collapsed',t=>{
 const w=fixture(t,'https://taiwanpunchline.playformosa.workers.dev/preview/quick-view/'),{tools,session}=setupQuickView(w);t.after(()=>tools.destroy());
 assert.equal(session,undefined);assert.equal(w.document.querySelector('iframe'),null);assert.equal(w.document.querySelector('#failure-status').hidden,false);assert.match(w.document.querySelector('#failure-status').textContent,/僅限指定預覽/);assert.equal(tools.root.querySelector('.controls').hidden,true);
});
test('real rotated modal retains its scroll guards without intercepting tool scroll or clicks',async t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentWindow,d=child.document;
 d.body.innerHTML='<div class="app" data-rotation="90"></div><dialog open><p>遊戲內容</p><button id="game-button">遊戲按鈕</button></dialog>';
 tools.prepare(d);const dialog=d.querySelector('dialog'),viewport=mountChallengeDialogViewport(dialog);t.after(()=>viewport.destroy());tools.mount(d);tools.open();
 Object.defineProperties(dialog,{scrollHeight:{value:1000},clientHeight:{value:300}});dialog.scrollTop=100;
 d.querySelector('p').dispatchEvent(new child.WheelEvent('wheel',{deltaY:80,bubbles:true,cancelable:true}));assert.equal(dialog.scrollTop,180);
 const wheel=new child.WheelEvent('wheel',{deltaY:80,bubbles:true,composed:true,cancelable:true});tools.root.querySelector('#panel').dispatchEvent(wheel);assert.equal(dialog.scrollTop,180);assert.equal(wheel.defaultPrevented,false);
 d.querySelector('.app').__viewportState={ready:false};let toolsClicked=0,gameClicked=0;
 tools.root.querySelector('#close').addEventListener('click',()=>toolsClicked++);d.querySelector('#game-button').onclick=()=>gameClicked++;
 tools.root.querySelector('#close').dispatchEvent(new child.MouseEvent('click',{detail:1,bubbles:true,composed:true,cancelable:true}));
 d.querySelector('#game-button').dispatchEvent(new child.MouseEvent('click',{detail:1,bubbles:true,cancelable:true}));assert.equal(toolsClicked,1);assert.equal(gameClicked,0);
});
test('quick handler uses the child document and does not inject a game toolbar button',async t=>{
 const w=fixture(t),{tools,session}=setupQuickView(w);t.after(()=>tools.destroy());loadedDocument(session);const child=session.frame.contentWindow;
 child.document.body.innerHTML='<div class="toolbar"><button>原有選單</button></div>';const toolbar=child.document.querySelector('.toolbar').outerHTML;
 child.__quickViewIsolated=session;Object.defineProperty(child,'localStorage',{value:session.local});let calls=0;
 assert.equal(registerQuickView(child,()=>{calls++;return true;}),true);assert.equal(tools.host.ownerDocument,child.document);
 await tools.root.querySelector('#advance').onclick();assert.equal(calls,1);assert.match(tools.root.querySelector('#status').textContent,/已跳過/);assert.equal(child.document.querySelector('.toolbar').outerHTML,toolbar);assert.equal(child.document.querySelector('#quick-view-advance'),null);
});
test('saved viewport recovery keeps quick tools visible without revealing hidden game controls',t=>{
 const w=fixture(t),tools=createQuickViewTools(w.document);t.after(()=>tools.destroy());const child=w.document.querySelector('iframe').contentWindow,d=child.document;
 d.body.innerHTML='<div class="app"></div><dialog open><button id="game-button">原遊戲內容</button></dialog>';tools.mount(d);
 d.querySelector('.app').__viewportState={ready:false,readiness:'geometry',epoch:1,frame:{left:0,top:0,width:844,height:390,screenWidth:390,screenHeight:844,rotation:90}};
 const dialog=d.querySelector('dialog'),viewport=mountChallengeDialogViewport(dialog,{document:d,savedRecoveryExit:()=>({isSafe:()=>true,reload:()=>true})});t.after(()=>viewport.destroy());
 assert.equal(dialog.dataset.viewportRecoveryExit,'true');assert.equal(d.querySelector('#game-button').style.display,'none');assert.notEqual(tools.host.style.display,'none');assert.ok(dialog.querySelector('[data-viewport-saved-reload]'));
});
test('pending quick advance cannot overwrite status or enable controls after chapter navigation',async t=>{
 const w=fixture(t),{tools,session}=setupQuickView(w);t.after(()=>tools.destroy());let resolve,calls=0;
 session.setHandler(()=>{calls++;return new Promise(r=>resolve=r);},loadedDocument(session));
 const button=tools.root.querySelector('#advance'),pending=button.onclick();await button.onclick();assert.equal(calls,1);assert.equal(button.disabled,true);
 tools.root.querySelector('#chapter').value='5';tools.root.querySelector('#load').click();
 assert.equal(tools.host.ownerDocument,w.document);assert.equal(session.frame.getAttribute('src'),'/preview/chapter5/?campaign=1&profile=slot-1');
 const status=tools.root.querySelector('#status').textContent;resolve(true);await pending;
 assert.equal(button.disabled,true);assert.equal(tools.root.querySelector('#status').textContent,status);
});
for(const chapter of [2,4])test(`natural chapter ${chapter} navigation parks live tools before document teardown`,async t=>{
 const w=fixture(t,origin+`/preview/quick-view/?chapter=${chapter}`),{tools,session}=setupQuickView(w);t.after(()=>tools.destroy());
 const boot=()=>{const child=session.frame.contentWindow;vm.runInNewContext(bootstrap,{window:child,parent:w,location:child.location,document:child.document});return child;};
 loadedDocument(session);const old=boot();let resolve,oldCalls=0,newCalls=0;
 assert.equal(registerQuickView(old,()=>{oldCalls++;return new Promise(r=>resolve=r);}),true);
 const advance=tools.root.querySelector('#advance'),toggle=tools.root.querySelector('#toggle'),panel=tools.root.querySelector('#panel'),pending=advance.onclick();
 // JSDOM does not fire navigation pagehide or clear detached-node listeners.
 // Fire the browser lifecycle boundary explicitly, before destroying the frame.
 old.dispatchEvent(new old.PageTransitionEvent('pagehide',{persisted:false}));
 assert.equal(tools.host.ownerDocument,w.document,'tools must leave the retiring document before teardown');
 assert.equal(advance.disabled,true);
 const oldDialog=old.document.createElement('dialog');oldDialog.open=true;old.document.body.append(oldDialog);await tick();
 assert.equal(tools.host.ownerDocument,w.document,'retired document observer must not reclaim tools');
 session.frame.src=`/preview/chapter${chapter+1}/?campaign=1&profile=slot-1&handoff=natural`;
 loadedDocument(session);const next=boot();assert.equal(registerQuickView(next,()=>{newCalls++;return true;}),true);
 const status=tools.root.querySelector('#status').textContent;resolve(true);await pending;
 assert.equal(tools.root.querySelector('#status').textContent,status,'retired advance must not overwrite new chapter status');
 assert.equal(advance.disabled,false);assert.equal(tools.host.ownerDocument,next.document);
 old.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:false}));
 assert.equal(advance.disabled,false);assert.equal(tools.host.ownerDocument,next.document,'late old pagehide must not retire the new chapter');
 toggle.click();assert.equal(panel.hidden,false);toggle.click();assert.equal(panel.hidden,true);
 await advance.onclick();assert.equal(oldCalls,1);assert.equal(newCalls,1);
 const size=tools.root.querySelector('#view-size');size.value='landscape';size.dispatchEvent(new next.Event('change'));assert.equal(session.frame.style.width,'844px');
 assert.equal(next.localStorage,session.local);assert.equal(next.sessionStorage,session.tab);
});
test('failure survives a stopped frame, while an unrelated frame cannot change state',t=>{
 const w=fixture(t),{tools,session}=setupQuickView(w);t.after(()=>tools.destroy());session.setHandler(()=>true,loadedDocument(session));
 assert.equal(session.fail({}),false);assert.equal(tools.host.ownerDocument,session.frame.contentDocument);
 assert.equal(session.fail(session.frame.contentWindow),true);assert.equal(tools.host.ownerDocument,w.document);assert.equal(session.frame.hidden,true);assert.equal(w.document.querySelector('#failure-status').hidden,false);assert.equal(tools.root.querySelector('#advance').disabled,true);
 tools.root.querySelector('#load').click();assert.equal(w.document.querySelector('#failure-status').hidden,true);assert.equal(session.frame.hidden,false);
});
