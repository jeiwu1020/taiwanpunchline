import {loadChapterImage} from '../../chapter-image-loader.mjs';
import {mountChapterComicReader} from '../campaign/chapter-comic-reader.mjs?v=comic-reader-r1';
import {createComicPresentation} from '../campaign/story-comic-presentation.mjs?v=full-comic-r2';
import {drawChallengeSignatureProjectile} from '../../challenge-signature-projectile.mjs?v=chapter-upgrade-r1';
import {drawChapterEncounter,drawChapterEncounterEffects,drawChapterEncounterGuidance,drawChapterEncounterObject} from '../../chapter-encounter-art.mjs?v=street-object-polish-r2';
import {challengeResultActions,chapterRoundResultCopy,mountChapterCountdown,setSeriesWinMarkers} from '../../series-presentation.mjs?v=series-presentation-20261117-r1';
import {registerQuickView} from '../quick-view/hook.mjs?v=quick-view-20261113-r1';
import {drawChapterStreetMotifs} from '../campaign/chapter-street-motifs.mjs?v=campaign-boot-20261112-r3';
import {streetActorNeedsPaint} from '../../street-actor-visibility.mjs?v=campaign-boot-20261112-r3';
import {backgroundPresentation} from '../../background-cache-policy.mjs?v=chapter-presentation-20261117-r1';
import {drawStreetMobHealth} from '../../challenge-mob-health.mjs?v=street-mob-hp-20261116-r1';
import {planSimulationFrame} from '../../simulation-frame.mjs?v=campaign-boot-20261112-r3';
import {combatCalloutEntries,drawCombatCallout,layoutCombatCallouts,makeCombatCallout,moveCalloutForMove,moveKindForAction,rememberCombatCallout} from '../campaign/combat-callouts.mjs?v=chapter-presentation-20261117-r1';
import {rememberCombatFeedback,paintCombatFeedback} from '../campaign/combat-feedback.mjs?v=chapter-combat-feedback-20261115-r1';
import {invalidateStreetStaticCaches} from '../campaign/street-static-cache.mjs?v=chapter-presentation-20261117-r1';
import {mountChapterPauseLifecycle} from '../campaign/chapter-pause-lifecycle.mjs?v=chapter-presentation-20261117-r1';
import {createChapterMedia} from '../campaign/chapter-media.mjs?v=rally-consistency-20261115-r1';
import {createMobileCameraAdapter} from '../campaign/mobile-camera-adapter.mjs?v=chapter-presentation-20261117-r1';
import {mountChapterInterface,chapterKeyboardAction} from '../campaign/chapter-ui.mjs?v=chapter-presentation-20261117-r1';
import {mountSpecialNameFit} from '../../special-name-fit.mjs?v=campaign-boot-20261112-r3';
import {mountCampaignTouch} from '../campaign/touch-policy.mjs?v=campaign-boot-20261112-r3';
import {chapterAssetURL} from '../shared-asset-urls.mjs?v=campaign-boot-20261112-r3';
import {mountContinuationControls,renderContinuationChoice} from '../campaign/page-bridge.mjs?v=chapter-presentation-20261117-r1';
import {loadChapterAssetsInStages} from '../campaign/chapter-asset-loading.mjs?v=chapter-staged-assets-20261116-r1';
import {mountChapterLoadingOverlay,unifiedChallengeBackdropFrame,fixedBackdropPresentation} from '../../chapter-unified-presentation.mjs?v=chapter-presentation-20261117-r1';
import {drawStreetBackdrop,SKY_EXTENSION_FILES,STREET_SEAM_FILES} from './street-backdrop.mjs?v=campaign-boot-20261112-r3';
import {installChaseWindow} from '../later-chase-window.mjs?v=campaign-boot-20261112-r3';
import {CAST,Duel,GROUND} from './core.mjs?v=rally-consistency-20261115-r1';
import {ART_FILES,drawFighterArt,drawProp} from './art-render.mjs?v=campaign-boot-20261112-r3';
import {drawChallengeMob,drawChallengeStreetProp,drawChallengeSupply} from './challenge-art.mjs?v=campaign-boot-20261112-r3';
import {drawChapter2Miniboss} from './chapter2-mob-art.mjs?v=campaign-boot-20261112-r3';
import {streetTrialFrame} from './street-trial-view.mjs?v=rally-consistency-20261115-r1';
import {DESK} from './stage-expansion.mjs?v=campaign-boot-20261112-r3';
import {rallyCrowdFormation,paintRallySupporters,paintRallySupporterFlags,paintRallyAttackLane,paintRallyCallouts,rallyEventCopy,mergeRallySupporterLayers} from '../campaign/rally-crowd.mjs?v=rally-depth-alpha-20261115-r1';
import {chapter2RenderActor,chapter2TableFrame,chapter2ObstacleFrame,chapter2SceneLayers,drawChapter2TableLayer} from './chapter2-render-rules.mjs?v=street-object-polish-r3';
import {arrowPresentation} from './art-motion.mjs?v=campaign-boot-20261112-r3';
import {bindTouchControls} from './touch-controls.mjs?v=campaign-boot-20261112-r3';
import {createPlayableChapter} from './chapter2-controller.mjs?v=chapter-presentation-20261117-r1';
import {CHAPTER2,CHARACTER_NAMES} from './chapter2-content.mjs?v=campaign-boot-20261112-r3';
import {ASSET_FILES} from './chapter2-assets.mjs?v=campaign-boot-20261112-r3';
import {CHAPTER2_NEW_ART} from './chapter2-new-art.mjs?v=campaign-boot-20261112-r3';
import {storyPropState} from './chapter3-story-props.mjs?v=campaign-boot-20261112-r3';
import {bossRevealed,storyActors,soloMicX} from './chapter2-reveal.mjs?v=campaign-boot-20261112-r3';
if(window.parliamentOrientationChoice?.pending)await window.parliamentOrientationChoice.ready;
mountCampaignTouch({document,window});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],canvas=$('#game-canvas'),ctx=canvas.getContext('2d');
let images={},chapter=null,selected='wang',uiToken='',held={},keys=new Set(),pointers=new Set(),controls=null,punchWait=0,lastTime=null,sound=false,audio=null,caption='',captionUntil=0,frameTime=0,deferredAssetError='';
const combatCallouts=new Map();
const combatFeedback=[];
const chaseWindow=installChaseWindow({document,chapter:3});
let idle=new Duel('wang','beginner',()=>.3,'wang');
let storyStartedAt=0;
const mobileCamera=createMobileCameraAdapter();
let ui,continuation,comicReader;
const media=createChapterMedia({document,window,getSettings:()=>ui?.preferences,getImages:()=>images,onState:s=>ui?.mediaState(s)});
ui=mountChapterInterface({document,window,cast:CAST,media,clearHold,surfaceContext:ctx,onSurfaceReset:()=>invalidateStreetStaticCaches(ctx),canUse:id=>(v()?.unlocked||['wang','han','huang','su']).includes(id),isBusy:()=>!!continuation?.busy,isOperationBusy:()=>!!continuation?.operationBusy,onPrepare:()=>continuation?.openPreparation({readOnly:true}),onReturnOverview:()=>continuation?.returnOverview({confirmed:true}),onReturnHome:()=>continuation?.returnHome({confirmed:true}),onRestart:async()=>{media.unlock();clearHold();const current=chapter,s=v();if(!current||!s?.paused)return false;const result=await current.restartSegment(s.token);if(chapter!==current)return false;if(result===true||result?.accepted&&result?.persisted){if(ui.shouldKeepPausedAfterRestart)current.setPaused(true,current.view().token);sync();ui.syncMedia({restart:true});}else sync();return result;},getCharacter:()=>v()?.characterId||selected,getExitState:()=>v()??continuation?.exitState,onViewportChange:({frame,epoch})=>resizeCanvas(),onCameraChange:()=>{if(!v()?.paused)mobileCamera.reset();},onSound:(enabled)=>{sound=enabled;},pauseForUI:purpose=>{const current=chapter,wasActive=active();if(wasActive&&chapter.setPaused(true,v().token))sync();clearHold();return()=>{if(purpose!=='settings'&&wasActive&&chapter===current&&v()?.paused&&pauseLifecycle.resume())sync();};}});
const pauseLifecycle=mountChapterPauseLifecycle({document,window,getChapter:()=>chapter,isPending:()=>!!continuation?.operationBusy,clearHold,onChange:()=>sync(),onFrameReset:()=>{lastTime=null;}});
ui.setCameraAvailable(true);
mountSpecialNameFit({document});
const comic=createComicPresentation({chapterId:'chapter-3'});
comicReader=mountChapterComicReader({document,getChapter:()=>chapter,onChange:sync,onAudio:tone,isBlocked:()=>!!ui?.busy||ui?.ready===false,paintFrame:comic.paintFrame,onRetryArt:()=>comic.load(images,{retry:true})});
function v(){return chapter?.view();}
const seriesCountdown=mountChapterCountdown({documentRef:document,getState:v,getChapter:()=>chapter,onStart:()=>sync()});
function active(){const s=v();return s&&!pauseLifecycle.blocked&&!s.paused&&!s.blocked&&!s.busy&&!ui?.busy&&ui?.ready!==false&&['route','battle'].includes(s.mode);}
function recalc(){held={};for(const k of keys){const a=chapterKeyboardAction(k,v()?.mode==='route');if(a)held[a]=true;}for(const a of pointers)held[a]=true;}
function clearHold(){keys.clear();pointers.clear();held={};punchWait=0;controls?.clear();}
function tone(){media.unlock();}
function shout(copy){caption=copy;captionUntil=performance.now()+1500;$('#feedback').textContent=copy;window.setTimeout(()=>{if(performance.now()>=captionUntil){caption='';$('#feedback').textContent='';}},1500);}
function command(action){const s=v();if(!active())return false;const accepted=chapter.press(action,s.token);if(action==='punch')punchWait=.35;return accepted;}
function portrait(id){return chapterAssetURL('chapter3',CAST[id].portrait.replace(/^assets\//,''));}
function roster(root,ids,choice,onSelect){root.replaceChildren(...ids.map(id=>{const b=document.createElement('button');b.type='button';b.dataset.character=id;b.setAttribute('aria-pressed',String(id===choice));const im=document.createElement('img');im.src=portrait(id);im.alt='';const name=document.createElement('b');name.textContent=CAST[id].name;b.append(im,name);b.onclick=()=>onSelect(id);return b;}));}
function refreshMenu(){roster($('#menu-roster'),['wang','han','huang','su'],selected,id=>{selected=id;idle=new Duel(id,'beginner',()=>.3,'wang');refreshMenu();});}
function sync(){
 pauseLifecycle.sync();const s=v();if(!s)return;seriesCountdown.sync(s);chaseWindow.paint({active:s.mode==='route'&&!s.paused,image:images['opening-props-v75'],time:frameTime});if(uiToken!==s.token)storyStartedAt=frameTime;uiToken=s.token;clearHold();ui.refreshAccess();if(!s.paused&&!ui.busy)ui.cancelRestart(false);const noncombat=!['route','battle'].includes(s.mode)||s.paused||s.blocked||s.busy;document.body.dataset.noncombat=String(noncombat);document.body.dataset.chapterMode=s.paused?"pause":s.mode;
 for(const id of ['menu','story-panel','result-panel','pause-panel','choice-panel'])$('#'+id).hidden=true;
 $('#pause').disabled=!['story','route','battle'].includes(s.mode);$('#pause').textContent=s.mode==='story'?'出戰準備':s.paused?'▶ 繼續':'Ⅱ 暫停';
 $('#fighter-name').textContent=CAST[s.characterId].name;
 for(const [i,b] of $$('#specials button').entries())b.querySelector('.move-copy strong').textContent=CAST[s.characterId].moves[i].name;
 idle=new Duel(s.characterId,'beginner',()=>.3,bossRevealed(s)&&s.characterId!=='ko'?'ko':'wang');
 if(s.mode==='story'){
  $('#story-panel').hidden=false;$('#story-count').textContent=`${s.frameIndex+1} / ${s.frameCount}`;$('#story-speaker').textContent=s.storyFrame.speaker;$('#story-title').textContent=s.storyFrame.title;$('#story-copy').textContent=s.storyFrame.copy;
  $('#story-next').textContent=s.frameIndex===s.frameCount-1?'出發 →':'下一格 →';const token=s.token;$('#story-next').onclick=()=>{if(!ui.busy&&chapter.nextStory(token)){tone();sync();}};
 }else if(s.mode==='result'){
  $('#result-panel').hidden=false;const fictionNote=$('#result-panel .fiction-note');if(fictionNote)fictionNote.hidden=true;let outcome=null;if(s.result.kind==='route'){$('#result-eyebrow').textContent='路段結果';$('#result-title').textContent='這段先喘口氣';$('#result-copy').textContent='倒下不會倒退章節，從目前路段再試一次。';$('#result-score').textContent='';}else{outcome=chapterRoundResultCopy(s,chapter?.world?.enemy?.displayName??'對手');$('#result-eyebrow').textContent=outcome.eyebrow;$('#result-title').textContent=outcome.title;$('#result-copy').textContent=outcome.subtitle;$('#result-score').textContent=outcome.score;}
  $('#result-next').textContent=s.result.matchLost?'重試這一關':s.result.matchWon?'繼續追神麥 →':outcome?.action??'下一局 →';const token=s.token;$('#result-next').onclick=()=>{media.unlock();if(!ui.busy&&chapter.continueResult(token))sync();};const skillButton=$('#result-skill'),overviewButton=$('#result-home'),resultActionBlocked=!!s.busy||!!s.blocked||!!continuation?.operationBusy,actions=challengeResultActions({challenge:true,resultReady:!!(s.result.matchWon||s.result.matchLost),winner:s.result.matchWon?'player':s.result.matchLost?'enemy':s.result.winner,between:!!outcome&&!outcome.complete,route:s.result.kind==='route'});skillButton.hidden=!actions.showPreparation;skillButton.textContent=actions.preparationLabel;overviewButton.hidden=!actions.showOverview;$('#result-next').disabled=resultActionBlocked;skillButton.disabled=overviewButton.disabled=resultActionBlocked;skillButton.onclick=()=>{media.unlock();if(!ui.busy&&!resultActionBlocked)continuation?.openPreparation();};overviewButton.onclick=()=>{if(!ui.busy&&!resultActionBlocked)continuation?.returnOverview({confirmed:true});};
 }else if(s.mode==='choice'||s.mode==='complete'){
  $('#choice-panel').hidden=false;const token=s.token,choiceRoster=$('#choice-roster');choiceRoster.replaceChildren();choiceRoster.hidden=s.mode==='complete'||!!s.campaignChapterId;if(!choiceRoster.hidden){const prepare=document.createElement('button');prepare.type='button';prepare.className='primary menu-action';prepare.textContent='調整下一段出戰準備';prepare.onclick=()=>continuation.openPreparation();choiceRoster.append(prepare);}
  $('#choice-title').textContent=s.mode==='complete'?'神麥往下一站去了':'柯P加入！';$('#choice-copy').textContent=s.mode==='complete'?'第三章已打通。第四章入口已保留，回挑戰總覽，接著追麥。':'選好接下來的主角，跟著音響車追神麥。下一站，繼續追麥。';$('#chapter-next').hidden=s.mode==='complete';$('#chapter-next').onclick=()=>{if(!ui.busy&&chapter.finishChapter(token))sync();};
 }
 renderContinuationChoice({document,state:s,chapterId:'chapter-3'});continuation.render();
 if(s.paused){$('#pause-panel').hidden=false;}
 comicReader?.sync();ui.syncMedia();ui.invalidateGeometry?.();resizeCanvas();
}
function resumeFromPause(){const s=v();if(!s?.paused)return false;media.unlock();if(pauseLifecycle.resume()){const status=$('#chapter-action-status');if(status)status.textContent='';sync();return true;}const latest=v();if(latest?.blocked&&latest?.campaignChapterId)continuation?.openRecovery();const status=$('#chapter-action-status');if(status)status.textContent=latest?.busy?'正在完成目前操作，請稍後再按一次。':latest?.blocked?'目前進度保護中，已開啟保存處理選項。':'目前無法繼續，請再試一次。';return false;}
function togglePause(){const s=v();if(!s)return;if(s.paused){resumeFromPause();return;}if(ui.busy)return;media.unlock();if(s.mode==='story'){continuation?.openPreparation();return;}if(chapter.setPaused(true,s.token))sync();}
$('#pause').onclick=togglePause;
$('#resume').onclick=resumeFromPause;
$('#start').onclick=()=>{media.unlock();chapter=createPlayableChapter({characterId:selected,difficulty:$('#difficulty').value});sync();};
function resizeCanvas(){return ui.prepareSurface();}

window.addEventListener('keydown',e=>{
 if(e.target?.closest?.('dialog,select,input,textarea,[contenteditable],[data-game-select],.game-select-menu'))return;if(e.target?.closest?.('button')&&['Space','Enter'].includes(e.code))return;
 if(e.code==='Escape'){if(!e.repeat)togglePause();return;}const a=chapterKeyboardAction(e.code,v()?.mode==='route');if(!a||!active())return;e.preventDefault();if(e.repeat||keys.has(e.code))return;keys.add(e.code);recalc();if(!['up','down','left','right','guard','crouch'].includes(a))command(a);
});window.addEventListener('keyup',e=>{keys.delete(e.code);recalc();});
controls=bindTouchControls({document,window,active,viewport:()=>({ready:ui.ready,epoch:ui.epoch,rotation:ui.viewport.rotation}),rotation:()=>ui.viewport.rotation,directionMode:()=>v()?.mode==='route'?'depth':'duel',stickSelector:'#touch-stick',knobSelector:'#touch-knob',buttonSelector:'#controls button',onHold:(a,on)=>{on?pointers.add(a):pointers.delete(a);recalc();},onAction:command});
for(const b of $$('#controls button')){
 b.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||!active())return;e.preventDefault();if(!e.repeat){if(b.dataset.hold){pointers.add(b.dataset.hold);recalc();if(b.dataset.hold==='punch')command('punch');}else if(b.dataset.action)command(b.dataset.action);}});
 b.addEventListener('click',e=>{if(e.detail===0&&active()&&!b.disabled){const action=b.dataset.action||(b.dataset.hold==='punch'?'punch':null);if(action)command(action);}});
 const release=()=>{pointers.delete(b.dataset.hold);recalc();};b.addEventListener('keyup',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();release();}});b.addEventListener('blur',release);
}

