import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openChallengeProgress} from '../dist/preview/campaign/fresh/progress.mjs';
import {CHALLENGE_KEY,LEGACY_KEYS} from '../dist/preview/campaign/fresh/schema.mjs';
import {fighterBaseStats,deriveFighterStats} from '../dist/fighter-attributes.mjs';
import {createMainCampaignBridge,prepareMainContinuation,campaignContinuationURL} from '../dist/main-campaign-bridge.mjs';
import {Duel} from '../dist/core.mjs';
import {memoryLocks,memoryStorage} from './helpers/main-unified-fixture.mjs';
import {completedChallengeEnvelope} from './helpers/profile-fixtures.mjs';
const game=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
test('main game opens only the fresh v4 authority and constructs no legacy writers',()=>{
 assert.match(game,/await openChallengeProgress\(/);assert.doesNotMatch(game,/openUnifiedProgress|createProfileProgress\(\{|new ChallengeSession\(/);assert.match(game,/AsyncChallengeSession\.create/);
});
test('first chapter commits frame rewards together and awaits durable boss and chapter handoffs',()=>{
 assert.match(game,/await run\.routeEvents\(relevant\)/);assert.match(game,/handleChallengeFrameEvents\(emitted,this\)/);assert.match(game,/await run\.bossWon/);assert.match(game,/await run\.finishChapter\(/);assert.doesNotMatch(game,/下一章未完待續/);
});
async function fixture({chapters=1}={}){
 const old=Object.fromEntries(LEGACY_KEYS.map((key,i)=>[key,`legacy-${i}: original bytes, do not parse or adopt`]));
 const storage=memoryStorage({...old,[CHALLENGE_KEY]:JSON.stringify(completedChallengeEnvelope({chapters}))}),reads=[],get=storage.getItem;
 storage.getItem=key=>{reads.push(key);return get(key);};
 const api=await openChallengeProgress({storage,locks:memoryLocks()});return {storage,api,bridge:createMainCampaignBridge(api),old,reads};
}
test('main bridge writes only v4 and shares challenge skills without leaking into either base mode',async()=>{
 const {storage,api,bridge,old,reads}=await fixture();assert.equal((await bridge.allocate('wang','hp')).persisted,true);
 assert.equal(bridge.derivedStats('wang').maxHp,deriveFighterStats('wang',{challenge:true,skills:{hp:1}}).maxHp);assert.ok(Math.abs(bridge.derivedStats('wang').maxHp-97.85)<1e-10);assert.equal(bridge.get().characters.wang.skills.hp,1);
 for(const mode of ['battle','training']){const d=new Duel('wang','easy',undefined,'han',{mode});assert.equal(d.player.maxHp,fighterBaseStats('wang').maxHp);assert.equal(d.player.maxHp,95);assert.equal(d.enemy.maxHp,105);}
 assert.equal(typeof api.adoptProfile,'undefined');assert.ok(LEGACY_KEYS.every(key=>!reads.includes(key)));for(const [key,value] of Object.entries(old))assert.equal(storage.getItem(key),value);
});
test('fresh continuation blocks dirty data and does not write another revision or navigate',async()=>{
 const {api,storage}=await fixture(),write=storage.setItem;storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY)throw Error('quota');return write(key,value);};
 assert.equal((await api.allocate('wang','hp')).persisted,false);const before=[...storage.entries],revision=api.get().revision;
 const result=await prepareMainContinuation({progress:api,characterId:'wang',helperId:'han',confirm:()=>{throw Error('fresh saves must not ask for adoption');}});
 assert.equal(result.accepted,false);assert.equal(result.url,undefined);assert.equal(api.get().revision,revision);assert.deepEqual([...storage.entries],before);
 assert.equal(campaignContinuationURL({...api.get(),testMode:true}),'preview/chapter2/?test=1&profile=slot-1');
});
test('fresh continuation cannot bypass an incomplete first chapter or mutate the party',async()=>{
 const {api,storage}=await fixture({chapters:0}),before=[...storage.entries];
 const result=await prepareMainContinuation({progress:api,characterId:'han',helperId:'wang',confirm:()=>{throw Error('no adoption');}});
 assert.equal(result.reason,'chapter-1-incomplete');assert.equal(result.url,undefined);assert.equal(api.readProfile().campaign.selection.characterId,'wang');assert.equal(api.readProfile('slot-2').campaign.xp,0);assert.deepEqual([...storage.entries],before);
});
test('fresh continuation uses the saved chapter and only the explicitly selected party',async()=>{
 const {api,storage,old}=await fixture();const result=await prepareMainContinuation({progress:api,characterId:'han',helperId:'huang'});
 assert.equal(result.persisted,true);assert.equal(result.url,'preview/chapter2/?campaign=1&profile=slot-1');assert.deepEqual(api.readProfile().campaign.selection,{characterId:'han',helperId:'huang'});assert.equal(api.readProfile('slot-2').campaign.xp,0);for(const [key,value] of Object.entries(old))assert.equal(storage.getItem(key),value);
});
test('unreleased chapter five never becomes a successful chapter two continuation',()=>{assert.equal(campaignContinuationURL({activeProfileId:'slot-1'}, {campaign:{cursor:{chapterId:'chapter-5'}}}),null);assert.equal(campaignContinuationURL({activeProfileId:'slot-1'},{campaign:{cursor:{chapterId:'finale-3v4'}}}),null);});

test('active encounters reject allocation and duplicate mob rewards without writes; cancellation reopens preparation',async()=>{
 const {api,storage,bridge}=await fixture();const start=await api.beginChallenge({replay:true,chapterId:'chapter-1'});assert.equal(start.persisted,true);
 const raw=storage.getItem(CHALLENGE_KEY);assert.equal((await bridge.allocate('wang','hp')).reason,'active-run');assert.equal(storage.getItem(CHALLENGE_KEY),raw);
 const xp=api.readProfile().campaign.xp;const paid=await api.dispatchChallenge(start.token,{type:'mob-defeated',enemyId:'once',xp:8});assert.equal(paid.persisted,true);const paidRaw=storage.getItem(CHALLENGE_KEY);
 const duplicate=await api.dispatchChallenge(paid.token,{type:'mob-defeated',enemyId:'once',xp:8});assert.equal(duplicate.reason,'duplicate-reward');assert.equal(duplicate.accepted,false);assert.equal(storage.getItem(CHALLENGE_KEY),paidRaw);assert.equal(api.readProfile().campaign.xp,xp+8);
 api.cancelRun();assert.equal((await bridge.allocate('wang','hp')).persisted,true);assert.equal(api.readProfile().characters.wang.skills.hp,1);
});
