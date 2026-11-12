import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
import {gameHarness,deferred} from './helpers/game-harness.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
const settle=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};

// This gate replaces only the asynchronous store boundary. Session creation and
// the production entry functions still execute, including their actual writes.
async function gatedEntry(t){
 const f=await starterGameEntry();t.after(()=>f.close());
 await AsyncChallengeSession.create({progress:f.profiles});
 const gate=deferred(),create=f.context.AsyncChallengeSession.create.bind(f.context.AsyncChallengeSession);
 f.context.AsyncChallengeSession={create:async options=>{await gate.promise;return create(options);}};
 f.$('#menu').classList.remove('hidden');
 return {...f,gate};
}

test('restored challenge keeps its menu and committed mode until its asynchronous session is ready',async t=>{
 const f=await gatedEntry(t),old=f.context.duel,pending=f.start();
 assert.equal(f.$('#menu').classList.contains('hidden'),false,'source menu must cover the uncommitted VS scene');
 assert.equal(f.context.duel,old);
 assert.equal(f.context.gameMode,'battle','no partial challenge mode before session readiness');
 f.gate.resolve();await pending;
 assert.equal(f.context.duel.depthMode,true);
 assert.equal(f.$('#menu').classList.contains('hidden'),true);
});

test('abandoned pending entry cannot install a scene after returning to the title',async t=>{
 const f=await gatedEntry(t),old=f.context.duel,pending=f.start();
 f.context.endChallenge();f.gate.resolve();await pending;
 assert.equal(f.context.challengeRun,null);assert.equal(f.context.duel,old);
 assert.equal(f.$('#menu').classList.contains('hidden'),false);
});

test('failed entry save preserves the source scene and records a recoverable pending session',async t=>{
 const entries=new Map(),storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
 const f=await starterGameEntry({storage});t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});
 f.$('#menu').classList.remove('hidden');const old=f.context.duel,before=[...entries];
 storage.setItem=()=>{throw new Error('quota exceeded');};
 // Recovery DOM itself is independently covered; this observes the real entry's
 // failure routing without replacing session creation or any presentation state.
 f.context.showChallengeSaveFailure=()=>{};
 const result=await f.start();
 assert.equal(result?.accepted,false);assert.equal(f.context.duel,old);assert.equal(f.context.challengeRun,null);
 assert.equal(f.context.gameMode,'battle');assert.equal(f.$('#menu').classList.contains('hidden'),false);
 assert.ok(f.context.entryPreparationSession,'retain the pending receipt for retry, never create a duplicate attempt');assert.deepEqual([...entries],before,'failed persistence preserves durable bytes');
});

function display(){let proxy;proxy=new Proxy({visible:true},{get(target,key){if(key in target)return target[key];return (...args)=>{if(key==='setVisible')target.visible=args[0];return proxy;};}});return proxy;}
function renderScene(h){
 h.document.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 const queryAll=h.document.querySelectorAll;h.document.querySelectorAll=selector=>selector==='.screen'?['#menu','#pause-screen','#result'].map(h.$):queryAll(selector);
 const events=new EventEmitter(),draws=[];
 const scene=Object.assign(Object.create(h.ui.Arena.prototype),{game:{events},sys:{events:new EventEmitter()},artImages:{},dynamic:display(),scale:{width:390,height:844},cameras:{main:display()},time:{now:0},arenaBackdrop:display(),chamberDeskLayers:[display()],backdropExtensions:[display()],boundaryGraphics:display(),ambient:display(),rigs:[display(),display()],chars:[display(),display()],statusTexts:[display(),display()],supporterSprites:[],crowdGraphics:display(),crowdRush:display(),supporterFlags:display(),crowdRushLabels:[],supporterFlagLabels:[],itemSprites:[],itemGraphics:display(),propPool:[],markerPool:[],lastArtPose:new WeakMap(),challengeRenderer:{draw(){draws.push('street');},drawArena(){draws.push('boss');},hide(){}},assistRenderer:{draw(){}},drawStageItems(){},drawCrowd(){},drawFighter(){},drawProjectiles(){},updateCaptions(){},updateBackdrop(){draws.push('vs');}});
 assert.equal(typeof scene.updateFrame,'function','render fixture must inherit the real Arena updateFrame used by its guarded update');
 h.ui.setScene(scene);
 return {scene,events,draws,render(){h.ui.Arena.prototype.update.call(scene,0,0);events.emit('postrender');}};
}

