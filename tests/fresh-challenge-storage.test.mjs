import test from 'node:test';
import assert from 'node:assert/strict';
import {newDocument,zeroSkills,deriveStats} from '../dist/preview/campaign/core/model.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
const KEY='taiwanpunchline-challenge-v4';
function storage(seed={}){
 const data=new Map(Object.entries(seed)),writes=[],reads=[];
 return {data,writes,reads,getItem(k){reads.push(k);return data.get(k)??null;},setItem(k,v){writes.push([k,v]);data.set(k,v);}};
}
function locks(){let tail=Promise.resolve();return {request(name,options,work){assert.equal(name,`${KEY}:root-write`);assert.equal(options.mode,'exclusive');const p=tail.then(work);tail=p.catch(()=>{});return p;}};}
function seedEnvelope(){const campaign=newDocument();for(const p of campaign.profiles)p.campaign.difficulty='easy';return {version:4,revision:0,activeProfileId:'slot-1',campaign,slots:Object.fromEntries(['slot-1','slot-2','slot-3'].map(id=>[id,{authority:'campaign',generation:0}]))};}
const guards=api=>api.preparationSnapshot();
async function setup(envelope=seedEnvelope()){const s=storage({[KEY]:JSON.stringify(envelope)}),l=locks();return {s,l,api:await openChallengeProgress({storage:s,locks:l})};}

test('old populated namespaces cannot select active authority, seed XP, or receive any write',async()=>{
 const old=newDocument();old.profiles[0].campaign.xp=800;old.activeProfileId='slot-3';
 const entries={'taiwanpunchline-progress-v1':'{"version":900}', 'taiwanpunchline-progress-v2':JSON.stringify(old),'taiwanpunchline-progress-v3':'{"version":999}','taiwanpunchline-settings':'{"volume":0.3}'};
 const s=storage(entries),api=await openChallengeProgress({storage:s,locks:locks()});
 assert.equal(api.get().authority,'campaign');assert.equal(api.get().initialized,false);assert.equal(api.preparationSnapshot().initialized,false);assert.equal(api.get().dirty,false);assert.equal(api.get().storageIssue,null);assert.equal(api.activeProfileId,'slot-1');
 assert.equal(api.readProfile().campaign.xp,0);assert.equal(api.readProfile().campaign.story.opening,'unseen');assert.equal(api.preparationSnapshot().difficulty,'easy');assert.deepEqual(api.readProfile().characters,{});
 assert.deepEqual(s.reads,[KEY]);assert.equal(s.writes.length,0);
 const draft=guards(api);assert.equal((await api.savePreparation(draft,draft)).persisted,true);
 assert.equal(api.get().initialized,true);assert.equal(api.readProfile().campaign.attempt,null);assert.equal(api.readProfile().campaign.cursor.stepId,'entry');
 for(const [k,v] of Object.entries(entries))assert.equal(s.data.get(k),v);
 assert.deepEqual([...new Set(s.writes.map(([k])=>k))],[KEY]);
});

