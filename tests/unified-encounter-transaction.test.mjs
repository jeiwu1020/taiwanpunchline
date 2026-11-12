import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterBaseStats} from '../dist/fighter-attributes.mjs';
import {openUnifiedProgress} from '../dist/preview/campaign/unified/progress.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {newProfileDocument} from '../dist/profile-progress.mjs';
import {newDocument,zeroSkills} from '../dist/preview/campaign/core/model.mjs';
import {UNIFIED_KEY,LEGACY_KEY,CAMPAIGN_KEY} from '../dist/preview/campaign/unified/schema.mjs';
import {memoryStorage,memoryLocks} from './helpers/main-unified-fixture.mjs';
async function fixture(legacy=false){
 const d=legacy?newProfileDocument():newDocument(),p=d.profiles[0];
 if(legacy)p.challenge={version:1,xp:160,checkpoint:0,completed:false,rewards:[],attemptSerial:0,routeAttempt:null};else{p.campaign.xp=160;p.campaign.cursor.stepId='route-a';}
 const storage=memoryStorage({[legacy?LEGACY_KEY:CAMPAIGN_KEY]:JSON.stringify(d)}),locks=memoryLocks(),api=await openUnifiedProgress({storage,locks});
 if(!legacy){const i=api.inspectAdoption();assert.equal((await api.adoptProfile('slot-1',{source:'campaign',expectedRevision:i.revision,evidence:i.evidence})).persisted,true);}
 return {api,storage,locks};
}
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} preparation commits both independent builds, party, difficulty and fresh attempt in one write`,async()=>{
 const {api,storage}=await fixture(legacy),run=await AsyncChallengeSession.create({progress:api});
 assert.equal(typeof run.preparationSnapshot,'function');const before=run.preparationSnapshot(),raw=[...storage.entries],attempt=run.attemptId;
 const draft={...before,characterId:'han',helperId:'wang',difficulty:'hard',characters:{wang:{skills:{...zeroSkills(),hp:2}},han:{skills:{...zeroSkills(),move:2}}}};
 assert.deepEqual([...storage.entries],raw,'draft cannot write');let writes=0;const write=storage.setItem;storage.setItem=(...a)=>{writes++;write(...a);};
 const result=await run.prepareEncounter(draft,before);assert.equal(result.persisted,true,result.reason);assert.equal(writes,1);assert.equal(run.characterId,'han');assert.equal(run.difficulty,'hard');assert.ok(run.attemptId>attempt);
 assert.equal(api.readProfile().characters.wang.skills.hp,2);assert.equal(api.readProfile().characters.han.skills.move,2);
 const reloaded=await openUnifiedProgress({storage,locks:memoryLocks()}),resumed=await AsyncChallengeSession.create({progress:reloaded});assert.equal(resumed.characterId,'han');assert.equal(resumed.difficulty,'hard');assert.ok(resumed.attemptId>run.attemptId);
});
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} failed preparation retains old session and retrySave applies pending once`,async()=>{
 const {api,storage}=await fixture(legacy),run=await AsyncChallengeSession.create({progress:api}),before=run.preparationSnapshot?.();assert.ok(before);
 const oldAttempt=run.attemptId,oldCharacter=run.characterId,write=storage.setItem;storage.setItem=()=>{throw Error('quota')};
 const failed=await run.prepareEncounter({...before,characterId:'han',helperId:'wang',difficulty:'hard'},before);assert.equal(failed.persisted,false);assert.equal(run.characterId,oldCharacter);assert.equal(run.attemptId,oldAttempt);
 storage.setItem=write;assert.equal((await run.retrySave()).persisted,true);assert.equal(run.characterId,'han');assert.ok(run.attemptId>oldAttempt);const attempt=run.attemptId;await run.retrySave();assert.equal(run.attemptId,attempt);
});
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} stale preparation cannot overwrite newer build or steal newer run`,async()=>{
 const {api,storage,locks}=await fixture(legacy),old=await AsyncChallengeSession.create({progress:api}),draft=old.preparationSnapshot?.();assert.ok(draft);
 const other=await openUnifiedProgress({storage,locks}),newer=await AsyncChallengeSession.create({progress:other}),fresh=newer.preparationSnapshot();assert.equal((await newer.prepareEncounter({...fresh,difficulty:'hard'},fresh)).persisted,true);
 const raw=[...storage.entries];const stale=await old.prepareEncounter({...draft,helperId:'wang'},draft);assert.equal(stale.accepted,false);assert.deepEqual([...storage.entries],raw);assert.equal((await newer.rewardMob({encounterId:'still-owned',xp:8})).persisted,true);
});
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} carry survives reload with fresh XP attempt and failed phase save does not advance session`,async()=>{
 const {api,storage,locks}=await fixture(legacy),run=await AsyncChallengeSession.create({progress:api}),write=storage.setItem;
 storage.setItem=()=>{throw Error('quota')};const carry={hp:37,rally:48,assist:{helper:'han',used:true,active:false,charge:19,damageTaken:8}};
 assert.equal((await run.routeComplete(carry)).persisted,false);assert.equal(run.checkpoint,0);storage.setItem=write;assert.equal((await run.retrySave()).persisted,true);assert.equal(run.checkpoint,1);assert.equal(run.carry.hp,37);
 const other=await openUnifiedProgress({storage,locks}),resume=await AsyncChallengeSession.create({progress:other});assert.equal(resume.carry.hp,37);assert.equal(resume.carry.rally,48);assert.equal(resume.carry.assist.charge,19);
});
const {createCampaignPlayable}=await import('../dist/preview/campaign/playable-bridge.mjs');
const {openUnifiedContinuation}=await import('../dist/preview/campaign/unified-router.mjs');
const {createPlayableChapter}=await import('../dist/preview/chapter2/chapter2-controller.mjs');
const {FIRST_CLEAR_STEPS,receiptFor}=await import('../dist/preview/campaign/core/catalog.mjs');
async function playable(stepId='route-a'){
 const d=newDocument(),p=d.profiles[0];p.campaign.xp=160;p.campaign.chapterClears=['chapter-1'];p.unlockedCharacters.push('huang');p.campaign.receipts=FIRST_CLEAR_STEPS.map(s=>receiptFor('chapter-1',s));p.campaign.cursor={chapterId:'chapter-2',stepId};
 if(stepId==='boss')p.campaign.receipts.push(...FIRST_CLEAR_STEPS.filter(s=>s!=='boss').map(s=>receiptFor('chapter-2',s)));
 const storage=memoryStorage({[CAMPAIGN_KEY]:JSON.stringify(d)}),locks=memoryLocks(),router=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks});const r=await createCampaignPlayable({router,chapterId:'chapter-2',createPlayableChapter});assert.equal(r.accepted,true,r.reason);return {chapter:r.chapter,router,storage,locks};
}
test('playable failed gate write keeps old route scene then commits gate once on retry',async()=>{
 const {chapter:c,storage,router}=await playable(),world=c.world,write=storage.setItem;world.player.hp=37;world.status='gate';storage.setItem=()=>{throw Error('quota')};c.step(0);await c.flush();
 assert.equal(c.view().stepId,'route-a');assert.equal(c.world,world);assert.equal(c.view().persisted,false);assert.equal(c.nextStory(c.view().token),false);
 storage.setItem=write;assert.equal((await c.retrySave()).persisted,true);assert.equal(c.view().stepId,'miniboss-a');const revision=router.view().revision;await c.retrySave();assert.equal(router.view().revision,revision);
 while(c.view().mode==='story')c.nextStory(c.view().token);await c.flush();assert.equal(c.world.player.hp,c.world.player.maxHp);assert.equal(c.world.player.assist.charge,100);assert.equal(c.world.player.rally,0);
});
test('playable preparation failure freezes old boss score and retry applies full BO3 restart once',async()=>{
 const {chapter:c,storage,router}=await playable('boss');c.world.status='over';c.world.winner='player';c.step(0);await c.flush();c.continueResult(c.view().token);await c.flush();assert.equal(c.view().rounds.player,1);c.setPaused(true,c.view().token);
 assert.equal(typeof c.preparationSnapshot,'function');const draft=c.preparationSnapshot(),world=c.world,write=storage.setItem,raw=[...storage.entries];let writes=0;storage.setItem=()=>{writes++;throw Error('quota')};
 const next={...draft,characterId:'han',helperId:'wang',difficulty:'hard'};
 // An omitted intent is rejected before persistence. Its persisted flag refers
 // to the unchanged existing save, not success of the requested mutation.
 const missingIntent=await c.prepareEncounter(next,draft);assert.equal(missingIntent.accepted,false);assert.equal(missingIntent.reason,'explicit-intent-required');assert.equal(writes,0);assert.deepEqual([...storage.entries],raw);assert.equal(c.world,world);assert.equal(c.view().rounds.player,1);
 world.player.hp=37;world.player.rally=41;world.player.assist.used=true;world.player.assist.charge=12;
 const r=await c.prepareEncounter(next,{...draft,intent:'retry'});assert.equal(r.accepted,true);assert.equal(r.persisted,false);assert.equal(writes,1);assert.deepEqual([...storage.entries],raw);assert.equal(c.world,world);assert.equal(c.view().rounds.player,1);assert.equal(world.player.hp,37);assert.equal(world.player.rally,41);assert.equal(world.player.assist.charge,12);
 storage.setItem=(...args)=>{writes++;return write(...args);};assert.equal((await c.retrySave()).persisted,true);assert.equal(writes,2);assert.notEqual(c.world,world);assert.deepEqual(c.view().rounds,{player:0,enemy:0});assert.equal(c.view().characterId,'han');assert.equal(c.view().difficulty,'hard');assert.equal(router.view().selection.characterId,'han');assert.equal(c.world.player.hp,fighterBaseStats('han').maxHp);assert.equal(c.world.player.hp,105);assert.equal(c.world.player.rally,0);assert.equal(c.world.player.assist.charge,100);
 const restarted=c.world,revision=router.view().revision;await c.retrySave();assert.equal(c.world,restarted);assert.equal(router.view().revision,revision);assert.equal(writes,2,'a second recovery must not replay the mutation or restart BO3 again');assert.deepEqual(c.view().rounds,{player:0,enemy:0});
});
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} same-enemy XP pays again only after actual retry and first clear remains once`,async()=>{
 const {api}=await fixture(legacy),run=await AsyncChallengeSession.create({progress:api});assert.equal((await run.rewardMob({encounterId:'mob',xp:8})).persisted,true);const first=run.attemptId;
 assert.equal((await run.rewardMob({encounterId:'mob',xp:8})).accepted,false);assert.equal((await run.retry()).persisted,true);assert.ok(run.attemptId>first);assert.equal((await run.rewardMob({encounterId:'mob',xp:8})).persisted,true);
 assert.equal((await run.routeComplete({hp:45,rally:29,assist:{helper:'han',charge:20}})).persisted,true);const c=api.readProfile().campaign??api.readProfile().challenge;assert.equal(c.xp,201);
});
test('a failed initial playable begin never creates a playable scene',async()=>{
 const {router,storage}=await playable(),write=storage.setItem;storage.setItem=()=>{throw Error('quota')};let created=false;const r=await createCampaignPlayable({router,chapterId:'chapter-2',createPlayableChapter(o){created=true;return createPlayableChapter(o);}});assert.equal(r.accepted,false);assert.equal(r.persisted,false);assert.equal(created,false);assert.equal(r.recovery,router);storage.setItem=write;assert.equal((await r.recovery.retrySave()).persisted,true);
});
test('a zero-HP checkpoint cannot trap the next route after reload',async()=>{
 const {api,storage,locks}=await fixture();const run=await AsyncChallengeSession.create({progress:api});await run.routeComplete({hp:0});await run.bossWon({hp:0});const other=await openUnifiedProgress({storage,locks}),resume=await AsyncChallengeSession.create({progress:other});assert.equal(resume.checkpoint,2);assert.equal(resume.carry,null);
});
for(const n of [2,3,4])test(`chapter ${n} resources reset for every miniboss and final boss round, carry into street`,async()=>{
 const {createPlayableChapter:create}=await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`);
 for(const stepId of ['miniboss-a','miniboss-b','boss']){
  const c=create({initialStepId:stepId,initialCarry:{hp:3,rally:77,assist:{helper:'han',used:true,active:false,charge:5,damageTaken:19}}});while(c.view().mode==='story')c.nextStory(c.view().token);
  assert.equal(c.world.player.hp,fighterBaseStats(c.world.player.type).maxHp);assert.equal(c.world.player.hp,95);assert.equal(c.world.player.hp,c.world.player.maxHp);assert.equal(c.world.player.rally,0);assert.equal(c.world.player.assist.charge,100);
  c.world.player.hp=43;c.world.player.rally=51;c.world.player.assist.charge=21;c.world.status='over';c.world.winner='player';c.step(0);c.continueResult(c.view().token);
  if(stepId==='boss'){assert.equal(c.world.player.hp,fighterBaseStats(c.world.player.type).maxHp);assert.equal(c.world.player.hp,95);assert.equal(c.world.player.hp,c.world.player.maxHp);assert.equal(c.world.player.rally,0);assert.equal(c.world.player.assist.charge,100);}
  else{assert.equal(c.world.player.hp,43);assert.equal(c.world.player.rally,51);assert.equal(c.world.player.assist.charge,21);}
 }
});
for(const legacy of [false,true])test(`${legacy?'legacy':'adopted'} entry preparation installs draft skills and starts only one attempt/write`,async()=>{
 const {api,storage}=await fixture(legacy),snapshot=api.preparationSnapshot(),write=storage.setItem;let writes=0;storage.setItem=(...a)=>{writes++;write(...a);};
 const draft={...snapshot,characterId:'han',helperId:'wang',difficulty:'hard',characters:{han:{skills:{...zeroSkills(),hp:2}}}};
 const run=await AsyncChallengeSession.create({progress:api,preparation:draft,preparationOptions:snapshot});assert.equal(run.startResult.persisted,true);assert.equal(writes,1);assert.equal(run.characterId,'han');assert.equal(api.readProfile().characters.han.skills.hp,2);assert.equal(run.attemptId,1);
});
test('legacy replay preparation and retry use live encounter rather than permanent completed checkpoint',async()=>{
 const {api,storage,locks}=await fixture(true),d=JSON.parse(storage.getItem(LEGACY_KEY));d.profiles[0].challenge.checkpoint=6;d.profiles[0].challenge.completed=true;d.profiles[0].unlockedCharacters.push('huang');storage.setItem(LEGACY_KEY,JSON.stringify(d));const progress=await openUnifiedProgress({storage,locks}),run=await AsyncChallengeSession.create({progress,replay:true});const first=run.attemptId;
 assert.equal((await run.retry()).persisted,true);assert.ok(run.attemptId>first);const snapshot=run.preparationSnapshot();assert.equal((await run.prepareEncounter({...snapshot,characterId:'han'},snapshot)).persisted,true);assert.equal((await run.rewardMob({encounterId:'replay-mob',xp:8})).persisted,true);assert.equal(progress.readProfile().challenge.checkpoint,6);
});
test('legacy duplicate gate received during failed save commits one checkpoint only',async()=>{
 const {api,storage}=await fixture(true),run=await AsyncChallengeSession.create({progress:api}),write=storage.setItem;storage.setItem=()=>{throw Error('quota')};assert.equal((await run.routeComplete({hp:37})).persisted,false);assert.equal((await run.routeComplete({hp:37})).accepted,false);storage.setItem=write;await run.retrySave();assert.equal(run.checkpoint,1);
});
test('two actual route resumes retain saved entry carry and renew XP attempt',async()=>{
 const {chapter:c,storage,locks}=await playable();c.world.status='gate';c.step(0);await c.flush();while(c.view().mode==='story')c.nextStory(c.view().token);c.world.player.hp=37;c.world.player.rally=41;c.world.player.assist.charge=12;c.world.player.assist.used=true;c.world.status='over';c.world.winner='player';c.step(0);await c.flush();c.continueResult(c.view().token);await c.flush();
 let attempt=0;for(let i=0;i<2;i++){const router=await openUnifiedContinuation({mode:'campaign',optIn:true,storage,locks}),opened=await createCampaignPlayable({router,chapterId:'chapter-2',createPlayableChapter});assert.equal(opened.accepted,true);assert.equal(opened.chapter.world.player.hp,37);assert.equal(opened.chapter.world.player.rally,41);assert.equal(opened.chapter.world.player.assist.charge,12);const saved=JSON.parse(storage.getItem(UNIFIED_KEY)).campaign.profiles[0].campaign;assert.equal(saved.carry.hp,37);assert.ok(saved.attempt.id>attempt);attempt=saved.attempt.id;}
});
test('first-chapter replay resource changes do not alter formal later checkpoint carry',async()=>{
 const {chapter:c,storage,locks}=await playable();c.world.status='gate';c.step(0);await c.flush();while(c.view().mode==='story')c.nextStory(c.view().token);c.world.player.hp=37;c.world.player.rally=41;c.world.player.assist.charge=12;c.world.status='over';c.world.winner='player';c.step(0);await c.flush();c.continueResult(c.view().token);const api=await openUnifiedProgress({storage,locks}),before=api.readProfile().campaign.carry,run=await AsyncChallengeSession.create({progress:api,replay:true});assert.equal(run.carry,null);await run.routeComplete({hp:78,rally:5});assert.deepEqual(api.readProfile().campaign.carry,before);await run.retry();assert.deepEqual(api.readProfile().campaign.carry,before);
});
test('legacy replay begins fresh and preserves archived formal resource checkpoint',async()=>{
 const {storage,locks}=await fixture(true),d=JSON.parse(storage.getItem(LEGACY_KEY));d.profiles[0].challenge.checkpoint=6;d.profiles[0].challenge.completed=true;d.profiles[0].unlockedCharacters.push('huang');const carry={hp:37,rally:41,assist:{helper:'han',charge:12,used:true,active:false,damageTaken:0}};d.profiles[0].challenge.carry=carry;storage.setItem(LEGACY_KEY,JSON.stringify(d));const api=await openUnifiedProgress({storage,locks}),run=await AsyncChallengeSession.create({progress:api,replay:true});assert.equal(run.carry,null);await run.routeComplete({hp:78});await run.retry();assert.deepEqual(api.readProfile().challenge.carry,carry);
});
test('fresh adopted first-chapter preparation enters playable route in one locked write',async()=>{
 const storage=memoryStorage(),locks=memoryLocks(),api=await openUnifiedProgress({storage,locks}),info=api.inspectAdoption();await api.adoptProfile('slot-1',{source:'new',expectedRevision:info.revision,evidence:info.evidence});const snapshot=api.preparationSnapshot(),write=storage.setItem;let writes=0;storage.setItem=(...a)=>{writes++;write(...a);};const run=await AsyncChallengeSession.create({progress:api,preparation:snapshot,preparationOptions:snapshot});assert.equal(run.startResult.persisted,true);assert.equal(run.run.stepId,'route-a');assert.equal(writes,1);assert.equal(run.attemptId,1);
});
test('legacy pending gate rejects later old-scene mob events',async()=>{
 const {api,storage}=await fixture(true),run=await AsyncChallengeSession.create({progress:api});storage.setItem=()=>{throw Error('quota')};await run.routeComplete({hp:37});assert.equal((await run.rewardMob({encounterId:'after-gate',xp:8})).accepted,false);
});
test('preparation at a story boundary advances the saved campaign revision',async()=>{
 const d=newDocument(),p=d.profiles[0];p.campaign.chapterClears=['chapter-1'];p.unlockedCharacters.push('huang');p.campaign.receipts=FIRST_CLEAR_STEPS.map(s=>receiptFor('chapter-1',s));p.campaign.cursor={chapterId:'chapter-2',stepId:'entry'};const storage=memoryStorage({[CAMPAIGN_KEY]:JSON.stringify(d)}),api=await openUnifiedProgress({storage,locks:memoryLocks()}),info=api.inspectAdoption();await api.adoptProfile('slot-1',{source:'campaign',expectedRevision:info.revision,evidence:info.evidence});
 const start=await api.beginChallenge({chapterId:'chapter-2'}),before=api.readProfile().campaign.revision,s=api.preparationSnapshot();const r=await api.prepareEncounter({...s,difficulty:'hard'},{...s,token:start.token});assert.equal(r.persisted,true);assert.ok(api.readProfile().campaign.revision>before);
});
test('retrying failed entry setup updates startResult before installing prepared session',async()=>{
 const {api,storage}=await fixture(),s=api.preparationSnapshot(),write=storage.setItem;storage.setItem=()=>{throw Error('quota')};const run=await AsyncChallengeSession.create({progress:api,preparation:{...s,characterId:'han'},preparationOptions:s});assert.equal(run.startResult.persisted,false);storage.setItem=write;assert.equal((await run.retrySave()).persisted,true);assert.equal(run.startResult.persisted,true);assert.equal(run.characterId,'han');assert.ok(run.token);
});
for(const legacy of [true,false])test(`${legacy?'legacy':'adopted'} unchanged entry preparation preserves carried resources while renewing attempt`,async()=>{
 const {api}=await fixture(legacy),first=await AsyncChallengeSession.create({progress:api});await first.routeComplete({hp:63});await first.bossWon({hp:37,rally:41,assist:{helper:'han',charge:12,used:true,active:false,damageTaken:9}});const s=api.preparationSnapshot(),previous=first.attemptId;
 const resumed=await AsyncChallengeSession.create({progress:api,preparation:s,preparationOptions:{...s,resetCarry:false}});assert.equal(resumed.startResult.persisted,true);assert.equal(resumed.carry?.hp,37);assert.equal(resumed.carry.rally,41);assert.equal(resumed.carry.assist.charge,12);assert.ok(resumed.attemptId>previous);assert.equal((api.readProfile().campaign??api.readProfile().challenge).carry.hp,37);
});
