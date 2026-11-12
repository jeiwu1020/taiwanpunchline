// Portable, versioned player profiles. This key never owns audio/display settings.
// Test mode lives in memory only: it is not an unlock, save, or ranking credential.
export const PROFILE_KEY='taiwanpunchline-progress-v1';
export const PROFILE_VERSION=1;
export const STARTER_CHARACTERS=Object.freeze(['wang','han']);
export const CHARACTER_IDS=Object.freeze(['wang','han','ma','su','huang','chen','ko']);
export const PROFILE_IDS=Object.freeze(['slot-1','slot-2','slot-3']);
const copy=value=>JSON.parse(JSON.stringify(value));
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const freshProfile=id=>({id,unlockedCharacters:[...STARTER_CHARACTERS],characters:{},challenge:{}});
export function newProfileDocument(){return {version:PROFILE_VERSION,activeProfileId:PROFILE_IDS[0],profiles:PROFILE_IDS.map(freshProfile)};}
export function validateProfileDocument(input){
 if(!record(input)||input.version!==PROFILE_VERSION||!Array.isArray(input.profiles)||!PROFILE_IDS.includes(input.activeProfileId))return null;
 if(input.profiles.length!==PROFILE_IDS.length)return null;
 const profiles=[];
 for(const id of PROFILE_IDS){
  const matches=input.profiles.filter(p=>record(p)&&p.id===id);if(matches.length!==1)return null;
  const p=matches[0];if(!Array.isArray(p.unlockedCharacters)||!p.unlockedCharacters.every(c=>typeof c==='string')||!record(p.characters)||!record(p.challenge))return null;
  // Keep extension data and future character IDs, but only known IDs can be selected.
  profiles.push({...copy(p),unlockedCharacters:[...new Set([...STARTER_CHARACTERS,...p.unlockedCharacters])]});
 }
 return {...copy(input),profiles};
}
export function createProfileProgress({storage,onChange=()=>{}}={}){
 let state=newProfileDocument(),testMode=false,persisted=false,storageIssue=null;
 try{
  const raw=storage?.getItem(PROFILE_KEY);
  if(raw!=null){const parsed=validateProfileDocument(JSON.parse(raw));if(parsed){state=parsed;persisted=true;}else storageIssue='unsupported';}
 }catch{storageIssue='unavailable';}
 function persist(){
  if(storageIssue==='unsupported'||storageIssue==='unavailable')return false;
  try{if(!storage)throw Error('storage unavailable');storage.setItem(PROFILE_KEY,JSON.stringify(state));persisted=true;return true;}
  catch{persisted=false;storageIssue='unavailable';return false;}
 }
 // A new profile record is the only eager write. Invalid existing data is retained.
 if(!persisted&&!storageIssue)persist();
 const current=()=>state.profiles.find(p=>p.id===state.activeProfileId);
 const canUse=id=>CHARACTER_IDS.includes(id)&&(testMode||current().unlockedCharacters.includes(id));
 const snapshot=()=>({document:copy(state),testMode,persisted,storageIssue});
 const notify=()=>onChange(snapshot());
 return {
  get:snapshot,
  getCurrentProfile:()=>copy(current()),
  updateCurrentProfile(updater,context){
   if(testMode||context?.testMode||context?.recordProgress===false||(context?.profileId&&context.profileId!==state.activeProfileId)||storageIssue==='unsupported')return false;
   const next=copy(state),index=next.profiles.findIndex(p=>p.id===state.activeProfileId);
   const draft=next.profiles[index],result=updater(draft);if(result===false)return false;
   if(draft.id!==state.activeProfileId||!validateProfileDocument(next))return false;
   state=next;persist();notify();return true;
  },
  replaceDocument(document){
   if(testMode||storageIssue==='unsupported')return false;
   const next=validateProfileDocument(document);if(!next)return false;
   state=next;persist();notify();return true;
  },
  canUse,
  availableCharacters:()=>CHARACTER_IDS.filter(canUse),
  get activeProfileId(){return state.activeProfileId;},
  get testMode(){return testMode;},
  // This context must accompany any future challenge/ranking write. No rank API
  // exists in this prototype; test battles are explicitly never eligible.
  progressContext:()=>Object.freeze({profileId:state.activeProfileId,testMode,recordProgress:!testMode,submitRanking:!testMode}),
  selectProfile(id){if(!PROFILE_IDS.includes(id))return false;
   // Another tab may have written an unlock since this tab was opened. Merge
   // its latest valid document before changing only the active profile pointer.
   if(!storageIssue){try{const raw=storage?.getItem(PROFILE_KEY);if(raw!=null){const latest=validateProfileDocument(JSON.parse(raw));if(latest)state=latest;else storageIssue='unsupported';}}catch{storageIssue='unavailable';}}
   testMode=false;state.activeProfileId=id;persist();notify();return true;},
  enterTestMode(){if(testMode)return false;testMode=true;notify();return true;},
  exitTestMode(){if(!testMode)return false;testMode=false;notify();return true;},
 };
}
export function createFiveTapGate({now=()=>Date.now(),windowMs=5000,onActivate=()=>{}}={}){
 let count=0,first=0;
 return {reset(){count=0;first=0;},tap(id){const time=now();if(id!=='chen'){count=0;first=0;return false;}
  if(count&&time-first>windowMs)count=0;if(!count)first=time;count++;
  if(count<5)return false;count=0;first=0;onActivate();return true;
 }};
}