test('unsupported v4 root, authority and generation reject writes and retain raw export',async()=>{
 for(const alter of [e=>e.version=99,e=>e.slots['slot-1'].authority='legacy',e=>e.slots['slot-2'].generation=-1,e=>e.unknown=true,e=>e.campaign.profiles[0].campaign.generation=1]){
  const e=seedEnvelope();alter(e);const raw=JSON.stringify(e),s=storage({[KEY]:raw}),api=await openChallengeProgress({storage:s,locks:locks()});
  assert.equal(api.get().readOnly,true);assert.equal((await api.beginChallenge()).accepted,false);assert.equal(s.writes.length,0);assert.equal(JSON.parse(api.exportBackup()).lastObservedEnvelopeRaw,raw);
 }
});
test('missing Web Locks yields read-only fresh state rather than fake success or dirty failure',async()=>{
 const s=storage(),api=await openChallengeProgress({storage:s});assert.equal(api.get().readOnly,true);assert.equal(api.get().dirty,false);assert.equal((await api.beginChallenge()).reason,'lock-unavailable');assert.equal(s.writes.length,0);
});
test('preparation changes both independent builds without starting a run or consuming opening',async()=>{
 const e=seedEnvelope();e.campaign.profiles[0].campaign.xp=160;const {api}=await setup(e),draft=guards(api);
 const r=await api.savePreparation({...draft,characterId:'han',helperId:'wang',difficulty:'hard',characters:{wang:{skills:{...zeroSkills(),hp:2}},han:{skills:{...zeroSkills(),move:2}}}},draft);
 assert.equal(r.persisted,true);const p=api.readProfile();assert.equal(p.characters.wang.skills.hp,2);assert.equal(p.characters.han.skills.move,2);assert.equal(p.campaign.attemptSerial,0);assert.equal(p.campaign.story.opening,'unseen');assert.equal(p.campaign.selection.characterId,'han');
});
test('stale drafts fail generation/revision guards before writing',async()=>{
 const {api,s,l}=await setup(),draft=guards(api),other=await openChallengeProgress({storage:s,locks:l});await other.savePreparation({...draft,difficulty:'hard'},draft);const raw=s.getItem(KEY),r=await api.savePreparation({...draft,characterId:'han'},draft);
 assert.equal(r.accepted,false);assert.equal(r.reason,'stale-revision');assert.equal(s.getItem(KEY),raw);
});
test('write exception with exact successful readback is a persisted success',async()=>{
 const {api,s}=await setup(),write=s.setItem;s.setItem=(k,v)=>{write(k,v);throw Error('reported after writing');};const draft=guards(api),r=await api.savePreparation(draft,draft);assert.equal(r.accepted,true);assert.equal(r.persisted,true);assert.equal(api.get().dirty,false);
});
test('unreadable readback remains dirty and retry verifies without overwriting',async()=>{
 const {api,s}=await setup(),read=s.getItem,write=s.setItem;let fail=false;s.setItem=(k,v)=>{write(k,v);fail=true;};s.getItem=k=>{if(fail)throw Error('read disabled');return read(k);};const draft=guards(api),r=await api.savePreparation(draft,draft);assert.equal(r.accepted,true);assert.equal(r.persisted,false);assert.equal(r.reason,'readback-unavailable');assert.equal(api.get().dirty,true);
 const n=s.writes.length;fail=false;s.getItem=read;s.setItem=write;assert.equal((await api.retrySave()).persisted,true);assert.equal(s.writes.length,n);
});
test('quota failure preserves pending candidate and retry applies it once',async()=>{
 const {api,s}=await setup(),raw=s.getItem(KEY),write=s.setItem;s.setItem=()=>{throw Error('quota');};const draft=guards(api);const r=await api.savePreparation({...draft,difficulty:'hard'},draft);assert.equal(r.persisted,false);assert.equal(s.getItem(KEY),raw);assert.equal(api.get().dirty,true);s.setItem=write;assert.equal((await api.retrySave()).persisted,true);const after=s.getItem(KEY);assert.equal((await api.retrySave()).accepted,false);assert.equal(s.getItem(KEY),after);
});
test('original-string CAS rejects a noncooperating writer before mutation',async()=>{
 const {api,s}=await setup(),read=s.getItem,original=s.getItem(KEY),concurrent=JSON.parse(original);concurrent.revision=1;concurrent.campaign.profiles[2].campaign.difficulty='hard';let reads=0;s.getItem=k=>{if(k===KEY&&++reads===2)s.data.set(KEY,JSON.stringify(concurrent));return read(k);};const g=guards(api),r=await api.savePreparation({...g,difficulty:'hard'},g);assert.equal(r.accepted,false);assert.equal(r.reason,'save-conflict');assert.equal(s.writes.length,0);assert.equal(s.getItem(KEY),JSON.stringify(concurrent));
});
test('reset backup is verified before changing only the named slot and generation',async()=>{
 const e=seedEnvelope();e.revision=12;e.campaign.profiles[0].campaign.xp=80;e.campaign.profiles[1].campaign.xp=160;e.campaign.profiles[2].campaign.difficulty='hard';e.slots['slot-2'].generation=4;
 const {api,s}=await setup(e);s.data.set('taiwanpunchline-settings','raw settings');const otherBefore=[JSON.stringify(e.campaign.profiles[0]),JSON.stringify(e.campaign.profiles[2])];const r=await api.resetProfile('slot-2',{expectedRevision:12,expectedGeneration:4});
 assert.equal(r.accepted,true);assert.equal(r.persisted,true);assert.ok(r.backupKey);assert.equal(s.writes[0][0],r.backupKey);assert.equal(s.writes[1][0],KEY);const backup=JSON.parse(s.getItem(r.backupKey));assert.equal(backup.scope,'slot');assert.equal(backup.profileId,'slot-2');assert.equal(backup.profile.campaign.xp,160);const after=JSON.parse(s.getItem(KEY));assert.equal(after.revision,13);assert.equal(after.slots['slot-2'].generation,5);assert.equal(after.campaign.profiles[1].campaign.xp,0);assert.equal(after.campaign.profiles[1].campaign.story.opening,'unseen');assert.equal(after.campaign.profiles[1].campaign.difficulty,'easy');assert.deepEqual([JSON.stringify(after.campaign.profiles[0]),JSON.stringify(after.campaign.profiles[2])],otherBefore);assert.equal(s.getItem('taiwanpunchline-settings'),'raw settings');assert.equal(api.activeProfileId,'slot-1');
});
test('failed backup prevents reset and preserves the old session and all source bytes',async()=>{
 const {api,s}=await setup();const run=await api.beginChallenge();const g=guards(api),raw=s.getItem(KEY),write=s.setItem;s.setItem=(k,v)=>{if(k!==KEY)throw Error('backup quota');write(k,v);};const r=await api.resetProfile('slot-1',g);assert.equal(r.accepted,false);assert.equal(r.reason,'backup-write-failed');assert.equal(s.getItem(KEY),raw);s.setItem=write;assert.equal((await api.dispatchChallenge(run.token,{type:'story-complete'})).persisted,true);
});
test('unverified backup never starts reset and a backup exception after writing may succeed',async()=>{
 for(const mismatch of [true,false]){const {api,s}=await setup(),write=s.setItem,read=s.getItem,raw=s.getItem(KEY);s.setItem=(k,v)=>{write(k,v);if(k!==KEY&&!mismatch)throw Error('after write');};s.getItem=k=>k!==KEY&&mismatch?'wrong backup':read(k);const r=await api.resetProfile('slot-1',guards(api));assert.equal(r.accepted,!mismatch);if(!mismatch)assert.equal(r.persisted,true);if(mismatch){assert.equal(r.accepted,false);assert.equal(s.getItem(KEY),raw);}}
});
test('failed reset remains pending until verified retry and invalidates previous actors',async()=>{
 const {api,s}=await setup(),run=await api.beginChallenge(),g=guards(api),write=s.setItem;s.setItem=(k,v)=>{if(k===KEY)throw Error('quota');write(k,v);};const r=await api.resetProfile('slot-1',g);assert.equal(r.accepted,true);assert.equal(r.persisted,false);assert.ok(s.getItem(r.backupKey));assert.equal((await api.dispatchChallenge(run.token,{type:'story-complete'})).accepted,false);s.setItem=write;assert.equal((await api.retrySave()).persisted,true);assert.equal(api.get().generation,1);assert.equal(api.readProfile().campaign.story.opening,'unseen');
});
test('old page run, queued event, draft and slot import cannot overwrite a reset',async()=>{
 const {api,s,l}=await setup(),run=await api.beginChallenge(),g=guards(api),backup=api.exportSlotBackup('slot-1');const other=await openChallengeProgress({storage:s,locks:l});assert.equal((await other.resetProfile('slot-1',guards(other))).persisted,true);const raw=s.getItem(KEY);
 for(const job of [()=>api.dispatchChallenge(run.token,{type:'story-complete'}),()=>api.savePreparation(g,g),()=>api.importSlotBackup(backup,{profileId:'slot-1',...g})]){const r=await job();assert.equal(r.accepted,false);assert.equal(s.getItem(KEY),raw);}
});
test('dirty retry conflicts with reset in another tab rather than restoring old generation',async()=>{
 const {api,s,l}=await setup(),g=guards(api),write=s.setItem;s.setItem=()=>{throw Error('quota');};await api.savePreparation({...g,difficulty:'hard'},g);s.setItem=write;const other=await openChallengeProgress({storage:s,locks:l});await other.resetProfile('slot-1',guards(other));const raw=s.getItem(KEY),r=await api.retrySave();assert.equal(r.accepted,false);assert.equal(r.reason,'save-conflict');assert.equal(s.getItem(KEY),raw);assert.equal(api.get().dirty,true);assert.equal((await api.refresh()).accepted,false);assert.equal((await api.refresh({discardPending:true})).accepted,true);assert.equal(api.get().generation,1);
});
test('simultaneous different-slot resets preserve both slots and reject stale global confirmation',async()=>{
 const {api,s,l}=await setup(),other=await openChallengeProgress({storage:s,locks:l});const [a,b]=await Promise.all([api.resetProfile('slot-1',{expectedRevision:0,expectedGeneration:0}),other.resetProfile('slot-2',{expectedRevision:0,expectedGeneration:0})]);assert.equal(a.persisted,true);assert.equal(b.accepted,false);assert.equal(b.reason,'stale-revision');await other.refresh();assert.equal((await other.resetProfile('slot-2',{expectedRevision:1,expectedGeneration:0})).persisted,true);const saved=JSON.parse(s.getItem(KEY));assert.equal(saved.slots['slot-1'].generation,1);assert.equal(saved.slots['slot-2'].generation,1);assert.equal(saved.slots['slot-3'].generation,0);assert.equal(saved.revision,2);
});
test('same-slot concurrent reset has one winner and cannot double-clear a new generation',async()=>{
 const {api,s,l}=await setup(),other=await openChallengeProgress({storage:s,locks:l});const r=await Promise.all([api.resetProfile('slot-1',{expectedRevision:0,expectedGeneration:0}),other.resetProfile('slot-1',{expectedRevision:0,expectedGeneration:0})]);assert.equal(r.filter(x=>x.accepted&&x.persisted).length,1);assert.equal(JSON.parse(s.getItem(KEY)).slots['slot-1'].generation,1);
});
test('delayed lock rechecks reset, abort and test-mode intent before executing',async()=>{
 for(const mode of ['reset','abort','test-mode']){
  const {api,s,l}=await setup(),g=guards(api);let release;const gate=new Promise(resolve=>release=resolve),delay={request:async(n,o,f)=>{await gate;return l.request(n,o,f);}};const waiting=await openChallengeProgress({storage:s,locks:delay}),controller=new AbortController();const job=waiting.savePreparation({...g,difficulty:'hard'},{...g,signal:controller.signal});
  if(mode==='reset')await api.resetProfile('slot-1',g);else if(mode==='abort')controller.abort();else waiting.enterTestMode();const raw=s.getItem(KEY);release();const r=await job;assert.equal(r.accepted,false);assert.equal(s.getItem(KEY),raw);
 }
});
test('slot import validates source and only restores matching named slot with fresh generation',async()=>{
 const e=seedEnvelope();e.campaign.profiles[1].campaign.xp=240;const {api,s}=await setup(e),backup=api.exportSlotBackup('slot-2');assert.equal(api.inspectSlotBackup(backup).profileId,'slot-2');assert.equal(api.inspectSlotBackup(backup).xp,240);await api.resetProfile('slot-2',{expectedRevision:0,expectedGeneration:0});const before=JSON.parse(s.getItem(KEY)),r=await api.importSlotBackup(backup,{profileId:'slot-2',expectedRevision:1,expectedGeneration:1});assert.equal(r.persisted,true);const after=JSON.parse(s.getItem(KEY));assert.equal(after.campaign.profiles[1].campaign.xp,240);assert.equal(after.revision,2);assert.equal(after.slots['slot-2'].generation,2);assert.deepEqual(after.campaign.profiles[0],before.campaign.profiles[0]);assert.deepEqual(after.campaign.profiles[2],before.campaign.profiles[2]);
 for(const text of [api.exportBackup(),JSON.stringify({...JSON.parse(backup),scope:'all'}),JSON.stringify({...JSON.parse(backup),generation:-1}),JSON.stringify({...JSON.parse(backup),revision:'1'})]){assert.equal((await api.importSlotBackup(text,{profileId:'slot-2',expectedRevision:2,expectedGeneration:2})).accepted,false);}
 assert.equal((await api.importSlotBackup(backup,{profileId:'slot-1',expectedRevision:2,expectedGeneration:0})).reason,'slot-mismatch');assert.equal((await api.importSlotBackup(backup,{profileId:'slot-2',expectedRevision:2})).reason,'expected-generation-required');
});
test('cancelled queued run and test-mode exit do not resurrect expired events',async()=>{
 const {api,s,l}=await setup();let release;const gate=new Promise(resolve=>release=resolve),defer={request:async(n,o,f)=>{await gate;return l.request(n,o,f);}};const delayed=await openChallengeProgress({storage:s,locks:defer}),pending=delayed.beginChallenge();delayed.enterTestMode();delayed.exitTestMode();const raw=s.getItem(KEY);release();assert.equal((await pending).accepted,false);assert.equal(s.getItem(KEY),raw);assert.equal(api.get().testMode,false);
});
test('boundary preparation retains carry, scales recharge damage, and invalidates old run token',async()=>{
 const e=seedEnvelope(),p=e.campaign.profiles[0];p.campaign.cursor.stepId='route-a';p.campaign.xp=160;p.campaign.carry={hp:80,rally:46,assist:{helper:'han',used:true,active:false,charge:20,damageTaken:7}};const {api}=await setup(e);const begun=await api.beginChallenge(),g=guards(api),oldMax=api.getChallengeStats('wang').maxHp;const r=await api.prepareEncounter({...g,characterId:'han',helperId:'wang',characters:{han:{skills:{...zeroSkills(),hp:2}}}},{...g,token:begun.token,intent:'boundary'});assert.equal(r.persisted,true);const newMax=api.getChallengeStats('han').maxHp;assert.equal(r.run.attemptId,begun.run.attemptId);assert.equal(r.carry.hp,80);assert.equal(r.carry.rally,46);assert.equal(r.carry.assist.used,true);assert.equal(r.carry.assist.charge,20);assert.equal(r.carry.assist.helper,'wang');assert.ok(Math.abs(r.carry.assist.damageTaken-7*newMax/oldMax)<1e-9);assert.equal((await api.dispatchChallenge(begun.token,{type:'mob-defeated',enemyId:'late',xp:8})).accepted,false);assert.equal((await api.dispatchChallenge(r.token,{type:'mob-defeated',enemyId:'new',xp:8})).persisted,true);
});
test('explicit retry resets carry; implicit token preparation cannot grant free healing',async()=>{
 const e=seedEnvelope();e.campaign.profiles[0].campaign.cursor.stepId='route-a';e.campaign.profiles[0].campaign.carry={hp:12,rally:46,assist:{helper:'han',used:true,active:false,charge:20,damageTaken:7}};const {api,s}=await setup(e),begin=await api.beginChallenge(),g=guards(api),raw=s.getItem(KEY);assert.equal((await api.prepareEncounter(g,{...g,token:begin.token})).reason,'explicit-intent-required');assert.equal(s.getItem(KEY),raw);const retry=await api.prepareEncounter(g,{...g,token:begin.token,intent:'retry'});assert.equal(retry.persisted,true);assert.equal(retry.carry,null);assert.ok(retry.run.attemptId>begin.run.attemptId);
});

