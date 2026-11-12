import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignContinuationURL} from '../dist/main-campaign-bridge.mjs';
import {createCampaignHandoff,consumeCampaignHandoff} from '../dist/preview/campaign/navigation.mjs';
import {openChallengeContinuation} from '../dist/preview/campaign/fresh-router.mjs';
import {campaignStorage} from './helpers/campaign-complete-fixture.mjs';
test('saved chapter five and finale resolve through the main continuation and fresh router',async()=>{
 for(const [count,path]of [[4,'chapter5'],[5,'finale']]){
  const f=campaignStorage(count),r=await openChallengeContinuation({...f,mode:'campaign',optIn:true});assert.equal(r.enabled,true);assert.equal(r.view().route.status,'ready');assert.ok(r.view().route.url.includes('/'+path+'/'));
  const p={campaign:{cursor:{chapterId:count===4?'chapter-5':'finale-3v4'}}};assert.ok(campaignContinuationURL({activeProfileId:'slot-1'},p).includes('/'+path+'/'));
 }
});
test('same-tab handoff allows chapter five and finale only on their precise same-origin paths',()=>{
 for(const [chapterId,path]of [['chapter-5','chapter5'],['finale-3v4','finale']]){
  const map=new Map(),w={location:{href:'https://game.example/',origin:'https://game.example'},crypto:{getRandomValues:b=>b.fill(42)},sessionStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
  const view={persisted:true,revision:3,generation:0,chapterId,profileId:'slot-1'};
  assert.equal(createCampaignHandoff({window:w,url:'https://other.example/preview/'+path+'/',view}).accepted,false);
  const sent=createCampaignHandoff({window:w,url:'/preview/'+path+'/',view});assert.equal(sent.accepted,true,sent.reason);w.location.href=sent.url;assert.equal(consumeCampaignHandoff({window:w,chapterId}).accepted,true);
  assert.equal(consumeCampaignHandoff({window:w,chapterId}).accepted,false);
 }
});
