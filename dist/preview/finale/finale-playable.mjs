import {drawFinaleStoryArt} from './finale-story-art.mjs?v=comic-props-r2';
import {mountChapterComicReader} from '../campaign/chapter-comic-reader.mjs?v=comic-reader-r1';
import {drawChallengeSignatureProjectile} from '../../challenge-signature-projectile.mjs?v=chapter-upgrade-r1';
import {FINALE_SUPPORTERS,drawFinaleEffects} from './finale-effects.mjs?v=chapter-upgrade-r1';
import {registerQuickView} from '../quick-view/hook.mjs?v=quick-view-20261113-r1';
import {CAST,Duel,GROUND} from '../../core.mjs?v=campaign-boot-20261112-r3';
import {loadArtImages,drawFighterArt,drawProp} from '../../art-render.mjs?v=campaign-boot-20261112-r3';
import {presentationFighter} from '../../move-readability.mjs?v=campaign-boot-20261112-r3';
import {arrowPresentation} from '../../art-motion.mjs?v=campaign-boot-20261112-r3';
import {planSimulationFrame} from '../../simulation-frame.mjs?v=campaign-boot-20261112-r3';
import {bindTouchControls} from '../../touch-controls.mjs?v=campaign-boot-20261112-r3';
import {mountSpecialNameFit} from '../../special-name-fit.mjs?v=campaign-boot-20261112-r3';
import {setGameSelectValue} from '../../game-select.mjs?v=campaign-boot-20261112-r3';
import {mountChapterInterface,chapterKeyboardAction} from '../campaign/chapter-ui.mjs?v=campaign-boot-20261112-r3';
import {mountChapterPauseLifecycle} from '../campaign/chapter-pause-lifecycle.mjs?v=campaign-boot-20261112-r3';
import {mountCampaignTouch} from '../campaign/touch-policy.mjs?v=campaign-boot-20261112-r3';
import {createChapterMedia} from '../campaign/chapter-media.mjs?v=campaign-boot-20261112-r3';
import {consumeCampaignHandoff} from '../campaign/navigation.mjs?v=campaign-boot-20261112-r3';
import {openChallengeProgress} from '../campaign/fresh/progress.mjs?v=campaign-boot-20261112-r3';
import {mountChallengePreparation} from '../../challenge-preparation.mjs?v=campaign-boot-20261112-r3';
import {saveIssueText} from '../../save-copy.mjs?v=campaign-boot-20261112-r3';
import {CHARACTER_IDS} from '../campaign/core/catalog.mjs?v=campaign-boot-20261112-r3';
import {createFinaleSession} from './finale-session.mjs?v=campaign-boot-20261112-r3';
import {createFinalePreview} from './finale-preview.mjs?v=campaign-boot-20261112-r3';
import {finaleCameraFrame,finalePoint,finaleTacticalMarkers} from './finale-camera.mjs?v=finale-arena-20261113-r4';
import {drawFinaleStage} from './finale-stage.mjs?v=finale-arena-20261113-r4';
import {FINALE_INTRO,FINALE_VERDICT} from './finale-story.mjs?v=campaign-boot-20261112-r3';
mountCampaignTouch({document,window});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],canvas=$('#game-canvas'),ctx=canvas.getContext('2d'),query=new URL(location.href).searchParams,preview=['test','qa','previewOnly'].some(k=>query.has(k));
let chapter=null,progress=null,images={},loaded=false,booting=false,ui,controls,preparation,preparationBusy=false,recoveryOpen=false,draftTeam=['wang','han','huang'],keys=new Set(),pointers=new Set(),held={},lastTime=null,lastToken=null,punchWait=0,caption='',captionUntil=0,arenaFrame=null,arenaWorld=null;
const view=()=>chapter?.view();
const media=createChapterMedia({document,window,getSettings:()=>ui?.preferences,getImages:()=>images,onState:s=>ui?.mediaState(s)});
function clearHold(){keys.clear();pointers.clear();held={};punchWait=0;controls?.clear();}
function active(){const s=view();return !!s&&s.mode==='battle'&&!s.paused&&!s.busy&&!s.blocked&&!pauseLifecycle.blocked&&!recoveryOpen&&!preparationBusy&&!preparation?.isOpen&&ui.ready&&!ui.busy;}
function pauseForUI(){const s=view();if(s?.mode==='battle'&&!s.paused)chapter.setPaused(true,s.token);clearHold();return()=>{};}
ui=mountChapterInterface({document,window,cast:CAST,media,clearHold,surfaceContext:ctx,getCharacter:()=>view()?.characterId??draftTeam[0],getExitState:view,canUse:id=>view()?.unlocked.includes(id)??false,
 isBusy:()=>booting||preparationBusy,isOperationBusy:()=>booting||!!view()?.busy,pauseForUI,onViewportChange:()=>ui?.prepareSurface(),
 onPrepare:()=>openPreparation(true),onReturnOverview:()=>returnOverview(),onRestart:async()=>{const r=await chapter.restartSegment();if(r.accepted&&(r.persisted||preview)){if(ui.shouldKeepPausedAfterRestart)chapter.setPaused(true,view().token);sync();return true;}return r;}});
