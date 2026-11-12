import {openCampaignStore} from './core/store.mjs?v=workers-background-only-20261113-r1';
import {migrateV1} from './core/migrate.mjs?v=workers-background-only-20261113-r1';
import {currentProfile,deriveStats,validateDocument,MAX_JSON_LENGTH} from './core/model.mjs?v=workers-background-only-20261113-r1';
import {PROFILE_IDS} from './core/catalog.mjs?v=workers-background-only-20261113-r1';

export const CAMPAIGN_KEY='taiwanpunchline-progress-v2';
export const ORIGINAL_KEY='taiwanpunchline-progress-v1';
export const CHAPTER_ROUTES=Object.freeze({
 'chapter-1':Object.freeze({status:'legacy',url:'../../'}),
 'chapter-2':Object.freeze({status:'ready',url:'../chapter2/?campaign=1'}),
 'chapter-3':Object.freeze({status:'ready',url:'../chapter3/?campaign=1'}),
 'chapter-4':Object.freeze({status:'ready',url:'../chapter4/?campaign=1'}),
 'chapter-5':Object.freeze({status:'locked',url:null})
});
const disabled=reason=>({enabled:false,reason});
const reject=reason=>({accepted:false,persisted:false,reason});

/** This gate is mandatory: opening the underlying store may migrate and write v2. */
export async function openContinuation({mode='preview',optIn=false,testPreview=false,storage,locks,
 key=CAMPAIGN_KEY,legacyKey=ORIGINAL_KEY,profileId}={}){
 if(mode!=='campaign'||optIn!==true||testPreview===true)return disabled('preview-only');
 if(profileId!==undefined&&!PROFILE_IDS.includes(profileId))return disabled('invalid-profile');
 if(!storage?.getItem)return disabled('storage-unavailable');
 // A retained entry from the former v2 route must never fork adopted progress.
 try{if(storage.getItem('taiwanpunchline-progress-v3')!==null){const {openUnifiedContinuation}=await import('./unified-router.mjs?v=workers-background-only-20261113-r1');return openUnifiedContinuation({mode,optIn,testPreview,storage,locks,profileId});}}catch{return disabled('storage-unavailable');}
 // Eligibility and first migration share the root lock; legacy v1 never receives writes.
 const lockName=`${key}:root-write`,seedKey=key+':v1-import-seed';let initializationLocked=false,legacySnapshot=null,migrationSeed=null,writeIssue=null;
 const safeStorage={
  getItem(k){return initializationLocked&&k===legacyKey&&legacySnapshot!==null?legacySnapshot:storage.getItem(k);},
  setItem(k,value){
   if(k!==key)throw new Error('Only v2 may be written');
   if(legacySnapshot!==null&&storage.getItem(key)===null){
    if(storage.getItem(legacyKey)!==legacySnapshot){writeIssue='legacy-source-changed';throw new Error(writeIssue);}
    storage.setItem(seedKey,migrationSeed);if(storage.getItem(seedKey)!==migrationSeed)throw new Error('Origin snapshot was not verified');
   }
   storage.setItem(key,value);
  }
 };
 const coordinatedLocks=locks?.request?{request(name,options,work){
  return initializationLocked&&name===lockName?work():locks.request(name,options,work);
 }}:locks;
 async function initialize(){
  try{
   if(storage.getItem(key)===null){
    const raw=storage.getItem(legacyKey);
    if(raw===null)return disabled('first-chapter-required');
    if(typeof raw!=='string'||raw.length>MAX_JSON_LENGTH)return disabled('invalid-legacy-save');
    let old;try{old=JSON.parse(raw);}catch{return disabled('invalid-legacy-save');}
    const migrated=migrateV1(old);if(!migrated.ok)return disabled(migrated.reason);
    const p=migrated.document.profiles.find(p=>p.id===(profileId??migrated.document.activeProfileId));
    if(!p.campaign.chapterClears.includes('chapter-1'))return disabled('first-chapter-required');
    legacySnapshot=raw;migrationSeed=JSON.stringify(migrated.document);
   }
  }catch{return disabled('storage-unavailable');}
  return {store:await openCampaignStore({storage:safeStorage,locks:coordinatedLocks,key,legacyKey})};
 }
 let initialized;
 if(locks?.request){
  try{initialized=await locks.request(lockName,{mode:'exclusive'},async()=>{
   initializationLocked=true;try{return await initialize();}finally{initializationLocked=false;}
  });}catch{return disabled('lock-unavailable');}
 }else initialized=await initialize();
 if(!initialized.store)return initialized;
 if(writeIssue)return disabled(writeIssue);
 let store=initialized.store,legacyBackupRaw=legacySnapshot;
 if(legacyBackupRaw===null)try{legacyBackupRaw=storage.getItem(legacyKey);}catch{/* Export availability never enables writes. */}
 if(!store.get().document)return disabled(store.get().reason??'unsupported-save');
 if(profileId&&profileId!==store.get().document.activeProfileId){
  const selected=await store.selectProfile(profileId);if(!selected.accepted)return disabled(selected.reason);
 }
 const view=()=>{
  const state=store.get(),p=currentProfile(state.document),c=p.campaign;
  const route=CHAPTER_ROUTES[c.cursor.chapterId]??{status:'locked',url:null};
  return {profileId:p.id,chapterId:c.cursor.chapterId,stepId:c.cursor.stepId,
   selection:{...c.selection},unlocked:[...p.unlockedCharacters],xp:c.xp,
   canRefreshLegacy:c.cursor.chapterId==='chapter-1'&&!state.dirty,
   stats:deriveStats(p,c.selection.characterId),route:{...route,url:route.status==='ready'?route.url+'&profile='+p.id:route.url},persisted:state.persisted,
   dirty:state.dirty,reason:state.reason,readOnly:state.readOnly,
   canNavigate:state.persisted&&!state.dirty,
   saveLabel:state.persisted&&!state.dirty?'進度已確認保存':'尚未保存，離開前請匯出備份'};
 };
 return {
  enabled:true,view,
  growthView(){const state=store.get(),p=currentProfile(state.document);return {profileId:p.id,revision:state.document.revision,unlockedCharacters:[...p.unlockedCharacters],selection:{...p.campaign.selection},xp:p.campaign.xp,characters:structuredClone(p.characters),persisted:state.persisted&&!state.dirty,busy:false,readOnly:state.readOnly||state.dirty,reason:state.reason};},
  allocate:(id,skill,options)=>store.allocate(id,skill,options),
  reset:(id,options)=>store.reset(id,options),
  statsForCharacter:id=>deriveStats(currentProfile(store.get().document),id),
  async begin(chapterId){
   const v=view(),route=CHAPTER_ROUTES[chapterId];
   if(!route||route.status==='locked')return reject('content-locked');
   if(route.status==='legacy')return reject('legacy-entry-required');
   if(v.chapterId!==chapterId)return reject('chapter-mismatch');
   const result=await store.beginRun();
   if(result.accepted&&result.run.chapterId!==chapterId){store.cancelRun();return reject('chapter-mismatch');}
   return result;
  },
  // The caller must pass the token captured by the current segment, never look it up at callback time.
  dispatch:(token,action)=>store.dispatch(token,action),
  selectCharacter(characterId){const v=view();return store.selectCharacters({characterId,helperId:v.selection.helperId});},
  async refreshLegacySlot(){
   if(store.get().dirty)return reject('unsaved-progress');
   if(!locks?.request)return reject('lock-unavailable');
   const targetId=view().profileId;let replacement=null,result;
   try{result=await locks.request(lockName,{mode:'exclusive'},async()=>{
    if(store.get().dirty)return reject('unsaved-progress');
    let currentRaw,oldRaw,seedRaw;try{currentRaw=storage.getItem(key);oldRaw=storage.getItem(legacyKey);seedRaw=storage.getItem(seedKey);legacyBackupRaw=oldRaw;}catch{return reject('read-unavailable');}
    let current,seed,migrated;try{
     if([currentRaw,oldRaw,seedRaw].some(raw=>typeof raw!=='string'||raw.length>MAX_JSON_LENGTH))return reject('origin-evidence-unavailable');
     current=validateDocument(JSON.parse(currentRaw));seed=validateDocument(JSON.parse(seedRaw));migrated=migrateV1(JSON.parse(oldRaw));
    }catch{return reject('invalid-legacy-save');}
    if(!current.ok||!seed.ok||!migrated.ok)return reject('unsupported-save');
    if(current.document.activeProfileId!==targetId)return reject('profile-changed');
    const p=current.document.profiles.find(p=>p.id===targetId),original=seed.document.profiles.find(p=>p.id===targetId),fresh=migrated.document.profiles.find(p=>p.id===targetId);
    if(p.campaign.cursor.chapterId!=='chapter-1'||p.campaign.chapterClears.length||p.campaign.receipts.some(id=>!id.includes(':chapter-1:')))return reject('later-progress-exists');
    if(JSON.stringify(p)!==JSON.stringify(original))return reject('slot-changed-since-migration');
    if(!fresh.campaign.chapterClears.includes('chapter-1'))return reject('first-chapter-required');
    const next=structuredClone(current.document);next.profiles[next.profiles.findIndex(p=>p.id===targetId)]=fresh;
    // This new store is private until the root lock has been released.
    let inside=true;const privateLocks={request(name,options,work){return inside?work():locks.request(name,options,work);}};
    let sourceGuard=true,guardedValue=null;
    const guardedStorage={getItem(k){const value=storage.getItem(k);if(k===key&&guardedValue!==null&&value===guardedValue)sourceGuard=false;return value;},setItem(k,value){
     if(k!==key)throw new Error('Only v2 may be written');
     if(sourceGuard&&storage.getItem(legacyKey)!==oldRaw)throw new Error('Legacy source changed');
     guardedValue=value;storage.setItem(k,value);
    }};
    try{
     const nextStore=await openCampaignStore({storage:guardedStorage,locks:privateLocks,key,legacyKey});
     const saved=await nextStore.importJSON(JSON.stringify(next),{expectedRevision:current.document.revision});
     if(saved.accepted)replacement=nextStore;
     return saved;
    }finally{inside=false;}
   });}catch{return reject('lock-failed');}
   if(replacement){store.cancelRun();store=replacement;}
   return result;
  },
  retrySave:()=>store.retrySave(),exportJSON:()=>store.exportJSON(),
  exportLegacyJSON:()=>legacyBackupRaw,cancel:()=>store.cancelRun()
 };
}
