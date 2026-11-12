import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness} from './helpers/game-harness.mjs';
import {memoryStorage} from './helpers/main-unified-fixture.mjs';
import {CHALLENGE_KEY,LEGACY_KEYS} from '../dist/preview/campaign/fresh/schema.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {fighterBaseStats,deriveFighterStats} from '../dist/fighter-attributes.mjs';
import {completedChallengeEnvelope} from './helpers/profile-fixtures.mjs';
import {memoryLocks} from './helpers/main-unified-fixture.mjs';
async function fixture({campaign=true}={}){
 const legacy=Object.fromEntries(LEGACY_KEYS.map((key,index)=>[key,`original legacy ${index}: preserved byte-for-byte`]));
 const initial={...legacy};if(campaign)initial[CHALLENGE_KEY]=JSON.stringify(completedChallengeEnvelope({hpRank:1}));
 const storage=memoryStorage(initial),overviewCalls=[],reads=[],get=storage.getItem;storage.getItem=key=>{reads.push(key);return get(key);};
 // The overview rendering is a named boundary here, not fabricated DOM. Real
 // overview controls are covered by challenge-overview-v4-dom and root entry QA.
 const h=await gameHarness({newProfile:true,storage,mountChallengeOverview:options=>({open:party=>overviewCalls.push({party,controller:options.controller}),hide(){},destroy(){}})});
 h.ui.setScene({artImages:{}});h.document.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 h.window.confirm=()=>true;
 assert.equal(typeof h.ui.profiles.adoptProfile,'undefined');
 return {...h,storage,legacy,overviewCalls,reads};
}
function assertLegacy(h){assert.ok(LEGACY_KEYS.every(key=>!h.reads.includes(key)),'formal entry never reads legacy keys');for(const [key,bytes] of Object.entries(h.legacy))assert.equal(h.storage.entries.get(key),bytes,key+' must remain unchanged');}
function assertStats(actor,stats){assert.equal(actor.maxHp,stats.maxHp);for(const key of ['moveMultiplier','basicMultiplier','specialMultiplier','rallyMultiplier','assistMultiplier'])assert.equal(actor.combatStats[key],stats[key],actor.type+' '+key);assert.equal(actor.combatStats.defenseMultiplier,stats.damageTakenMultiplier);}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function finishStory(h){
 const root=h.$('.app').children.find(el=>el.className==='challenge-story');assert.ok(root?.open);
 // Boss comics have two beats; the legacy preview opening has four. Stop at
 // the real finishing gate, rather than inspecting the still-visible source.
 for(let beat=0;beat<8&&root.open&&root.getAttribute('aria-busy')!=='true';beat++)root.querySelector('[data-story-next]').onclick();
 // This harness has no Phaser emitter. Its production presentation fallback
 // still resolves asynchronously; let both acknowledgments finish before time.
 await tick();assert.equal(root.open,false,'story closes only after successful destination acknowledgment');
 let count=0;while(h.timers.size&&count++<20){const[id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}
 assert.equal(h.timers.size,0);assert.equal(h.ui.gameMode,'challenge');assert.equal(h.ui.duel.status,'active','assert encounter state only after its acknowledged countdown');
}
const arena={popup(){},banner(){}};
test('real main roster shares later unlocks for all four selections in battle and training, without growth bonuses',async()=>{
 const h=await fixture();h.ui.enterFromTitle();
 for(const mode of ['battle','training']){h.$('#mode-'+mode).onclick();for(const [target,id]of [['player','su'],['opponent','ko'],['playerAssist','ma'],['enemyAssist','huang']]){h.$(`[data-roster-target="${target}"]`).onclick();assert.equal(h.$('#roster-'+id).disabled,false);h.$('#roster-'+id).onclick();}await h.ui.startGame();assert.equal(h.ui.duel.player.type,'su');assert.equal(h.ui.duel.enemy.type,'ko');assert.equal(h.ui.duel.player.assist.helper,'ma');assert.equal(h.ui.duel.enemy.assist.helper,'huang');assert.equal(h.ui.duel.player.maxHp,fighterBaseStats('su').maxHp);assert.equal(h.ui.duel.player.maxHp,110);assert.equal(h.ui.duel.enemy.maxHp,105);assertStats(h.ui.duel.player,fighterBaseStats('su'));assertStats(h.ui.duel.enemy,fighterBaseStats('ko'));h.ui.showMenu();}
 h.ui.showTitle();await h.$('#profile-2').onclick();h.ui.enterFromTitle();for(const id of ['su','ko','ma','huang'])assert.equal(h.$('#roster-'+id).disabled,true);
});
test('fresh first chapter replay processes same-frame mobs, duplicate gates and all six phases without regressing later cursor',async()=>{
 const h=await fixture(),api=h.ui.profiles,before=api.readProfile().campaign.cursor,xp=api.readProfile().campaign.xp;
 await h.ui.startChallenge({characterId:'wang',helperId:'su',replay:true});assert.equal(h.ui.duel.player.hp,deriveFighterStats('wang',{challenge:true,skills:{hp:1}}).maxHp);assert.ok(Math.abs(h.ui.duel.player.hp-97.85)<1e-10);assert.equal(h.ui.duel.player.assist.helper,'su');assertStats(h.ui.duel.player,deriveFighterStats('wang',{challenge:true,skills:{hp:1}}));
 for(let phase=0;phase<6;phase+=2){
  assert.equal(h.ui.challenge.checkpoint,phase);const f=h.ui.duel.player;
  const beforeRevision=api.get().revision;h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'mob-a',xp:8,f},{type:'enemyDefeated',encounterId:'mob-b',xp:8,f},{type:'routeGate',carry:{}},{type:'routeGate',carry:{}}],arena);await h.ui.settleChallenge();assert.equal(api.get().revision,beforeRevision+1,'one frame is one atomic save, including duplicate gates');
  assert.equal(h.ui.challenge.checkpoint,phase+1);await finishStory(h);
  assertStats(h.ui.duel.player,deriveFighterStats('wang',{challenge:true,skills:{hp:1}}));if(phase===4){assert.equal(h.ui.duel.enemy.type,'huang');assertStats(h.ui.duel.enemy,fighterBaseStats('huang'));assert.equal(h.ui.duel.enemy.maxHp,95);}else{assert.equal(h.ui.duel.enemy.maxHp,70,'fictional miniboss keeps encounter HP');for(const multiplier of Object.values(h.ui.duel.enemy.combatStats))assert.equal(multiplier,1,'fictional miniboss does not inherit an incidental roster identity');}
  if(phase===4){h.ui.series.record('player');h.ui.series.nextRound();}h.ui.duel.status='over';h.ui.duel.winner='player';h.ui.result();await tick();h.ui.result();await tick();
  assert.equal(h.ui.challenge.checkpoint,phase+2);assert.doesNotMatch(h.$('#result-sub').textContent,/尚未保存/);
  if(phase<4)await h.ui.startGame();
 }
 assert.equal(api.readProfile().campaign.xp,xp+48);assert.deepEqual(api.readProfile().campaign.cursor,before);assertLegacy(h);
 await h.ui.startGame();assert.equal(h.window.location.assigned,undefined);assert.equal(h.ui.challenge,null);assert.equal(h.ui.duel.status,'title');assert.equal(h.overviewCalls.length,1);assert.equal(h.overviewCalls[0].controller,api);assert.deepEqual(api.readProfile().campaign.cursor,before);assert.equal(api.readProfile().campaign.xp,xp+48);assertLegacy(h);
});
test('test first chapter plays all characters without changing any fresh or legacy save key',async()=>{
 const h=await fixture({campaign:false}),before=[...h.storage.entries];h.ui.profiles.enterTestMode();h.ui.refreshProfileAccess();await h.ui.startChallenge({characterId:'su',helperId:'ma',replay:true});await finishStory(h);
 const f=h.ui.duel.player;h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'preview-mob',xp:8,f}],arena);await h.ui.settleChallenge();assert.deepEqual([...h.storage.entries],before);assert.equal(h.ui.profiles.canUse('ko'),true);
});

