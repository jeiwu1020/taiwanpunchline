import {clone,validateDocument,currentProfile,integer,uniqueStrings,onlyKeys,allowance,zeroSkills,SKILLS,MAX_XP,MAX_RANK,MAX_SERIAL,validCharacters,normalizeCarry} from './model.mjs?v=post69-street-seam-cull-20261112-r1';
import {CHARACTER_IDS,CHAPTERS,STEPS,ROUTES,chapterById,receiptFor,storyFor} from './catalog.mjs?v=post69-street-seam-cull-20261112-r1';
const reject=reason=>({ok:false,reason});
function checked(input){const v=validateDocument(input);return v.ok?v.document:null;}
function finish(d,p,extra={}){
 if(d.revision>=MAX_SERIAL||p.campaign.revision>=MAX_SERIAL)return reject('revision-limit');
 d.revision++;p.campaign.revision++;const v=validateDocument(d);return v.ok?{...v,...extra}:v;
}
const attemptKey=run=>run.replay?'replayAttempt':'attempt';
function setupAttempt(c,run,{force=false}={}){
 const key=attemptKey(run);
 if(!ROUTES.includes(run.stepId)){run.attemptId=null;return true;}
 if(!force&&c[key]?.chapterId===run.chapterId&&c[key].stepId===run.stepId){run.attemptId=c[key].id;return true;}
 if(c.attemptSerial>=MAX_SERIAL)return false;
 c[key]={id:++c.attemptSerial,chapterId:run.chapterId,stepId:run.stepId,paidEnemyIds:[]};run.attemptId=c[key].id;return true;
}
function award(p,amount){
 const c=p.campaign,id=c.selection.characterId,old=p.characters[id]??{xp:0,skills:zeroSkills()};
 c.xp=Math.min(MAX_XP,c.xp+amount);p.characters[id]={xp:Math.min(MAX_XP,old.xp+amount),skills:{...old.skills}};
}
function firstClear(p,run,amount){const key=receiptFor(run.chapterId,run.stepId);if(p.campaign.receipts.includes(key))return 0;p.campaign.receipts.push(key);award(p,amount);return amount;}
function setCursor(c,run){if(!run.replay)c.cursor={chapterId:run.chapterId,stepId:run.stepId};}
export function startRun(input,{replayChapterId=null}={}){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d),c=p.campaign;
 if(replayChapterId!==null&&(!chapterById(replayChapterId)||!c.chapterClears.includes(replayChapterId)))return reject('chapter-not-cleared');
 const cursor=replayChapterId?{chapterId:replayChapterId,stepId:'route-a'}:c.cursor;
 if(cursor.chapterId==='finale-3v4')return reject('finale-ready');
 const run={profileId:p.id,chapterId:cursor.chapterId,stepId:cursor.stepId,replay:replayChapterId!==null,finished:false,attemptId:null};
 if(!setupAttempt(c,run,{force:true}))return reject('attempt-limit');if(run.replay)c.replayCarry=null;
 return finish(d,p,{run});
}
export function applyRunAction(input,previous,action){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d),c=p.campaign;
 if(!onlyKeys(previous,['profileId','chapterId','stepId','replay','finished','attemptId'])||previous.profileId!==p.id||!chapterById(previous.chapterId)||!STEPS.includes(previous.stepId)||typeof previous.replay!=='boolean'||previous.finished!==false)return reject('invalid-run');
 if(previous.replay?!c.chapterClears.includes(previous.chapterId):c.cursor.chapterId!==previous.chapterId||c.cursor.stepId!==previous.stepId)return reject('stale-run');
 if(!onlyKeys(action,['type','enemyId','xp','carry'])||typeof action.type!=='string')return reject('invalid-action');
 const run=clone(previous),step=run.stepId,key=attemptKey(run),attempt=c[key],carryKey=run.replay?'replayCarry':'carry';let rewardedXP=0;
 if(ROUTES.includes(step)&&(!attempt||attempt.id!==run.attemptId||attempt.chapterId!==run.chapterId||attempt.stepId!==step))return reject('stale-attempt');
 if(action.type==='mob-defeated'){
  if(!ROUTES.includes(step)||!uniqueStrings([action.enemyId],1)||action.enemyId.length>100||!integer(action.xp,0,400))return reject('invalid-mob-reward');
  if(attempt.paidEnemyIds.includes(action.enemyId))return reject('duplicate-reward');
  if(attempt.paidEnemyIds.length>=1000)return reject('receipt-limit');attempt.paidEnemyIds.push(action.enemyId);award(p,action.xp);rewardedXP=action.xp;
 }else if(action.type==='retry'){
  if(!ROUTES.includes(step)&&!['miniboss-a','miniboss-b','boss'].includes(step))return reject('invalid-retry');
  if(!setupAttempt(c,run,{force:true}))return reject('attempt-limit');c[carryKey]=null;
 }else if(action.type==='story-complete'){
  if(!['entry','boss-comic','handoff-comic'].includes(step))return reject('not-story');
  const id=storyFor(run.chapterId,step);if(!c.story.seen.includes(id))c.story.seen.push(id);
  if(step==='entry'){if(!run.replay&&run.chapterId==='chapter-1')c.story.opening='seen';run.stepId='route-a';}
  else if(step==='boss-comic'){run.stepId='boss';c[carryKey]=null;}
  else{run.stepId='roster-choice';if(!run.replay)c.story.pending=null;}
  if(!setupAttempt(c,run))return reject('attempt-limit');setCursor(c,run);
 }else if(action.type==='route-complete'){
  c[carryKey]=normalizeCarry(action.carry);
  if(!ROUTES.includes(step))return reject('not-route');rewardedXP=firstClear(p,run,25);
  run.stepId=({'route-a':'miniboss-a','route-b':'miniboss-b','route-c':'boss-comic'})[step];c[key]=null;run.attemptId=null;setCursor(c,run);
 }else if(action.type==='boss-win'){
  c[carryKey]=normalizeCarry(action.carry);
  if(!['miniboss-a','miniboss-b','boss'].includes(step))return reject('not-boss');rewardedXP=firstClear(p,run,step==='boss'?160:100);
  if(step==='boss'){
   const chapter=chapterById(run.chapterId);run.stepId='handoff-comic';
   if(!run.replay){if(chapter.index!==c.chapterClears.length)return reject('out-of-order-clear');c.chapterClears.push(chapter.id);if(!p.unlockedCharacters.includes(chapter.boss))p.unlockedCharacters.push(chapter.boss);c.story.pending=storyFor(chapter.id,'handoff-comic');c.finale.status=c.chapterClears.length===5?'ready':'not-ready';}
  }else run.stepId=step==='miniboss-a'?'route-b':'route-c';
  if(!setupAttempt(c,run))return reject('attempt-limit');setCursor(c,run);
 }else if(action.type==='continue'){
  if(step!=='roster-choice')return reject('not-handoff');
  if(run.replay)run.finished=true;
  else{c.carry=null;const next=CHAPTERS[chapterById(run.chapterId).index+1];run.chapterId=next?.id??'finale-3v4';run.stepId=next?'entry':'team-select';run.finished=!next;setCursor(c,run);}
 }else return reject('unknown-action');
 return finish(d,p,{run,rewardedXP});
}
export function chooseCharacters(input,{characterId,helperId}={}){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d);
 if(![characterId,helperId].every(id=>p.unlockedCharacters.includes(id)))return reject('character-locked');p.campaign.selection={characterId,helperId};return finish(d,p);
}
export function allocateSkill(input,id,skill){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d);
 if(!p.unlockedCharacters.includes(id)||!SKILLS.includes(skill))return reject('invalid-allocation');
 const old=p.characters[id]??{xp:0,skills:zeroSkills()},r={...old.skills};
 if(r[skill]>=MAX_RANK||Object.values(r).reduce((a,b)=>a+b,0)>=allowance(p.campaign.xp))return reject('no-skill-point');r[skill]++;p.characters[id]={xp:old.xp,skills:r};return finish(d,p);
}
export function resetSkills(input,id){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d);if(!p.unlockedCharacters.includes(id))return reject('character-locked');p.characters[id]={xp:p.characters[id]?.xp??0,skills:zeroSkills()};return finish(d,p);
}
export function finaleEligibility(profile){
 const c=profile?.campaign;if(!c||!CHAPTERS.every(ch=>c.chapterClears?.includes(ch.id)))return {ready:false,reason:'chapters-incomplete'};
 if(!CHARACTER_IDS.every(id=>profile.unlockedCharacters?.includes(id)))return {ready:false,reason:'characters-missing'};
 return {ready:true,characterIds:[...CHARACTER_IDS]};
}

export function prepareParty(input,draft){
 const d=checked(input);if(!d)return reject('invalid-document');const p=currentProfile(d),c=p.campaign;
 if(!draft||![draft.characterId,draft.helperId].every(id=>p.unlockedCharacters.includes(id)))return reject('character-locked');
 if(!['beginner','easy','hard'].includes(draft.difficulty))return reject('invalid-difficulty');
 const characters=clone(p.characters);
 for(const [id,record] of Object.entries(draft.characters??{})){if(!p.unlockedCharacters.includes(id)||!record?.skills)return reject('invalid-allocation');characters[id]={xp:p.characters[id]?.xp??0,skills:clone(record.skills)};}
 if(!validCharacters(characters,c.xp))return reject('invalid-allocation');
 p.characters=characters;c.selection={characterId:draft.characterId,helperId:draft.helperId};c.difficulty=draft.difficulty;
 return finish(d,p);
}
