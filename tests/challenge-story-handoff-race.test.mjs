import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
import {allUnlockedStorage} from './helpers/profile-fixtures.mjs';
import {memoryStorage,serialLocks} from './helpers/formal-flow-fixtures.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {Duel,CAST} from '../dist/core.mjs';
import {MatchSeries} from '../dist/match-modes.mjs';
import {saveIssueText} from '../dist/save-copy.mjs';
import {challengeOpponentStats} from '../dist/challenge-opponent-policy.mjs';
const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b));
const settle=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
const key='taiwanpunchline-challenge-v4';

// Real store/session/preparation/story/entry/startRound/newDuel and keyboard
// handler. Only Phaser frame delivery, audio, geometry and clock are boundaries.
// jsdom has no native Enter default activation: the explicit click below models
// that browser boundary and is NOT a real-browser keyboard acceptance claim.
async function fixture(t,{checkpoint=5,legacyOpening=false,storage=memoryStorage()}={}){
 const characterId=legacyOpening?'ma':'wang';
 if(legacyOpening)storage=allUnlockedStorage(storage);
 const f=await starterGameEntry({storage,characterId});t.after(()=>f.close());
 const c=f.context,timers=new Map();let serial=0;
 const noop=()=>{};Object.assign(c,{Duel,CAST,MatchSeries,challengeOpponentStats,saveIssueText,opponent:'han',enemyAssist:'wang',roundFormat:'single',trainingBehavior:'stand',trainingInfinite:true,trainingRepeat:true,trainingRestartGate:null,homeRequested:false,sanitizeSelections:noop,sfx:noop,unlockMusic:noop,viewportUI:null,keys:{},heldKeys:new Set(),hold:{},syncHold:noop,syncActionKeyFeedback:noop,challengeKeyAction:(code,keys)=>keys[code],titleUI:null,moveDemo:null,renderEntryAudio:noop,setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)});
 vm.runInNewContext(section('function nextRound()','function pauseGame()')+'\n'+section('async function restartPreparedEncounter()','restartOpenGate=bindFreshAction')+'\n'+source.split('\n').find(x=>x.startsWith('function newDuel()'))+'\n'+source.split('\n').find(x=>x.startsWith('function challengeInputBlocked()'))+'\n'+section('function showTitle()','function enterFromTitle()')+'\n'+source.split('\n').find(x=>x.startsWith("window.addEventListener('keydown'")),c);
 c.duel=new Duel('wang','easy',undefined,'han');c.duel.status='menu';const original=c.duel;
 const seed=await AsyncChallengeSession.create({progress:f.profiles,characterId});
 for(let i=0;i<(legacyOpening?0:checkpoint);i++){
  const result=await(seed.phase.kind==='route'?seed.routeComplete({}):seed.bossWon({}));assert.equal(result.accepted,true);
 }
 c.endChallenge();
 const events=new EventEmitter(),lifecycle=new EventEmitter();c.scene={artImages:{},reducedMotion:true,game:{events},sys:{events:lifecycle}};
 const render=(frame={run:c.challengeRun,duel:c.duel})=>{c.scene.challengeFrame={serial:(c.scene.challengeFrame?.serial??0)+1,...frame};events.emit('postrender');};
 const tick=()=>{const ready=[...timers.values()];timers.clear();for(const fn of ready)fn();};
 const countdown=()=>{for(let i=0;i<4;i++)tick();};
 const activate=(button,mode='pointer')=>{if(mode==='pointer'){button.click();return;}button.focus();const e=new f.window.KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true});button.dispatchEvent(e);if(!e.defaultPrevented&&!button.disabled)button.click();button.dispatchEvent(new f.window.KeyboardEvent('keyup',{key:'Enter',code:'Enter',bubbles:true}));};
 const finish=(mode='pointer')=>{const b=f.$('[data-story-next]');for(let i=0;i<20&&!b.disabled&&f.$('.challenge-story').open;i++)activate(b,mode);};
 const prepare=async()=>{assert.equal(c.openPreparation({intent:'resume',entry:{characterId,helperId:'han'}}),true);f.$('#preparationConfirm').click();await settle();};
 return {...f,c,storage,original,events,lifecycle,timers,render,tick,countdown,activate,finish,prepare,characterId};
}

for(const checkpoint of [1,3,5])for(const activation of ['pointer','Enter-model'])for(const firstFrame of ['before','after'])test(`checkpoint ${checkpoint} ${activation} completion ${firstFrame} initial frame keeps the intended encounter`,async t=>{
 const f=await fixture(t,{checkpoint});await f.prepare();const run=f.c.challengeRun,attempt=f.profiles.readProfile().campaign.attemptSerial,xp=f.profiles.readProfile().campaign.xp,durable=f.storage.getItem(key);
 if(firstFrame==='after'){f.render();await settle();}
 f.finish(activation);f.finish(activation);await settle();
 assert.equal(f.c.challengeRun,run,'story completion must not cancel its own entry and roll back the saved run');
 if(firstFrame==='before'){assert.equal(f.timers.size,0,'do not begin countdown before initial target presentation');f.render();await settle();}
 assert.equal(f.c.gameMode,'challenge');assert.notEqual(f.c.duel,f.original);assert.equal(f.c.duel.enemy.displayName,checkpoint===1?'擴音隊長':checkpoint===3?'封街總管':'咆哮哥');
 f.render();await settle();f.countdown();await settle();
 assert.equal(f.c.duel.status,'active');assert.equal(f.$('#challengePreparationOverlay').open,false);assert.equal(f.$('.challenge-story').open,false);assert.equal(f.events.listenerCount('postrender'),0);
 assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempt);assert.equal(f.profiles.readProfile().campaign.xp,xp);assert.equal(f.storage.getItem(key),durable,'presentation never rewrites the durable receipt');
});