test('same-frame rewards survive a quota failure and continuation waits for verified retry',async()=>{
 const h=await fixture();await h.ui.startChallenge({replay:true});const api=h.ui.profiles,xp=api.readProfile().campaign.xp,write=h.storage.setItem,raw=h.storage.getItem(CHALLENGE_KEY),revision=api.get().revision;let writes=0;
 h.storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY){writes++;throw Error('quota');}write(key,value);};const f=h.ui.duel.player;
 h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'a',xp:8,f},{type:'enemyDefeated',encounterId:'b',xp:9,f},{type:'routeGate',carry:{}}],arena);await h.ui.settleChallenge();
 assert.equal(writes,1,'the frame attempts one atomic write');assert.equal(api.get().revision,revision+1);assert.equal(h.storage.getItem(CHALLENGE_KEY),raw,'failed write keeps all durable frame state unchanged');assert.equal(api.get().dirty,true);assert.equal(api.readProfile().campaign.xp,xp+17);assert.match(h.$('#result-title').textContent,/尚未保存/);assert.equal(h.window.location.assigned,undefined);assert.equal(h.ui.challenge.checkpoint,0,'scene cursor stays at the original route until durable save');
 h.storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY)writes++;return write(key,value);};const recovery=h.$('#result .paper').children.find(e=>e.id==='challengeRecoveryPanel');await recovery.querySelector('[data-recovery="retry"]').onclick();await tick();assert.equal(api.get().dirty,false);assert.equal(api.readProfile().campaign.xp,xp+17);assert.equal(h.ui.duel.status,'story');assert.equal(h.window.location.assigned,undefined);assert.equal(writes,2,'retry writes the existing pending frame, not new reward mutations');assert.equal(api.get().revision,revision+1);const persisted=JSON.parse(h.storage.getItem(CHALLENGE_KEY));assert.equal(persisted.campaign.profiles[0].campaign.xp,xp+17);assert.equal(persisted.revision,revision+1);assert.equal(h.ui.challenge.checkpoint,1);assertLegacy(h);
});
test('an external tab mutation rejects the old run and never claims a persisted victory',async()=>{
 const h=await fixture();await h.ui.startChallenge({replay:true});const other=await openChallengeProgress({storage:h.storage,locks:memoryLocks()});assert.equal((await other.allocate('wang','move')).persisted,true);
 h.ui.handleChallengeFrameEvents([{type:'routeGate',carry:{}}],arena);await h.ui.settleChallenge();assert.match(h.$('#result-title').textContent,/尚未保存/);assert.doesNotMatch(h.$('#result-sub').textContent,/已保存進度/);assert.equal(h.ui.challenge.checkpoint,0);assert.equal(h.window.location.assigned,undefined);
});

