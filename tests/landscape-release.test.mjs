import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
test('landscape release invalidates every changed entrypoint and camera import',()=>{
 const parents={'index.html':['game.mjs','combat-presentation-v75.css'],'game.mjs':['combat-overlay-layout.mjs','challenge-render.mjs','game-viewport.mjs'],'challenge-render.mjs':['challenge-depth-render.mjs'],'combat-overlay-layout.mjs':['challenge-depth-render.mjs'],'game-viewport.mjs':['viewport-lifecycle.mjs'],'viewport-lifecycle.mjs':['viewport-core.js']};
 for(const [parent,children] of Object.entries(parents))for(const child of children){
  const imports=[...text(parent).matchAll(new RegExp(child.replaceAll('.','\\.')+'\\?v=([^\\s\'\"<>]+)','g'))];
  assert.ok(imports.length,`${parent} loads ${child}`);
  const expected=RUNTIME_VERSION;
  for(const match of imports)assert.equal(match[1],expected,`${parent}: ${child}`);
 }
});
test('release entrypoints do not include preview adapters or memory storage substitution',()=>{
 for(const file of ['index.html','game.mjs'])assert.doesNotMatch(text(file),/__landscapeQA|__qaStorage|previewFrozen|previewStep|Local preview adapter/);
});