for(const firstFrame of ['before','after'])test(`legacy opening completion ${firstFrame} initial frame serializes its route handoff`,async t=>{
 const f=await fixture(t,{legacyOpening:true});await f.prepare();const run=f.c.challengeRun,durable=f.storage.getItem(key);
 assert.equal(f.c.duel.status,'story');if(firstFrame==='after'){f.render();await settle();}
 f.finish();await settle();assert.equal(f.c.challengeRun,run,'legacy completion must not invalidate its own first presentation');
 if(firstFrame==='before'){f.render();await settle();}f.render();await settle();
 assert.equal(f.c.gameMode,'challenge');assert.equal(f.c.duel.depthMode,true);assert.equal(f.c.duel.player.type,'ma');assert.equal(f.$('#challengePreparationOverlay').open,false);assert.equal(f.storage.getItem(key),durable);
});

for(const failure of ['shutdown','destroy','context-loss'])test(`${failure} before initial story frame never becomes a successful round and retains its receipt`,async t=>{
 const f=await fixture(t);await f.prepare();const run=f.c.challengeRun,durable=f.storage.getItem(key),attempt=f.profiles.readProfile().campaign.attemptSerial,xp=f.profiles.readProfile().campaign.xp;
 f.finish();await settle();if(failure==='context-loss'){f.c.scene.game.renderer={gameContext:{isContextLost:()=>true}};f.render();}else f.lifecycle.emit(failure);await settle();f.countdown();
 assert.equal(f.c.challengeRun,null);assert.equal(f.c.entryPreparationSession,run);assert.equal(f.c.duel,f.original);assert.equal(f.c.duel.status,'menu');assert.equal(f.c.gameMode,'battle');assert.equal(f.timers.size,0);assert.equal(f.$('#challengePreparationOverlay').open,true);assert.equal(f.$('#preparationConfirm').disabled,true);assert.match(f.$('#challengePreparationStatus').textContent,/配置已保存。遊戲場景目前無法開啟/);assert.equal(f.events.listenerCount('postrender'),0);assert.equal(f.storage.getItem(key),durable);
 // Resume the same committed receipt directly, not a second save/XP award.
 f.c.scene.game.renderer=undefined;const pending=f.c.startChallenge();await settle();assert.equal(f.c.challengeRun,run);f.render();await pending;f.finish();await settle();f.render();await settle();assert.equal(f.c.duel.enemy.displayName,'咆哮哥');assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempt);assert.equal(f.profiles.readProfile().campaign.xp,xp);
});

test('unrelated postrender does not permit a queued story completion to begin a round',async t=>{
 const f=await fixture(t);await f.prepare();const run=f.c.challengeRun;f.finish();await settle();f.render({run:null,duel:{}});await settle();assert.equal(f.c.challengeRun,run);assert.equal(f.c.duel,f.original);assert.equal(f.timers.size,0);assert.equal(f.$('#challengePreparationOverlay').open,true);f.render();await settle();f.render();await settle();assert.equal(f.c.duel.enemy.displayName,'咆哮哥');
});

test('returning home while a story completion awaits its initial frame cannot revive the challenge',async t=>{
 const f=await fixture(t);await f.prepare();const durable=f.storage.getItem(key);f.finish();await settle();f.c.showTitle();f.render();await settle();f.countdown();assert.equal(f.c.challengeRun,null);assert.equal(f.c.duel.status,'title');assert.equal(f.c.gameMode,'battle');assert.equal(f.events.listenerCount('postrender'),0);assert.equal(f.storage.getItem(key),durable);
});

for(const change of ['duel','run','epoch','scene'])test(`a newer ${change} owner is not overwritten by failed story presentation`,async t=>{
 const f=await fixture(t);const pending=f.c.startChallenge();await settle();
 const replacement=new Duel('han','easy',undefined,'wang');replacement.status='menu';
 if(change==='duel')f.c.duel=replacement;else if(change==='run')f.c.challengeRun={newOwner:true};else if(change==='scene')f.c.scene={...f.c.scene};else f.c.challengeOpeningEpoch++;
 const owner={duel:f.c.duel,run:f.c.challengeRun,status:f.c.duel.status};f.render();const result=await pending;await settle();f.countdown();
 assert.equal(result.accepted,false);assert.equal(f.c.duel,owner.duel,'old entry must not restore over a newer duel');assert.equal(f.c.challengeRun,owner.run,'old entry must not restore over a newer run');assert.equal(f.c.duel.status,owner.status);assert.equal(f.timers.size,0);
});

test('quota failure before entry leaves durable bytes and source intact without a countdown',async t=>{
 const storage=memoryStorage(),f=await fixture(t,{storage});const durable=storage.getItem(key);storage.failWrites=true;await f.prepare();f.countdown();assert.equal(f.c.challengeRun,null);assert.equal(f.c.duel,f.original);assert.equal(f.c.duel.status,'menu');assert.equal(storage.getItem(key),durable);assert.equal(f.timers.size,0);assert.equal(f.$('#challengePreparationOverlay').open,true);assert.equal(f.$('.challenge-story'),null);
});

test('save-conflict cancellation before the story frame keeps recovery and cannot start a round',async t=>{
 const f=await fixture(t);Object.assign(f.c,{resultPressGates:new Map(),showRootRecovery:()=>{}});
 await f.prepare();const durable=f.storage.getItem(key);f.finish();await settle();f.c.showChallengeSaveFailure({reason:'stale-run'});f.render();await settle();f.countdown();assert.equal(f.c.challengeSaveBlocked,true);assert.equal(f.$('#result').classList.contains('hidden'),false);assert.notEqual(f.c.duel.status,'active');assert.equal(f.timers.size,0);assert.equal(f.storage.getItem(key),durable);
});

for(const ownership of ['duel','run','epoch'])test(`a countdown cannot activate a different ${ownership} owner`,async t=>{
 const f=await fixture(t);await f.prepare();f.render();await settle();f.finish();await settle();f.render();await settle();assert.equal(f.c.duel.status,'countdown');
 const originalCountdown=f.c.duel,replacement=new Duel();replacement.status='menu';
 if(ownership==='duel')f.c.duel=replacement;else if(ownership==='run')f.c.challengeRun=null;else f.c.challengeOpeningEpoch++;
 f.countdown();assert.notEqual(f.c.duel.status,'active','stale countdown must not activate a source or different runtime');assert.equal(f.timers.size,0);assert.equal(originalCountdown.status,'countdown');
});

