import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const html=readFileSync('dist/index.html','utf8'),css=readFileSync('dist/match-modes.css','utf8');
test('home and pause departure choices are tangible primary buttons, not quiet links',()=>{for(const id of ['home-cancel','home-confirm-button','home-select','resume','leave','restart-match','reselect','replay'])assert.match(html,new RegExp(`id="${id}" class="primary menu-action"`));assert.match(css,/width:184px;max-width:100%;height:48px;min-height:48px/);assert.match(css,/background:#bc3f31;color:var\(--paper\);border:3px solid var\(--ink\)/);assert.match(css,/text-decoration:none;white-space:nowrap/);});

test('menu actions use four consistent semantic colors',()=>{for(const rule of ['#home-confirm #home-cancel,#pause-screen #resume{background:#bc3f31','#home-confirm #home-confirm-button{background:#e5ae46','#home-confirm #home-select,#pause-screen #leave,#result #reselect{background:#315f88','#pause-screen #restart-match{background:#237363'])assert.ok(css.includes(rule));});

test('result selection uses approved wording',()=>{assert.match(html,/id="reselect" class="primary menu-action">重新選角<\/button>/);assert.ok(!html.includes('更換角色'));});
