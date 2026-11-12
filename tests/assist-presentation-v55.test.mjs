import test from 'node:test';import assert from 'node:assert/strict';import {assistView} from '../dist/assist-presentation.mjs';
const ep=(phase='attack')=>({actor:{x:400,y:430,face:1},owner:{id:'player'},phase,age:.45,warning:.9,exitAge:0,exitDuration:.28});
test('assist active art is aligned to physical actor',()=>{const v=assistView(ep());assert.equal(v.x,400);assert.equal(v.y,430);});
test('assist entry uses bounded rear movement only during warning',()=>{assert.equal(assistView(ep('warning')).x,382);assert.equal(assistView(ep('warning'),{reducedMotion:true}).x,400);});
test('assist exit follows actual duration and then disappears',()=>{assert.equal(assistView({...ep('exit'),exitAge:.28}),null);assert.ok(assistView({...ep('exit'),exitAge:.14}).alpha<.5);});
test('finish hides helpers and enemy uses distinct color',()=>{assert.equal(assistView(ep(),{hidden:true}),null);assert.notEqual(assistView(ep()).color,assistView({...ep(),owner:{id:'enemy'}}).color);});
test('invalid/absent helper episode does not render',()=>{assert.equal(assistView(null),null);assert.equal(assistView(ep('done')),null);});