for(const change of ['duel','run','epoch','scene','preview-mode','shutdown'])test(`story completion after its first frame rejects a superseded ${change}`,async t=>{
 const f=await fixture(t);let active=true;f.c.scene.sys.isActive=()=>active;f.lifecycle.once('shutdown',()=>{active=false;});
 await f.prepare();f.render();await settle();const durable=f.storage.getItem(key);
 if(change==='duel'){f.c.duel=new Duel();f.c.duel.status='menu';}else if(change==='run')f.c.challengeRun={newOwner:true};else if(change==='epoch')f.c.challengeOpeningEpoch++;else if(change==='scene')f.c.scene={...f.c.scene};else if(change==='preview-mode')f.profiles.enterTestMode();else f.lifecycle.emit('shutdown');
 const owner={run:f.c.challengeRun,duel:f.c.duel,status:f.c.duel.status};f.finish();await settle();f.countdown();
 assert.equal(f.c.challengeRun,owner.run);assert.equal(f.c.duel,owner.duel);assert.equal(f.c.duel.status,owner.status);assert.equal(f.timers.size,0);assert.equal(f.storage.getItem(key),durable);
});

test('scene shutdown during the boss frame acknowledgment cannot finish its countdown',async t=>{
 const f=await fixture(t);let active=true;f.c.scene.sys.isActive=()=>active;f.lifecycle.once('shutdown',()=>{active=false;});
 await f.prepare();f.render();await settle();f.finish();await settle();assert.equal(f.c.duel.status,'countdown');f.lifecycle.emit('shutdown');await settle();f.countdown();assert.notEqual(f.c.duel.status,'active');assert.equal(f.timers.size,0);assert.equal(f.events.listenerCount('postrender'),0);
});

for(const failure of ['context-loss','cancel','reject'])test(`second boss presentation ${failure} offers a working same-receipt display retry`,async t=>{
 const f=await fixture(t);await f.prepare();f.render();await settle();const run=f.c.challengeRun,attempt=f.profiles.readProfile().campaign.attemptSerial,xp=f.profiles.readProfile().campaign.xp,durable=f.storage.getItem(key),present=f.c.presentChallengeScene;
 if(failure==='reject')f.c.presentChallengeScene=()=>Promise.reject(new Error('render acknowledgement rejected'));
 f.finish();await settle();const failedDuel=f.c.duel;
 if(failure==='context-loss'){f.c.scene.game.renderer={gameContext:{isContextLost:()=>true}};f.render();}else if(failure==='cancel')f.c.cancelChallengeSceneHandoff();
 await settle();f.countdown();await settle();
 assert.notEqual(f.c.duel.status,'active','failed destination must not release its countdown');assert.equal(f.timers.size,0);assert.equal(f.$('.challenge-story').open,true,'current saved transition needs a visible recovery');assert.equal(f.$('#challengePreparationOverlay').open,false);assert.match(f.$('.challenge-story .story-copy p').textContent,/已保存.*場景/);
 const retry=f.$('[data-story-next]'),back=f.$('[data-story-return]');assert.equal(retry.textContent,'重試顯示');assert.equal(retry.disabled,false);assert.equal(retry.hidden,false);assert.equal(back.hidden,false);assert.equal(back.disabled,false);
 assert.equal(f.c.challengeRun,run);assert.equal(f.storage.getItem(key),durable);
 f.c.presentChallengeScene=present;f.c.scene.game.renderer=undefined;retry.click();const retried=f.c.duel;retry.click();await settle();assert.equal(f.c.duel,retried,'double retry cannot create another display attempt');assert.notEqual(retried,failedDuel);assert.equal(retried.enemy.displayName,'咆哮哥');assert.equal(f.timers.size,0,'countdown waits for the retried destination frame');
 f.render({run,duel:failedDuel});await settle();assert.equal(f.$('.challenge-story').open,true);assert.equal(f.timers.size,0);f.render();await settle();assert.equal(f.$('.challenge-story').open,false);f.countdown();await settle();assert.equal(f.c.duel.status,'active');assert.equal(f.c.challengeRun,run);assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempt);assert.equal(f.profiles.readProfile().campaign.xp,xp);assert.equal(f.storage.getItem(key),durable);assert.equal(f.events.listenerCount('postrender'),0);
});

test('second boss save conflict keeps its existing recovery paused and does not replace it with display retry',async t=>{
 const f=await fixture(t);Object.assign(f.c,{resultPressGates:new Map(),showRootRecovery:()=>{}});await f.prepare();f.render();await settle();const durable=f.storage.getItem(key);f.finish();await settle();f.c.showChallengeSaveFailure({reason:'stale-run'});await settle();f.countdown();assert.equal(f.c.duel.status,'paused');assert.equal(f.timers.size,0);assert.equal(f.c.challengeSaveBlocked,true);assert.equal(f.$('#result').classList.contains('hidden'),false);assert.equal(f.$('.challenge-story').open,false);assert.equal(f.storage.getItem(key),durable);
});

test('display recovery returns to the overview without changing the committed receipt',async t=>{
 const f=await fixture(t);await f.prepare();f.render();await settle();const durable=f.storage.getItem(key);f.finish();await settle();f.c.cancelChallengeSceneHandoff();await settle();const back=f.$('[data-story-return]');assert.ok(back&&!back.hidden&&!back.disabled);back.click();await settle();f.countdown();assert.equal(f.c.challengeRun,null);assert.equal(f.c.duel.status,'title');assert.equal(f.$('.challenge-story').open,false);assert.equal(f.$('.challenge-dialog').open,true);assert.equal(f.storage.getItem(key),durable);
});

for(const change of ['home','new-story'])test(`second presentation failure never reopens a retired story after ${change}`,async t=>{
 const f=await fixture(t);await f.prepare();f.render();await settle();const durable=f.storage.getItem(key);f.finish();await settle();f.c.cancelChallengeSceneHandoff();if(change==='home')f.c.showTitle();else f.c.story([{title:'另一段故事',speaker:'新場景',copy:'新內容'}],()=>{});await settle();f.countdown();assert.notEqual(f.c.duel.status,'active');assert.equal(f.$('.challenge-story').open,change!=='home');if(change==='new-story')assert.equal(f.$('.challenge-story h2').textContent,'另一段故事');assert.equal(f.storage.getItem(key),durable);
});

