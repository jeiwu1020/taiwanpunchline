import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {itemActorName,ITEM_ART} from '../dist/item-presentation.mjs';
import {shoutCaptionLayout} from '../dist/shout-caption.mjs';
test('item messages identify actors including mirror matches',()=>{const p={type:'wang',id:'player'},e={type:'wang',id:'enemy'},cast={wang:{name:'王'}};assert.equal(itemActorName(p,e,cast),'王（你）');assert.equal(itemActorName(e,p,cast),'王（對手）');assert.equal(itemActorName(p,{type:'other'},cast),'王');});
test('both transparent generated item assets are shipped',()=>{for(const art of Object.values(ITEM_ART)){const png=readFileSync(new URL('../dist/'+art.file,import.meta.url));assert.equal(png.toString('ascii',1,4),'PNG');assert.ok(art.width>=40);}});
test('enemy shout loses AI prefix while player remains identifiable',()=>{assert.ok(!shoutCaptionLayout('測試','enemy').tag.includes('AI'));assert.ok(shoutCaptionLayout('測試','player').tag.startsWith('你'));});
