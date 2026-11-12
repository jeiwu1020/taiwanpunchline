import {mountCompactToolbar} from './compact-toolbar.mjs?v=workers-background-only-20261113-r1';
import {planSimulationFrame} from './simulation-frame.mjs?v=workers-background-only-20261113-r1';
import {challengeOpponentStats} from './challenge-opponent-policy.mjs?v=workers-background-only-20261113-r1';
import {mountChallengePreparation,mountChallengeRecovery} from './challenge-preparation.mjs?v=workers-background-only-20261113-r1';
import {createCampaignHandoff} from './preview/campaign/navigation.mjs?v=workers-background-only-20261113-r1';
import {chooseAdoptionSource,adoptionConfirmation,saveIssueText} from './save-copy.mjs?v=workers-background-only-20261113-r1';
import {mountCombatOverlayLayout} from './combat-overlay-layout.mjs?v=workers-background-only-20261113-r1';
import {createNaturalChamberBackdrop,CHAMBER_EXTENSION_ASSET} from './chamber-natural-backdrop.mjs?v=workers-background-only-20261113-r1';
import {canReuseCameraFrame} from './challenge-camera.mjs?v=workers-background-only-20261113-r1';
import {fullStageCameraFrame,chamberBackdropTiles,CHAMBER_MATERIAL_FRAMES,chamberDeskLayers,CHAMBER_DESK_FRAMES} from './combat-presentation.mjs?v=workers-background-only-20261113-r1';
import {setGameSelectValue} from './game-select.mjs?v=workers-background-only-20261113-r1';
import {renderChargeMeter} from './charge-view.mjs?v=workers-background-only-20261113-r1';
import {mountGameplaySelectionGuard} from './gameplay-selection.mjs?v=workers-background-only-20261113-r1';
import {mountSpecialNameFit} from './special-name-fit.mjs?v=workers-background-only-20261113-r1';
import {ChallengeDepthRoute} from './challenge-depth-engine.mjs?v=workers-background-only-20261113-r1';
import {challengeKeyAction} from './challenge-mode-input.mjs?v=workers-background-only-20261113-r1';
import {paintChallengeStory} from './challenge-story-art.mjs?v=workers-background-only-20261113-r1';
import {ChallengeRoute} from './challenge-engine.mjs?v=workers-background-only-20261113-r1';
import {openChallengeProgress,CHALLENGE_KEY} from './preview/campaign/fresh/progress.mjs?v=workers-background-only-20261113-r1';
import {AsyncChallengeSession} from './preview/campaign/unified/first-chapter.mjs?v=workers-background-only-20261113-r1';
import {createMainCampaignBridge,prepareMainContinuation} from './main-campaign-bridge.mjs?v=workers-background-only-20261113-r1';
import {mountChallengeUI} from './challenge-ui.mjs?v=workers-background-only-20261113-r1';
import {challengeOpening,BOSS_DIALOGUES} from './challenge-flow.mjs?v=workers-background-only-20261113-r1';
import {mountChallengeStory} from './challenge-story.mjs?v=workers-background-only-20261113-r1';
import {STARTER_ART_FILES,starterOpeningMode,mountStarterOpening,paintIntegratedStarter} from './starter-opening.mjs?v=workers-background-only-20261113-r1';
import {CHALLENGE_ART_FILES,drawChallengeMob,drawChallengeOpening,drawChallengePajamas} from './challenge-art.mjs?v=workers-background-only-20261113-r1';
import {createChallengeRenderer,routeCameraFrame} from './challenge-render.mjs?v=workers-background-only-20261113-r1';
import {assistMeterView} from './assist-rules.mjs?v=workers-background-only-20261113-r1';
import {createFiveTapGate,PROFILE_IDS} from './profile-progress.mjs?v=workers-background-only-20261113-r1';
import {createAssistRenderer} from './assist-presentation.mjs?v=workers-background-only-20261113-r1';
import {MatchSeries,DIFFICULTY_LABELS,ROSTER_TARGETS,rosterTargetName} from './match-modes.mjs?v=workers-background-only-20261113-r1';
import {createFinishSequence,finishBeat,finishFighterView,FinishPressGate} from './match-finish.mjs?v=workers-background-only-20261113-r1';
import {rallyMeterView} from './rally-meter.mjs?v=workers-background-only-20261113-r1';
import {mountPageZoomGuard,bindPageZoomPreference,ownsGamePageTarget} from './page-zoom-gestures.mjs?v=workers-background-only-20261113-r1';
import {ITEM_ART,itemActorName,chooseCarryHand,heldItemAnchor} from './item-presentation.mjs?v=workers-background-only-20261113-r1';
import {supporterFlagLayout} from './supporter-flags.mjs?v=workers-background-only-20261113-r1';
import {CHAMBER,DESK,RALLY,paintStageCrowd,supporterFormation,battleResultCopy} from './stage-expansion.mjs?v=workers-background-only-20261113-r1';
import {shoutCaptionLayout,shoutCaptionBeat,comicAccentState,paintComicAccent} from './shout-caption.mjs?v=workers-background-only-20261113-r1';
import {mountTitleScreen} from './title-screen.mjs?v=workers-background-only-20261113-r1';
import {createBackgroundMusic} from './background-music.mjs?v=workers-background-only-20261113-r1';
import {createSettingsStore} from './settings-state.mjs?v=workers-background-only-20261113-r1';
import {mountSettingsPanel} from './settings-view.mjs?v=workers-background-only-20261113-r1';
import {createMoveDemo} from './move-demo.mjs?v=workers-background-only-20261113-r1';
import {mountBattleGestures} from './battle-gestures.mjs?v=workers-background-only-20261113-r1';
import {bindTouchControls} from './touch-controls.mjs?v=workers-background-only-20261113-r1';
import {mountGameViewport} from './game-viewport.mjs?v=workers-background-only-20261113-r1';
import {performanceGuardActive,STAGE_ITEMS} from './stage-rules.mjs?v=workers-background-only-20261113-r1';
import {ARENA_ASSET,cameraFrame,stableCameraFrame,fixedStableCameraFrame,backgroundFrame,ambientPaper} from './arena-presentation.mjs?v=workers-background-only-20261113-r1';
import {overlayCameraFrame,overlayBackgroundFrame} from './overlay-framing.mjs?v=workers-background-only-20261113-r1';
import {drawArenaBoundaries} from './arena-boundaries.mjs?v=workers-background-only-20261113-r1';
import {renderCooldownButton} from './cooldown-view.mjs?v=workers-background-only-20261113-r1';
import {VoiceChannels} from './voice-channels.mjs?v=workers-background-only-20261113-r1';
import {VoiceCueQueue} from './voice-cues.mjs?v=workers-background-only-20261113-r1';
import {playableVoice} from './voice-slots.mjs?v=workers-background-only-20261113-r1';
import { Duel,CAST,GROUND } from './core.mjs?v=workers-background-only-20261113-r1';
import {MOVE_READABILITY,moveCue,guardView,combatStatus,impactY} from './combat-view.mjs?v=workers-background-only-20261113-r1';
import {ART_FILES,PROP_FRAMES,drawFighterArt,fighterArtPose} from './art-render.mjs?v=workers-background-only-20261113-r1';
import {moveCaption,captionPosition,SIGNATURE_SIZE,fighterGazeGlyph,presentationFighter,nameTileOffset} from './move-readability.mjs?v=workers-background-only-20261113-r1';
import {SIGNATURE_PROP_FRAMES} from './art-expression.mjs?v=workers-background-only-20261113-r1';
import {activeSpitAge,retainSpitEpisode,arrowPresentation} from './art-motion.mjs?v=workers-background-only-20261113-r1';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
mountCompactToolbar({document});
let selected='wang',opponent='han',rosterSide='player',difficulty='easy',rosterReady=false,duel=new Duel(),scene,started=false,counting=false,sound=true,audio,hold={},punchWait=0,countTimer;
duel.status='title';
let titleUI,hasEntered=false,matchFinish=null;
let gameMode='battle',roundFormat='single',playerAssist='han',enemyAssist='wang',trainingBehavior='stand',trainingInfinite=true,trainingRepeat=true,matchSeries=null,trainingRestartGate;
let challengeRun=null,challengeUI,challengeStory,challengeAfterResult=null,starterStoryUI,challengeOpeningEpoch=0;
let challengeSceneHandoff=null,challengeEntryPending=0;
let preparationUI=null,challengeRecovery=null,challengeActionBusy=false,challengeResultActionPending=false,challengeRetainPause=false,challengeRecoveryResume=null,entryPreparationSession=null;
let restartRequested=false,restartOpenGate,restartConfirmGate;
let homeRequested=false,homeReturnStatus=null,homeConfirmGate,homeSelectGate;
function newDuel(){if(challengeRun&&gameMode==='challenge'){const gate=challengeRun.phase.gate;const next=new Duel(selected,difficulty,undefined,gate.opponent,{playerAssist,enemyAssist:gate.kind==='boss'?'su':null,playerStats:challengeProgress.derivedStats(selected),enemyStats:challengeOpponentStats(gate.opponent,{kind:gate.kind})});next.progressContext=profileProgress.progressContext();next.enemy.displayName=gate.name;if(gate.kind==='miniboss')next.enemy.mobKind=challengeRun.phase.section===0?'mini_mic':'mini_guard';return next;}sanitizeSelections();const next=new Duel(selected,difficulty,undefined,opponent,{mode:gameMode,trainingBehavior,playerAssist,enemyAssist,infiniteHealth:trainingInfinite,repeatAssist:trainingRepeat});next.progressContext=profileProgress.progressContext();return next;}
const resultPressGates=new Map();
const heldKeys=new Set(),touchHeld=new Set();
let pageZoomGestures,battleGestures,touchControls,viewportUI,settingsUI,moveDemo,sfxMasterGain;
let browserStorage;try{browserStorage=window.localStorage;}catch{browserStorage=null;}
const profileProgress=await openChallengeProgress({storage:browserStorage,locks:window.navigator?.locks});
const challengeProgress=createMainCampaignBridge(profileProgress);
function restoreProfileSelection(){const profile=profileProgress.readProfile(),selection=profile?.campaign?.selection??profile?.challenge?.selection;if(selection){selected=selection.characterId;playerAssist=selection.helperId;}}
restoreProfileSelection();
let challengeQueuedOperations=0,challengeOperations=Promise.resolve(),challengeSaveBlocked=false,partySelectionTouched=false;
const challengeSettledBattles=new WeakSet();
const testEntryGate=createFiveTapGate({onActivate:()=>{if(profileProgress.enterTestMode())refreshProfileAccess();}});
const settingsStore=createSettingsStore({storage:browserStorage,onChange:applySettings});
let preferences=settingsStore.get();
const ink=0x142b32,paper=0xfff7e5;
// Source identity, not character identity, owns each gesture-primed media lane.
// Mirror helpers and main fighters never replace or delay each other's speech.
const voiceChannels=new VoiceChannels({player:$('#move-voice'),enemy:$('#han-voice'),'assist-player':$('#assist-player-voice'),'assist-enemy':$('#assist-enemy-voice')});
let voiceEnabled=true,previewAudioFailure=false;
const music=createBackgroundMusic({getContext:()=>{ensureAudio();return audio;},tracks:{menu:{src:'assets/music/fluffing-a-duck-menu-v28.mp3',label:'Fluffing a Duck'},battle:{src:'assets/music/run-amok-battle-v28.mp3',label:'Run Amok'}},onState:state=>{
 const el=$('#settings-music-status');if(!el)return;el.dataset.track=state.key;el.dataset.status=state.status;
 const copy={waiting:'首次點擊或按鍵後啟用',loading:'正在載入',playing:'循環播放中',muted:'已靜音',paused:'背景已暫停',blocked:'請再點一下畫面啟用音樂',error:'音樂載入或播放失敗，點一下畫面重試',destroyed:'已停止'};
 el.textContent=state.label+' · '+(copy[state.status]||state.status);
 renderEntryAudio(state);
}});
function battleSurfaceProtected(){return (!!matchFinish||['countdown','active'].includes(duel.status))&&!$('#help-dialog').open;}
function syncBattleSurface(){const locked=battleSurfaceProtected();$('.cabinet').dataset.gestureLocked=String(locked);if(!locked)battleGestures?.reset();}
function syncMusic(restart=false){music.select($('#help-dialog').open?'menu':(matchFinish||['countdown','active','paused'].includes(duel.status))?'battle':'menu',{restart});}
function unlockMusic(){if(hasEntered)return music.unlock();}
document.addEventListener('pointerdown',unlockMusic,{capture:true});
document.addEventListener('keydown',unlockMusic,{capture:true});

// The first audio request must stay in the trusted Start click stack. Audio
// failure is independent from navigation and never strands the player at home.
function renderEntryAudio(state=music.state){
 const muted=preferences.masterMuted;
 const blocked=['blocked','error'].includes(state.status);
 const copy=muted?'目前保持靜音，可從上方開啟。':blocked?'聲音未能啟用；仍可遊玩，或點「重試聲音」。':state.status==='loading'?'配樂載入中，可先選角。':'';
 $('#entry-audio-status').textContent=copy;$('#entry-audio-feedback').hidden=muted||!blocked;
 $('#retry-entry-audio').hidden=muted||!blocked;
 titleUI?.setAudioStatus(muted?'目前保持靜音，開始後仍沿用設定。':hasEntered&&blocked?'聲音未能啟用，開始後可重試。':'按開始進入選角，並啟用已開啟的聲音。');
}
function unlockEntryAudio(){
 if(!hasEntered)return;
 // unlock() obtains/resumes the shared context synchronously even if music is
 // muted; voice priming is silent and skipped when its saved preference is off.
 const pending=music.unlock();
 if(sound&&voiceEnabled&&preferences.voiceVolume>0)primeVoice();
 pending?.then?.(renderEntryAudio,()=>renderEntryAudio({status:'blocked'}));
 renderEntryAudio();
}
function setTitleVisible(visible){
 $('.app').dataset.titleOpen=String(visible);
 $('.stage-wrap').inert=visible;$('.control-deck').inert=visible;
 if(visible)titleUI?.show();else titleUI?.hide();
}
function showTitle(){
 endChallenge();
 resetHomeConfirmation(); cancelMatchFinish();stopEffects();stopVoice();moveDemo?.stop();clearTimeout(countTimer);counting=false;started=false;clearHold();
 if($('#help-dialog').open)$('#help-dialog').close();
 duel.status='title';matchSeries=null;trainingRestartGate?.cancel();resetRestartConfirmation();syncModeHUD();syncBattleSurface();$$('.screen').forEach(el=>el.classList.add('hidden'));
 $('#countdown').classList.add('hidden');$('#pause').disabled=true;$('#help').disabled=!scene;
 setTitleVisible(true);titleUI?.setReady(!!scene&&rosterReady);renderEntryAudio();syncMusic();
}
function enterFromTitle(){
 if(duel.status!=='title'||!scene||!rosterReady)return false;
 hasEntered=true;showMenu();unlockEntryAudio();$('#player-card').focus({preventScroll:true});return true;
}

const voiceCues=new VoiceCueQueue(playableVoice);
function stopVoice(){voiceCues.clear();voiceChannels.stopAll();}
function finishVoice(){voiceCues.clear();voiceChannels.clearQueued();}
function prepareVoices(){
 if(!hasEntered||!sound||!voiceEnabled||preferences.voiceVolume<=0)return;
 const characters=[selected,opponent,playerAssist,enemyAssist];
 if(challengeRun){characters.push(challengeRun.phase.gate?.opponent,'su');}
 const clips=[...new Set(characters)].flatMap(id=>(CAST[id]?.moves||[]).map(move=>playableVoice(move.kind))).filter(Boolean);
 void voiceChannels.preload(clips);
}
function primeVoice(force=false){if(force||(sound&&voiceEnabled&&preferences.voiceVolume>0)){try{ensureAudio();}catch{}voiceChannels.prime('assets/audio-unlock-silence-v37.wav');prepareVoices();}}
function playConfiguredVoice(kind,preview=false,f=duel.player,origin='demo'){if(preview)previewAudioFailure=false;const clip=playableVoice(kind);if(!clip||!sound||!voiceEnabled||preferences.voiceVolume<=0||(!preview&&duel.status!=='active'))return false;
 try{ensureAudio();}catch{}
 return voiceChannels.play(f.id||'player',clip,{preview,
  onStart:()=>{if(preview&&origin==='audio')$('#settings-audition-status').textContent='已啟動試聽：'+clip.label+'（只播放一次）。';$('#voice-status').textContent=kind==='coin'?'已播放韓國瑜原片短句：高雄發大財。':'已播放'+(clip.catalogProvided?'語錄站音檔：':'使用者提供音檔：')+clip.label+'。未獨立認證發言者與來源。';},
  onError:()=>{$('#voice-status').textContent='此音檔播放未成功，請按試聽重試。';if(preview){previewAudioFailure=true;if(origin==='audio')$('#settings-audition-status').textContent='語音播放未成功，請再點一次招式，並檢查裝置音量與瀏覽器播放權限。';if($('#help-dialog').open)$('#settings-demo-status').textContent='動作示範可用，但語音播放未成功；請再按「動作＋語音」。';}}
 });
}
function drainVoiceCues(){if(!sound||!voiceEnabled||duel.status!=='active'){voiceCues.clear();return;}for(const cue of voiceCues.ready())playConfiguredVoice(cue.kind,false,cue.f);}
$('#voice-enabled').onchange=e=>{settingsStore.update({voiceMuted:!e.target.checked});voiceEnabled=e.target.checked;if(!voiceEnabled)stopVoice();else primeVoice();$('#voice-status').textContent=voiceEnabled?'招式音訊已啟用：21 招可播放，喝水已接入使用者原檔；來源與逐句聽驗限制見招式頁。':'招式音訊已關閉。';};
$('#play-voice').onclick=()=>{stopVoice();if(!sound||!voiceEnabled){$('#voice-status').textContent='請先開啟聲音與招式音訊。';return;}playConfiguredVoice($('#voice-sample').value,true);};
$('#stop-voice').onclick=()=>{stopVoice();$('#voice-status').textContent='試聽已停止。';};
$('#voice-sample').onchange=()=>stopVoice();
$('#help-dialog').addEventListener('close',()=>{stopEffects();stopVoice();moveDemo?.stop();settingsUI?.close();clearHold();syncBattleSurface();syncMusic();});