test('leaving is blocked until already received frame rewards are durable, then returns without reopening battle',async()=>{
 const h=await fixture();await h.ui.startChallenge({replay:true});const xp=h.ui.profiles.readProfile().campaign.xp,f=h.ui.duel.player,run=h.ui.challenge;
 h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'before-leave-a',xp:8,f},{type:'enemyDefeated',encounterId:'before-leave-b',xp:9,f}],arena);
 assert.equal(await h.ui.returnToChallengeOverview(),false);assert.equal(h.ui.challenge,run);await h.ui.settleChallenge();assert.equal(h.ui.profiles.readProfile().campaign.xp,xp+17);
 assert.equal(await h.ui.returnToChallengeOverview(),true);assert.equal(h.ui.duel.status,'title');assert.equal(h.ui.challenge,null);assert.equal(h.overviewCalls.length,1);assertLegacy(h);
});

test('a failed party-selection save rebuilds the challenge session after retry before accepting mobs',async()=>{
 const h=await fixture(),api=h.ui.profiles,write=h.storage.setItem;h.storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY)throw Error('quota');write(key,value);};
 await h.ui.startChallenge({characterId:'han',helperId:'su',replay:true});assert.equal(api.get().dirty,true);assert.equal(h.ui.challenge,null,'failed entry never replaces the committed scene with a partial run');assert.match(h.$('#result-title').textContent,/尚未保存/);
 h.storage.setItem=write;await h.ui.startGame();assert.equal(api.get().dirty,false);assert.ok(h.ui.challenge.token);assert.equal(h.ui.duel.player.type,'han');assert.equal(h.ui.duel.player.assist.helper,'su');const xp=api.readProfile().campaign.xp;h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'first-after-retry',xp:8,f:h.ui.duel.player}],arena);await h.ui.settleChallenge();assert.equal(api.readProfile().campaign.xp,xp+8);
});
test('retrying a failed mob XP save preserves the same paused street and defeated enemies',async()=>{
 const h=await fixture();await h.ui.startChallenge({replay:true});const world=h.ui.duel,attempt=h.ui.challenge.attemptId,write=h.storage.setItem;world.player.hp=31;world.player.x=732;world.spawn();assert.ok(world.enemies.length>0);world.enemies[0].hp=0;const enemies=world.enemies;
 h.storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY)throw Error('quota');write(key,value);};h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'xp-only',xp:8,f:world.player}],arena);await h.ui.settleChallenge();assert.equal(h.ui.duel,world);assert.equal(world.status,'paused');assert.equal(h.ui.challenge.checkpoint,0);
 h.storage.setItem=write;const recovery=h.$('#result .paper').children.find(e=>e.id==='challengeRecoveryPanel');await recovery.querySelector('[data-recovery="retry"]').onclick();await tick();assert.equal(h.ui.duel,world);assert.equal(world.status,'paused');assert.equal(world.player.hp,31);assert.equal(world.player.x,732);assert.equal(world.enemies,enemies);assert.equal(world.enemies[0].hp,0);assert.equal(h.ui.challenge.attemptId,attempt);assert.equal(h.$('#result').classList.contains('hidden'),true);assert.equal(h.$('#pause-screen').classList.contains('hidden'),false);
});
test('fixed first-chapter save slot reports queued ordinary mob saves until durable completion',async()=>{
 const h=await fixture();await h.ui.startChallenge({replay:true});let release;const api=h.ui.profiles,original=api.dispatchChallenge.bind(api);api.dispatchChallenge=async(...args)=>{await new Promise(resolve=>release=resolve);return original(...args);};h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'status-mob',xp:8,f:h.ui.duel.player}],arena);assert.match(h.$('#challenge-save-slot').textContent,/保存中|正在保存/);assert.equal(h.$('#challenge-save-slot').dataset.status,'busy');assert.match(h.$('#challenge-save-slot').getAttribute('aria-label'),/正在保存.*請稍候/);assert.match(h.$('#challenge-save-slot').getAttribute('title'),/正在保存.*請稍候/);await tick();assert.equal(h.ui.challenge.busy,true);release();await h.ui.settleChallenge();assert.equal(h.$('#challenge-save-slot').dataset.status,'saved');assert.match(h.$('#challenge-save-slot').textContent,/已保存/);
});
