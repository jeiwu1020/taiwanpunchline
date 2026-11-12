import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {createMainCampaignBridge,prepareMainContinuation} from '../dist/main-campaign-bridge.mjs';
import {openUnifiedProgress} from '../dist/preview/campaign/unified/progress.mjs';
import {legacy} from './helpers/formal-flow-fixtures.mjs';
import {memoryStorage,serialLocks} from './helpers/formal-flow-fixtures.mjs';
async function setup(chapterId='chapter-2'){
 const storage=memoryStorage({'taiwanpunchline-progress-v1':JSON.stringify(legacy({checkpoint:6,completed:true}))});
 const progress=await openUnifiedProgress({storage,locks:serialLocks()});
 await prepareMainContinuation({progress,characterId:'wang',helperId:'han',confirm:async()=>true});
 while(progress.readProfile().campaign.cursor.chapterId!==chapterId){
  let result=await progress.beginChallenge();
  for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue']){result=await progress.dispatchChallenge(result.token,{type});assert.equal(result.accepted,true,result.reason);}
 }
 const dom=new JSDOM('<main></main>',{url:'https://test.invalid/'}),previous=globalThis.document;globalThis.document=dom.window.document;
 let starts=[],continues=[];
 const ui=mountChallengeUI({progress:createMainCampaignBridge(progress),characters:{wang:{name:'王'},han:{name:'韓'}},onStart:x=>starts.push(x),onContinue:x=>{continues.push(x);return {accepted:true};}});
 ui.open();return {ui,dom,starts,continues,close(){ui.destroy();dom.window.close();globalThis.document=previous;}};
}
for(const [id,label] of [['chapter-2','第 2 章'],['chapter-3','第 3 章'],['chapter-4','第 4 章']])test(`primary challenge action resumes ${id} without replaying chapter one`,async()=>{
 const x=await setup(id);try{const start=x.ui.element.querySelector('[data-action="start"]');assert.match(start.textContent,new RegExp(label));await start.onclick();assert.equal(x.continues.length,1);assert.equal(x.starts.length,0);assert.equal(x.ui.element.querySelector('[data-action="continue"]'),null);}finally{x.close();}
});
test('first chapter replay remains secondary while normal saved continuation is primary',async()=>{const x=await setup();try{const replay=x.ui.element.querySelector('[data-action="replay-first"]');assert.ok(replay);replay.click();assert.equal(x.starts[0].replay,true);assert.equal(x.continues.length,0);}finally{x.close();}});
test('locked fifth chapter cannot start an earlier chapter as the primary continuation',async()=>{const x=await setup('chapter-5');try{const start=x.ui.element.querySelector('[data-action="start"]');assert.equal(start.disabled,true);assert.match(start.textContent,/尚未開放/);}finally{x.close();}});
