import test from 'node:test';
import assert from 'node:assert/strict';
import {createFinalePreview} from '../dist/preview/finale/finale-preview.mjs';
import {createFinaleSession} from '../dist/preview/finale/finale-session.mjs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {campaignStorage} from './helpers/campaign-complete-fixture.mjs';
import {FINALE_OPENING,FINALE_VERDICT} from '../dist/preview/finale/finale-story.mjs';

for(const preview of [true,false])test(`${preview?'memory quick-view':'saved campaign'} opening keeps three versus four frozen until the bell`,async()=>{
 const progress=preview?null:await openChallengeProgress(campaignStorage());
 const {chapter}=preview?await createFinalePreview():await createFinaleSession({progress});
 // Han is on the opposing team here; his joke must not pretend he belongs to the three.
 await chapter.start(['chen','ko','ma'],{opening:true});
 assert.equal(chapter.view().mode,'intro');assert.equal(chapter.world.actors.length,7);
 const hp=chapter.world.actors.map(f=>f.hp),remaining=chapter.world.remaining;
 chapter.step(3,{punch:true});assert.equal(chapter.press('special1'),false);
 assert.deepEqual(chapter.world.actors.map(f=>f.hp),hp);assert.equal(chapter.world.remaining,remaining);
 assert.equal(chapter.view().storyFrame.speaker,'咆哮哥');await chapter.nextStory();
 assert.equal(chapter.view().storyFrame.speaker,'韓國魚');
 assert.equal(chapter.view().storyFrame.copy,'什麼撕髮不公？只有我可以無髮無天！');
 await chapter.nextStory();assert.match(chapter.view().storyFrame.copy,/裁判.*觀眾/);
 await chapter.nextStory();assert.equal(chapter.view().mode,'battle');
 assert.deepEqual(chapter.world.team,['chen','ko','ma']);assert.equal(chapter.world.remaining,150);
 assert.equal(chapter.world.actors.filter(f=>f.team===0).length,3);assert.equal(chapter.world.actors.filter(f=>f.team===1).length,4);
 if(progress)assert.equal(progress.readProfile().campaign.cursor.stepId,'battle');
});
test('the joke is short, team-neutral and echoed in the verdict',()=>{
 assert.equal(FINALE_OPENING.length,3);assert.ok(FINALE_OPENING.every(f=>f.copy.length<90&&!f.copy.includes('我們三個')));
 assert.match(FINALE_VERDICT.win,/三個打贏四個/);assert.match(FINALE_VERDICT.win,/觀眾/);
});
