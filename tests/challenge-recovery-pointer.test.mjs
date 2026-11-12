import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChallengeStory} from '../dist/challenge-story.mjs';
import {mountChallengeDialogViewport} from '../dist/challenge-dialog-viewport.mjs';
import {mountChallengePreparation} from '../dist/challenge-preparation.mjs';
import {CAST} from '../dist/roster.mjs';
import {BOSS_DIALOGUES} from '../dist/challenge-flow.mjs';
import {deferred} from './helpers/game-harness.mjs';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(t,{rotation=0}={}){
 const dom=new JSDOM('<div id="viewport-shell"><main class="app"></main></div>',{pretendToBeVisual:true,url:'https://recovery-pointer.test/'}),w=dom.window,d=w.document,app=d.querySelector('.app'),shell=d.querySelector('#viewport-shell');
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 const frame={width:568,height:320,screenWidth:rotation?320:568,screenHeight:rotation?568:320,left:0,top:0,rotation,touch:true};
 Object.defineProperties(w,{innerWidth:{value:frame.screenWidth,writable:true},innerHeight:{value:frame.screenHeight,writable:true}});app.style.width='568px';app.style.height='320px';app.dataset.rotation=String(rotation);
 let rect={left:0,top:0,width:frame.screenWidth,height:frame.screenHeight};shell.getBoundingClientRect=app.getBoundingClientRect=()=>({...rect});
 app.__viewportState={ready:false,epoch:7,surfaceGeneration:4,readiness:'paint',prepared:false,painted:false,status:'blocked',reason:'surface-unpainted',frame};
 let current=true,calls={retry:0,back:0};const ui=mountChallengeStory({document:d}),root=d.querySelector('.challenge-story'),next=root.querySelector('[data-story-next]'),back=root.querySelector('[data-story-return]');
 const contract=(mode='both',extra={})=>({accepted:false,reason:'scene-unavailable',isCurrent:()=>current,...(mode!=='return'?{retryPresentation:()=>{calls.retry++;return true;}}:{}),...(mode!=='retry'?{returnToOverview:()=>calls.back++}:{}),...extra});
 const show=(mode,extra)=>ui.showRecovery(contract(mode,extra),BOSS_DIALOGUES[2]);
 const click=(target,detail=1)=>{const e=new w.MouseEvent('click',{bubbles:true,cancelable:true,detail});target.dispatchEvent(e);return e;};
 // jsdom may lack native PointerEvent. Real DOM dispatch/capture is exercised
 // using its MouseEvent base plus pointer metadata, not a hardware event claim.
 const pointer=(type,target,extra={})=>{const Ctor=w.PointerEvent||w.MouseEvent,e=new Ctor(type,{bubbles:true,cancelable:true,clientX:100,clientY:100,button:0,...extra});for(const[k,v]of Object.entries({pointerId:1,pointerType:'touch',isPrimary:true,...extra}))if(!['clientX','clientY','button'].includes(k))Object.defineProperty(e,k,{value:v,configurable:true});target.dispatchEvent(e);return e;};
 const tap=target=>{pointer('pointerdown',target);pointer('pointerup',target);return click(target);};
 const publish=()=>w.dispatchEvent(new w.CustomEvent('parliamentviewportchange'));t.after(()=>{ui.destroy();w.close();});
 return {w,d,app,shell,frame,ui,root,next,back,calls,contract,show,click,pointer,tap,publish,setCurrent:v=>current=v,setRect:v=>rect=v};
}
for(const rotation of [0,90,-90])for(const mode of ['both','retry','return'])test(`paint-only unavailable ${rotation} ${mode} recovery accepts detail-1 pointer without making viewport ready`,t=>{
 const f=fixture(t,{rotation});f.show(mode);const before=JSON.stringify(f.app.__viewportState),target=mode==='retry'?f.next:f.back,e=f.tap(target);assert.equal(e.defaultPrevented,false);assert.equal(f.calls[mode==='retry'?'retry':'back'],1);assert.equal(f.root.open,false);assert.equal(JSON.stringify(f.app.__viewportState),before);
});
test('a detail-1 click-only activation is allowed only with current measured geometry and an owned recovery',t=>{
 const f=fixture(t);f.show('return');assert.equal(f.click(f.back).defaultPrevented,false);assert.equal(f.calls.back,1);
});
for(const change of ['missing-frame','geometry-readiness','layout-reason','empty-rect','mismatched-shell','physical-resize','unsynced-epoch','hidden-document'])test(`unready recovery still rejects ${change}`,t=>{
 const f=fixture(t);f.show('return');if(change==='missing-frame')delete f.app.__viewportState.frame;else if(change==='geometry-readiness')f.app.__viewportState.readiness='geometry';else if(change==='layout-reason')f.app.__viewportState.reason='layout-mismatch';else if(change==='empty-rect')f.setRect({left:0,top:0,width:0,height:0});else if(change==='mismatched-shell')f.setRect({left:20,top:0,width:568,height:320});else if(change==='physical-resize')f.w.innerWidth=600;else if(change==='unsynced-epoch')f.app.__viewportState.epoch++;else Object.defineProperty(f.d,'hidden',{value:true});assert.equal(f.tap(f.back).defaultPrevented,true);assert.equal(f.calls.back,0);assert.equal(f.root.open,true);
});
for(const change of ['epoch','frame','owner','new-recovery','target','drag','cancel','non-primary','secondary-button'])test(`a recovery pointer sequence cannot activate after ${change}`,t=>{
 const f=fixture(t,{rotation:90});f.show('both');f.pointer('pointerdown',f.back,change==='non-primary'?{isPrimary:false}:change==='secondary-button'?{button:2}:{});
 if(change==='epoch'){f.app.__viewportState.epoch++;f.publish();}else if(change==='frame'){f.app.__viewportState.frame={...f.frame,left:1};f.publish();}else if(change==='owner')f.setCurrent(false);else if(change==='new-recovery')f.show('both');else if(change==='drag')f.pointer('pointermove',f.back,{clientX:115});else if(change==='cancel')f.pointer('pointercancel',f.back);
 f.pointer('pointerup',f.back);const e=f.click(change==='target'?f.next:f.back);assert.equal(e.defaultPrevented,true);assert.deepEqual(f.calls,{retry:0,back:0});
});
test('continuous surface generation renewals do not invalidate a same-geometry recovery tap',t=>{
 const f=fixture(t);f.show('return');f.pointer('pointerdown',f.back);for(let i=0;i<8;i++){f.app.__viewportState.surfaceGeneration++;f.app.__viewportState.reason='draw-failed';f.publish();}f.pointer('pointerup',f.back);assert.equal(f.click(f.back).defaultPrevented,false);assert.equal(f.calls.back,1);
});
test('an owner change while the viewport becomes ready still cancels the old pointer sequence',t=>{
 const f=fixture(t);f.show('return');f.pointer('pointerdown',f.back);f.show('return');f.app.__viewportState.ready=true;f.publish();f.pointer('pointerup',f.back);assert.equal(f.click(f.back).defaultPrevented,true);assert.equal(f.calls.back,0);
});
test('busy retry locks both controls, then a second display failure permits a fresh return tap',async t=>{
 const f=fixture(t),pending=deferred();f.show('both',{retryPresentation:()=>{f.calls.retry++;return pending.promise;}});assert.equal(f.tap(f.next).defaultPrevented,false);assert.equal(f.tap(f.next).defaultPrevented,true);assert.equal(f.tap(f.back).defaultPrevented,true);assert.equal(f.calls.retry,1);pending.resolve(f.contract('return'));await flush();assert.equal(f.tap(f.back).defaultPrevented,false);assert.equal(f.calls.back,1);
});
for(const kind of ['normal-story','hidden','disabled','stale-owner','missing-owner-proof','other-control'])test(`no recovery exception for ${kind}`,t=>{
 const f=fixture(t);f.show('return');let target=f.back;if(kind==='normal-story'){f.ui.show(BOSS_DIALOGUES[2]);target=f.next;}else if(kind==='hidden')f.back.hidden=true;else if(kind==='disabled')f.back.disabled=true;else if(kind==='stale-owner')f.setCurrent(false);else if(kind==='missing-owner-proof')f.show('return',{isCurrent:undefined});else target=f.root.querySelector('[data-story-skip]');assert.equal(f.tap(target).defaultPrevented,true);assert.deepEqual(f.calls,{retry:0,back:0});
});
for(const kind of ['preparation','settings','generic'])test(`${kind} dialog without an explicit recovery token remains locked`,t=>{
 const f=fixture(t),dialog=f.d.createElement('dialog'),button=f.d.createElement('button');dialog.className=kind;dialog.append(button);f.d.body.append(dialog);let calls=0;button.onclick=()=>calls++;const binding=mountChallengeDialogViewport(dialog);t.after(()=>binding.destroy());assert.equal(f.tap(button).defaultPrevented,true);assert.equal(calls,0);
});
test('the viewport predicate cannot bypass native drag suppression even if it returns a token',t=>{
 const f=fixture(t,{rotation:90}),dialog=f.d.createElement('dialog'),button=f.d.createElement('button');dialog.append(button);f.d.body.append(dialog);let calls=0;button.onclick=()=>calls++;const token={},binding=mountChallengeDialogViewport(dialog,{unreadyActionToken:()=>token});t.after(()=>binding.destroy());f.pointer('pointerdown',button);f.pointer('pointermove',button,{clientY:120});f.pointer('pointerup',button);assert.equal(f.click(button).defaultPrevented,true);assert.equal(calls,0);
});

