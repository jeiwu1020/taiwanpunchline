import {newDocument,currentProfile,deriveStats} from '../campaign/core/model.mjs?v=campaign-visuals-20261112-r2';
import {CHAPTERS,FIRST_CLEAR_STEPS,receiptFor,CHARACTER_IDS} from '../campaign/core/catalog.mjs?v=campaign-visuals-20261112-r2';
import {startRun,applyRunAction,prepareParty} from '../campaign/core/transition.mjs?v=campaign-visuals-20261112-r2';
import {createFinaleSession} from './finale-session.mjs?v=campaign-visuals-20261112-r2';
// Explicit preview owns only this in-memory document. No browser storage, locks,
// profile selection or formal progress API is obtained by this module.
export function createFinalePreview(options={}){
 let document=newDocument(),run=null,token=null,revision=0;
 const p=currentProfile(document);p.unlockedCharacters=[...CHARACTER_IDS];Object.assign(p.campaign,{chapterClears:CHAPTERS.map(c=>c.id),cursor:{chapterId:'finale-3v4',stepId:'team-select'},receipts:CHAPTERS.flatMap(c=>FIRST_CLEAR_STEPS.map(s=>receiptFor(c.id,s))),finale:{status:'ready',receipt:null},difficulty:options.difficulty??'easy'});
 const accept=r=>{if(!r.ok)return {accepted:false,persisted:false,preview:true,reason:r.reason};document=r.document;run=r.run??run;token={revision:++revision};return {accepted:true,persisted:false,preview:true,token,run};};
 const progress={preview:true,testMode:false,readProfile:()=>structuredClone(currentProfile(document)),availableCharacters:()=>[...CHARACTER_IDS],getChallengeStats:id=>deriveStats(currentProfile(document),id),get:()=>({persisted:false,dirty:false,busy:false,readOnly:false,reason:null}),
  beginChallenge:async()=>accept(startRun(document)),dispatchChallenge:async(t,action)=>t!==token?{accepted:false,reason:'stale-run'}:accept(applyRunAction(document,run,action)),
  preparationSnapshot:()=>({characterId:currentProfile(document).campaign.selection.characterId,helperId:'han',difficulty:currentProfile(document).campaign.difficulty,characters:{},unlockedCharacters:[...CHARACTER_IDS],allowance:0,expectedRevision:revision,expectedGeneration:0}),
  prepareEncounter:async(draft,guard)=>guard.token!==token?{accepted:false,reason:'stale-run'}:accept(prepareParty(document,draft)),
  exportBackup:()=>null,exportLegacyBackup:()=>null,retrySave:async()=>({accepted:false,persisted:false,preview:true,reason:'preview-only'})
 };return createFinaleSession({...options,progress});
}
