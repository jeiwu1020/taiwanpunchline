import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {openChallengeContinuation} from '../dist/preview/campaign/fresh-router.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {createCampaignHandoff,consumeCampaignHandoff} from '../dist/preview/campaign/navigation.mjs';
import {freshCampaignAt} from './helpers/formal-flow-fixtures.mjs';
for(const change of ['reset','allocate'])test(`formal begin rejects a ${change} after handoff validation without rewriting the newer save`,async()=>{
 const {api,storage,locks}=await freshCampaignAt(),d=new JSDOM('',{url:'https://handoff.test/'}),view={...api.get(),chapterId:'chapter-2'},ticket=createCampaignHandoff({window:d.window,url:'/preview/chapter2/',view});
 d.reconfigure({url:ticket.url});const {handoff}=consumeCampaignHandoff({window:d.window,chapterId:'chapter-2'});assert.equal(handoff.generation,view.generation);
 const router=await openChallengeContinuation({storage,locks,mode:'campaign',optIn:true,profileId:'slot-1',handoff});assert.equal(router.enabled,true);
 const newer=await openChallengeProgress({storage,locks});const updated=change==='reset'?await newer.resetProfile('slot-1',newer.preparationSnapshot()):await newer.allocate('wang','hp');assert.equal(updated.persisted,true);
 const before=storage.getItem('taiwanpunchline-challenge-v4'),writes=storage.writes;const result=await router.begin('chapter-2');assert.equal(result.accepted,false);assert.equal(result.reason,change==='reset'?'stale-generation':'stale-revision');assert.equal(storage.getItem('taiwanpunchline-challenge-v4'),before);assert.equal(storage.writes,writes);d.window.close();
});
for(const generation of [-1,1.5,Number.MAX_SAFE_INTEGER+1])test(`malformed handoff generation ${generation} never creates a ticket`,()=>{
 const d=new JSDOM('',{url:'https://handoff.test/'});const result=createCampaignHandoff({window:d.window,url:'/preview/chapter2/',view:{profileId:'slot-1',chapterId:'chapter-2',persisted:true,revision:1,generation}});assert.equal(result.accepted,false);assert.equal(d.window.sessionStorage.length,0);d.window.close();
});