test('source is released only after the real Arena update and Phaser postrender agree on target identity',async()=>{
 const h=await gameHarness(),r=renderScene(h);await AsyncChallengeSession.create({progress:h.ui.profiles});
 h.$('#menu').classList.remove('hidden');const pending=h.ui.startChallenge();await settle();
 assert.equal(h.ui.duel.depthMode,true,'save commit installs the target while source remains');
 assert.equal(h.$('#menu').classList.contains('hidden'),false);
 r.events.emit('postrender');await settle();assert.equal(h.$('#menu').classList.contains('hidden'),false,'unrelated/old postrender must not release source');
 r.render();await pending;
 assert.deepEqual(r.draws,['street']);assert.equal(r.scene.arenaBackdrop.visible,false);
 assert.equal(h.$('#menu').classList.contains('hidden'),true);assert.equal(r.events.listenerCount('postrender'),0);
});

test('destroying the scene cancels a render handoff without hiding its source or leaving a listener',async()=>{
 const h=await gameHarness(),r=renderScene(h);await AsyncChallengeSession.create({progress:h.ui.profiles});
 h.$('#menu').classList.remove('hidden');const pending=h.ui.startChallenge();await settle();assert.equal(r.events.listenerCount('postrender'),1);r.scene.sys.events.emit('shutdown');await pending;
 assert.equal(h.$('#menu').classList.contains('hidden'),false);assert.equal(r.events.listenerCount('postrender'),0);
});

test('storage conflict before target postrender cannot erase its recovery surface',async()=>{
 const h=await gameHarness(),r=renderScene(h);await AsyncChallengeSession.create({progress:h.ui.profiles});h.$('#menu').classList.remove('hidden');
 const pending=h.ui.startChallenge();await settle();h.window.handlers.storage({key:'taiwanpunchline-challenge-v4'});
 assert.equal(h.$('#result').classList.contains('hidden'),false);r.render();const result=await pending;
 assert.equal(h.$('#result').classList.contains('hidden'),false,'late frame must not hide the save-conflict recovery');assert.equal(result.accepted,false);assert.equal(r.events.listenerCount('postrender'),0);
});

for(const checkpoint of [0,1])test(`retry ${checkpoint?'boss':'street'} reports saved-but-unpresented failure instead of releasing preparation`,async()=>{
 const h=await gameHarness(),r=renderScene(h),seed=await AsyncChallengeSession.create({progress:h.ui.profiles});if(checkpoint)await seed.routeComplete({});
 const entered=h.ui.startChallenge();await settle();r.render();await entered;
 const pending=h.ui.restartPreparedEncounter();await settle();assert.equal(r.events.listenerCount('postrender'),1);
 r.scene.sys.events.emit('shutdown');const result=await pending;
 assert.equal(result?.accepted,false);assert.equal(result.persisted,true);assert.equal(result.reason,'scene-unavailable');
 assert.equal(r.events.listenerCount('postrender'),0);
});