test('ordinary battle still starts its countdown immediately without a challenge paint acknowledgment',async t=>{
 const f=await fixture(t);f.c.challengeRun=null;f.c.gameMode='battle';f.c.startRound();assert.equal(f.timers.size,1);f.countdown();assert.equal(f.c.duel.status,'active');assert.equal(f.events.listenerCount('postrender'),0);
});

test('a display retry whose scene stopped meanwhile retains a working return action',async t=>{
 const f=await fixture(t);let active=true;f.c.scene.sys.isActive=()=>active;await f.prepare();f.render();await settle();const durable=f.storage.getItem(key);f.finish();await settle();f.c.cancelChallengeSceneHandoff();await settle();active=false;f.$('[data-story-next]').click();await settle();assert.equal(f.$('.challenge-story').open,true);assert.equal(f.$('[data-story-next]').hidden,true);const back=f.$('[data-story-return]');assert.equal(back.hidden,false);assert.equal(back.disabled,false);back.click();await settle();assert.equal(f.c.challengeRun,null);assert.equal(f.$('.challenge-dialog').open,true);assert.equal(f.storage.getItem(key),durable);
});

test('legacy opening destination failure retries the displayed route without a new saved attempt',async t=>{
 const f=await fixture(t,{legacyOpening:true});await f.prepare();f.render();await settle();const run=f.c.challengeRun,durable=f.storage.getItem(key),attempt=f.profiles.readProfile().campaign.attemptSerial,xp=f.profiles.readProfile().campaign.xp;f.finish();await settle();const failed=f.c.duel;f.c.cancelChallengeSceneHandoff();await settle();assert.equal(failed.status,'paused');assert.equal(f.$('.challenge-story').open,true);const retry=f.$('[data-story-next]');assert.equal(retry.disabled,false);retry.click();await settle();assert.notEqual(f.c.duel,failed);f.render();await settle();assert.equal(f.$('.challenge-story').open,false);assert.equal(f.c.duel.depthMode,true);assert.equal(f.c.duel.player.type,'ma');assert.equal(f.c.duel.status,'active');assert.equal(f.c.challengeRun,run);assert.equal(f.storage.getItem(key),durable);assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempt);assert.equal(f.profiles.readProfile().campaign.xp,xp);
});

async function nonStoryRound(f,caller){
 await f.prepare();f.render();await settle();f.finish();await settle();f.render();await settle();f.countdown();f.c.matchSeries.record('player');
 if(caller==='nextRound')return {pending:f.c.nextRound()};f.c.duel.status='paused';const pending=f.c.restartPausedGame();await settle();return {pending};
}
for(const caller of ['nextRound','restartPausedGame'])for(const failure of ['context-loss','cancel','reject'])for(const action of ['retry','return'])test(`${caller} ${failure} exposes a working ${action} without redoing the saved/series transition`,async t=>{
 const f=await fixture(t);await f.prepare();f.render();await settle();f.finish();await settle();f.render();await settle();f.countdown();f.c.matchSeries.record('player');
 const present=f.c.presentChallengeScene;if(failure==='reject')f.c.presentChallengeScene=()=>Promise.reject(new Error('destination rejected'));
 let pending;if(caller==='nextRound')pending=f.c.nextRound();else{f.c.duel.status='paused';pending=f.c.restartPausedGame();}await settle();
 const run=f.c.challengeRun,attempt=f.profiles.readProfile().campaign.attemptSerial,xp=f.profiles.readProfile().campaign.xp,durable=f.storage.getItem(key),series=f.c.matchSeries,round=series.round,score={...series.score};assert.equal(round,caller==='nextRound'?2:1);assert.equal(score.player,caller==='nextRound'?1:0);
 f.c.viewportUI={ready:false};if(failure==='context-loss'){f.c.scene.game.renderer={gameContext:{isContextLost:()=>true}};f.render();}else if(failure==='cancel')f.c.cancelChallengeSceneHandoff();await pending;await settle();f.countdown();
 assert.equal(f.c.duel.status,'paused');assert.equal(f.$('.challenge-story').open,true,'non-story caller must surface the same actionable display recovery');assert.equal(f.timers.size,0);
 if(action==='return'){f.$('[data-story-return]').click();await settle();assert.equal(f.c.challengeRun,null);assert.equal(f.$('.challenge-dialog').open,true,'return must work while viewport remains not-ready');assert.equal(f.$('.challenge-story').open,false);}
 else{f.c.presentChallengeScene=present;f.c.scene.game.renderer=undefined;f.$('[data-story-next]').click();await settle();assert.equal(f.c.challengeRun,run);assert.equal(f.c.matchSeries,series);assert.equal(series.round,round);assert.deepEqual({...series.score},score);f.c.viewportUI.ready=true;f.render();await settle();f.countdown();assert.equal(f.c.duel.status,'active');assert.equal(f.c.duel.enemy.displayName,'咆哮哥');assert.equal(f.$('.challenge-story').open,false);}
 assert.equal(f.storage.getItem(key),durable);assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempt);assert.equal(f.profiles.readProfile().campaign.xp,xp);
});
for(const caller of ['nextRound','restartPausedGame'])for(const cancellation of ['home','scene-replaced','save-conflict'])test(`${caller} ${cancellation} does not resurrect old display recovery`,async t=>{
 const f=await fixture(t);Object.assign(f.c,{resultPressGates:new Map(),showRootRecovery:()=>{}});const {pending}=await nonStoryRound(f,caller);await settle();const durable=f.storage.getItem(key);
 if(cancellation==='home')f.c.showTitle();else if(cancellation==='scene-replaced'){f.c.scene={...f.c.scene};f.render();}else f.c.showChallengeSaveFailure({reason:'stale-run'});await pending;await settle();f.countdown();assert.equal(f.$('.challenge-story').open,false);assert.equal(f.storage.getItem(key),durable);assert.notEqual(f.c.duel.status,'active');if(cancellation==='save-conflict')assert.equal(f.$('#result').classList.contains('hidden'),false);
});
for(const caller of ['nextRound','restartPausedGame'])test(`${caller} failure cannot replace a newer story presentation`,async t=>{
 const f=await fixture(t);const {pending}=await nonStoryRound(f,caller);await settle();f.c.cancelChallengeSceneHandoff();f.c.story([{title:'新的故事',speaker:'新的敘事',copy:'新內容'}],()=>{});await pending;await settle();assert.equal(f.$('.challenge-story').open,true);assert.equal(f.$('.challenge-story h2').textContent,'新的故事');assert.notEqual(f.$('[data-story-next]').textContent,'重試顯示');
});