test('four chapters use one v4 authority, repeating mob XP and once-only first-clear receipts',async()=>{
 const {api,s}=await setup();let r=await api.beginChallenge({chapterId:'chapter-1'}),xp=0;
 const dispatch=async action=>{r=await api.dispatchChallenge(r.token,action);assert.equal(r.persisted,true,r.reason);return r;};
 for(let chapter=1;chapter<=4;chapter++){
  assert.equal(r.run.chapterId,`chapter-${chapter}`);await dispatch({type:'story-complete'});
  for(let section=0;section<3;section++){
   await dispatch({type:'mob-defeated',enemyId:'same-enemy',xp:8});xp+=8;const duplicate=await api.dispatchChallenge(r.token,{type:'mob-defeated',enemyId:'same-enemy',xp:8});assert.equal(duplicate.accepted,false);
   await dispatch({type:'retry'});await dispatch({type:'mob-defeated',enemyId:'same-enemy',xp:8});xp+=8;
   await dispatch({type:'route-complete',carry:{hp:35,rally:41,assist:{helper:'han',used:true,active:false,charge:30,damageTaken:10}}});xp+=25;
   if(section===2){await dispatch({type:'story-complete'});assert.equal(api.readProfile().campaign.carry,null);}
   await dispatch({type:'boss-win',carry:{hp:30,rally:51,assist:{helper:'han',used:true,active:false,charge:11,damageTaken:4}}});xp+=section===2?160:100;
  }
  assert.equal(api.readProfile().campaign.xp,xp);await dispatch({type:'story-complete'});await dispatch({type:'continue'});
 }
 assert.deepEqual(api.readProfile().campaign.chapterClears,['chapter-1','chapter-2','chapter-3','chapter-4']);assert.equal((await api.beginChallenge({chapterId:'chapter-5'})).reason,'content-locked');
 r=await api.beginChallenge({replay:true,chapterId:'chapter-1'});assert.equal(r.persisted,true);await dispatch({type:'mob-defeated',enemyId:'same-enemy',xp:8});xp+=8;const clear=await dispatch({type:'route-complete'});assert.equal(clear.rewardedXP,0);assert.equal(api.readProfile().campaign.xp,xp);assert.equal(api.get().authority,'campaign');assert.deepEqual([...new Set(s.writes.map(([k])=>k))],[KEY]);
});