test('later chapter handoff failure is returned to the still-open preparation instead of silently dismissing it',async t=>{
 const {completedChallengeEnvelope}=await import('./helpers/profile-fixtures.mjs'),{memoryStorage}=await import('./helpers/main-unified-fixture.mjs');
 const f=await starterGameEntry({storage:memoryStorage({'taiwanpunchline-challenge-v4':JSON.stringify(completedChallengeEnvelope())})});t.after(()=>f.close());
 f.context.continueCampaign=async()=>({accepted:false,persisted:true,reason:'handoff-unavailable'});
 f.context.openPreparation({intent:'resume',entry:{characterId:'wang',helperId:'han'}});f.$('#preparationConfirm').click();await f.settle();
 assert.equal(f.$('#challengePreparationOverlay').open,true,'saved configuration must not dismiss the only actionable source when navigation failed');
 assert.equal(f.context.challengeRun,null);
});

test('new-run comic entry remembers a hidden tab until the delayed first frame is revealed',async t=>{
 const {readFileSync}=await import('node:fs'),vm=await import('node:vm');
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8'),f=await starterGameEntry();t.after(()=>f.close());
 const noop=()=>{};Object.assign(f.context,{music:{setHidden:noop},matchFinish:null,moveDemo:null,setGameSelectValue:noop,trainingRestartGate:null,trainingBehavior:'stand',trainingInfinite:true,trainingRepeat:true,configurePauseRestart:noop});
 vm.runInNewContext(source.slice(source.indexOf('function pauseGame()'),source.indexOf('function resumeGame()'))+'\n'+source.slice(source.indexOf("window.addEventListener('blur'"),source.indexOf('function text(s')),f.context);
 const events=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:new EventEmitter()}};
 f.start();f.$('[data-starter-skip]').click();Object.defineProperty(f.document,'hidden',{value:true,configurable:true});f.document.dispatchEvent(new f.window.Event('visibilitychange'));
 await settle();Object.defineProperty(f.document,'hidden',{value:false,configurable:true});f.document.dispatchEvent(new f.window.Event('visibilitychange'));
 f.context.scene.challengeFrame={serial:1,run:f.context.challengeRun,duel:f.context.duel};events.emit('postrender');await settle();
 assert.equal(f.context.duel.status,'paused');
});

test('a lost Canvas context cannot release source on a game postrender event',async()=>{
 const h=await gameHarness(),r=renderScene(h);await AsyncChallengeSession.create({progress:h.ui.profiles});r.scene.game.renderer={gameContext:{isContextLost:()=>true}};h.$('#menu').classList.remove('hidden');
 const pending=h.ui.startChallenge();await settle();r.render();const result=await pending;
 assert.equal(result.accepted,false);assert.equal(result.reason,'scene-unavailable');assert.equal(h.$('#menu').classList.contains('hidden'),false);assert.equal(r.events.listenerCount('postrender'),0);
});

test('saved but unpresented entry restores its source runtime and can reopen editable preparation',async t=>{
 const f=await starterGameEntry();t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});const source=f.context.duel;
 const events=new EventEmitter(),lifecycle=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:lifecycle}};
 const pending=f.start();await settle();const staged=f.context.challengeRun;lifecycle.emit('shutdown');assert.equal((await pending).accepted,false);
 assert.equal(f.context.challengeRun,null,'failed presentation must not leave a phantom active run');assert.equal(f.context.duel,source);assert.equal(source.status,'menu');assert.equal(f.context.entryPreparationSession,staged,'durable receipt is retained, not replayed');
 assert.equal(f.context.openPreparation({intent:'resume',entry:{characterId:'wang',helperId:'han'}}),true);assert.equal(f.$('#preparationConfirm').hidden,false);
});

test('a pending scene handoff cannot open another preparation over its source',async t=>{
 const f=await starterGameEntry();t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});const events=new EventEmitter(),lifecycle=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:lifecycle}};
 const pending=f.start();await settle();assert.equal(f.context.openPreparation({readOnly:true}),false);lifecycle.emit('shutdown');await pending;
});

test('changing difficulty after an unpresented entry does not reuse its old prepared configuration',async t=>{
 const f=await starterGameEntry();t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});const events=new EventEmitter(),lifecycle=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:lifecycle}};
 const pending=f.start();await settle();lifecycle.emit('shutdown');await pending;f.context.difficulty='hard';f.context.scene={artImages:{},reducedMotion:true};await f.start();assert.equal(f.context.challengeRun.difficulty,'hard');
});

