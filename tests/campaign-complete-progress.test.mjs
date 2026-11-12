import test from 'node:test';
import assert from 'node:assert/strict';
import {startRun,applyRunAction} from '../dist/preview/campaign/core/transition.mjs';
import {validateDocument} from '../dist/preview/campaign/core/model.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
import {campaignThrough,campaignStorage} from './helpers/campaign-complete-fixture.mjs';

test('existing fifth-chapter checkpoint begins through the v4 authority',async()=>{
 const f=campaignStorage(4),api=await openChallengeProgress(f),before=f.storage.getItem(CHALLENGE_KEY);
 const r=await api.beginChallenge({chapterId:'chapter-5'});assert.equal(r.accepted,true,r.reason);assert.equal(r.persisted,true);assert.equal(r.run.stepId,'entry');assert.notEqual(f.storage.getItem(CHALLENGE_KEY),before);
});
test('old finale-ready saves remain valid and can select exactly three distinct unlocked fighters',()=>{
 const d=campaignThrough();assert.equal(validateDocument(d).ok,true);const begun=startRun(d);assert.equal(begun.ok,true,begun.reason);
 for(const team of [['wang','wang','han'],['wang','han'],['wang','han','unknown']])assert.equal(applyRunAction(begun.document,begun.run,{type:'finale-start',team}).ok,false);
 const r=applyRunAction(begun.document,begun.run,{type:'finale-start',team:['wang','huang','chen']});assert.equal(r.ok,true,r.reason);assert.equal(r.run.stepId,'battle');assert.deepEqual(r.document.profiles[0].campaign.finale.team,['wang','huang','chen']);
 const resumed=startRun(r.document);assert.equal(resumed.ok,true);assert.equal(resumed.run.stepId,'battle');
});
test('finale clear and ending are durable distinct checkpoints with one first-clear award',async()=>{
 const f=campaignStorage(),api=await openChallengeProgress(f);let r=await api.beginChallenge({chapterId:'finale-3v4'});assert.equal(r.accepted,true,r.reason);
 r=await api.dispatchChallenge(r.token,{type:'finale-start',team:['han','su','ma']});assert.equal(r.persisted,true,r.reason);const xp=api.readProfile().campaign.xp;
 r=await api.dispatchChallenge(r.token,{type:'finale-win'});assert.equal(r.persisted,true,r.reason);assert.equal(api.readProfile().campaign.cursor.stepId,'ending');assert.equal(api.readProfile().campaign.xp,xp+160);
 const fresh=await openChallengeProgress(f);let end=await fresh.beginChallenge({chapterId:'finale-3v4'});assert.equal(end.run.stepId,'ending');
 assert.equal((await fresh.dispatchChallenge(end.token,{type:'finale-win'})).accepted,false);
 end=await fresh.dispatchChallenge(end.token,{type:'story-complete'});assert.equal(end.persisted,true,end.reason);assert.equal(fresh.readProfile().campaign.cursor.stepId,'complete');assert.equal(fresh.readProfile().campaign.finale.status,'completed');
 const complete=await fresh.beginChallenge({chapterId:'finale-3v4'});assert.equal(complete.run.stepId,'complete');assert.equal(fresh.readProfile().campaign.xp,xp+160);
});
test('finale retries preserve XP and original team; reselect is explicit',()=>{
 let r=startRun(campaignThrough());assert.equal(r.ok,true,r.reason);r=applyRunAction(r.document,r.run,{type:'finale-start',team:['wang','han','chen']});assert.equal(r.ok,true,r.reason);const xp=r.document.profiles[0].campaign.xp;
 r=applyRunAction(r.document,r.run,{type:'retry'});assert.equal(r.ok,true,r.reason);assert.equal(r.run.stepId,'battle');assert.equal(r.document.profiles[0].campaign.xp,xp);
 r=applyRunAction(r.document,r.run,{type:'finale-reselect'});assert.equal(r.ok,true,r.reason);assert.equal(r.run.stepId,'team-select');
 assert.equal(applyRunAction(r.document,r.run,{type:'finale-win'}).ok,false);
});
test('failed finale write freezes authority until verified retry; stale tokens and other slots stay safe',async()=>{
 const f=campaignStorage(),api=await openChallengeProgress(f);let r=await api.beginChallenge({chapterId:'finale-3v4'});assert.equal(r.accepted,true,r.reason);r=await api.dispatchChallenge(r.token,{type:'finale-start',team:['wang','han','chen']});assert.equal(r.persisted,true,r.reason);
 const old=r.token,write=f.storage.setItem,before=f.storage.getItem(CHALLENGE_KEY),slot2=api.readProfile('slot-2');f.storage.setItem=()=>{throw Error('quota');};
 r=await api.dispatchChallenge(r.token,{type:'finale-win'});assert.equal(r.accepted,true,r.reason);assert.equal(r.persisted,false);assert.equal(f.storage.getItem(CHALLENGE_KEY),before);assert.equal((await api.dispatchChallenge(r.token,{type:'story-complete'})).accepted,false);
 f.storage.setItem=write;assert.equal((await api.retrySave()).persisted,true);assert.equal((await api.dispatchChallenge(old,{type:'finale-win'})).accepted,false);assert.deepEqual(api.readProfile('slot-2'),slot2);
});
test('finale cannot start before five clears or by forged cursor',()=>{
 const d=campaignThrough(4);d.profiles[0].campaign.cursor={chapterId:'finale-3v4',stepId:'team-select'};assert.equal(validateDocument(d).ok,false);assert.equal(startRun(d).ok,false);
});
