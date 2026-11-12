import test from 'node:test';
import assert from 'node:assert/strict';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {memoryStorage,memoryLocks} from './helpers/main-unified-fixture.mjs';
import {newEnvelope} from '../dist/preview/campaign/fresh/schema.mjs';
const KEY='taiwanpunchline-challenge-v4';
test('preview preparation uses validated in-memory builds and preserves boundary resources',async()=>{
 const envelope=newEnvelope();envelope.campaign.profiles[0].campaign.xp=160;const storage=memoryStorage({[KEY]:JSON.stringify(envelope)}),before=storage.getItem(KEY),progress=await openChallengeProgress({storage,locks:memoryLocks()});progress.enterTestMode();
 const session=await AsyncChallengeSession.create({progress,characterId:'han'});session.carry={hp:80,rally:41,assist:{helper:'han',used:true,active:false,charge:21,damageTaken:35}};
 const draft=session.preparationSnapshot();draft.characterId='ma';draft.helperId='wang';draft.characters.ma={skills:{hp:1,move:0,basic:0,defense:0,special:0,rally:0,assist:0}};
 const r=await session.prepareEncounter(draft,{...draft,intent:'boundary'});assert.equal(r.preview,true);assert.equal(session.characterId,'ma');assert.ok(Math.abs(progress.getChallengeStats('ma').maxHp-97.85)<1e-9);assert.equal(session.carry.hp,80);assert.equal(session.carry.rally,41);assert.equal(session.carry.assist.helper,'wang');assert.ok(Math.abs(session.carry.assist.damageTaken-35*97.85/105)<1e-9);assert.equal(storage.getItem(KEY),before);
 const stale=session.preparationSnapshot();progress.exitTestMode();progress.enterTestMode();const rejected=await session.prepareEncounter(stale,{...stale,intent:'retry'});assert.equal(rejected.accepted,false);assert.equal(session.characterId,'ma');assert.equal(storage.getItem(KEY),before);
});
async function fixture(){const storage=memoryStorage(),locks=memoryLocks(),progress=await openChallengeProgress({storage,locks});return {storage,locks,progress};}