test('cancelRun before a delayed begin invalidates queued scene creation',async()=>{
 const {s,l}=await setup();let release;const gate=new Promise(resolve=>release=resolve),defer={request:async(n,o,f)=>{await gate;return l.request(n,o,f);}};const api=await openChallengeProgress({storage:s,locks:defer}),raw=s.getItem(KEY),job=api.beginChallenge();api.cancelRun();release();const r=await job;assert.equal(r.accepted,false);assert.equal(r.reason,'cancelled');assert.equal(s.getItem(KEY),raw);
});
test('compatibility skill mutations preserve carry without free HP or recharge changes',async()=>{
 const e=seedEnvelope(),p=e.campaign.profiles[0];p.campaign.xp=160;p.campaign.carry={hp:80,rally:30,assist:{helper:'han',used:true,active:false,charge:50,damageTaken:15}};const {api}=await setup(e),max=api.getChallengeStats('wang').maxHp;await api.allocate('wang','hp');const bigger=api.getChallengeStats('wang').maxHp,c=api.readProfile().campaign.carry;assert.equal(c.hp,80);assert.equal(c.assist.charge,50);assert.ok(Math.abs(c.assist.damageTaken-15*bigger/max)<1e-9);await api.reset('wang');const after=api.readProfile().campaign.carry;assert.equal(after.hp,80);assert.equal(after.assist.charge,50);assert.ok(Math.abs(after.assist.damageTaken-15)<1e-9);
});
test('locked sessions never accept live preparation without an explicit boundary or retry',async()=>{
 const {api,s}=await setup(),start=await api.beginChallenge(),g=guards(api),raw=s.getItem(KEY);const r=await api.savePreparation({...g,difficulty:'hard'},g);assert.equal(r.accepted,false);assert.equal(r.reason,'active-run');assert.equal(s.getItem(KEY),raw);assert.equal((await api.dispatchChallenge(start.token,{type:'story-complete'})).persisted,true);
});

