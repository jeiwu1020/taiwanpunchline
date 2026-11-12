// UI projection only. All reads and writes belong to the unified progress API.
import {XP_PER_LEVEL,MAX_XP} from './challenge-progress.mjs?v=workers-background-only-20261113-r1';
import {AsyncChallengeSession} from './preview/campaign/unified/first-chapter.mjs?v=workers-background-only-20261113-r1';
export function createMainCampaignBridge(progress){
 const current=()=>{const state=progress.get();return state.document.profiles.find(p=>p.id===state.activeProfileId);};
 function get(){const state=progress.get(),profile=current(),c=profile.challenge||{},xp=c.xp||0,allowance=Math.min(35,Math.floor(xp/XP_PER_LEVEL));return {...state,...c,xp,checkpoint:c.checkpoint||0,completed:!!c.completed,profileId:state.activeProfileId,campaign:progress.readProfile()?.campaign,characters:profile.characters,unlockedCharacters:profile.unlockedCharacters,allowance,level:1+allowance,nextLevelXP:xp>=MAX_XP?null:XP_PER_LEVEL-xp%XP_PER_LEVEL,storageIssue:state.reason||((state.dirty)?'unpersisted':null)};}
 return {get,canUse:id=>progress.canUse(id),derivedStats:(id,base)=>progress.getChallengeStats(id,base),allocate:(id,skill)=>progress.allocate(id,skill),reset:id=>progress.reset(id),exportJSON:()=>progress.exportBackup(),importJSON:(text,options)=>progress.importBackup(text,{expectedRevision:progress.get().revision,...options}),retrySave:()=>progress.retrySave(),refresh:()=>progress.refresh(),context:()=>progress.progressContext(),openingProfiles:{get:()=>progress.get(),getCurrentProfile:()=>progress.readProfile()??current()}};
}
export function campaignContinuationURL(state,profile){
 if(state.testMode)return `preview/chapter2/?test=1&profile=${encodeURIComponent(state.activeProfileId)}`;
 const chapter=profile?.campaign?.cursor?.chapterId;
 if(!['chapter-2','chapter-3','chapter-4'].includes(chapter))return null;
 const number=chapter==='chapter-4'?4:chapter==='chapter-3'?3:2;
 return `preview/chapter${number}/?campaign=1&profile=${encodeURIComponent(state.activeProfileId)}`;
}
export async function prepareMainContinuation({progress,characterId,helperId,preferSavedSelection=false,confirm,choose}){
 let state=progress.get();
 if(state.testMode)return {accepted:true,persisted:false,testMode:true,url:campaignContinuationURL(state)};
 if(state.busy||state.dirty||state.readOnly||state.reason)return {accepted:false,persisted:false,reason:state.reason||'pending-save'};
 if(state.authority==='legacy'){
  const info=await progress.inspectAdoption(state.activeProfileId);
  if(!info.choices?.length)return {accepted:false,persisted:false,reason:info.reason||'no-valid-source'};
  let source=info.choices[0];
  if(info.choices.length>1){source=await choose(info);if(!info.choices.includes(source))return {accepted:false,persisted:false,reason:'cancelled'};}
  if(!await confirm({profileId:state.activeProfileId,source,reason:info.reason}))return {accepted:false,persisted:false,reason:'cancelled'};
  const adopted=await progress.adoptProfile(state.activeProfileId,{source,expectedRevision:state.revision,evidence:info.evidence});
  if(!adopted.accepted||!adopted.persisted)return adopted;
 }
 const profile=progress.readProfile();
 if(preferSavedSelection&&profile?.campaign?.selection)({characterId,helperId}=profile.campaign.selection);
 if(['chapter-5','finale-3v4'].includes(profile?.campaign?.cursor?.chapterId))return {accepted:false,persisted:true,reason:'content-locked'};
 if(profile?.campaign?.cursor?.chapterId==='chapter-1'){
  if(!profile.campaign.chapterClears.includes('chapter-1'))return {accepted:false,persisted:true,reason:'chapter-1-incomplete'};
  const session=await AsyncChallengeSession.create({progress,characterId,helperId});if(!session.startResult.accepted||!session.startResult.persisted)return session.startResult;
  const finished=await session.finishChapter();if(!finished.accepted||!finished.persisted)return finished;
 }
 if(state.generation!==undefined)progress.cancelRun();
 const selection=await progress.selectCharacters({characterId,helperId},{expectedRevision:progress.get().revision,expectedGeneration:progress.get().generation});
 if(!selection.accepted||!selection.persisted)return selection;
 state=progress.get();if(state.dirty||state.busy||state.reason||!state.persisted)return {accepted:false,persisted:false,reason:state.reason||'pending-save'};
 const url=campaignContinuationURL(state,progress.readProfile());return url?{accepted:true,persisted:true,url}:{accepted:false,persisted:true,reason:'content-locked'};
}