function ensureAudio(){audio??=new(window.AudioContext||window.webkitAudioContext)();if(!sfxMasterGain){sfxMasterGain=audio.createGain();sfxMasterGain.connect(audio.destination);}sfxMasterGain.gain.setValueAtTime(!sound||preferences.sfxMuted?0:preferences.sfxVolume,audio.currentTime);voiceChannels.connectAudio(audio);const pending=audio.resume();pending?.catch?.(()=>{});}
function sfx(kind){if(!sound||preferences.sfxMuted||preferences.sfxVolume<=0)return false;try{ensureAudio();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=kind==='hit'?'square':'triangle';const freq={hit:125,block:260,launch:540,jump:360,heal:680,counter:180,spit:840,whiff:240,over:330,start:440,ma_handshake:410,ma_gaze:470,ma_cough:145,su_shout:170,su_dare:105,su_rush:230,huang_debt:610,huang_shout:390,huang_queue:510,chen_dream:740,chen_question:430,chen_calm:300,ko_bags:580,ko_name:420,ko_resolve:210,han_knee:180}[kind]||200;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(kind==='heal'?1000:freq*.45,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+.15);o.connect(g);g.connect(sfxMasterGain);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.17);return true;}catch{sound=false;stopVoice();$('#sound').textContent='♪ 聲音關';$('#sound').setAttribute('aria-pressed','false');return false;}}
let effectEpoch=0;const effectTimers=new Set();
let crowdBufferPromise=null;const crowdSources=new Set();
async function playCrowdCheer(){
 if(!sound||preferences.sfxMuted||preferences.sfxVolume<=0)return;
 const epoch=effectEpoch;try{ensureAudio();crowdBufferPromise??=fetch('assets/sfx/crowd-cheer-44.mp3').then(r=>{if(!r.ok)throw Error('crowd audio');return r.arrayBuffer()}).then(b=>audio.decodeAudioData(b));const buffer=await crowdBufferPromise;
  if(epoch!==effectEpoch||duel.status!=='active'||!sound||preferences.sfxMuted)return;
  const source=audio.createBufferSource(),gain=audio.createGain(),t=audio.currentTime+.45;source.buffer=buffer;source.connect(gain);gain.connect(sfxMasterGain);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.13,t+.08);gain.gain.setValueAtTime(.13,t+1.1);gain.gain.linearRampToValueAtTime(0,t+1.5);crowdSources.add(source);source.onended=()=>{crowdSources.delete(source);source.disconnect();gain.disconnect()};source.start(t,.1,1.5);
 }catch{crowdBufferPromise=null;}
}
function stopEffects(){effectEpoch++;for(const source of crowdSources){try{source.stop()}catch{}}crowdSources.clear();for(const timer of effectTimers)clearTimeout(timer);effectTimers.clear();}
async function testSoundEffects(){
 stopEffects();if(!sound||preferences.sfxMuted||preferences.sfxVolume<=0)return {status:'muted'};
 const epoch=effectEpoch;try{ensureAudio();await audio.resume();}catch{return {status:'blocked'};}
 if(epoch!==effectEpoch)return {status:'cancelled'};
 if(!sound||preferences.sfxMuted||preferences.sfxVolume<=0)return {status:'muted'};
 if(audio.state&&audio.state!=='running')return {status:'blocked'};
 if(!sfx('hit'))return {status:'error'};
 for(const [kind,delay]of [['jump',280],['heal',560]]){const timer=setTimeout(()=>{effectTimers.delete(timer);if(epoch!==effectEpoch||!$('#help-dialog').open)return;if(!sfx(kind)&&$('#help-dialog').open)$('#settings-sfx-status').textContent='試聽已停止；請檢查音效音量與播放權限。';},delay);effectTimers.add(timer);}
 return {status:'playing'};
}
function applySettings(next){
 preferences=next;if(next.masterMuted||next.sfxMuted||next.sfxVolume<=0)stopEffects();music.setPreferences(next);sound=!next.masterMuted;voiceEnabled=!next.voiceMuted;voiceChannels.setVolume(next.voiceVolume);
 if(!sound||!voiceEnabled||next.voiceVolume<=0)stopVoice();
 if(sfxMasterGain&&audio)sfxMasterGain.gain.setValueAtTime(!sound||next.sfxMuted?0:next.sfxVolume,audio.currentTime);
 $('#sound').textContent=sound?'♪ 聲音開':'♪ 聲音關';$('#sound').setAttribute('aria-pressed',String(sound));$('#voice-enabled').checked=voiceEnabled;
 viewportUI?.setPreferences(next);settingsUI?.sync();
}
function initializeSettings(){
 if(settingsUI)return;
 moveDemo=createMoveDemo({canvas:$('#settings-demo-canvas'),images:scene.artImages,onState:state=>{if(state.status==='completed'&&!previewAudioFailure)$('#settings-demo-status').textContent='動作示範結束，可再按「動作＋語音」。';}});
 settingsUI=mountSettingsPanel({document,store:settingsStore,canUse: id=>profileProgress.canUse(id),onInspect:(character,kind)=>{moveDemo.play(character,kind);moveDemo.stop();},onStopPreview:()=>{stopEffects();moveDemo.stop();stopVoice();},onTestSfx:testSoundEffects,onAudition:kind=>playConfiguredVoice(kind,true,duel.player,'audio'),onPreview:(character,kind)=>{
  try{moveDemo.play(character,kind);const audio=playConfiguredVoice(kind,true);return {audio,audioError:previewAudioFailure};}catch{$('#settings-demo-status').textContent='動作素材未能載入，請重新整理。';return false;}
 }});applySettings(settingsStore.get());
}
applySettings(preferences);
titleUI=mountTitleScreen({root:$('#title-screen'),cast:CAST,onStart:enterFromTitle,canUse:id=>profileProgress.canUse(id),onCharacter:id=>testEntryGate.tap(id),onHide:()=>testEntryGate.reset(),readyStatus:()=>profileProgress.testMode?'測試模式：全角色可選':'先選恰吉王或韓國魚，開始開吵！'});
for(const [index,id]of PROFILE_IDS.entries())$('#profile-'+(index+1)).onclick=async()=>{if(duel.status==='title'){if(profileProgress.testMode)profileProgress.exitTestMode();const result=await profileProgress.selectProfile(id);testEntryGate.reset();if(result.accepted){restoreProfileSelection();partySelectionTouched=false;}refreshProfileAccess();if(!result.accepted||(!result.persisted&&!profileProgress.testMode))$('#profile-storage-note').textContent='存檔切換尚未保存。'+saveIssueText(result.reason);}};
$('#profile-test-exit').onclick=()=>{if(duel.status==='title'){profileProgress.exitTestMode();testEntryGate.reset();refreshProfileAccess();}};
renderProfileStatus();
setTitleVisible(true);renderEntryAudio();
function clearHold(){pageZoomGestures?.reset();battleGestures?.reset();hold={};heldKeys.clear();syncActionKeyFeedback();touchControls?.clear();touchHeld.clear();duel.player.crouch=false;duel.player.crouchBlend=0;$$('.held').forEach(b=>b.classList.remove('held'));}
function syncHold(action){hold[action]=[...heldKeys].some(code=>challengeKeyAction(code,keys,!!duel.depthMode)===action)||touchHeld.has(action);$$('[data-hold],[data-action]').filter(b=>b.dataset.hold===action).forEach(b=>b.classList.toggle('held',hold[action]));}
function syncActionKeyFeedback(){const actions=new Set([...heldKeys].map(code=>challengeKeyAction(code,keys,!!duel.depthMode)));for(const b of $$('[data-hold],[data-action]'))b.classList.toggle('key-pressed',!!b.dataset.action&&actions.has(b.dataset.action));}
function setupMoves(){CAST[selected].moves.forEach((m,i)=>{const b=$(`[data-action="special${i+1}"]`);b.querySelector('strong').textContent=m.name;b.querySelector('small').textContent=m.purpose;b.title=m.purpose;renderCooldownButton(b,m,duel.player.cooldowns[i]);});}
function selectionByTarget(){return {player:selected,opponent,playerAssist,enemyAssist};}
function sanitizeSelections(){
 if(!profileProgress.canUse(selected))selected='wang';if(!profileProgress.canUse(opponent))opponent='han';
 if(!profileProgress.canUse(playerAssist))playerAssist='han';if(!profileProgress.canUse(enemyAssist))enemyAssist='wang';
}
function renderProfileStatus(){
 const status=profileProgress.get();$('.app').dataset.testMode=String(status.testMode);
 $('#profile-test-badge').hidden=!status.testMode;$('#profile-test-exit').hidden=!status.testMode;
 $('.brand small').textContent=status.testMode?'測試模式 · 不記錄進度':'政治迷因格鬥';
 for(const [index,id]of PROFILE_IDS.entries()){$('#profile-'+(index+1)).setAttribute('aria-pressed',String(id===status.activeProfileId));$('#profile-'+(index+1)).disabled=!!status.busy||!!status.dirty;}
 const blocked=status.dirty||status.readOnly||status.reason;
 $('#profile-storage-note').dataset.warning=String(!!blocked);
 $('#profile-storage-note').textContent=status.testMode?'全角色暫時開放，不改變存檔解鎖。回首頁可退出。':blocked?'進度尚未保存或需確認，請保留此頁並開啟挑戰備份面板。':status.authority==='campaign'?'此槽已採用共用進度：挑戰、對戰與訓練共用已解鎖角色。':'此槽沿用原版進度；繼續後續章節前可明確選擇採用來源。';
}
function refreshProfileAccess(){
 sanitizeSelections();renderProfileStatus();settingsUI?.refreshAccess?.();
 if(rosterReady){syncRoster();setupMoves();}
 if(duel.status==='title'){titleUI?.show();titleUI?.setReady(!!scene&&rosterReady);}
}