async function activeBoss(f){
 await f.prepare();f.render();await settle();f.finish();await settle();f.render();await settle();f.countdown();assert.equal(f.c.duel.status,'active');f.c.duel.status='paused';f.$('#pause-screen').classList.remove('hidden');
}
const committedState=f=>({bytes:f.storage.getItem(key),attempt:f.profiles.readProfile().campaign.attemptSerial,xp:f.profiles.readProfile().campaign.xp});
function assertCommitted(f,before){assert.deepEqual(committedState(f),before,'display failure/retry/exit must not write another receipt or award XP');}
async function failDisplay(f,failure){
 f.c.viewportUI={ready:false};if(failure==='context-loss'){f.c.scene.game.renderer={gameContext:{isContextLost:()=>true}};f.render();}else if(failure==='cancel')f.c.cancelChallengeSceneHandoff();await settle();f.countdown();assert.equal(f.c.duel.status,'paused');
}
async function applyPreparedRetry(f,{saveRecovery=false,failure='cancel'}={}){
 assert.equal(f.c.openPreparation({intent:'retry'}),true);
 if(saveRecovery)f.storage.failWrites=true;
 if(failure==='reject')f.c.presentChallengeScene=()=>Promise.reject(new Error('destination rejected'));
 f.$('#preparationConfirm').click();await settle();
 if(saveRecovery){const retry=f.$('#preparationRecoveryPanel [data-recovery="retry"]');assert.ok(retry&&!retry.disabled);f.storage.failWrites=false;retry.click();await settle();}
 const before=committedState(f);await failDisplay(f,failure);assert.equal(f.$('#challengePreparationOverlay').open,true);assert.equal(f.$('#preparationConfirm').disabled,true);assert.equal(f.$('#preparationCancel').disabled,false);assert.match(f.$('#challengePreparationStatus').textContent,/配置已保存。遊戲場景目前無法開啟/);return before;
}
for(const saveRecovery of [false,true])for(const failure of ['context-loss','cancel','reject'])test(`preparation ${saveRecovery?'save-recovery':'apply'} ${failure} cancel returns with its saved receipt despite unavailable viewport`,async t=>{
 const f=await fixture(t);await activeBoss(f);const before=await applyPreparedRetry(f,{saveRecovery,failure});f.$('#preparationCancel').click();await settle();assert.equal(f.c.challengeRun,null);assert.equal(f.c.duel.status,'title');assert.equal(f.$('.challenge-dialog').open,true);assert.equal(f.$('#challengePreparationOverlay'),null);assertCommitted(f,before);
});
for(const saveRecovery of [false,true])for(const change of ['duel','run','scene','epoch','profile-context','new-preparation','save-conflict','home'])test(`preparation ${saveRecovery?'save-recovery':'apply'} failed-display cancel does not navigate after ${change}`,async t=>{
 const f=await fixture(t);await activeBoss(f);await applyPreparedRetry(f,{saveRecovery});const cancel=f.$('#preparationCancel'),run=f.c.challengeRun;let newer;
 if(change==='duel'){f.c.duel=new Duel();f.c.duel.status='paused';}else if(change==='run')f.c.challengeRun={...run,preparationSnapshot:()=>run.preparationSnapshot()};else if(change==='scene')f.c.scene={...f.c.scene};else if(change==='epoch')f.c.challengeOpeningEpoch++;else if(change==='profile-context')f.profiles.enterTestMode();else if(change==='new-preparation'){f.c.viewportUI.ready=true;assert.equal(f.c.openPreparation({intent:'retry'}),true);newer=f.$('#challengePreparationOverlay');}else if(change==='save-conflict'){Object.assign(f.c,{resultPressGates:new Map(),showRootRecovery:()=>{}});f.c.showChallengeSaveFailure({reason:'stale-run'});}else f.c.showTitle();
 const owner={run:f.c.challengeRun,duel:f.c.duel,status:f.c.duel.status};cancel.click();await settle();assert.equal(f.c.challengeRun,owner.run);assert.equal(f.c.duel,owner.duel);assert.equal(f.c.duel.status,owner.status);assert.notEqual(f.$('.challenge-dialog:not(.challenge-preparation-overlay)')?.open,true);if(newer){assert.equal(f.$('#challengePreparationOverlay'),newer);assert.equal(newer.open,true);}if(change==='save-conflict')assert.equal(f.$('#result').classList.contains('hidden'),false);
});
test('normal preparation cancellation preserves the paused boss and does not navigate',async t=>{
 const f=await fixture(t);await activeBoss(f);const run=f.c.challengeRun,before=committedState(f);assert.equal(f.c.openPreparation({intent:'retry'}),true);f.$('#preparationCancel').click();await settle();assert.equal(f.c.challengeRun,run);assert.equal(f.c.duel.status,'paused');assert.notEqual(f.$('.challenge-dialog:not(.challenge-preparation-overlay)')?.open,true);assertCommitted(f,before);
});
async function recoverPauseSave(f,failure){
 Object.assign(f.c,{resultPressGates:new Map()});f.storage.failWrites=true;await f.c.restartPausedGame();await settle();assert.equal(f.c.challengeSaveBlocked,true);const retry=f.$('#challengeRecoveryPanel [data-recovery="retry"]');assert.ok(retry&&!retry.disabled);f.storage.failWrites=false;if(failure==='reject')f.c.presentChallengeScene=()=>Promise.reject(new Error('destination rejected'));retry.click();await settle();assert.equal(f.c.challengeSaveBlocked,false);return committedState(f);
}
for(const failure of ['context-loss','cancel','reject'])for(const action of ['retry','return'])test(`pause save-recovery ${failure} offers ${action} without another saved attempt`,async t=>{
 const f=await fixture(t);await activeBoss(f);const present=f.c.presentChallengeScene,before=await recoverPauseSave(f,failure);const run=f.c.challengeRun,series=f.c.matchSeries,round=series.round,score={...series.score};await failDisplay(f,failure);assert.equal(f.$('.challenge-story').open,true);assert.equal(f.$('[data-story-next]').textContent,'重試顯示');assert.equal(f.$('[data-story-next]').disabled,false);assert.equal(f.c.challengeActionBusy,false);
 if(action==='return'){f.$('[data-story-return]').click();await settle();assert.equal(f.c.challengeRun,null);assert.equal(f.$('.challenge-dialog').open,true);}
 else{f.c.presentChallengeScene=present;f.c.scene.game.renderer=undefined;f.$('[data-story-next]').click();const retried=f.c.duel;f.$('[data-story-next]').click();await settle();assert.equal(f.c.duel,retried);assert.equal(f.c.challengeRun,run);assert.equal(f.c.matchSeries,series);assert.equal(series.round,round);assert.deepEqual({...series.score},score);assert.equal(f.timers.size,0);f.c.viewportUI.ready=true;f.render();await settle();f.countdown();assert.equal(f.c.duel.status,'active');assert.equal(f.c.duel.enemy.displayName,'咆哮哥');}
 assert.equal(f.$('.challenge-story').open,false);assertCommitted(f,before);
});
for(const change of ['home','scene','save-conflict','new-story'])test(`pause save-recovery destination superseded by ${change} does not reopen old UI`,async t=>{
 const f=await fixture(t);await activeBoss(f);const before=await recoverPauseSave(f,'cancel');if(change==='home')f.c.showTitle();else if(change==='scene'){f.c.scene={...f.c.scene};f.render();}else if(change==='save-conflict')f.c.showChallengeSaveFailure({reason:'stale-run'});else{f.c.cancelChallengeSceneHandoff();f.c.story([{title:'新的故事',speaker:'新場景',copy:'新內容'}],()=>{});}await settle();f.countdown();assert.notEqual(f.c.duel.status,'active');if(change==='new-story'){assert.equal(f.$('.challenge-story').open,true);assert.equal(f.$('.challenge-story h2').textContent,'新的故事');}else assert.equal(f.$('.challenge-story').open,false);if(change==='save-conflict')assert.equal(f.$('#result').classList.contains('hidden'),false);assertCommitted(f,before);
});