function routeIndex(s){return !s||s.stepId==='entry'||s.stepId==='route-a'||s?.stepId==='miniboss-a'?0:s?.stepId==='route-b'||s?.stepId==='miniboss-b'?1:2;}
function paintBackdrop(im,f,w,h,curb=700,scene=routeIndex(v())){const presentation=fixedBackdropPresentation(w,h,backgroundPresentation(w,h,ui.cameraOptions));const result=drawStreetBackdrop(ctx,im,{...f,backdropZoom:f.backdropZoom??presentation.horizonZoom,presentation},w,h,curb,images['chapter3-sky-'+scene],images['chapter3-seam-'+scene],scene,images['chapter3-edge-'+scene]);drawChapterStreetMotifs(ctx,images['chapter-street-motifs'],f,{chapter:3,route:routeIndex(v()),worldWidth:CHAPTER2.routes[routeIndex(v())].width,width:w});return result;}
function actor(f,frame,time,alpha=1){f=chapter2RenderActor(f);const x=(f.x-frame.left)*frame.zoom,y=frame.base+(f.y-GROUND+(f.depth??0)*.65)*frame.zoom;ctx.save();ctx.translate(x,y);ctx.scale(frame.zoom*(f.face||1),frame.zoom);ctx.globalAlpha=alpha;if(f.mobKind?.startsWith('mini_'))drawChapter2Miniboss(ctx,images,f,time,{shadow:false});else if(f.mobKind)drawChallengeMob(ctx,images,f,time,{shadow:false});else drawFighterArt(ctx,images,f,time,{shadow:false});ctx.restore();}
function label(copy,x,y,size=20,color='#fff3ce'){ctx.font=`900 ${size}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.strokeStyle='#17353a';ctx.lineWidth=4;ctx.strokeText(copy,x,y);ctx.fillStyle=color;ctx.fillText(copy,x,y);}
function microphone(x,y,size=58,angle=-.3){const im=images['opening-props-v75'];if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#fff5c6cc';ctx.strokeStyle='#bc8534';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-size*.55,size*.42,size*.68,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.drawImage(im,1186,543,192,444,-size*.22,-size,size*.44,size);ctx.restore();}
function paintStory(s,w,h,time){
 const compact=h<480,portrait=w<h,f={left:0,base:portrait?Math.min(h*.59,Math.max(h*.42,w*.9)):h*(compact?.53:.59),zoom:Math.min(w/720,(h*(compact?.51:.55))/300)},shot=s?.storyFrame?.shot??'market-trail',scene=routeIndex(s),im=images[`chapter2-scene-${scene}`];paintBackdrop(im,f,w,h,CHAPTER2_NEW_ART.curbs[scene],scene);
 const prop=storyPropState(shot,{width:w,base:f.base,zoom:f.zoom,elapsed:Math.max(0,(time-storyStartedAt)/1000)});
 const cast=storyActors(s,selected),transport=['cart-catch','follow-cart'].includes(shot),p={...idle.player,x:(prop.playerX??w*(transport?.19:cast.length===1?.36:.3))/f.zoom,y:GROUND,depth:0,face:1};
 actor(p,f,time);
 if(cast[1]&&!transport){
  const enemy={...idle.enemy,type:cast[1].characterId,x:w*.7/f.zoom,y:GROUND,depth:0,face:-1};
  if(cast[1].mobKind){enemy.mobKind=cast[1].mobKind;enemy.displayName=s.storyFrame.title;}

  actor(enemy,f,time);
 }
 const {mic,standY,standHeight}=prop;
 if(prop.parade){const q=prop.parade;ctx.drawImage(images['chapter3-parade-float'],q.x,q.y,q.width,q.height);}
 if(prop.truck){const q=prop.truck;ctx.drawImage(images['chapter3-sound-truck'],q.x,q.y,q.width,q.height);}
 if(prop.staff){const sf={...f,zoom:f.zoom*prop.staff.scale},staff={...idle.player,type:'wang',mobKind:'leaflet',x:prop.staff.x/sf.zoom,y:GROUND+(prop.staff.y-f.base)/sf.zoom,depth:0,face:1,vx:60};actor(staff,sf,time);}
 if(prop.ribbon){const {start,end}=prop.ribbon;ctx.strokeStyle='#ba4a38';ctx.lineWidth=4*f.zoom;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo((start.x+end.x)/2,end.y-45*f.zoom,end.x,end.y);ctx.stroke();}
 if(prop.carrier==='wheeled-stand'){
  ctx.strokeStyle='#4c443b';ctx.lineWidth=4*f.zoom;ctx.beginPath();ctx.moveTo(mic.x,mic.y);ctx.lineTo(mic.x,standY-6*f.zoom);ctx.moveTo(mic.x-20*f.zoom,standY-6*f.zoom);ctx.lineTo(mic.x+20*f.zoom,standY-6*f.zoom);ctx.stroke();
  ctx.fillStyle='#273235';for(const d of [-17,17]){ctx.beginPath();ctx.arc(mic.x+d*f.zoom,standY,5*f.zoom,0,Math.PI*2);ctx.fill();}
 }
 microphone(mic.x,mic.y,Math.max(34,48*f.zoom),prop.carrier==='ribbon'?.52:0);label('神麥',mic.x,mic.y+18,Math.max(12,16*f.zoom),'#ffe18b');
}
function draw(time,delta=1000/60){
 const w=canvas.clientWidth,h=canvas.clientHeight,s=v(),g=chapter?.world;ctx.clearRect(0,0,w,h);
 if(s?.mode==='story'){ui.clearCameraHints();comicReader.paint(ctx,images,w,h,time,comic.motionOptions());return;}
 if(!s||s.mode==='choice'||s.mode==='complete'){ui.clearCameraHints();paintStory(s,w,h,time);return;}
 if(!g){ui.clearCameraHints();return;}const route=!!g.depthMode,player=g.player,portrait=ui.viewport.width<ui.viewport.height;
 let f;if(route)f=streetTrialFrame({width:w,height:h,portrait,player,worldWidth:g.worldWidth});else{f=unifiedChallengeBackdropFrame(w,h,g,{portrait,touch:ui.cameraOptions?.touch??(ui.viewport?.touch===true)});}
 f=mobileCamera.frame(f,g,{width:w,height:h,route,delta,paused:s.paused||g.status==='paused',...ui.cameraOptions});
 ui.renderCameraHints(f.cameraFrame,g,{route,active:!s.paused&&!s.blocked&&!s.busy&&g.status==='active'&&['route','battle'].includes(s.mode)});
 const sx=x=>(x-f.left)*f.zoom,sy=(y,z=0)=>f.base+(y-GROUND+z*.65)*f.zoom;
 const scene=routeIndex(s);paintBackdrop(images[`chapter2-scene-${scene}`],f,w,h,CHAPTER2_NEW_ART.curbs[scene],scene);
 const platforms=route?g.platforms:[{...DESK,depth:0,depthHalf:30}];
 const crowd=rallyCrowdFormation(g,f,w,h,time,{route}),rallyProject=(x,y=GROUND,z=0)=>({x:sx(x),y:sy(y,z)}),crowdProject=m=>rallyProject(m.x,m.y,m.depth);
 paintRallyAttackLane(ctx,g,rallyProject,f.zoom,{route});
 const actors=route?[player,...g.enemies.filter(e=>e.hp>0||e.deadAge<.6)]:[player,g.enemy];
 for(const a of g.assists||[])actors.push({...a.actor,helper:true,alpha:a.phase==='exit'?Math.max(0,1-a.exitAge/a.exitDuration):a.phase==='warning'?.6:1});
 const paintActor=a=>!route||a===player||streetActorNeedsPaint(a,{left:f.left,right:f.left+w/f.zoom});
 const shadow=a=>{ctx.fillStyle=a===player?'#bd543c55':'#17353a33';ctx.beginPath();ctx.ellipse(sx(a.x),sy(route?(a.supportY??GROUND):GROUND,a.depth),38*f.zoom,8*f.zoom,0,0,Math.PI*2);ctx.fill();};
 for(const a of actors)if(paintActor(a)&&(!route||(a.supportY??GROUND)>=GROUND))shadow(a);
 const encounterProject=rallyProject;
 if(route)drawChapterEncounterEffects(ctx,g,encounterProject,f.zoom,images);else drawChapterEncounter(ctx,g,encounterProject,f.zoom,images);
 const safeTop=Math.max(0,ui.cameraOptions.hudBottom||0)+8,calloutEntries=combatCalloutEntries(s,g,actors,combatCallouts,performance.now()),callouts=layoutCombatCallouts(calloutEntries,actors,f,w,h,GROUND,delta,performance.now(),safeTop);for(const item of callouts){const record=combatCallouts.get(item.actor);if(record)record.placement=item.placement;}
 const obstacles=(g.obstacles||[]).filter(q=>!q.dead).map(value=>({kind:'obstacle',value,depth:value.depth??0})),objects=mergeRallySupporterLayers(chapter2SceneLayers(platforms,actors,route,route?g.chapterEncounter:null,route?g:null,callouts),crowd,obstacles);
 for(const o of objects)if(o.kind==='rally-supporter'){paintRallySupporters(ctx,images,[o.member],crowdProject,f.zoom);paintRallySupporterFlags(ctx,[o.member],{width:w,height:h,zoom:f.zoom,left:f.left,base:f.base});}else if(o.kind==='callout'){drawCombatCallout(ctx,o.value,f,GROUND,w);}else if(o.kind==='obstacle'){drawChallengeStreetProp(ctx,images,'sign',chapter2ObstacleFrame(o.value,f));}else if(o.kind==='table-top'||o.kind==='table-front'){drawChapter2TableLayer(ctx,images,o,f);}else if(o.kind==='table-solid'){const p=o.p;drawChallengeStreetProp(ctx,images,'table',chapter2TableFrame(p,f,route));}else if(o.kind==='encounter-prop'||o.kind==='encounter-gate'){drawChapterEncounterObject(ctx,o.kind==='encounter-prop'?'prop':'gate',o.value,encounterProject,f.zoom,images,g.chapterEncounter?.time??time);}else if(o.kind==='route-supply'){drawChallengeSupply(ctx,images,{x:sx(o.value.x),y:sy(GROUND,o.depth),width:90*f.zoom});}else if(o.kind==='route-gate'){const x=sx(o.value.x);drawChallengeStreetProp(ctx,images,'sign',{x,y:sy(GROUND,o.depth),width:85*f.zoom,height:110*f.zoom});label('前方開講 →',x,sy(GROUND-145,o.depth),18*f.zoom);}else{const a=o.a;if(!paintActor(a))continue;if(route&&(a.supportY??GROUND)<GROUND)shadow(a);actor(a,f,time,a.alpha??(a.hp<=0?.4:a.invulnerable>0?.7:1));if(route&&a.mobKind&&a.hp>0)drawStreetMobHealth(ctx,sx(a.x),sy(a.y-270,a.depth),f.zoom,a.hp,a.maxHp);if(route&&a.mobKind&&a.hp>0)label(a.warning>0?(a.chapterCaption??'要出手囉！'):a.displayName??a.name,sx(a.x),sy(a.y-300,a.depth),Math.max(13,18*f.zoom));}
 if(route)drawChapterEncounterGuidance(ctx,g,encounterProject,f.zoom);
 for(const q of g.projectiles||[]){if(q.dead)continue;const qp=q.kind==='arrow'?arrowPresentation(q):q;ctx.save();ctx.translate(sx(qp.x),sy(qp.y,q.depth));ctx.scale(f.zoom,f.zoom);if(q.kind==='coin')drawProp(ctx,images,'coin',0,0,35,36,time*.008);else if(q.kind==='arrow')drawProp(ctx,images,'arrow',0,0,qp.width,qp.height,qp.angle);else if(drawChallengeSignatureProjectile(ctx,images,q,time)){}else{ctx.fillStyle='#fff5dc';ctx.strokeStyle='#17353a';ctx.lineWidth=2;ctx.rotate(time*.004);ctx.fillRect(-16,-11,32,22);ctx.strokeRect(-16,-11,32,22);}ctx.restore();if(q.targetX!=null){ctx.strokeStyle='#d15c37';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx(q.targetX),sy(GROUND,q.depth),35*f.zoom,9*f.zoom,0,0,Math.PI*2);ctx.stroke();}}
 paintRallyCallouts(ctx,g,rallyProject,{width:w,height:h,zoom:f.zoom,safeTop});paintCombatFeedback(ctx,combatFeedback,f,GROUND,w,time);

}
function hudText(selector,value){const element=$(selector);if(element.textContent!==value)element.textContent=value;}
function hud(){const s=v(),g=chapter?.world;if(!s)return;setSeriesWinMarkers(document,s.rounds.player,s.rounds.enemy,s.stepId==='boss');const route=s.mode==='route',battle=s.mode==='battle';hudText('#route-progress',route?`${CHAPTER2.routes[routeIndex(s)].name} · ${Math.round(g.routeProgress*100)}%`:battle?g.enemy.displayName:'第三章 · 追逐神麥');hudText('#objective',route?(g.chapterEncounter?.hint??CHAPTER2.routes[routeIndex(s)].objective):battle?(s.stepId==='boss'?(g.chapterEncounter?.hint??'三戰兩勝，贏的人拿神麥！'):'看預告、閃過招式，再反擊。'):'追麥不停站 · 先看對手動作，再出拳');if(deferredAssetError)hudText('#objective',deferredAssetError);if(g)ui.render({state:s,world:g});}

function tick(now){
 try{
  const paintToken=ui.beginFrame(now),elapsed=lastTime===null?0:now-lastTime;lastTime=now;frameTime=now;
  const plan=planSimulationFrame(elapsed,{paused:!active()}),dt=plan.acceptedMs/1000;
  if(active()){
   const current=chapter,world=chapter.world,token=v().token;
   if(held.punch){punchWait-=dt;if(punchWait<=0)command('punch');}
   for(const step of plan.steps){
    if(!active()||chapter!==current||chapter.world!==world||v().token!==token)break;
    chapter.step(step,{...held,crouch:v().mode==='battle'&&!!(held.down||held.crouch)});
   }
   const emitted=current.drainEvents();media.handleEvents(emitted,world);for(const e of emitted)rememberCombatFeedback(combatFeedback,e);for(const e of emitted){if(e.type==='minibossWarning'||e.type==='move'&&[world.enemy,world.player].includes(e.f)){const caption=e.f===world.player?moveCalloutForMove(e.kind,e.name,e.f.type):makeCombatCallout(e.name??'注意對手動作','',moveKindForAction(e.action??e.kind,e.f?.type),e.f?.type);if(caption)rememberCombatCallout(combatCallouts,e.f,caption);}else if(e.type==='rally')shout(rallyEventCopy(e,world,emitted.filter(item=>item.type==='rally').length>1));else if(e.type==='assistStart')shout(`${e.assist?.displayName??CAST[e.helper]?.name??'助拳'} · ${e.name??'援護到場'}`);if(e.type==='supply')shout('補給到手！HP 全滿');}
   if(v().token!==uiToken)sync();
  }
 chaseWindow.paint({active:v()?.mode==='route'&&!v()?.paused,image:images['opening-props-v75'],time:now}); hud();if(paintToken){draw(now,plan.acceptedMs);ui.paintFrame(paintToken);}
 }catch(error){ui.failFrame(error);}
 finally{requestAnimationFrame(tick);}
}
continuation=mountContinuationControls({document,window,characters:CAST,chapterId:'chapter-3',createPlayableChapter,getPlayable:()=>chapter,pauseForUI:()=>{clearHold();const s=v();if(s&&!s.paused&&['route','battle'].includes(s.mode)&&chapter.setPaused(true,s.token))sync();},isReady:()=>!$('#start').disabled,getOptions:()=>({difficulty:$('#difficulty').value}),onReady:next=>{chapter=next;selected=next.view().characterId;sync();},onChange:()=>sync()});
refreshMenu();resizeCanvas();
const allFiles={...ART_FILES,...SKY_EXTENSION_FILES,...STREET_SEAM_FILES,...ASSET_FILES,...CHAPTER2_NEW_ART.files};
const sceneAssetIndexes=Object.fromEntries([0,1,2].flatMap(index=>[[`chapter3-sky-${index}`,index],[`chapter3-seam-${index}`,index],[`chapter3-edge-${index}`,index]]));
const initialBackdropFile=allFiles['chapter2-scene-0']||allFiles['chapter3-sky-0'];
const loadingOverlay=mountChapterLoadingOverlay({document,chapter:3,backdropUrl:initialBackdropFile?chapterAssetURL('chapter3',initialBackdropFile):''});
void comic.load(images).then(()=>comicReader.sync());
loadChapterAssetsInStages({files:allFiles,sceneAssetIndexes,loadImage:(key,file)=>loadChapterImage(chapterAssetURL('chapter3',file)),onProgress:({phase,loaded,total})=>{const ratio=total?loaded/total:0;if(phase==='shared'){$('#start').textContent=`載入共用素材 ${Math.round(ratio*100)}%`;loadingOverlay.setProgress(ratio*.5,{phaseLabel:'共用角色素材',statusText:`載入共用素材 ${Math.round(ratio*100)}%`});}else if(phase==='current-scene'){$('#start').textContent=`載入目前場景 ${Math.round(ratio*100)}%`;loadingOverlay.setProgress(.5+ratio*.5,{phaseLabel:'目前關卡場景',statusText:`載入目前場景 ${Math.round(ratio*100)}%`});}},resolveScene:async()=>{if(new URLSearchParams(window.location.search).has('handoff')){$('#start').disabled=false;$('#start').textContent='正在接續章節…';loadingOverlay.setPhase('章節接續','正在同步戰役進度與舞台…');await continuation.assetsReady();}const state=v();return {sceneIndex:routeIndex(state),includeMinibossAtlas:/^miniboss/.test(state?.stepId??'')};}}).then(async staged=>{
 Object.assign(images,staged.images);if(staged.images['chapter2-scene-0']?.src)loadingOverlay.setBackdrop?.(staged.images['chapter2-scene-0'].src);$('#start').disabled=false;await continuation.assetsReady();$('#start').textContent='獨立預覽（不存進度）';loadingOverlay.setReady();requestAnimationFrame(tick);
 requestAnimationFrame(()=>requestAnimationFrame(()=>void staged.loadBackground().then(({images:background,errors})=>{Object.assign(images,background);if(errors.length)deferredAssetError='部分場景素材載入失敗，請重新整理頁面。';})));
}).catch(err=>{continuation.assetsFailed();$('#start').textContent='素材載入失敗，請重新整理';$('#start').disabled=true;hudText('#objective',err.message);loadingOverlay.setError(err?.message||'部分關卡素材載入失敗，請重新整理再試。');});


registerQuickView(window,async()=>{
 if(!active()||continuation?.busy)return false;
 const s=v(),world=chapter?.world;
 if(s.mode==='route'){world.status='gate';chapter.step(0,{});await chapter.flush?.();sync();return true;}
 if(s.mode==='battle'&&world?.enemy){world.enemy.hp=0;return true;}
 return false;
});
