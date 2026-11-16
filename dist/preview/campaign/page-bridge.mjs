import {setGameSelectValue} from '../../game-select.mjs?v=campaign-boot-20261112-r3';
import {mountChallengeSaveFeedback} from '../../challenge-save-feedback.mjs';
import {createCampaignHandoff,consumeCampaignHandoff} from './navigation.mjs?v=campaign-boot-20261112-r3';
import {saveIssueText} from '../../save-copy.mjs?v=campaign-boot-20261112-r3';
import {mountChallengePreparation} from '../../challenge-preparation.mjs?v=campaign-boot-20261112-r3';
import {openChallengeContinuation as openContinuation} from './fresh-router.mjs?v=campaign-boot-20261112-r3';
import {createCampaignPlayable} from './playable-bridge.mjs?v=campaign-countdown-bridge-20261115-r1';
const reasonText=reason=>({
 'adoption-required':'原版與舊版後續進度不能自動合併，請選擇這一槽要接續的來源；兩份原檔都會保留。',
 'source-changed':'來源剛被另一頁變更，這次沒有採用。請先匯出完整備份，再重新整理後重新選擇來源。',
 'profile-changed':'存檔槽已變更，請重新確認要接續的存檔。',
 'unsaved-progress':'尚未確認保存，請先重試或匯出完整備份。',
 'first-chapter-required':'這個新存檔尚未完成第一章，請先回挑戰總覽開始。',
 'legacy-entry-required':'這槽進度尚在第一章，請回挑戰總覽接續第一章。',
 'origin-evidence-unavailable':'缺少這槽初始快照，無法安全更新。請匯出新舊備份並保留原檔，目前可先使用不存檔預覽。',
 'slot-changed-since-migration':'這槽新版已有配點或進度變動，為避免覆蓋，不會匯入原版。請保留新舊備份。',
 'later-progress-exists':'這槽已有後續章節進度，不會以原版第一章覆蓋。',
 'legacy-source-changed':'原版存檔剛被另一頁變更，這次沒有建立新版存檔。請關閉其他遊戲頁後重試。',
 'storage-unavailable':'無法讀取儲存空間，尚未開始正式接續。可先玩不存進度的預覽。',
 'preview-only':'測試預覽不讀寫正式進度。',
 'content-locked':'第五章尚未開放，已到達的檢查點會保留。',
 'stale-handoff':'這次接續已過期或存檔已在另一頁變更。請回挑戰總覽選擇正確存檔，再接續挑戰。',
 'handoff-unavailable':'無法建立安全接續，請允許此網站使用分頁儲存空間後再試。已保存的進度不變。',
 'stale-run':'另一頁已更新進度，請停止這局並重新接續。'
})[reason]??saveIssueText(reason);

