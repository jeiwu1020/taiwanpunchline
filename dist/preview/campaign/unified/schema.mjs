import {newDocument,validateDocument,clone,integer,onlyKeys,MAX_SERIAL} from '../core/model.mjs?v=campaign-complete-20261112-r1';
import {PROFILE_IDS} from '../core/catalog.mjs?v=campaign-complete-20261112-r1';
import {migrateV1} from '../core/migrate.mjs?v=campaign-complete-20261112-r1';
import {newProfileDocument,validateProfileDocument} from '../../../profile-progress.mjs?v=campaign-complete-20261112-r1';
export const UNIFIED_KEY='taiwanpunchline-progress-v3';
export const LEGACY_KEY='taiwanpunchline-progress-v1';
export const CAMPAIGN_KEY='taiwanpunchline-progress-v2';
export const SEED_KEY=CAMPAIGN_KEY+':v1-import-seed';
export const MAX_ENVELOPE_LENGTH=4_000_000;
export const parse=raw=>{try{return typeof raw==='string'&&raw.length<=MAX_ENVELOPE_LENGTH?JSON.parse(raw):null;}catch{return null;}};
export const rawValid=raw=>raw===null||typeof raw==='string'&&raw.length<=250_000;
export function legacyDocument(raw){return raw===null?newProfileDocument():validateProfileDocument(parse(raw));}
export function legacySlot(raw,id){
 const input=legacyDocument(raw);if(!input)return {ok:false,reason:'unsupported-legacy-save'};
 const source=input.profiles.find(p=>p.id===id);if(!source)return {ok:false,reason:'invalid-profile'};
 // Unknown root/profile extensions remain in raw archives; do not reinterpret unknown gameplay fields.
 const clean=newProfileDocument();clean.activeProfileId=id;
 clean.profiles[PROFILE_IDS.indexOf(id)]={id,unlockedCharacters:clone(source.unlockedCharacters),characters:clone(source.characters),challenge:clone(source.challenge)};
 const migrated=migrateV1(clean);
 return migrated.ok?{ok:true,profile:migrated.document.profiles.find(p=>p.id===id),legacyProfile:clone(source)}:migrated;
}
export function sourceBundle(raws){return {legacyRaw:raws.legacyRaw,campaignRaw:raws.campaignRaw,seedRaw:raws.seedRaw};}
export function newEnvelope(raws){
 const candidate=validateDocument(parse(raws.campaignRaw));
 const legacy=legacyDocument(raws.legacyRaw),campaign=candidate.ok?candidate.document:newDocument();
 const active=raws.legacyRaw!==null&&legacy?legacy.activeProfileId:campaign.activeProfileId;
 campaign.activeProfileId=active;
 return {version:3,revision:0,activeProfileId:active,campaign,slots:Object.fromEntries(PROFILE_IDS.map(id=>[id,{authority:'legacy',source:null}])),originals:sourceBundle(raws)};
}
export function validateEnvelope(input){
 try{
  if(!onlyKeys(input,['version','revision','activeProfileId','campaign','slots','originals'])||input.version!==3||!integer(input.revision)||!PROFILE_IDS.includes(input.activeProfileId)||!onlyKeys(input.slots,PROFILE_IDS)||Object.keys(input.slots).length!==3)return {ok:false,reason:'unsupported-envelope'};
  const validBundle=o=>onlyKeys(o,['legacyRaw','campaignRaw','seedRaw'])&&Object.keys(o).length===3&&Object.values(o).every(rawValid);
  if(!validBundle(input.originals))return {ok:false,reason:'invalid-originals'};
  const campaign=validateDocument(input.campaign);if(!campaign.ok||campaign.document.activeProfileId!==input.activeProfileId)return {ok:false,reason:'invalid-campaign'};
  for(const id of PROFILE_IDS){const s=input.slots[id];if(!onlyKeys(s,['authority','source'])||!['legacy','campaign'].includes(s.authority))return {ok:false,reason:'invalid-authority'};
   if(s.authority==='legacy'){if(s.source!==null)return {ok:false,reason:'invalid-source'};continue;}
   if(!onlyKeys(s.source,['kind','legacyRaw','campaignRaw','seedRaw','reason'])||!['legacy','campaign','new','backup'].includes(s.source.kind)||!['legacyRaw','campaignRaw','seedRaw'].every(k=>rawValid(s.source[k]))||typeof s.source.reason!=='string'||s.source.reason.length>160)return {ok:false,reason:'invalid-source'};
   if(s.source.kind==='legacy'&&!legacySlot(s.source.legacyRaw,id).ok)return {ok:false,reason:'invalid-legacy-origin'};
   if(s.source.kind==='campaign'&&!validateDocument(parse(s.source.campaignRaw)).ok)return {ok:false,reason:'invalid-campaign-origin'};
  }
  if(JSON.stringify(input).length>MAX_ENVELOPE_LENGTH)return {ok:false,reason:'backup-too-large'};
  return {ok:true,envelope:clone(input)};
 }catch{return {ok:false,reason:'invalid-envelope'};}
}
export function adoptionInfo(raws,id){
 const legacy=legacySlot(raws.legacyRaw,id),v2=validateDocument(parse(raws.campaignRaw)),seed=validateDocument(parse(raws.seedRaw));
 const cp=v2.ok?v2.document.profiles.find(p=>p.id===id):null,sp=seed.ok?seed.document.profiles.find(p=>p.id===id):null;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 let reason='legacy-only';
 if(raws.campaignRaw!==null){
  if(!v2.ok)reason='unsupported-campaign-save';
  else if(raws.legacyRaw===null)reason='campaign-only';
  else if(!seed.ok)reason='origin-evidence-unavailable';
  else if(!legacy.ok)reason='unsupported-legacy-save';
  else if(!same(legacy.profile,sp)&&!same(cp,sp))reason='both-sources-changed';
  else if(!same(legacy.profile,sp))reason='legacy-changed';
  else if(!same(cp,sp))reason='campaign-changed';
  else reason='sources-match';
 }
 if(raws.legacyRaw===null&&raws.campaignRaw===null)reason='new-profile';
 return {profileId:id,reason,choices:[...(raws.legacyRaw!==null&&legacy.ok?['legacy']:[]),...(v2.ok?['campaign']:[]),...(raws.legacyRaw===null&&raws.campaignRaw===null?['new']:[])],evidence:sourceBundle(raws)};
}
export function legacyProjection(profile){
 if(!profile?.campaign)return clone(profile);
 const c=profile.campaign,steps=['route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic'];
 const completed=c.chapterClears.includes('chapter-1');
 const checkpoint=completed?6:Math.max(0,steps.indexOf(c.cursor.stepId==='boss'?'boss-comic':c.cursor.stepId));
 return {id:profile.id,unlockedCharacters:clone(profile.unlockedCharacters),characters:clone(profile.characters),challenge:{version:1,xp:c.xp,checkpoint,completed,rewards:[],attemptSerial:c.attemptSerial,routeAttempt:null}};
}
