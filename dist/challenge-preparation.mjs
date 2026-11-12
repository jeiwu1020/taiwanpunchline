import {mountGameSelects} from './game-select.mjs?v=campaign-visuals-20261112-r2';
import {SKILLS,MAX_RANK} from './preview/campaign/core/model.mjs?v=campaign-visuals-20261112-r2';
import {mountChallengeDialogViewport} from './challenge-dialog-viewport.mjs?v=campaign-visuals-20261112-r2';
import {saveIssueText} from './save-copy.mjs?v=campaign-visuals-20261112-r2';
import {characterAbilityMarkup} from './challenge-ability-view.mjs?v=campaign-visuals-20261112-r2';
const labels={hp:'續航氣勢',move:'靈活走位',basic:'基本功',defense:'防守韌性',special:'招牌絕招',rally:'揪團聲勢',assist:'助拳默契'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
const zero=()=>Object.fromEntries(SKILLS.map(k=>[k,0]));
export function preparationScope(state={}){
 const kind=state.phase?.kind??state.mode,boss=state.stepId==='boss'||state.phase?.gate?.kind==='boss';
 if(kind==='story'||kind==='choice'||kind==='complete'||kind==='entry'||kind==='menu'||state.safeBoundary||state.mode==='result'&&state.result?.matchWon)return '確認後於下一段出戰生效，不重播已完成的路段。';
 if(boss)return '確認後重開整場三戰兩勝頭目戰，比分歸零。';
 if(kind==='battle'||kind==='boss'||state.stepId?.startsWith('miniboss'))return '確認後重開目前這一場小頭目戰。';
 return '確認後從目前路段起點重新出發。';
}
export function downloadChallengeBackup(document,window,text,name){
 if(text==null)return false;const url=window.URL.createObjectURL(new window.Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();window.setTimeout(()=>window.URL.revokeObjectURL(url),1000);return true;
}
/** One recovery surface, deliberately independent from pause availability. */
export function mountChallengeRecovery({document,window=document.defaultView,parent=document.body,getState=()=>({}),retrySave,exportCurrent,exportLegacy,exportCurrentLabel='匯出目前備份',reloadLatest=()=>window.location.reload(),onRecovered=()=>{},onBusy=()=>{},id='challengeRecoveryPanel'}={}){
 const element=document.createElement('section');element.id=id;element.className='challenge-recovery-panel';element.setAttribute('aria-label','進度保存與復原');parent.append(element);
 element.innerHTML='<p role="status" aria-live="polite"></p><div class="challenge-recovery-actions"><button type="button" data-recovery="retry">重試保存</button><button type="button" data-recovery="current">匯出目前備份</button><button type="button" data-recovery="legacy">匯出原版備份</button><button type="button" data-recovery="reload">重新接續最新進度</button></div>';
 let busy=false,message='',disposed=false;const q=s=>element.querySelector(s);q('[data-recovery="current"]').textContent=exportCurrentLabel;
 function refresh(){if(disposed)return;const s=getState()||{},needed=(s.persisted===false&&s.initialized!==false)||s.dirty||s.blocked||s.storageIssue||s.saveIssue;element.hidden=!needed&&!busy;q('[role="status"]').textContent=message||(needed?'進度尚未保存。'+saveIssueText(s.saveIssue||s.reason||s.storageIssue):'進度已確認保存。');q('[data-recovery="retry"]').hidden=!retrySave;q('[data-recovery="retry"]').disabled=busy||!!s.busy;q('[data-recovery="current"]').hidden=!exportCurrent;q('[data-recovery="legacy"]').hidden=!exportLegacy;for(const b of element.querySelectorAll('button'))if(b.dataset.recovery==='reload')b.disabled=busy;}
 async function retry(){if(disposed||busy||getState()?.busy||!retrySave)return;busy=true;message='正在重試尚未完成的保存…';onBusy(true);refresh();try{const result=await retrySave();if(disposed)return;if(result?.accepted===true&&result.persisted===true){message='進度已確認保存。';await onRecovered(result);}else message='仍未確認保存。'+saveIssueText(result?.reason);}catch{message='無法確認保存結果，請保留此頁並匯出備份。';}finally{busy=false;if(!disposed){onBusy(false);refresh();}}}
 q('[data-recovery="retry"]').onclick=retry;q('[data-recovery="reload"]').onclick=()=>{if(busy)return;if(window.confirm('重新接續最新進度？本頁尚未保存的變更不會套用。建議先匯出目前與原版備份；已保存的原檔不會被覆寫。'))reloadLatest();};for(const [kind,getter,name]of [['current',exportCurrent,'punchline-current-backup.json'],['legacy',exportLegacy,'punchline-original-backup.json']])q(`[data-recovery="${kind}"]`).onclick=async()=>{try{const downloaded=downloadChallengeBackup(document,window,await getter?.(),name);message=downloaded?'備份下載已送出，請確認檔案已保存。':'沒有可下載的備份，原存檔未變更。';}catch{message='無法匯出備份，未變更存檔。';}refresh();};refresh();
 return{element,refresh,get busy(){return busy;},destroy(){disposed=true;element.remove();}};
}
/** Drafts own no storage. Only the controller's guarded transaction can commit.
 * open({characterId, readOnly, intent, token, initial}) separates inspection from
 * assignment. Explicit intents: save-only, start, resume, boundary, retry.
 * onApplied runs only after accepted + persisted (or explicit test preview), and
 * receives {intent, characterId, draft, keepPaused, scope}; save-only never starts.
 */
export function mountChallengePreparation({document,window=document.defaultView,characters={},controller,getEncounter=()=>({}),applyPreparation=null,onApplied=()=>{},onClose=()=>{},onBusy=()=>{},onFailure=()=>{},parent=document.body,embedded=false}={}){
 const dialog=document.createElement(embedded?'section':'dialog');dialog.id=embedded?'challengePreparationPage':'challengePreparationOverlay';dialog.dataset.embedded=String(embedded);if(embedded)dialog.hidden=true;dialog.className='challenge-preparation-overlay'+(embedded?'':' challenge-dialog');dialog.setAttribute('aria-labelledby',(embedded?'overview-':'')+'challengePreparationTitle');parent.append(dialog);
 // The same isolated stylesheet is loaded by root and standalone chapter callers.
 if(!document.querySelector('link[data-challenge-preparation-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./challenge-preparation.css?v=campaign-visuals-20261112-r2',import.meta.url).href;style.dataset.challengePreparationStyle='';document.head?.append(style);}
 const viewport=embedded?{sync(){},destroy(){}}:mountChallengeDialogViewport(dialog,{document,maxWidth:940,savedRecoveryExit:()=>!disposed&&isOpen()&&failed&&destinationSaved&&!busy?displayFailure?.result?.savedReload:null,unreadyActionToken:e=>{const control=e.target?.closest?.('button');return !disposed&&isOpen()&&failed&&destinationSaved&&!busy&&displayFailure?.result?.reason==='scene-unavailable'&&displayFailure.result.isCurrent?.()===true&&control===q('#preparationCancel')&&!control.disabled&&!control.hidden?displayFailure.token:null;}});
 const isOpen=()=>dialog.hasAttribute('open');
 let baseline='',selects=null,snapshot=null,draft=null,inspect='',readOnly=false,busy=false,failed=false,stale=false,destinationSaved=false,displayFailure=null,keepPaused=false,previousFocus=null,status='',disposed=false,recovery=null,context=null,intent='save-only',explicitIntent=false;
 const elementId=id=>(embedded?'overview-':'')+id;
 const q=s=>dialog.querySelector(embedded?s.replace(/(?:preparation|challengePreparation)[A-Z]\w*/g,elementId):s),name=id=>characters[id]?.name||id;
 const ids=()=>snapshot?.unlockedCharacters?.filter(id=>characters[id])||[];
 const ranks=()=>draft?.characters?.[inspect]?.skills||zero();
 const testMode=()=>snapshot?.testMode===true;
 function scope(){
  if(testMode()){
   const notice='測試模式，不保存／不記錄進度。';
   if(readOnly)return notice+'只查看目前測試配置，關閉後仍維持暫停。';
   if(intent==='save-only')return notice+'只套用此次測試配置，不會開始戰鬥。離開測試模式即捨棄，正式存檔不變。';
   if(intent==='boundary')return notice+preparationScope(getEncounter())+' 保留目前漫畫／結算畫面，按繼續後生效。';
   if(intent==='retry')return notice+preparationScope(getEncounter())+' 套用配置並重試本段測試。';
   return notice+'套用配置並進入此次測試，不會建立正式進度或解鎖。';
  }
  if(readOnly)return '戰鬥中僅查看已保存能力，不會換人或配點。關閉後仍維持暫停。';
  if(explicitIntent){
   if(intent==='save-only')return '只保存主角、助拳、難度與配點，不會開始戰鬥。永久經驗、解鎖與已完成進度保留。';
   if(intent==='boundary')return preparationScope(getEncounter())+' 保留目前漫畫／結算畫面，按繼續後生效。沿用氣勢、助拳與揪團；換主角或增加上限不免費補血，換助手不刷新充能。小／大頭目入場才依原規則重置。';
   if(intent==='retry')return preparationScope(getEncounter())+' 本次明確重試，氣勢、助拳與揪團依本場重開規則重置。';
   return '確認後接續本路段檢查點，不是逐幀還原。沿用已保存氣勢、助拳與揪團；換主角或加氣勢不免費補血，換助手不刷新充能。小／大頭目入場才按原規則重置。';
  }
  return (getEncounter()?.mode==='entry'&&JSON.stringify(draft)===baseline?'依這一槽接續，沿用已保存的路段氣勢、助拳與揪團；小／大頭目入場依原規則重置。':preparationScope(getEncounter())+' 氣勢與本場狀態會按該關重開規則重置。')+' 永久經驗、配點額度與已保存進度不倒退。';
 }
 function render(focusSelector){if(!snapshot||disposed)return;const scroll=q('.challenge-preparation-panel')?.scrollTop||0;const expanded=isOpen()?Object.fromEntries([...dialog.querySelectorAll('[data-preparation-reference]')].map(node=>[node.dataset.preparationReference,node.open])):{};selects?.close();recovery?.destroy();recovery=null;const locked=busy||failed||readOnly;
  const ability=characterAbilityMarkup({id:inspect,character:characters[inspect],savedSkills:snapshot.characters?.[inspect]?.skills||zero(),draftSkills:ranks(),allowance:snapshot.allowance||0,readOnly,locked});
  const abilityView=testMode()?ability.replaceAll('已保存','目前套用').replaceAll('確認保存前不改原檔','確認套用前不改測試配置'):ability;
  const options=value=>ids().map(id=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(name(id))}</option>`).join('');
  dialog.setAttribute('aria-busy',String(busy));dialog.innerHTML=`<section class="challenge-preparation-panel challenge-paper"><div class="preparation-heading"><div><small>拳民開講 · ${testMode()?'測試預覽':'存檔 '+esc((snapshot.profileId||'預覽').replace('slot-',''))}</small><h2 id="challengePreparationTitle">${readOnly?'查看角色':'出戰準備'}</h2></div><span class="challenge-stamp">${readOnly?'只看不改':testMode()?'測試套用':intent==='save-only'?'只保存配置':'出戰前確認'}</span></div>${testMode()?'<p class="challenge-warning" data-preview-notice>測試模式，不保存／不記錄進度。離開測試模式即捨棄測試配置，正式存檔不變。</p>':''}<p class="preparation-intro">檢視不會換主角；配點只作用於挑戰，確認前皆為草稿。</p><div class="preparation-setup"><div class="challenge-preparation-grid"><label>出戰主角<select id="preparationMain" ${locked?'disabled':''}>${options(draft.characterId)}</select></label><label>助拳角色<select id="preparationHelper" ${locked?'disabled':''}>${options(draft.helperId)}</select></label><label>難度<select id="preparationDifficulty" ${locked?'disabled':''}>${[['beginner','新手'],['easy','一般'],['hard','高手']].map(([v,n])=>`<option value="${v}" ${v===draft.difficulty?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="preparation-inspection"><label>檢視／配點角色<select id="preparationInspect" ${busy?'disabled':''}>${options(inspect)}</select></label>${readOnly?'':`<div class="preparation-assign"><button type="button" data-assign="main" ${locked||inspect===draft.characterId?'disabled':''}>${inspect===draft.characterId?'目前主角':'設為主角'}</button><button type="button" data-assign="helper" ${locked||inspect===draft.helperId?'disabled':''}>${inspect===draft.helperId?'目前助拳':'設為助拳'}</button></div>`}</div></div><section id="challengePreparationDetails">${abilityView}</section><p id="challengePreparationScope">${esc(scope())}</p><p id="challengePreparationStatus" role="status" aria-live="polite">${esc(status||(testMode()?'測試草稿尚未套用；取消或 Esc 不會改變目前測試配置。':readOnly?'唯讀檢視，不會保存變更。':'所有調整僅為草稿；取消或 Esc 不會保存。'))}</p><div class="challenge-preparation-actions preparation-actions"><button type="button" id="preparationCancel" ${busy?'disabled':''}>${readOnly?'關閉，保持暫停':'取消'}</button><button type="button" id="preparationConfirm" ${readOnly?'hidden':''} ${locked?'disabled':''}>${testMode()?(busy?'套用中…':intent==='retry'?'套用並重試測試':intent==='save-only'?'確認套用測試配置':'套用並進入測試'):busy?'保存中…':intent==='save-only'?'確認保存配置':intent==='retry'?'保存並重試本段':'確認並接續'}</button></div></section>`;
  if(embedded)for(const node of dialog.querySelectorAll('[id]'))node.id=elementId(node.id);
  // Reorder presentation only. The calculator, draft handlers and commit guards
  // remain shared with read-only callers and never run from a disclosure toggle.
  const content=q('#challengePreparationDetails'),build=q('.ability-build'),tree=q('.challenge-tree'),bio=q('.challenge-bio'),chart=q('.challenge-chart'),moves=q('.ability-moves');
  const reference=(kind,title,nodes)=>{const details=document.createElement('details'),summary=document.createElement('summary');details.className='preparation-reference';details.dataset.preparationReference=kind;details.open=expanded[kind]??readOnly;summary.textContent=title;details.append(summary,...nodes);content.append(details);return details;};
  const radar=document.createElement('div'),comparison=document.createElement('div');radar.className='preparation-radar';comparison.className='preparation-comparison';
  radar.append(chart.querySelector('svg'),chart.querySelector('.ability-legend'),chart.querySelector('.ability-radar-note'));comparison.append(...chart.childNodes);chart.append(radar,comparison);
  comparison.querySelector('h4').textContent='天生 → 成長加點 → 結果'+(readOnly?'':'（草稿）');
  // Identity and remaining points belong to the same heading. Wide logical
  // containers can share one row instead of pushing the first action below
  // the fixed footer with an additional ornamental title row.
  const allocationHeading=document.createElement('div');allocationHeading.className='preparation-allocation-heading';allocationHeading.append(tree.querySelector('h4'),tree.querySelector('.challenge-tree-root'));tree.prepend(allocationHeading);
  const explanation=tree.querySelector('.challenge-fine');build.replaceChildren(tree);
  reference('ability','查看天生能力、成長比較與角色說明',[bio,chart,explanation]);
  reference('moves','查看現有招式與傷害說明',[moves]);
  // A paused read-only visit is reference-first, not an allocation workflow.
  if(readOnly)content.append(build);
  // The long limit/recharge reason gets its own full-width line, never the
  // narrow gap between two 44px buttons. Keep ranks and next-point values.
  for(const actions of dialog.querySelectorAll('.ability-rank-actions')){const reason=actions.querySelector('span');reason.className='ability-rank-reason';actions.after(reason);}
  // The action bar owns a separate grid row: scroll content can never paint below it.
  dialog.append(q('.preparation-actions'));
  q('#preparationMain').onchange=e=>{if(locked)return;draft.characterId=e.target.value;if(!explicitIntent)inspect=e.target.value;render('[data-game-select-for="preparationMain"]');};q('#preparationHelper').onchange=e=>{if(!locked){draft.helperId=e.target.value;render('[data-game-select-for="preparationHelper"]');}};q('#preparationDifficulty').onchange=e=>{if(!locked){draft.difficulty=e.target.value;render('[data-game-select-for="preparationDifficulty"]');}};q('#preparationInspect').onchange=e=>{if(!busy){inspect=e.target.value;render('[data-game-select-for="preparationInspect"]');}};
  for(const b of dialog.querySelectorAll('[data-assign]'))b.onclick=()=>{if(locked||b.disabled)return;draft[b.dataset.assign==='main'?'characterId':'helperId']=inspect;render('[data-game-select-for="preparationInspect"]');};
  for(const b of dialog.querySelectorAll('[data-skill]'))b.onclick=()=>{if(locked||b.disabled)return;draft.characters[inspect]??={skills:zero()};draft.characters[inspect].skills={...zero(),...ranks(),[b.dataset.skill]:(ranks()[b.dataset.skill]||0)+Number(b.dataset.delta)};render(`[data-skill="${b.dataset.skill}"][data-delta="${b.dataset.delta}"]`);};const reset=q('#preparationReset');if(reset)reset.onclick=()=>{if(!locked){draft.characters[inspect].skills=zero();render('#preparationReset');}};q('#preparationCancel').onclick=()=>hide();q('#preparationConfirm').onclick=confirm;selects??=mountGameSelects({document});selects.refresh();
  if(failed&&!destinationSaved&&!testMode()){const slotBackup=controller.exportSlotBackup?.(snapshot.profileId),fullBackup=slotBackup==null&&controller.exportBackup;recovery=mountChallengeRecovery({document,window,parent:q('.challenge-preparation-panel'),id:elementId('preparationRecoveryPanel'),getState:()=>({persisted:false,busy}),retrySave:stale?null:controller.retrySave?.bind(controller),exportCurrent:fullBackup?controller.exportBackup.bind(controller):controller.exportSlotBackup?()=>controller.exportSlotBackup(snapshot.profileId):controller.exportJSON?.bind(controller),exportCurrentLabel:fullBackup?'匯出完整復原備份（不能單槽匯入）':'匯出目前單槽備份',exportLegacy:controller.exportLegacyJSON?.bind(controller),onBusy:value=>{busy=value;onBusy(value);q('#preparationCancel').disabled=value;},onRecovered:result=>complete(result)});}
  q('.challenge-preparation-panel').scrollTop=scroll;if(focusSelector)q(focusSelector)?.focus({preventScroll:true});if(displayFailure)viewport.sync();
 }
 function hide({applied=false,notify=true}={}){if(busy)return false;if(!isOpen())return true;selects?.close();if(!embedded&&dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open');if(embedded)dialog.hidden=true;viewport.sync();if(!applied&&previousFocus?.isConnected&&!previousFocus.closest?.('[hidden],.hidden,dialog:not([open])'))previousFocus.focus?.({preventScroll:true});if(notify)onClose({keepPaused:readOnly||keepPaused,intent,characterId:inspect,applied});return true;}
 function open(options={}){if(busy||disposed)return false;if(isOpen())return true;try{snapshot=clone(controller.preparationSnapshot());if(!snapshot||!Array.isArray(snapshot.unlockedCharacters))return false;}catch{return false;}
  draft={characterId:snapshot.characterId,helperId:snapshot.helperId,difficulty:snapshot.difficulty==='normal'?'hard':snapshot.difficulty||'easy',characters:clone(snapshot.characters||{})};for(const id of ids())draft.characters[id]??={skills:zero()};baseline=JSON.stringify(draft);
  if(options.initial)for(const key of ['characterId','helperId'])if(ids().includes(options.initial[key]))draft[key]=options.initial[key];
  inspect=options.characterId&&ids().includes(options.characterId)?options.characterId:draft.characterId;
  explicitIntent=!!options.intent;intent=options.intent||((getEncounter()?.mode==='entry')?'resume':'retry');if(!['save-only','start','resume','boundary','retry'].includes(intent))return false;
  readOnly=!!options.readOnly;failed=false;stale=false;destinationSaved=false;displayFailure=null;status='';keepPaused=readOnly;context={testMode:!!snapshot.testMode,preview:!!snapshot.preview,previewRevision:snapshot.previewRevision,expectedPreviewRevision:snapshot.expectedPreviewRevision??snapshot.previewRevision,modeEpoch:snapshot.modeEpoch,expectedModeEpoch:snapshot.expectedModeEpoch??snapshot.modeEpoch,profileId:snapshot.profileId,expectedRevision:snapshot.expectedRevision??snapshot.revision,expectedGeneration:snapshot.expectedGeneration??snapshot.generation,expectedLegacyProfile:snapshot.expectedLegacyProfile,token:options.token??getEncounter()?.token};previousFocus=document.activeElement;render();if(embedded)dialog.hidden=false;viewport.sync();if(!embedded&&dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');(readOnly?q('[data-preparation-reference="ability"]>summary'):q('#preparationCancel')).focus({preventScroll:true});return true;
 }
 async function complete(result){if(disposed)return;const options={keepPaused:keepPaused||document.hidden,intent,testMode:testMode(),characterId:inspect,draft:clone(draft),scope:scope()};let destination;try{destination=await onApplied(result,options);}catch{destination={accepted:false,persisted:result.persisted===true,preview:result.preview===true,reason:'scene-unavailable'};}if(disposed)return;busy=false;onBusy(false);if(destination?.accepted===false&&destination.reason==='cancelled'){hide({applied:true,notify:false});return;}if(destination?.accepted===false){failed=true;displayFailure={result:destination,token:{}};destinationSaved=destination.persisted===true||destination.preview===true;stale=['stale-run','stale-generation','save-conflict','stale-revision'].includes(destination.reason);status=destinationSaved?(testMode()?'測試配置已套用，但遊戲場景目前無法開啟。請取消後重新開啟測試，正式存檔不變。':'配置已保存。'+(destination.message||({
 'content-locked':'此內容暫時無法接續，已保存的檢查點會保留。',
 'chapter-1-incomplete':'請先完成第一章，再繼續後續章節。',
 'handoff-unavailable':'暫時無法切換到下一章。',
 'invalid-destination':'目前無法開啟指定章節。'
 }[destination.reason]||'遊戲場景目前無法開啟。'))+'請取消後重新接續，無須重複保存。'):'尚未進入下一個場景，原畫面保留。'+saveIssueText(destination.reason);onFailure(destination);render();return;}failed=false;hide({applied:true});}
 async function confirm(){if(busy||failed||readOnly||!isOpen())return;let current;try{current=controller.preparationSnapshot();}catch{status=testMode()?'無法讀取目前測試配置，請取消後重開。':'無法讀取最新存檔，請取消後重開。';failed=true;stale=true;render();return;}if(current.profileId!==snapshot.profileId||current.revision!==snapshot.revision||current.generation!==snapshot.generation||!!current.testMode!==!!snapshot.testMode||current.modeEpoch!==snapshot.modeEpoch||current.previewRevision!==snapshot.previewRevision){status=testMode()?'測試模式或配置已變更，請取消後重新開啟出戰準備。':'存檔或模式已變更，請取消後重新開啟出戰準備。';failed=true;stale=true;render();return;}
  if(!testMode()&&JSON.stringify(draft)===baseline&&((!explicitIntent&&getEncounter()?.mode!=='entry')||(intent==='save-only'&&snapshot.initialized!==false))){hide();return;}
  busy=true;keepPaused=!!document.hidden;onBusy(true);status=testMode()?'正在套用此次測試配置，正式存檔不變…':'正在保存並重新讀取確認，尚未更換場景…';render();try{const guards=explicitIntent?{...context,intent}:{...context,resetCarry:JSON.stringify(draft)!==baseline};const commit=applyPreparation||((value,guard)=>testMode()?controller.preparePreview?.(value,guard):intent==='save-only'?controller.savePreparation(value,guard):controller.prepareEncounter(value,guard));const result=await commit(clone(draft),guards);if(disposed)return;if(result?.accepted===true&&(result.persisted===true||result.preview===true)){await complete(result);return;}failed=true;stale=['stale-run','stale-generation','save-conflict','stale-revision'].includes(result?.reason);status=testMode()?'尚未套用測試配置，請取消後重新開啟。正式存檔不變。':stale?'尚未保存：存檔已被其他分頁更新或重置，草稿未套用。請取消後重新開啟。':'尚未保存，沒有更換目前戰鬥。'+saveIssueText(result?.reason);onFailure(result);}catch{if(disposed)return;failed=true;status=testMode()?'尚未套用測試配置，請取消後重新開啟。正式存檔不變。':'無法確認保存結果，目前戰鬥不會更換。請重試保存或匯出備份。';onFailure({reason:testMode()?'preview-apply-failed':'uncertain-save'});}finally{busy=false;if(!disposed){onBusy(false);if(isOpen())render();}}}
 const cancel=e=>{if(e.defaultPrevented)return;e.preventDefault();hide();};dialog.addEventListener('cancel',cancel);for(const type of (embedded?['keydown','keyup']:['keydown','keyup','pointerdown','pointerup','click']))dialog.addEventListener(type,e=>e.stopPropagation());
 const hidden=()=>{if(busy&&(document.hidden||!document.hasFocus()))keepPaused=true;};window.addEventListener('blur',hidden);document.addEventListener('visibilitychange',hidden);
 return{element:dialog,open,hide,refreshRecovery(){if(displayFailure)viewport.sync();},get busy(){return busy;},get isOpen(){return isOpen();},destroy(){disposed=true;recovery?.destroy();viewport.destroy();window.removeEventListener('blur',hidden);document.removeEventListener('visibilitychange',hidden);dialog.remove();}};
}
