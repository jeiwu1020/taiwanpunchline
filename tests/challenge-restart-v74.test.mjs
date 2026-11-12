import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness} from './helpers/game-harness.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';

const press=(h,id,pointerId=1)=>{const button=h.$(id);button.handlers.pointerdown({pointerId});button.onclick({detail:1,pointerId});};
const count=h=>{let guard=0;while(h.timers.size&&guard++<20){const[id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}assert.equal(h.timers.size,0);};
const escape=h=>h.window.handlers.keydown({code:'Escape',target:h.$('#game'),preventDefault(){}});
async function setup(checkpoint=2){
 const h=await gameHarness();h.ui.setScene({artImages:{}});
 // Replace only animation scheduling, while using the actual story/UI lifecycle.
 // Let the entry and destination acknowledgment promises settle before
 // advancing the fake countdown, including the no-Phaser boundary here.
 h.document.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 const progress=h.ui.challengeProgress,session=await AsyncChallengeSession.create({progress:h.ui.profiles});
 while(session.checkpoint<checkpoint){if(session.phase.kind==='route')await session.routeComplete({});else await session.bossWon({});}
 h.ui.profiles.cancelRun();await progress.allocate('wang','hp');
 await h.ui.startChallenge({characterId:'wang',helperId:'han'});
 if(checkpoint%2){const story=h.$('.app').children.find(el=>el.className==='challenge-story');story.querySelector('[data-story-next]').onclick();story.querySelector('[data-story-next]').onclick();await new Promise(resolve=>setImmediate(resolve));count(h);}
 return h;
}
const savedProgress=h=>{const p=h.ui.challengeProgress.get();return {xp:p.xp,checkpoint:p.checkpoint,characters:p.characters,unlockedCharacters:p.unlockedCharacters};};

test('street retry confirms a fresh attempt at the current route start without losing saved growth',async()=>{
 const h=await setup(),before=h.ui.duel,run=h.ui.challenge;
 assert.equal((await run.rewardMob({encounterId:'market-0',xp:9})).persisted,true);
 const saved=savedProgress(h),attempt=run.attemptId,startX=before.player.x;
 before.player.x=1000;before.player.depth=75;before.player.hp=13;before.player.rally=90;before.player.assist.used=true;before.player.assist.charge=0;before.player.cooldowns[0]=5;
 run.carry={hp:13,rally:90};h.ui.pauseGame();
 assert.equal(h.$('#restart-match').hidden,false);
 assert.match(h.$('#restart-match').textContent,/重試本路段/);
 press(h,'#restart-match');assert.equal(h.$('#restart-confirm').hidden,false);assert.equal(h.ui.duel,before);
 assert.match(h.$('#restart-confirm-note').textContent,/路段起點/);assert.match(h.$('#restart-confirm-note').textContent,/經驗.*保留/);
 h.$('#restart-confirm-button').onclick({detail:1,pointerId:1});assert.equal(h.ui.duel,before,'the initiating release cannot confirm');
 press(h,'#restart-confirm-button',2);await new Promise(resolve=>setImmediate(resolve));
 const after=h.ui.duel;assert.notEqual(after,before);assert.equal(after.status,'active');assert.equal(after.depthMode,true);assert.equal(after.sectionIndex,1);
 assert.equal(after.player.x,startX);assert.equal(after.player.depth,0);assert.equal(after.player.hp,95*1.03);assert.equal(after.player.rally,0);
 assert.equal(after.player.assist.helper,'han');assert.equal(after.player.assist.used,false);assert.equal(after.player.assist.charge,100);assert.deepEqual([...after.player.cooldowns],[0,0,0]);
 assert.equal(h.ui.challenge,run);assert.equal(run.checkpoint,2);assert.equal(run.carry,null);assert.notEqual(run.attemptId,attempt);assert.deepEqual(savedProgress(h),saved);
 assert.equal(h.$('#restart-confirm').hidden,true);assert.equal(h.$('#pause').textContent,'Ⅱ 暫停');
 press(h,'#restart-confirm-button',3);assert.equal(h.ui.duel,after,'a double confirmation cannot retry twice');
 assert.equal((await run.rewardMob({encounterId:'market-0',xp:9})).persisted,true,'new attempt keeps the established repeat-mob XP behavior');
 assert.equal(h.ui.challengeProgress.get().xp,saved.xp+9);
});

test('street cancellation, Escape and resume never reset the current route or leave a live confirmation',async()=>{
 const h=await setup(),before=h.ui.duel,saved=savedProgress(h),attempt=h.ui.challenge.attemptId;
 before.player.hp=33;before.player.x=600;h.ui.pauseGame();press(h,'#restart-match');
 assert.equal(h.$('#restart-confirm').hidden,false);
 h.$('#restart-cancel').onclick();assert.equal(h.$('#restart-confirm').hidden,true);assert.equal(before.status,'paused');
 press(h,'#restart-confirm-button');assert.equal(h.ui.duel,before);
 press(h,'#restart-match');escape(h);assert.equal(h.$('#restart-confirm').hidden,true);assert.equal(before.status,'paused');
 press(h,'#restart-match');h.$('#resume').onclick();assert.equal(before.status,'active');assert.equal(h.$('#restart-confirm').hidden,true);
 press(h,'#restart-confirm-button');assert.equal(h.ui.duel,before);assert.equal(before.player.hp,33);assert.equal(before.player.x,600);
 assert.equal(h.ui.challenge.attemptId,attempt);assert.deepEqual(savedProgress(h),saved);
});

test('home confirmation blocks the underlying street retry and cancel restores the paused route',async()=>{
 const h=await setup(),before=h.ui.duel;h.ui.pauseGame();press(h,'#restart-match');assert.equal(h.$('#restart-confirm').hidden,false);
 h.$('#home').onclick();assert.equal(h.$('#restart-confirm').hidden,true,'home supersedes the nested retry confirmation');
 press(h,'#restart-match');press(h,'#restart-confirm-button');assert.equal(h.ui.duel,before);assert.equal(h.$('#restart-confirm').hidden,true);
 h.$('#home-cancel').onclick();assert.equal(before.status,'paused');press(h,'#restart-match');assert.equal(h.$('#restart-confirm').hidden,false);
 press(h,'#restart-confirm-button',2);await new Promise(resolve=>setImmediate(resolve));assert.notEqual(h.ui.duel,before);
});

for(const checkpoint of [1,3,5])test(`boss checkpoint ${checkpoint} retries only its encounter, resetting the whole final series`,async()=>{
 const h=await setup(checkpoint),before=h.ui.duel,saved=savedProgress(h),run=h.ui.challenge,enemy=before.enemy.type;
 if(checkpoint===5)h.ui.series.record('player');before.player.hp=7;before.player.rally=89;before.player.assist.used=true;
 h.ui.pauseGame();assert.equal(h.$('#restart-match').hidden,false);assert.match(h.$('#restart-match').textContent,/重試本場/);
 press(h,'#restart-match');assert.equal(h.$('#restart-confirm').hidden,false);
 if(checkpoint===5)assert.match(h.$('#restart-confirm-note').textContent,/三戰兩勝.*歸零/);
 press(h,'#restart-confirm-button',2);await new Promise(resolve=>setImmediate(resolve));
 assert.notEqual(h.ui.duel,before);assert.equal(h.ui.duel.status,'countdown');assert.equal(h.ui.duel.depthMode,undefined);assert.equal(h.ui.duel.enemy.type,enemy);
 assert.equal(h.ui.challenge,run);assert.equal(run.checkpoint,checkpoint);assert.equal(h.ui.series.target,checkpoint===5?2:1);
 assert.deepEqual({...h.ui.series.score},{player:0,enemy:0});assert.equal(h.ui.series.round,1);assert.equal(h.ui.duel.player.hp,checkpoint===1?95:95*1.03);assert.equal(h.ui.duel.player.rally,0);assert.equal(h.ui.duel.player.assist.used,false);
 assert.deepEqual(savedProgress(h),saved);count(h);assert.equal(h.ui.duel.status,'active');
});

test('pending root restart rejects resume, Escape and home until durable completion',async()=>{
 const h=await setup(),before=h.ui.duel;h.ui.pauseGame();let release;const original=h.ui.challenge.retry.bind(h.ui.challenge);h.ui.challenge.retry=async()=>{await new Promise(resolve=>release=resolve);return original();};press(h,'#restart-match');press(h,'#restart-confirm-button',2);await new Promise(resolve=>setImmediate(resolve));h.$('#resume').onclick();assert.equal(before.status,'paused');escape(h);assert.equal(before.status,'paused');h.$('#home').onclick();assert.equal(h.$('#home-confirm').classList.contains('hidden'),true);release();await new Promise(resolve=>setImmediate(resolve));assert.notEqual(h.ui.duel,before);
});
test('two fresh result retry clicks while persistence waits create exactly one new attempt',async()=>{
 const h=await setup(),run=h.ui.challenge;h.ui.duel.status='over';h.ui.duel.winner='enemy';h.ui.result();await new Promise(r=>setImmediate(r));const attempt=run.attemptId,original=run.progress.dispatchChallenge.bind(run.progress);let release,calls=0;run.progress.dispatchChallenge=async(...args)=>{if(calls++===0)await new Promise(r=>release=r);return original(...args);};press(h,'#replay',1);await new Promise(r=>setImmediate(r));press(h,'#replay',2);await new Promise(r=>setImmediate(r));release();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));assert.equal(calls,1);assert.equal(run.attemptId,attempt+1);
});