function syncRoster(){
 sanitizeSelections();const selections=selectionByTarget();
 for(const [side,id] of [['player',selected],['opponent',opponent]]){
  const cast=CAST[id],portrait=$('#'+side+'-portrait'),card=$('#'+side+'-card');
  portrait.src=cast.portrait;portrait.alt=cast.name+'原創諷刺漫畫';
  $('#'+side+'-name').textContent=cast.name;$('#'+side+'-tag').textContent=cast.tag;
  $('#'+side+'-moves').textContent=cast.moves.map(m=>m.name).join(' · ');
  card.style.setProperty('--cast-color',cast.colorCSS);card.setAttribute('aria-pressed',String(rosterSide===side));
  const role=rosterTargetName(side);card.setAttribute('aria-label',`替${role}選角，目前${cast.name}`);
  $('#'+side+'-selection-hint').textContent=role+(rosterSide===side?' · 選角中':' · 點我換人');
 }
 for(const target of ROSTER_TARGETS){const b=$(`[data-roster-target="${target}"]`);b.setAttribute('aria-pressed',String(rosterSide===target));b.setAttribute('aria-label',`替${rosterTargetName(target)}選角，目前${CAST[selections[target]].name}`);$('#target-'+target).textContent=CAST[selections[target]].name;}
 for(const id of Object.keys(CAST)){
  const b=$('#roster-'+id),available=profileProgress.canUse(id),isPlayer=id===selected,isOpponent=id===opponent;
  b.disabled=!available;b.dataset.locked=String(!available);b.querySelector('strong').textContent=available?CAST[id].name:'???';
  b.setAttribute('aria-pressed',String(available&&id===selections[rosterSide]));b.dataset.player=String(isPlayer);b.dataset.opponent=String(isOpponent);
  const roles=ROSTER_TARGETS.filter(target=>selections[target]===id).map(target=>rosterTargetName(target));
  b.setAttribute('aria-label',available?CAST[id].name+(roles.length?'，目前：'+roles.join('、'):''):'未解鎖角色，???');
  $('#roster-badge-'+id).textContent=!available?'未解鎖':isPlayer&&isOpponent?'你＋AI':isPlayer?'你':isOpponent?'AI':id===selections[rosterSide]?'✓ '+rosterTargetName(rosterSide):'';
 }
 $('#roster-instruction').textContent=`替${rosterTargetName(rosterSide)}選角 · 可同角登場`;
 for(const level of Object.keys(DIFFICULTY_LABELS)){$('#difficulty-'+level).setAttribute('aria-pressed',String(difficulty===level));$('#difficulty-mark-'+level).textContent=difficulty===level?'✓':'○';}
 $('#mode-battle').setAttribute('aria-pressed',String(gameMode==='battle'));$('#mode-training').setAttribute('aria-pressed',String(gameMode==='training'));
 $('#battle-options').hidden=gameMode!=='battle';$('#training-options').hidden=gameMode!=='training';$('#menu').dataset.mode=gameMode;
 $('#format-single').setAttribute('aria-pressed',String(roundFormat==='single'));$('#format-series').setAttribute('aria-pressed',String(roundFormat==='best-of-three'));
 setGameSelectValue($('#training-behavior'),trainingBehavior);$('#start').innerHTML=(gameMode==='training'?'開 始 練 習':'上 場 開 吵')+' <span>→</span>';
}
function initializeRoster(){
 $('#roster-grid').innerHTML=Object.entries(CAST).map(([id,cast])=>`<button type="button" class="roster-option" id="roster-${id}" data-character="${id}" aria-pressed="false" style="--portrait-color:${cast.colorCSS}"><span class="roster-badge" id="roster-badge-${id}"></span><img src="${cast.portrait}" alt="" draggable="false"><strong>${cast.name}</strong></button>`).join('');
 for(const id of Object.keys(CAST))$('#roster-'+id).onclick=()=>chooseCharacter(id);
 rosterReady=true;if(new URL(window.location.href).searchParams.get('challengeOverview')==='1')window.setTimeout(()=>openChallenge(),0);for(const id of ['player-card','opponent-card','difficulty-beginner','difficulty-easy','difficulty-normal'])$('#'+id).disabled=false;
 syncRoster();setupMoves();
}
function chooseRosterSide(side){if(!rosterReady||duel.status!=='menu'||!ROSTER_TARGETS.includes(side))return;rosterSide=side;syncRoster();}
function chooseCharacter(id){if(!rosterReady||duel.status!=='menu'||!CAST[id]||!profileProgress.canUse(id))return;if(['player','playerAssist'].includes(rosterSide))partySelectionTouched=true;if(rosterSide==='player')selected=id;else if(rosterSide==='opponent')opponent=id;else if(rosterSide==='playerAssist')playerAssist=id;else enemyAssist=id;showMenu();playConfiguredVoice(CAST[id].moves[0].kind,true,duel.player,'selection');}
function chooseDifficulty(value){if(!rosterReady||duel.status!=='menu'||!Object.hasOwn(DIFFICULTY_LABELS,value))return;difficulty=value;showMenu();}
function chooseMode(mode){if(!rosterReady||duel.status!=='menu'||!['battle','training'].includes(mode))return;gameMode=mode;showMenu();}
function movePresentation(f,kind){
 const cast=CAST[f.type],move=cast.moves.find(m=>m.kind===kind);
 if(!move)return {word:'',banner:'',fictional:true};
 const legacy={han_knee:'可憐哪：膝蓋先到，氣勢跟上。',ma_cough:'酷酷嫂：咳、咳。好，下一頁。',ko_name:'賴祥德：名字喊到破音了！',rush:'本來想從容，結果連滾帶爬。',counter:'先戴墨鏡，假裝一切都在掌握之中。'};
 return {word:move.word||move.name,banner:legacy[kind]||`${cast.name}：${move.name}！`,fictional:move.fictional!==false};
}
function showMenu(){endChallenge();resetHomeConfirmation();cancelMatchFinish();setTitleVisible(false);stopEffects();stopVoice();clearTimeout(countTimer);counting=false;started=false;clearHold();duel=newDuel();duel.status='menu';matchSeries=null;trainingRestartGate?.cancel();resetRestartConfirmation();syncModeHUD();syncBattleSurface();$$('.screen').forEach(e=>e.classList.add('hidden'));$('#menu').classList.remove('hidden');$('#countdown').classList.add('hidden');$('#pause').disabled=true;$('#help').disabled=false;$('#pause').textContent='Ⅱ 暫停';$('#tip').textContent='蹲躲高招 · 跳過地面 · 後退擋，注意三格耐力';$('#broadcast').classList.add('hidden');syncRoster();setupMoves();syncMusic();prepareVoices();}
async function startGame(){if(challengeRun||entryPreparationSession&&challengeSaveBlocked){if(challengeQueuedOperations>0||challengeResultActionPending||challengeActionBusy||challengeRun?.busy||preparationUI?.isOpen)return;challengeResultActionPending=true;$('#replay').disabled=true;try{if(challengeAfterResult){const next=challengeAfterResult;challengeAfterResult=null;await next();}else{const run=challengeRun;await run.flush();const retried=await run.retry();if(run===challengeRun&&challengeSaved(retried))startChallengePhase();}}finally{challengeResultActionPending=false;$('#replay').disabled=false;syncChallengeSaveSlot();}return;}matchSeries=gameMode==='battle'?new MatchSeries(roundFormat):null;startRound();}
function nextRound(){if(matchSeries?.nextRound())return challengeRun?presentChallengeRound(()=>startRound()):startRound();}
function startRound(){
 if(!scene)return;resetHomeConfirmation();cancelMatchFinish();setTitleVisible(false);stopEffects();clearTimeout(countTimer);stopVoice();primeVoice(true);clearHold();duel=newDuel();duel.status='countdown';punchWait=0;trainingRestartGate?.cancel();resetRestartConfirmation();syncModeHUD();syncBattleSurface();syncMusic(true);unlockMusic();setupMoves();started=true;counting=true;$$('.screen').forEach(e=>e.classList.add('hidden'));$('#countdown').classList.remove('hidden');$('#pause').disabled=true;$('#help').disabled=true;sfx('start');
 const battle=duel,run=challengeRun,epoch=challengeOpeningEpoch,target=scene,owns=()=>battle===duel&&run===challengeRun&&epoch===challengeOpeningEpoch&&target===scene;let n=3;$('#countdown').textContent='3';
 function next(){if(!owns()||target.sys?.isActive?.()===false||run&&challengeSaveBlocked)return;if(homeRequested){countTimer=setTimeout(next,80);return;}n--;$('#countdown').textContent=n>0?String(n):'開麥！';sfx('start');if(n>=0)countTimer=setTimeout(next,480);else{$('#countdown').classList.add('hidden');counting=false;duel.status='active';syncBattleSurface();$('#pause').disabled=false;$('#pause').textContent=gameMode==='training'?'Ⅱ 練習設定':'Ⅱ 暫停';$('#help').disabled=false;if(challengeRetainPause||document.hidden||!document.hasFocus()||$('#help-dialog').open){challengeRetainPause=false;pauseGame();}else $('#game').focus({preventScroll:true});}}
 $('#tip').textContent=CAST[selected].tip;
 if(!run){countTimer=setTimeout(next,480);return;}
 // A challenge countdown belongs to its acknowledged destination, not merely
 // to a saved run. Failure must never turn an existing recovery back to active.
 const acknowledged=accepted=>{if(accepted===true&&owns()&&target.sys?.isActive?.()!==false&&!challengeSaveBlocked&&duel.status==='countdown'){countTimer=setTimeout(next,480);return true;}if(owns()){clearTimeout(countTimer);counting=false;if(duel.status==='countdown')duel.status='paused';$('#countdown').classList.add('hidden');syncBattleSurface();}return false;};
 let presentation;try{presentation=presentChallengeScene();}catch{return acknowledged(false);}return Promise.resolve(presentation).then(acknowledged,()=>acknowledged(false));
}
function pauseGame(){if(challengeActionBusy||challengeEntryPending||challengeSceneHandoff)challengeRetainPause=true;if(duel.status!=='active')return;stopEffects();stopVoice();clearHold();duel.status='paused';syncBattleSurface();$('#pause-screen').classList.remove('hidden');$('#pause').textContent='▶ 繼續';$('#training-pause-options').hidden=gameMode!=='training';$('#pause-note').textContent=gameMode==='training'?'自由試招，調整後繼續。':'切換視窗會自動暫停。';setGameSelectValue($('#training-live-behavior'),trainingBehavior);$('#training-infinite').checked=trainingInfinite;$('#training-repeat').checked=trainingRepeat;trainingRestartGate?.arm();resetRestartConfirmation();configurePauseRestart();restartOpenGate?.arm();$('#leave').textContent=challengeRun?'回挑戰總覽':'回到選角';if(challengeRun)mountRootChallengeActions();syncChallengeSaveSlot();}
function resumeGame(){if(challengeInputBlocked()||homeRequested||duel.status!=='paused')return;primeVoice(true);duel.status='active';syncBattleSurface();$('#pause-screen').classList.add('hidden');trainingRestartGate?.cancel();resetRestartConfirmation();$('#pause').textContent=gameMode==='training'?'Ⅱ 練習設定':'Ⅱ 暫停';$('#game').focus({preventScroll:true});}
function syncModeHUD(){
 $('#reselect').textContent=challengeRun?(challengeAfterResult&&duel.winner==='player'?'整備下一段':'整備後重試'):'回到選角';
 if(scene)scene.hudCache='';
 const score=matchSeries?.score||{player:0,enemy:0};
 $('#match-score').textContent=gameMode==='training'?'練習 · '+({stand:'站立',guard:'防守',ai:'AI'}[trainingBehavior]):matchSeries?.format==='best-of-three'?`第 ${matchSeries.round} 小局 · ${score.player} : ${score.enemy}`:'一局定勝負';
 if(challengeRun)$('#match-score').textContent=challengeRun.phase.kind==='route'?'街頭闖關':`${challengeRun.phase.gate?.name||'挑戰'}${matchSeries?.format==='best-of-three'?` · ${score.player}:${score.enemy}`:''}`;
 $('.app').dataset.gameMode=gameMode;
 const depth=!!duel.depthMode;$('.app').dataset.depthRoute=String(depth);
 $('#game').setAttribute('aria-label',depth?'街道闖關，WASD或方向鍵上下左右走位，空白鍵跳躍，K或左Shift防守，J攻擊，U I O梗技':'戰鬥畫面，左右移動，後退自動擋，W跳躍，S或下方向鍵蹲下，K或左Shift原地防守，J攻擊，U I O梗技');
 if(!(duel instanceof ChallengeRoute))$('#item-status').textContent='';
 const stick=$('#touch-stick');stick?.setAttribute('aria-label',depth?'方向搖桿：上下左右走位，跳躍請按跳躍鍵':'方向搖桿：左右移動，上推跳躍，下推蹲下');
 const hint=$('.touch-pad small');if(hint)hint.textContent=depth?'上下左右走位':'移動 · 上跳 · 下蹲';
 for(const b of $$('.movement button')){const d=b.dataset;if(d.action==='jump'||d.hold==='up'){delete d.action;delete d.hold;if(depth)d.hold='up';else d.action='jump';b.querySelector('small').textContent=depth?'往內':'跳／閃';b.setAttribute('aria-label',depth?'往街道內側移動':'跳躍閃招');}else if(d.hold==='crouch'||d.hold==='down'){d.hold=depth?'down':'crouch';b.querySelector('small').textContent=depth?'往外':'蹲／閃';b.setAttribute('aria-label',depth?'往街道外側移動':'蹲下閃招');}}
 if(!['active','paused'].includes(duel.status))$('#assist-warning').replaceChildren();
}
function result(){
 if(challengeRun&&challengeSettledBattles.has(duel))return;
 cancelMatchFinish();syncBattleSurface();syncMusic();stopEffects();finishVoice();clearHold();$('#pause').disabled=true;$('#help').disabled=false;for(const gate of resultPressGates.values())gate.arm();
 const stats=duel.stats,copy=battleResultCopy(duel),round=matchSeries?.record(duel.winner),between=!!round&&!round.complete;
 $('#result-title').textContent=round?.complete&&matchSeries.format==='best-of-three'?copy.title.replace('獲勝！','拿下系列賽！'):copy.title;
 $('#result-sub').textContent=between?(round.draw?'這局平手，不計分。重新開一小局。':copy.subtitle+' 下一小局，雙方狀態全部重置。'):copy.subtitle;
 $('#result-score').textContent=round?`你 ${round.score.player} : ${round.score.enemy} 對手`+(matchSeries.format==='best-of-three'?' · 先得 2 勝':''):gameMode==='training'?'練習結束，可重新練習或回選角':'';
 $('#next-round').hidden=!between;$('#next-round').textContent=round?.draw?'平手重賽 →':'下一小局 →';$('#replay').hidden=between;$('#replay').disabled=false;$('#replay').textContent=gameMode==='training'?'重新練習 ↻':matchSeries?.format==='best-of-three'?'再開一場系列賽 ↻':'不服，再吵一局 ↻';
 $('#stats').innerHTML=`<div><strong>${stats.maxCombo}</strong><small>最高連段</small></div><div><strong>${stats.specialHits}</strong><small>梗技命中</small></div><div><strong>${stats.interrupts||stats.blocks}</strong><small>${stats.interrupts?'打斷喝水':'成功格擋'}</small></div>`;
 if(challengeRun)challengeResult(round,between);
 $('#result').classList.remove('hidden');syncModeHUD();sfx('over');
}
// A scene-clock presentation, not a second combat phase. Leaving the round
// discards this record synchronously, so no stale timeout can reopen results.
function cancelMatchFinish(){
 if(matchFinish&&scene?.tweens)scene.tweens.timeScale=matchFinish.tweenTimeScale??1;
 matchFinish=null;$('#match-finish').classList.add('hidden');$('.app').dataset.matchFinish='false';
 $('.control-deck').inert=duel.status==='title';for(const gate of resultPressGates.values())gate.cancel();
 if(scene){scene.finishFrame=null;scene.finishBeat=null;}
}
function beginMatchFinish(){
 if(matchFinish||duel.status!=='over')return;
 stopEffects();finishVoice();clearHold();punchWait=0;duel.buffer=null;
 matchFinish=createFinishSequence(duel,{reducedMotion:!!scene?.reducedMotion,artTime:scene?.artTime||0,camera:scene?.cameraView});
 matchFinish.duel=duel;matchFinish.tweenTimeScale=scene?.tweens?.timeScale??1;matchFinish.suspended=!!document.hidden||!document.hasFocus();
 $('#result').classList.add('hidden');$('#broadcast').classList.add('hidden');$('#match-finish').classList.remove('hidden');$('.app').dataset.matchFinish='true';$('.control-deck').inert=true;
 $('#pause').disabled=true;$('#help').disabled=true;$('#finish-cue').textContent=matchFinish.cue;$('#finish-winner').textContent=matchFinish.title;
 // Remove move labels and impact tweens before the uncluttered final beat.
 if(scene){scene.cameras?.main?.shakeEffect?.reset();for(const t of scene.textPool||[])for(const v of [t,t.bubble,t.subtitle,t.burst])if(v){scene.tweens?.killTweensOf(v);v.setVisible(false);}}
 renderMatchFinish();syncBattleSurface();syncMusic();
}
function renderMatchFinish(){
 if(!matchFinish)return;const beat=finishBeat(matchFinish);$('#match-finish').dataset.phase=beat.phase;$('#match-finish').dataset.reduced=String(matchFinish.reducedMotion);
 $('#finish-winner').hidden=beat.phase!=='announce';$('#finish-cue').hidden=beat.phase==='announce';if(scene){scene.finishBeat=beat;if(scene.tweens)scene.tweens.timeScale=matchFinish.reducedMotion?1:beat.phase==='freeze'?0:beat.phase==='slow'?.25:1;}
}
function updateMatchFinish(delta){
 if(homeRequested||!matchFinish)return;if(matchFinish.duel!==duel||duel.status!=='over'){cancelMatchFinish();return;}
 if(!matchFinish.suspended)matchFinish.elapsed+=Math.min(100,Math.max(0,delta));
 renderMatchFinish();if(finishBeat(matchFinish).done)result();
}
function bindResultAction(button,action){
 const gate=new FinishPressGate();resultPressGates.set(button,gate);
 button.addEventListener('pointerdown',e=>{if(!matchFinish&&duel.status==='over')gate.pointerDown(e.pointerId);});
 button.addEventListener('pointercancel',()=>gate.release());
 button.addEventListener('keydown',e=>{if(!matchFinish&&duel.status==='over')gate.keyDown(e.code,e.repeat);});
 button.addEventListener('blur',()=>gate.release());
 button.onclick=e=>{if(!matchFinish&&duel.status==='over'&&gate.click(e))action();};
}
function bindFreshAction(button,active,action){
 const gate=new FinishPressGate();
 button.addEventListener('pointerdown',e=>{if(active())gate.pointerDown(e.pointerId);});
 button.addEventListener('pointercancel',()=>gate.release());button.addEventListener('blur',()=>gate.release());
 button.addEventListener('keydown',e=>{if(active())gate.keyDown(e.code,e.repeat);});
 button.onclick=e=>{if(active()&&gate.click(e))action();};return gate;
}
function resetHomeConfirmation(){homeRequested=false;homeReturnStatus=null;homeConfirmGate?.cancel();homeSelectGate?.cancel();$('#home-confirm').classList.add('hidden');}
function requestHome(){
 if(challengeQueuedOperations>0||challengeResultActionPending||challengeActionBusy||challengeRun?.busy||entryPreparationSession?.busy||preparationUI?.isOpen)return;if(challengeRun&&(challengeSaveBlocked||profileProgress.get().dirty)){showRootRecovery();return;}
 if(homeRequested)return;
 $('#home-confirm-title').textContent=challengeRun?'返回挑戰總覽？':'要回首頁嗎？';$('#home-confirm-note').textContent=challengeRun?'未完成的本段會從已保存的路段檢查點重新開始，已保存 XP、配點與解鎖保留。返回前會先確認保存完成。':'這場對戰進度會結束，選角與設定會保留。';$('#home-confirm-button').textContent=challengeRun?'返回挑戰總覽':'回到首頁';$('#home-select').hidden=!!challengeRun;
 if(!challengeRun&&(!started||(!matchFinish&&!['active','paused','countdown'].includes(duel.status)))){showTitle();return;}
 homeReturnStatus=duel.status;if(duel.status==='active')pauseGame();
 stopVoice();clearHold();resetRestartConfirmation();homeRequested=true;$('#home-confirm').classList.remove('hidden');homeConfirmGate.arm();homeSelectGate.arm();$('#home-cancel').focus();
}
function cancelHomeConfirmation(){if(!homeRequested)return;const previous=homeReturnStatus;resetHomeConfirmation();if(previous==='active'&&!document.hidden&&document.hasFocus())resumeGame();else if(previous==='paused'){restartOpenGate?.arm();$('#resume').focus();}else $('#game').focus({preventScroll:true});}
homeConfirmGate=bindFreshAction($('#home-confirm-button'),()=>homeRequested,()=>{resetHomeConfirmation();if(challengeRun)return returnToChallengeOverview();showTitle();});
homeSelectGate=bindFreshAction($('#home-select'),()=>homeRequested,()=>{resetHomeConfirmation();showMenu();});
$('#home-cancel').onclick=cancelHomeConfirmation;
function pauseRestartAvailable(){return !challengeInputBlocked()&&!homeRequested&&duel.status==='paused'&&(gameMode==='battle'||(gameMode==='challenge'&&!!challengeRun));}
function configurePauseRestart(){
 const phase=gameMode==='challenge'?challengeRun?.phase:null,route=phase?.kind==='route',boss=phase?.kind==='boss';
 $('#restart-match').hidden=!pauseRestartAvailable();
 $('#restart-match').textContent=route?'重試本路段':boss?'重試本場頭目':'重新開吵';
 $('#restart-confirm').setAttribute('aria-label',route?'確認重試本路段':boss?'確認重試本場頭目':'確認重新開始整場');
 $('#restart-confirm-note').textContent=route?'從本路段起點重試？氣勢補滿、助拳就緒、揪團歸零；已獲得的經驗、技能配點、解鎖與檢查點保留。':boss?(phase.gate.kind==='boss'?'重試本場頭目？三戰兩勝比分將歸零，雙方戰鬥狀態重置；經驗、技能配點、解鎖與檢查點保留。':'重試本場頭目？雙方戰鬥狀態重置；經驗、技能配點、解鎖與檢查點保留。'):'重新開始整場？三戰兩勝比分將歸零，選角與難度會保留。';
 $('#restart-confirm-button').textContent=phase?'沿用配置並重試':'確定重開';
 let prepare=$('#restart-prepare-button');if(!prepare){prepare=document.createElement('button');prepare.id='restart-prepare-button';prepare.type='button';prepare.textContent='重新整備再重試';prepare.onclick=()=>{if(pauseRestartAvailable())openPreparation({intent:'retry'});};$('#restart-confirm').append(prepare);}prepare.hidden=!phase;
}
function resetRestartConfirmation(){restartRequested=false;$('#restart-confirm').hidden=true;restartOpenGate?.cancel();restartConfirmGate?.cancel();}
function openRestartConfirmation(){if(!pauseRestartAvailable())return;restartRequested=true;$('#restart-confirm').hidden=false;restartConfirmGate.arm();$('#restart-cancel').focus();}
function cancelRestartConfirmation(){resetRestartConfirmation();if(pauseRestartAvailable())restartOpenGate.arm();$('#restart-match').focus();}
function challengeInputBlocked(){return !!challengeSceneHandoff||!!challengeEntryPending||viewportUI?.ready===false||challengeQueuedOperations>0||challengeResultActionPending||challengeActionBusy||!!preparationUI?.isOpen||!!challengeRun?.busy||!!challengeRun?.savePending||challengeSaveBlocked;}
async function restartPreparedEncounter(){
 if(!challengeRun)return;selected=challengeRun.characterId;playerAssist=challengeRun.helperId;difficulty=challengeRun.difficulty;challengeAfterResult=null;challengeSaveBlocked=false;if(challengeRun.finished){const saved=await challengeRun.finishChapter();if(!challengeSaved(saved)){showChallengeSaveFailure(saved,()=>continueCampaign({characterId:selected,helperId:playerAssist,selectionExplicit:true}));return {...saved,accepted:false};}return continueCampaign({characterId:selected,helperId:playerAssist,selectionExplicit:true});}
 const run=challengeRun,epoch=challengeOpeningEpoch;let presented;if(run.phase.kind==='boss'){matchSeries=new MatchSeries(run.phase.gate.kind==='boss'?'best-of-three':'single');presented=await startRound();}else presented=await startChallengePhase();syncChallengeSaveSlot();return {accepted:presented!==false,persisted:profileProgress.get().persisted,preview:profileProgress.testMode,...(presented===false?{reason:run===challengeRun&&epoch===challengeOpeningEpoch?'scene-unavailable':'cancelled'}:{})};
}
async function restartPausedGame(){
 if(challengeActionBusy)return;resetRestartConfirmation();
 if(gameMode!=='challenge'||!challengeRun){startGame();return;}
 challengeActionBusy=true;challengeRetainPause=false;challengeAfterResult=null;const run=challengeRun,battle=duel,target=scene,epoch=challengeOpeningEpoch,context=profileProgress.progressContext();syncChallengeSaveSlot();
 // A deferred save-recovery callback must not acquire a newer display owner.
 const current=()=>{const latest=profileProgress.progressContext();return run===challengeRun&&battle===duel&&target===scene&&epoch===challengeOpeningEpoch&&!homeRequested&&!['profileId','generation','testMode','modeEpoch'].some(key=>context[key]!==latest[key]);};
 try{await run.flush();const retried=await run.retry();if(!current())return;if(!challengeSaved(retried)){showChallengeSaveFailure(retried,()=>!current()?false:run.phase.kind==='boss'?presentChallengeRound(restartPreparedEncounter,()=>startRound()):restartPreparedEncounter());return;}if(run.phase.kind==='boss')await presentChallengeRound(restartPreparedEncounter,()=>startRound());else restartPreparedEncounter();}
 finally{challengeActionBusy=false;syncChallengeSaveSlot();}
}

