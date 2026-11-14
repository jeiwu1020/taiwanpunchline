import assert from 'node:assert/strict';
import {newDocument} from '../../dist/preview/campaign/core/model.mjs';
import {startRun,applyRunAction} from '../../dist/preview/campaign/core/transition.mjs';
import {newEnvelope,CHALLENGE_KEY} from '../../dist/preview/campaign/fresh/schema.mjs';
import {memoryStorage,memoryLocks} from './main-unified-fixture.mjs';
export function campaignThrough(count=5){
 let document=newDocument();
 for(let i=0;i<count;i++){
  let r=startRun(document);assert.equal(r.ok,true,r.reason);
  for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){
   r=applyRunAction(r.document,r.run,{type});assert.equal(r.ok,true,`${i+1}:${type}:${r.reason}`);
  }document=r.document;
 }return document;
}
export function campaignStorage(count=5){const e=newEnvelope();e.campaign=campaignThrough(count);return {storage:memoryStorage({[CHALLENGE_KEY]:JSON.stringify(e)}),locks:memoryLocks()};}
