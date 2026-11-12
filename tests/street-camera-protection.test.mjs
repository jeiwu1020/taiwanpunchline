import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountViewportProtection,createViewportLifecycle,readGameViewport} from '../dist/viewport-lifecycle.mjs';
const cameraError=()=>Object.assign(new Error('No readable camera pocket'),{code:'STREET_CAMERA_BLOCKED'});

test('camera draw failure uses existing notice without exposing arbitrary error text',()=>{
 const dom=new JSDOM('<body></body>',{pretendToBeVisual:true});let retries=0;const ui=mountViewportProtection(dom.window.document,()=>retries++),notice=dom.window.document.querySelector('[data-viewport-protection]');
 assert.equal(typeof ui.setDrawFailure,'function');
 ui.setDrawFailure(cameraError());ui.update({status:'settling',ready:false});assert.equal(notice.hidden,true);
 ui.update({status:'blocked',ready:false});assert.equal(notice.hidden,false);assert.match(notice.textContent,/可用畫面太小/);assert.match(notice.textContent,/操作暫停/);assert.equal(notice.textContent.includes('No readable camera pocket'),false);
 notice.querySelector('button').click();assert.equal(retries,1);assert.equal(notice.hidden,false,'recheck does not fake a ready state');
 ui.update({status:'ready',ready:true});assert.equal(notice.hidden,true);
 ui.setDrawFailure(new Error('secret arbitrary diagnostic'));ui.update({status:'blocked',ready:false});assert.match(notice.textContent,/畫面尺寸尚未穩定/);assert.equal(notice.textContent.includes('secret'),false);
 ui.destroy();assert.equal(dom.window.document.querySelector('[data-viewport-protection]'),null);dom.window.close();
});

test('camera-specific notice does not change recovery deadline, paint token or input gating',()=>{
 const dom=new JSDOM('<body></body>',{pretendToBeVisual:true});let now=0,id=0,clears=0,ui;const pending=new Map();
 const win={innerWidth:390,innerHeight:844,performance:{now:()=>now},requestAnimationFrame:fn=>(pending.set(++id,fn),id),cancelAnimationFrame:key=>pending.delete(key)};
 const notice=mountViewportProtection(dom.window.document,()=>ui.invalidate('orientation'));
 assert.equal(typeof notice.setDrawFailure,'function');
 const surface=()=>({valid:true,width:390,height:844,backingWidth:390,backingHeight:844});
 ui=createViewportLifecycle({window:win,document:dom.window.document,requirePaint:true,read:()=>readGameViewport(win,{touch:true,rotate:false}),apply(){},prepare:surface,clearInput:()=>clears++,onState:s=>notice.update(s),measure:()=>({valid:true,key:'test'})});
 const tick=()=>{now+=16;const callbacks=[...pending.values()];pending.clear();for(const f of callbacks)f(now);};
 ui.acknowledgePaint(ui.token,surface());for(let i=0;i<80;i++)tick();assert.equal(ui.ready,true);
 const old=ui.token;notice.setDrawFailure(cameraError());ui.failSurface('draw-failed');assert.equal(ui.ready,false);assert.equal(ui.acknowledgePaint(old,surface()),false);
 for(let i=0;i<170;i++){tick();notice.setDrawFailure(cameraError());ui.failSurface('draw-failed');}
 assert.equal(ui.status,'blocked');assert.equal(ui.ready,false);assert.ok(clears>0);assert.equal(dom.window.document.querySelector('[data-viewport-protection]').hidden,false);
 assert.match(dom.window.document.querySelector('[data-viewport-protection]').textContent,/可用畫面太小/);
 assert.equal(ui.acknowledgePaint(ui.token,surface()),true);for(let i=0;i<80;i++)tick();assert.equal(ui.ready,true);assert.equal(dom.window.document.querySelector('[data-viewport-protection]').hidden,true);
 ui.destroy();notice.destroy();dom.window.close();
});

test('non-DOM harness can report draw failures without creating another recovery owner',()=>{
 const ui=mountViewportProtection({},()=>{throw Error('not requested');});assert.equal(typeof ui.setDrawFailure,'function');ui.setDrawFailure(cameraError());ui.update({ready:false,status:'blocked'});ui.destroy();
});