restartOpenGate=bindFreshAction($('#restart-match'),()=>pauseRestartAvailable()&&!restartRequested,openRestartConfirmation);
restartConfirmGate=bindFreshAction($('#restart-confirm-button'),()=>pauseRestartAvailable()&&restartRequested,restartPausedGame);
$('#restart-cancel').onclick=cancelRestartConfirmation;
trainingRestartGate=bindFreshAction($('#training-restart'),()=>gameMode==='training'&&duel.status==='paused',startGame);
for(const target of ROSTER_TARGETS)$(`[data-roster-target="${target}"]`).onclick=()=>chooseRosterSide(target);
$('#mode-battle').onclick=()=>chooseMode('battle');$('#mode-training').onclick=()=>chooseMode('training');
$('#format-single').onclick=()=>{if(duel.status==='menu'){roundFormat='single';syncRoster();}};
$('#format-series').onclick=()=>{if(duel.status==='menu'){roundFormat='best-of-three';syncRoster();}};
$('#training-behavior').onchange=e=>{if(duel.status!=='menu')return;trainingBehavior=e.target.value;showMenu();};
function changeTraining(){if(gameMode!=='training'||duel.status!=='paused')return;trainingBehavior=$('#training-live-behavior').value;trainingInfinite=$('#training-infinite').checked;trainingRepeat=$('#training-repeat').checked;duel.configureTraining({opponent:trainingBehavior,infiniteHealth:trainingInfinite,repeatAssist:trainingRepeat});syncModeHUD();}
for(const id of ['training-live-behavior','training-infinite','training-repeat'])$('#'+id).onchange=changeTraining;
$('#difficulty-beginner').onclick=()=>chooseDifficulty('beginner');
$('#player-card').onclick=()=>chooseRosterSide('player');
$('#opponent-card').onclick=()=>chooseRosterSide('opponent');
$('#difficulty-easy').onclick=()=>chooseDifficulty('easy');
$('#difficulty-normal').onclick=()=>chooseDifficulty('normal');
$('#home').onclick=requestHome;
$('#start').onclick=()=>{if(duel.status==='menu')startGame();};bindResultAction($('#next-round'),nextRound);bindResultAction($('#replay'),startGame);bindResultAction($('#reselect'),()=>challengeRun?openPreparation({intent:challengeAfterResult&&duel.winner==='player'?'boundary':'retry'}):showMenu());$('#leave').onclick=()=>{if(challengeRun){requestHome();return;}requestHome();if(homeRequested)$('#home-confirm-title').textContent='要回選角嗎？';};$('#resume').onclick=resumeGame;$('#pause').onclick=()=>duel.status==='paused'?resumeGame():pauseGame();
$('#sound').onclick=()=>{settingsStore.update({masterMuted:!settingsStore.get().masterMuted});if(sound&&hasEntered){primeVoice();sfx('start');}renderEntryAudio();};
$('#help').onclick=()=>{if(challengeInputBlocked())return;if((duel.status==='title'&&!scene)||homeRequested)return;pauseGame();stopVoice();clearHold();moveDemo?.stop();settingsUI?.open(selected);$('#help-dialog').showModal();syncBattleSurface();syncMusic();};$('#close-help').onclick=()=>$('#help-dialog').close();$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')&&e.offsetX<0)$('#help-dialog').close();});
$('.brand').onclick=e=>{e.preventDefault();requestHome();};
$('#retry-entry-audio').onclick=unlockEntryAudio;

function endChallenge(){cancelChallengeSceneHandoff();challengeEntryPending=0;preparationUI?.destroy();preparationUI=null;challengeActionBusy=false;entryPreparationSession=null;profileProgress.cancelRun();challengeSaveBlocked=false;challengeRecoveryResume=null;challengeRecovery?.element.setAttribute('hidden','');challengeOpeningEpoch++;starterStoryUI?.close();challengeRun=null;challengeAfterResult=null;challengeStory?.close();if(gameMode==='challenge')gameMode='battle';syncChallengeSaveSlot();}
function cancelChallengeSceneHandoff(){challengeSceneHandoff?.cancel();}
// A saved scene is not visible until Phaser has rendered that exact run/world.
// The source UI stays in place while storage and rendering finish independently.
function presentChallengeScene(reveal=()=>{}){
 cancelChallengeSceneHandoff();
 const target=scene,run=challengeRun,battle=duel,epoch=challengeOpeningEpoch,serial=target?.challengeFrame?.serial??0;
 const context=profileProgress.progressContext();
 const current=()=>target===scene&&run===challengeRun&&battle===duel&&epoch===challengeOpeningEpoch&&context.profileId===profileProgress.get().activeProfileId&&context.generation===profileProgress.get().generation&&context.testMode===profileProgress.testMode&&context.modeEpoch===profileProgress.progressContext().modeEpoch;
 const events=target?.game?.events,lifecycle=target?.sys?.events;
 if(!events?.on){if(current())reveal();return Promise.resolve(current());}
 return new Promise(resolve=>{
  const finish=accepted=>{events.off('postrender',rendered);lifecycle?.off?.('shutdown',cancel);lifecycle?.off?.('destroy',cancel);if(challengeSceneHandoff===handoff)challengeSceneHandoff=null;if(accepted&&current())reveal();resolve(accepted&&current());};
  const cancel=()=>finish(false),rendered=()=>{const renderer=target.game?.renderer;if(!current()||renderer?.contextLost===true||renderer?.gameContext?.isContextLost?.()===true){cancel();return;}const frame=target.challengeFrame;if(frame?.serial>serial&&frame.run===run&&frame.duel===battle)finish(true);};
  const handoff={cancel};challengeSceneHandoff=handoff;events.on('postrender',rendered);lifecycle?.once?.('shutdown',cancel);lifecycle?.once?.('destroy',cancel);
 });
}
function revealChallengeScene(){setTitleVisible(false);$$('.screen').forEach(e=>e.classList.add('hidden'));}
function abandonUnpresentedEntry(){
 const pending=entryPreparationSession,state=profileProgress.get();
 // A cancelled dirty entry still owns its recovery receipt. The overview may
 // confirm those bytes through the shared store; only then release its token.
 const recovered=pending?.startResult?.accepted&&state.persisted&&!state.dirty&&!state.busy&&pending.context.profileId===state.activeProfileId&&pending.context.generation===state.generation;
 if(!challengeRun&&pending&&(challengeSaved(pending.startResult)||recovered)){profileProgress.cancelRun();entryPreparationSession=null;}
}
function openChallenge(){
 if(challengeActionBusy||!scene||!rosterReady)return;
 if(!preparationUI?.isOpen)abandonUnpresentedEntry();
 if(!challengeUI)challengeUI=mountChallengeUI({controller:profileProgress,progress:challengeProgress,characters:CAST,parent:$('.app'),onStart:options=>openPreparation({intent:options.intent??'resume',entry:options}),onPrepare:options=>openPreparation({intent:'save-only',characterId:options.characterId}),onContinue:options=>openPreparation({intent:'resume',entry:options}),onReview:reviewStarterOpening,onChange:()=>{abandonUnpresentedEntry();refreshProfileAccess();}});
 const savedParty=profileProgress.preparationSnapshot();challengeUI.open({characterId:savedParty.characterId,helperId:savedParty.helperId,selectionExplicit:true});
}
function ensureChallengeStory(){
 if(!challengeStory)challengeStory=mountChallengeStory({document,onAudio:unlockEntryAudio,paint:(canvas,beat,character,time)=>{
 paintChallengeStory(canvas,scene.artImages,beat,character,time,{reducedMotion:!!scene?.reducedMotion});
 }});return challengeStory;
}
function story(beats,done){
 clearHold();stopVoice();started=false;duel.status='story';syncBattleSurface();
 ensureChallengeStory().show(beats,{characterId:selected,onComplete:done});
 const actions=document.querySelector('.challenge-story .story-actions');let prepare=actions?.querySelector('[data-story-prepare]');if(actions&&!prepare){prepare=document.createElement('button');prepare.type='button';prepare.dataset.storyPrepare='';prepare.textContent='出戰準備';prepare.onclick=()=>openPreparation({intent:'boundary'});actions.append(prepare);}if(prepare)prepare.hidden=!challengeRun;
}
// Completing a visible story must not cancel the entry frame still being
// acknowledged behind it. Keep the story's existing busy/one-shot gate while
// waiting, then advance only if this exact runtime still owns the transition.
function savedDisplayReload(isCurrent){
 const receipt=profileProgress.get(),series=matchSeries;
 const isSafe=()=>{const saved=profileProgress.get();return isCurrent()&&!['active','countdown'].includes(duel.status)&&series===matchSeries&&(!challengeRun||!series||series.round===1&&series.score.player===0&&series.score.enemy===0&&!series.last)&&!profileProgress.testMode&&receipt.persisted===true&&saved.persisted===true&&!saved.dirty&&!saved.readOnly&&!saved.busy&&!saved.reason&&!challengeSaveBlocked&&!challengeActionBusy&&!challengeResultActionPending&&!challengeEntryPending&&!challengeQueuedOperations&&!challengeRun?.busy&&!challengeRun?.savePending&&!entryPreparationSession?.busy&&!entryPreparationSession?.savePending&&['revision','generation','activeProfileId'].every(key=>receipt[key]===saved[key])&&profileProgress.verifyPersistedReceipt?.(receipt)===true;};
 return {isSafe,reload:()=>{if(!isSafe())return false;window.location.reload();return true;}};
}
function challengeDisplayTransition(done,retry=done){
 const run=challengeRun,battle=duel,epoch=challengeOpeningEpoch,target=scene,context=profileProgress.progressContext();
 const owns=(world,renderer)=>{const latest=profileProgress.progressContext();return run===challengeRun&&world===duel&&epoch===challengeOpeningEpoch&&renderer===scene&&!homeRequested&&!['profileId','generation','testMode','modeEpoch'].some(key=>context[key]!==latest[key]);};
 function recover(destination,destinationScene){
  if(!owns(destination,destinationScene)||challengeSaveBlocked)return false;
  clearTimeout(countTimer);counting=false;clearHold();stopEffects();if(['active','countdown'].includes(duel.status))duel.status='paused';$('#countdown').classList.add('hidden');syncBattleSurface();
  const isCurrent=()=>owns(destination,destinationScene)&&!challengeSaveBlocked;
  return {accepted:false,reason:'scene-unavailable',isCurrent,savedReload:savedDisplayReload(isCurrent),message:profileProgress.testMode?'測試配置已套用，但場景尚未顯示。請重試顯示或返回總覽。':'配置已保存，但場景尚未顯示。請重試顯示或返回總覽。',
   retryPresentation:destinationScene.sys?.isActive?.()===false?undefined:()=>advance(destination,destinationScene,retry),
   returnToOverview:()=>{if(!owns(destination,destinationScene)||challengeSaveBlocked)return false;showTitle();openChallenge();return true;}};
 }
 async function advance(world,renderer,action){
  if(!owns(world,renderer)||challengeSaveBlocked)return false;if(renderer.sys?.isActive?.()===false)return recover(world,renderer);
  let pending;try{pending=action();}catch{pending=false;}const destination=duel,destinationScene=scene;
  try{const result=await pending;if(result!==false&&!(result?.accepted===false&&result.reason==='scene-unavailable'))return result;}catch{/* A rejected paint acknowledgment is a display failure, not a save failure. */}
  return recover(destination,destinationScene);
 }
 return ()=>advance(battle,target,done);
}
function presentChallengeStory(beats,done){
 const advance=challengeDisplayTransition(done);let presentation;
 story(beats,async()=>{if(await presentation!==true)return false;return advance();});
 presentation=presentChallengeScene(revealChallengeScene);return presentation;
}
async function presentChallengeRound(done,retry=done){
 const previousStory=challengeStory,storyEpoch=previousStory?.presentationEpoch,result=await challengeDisplayTransition(done,retry)();
 if(challengeStory===previousStory&&challengeStory?.presentationEpoch===storyEpoch&&result?.reason==='scene-unavailable'&&result.isCurrent?.())ensureChallengeStory().showRecovery(result,BOSS_DIALOGUES[challengeRun.phase.section],{characterId:selected});
 return result;
}
function starterStory(characterId,{mode='new-run',context={},onComplete}={}){
 clearHold();stopVoice();stopEffects();clearTimeout(countTimer);counting=false;started=false;duel.status='story';syncBattleSurface();challengeStory?.close();
 if(!starterStoryUI)starterStoryUI=mountStarterOpening({document,onAudio:unlockEntryAudio,reducedMotion:()=>!!scene?.reducedMotion,paint:(canvas,beat,options)=>paintIntegratedStarter(canvas,scene.artImages,beat,options)});
 starterStoryUI.show({characterId,mode,context,onComplete});
}
function reviewStarterOpening({characterId='wang'}={}){
 if(!scene||!profileProgress.canUse(characterId)||starterOpeningMode({profiles:challengeProgress.openingProfiles,characterId,review:true})!=='review')return;
 const epoch=++challengeOpeningEpoch,returnStatus=duel.status;
 starterStory(characterId,{mode:'review',onComplete:()=>{if(epoch!==challengeOpeningEpoch)return;duel.status=returnStatus;syncBattleSurface();challengeUI?.open({characterId});}});
}
function startChallenge({characterId='wang',helperId='han',replay=false,preparedSession=null,preparedOpeningMode=null}={}){
 if(!scene||!profileProgress.canUse(characterId)||!profileProgress.canUse(helperId))return;
 cancelChallengeSceneHandoff();
 const openingMode=preparedOpeningMode??starterOpeningMode({profiles:challengeProgress.openingProfiles,characterId,replay}),context=profileProgress.progressContext(),epoch=++challengeOpeningEpoch;
 const cached=preparedSession??entryPreparationSession,pendingSession=cached&&['profileId','generation','testMode','modeEpoch'].every(key=>cached.context[key]===context[key])&&cached.characterId===characterId&&cached.helperId===helperId&&cached.difficulty===(difficulty==='normal'?'hard':difficulty)&&cached.replay===replay?cached:null;
 if(cached&&!pendingSession)entryPreparationSession=null;
 const source={run:challengeRun,duel,status:duel.status,mode:gameMode,started,series:matchSeries};
 const current=()=>epoch===challengeOpeningEpoch&&context.profileId===profileProgress.get().activeProfileId&&context.testMode===profileProgress.testMode&&context.generation===profileProgress.get().generation&&context.modeEpoch===profileProgress.progressContext().modeEpoch;
 starterStoryUI?.close();selected=characterId;playerAssist=helperId;hasEntered=true;unlockEntryAudio();
 let entered=false;
 const install=async run=>{
  if(!current())return {accepted:false,reason:'cancelled'};
  challengeRun=run;entryPreparationSession=null;gameMode='challenge';challengeAfterResult=null;challengeSaveBlocked=false;cancelMatchFinish();setupMoves();syncChallengeSaveSlot();
  let presentation;if(openingMode==='legacy'&&run.checkpoint===0)presentation=presentChallengeStory(challengeOpening(selected),()=>current()?startChallengePhase():false);
  else presentation=startChallengePhase();
  const targetDuel=duel,targetScene=scene,presented=await presentation;
  if(presented===false&&current()&&run===challengeRun&&targetDuel===duel&&targetScene===scene&&!challengeSaveBlocked){
   // The receipt is durable, but no destination was shown. Restore only this
   // entry's source runtime so cancelling can reopen editable preparation.
   challengeRun=source.run;duel=source.duel;duel.status=source.status;gameMode=source.mode;started=source.started;matchSeries=source.series;entryPreparationSession=run;challengeStory?.close();syncModeHUD();syncBattleSurface();syncChallengeSaveSlot();
  }
  return {accepted:current()&&presented!==false,persisted:run.startResult?.persisted,preview:profileProgress.testMode,...(!current()?{reason:'cancelled'}:presented===false?{reason:'scene-unavailable'}:{})};
 };
 const begin=async()=>{if(entered||!current())return {accepted:false,reason:'cancelled'};entered=true;challengeEntryPending=epoch;
  try{await challengeOperations;if(!current())return {accepted:false,reason:'cancelled'};
  let run;try{run=pendingSession??await AsyncChallengeSession.create({progress:profileProgress,characterId,helperId,difficulty:difficulty==='normal'?'hard':difficulty,replay});}catch(error){if(current())$('#profile-storage-note').textContent='挑戰尚未開始：'+(error.message||'無法保存');return {accepted:false,persisted:false,reason:error.message||'save-failed'};}
  if(!current())return {accepted:false,reason:'cancelled'};
  if(!challengeSaved(run.startResult)){
   entryPreparationSession=run;
   if(!preparationUI?.isOpen)showChallengeSaveFailure(run.startResult,()=>install(run));
   return {...run.startResult,accepted:false};
  }
  return await install(run);
  }finally{if(challengeEntryPending===epoch)challengeEntryPending=0;}
 };
 // Configuration alone cannot consume the comic or start an encounter. The
 // completion Promise includes the saved state and its actual rendered frame.
 if(openingMode==='new-run')starterStory(characterId,{context,onComplete:begin});else return begin();
}
function startChallengePhase(){
 if(!challengeRun)return;selected=challengeRun.characterId;playerAssist=challengeRun.helperId;difficulty=challengeRun.difficulty;const phase=challengeRun.phase;
 if(phase.kind==='complete'){showTitle();openChallenge();return;}
 if(phase.kind==='boss'){const run=challengeRun;return presentChallengeStory(BOSS_DIALOGUES[phase.section],()=>{if(run!==challengeRun)return false;matchSeries=new MatchSeries(phase.gate.kind==='boss'?'best-of-three':'single');return startRound();});}
 resetHomeConfirmation();cancelMatchFinish();resetRestartConfirmation();stopEffects();stopVoice();clearTimeout(countTimer);clearHold();counting=false;punchWait=0;matchSeries=null;
 duel=new ChallengeDepthRoute(selected,difficulty,undefined,{section:phase.section,playerAssist,carry:challengeRun.carry,stats:challengeProgress.derivedStats(selected)});duel.progressContext=challengeRun.context;
 started=true;$('#countdown').classList.add('hidden');$('.control-deck').inert=false;$('#pause').disabled=false;$('#pause').textContent='Ⅱ 暫停';$('#help').disabled=false;$('#tip').textContent='上下左右走位 · 空白鍵／跳躍鍵跳過敵人 · 向右追神麥！';syncModeHUD();syncBattleSurface();syncMusic(true);setupMoves();primeVoice();syncChallengeSaveSlot();return presentChallengeScene(()=>{revealChallengeScene();$('#game').focus({preventScroll:true});if(challengeRetainPause||document.hidden){challengeRetainPause=false;pauseGame();}});
}
function displayY(f){return f.y+(duel.depthMode?(f.depth??0)*.65:0);}
function challengeSaved(result){return !!result?.accepted&&(!!result.persisted||profileProgress.testMode);}
function rootSaveState(){const saved=profileProgress.get();return {...saved,persisted:saved.persisted&&!challengeSaveBlocked,blocked:challengeSaveBlocked,busy:challengeQueuedOperations>0||challengeResultActionPending||challengeActionBusy||!!challengeRun?.busy||!!entryPreparationSession?.busy};}
function syncChallengeSaveSlot(){const slot=$('#challenge-save-slot');if(!slot)return;slot.hidden=!challengeRun&&!entryPreparationSession&&!challengeSaveBlocked;const state=rootSaveState();slot.textContent=profileProgress.testMode?'測試不保存':state.busy?'保存中':state.blocked||state.dirty?'需處理':'進度已保存';const description=profileProgress.testMode?'測試模式，不保存／不記錄進度。':state.busy?'正在保存並讀回確認，請稍候。':state.blocked||state.dirty?'進度尚未保存，點此開啟復原與備份。':'進度已保存，點此查看保存與備份。';slot.setAttribute('title',description);slot.setAttribute('aria-label',description);slot.dataset.status=profileProgress.testMode?'preview':state.busy?'busy':state.blocked||state.dirty?'error':'saved';challengeRecovery?.refresh();challengeStory?.refreshRecovery?.();preparationUI?.refreshRecovery?.();}
function showRootRecovery(){
 const host=challengeSaveBlocked?$('#result .paper'):$('#pause-screen .paper');if(!challengeSaveBlocked&&duel.status==='active')pauseGame();
 if(!challengeRecovery){challengeRecovery=mountChallengeRecovery({document,window,parent:host,getState:rootSaveState,retrySave:()=>challengeRun?.retrySave()??entryPreparationSession?.retrySave()??profileProgress.retrySave(),exportCurrent:()=>profileProgress.exportBackup(),exportLegacy:()=>profileProgress.campaignStore().exportLegacyJSON(),onBusy:value=>{challengeActionBusy=value;syncChallengeSaveSlot();},onRecovered:async()=>{challengeSaveBlocked=false;const resume=challengeRecoveryResume;challengeRecoveryResume=null;refreshProfileAccess();await resume?.();syncChallengeSaveSlot();}});}else if(challengeRecovery.element.parentElement!==host)host.append(challengeRecovery.element);challengeRecovery.refresh();challengeRecovery.element.hidden=false;return challengeRecovery;
}
function showChallengeSaveFailure(result,resume){
 cancelChallengeSceneHandoff();challengeSaveBlocked=true;challengeRecoveryResume=resume;cancelMatchFinish();clearHold();if(['active','paused','countdown'].includes(duel.status))duel.status='paused';syncBattleSurface();$('#pause').disabled=true;for(const gate of resultPressGates.values())gate.arm();$('#result').classList.remove('hidden');$('#result-title').textContent='進度尚未保存';$('#result-sub').textContent=saveIssueText(result?.reason);$('#next-round').hidden=true;$('#replay').hidden=true;$('#reselect').hidden=true;
 challengeAfterResult=async()=>{if(challengeActionBusy)return;challengeActionBusy=true;try{const saved=await (challengeRun?.retrySave()??entryPreparationSession?.retrySave()??profileProgress.retrySave());if(saved.accepted&&saved.persisted){challengeSaveBlocked=false;refreshProfileAccess();await resume?.();}else showChallengeSaveFailure(saved,resume);}finally{challengeActionBusy=false;syncChallengeSaveSlot();}};showRootRecovery();syncChallengeSaveSlot();
}
function mountRootChallengeActions(){
 const host=$('#pause-screen .paper');if(!host.querySelector?.('#challenge-inspect-button')){const button=document.createElement('button');button.id='challenge-inspect-button';button.type='button';button.className='primary menu-action';button.textContent='查看角色能力';button.onclick=()=>openPreparation({readOnly:true});host.append(button);}
}
function openPreparation(options={}){
 if(challengeActionBusy||challengeEntryPending||challengeSceneHandoff||challengeRun?.busy)return false;
 if(challengeSaveBlocked){showRootRecovery();return false;}
 const run=challengeRun,entry=options.entry,atBoundary=!!run&&(duel.status==='story'||!!challengeAfterResult&&duel.winner==='player');
 const intent=options.intent??(run?'boundary':entry?'resume':'save-only');
 const readOnly=!!options.readOnly||!!run&&!atBoundary&&intent!=='retry';
 if(run&&intent==='retry'&&!['paused','over'].includes(duel.status)&&!readOnly)return false;
 pauseGame();clearHold();challengeUI?.hide();resetRestartConfirmation();
 let applied=false,failedDisplay=null;
 const ownsFailedDisplay=()=>{const destination=failedDisplay,latest=profileProgress.progressContext();return !!destination&&preparationUI===owner&&destination.run===challengeRun&&destination.duel===duel&&destination.scene===scene&&destination.epoch===challengeOpeningEpoch&&(!Object.hasOwn(destination,'entrySession')||destination.entrySession===entryPreparationSession)&&!homeRequested&&!challengeSaveBlocked&&!['profileId','generation','testMode','modeEpoch'].some(key=>destination.context[key]!==latest[key]);};
 const onApplied=async(result,context)=>{
  applied=true;challengeSaveBlocked=false;challengeRecoveryResume=null;challengeRetainPause=context.keepPaused;
  const saved=run?.preparationSnapshot()??profileProgress.preparationSnapshot();selected=saved.characterId;playerAssist=saved.helperId;difficulty=saved.difficulty;
  if(run){
   if(intent==='retry'){
    const pending=restartPreparedEncounter(),destination={run,duel,scene,epoch:challengeOpeningEpoch,context:profileProgress.progressContext()},restarted=await pending;
    if(restarted?.accepted===false){if(restarted.reason==='scene-unavailable'&&(restarted.persisted||restarted.preview)){failedDisplay=destination;return {...restarted,isCurrent:ownsFailedDisplay,savedReload:savedDisplayReload(ownsFailedDisplay)};}return restarted;}
   }
   else {setupMoves();syncChallengeSaveSlot();}
  }else if(intent==='save-only'){/* The overview reopens after preparation releases its busy gate. */}
  else{
   const currentChapter=profileProgress.readProfile()?.campaign?.cursor?.chapterId;
   if(!profileProgress.testMode&&!entry?.replay&&currentChapter&&currentChapter!=='chapter-1'){const continued=await continueCampaign({characterId:selected,helperId:playerAssist,selectionExplicit:true});if(continued?.accepted===false)return continued;}
   else {
    const source={run,duel,scene,context:profileProgress.progressContext()},pending=startChallenge({characterId:selected,helperId:playerAssist,replay:!!entry?.replay});source.epoch=challengeOpeningEpoch;
    const launched=await pending;if(launched?.accepted===false){if(launched.reason==='scene-unavailable'&&(launched.persisted||launched.preview)){failedDisplay={...source,entrySession:entryPreparationSession};return {...launched,isCurrent:ownsFailedDisplay,savedReload:savedDisplayReload(ownsFailedDisplay)};}return launched;}
   }
  }
  refreshProfileAccess();
 };
 preparationUI?.destroy();const owner=mountChallengePreparation({document,window,characters:CAST,parent:document.body,controller:{
  preparationSnapshot:()=>run?.preparationSnapshot()??profileProgress.preparationSnapshot(),
  preparePreview:(draft,guard)=>run?run.prepareEncounter(draft,guard):profileProgress.preparePreview(draft,guard),
  savePreparation:(draft,guard)=>profileProgress.savePreparation(draft,guard),
  prepareEncounter:(draft,guard)=>run?run.prepareEncounter(draft,guard):profileProgress.savePreparation(draft,guard),
  retrySave:()=>run?.retrySave()??entryPreparationSession?.retrySave()??profileProgress.retrySave(),exportJSON:()=>profileProgress.exportBackup(),exportLegacyJSON:()=>profileProgress.exportLegacyBackup?.()??null
 },getEncounter:()=>run?{safeBoundary:atBoundary,phase:run.phase,mode:duel.status==='story'?'story':duel instanceof ChallengeRoute?'route':'battle',token:run.token}:({mode:'entry'}),onBusy:value=>{challengeActionBusy=value;syncChallengeSaveSlot();},onFailure:()=>syncChallengeSaveSlot(),onApplied,onClose:context=>{
  if(!context.applied&&ownsFailedDisplay()){showTitle();openChallenge();return;}
  if(!run&&failedDisplay)return;
  if(!context.applied)abandonUnpresentedEntry();syncChallengeSaveSlot();if(run&&duel.status==='paused')restartOpenGate?.arm();if(!run&&(intent==='save-only'||!context.applied&&!applied))openChallenge();
 }});
 preparationUI=owner;return preparationUI.open({characterId:options.characterId,readOnly,intent,initial:entry});
}
async function returnToChallengeOverview(){
 if(challengeInputBlocked()){if(challengeSaveBlocked)showRootRecovery();return false;}
 const run=challengeRun;if(run)pauseGame();
 challengeActionBusy=true;
 try{await challengeOperations;await run?.flush();const saved=profileProgress.get();if(!profileProgress.testMode&&(saved.dirty||saved.readOnly||saved.reason||!saved.persisted)){showChallengeSaveFailure({reason:saved.reason??'unsaved-progress'},()=>returnToChallengeOverview());return false;}
  showTitle();restoreProfileSelection();return true;
 }finally{challengeActionBusy=false;openChallenge();}
}