for(const saveRecovery of [false,true])test(`preparation ${saveRecovery?'save-recovery':'apply'} success closes normally after the actual destination frame`,async t=>{
 const f=await fixture(t);await activeBoss(f);assert.equal(f.c.openPreparation({intent:'retry'}),true);if(saveRecovery)f.storage.failWrites=true;f.$('#preparationConfirm').click();await settle();if(saveRecovery){f.storage.failWrites=false;f.$('#preparationRecoveryPanel [data-recovery="retry"]').click();await settle();}const run=f.c.challengeRun,before=committedState(f);assert.equal(f.timers.size,0);f.render();await settle();f.countdown();assert.equal(f.c.challengeRun,run);assert.equal(f.c.duel.status,'active');assert.equal(f.$('#challengePreparationOverlay').open,false);assert.notEqual(f.$('.challenge-dialog:not(.challenge-preparation-overlay)')?.open,true);assertCommitted(f,before);
});
test('pause save-recovery success closes the save failure and starts only after the destination frame',async t=>{
 const f=await fixture(t);await activeBoss(f);const before=await recoverPauseSave(f,'cancel');assert.equal(f.timers.size,0);f.render();await settle();f.countdown();assert.equal(f.c.duel.status,'active');assert.equal(f.$('#result').classList.contains('hidden'),true);assert.equal(f.$('.challenge-story').open,false);assert.equal(f.c.challengeActionBusy,false);assertCommitted(f,before);
});
test('pause save-recovery retains the existing street resume path',async t=>{
 const f=await fixture(t,{checkpoint:2});await f.prepare();f.render();await settle();assert.equal(f.c.duel.depthMode,true);f.c.duel.status='paused';const before=await recoverPauseSave(f,'cancel');f.render();await settle();assert.equal(f.c.duel.depthMode,true);assert.equal(f.c.duel.status,'active');assert.notEqual(f.$('.challenge-story')?.open,true);assert.equal(f.c.challengeActionBusy,false);assertCommitted(f,before);
});

for(const change of ['scene','duel','epoch'])test(`pause failed-save resume callback does not acquire a newer ${change} owner`,async t=>{
 const f=await fixture(t);await activeBoss(f);Object.assign(f.c,{resultPressGates:new Map()});f.storage.failWrites=true;await f.c.restartPausedGame();await settle();const retry=f.$('#challengeRecoveryPanel [data-recovery="retry"]');assert.ok(retry&&!retry.disabled);if(change==='scene')f.c.scene={...f.c.scene};else if(change==='duel'){f.c.duel=new Duel();f.c.duel.status='menu';}else f.c.challengeOpeningEpoch++;const owner={run:f.c.challengeRun,duel:f.c.duel,scene:f.c.scene,status:f.c.duel.status};f.storage.failWrites=false;retry.click();await settle();assert.equal(f.c.challengeRun,owner.run);assert.equal(f.c.duel,owner.duel);assert.equal(f.c.scene,owner.scene);assert.equal(f.c.duel.status,owner.status);assert.equal(f.c.challengeSceneHandoff,null);assert.equal(f.$('.challenge-story').open,false);assert.equal(f.timers.size,0);
});

