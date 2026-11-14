import {newDocument,validateDocument,validCharacters,onlyKeys,integer,uniqueStrings,clone,MAX_XP,MAX_SERIAL,MAX_JSON_LENGTH} from './model.mjs?v=campaign-boot-20261112-r3';
import {PROFILE_IDS,STARTERS,CHARACTER_IDS,FIRST_CLEAR_STEPS,receiptFor} from './catalog.mjs?v=campaign-boot-20261112-r3';
const map=['route-a','miniboss-a','route-b','miniboss-b','route-c','boss-comic'];
const legacyKeys=['route-0','boss-0','route-1','boss-1','route-2','boss-2'];
export function migrateV1(input){
 try{
  if(!onlyKeys(input,['version','activeProfileId','profiles'])||input.version!==1||!PROFILE_IDS.includes(input.activeProfileId)||!Array.isArray(input.profiles)||input.profiles.length!==3||JSON.stringify(input).length>MAX_JSON_LENGTH)return {ok:false,reason:'unsupported-legacy-document'};
  const out=newDocument();out.activeProfileId=input.activeProfileId;const found=new Set();
  for(const p of input.profiles){
   if(!onlyKeys(p,['id','unlockedCharacters','characters','challenge'])||!PROFILE_IDS.includes(p.id)||found.has(p.id)||!uniqueStrings(p.unlockedCharacters,7)||!p.unlockedCharacters.every(id=>CHARACTER_IDS.includes(id))||!STARTERS.every(id=>p.unlockedCharacters.includes(id))||!onlyKeys(p.challenge,['version','xp','checkpoint','completed','rewards','attemptSerial','routeAttempt','selection','difficulty','carry','replayCarry','encounterSerial']))return {ok:false,reason:'unsupported-legacy-profile'};found.add(p.id);
   const c=p.challenge,fresh=Object.keys(c).length===0;
   if(!fresh&&(c.version!==1||!integer(c.xp,0,MAX_XP)||!integer(c.checkpoint,0,6)||typeof c.completed!=='boolean'||c.completed!==(c.checkpoint===6)||!uniqueStrings(c.rewards)||!integer(c.attemptSerial??0)||c.routeAttempt!=null&&(!onlyKeys(c.routeAttempt,['id','checkpoint'])||!integer(c.routeAttempt.id,1,c.attemptSerial??0)||![0,2,4].includes(c.routeAttempt.checkpoint))))return {ok:false,reason:'ambiguous-or-invalid-legacy-progress'};
   if(!validCharacters(p.characters,c.xp??0))return {ok:false,reason:'invalid-legacy-skills'};
   const target=out.profiles.find(q=>q.id===p.id),next=target.campaign;
   target.unlockedCharacters=[...p.unlockedCharacters];target.characters=clone(p.characters);
   // Original per-character XP is optional; keep allocations while normalizing the absent XP to zero.
   for(const record of Object.values(target.characters))record.xp??=0;
   if(fresh)continue;
   if(c.selection)next.selection=clone(c.selection);if(c.difficulty)next.difficulty=c.difficulty;if(c.carry!==undefined)next.carry=clone(c.carry);
   next.xp=c.xp;next.story.opening='legacy-unknown';next.attemptSerial=c.attemptSerial??0;
   next.cursor={chapterId:c.completed?'chapter-2':'chapter-1',stepId:c.completed?'entry':map[c.checkpoint]};
   if(c.completed){next.chapterClears=['chapter-1'];if(!target.unlockedCharacters.includes('huang'))target.unlockedCharacters.push('huang');}
   // Checkpoint proves consumed milestones; migration never grants XP for missing receipts.
   next.receipts=FIRST_CLEAR_STEPS.slice(0,c.checkpoint).map(step=>receiptFor('chapter-1',step));
   const active=c.routeAttempt&&c.routeAttempt.checkpoint===c.checkpoint&&[0,2,4].includes(c.checkpoint);
   if(active)next.attempt={id:c.routeAttempt.id,chapterId:'chapter-1',stepId:map[c.checkpoint],paidEnemyIds:[]};
   for(const receipt of c.rewards){
    const permanent=legacyKeys.indexOf(receipt.replace(/^chapter-1:/,''));
    if(receipt.startsWith('chapter-1:')&&permanent>=0){const value=receiptFor('chapter-1',FIRST_CLEAR_STEPS[permanent]);if(!next.receipts.includes(value))next.receipts.push(value);continue;}
    const mob=/^chapter-1:mob-attempt:(\d+):([a-zA-Z0-9:_-]+)$/.exec(receipt);
    if(mob&&active&&Number(mob[1])===next.attempt.id){if(!next.attempt.paidEnemyIds.includes(mob[2]))next.attempt.paidEnemyIds.push(mob[2]);}
    else next.legacyReceipts.push(receipt);
   }
  }
  return validateDocument(out);
 }catch{return {ok:false,reason:'invalid-legacy-document'};}
}