function enqueueChallenge(run,operation){
 challengeQueuedOperations++;syncChallengeSaveSlot();const task=challengeOperations.then(operation);
 challengeOperations=task.catch(error=>{if(run===challengeRun)showChallengeSaveFailure({reason:error.message});}).finally(()=>{challengeQueuedOperations--;syncChallengeSaveSlot();});return challengeOperations;
}
function restoreSavedChallengeScene(run,battle){if(run!==challengeRun||battle!==duel)return;$('#result').classList.add('hidden');$('#reselect').hidden=false;duel.status='active';pauseGame();challengeRetainPause=false;syncChallengeSaveSlot();}
function handleChallengeFrameEvents(events,arena){
 const relevant=events.filter(e=>['enemyDefeated','routeGate'].includes(e.type));if(!challengeRun||!relevant.length)return;
 const run=challengeRun,battle=duel,gate=relevant.some(e=>e.type==='routeGate');
 enqueueChallenge(run,async()=>{
  const before=challengeProgress.get().allowance,reward=await run.routeEvents(relevant);if(run!==challengeRun)return;
  for(const e of relevant)if(e.type==='enemyDefeated')arena.popup(e.f.x,displayY(e.f)-180,profileProgress.testMode?'測試擊倒':challengeSaved(reward)?`經驗 +${e.xp}`:'擊倒！','#fff0a8',22);
  if(challengeProgress.get().allowance>before)arena.banner('升級！每位角色都多 1 點技能額度。');
  if(!challengeSaved(reward)){showChallengeSaveFailure(reward,()=>gate?startChallengePhase():restoreSavedChallengeScene(run,battle));return;}
  if(gate)startChallengePhase();
 });
}
function handleChallengeEvent(e,arena){
 const run=challengeRun,phase=run?.checkpoint,battle=duel;if(!run)return false;
 if(e.type==='enemyDefeated'){const y=displayY(e.f)-180;enqueueChallenge(run,async()=>{const before=challengeProgress.get().allowance,reward=await run.rewardMob(e);if(run!==challengeRun)return;arena.popup(e.f.x,y,challengeSaved(reward)?`經驗 +${e.xp}`:'擊倒！','#fff0a8',22);if(challengeProgress.get().allowance>before)arena.banner('升級！每位角色都多 1 點技能額度。');if(!profileProgress.testMode&&((reward?.accepted&&!reward.persisted)||(!reward?.accepted&&!['duplicate-reward','invalid-operation'].includes(reward?.reason))))showChallengeSaveFailure(reward,()=>restoreSavedChallengeScene(run,battle));});return true;}
 if(e.type==='supply'){arena.popup(duel.player.x,displayY(duel.player)-245,'支持者補給 +'+e.amount,'#b6f1ba',23);sfx('heal');return true;}
 if(e.type==='routeGate'){enqueueChallenge(run,async()=>{if(run.checkpoint!==phase)return;const saved=await run.routeComplete(e.carry);if(run!==challengeRun)return;if(challengeSaved(saved))startChallengePhase();else showChallengeSaveFailure(saved,()=>startChallengePhase());});return true;}
 if(e.type==='routeLost'){duel.status='over';duel.winner='enemy';enqueueChallenge(run,async()=>{await run.flush();if(run===challengeRun&&!challengeSaveBlocked)result();});return true;}
 if(e.f?.mobKind&&e.type==='move')return true;
 if(e.f?.mobKind&&['counter','counterMiss'].includes(e.type)){arena.popup(e.f.x,displayY(e.f)-220,e.type==='counter'?'搶話成功！':'抓錯時機！','#ffe29a',22);return true;}
 return false;
}
async function challengeResult(round,between){
 const run=challengeRun,battle=duel,won=duel.winner==='player',gate=run.phase.gate;
 if(between){$('#result-title').textContent=round.draw?'兩邊都還沒講完！':won?'你先搶到一句話！':gate.name+'先搶到一句話！';return;}
 const route=duel instanceof ChallengeRoute;challengeSettledBattles.add(battle);$('#replay').disabled=true;$('#result-sub').textContent='正在確認進度保存…';
 await run.flush();if(run!==challengeRun||battle!==duel)return;if(challengeSaveBlocked||profileProgress.get().dirty){showChallengeSaveFailure({reason:profileProgress.get().reason},()=>renderChallengeResult(run,won,gate));return;}
 if(won&&!route){const saved=await run.bossWon({hp:battle.player.hp,rally:battle.player.rally,assist:{...battle.player.assist,active:false}});if(run!==challengeRun||battle!==duel)return;if(!challengeSaved(saved)){showChallengeSaveFailure(saved,()=>renderChallengeResult(run,won,gate));return;}refreshProfileAccess();}
 renderChallengeResult(run,won,gate);
}
function renderChallengeResult(run,won,gate){
 syncChallengeSaveSlot();
 if(run!==challengeRun)return;const state=profileProgress.get();
 $('#result-title').textContent=won?(run.finished?'咆哮哥也加入開講！':gate.name+'讓路了！'):'先喘口氣，還沒吵完！';
 $('#result-sub').textContent=state.testMode?'測試模式：本次經驗與解鎖不會保存。':won?(run.finished?'第一章完成！咆哮哥已解鎖，可當主戰或助拳。接著前往第二章，繼續追神麥。':'前面還有人在開講。已保存進度與經驗，換角色也能接著走。'):'已保存的經驗和檢查點保留，可從這個路段再試一次。';
 $('#result-score').textContent=`本存檔 ${challengeProgress.get().xp} XP · 每位角色 ${challengeProgress.get().allowance} 點技能額度`;
 $('#reselect').hidden=false;$('#replay').disabled=false;$('#replay').hidden=false;$('#replay').textContent=won?(run.finished?'繼續第 2 章 →':'繼續追神麥 →'):'從檢查點重試 ↻';$('#next-round').hidden=true;
 if(won&&run.finished&&run.replay){$('#result-title').textContent='第一章重訪完成！';$('#result-sub').textContent='本次獲得的小怪經驗已保存，原章節進度保留。首通獎勵不重複領取。';$('#replay').textContent='返回挑戰總覽 →';}
 challengeAfterResult=async()=>{if(run!==challengeRun)return;if(run.finished&&run.replay){const saved=await run.finishChapter();if(!challengeSaved(saved)){showChallengeSaveFailure(saved,()=>{showTitle();openChallenge();});return;}showTitle();openChallenge();return;}if(run.finished){const saved=await run.finishChapter();if(!challengeSaved(saved)){showChallengeSaveFailure(saved,()=>continueCampaign({characterId:selected,helperId:playerAssist}));return;}await continueCampaign({characterId:selected,helperId:playerAssist,selectionExplicit:true});}else{if(!won){const retried=await run.retry();if(!challengeSaved(retried)){showChallengeSaveFailure(retried,()=>startChallengePhase());return;}}if(run===challengeRun)startChallengePhase();}};
}
let campaignNavigationPending=false;
async function continueCampaign({characterId=selected,helperId=playerAssist,selectionExplicit=partySelectionTouched}={}){
 if(campaignNavigationPending)return {accepted:false,reason:'busy'};campaignNavigationPending=true;let departing=false;
 try{
 await challengeOperations;await challengeRun?.flush();
 const result=await prepareMainContinuation({progress:profileProgress,characterId,helperId,preferSavedSelection:!selectionExplicit,
  choose:info=>chooseAdoptionSource(window,info),
  confirm:info=>window.confirm(adoptionConfirmation(info))});
 if(result.accepted&&(result.persisted||result.testMode)){const launch=result.testMode?result:createCampaignHandoff({window,url:result.url,difficulty,view:{...profileProgress.get(),chapterId:profileProgress.readProfile()?.campaign?.cursor?.chapterId}});if(launch.accepted){window.location.assign(launch.url);departing=true;return result;}result.accepted=false;result.reason=launch.reason;result.message='無法建立章節接續，已保存的進度不變。請允許此網站使用分頁儲存空間後重試。';}
 if(['handoff-unavailable','invalid-destination'].includes(result.reason)){const message=result.message||'章節進度已保存，暫時無法切換頁面。請重新接續。';$('#profile-storage-note').textContent=message;if(challengeRun){$('#result-title').textContent='進度已保存';$('#result-sub').textContent=message;$('#replay').textContent='重試接續 →';challengeAfterResult=()=>continueCampaign({characterId,helperId,selectionExplicit});}return {...result,message};}
 if(['content-locked','chapter-1-incomplete'].includes(result.reason)){const message=result.reason==='content-locked'?'第五章尚未開放；可重訪已完成章節，原進度不變。':'請先完成第一章，再繼續後續章節。';$('#profile-storage-note').textContent=message;if(challengeRun){$('#result-sub').textContent=message;$('#replay').textContent='查看第一章與角色成長 →';challengeAfterResult=()=>{showTitle();openChallenge();};}return {...result,message};}
 if(result.reason!=='cancelled'){$('#profile-storage-note').textContent='尚未前往後續章節：'+saveIssueText(result.reason);if(challengeRun)showChallengeSaveFailure(result,()=>continueCampaign({characterId,helperId}));}
 return result;
 }finally{if(!departing)campaignNavigationPending=false;}
}
window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
window.addEventListener('storage',event=>{if(event.key!==null&&event.key!==CHALLENGE_KEY)return;if(challengeRun){pauseGame();showChallengeSaveFailure({reason:'stale-run'});return;}profileProgress.refresh().then(()=>{restoreProfileSelection();refreshProfileAccess();challengeUI?.refresh?.();});});
$('#challenge-save-slot').onclick=()=>{if(challengeActionBusy)return;if(!challengeRun&&!challengeSaveBlocked){openChallenge();challengeUI?.open({view:'save'});}else showRootRecovery();};
$('#mode-challenge').disabled=false;$('#mode-challenge').innerHTML='挑戰';$('#mode-challenge').onclick=openChallenge;

