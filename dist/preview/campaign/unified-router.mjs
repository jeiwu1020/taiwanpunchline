import {openUnifiedProgress} from './unified/progress.mjs?v=campaign-boot-20261112-r3';
import {legacySlot,parse} from './unified/schema.mjs?v=campaign-boot-20261112-r3';
import {validateDocument,currentProfile,deriveStats} from './core/model.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS} from './core/catalog.mjs?v=campaign-boot-20261112-r3';
const ROUTES=Object.freeze({
 'chapter-1':{status:'legacy',url:'../../'},
 'chapter-2':{status:'ready',url:'../chapter2/?campaign=1'},
 'chapter-3':{status:'ready',url:'../chapter3/?campaign=1'},
 'chapter-4':{status:'ready',url:'../chapter4/?campaign=1'},
 'chapter-5':{status:'locked',url:null}
});
const disabled=(reason,extra={})=>({enabled:false,reason,...extra});
const reject=reason=>({accepted:false,persisted:false,reason});
function sourceProfile(info,source){
 if(source==='legacy'||source==='new'){const m=legacySlot(info.evidence.legacyRaw,info.profileId);return m.ok?m.profile:null;}
 const v=validateDocument(parse(info.evidence.campaignRaw));return v.ok?v.document.profiles.find(p=>p.id===info.profileId):null;
}
function sourceSummary(info,source){const p=sourceProfile(info,source);return {source,xp:p?.campaign.xp??null,chapterId:p?.campaign.cursor.chapterId??null,unlocked:[...(p?.unlockedCharacters??[])]};}
function soleProvenSource(info){
 if(info.reason==='legacy-only'&&info.choices.length===1)return info.choices[0];
 if(info.reason==='campaign-only'&&info.choices.length===1)return 'campaign';
 if(info.reason==='sources-match'||info.reason==='campaign-changed')return 'campaign';
 if(info.reason==='legacy-changed')return 'legacy';
 return null;
}
/** Real later pages use one authority. A query never opts the user in. */
export async function openUnifiedContinuation({mode='preview',optIn=false,testPreview=false,storage,locks,profileId,adoption,handoff}={}){
 if(mode!=='campaign'||optIn!==true||testPreview===true)return disabled('preview-only');
 if(profileId!==undefined&&!PROFILE_IDS.includes(profileId))return disabled('invalid-profile');
 if(!storage?.getItem)return disabled('storage-unavailable');
 const api=await openUnifiedProgress({storage,locks});
 if(handoff){const s=api.get(),p=api.readProfile();if(handoff.profileId!==s.activeProfileId||profileId!==handoff.profileId||handoff.revision!==s.revision||handoff.chapterId!==p?.campaign?.cursor?.chapterId||s.authority!=='campaign'||!s.persisted||s.dirty||s.readOnly)return disabled('stale-handoff');}
 if(api.get().readOnly)return disabled(api.get().reason??'storage-unavailable');
 const id=profileId??api.activeProfileId,info=api.inspectAdoption(id);
 if(adoption&&adoption.profileId!==id)return disabled('profile-changed');
 if(!info.alreadyAdopted){
  const proposed=adoption?.source??soleProvenSource(info);
  const offer={...info,summaries:info.choices.map(source=>sourceSummary(info,source))};
  if(!proposed)return disabled('adoption-required',{adoption:offer});
  // Do not turn an incomplete slot into an apparently playable later chapter.
  const selected=sourceProfile(adoption??info,proposed);
  if(!selected?.campaign.chapterClears.includes('chapter-1'))return disabled('first-chapter-required');
  const outcome=await api.adoptProfile(id,{source:proposed,expectedRevision:adoption?.revision??info.revision,evidence:adoption?.evidence??info.evidence});
  if(!outcome.accepted||!outcome.persisted)return disabled(outcome.reason??'unsaved-progress',{recovery:api});
 }
 if(api.activeProfileId!==id){const selected=await api.selectProfile(id);if(!selected.accepted||!selected.persisted)return disabled(selected.reason??'unsaved-progress',{recovery:api});}
 const store=api.campaignStore();
 const view=()=>{
  const state=api.get(),p=currentProfile(state.campaignDocument),c=p.campaign,route=ROUTES[c.cursor.chapterId]??{status:'locked',url:null};
  return {profileId:p.id,chapterId:c.cursor.chapterId,stepId:c.cursor.stepId,revision:state.revision,difficulty:c.difficulty,carry:structuredClone(c.carry??null),selection:{...c.selection},unlocked:[...p.unlockedCharacters],xp:c.xp,
   canRefreshLegacy:false,stats:deriveStats(p,c.selection.characterId),route:{...route,url:route.status==='ready'?route.url+'&profile='+p.id:route.url},persisted:state.persisted,dirty:state.dirty,reason:state.reason,readOnly:state.readOnly,
   canNavigate:state.persisted&&!state.dirty&&!state.busy,saveLabel:state.persisted&&!state.dirty?'進度已確認保存':'尚未保存，離開前請匯出備份'};
 };
 return {enabled:true,view,preparationSnapshot:()=>api.preparationSnapshot(),prepareEncounter:(draft,options)=>api.prepareEncounter(draft,options),
  growthView(){const s=api.get(),p=api.readProfile();return {profileId:p.id,revision:s.revision,unlockedCharacters:[...p.unlockedCharacters],selection:{...p.campaign.selection},xp:p.campaign.xp,characters:structuredClone(p.characters),persisted:s.persisted&&!s.dirty,busy:s.busy,readOnly:s.readOnly||s.dirty,reason:s.reason};},
  statsForCharacter:id=>api.getChallengeStats(id),
  allocate:(id,skill,options)=>api.allocate(id,skill,options),reset:(id,options)=>api.reset(id,options),
  async begin(chapterId,{expectedRevision,difficulty}={}){
   const v=view(),route=ROUTES[chapterId];if(!route||route.status==='locked')return reject('content-locked');if(route.status==='legacy')return reject('legacy-entry-required');if(v.chapterId!==chapterId)return reject('chapter-mismatch');
   // A caller cannot weaken the revision bound to an unconsumed handoff.
   if(handoff&&expectedRevision!==undefined&&expectedRevision!==handoff.revision)return reject('stale-revision');
   const result=await api.beginChallenge({chapterId,expectedRevision,difficulty:handoff?.difficulty??v.difficulty??difficulty,...(handoff?{profileId:handoff.profileId,expectedRevision:handoff.revision}:{})});
   if(result.accepted)handoff=null;return result;
  },
  dispatch:(token,action)=>api.dispatchChallenge(token,action),
  selectCharacter(characterId){const v=view();return api.selectCharacters({characterId,helperId:v.selection.helperId});},
  selectHelper(helperId,options={}){const v=view();return api.selectCharacters({characterId:v.selection.characterId,helperId},options);},
  retrySave:()=>api.retrySave(),exportJSON:()=>api.exportBackup(),exportLegacyJSON:()=>store.exportLegacyJSON(),cancel:()=>api.cancelRun(),
  refreshLegacySlot:()=>Promise.resolve(reject('already-adopted'))
 };
}
