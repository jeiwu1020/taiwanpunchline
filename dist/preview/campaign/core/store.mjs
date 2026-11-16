import {clone,newDocument,validateDocument,currentProfile,integer,MAX_SERIAL,MAX_JSON_LENGTH} from './model.mjs?v=chapter-presentation-20261117-r1';
import {PROFILE_IDS} from './catalog.mjs?v=campaign-boot-20261112-r3';
import {migrateV1} from './migrate.mjs?v=chapter-presentation-20261117-r1';
import {startRun,applyRunAction,chooseCharacters,allocateSkill,resetSkills} from './transition.mjs?v=chapter-presentation-20261117-r1';
// Candidate defaults never name the live game's keys. Integration must be explicit.
export const CURRENT_KEY='taiwanpunchline-progress-candidate-v2';
export const LEGACY_KEY='taiwanpunchline-progress-candidate-v1';
const parse=text=>{if(typeof text!=='string'||text.length>MAX_JSON_LENGTH)return {ok:false,reason:'invalid-json-size'};try{return {ok:true,value:JSON.parse(text)};}catch{return {ok:false,reason:'invalid-json'};}};
export async function openCampaignStore({storage,locks,key=CURRENT_KEY,legacyKey=LEGACY_KEY}={}){
 if(typeof key!=='string'||!key||key.length>200||typeof legacyKey!=='string'||!legacyKey||key===legacyKey)throw new TypeError('Distinct storage keys are required');
 let state=null,baseRaw=null,legacyRaw=null,persisted=false,dirty=false,reason=null,source='unknown',blocked=false,testMode=false;
 let canWrite=!!storage?.getItem&&!!storage?.setItem&&typeof locks?.request==='function';
 let memoryReason=!storage?.getItem||!storage?.setItem?'storage-unavailable':!locks?.request?'lock-unavailable':null;
 let session=null,serial=0,generation=0;
 const instanceId=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const lockName=`${key}:root-write`;
 const invalidate=()=>{session=null;generation++;};
 const reject=why=>({accepted:false,persisted,reason:why});
 const snapshot=()=>({document:state?clone(state):null,persisted,dirty,reason,source,testMode,readOnly:blocked||!canWrite});
 function saveCandidate(document,{allowWrite=true}={}){
  state=clone(document);const raw=JSON.stringify(state);
  if(!canWrite||!allowWrite){dirty=true;persisted=false;reason=memoryReason??reason??'unsaved-progress';return {accepted:true,persisted:false,reason};}
  let writeError=false;try{storage.setItem(key,raw);}catch{writeError=true;}
  let observed;try{observed=storage.getItem(key);}catch{dirty=true;persisted=false;reason='readback-unavailable';return {accepted:true,persisted:false,reason};}
  if(observed===raw){baseRaw=raw;dirty=false;persisted=true;reason=null;return {accepted:true,persisted:true,reason:null};}
  dirty=true;persisted=false;reason=writeError?'write-failed':'readback-mismatch';return {accepted:true,persisted:false,reason};
 }
 async function initialize(){
  let raw,old;try{raw=storage?.getItem?.(key)??null;if(raw===null)old=storage?.getItem?.(legacyKey)??null;}catch{state=newDocument();source='ephemeral';canWrite=false;memoryReason='read-unavailable';reason=memoryReason;dirty=true;return;}
  baseRaw=raw;
  if(raw!==null){const parsed=parse(raw),v=parsed.ok?validateDocument(parsed.value):parsed;if(!v.ok){blocked=true;reason=v.reason;return;}state=v.document;persisted=true;source='v2';reason=memoryReason;return;}
  if(old!==null){legacyRaw=old;const parsed=parse(old),v=parsed.ok?migrateV1(parsed.value):parsed;if(!v.ok){blocked=true;reason=v.reason;return;}state=v.document;source='v1';}
  else{state=newDocument();source='new';}
  saveCandidate(state);
 }
 if(canWrite){try{await locks.request(lockName,{mode:'exclusive'},initialize);}catch{canWrite=false;memoryReason='lock-unavailable';await initialize();}}
 else await initialize();
 async function locked(work){
  if(!canWrite)return work();
  try{return await locks.request(lockName,{mode:'exclusive'},work);}catch{return reject('lock-failed');}
 }
 function refresh({token,expectedRevision,allowActiveChange=false}={}){
  if(!canWrite||dirty)return null;
  let raw;try{raw=storage.getItem(key);}catch{return reject('read-unavailable');}
  if(raw===null)return reject('save-removed');
  const parsed=parse(raw),v=parsed.ok?validateDocument(parsed.value):parsed;
  if(!v.ok)return reject('unsupported-current-save');
  const changed=raw!==baseRaw,profileChanged=state?.activeProfileId!==v.document.activeProfileId;
  if(token&&(changed||session?.expectedRevision!==v.document.revision)){
   state=v.document;baseRaw=raw;persisted=true;reason=null;invalidate();return reject('stale-run');
  }
  if(expectedRevision!==undefined&&expectedRevision!==v.document.revision)return reject('stale-import');
  if(profileChanged&&!allowActiveChange){state=v.document;baseRaw=raw;persisted=true;reason=null;invalidate();return reject('profile-changed');}
  state=v.document;baseRaw=raw;persisted=true;reason=null;return null;
 }
 async function mutate(operation,{token,expectedRevision,allowActiveChange=false,makeRun=false,requireClean=false,rotateToken=false}={}){
  if(testMode)return reject('test-mode');if(blocked||!state)return reject(reason??'unsupported-save');
  const intendedProfileId=state.activeProfileId;
  return locked(async()=>{
   // Recheck after waiting for the lock, since a user can change modes while queued.
   if(testMode)return reject('test-mode');if(token&&session?.token!==token)return reject('stale-run');
   if(requireClean&&dirty)return reject('unsaved-progress');
   if(!allowActiveChange&&state.activeProfileId!==intendedProfileId)return reject('profile-changed');
   if(expectedRevision!==undefined&&expectedRevision!==state.revision)return reject('stale-import');
   const refreshError=refresh({token,expectedRevision,allowActiveChange});if(refreshError)return refreshError;
   if(token&&session.expectedRevision!==state.revision)return reject('stale-run');
   const result=operation(clone(state),token?clone(session.run):null);if(!result?.ok)return reject(result?.reason??'invalid-operation');
   const checked=validateDocument(result.document);if(!checked.ok)return reject(checked.reason);
   const saved=saveCandidate(checked.document,{allowWrite:!dirty});
   if(makeRun){invalidate();const nextToken=Object.freeze({runId:`${instanceId}:${++serial}`,profileId:state.activeProfileId,sessionGeneration:generation});session={token:nextToken,run:clone(result.run),expectedRevision:state.revision};return {...saved,token:nextToken,run:clone(result.run)};}
   if(token){
    const previous=session.run,next=result.run;
    if(rotateToken||previous.chapterId!==next.chapterId||previous.stepId!==next.stepId||previous.attemptId!==next.attemptId||previous.finished!==next.finished){generation++;session.token=Object.freeze({...session.token,sessionGeneration:generation});}
    session.run=clone(result.run);session.expectedRevision=state.revision;
   }else invalidate();
   return {...saved,...(token?{token:session.token}:{}),...(result.run?{run:clone(result.run)}:{}),...(result.rewardedXP!==undefined?{rewardedXP:result.rewardedXP}:{})};
  });
 }
 return {
  get:snapshot,
  beginRun:options=>mutate(d=>startRun(d,options),{makeRun:true}),
  dispatch:(token,action)=>mutate((d,run)=>applyRunAction(d,run,action),{token,rotateToken:action?.type==='retry'}),
  selectProfile(id){if(!PROFILE_IDS.includes(id))return Promise.resolve(reject('invalid-profile'));return mutate(d=>{if(d.revision>=MAX_SERIAL)return {ok:false,reason:'revision-limit'};d.activeProfileId=id;d.revision++;return {ok:true,document:d};},{allowActiveChange:true});},
  selectCharacters:selection=>mutate(d=>chooseCharacters(d,selection)),
  allocate:(id,skill,options={})=>mutate(d=>allocateSkill(d,id,skill),{expectedRevision:options.expectedRevision}),
  reset:(id,options={})=>mutate(d=>resetSkills(d,id),{expectedRevision:options.expectedRevision}),
  cancelRun:invalidate,
  enterTestMode(){if(!DEVELOPMENT_TOOLS)return false;invalidate();testMode=true;},
  exitTestMode(){invalidate();testMode=false;},
  exportJSON(){return state?JSON.stringify(state,null,2):null;},
  exportLegacyJSON(){return legacyRaw;},
  exportLastPersistedJSON(){return baseRaw;},
  async importJSON(text,{expectedRevision,allowLegacy=false}={}){
   if(!integer(expectedRevision))return reject('expected-revision-required');if(dirty)return reject('unsaved-progress');
   const parsed=parse(text);if(!parsed.ok)return reject(parsed.reason);
   const v=parsed.value?.version===1&&allowLegacy?migrateV1(parsed.value):validateDocument(parsed.value);if(!v.ok)return reject(v.reason);
   return mutate(d=>{if(d.revision>=MAX_SERIAL)return {ok:false,reason:'revision-limit'};const next=clone(v.document);next.revision=d.revision+1;return {ok:true,document:next};},{expectedRevision,allowActiveChange:true,requireClean:true});
  },
  async retrySave(){
   if(testMode)return reject('test-mode');if(!state||blocked)return reject(reason??'unsupported-save');if(!dirty)return {accepted:false,persisted,reason};
   if(!canWrite)return reject(memoryReason??'storage-unavailable');
   return locked(async()=>{
    if(testMode)return reject('test-mode');let raw;try{raw=storage.getItem(key);}catch{return reject('read-unavailable');}
    const wanted=JSON.stringify(state);
    if(raw===wanted){baseRaw=raw;dirty=false;persisted=true;reason=null;return {accepted:true,persisted:true,reason:null};}
    if(raw!==baseRaw)return {accepted:false,persisted:false,reason:'save-conflict'};
    return saveCandidate(state);
   });
  }
 };
}
import {DEVELOPMENT_TOOLS} from '../../../release-features.mjs';
