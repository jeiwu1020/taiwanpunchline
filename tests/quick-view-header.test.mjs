import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {bindQuickViewHelp} from '../dist/preview/quick-view/header.mjs';
const html=readFileSync(new URL('../dist/preview/quick-view/index.html',import.meta.url),'utf8');
test('help toggles without navigation or touching game frame',()=>{
 const {window}=new JSDOM(html),d=window.document;const frame=d.querySelector('#game');frame.src='/preview/finale/';
 bindQuickViewHelp(d);const btn=d.querySelector('#toggle-help');
 assert.equal(btn.getAttribute('aria-expanded'),'false');btn.click();assert.equal(btn.getAttribute('aria-expanded'),'true');assert.equal(d.querySelector('header').dataset.helpOpen,'true');
 btn.click();assert.equal(btn.getAttribute('aria-expanded'),'false');assert.equal(frame.getAttribute('src'),'/preview/finale/');
});
test('escape closes help and restores toggle focus, without frame reload',()=>{
 const {window}=new JSDOM(html),d=window.document;bindQuickViewHelp(d);const btn=d.querySelector('#toggle-help');btn.click();
 d.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(btn.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,btn);
});
test('all chapter entries, load and exit remain available',()=>{
 const d=new JSDOM(html).window.document;assert.equal(d.querySelectorAll('#chapter option').length,6);assert.ok(d.querySelector('#load'));assert.equal(d.querySelector('a').getAttribute('href'),'/');assert.equal(d.querySelector('#toggle-help').getAttribute('aria-controls'),'status');
});
test('compact layout hides only help copy, but never isolation alerts',()=>{
 assert.match(html,/@media\s*\(max-height:450px\)\s*and\s*\(min-aspect-ratio:1\/1\)/);
 assert.match(html,/#status\[data-failure="true"\]/);assert.match(html,/#status:not\(\[data-failure="true"\]\)/);
 assert.match(html,/flex-wrap:nowrap/);assert.match(html,/overflow-x:auto/);
});

test('rejected host displays an alert even when compact help is closed',()=>{
 const viewer=readFileSync(new URL('../dist/preview/quick-view/viewer.mjs',import.meta.url),'utf8');
 assert.match(viewer,/status.dataset.failure='true';status.setAttribute\('role','alert'\);status.textContent='此功能/);
});

import {bindQuickViewSize} from '../dist/preview/quick-view/header.mjs';
test('preview dimensions resize the real frame without navigation or persistent storage',()=>{
 const {window}=new JSDOM(html),d=window.document,frame=d.querySelector('#game'),select=d.querySelector('#view-size');frame.src='/preview/chapter5/';
 Object.defineProperty(window,'localStorage',{get(){throw Error('must not read storage');}});bindQuickViewSize(d);
 for(const [value,width,height]of [['portrait','390px','844px'],['landscape','844px','390px'],['desktop','1280px','720px'],['auto','','']]){select.value=value;select.dispatchEvent(new window.Event('change'));assert.equal(frame.style.width,width);assert.equal(frame.style.height,height);assert.equal(frame.getAttribute('src'),'/preview/chapter5/');}
});
