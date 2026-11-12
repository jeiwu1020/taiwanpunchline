import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {AsyncChallengeSession} from '../dist/preview/campaign/unified/first-chapter.mjs';
import {createMainCampaignBridge} from '../dist/main-campaign-bridge.mjs';
import {memoryStorage,memoryLocks} from './helpers/main-unified-fixture.mjs';
const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
test('replay completion returns to overview without advancing normal chapter or navigating',async()=>{
 const p=await openChallengeProgress({storage:memoryStorage(),locks:memoryLocks()});let r=await p.beginChallenge();for(const type of ['story-complete','route-complete','boss-win','route-complete','boss-win','route-complete','story-complete','boss-win','story-complete','continue'])r=await p.dispatchChallenge(r.token,{type});p.cancelRun();const before=structuredClone(p.readProfile().campaign.cursor);
 const run=await AsyncChallengeSession.create({progress:p,replay:true});for(let i=0;i<3;i++){await run.routeComplete({hp:35});await run.bossWon({hp:37});}
 const els=new Map(),$=s=>{if(!els.has(s))els.set(s,{});return els.get(s);};let overview=0,home=0,nav=0;
 const ctx={$,challengeRun:run,profileProgress:p,challengeProgress:createMainCampaignBridge(p),syncChallengeSaveSlot(){},challengeAfterResult:null,challengeSaved:r=>r.accepted&&r.persisted,showChallengeSaveFailure(){throw Error('unexpected save failure');},showTitle(){home++;},openChallenge(){overview++;},continueCampaign(){nav++;},selected:'wang',playerAssist:'han',startChallengePhase(){throw Error('unexpected fight');}};
 vm.runInNewContext(source.slice(source.indexOf('function renderChallengeResult('),source.indexOf('let campaignNavigationPending=')),ctx);ctx.renderChallengeResult(run,true,{name:'章末頭目'});assert.match($('#replay').textContent,/返回.*總覽/);assert.match($('#result-sub').textContent,/原.*進度.*保留/);await ctx.challengeAfterResult();assert.equal(overview,1);assert.equal(home,1);assert.equal(nav,0);assert.deepEqual(p.readProfile().campaign.cursor,before);
});
