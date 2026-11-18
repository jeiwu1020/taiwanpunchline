/** Scene transitions are staged until the authority confirms durable readback. */
export async function createCampaignPlayable({router,chapterId,createPlayableChapter,options={},onChange=()=>{}}={}){
 if(!router?.enabled)return {accepted:false,persisted:false,reason:'preview-only'};
 const started=await router.begin(chapterId,{difficulty:options.difficulty});
 if(!started.accepted||!started.persisted)return {...started,accepted:false,recovery:router};
 const initial=router.view();
 const local=createPlayableChapter({...options,characterId:initial.selection.characterId,helperId:initial.selection.helperId,difficulty:initial.difficulty??options.difficulty,
  initialCarry:initial.carry??null,initialStepId:initial.stepId,unlockedIds:initial.unlocked,statsForCharacter:id=>router.statsForCharacter?.(id)});
 if(local.view().stepId!==initial.stepId){router.cancel();return {accepted:false,persisted:initial.persisted,reason:'resume-adapter-required'};}
 let runToken=started.token,busy=false,blocked=false,saveIssue=null,pendingApply=null,tail=Promise.resolve(),outbound=[];
 const notify=()=>{try{onChange();}catch{}};
 const reject=reason=>({accepted:false,persisted:view().persisted,reason});
 const view=()=>{const s=local.view(),v=router.view();return {...s,unlocked:[...v.unlocked],persisted:v.persisted&&!busy&&!blocked&&!pendingApply,busy,blocked,saveIssue,
  canNavigate:v.canNavigate&&!busy&&!blocked&&!pendingApply,saveLabel:blocked?'進度已在其他頁面變更，請重新接續':busy?'正在確認保存…':pendingApply?'尚未保存，請重試保存或匯出備份':v.saveLabel,
  campaignChapterId:v.chapterId,campaignStepId:v.stepId,nextRoute:{...v.route}};};
 const usable=t=>!busy&&!blocked&&!pendingApply&&t===local.view().token;
 function enqueue(work){busy=true;notify();const task=tail.then(work).catch(()=>{blocked=true;saveIssue='bridge-failed';return reject(saveIssue);});tail=task.catch(()=>{});return task.finally(()=>{busy=false;notify();});}
 function commit(apply){if(apply&&apply()===false){blocked=true;saveIssue='stale-run';return false;}pendingApply=null;saveIssue=null;return true;}
 async function persist(actions,apply){
  let result={accepted:true,persisted:true};
  if(router.version===4){
   // All rewards and the checkpoint transition produced by one simulation
   // frame share one atomic save. Quota failure cannot strand later events.
   result=await router.dispatch(runToken,actions);
   if(!result.accepted){blocked=true;saveIssue=result.reason;return result;}
   runToken=result.token;
  }else for(const action of actions){
   result=await router.dispatch(runToken,action);
   if(!result.accepted){if(action.type==='mob-defeated'&&result.reason==='duplicate-reward')continue;blocked=true;saveIssue=result.reason;return result;}
   runToken=result.token;
  }
  if(!result.persisted||router.view().dirty){pendingApply=apply??(()=>true);saveIssue=result.reason??'unsaved-progress';return {...result,persisted:false};}
  return {...result,accepted:commit(apply)};
 }
 function staged(method,args,actionsFor){
  if(!usable(method==='step'?local.view().token:args.at(-1)))return false;
  const before=local.view(),transition=local.stage(method,...args);if(!transition?.accepted)return false;
  const actions=actionsFor(before,transition.view,transition);outbound.push(...transition.events);
  if(actions.length)enqueue(()=>persist(actions,transition.apply));else commit(transition.apply);
  return true;
 }
 function preparationSnapshot(){const saved=router.preparationSnapshot?.()??router.growthView(),s=local.view();return {...saved,characterId:s.characterId,helperId:s.helperId,difficulty:s.difficulty,expectedRevision:saved.expectedRevision??saved.revision,token:s.token};}
 async function prepareEncounter(draft,options={}){
  if(!usable(options.token??local.view().token))return reject(busy?'busy':pendingApply?'unsaved-progress':blocked?saveIssue:'stale-run');
  const before=local.view();if(!before.paused&&['route','battle'].includes(before.mode))return reject('combat-active');
  const intent=options.intent;if(!['boundary','retry'].includes(intent))return reject('explicit-intent-required');
  const boundary=['story','choice'].includes(before.mode)||before.mode==='result'&&before.result?.matchWon;
  if(intent==='boundary'&&!boundary)return reject('retry-required');
  if(intent==='retry'&&!((before.paused&&['route','battle'].includes(before.mode))||before.mode==='result'&&!before.result?.matchWon))return reject('not-paused');
  if(!router.prepareEncounter)return reject('preparation-unavailable');
  const token=before.token;
  return enqueue(async()=>{
   const r=await router.prepareEncounter(draft,{...options,token:runToken});
   if(!r.accepted){if(['stale-run','stale-revision','profile-changed','source-changed'].includes(r.reason)){blocked=true;saveIssue=r.reason;}return r;}
   runToken=r.token;
   const apply=()=>local.prepareEncounter(draft,{token,intent,...(Object.hasOwn(r,'carry')?{carry:r.carry}:{})}).accepted;
   if(!r.persisted){pendingApply=apply;saveIssue=r.reason;return r;}
   return {...r,accepted:commit(apply)};
  });
 }
 async function restartSegment(t){
  const s=local.view();if(!usable(t))return reject(busy?'busy':pendingApply?'unsaved-progress':saveIssue??'stale-run');
  if(!s.paused||!['route','battle'].includes(s.mode))return reject('not-paused');
  const snapshot=preparationSnapshot();return prepareEncounter(snapshot,{...snapshot,intent:'retry'});
 }
 async function changeGrowth(id,skill,reset=false){const draft=preparationSnapshot();draft.characters=structuredClone(draft.characters);const current=draft.characters[id]?.skills??Object.fromEntries(['hp','move','basic','defense','special','rally','assist'].map(k=>[k,0]));draft.characters[id]={skills:reset?Object.fromEntries(Object.keys(current).map(k=>[k,0])):{...current,[skill]:(current[skill]??0)+1}};return prepareEncounter(draft,{...draft,intent:'boundary'});}
 const chapter={view,preparationSnapshot,prepareEncounter,restartSegment,get world(){return local.world;},flush:()=>tail,
  growthView(){const s=router.growthView(),l=local.view();return {...s,busy,readOnly:s.readOnly||blocked||!!pendingApply||['route','battle'].includes(l.mode),persisted:s.persisted&&!busy&&!blocked&&!pendingApply,reason:saveIssue??s.reason};},
  allocate:(id,skill)=>changeGrowth(id,skill),reset:id=>changeGrowth(id,null,true),
  chooseHelper(id,t){const d=preparationSnapshot();return prepareEncounter({...d,helperId:id},{...d,token:t,intent:'boundary'});},
  chooseCharacter(id,t){if(!usable(t)||!router.view().unlocked.includes(id))return false;const d=preparationSnapshot();prepareEncounter({...d,characterId:id},{...d,token:t,intent:'boundary'});return true;},
  step(dt,input){staged('step',[dt,input],(before,after,transition)=>{
   const actions=[];if(before.mode==='route'){for(const e of transition.events)if(e.type==='enemyDefeated')actions.push({type:'mob-defeated',enemyId:e.encounterId,xp:e.xp});if(after.stepId!==before.stepId)actions.push({type:'route-complete',carry:transition.carry});}
   else if(before.mode==='battle'&&after.mode==='result'&&after.result?.matchWon)actions.push({type:'boss-win',carry:{hp:local.world.player.hp,rally:local.world.player.rally,assist:{...local.world.player.assist,active:false}}});return actions;
  });},
  beginBattle(t){return usable(t)&&local.beginBattle(t);},
  nextStory(t){return staged('nextStory',[t],(before,after)=>before.stepId!==after.stepId?[{type:'story-complete'}]:[]);},
  rewindStory(t){if(!usable(t)||!local.rewindStory(t))return false;notify();return true;},
  previousStory(t){if(!usable(t)||!local.previousStory(t))return false;notify();return true;},
  continueResult(t){return staged('continueResult',[t],before=>before.result?.matchLost?[{type:'retry'}]:[]);},
  setPaused(value,t){return usable(t)&&local.setPaused(value,t);},press(action,t){return usable(t)&&local.press(action,t);},
  finishChapter(t){return staged('finishChapter',[t],()=>[{type:'continue'}]);},
  drainEvents(){return outbound.splice(0);},
  async retrySave(){await tail;if(busy)return reject('busy');return enqueue(async()=>{const r=await router.retrySave();if(r.accepted&&r.persisted&&!blocked)commit(pendingApply);else if(!r.accepted&&r.reason!=='not-dirty'){saveIssue=r.reason;if(['save-conflict','source-changed','authority-changed'].includes(r.reason))blocked=true;}return {...r,persisted:r.persisted&&!blocked&&!pendingApply};});},
  exportJSON:()=>router.exportJSON(),exportLegacyJSON:()=>router.exportLegacyJSON()
 };
 return {accepted:true,persisted:true,chapter};
}