async function preparationFixture(t,{reason='scene-unavailable',persisted=true,owned=true,saveFailure=false}={}){
 const f=fixture(t);f.app.__viewportState.ready=true;f.publish();const skills={hp:0,move:0,basic:0,defense:0,special:0,rally:0,assist:0};let writes=0,closed=0,current=owned;
 const snapshot={profileId:'slot-1',revision:1,generation:1,initialized:true,modeEpoch:0,characterId:'wang',helperId:'han',difficulty:'easy',allowance:0,unlockedCharacters:['wang','han'],characters:{wang:{skills},han:{skills}}};
 const ui=mountChallengePreparation({document:f.d,characters:CAST,controller:{preparationSnapshot:()=>structuredClone(snapshot),prepareEncounter:async()=>{writes++;return saveFailure?{accepted:false,persisted:false,reason:'quota-exceeded'}:{accepted:true,persisted:true};},retrySave:async()=>{writes++;return {accepted:true,persisted:true};}},onApplied:()=>{f.app.__viewportState.ready=false;f.publish();return {accepted:false,persisted,reason,isCurrent:()=>current};},onClose:()=>closed++});t.after(()=>ui.destroy());ui.open({intent:'retry'});f.click(ui.element.querySelector('#preparationConfirm'));await flush();
 if(saveFailure){f.app.__viewportState.ready=false;f.publish();}
 return {...f,prep:ui,cancel:()=>ui.element.querySelector('#preparationCancel'),setOwner:v=>current=v,get writes(){return writes;},get closed(){return closed;}};
}
test('saved preparation display failure permits only its owned Cancel pointer, without another save',async t=>{
 const f=await preparationFixture(t);const writes=f.writes;assert.equal(f.tap(f.cancel()).defaultPrevented,false);assert.equal(f.closed,1);assert.equal(f.prep.isOpen,false);assert.equal(f.writes,writes);assert.equal(f.app.__viewportState.ready,false);
});
for(const kind of ['save-error','not-persisted','other-destination','stale-owner','confirm','allocation'])test(`preparation ${kind} cannot use the saved-display Cancel exception`,async t=>{
 const f=await preparationFixture(t,kind==='save-error'?{saveFailure:true}:kind==='not-persisted'?{persisted:false}:kind==='other-destination'?{reason:'content-locked'}:{});if(kind==='stale-owner')f.setOwner(false);const target=kind==='confirm'?f.prep.element.querySelector('#preparationConfirm'):kind==='allocation'?f.prep.element.querySelector('#preparationInspect'):f.cancel(),writes=f.writes;assert.equal(f.tap(target).defaultPrevented,true);assert.equal(f.closed,0);assert.equal(f.writes,writes);
});
test('preparation Cancel does not accept a pointer begun under its previous owner',async t=>{
 const f=await preparationFixture(t);f.pointer('pointerdown',f.cancel());f.setOwner(false);f.pointer('pointerup',f.cancel());assert.equal(f.click(f.cancel()).defaultPrevented,true);assert.equal(f.closed,0);
});

