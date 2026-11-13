import {resolveDialogueFrame} from '../../character-dialogue.mjs?v=dialogue-20261113-r1';
import {fighterBaseStats} from '../../fighter-attributes.mjs?v=campaign-boot-20261112-r3';
import {normalizeCarry,zeroSkills} from './core/model.mjs?v=campaign-boot-20261112-r3';
// Shared encounter presentation state. Chapter modules provide content only.
let sessionCount=0;
export function createChapterController({chapterId,content:CHAPTER,stepIds:STEP_IDS,storyFrames,characterNames:CHARACTER_NAMES,defaultUnlocked,unlockId,nextChapterId,createRoute,createDuel}, {characterId='wang',difficulty='beginner',rng=Math.random,initialStepId='entry',unlockedIds=null,helperId=null,statsForCharacter=null,initialCarry=null}={}){
 const unlocked=unlockedIds===null?[...defaultUnlocked]:[...new Set(unlockedIds)];if(!STEP_IDS.includes(initialStepId)||!unlocked.every(id=>Object.hasOwn(CHARACTER_NAMES,id)))throw new RangeError('Invalid continuation checkpoint');if(!unlocked.includes(characterId))throw new RangeError('Locked character');
 if(!['beginner','easy','hard'].includes(difficulty))throw new RangeError('Unknown difficulty');
 const id=++sessionCount;let revision=0,cursor=STEP_IDS.indexOf(initialStepId),character=characterId,mode='story',frame=0,frames=[],world=null,carry=normalizeCarry(initialCarry),rounds={player:0,enemy:0},result=null,paused=false,events=[];
 const token=()=>`${chapterId}-playable:${id}:${revision}`;
 const helper=()=>helperId??(character==='han'?'wang':'han');
 const stats=()=>statsForCharacter?.(character)??fighterBaseStats(character);
 const story=key=>{frames=storyFrames(key,character);frame=0;mode='story';};
 const battle=()=>{world=createDuel({stepId:STEP_IDS[cursor],characterId:character,helperId:helper(),difficulty,rng,stats:stats()});mode='battle';};
 function enter(){
  const step=STEP_IDS[cursor];result=null;frame=0;
  if(step==='entry')story('entry');
  else if(step.startsWith('route-')){const routeIndex=['route-a','route-b','route-c'].indexOf(step);world=createRoute({routeIndex,characterId:character,helperId:helper(),difficulty,rng,carry:carry?{...carry,assist:{...carry.assist,helper:helper()}}:null,stats:stats()});mode='route';}
  else if(step.startsWith('miniboss')){const gate=CHAPTER.routes.find(r=>r.gate.id===`${chapterId}:${step}`).gate;frames=gate.dialogue.map(([speaker,copy,voiceKey])=>resolveDialogueFrame({speaker:speaker==='player'?CHARACTER_NAMES[character]:speaker,title:gate.name,copy,voiceKey,shot:gate.mobKind,direction:gate.counterplay},character));mode='story';}
  else if(step==='boss-comic')story('beforeBoss');
  else if(step==='boss')battle();
  else if(step==='handoff-comic')story('handoff');
  else if(step==='roster-choice')mode='choice';
 }
 function view(){return {stepId:STEP_IDS[cursor]??'complete',mode,token:token(),characterId:character,helperId:helper(),unlocked:[...unlocked],rounds:{...rounds},result:result?{...result}:null,paused,persisted:false,frameIndex:frame,frameCount:frames.length,storyFrame:mode==='story'?{...frames[frame]}:null,nextChapterId:mode==='complete'?nextChapterId:null,difficulty};}
 const valid=t=>t===token();
 function nextStory(t){if(!valid(t)||mode!=='story')return false;if(++frame<frames.length){revision++;return true;}
  if(STEP_IDS[cursor].startsWith('miniboss'))battle();else{cursor++;enter();}revision++;return true;
 }
 function rewindStory(t){if(!valid(t)||mode!=='story')return false;frame=0;revision++;return true;}
 function step(dt,input={}){
  if(paused||!['route','battle'].includes(mode))return;
  world.step(dt,input);const current=world.drainEvents();events.push(...current);
  if(mode==='route'&&world.status==='gate'){carry=world.exportCarry();cursor++;enter();revision++;}
  else if(mode==='route'&&world.status==='lost'){result={kind:'route',winner:'enemy',matchLost:true};mode='result';revision++;}
  else if(mode==='battle'&&world.status==='over'){
   const target=STEP_IDS[cursor]==='boss'?2:1,winner=world.winner;if(winner==='player'||winner==='enemy')rounds[winner]++;
   result={kind:'battle',winner,matchWon:rounds.player>=target,matchLost:rounds.enemy>=target};if(result.matchWon)carry=normalizeCarry({hp:world.player.hp,rally:world.player.rally,assist:{...world.player.assist,active:false}});mode='result';if(result.matchWon&&STEP_IDS[cursor]==='boss'&&!unlocked.includes(unlockId))unlocked.push(unlockId);revision++;
  }
 }
 function continueResult(t){if(!valid(t)||mode!=='result')return false;
  if(result.kind==='route'){carry=null;enter();}
  else if(result.matchWon){rounds={player:0,enemy:0};cursor++;enter();}
  else {if(result.matchLost)rounds={player:0,enemy:0};battle();result=null;}
  revision++;return true;
 }
 function chooseCharacter(next,t){
  if(!valid(t)||!unlocked.includes(next)||mode==='complete')return false;
  if(next===character)return true;
  return prepareEncounter({...preparationSnapshot(),characterId:next},{token:t,intent:'boundary'}).accepted;
 }
 // Explicit confirmed restart of this encounter, not a chapter rewind or a
 // character change. Discard old event queues before the replacement can run.
 function restartSegment(t){
  if(!valid(t)||!paused||!['route','battle'].includes(mode))return false;
  const route=mode==='route';carry=null;rounds={player:0,enemy:0};result=null;events=[];
  if(route)enter();else battle();
  paused=false;revision++;return true;
 }
 function chooseHelper(next,t){
  if(!valid(t)||!unlocked.includes(next)||mode==='complete')return false;
  if(next===helper())return true;
  return prepareEncounter({...preparationSnapshot(),helperId:next},{token:t,intent:'boundary'}).accepted;
 }
 function setPaused(value,t){if(!valid(t)||typeof value!=='boolean'||!['route','battle'].includes(mode))return false;paused=value;revision++;return true;}
 function preparationSnapshot(){return {characterId:character,helperId:helper(),difficulty,unlockedCharacters:[...unlocked],allowance:stats()?.allowance??0,characters:Object.fromEntries(unlocked.map(id=>[id,{skills:{...zeroSkills(),...statsForCharacter?.(id)?.skills}}])),token:token()};}
 function prepareEncounter(draft,options={}){
  const reject=reason=>({accepted:false,persisted:false,reason});
  if(options.token!==undefined&&!valid(options.token)||mode==='complete')return reject('stale-run');
  if(!draft||![draft.characterId,draft.helperId].every(id=>unlocked.includes(id))||!['beginner','easy','hard'].includes(draft.difficulty))return reject('invalid-preparation');
  const intent=options.intent;
  if(!['boundary','retry'].includes(intent))return reject('explicit-intent-required');
  const boundary=['story','choice'].includes(mode)||mode==='result'&&result?.matchWon;
  if(intent==='boundary'&&!boundary)return reject('retry-required');
  if(intent==='retry'&&!((paused&&['route','battle'].includes(mode))||mode==='result'&&!result?.matchWon))return reject('not-paused');
  const oldMax=stats()?.maxHp??world?.player?.maxHp??100;
  character=draft.characterId;helperId=draft.helperId;difficulty=draft.difficulty;
  if(intent==='boundary'){
   if(Object.hasOwn(options,'carry'))carry=normalizeCarry(options.carry);
   else if(carry){const max=stats()?.maxHp??oldMax;carry=normalizeCarry({...carry,hp:Math.min(carry.hp,max),assist:{...carry.assist,helper:helper(),damageTaken:carry.assist.damageTaken*max/oldMax}});}
   // Configuration is saved now; the player still explicitly continues the
   // current story/result. A boundary edit never grants a new attempt or heal.
   if(mode==='story'){const oldFrame=frame;enter();frame=Math.min(oldFrame,frames.length-1);}
  }else{
   const route=STEP_IDS[cursor].startsWith('route');carry=null;rounds={player:0,enemy:0};result=null;events=[];
   if(route)enter();else battle();paused=false;
  }
  revision++;return {accepted:true,persisted:false,preview:true,intent};
 }
 function capture(){return {revision,cursor,character,mode,frame,frames,world,carry,rounds:{...rounds},result:result?{...result}:null,paused,events:[...events],difficulty,helperId,unlocked:[...unlocked]};}
 function restore(s){({revision,cursor,character,mode,frame,frames,world,carry,rounds,result,paused,events,difficulty,helperId}=s);unlocked.splice(0,unlocked.length,...s.unlocked);}
 function finishChapter(t){if(!valid(t)||mode!=='choice')return false;mode='complete';cursor=STEP_IDS.length;revision++;return true;}
 // Stage presentation state while the just-finished world stays frozen. The bridge
 // commits this exact transition only after durable readback, including retries.
 function stage(method,...args){
  const methods={step,nextStory,continueResult,finishChapter};if(!methods[method])return null;
  const before=capture(),accepted=methods[method](...args)!==false,after=capture(),nextView=view(),emitted=events.splice(0);after.events=[];restore(before);
  let applied=false;return {accepted,view:nextView,events:emitted,carry:normalizeCarry(after.carry),apply(){if(applied)return true;if(revision!==before.revision)return false;restore(after);applied=true;return true;}};
 }
 enter();
 return {view,preparationSnapshot,prepareEncounter,stage,get world(){return world;},step,nextStory,rewindStory,continueResult,chooseCharacter,chooseHelper,setPaused,restartSegment,
  press(action,t){return valid(t)&&!paused&&['route','battle'].includes(mode)?world.press(action):false;},
  finishChapter,
  drainEvents(){return events.splice(0);}
 };
}
