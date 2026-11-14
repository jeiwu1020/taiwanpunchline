import {openChallengeProgress} from './fresh/progress.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS} from './core/catalog.mjs?v=campaign-boot-20261112-r3';
const ROUTES=Object.freeze({
 'chapter-1':{status:'legacy',url:'../../?challengeOverview=1'},
 'chapter-2':{status:'ready',url:'../chapter2/?campaign=1'},
 'chapter-3':{status:'ready',url:'../chapter3/?campaign=1'},
 'chapter-4':{status:'ready',url:'../chapter4/?campaign=1'},
 'chapter-5':{status:'ready',url:'../chapter5/?campaign=1'},
 'finale-3v4':{status:'ready',url:'../finale/?campaign=1'}
});
const disabled=(reason,extra={})=>({enabled:false,reason,...extra});
const reject=reason=>({accepted:false,persisted:false,reason});
/** Fresh formal continuation never inspects or adopts the archived test saves. */
export async function openChallengeContinuation({mode='preview',optIn=false,testPreview=false,storage,locks,profileId,handoff,onSaved}={}){
 if(mode!=='campaign'||optIn!==true||testPreview===true)return disabled('preview-only');
 if(profileId!==undefined&&!PROFILE_IDS.includes(profileId))return disabled('invalid-profile');
 if(!storage?.getItem)return disabled('storage-unavailable');
 const api=await openChallengeProgress({storage,locks,onSaved});
 if(api.get().readOnly)return disabled(api.get().reason??'storage-unavailable',{recovery:api});
 if(handoff){const s=api.get(),p=api.readProfile();if(handoff.profileId!==s.activeProfileId||profileId!==handoff.profileId||handoff.revision!==s.revision||handoff.generation!==s.generation||handoff.chapterId!==p?.campaign?.cursor?.chapterId||!s.persisted||s.dirty||s.readOnly)return disabled('stale-handoff');}
 const id=profileId??api.activeProfileId,p=api.readProfile(id);
 if(!p?.campaign.chapterClears.includes('chapter-1'))return disabled('first-chapter-required');
 if(api.activeProfileId!==id){const result=await api.selectProfile(id);if(!result.accepted||!result.persisted)return disabled(result.reason??'unsaved-progress',{recovery:api});}
 const view=()=>{
  const state=api.get(),p=api.readProfile(),c=p.campaign,route=ROUTES[c.cursor.chapterId]??{status:'locked',url:null};
  return {profileId:p.id,generation:state.generation,chapterId:c.cursor.chapterId,stepId:c.cursor.stepId,revision:state.revision,difficulty:c.difficulty,carry:structuredClone(c.carry??null),selection:{...c.selection},unlocked:[...p.unlockedCharacters],xp:c.xp,
   canRefreshLegacy:false,stats:api.getChallengeStats(c.selection.characterId),route:{...route,url:route.status==='ready'?route.url+'&profile='+p.id:route.url},persisted:state.persisted,dirty:state.dirty,reason:state.reason,readOnly:state.readOnly,busy:state.busy,
   canNavigate:state.persisted&&!state.dirty&&!state.busy&&!state.readOnly,saveLabel:state.persisted&&!state.dirty?'進度已確認保存':'尚未保存，離開前請重試或匯出備份'};
 };
 return {enabled:true,version:4,view,preparationSnapshot:()=>api.preparationSnapshot(),prepareEncounter:(draft,options)=>api.prepareEncounter(draft,options),
  growthView(){const s=api.get(),p=api.readProfile();return {profileId:p.id,revision:s.revision,generation:s.generation,unlockedCharacters:[...p.unlockedCharacters],selection:{...p.campaign.selection},xp:p.campaign.xp,characters:structuredClone(p.characters),persisted:s.persisted&&!s.dirty,busy:s.busy,readOnly:s.readOnly||s.dirty,reason:s.reason};},
  statsForCharacter:id=>api.getChallengeStats(id),allocate:(id,skill,options)=>api.allocate(id,skill,options),reset:(id,options)=>api.reset(id,options),
  async begin(chapterId,{expectedRevision,difficulty}={}){
   const v=view(),route=ROUTES[chapterId];if(!route||route.status==='locked')return reject('content-locked');if(route.status==='legacy')return reject('legacy-entry-required');if(v.chapterId!==chapterId)return reject('chapter-mismatch');
   if(handoff&&expectedRevision!==undefined&&expectedRevision!==handoff.revision)return reject('stale-revision');
   const result=await api.beginChallenge({chapterId,expectedRevision:expectedRevision??v.revision,expectedGeneration:v.generation,difficulty:handoff?.difficulty??v.difficulty??difficulty,...(handoff?{profileId:handoff.profileId,expectedRevision:handoff.revision,expectedGeneration:handoff.generation}:{})});
   if(result.accepted)handoff=null;return result;
  },
  dispatch:(token,action)=>api.dispatchChallenge(token,action),
  retrySave:()=>api.retrySave(),exportJSON:()=>api.exportBackup(),exportLegacyJSON:()=>api.exportLegacyBackup(),cancel:()=>api.cancelRun(),refresh:options=>api.refresh(options),
  refreshLegacySlot:()=>Promise.resolve(reject('legacy-import-disabled'))
 };
}
