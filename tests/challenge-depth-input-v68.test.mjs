import test from 'node:test';import assert from 'node:assert/strict';
let action;try{({challengeKeyAction:action}=await import('../dist/challenge-mode-input.mjs'));}catch{}
const keys={ArrowUp:'jump',KeyW:'jump',ArrowDown:'crouch',KeyS:'crouch',Space:'jump',KeyJ:'punch',KeyA:'left'};
test('depth route remaps only vertical directions while keeping explicit Space jump',()=>{assert.equal(typeof action,'function');for(const k of ['ArrowUp','KeyW'])assert.equal(action(k,keys,true),'up');for(const k of ['ArrowDown','KeyS'])assert.equal(action(k,keys,true),'down');assert.equal(action('Space',keys,true),'jump');assert.equal(action('KeyJ',keys,true),'punch');});
test('duel keeps original up jump and down crouch',()=>{assert.equal(typeof action,'function');for(const [k,a] of Object.entries(keys))assert.equal(action(k,keys,false),a);assert.equal(action('Backspace',keys,false),undefined);});