/** Mount is inert. Query parameters cannot grant access or trigger a storage read. */
export function mountContinuationControls({document,window,chapterId,createPlayableChapter,
 getOptions=()=>({}),getPlayable=()=>null,pauseForUI=()=>{},isReady=()=>true,testPreview=false,characters={},onReady=()=>{},onChange=()=>{},reloadPage=()=>window.location.reload(),navigate=url=>window.location.assign(url)}){
 const query=new URL(window.location.href).searchParams;
 testPreview=DEVELOPMENT_TOOLS&&(testPreview||['test','qa','previewOnly'].some(key=>query.has(key))||document.documentElement.dataset.testPreview==='true');
 const menu=document.querySelector('#menu .card'),stage=document.querySelector('#stage');
 if(!menu||!stage)throw new Error('Continuation requires the existing menu and stage');
 const make=(tag,id,text)=>{const e=document.createElement(tag);if(id)e.id=id;if(text)e.textContent=text;return e;};
 const controls=make('section','campaign-entry'),title=make('p',null,'接續這一槽的角色與路段。一次只開一個遊戲分頁。');
 const label=make('label',null,'接續存檔 '),select=make('select','campaign-profile');
 for(const [value,text] of [['','目前使用的存檔'],['slot-1','存檔 1'],['slot-2','存檔 2'],['slot-3','存檔 3']]){const o=make('option',null,text);o.value=value;select.append(o);}label.append(select);if(['slot-1','slot-2','slot-3'].includes(query.get('profile')))setGameSelectValue(select,query.get('profile'));
 const resume=make('button','campaign-resume','繼續這一槽的挑戰'),menuStatus=make('p','campaign-menu-status'),adoptionChoices=make('section','campaign-adoption-choices');adoptionChoices.hidden=true;resume.type='button';resume.disabled=testPreview;menuStatus.setAttribute('role','status');
 const home=make('a','campaign-return-home','回挑戰總覽 →');home.href='../../?challengeOverview=1';const refreshLegacy=make('button','campaign-refresh-legacy','從原版更新這一槽');refreshLegacy.type='button';refreshLegacy.hidden=true;controls.append(title,label,resume,refreshLegacy,menuStatus,adoptionChoices,home);menu.append(controls);
 const helperLabel=make('label','campaign-helper-label','下一段助拳（新路段／對局生效） '),helperSelect=make('select','campaign-helper');helperLabel.htmlFor='campaign-helper';helperLabel.hidden=true;helperLabel.append(helperSelect);
 for(const type of ['keydown','keyup'])helperSelect.addEventListener(type,event=>event.stopPropagation());
 const preparationButton=make('button','campaign-prepare','出戰準備'),growthButton=make('button','campaign-growth','查看角色能力'),retryPreparation=make('button','campaign-retry-prepare','重新整備再重試'),bar=make('aside','campaign-bar'),state=make('span','campaign-save-state'),retry=make('button','campaign-retry-save','重試保存'),backup=make('button','campaign-export','匯出新版備份'),oldBackup=make('button','campaign-export-v1','匯出原版備份'),reloadLatest=make('button','campaign-reload-latest','重新接續最新進度'),next=make('a','campaign-next');
 growthButton.className='primary menu-action';
 bar.setAttribute('aria-label','章節保存狀態');state.setAttribute('role','status');retry.type=backup.type=oldBackup.type=growthButton.type='button';bar.className='challenge-save-slot';bar.hidden=true;growthButton.hidden=retry.hidden=backup.hidden=oldBackup.hidden=next.hidden=true;bar.append(state);const recoveryPanel=make('section','challengeRecoveryPanel');recoveryPanel.className='challenge-recovery-panel';recoveryPanel.hidden=true;const preparationActions=make('div','campaign-preparation-actions');preparationActions.className='challenge-preparation-actions preparation-actions';preparationActions.hidden=true;preparationActions.append(preparationButton,growthButton,retryPreparation);const recoveryCopy=make('p','campaign-recovery-copy');recoveryCopy.setAttribute('role','status');reloadLatest.type='button';recoveryPanel.append(recoveryCopy,retry,backup,oldBackup,reloadLatest,next);const host=document.querySelector('#trial-app > header, .app > header, header');if(host)host.insertBefore(bar,host.querySelector('.toolbar'));else stage.append(bar);menu.append(preparationActions,recoveryPanel);bar.tabIndex=0;bar.setAttribute('role','button');bar.setAttribute('aria-label','保存狀態，開啟保存與備份');
 const saveFeedback=mountChallengeSaveFeedback({document,window,button:bar,isPreview:()=>testPreview||!!window.__quickViewIsolated});
 const previewStart=document.querySelector('#start');if(previewStart)previewStart.hidden=!testPreview;
 const previewRoster=document.querySelector('#menu-roster');if(previewRoster)previewRoster.hidden=!testPreview;
 const previewDifficulty=document.querySelector('#difficulty')?.closest('label');if(previewDifficulty)previewDifficulty.hidden=!testPreview;
 controls.hidden=testPreview;
 if(!testPreview&&query.has('handoff')){label.hidden=resume.hidden=true;menuStatus.textContent=`正在載入第 ${chapterId.split('-')[1]} 章，完成後會直接接續…`;}

 if(!testPreview){const eyebrow=menu.querySelector('.eyebrow'),note=menu.querySelector('.note');if(eyebrow)eyebrow.textContent='繼續追麥';if(note)note.textContent='接續你的挑戰進度。台詞與演出均為虛構喜劇。';const objective=document.querySelector('#objective');if(objective)objective.textContent='正在載入章節內容…';}
 let router=null,chapter=null,preparation=null,preparationOwner=null,preparationBusy=false,recovery=null,recoveryIssue=null,busy=false,idle=Promise.resolve(),autoChecked=false,navigating=false,leaving=false,pageActive=true,launched=false,attachPending=false;
 function navigateSaved(){
  if(navigating||leaving||!pageActive||!router?.enabled||testPreview)return false;
  const v=router.view(),s=chapter?.view();
  if(v.route.status!=='ready'||v.chapterId===chapterId||!v.canNavigate||s?.blocked||s?.busy||s&&!s.canNavigate)return false;
  const result=createCampaignHandoff({window,url:v.route.url,view:v,difficulty:getOptions().difficulty});
  if(!result.accepted){menuStatus.textContent=state.textContent=reasonText(result.reason);return false;}
  navigating=true;try{navigate(result.url);return true;}catch{navigating=false;menuStatus.textContent=state.textContent='未能切換章節，進度已保留，請重新接續。';return false;}
 }
 function exitState(){const current=chapter??getPlayable();if(current)return current.view();const saved=router?.enabled?router.view():recovery?.get();return saved?{...saved,campaignChapterId:chapterId,mode:'menu',blocked:!!saved.readOnly}:null;}
 function returnToDestination(destination,{confirmed=false}={}){
  if(busy||preparationBusy||navigating||leaving||!pageActive)return Promise.resolve(false);
  const overview=destination==='overview',current=chapter??getPlayable(),s=current?.view(),unfinished=s&&(['route','battle'].includes(s.mode)||s.mode==='result'&&!s.result?.matchWon);
  const confirmation=overview?'返回挑戰總覽？本段尚未完成，下次會從本路段檢查點重新開始；整場頭目戰的比分歸零，已保存 XP 保留。':'回到首頁？本段進度會先保存，之後可從首頁的挑戰總覽接續。';
  if(!confirmed&&unfinished&&!window.confirm(confirmation))return Promise.resolve(false);
  leaving=true;pauseForUI(destination);if(s&&['route','battle'].includes(s.mode)&&!s.paused)current.setPaused(true,s.token);
  idle=Promise.resolve().then(async()=>{
   await current?.flush?.();
   if(!pageActive||preparationBusy||navigating)return false;
   if(router?.enabled){const saved=router.view(),live=current?.view();if(!saved.persisted||saved.dirty||saved.readOnly||saved.busy||!saved.canNavigate||live&&(!live.persisted||live.blocked||live.busy||!live.canNavigate)){menuStatus.textContent=state.textContent=`尚未確認保存，請先重試保存或匯出備份，再${overview?'回挑戰總覽':'回首頁'}。`;return false;}}
   if(recovery){const saved=recovery.get();if(!saved.persisted||saved.dirty||saved.readOnly||saved.busy)return false;}
   navigating=true;try{navigate(!testPreview?(overview?'../../?challengeOverview=1':'../../'):'../../');return true;}catch{navigating=false;menuStatus.textContent=state.textContent=overview?'未能返回挑戰總覽，進度已保留，請再試一次。':'未能返回首頁，進度已保留，請再試一次。';return false;}
  }).catch(()=>{menuStatus.textContent=state.textContent='尚未確認保存，未離開本頁。請重試保存或匯出備份。';return false;}).finally(()=>{leaving=false;render();});return idle;
 }
 function returnOverview(options){return returnToDestination('overview',options);}
 function returnHome(options){return returnToDestination('home',options);}
 document.addEventListener('click',event=>{
  if(event.target.closest?.('#continuation-home-link,#campaign-return-home')&&!testPreview){event.preventDefault();returnOverview();return;}
  if(event.target.closest?.('#campaign-next,#continuation-choice-link')&&router?.enabled){event.preventDefault();navigateSaved();}
 });
 window.addEventListener('pagehide',()=>{pageActive=false;});
 window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});

 function render(){
  if(!router?.enabled){
   if(!recovery){saveFeedback.update({enabled:true});const current=getPlayable();preparationActions.hidden=!current||!current.view().paused;preparationButton.disabled=preparationBusy;preparationButton.hidden=true;growthButton.hidden=false;retryPreparation.hidden=true;if(current?.view().paused){const host=document.querySelector('#pause-panel .card');if(host&&preparationActions.parentElement!==host)host.append(preparationActions);}return;}
   const r=recovery.get();bar.hidden=false;if(recoveryPanel.parentElement!==menu)menu.append(recoveryPanel);preparationActions.hidden=true;recoveryPanel.hidden=false;
   state.textContent=recoveryIssue==='source-changed'?reasonText(recoveryIssue):r.persisted&&!r.dirty?'進度已確認保存，請按接續繼續。':'尚未保存，請重試或匯出完整備份。';
   recoveryCopy.textContent=state.textContent;saveFeedback.update({enabled:true,error:r.persisted&&!r.dirty?'':state.textContent});helperLabel.hidden=growthButton.hidden=next.hidden=true;next.removeAttribute('href');backup.hidden=false;oldBackup.hidden=false;retry.hidden=!r.dirty;retry.disabled=busy||recoveryIssue==='source-changed';return;
  }
  const v=router.view(),s=launched?chapter?.view():null,combat=!!s&&!s.paused&&['route','battle'].includes(s.mode);bar.hidden=false;bar.classList.toggle('campaign-bar-combat',combat);refreshLegacy.hidden=!v.canRefreshLegacy;refreshLegacy.disabled=busy;
  if(s)renderContinuationChoice({document,state:{...s,busy:busy||s.busy},chapterId});
  const selector=s?.paused?'#pause-panel .card':({'story':'#story-panel .story-card','result':'#result-panel .card','choice':'#choice-panel .card','complete':'#choice-panel .card'})[s?.mode];
  const fullComic=s?.mode==='story'&&document.querySelector('#story-panel')?.dataset.fullComic==='true';
  const host=fullComic?stage:!s?menu:(selector&&document.querySelector(selector))||stage;if(recoveryPanel.parentElement!==host)host.append(recoveryPanel);if(preparationActions.parentElement!==host)host.append(preparationActions);preparationActions.hidden=combat||!s||fullComic;preparationButton.disabled=busy||preparationBusy||!!s?.busy||!!s?.blocked;preparationButton.hidden=!s||s.mode==='complete'||['route','battle'].includes(s.mode)||s.mode==='result'&&!s.result?.matchWon;retryPreparation.hidden=!s||s.paused||!(s.mode==='result'&&!s.result?.matchWon);retryPreparation.disabled=preparationButton.disabled;
  state.textContent=s?.saveLabel??v.saveLabel;
  if(s?.blocked)state.textContent=reasonText(s.saveIssue);
  else if(v.route.status==='locked')state.textContent=`${v.saveLabel}；目前無法接續下一段，進度已保留。`;
  if(combat&&!v.persisted&&!s?.busy)state.textContent='尚未保存，請暫停後重試／匯出備份。';
  recoveryCopy.textContent=state.textContent;const saveError=!v.persisted||s?.blocked||s?.saveIssue;saveFeedback.update({enabled:true,error:saveError?state.textContent:''});
  helperLabel.hidden=true;
  const available=s?.unlocked??v.unlocked;
  if(JSON.stringify([...helperSelect.options].map(option=>option.value))!==JSON.stringify(available)){
   helperSelect.replaceChildren();for(const id of available){const option=make('option',null,characters[id]?.name??id);option.value=id;helperSelect.append(option);}
  }
  setGameSelectValue(helperSelect,s?.helperId??v.selection.helperId);
  helperSelect.disabled=busy||!!s?.busy||!!s?.blocked||!s?.persisted||v.dirty||v.readOnly;
  growthButton.hidden=combat;growthButton.disabled=busy||preparationBusy;
  const needsRecovery=!v.persisted||!!s?.blocked||!!s?.saveIssue;backup.hidden=!needsRecovery;oldBackup.hidden=!needsRecovery;retry.hidden=!needsRecovery;retry.disabled=busy||preparationBusy||!!s?.busy;reloadLatest.disabled=busy||preparationBusy||!!s?.busy;recoveryPanel.hidden=!needsRecovery;recoveryPanel.dataset.floating=String(host===stage);if(needsRecovery&&host===stage){recoveryPanel.setAttribute('role','alert');}
  const destination=!combat&&v.chapterId!==chapterId&&v.route.status==='ready'&&v.canNavigate&&!s?.blocked&&!s?.busy;
  next.hidden=!destination;if(destination)recoveryPanel.hidden=false;
  if(destination){next.href=v.route.url;next.textContent=`接續第 ${v.chapterId.split('-')[1]} 章 →`;}
  else next.removeAttribute('href');
  if(s?.mode==='complete'&&s.canNavigate&&!s.blocked&&!s.busy)navigateSaved();
 }
 // The attached host first renders while this job is busy. Publish the final
 // busy transition too, so its reading controls re-evaluate their save guards.
 function job(work){if(busy)return idle;busy=true;resume.disabled=true;idle=Promise.resolve().then(work).catch(()=>{menuStatus.textContent='無法安全啟動接續；原存檔未清除，請保留備份後重試。';}).finally(()=>{busy=false;if(!launched){label.hidden=resume.hidden=false;}resume.disabled=testPreview||(router?.enabled&&router.view().dirty)||!!recovery?.get().dirty;render();onChange();});return idle;}
 async function startContinuation(handoff){
  if(testPreview){menuStatus.textContent=reasonText('preview-only');return;}
  if(!isReady()){menuStatus.textContent='漫畫素材仍在載入，請稍後再接續。';return;}
  let storage,locks;try{storage=window.localStorage;locks=window.navigator?.locks;}catch{menuStatus.textContent=reasonText('storage-unavailable');return;}
  router=await openContinuation({mode:'campaign',optIn:true,testPreview,storage,locks,profileId:select.value||undefined,handoff,onSaved:receipt=>saveFeedback.saved(receipt)});
  adoptionChoices.replaceChildren();adoptionChoices.hidden=true;recovery=router.recovery??null;recoveryIssue=null;
  if(!router.enabled){
   menuStatus.textContent=reasonText(router.reason);
   render();return;
  }
  recovery=null;
  const v=router.view();
  if(v.route.status!=='ready'){menuStatus.textContent=reasonText(v.route.status==='legacy'?'legacy-entry-required':'content-locked');render();return;}
  if(v.chapterId!==chapterId){menuStatus.textContent='存檔目前在另一章，請使用下方接續連結。';render();return;}
  if(handoff?.difficulty){const input=document.querySelector('#difficulty');if(input)setGameSelectValue(input,handoff.difficulty);}
  const attached=await createCampaignPlayable({router,chapterId,createPlayableChapter,options:getOptions(),onChange:()=>{render();onChange();}});
  if(!attached.accepted){attachPending=!!attached.recovery;menuStatus.textContent=reasonText(attached.reason);render();return;}attachPending=false;
  chapter=attached.chapter;document.body.dataset.campaignMode='true';const legacyPreparation=document.querySelector('#leave');if(legacyPreparation)legacyPreparation.hidden=true;
  const eyebrow=menu.querySelector('.eyebrow'),note=menu.querySelector('.note');if(eyebrow)eyebrow.textContent='繼續追麥';if(note)note.textContent='人物、對白與情節均為虛構喜劇，不代表原型人物的真實發言。';
  if(attached.persisted){launched=true;onReady(chapter);}else menuStatus.textContent=reasonText('unsaved-progress');render();
 }
 resume.onclick=()=>job(()=>startContinuation());
 retry.onclick=()=>job(async()=>{const result=recovery?await recovery.retrySave():chapter?await chapter.retrySave():router?.enabled?await router.retrySave():null;if(result&&(!result.accepted||!result.persisted)){if(recovery)recoveryIssue=result.reason;menuStatus.textContent=reasonText(result.reason);}else if(result?.accepted===true&&result.persisted===true&&chapter&&!launched){launched=true;onReady(chapter);}else if(result?.accepted===true&&result.persisted===true&&attachPending){await startContinuation();}});
 function actionStatus(copy){const status=document.querySelector('#chapter-action-status');if(status)status.textContent=copy;else menuStatus.textContent=copy;}
 function openPreparation(options={}){
  const current=chapter??getPlayable(),inspection=options.readOnly===true,before=current?.view();
  if(!current||busy||preparationBusy||leaving||navigating||!pageActive||before?.busy&&!(inspection&&before.paused)){
   actionStatus(before?.busy?'目前操作正在保存，請稍後再查看角色能力。':'目前無法開啟角色能力，請稍後再試。');return false;
  }
  const boundary=['story','choice'].includes(before.mode)||before.mode==='result'&&before.result?.matchWon;
  const retryIntent=options.intent==='retry';
  if(retryIntent){if(!((before.paused&&['route','battle'].includes(before.mode))||before.mode==='result'&&!before.result?.matchWon))return false;const scope=before.stepId==='boss'?'重新開始整場三戰兩勝頭目戰，比分歸零':before.mode==='battle'||before.stepId?.startsWith('miniboss')?'重新開始目前這一場小頭目戰，比分歸零':'從目前路段起點重新開始';if(!window.confirm(`重新整備再重試？確認配置後將${scope}；已保存 XP、解鎖與進度保留。`))return false;}
  options={...options,readOnly:!!options.readOnly||!boundary&&!retryIntent,intent:retryIntent?'retry':'boundary',token:before.token};
  if(preparationOwner!==current){preparation?.destroy();preparationOwner=current;preparation=mountChallengePreparation({document,window,characters,controller:{
   preparationSnapshot:()=>current.preparationSnapshot(),prepareEncounter:(draft,guard)=>current.prepareEncounter(draft,guard),retrySave:()=>current.retrySave(),exportJSON:()=>current.exportJSON?.()??router?.exportJSON(),exportLegacyJSON:()=>router?.exportLegacyJSON()??null
  },getEncounter:()=>current.view(),onBusy:value=>{preparationBusy=value;},onApplied:(result,context)=>{if(context.keepPaused&&['route','battle'].includes(current.view().mode))current.setPaused(true,current.view().token);const input=document.querySelector('#difficulty');if(input)setGameSelectValue(input,current.preparationSnapshot().difficulty);render();onChange();},onFailure:()=>{render();onChange();},onClose:context=>{if(context.keepPaused&&['route','battle'].includes(current.view().mode))current.setPaused(true,current.view().token);render();onChange();}});}
  pauseForUI('preparation');if(['route','battle'].includes(current.view().mode)&&!current.view().paused)current.setPaused(true,current.view().token);onChange();const opened=preparation.open(options);actionStatus(opened?'':'無法讀取角色能力，請關閉視窗後再試。');return opened;
 }
 preparationButton.type='button';preparationButton.onclick=()=>openPreparation();growthButton.onclick=()=>openPreparation({readOnly:true});retryPreparation.type='button';retryPreparation.onclick=()=>openPreparation({intent:'retry'});
 function openRecovery(){if(busy||preparationBusy||leaving||navigating||!pageActive||chapter?.view().busy)return;pauseForUI('recovery');if(chapter&&['route','battle'].includes(chapter.view().mode)&&!chapter.view().paused)chapter.setPaused(true,chapter.view().token);render();onChange();recoveryPanel.hidden=false;recoveryPanel.querySelector('button:not([hidden])')?.focus();}
 bar.onclick=openRecovery;bar.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();openRecovery();}};

 reloadLatest.onclick=()=>{if(busy||preparationBusy||chapter?.view().busy)return;if(window.confirm('重新接續最新進度？本頁尚未保存的變更不會套用。建議先匯出目前與原版備份；已保存的原檔不會被覆寫。'))reloadPage();};
 function download(text,name){
  if(text===null)return;const url=window.URL.createObjectURL(new window.Blob([text],{type:'application/json'})),a=make('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();window.setTimeout(()=>window.URL.revokeObjectURL(url),1000);
 }
 backup.onclick=()=>download(recovery?.exportBackup()??chapter?.exportJSON()??router?.exportJSON()??null,'punchline-challenge-v4-backup.json');
 oldBackup.onclick=()=>download(recovery?.exportLegacyBackup()??router?.exportLegacyJSON()??null,'punchline-original-v1-backup.json');
 if(testPreview)menuStatus.textContent=reasonText('preview-only');
 async function assetsReady(){
  if(autoChecked||testPreview||!pageActive||!isReady())return idle;
  autoChecked=true;const launch=consumeCampaignHandoff({window,chapterId});
  if(!launch.accepted){label.hidden=resume.hidden=false;if(launch.reason!=='no-handoff')menuStatus.textContent=reasonText(launch.reason);return idle;}
  setGameSelectValue(select,launch.handoff.profileId);return job(()=>startContinuation(launch.handoff));
 }
 return {whenIdle:()=>idle,render,openPreparation,openRecovery,returnOverview,returnHome,get exitState(){return exitState();},get operationBusy(){return busy||preparationBusy||leaving||!!chapter?.view().busy;},get busy(){return busy||preparationBusy||leaving||!!chapter?.view().busy||!!preparation?.isOpen;},assetsReady,assetsFailed(){if(!testPreview)menuStatus.textContent='章節素材載入失敗，請重新整理後再接續。已保存進度不變。';}};
}
function completionCanLeave(state){return !!state.persisted&&!!state.canNavigate&&!state.busy&&!state.blocked;}
export function renderContinuationChoice({document,state:s,chapterId}){
 const card=document.querySelector('#choice-panel .card'),copy=document.querySelector('#choice-copy');if(!card||!copy)return;
 let actions=document.querySelector('#continuation-complete-actions');if(!actions){actions=document.createElement('div');actions.id='continuation-complete-actions';actions.className='continuation-complete-actions';card.append(actions);}
 let link=document.querySelector('#continuation-choice-link');if(!link){link=document.createElement('a');link.id='continuation-choice-link';link.className='continuation-choice-link';actions.append(link);}
 let home=document.querySelector('#continuation-home-link');if(!home){home=document.createElement('a');home.id='continuation-home-link';home.className='continuation-choice-link continuation-home-link';home.textContent='回挑戰總覽';actions.append(home);}
 const visible=!card.closest('[hidden],.hidden'),entered=s.mode==='complete'&&card.dataset.continuationMode!=='complete'&&visible;
 if(s.mode!=='complete'||visible)card.dataset.continuationMode=s.mode;
 actions.hidden=s.mode!=='complete';link.hidden=true;link.removeAttribute('href');home.hidden=true;home.removeAttribute('href');home.removeAttribute('aria-disabled');home.removeAttribute('tabindex');
 if(s.campaignChapterId&&s.mode==='choice')copy.textContent=(chapterId==='chapter-5'?'七人齊備，前往議場中庭選擇最終戰隊伍。':'選好接下來的主角，接續同一趟神麥旅程。')+(s.saveLabel||'');
 if(s.mode!=='complete')return;
 home.hidden=false;let safe=true;
 if(s.campaignChapterId){
  safe=completionCanLeave(s);
  copy.textContent=(s.saveLabel||'')+(s.nextRoute?.status==='locked'?'；內容暫時無法接續，檢查點會保留。':'；確認保存後即可接續下一章。');
  if(!safe)copy.textContent+=' 尚未能安全離開，請先重試保存或匯出備份；若進度已在其他頁變更，請保留備份後重新接續。';
  if(safe&&s.nextRoute?.status==='ready'){link.hidden=false;link.href=s.nextRoute.url;link.textContent='接續下一章 →';}
 }else{
  const next=({'chapter-2':'chapter3','chapter-3':'chapter4','chapter-4':'chapter5','chapter-5':'finale'})[chapterId];
  copy.textContent=next?'本章預覽完成。本次遊玩不保存進度，可繼續試玩下一章。':'本章預覽完成，本次遊玩不保存進度。';
  if(next){link.hidden=false;link.href=`../${next}/?previewOnly=1`;link.textContent='不存檔試玩下一章 →';}
 }
 if(safe)home.href=s.campaignChapterId?'../../?challengeOverview=1':'../../';else{home.setAttribute('aria-disabled','true');home.tabIndex=-1;}
 // The current render owns this guard; formal navigation also rechecks authority
 // in mountContinuationControls before leaving, never trusting a stale href.
 home.onclick=event=>{if(!safe)event.preventDefault();};
 copy.setAttribute('role','status');copy.tabIndex=-1;
 if(entered){if(!link.hidden)link.focus({preventScroll:true});else if(safe)home.focus({preventScroll:true});else copy.focus({preventScroll:true});}
}
import {DEVELOPMENT_TOOLS} from '../../release-features.mjs';