test('fresh first-chapter session saves one opening/route transition and no legacy namespace',async()=>{
 const {storage,progress}=await fixture();assert.equal(progress.readProfile().campaign.story.opening,'unseen');const draft=progress.preparationSnapshot(),write=storage.setItem;let writes=0;storage.setItem=(...a)=>{writes++;write(...a);};const session=await AsyncChallengeSession.create({progress,preparation:draft,preparationOptions:{...draft,intent:'start'}});assert.equal(session.startResult.accepted,true);assert.equal(session.startResult.persisted,true);assert.equal(session.run.stepId,'route-a');assert.equal(progress.readProfile().campaign.story.opening,'seen');assert.equal(writes,1);assert.deepEqual([...storage.entries.keys()],[KEY]);assert.equal(session.context.generation,0);
});
test('first-chapter quota failure leaves old phase and late events cannot advance it before retry',async()=>{
 const {storage,progress}=await fixture(),session=await AsyncChallengeSession.create({progress}),write=storage.setItem;storage.setItem=()=>{throw Error('quota');};const r=await session.routeComplete({hp:37,rally:41,assist:{helper:'han',used:true,active:false,charge:21,damageTaken:7}});assert.equal(r.accepted,true);assert.equal(r.persisted,false);assert.equal(session.checkpoint,0);assert.equal(session.savePending,true);assert.equal((await session.rewardMob({encounterId:'late-old-scene',xp:8})).accepted,false);storage.setItem=write;assert.equal((await session.retrySave()).persisted,true);assert.equal(session.checkpoint,1);assert.equal(session.carry.hp,37);const revision=progress.get().revision;await session.retrySave();assert.equal(progress.get().revision,revision);
});
test('fresh session resumes street carry after reload and retry resets only the attempt resources',async()=>{
 const {storage,locks,progress}=await fixture(),session=await AsyncChallengeSession.create({progress});await session.routeComplete({hp:62});await session.bossWon({hp:37,rally:41,assist:{helper:'han',used:true,active:false,charge:21,damageTaken:7}});const before=session.attemptId,other=await openChallengeProgress({storage,locks}),resumed=await AsyncChallengeSession.create({progress:other});assert.equal(resumed.checkpoint,2);assert.ok(resumed.attemptId>before);assert.equal(resumed.carry.hp,37);assert.equal(resumed.carry.rally,41);assert.equal(resumed.carry.assist.charge,21);assert.equal((await resumed.retry()).persisted,true);assert.equal(resumed.carry,null);assert.equal((await resumed.rewardMob({encounterId:'mob',xp:8})).persisted,true);const xp=other.readProfile().campaign.xp;await resumed.retry();await resumed.rewardMob({encounterId:'mob',xp:8});assert.equal(other.readProfile().campaign.xp,xp+8);
});
test('fresh session boundary preparation preserves carried resources and encounter identity',async()=>{
 const {progress}=await fixture(),session=await AsyncChallengeSession.create({progress});await session.routeComplete({hp:62});await session.bossWon({hp:37,rally:41,assist:{helper:'han',used:true,active:false,charge:21,damageTaken:7}});const g=session.preparationSnapshot(),attempt=session.attemptId,r=await session.prepareEncounter({...g,characterId:'han',helperId:'wang'},{...g,intent:'boundary'});assert.equal(r.persisted,true);assert.equal(session.attemptId,attempt);assert.equal(session.carry?.hp,37);assert.equal(session.carry.assist.charge,21);assert.equal(session.carry.assist.helper,'wang');assert.equal(session.characterId,'han');
});
test('reset and slot restore reject the original first-chapter actor after generation changes',async()=>{
 const {storage,locks,progress}=await fixture(),session=await AsyncChallengeSession.create({progress});await session.rewardMob({encounterId:'before-reset',xp:8});const backup=progress.exportSlotBackup('slot-1'),other=await openChallengeProgress({storage,locks});await other.resetProfile('slot-1',other.preparationSnapshot());const raw=storage.getItem(KEY);assert.equal((await session.routeComplete({hp:25})).accepted,false);assert.equal(storage.getItem(KEY),raw);const g=other.preparationSnapshot();assert.equal((await other.importSlotBackup(backup,g)).persisted,true);assert.equal(other.get().generation,2);assert.equal(other.readProfile().campaign.xp,8);assert.equal((await session.rewardMob({encounterId:'stale-after-restore',xp:8})).accepted,false);
});
test('preview first-chapter session never initializes or changes any formal save',async()=>{
 const {storage,progress}=await fixture();progress.enterTestMode();const session=await AsyncChallengeSession.create({progress});await session.rewardMob({encounterId:'preview',xp:400});await session.routeComplete({hp:80});await session.bossWon({hp:60});assert.equal(storage.entries.size,0);assert.equal(progress.readProfile().campaign.xp,0);assert.equal(progress.get().initialized,false);progress.exitTestMode();assert.equal(progress.readProfile().campaign.story.opening,'unseen');
});

test('one first-chapter frame batches two mob XP awards and gate in one recoverable write',async()=>{
 const {storage,progress}=await fixture(),session=await AsyncChallengeSession.create({progress}),before=storage.getItem(KEY),write=storage.setItem;let writes=0;storage.setItem=()=>{writes++;throw Error('quota');};
 const events=[{type:'enemyDefeated',encounterId:'first',xp:8},{type:'enemyDefeated',encounterId:'second',xp:8},{type:'routeGate',carry:{hp:37,rally:41,assist:{helper:'han',used:true,charge:21,damageTaken:7}}}];
 const r=await session.routeEvents(events);assert.equal(r.accepted,true);assert.equal(r.persisted,false);assert.equal(writes,1);assert.equal(session.checkpoint,0);assert.equal(storage.getItem(KEY),before);assert.equal((await session.routeEvents([{type:'enemyDefeated',encounterId:'late',xp:8}])).accepted,false);
 storage.setItem=write;assert.equal((await session.retrySave()).persisted,true);assert.equal(session.checkpoint,1);assert.equal(session.carry.hp,37);assert.equal(progress.readProfile().campaign.xp,41);
});
