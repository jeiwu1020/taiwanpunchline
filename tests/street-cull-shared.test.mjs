import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {streetActorNeedsPaint} from '../dist/street-actor-visibility.mjs';
test('shared conservative mob visibility preserves edges, specials and malformed views',()=>{
 const view={left:0,right:844};
 assert.equal(streetActorNeedsPaint({mobKind:'runner',x:-419},view),true);
 assert.equal(streetActorNeedsPaint({mobKind:'runner',x:1263},view),true);
 assert.equal(streetActorNeedsPaint({mobKind:'runner',x:5000},view),false);
 for(const actor of [{x:5000},{mobKind:'runner',x:5000,grabPose:1},{mobKind:'runner',x:5000,grabbedPose:1},{mobKind:'runner',x:5000,helper:true},{mobKind:'runner',x:NaN}])assert.equal(streetActorNeedsPaint(actor,view),true);
 assert.equal(streetActorNeedsPaint({mobKind:'runner',x:5000},{left:NaN,right:0}),true);
});
test('all four current chapter street renderers consume the same visibility policy',()=>{
 for(const file of ['challenge-depth-render.mjs','preview/chapter2/chapter2-playable.mjs','preview/chapter3/chapter2-playable.mjs','preview/chapter4/chapter4-playable.mjs']){
  const source=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
  assert.match(source,/import \{streetActorNeedsPaint\}/,file);
  assert.ok((source.match(/streetActorNeedsPaint\(/g)||[]).length>=1,file);
 }
});