test('explicit cancel abandons only failed-display runtime and a new editable start creates one normal attempt',async t=>{
 const {newEnvelope,CHALLENGE_KEY}=await import('../dist/preview/campaign/fresh/schema.mjs'),{memoryStorage}=await import('./helpers/main-unified-fixture.mjs');
 const envelope=newEnvelope();envelope.campaign.profiles[0].campaign.xp=160;const storage=memoryStorage({[CHALLENGE_KEY]:JSON.stringify(envelope)}),f=await starterGameEntry({storage});t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});f.context.endChallenge();
 const events=new EventEmitter(),lifecycle=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:lifecycle}};
 f.context.openPreparation({intent:'resume',entry:{characterId:'wang',helperId:'han'}});f.$('#preparationConfirm').click();await f.settle();lifecycle.emit('shutdown');await f.settle();
 const durable=storage.getItem(CHALLENGE_KEY),attempts=f.profiles.readProfile().campaign.attemptSerial;
 f.$('#preparationCancel').click();assert.equal(storage.getItem(CHALLENGE_KEY),durable,'cancel only releases runtime ownership');assert.equal(f.context.entryPreparationSession,null);
 f.context.openChallenge();f.$('[data-action="prepare"]').click();
 const change=(selector,value)=>{f.$(selector).value=value;f.$(selector).dispatchEvent(new f.window.Event('change',{bubbles:true}));};
 change('#overview-preparationMain','han');change('#overview-preparationHelper','wang');change('#overview-preparationDifficulty','hard');f.$('#overview-preparationConfirm').click();await f.settle();
 assert.equal(f.profiles.preparationSnapshot().characterId,'han');assert.equal(f.profiles.preparationSnapshot().difficulty,'hard');assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempts,'save-only remains save-only');
 f.$('[data-action="start"]').click();f.$('#preparationConfirm').click();await f.settle();assert.equal(events.listenerCount('postrender'),1);
 f.context.scene.challengeFrame={serial:1,run:f.context.challengeRun,duel:f.context.duel};events.emit('postrender');await f.settle();
 assert.equal(f.$('#challengePreparationOverlay').open,false);assert.equal(f.context.duel.player.type,'han');assert.equal(f.context.challengeRun.difficulty,'hard');assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempts+1,'new Start after explicit cancel creates exactly one normal attempt');assert.equal(f.profiles.readProfile().campaign.xp,160);
});

test('retrying the same unpresented receipt without cancel does not create another attempt',async t=>{
 const f=await starterGameEntry();t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});const events=new EventEmitter(),lifecycle=new EventEmitter();f.context.scene={...f.context.scene,game:{events},sys:{events:lifecycle}};
 const pending=f.start();await settle();const receipt=f.context.challengeRun,attempts=f.profiles.readProfile().campaign.attemptSerial;lifecycle.emit('shutdown');await pending;
 f.context.scene={artImages:{},reducedMotion:true};await f.start();assert.equal(f.context.challengeRun,receipt);assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempts);
});