const pauseLifecycle=mountChapterPauseLifecycle({document,window,getChapter:()=>chapter,isPending:()=>booting||!!view()?.busy,clearHold,onChange:sync,onFrameReset:()=>{lastTime=null;}});
ui.setCameraAvailable(true);mountSpecialNameFit({document});
const comicReader=mountChapterComicReader({document,getChapter:()=>chapter,onChange:sync,onAudio:()=>media.unlock(),isBlocked:()=>!!ui?.busy});
const tactical=document.createElement('canvas');tactical.id='finale-tactical-map';tactical.width=132;tactical.height=24;tactical.setAttribute('role','img');tactical.setAttribute('aria-label','全場位置：金色是你，綠色是隊友，紅色是對手');$('.chapter-objective').append(tactical);const tacticalCtx=tactical.getContext('2d');
const saveSlot=document.createElement('button');saveSlot.id='finale-save-slot';saveSlot.type='button';saveSlot.textContent=preview?'測試不保存':'保存狀態';$('#trial-app > header').insertBefore(saveSlot,$('.toolbar'));saveSlot.onclick=()=>openRecovery();
for(const selector of ['#team-main','#team-ally1','#team-ally2']){
 const select=$(selector);for(const id of CHARACTER_IDS){const option=document.createElement('option');option.value=id;option.textContent=CAST[id].name;select.append(option);}select.onchange=()=>{draftTeam=[$('#team-main').value,$('#team-ally1').value,$('#team-ally2').value];renderTeam();};
}
$('#intro-copy').replaceChildren(...FINALE_INTRO.map(f=>{const p=document.createElement('p');p.textContent=f.speaker+'：「'+f.copy+'」';return p;}));
function renderTeam(){
 for(const [i,id]of ['#team-main','#team-ally1','#team-ally2'].entries())setGameSelectValue($(id),draftTeam[i]);
 const valid=new Set(draftTeam).size===3;$('#team-error').textContent=valid?'我方三人已選好。其餘四人是對手。':'主角與兩名隊友必須是不同角色。';
 $('#team-lineup').replaceChildren(...CHARACTER_IDS.map(id=>{const f=document.createElement('figure');f.dataset.team=draftTeam.includes(id)?'ally':'enemy';const img=document.createElement('img');img.src=new URL('../../'+CAST[id].portrait,import.meta.url).href;img.alt='';const name=document.createElement('figcaption');name.textContent=(draftTeam[0]===id?'你 · ':draftTeam.includes(id)?'友 · ':'敵 · ')+CAST[id].name;f.append(img,name);return f;}));
 $('#start').disabled=!loaded||booting||!valid||!!view()?.busy||!!view()?.blocked;
 $('#start').textContent=!loaded?'角色素材載入中…':!chapter?'接續這一槽的最終戰':view()?.mode==='team-select'?'三人上場，最後開講！':'接續最終戰';
}
function sync(){
 pauseLifecycle.sync();const s=view();if(!s){renderTeam();return;}clearHold();lastToken=s.token;
 for(const id of ['menu','story-panel','result-panel','pause-panel','choice-panel'])$('#'+id).hidden=true;
 const combat=['battle','result'].includes(s.mode);document.body.dataset.noncombat=String(!combat||s.paused||s.busy||s.blocked);document.body.dataset.chapterMode=s.paused?'pause':s.mode==='team-select'?'menu':s.mode==='intro'?'story':s.mode;document.body.dataset.finalBattle=String(combat);
 $('#pause').disabled=s.mode!=='battle';$('#pause').textContent=s.paused?'▶ 繼續':'Ⅱ 暫停';saveSlot.textContent=s.preview?'測試不保存':s.busy?'保存中':s.persisted?'進度已保存':'需處理';saveSlot.title=s.saveLabel;
 $('#finale-save-status').textContent=s.saveLabel+(s.saveIssue?'。'+saveIssueText(s.saveIssue):'');$('#finale-save-retry').disabled=s.busy||s.blocked;
 if(s.mode==='team-select'){$('#menu').hidden=false;renderTeam();}
 if(['story','intro'].includes(s.mode)){$('#story-panel').hidden=false;$('#story-speaker').textContent=s.storyFrame.speaker;$('#story-title').textContent=s.storyFrame.title;$('#story-copy').textContent=s.storyFrame.copy;$('#story-count').textContent=`${s.frameIndex+1} / ${s.frameCount}`;$('#story-next').textContent=s.frameIndex+1===s.frameCount?(s.mode==='intro'?'開打 →':'看完了 →'):'下一格 →';$('#story-next').disabled=s.busy||!!s.saveIssue;}
 if(s.mode==='result'){
  $('#result-panel').hidden=false;$('#result-title').textContent=s.result.winner==='player'?'這一隊，終於拿到麥！':s.result.winner==='draw'?'同時安靜了……再來一次':'麥先讓對面拿，故事還沒完';
  $('#result-copy').textContent=s.result.matchWon?(chapter.world?.player.hp<=0?'你先倒下，隊友替全隊贏了！':'最後站著的是你們這一隊。')+' '+s.saveLabel:s.result.winner==='draw'?'人數與生命比例相同，本場重試；章節和經驗保留。':'全隊倒下或限時比較落敗。可以重試這場，或重新選擇三人隊伍。';
  if(s.result.winner!=='draw')$('#result-copy').textContent+=' '+FINALE_VERDICT[s.result.matchWon?'win':'loss'];
  $('#result-next').textContent=s.result.matchWon?'拿起神麥，看結局 →':'原隊伍重試 →';$('#result-next').disabled=s.busy||!s.canNavigate;$('#result-reselect').hidden=s.result.matchWon;$('#result-reselect').disabled=s.busy||!s.canNavigate;
 }
 if(s.mode==='complete'){$('#choice-panel').hidden=false;$('#choice-title').textContent='門開了，話還沒講完';$('#choice-copy').textContent='七人帶著沒電的神麥跨過門檻，長廊裡卻多出一個回音。眼前這條路，誰也沒有走過。';$('#choice-roster').hidden=true;}
 if(s.paused){$('#pause-panel').hidden=false;$('#pause-roster').hidden=true;$('.chapter-pause-extras').hidden=true;$('#pause-note').textContent='暫停整場混戰。重新開吵會以相同三人隊伍從本場起點開始，章節與經驗保留。';}
 $('#finale-prepare').disabled=s.mode!=='team-select'||s.busy;$('#arena-roster').hidden=!combat;
 comicReader.sync();ui.refreshAccess();ui.syncMedia();ui.invalidateGeometry();ui.prepareSurface();
}
async function attach(handoff){
 if(booting||chapter)return false;booting=true;renderTeam();$('#menu-status').textContent='正在確認七人與已保存進度…';
 try{
  let r;
  if(preview)r=await createFinalePreview({onChange:sync});
  else{
   progress??=await openChallengeProgress({storage:window.localStorage,locks:window.navigator.locks});const state=progress.get(),p=progress.readProfile();
   if(state.readOnly||state.dirty){$('#menu-status').textContent=saveIssueText(state.reason);return false;}
   if(handoff&&(handoff.profileId!==state.activeProfileId||handoff.revision!==state.revision||handoff.generation!==state.generation||handoff.chapterId!==p.campaign.cursor.chapterId)){ $('#menu-status').textContent='此接續已過期。請回挑戰總覽重新接續，原存檔保留。';return false;}
   if(p.campaign.cursor.chapterId!=='finale-3v4'){$('#menu-status').textContent='請先完成五章、解鎖七人，再從挑戰總覽進入最終戰。';return false;}
   r=await createFinaleSession({progress,onChange:sync});
  }
  if(!r.accepted){$('#menu-status').textContent=saveIssueText(r.reason);if(progress?.get().dirty)openRecovery();return false;}
  chapter=r.chapter;const s=view();draftTeam=s.team??[s.characterId,...CHARACTER_IDS.filter(id=>id!==s.characterId).slice(0,2)];$('#menu-status').textContent=s.preview?'不讀寫正式存檔。':s.saveLabel;
  if(s.mode==='complete')chapter.reviewEnding();sync();return true;
 }catch(error){$('#menu-status').textContent='無法安全接續。請回總覽重試；原存檔保留。';return false;}
 finally{booting=false;renderTeam();}
}
async function returnOverview(){
 if(booting||preparationBusy||view()?.busy)return false;pauseForUI();await chapter?.flush();const s=view();
 if(s&&!s.canNavigate){openRecovery();return false;}
 if(progress&&!progress.verifyPersistedReceipt({...progress.get(),testMode:false})){openRecovery();$('#finale-save-status').textContent='存檔已在其他頁面變更。請保留備份後重新接續。';return false;}
 media.stop();window.location.assign('../../?challengeOverview=1');return true;
}
function openPreparation(readOnly=false){
 if(!chapter||preparationBusy||view().busy)return false;pauseForUI();
 preparation??=mountChallengePreparation({document,window,characters:CAST,controller:chapter,getEncounter:view,onBusy:value=>{preparationBusy=value;},onApplied:()=>{const s=chapter.preparationSnapshot(),rest=draftTeam.filter(id=>id!==s.characterId);draftTeam=[s.characterId,...rest,...CHARACTER_IDS.filter(id=>id!==s.characterId&&!rest.includes(id))].slice(0,3);sync();},onClose:sync,onFailure:sync});
 const editable=!readOnly&&view().mode==='team-select';
 return preparation.open({readOnly:!editable,intent:'boundary',...(editable?{initial:{characterId:draftTeam[0]}}:{})});
}
function openRecovery(){pauseForUI();recoveryOpen=true;$('#finale-recovery').hidden=false;$('#finale-save-status').textContent=view()?.saveLabel??saveIssueText(progress?.get().reason);}
async function ensureSelectedTeam(){
 const requestedTeam=[...draftTeam];
 if(!chapter){if(!await attach())return false;if(view().mode==='team-select')draftTeam=requestedTeam;}
 return true;
}
$('#start').onclick=async()=>{media.unlock();if(!await ensureSelectedTeam())return;if(view().mode==='team-select'){await chapter.start([...draftTeam],{opening:true});sync();}};
$('#finale-prepare').onclick=async()=>{if(await ensureSelectedTeam())openPreparation();};$('#leave').onclick=()=>openPreparation(true);
$('#story-next').onclick=async()=>{media.unlock();await chapter?.nextStory();sync();};$('#result-next').onclick=async()=>{media.unlock();await chapter?.continueResult();sync();};$('#result-reselect').onclick=async()=>{await chapter?.reselect();sync();};
for(const id of ['menu-home','result-home','complete-home'])$('#'+id).onclick=returnOverview;
$('#ending-review').onclick=()=>{chapter.reviewEnding();sync();};
$('#pause').onclick=()=>{if(view()?.paused)pauseLifecycle.resume();else pauseForUI();sync();};$('#resume').onclick=()=>{media.unlock();pauseLifecycle.resume();sync();};
$('#finale-save-retry').onclick=async()=>{const r=chapter?await chapter.retrySave():await progress?.retrySave();if(r?.accepted&&r.persisted){recoveryOpen=false;$('#finale-recovery').hidden=true;if(!chapter)await attach();}sync();};
$('#finale-backup').onclick=()=>{const text=chapter?.exportJSON()??progress?.exportBackup();if(!text)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='punchline-finale-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#finale-reload').onclick=()=>{if(!view()?.busy)location.reload();};$('#finale-save-close').onclick=()=>{recoveryOpen=false;$('#finale-recovery').hidden=true;sync();};
function recalc(){held={};for(const code of keys){const a=chapterKeyboardAction(code,true);if(a)held[a]=true;}for(const a of pointers)held[a]=true;}
function command(a){if(!active())return false;const r=chapter.press(a);if(a==='punch')punchWait=.35;return r;}
window.addEventListener('keydown',e=>{if(e.target.closest?.('dialog,input,textarea,select,[data-game-select],.game-select-menu'))return;if(e.target.closest?.('button')&&['Space','Enter'].includes(e.code))return;if(e.code==='Escape'){if(!e.repeat)$('#pause').click();return;}const a=chapterKeyboardAction(e.code,true);if(!a||!active()||view().busy)return;e.preventDefault();if(e.repeat||keys.has(e.code))return;keys.add(e.code);recalc();if(!['up','down','left','right','guard','crouch'].includes(a))command(a);});
window.addEventListener('keyup',e=>{keys.delete(e.code);recalc();});
controls=bindTouchControls({document,window,active,viewport:()=>({ready:ui.ready,epoch:ui.epoch,rotation:ui.viewport.rotation}),rotation:()=>ui.viewport.rotation,directionMode:()=> 'depth',stickSelector:'#touch-stick',knobSelector:'#touch-knob',buttonSelector:'#controls button',onHold:(a,on)=>{on?pointers.add(a):pointers.delete(a);recalc();},onAction:command});
for(const b of $$('#controls button')){b.addEventListener('click',e=>{if(e.detail===0&&!b.disabled)command(b.dataset.action??(b.dataset.hold==='punch'?'punch':null));});b.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key)||!active())return;e.preventDefault();if(!e.repeat){if(b.dataset.hold){pointers.add(b.dataset.hold);recalc();if(b.dataset.hold==='punch')command('punch');}else command(b.dataset.action);}});const release=()=>{pointers.delete(b.dataset.hold);recalc();};b.addEventListener('keyup',release);b.addEventListener('blur',release);}
function cover(image,w,h){if(!image)return;const z=Math.max(w/image.width,h/image.height);ctx.drawImage(image,(w-image.width*z)/2,(h-image.height*z)/2,image.width*z,image.height*z);}
function mic(x,y,size=46){const im=images['opening-props-v75'];if(im)ctx.drawImage(im,1186,543,192,444,x-size*192/444/2,y-size,size*192/444,size);}
function actor(a,frame,time){const q=finalePoint(a.x,a.y,a.depth??0),x=(q.x-frame.left)*frame.zoom,y=frame.base+(q.y-GROUND)*frame.zoom;ctx.save();ctx.translate(x,y);ctx.scale(frame.zoom*q.scale*(a.face||1),frame.zoom*q.scale);ctx.globalAlpha=a.hp<=0?.3:1;drawFighterArt(ctx,images,presentationFighter(a),time,{shadow:false});ctx.restore();}
const idle=Object.fromEntries(CHARACTER_IDS.map(id=>[id,new Duel(id,'beginner',()=>.3,'wang').player]));
function paint(time){
 const w=canvas.clientWidth,h=canvas.clientHeight,s=view(),g=chapter?.world;ctx.clearRect(0,0,w,h);
 if(!g||!['battle','result'].includes(s?.mode)){
  const shot=s?.storyFrame?.shot??(s?.mode==='complete'?'open-door':null);
  if(drawFinaleStoryArt(ctx,images,shot,w,h,time)){
   if(!shot.startsWith('battery')||shot==='battery-key'){const z=Math.min(w/1100,h/720),f={left:0,base:h*.98,zoom:z},speaker=Object.keys(CAST).find(id=>CAST[id].name===s?.storyFrame?.speaker)??'chen',other=speaker==='han'?'wang':'han';actor({...idle[other],x:w*.12/z,depth:0},f,time);actor({...idle[speaker],x:w*.88/z,depth:0,face:-1},f,time);}
   return;
  }
  const selected=s?.characterId??draftTeam[0],speaking=Object.keys(CAST).find(id=>CAST[id].name===s?.storyFrame?.speaker),main=speaking===selected?(selected==='han'?'huang':'han'):selected,speaker=speaking??(main==='chen'?'han':'chen'),zoom=Math.min(w/760,h/350),f={left:0,base:h*.9,zoom};
  drawFinaleStage(ctx,images['finale-arena'],w,h,f);actor({...idle[main],x:w*.27/zoom,depth:0},f,time);actor({...idle[speaker],x:w*.75/zoom,depth:0,face:-1},f,time);mic(w*.52,h*.62,Math.max(32,55*zoom));return;
 }
 const compact=ui.viewport.touch&&w>h&&h<=420;if(document.body.dataset.finaleCompact!==String(compact)){document.body.dataset.finaleCompact=String(compact);ui.invalidateGeometry();}
 const options=ui.cameraOptions,roster=ui.logicalRect($('#arena-roster').getBoundingClientRect());
 if(g!==arenaWorld){arenaFrame=null;arenaWorld=g;}
 const f=finaleCameraFrame(w,h,g,{...options,occlusions:[...(options.occlusions??[]),roster],previous:arenaFrame,paused:s.paused||s.mode==='result'}),zoom=f.zoom;arenaFrame=f;
 drawFinaleStage(ctx,images['finale-arena'],w,h,f);
 const point=(x,y=GROUND,z=0)=>{const q=finalePoint(x,y,z);return {x:(q.x-f.left)*zoom,y:f.base+(q.y-GROUND)*zoom,scale:q.scale};};
 const target=g.targetFor(g.player);
 for(const a of g.actors){const p=point(a.x,GROUND,a.depth);ctx.strokeStyle=a===g.player?'#f6ca52':a.team===0?'#227c69':'#ac3838';ctx.lineWidth=Math.max(2,3*zoom);ctx.fillStyle=a.hp<=0?'#27323555':a.team===0?'#36a68b55':'#d3555555';ctx.beginPath();ctx.ellipse(p.x,p.y,36*zoom*p.scale,9*zoom*p.scale,0,0,Math.PI*2);ctx.fill();ctx.stroke();if(a===target){ctx.strokeStyle='#ffe378';ctx.strokeRect(p.x-43*zoom*p.scale,p.y-300*zoom*p.scale,86*zoom*p.scale,306*zoom*p.scale);}}
 const middle=point(480,GROUND,-15);ctx.strokeStyle='#4c443b';ctx.lineWidth=3*zoom;ctx.beginPath();ctx.moveTo(middle.x,middle.y);ctx.lineTo(middle.x,middle.y-150*zoom);ctx.stroke();mic(middle.x,middle.y-150*zoom,48*zoom);
 const actors=[...g.actors,...g.assists.map(a=>({...a.actor,depth:a.actor.depth??a.owner.depth,team:a.owner.team,hp:a.phase==='exit'?0:1}))].sort((a,b)=>a.depth-b.depth);
 for(const a of actors){actor(a,f,time);if(a.hp>0){const p=point(a.x,a.y-292,a.depth),width=54*zoom*p.scale;ctx.fillStyle='#172f36';ctx.fillRect(p.x-width/2,p.y,width,5);ctx.fillStyle=a.team===0?'#68d6b8':'#f69383';ctx.fillRect(p.x-width/2,p.y,width*a.hp/a.maxHp,5);ctx.fillStyle='#fff8dc';ctx.strokeStyle='#17353a';ctx.font=`900 ${Math.max(10,13*zoom)}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;const name=(a===g.player?'★ ':a.team===0?'友 ':'敵 ')+CAST[a.type].name;ctx.strokeText(name,p.x,p.y-5);ctx.fillText(name,p.x,p.y-5);}}
 for(const p of g.projectiles){if(p.dead)continue;const q=p.kind==='arrow'?arrowPresentation(p):p,v=point(q.x,q.y,p.depth);ctx.save();ctx.translate(v.x,v.y);ctx.scale(zoom*v.scale,zoom*v.scale);if(p.kind==='coin')drawProp(ctx,images,'coin',0,0,35,36,time*.008);else if(p.kind==='arrow')drawProp(ctx,images,'arrow',0,0,q.width,q.height,q.angle);else if(drawChallengeSignatureProjectile(ctx,images,p,time)){}else{ctx.fillStyle='#fff7df';ctx.strokeStyle='#17353a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,12);ctx.lineTo(24,0);ctx.lineTo(-18,-12);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();if(p.targetX!==undefined){const mark=point(p.targetX,GROUND,p.targetDepth);ctx.strokeStyle=p.owner.team===0?'#31a685':'#d05648';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(mark.x,mark.y,42*zoom*mark.scale,12*zoom*mark.scale,0,0,Math.PI*2);ctx.stroke();}}
 drawFinaleEffects(ctx,images,g,point,zoom,time);
}
function hud(){
 const s=view(),g=chapter?.world;if(!s||!g)return;ui.render({state:s,world:g});
 const map=tacticalCtx;map.clearRect(0,0,132,24);map.fillStyle='#f2deb0';map.fillRect(0,0,132,24);map.strokeStyle='#705334';map.lineWidth=1;map.strokeRect(.5,.5,131,23);
 for(const m of finaleTacticalMarkers(g).sort((a,b)=>Number(a.controlled)-Number(b.controlled))){const x=6+m.x*120,y=4+m.y*16;map.fillStyle=!m.alive?'#716c62':m.controlled?'#ffd24c':m.team===0?'#16735d':'#b23b32';map.strokeStyle='#233f40';map.beginPath();map.arc(x,y,m.controlled?3.5:2.5,0,Math.PI*2);map.fill();if(m.controlled)map.stroke();if(!m.alive){map.beginPath();map.moveTo(x-3,y-3);map.lineTo(x+3,y+3);map.stroke();}}
 $('#timer').textContent=Math.ceil(g.remaining);$('#match-score').textContent='最後存活隊';$('#route-progress').textContent=`我方 ${g.actors.filter(a=>a.team===0&&a.hp>0).length} 人 · 對手 ${g.actors.filter(a=>a.team===1&&a.hp>0).length} 人`;
 $('#objective').textContent=g.player.hp<=0?'你已倒下 · 全隊仍在戰鬥，繼續觀戰！':`四向走位 · 目前目標：${CAST[g.targetFor(g.player)?.type]?.name??'無'} · 同隊不互傷`;
 const roster=$('#arena-roster');if(roster.childElementCount!==7)roster.replaceChildren(...g.actors.map(a=>{const el=document.createElement('span');el.dataset.actor=a.id;el.dataset.team=a.team===0?'ally':'enemy';const text=document.createElement('b'),bar=document.createElement('i');el.append(text,bar);return el;}));
 for(const a of g.actors){const el=roster.querySelector(`[data-actor="${a.id}"]`);el.dataset.out=String(a.hp<=0);const text=(a.team===0?'友 ':'敵 ')+CAST[a.type].name+(a.hp<=0?' ×':'');if(el.firstChild.textContent!==text)el.firstChild.textContent=text;el.lastChild.style.width=Math.max(0,a.hp/a.maxHp*100)+'%';}
}
function tick(now){
 try{const paintToken=ui.beginFrame(now),elapsed=lastTime===null?0:now-lastTime;lastTime=now;const plan=planSimulationFrame(elapsed,{paused:!active()});
  if(active()){if(held.punch){punchWait-=plan.acceptedMs/1000;if(punchWait<=0)command('punch');}for(const dt of plan.steps){if(!active())break;chapter.step(dt,held);}const events=chapter.drainEvents();media.handleEvents(events,chapter.world);for(const e of events)if(e.type==='move'&&e.f===chapter.world.player){caption=e.name;captionUntil=now+1400;$('#caption').textContent=caption;}}
  if(view()?.token!==lastToken)sync();hud();if(paintToken){paint(now);ui.paintFrame(paintToken);}
 }catch(error){ui.failFrame(error);}finally{requestAnimationFrame(tick);}
}
async function load(){
 try{const extra=await Promise.all([['finale-arena','arena-chamber-v19.webp'],['finale-corridor','challenge/infinite-corridor-v1.png'],...Object.entries(FINALE_SUPPORTERS)].map(async([id,file])=>[id,await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=new URL('../../assets/'+file,import.meta.url).href;})]));images={...await loadArtImages(new URL('../../assets/',import.meta.url).href),...Object.fromEntries(extra)};loaded=true;renderTeam();requestAnimationFrame(tick);
  const handoff=preview?null:consumeCampaignHandoff({window,chapterId:'finale-3v4'});if(preview||handoff?.accepted)await attach(handoff?.handoff);else if(query.has('handoff'))$('#menu-status').textContent='接續已過期，請回挑戰總覽重新接續。';
 }catch{$('#menu-status').textContent='素材載入失敗，請重新整理。存檔未變更。';$('#start').disabled=true;}
}
renderTeam();load();


registerQuickView(window,()=>{
 if(!active()||!chapter?.world?.actors)return false;
 for(const actor of chapter.world.actors)if(actor.team===1)actor.hp=0;
 return true;
});