function unsafeGeometryRecovery(f,{safe=true}={}){
 let allowed=safe,reloads=0;f.show('return',{savedReload:{isSafe:()=>allowed,reload:()=>{if(!allowed)return false;reloads++;return true;}}});f.setRect({left:20,top:0,width:568,height:320});f.publish();
 const button=f.root.querySelector('[data-viewport-saved-reload]');if(button)button.getBoundingClientRect=()=>({left:120,top:140,width:240,height:44});return {button,setSafe:value=>allowed=value,get reloads(){return reloads;}};
}
test('permanently inconsistent geometry exposes only a native physical saved-reload action',t=>{
 const f=fixture(t),exit=unsafeGeometryRecovery(f);assert.ok(exit.button,'same modal needs an operable saved-only exit');assert.equal(f.root.dataset.viewportRecoveryExit,'true');assert.equal(f.root.style.getPropertyValue('transform'),'none');assert.equal(exit.button.disabled,false);assert.equal(f.tap(exit.button).defaultPrevented,false);assert.equal(exit.reloads,1);assert.equal(f.app.__viewportState.ready,false);assert.deepEqual(f.calls,{retry:0,back:0});
});
test('unsafe or unconfirmed data is kept in the page, never reloaded',t=>{
 const f=fixture(t),exit=unsafeGeometryRecovery(f,{safe:false});assert.ok(exit.button);assert.equal(exit.button.disabled,true);assert.match(f.root.querySelector('[data-viewport-exit-copy]').textContent,/保留此頁/);assert.equal(f.tap(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);
});
for(const change of ['receipt','drag','epoch','owner'])test(`saved-only physical exit rejects ${change} during a pointer sequence`,t=>{
 const f=fixture(t),exit=unsafeGeometryRecovery(f);assert.ok(exit.button);f.pointer('pointerdown',exit.button);if(change==='receipt')exit.setSafe(false);else if(change==='drag')f.pointer('pointermove',exit.button,{clientX:115});else if(change==='epoch'){f.app.__viewportState.epoch++;f.publish();}else{f.ui.show(BOSS_DIALOGUES[2]);}f.pointer('pointerup',exit.button);assert.equal(f.click(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);
});
test('geometry recovery restores the original owned modal and removes the safety overlay',t=>{
 const f=fixture(t),exit=unsafeGeometryRecovery(f);assert.ok(exit.button);f.setRect({left:0,top:0,width:568,height:320});f.publish();assert.equal(f.root.dataset.viewportRecoveryExit,undefined);assert.equal(f.root.querySelector('[data-viewport-saved-exit]').hidden,true);assert.notEqual(f.root.querySelector('.story-panel').style.display,'none');assert.equal(f.tap(f.back).defaultPrevented,false);assert.equal(f.calls.back,1);assert.equal(exit.reloads,0);
});

test('a physical saved exit without a committed frame still rejects an old epoch gesture and accepts a fresh gesture',t=>{
 const f=fixture(t),exit=unsafeGeometryRecovery(f);delete f.app.__viewportState.frame;f.publish();f.pointer('pointerdown',exit.button);f.app.__viewportState.epoch++;f.publish();f.pointer('pointerup',exit.button);assert.equal(f.click(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);assert.equal(f.tap(exit.button).defaultPrevented,false);assert.equal(exit.reloads,1);assert.equal(f.app.__viewportState.ready,false);
});
