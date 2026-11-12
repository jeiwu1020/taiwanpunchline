import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST} from '../dist/core.mjs';
import {MOVE_VISUALS,expressionFor} from '../dist/art-expression.mjs';
import {ART_FILES} from '../dist/art-render.mjs';
import {rosterMotion} from '../dist/art-roster-motion.mjs';
for(const [type,c]of Object.entries(CAST))test(type+' specials have distinct expression keys and named presentations',()=>{
 const keys=c.moves.map(m=>{const v=MOVE_VISUALS[m.kind];assert.ok(v?.label);assert.ok(v?.accent);const key=expressionFor(type,{kind:m.kind,age:.25,head:'head'},{});assert.ok(ART_FILES[key]);return key;});
 assert.equal(new Set(keys).size,3);
});
test('new cast reactions select an alternate face, and idle keeps approved identity',()=>{for(const type of ['su','huang','chen','ko']){assert.equal(expressionFor(type,{kind:'',age:0},{}),type+'-head');assert.notEqual(expressionFor(type,{kind:'',age:0},{reaction:.3}),type+'-head');}});
test('every non-default expression exists in preload manifest',()=>{for(const v of Object.values(MOVE_VISUALS))assert.ok(ART_FILES[v.head]);});
test('V10 actions use different hand roles and silhouette profiles',()=>{const poses=['ma_cough','su_rush','huang_queue'].map(k=>rosterMotion(k,.25));assert.equal(new Set(poses.map(p=>JSON.stringify([p.wrist,p.farW,p.gait,p.drop,p.hand]))).size,3);});
test('question combo alternates the active palms between strikes',()=>{const a=rosterMotion('chen_question',.22),b=rosterMotion('chen_question',.45);assert.ok(Math.abs(a.wrist.x-b.wrist.x)>20);assert.ok(Math.abs(a.farW.x-b.farW.x)>20);assert.ok(a.wrist.y<b.farW.y-25);});