const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'crouch',KeyS:'crouch',KeyK:'guard',ShiftLeft:'guard',KeyJ:'punch',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyU:'special1',KeyI:'special2',KeyO:'special3',KeyL:'rally',KeyH:'assist'};
window.addEventListener('keydown',e=>{if(challengeInputBlocked()){if(e.code==='Escape')e.preventDefault();return;}if(homeRequested&&e.code==='Tab'){e.preventDefault();const items=[$('#home-cancel'),$('#home-confirm-button'),$('#home-select')].filter(e=>!e.hidden),index=items.indexOf(document.activeElement);items[(index+(e.shiftKey?items.length-1:1)+items.length)%items.length].focus();return;}if(e.target.closest('dialog,select,[data-game-select],.game-select-menu,#result')||['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Escape'){if(e.repeat)return;if(homeRequested){e.preventDefault();cancelHomeConfirmation();return;}if(restartRequested){e.preventDefault();cancelRestartConfirmation();return;}if(duel.status==='active')pauseGame();else if(duel.status==='paused')resumeGame();return;}const action=challengeKeyAction(e.code,keys,!!duel.depthMode);if(!action||!started)return;e.preventDefault();if(e.repeat||duel.status!=='active'||viewportUI?.ready===false)return;if(['left','right','up','down','guard','punch','crouch'].includes(action)){const alreadyHeld=!!hold[action];heldKeys.add(e.code);syncHold(action);if(action==='punch'&&!alreadyHeld){duel.press('punch');punchWait=.33;}}else{heldKeys.add(e.code);syncActionKeyFeedback();duel.press(action);}});
window.addEventListener('keyup',e=>{const action=challengeKeyAction(e.code,keys,!!duel.depthMode);if(action){heldKeys.delete(e.code);syncHold(action);syncActionKeyFeedback();}});
mountGameplaySelectionGuard({root:document,ownsTarget:t=>!!t?.closest?.('.cabinet,.control-deck,.challenge-story,.challenge-dialog')});
mountSpecialNameFit({document});
const pageZoomPreference=bindPageZoomPreference({control:$('#settings-page-zoom'),root:document.documentElement});
pageZoomGestures=mountPageZoomGuard({root:document,ownsTarget:target=>ownsGamePageTarget(document,target),allowsZoom:()=>pageZoomPreference.enabled});
battleGestures=mountBattleGestures({root:$('#viewport-shell'),isProtected:battleSurfaceProtected});
syncBattleSurface();
touchControls=bindTouchControls({document,window,active:()=>duel.status==='active'&&!challengeInputBlocked(),viewport:()=>({ready:viewportUI?.ready!==false,epoch:viewportUI?.epoch??0,rotation:viewportUI?.rotation||0}),rotation:()=>viewportUI?.rotation||0,directionMode:()=>duel.depthMode?'depth':'duel',
 onHold:(action,on)=>{on?touchHeld.add(action):touchHeld.delete(action);syncHold(action);},
 onAction:action=>{if(action==='punch'&&[...heldKeys].some(code=>challengeKeyAction(code,keys,!!duel.depthMode)==='punch'))return;duel.press(action);if(action==='punch')punchWait=.33;}});
window.addEventListener('blur',()=>{if(challengeActionBusy||challengeEntryPending||challengeSceneHandoff)challengeRetainPause=true;if(matchFinish)matchFinish.suspended=true;music.setHidden(true);stopEffects();moveDemo?.stop();stopVoice();clearHold();pauseGame();});window.addEventListener('focus',()=>{if(matchFinish)matchFinish.suspended=!!document.hidden;music.setHidden(!!document.hidden);});document.addEventListener('visibilitychange',()=>{if(matchFinish)matchFinish.suspended=!!document.hidden||!document.hasFocus();music.setHidden(!!document.hidden||!document.hasFocus());if(document.hidden){if(challengeActionBusy||challengeEntryPending||challengeSceneHandoff)challengeRetainPause=true;stopEffects();moveDemo?.stop();stopVoice();clearHold();pauseGame();}});
function text(scene,x,y,content,size=20,color='#142b32',weight='bold'){return scene.add.text(x,y,content,{fontFamily:'"PingFang TC","Microsoft JhengHei",sans-serif',fontSize:size,color,fontStyle:weight,padding:{x:2,y:2}});}
function ellipse(g,x,y,w,h,color,stroke=true){g.fillStyle(color,1);g.fillEllipse(x,y,w,h);if(stroke){g.lineStyle(3,ink,1);g.strokeEllipse(x,y,w,h);}}
function rect(g,x,y,w,h,color,r=0){g.fillStyle(color);if(r){g.fillRoundedRect(x,y,w,h,r);g.lineStyle(3,ink);g.strokeRoundedRect(x,y,w,h,r);}else{g.fillRect(x,y,w,h);g.lineStyle(3,ink);g.strokeRect(x,y,w,h);}}
function line(g,points,width,color){g.lineStyle(width+5,ink,1);g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.strokePath();g.lineStyle(width,color,1);g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.strokePath();}
class Arena extends Phaser.Scene {
 preload(){for(const [key,file] of Object.entries({...CHALLENGE_ART_FILES,...STARTER_ART_FILES}))this.load.image(key,'assets/'+file);for(const [key,file] of [['supporter-elder','elder'],['supporter-young','young'],['supporter-grandma','grandma']])this.load.image(key,'assets/supporter-'+file+'-v48.png');for(const a of Object.values(ITEM_ART))this.load.image(a.key,a.file);this.load.image('supporter-woman','assets/supporter-woman-v46.png');this.load.image('supporter-man','assets/supporter-man-v46.png');this.load.image('arena-chamber',ARENA_ASSET);this.load.image('arena-chamber-extended',CHAMBER_EXTENSION_ASSET);this.assetFailure=false;this.load.on('progress',v=>{$('#start').textContent='載入漫畫 '+Math.round(v*100)+'%';titleUI?.setReady(false,'載入漫畫 '+Math.round(v*100)+'%');});this.optionalArtFailures=new Set();this.load.on('loaderror',file=>{if(['challenge-arena-layer','challenge-arena-sky','challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair','arena-chamber-extended'].includes(file?.key)){this.optionalArtFailures.add(file.key);return;}this.assetFailure=true;});for(const [key,file] of Object.entries(ART_FILES))this.load.image(key,'assets/'+file);}
 create(){if(this.assetFailure){$('#start').textContent='素材載入失敗，請重整';titleUI?.setReady(false,'素材載入失敗，請重新整理再試。');$('#tip').textContent='部分漫畫素材未載入，請重新整理再試。';return;}scene=this;this.add.rectangle(480,-1000,6000,2860,0xd4cbaa).setDepth(-30);this.add.rectangle(480,1800,6000,2740,0xe6c695).setDepth(-30);this.makeBackdrop();this.dynamic=this.add.graphics();this.rigs=[this.add.container(),this.add.container()];this.chars=[];this.heads=[];this.extras=[];for(let i=0;i<2;i++){const body=this.add.graphics(),head=this.add.image(4,-75,'wang-head'),extra=this.add.graphics();this.rigs[i].add([body,head,extra]);this.chars.push(body);this.heads.push(head);this.extras.push(extra);}this.artImages=Object.fromEntries(Object.keys({...ART_FILES,...CHALLENGE_ART_FILES,...STARTER_ART_FILES}).filter(k=>!this.optionalArtFailures?.has(k)&&(!['challenge-arena-layer','challenge-arena-sky','challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair'].includes(k)||this.textures.exists(k))).map(k=>[k,this.textures.get(k).getSourceImage()]));for(const k of ['supporter-woman','supporter-man','supporter-young','supporter-elder','supporter-grandma'])this.artImages[k]=this.textures.get(k).getSourceImage();for(const a of Object.values(ITEM_ART))this.artImages[a.key]=this.textures.get(a.key).getSourceImage();this.challengeRenderer=createChallengeRenderer(this,this.artImages);this.assistRenderer=createAssistRenderer(this,this.artImages);this.artCanvases=[];this.artDisplays=[];this.spitStart=new WeakMap();this.lastArtPose=new WeakMap();this.propPool=[];this.textPool=[];this.markerPool=[];this.statusTexts=[0,1].map(()=>text(this,0,0,'',17,'#fff7e5').setOrigin(.5).setStroke('#142b32',4).setDepth(8));this.guardCache='';
 for(const [name,r] of Object.entries(PROP_FRAMES))this.textures.get('art-props').add(name,0,...r);
 this.textures.get('handshake-grip').add('clasp',0,290,65,1590,610);
 for(const [name,r] of Object.entries(SIGNATURE_PROP_FRAMES))this.textures.get('signature-props').add(name,0,...r);
 for(let i=0;i<2;i++){this.chars[i].setVisible(false);this.heads[i].setVisible(false);this.extras[i].setVisible(false);const texture=this.textures.createCanvas('fighter-art-'+i,512,384);const art=this.add.image(-256,-350,'fighter-art-'+i).setOrigin(0);this.rigs[i].add(art);this.artCanvases.push(texture);this.artDisplays.push(art);}
 this.input.addPointer(4);this.hudCache='';this.lastBroadcast=0;this.trailClock=[0,0];viewportUI=mountGameViewport({scene:this,clearHold,initialSettings:preferences,onChange:patch=>settingsStore.update(patch),isCameraFrozen:()=>duel?.status==='paused'||!!matchFinish});this.combatOverlay=mountCombatOverlayLayout({document,getCombatOwner:()=>$('.app').dataset.titleOpen!=='true'&&duel?.player&&['countdown','active','paused','over','gate','lost'].includes(duel.status)?duel:null,getCameraMode:()=>matchFinish?.camera?.challengeCameraMode??(duel?.status==='paused'?this.cameraView?.challengeCameraMode:null)??viewportUI?.camera});initializeRoster();initializeSettings();titleUI?.setReady(true);$('#help').disabled=false;$('#start').disabled=false;$('#start').innerHTML='上 場 開 吵 <span>→</span>';}

 makeBackdrop(){
  const texture=this.textures.get('arena-chamber');for(const [name,crop] of Object.entries({...CHAMBER_MATERIAL_FRAMES,...CHAMBER_DESK_FRAMES}))if(!texture.has(name))texture.add(name,0,...crop);
  this.naturalChamber=createNaturalChamberBackdrop(this,CHAMBER);
  this.arenaBackdrop=this.add.image(480,430,this.naturalChamber?.anchorKey||'arena-chamber','__BASE').setOrigin(.5,CHAMBER.floorRatio).setDepth(-10);
  this.chamberDeskLayers=chamberDeskLayers(CHAMBER).map(p=>this.add.image(p.x,p.y,'arena-chamber',p.frame).setDisplaySize(p.width,p.height).setDepth(-9.95));
  this.backdropExtensions=this.naturalChamber?.displays||[];
  this.boundaryGraphics=this.add.graphics().setDepth(-8);drawArenaBoundaries(this.boundaryGraphics);
  this.supporterSprites=Array.from({length:12},()=>this.add.image(0,0,'supporter-woman').setOrigin(.5,1).setDepth(-3).setVisible(false));this.crowdRush=this.add.graphics().setDepth(2);this.crowdRushLabels=[0,1].map(()=>text(this,0,0,'',14,'#ffe49a').setStroke('#17323b',3).setOrigin(.5).setDepth(4));this.supporterFlags=this.add.graphics().setDepth(2.5);this.supporterFlagLabels=[0,1].map(()=>text(this,0,0,'',11,'#17323b').setOrigin(.5).setDepth(3));this.crowdGraphics=this.add.graphics().setDepth(-2);this.ambient=this.add.graphics().setDepth(-9);this.itemGraphics=this.add.graphics().setDepth(2);this.itemSprites=[];this.carryHands=new WeakMap();
  this.reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 }
 updateBackdrop(time,frame){
  const b=CHAMBER;this.arenaBackdrop.setPosition(b.x,b.y).setDisplaySize(b.width,b.height);
  if(this.naturalChamber)this.naturalChamber.draw(frame);else{const tiles=chamberBackdropTiles(frame,b);for(let i=0;i<tiles.length;i++){const t=tiles[i];let tile=this.backdropExtensions[i];if(!tile){tile=this.add.image(0,0,'arena-chamber','__BASE').setDepth(-11);this.backdropExtensions.push(tile);}tile.setFrame(t.frame).setPosition(t.x,t.y).setDisplaySize(t.width,t.height).setFlipX(t.flipX).setFlipY(t.flipY).setVisible(true);}for(let i=tiles.length;i<this.backdropExtensions.length;i++)this.backdropExtensions[i].setVisible(false);}
  const g=this.ambient;g.clear();for(const p of ambientPaper(time,this.reducedMotion)){g.fillStyle(0xfff9dc,p.alpha);g.fillRect(p.x,p.y,7,4);g.lineStyle(1,0x8f7759,p.alpha);g.lineBetween(p.x,p.y+4,p.x+7,p.y+4);}
 }
 drawCrowd(frame){
  paintStageCrowd(this.crowdGraphics,duel);const top=el=>{let y=0;for(let n=el;n&&n!==$('.app');n=n.offsetParent)y+=n.offsetTop;return y;},edge=top($('.specials'))-top($('#game'));const view={...frame,overlayControls:viewportUI?.overlayControls===true,crowdBottom:Math.max(frame.height*.52,Math.min(frame.height-6,edge-6))},members=supporterFormation(duel,this.artTime,this.reducedMotion,view);
  this.supporterSprites.forEach((sprite,i)=>{const m=members[i];sprite.setVisible(!!m);if(!m)return;sprite.setTexture(m.asset).setPosition(m.x,m.y).setScale(m.height/sprite.texture.getSourceImage().height).setFlipX(m.direction<0).setRotation(m.rotation).setAlpha(m.alpha).setDepth((m.charging?-1:-3)+m.row*.1);});
  const g=this.crowdRush,flags=this.supporterFlags;g.clear();flags.clear();this.crowdRushLabels.forEach(t=>t.setVisible(false));this.supporterFlagLabels.forEach(t=>t.setVisible(false));
  const z=frame.zoom,W=frame.width,H=frame.height,world=(x,y)=>({x:frame.x+(x-W/2)/z,y:frame.y+(y-H/2)/z});
  for(const [i,f] of [duel.player,duel.enemy].entries()){
   const own=members.filter(m=>m.side===f.id),bearer=own.find(m=>m.flag);if(!bearer)continue;
   const r=duel.rallies.find(r=>r.owner===f),color=bearer.color,flag=supporterFlagLayout(bearer,frame);
   // Name-only banners stay above the raised fist, behind the fighters. Color
   // still identifies gold/cyan teams when both fighters choose the same name.
   flags.setDepth(-.45);
   if(flag.visible){
    flags.lineStyle(2/z,0x17323b,bearer.alpha);flags.lineBetween(flag.grip.x,flag.grip.y,flag.poleTop.x,flag.poleTop.y);
    flags.fillStyle(color,bearer.alpha);flags.fillRoundedRect(flag.x-flag.width/2,flag.y-flag.height/2,flag.width,flag.height,3/z);flags.lineStyle(1.5/z,0x17323b,bearer.alpha);flags.strokeRoundedRect(flag.x-flag.width/2,flag.y-flag.height/2,flag.width,flag.height,3/z);
    this.supporterFlagLabels[i].setVisible(true).setDepth(-.4).setPosition(flag.x,flag.y).setScale(1/z).setFontSize(flag.fontSize).setFontStyle('bold').setText(flag.text).setAlpha(bearer.alpha);
   }
   if(!r)continue;
   const warning=r.age<RALLY.warning,sign=r.direction,x=r.x??r.startX;
   if(!warning&&!this.reducedMotion)for(const m of own){g.lineStyle(2/z,color,.7);g.lineBetween(m.x-sign*30,m.y-12,m.x-sign*13,m.y-12);}
   // Feedback follows the real moving front. No locked-target ring or table hit.
   const waveScreen=W/2+(x-frame.x)*z,groundScreen=H/2+(GROUND-frame.y)*z;
   const visible=waveScreen>-45&&waveScreen<W+45,labelPoint=world(Math.max(52,Math.min(W-52,waveScreen)),Math.max(40,groundScreen-104*z-30));
   const caption=warning?'集合！':r.tooHigh&&!r.result?'太高啦！':r.result==='miss'?'撲空！':r.result==='blocked'?'擋住！':r.result==='hit'?'撞到了！':'借過！';
   this.crowdRushLabels[i].setVisible(visible).setPosition(labelPoint.x,labelPoint.y).setScale(1/z).setRotation(this.reducedMotion?0:i?-.055:.055).setStroke('#17323b',4).setFontSize(W<480?18:23).setColor(i===0?'#ffe49a':'#a7f5ff').setText(caption);
   if(r.tooHigh&&!r.result&&visible){
    // A tiny crossed-out step makes the failed climb a joke, not a second attack.
    const q={x:x+sign*24,y:GROUND-104};g.lineStyle(2/z,color,.85);g.lineBetween(q.x,q.y+18/z,q.x,q.y);g.lineBetween(q.x,q.y,q.x-sign*5/z,q.y+6/z);g.lineBetween(q.x,q.y,q.x+sign*5/z,q.y+6/z);g.lineStyle(2/z,0xf77862,.9);g.lineBetween(q.x-5/z,q.y+7/z,q.x+5/z,q.y+14/z);
   }
  }
 }

 paintItem(kind,x,y,scale=1,rotation=0,flip=false){
  const a=ITEM_ART[kind];if(!a)return;let im=this.itemSprites[this.itemUsed];if(!im){im=this.add.image(0,0,a.key).setDepth(3);this.itemSprites.push(im);}this.itemUsed++;im.setTexture(a.key).setPosition(x,y).setDisplaySize(a.width*scale,a.height*scale).setRotation(rotation).setFlipX(flip).setVisible(true);
 }
 drawStageItems(time){
  this.itemUsed=0;this.itemSprites.forEach(im=>im.setVisible(false));
  const g=this.itemGraphics;g.clear();for(const item of duel.items||[]){
   const falling=item.state==='falling';g.lineStyle(2,falling?0xe4ae46:0x3c8b80,falling?.65:.5);g.strokeEllipse(item.x,GROUND+1,48,12);
   if(falling){g.lineStyle(1,0xe4ae46,.3);g.lineBetween(item.x,item.y+15,item.x,GROUND-8);}
   this.paintItem(item.kind,item.x,item.y-15,1,falling?Math.sin(time*.004)*.2:0);
  }
  for(const f of [duel.player,duel.enemy]){
   if(performanceGuardActive(f)){g.lineStyle(3,0xedba50,.8);g.strokeEllipse(f.x,GROUND+2,97,18);}
  }
  const held=duel.player.item,enemyHeld=duel.enemy.item,name=k=>STAGE_ITEMS[k]?.label||'道具';
  const status=held?itemActorName(duel.player,duel.enemy,CAST)+'持有'+name(held.kind)+' · 按攻擊丟出':duel.items?.some(i=>i.state==='falling')?'道具要來了！走近自動拿':duel.items?.some(i=>i.state==='ground')?'走近拿道具 · 攻擊鍵投擲':'隨機掉落道具 · 走近自動拿';
  const nearest=(duel.items||[]).filter(i=>i.state==='ground').sort((a,b)=>Math.abs(a.x-duel.player.x)-Math.abs(b.x-duel.player.x))[0];
  const direction=!held&&nearest?' · '+(nearest.x<duel.player.x?'←':'→'):'';
  const copy=status+direction+(enemyHeld?'｜'+itemActorName(duel.enemy,duel.player,CAST)+'拿著'+name(enemyHeld.kind):'');if(copy!==this.itemHudCopy){this.itemHudCopy=copy;$('#item-status').textContent=copy;$('#item-status').classList.toggle('has-item',!!held);const punch=$('.punch');punch.querySelector('span').textContent=held?'投擲':'攻擊';punch.querySelector('small').textContent=held?name(held.kind):'按住連打';}
 }
 fighterPresentation(f,time,finish=false){
  const record=retainSpitEpisode(this.spitStart.get(f),f,time);if(!record)this.spitStart.delete(f);
  const spit=activeSpitAge(f,time,record?.time);
  const recordMove=finish?null:this.moveBeats?.get(f);
  const renderF=f.attack?.kind==='item_throw'?{...f,attack:{...f.attack,kind:'punch',variant:'right'}}:presentationFighter(f,recordMove?{kind:recordMove.kind,age:(time-recordMove.started)/1000}:null);
  return {renderF,spit,impact:record?.impact};
 }
 currentItemPose(f){const {renderF,spit,impact}=this.fighterPresentation(f,this.artTime);return fighterArtPose(renderF,this.artTime,spit,impact);}
 drawFighter(g,f,time,i){
  const finishView=matchFinish?finishFighterView(matchFinish,i,this.finishBeat):null;if(finishView){f=finishView.fighter;time=this.finishBeat.artTime;}
  const texture=this.artCanvases[i],ctx=texture.getContext();ctx.clearRect(0,0,512,384);ctx.save();ctx.translate(256,350);
  const {renderF,spit,impact}=this.fighterPresentation(f,time,!!finishView);
  const pose=f.mobKind?drawChallengeMob(ctx,this.artImages,renderF,time):drawFighterArt(ctx,this.artImages,renderF,time,{spit,impact,shadow:false});this.lastArtPose.set(f,pose);ctx.restore();
  const rig=this.rigs[i];rig.setPosition(f.x,f.y);rig.setScale(f.face,1);rig.setRotation(finishView?.rotation||0);rig.setAlpha(f.flash>0&&Math.sin(time*.09)>0?.68:1);
  if(!f.mobKind&&!finishView&&f.type==='wang'&&pose.roll>.6&&time-this.trailClock[i]>110){this.trailClock[i]=time;const ghost=this.add.image(f.x-f.face*40,f.y-95,'wang-roll').setDisplaySize(112,112).setAlpha(.16).setFlipX(f.face<0).setRotation(pose.rollAngle*f.face);this.tweens.add({targets:ghost,alpha:0,duration:180,onComplete:()=>ghost.destroy()});}
 }
 drawProjectiles(time,g){
  let used=0,labels=0;
  const sprite=(frame,x,y,w,h,rotation=0,alpha=1,atlas='art-props',flipX=false)=>{let im=this.propPool[used];if(!im){im=this.add.image(0,0,atlas,frame).setDepth(3);this.propPool.push(im);}used++;im.setTexture(atlas,frame).setPosition(x,y).setDisplaySize(w,h).setRotation(rotation).setFlipX(flipX).setAlpha(alpha).setVisible(true);};
  const label=(x,y,copy,color='#fff8e8',size=16)=>{let t=this.markerPool[labels];if(!t){t=text(this,0,0,'',size,color).setOrigin(.5).setDepth(4).setStroke('#142b32',3);this.markerPool.push(t);}labels++;t.setPosition(x,y).setText(copy).setColor(color).setFontSize(size).setAlpha(1).setStroke('#142b32',3).setVisible(true);};
  for(const q of duel.obstacles||[]){if(q.dead)continue;g.lineStyle(5,0xab4e3c,.9);g.lineBetween(q.x-35,GROUND-2,q.x+35,GROUND-2);sprite('queue',q.x,GROUND-37,92,74,0,Math.min(1,q.life*3),'signature-props');label(q.x,GROUND-87,'地面攔停','#ffe0ab',15);}
  const holder=[duel.player,duel.enemy].find(f=>f.grabPose>0),held=[duel.player,duel.enemy].find(f=>f.grabbedPose>0);
  if(holder&&held){const wrist=f=>{const p=this.lastArtPose.get(f);return {x:f.x+f.face*((p?.arm.wrist.x??33)+(p?.bodyX??0)),y:f.y+(p?.arm.wrist.y??-133)+(p?.bodyY??0)}};const a=wrist(holder),b=wrist(held),x=(a.x+b.x)/2,y=(a.y+b.y)/2,w=Math.hypot(b.x-a.x,b.y-a.y)+20,rotation=Math.atan2(b.y-a.y,Math.abs(b.x-a.x));
   this.lastClasp={x,y,w,rotation,face:holder.face,at:time};
   for(const [grow,alpha] of [[34,.10],[18,.18],[0,.26]]){g.fillStyle(0xffd568,alpha);g.fillEllipse(x,y,w+grow,SIGNATURE_SIZE.grip.glow+grow);}
   sprite('clasp',x,y,w,SIGNATURE_SIZE.grip.height,rotation,1,'handshake-grip',holder.face<0);
  }else if(this.lastClasp&&time-this.lastClasp.at<320){const c=this.lastClasp,alpha=.42*(1-(time-c.at)/320);sprite('clasp',c.x,c.y,c.w+14,SIGNATURE_SIZE.grip.height+8,c.rotation,alpha,'handshake-grip',c.face<0);}
  for(const f of [duel.player,duel.enemy]){const v=fighterGazeGlyph(f);if(!v)continue;const x=f.x+f.face*v.x,y=f.y+v.y;
   g.lineStyle(7,0xf5d96b,.5*v.alpha);g.lineBetween(f.x+f.face*45,f.y-195,x,y);label(x,y,'人','#fff0ad',v.size*v.scale);this.markerPool[labels-1].setAlpha(v.alpha).setStroke('#315f8b',7);
  }
  for(const f of [duel.player,duel.enemy]){const item=f.item||(f.attack?.kind==='item_throw'&&!f.attack.fired?{kind:f.attack.itemKind,carryHand:f.attack.carryHand}:null);if(!item)continue;const pose=this.lastArtPose.get(f);if(!pose)continue;item.carryHand??=chooseCarryHand(pose);const a=heldItemAnchor({...f,item},pose,item.carryHand);if(a)this.paintItem(item.kind,a.x,a.y,a.scale,a.rotation,a.flip);}
  for(const p of duel.projectiles){
   const direction=p.vx<0?-1:1;
   if(p.kind==='paper'||p.kind==='rubber_duck'){this.paintItem(p.kind,p.x,p.y,1.05,p.kind==='paper'?time*.008:Math.sin(time*.013)*.12);}
   else if(p.kind==='coin'){for(let j=2;j>=0;j--)sprite('coin',p.x-direction*j*19,p.y,26,27,time*.006,j===0?1:.21);}
   else if(p.kind==='dream'){sprite('dream',p.x,p.y,SIGNATURE_SIZE.dream.width,SIGNATURE_SIZE.dream.height,Math.sin(time*.008)*.06,1,'signature-props',p.vx<0);if(p.phase==='return')label(p.x,p.y+47,'↶ 回程','#d0f4d9',15);}
   else if(p.kind==='arrow'||p.kind==='word'){
    const word=p.kind==='word',width=word?92:110,color=word?0x367e8a:0xbe4033;
    g.lineStyle(3,color,.9);g.strokeEllipse(p.targetX,GROUND,width,19);g.fillStyle(color,.13);g.fillEllipse(p.targetX,GROUND,width,15);
    label(p.targetX,GROUND+16,word?'落字':'落箭',word?'#295e66':'#893b2c',15);
    if(word){const {width:w,height:h,size}=SIGNATURE_SIZE.word,x=p.x+nameTileOffset(p.age||0,.56,direction);g.fillStyle(0xfff7e5,.98);g.fillRoundedRect(x-w/2,p.y-h/2,w,h,10);g.lineStyle(4,color);g.strokeRoundedRect(x-w/2,p.y-h/2,w,h,10);label(x,p.y,'賴祥德','#fff8dc',size);}
    else{const v=arrowPresentation(p);sprite('arrow',v.x,v.y,v.width,v.height,v.angle);}
   }
   if(p.reflected){g.lineStyle(2,0xe8bc4a,.8);g.strokeCircle(p.x,p.y,21);label(p.x,p.y+32,'↶ 反射','#ffe2a4',15);}
   if((p.kind==='coin'||p.kind==='dream')&&(p.age||0)<.11){g.lineStyle(2,0xb2a179,.55);g.lineBetween(p.owner.x+p.owner.face*48,p.owner.y-206,p.x,p.y);}
  }
  for(let i=used;i<this.propPool.length;i++)this.propPool[i].setVisible(false);
  for(let i=labels;i<this.markerPool.length;i++)this.markerPool[i].setVisible(false);
 }

 popup(x,y,word,color='#fff8dd',size=24,options={}){
  let t=this.textPool.find(v=>!v.visible);if(!t){if(this.textPool.length<24){t=text(this,x,y,word,size,color).setOrigin(.5).setDepth(6);this.textPool.push(t);}else t=this.textPool.reduce((a,b)=>a.popupStarted<b.popupStarted?a:b);}
  const hide=v=>{v.setVisible(false);v.bubble?.setVisible(false);v.subtitle?.setVisible(false);v.burst?.setVisible(false);v.captionActor=null;};
  const cancel=v=>{for(const target of [v,v.bubble,v.subtitle])if(target)this.tweens.killTweensOf(target);};
  if(options.actor)for(const other of this.textPool)if(other!==t&&other.captionActor===options.actor){cancel(other);hide(other);}
  cancel(t);t.bubble?.setVisible(false);t.subtitle?.setVisible(false);t.burst?.setVisible(false);t.captionActor=options.actor||null;t.captionSpec=options.caption||null;t.captionLayout=null;
  t.popupStarted=this.time.now;t.setPosition(x,y).setText(word).setFontSize(size).setColor(color).setStroke('#142b32',4).setShadow(0,0,'#000',0,false,false).setRotation(0).setScale(1).setAlpha(1).setVisible(true);
  if(options.bubble){
   t.setColor(options.actor?.id==='enemy'?'#a5f4ff':'#ffdf79').setStroke('#102934',6).setShadow(3,4,'#071b25',2,true,true).setFontStyle('bold italic').setAlign('center');
   // All timing is updated with the same scene clock; the board and subtitle
   // remain hidden even when this pooled text previously displayed a bubble.
  }else this.tweens.add({targets:t,y:y-20,alpha:0,duration:850,ease:'Cubic.Out',onComplete:()=>hide(t)});
 }

 banner(copy,fictional=true){const el=$('#broadcast');el.textContent=copy;const note=document.createElement('small');note.textContent=fictional?'語錄／迷因改編 · 動作虛構 · 音訊狀態見來源':'來源語句 · 招式效果虛構';el.append(note);el.classList.remove('hidden');this.combatOverlay?.refresh();this.lastBroadcast=this.time.now;}
 wordBlast(f,word){this.popup(f.x,displayY(f)-150,word,'#fff0be',Math.min(24,Math.floor(210/Math.max(1,[...word].length))))}

 event(e){
  // The selected helper move speaks only when its real warning ends. Use the
  // helper actor's lane even when its character matches either main fighter.
  if(challengeRun&&handleChallengeEvent(e,this))return;
  if(e.type==='assistStart'){playConfiguredVoice(e.kind,false,e.assist.actor);return;}
  // Helper moves never impersonate either main fighter, including mirrors.
  if(e.assist===true&&!['hit','block','over'].includes(e.type))return;
  if(e.type==='move'&&!e.assist&&!e.f?.isAssist){
   this.spitStart.delete(e.f);const cast=CAST[e.f.type],kind=e.kind||e.f.attack?.kind,view=movePresentation(e.f,kind);
   if(sound&&voiceEnabled&&playableVoice(kind))playConfiguredVoice(kind,false,e.f);
   const caption=moveCaption(kind),pos=captionPosition(e.f,duel.other(e.f),caption?.width,this.cameraView);
   if(caption)this.popup(pos.x,pos.y,caption.text,'#173c43',caption.size,{bubble:true,caption:{...caption,kind},actor:e.f});
   this.moveBeats??=new WeakMap();this.moveBeats.set(e.f,{kind,started:this.artTime||0,x:e.f.x,y:e.f.y,face:e.f.face||1});
   if(kind?.includes('_'))this.banner(view.banner,view.fictional);
   else if(['rush','counter'].includes(kind))this.banner(view.banner);
   sfx(kind);
  }
  if(['hit','block'].includes(e.type)){const hitY=impactY(e)+(duel.depthMode?(e.to.depth??0)*.65:0);this.popup(e.to.x,hitY-14,e.type==='block'?(e.assist?'助拳被擋住':'擋住了'):e.assist?'助拳命中！':e.impact==='item_rubber_duck'?'嘎！':e.impact==='item_paper'?'紙花！':e.combo>1?`${e.combo} 連段！`:'啪！',e.type==='block'?'#a7ece3':'#fff6c9',e.combo>1?29:36);this.popup(e.to.x+40,displayY(e.to)-220,'−'+Math.round(e.amount),'#fff6c9',22);if(e.type==='hit'&&!this.reducedMotion)this.cameras.main.shake(95,.005);const sparks=this.add.graphics();sparks.lineStyle(5,0xffdc65);for(let i=0;i<9;i++){const a=i*Math.PI/4.5;sparks.lineBetween(e.to.x+Math.cos(a)*20,hitY+Math.sin(a)*20,e.to.x+Math.cos(a)*59,hitY+Math.sin(a)*59);}this.tweens.add({targets:sparks,alpha:0,duration:200,onComplete:()=>sparks.destroy()});sfx(e.type);}
  else if(e.type==='counter'){const legacy=e.f.type==='wang',move=CAST[e.f.type].moves.find(m=>m.kind===e.kind||m.behavior==='counter');this.wordBlast(e.f,legacy?'游刃有餘':move?.name||'反擊成功');this.banner(legacy?'從容不是慢，是等你先出糗。':'笑容沒收起，攻勢先化解。');sfx('counter');}
  else if(e.type==='counterMiss'){this.popup(e.f.x,displayY(e.f)-255,e.f.type==='wang'?'從容失敗':'等太久了','#bddfe1',23);sfx('whiff');}
  else if(e.type==='spit'){const p=this.lastArtPose.get(e.f);this.spitStart.set(e.f,{time:this.artTime,impact:p?{wrist:{x:p.arm.wrist.x,y:p.arm.wrist.y-p.bob},headAngle:p.headAngle}:null});this.banner('水還沒喝到，先喝了一拳。');sfx('spit');}
  else if(e.type==='heal'){this.popup(e.f.x,displayY(e.f)-245,'喝到了！ +'+(e.amount??10),'#a5f0bc',28);this.banner('這杯水，喝得很有戰術。');sfx('heal');}
  else if(e.type==='arrowMark'){this.popup(e.x,GROUND-34,'離開落點！','#ffe0a1',20);}
  else if(e.type==='arrowMiss'){this.banner('人沒射到，地板先中箭。');const flag=text(this,e.x,GROUND-45,'↙ 沒中',22,'#fff6df');flag.setText('沒中 ↙').setFontSize(22).setStroke('#142b32',4);this.tweens.add({targets:flag,alpha:0,duration:900,onComplete:()=>flag.destroy()});sfx('whiff');}
  else if(e.type==='guardBreak'){this.popup(e.f.x,displayY(e.f)-205,'破防！','#ffbb96',29);this.banner('擋太久，耐力先破了。');sfx('block');}
  else if(e.type==='reflect'){this.popup(e.f.x,displayY(e.f)-272,'拒收，原路退回！','#ffe1a1',22);sfx('counter');}
  else if(e.type==='reject'){this.popup(e.f.x,displayY(e.f)-185,'不欠你，擋回去！','#e4c8ef',22);sfx('block');}
  else if(e.type==='erase'){this.popup(e.f.x,displayY(e.f)-250,'咳掉了！','#e1d9c4',20);sfx('whiff');}
  else if(e.type==='capture'){this.popup((e.from.x+e.to.x)/2,Math.min(displayY(e.from),displayY(e.to))-90,'握住了！','#f4d58c',30);sfx('hit');}
  else if(e.type==='queuePlant'){this.popup(e.f.x+e.f.face*85,GROUND-110,'先排隊！','#ffd9a6',21);}
  else if(e.type==='queueBreak'){this.popup(e.x,GROUND-90,'隊線散了','#f4d4b1',19);}
  else if(e.type==='armor'){this.popup(e.f.x+e.f.face*90,displayY(e.f)-88,'護甲就緒','#b8f0ed',22);}
  else if(e.type==='armorAbsorb'){this.popup(e.f.x+e.f.face*90,displayY(e.f)-88,'痛，但不停手','#b8f0ed',22);sfx('block');}
  else if(e.type==='calm'){this.popup(e.f.x,displayY(e.f)-250,'大事化小…','#d4efd6',22);}
  else if(e.type==='wallBounce'||e.type==='wallHit'){this.popup(e.f.x,displayY(e.f)-230,'牆也聽到了！','#e4c8ef',22);sfx('hit');}
  else if(e.type==='slow'){this.popup(e.f.x,displayY(e.f)-220,'被字絆一下','#bbe5e4',21);}
  else if(e.type==='itemPickup'){if(e.f.item){e.f.item.carryHand=chooseCarryHand(this.lastArtPose.get(e.f));this.carryHands.set(e.f.item,e.f.item.carryHand);}this.banner(itemActorName(e.f,e.f.id==='player'?duel.enemy:duel.player,CAST)+'拿到'+(e.item.kind==='rubber_duck'?'吱吱鴨':'紙團')+'！');sfx('heal');}
  else if(e.type==='rally'){playCrowdCheer();}
  else if(e.type==='rallyResult'){this.popup(e.result==='miss'?e.r.x:e.to.x,GROUND-100,e.result==='miss'?(e.r.tooHigh?'桌上太高啦！':'躲開了！'):e.result==='blocked'?'格擋 −'+e.amount:'命中 −'+e.amount,e.result==='hit'?'#ffe084':'#d0f7fa',22);}
  else if(e.type==='itemThrow'){this.banner(e.kind==='rubber_duck'?'橡皮鴨出勤，嘎！':'紙團出動，請收件！');}
  else if(e.type==='performanceGuard'){this.popup(e.f.x,displayY(e.f)-280,'讓我演完這一下！','#ffe29a',18);sfx('block');}
  else if(e.type==='over')beginMatchFinish();else if(['launch','jump'].includes(e.type))sfx(e.type);
 }

 updateCaptions(fighters,frame,delta=16){
  // Cache DOM safe areas only when the canvas geometry/layout mode changes.
  const key=[frame.width,frame.height,!!frame.overlayView].join(':');
  if(this.captionViewportKey!==key){
   this.captionViewportKey=key;
   const game=$('#game'),hud=$('.dom-hud'),hudBottom=hud.offsetTop+hud.offsetHeight-(game.offsetTop||0);
   // offset geometry remains logical when the phone shell is rotated 90 degrees.
   this.captionSafe={top:Number.isFinite(hudBottom)?Math.max(12,hudBottom+10):64,bottom:frame.overlayView?100:22};
  }
  for(const t of this.textPool){
   if(!t.visible||!t.captionActor||!t.captionSpec)continue;
   const age=Math.max(0,(this.time?.now??t.popupStarted)-t.popupStarted),beat=shoutCaptionBeat(age,t.captionSpec.duration*1000,this.reducedMotion);
   if(beat.done){t.setVisible(false);t.burst?.setVisible(false);t.subtitle?.setVisible(false);t.captionActor=null;continue;}
   const p=shoutCaptionLayout(t.captionSpec.text,t.captionActor.id,frame,this.captionSafe,{kind:t.captionSpec.kind,actor:t.captionActor.type});t.captionLayout=p;
   t.burst??=this.add.graphics().setDepth(5);
   paintComicAccent(t.burst,p,comicAccentState(age,t.captionSpec.duration*1000,this.reducedMotion));
   t.bubble?.setVisible(false);
   t.subtitle??=text(this,p.x,p.y,'',12,'#fff8df').setOrigin(.5).setDepth(6);
   t.subtitle.setText(p.tag).setFontSize(12/p.zoom).setColor(p.style.accent).setStroke('#102934',4/p.zoom).setPosition(p.x,p.y+(p.tagY-p.screenY)/p.zoom).setAlpha(beat.alpha).setVisible(true);
   t.setText(p.text).setColor(p.color).setAlign('center').setPosition(p.x,p.y).setFontSize(p.size/p.zoom).setStroke('#102934',6/p.zoom).setShadow(4/p.zoom,5/p.zoom,'#071b25',0,true,true).setRotation(p.rotation).setScale(beat.scale).setAlpha(beat.alpha);

  }
 }

 update(time,delta){if(!this.dynamic)return;try{const paintToken=viewportUI?.beginFrame(time);this.updateFrame(time,delta);viewportUI?.frameDrawn(paintToken);}catch(error){viewportUI?.failFrame(error);}}
 updateFrame(time,delta){if(viewportUI?.ready!==false)updateMatchFinish(delta);const plan=planSimulationFrame(delta,{paused:duel.status!=='active'||challengeInputBlocked()}),dt=plan.acceptedMs/1000;this.artTime=(this.artTime||0)+((viewportUI?.ready!==false&&['active','menu','countdown'].includes(duel.status))?planSimulationFrame(delta).acceptedMs:0);if(duel.status==='active'&&!challengeInputBlocked()){duel.itemPose=f=>this.currentItemPose(f);duel.itemOrigin=(f,a)=>heldItemAnchor({...f,item:{kind:a.itemKind}},duel.itemPose(f),a.carryHand);punchWait-=dt;if(hold.punch&&punchWait<=0){duel.press('punch');punchWait=.33;}const current=duel;for(const step of plan.steps){if(duel!==current||duel.status!=='active'||challengeInputBlocked())break;duel.step(step,hold);}const emitted=current.events.splice(0),routeBatch=!!challengeRun&&current instanceof ChallengeRoute;if(routeBatch)handleChallengeFrameEvents(emitted,this);for(const e of emitted)if(!routeBatch||!['enemyDefeated','routeGate'].includes(e.type))this.event(e);drainVoiceCues();}if(this.time.now-this.lastBroadcast>1700)$('#broadcast').classList.add('hidden');
  const isRoute=duel instanceof ChallengeRoute,isChallengeArena=!!challengeRun&&!isRoute,fs=[duel.player,duel.enemy];const sw=this.scale.width,sh=this.scale.height,cam=this.cameras.main;let frame=isRoute?routeCameraFrame(sw,sh,duel,{overlay:viewportUI?.overlayControls===true,portrait:viewportUI?.frame?.width<viewportUI?.frame?.height,fullStage:true,touch:viewportUI?.frame?.touch===true,landscapePreview:viewportUI?.frame?.fullBleed===true,camera:viewportUI?.camera,paused:duel.status==='paused',previous:this.cameraDuel===duel?this.cameraView:null,delta,...this.combatOverlay?.cameraSafety,safe:{left:viewportUI?.frame?.safeLeft||0,right:viewportUI?.frame?.safeRight||0,top:viewportUI?.frame?.safeTop||0,bottom:viewportUI?.frame?.safeBottom||0}}):matchFinish?.camera;const cameraOptions={touch:viewportUI?.frame?.touch===true,portrait:viewportUI?.frame?.width<viewportUI?.frame?.height,nativeLandscape:viewportUI?.nativeLandscape===true,cameraMode:viewportUI?.camera,assists:duel.assists,...this.combatOverlay?.cameraSafety,measuredCameraSafety:Array.isArray(this.combatOverlay?.cameraSafety?.occlusions)?this.combatOverlay.cameraSafety.measuredCameraSafety:false};
  if(!frame||frame.width!==sw||frame.height!==sh||!isRoute&&!canReuseCameraFrame(frame,sw,sh,cameraOptions)){
   const frozenFinish=matchFinish?.camera?.playerFixedCamera?matchFinish.camera:null;
   frame=fullStageCameraFrame(viewportUI?.camera==='stable'?fixedStableCameraFrame:cameraFrame,sw,sh,fs,frozenFinish??(this.cameraDuel===duel?this.cameraView:null),delta,{...cameraOptions,paused:!!frozenFinish||duel.status==='paused'});if(matchFinish)matchFinish.camera=frame;
  }this.cameraDuel=duel;this.cameraView=frame;cam.setViewport(0,0,sw,sh);cam.setZoom(frame.zoom);cam.centerOn(frame.x,frame.y);this.arenaBackdrop.setVisible(!isRoute&&!isChallengeArena);(this.chamberDeskLayers||[]).forEach(v=>v.setVisible(!isRoute&&!isChallengeArena));this.backdropExtensions.forEach(v=>v.setVisible(!isRoute&&!isChallengeArena));this.boundaryGraphics.setVisible(!isRoute&&!isChallengeArena);this.ambient.setVisible(!isRoute&&!isChallengeArena);
  this.combatOverlay?.draw({route:!!duel.depthMode,images:this.artImages,time:this.artTime,reducedMotion:this.reducedMotion,cameraFrame:frame,world:duel,hintsActive:duel.status==='active'&&viewportUI?.ready!==false&&!challengeInputBlocked()&&!matchFinish&&!homeRequested&&!$('#help-dialog').open&&$('#result').classList.contains('hidden')&&$('.app').dataset.titleOpen!=='true'});
  if(isRoute){this.itemUsed=0;this.challengeRenderer.draw(duel,this.artTime,frame,{fighterView:f=>this.fighterPresentation(f,this.artTime),onPose:(f,p)=>this.lastArtPose.set(f,p),reducedMotion:this.reducedMotion,skipMic:!!this.combatOverlay});this.rigs[1].setVisible(false);this.rigs[0].setVisible(!duel.depthMode);if(!duel.depthMode)this.drawFighter(this.chars[0],duel.player,this.artTime,0);this.supporterSprites.forEach(v=>v.setVisible(false));this.crowdGraphics.clear();this.crowdRush.clear();this.supporterFlags.clear();[...this.crowdRushLabels,...this.supporterFlagLabels].forEach(v=>v.setVisible(false));this.itemSprites.forEach(v=>v.setVisible(false));this.itemGraphics.clear();$('#item-status').textContent=duel.depthMode?'上下左右走位 · 空白鍵／跳躍鍵 · 打小怪得經驗 · 向右前進':'← → 移動轉向 · 跳上攤台 · ↓ 下台 · 打小怪得經驗 · 向右前進';}
  else{if(isChallengeArena)this.challengeRenderer.drawArena(challengeRun.phase.section??2,this.artTime,frame);else{this.challengeRenderer.hide();this.updateBackdrop(this.artTime,frame);}this.rigs[0].setVisible(true);this.rigs[1].setVisible(true);this.drawStageItems(this.artTime);this.drawCrowd(frame);fs.forEach((f,i)=>this.drawFighter(this.chars[i],f,this.artTime,i));}this.assistRenderer.draw(duel,this.artTime,{hidden:!!matchFinish||!!duel.depthMode,reducedMotion:this.reducedMotion});let g=this.dynamic;g.clear();
  for(const f of duel.depthMode?[]:fs){if(f.attack?.kind==='su_rush'&&[.22,.42,.62].some(a=>f.attack.age>=a&&f.attack.age<a+.1)){g.lineStyle(6,0xc48230,.8);g.strokeEllipse(f.x+f.face*54,GROUND-16,92,26);g.lineStyle(3,0xffe2a8,.8);g.lineBetween(f.x-f.face*20,GROUND-12,f.x+f.face*105,GROUND-12);}
   const scale=1-Math.min(.25,Math.max(0,GROUND-f.y)/560);g.fillStyle(ink,.16);g.fillEllipse(f.x,(f.supportY??GROUND)+1,88*scale,14*scale);}
  if(!matchFinish){if(!duel.depthMode)this.drawProjectiles(this.artTime,g);else{for(const im of this.propPool)im.setVisible(false);for(const label of this.markerPool)label.setVisible(false);}this.updateCaptions(fs,frame,delta);}else{for(const im of this.propPool)im.setVisible(false);for(const label of this.markerPool)label.setVisible(false);}

  const assistButton=$('[data-action="assist"]'),assistState=duel.player.assist,assistReady=duel.status==='active'&&!!duel.assistReady?.(duel.player);
  assistButton.disabled=!assistReady;assistButton.classList.toggle('ready',assistReady);assistButton.querySelector('.assist-label').textContent=assistState?.active?'登場中':assistState?.used&&!(gameMode==='training'&&trainingRepeat)?'受傷集氣':'可登場';
  assistButton.style.setProperty('--assist-charge',assistMeterView(duel.player).charge+'%');renderChargeMeter(assistButton,{charge:assistMeterView(duel.player).charge,ready:assistReady,active:assistState?.active});
  assistButton.setAttribute('aria-label',`助拳 ${CAST[playerAssist].name}，${assistButton.querySelector('.assist-label').textContent}，鍵盤 H`);
  const assistEpisodes=duel.status==='active'?(duel.assists||[]):[],assistStamp=assistEpisodes.map(a=>[a.owner.id,a.helper,a.phase,a.kind].join(':')).join('|');
  if(assistStamp!==this.assistStamp){this.assistStamp=assistStamp;$('#assist-warning').replaceChildren(...assistEpisodes.map(a=>{const el=document.createElement('span');el.className='assist-callout '+a.owner.id;el.dataset.phase=a.phase;el.textContent=`${a.owner.id==='player'?'我方':'對手'}助拳 · ${CAST[a.helper].name}｜${a.phase==='warning'?'即將登場！':a.name||'支援一擊'}`;return el;}));}
  const rallyButton=$('[data-action="rally"]'),meter=rallyMeterView(duel.player.rally,duel.status);
  rallyButton.style.setProperty('--charge',meter.fill+'%');rallyButton.disabled=meter.disabled;rallyButton.classList.toggle('ready',meter.ready);rallyButton.querySelector('.rally-label').textContent=meter.label;rallyButton.setAttribute('aria-label',meter.aria);renderChargeMeter(rallyButton,{charge:duel.player.rally,ready:meter.ready});
  const warnings=duel.rallies.filter(r=>r.age<RALLY.warning);$('#rally-warning').textContent=warnings.length?(warnings.length>1?'雙方揪團！':warnings[0].owner.id==='player'?'你的支持者集合！':'對方支持者集合！')+'地面衝鋒：跳躍／上桌／格擋':'';
  const stamp=[fs[0].type,fs[1].type,Math.ceil(fs[0].hp),Math.ceil(fs[1].hp),isRoute?Math.round(duel.routeProgress*100):Math.ceil(duel.remaining)].join(':');if(stamp!==this.hudCache){this.hudCache=stamp;$('#p-name').textContent=CAST[fs[0].type].name;$('#e-name').textContent=isRoute?'街頭搗蛋鬼':fs[1].displayName||CAST[fs[1].type].name;$('#p-hp').textContent=gameMode==='training'&&trainingInfinite?'∞':Math.ceil(fs[0].hp);$('#e-hp').textContent=gameMode==='training'&&trainingInfinite?'∞':Math.ceil(fs[1].hp);$('#p-fill').style.width=100*fs[0].hp/(fs[0].maxHp||100)+'%';$('#e-fill').style.width=100*fs[1].hp/(fs[1].maxHp||100)+'%';$('#p-fill').style.background=CAST[fs[0].type].colorCSS;$('#e-fill').style.background=CAST[fs[1].type].colorCSS;$('#timer').textContent=isRoute?Math.round(duel.routeProgress*100)+'%':gameMode==='training'?'∞':String(Math.ceil(duel.remaining)).padStart(2,'0');$('#timer').style.color=duel.remaining<10?'#ffa675':'';}
  const guardStamp=fs.map(f=>{const v=guardView(f);return [v.pips,v.broken,combatStatus(f),performanceGuardActive(f),f.item?.kind].join(':')}).join('|');
  if(guardStamp!==this.guardCache){this.guardCache=guardStamp;for(const [i,prefix] of ['p','e'].entries()){const f=fs[i],v=guardView(f),el=$('#'+prefix+'-guard');el.classList.toggle('broken',v.broken);el.setAttribute('aria-label',v.label);el.querySelector('small').textContent=v.label;[...el.querySelectorAll('i')].forEach((pip,j)=>pip.classList.toggle('empty',j>=v.pips));$('#'+prefix+'-status').textContent=combatStatus(f)+(performanceGuardActive(f)?' · 出招保護':'')+(f.item?' · 持有'+STAGE_ITEMS[f.item.kind].label:'');}}
  fs.forEach((f,i)=>{const status=combatStatus(f),t=this.statusTexts[i];if(duel.depthMode){t.setVisible(false);return;}t.setText(status).setPosition(f.x,f.y-192).setVisible(!!status&&!f.attack);if(f.armor>0){g.lineStyle(3,0x5baab6,.65);g.strokeRoundedRect(f.x-53,f.y-275,106,274,25);}if(f.slow>0){g.lineStyle(3,0x43858b,.8);g.strokeEllipse(f.x,f.y-6,77,17);}});
  CAST[selected].moves.forEach((m,i)=>{renderCooldownButton($(`[data-action="special${i+1}"]`),m,duel.player.cooldowns[i]);});
  this.challengeFrame={serial:(this.challengeFrame?.serial??0)+1,run:challengeRun,duel};
 }

}
try{new Phaser.Game({type:Phaser.CANVAS,parent:'game',width:960,height:540,backgroundColor:'#e7e0c9',antialias:true,roundPixels:false,scene:Arena,input:{touch:{capture:false}},audio:{noAudio:true},scale:{mode:Phaser.Scale.NONE,autoCenter:Phaser.Scale.NO_CENTER},fps:{target:60,forceSetTimeOut:false},render:{powerPreference:'low-power'},callbacks:{}});}catch(e){titleUI?.setReady(false,'遊戲畫面無法啟動，請重新整理或改用支援 Canvas 的瀏覽器。');$('#menu').innerHTML='<div class="paper"><h2>畫面尚未載入</h2><p>請重新整理頁面。此遊戲需要可使用 Canvas 的瀏覽器。</p></div>';console.error(e);}
