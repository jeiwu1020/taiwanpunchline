import {clone,newDocument,currentProfile,deriveStats,validateDocument,MAX_SERIAL,integer,allowance,normalizeCarry} from '../core/model.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS,CHARACTER_IDS} from '../core/catalog.mjs?v=campaign-boot-20261112-r3';
import {startRun,applyRunAction,chooseCharacters,allocateSkill,resetSkills,prepareParty} from '../core/transition.mjs?v=campaign-boot-20261112-r3';
import {createChallengeProgress} from '../../../challenge-progress.mjs?v=campaign-boot-20261112-r3';
import {newProfileDocument} from '../../../profile-progress.mjs?v=campaign-boot-20261112-r3';
import {UNIFIED_KEY,LEGACY_KEY,CAMPAIGN_KEY,SEED_KEY,parse,legacyDocument,legacySlot,legacyProjection,newEnvelope,validateEnvelope,adoptionInfo,sourceBundle,MAX_ENVELOPE_LENGTH} from './schema.mjs?v=campaign-boot-20261112-r3';
export {UNIFIED_KEY,LEGACY_KEY,CAMPAIGN_KEY};
/** No globals, eager write, automatic adoption, deletion or original-key rewrite. */
export async function openUnifiedProgress({storage,locks,onChange=()=>{},key=UNIFIED_KEY}={}){
 if(key!==UNIFIED_KEY)throw new TypeError('Only the dedicated unified key is supported');
 let raws={legacyRaw:null,campaignRaw:null,seedRaw:null},state=null,baseRaw=null,lastObservedEnvelopeRaw=null,pending=null,reason=null,blocked=false,busy=0,testMode=false,session=null,serial=0,modeEpoch=0;
 let tail=Promise.resolve();const canWrite=!!storage?.getItem&&!!storage?.setItem&&!!locks?.request;
 const instance=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
 const reject=why=>({accepted:false,persisted:get().persisted,reason:why});
 const readRaws=()=>({legacyRaw:storage?.getItem?.(LEGACY_KEY)??null,campaignRaw:storage?.getItem?.(CAMPAIGN_KEY)??null,seedRaw:storage?.getItem?.(SEED_KEY)??null});
 function read(){
  try{const raw=storage?.getItem?.(key)??null,newRaws=readRaws();lastObservedEnvelopeRaw=raw;raws=newRaws;
   if(raw!==null){const checked=validateEnvelope(parse(raw));if(!checked.ok){blocked=true;reason=checked.reason;return false;}state=checked.envelope;}
   else state=newEnvelope(newRaws);
   if(baseRaw!==raw)session=null;baseRaw=raw;raws=newRaws;blocked=false;reason=null;return true;
  }catch{blocked=true;reason='read-unavailable';return false;}
 }
 read();state??=newEnvelope(raws);
 const active=()=>state.activeProfileId;
 const authority=(id=active())=>state.slots[id]?.authority??'legacy';
 function readProfile(id=active()){
  if(!PROFILE_IDS.includes(id))return null;
  return authority(id)==='campaign'?clone(state.campaign.profiles.find(p=>p.id===id)):clone(legacyDocument(raws.legacyRaw)?.profiles.find(p=>p.id===id)??null);
 }
 function get(){
  const id=active(),document=legacyDocument(raws.legacyRaw)??newProfileDocument();
  document.activeProfileId=id;document.profiles=PROFILE_IDS.map(pid=>legacyProjection(readProfile(pid))??document.profiles.find(p=>p.id===pid));
  const sourceValidity=authority()==='campaign'?{ok:true}:legacySlot(raws.legacyRaw,id);
  const persisted=!blocked&&sourceValidity.ok&&!pending&&(baseRaw!==null||raws.legacyRaw!==null);
  return {revision:state.revision,activeProfileId:id,profileId:id,authority:authority(),document,campaignDocument:clone(state.campaign),persisted,dirty:!!pending,busy:busy>0,readOnly:blocked||!canWrite||!sourceValidity.ok,reason:reason??(!sourceValidity.ok?sourceValidity.reason:!canWrite?'lock-unavailable':null),storageIssue:reason??(!sourceValidity.ok?sourceValidity.reason:null),testMode};
 }
 const notify=()=>{try{onChange(get());}catch{/* View code cannot change transaction outcome. */}};
 function enqueue(work,{profileId=active(),expectedRevision,allowActiveChange=false,allowDirty=false}={}){
  const operationEpoch=modeEpoch;busy++;notify();const task=tail.then(async()=>{
   if(testMode||operationEpoch!==modeEpoch)return reject('test-mode');if(!canWrite)return reject(!locks?.request?'lock-unavailable':'storage-unavailable');if(blocked)return reject(reason??'unsupported-save');
   try{return await locks.request(`${key}:root-write`,{mode:'exclusive'},async()=>{
    if(testMode||operationEpoch!==modeEpoch)return reject('test-mode');if(pending&&!allowDirty)return reject('unsaved-progress');
    if(!pending){const before=baseRaw;if(!read())return reject(reason);if(before!==baseRaw&&expectedRevision===undefined&&session)session=null;}
    if(expectedRevision!==undefined&&expectedRevision!==state.revision)return reject('stale-revision');
    if(!allowActiveChange&&profileId!==active())return reject('profile-changed');
    return await work();
   });}catch{return reject('lock-failed');}
  });tail=task.catch(()=>{});return task.finally(()=>{busy--;notify();});
 }
 function writeRaw(target,wanted,original,guards={v3Raw:baseRaw}){
  let failed=false;try{storage.setItem(target,wanted);}catch{failed=true;}
  let observed;try{observed=storage.getItem(target);}catch{pending={key:target,wanted,base:original,guards};reason='readback-unavailable';return {accepted:true,persisted:false,reason};}
  if(target===key)lastObservedEnvelopeRaw=observed;
  if(observed===wanted){pending=null;reason=null;if(target===key)baseRaw=wanted;else raws.legacyRaw=wanted;return {accepted:true,persisted:true,reason:null};}
  pending={key:target,wanted,base:original,guards};reason=failed?'write-failed':'readback-mismatch';return {accepted:true,persisted:false,reason};
 }
 function save(next,guards){
  const checked=validateEnvelope(next);if(!checked.ok)return reject(checked.reason);
  state=checked.envelope;const wanted=JSON.stringify(state);
  if(pending){if(pending.key!==key)return reject('unsaved-legacy-progress');pending.wanted=wanted;return {accepted:true,persisted:false,reason:reason??'unsaved-progress'};}
  return writeRaw(key,wanted,baseRaw,guards);
 }
 function changed(next){if(state.revision>=MAX_SERIAL)return null;next.revision=state.revision+1;next.campaign.activeProfileId=next.activeProfileId;return next;}
 function applyCampaign(operation,{keepSession=false}={}){
  if(authority()!=='campaign')return reject('adoption-required');
  const result=operation(clone(state.campaign));if(!result?.ok)return reject(result?.reason??'invalid-operation');
  const next=changed(clone(state));if(!next)return reject('revision-limit');next.campaign=result.document;
  const saved=save(next);if(!saved.accepted)return saved;if(!keepSession)session=null;
  return {...saved,...(result.rewardedXP!==undefined?{rewardedXP:result.rewardedXP}:{})};
 }
 function updateLegacyNow(updater,context){
  if(authority()!=='legacy')return reject('campaign-authority');
  if(context?.testMode||context?.recordProgress===false||context?.profileId&&context.profileId!==active())return reject('profile-changed');
  let latest;try{latest=pending?.key===LEGACY_KEY?pending.wanted:storage.getItem(LEGACY_KEY);}catch{return reject('read-unavailable');}
  if(context?.expectedLegacyRaw!==undefined&&context.expectedLegacyRaw!==latest)return reject('source-changed');
  const d=legacyDocument(latest);if(!d)return reject('unsupported-legacy-save');
  const p=d.profiles.find(p=>p.id===active()),id=p.id;let outcome;
  if(context?.expectedLegacyProfile!=null&&context.expectedLegacyProfile!==JSON.stringify(p))return reject('source-changed');
  try{outcome=updater(p);}catch{return reject('invalid-legacy-update');}
  if(outcome===false||p.id!==id)return reject('invalid-legacy-update');
  if(!legacySlot(JSON.stringify(d),id).ok)return reject('invalid-legacy-update');
  // Preserve every other profile, root extension, and target extension exactly as read.
  const raw=JSON.stringify(d);
  if(pending?.key===LEGACY_KEY){raws.legacyRaw=raw;pending.wanted=raw;return {accepted:true,persisted:false,reason};}
  if(storage.getItem(LEGACY_KEY)!==latest)return reject('source-changed');
  raws.legacyRaw=raw;session=null;return writeRaw(LEGACY_KEY,raw,latest);
 }
 function legacyCommandNow(name,args={}){
  const id=active(),source=legacySlot(raws.legacyRaw,id);if(!source.ok)return reject(source.reason);
  const doc=newProfileDocument();doc.activeProfileId=id;const clean=legacyProjection(source.profile);clean.challenge=clone(source.legacyProfile.challenge);doc.profiles[PROFILE_IDS.indexOf(id)]=clean;
  const profiles={get:()=>({document:doc,persisted:true}),getCurrentProfile:()=>clone(doc.profiles[PROFILE_IDS.indexOf(id)]),canUse:char=>doc.profiles[PROFILE_IDS.indexOf(id)].unlockedCharacters.includes(char),testMode:false,progressContext:()=>({profileId:id,testMode:false,recordProgress:true}),updateCurrentProfile(fn){const p=doc.profiles[PROFILE_IDS.indexOf(id)];return fn(p)!==false;}};
  if(args.context?.expectedLegacyProfile!=null&&args.context.expectedLegacyProfile!==JSON.stringify(source.legacyProfile))return reject('source-changed');
  const alreadyRewarded=name==='rewardEncounter'&&args.attemptId===undefined&&source.legacyProfile.challenge.rewards?.includes(`chapter-1:${args.encounterId}`);
  const command=createChallengeProgress({profiles});if(!['allocate','reset','rewardEncounter','beginRouteAttempt'].includes(name))return reject('invalid-command');
  const value=alreadyRewarded?true:name==='allocate'?command.allocate(args.id,args.skill):name==='reset'?command.reset(args.id):command[name](args);
  if(value===false||value===null)return reject('invalid-operation');
  const prepared=doc.profiles[PROFILE_IDS.indexOf(id)];if(args.carry!==undefined)prepared.challenge[args.replay?'replayCarry':'carry']=normalizeCarry(args.carry);
  if(args.nextAttempt!==undefined){const nextAttempt=command.beginRouteAttempt({checkpoint:args.nextAttempt,restart:true});if(nextAttempt===null)return reject('invalid-operation');}
  const result=updateLegacyNow(p=>{const next=doc.profiles[PROFILE_IDS.indexOf(id)];p.characters=next.characters;p.challenge=next.challenge;p.unlockedCharacters=next.unlockedCharacters;},{...args.context,expectedLegacyRaw:raws.legacyRaw});
  return {...result,value};
 }
 const api={
  get,readProfile,getCurrentProfile:()=>readProfile(),get activeProfileId(){return active();},get testMode(){return testMode;},
  canUse:id=>CHARACTER_IDS.includes(id)&&(testMode||!!readProfile()?.unlockedCharacters.includes(id)),
  availableCharacters:()=>CHARACTER_IDS.filter(id=>api.canUse(id)),
  progressContext:()=>Object.freeze({profileId:active(),testMode,recordProgress:!testMode,submitRanking:!testMode}),
  getChallengeStats(id,base={}){let p=readProfile();if(!p?.campaign){const migrated=legacySlot(raws.legacyRaw,active());p=migrated.ok?migrated.profile:newDocument().profiles[0];}const stats=deriveStats(p,id);if(base.maxHp!==undefined)stats.maxHp*=base.maxHp/100;return stats;},
  inspectAdoption(id=active()){if(!PROFILE_IDS.includes(id))return {reason:'invalid-profile',choices:[]};return {...adoptionInfo(raws,id),alreadyAdopted:authority(id)==='campaign',revision:state.revision};},
  adoptProfile(id,{source,expectedRevision,evidence}={}){
   if(!PROFILE_IDS.includes(id))return Promise.resolve(reject('invalid-profile'));
   if(!integer(expectedRevision)||!evidence)return Promise.resolve(reject('choice-evidence-required'));
   const adoptionEpoch=modeEpoch;return enqueue(async()=>locks.request(`${CAMPAIGN_KEY}:root-write`,{mode:'exclusive'},async()=>{
    if(testMode||adoptionEpoch!==modeEpoch)return reject('test-mode');
    if(authority(id)==='campaign')return reject('already-adopted');
    const current=readRaws();if(JSON.stringify(sourceBundle(current))!==JSON.stringify(evidence))return reject('source-changed');
    const info=adoptionInfo(current,id);if(!info.choices.includes(source))return reject(source?'invalid-source-choice':info.reason);
    const selected=source==='campaign'?validateDocument(parse(current.campaignRaw)).document.profiles.find(p=>p.id===id):legacySlot(current.legacyRaw,id).profile;
    const next=changed(clone(state));if(!next)return reject('revision-limit');
    next.campaign.profiles[PROFILE_IDS.indexOf(id)]=clone(selected);next.campaign.revision++;next.slots[id]={authority:'campaign',source:{kind:source,...sourceBundle(current),reason:info.reason}};
    if(baseRaw===null)next.originals=sourceBundle(current);
    if(JSON.stringify(readRaws())!==JSON.stringify(current))return reject('source-changed');
    session=null;return save(next,{sources:current,v3Raw:baseRaw});
   }),{expectedRevision,allowActiveChange:true});
  },
  selectProfile(id){if(!PROFILE_IDS.includes(id))return Promise.resolve(reject('invalid-profile'));return enqueue(()=>{
   session=null;testMode=false;
   if(baseRaw===null){const latest=storage.getItem(LEGACY_KEY),doc=legacyDocument(latest);if(!doc)return reject('unsupported-legacy-save');if(storage.getItem(LEGACY_KEY)!==latest)return reject('source-changed');doc.activeProfileId=id;state.activeProfileId=id;state.campaign.activeProfileId=id;raws.legacyRaw=JSON.stringify(doc);return writeRaw(LEGACY_KEY,raws.legacyRaw,latest);}
   const next=changed(clone(state));if(!next)return reject('revision-limit');next.activeProfileId=id;next.campaign.activeProfileId=id;next.campaign.revision++;return save(next);
  },{allowActiveChange:true});},
  allocate(id,skill,options={}){return enqueue(()=>authority()==='campaign'?applyCampaign(d=>allocateSkill(d,id,skill)):legacyCommandNow('allocate',{id,skill}),options);},
  reset(id,options={}){return enqueue(()=>authority()==='campaign'?applyCampaign(d=>resetSkills(d,id)):legacyCommandNow('reset',{id}),options);},
  selectCharacters(selection,options={}){return enqueue(()=>authority()==='campaign'?applyCampaign(d=>chooseCharacters(d,selection)):reject('adoption-required'),options);},
  updateLegacyProfile(updater,context){return enqueue(()=>updateLegacyNow(updater,context));},
  legacyCommand(name,args={}){return enqueue(()=>authority()==='legacy'?legacyCommandNow(name,args):reject('campaign-authority'),{allowDirty:true,profileId:args.context?.profileId??active()});},
  preparationSnapshot(){const p=readProfile(),c=p?.campaign??p?.challenge??{};return {profileId:active(),revision:state.revision,expectedRevision:state.revision,...(authority()==='legacy'?{expectedLegacyProfile:JSON.stringify(p)}:{}),characterId:c.selection?.characterId??'wang',helperId:c.selection?.helperId??'han',difficulty:c.difficulty??'easy',characters:clone(p?.characters??{}),allowance:allowance(c.xp??0),unlockedCharacters:[...(p?.unlockedCharacters??[])]};},
  prepareEncounter(draft,options={}){return enqueue(()=>{
   if(!integer(options.expectedRevision??options.revision))return reject('expected-revision-required');
   if(authority()==='legacy'){
    if(typeof options.expectedLegacyProfile!=='string')return reject('source-evidence-required');
    const source=legacySlot(raws.legacyRaw,active());if(!source.ok)return reject(source.reason);
    const d=newDocument();d.activeProfileId=active();d.profiles[PROFILE_IDS.indexOf(active())]=source.profile;
    const party=prepareParty(d,draft);if(!party.ok)return reject(party.reason);
    const p=party.document.profiles[PROFILE_IDS.indexOf(active())],checkpoint=options.checkpoint??(options.replay?0:Math.min(6,source.legacyProfile.challenge.checkpoint??0));
    if(!integer(checkpoint,0,6))return reject('invalid-checkpoint');
    let attemptId=null;const carryKey=options.replay?'replayCarry':'carry';
    const saved=updateLegacyNow(target=>{const c=Object.keys(target.challenge).length?target.challenge:{version:1,xp:0,checkpoint:0,completed:false,rewards:[],attemptSerial:0,routeAttempt:null};
     if((c.encounterSerial??0)>=MAX_SERIAL)return false;c.encounterSerial=(c.encounterSerial??0)+1;
     target.characters=p.characters;c.selection=clone(p.campaign.selection);c.difficulty=draft.difficulty;if(options.resetCarry!==false||options.replay&&options.checkpoint===undefined)c[carryKey]=null;
     if([0,2,4].includes(checkpoint)){if((c.attemptSerial??0)>=MAX_SERIAL)return false;attemptId=(c.attemptSerial??0)+1;c.attemptSerial=attemptId;c.routeAttempt={id:attemptId,checkpoint};c.rewards=c.rewards.filter(x=>!x.startsWith('chapter-1:mob-attempt:'));}
     target.challenge=c;
    },{profileId:options.profileId??active(),expectedLegacyProfile:options.expectedLegacyProfile});
    return {...saved,attemptId,checkpoint,selection:clone(p.campaign.selection),difficulty:draft.difficulty,carry:clone(readProfile()?.challenge?.[carryKey]??null)};
   }
   if(options.token&&(!session||session.token!==options.token||session.revision!==state.revision))return reject('stale-run');
   const party=prepareParty(state.campaign,draft);if(!party.ok)return reject(party.reason);
   const c=currentProfile(party.document).campaign,carryKey=(options.token?session.run.replay:options.replay)?'replayCarry':'carry';if(options.resetCarry!==false)c[carryKey]=null;
   let result;
   if(options.token)result=applyRunAction(party.document,session.run,{type:'retry'});
   else result=startRun(party.document,{replayChapterId:options.replay?(options.chapterId??'chapter-1'):null});
   if(!result.ok&&options.token&&result.reason==='invalid-retry')result={ok:true,document:party.document,run:clone(session.run)};
   if(!result.ok)return reject(result.reason);
   if(options.enterFirstRoute&&result.run.chapterId==='chapter-1'&&result.run.stepId==='entry'){result=applyRunAction(result.document,result.run,{type:'story-complete'});if(!result.ok)return reject(result.reason);}
   const saved=applyCampaign(()=>result,{keepSession:true});if(!saved.accepted)return saved;
   const token=Object.freeze({runId:`${instance}:${++serial}`,profileId:active(),generation:0});session={token,run:result.run,revision:state.revision};
   return {...saved,token,run:clone(result.run),selection:clone(c.selection),difficulty:c.difficulty,carry:clone(currentProfile(result.document).campaign[carryKey]??null)};
  },{profileId:options.profileId??active(),expectedRevision:options.expectedRevision??options.revision});},
  beginChallenge(options={}){return enqueue(()=>{
   if(authority()!=='campaign')return reject('adoption-required');
   const wanted=options.chapterId??options.replayChapterId??state.campaign.profiles.find(p=>p.id===active()).campaign.cursor.chapterId;
   if(['chapter-5','finale-3v4'].includes(wanted))return reject('content-locked');
   const result=startRun(state.campaign,{replayChapterId:options.replay? wanted:options.replayChapterId??null});
   if(!result.ok)return reject(result.reason);if(options.difficulty!==undefined){if(!['beginner','easy','hard'].includes(options.difficulty))return reject('invalid-difficulty');currentProfile(result.document).campaign.difficulty=options.difficulty;}if(result.run.chapterId!==wanted)return reject('chapter-mismatch');
   const saved=applyCampaign(()=>result,{keepSession:true});if(!saved.accepted)return saved;
   const token=Object.freeze({runId:`${instance}:${++serial}`,profileId:active(),generation:0});session={token,run:result.run,revision:state.revision};return {...saved,token,run:clone(result.run)};
  },{profileId:options.profileId??active(),expectedRevision:options.expectedRevision});},
  dispatchChallenge(token,actions){const list=Array.isArray(actions)?actions:[actions];return enqueue(()=>{
   if(!session||session.token!==token||session.revision!==state.revision)return reject('stale-run');
   if(list.length<1||list.length>100)return reject('invalid-batch');
   let doc=clone(state.campaign),run=clone(session.run),rewardedXP=0;
   for(const action of list){const r=applyRunAction(doc,run,action);if(!r.ok)return reject(r.reason);doc=r.document;run=r.run;rewardedXP+=r.rewardedXP??0;}
   const saved=applyCampaign(()=>({ok:true,document:doc,rewardedXP}),{keepSession:true});if(!saved.accepted)return saved;
   const previous=session.run;if(previous.stepId!==run.stepId||previous.chapterId!==run.chapterId||previous.attemptId!==run.attemptId||previous.finished!==run.finished||list.some(a=>a.type==='retry'))session.token=Object.freeze({...session.token,generation:session.token.generation+1});
   session.run=run;session.revision=state.revision;return {...saved,token:session.token,run:clone(run),rewardedXP};
  },{allowDirty:true});},
  cancelRun(){session=null;},
  enterTestMode(){modeEpoch++;session=null;testMode=true;notify();return true;},exitTestMode(){modeEpoch++;session=null;testMode=false;notify();return true;},
  async refresh(){await tail;if(pending)return reject('unsaved-progress');const success=read();notify();return success?{accepted:true,persisted:get().persisted}:reject(reason);},
  retrySave(){return enqueue(()=>{
   if(!pending)return reject('not-dirty');const current=storage.getItem(pending.key);
   if(pending.key===LEGACY_KEY&&storage.getItem(key)!==pending.guards?.v3Raw)return reject('authority-changed');
   if(current!==pending.base&&current!==pending.wanted)return reject('save-conflict');
   if(current===pending.wanted){if(pending.key===key){baseRaw=current;lastObservedEnvelopeRaw=current;}else raws.legacyRaw=current;pending=null;reason=null;return {accepted:true,persisted:true,reason:null};}
   if(pending.guards?.sources&&JSON.stringify(readRaws())!==JSON.stringify(pending.guards.sources))return reject('source-changed');
   return writeRaw(pending.key,pending.wanted,pending.base,pending.guards);
  },{allowDirty:true,allowActiveChange:true});},
  exportBackup(){return JSON.stringify({format:'taiwanpunchline-unified-backup',version:3,envelope:state,...sourceBundle(raws),lastObservedEnvelopeRaw,persisted:get().persisted},null,2);},
  importBackup(text,{expectedRevision,adoptLegacySlots=false,adoptCampaignSlots=false}={}){
   if(!integer(expectedRevision))return Promise.resolve(reject('expected-revision-required'));
   let backup=parse(text);
   if(backup?.version===1){
    if(!adoptLegacySlots)return Promise.resolve(reject('explicit-legacy-import-required'));
    const origin={legacyRaw:text,campaignRaw:null,seedRaw:null},envelope=newEnvelope(origin);
    for(const id of PROFILE_IDS){const m=legacySlot(text,id);if(!m.ok)return Promise.resolve(reject(m.reason));envelope.campaign.profiles[PROFILE_IDS.indexOf(id)]=m.profile;envelope.slots[id]={authority:'campaign',source:{kind:'legacy',...origin,reason:'explicit-legacy-import'}};}
    backup={format:'taiwanpunchline-unified-backup',version:3,envelope,...origin};
   }
   if(backup?.version===2){
    if(!adoptCampaignSlots)return Promise.resolve(reject('explicit-campaign-import-required'));
    const checked=validateDocument(backup);if(!checked.ok)return Promise.resolve(reject(checked.reason));
    const origin={legacyRaw:null,campaignRaw:text,seedRaw:null},envelope=newEnvelope(origin);
    for(const id of PROFILE_IDS)envelope.slots[id]={authority:'campaign',source:{kind:'campaign',...origin,reason:'explicit-campaign-import'}};
    backup={format:'taiwanpunchline-unified-backup',version:3,envelope,...origin};
   }
   const checked=validateEnvelope(backup?.envelope);
   if(backup?.format!=='taiwanpunchline-unified-backup'||backup.version!==3||!checked.ok||!legacyDocument(backup.legacyRaw)||JSON.stringify(backup).length>MAX_ENVELOPE_LENGTH)return Promise.resolve(reject('invalid-backup'));
   return enqueue(()=>{
    const incoming=checked.envelope,hasLegacy=PROFILE_IDS.some(id=>incoming.slots[id].authority==='legacy');
    if(hasLegacy&&backup.legacyRaw!==raws.legacyRaw&&!adoptLegacySlots)return reject('legacy-source-conflict');
    if(adoptLegacySlots)for(const id of PROFILE_IDS){if(incoming.slots[id].authority==='legacy'){const m=legacySlot(backup.legacyRaw,id);if(!m.ok)return reject(m.reason);incoming.campaign.profiles[PROFILE_IDS.indexOf(id)]=m.profile;incoming.slots[id]={authority:'campaign',source:{kind:'backup',legacyRaw:backup.legacyRaw,campaignRaw:backup.campaignRaw,seedRaw:backup.seedRaw,reason:'explicit-backup-restore'}};}}
    const next=changed(incoming);if(!next)return reject('revision-limit');next.campaign.revision=Math.max(state.campaign.revision,incoming.campaign.revision)+1;
    const valid=validateEnvelope(next);if(!valid.ok)return reject(valid.reason);
    const backupKey=`${key}:backup:${state.revision}:${instance}:${++serial}`,previous=api.exportBackup();
    try{storage.setItem(backupKey,previous);if(storage.getItem(backupKey)!==previous)return reject('backup-readback-mismatch');}catch{return reject('backup-write-failed');}
    // Compare again after the backup, not just when the operation entered its lock.
    if(storage.getItem(key)!==baseRaw)return reject('save-conflict');
    if(hasLegacy&&!adoptLegacySlots&&storage.getItem(LEGACY_KEY)!==backup.legacyRaw)return reject('source-changed');
    session=null;return {...save(valid.envelope,hasLegacy&&!adoptLegacySlots?{sources:readRaws(),v3Raw:baseRaw}:{v3Raw:baseRaw}),backupKey};
   },{expectedRevision,allowActiveChange:true});
  },
  campaignStore(){const revisionOptions=options=>{if(options?.expectedRevision===undefined)return {};if(options.expectedRevision!==state.campaign.revision)return null;return {expectedRevision:state.revision};};return {
   get:()=>{const s=get();return {document:s.campaignDocument,persisted:s.persisted,dirty:s.dirty,reason:s.reason,readOnly:s.readOnly||authority()!=='campaign',source:'v3',testMode:s.testMode};},
   beginRun:options=>api.beginChallenge(options),dispatch:(token,action)=>api.dispatchChallenge(token,action),selectProfile:api.selectProfile,selectCharacters:api.selectCharacters,
   allocate(id,skill,options){const mapped=revisionOptions(options);return mapped?api.allocate(id,skill,mapped):Promise.resolve(reject('stale-revision'));},
   reset(id,options){const mapped=revisionOptions(options);return mapped?api.reset(id,mapped):Promise.resolve(reject('stale-revision'));},cancelRun:api.cancelRun,
   retrySave:api.retrySave,exportJSON:api.exportBackup,exportLegacyJSON:()=>raws.legacyRaw,enterTestMode:api.enterTestMode,exitTestMode:api.exitTestMode,
  };}
 };
 return api;
}