test('cancelled dirty entry keeps its receipt until visible save-manager recovery and then permits editing and start',async t=>{
 const entries=new Map();let fail=false;const storage={getItem:key=>entries.get(key)??null,setItem(key,value){if(fail)throw new Error('quota');entries.set(key,value);}},f=await starterGameEntry({storage});t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});f.context.endChallenge();
 const save=f.profiles.savePreparation;f.profiles.savePreparation=async(...args)=>{const result=await save(...args);fail=true;return result;};
 f.context.openPreparation({intent:'resume',entry:{characterId:'wang',helperId:'han'}});f.$('#preparationConfirm').click();await f.settle();const receipt=f.context.entryPreparationSession,durable=[...entries];assert.ok(receipt);assert.equal(f.profiles.get().dirty,true);
 f.$('#preparationCancel').click();assert.equal(f.context.entryPreparationSession,receipt,'never discard a dirty entry recovery receipt');assert.deepEqual([...entries],durable);
 f.context.openChallenge();f.$('[data-view="save"]').click();fail=false;f.profiles.savePreparation=save;f.$('[data-action="retry-save"]').click();await f.settle();assert.equal(f.profiles.get().dirty,false);assert.equal(f.profiles.get().persisted,true);
 f.$('[data-action="prepare"]').click();f.$('#overview-preparationDifficulty').value='hard';f.$('#overview-preparationDifficulty').dispatchEvent(new f.window.Event('change',{bubbles:true}));f.$('#overview-preparationConfirm').click();await f.settle();assert.equal(f.profiles.preparationSnapshot().difficulty,'hard');
 const attempts=f.profiles.readProfile().campaign.attemptSerial;f.$('[data-action="start"]').click();f.$('#preparationConfirm').click();await f.settle();assert.equal(f.$('#challengePreparationOverlay').open,false);assert.ok(f.context.challengeRun);assert.equal(f.context.challengeRun.difficulty,'hard');assert.equal(f.profiles.readProfile().campaign.attemptSerial,attempts+1);
});

for(const source of ['title','menu'])test(`dirty ${source} entry header opens visible save management and preserves its pending recovery`,async t=>{
 const entries=new Map();let fail=false;const storage={getItem:key=>entries.get(key)??null,setItem(key,value){if(fail)throw new Error('quota');entries.set(key,value);}},f=await starterGameEntry({storage});t.after(()=>f.close());await AsyncChallengeSession.create({progress:f.profiles});f.context.endChallenge();
 const code=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');vm.runInNewContext(code.split('\n').find(line=>line.startsWith("$('#challenge-save-slot').onclick=")),f.context);
 f.context.duel.status=source;f.$('#title-screen').classList.toggle('hidden',source!=='title');f.$('#menu').classList.toggle('hidden',source!=='menu');
 const save=f.profiles.savePreparation;f.profiles.savePreparation=async(...args)=>{const result=await save(...args);fail=true;return result;};
 f.context.openPreparation({intent:'resume',entry:{characterId:'wang',helperId:'han'}});f.$('#preparationConfirm').click();await f.settle();
 const pending=f.profiles.readProfile(),backup=f.profiles.exportBackup(),slotBackup=f.profiles.exportSlotBackup('slot-1'),durable=[...entries];f.$('#preparationCancel').click();
 assert.equal(f.profiles.get().dirty,true);assert.deepEqual(f.profiles.readProfile(),pending);assert.equal(f.profiles.exportBackup(),backup);assert.equal(f.profiles.exportSlotBackup('slot-1'),slotBackup);assert.deepEqual([...entries],durable);
 assert.equal(f.$('#challenge-save-slot').hidden,false);assert.equal(f.$('#challenge-save-slot').dataset.status,'error');
 f.context.challengeActionBusy=true;f.$('#challenge-save-slot').click();assert.equal(f.$('.challenge-overview-v4[open]'),null,'busy gate must remain closed');f.context.challengeActionBusy=false;
 f.$('#challenge-save-slot').click();const overview=f.$('.challenge-overview-v4');assert.ok(overview?.open,'header must present visible save management, not recovery under hidden pause');assert.equal(f.$('button[data-view="save"]').getAttribute('aria-pressed'),'true');assert.ok(f.$('[data-action="retry-save"]'));
 fail=false;f.profiles.savePreparation=save;f.$('[data-action="retry-save"]').click();await f.settle();assert.equal(f.profiles.get().dirty,false);assert.equal(f.profiles.get().persisted,true);assert.deepEqual(f.profiles.readProfile(),pending,'retry persists exactly the retained profile');assert.equal(f.context.entryPreparationSession,null,'successful overview recovery releases abandoned runtime receipt');
});