test('reset repeats original-string CAS after verified backup and never overwrites a concurrent raw',async()=>{
 const {api,s}=await setup(),write=s.setItem,concurrent=JSON.parse(s.getItem(KEY));concurrent.revision=7;concurrent.slots['slot-1'].generation=3;const raw=JSON.stringify(concurrent);s.setItem=(k,v)=>{write(k,v);if(k!==KEY)s.data.set(KEY,raw);};const r=await api.resetProfile('slot-1',guards(api));assert.equal(r.accepted,false);assert.equal(r.reason,'save-conflict');assert.equal(s.getItem(KEY),raw);assert.equal(s.writes.filter(([k])=>k===KEY).length,0);
});
test('a partial invalid action batch cannot pay XP or advance the checkpoint',async()=>{
 const {api,s}=await setup();let r=await api.beginChallenge();r=await api.dispatchChallenge(r.token,{type:'story-complete'});const raw=s.getItem(KEY),failed=await api.dispatchChallenge(r.token,[{type:'mob-defeated',enemyId:'should-not-pay',xp:8},{type:'boss-win'}]);assert.equal(failed.accepted,false);assert.equal(s.getItem(KEY),raw);assert.equal(api.readProfile().campaign.xp,0);assert.equal((await api.dispatchChallenge(r.token,{type:'mob-defeated',enemyId:'should-not-pay',xp:8})).rewardedXP,8);
});
test('reset cannot wrap revision or slot generation limits and writes no backup',async()=>{
 for(const field of ['revision','generation']){const e=seedEnvelope();if(field==='revision')e.revision=1_000_000_000;else e.slots['slot-1'].generation=1_000_000_000;const {api,s}=await setup(e);const r=await api.resetProfile('slot-1',guards(api));assert.equal(r.reason,'revision-limit');assert.equal(r.accepted,false);assert.equal(s.writes.length,0);}
});
test('only explicit archive export reads legacy namespaces and preserves raw unknown data',async()=>{
 const old={'taiwanpunchline-progress-v1':'not JSON','taiwanpunchline-progress-v2':'{"arbitrary":"unknown data"}','taiwanpunchline-progress-v3':'{broken'},s=storage(old),api=await openChallengeProgress({storage:s,locks:locks()});assert.deepEqual(s.reads,[KEY]);const exported=JSON.parse(api.exportLegacyBackup());assert.equal(exported.scope,'legacy-read-only');for(const [k,v] of Object.entries(old))assert.equal(exported.raw[k],v);assert.equal(api.readProfile().campaign.xp,0);assert.equal(s.writes.length,0);
});
test('queued input snapshots cannot be changed after save submission',async()=>{
 const {s,l}=await setup();let release;const gate=new Promise(resolve=>release=resolve),defer={request:async(n,o,f)=>{await gate;return l.request(n,o,f);}};const api=await openChallengeProgress({storage:s,locks:defer}),g=guards(api),draft={...g,difficulty:'easy'},job=api.savePreparation(draft,g);draft.difficulty='hard';release();assert.equal((await job).persisted,true);assert.equal(api.readProfile().campaign.difficulty,'easy');
});