// The actual dialog capture listener, not HTMLElement.click()'s detail=0 bypass.
// DOM rectangles are the named geometry boundary; game/session/store stay real.
function renderOnlyPointerViewport(f){
 const app=f.$('.app'),shell=f.$('#viewport-shell'),frame={width:568,height:320,screenWidth:568,screenHeight:320,left:0,top:0,rotation:0,touch:true};
 Object.defineProperties(f.window,{innerWidth:{value:568,writable:true},innerHeight:{value:320,writable:true}});app.style.width='568px';app.style.height='320px';app.getBoundingClientRect=shell.getBoundingClientRect=()=>({left:0,top:0,width:568,height:320});app.__viewportState={ready:false,readiness:'paint',epoch:7,surfaceGeneration:1,reason:'draw-failed',frame};f.c.viewportUI={ready:false};f.window.dispatchEvent(new f.window.CustomEvent('parliamentviewportchange'));
 return button=>{const e=new f.window.MouseEvent('click',{detail:1,bubbles:true,cancelable:true});button.dispatchEvent(e);return e;};
}
for(const caller of ['story','nextRound','restartPausedGame','pause-save-recovery'])for(const action of ['retry','return'])test(`real ${caller} saved display failure accepts pointer ${action} with paint not-ready and unchanged bytes`,async t=>{
 const f=await fixture(t);if(caller==='story'){await f.prepare();f.render();await settle();f.finish();await settle();}else{await activeBoss(f);if(caller==='pause-save-recovery')await recoverPauseSave(f,'cancel');else if(caller==='nextRound'){f.c.matchSeries.record('player');f.c.nextRound();await settle();}else{f.c.restartPausedGame();await settle();}}
 f.c.cancelChallengeSceneHandoff();await settle();const before=committedState(f),click=renderOnlyPointerViewport(f),button=f.$(action==='retry'?'[data-story-next]':'[data-story-return]');assert.equal(click(button).defaultPrevented,false);await settle();
 if(action==='return'){assert.equal(f.c.challengeRun,null);assert.equal(f.$('.challenge-dialog').open,true);}else{assert.equal(f.$('.app').__viewportState.ready,false);assert.equal(f.timers.size,0);f.c.viewportUI.ready=true;f.render();await settle();f.countdown();assert.equal(f.c.duel.status,'active');assert.equal(f.c.duel.enemy.displayName,'咆哮哥');}assertCommitted(f,before);
});
for(const saveRecovery of [false,true])for(const failure of ['context-loss','cancel','reject'])test(`real preparation ${saveRecovery?'save-recovery':'apply'} ${failure} saved display Cancel accepts pointer without new writes`,async t=>{
 const f=await fixture(t);await activeBoss(f);const before=await applyPreparedRetry(f,{saveRecovery,failure}),click=renderOnlyPointerViewport(f);assert.equal(click(f.$('#preparationCancel')).defaultPrevented,false);await settle();assert.equal(f.c.challengeRun,null);assert.equal(f.c.duel.status,'title');assert.equal(f.$('.challenge-dialog').open,true);assertCommitted(f,before);
});
for(const change of ['scene','duel','save-conflict','profile-context'])test(`real preparation saved display pointer Cancel rejects changed ${change}`,async t=>{
 const f=await fixture(t);await activeBoss(f);await applyPreparedRetry(f);const before=committedState(f),click=renderOnlyPointerViewport(f);if(change==='scene')f.c.scene={...f.c.scene};else if(change==='duel'){f.c.duel=new Duel();f.c.duel.status='paused';}else if(change==='profile-context')f.profiles.enterTestMode();else{Object.assign(f.c,{resultPressGates:new Map(),showRootRecovery:()=>{}});f.c.showChallengeSaveFailure({reason:'stale-run'});}const owner=f.c.challengeRun;assert.equal(click(f.$('#preparationCancel')).defaultPrevented,true);assert.equal(f.c.challengeRun,owner);assert.equal(f.$('#challengePreparationOverlay').open,true);assertCommitted(f,before);
});

