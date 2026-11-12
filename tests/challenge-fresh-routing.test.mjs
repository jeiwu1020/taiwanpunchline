import test from 'node:test';
import assert from 'node:assert/strict';
import {openChallengeContinuation} from '../dist/preview/campaign/fresh-router.mjs';
import {newEnvelope,CHALLENGE_KEY,LEGACY_KEYS} from '../dist/preview/campaign/fresh/schema.mjs';
import {createCampaignPlayable} from '../dist/preview/campaign/playable-bridge.mjs';
import {FIRST_CLEAR_STEPS,STEPS,receiptFor} from '../dist/preview/campaign/core/catalog.mjs';
import {memoryLocks} from './helpers/main-unified-fixture.mjs';
import {createPlayableChapter} from '../dist/preview/chapter2/chapter2-controller.mjs';
function fixture(step='entry'){
 const e=newEnvelope(),p=e.campaign.profiles[0];p.campaign.chapterClears=['chapter-1'];p.campaign.cursor={chapterId:'chapter-2',stepId:step};p.unlockedCharacters=['wang','han','huang'];p.campaign.receipts=[...FIRST_CLEAR_STEPS.map(s=>receiptFor('chapter-1',s)),...FIRST_CLEAR_STEPS.filter(s=>STEPS.indexOf(s)<STEPS.indexOf(step)).map(s=>receiptFor('chapter-2',s))];
 const data=new Map([[CHALLENGE_KEY,JSON.stringify(e)],...LEGACY_KEYS.map(k=>[k,'old-untouched'])]),reads=[],writes=[];let fail=false;
 const storage={getItem(k){reads.push(k);return data.get(k)??null;},setItem(k,v){writes.push(k);if(fail&&k===CHALLENGE_KEY)throw Error('quota');data.set(k,String(v));}};
 return {data,reads,writes,storage,locks:memoryLocks(),setFail:v=>fail=v};
}
const open=f=>openChallengeContinuation({...f,mode:'campaign',optIn:true,profileId:'slot-1'});
test('formal continuation reads only v4, never adopts or copies old test data',async()=>{
 const f=fixture(),r=await open(f);assert.equal(r.enabled,true,r.reason);assert.equal(r.view().chapterId,'chapter-2');assert.equal(r.view().generation,0);assert.ok(f.reads.every(k=>k===CHALLENGE_KEY));assert.equal(f.writes.length,0);assert.equal((await r.begin('chapter-2')).persisted,true);assert.ok(f.writes.every(k=>k===CHALLENGE_KEY));
});
test('fresh continuation validates generation and revision before handoff begin',async()=>{
 const f=fixture();for(const handoff of [{profileId:'slot-1',chapterId:'chapter-2',revision:0,generation:1},{profileId:'slot-1',chapterId:'chapter-2',revision:1,generation:0}]){const r=await openChallengeContinuation({...f,mode:'campaign',optIn:true,profileId:'slot-1',handoff});assert.equal(r.enabled,false);assert.equal(r.reason,'stale-handoff');}assert.equal(f.writes.length,0);
});
test('bridge batches same-frame mob rewards and transition before one durable write',async()=>{
 const f=fixture('route-a'),r=await open(f);assert.equal(r.enabled,true,r.reason);const b=await createCampaignPlayable({router:r,chapterId:'chapter-2',createPlayableChapter});assert.equal(b.accepted,true);const c=b.chapter,world=c.world,token=c.view().token;
 const prior=JSON.parse(f.data.get(CHALLENGE_KEY));world.step=()=>{};world.status='gate';world.drainEvents=()=>[{type:'enemyDefeated',encounterId:'a',xp:8},{type:'enemyDefeated',encounterId:'b',xp:8}];f.writes.length=0;f.setFail(true);
 c.step(0);await c.flush();assert.equal(c.world,world);assert.equal(c.view().token,token);assert.equal(c.view().blocked,false);assert.equal(c.view().persisted,false);assert.equal(f.writes.length,1,'one attempted transaction for the whole frame');assert.deepEqual(JSON.parse(f.data.get(CHALLENGE_KEY)),prior);
 f.setFail(false);const recovered=await c.retrySave();assert.equal(recovered.persisted,true,recovered.reason);assert.equal(c.view().stepId,'miniboss-a');assert.equal(JSON.parse(f.data.get(CHALLENGE_KEY)).campaign.profiles[0].campaign.xp,41);assert.equal(c.view().blocked,false);
});
test('formal paused battle edit needs explicit retry; boundary result stays visible',async()=>{
 const f=fixture('miniboss-a'),r=await open(f);assert.equal(r.enabled,true,r.reason);const b=await createCampaignPlayable({router:r,chapterId:'chapter-2',createPlayableChapter}),c=b.chapter;while(c.view().mode==='story'){c.nextStory(c.view().token);await c.flush();}c.setPaused(true,c.view().token);
 const d=c.preparationSnapshot(),before=f.data.get(CHALLENGE_KEY);const denied=await c.prepareEncounter(d,{...d,intent:'boundary'});assert.equal(denied.accepted,false);assert.equal(f.data.get(CHALLENGE_KEY),before);assert.equal((await c.prepareEncounter(d,{...d,intent:'retry'})).persisted,true);
 c.world.status='over';c.world.winner='player';c.world.player.hp=37;c.step(0);await c.flush();assert.equal(c.view().mode,'result');const draft=c.preparationSnapshot(),oldWorld=c.world;const saved=await c.prepareEncounter({...draft,characterId:'han'},{...draft,intent:'boundary'});assert.equal(saved.persisted,true,saved.reason);assert.equal(c.view().mode,'result');assert.equal(c.world,oldWorld);c.continueResult(c.view().token);await c.flush();assert.equal(c.world.player.hp,37);assert.equal(c.world.player.type,'han');
});
