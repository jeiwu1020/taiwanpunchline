import {deriveFighterStats} from './fighter-attributes.mjs?v=workers-background-only-20261113-r1';
import {validCarry} from './preview/campaign/core/model.mjs?v=workers-background-only-20261113-r1';
import {CHARACTER_IDS,PROFILE_IDS,STARTER_CHARACTERS,validateProfileDocument} from './profile-progress.mjs?v=workers-background-only-20261113-r1';
export const CHALLENGE_VERSION=1;
export const SKILLS=Object.freeze(['hp','move','basic','defense','special','rally','assist']);
export const SKILL_LABELS=Object.freeze({hp:'續航氣勢',move:'靈活走位',basic:'基本功',defense:'防守韌性',special:'招牌絕招',rally:'揪團聲勢',assist:'助拳默契'});
export const MAX_RANK=5,XP_PER_LEVEL=80,MAX_XP=2800;
const clone=v=>JSON.parse(JSON.stringify(v));
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
const keys=(o,allowed)=>object(o)&&Object.keys(o).every(k=>allowed.includes(k));
const emptySkills=()=>Object.fromEntries(SKILLS.map(k=>[k,0]));
const fresh=()=>({version:CHALLENGE_VERSION,xp:0,checkpoint:0,completed:false,rewards:[],attemptSerial:0,routeAttempt:null});
const chapter=p=>p.challenge?.version===1&&integer(p.challenge.xp,0,MAX_XP)&&Array.isArray(p.challenge.rewards)?p.challenge:fresh();
const allowance=xp=>Math.min(35,Math.floor(xp/XP_PER_LEVEL));
export function validateChallengeDocument(input){
 if(!keys(input,['version','activeProfileId','profiles'])||input.version!==1||!PROFILE_IDS.includes(input.activeProfileId)||!Array.isArray(input.profiles)||input.profiles.length!==3)return null;
 for(const p of input.profiles){
  if(!keys(p,['id','unlockedCharacters','characters','challenge'])||!PROFILE_IDS.includes(p.id)||!Array.isArray(p.unlockedCharacters)||p.unlockedCharacters.length>7||!p.unlockedCharacters.every(c=>CHARACTER_IDS.includes(c))||new Set(p.unlockedCharacters).size!==p.unlockedCharacters.length||!STARTER_CHARACTERS.every(c=>p.unlockedCharacters.includes(c))||!object(p.characters)||!object(p.challenge))return null;
  const c=p.challenge;
  if(Object.keys(c).length&&(!keys(c,['version','xp','checkpoint','completed','rewards','attemptSerial','routeAttempt','selection','difficulty','carry','replayCarry','encounterSerial'])||c.version!==1||!integer(c.xp,0,MAX_XP)||!integer(c.checkpoint,0,100)||typeof c.completed!=='boolean'||!Array.isArray(c.rewards)||c.rewards.length>1000||!c.rewards.every(r=>typeof r==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(r))||new Set(c.rewards).size!==c.rewards.length))return null;
  if(c.selection!==undefined&&(!keys(c.selection,['characterId','helperId'])||![c.selection.characterId,c.selection.helperId].every(id=>p.unlockedCharacters.includes(id))))return null;
  if(c.difficulty!==undefined&&!['beginner','easy','hard'].includes(c.difficulty)||c.carry!==undefined&&!validCarry(c.carry)||c.replayCarry!==undefined&&!validCarry(c.replayCarry)||c.encounterSerial!==undefined&&!integer(c.encounterSerial,0,1000000000))return null;
  if(c.attemptSerial!==undefined&&!integer(c.attemptSerial,0,1000000000))return null;
  if(c.routeAttempt!=null&&(!keys(c.routeAttempt,['id','checkpoint'])||!integer(c.routeAttempt.id,1,c.attemptSerial??0)||!integer(c.routeAttempt.checkpoint,0,4)||c.routeAttempt.checkpoint%2!==0))return null;
  for(const [id,data] of Object.entries(p.characters)){
   if(!CHARACTER_IDS.includes(id)||!keys(data,['skills','xp'])||!integer(data.xp??0,0,MAX_XP)||!keys(data.skills,SKILLS)||Object.keys(data.skills).length!==7||!SKILLS.every(k=>integer(data.skills[k],0,MAX_RANK))||Object.values(data.skills).reduce((a,b)=>a+b,0)>allowance(c.xp||0))return null;
  }
 }
 return validateProfileDocument(input);
}
export function createChallengeProgress({profiles}={}){
 if(!profiles)throw new TypeError('profiles required');
 const profile=()=>profiles.getCurrentProfile();
 const supported=()=>!!validateChallengeDocument(profiles.get().document);
 function get(){const p=profile(),c=chapter(p);return{...clone(c),profileId:p.id,testMode:profiles.testMode,level:1+allowance(c.xp),allowance:allowance(c.xp),nextLevelXP:c.xp>=MAX_XP?null:XP_PER_LEVEL-c.xp%XP_PER_LEVEL,unlockedCharacters:[...p.unlockedCharacters],characters:clone(p.characters),persisted:profiles.get().persisted,storageIssue:profiles.get().storageIssue||(!supported()?'unsupported-challenge':null)};}
 function skills(id){const raw=profile().characters[id]?.skills||{};return Object.fromEntries(SKILLS.map(k=>[k,integer(raw[k],0,MAX_RANK)?raw[k]:0]));}
 function allocate(id,skill){if(!supported()||!CHARACTER_IDS.includes(id)||!SKILLS.includes(skill)||!profiles.canUse(id))return false;return profiles.updateCurrentProfile(p=>{const ranks=skills(id);if(ranks[skill]>=MAX_RANK||Object.values(ranks).reduce((a,b)=>a+b,0)>=allowance(chapter(p).xp))return false;ranks[skill]++;p.characters[id]={...p.characters[id],xp:p.characters[id]?.xp??0,skills:ranks};});}
 function reset(id){if(!supported()||!CHARACTER_IDS.includes(id)||!profiles.canUse(id))return false;return profiles.updateCurrentProfile(p=>{p.characters[id]={...p.characters[id],xp:p.characters[id]?.xp??0,skills:emptySkills()};});}
 function beginRouteAttempt({checkpoint=0,restart=false,context}={}){
  if(!supported()||!integer(checkpoint,0,4)||checkpoint%2!==0||typeof restart!=='boolean')return null;
  let id=null;const ok=profiles.updateCurrentProfile(p=>{const c=clone(chapter(p));
   if(!restart&&c.routeAttempt?.checkpoint===checkpoint){id=c.routeAttempt.id;return;}
   const next=(c.attemptSerial??0)+1;if(next>1000000000)return false;
   c.attemptSerial=next;c.routeAttempt={id:next,checkpoint};
   // Only the active attempt needs a receipt ledger; old attempt IDs are rejected.
   c.rewards=c.rewards.filter(key=>!key.startsWith('chapter-1:mob-attempt:'));p.challenge=c;id=next;
  },context);return ok?id:null;
 }
 function rewardEncounter({encounterId,xp=40,checkpoint=0,boss=false,chapterId='chapter-1',characterId,context,attemptId}={}){
  if(!supported()||(characterId!==undefined&&!CHARACTER_IDS.includes(characterId))||chapterId!=='chapter-1'||typeof encounterId!=='string'||! /^[a-zA-Z0-9:_-]{1,100}$/.test(encounterId)||!integer(xp,0,400)||!integer(checkpoint,0,100)||typeof boss!=='boolean')return false;
  if(attemptId!==undefined&&(!integer(attemptId,1,1000000000)||boss||checkpoint%2!==0||encounterId.length>80))return false;
  return profiles.updateCurrentProfile(p=>{const c=clone(chapter(p));if(attemptId!==undefined&&(c.routeAttempt?.id!==attemptId||c.routeAttempt.checkpoint!==checkpoint))return false;const key=attemptId===undefined?`${chapterId}:${encounterId}`:`${chapterId}:mob-attempt:${attemptId}:${encounterId}`;if(c.rewards.includes(key)||c.rewards.length>=1000)return false;c.rewards.push(key);c.xp=Math.min(MAX_XP,c.xp+xp);c.checkpoint=Math.max(c.checkpoint,checkpoint);c.completed=c.completed||boss;p.challenge=c;if(characterId){const old=p.characters[characterId]||{};p.characters[characterId]={xp:Math.min(MAX_XP,(old.xp||0)+xp),skills:old.skills||emptySkills()};}if(boss&&!p.unlockedCharacters.includes('huang'))p.unlockedCharacters.push('huang');},context);
 }
 function derivedStats(id){return deriveFighterStats(id,{skills:skills(id),challenge:true});}
 return{get,skills,allocate,reset,beginRouteAttempt,rewardEncounter,derivedStats,context:()=>profiles.progressContext(),canUse:id=>profiles.canUse(id),
  exportJSON:()=>JSON.stringify(profiles.get().document,null,2),
  importJSON(text){if(profiles.testMode)return{ok:false,error:'測試模式不讀寫正式存檔'};if(typeof text!=='string'||text.length>250000)return{ok:false,error:'存檔過大或格式不符'};let data;try{data=validateChallengeDocument(JSON.parse(text));}catch{}if(!data)return{ok:false,error:'版本或內容不支援，原存檔未變更'};return profiles.replaceDocument(data)?{ok:true}:{ok:false,error:'目前無法覆蓋存檔，原資料保留'};},
 };
}
