import {deriveFighterStats} from '../../../fighter-attributes.mjs?v=post69-street-seam-cull-20261112-r1';
import {CAMPAIGN_ID,PROFILE_IDS,STARTERS,CHARACTER_IDS,CHAPTERS,STEPS,ROUTES,FIRST_CLEAR_STEPS,receiptFor,chapterById} from './catalog.mjs?v=post69-street-seam-cull-20261112-r1';
export const SKILLS=Object.freeze(['hp','move','basic','defense','special','rally','assist']);
export const MAX_XP=2800,XP_PER_POINT=80,MAX_RANK=5,MAX_SERIAL=1_000_000_000,MAX_JSON_LENGTH=250_000;
export const clone=v=>JSON.parse(JSON.stringify(v));
export const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
export const integer=(n,min=0,max=MAX_SERIAL)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export const onlyKeys=(o,keys)=>object(o)&&Object.keys(o).every(k=>keys.includes(k));
export const uniqueStrings=(v,max=1000)=>Array.isArray(v)&&v.length<=max&&v.every(s=>typeof s==='string'&&/^[a-zA-Z0-9:_-]{1,180}$/.test(s))&&new Set(v).size===v.length;
export const allowance=xp=>Math.min(35,Math.floor(xp/XP_PER_POINT));
export const zeroSkills=()=>Object.fromEntries(SKILLS.map(k=>[k,0]));
export const currentProfile=d=>d.profiles.find(p=>p.id===d.activeProfileId);
function freshProfile(id){return {id,unlockedCharacters:[...STARTERS],characters:{},campaign:{version:2,campaignId:CAMPAIGN_ID,revision:0,xp:0,chapterClears:[],cursor:{chapterId:'chapter-1',stepId:'entry'},selection:{characterId:'wang',helperId:'han'},story:{opening:'unseen',seen:[],pending:null},receipts:[],legacyReceipts:[],attemptSerial:0,attempt:null,replayAttempt:null,finale:{status:'not-ready',receipt:null}}};}
export function newDocument(){return {version:2,revision:0,activeProfileId:'slot-1',profiles:PROFILE_IDS.map(freshProfile)};}
export function validCharacters(characters,xp){
 return object(characters)&&Object.entries(characters).every(([id,c])=>CHARACTER_IDS.includes(id)&&onlyKeys(c,['xp','skills'])&&integer(c.xp??0,0,MAX_XP)&&onlyKeys(c.skills,SKILLS)&&Object.keys(c.skills).length===SKILLS.length&&SKILLS.every(k=>integer(c.skills[k],0,MAX_RANK))&&Object.values(c.skills).reduce((a,b)=>a+b,0)<=allowance(xp));
}
export function validateDocument(input){
 try{
  if(!onlyKeys(input,['version','revision','activeProfileId','profiles'])||input.version!==2||!integer(input.revision)||!PROFILE_IDS.includes(input.activeProfileId)||!Array.isArray(input.profiles)||input.profiles.length!==3)return {ok:false,reason:'unsupported-document'};
  const found=new Set();
  for(const p of input.profiles){
   if(!onlyKeys(p,['id','unlockedCharacters','characters','campaign'])||!PROFILE_IDS.includes(p.id)||found.has(p.id)||!uniqueStrings(p.unlockedCharacters,7)||!p.unlockedCharacters.every(id=>CHARACTER_IDS.includes(id))||!STARTERS.every(id=>p.unlockedCharacters.includes(id)))return {ok:false,reason:'invalid-profile'};found.add(p.id);
   const c=p.campaign;
   if(!onlyKeys(c,['version','campaignId','revision','xp','chapterClears','cursor','selection','story','receipts','legacyReceipts','attemptSerial','attempt','replayAttempt','finale','difficulty','carry','replayCarry'])||c.version!==2||c.campaignId!==CAMPAIGN_ID||!integer(c.revision)||!integer(c.xp,0,MAX_XP)||!validCharacters(p.characters,c.xp))return {ok:false,reason:'invalid-growth'};
   if(c.difficulty!==undefined&&!['beginner','easy','hard'].includes(c.difficulty)||c.carry!==undefined&&!validCarry(c.carry)||c.replayCarry!==undefined&&!validCarry(c.replayCarry))return {ok:false,reason:'invalid-encounter'};
   if(!uniqueStrings(c.chapterClears,5)||!c.chapterClears.every((id,i)=>id===CHAPTERS[i].id&&p.unlockedCharacters.includes(CHAPTERS[i].boss)))return {ok:false,reason:'invalid-clears'};
   if(!onlyKeys(c.cursor,['chapterId','stepId']))return {ok:false,reason:'invalid-cursor'};
   const chapter=chapterById(c.cursor.chapterId),clears=c.chapterClears.length;
   if(c.cursor.chapterId==='finale-3v4'){
    if(c.cursor.stepId!=='team-select'||clears!==5||!CHARACTER_IDS.every(id=>p.unlockedCharacters.includes(id)))return {ok:false,reason:'invalid-finale-cursor'};
   }else if(!chapter||!STEPS.includes(c.cursor.stepId)||chapter.index>clears||(chapter.index<clears&&(chapter.index!==clears-1||!['handoff-comic','roster-choice'].includes(c.cursor.stepId)))||(chapter.index===clears&&['handoff-comic','roster-choice'].includes(c.cursor.stepId)))return {ok:false,reason:'invalid-cursor'};
   if(!onlyKeys(c.selection,['characterId','helperId'])||![c.selection.characterId,c.selection.helperId].every(id=>p.unlockedCharacters.includes(id)))return {ok:false,reason:'invalid-selection'};
   if(!onlyKeys(c.story,['opening','seen','pending'])||!['unseen','seen','legacy-unknown'].includes(c.story.opening)||!uniqueStrings(c.story.seen,100)||(c.story.pending!==null&&(typeof c.story.pending!=='string'||!/^chapter-[1-5]:after-boss$/.test(c.story.pending))))return {ok:false,reason:'invalid-story'};
   if(!uniqueStrings(c.receipts)||!uniqueStrings(c.legacyReceipts)||!integer(c.attemptSerial))return {ok:false,reason:'invalid-receipts'};
   for(const a of [c.attempt,c.replayAttempt])if(a!==null&&(!onlyKeys(a,['id','chapterId','stepId','paidEnemyIds'])||!integer(a.id,1,c.attemptSerial)||!chapterById(a.chapterId)||!ROUTES.includes(a.stepId)||!uniqueStrings(a.paidEnemyIds,1000)))return {ok:false,reason:'invalid-attempt'};
   const consumed=c.chapterClears.flatMap(id=>FIRST_CLEAR_STEPS.map(step=>receiptFor(id,step)));
   if(chapter&&chapter.index===clears)for(const step of FIRST_CLEAR_STEPS)if(STEPS.indexOf(step)<STEPS.indexOf(c.cursor.stepId))consumed.push(receiptFor(chapter.id,step));
   if(!consumed.every(receipt=>c.receipts.includes(receipt))||!c.receipts.every(receipt=>CHAPTERS.some(ch=>FIRST_CLEAR_STEPS.some(step=>receipt===receiptFor(ch.id,step)))))return {ok:false,reason:'inconsistent-consumed-rewards'};
   if(!onlyKeys(c.finale,['status','receipt'])||c.finale.status!==(clears===5?'ready':'not-ready')||c.finale.receipt!==null)return {ok:false,reason:'invalid-finale'};
  }
  const serialized=JSON.stringify(input);if(serialized.length>MAX_JSON_LENGTH)return {ok:false,reason:'document-too-large'};
  return {ok:true,document:JSON.parse(serialized)};
 }catch{return {ok:false,reason:'invalid-document'};}
}
export function deriveStats(profile,id){
 if(!CHARACTER_IDS.includes(id))throw new RangeError('Unknown character');
 return {...deriveFighterStats(id,{skills:profile.characters[id]?.skills,challenge:true}),allowance:allowance(profile.campaign.xp)};
}

export function validCarry(c){return c===null||onlyKeys(c,['hp','rally','assist'])&&Number.isFinite(c.hp)&&c.hp>0&&c.hp<=10000&&Number.isFinite(c.rally)&&c.rally>=0&&c.rally<=100&&onlyKeys(c.assist,['helper','used','active','charge','damageTaken'])&&CHARACTER_IDS.includes(c.assist.helper)&&typeof c.assist.used==='boolean'&&c.assist.active===false&&Number.isFinite(c.assist.charge)&&c.assist.charge>=0&&c.assist.charge<=100&&Number.isFinite(c.assist.damageTaken)&&c.assist.damageTaken>=0&&c.assist.damageTaken<=10000;}
export function normalizeCarry(c){if(!c||!Number.isFinite(c.hp)||c.hp<=0)return null;const carry={hp:c.hp,rally:c.rally??0,assist:{helper:c.assist?.helper??'han',used:!!c.assist?.used,active:false,charge:c.assist?.charge??100,damageTaken:c.assist?.damageTaken??0}};return validCarry(carry)?carry:null;}
