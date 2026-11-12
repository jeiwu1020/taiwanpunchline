import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {campaignStorage} from './helpers/campaign-complete-fixture.mjs';
const url=new URL('../dist/preview/finale/finale-session.mjs',import.meta.url);
async function fixture(){assert.ok(existsSync(url),'finale session exists');const f=campaignStorage(),progress=await openChallengeProgress(f),{createFinaleSession}=await import(url),r=await createFinaleSession({progress,rng:()=>.3});assert.equal(r.accepted,true,r.reason);return {...f,progress,chapter:r.chapter};}
test('finale session stages team, win, ending and completion through verified writes',async()=>{
 const {chapter,progress}=await fixture();assert.equal(chapter.view().mode,'team-select');await chapter.start(['wang','han','chen']);assert.equal(chapter.view().mode,'battle');
 chapter.world.player.hp=0;for(const f of chapter.world.actors)if(f.team===1)f.hp=0;chapter.step(.016,{});await chapter.flush();assert.equal(chapter.view().mode,'result');assert.equal(chapter.view().result.winner,'player');assert.equal(progress.readProfile().campaign.cursor.stepId,'ending');
 await chapter.continueResult();assert.equal(chapter.view().mode,'story');while(chapter.view().mode==='story')await chapter.nextStory();assert.equal(chapter.view().mode,'complete');assert.equal(progress.readProfile().campaign.cursor.stepId,'complete');
});
test('victory cannot enter ending or leave while saving fails; retry applies once',async()=>{
 const {chapter,storage,progress}=await fixture();await chapter.start(['han','wang','su']);const write=storage.setItem;storage.setItem=()=>{throw Error('quota');};for(const f of chapter.world.actors)if(f.team===1)f.hp=0;chapter.step(.016,{});await chapter.flush();assert.equal(chapter.view().persisted,false);assert.equal(chapter.view().canNavigate,false);assert.equal((await chapter.continueResult()).accepted,false);assert.equal(chapter.view().mode,'result');
 storage.setItem=write;assert.equal((await chapter.retrySave()).persisted,true);assert.equal(chapter.view().persisted,true);assert.equal(progress.readProfile().campaign.cursor.stepId,'ending');await chapter.continueResult();assert.equal(chapter.view().mode,'story');
});
test('battle resume restarts saved team and loss can reselect without clearing chapters',async()=>{
 const f=await fixture();await f.chapter.start(['chen','ko','ma']);const {createFinaleSession}=await import(url),progress=await openChallengeProgress(f),resumed=await createFinaleSession({progress});assert.deepEqual(resumed.chapter.world.team,['chen','ko','ma']);for(const a of resumed.chapter.world.actors)if(a.team===0)a.hp=0;resumed.chapter.step(.016);await resumed.chapter.flush();assert.equal(resumed.chapter.view().result.matchLost,true);await resumed.chapter.reselect();assert.equal(resumed.chapter.view().mode,'team-select');assert.equal(progress.readProfile().campaign.chapterClears.length,5);
});
test('explicit finale preview never reports a formal save during team, win and ending',async()=>{
 const {createFinalePreview}=await import('../dist/preview/finale/finale-preview.mjs');const {chapter}=await createFinalePreview();assert.equal(chapter.view().persisted,false);const r=await chapter.start(['han','wang','su']);assert.equal(r.preview,true);assert.equal(r.persisted,false);for(const a of chapter.world.actors)if(a.team===1)a.hp=0;chapter.step(.016);await chapter.flush();assert.equal(chapter.view().persisted,false);await chapter.continueResult();while(chapter.view().mode==='story')await chapter.nextStory();assert.equal(chapter.view().mode,'complete');assert.equal(chapter.view().persisted,false);assert.equal(chapter.exportJSON(),null);
});
