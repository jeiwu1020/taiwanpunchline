import test from 'node:test';import assert from 'node:assert/strict';
import {storyComposition} from '../dist/challenge-story-art.mjs';
test('portrait story actors occupy at least half frame height without cutting head or feet',()=>{
 for(const phase of [0,1,2,3,4,5]){const f=storyComposition(720,680,phase);assert.ok(f.scale*280>=340);assert.ok(f.foot-280*f.scale>=40);assert.ok(f.foot<=660);}
});
test('landscape face-off keeps both actors inside separate comic halves',()=>{const f=storyComposition(960,540,3);assert.ok(f.leftX>100&&f.leftX<420);assert.ok(f.rightX>540&&f.rightX<860);assert.ok(f.foot-280*f.scale>=30);});
