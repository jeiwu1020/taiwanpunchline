import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeVersionIssues} from '../build/normalize-runtime-versions.mjs';
test('all existing local runtime JS/CSS references share one cache identity',()=>{
 assert.deepEqual(runtimeVersionIssues(),[],'A shared module must not be instantiated under multiple version URLs');
});
