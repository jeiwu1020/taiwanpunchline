import test from 'node:test';
import assert from 'node:assert/strict';
import {createCampaignPlayable} from '../dist/preview/campaign/playable-bridge.mjs';
import {openUnifiedContinuation} from '../dist/preview/campaign/unified-router.mjs';
import {newDocument,validateDocument,zeroSkills} from '../dist/preview/campaign/core/model.mjs';
import {CHAPTERS,STEPS,FIRST_CLEAR_STEPS,receiptFor} from '../dist/preview/campaign/core/catalog.mjs';
import {CAMPAIGN_KEY,UNIFIED_KEY} from '../dist/preview/campaign/unified/schema.mjs';
import {memoryStorage,memoryLocks} from './helpers/main-unified-fixture.mjs';
const factories=await Promise.all([2,3,4].map(async n=>[n,(await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`)).createPlayableChapter]));
function combat(c){while(c.view().mode==='story')assert.equal(c.nextStory(c.view().token),true);}
function pause(c){assert.equal(c.setPaused(true,c.view().token),true);return c.view().token;}
for(const [n,create] of factories)for(const stepId of ['route-a','route-b','route-c','miniboss-a','miniboss-b','boss'])test(`chapter ${n} paused ${stepId} restarts same encounter and preserves choices`,()=>{
 const c=create({initialStepId:stepId,characterId:'han',helperId:'wang',difficulty:'hard',statsForCharacter:()=>({maxHp:112})});combat(c);
 assert.equal(typeof c.restartSegment,'function');assert.equal(c.restartSegment(c.view().token),false,'active play cannot bypass confirmation pause');
 const oldWorld=c.world;c.world.player.hp=2;c.world.events.push({type:'hit'});c.step(0);
 const token=pause(c),before=c.view();assert.equal(c.restartSegment(token),true);const after=c.view();
 assert.notEqual(c.world,oldWorld);assert.equal(c.world.player.hp,112);assert.equal(after.stepId,stepId);assert.equal(after.mode,stepId.startsWith('route')?'route':'battle');
 for(const key of ['characterId','helperId','difficulty','unlocked'])assert.deepEqual(after[key],before[key]);
 assert.equal(after.paused,false);assert.deepEqual(after.rounds,{player:0,enemy:0});assert.equal(after.result,null);assert.notEqual(after.token,token);assert.deepEqual(c.drainEvents(),[]);assert.equal(c.restartSegment(token),false);
});
for(const [n,create] of factories)test(`chapter ${n} restart resets whole boss score, rejects story/result/choice`,()=>{
 const c=create({initialStepId:'boss'});c.world.status='over';c.world.winner='player';c.step(0);assert.equal(c.view().rounds.player,1);
 assert.equal(typeof c.restartSegment,'function');assert.equal(c.restartSegment(c.view().token),false);c.continueResult(c.view().token);assert.equal(c.restartSegment(pause(c)),true);assert.deepEqual(c.view().rounds,{player:0,enemy:0});
 for(const initialStepId of ['entry','boss-comic','roster-choice']){const s=create({initialStepId});assert.equal(s.restartSegment(s.view().token),false);}
});
async function formal(n=2,stepId='route-a'){
 const document=newDocument(),p=document.profiles[0],chapterId=`chapter-${n}`;p.campaign.chapterClears=CHAPTERS.slice(0,n-1).map(c=>c.id);p.unlockedCharacters.push(...CHAPTERS.slice(0,n-1).map(c=>c.boss));
 p.campaign.receipts=CHAPTERS.slice(0,n-1).flatMap(c=>FIRST_CLEAR_STEPS.map(s=>receiptFor(c.id,s)));
 p.campaign.receipts.push(...FIRST_CLEAR_STEPS.filter(s=>STEPS.indexOf(s)<STEPS.indexOf(stepId)).map(s=>receiptFor(chapterId,s)));
 p.campaign.cursor={chapterId,stepId};p.campaign.xp=400;p.characters.han={xp:400,skills:{...zeroSkills(),hp:2}};p.campaign.selection={characterId:'han',helperId:'wang'};
 assert.equal(validateDocument(document).ok,true);const storage=memoryStorage({[CAMPAIGN_KEY]:JSON.stringify(document)}),locks=memoryLocks();let writes=0;const set=storage.setItem;storage.setItem=(...args)=>{writes++;set(...args);};
 const router=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks});assert.equal(router.enabled,true);
 const create=factories.find(([i])=>i===n)[1],attached=await createCampaignPlayable({router,chapterId,createPlayableChapter:create,options:{difficulty:'hard'}});assert.equal(attached.accepted,true);
 return {c:attached.chapter,router,storage,locks,writes:()=>writes,original:JSON.stringify(document)};
}
for(const n of [2,3,4])test(`formal chapter ${n} restart preserves XP, receipts, skills, helper and other slots`,async()=>{
 const f=await formal(n),{c,storage,router}=f;assert.equal(typeof c.restartSegment,'function');
 c.world.events.push({type:'enemyDefeated',encounterId:'already-paid',xp:20});c.step(0);await c.flush();assert.equal(router.view().xp,420);
 const token=pause(c),before=JSON.parse(storage.getItem(UNIFIED_KEY)),oldWorld=c.world;const result=await c.restartSegment(token);assert.equal(result.accepted,true);assert.equal(result.persisted,true);assert.notEqual(c.world,oldWorld);
 const after=JSON.parse(storage.getItem(UNIFIED_KEY));for(const key of ['xp','cursor','selection','receipts'])assert.deepEqual(after.campaign.profiles[0].campaign[key],before.campaign.profiles[0].campaign[key],key);
 assert.equal(after.campaign.profiles[0].campaign.attemptSerial,before.campaign.profiles[0].campaign.attemptSerial+1);assert.deepEqual(after.campaign.profiles[0].campaign.attempt.paidEnemyIds,[]);assert.deepEqual(after.campaign.profiles[0].characters,before.campaign.profiles[0].characters);assert.deepEqual(after.campaign.profiles.slice(1),before.campaign.profiles.slice(1));assert.equal(storage.getItem(CAMPAIGN_KEY),f.original);
 c.world.events.push({type:'enemyDefeated',encounterId:'already-paid',xp:20});c.step(0);await c.flush();assert.equal(router.view().xp,440,'new encounter attempt rewards the enemy again');assert.equal(c.view().blocked,false);
 assert.equal((await c.restartSegment(token)).accepted,false);
});
test('formal restart refuses unsaved state without changing encounter',async()=>{
 const {c,storage}=await formal();assert.equal(typeof c.restartSegment,'function');const write=storage.setItem;storage.setItem=()=>{throw Error('quota')};c.world.events.push({type:'enemyDefeated',encounterId:'unsaved',xp:20});c.step(0);await c.flush();const world=c.world;assert.equal(c.setPaused(true,c.view().token),false,'pending save blocks new operations');assert.equal((await c.restartSegment(c.view().token)).accepted,false);assert.equal(c.world,world);storage.setItem=write;
});
test('formal restart fails closed when another tab changed the saved slot',async()=>{
 const {c,storage}=await formal();assert.equal(typeof c.restartSegment,'function');const token=pause(c),world=c.world,other=JSON.parse(storage.getItem(UNIFIED_KEY));other.revision++;other.campaign.revision++;other.campaign.profiles[0].campaign.revision++;other.campaign.profiles[0].campaign.selection.helperId='han';storage.setItem(UNIFIED_KEY,JSON.stringify(other));
 const r=await c.restartSegment(token);assert.equal(r.accepted,false);assert.equal(c.view().blocked,true);assert.equal(c.world,world);assert.equal(c.view().paused,true);
});
test('formal restart handles save failure without unpausing and can recover',async()=>{
 const {c,storage}=await formal();assert.equal(typeof c.restartSegment,'function');const token=pause(c),world=c.world,write=storage.setItem;storage.setItem=()=>{throw Error('quota')};
 assert.equal((await c.restartSegment(token)).persisted,false);assert.equal(c.world,world);assert.equal(c.view().paused,true);assert.equal(c.view().persisted,false);storage.setItem=write;assert.equal((await c.retrySave()).persisted,true);assert.notEqual(c.world,world);assert.equal(c.view().paused,false);const restored=c.world;assert.equal((await c.retrySave()).accepted,false);assert.equal(c.world,restored);
});
test('formal restart serializes confirmation, rejects concurrent actions and stale local tokens',async()=>{
 const {c,router}=await formal();assert.equal(typeof c.restartSegment,'function');const token=pause(c),prepare=router.prepareEncounter;let release;const gate=new Promise(resolve=>{release=resolve;});router.prepareEncounter=async(...args)=>{await gate;return prepare(...args);};
 const pending=c.restartSegment(token);assert.equal(c.view().busy,true);assert.equal((await c.restartSegment(token)).accepted,false);assert.equal(c.setPaused(false,token),false);release();assert.equal((await pending).accepted,true);assert.equal((await c.restartSegment(token)).accepted,false);
});
for(const n of [2,3,4])for(const stepId of ['route-b','route-c','miniboss-a','miniboss-b','boss'])test(`formal chapter ${n} ${stepId} restarts without checkpoint movement`,async()=>{
 const {c,router,storage}=await formal(n,stepId);combat(c);await c.flush();
 if(stepId==='boss'){c.world.status='over';c.world.winner='player';c.step(0);await c.flush();c.continueResult(c.view().token);assert.equal(c.view().rounds.player,1);}
 const token=pause(c),saved=JSON.parse(storage.getItem(UNIFIED_KEY)),before=router.view(),result=await c.restartSegment(token);
 assert.equal(result.accepted,true);assert.equal(result.persisted,true);assert.equal(c.view().stepId,stepId);assert.equal(c.view().mode,stepId.startsWith('route')?'route':'battle');assert.equal(c.view().paused,false);assert.deepEqual(c.view().rounds,{player:0,enemy:0});
 assert.equal(router.view().chapterId,before.chapterId);assert.equal(router.view().stepId,before.stepId);assert.equal(router.view().xp,before.xp);
 const after=JSON.parse(storage.getItem(UNIFIED_KEY));assert.deepEqual(after.campaign.profiles[0].characters,saved.campaign.profiles[0].characters);assert.deepEqual(after.campaign.profiles[0].campaign.receipts,saved.campaign.profiles[0].campaign.receipts);
});
test('formal restart detects a newer same-checkpoint revision, even if choices are unchanged',async()=>{
 const {c,storage}=await formal(),token=pause(c),world=c.world,other=JSON.parse(storage.getItem(UNIFIED_KEY));other.revision++;other.campaign.revision++;other.campaign.profiles[0].campaign.revision++;storage.setItem(UNIFIED_KEY,JSON.stringify(other));
 const r=await c.restartSegment(token);assert.equal(r.accepted,false);assert.equal(r.reason,'stale-revision');assert.equal(c.world,world);assert.equal(c.view().paused,true);
});

test('stale restart is read-only and leaves the newer tab run able to award a mob',async()=>{
 const {c,storage,locks,writes}=await formal(),token=pause(c);
 const other=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks});
 const b=await other.begin('chapter-2');assert.equal(b.accepted,true);
 const raw=storage.getItem(UNIFIED_KEY),count=writes();
 const rejected=await c.restartSegment(token);assert.equal(rejected.accepted,false);assert.equal(rejected.reason,'stale-revision');
 assert.equal(storage.getItem(UNIFIED_KEY),raw,'rejected restart cannot rewrite newer state');assert.equal(writes(),count);
 const paid=await other.dispatch(b.token,{type:'mob-defeated',enemyId:'newer-tab-enemy',xp:20});assert.equal(paid.accepted,true);assert.equal(paid.persisted,true);assert.equal(other.view().xp,420);
});
test('revision precondition is checked after waiting for the authority lock',async()=>{
 const {c,storage,locks}=await formal(),token=pause(c),other=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks});
 const originalRequest=locks.request;let entered,release;const held=new Promise(r=>{entered=r}),gate=new Promise(r=>{release=r});let blockOnce=true;
 locks.request=(name,options,fn)=>originalRequest(name,options,async()=>{if(blockOnce){blockOnce=false;entered();await gate;}return fn();});
 const bPending=other.begin('chapter-2');await held;const aPending=c.restartSegment(token);release();const b=await bPending;assert.equal(b.accepted,true);
 const raw=storage.getItem(UNIFIED_KEY);const a=await aPending;assert.equal(a.accepted,false);assert.equal(a.reason,'stale-revision');assert.equal(storage.getItem(UNIFIED_KEY),raw);
 assert.equal((await other.dispatch(b.token,{type:'mob-defeated',enemyId:'after-lock-race',xp:20})).accepted,true);
});
test('router begin retains initial optional behavior and enforces explicit expected revision',async()=>{
 const {router,storage}=await formal(),current=router.view().revision,raw=storage.getItem(UNIFIED_KEY);
 assert.equal((await router.begin('chapter-2',{expectedRevision:current-1})).accepted,false);assert.equal(storage.getItem(UNIFIED_KEY),raw);
 const accepted=await router.begin('chapter-2',{expectedRevision:current});assert.equal(accepted.accepted,true);assert.equal(router.view().revision,current+1);
 assert.equal((await router.begin('chapter-2')).accepted,true);
});
test('router explicit revision cannot override an unconsumed handoff revision',async()=>{
 const {router,storage,locks}=await formal(),revision=router.view().revision;
 const handoff={profileId:'slot-1',chapterId:'chapter-2',revision};
 const target=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks,profileId:'slot-1',handoff});assert.equal(target.enabled,true);
 const raw=storage.getItem(UNIFIED_KEY);assert.equal((await target.begin('chapter-2',{expectedRevision:revision+1})).reason,'stale-revision');assert.equal(storage.getItem(UNIFIED_KEY),raw);
 assert.equal((await router.begin('chapter-2')).accepted,true);const newerRaw=storage.getItem(UNIFIED_KEY);
 assert.equal((await target.begin('chapter-2')).reason,'stale-revision');assert.equal(storage.getItem(UNIFIED_KEY),newerRaw);
});
test('matching handoff revision still starts and is consumed after accepted begin',async()=>{
 const {router,storage,locks}=await formal(),revision=router.view().revision;
 const target=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks,profileId:'slot-1',handoff:{profileId:'slot-1',chapterId:'chapter-2',revision}});
 assert.equal((await target.begin('chapter-2',{expectedRevision:revision})).accepted,true);assert.equal((await target.begin('chapter-2')).accepted,true);
});
