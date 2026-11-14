import {newDocument,validateDocument,clone,integer,onlyKeys} from '../core/model.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS} from '../core/catalog.mjs?v=campaign-boot-20261112-r3';

export const CHALLENGE_KEY='taiwanpunchline-challenge-v4';
export const LEGACY_KEYS=Object.freeze(['taiwanpunchline-progress-v1','taiwanpunchline-progress-v2','taiwanpunchline-progress-v2:v1-import-seed','taiwanpunchline-progress-v3']);
export const MAX_ENVELOPE_LENGTH=1_000_000;
export const BACKUP_FORMAT='taiwanpunchline-challenge-backup';
export const SLOT_BACKUP_FORMAT='taiwanpunchline-challenge-slot-backup';
export function parse(raw){try{return typeof raw==='string'&&raw.length<=MAX_ENVELOPE_LENGTH?JSON.parse(raw):null;}catch{return null;}}
export function newEnvelope(){
 const campaign=newDocument();for(const p of campaign.profiles)p.campaign.difficulty='easy';
 return {version:4,revision:0,activeProfileId:campaign.activeProfileId,campaign,slots:Object.fromEntries(PROFILE_IDS.map(id=>[id,{authority:'campaign',generation:0}]))};
}
const exactKeys=(o,keys)=>onlyKeys(o,keys)&&Object.keys(o).length===keys.length;
export function validateEnvelope(input){
 try{
  if(!exactKeys(input,['version','revision','activeProfileId','campaign','slots'])||input.version!==4||!integer(input.revision)||!PROFILE_IDS.includes(input.activeProfileId))return {ok:false,reason:'unsupported-envelope'};
  if(!exactKeys(input.slots,PROFILE_IDS)||PROFILE_IDS.some(id=>!exactKeys(input.slots[id],['authority','generation'])||input.slots[id].authority!=='campaign'||!integer(input.slots[id].generation)))return {ok:false,reason:'invalid-generation'};
  const valid=validateDocument(input.campaign);if(!valid.ok||valid.document.activeProfileId!==input.activeProfileId)return {ok:false,reason:'invalid-campaign'};
  if(JSON.stringify(input).length>MAX_ENVELOPE_LENGTH)return {ok:false,reason:'envelope-too-large'};
  return {ok:true,envelope:clone(input)};
 }catch{return {ok:false,reason:'invalid-envelope'};}
}
export function validateSlotBackup(input){
 try{
  if(!exactKeys(input,['format','version','scope','profileId','revision','generation','profile','persisted'])||input.format!==SLOT_BACKUP_FORMAT||input.version!==4||input.scope!=='slot'||!PROFILE_IDS.includes(input.profileId)||!integer(input.revision)||!integer(input.generation)||typeof input.persisted!=='boolean'||input.profile?.id!==input.profileId)return {ok:false,reason:'invalid-slot-backup'};
  const d=newDocument();d.profiles[PROFILE_IDS.indexOf(input.profileId)]=input.profile;
  if(!validateDocument(d).ok||JSON.stringify(input).length>MAX_ENVELOPE_LENGTH)return {ok:false,reason:'invalid-slot-backup'};
  return {ok:true,backup:clone(input)};
 }catch{return {ok:false,reason:'invalid-slot-backup'};}
}
/** Compatibility projection is a view only, never a legacy source or writer. */
export function legacyProjection(profile){
 const c=profile.campaign,steps=['route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic'],completed=c.chapterClears.includes('chapter-1');
 return {id:profile.id,unlockedCharacters:clone(profile.unlockedCharacters),characters:clone(profile.characters),challenge:{version:1,xp:c.xp,checkpoint:completed?6:Math.max(0,steps.indexOf(c.cursor.stepId==='boss'?'boss-comic':c.cursor.stepId)),completed,rewards:[],attemptSerial:c.attemptSerial,routeAttempt:null}};
}
