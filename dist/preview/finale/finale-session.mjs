import {resolveDialogueFrame} from '../../character-dialogue.mjs?v=dialogue-20261113-r1';
import {FinaleArena} from './finale-engine.mjs?v=campaign-boot-20261112-r3';
import {ENDING,FINALE_OPENING} from './finale-story.mjs?v=campaign-boot-20261112-r3';
import {CAST} from '../../core.mjs?v=campaign-boot-20261112-r3';
const reject=reason=>({accepted:false,persisted:false,reason});

/** Presentation never moves beyond a checkpoint until the v4 writer reads it back. */
export async function createFinaleSession({progress,rng=Math.random,onChange=()=>{}}={}){
 if(!progress||progress.testMode)return reject('preview-only');
 const preview=progress.preview===true;
 const begun=await progress.beginChallenge({chapterId:'finale-3v4'});
 if(!begun.accepted||(!begun.persisted&&!preview))return {...begun,accepted:false};
 let token=begun.token,world=null,mode='team-select',result=null,paused=false,frame=0,serial=0,busy=false,blocked=false,pendingApply=null,issue=null,tail=Promise.resolve(),review=false;
 const saved=()=>progress.readProfile().campaign;
 const notify=()=>{try{onChange();}catch{}};
 const newWorld=()=>{const c=saved();world=new FinaleArena({team:c.finale.team,difficulty:c.difficulty??'easy',statsForCharacter:id=>progress.getChallengeStats(id),rng});mode='battle';result=null;paused=false;};
 const fromSaved=()=>{const step=saved().cursor.stepId;if(step==='battle')newWorld();else{mode=step==='ending'?'story':step;frame=0;world=null;}};
 fromSaved();
 const usable=()=>!busy&&!blocked&&!pendingApply;
 function view(){const s=progress.get(),c=saved(),characterId=c.finale.team?.[0]??c.selection.characterId,frames=mode==='intro'?FINALE_OPENING:ENDING,storyFrame=['story','intro'].includes(mode)?resolveDialogueFrame({...frames[frame],speaker:frames[frame].speaker==='player'?CAST[characterId].name:frames[frame].speaker},characterId):null;
  return {mode,stepId:c.cursor.stepId,token:String(serial),characterId,helperId:c.selection.helperId,difficulty:c.difficulty??'easy',unlocked:progress.availableCharacters(),team:c.finale.team?[...c.finale.team]:null,rounds:{player:0,enemy:0},result,paused,busy,blocked,frameIndex:frame,frameCount:frames.length,storyFrame,
   preview,persisted:!preview&&s.persisted&&!s.dirty&&!busy&&!pendingApply&&!blocked,canNavigate:(s.persisted||preview)&&!s.dirty&&!busy&&!pendingApply&&!blocked&&!s.readOnly,saveIssue:issue??s.reason,saveLabel:preview?'測試模式，不保存進度':busy?'正在確認保存…':pendingApply?'尚未保存，請重試保存':blocked?'進度已變更，請重新接續':'進度已保存',review};
 }
 function operation(work){if(!usable())return Promise.resolve(reject(busy?'busy':pendingApply?'unsaved-progress':issue??'stale-run'));busy=true;notify();const task=tail.then(work).catch(()=>{blocked=true;issue='operation-failed';return reject(issue);});tail=task.catch(()=>{});return task.finally(()=>{busy=false;notify();});}
 async function dispatch(action,apply){
  const r=await progress.dispatchChallenge(token,action);
  if(!r.accepted){blocked=true;issue=r.reason;return r;}token=r.token;
  if(!r.persisted&&!preview){pendingApply=apply;issue=r.reason;return r;}
  apply();serial++;issue=null;return r;
 }
 const chapter={view,get world(){return world;},flush:()=>tail,
  start(team,{opening=false}={}){return operation(()=>dispatch({type:'finale-start',team},()=>{newWorld();if(opening){mode='intro';frame=0;}}));},
  step(dt,input={}){if(!usable()||paused||mode!=='battle')return;world.step(dt,input);if(world.status==='over'){
   result={kind:'battle',winner:world.winner,matchWon:world.winner==='player',matchLost:world.winner==='enemy'};mode='result';serial++;
   if(result.matchWon)operation(()=>dispatch({type:'finale-win'},()=>{}));else notify();
  }},
  press(action){return usable()&&!paused&&mode==='battle'&&world.player.hp>0&&world.press(action);},
  setPaused(value,t){if(!usable()||!['battle','result'].includes(mode)||t!==undefined&&t!==String(serial))return false;paused=!!value;serial++;notify();return true;},
  continueResult(){if(mode!=='result')return Promise.resolve(reject('not-result'));if(result.matchWon){if(!usable())return Promise.resolve(reject('unsaved-progress'));mode='story';frame=0;world=null;serial++;notify();return Promise.resolve({accepted:true,persisted:!preview});}return operation(()=>dispatch({type:'retry'},newWorld));},
  reselect(){if(!['battle','result'].includes(mode)||result?.matchWon)return Promise.resolve(reject('not-battle'));return operation(()=>dispatch({type:'finale-reselect'},()=>{mode='team-select';world=null;paused=false;result=null;}));},
  restartSegment(){if(mode!=='battle'||!paused)return Promise.resolve(reject('not-paused'));return operation(()=>dispatch({type:'retry'},newWorld));},
  nextStory(t){
   if(t!==undefined&&t!==String(serial))return Promise.resolve(reject('stale-run'));
   if(usable()&&mode==='intro'){if(frame+1<FINALE_OPENING.length)frame++;else{mode='battle';frame=0;}serial++;notify();return Promise.resolve({accepted:true,persisted:!preview});}
   if(!usable()||mode!=='story')return Promise.resolve(reject('not-story'));
   if(frame+1<ENDING.length){frame++;serial++;notify();return Promise.resolve({accepted:true,persisted:!review&&!preview});}
   if(review){mode='complete';review=false;serial++;notify();return Promise.resolve({accepted:true,persisted:!preview});}
   return operation(()=>dispatch({type:'story-complete'},()=>{mode='complete';frame=0;}));
  },
  rewindStory(t){
   if(t!==String(serial))return reject('stale-run');
   if(!usable())return reject(busy?'busy':pendingApply?'unsaved-progress':issue??'stale-run');
   if(!['intro','story'].includes(mode))return reject('not-story');
   frame=0;serial++;notify();return {accepted:true,persisted:view().persisted};
  },
  previousStory(t){
   if(t!==String(serial))return reject('stale-run');
   if(!usable())return reject(busy?'busy':pendingApply?'unsaved-progress':issue??'stale-run');
   if(!['intro','story'].includes(mode)||frame<=0)return reject('not-previous-frame');
   frame--;serial++;notify();return {accepted:true,persisted:view().persisted};
  },
  reviewEnding(){if(!usable()||mode!=='complete')return false;mode='story';frame=0;review=true;serial++;notify();return true;},
  preparationSnapshot(){return {...progress.preparationSnapshot(),token:String(serial)};},
  prepareEncounter(draft,options={}){
   if(mode!=='team-select'||options.token!==undefined&&options.token!==String(serial))return Promise.resolve(reject('combat-active'));
   return operation(async()=>{
    const r=await progress.prepareEncounter(draft,{...options,token,intent:'boundary'});if(!r.accepted)return r;token=r.token;
    const apply=()=>{serial++;};if(!r.persisted&&!preview){pendingApply=apply;issue=r.reason;}else apply();return r;
   });
  },
  retrySave(){
   if(busy||blocked)return Promise.resolve(reject(busy?'busy':issue));busy=true;notify();const task=tail.then(async()=>{const r=await progress.retrySave();if(r.accepted&&r.persisted){const apply=pendingApply;pendingApply=null;issue=null;apply?.();serial++;}else if(!r.accepted&&r.reason!=='not-dirty')issue=r.reason;return r;});tail=task.catch(()=>{});return task.finally(()=>{busy=false;notify();});
  },
  exportJSON:()=>progress.exportBackup(),exportLegacyJSON:()=>progress.exportLegacyBackup(),drainEvents:()=>world?.drainEvents()??[]
 };
 return {accepted:true,persisted:!preview,preview,chapter};
}
