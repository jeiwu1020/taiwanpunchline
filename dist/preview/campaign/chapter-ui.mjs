import {mountCameraDirectionHints} from '../../camera-direction-hints.mjs?v=campaign-boot-20261112-r3';
import {mountCompactToolbar} from '../../compact-toolbar.mjs?v=campaign-boot-20261112-r3';
// Presentation adapter only. Campaign progression remains in its controller.
import {createViewportLifecycle,readGameViewport,measureViewportElements,mountViewportProtection,createCanvasViewportSurface} from '../../viewport-lifecycle.mjs?v=campaign-boot-20261112-r3';
import {applyChallengeLayout,applyChallengeCameraLayout,isMobileLandscapePresentation,streetPlayerCameraProfile,measureChallengeOcclusions,challengeLogicalRect} from '../../challenge-layout.mjs?v=campaign-boot-20261112-r3';
import {challengeDialogFrame} from '../../challenge-dialog-viewport.mjs?v=campaign-boot-20261112-r3';
import {createSettingsStore} from '../../settings-state.mjs?v=campaign-boot-20261112-r3';
import {mountSettingsPanel} from '../../settings-view.mjs?v=campaign-boot-20261112-r3';
import {bindPageZoomPreference} from '../../page-zoom-gestures.mjs?v=campaign-boot-20261112-r3';
import {mountGameSelects} from '../../game-select.mjs?v=campaign-boot-20261112-r3';
import {chapterSettingsMarkup} from './chapter-settings-markup.mjs?v=campaign-boot-20261112-r3';
import {guardView,combatStatus} from '../../combat-view.mjs?v=campaign-boot-20261112-r3';
import {renderCooldownButton} from '../../cooldown-view.mjs?v=campaign-boot-20261112-r3';
import {renderChargeMeter} from '../../charge-view.mjs?v=campaign-boot-20261112-r3';
const percent=(value,max)=>Number.isFinite(value)&&max>0?Math.max(0,Math.min(100,value/max*100)):0;
export function mountChapterInterface({document,window,cast,getCharacter,getExitState=()=>null,pauseForUI=()=>()=>{},onSound=()=>{},storage,navigate=url=>window.location.assign(url),onCameraChange=()=>{},onViewportChange=()=>{},surfaceContext=null,onSurfaceReset=()=>{},clearHold=()=>{},canUse=id=>!!cast[id],media=null,onRestart=()=>false,isBusy=()=>false,isOperationBusy=isBusy,onPrepare=null,onReturnOverview=null}){
 const $=s=>document.querySelector(s),app=document.body;
 const cameraHints=mountCameraDirectionHints({document,root:$('#trial-app')});
 let resume=null,returnFocus=null,cameraEnabled=false,viewport,settingsUI=null,restarting=false,mounted=false,previewAudioFailure=false,restartPauseRequested=false,lifecycle=null,geometryDirty=true,occlusionCache=null,geometryCamera=null,renderedWorld=null;
 const safeProbe=document.createElement('div');safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';document.body.append(safeProbe);
 const preview=DEVELOPMENT_TOOLS&&['test','qa','previewOnly'].some(k=>new URL(window.location.href).searchParams.has(k));
 if(storage===undefined){try{storage=preview?null:window.localStorage;}catch{storage=null;}}
 const store=createSettingsStore({storage,onChange:syncPreferences});
 const template=document.createElement('template');template.innerHTML=chapterSettingsMarkup;
 const dialog=template.content.firstElementChild;document.body.append(dialog);
 const homeDialog=document.createElement('dialog');homeDialog.id='chapter-home-confirm';homeDialog.className='chapter-home-confirm paper';homeDialog.setAttribute('aria-labelledby','chapter-home-title');homeDialog.innerHTML='<h2 id="chapter-home-title">要回首頁嗎？</h2><p id="chapter-home-copy"></p><div class="home-confirm-actions"><button type="button" class="primary menu-action" data-cancel>繼續開吵 →</button><button type="button" class="primary menu-action" data-confirm>回到首頁</button></div>';document.body.append(homeDialog);
 let homeResume=null,homeFocus=null,returningHome=false;
 const zoom=bindPageZoomPreference({control:$('#settings-page-zoom'),root:document.documentElement,storage:storage||{getItem:()=>null,setItem:()=>{}}});
 const selects=mountGameSelects({document});
 function syncMedia(options={}){const s=getExitState();media?.sync({mode:s?.mode||'menu',stepId:s?.stepId,sessionId:s?.token?.split(':').slice(0,2).join(':'),active:!!s&&!s.paused&&!s.blocked&&!s.busy&&['route','battle'].includes(s.mode),paused:!!s?.paused||!!s?.blocked||!!s?.busy,settingsOpen:dialog.open,restart:options.restart===true});}
 function storageText(){return preview?'本次預覽偏好不寫入正式存檔。':store.persisted?'偏好已保存在這個瀏覽器。':'設定本次有效，尚未保存。';}
 function syncPreferences(){const s=store.get();$('#sound').textContent=s.masterMuted?'♪ 聲音關':'♪ 聲音開';$('#sound').setAttribute('aria-pressed',String(!s.masterMuted));$('#rotate-mode').textContent=s.rotate?'側轉：開':'側轉：關';$('#rotate-mode').setAttribute('aria-pressed',String(s.rotate));$('#camera-mode').textContent=s.camera==='classic'?'鏡頭：動態跟隨':'鏡頭：穩定視野';$('#camera-mode').setAttribute('aria-pressed',String(s.camera==='classic'));onSound(!s.masterMuted&&!s.sfxMuted,s.sfxVolume);media?.setPreferences(s);settingsUI?.sync();$('#settings-storage').textContent=storageText();if(viewport){resize();}onCameraChange(s.camera);}
 settingsUI=mountSettingsPanel({document,store,canUse,resolveAsset:path=>new URL('../../'+path,import.meta.url).href,onInspect:(character,kind)=>media?.inspect(character,kind)??false,onStopPreview:()=>media?.stopPreview(),onTestSfx:()=>media?.testSfx()??{status:'error'},onAudition:kind=>media?.audition(kind)??false,onPreview:(character,kind)=>{previewAudioFailure=false;return media?.preview(character,kind)??false}});
 function settingsClosed(){if(dialog.open)return;settingsUI.close();const restore=resume;resume=null;restore?.();returnFocus?.focus?.();returnFocus=null;syncMedia();}
 function closeSettings(){if(!dialog.open)return;selects.close();dialog.close();settingsClosed();}
 function openSettings(){if(restarting||isBusy()||dialog.open)return;cameraHints.clear();media?.unlock();if(homeDialog.open)closeHome();cancelRestart(false);returnFocus=document.activeElement;resume=pauseForUI('settings');settingsUI.open(getCharacter());syncPreferences();dialog.showModal();syncMedia();$('#close-help').focus();}
 function homeClosed(){if(homeDialog.open)return;const restore=homeResume;homeResume=null;restore?.();homeFocus?.focus?.();homeFocus=null;syncMedia();}
 function closeHome(){if(returningHome||!homeDialog.open)return;homeDialog.close();homeClosed();}
 function refreshHome(){const state=getExitState(),campaign=!!state?.campaignChapterId,unsafe=campaign&&(state.busy||state.blocked||!state.persisted);$('#chapter-home-title').textContent=campaign?'返回挑戰總覽？':'要回首頁嗎？';$('#chapter-home-copy').textContent=unsafe?'進度尚未確認保存，請先回遊戲，在暫停畫面重試保存或匯出備份，再返回挑戰總覽。':campaign?'未完成的本段會從已保存的路段檢查點重新開始，已保存 XP 保留。返回前會先確認保存完成。':'返回首頁會結束本次不存檔預覽。';homeDialog.querySelector('[data-confirm]').textContent=campaign?'返回挑戰總覽':'回到首頁';homeDialog.querySelector('[data-confirm]').disabled=returningHome||unsafe;return !unsafe;}
 function openHome(){if(restarting||isBusy()||homeDialog.open)return;cameraHints.clear();if(dialog.open)closeSettings();cancelRestart(false);refreshHome();homeFocus=document.activeElement;homeResume=pauseForUI('home');homeDialog.showModal();homeDialog.querySelector('[data-cancel]').focus();}
 function cancelRestart(focus=true,force=false){if(restarting&&!force||!$('#restart-confirm'))return;$('#restart-confirm').hidden=true;if(focus)$('#restart-match')?.focus();}
 function showRestart(){if(restarting||isBusy())return;$('#restart-confirm').hidden=false;$('#chapter-action-status').textContent='';$('#restart-cancel').focus();}
 async function confirmRestart(){if(restarting||isBusy()||$('#restart-confirm').hidden)return;restarting=true;restartPauseRequested=false;const locked=[...document.querySelectorAll('#home,#help,#pause,#resume,#leave,#restart-match,#restart-cancel,#restart-confirm-button,.chapter-pause-extras button,.chapter-pause-extras select,.chapter-pause-extras input')].map(e=>[e,e.disabled]);for(const [e]of locked)e.disabled=true;$('#chapter-action-status').textContent='正在確認目前檢查點…';media?.stop();try{const result=await onRestart();if(result===true||result?.accepted&&result?.persisted){cancelRestart(false,true);$('#chapter-action-status').textContent='';}else{$('#chapter-action-status').textContent='尚未重開，請先確認進度已保存；可重試保存或匯出備份。';}}catch{$('#chapter-action-status').textContent='未能確認重開結果，請先保留備份並重新接續。';}finally{restarting=false;for(const [e,disabled]of locked)e.disabled=disabled;}}
 dialog.addEventListener('close',settingsClosed);dialog.addEventListener('cancel',e=>{if(e.defaultPrevented)return;e.preventDefault();if(!$('#settings-detail-layer').hidden){$('#settings-close-details').click();return;}closeSettings();});$('#close-help').onclick=closeSettings;
 $('#rotate-mode').onclick=()=>store.update({rotate:!store.get().rotate});$('#camera-mode').onclick=()=>store.update({camera:store.get().camera==='classic'?'stable':'classic'});
 $('#sound').onclick=()=>{store.update({masterMuted:!store.get().masterMuted});if(!store.get().masterMuted)media?.unlock();};$('#help').onclick=openSettings;$('#pause-settings').onclick=openSettings;$('#home').onclick=openHome;$('#pause-home').onclick=openHome;$('#result-home').onclick=openHome;
 $('.brand')?.addEventListener('click',e=>{e.preventDefault();openHome();});
 $('#restart-match').onclick=showRestart;$('#restart-cancel').onclick=()=>cancelRestart();$('#restart-confirm-button').onclick=confirmRestart;
 $('#leave').onclick=()=>{if(restarting||isBusy())return;if(onPrepare){cancelRestart(false);onPrepare();return;}cancelRestart(false);const extras=$('.chapter-pause-extras');extras.open=true;extras.querySelector('button')?.focus();};
 homeDialog.querySelector('[data-cancel]').onclick=closeHome;homeDialog.addEventListener('cancel',e=>{e.preventDefault();closeHome();});homeDialog.addEventListener('close',homeClosed);homeDialog.querySelector('[data-confirm]').onclick=async()=>{if(returningHome||!refreshHome())return;returningHome=true;homeDialog.querySelector('[data-confirm]').disabled=true;try{if(onReturnOverview){$('#chapter-home-copy').textContent='正在確認保存，請稍候…';const result=await onReturnOverview();if(!(result===true||result?.accepted&&result?.persisted)){$('#chapter-home-copy').textContent='尚未返回挑戰總覽，進度未確認保存。本頁仍保留，可重試或先匯出備份。';return;}}else{media?.stop();navigate('../../');}}catch{$('#chapter-home-copy').textContent='尚未返回，未能確認保存結果。本頁仍保留，請取消後重試。';}finally{returningHome=false;homeDialog.querySelector('[data-confirm]').disabled=false;}};
 function intercept(e){
  if(isBusy()){if(e.target?.closest?.('#challengePreparationOverlay')&&!isOperationBusy())return;if(e.key==='Escape'||!e.target?.closest?.('dialog')){e.preventDefault();e.stopImmediatePropagation();}return;}
  const confirming=!$('#restart-confirm').hidden;
  if(!dialog.open&&!homeDialog.open&&!confirming)return;
  if(e.key==='Escape'&&e.type==='keydown'){
   e.preventDefault();if(selects.close(true)){}else if(dialog.open&&!$('#settings-detail-layer').hidden)$('#settings-close-details').click();else if(dialog.open)closeSettings();else if(homeDialog.open)closeHome();else cancelRestart();
  }
  // Let controls within the modal receive arrows / Space, but never the game.
  if(e.key==='Escape'){e.stopImmediatePropagation();return;}
  if(e.target?.closest?.('dialog')&&!['KeyJ','KeyK','KeyU','KeyI','KeyO','KeyH','KeyL','KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;
  if(!e.target?.closest?.('input,button,select,.game-select-menu'))e.stopPropagation();
 }
 window.addEventListener('keydown',intercept,true);window.addEventListener('keyup',intercept,true);
 // A modal event must never bubble into the game's window key handlers.
 for(const type of ['keydown','keyup'])for(const modal of [dialog,homeDialog])modal.addEventListener(type,e=>e.stopPropagation());
 function retainRestartPause(){if(restarting)restartPauseRequested=true;}
 function retainHiddenPause(){if(document.hidden)retainRestartPause();}
 window.addEventListener('blur',retainRestartPause);document.addEventListener('visibilitychange',retainHiddenPause);
 function unlockFromGesture(e){if(e.isTrusted&&!e.repeat)media?.unlock();}
 window.addEventListener('pointerdown',unlockFromGesture,true);window.addEventListener('keydown',unlockFromGesture,true);
 function mediaState(state){const {channel,status,label}=state;const set=(selector,copy)=>{const e=$(selector);if(e)e.textContent=copy;};
  if(channel==='music'){const copy=status==='playing'?'正在播放：'+(state.label||state.track||'背景音樂')+'。':status==='muted'?'背景音樂已靜音。':status==='blocked'||status==='error'?'背景音樂未能啟動，請點「聲音開」或任一操作重試。':status==='paused'?'背景音樂已暫停，繼續遊戲時恢復。':status==='loading'?'正在載入背景音樂…':'首次點擊或按鍵後啟用音樂。';set('#settings-music-status',copy);}
  if(channel==='voice'&&state.lane==='preview'){if(status==='playing')set('#settings-audition-status','已啟動試聽：'+label+'（只播放一次）。');else if(['blocked','error'].includes(status)){previewAudioFailure=true;set('#settings-audition-status','語音播放未成功，請再點一次招式，並檢查裝置音量與瀏覽器播放權限。');set('#settings-demo-status','動作示範可用，但語音播放未成功；請再按「動作＋語音」。');}}
  if(channel==='demo'&&status==='completed'&&!previewAudioFailure)set('#settings-demo-status','動作示範結束，可再按「動作＋語音」。');
 }
 function readViewport(){
  const touch=!!(window.matchMedia?.('(pointer:coarse)')?.matches||window.navigator.maxTouchPoints>0||(DEVELOPMENT_TOOLS&&new URL(window.location.href).searchParams.has('touchPreview')));
  const inset=window.getComputedStyle(safeProbe),safe={top:parseFloat(inset.paddingTop),right:parseFloat(inset.paddingRight),bottom:parseFloat(inset.paddingBottom),left:parseFloat(inset.paddingLeft)};
  return readGameViewport(window,{safe,touch,rotate:store.get().rotate,fullBleed:window.innerWidth>window.innerHeight});
 }
 function applyViewport(next,epoch){viewport=next;geometryDirty=true;const touch=next.touch;
  const {width,height,rotation,left,top,screenWidth,screenHeight}=viewport,portrait=width<height,shell=$('#trial-app');
  Object.assign(shell.style,{position:'fixed',left:left+'px',top:top+'px',width:width+'px',height:height+'px',transformOrigin:'top left',transform:rotation?'translateX('+screenWidth+'px) rotate(90deg)':'none'});
  for(const [key,value]of Object.entries({touch,sideways:rotation===90,rotation,layout:portrait?'portrait':'landscape',overlayControls:touch&&!portrait,nativeLandscape:touch&&!rotation&&!portrait,portrait,compact:height<=500,fullBleed:!!viewport.fullBleed})){app.dataset[key]=String(value);shell.dataset[key]=String(value);}
  applyChallengeLayout(shell,viewport);applyChallengeLayout(app,viewport);applyChallengeLayout(document.documentElement,viewport);
  app.dataset.depthRoute??='true';
  for(const [key,value]of Object.entries({width,height,'center-x':left+screenWidth/2,'center-y':top+screenHeight/2}))app.style.setProperty('--chapter-'+key,value+'px');
  dialog.dataset.layout=portrait?'portrait':'landscape';dialog.dataset.compact=String(height<=500);dialog.dataset.rotation=String(rotation);
  const placement=challengeDialogFrame({...viewport,maxWidth:1040,anchor:'center'});
  Object.assign(dialog.style,{position:'fixed',margin:'0',inset:'auto',width:placement.width+'px',maxWidth:'none',maxHeight:placement.maxHeight+'px',left:placement.left+'px',top:placement.top+'px',transform:`translate(-50%,-50%) rotate(${rotation}deg)`});
  $('#rotate-mode').hidden=!touch;$('#camera-mode').hidden=!cameraEnabled;
  shell.__committedViewport=viewport;
  prepareCombatLayout();
  if(mounted)onViewportChange({frame:viewport,epoch});
 }
 function resize(){if(lifecycle?.applying)return viewport;lifecycle?.invalidate('layout');return viewport;}
 const combatState=s=>['route','battle'].includes(s?.mode)||s?.mode==='result'&&['route','battle'].includes(s.result?.kind);
 function prepareCombatLayout(){const state=getExitState(),frozen=state?.paused||state?.blocked||state?.busy,camera=frozen&&geometryCamera?geometryCamera:store.get().camera,root=$('#trial-app');
  const route=!!renderedWorld?.depthMode||state?.mode==='route'||state?.mode==='result'&&state.result?.kind==='route';
  const retain=!!renderedWorld&&combatState(state)&&(isMobileLandscapePresentation(viewport)&&camera==='stable'||!!streetPlayerCameraProfile({...viewport,camera,route}));
  if(root.dataset.retainedCombatLayout!==String(retain)){root.dataset.retainedCombatLayout=String(retain);geometryDirty=true;}return {camera,retain,route};
 }
 function invalidateGeometry(){geometryDirty=true;prepareCombatLayout();}
 function logicalRect(rect,origin=$('#game-canvas').getBoundingClientRect()){
  const left=viewport.rotation===90?rect.top-origin.top:rect.left-origin.left,top=viewport.rotation===90?origin.right-rect.right:rect.top-origin.top;
  const width=viewport.rotation===90?rect.height:rect.width,height=viewport.rotation===90?rect.width:rect.height;
  return {left,top,right:left+width,bottom:top+height,width,height};
 }

 const text=(el,value)=>{const next=String(value);if(el.textContent!==next)el.textContent=next;};
 const attr=(el,key,value)=>{const next=String(value);if(el.getAttribute(key)!==next)el.setAttribute(key,next);};
 const data=(el,key,value)=>{const next=String(value);if(el.dataset[key]!==next)el.dataset[key]=next;};
 const hidden=(el,value)=>{if(el.hidden!==value){el.hidden=value;geometryDirty=true;}};
 const css=(el,key,value)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);};
 const toggle=(el,key,value)=>{if(el.classList.contains(key)!==value)el.classList.toggle(key,value);};
 const chargeCache=new WeakMap();
 function render({state:s,world:g}){renderedWorld=g&&combatState(s)?g:null;prepareCombatLayout();if(!s||!g||s.paused||s.blocked||s.busy||g.status!=='active'||!['route','battle'].includes(s.mode))cameraHints.clear();if(!s||!g)return;const route=!!g.depthMode||s.mode==='route';if(app.dataset.depthRoute!==String(route)){app.dataset.depthRoute=String(route);geometryDirty=true;}const p=g.player,e=g.enemy,character=cast[s.characterId]||cast[p.type]||{};
  text($('#fighter-name'),character.name||s.characterId);text($('#p-hp'),Math.ceil(Math.max(0,p.hp)));css($('#health'),'width',percent(p.hp,p.maxHp)+'%');hidden($('#enemy-panel'),route);hidden($('#enemy-hp'),route);
  text($('#timer'),route?Math.round((g.routeProgress||0)*100)+'%':Math.ceil(Math.max(0,g.remaining||0)));text($('#match-score'),route?'路段進度':`${s.rounds?.player||0} : ${s.rounds?.enemy||0}`);
  for(const [who,a]of [['p',p],['e',e]]){if(!a)continue;const gv=guardView(a),row=$('#'+who+'-guard');text(row.querySelector('small'),gv.label);attr(row,'aria-label',gv.label);toggle(row,'broken',gv.broken);[...row.querySelectorAll('.guard-pips i')].forEach((pip,i)=>toggle(pip,'empty',i>=gv.pips));text($('#'+who+'-status'),combatStatus(a));}
  if(e){text($('#e-name'),e.displayName||cast[e.type]?.name||'對手');text($('#e-hp'),Math.ceil(Math.max(0,e.hp)));css($('#e-fill'),'width',percent(e.hp,e.maxHp)+'%');}
  for(const [i,b]of [...$('#specials').querySelectorAll('button')].entries()){const m=character.moves?.[i];if(!m)continue;const name=b.querySelector('.move-copy strong');if(name.textContent!==m.name)name.textContent=m.name;renderCooldownButton(b,m,p.cooldowns?.[i]||0);}
  for(const [kind,charge,ready,active]of [['assist',p.assist?.charge||0,!!p.assist?.helper&&!p.assist?.used&&!p.assist?.active,!!p.assist?.active],['rally',p.rally||0,p.rally>=100,false]]){const b=$('#actions .'+kind);if(kind==='assist'&&b.dataset.assistDisabled==='true')continue;const key=JSON.stringify([charge,ready,active]);if(chargeCache.get(b)!==key){chargeCache.set(b,key);const v=renderChargeMeter(b,{charge,ready,active});css(b,kind==='assist'?'--assist-charge':'--charge',v.percent+'%');toggle(b,'ready',ready);if(b.disabled===ready)b.disabled=!ready;text($('#'+kind+'-ready'),v.text);}}
  const up=$('[data-direction="up"]'),down=$('[data-direction="down"]');if(up){if(route){data(up,'hold','up');if('action'in up.dataset)delete up.dataset.action;}else{data(up,'action','jump');if('hold'in up.dataset)delete up.dataset.hold;}attr(up,'aria-label',route?'往街道內走，鍵盤 W':'跳躍，鍵盤 W');}if(down){data(down,'hold',route?'down':'crouch');attr(down,'aria-label',route?'往街道外走，鍵盤 S':'蹲下，鍵盤 S');}attr($('#touch-stick'),'aria-label',route?'方向搖桿：街道四向走位':'方向搖桿：左右移動，上推跳，下推蹲');
 }
 function cameraOptions(){const {camera:layoutCamera,retain,route}=prepareCombatLayout();if(geometryDirty||!occlusionCache||geometryCamera!==layoutCamera){geometryCamera=layoutCamera;const measurementFrame={...viewport,camera:layoutCamera,route,retainCombatLayout:retain};applyChallengeCameraLayout($('#trial-app'),measurementFrame);occlusionCache=measureChallengeOcclusions({document,root:$('#trial-app'),canvas:$('#game-canvas'),frame:measurementFrame});const origin=challengeLogicalRect($('#game-canvas').getBoundingClientRect(),$('#trial-app').getBoundingClientRect(),viewport.rotation);cameraHints.setGeometry({width:origin.width||viewport.width,height:origin.height||viewport.height,origin,...occlusionCache});geometryDirty=false;}return{touch:app.dataset.touch==='true',portrait:app.dataset.layout==='portrait',nativeLandscape:app.dataset.nativeLandscape==='true',camera:store.get().camera,...occlusionCache};}

 function renderCameraHints(frame,world,{route=false,active=true}={}){cameraHints.update(frame,world,{route,active:active&&lifecycle?.ready===true&&!dialog.open&&!homeDialog.open&&!restarting&&!returningHome&&!isBusy()});}
 const clearCameraHints=()=>cameraHints.clear();

 const surface=createCanvasViewportSurface({window,stage:$('#stage'),canvas:$('#game-canvas'),context:surfaceContext,getLifecycle:()=>lifecycle,invalidateResources:onSurfaceReset});
 const shell=$('#trial-app'),protection=mountViewportProtection(document,()=>lifecycle?.invalidate('orientation'));
 lifecycle=createViewportLifecycle({window,document,requirePaint:true,read:readViewport,apply:applyViewport,prepare:()=>surface.prepare(),onSurfaceReset:()=>surface.reset(),clearInput:clearHold,measure:next=>{const layout=measureViewportElements(next,[shell],{allowNarrow:!next.touch}),state=surface.inspect();return {...layout,valid:layout.valid&&state.valid,key:layout.key+':'+state.width+':'+state.height+':'+state.backingWidth+':'+state.backingHeight,reason:layout.reason||(state.valid?'':'surface-invalid')};},onState:state=>{if(!state.ready)cameraHints.clear();protection.update(state);for(const el of [app,shell,dialog]){el.__viewportState=state;el.dataset.viewportReady=String(state.ready);el.dataset.viewportEpoch=String(state.epoch);el.dataset.surfaceGeneration=String(state.surfaceGeneration);el.dataset.viewportPainted=String(state.painted);el.dataset.viewportStatus=state.status;el.dataset.viewportReason=state.reason;}geometryDirty=true;}});
 const geometryObserver=window.ResizeObserver?new window.ResizeObserver(()=>{geometryDirty=true;if(mounted)lifecycle.invalidate('layout');}):null;
 for(const el of [shell,$('#stage'),$('.dom-hud'),$('#controls')].filter(Boolean))geometryObserver?.observe(el);



 syncPreferences();syncMedia();mounted=true;
 const compactToolbar=mountCompactToolbar({document,root:$('#trial-app')});
 return {get viewport(){return viewport},beginFrame:time=>surface.beginFrame(time),paintFrame:token=>surface.paint(token),failFrame:error=>{protection.setDrawFailure(error);return surface.fail();},prepareSurface:()=>lifecycle.prepareCurrent(),get surfaceToken(){return lifecycle.token;},get ready(){return lifecycle.ready;},get epoch(){return lifecycle.epoch;},get status(){return lifecycle.status;},get reason(){return lifecycle.reason;},subscribe:fn=>lifecycle.subscribe(fn),invalidateGeometry,logicalRect,renderCameraHints,clearCameraHints,openSettings,closeSettings,openHome,render,resize,syncMedia,mediaState,cancelRestart,get preferences(){return store.get()},get busy(){return restarting||returningHome||isBusy();},get shouldKeepPausedAfterRestart(){return restartPauseRequested||document.hidden||dialog.open||homeDialog.open;},get cameraOptions(){return cameraOptions()},refreshAccess(){settingsUI.refreshAccess();selects.refresh();},setCameraAvailable(enabled=true){cameraEnabled=!!enabled;$('#camera-mode').hidden=!cameraEnabled;},destroy(){cameraHints.destroy();compactToolbar.destroy();surface.destroy();protection.destroy();lifecycle.destroy();geometryObserver?.disconnect();resume=null;homeResume=null;settingsUI.close();zoom.destroy();selects.destroy();window.removeEventListener('keydown',intercept,true);window.removeEventListener('keyup',intercept,true);window.removeEventListener('pointerdown',unlockFromGesture,true);window.removeEventListener('keydown',unlockFromGesture,true);window.removeEventListener('blur',retainRestartPause);document.removeEventListener('visibilitychange',retainHiddenPause);dialog.remove();homeDialog.remove();safeProbe.remove();}};
}

export function chapterKeyboardAction(code,route){const key={ArrowUp:route?'up':'jump',KeyW:route?'up':'jump',ArrowDown:route?'down':'crouch',KeyS:route?'down':'crouch',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyJ:'punch',KeyK:'guard',ShiftLeft:'guard',ShiftRight:'guard',KeyU:'special1',KeyI:'special2',KeyO:'special3',KeyH:'assist',KeyL:'rally'};return key[code];}
import {DEVELOPMENT_TOOLS} from '../../release-features.mjs';