async function savedFailure(f,caller){
 if(caller==='initial-entry'){await f.prepare();f.c.cancelChallengeSceneHandoff();await settle();assert.equal(f.c.challengeRun,null);assert.ok(f.c.entryPreparationSession);}
 else if(caller==='preparation'||caller==='preparation-save-recovery'){await activeBoss(f);await applyPreparedRetry(f,{saveRecovery:caller==='preparation-save-recovery'});}
 else if(caller==='restartPausedGame'||caller==='pause-save-recovery'){await activeBoss(f);if(caller==='pause-save-recovery')await recoverPauseSave(f,'cancel');else{f.c.restartPausedGame();await settle();}f.c.cancelChallengeSceneHandoff();await settle();}
 else{await f.prepare();f.render();await settle();f.finish();await settle();f.c.cancelChallengeSceneHandoff();await settle();}
}
function physicalSavedExit(f){
 const click=renderOnlyPointerViewport(f),app=f.$('.app'),shell=f.$('#viewport-shell');app.getBoundingClientRect=shell.getBoundingClientRect=()=>({left:20,top:0,width:568,height:320});f.window.dispatchEvent(new f.window.CustomEvent('parliamentviewportchange'));
 const button=f.$('[data-viewport-saved-reload]');assert.ok(button,'saved scene failure must have a physical-modal exit when game geometry cannot be trusted');button.getBoundingClientRect=()=>({left:120,top:140,width:240,height:44});let reloads=0;f.c.window={location:{reload:()=>reloads++}};return {button,click,get reloads(){return reloads;}};
}
for(const caller of ['story','preparation','preparation-save-recovery','initial-entry','restartPausedGame','pause-save-recovery'])test(`real ${caller} owned saved receipt can safely reload from inconsistent geometry without a write`,async t=>{
 const f=await fixture(t);await savedFailure(f,caller);const before=committedState(f),writes=f.storage.writes,exit=physicalSavedExit(f);assert.equal(exit.button.disabled,false);assert.equal(exit.click(exit.button).defaultPrevented,false);assert.equal(exit.reloads,1);assert.equal(f.storage.writes,writes);assertCommitted(f,before);assert.equal(f.$('.app').__viewportState.ready,false);
});
for(const caller of ['story','preparation','initial-entry'])for(const change of ['dirty','busy','queued','conflict','test-mode','new-receipt','slot','scene'])test(`real ${caller} safety reload refuses ${change} and preserves stored bytes`,async t=>{
 const f=await fixture(t);await savedFailure(f,caller);const exit=physicalSavedExit(f);if(change==='dirty'||change==='new-receipt'){const run=f.c.challengeRun??f.c.entryPreparationSession,snapshot=run.preparationSnapshot(),previous=f.profiles.get().revision;f.storage.failWrites=change==='dirty';const result=await run.prepareEncounter(snapshot,{...snapshot,intent:'boundary'});assert.equal(result.accepted,true,'the guard fixture must produce a real store transition');assert.equal(f.profiles.get().dirty,change==='dirty');assert.ok(f.profiles.get().revision>previous);}else if(change==='busy')f.c.challengeActionBusy=true;else if(change==='queued')f.c.challengeQueuedOperations++;else if(change==='conflict')f.c.challengeSaveBlocked=true;else if(change==='test-mode')f.profiles.enterTestMode();else if(change==='slot')await f.profiles.selectProfile('slot-2');else f.c.scene={...f.c.scene};const raw=f.storage.getItem(key),writes=f.storage.writes;f.c.syncChallengeSaveSlot();assert.equal(exit.button.disabled,true);assert.equal(exit.click(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);assert.equal(f.storage.getItem(key),raw);assert.equal(f.storage.writes,writes);assert.match(f.$('[data-viewport-exit-copy]').textContent,/保留此頁/);
});
test('initial saved entry Cancel pointer has the same current-source guard and makes no new receipt',async t=>{
 const f=await fixture(t);await savedFailure(f,'initial-entry');const before=committedState(f),click=renderOnlyPointerViewport(f);assert.equal(click(f.$('#preparationCancel')).defaultPrevented,false);await settle();assert.equal(f.$('.challenge-dialog').open,true);assert.equal(f.c.entryPreparationSession,null);assertCommitted(f,before);
});
test('initial entry failure cannot enable reload before a save is confirmed',async t=>{
 const storage=memoryStorage(),f=await fixture(t,{storage});storage.failWrites=true;await f.prepare();renderOnlyPointerViewport(f);f.$('.app').getBoundingClientRect=f.$('#viewport-shell').getBoundingClientRect=()=>({left:20,top:0,width:568,height:320});f.window.dispatchEvent(new f.window.CustomEvent('parliamentviewportchange'));assert.equal(f.$('[data-viewport-saved-reload]'),null);assert.equal(f.c.challengeRun,null);
});

for(const change of ['duel','home','new-entry','successful-resume'])test(`initial saved entry safety capability expires after ${change}`,async t=>{
 const f=await fixture(t);await savedFailure(f,'initial-entry');const exit=physicalSavedExit(f),before=f.storage.getItem(key);let pending;
 if(change==='duel')f.c.duel=new Duel();else if(change==='home')f.c.showTitle();else{pending=f.c.startChallenge();await settle();if(change==='successful-resume'){f.render();await pending;await settle();}else f.c.cancelChallengeSceneHandoff();}
 f.c.syncChallengeSaveSlot();exit.click(exit.button);assert.equal(exit.reloads,0);assert.equal(f.storage.getItem(key),before);if(pending)await pending;
});
test('an initial save still awaiting confirmation cannot expose a reload capability',async t=>{
 const f=await fixture(t);let release;const save=f.profiles.savePreparation.bind(f.profiles);f.profiles.savePreparation=async(...args)=>{await new Promise(resolve=>release=resolve);return save(...args);};await f.prepare();renderOnlyPointerViewport(f);f.$('.app').getBoundingClientRect=f.$('#viewport-shell').getBoundingClientRect=()=>({left:20,top:0,width:568,height:320});f.window.dispatchEvent(new f.window.CustomEvent('parliamentviewportchange'));assert.equal(f.$('[data-viewport-saved-reload]'),null);assert.equal(f.$('#preparationCancel').disabled,true);release();await settle();f.c.cancelChallengeSceneHandoff();await settle();
});

test('a failed BO3 next round preserves its unsaved score and cannot offer reload',async t=>{
 const f=await fixture(t);await activeBoss(f);f.c.matchSeries.record('player');f.c.nextRound();await settle();f.c.cancelChallengeSceneHandoff();await settle();const series=f.c.matchSeries,score={...series.score},round=series.round,before=committedState(f),exit=physicalSavedExit(f);assert.equal(exit.button.disabled,true);assert.equal(exit.click(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);assert.equal(f.c.matchSeries,series);assert.deepEqual({...series.score},score);assert.equal(series.round,round);assertCommitted(f,before);assert.match(f.$('[data-viewport-exit-copy]').textContent,/保留此頁/);
});
test('a display failure reload capability cannot reload resumed gameplay',async t=>{
 const f=await fixture(t);await savedFailure(f,'story');const exit=physicalSavedExit(f);f.c.duel.status='active';f.c.syncChallengeSaveSlot();assert.equal(exit.button.disabled,true);assert.equal(exit.click(exit.button).defaultPrevented,true);assert.equal(exit.reloads,0);
});

for(const caller of ['story','preparation','initial-entry'])for(const change of ['other-tab-valid-save','storage-unreadable'])for(const refreshDisplay of [true,false])test(`real ${caller} reload rejects ${change} at ${refreshDisplay?'display':'activation'} without awaiting a storage event`,async t=>{
 const f=await fixture(t);await savedFailure(f,caller);const exit=physicalSavedExit(f),prior=f.profiles.get(),raw=f.storage.getItem(key);if(change==='other-tab-valid-save'){const other=await openChallengeProgress({storage:f.storage,locks:serialLocks()});assert.equal((await other.selectProfile('slot-2')).persisted,true);assert.notEqual(f.storage.getItem(key),raw);assert.equal(f.profiles.get().revision,prior.revision);}else f.storage.failReads=1000;
 const state=f.profiles.get(),backup=f.profiles.exportBackup(),writes=f.storage.writes;if(refreshDisplay)f.c.syncChallengeSaveSlot();assert.equal(exit.button.disabled,refreshDisplay);assert.equal(exit.click(exit.button).defaultPrevented,true);assert.equal(exit.button.disabled,true);assert.equal(exit.reloads,0);assert.deepEqual(f.profiles.get(),state);assert.equal(f.profiles.exportBackup(),backup);assert.equal(f.storage.writes,writes);assert.match(f.$('[data-viewport-exit-copy]').textContent,/保留此頁/);
});
