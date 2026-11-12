import assert from 'node:assert/strict';
import {startRun,applyRunAction,allocateSkill} from '../../dist/preview/campaign/core/transition.mjs';
import {newEnvelope,validateEnvelope,CHALLENGE_KEY} from '../../dist/preview/campaign/fresh/schema.mjs';
import {newProfileDocument,PROFILE_KEY,CHARACTER_IDS} from '../../dist/profile-progress.mjs';
// Historical combat/UI suites exercise their established all-character roster.
// New-profile restrictions use gameHarness({newProfile:true}) and the real store.
export function allUnlockedStorage(settingsStorage){
 const record=newProfileDocument();record.profiles[0].unlockedCharacters=[...CHARACTER_IDS];
 let raw=JSON.stringify(record);const fresh=newEnvelope();fresh.campaign.profiles[0].unlockedCharacters=[...CHARACTER_IDS];let current=JSON.stringify(fresh);
 return {getItem:key=>key===PROFILE_KEY?raw:key===CHALLENGE_KEY?current:settingsStorage?.getItem(key),setItem(key,value){if(key===PROFILE_KEY)raw=value;else if(key===CHALLENGE_KEY)current=value;else settingsStorage?.setItem(key,value);},removeItem(key){if(key===PROFILE_KEY)raw=null;else if(key===CHALLENGE_KEY)current=null;else settingsStorage?.removeItem?.(key);}};
}

// Synthetic fixtures only: earn chapter clears, unlocks and XP through the real
// validated transition functions. No product storage is adopted or migrated.
export function completedChallengeEnvelope({chapters=4,hpRank=0}={}){
 assert.ok(Number.isInteger(chapters)&&chapters>=0&&chapters<=4);
 const envelope=newEnvelope();let document=envelope.campaign;
 for(let n=0;n<chapters;n++){
  let result=startRun(document);assert.equal(result.ok,true,result.reason);document=result.document;let run=result.run;
  while(run.chapterId===`chapter-${n+1}`){
   const type=['entry','boss-comic','handoff-comic'].includes(run.stepId)?'story-complete':run.stepId.startsWith('route-')?'route-complete':run.stepId==='roster-choice'?'continue':'boss-win';
   result=applyRunAction(document,run,{type});assert.equal(result.ok,true,result.reason);document=result.document;run=result.run;
  }
 }
 for(let rank=0;rank<hpRank;rank++){const result=allocateSkill(document,'wang','hp');assert.equal(result.ok,true,result.reason);document=result.document;}
 envelope.campaign=document;assert.equal(validateEnvelope(envelope).ok,true);
 return envelope;
}
