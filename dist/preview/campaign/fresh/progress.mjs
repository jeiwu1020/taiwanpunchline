import {clone,currentProfile,deriveStats,MAX_SERIAL,integer,allowance} from '../core/model.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS,CHARACTER_IDS} from '../core/catalog.mjs?v=campaign-boot-20261112-r3';
import {startRun,applyRunAction,allocateSkill,resetSkills,prepareParty} from '../core/transition.mjs?v=campaign-boot-20261112-r3';
import {CHALLENGE_KEY,LEGACY_KEYS,BACKUP_FORMAT,SLOT_BACKUP_FORMAT,parse,newEnvelope,validateEnvelope,validateSlotBackup,legacyProjection} from './schema.mjs?v=campaign-boot-20261112-r3';
export {CHALLENGE_KEY};

/** A fresh campaign namespace. Opening is read-only; all writes require Web Locks. */
export async function openChallengeProgress({storage,locks,onChange=()=>{},onSaved=()=>{},key=CHALLENGE_KEY}={}){
 if(key!==CHALLENGE_KEY)throw new TypeError('Only the dedicated challenge key is supported');
 let state=newEnvelope(),baseRaw=null,lastObservedEnvelopeRaw=null,pending=null,blocked=false,reason=null,busy=0,testMode=false,modeEpoch=0,runEpoch=0,session=null,serial=0,preview=null;
 let tail=Promise.resolve();
 const canWrite=typeof storage?.getItem==='function'&&typeof storage?.setItem==='function'&&typeof locks?.request==='function';
 const availability=typeof storage?.getItem!=='function'||typeof storage?.setItem!=='function'?'storage-unavailable':typeof locks?.request!=='function'?'lock-unavailable':null;
 const instance=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const active=()=>state.activeProfileId;
 const generation=id=>state.slots[id??active()].generation;
 const reject=why=>({accepted:false,persisted:get().persisted,reason:why});
 function read(){
  let raw;try{if(typeof storage?.getItem!=='function')throw Error('storage-unavailable');raw=storage.getItem(key);}catch{blocked=true;reason='read-unavailable';return false;}
  lastObservedEnvelopeRaw=raw;
  const checked=raw===null?{ok:true,envelope:newEnvelope()}:validateEnvelope(parse(raw));
  if(!checked.ok){blocked=true;reason=checked.reason;return false;}
  if(raw!==baseRaw)session=null;
  state=checked.envelope;baseRaw=raw;blocked=false;reason=null;return true;
 }
 read();
 function readProfile(id=active()){return PROFILE_IDS.includes(id)?clone(state.campaign.profiles.find(p=>p.id===id)):null;}
 function get(){
  const persisted=!blocked&&!pending&&baseRaw!==null;
  return {revision:state.revision,generation:generation(),generations:Object.fromEntries(PROFILE_IDS.map(id=>[id,generation(id)])),activeProfileId:active(),profileId:active(),authority:'campaign',
   document:{version:1,activeProfileId:active(),profiles:state.campaign.profiles.map(legacyProjection)},campaignDocument:clone(state.campaign),initialized:baseRaw!==null,persisted,dirty:!!pending,busy:busy>0,readOnly:blocked||!canWrite,reason:reason??availability,storageIssue:reason,testMode};
 }
 function notify(){try{onChange(get());}catch{/* A view callback cannot affect a save outcome. */}}
 function notifySaved(){try{onSaved({persisted:true,profileId:active(),revision:state.revision,generation:generation()});}catch{/* A receipt observer cannot affect persistence. */}}
 function enqueue(work,options={}){
  options={...options};
  const profileId=options.profileId??active(),expectedGeneration=options.expectedGeneration??options.generation??state.slots[profileId]?.generation;
  const expectedRevision=options.expectedRevision??options.revision,operationEpoch=modeEpoch,operationRunEpoch=runEpoch;
  busy++;notify();
  const task=tail.then(async()=>{
   const preflight=()=>options.signal?.aborted||options.runOperation&&operationRunEpoch!==runEpoch?'cancelled':testMode||operationEpoch!==modeEpoch?'test-mode':null;
   const invalid=preflight();if(invalid)return reject(invalid);if(!canWrite)return reject(availability);if(blocked)return reject(reason??'unsupported-save');
   try{return await locks.request(`${key}:root-write`,{mode:'exclusive'},()=>{
    const invalid=preflight();if(invalid)return reject(invalid);
    if(pending&&!options.allowDirty)return reject('unsaved-progress');
    if(!pending&&!read())return reject(reason);
    if(expectedGeneration!==generation(profileId))return reject('stale-generation');
    if(expectedRevision!==undefined&&expectedRevision!==state.revision)return reject('stale-revision');
    if(!options.allowActiveChange&&profileId!==active())return reject('profile-changed');
    return work();
   });}catch{return reject('lock-failed');}
  });
  tail=task.catch(()=>{});return task.finally(()=>{busy--;notify();});
 }
 function compareRaw(expected){try{const observed=storage.getItem(key);lastObservedEnvelopeRaw=observed;return observed===expected?null:'save-conflict';}catch{return 'read-unavailable';}}
 function write(next,original=baseRaw){
  const checked=validateEnvelope(next);if(!checked.ok)return reject(checked.reason);
  const conflict=compareRaw(original);if(conflict)return reject(conflict);
  const wanted=JSON.stringify(checked.envelope);let writeFailed=false;
  try{storage.setItem(key,wanted);}catch{writeFailed=true;}
  state=checked.envelope;
  let observed;try{observed=storage.getItem(key);lastObservedEnvelopeRaw=observed;}catch{pending={wanted,base:original};reason='readback-unavailable';return {accepted:true,persisted:false,reason};}
  if(observed===wanted){baseRaw=wanted;pending=null;reason=null;notifySaved();return {accepted:true,persisted:true,reason:null};}
  pending={wanted,base:original};reason=writeFailed?'write-failed':'readback-mismatch';return {accepted:true,persisted:false,reason};
 }
 function withRevision(next){if(state.revision>=MAX_SERIAL)return null;next.revision=state.revision+1;next.campaign.activeProfileId=next.activeProfileId;return next;}
 function saveCampaign(result,{keepSession=false}={}){
  if(!result?.ok)return reject(result?.reason??'invalid-operation');
  const next=withRevision(clone(state));if(!next)return reject('revision-limit');next.campaign=result.document;
  const saved=write(next);if(saved.accepted&&!keepSession)session=null;
  return {...saved,...(result.rewardedXP!==undefined?{rewardedXP:result.rewardedXP}:{})};
 }
 function newToken(previous){return Object.freeze({runId:previous?.runId??`${instance}:${++serial}`,profileId:active(),generation:generation(),runGeneration:(previous?.runGeneration??-1)+1});}
 function installRun(result,saved,{rotate=true}={}){
  if(!saved.accepted)return saved;
  const token=rotate?newToken(session?.token):session.token;session={token,run:clone(result.run),revision:state.revision};
  return {...saved,token,run:clone(result.run)};
 }
 const validSession=token=>session?.token===token&&session.revision===state.revision&&token?.profileId===active()&&token.generation===generation();
 function preserveCarry(party,previousDocument=state.campaign){
  if(!party.ok)return party;const old=currentProfile(previousDocument),p=currentProfile(party.document);
  const oldMax=deriveStats(old,old.campaign.selection.characterId).maxHp,newMax=deriveStats(p,p.campaign.selection.characterId).maxHp;
  // Party selection and builds are shared by both modes. Rebase each retained
  // checkpoint from its own pre-edit value, never from the other mode or a
  // checkpoint already adjusted in this transaction.
  for(const carryKey of ['carry','replayCarry']){const carry=old.campaign[carryKey];if(carry){
   p.campaign[carryKey]={...clone(carry),hp:Math.min(carry.hp,newMax),assist:{...clone(carry.assist),helper:p.campaign.selection.helperId,damageTaken:oldMax===newMax?carry.assist.damageTaken:carry.assist.damageTaken*newMax/oldMax}};
  }}
  return party;
 }
 const prepared=draft=>preserveCarry(prepareParty(state.campaign,draft));
 const preparationGuards=options=>!integer(options?.expectedRevision??options?.revision)?'expected-revision-required':!integer(options?.expectedGeneration??options?.generation)?'expected-generation-required':null;
 function verifiedBackup(profileId){
  const backupKey=`${key}:backup:${profileId}:${state.revision}:${generation(profileId)}:${instance}:${++serial}`,text=api.exportSlotBackup(profileId);let failed=false;
  try{storage.setItem(backupKey,text);}catch{failed=true;}
  let observed;try{observed=storage.getItem(backupKey);}catch{return {ok:false,reason:'backup-readback-unavailable'};}
  return observed===text?{ok:true,backupKey}:{ok:false,reason:failed?'backup-write-failed':'backup-readback-mismatch'};
 }
 function replaceSlot(profileId,profile,options){
  const guardError=preparationGuards(options);if(guardError)return Promise.resolve(reject(guardError));
  return enqueue(()=>{
   if(generation(profileId)>=MAX_SERIAL||state.revision>=MAX_SERIAL||state.campaign.revision>=MAX_SERIAL)return reject('revision-limit');
   const next=withRevision(clone(state)),index=next.campaign.profiles.findIndex(p=>p.id===profileId);next.campaign.profiles[index]=clone(profile);next.campaign.revision++;next.slots[profileId].generation++;
   const valid=validateEnvelope(next);if(!valid.ok)return reject(valid.reason);
   const conflict=compareRaw(baseRaw);if(conflict)return reject(conflict);
   const backup=verifiedBackup(profileId);if(!backup.ok)return reject(backup.reason);
   if(options.signal?.aborted)return reject('cancelled');
   const saved=write(valid.envelope);if(saved.accepted)session=null;
   return {...saved,backupKey:backup.backupKey,profileId,generation:next.slots[profileId].generation};
  },{...options,profileId,allowActiveChange:true});
 }
 const api={
  get,readProfile,getCurrentProfile:()=>readProfile(),get activeProfileId(){return active();},get testMode(){return testMode;},
  // Read the durable bytes without refreshing state or consuming pending work.
  verifyPersistedReceipt(receipt){
   const saved=get();if(receipt?.persisted!==true||receipt.testMode!==false||!saved.persisted||saved.dirty||saved.busy||saved.readOnly||saved.reason||testMode||['revision','generation','activeProfileId'].some(key=>receipt[key]!==saved[key]))return false;
   try{return storage.getItem(key)===baseRaw;}catch{return false;}
  },
  canUse:id=>CHARACTER_IDS.includes(id)&&(testMode||readProfile().unlockedCharacters.includes(id)),availableCharacters:()=>CHARACTER_IDS.filter(id=>api.canUse(id)),
  progressContext:()=>Object.freeze({profileId:active(),generation:generation(),modeEpoch,testMode,recordProgress:!testMode,submitRanking:!testMode}),
  previewProfile:()=>testMode&&preview?clone(currentProfile(preview.document)):null,
  getChallengeStats:id=>deriveStats(api.previewProfile()??readProfile(),id),
  preparationSnapshot(){
   const p=api.previewProfile()??readProfile(),c=p.campaign,previewing=!!(testMode&&preview),revision=previewing?preview.sourceRevision:state.revision,gen=previewing?preview.sourceGeneration:generation();
   return {profileId:p.id,revision,expectedRevision:revision,generation:gen,expectedGeneration:gen,initialized:get().initialized,testMode,preview:previewing,
    ...(previewing?{previewRevision:preview.revision,expectedPreviewRevision:preview.revision,modeEpoch,expectedModeEpoch:modeEpoch}:{}),
    characterId:c.selection.characterId,helperId:c.selection.helperId,difficulty:c.difficulty??'easy',characters:clone(p.characters),allowance:allowance(c.xp),unlockedCharacters:[...p.unlockedCharacters]};
  },
  preparePreview(draft,options={}){
   options={...options};try{draft=clone(draft);}catch{return Promise.resolve({accepted:false,persisted:false,preview:true,reason:'invalid-preparation'});}
   const operationEpoch=modeEpoch,expectedPreviewRevision=options.expectedPreviewRevision??options.previewRevision,expectedModeEpoch=options.expectedModeEpoch??options.modeEpoch;
   const previewReject=reason=>({accepted:false,persisted:false,preview:true,reason});
   // No formal queue, locks, reads or writes: this is an isolated editable copy.
   // The microtask boundary also lets mode changes invalidate an outstanding UI confirmation.
   return Promise.resolve().then(()=>{
    if(!testMode||!preview)return previewReject('preview-inactive');
    if(operationEpoch!==modeEpoch||expectedModeEpoch!==modeEpoch)return previewReject('stale-preview-mode');
    if(options.signal?.aborted)return previewReject('cancelled');
    if(!integer(expectedPreviewRevision))return previewReject('expected-preview-revision-required');
    const invalid=preparationGuards(options);if(invalid)return previewReject(invalid);
    if(expectedPreviewRevision!==preview.revision)return previewReject('stale-preview-revision');
    if(options.profileId!==preview.document.activeProfileId)return previewReject('profile-changed');
    if(preview.sourceRevision!==state.revision||preview.sourceGeneration!==generation(preview.document.activeProfileId)||preview.document.activeProfileId!==active())return previewReject('preview-source-changed');
    if((options.expectedRevision??options.revision)!==preview.sourceRevision)return previewReject('stale-revision');
    if((options.expectedGeneration??options.generation)!==preview.sourceGeneration)return previewReject('stale-generation');
    if(preview.revision>=MAX_SERIAL)return previewReject('revision-limit');
    const result=preserveCarry(prepareParty(preview.document,draft),preview.document);if(!result.ok)return previewReject(result.reason);
    preview.document=result.document;preview.revision++;notify();
    return {accepted:true,persisted:false,reason:null,...api.preparationSnapshot()};
   });
  },
  savePreparation(draft,options={}){
   options={...options};try{draft=clone(draft);}catch{return Promise.resolve(reject('invalid-preparation'));}
   const invalid=preparationGuards(options);if(invalid)return Promise.resolve(reject(invalid));
   return enqueue(()=>session?reject('active-run'):saveCampaign(prepared(draft)),options);
  },
  prepareEncounter(draft,options={}){
   options={...options};try{draft=clone(draft);}catch{return Promise.resolve(reject('invalid-preparation'));}
   const invalid=preparationGuards(options);if(invalid)return Promise.resolve(reject(invalid));
   const intent=options.intent??(options.token?null:'resume');
   if(intent===null)return Promise.resolve(reject('explicit-intent-required'));
   if(!['start','resume','boundary','retry'].includes(intent)||options.token&&['start','resume'].includes(intent)||!options.token&&['boundary','retry'].includes(intent))return Promise.resolve(reject('invalid-intent'));
   return enqueue(()=>{
    if(options.token&&!validSession(options.token))return reject('stale-run');
    const replay=options.token?session.run.replay:options.replay===true,party=prepared(draft);if(!party.ok)return reject(party.reason);
    let result;
    if(intent==='boundary')result={...party,run:clone(session.run)};
    else if(intent==='retry'){
     result={...party,run:clone(session.run)};
     if(result.run.stepId==='boss-comic')result=applyRunAction(result.document,result.run,{type:'story-complete'});
     if(result.ok)result=applyRunAction(result.document,result.run,{type:'retry'});
    }else result=startRun(party.document,{replayChapterId:replay?(options.chapterId??'chapter-1'):null});
    if(!result.ok)return reject(result.reason);
    if(options.chapterId&&result.run.chapterId!==options.chapterId)return reject('chapter-mismatch');
    if(options.enterFirstRoute&&result.run.chapterId==='chapter-1'&&result.run.stepId==='entry')result=applyRunAction(result.document,result.run,{type:'story-complete'});
    if(!result.ok)return reject(result.reason);
    const saved=saveCampaign(result,{keepSession:true}),response=installRun(result,saved);if(!saved.accepted)return response;
    const c=currentProfile(result.document).campaign;return {...response,selection:clone(c.selection),difficulty:c.difficulty??'easy',carry:clone(c[replay?'replayCarry':'carry']??null)};
   },{...options,runOperation:true});
  },
  beginChallenge(options={}){options={...options};return enqueue(()=>{
   const wanted=options.chapterId??options.replayChapterId??readProfile().campaign.cursor.chapterId;
   const result=startRun(state.campaign,{replayChapterId:options.replay?wanted:options.replayChapterId??null});if(!result.ok)return reject(result.reason);if(result.run.chapterId!==wanted)return reject('chapter-mismatch');
   if(options.difficulty!==undefined){if(!['beginner','easy','hard'].includes(options.difficulty))return reject('invalid-difficulty');currentProfile(result.document).campaign.difficulty=options.difficulty;}
   return installRun(result,saveCampaign(result,{keepSession:true}));
  },{...options,runOperation:true});},
  dispatchChallenge(token,actions){let list;try{list=clone(Array.isArray(actions)?actions:[actions]);}catch{return Promise.resolve(reject('invalid-batch'));}return enqueue(()=>{
   if(!validSession(token))return reject('stale-run');if(list.length<1||list.length>100)return reject('invalid-batch');
   let document=clone(state.campaign),run=clone(session.run),rewardedXP=0;
   for(const action of list){const result=applyRunAction(document,run,action);if(!result.ok)return reject(result.reason);document=result.document;run=result.run;rewardedXP+=result.rewardedXP??0;}
   const previous=session.run,rotate=previous.chapterId!==run.chapterId||previous.stepId!==run.stepId||previous.attemptId!==run.attemptId||previous.finished!==run.finished||list.some(a=>a.type==='retry');
   const result={ok:true,document,run,rewardedXP};return installRun(result,saveCampaign(result,{keepSession:true}),{rotate});
  },{profileId:token?.profileId??active(),expectedGeneration:token?.generation,runOperation:true});},
  selectProfile(id){if(!PROFILE_IDS.includes(id))return Promise.resolve(reject('invalid-profile'));return enqueue(()=>{
   if(state.campaign.revision>=MAX_SERIAL)return reject('revision-limit');const next=withRevision(clone(state));if(!next)return reject('revision-limit');next.activeProfileId=id;next.campaign.activeProfileId=id;next.campaign.revision++;const saved=write(next);if(saved.accepted)session=null;return saved;
  },{profileId:id,allowActiveChange:true});},
  allocate(id,skill,options={}){return enqueue(()=>session?reject('active-run'):saveCampaign(preserveCarry(allocateSkill(state.campaign,id,skill))),options);},
  reset(id,options={}){return enqueue(()=>session?reject('active-run'):saveCampaign(preserveCarry(resetSkills(state.campaign,id))),options);},
  selectCharacters(selection,options={}){selection={...selection};return enqueue(()=>{if(session)return reject('active-run');const d=api.preparationSnapshot();return saveCampaign(prepared({...d,...selection}));},options);},
  cancelRun(){runEpoch++;session=null;},
  enterTestMode(){
   if(!DEVELOPMENT_TOOLS)return false;
   modeEpoch++;session=null;testMode=true;preview={document:clone(state.campaign),revision:0,sourceRevision:state.revision,sourceGeneration:generation()};
   currentProfile(preview.document).unlockedCharacters=[...CHARACTER_IDS];notify();return true;
  },
  exitTestMode(){modeEpoch++;session=null;testMode=false;preview=null;notify();return true;},
  async refresh({discardPending=false}={}){await tail;if(pending&&!discardPending)return reject('unsaved-progress');if(discardPending){pending=null;session=null;}const ok=read();notify();return ok?{accepted:true,persisted:get().persisted}:reject(reason);},
  retrySave(){return enqueue(()=>{
   if(!pending)return reject('not-dirty');let observed;try{observed=storage.getItem(key);lastObservedEnvelopeRaw=observed;}catch{return reject('read-unavailable');}
   if(observed===pending.wanted){baseRaw=observed;pending=null;reason=null;notifySaved();return {accepted:true,persisted:true,reason:null};}
   if(observed!==pending.base)return reject('save-conflict');return write(state,pending.base);
  },{allowDirty:true,allowActiveChange:true});},
  exportBackup(){return JSON.stringify({format:BACKUP_FORMAT,version:4,scope:'all',envelope:clone(state),lastObservedEnvelopeRaw,persisted:get().persisted},null,2);},
  exportSlotBackup(profileId=active()){
   if(!PROFILE_IDS.includes(profileId)||blocked)return null;
   return JSON.stringify({format:SLOT_BACKUP_FORMAT,version:4,scope:'slot',profileId,revision:state.revision,generation:generation(profileId),profile:readProfile(profileId),persisted:get().persisted},null,2);
  },
  inspectSlotBackup(text){const checked=validateSlotBackup(parse(text));if(!checked.ok)return checked;const b=checked.backup,c=b.profile.campaign;return {ok:true,profileId:b.profileId,revision:b.revision,generation:b.generation,persisted:b.persisted,xp:c.xp,chapterId:c.cursor.chapterId,stepId:c.cursor.stepId,selection:clone(c.selection),unlockedCharacters:[...b.profile.unlockedCharacters]};},
  resetProfile(profileId,options={}){if(!PROFILE_IDS.includes(profileId))return Promise.resolve(reject('invalid-profile'));return replaceSlot(profileId,newEnvelope().campaign.profiles.find(p=>p.id===profileId),options);},
  importSlotBackup(text,options={}){
   const checked=validateSlotBackup(parse(text));if(!checked.ok)return Promise.resolve(reject(checked.reason));
   if(!PROFILE_IDS.includes(options.profileId))return Promise.resolve(reject('invalid-profile'));if(checked.backup.profileId!==options.profileId)return Promise.resolve(reject('slot-mismatch'));
   return replaceSlot(options.profileId,checked.backup.profile,options);
  },
  /** Legacy reads happen only when the user explicitly asks to export them. */
  exportLegacyBackup(){const raw={};for(const name of LEGACY_KEYS){try{raw[name]=storage?.getItem?.(name)??null;}catch{return {ok:false,reason:'read-unavailable'};}}return JSON.stringify({format:'taiwanpunchline-legacy-archive',version:4,scope:'legacy-read-only',raw},null,2);},
  importBackup:()=>Promise.resolve(reject('explicit-slot-import-required')),
  campaignStore(){return {
   get:()=>{const s=get();return {document:s.campaignDocument,persisted:s.persisted,initialized:s.initialized,dirty:s.dirty,reason:s.reason,readOnly:s.readOnly,source:'v4',testMode:s.testMode};},
   beginRun:options=>api.beginChallenge(options),dispatch:(token,action)=>api.dispatchChallenge(token,action),selectProfile:api.selectProfile,selectCharacters:api.selectCharacters,
   allocate(id,skill,options={}){if(options.expectedRevision!==undefined&&options.expectedRevision!==state.campaign.revision)return Promise.resolve(reject('stale-revision'));return api.allocate(id,skill,{...options,...(options.expectedRevision!==undefined?{expectedRevision:state.revision}:{})});},
   reset(id,options={}){if(options.expectedRevision!==undefined&&options.expectedRevision!==state.campaign.revision)return Promise.resolve(reject('stale-revision'));return api.reset(id,{...options,...(options.expectedRevision!==undefined?{expectedRevision:state.revision}:{})});},
   cancelRun:api.cancelRun,retrySave:api.retrySave,exportJSON:api.exportBackup,exportLegacyJSON:api.exportLegacyBackup,enterTestMode:api.enterTestMode,exitTestMode:api.exitTestMode,
  };}
 };
 return api;
}
import {DEVELOPMENT_TOOLS} from '../../../release-features.mjs';