test('a retained chapter-four continuation token cannot play the locked fifth chapter',async()=>{
 const {api,s}=await setup();let r=await api.beginChallenge();const send=async action=>{r=await api.dispatchChallenge(r.token,action);assert.equal(r.persisted,true,r.reason);};
 for(let chapter=1;chapter<=4;chapter++){await send({type:'story-complete'});for(let section=0;section<3;section++){await send({type:'route-complete'});if(section===2)await send({type:'story-complete'});await send({type:'boss-win'});}await send({type:'story-complete'});if(chapter===4){const old=s.getItem(KEY),batch=await api.dispatchChallenge(r.token,[{type:'continue'},{type:'story-complete'}]);assert.equal(batch.accepted,false);assert.equal(batch.reason,'content-locked');assert.equal(s.getItem(KEY),old);}await send({type:'continue'});}
 const raw=s.getItem(KEY),blocked=await api.dispatchChallenge(r.token,{type:'story-complete'});assert.equal(blocked.accepted,false);assert.equal(blocked.reason,'content-locked');assert.equal(s.getItem(KEY),raw);
});

test('replay preparation remaps the retained normal carry exactly once when the shared party changes',async()=>{
 const {api}=await setup();let r=await api.beginChallenge();const send=async action=>{r=await api.dispatchChallenge(r.token,action);assert.equal(r.persisted,true,r.reason);};
 await send({type:'story-complete'});for(let section=0;section<3;section++){await send({type:'route-complete'});if(section===2)await send({type:'story-complete'});await send({type:'boss-win'});}await send({type:'story-complete'});await send({type:'continue'});await send({type:'story-complete'});await send({type:'route-complete'});await send({type:'boss-win',carry:{hp:83,rally:41,assist:{helper:'han',used:true,active:false,charge:40,damageTaken:19}}});
 assert.equal(api.getChallengeStats('wang').maxHp,95);assert.equal(api.getChallengeStats('han').maxHp,105);api.cancelRun();r=await api.beginChallenge({replay:true,chapterId:'chapter-1'});await send({type:'route-complete'});await send({type:'boss-win',carry:{hp:73,rally:31,assist:{helper:'han',used:true,active:false,charge:60,damageTaken:9.5}}});
 let g=guards(api),changed=await api.prepareEncounter({...g,characterId:'han',helperId:'wang'},{...g,token:r.token,intent:'boundary'});assert.equal(changed.persisted,true);let c=api.readProfile().campaign;
 assert.deepEqual(c.carry,{hp:83,rally:41,assist:{helper:'wang',used:true,active:false,charge:40,damageTaken:21}});assert.deepEqual(c.replayCarry,{hp:73,rally:31,assist:{helper:'wang',used:true,active:false,charge:60,damageTaken:10.5}});
 g=guards(api);changed=await api.prepareEncounter(g,{...g,token:changed.token,intent:'boundary'});assert.equal(changed.persisted,true);c=api.readProfile().campaign;assert.equal(c.carry.assist.damageTaken,21);assert.equal(c.replayCarry.assist.damageTaken,10.5);
 api.cancelRun();const resumed=await api.beginChallenge({chapterId:'chapter-2'});assert.equal(resumed.persisted,true);assert.equal(resumed.run.stepId,'route-b');c=api.readProfile().campaign;assert.equal(c.carry.hp,83);assert.equal(c.carry.assist.damageTaken,21);assert.equal(c.carry.assist.charge,40);
});

