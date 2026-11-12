import test from 'node:test';
import assert from 'node:assert/strict';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {openChallengeContinuation} from '../dist/preview/campaign/fresh-router.mjs';
import {createCampaignPlayable} from '../dist/preview/campaign/playable-bridge.mjs';
import {freshCampaignAt} from './helpers/formal-flow-fixtures.mjs';
import {CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
const factories=await Promise.all([2,3,4].map(async n=>[n,(await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`)).createPlayableChapter]));
async function atRoute(n,create){
 const f=await freshCampaignAt({chapterId:`chapter-${n}`});
 const router=await openChallengeContinuation({...f,mode:'campaign',optIn:true,profileId:'slot-1'});
 const attached=await createCampaignPlayable({router,chapterId:`chapter-${n}`,createPlayableChapter:create});
 assert.equal(attached.accepted,true,attached.reason);const c=attached.chapter;
 while(c.view().mode==='story'){c.nextStory(c.view().token);await c.flush();}
 return {...f,router,c};
}
function emitFrame(c){const world=c.world;world.step=()=>{};world.status='gate';world.drainEvents=()=>[{type:'enemyDefeated',encounterId:'review-a',xp:8},{type:'enemyDefeated',encounterId:'review-b',xp:9}];c.step(0);return world;}
for(const [n,create] of factories){
 test(`review: chapter ${n} exact readback failure freezes one atomic frame and retry never writes it twice`,async()=>{
  const f=await atRoute(n,create),{c,storage}=f,before=f.router.view(),get=storage.getItem.bind(storage),set=storage.setItem.bind(storage);let pendingRead=false,writes=0;
  storage.setItem=(key,value)=>{set(key,value);if(key===CHALLENGE_KEY){writes++;pendingRead=true;}};
  storage.getItem=key=>{if(key===CHALLENGE_KEY&&pendingRead){pendingRead=false;throw Error('one unavailable readback');}return get(key);};
  const world=emitFrame(c),token=c.view().token;await c.flush();
  assert.equal(c.world,world);assert.equal(c.view().token,token);assert.equal(c.view().mode,'route');assert.equal(c.view().persisted,false);assert.equal(c.view().busy,false);assert.equal(c.view().saveIssue,'readback-unavailable');assert.equal(writes,1);
  c.step(1);assert.equal(c.world,world);assert.equal(c.view().mode,'route');assert.equal(writes,1);
  storage.getItem=get;const recovered=await c.retrySave();assert.equal(recovered.accepted,true);assert.equal(recovered.persisted,true);assert.equal(c.view().stepId,'miniboss-a');assert.equal(writes,1,'verified already-written bytes are adopted without rewrite');
  const after=JSON.parse(storage.getItem(CHALLENGE_KEY));assert.equal(after.revision,before.revision+1);assert.equal(after.campaign.profiles[0].campaign.xp,before.xp+42);
  await c.retrySave();assert.equal(writes,1);assert.equal(JSON.parse(storage.getItem(CHALLENGE_KEY)).revision,after.revision);
 });
 test(`review: chapter ${n} pending frame cannot overwrite a reset generation or apply its old scene`,async()=>{
  const {c,storage,locks}=await atRoute(n,create),before=storage.getItem(CHALLENGE_KEY);storage.failWrites=true;const world=emitFrame(c);await c.flush();assert.equal(storage.getItem(CHALLENGE_KEY),before);assert.equal(c.view().mode,'route');
  storage.failWrites=false;const newer=await openChallengeProgress({storage,locks}),reset=await newer.resetProfile('slot-1',newer.preparationSnapshot());assert.equal(reset.persisted,true);const raw=storage.getItem(CHALLENGE_KEY),writes=storage.writes;
  const retry=await c.retrySave();assert.equal(retry.accepted,false);assert.equal(retry.reason,'save-conflict');assert.equal(c.view().blocked,true);assert.equal(c.world,world);assert.equal(c.view().mode,'route');assert.equal(storage.getItem(CHALLENGE_KEY),raw);assert.equal(storage.writes,writes);assert.equal(newer.get().generation,1);
 });
}