test('normal preparation remaps saved replay carry on lower max HP without healing or refreshing assist',async()=>{
 const e=seedEnvelope(),p=e.campaign.profiles[0];p.campaign.selection={characterId:'han',helperId:'wang'};p.campaign.carry={hp:104,rally:51,assist:{helper:'wang',used:true,active:false,charge:40,damageTaken:21}};p.campaign.replayCarry={hp:81,rally:31,assist:{helper:'wang',used:true,active:false,charge:60,damageTaken:10.5}};
 const {api}=await setup(e),g=guards(api);assert.equal((await api.savePreparation({...g,characterId:'wang',helperId:'han'},g)).persisted,true);const c=api.readProfile().campaign;
 assert.deepEqual(c.carry,{hp:95,rally:51,assist:{helper:'han',used:true,active:false,charge:40,damageTaken:19}});assert.deepEqual(c.replayCarry,{hp:81,rally:31,assist:{helper:'han',used:true,active:false,charge:60,damageTaken:9.5}});
 const unchanged=guards(api);assert.equal((await api.savePreparation(unchanged,unchanged)).persisted,true);assert.deepEqual(api.readProfile().campaign.carry,c.carry);assert.deepEqual(api.readProfile().campaign.replayCarry,c.replayCarry);
});

// Read-only durable proof must not refresh state, consume pending work, or
// update export's lastObservedEnvelopeRaw even when another tab has written.
function assertReceiptProbeUnchanged(api,s,receipt,expected){
 const state=api.get(),backup=api.exportBackup(),writes=s.writes.length;
 assert.equal(api.verifyPersistedReceipt(receipt),expected);
 assert.deepEqual(api.get(),state);assert.equal(api.exportBackup(),backup);assert.equal(s.writes.length,writes);
}
test('verifyPersistedReceipt confirms the exact verified bytes without changing state or writing',async()=>{
 const {api,s}=await setup(),receipt=api.get();assertReceiptProbeUnchanged(api,s,receipt,true);assertReceiptProbeUnchanged(api,s,receipt,true);
 const g=guards(api);assert.equal((await api.savePreparation({...g,difficulty:'hard'},g)).persisted,true);assertReceiptProbeUnchanged(api,s,receipt,false);assertReceiptProbeUnchanged(api,s,api.get(),true);
});
for(const change of ['other-tab','clear','different-bytes','unreadable','same-json-different-bytes'])test(`verifyPersistedReceipt rejects ${change} without consuming stale state`,async()=>{
 const {api,s,l}=await setup(),receipt=api.get();if(change==='other-tab'){const other=await openChallengeProgress({storage:s,locks:l});assert.equal((await other.selectProfile('slot-2')).persisted,true);assert.equal(api.get().revision,receipt.revision);}else if(change==='clear')s.data.delete(KEY);else if(change==='different-bytes')s.data.set(KEY,'corrupt');else if(change==='same-json-different-bytes')s.data.set(KEY,JSON.stringify(JSON.parse(s.data.get(KEY)),null,2));else s.getItem=()=>{throw Error('read denied');};assertReceiptProbeUnchanged(api,s,receipt,false);
});
for(const field of ['revision','generation','activeProfileId','persisted','testMode'])test(`verifyPersistedReceipt rejects mismatched ${field}`,async()=>{
 const {api,s}=await setup(),receipt=api.get();receipt[field]=field==='activeProfileId'?'slot-2':field==='persisted'?false:field==='testMode'?true:receipt[field]+1;assertReceiptProbeUnchanged(api,s,receipt,false);
});
test('verifyPersistedReceipt never refreshes or clears a dirty pending save',async()=>{
 const {api,s}=await setup(),receipt=api.get(),g=guards(api),write=s.setItem;s.setItem=()=>{throw Error('quota');};assert.equal((await api.savePreparation({...g,difficulty:'hard'},g)).persisted,false);assert.equal(api.get().dirty,true);assertReceiptProbeUnchanged(api,s,receipt,false);s.setItem=write;assert.equal((await api.retrySave()).persisted,true);
});
test('verifyPersistedReceipt rejects busy, read-only, uninitialized and preview stores',async()=>{
 const {api,s,l}=await setup(),receipt=api.get();api.enterTestMode();assertReceiptProbeUnchanged(api,s,receipt,false);api.exitTestMode();
 const readonly=await openChallengeProgress({storage:s});assertReceiptProbeUnchanged(readonly,s,readonly.get(),false);const empty=storage(),fresh=await openChallengeProgress({storage:empty,locks:l});assertReceiptProbeUnchanged(fresh,empty,fresh.get(),false);
 let release;const gate=new Promise(resolve=>release=resolve),delayed=await openChallengeProgress({storage:s,locks:{request:async(n,o,fn)=>{await gate;return l.request(n,o,fn);}}}),before=delayed.get(),g=guards(delayed),saving=delayed.savePreparation(g,g);assert.equal(delayed.get().busy,true);assertReceiptProbeUnchanged(delayed,s,before,false);release();await saving;
});
