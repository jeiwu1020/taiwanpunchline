import test from 'node:test';
import assert from 'node:assert/strict';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
import {newEnvelope,CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
import {memoryStorage} from './helpers/main-unified-fixture.mjs';
const seed=xp=>{const e=newEnvelope();e.campaign.profiles[0].campaign.xp=xp;return memoryStorage({[CHALLENGE_KEY]:JSON.stringify(e)});};
async function settle(x){await x.settle();await x.context.challengeRun?.flush();await x.settle();}
test('overview edit saves configuration without starting or consuming opening',async()=>{
 const storage=seed(160),x=await starterGameEntry({storage,fresh:true});
 globalThis.document=x.document;x.context.openPreparation({intent:'save-only',characterId:'han'});assert.equal(x.$('#preparationInspect').value,'han');
 x.$('[data-skill="hp"][data-delta="1"]').click();x.$('#preparationConfirm').click();await settle(x);
 const p=x.profiles.readProfile();assert.equal(p.characters.han.skills.hp,1);assert.equal(p.campaign.selection.characterId,'wang');assert.equal(p.campaign.story.opening,'unseen');assert.equal(p.campaign.attemptSerial,0);assert.equal(x.context.challengeRun,null);assert.equal(x.starts,0);x.close();
});
test('explicit start saves preparation then presents existing comic before creating encounter',async()=>{
 const storage=seed(160),x=await starterGameEntry({storage,fresh:true});globalThis.document=x.document;x.context.openPreparation({intent:'start',entry:{characterId:'wang',helperId:'han'}});x.$('#preparationConfirm').click();await settle(x);
 assert.equal(x.context.challengeRun,null);assert.equal(x.profiles.readProfile().campaign.story.opening,'unseen');assert.equal(x.$('.starter-opening').open,true);assert.equal(x.starts,0);
 x.$('[data-starter-skip]').click();await settle(x);assert.ok(x.context.challengeRun);assert.equal(x.profiles.readProfile().campaign.story.opening,'seen');assert.equal(x.starts,1);x.close();
});
test('an opening callback from a reset slot generation cannot start a stale run',async()=>{
 const storage=seed(0),x=await starterGameEntry({storage,fresh:true});x.start({characterId:'wang',helperId:'han'});const g=x.profiles.preparationSnapshot();await x.profiles.resetProfile('slot-1',g);const raw=storage.getItem(CHALLENGE_KEY);
 x.$('[data-starter-skip]').click();await settle(x);assert.equal(x.context.challengeRun,null);assert.equal(x.starts,0);assert.equal(storage.getItem(CHALLENGE_KEY),raw);x.close();
});
test('battle preparation is readonly unless explicitly entered as retry',async()=>{
 const storage=seed(160),x=await starterGameEntry({storage,fresh:true});x.start({characterId:'wang',helperId:'han'});x.$('[data-starter-skip]').click();await settle(x);const world=x.context.duel,raw=storage.getItem(CHALLENGE_KEY);
 x.context.openPreparation();assert.equal(x.$('#preparationConfirm').hidden,true);assert.equal(x.$('[data-skill]'),null);x.$('#preparationCancel').click();assert.equal(storage.getItem(CHALLENGE_KEY),raw);assert.equal(x.context.duel,world);x.close();
});
test('closing readonly abilities rearms the existing paused retry gesture',async()=>{
 const x=await starterGameEntry({storage:seed(160),fresh:true});x.start();x.$('[data-starter-skip]').click();await settle(x);x.context.duel.status='paused';let arms=0;x.context.restartOpenGate={arm(){arms++;}};x.context.openPreparation({readOnly:true});x.$('#preparationCancel').click();assert.equal(arms,1);assert.equal(x.context.duel.status,'paused');x.close();
});
test('test-mode preparation applies unlocked character and growth only in memory, then starts preview',async()=>{
 const storage=seed(160),before=storage.getItem(CHALLENGE_KEY),x=await starterGameEntry({storage,fresh:true});globalThis.document=x.document;x.profiles.enterTestMode();
 try{x.context.openPreparation({intent:'save-only',characterId:'ma'});assert.equal(x.$('#preparationInspect').value,'ma');x.$('[data-assign="main"]').click();x.$('[data-skill="hp"][data-delta="1"]').click();x.$('#preparationConfirm').click();await settle(x);
  assert.equal(x.profiles.preparationSnapshot().characterId,'ma');assert.equal(x.profiles.getChallengeStats('ma').maxHp,97.85000000000001);assert.equal(storage.getItem(CHALLENGE_KEY),before);assert.equal(x.profiles.readProfile().campaign.selection.characterId,'wang');
  x.$('[data-action="start"]').click();x.$('#preparationConfirm').click();await settle(x);assert.ok(x.context.challengeRun?.preview);assert.equal(x.context.challengeRun.characterId,'ma');x.$('[data-story-skip]')?.click();await settle(x);assert.equal(x.context.duel.player.maxHp,x.profiles.getChallengeStats('ma').maxHp);assert.match(x.$('#challenge-save-slot').textContent,/測試.*不保存/);assert.equal(storage.getItem(CHALLENGE_KEY),before);
  x.profiles.exitTestMode();assert.equal(x.profiles.preparationSnapshot().characterId,'wang');assert.equal(x.profiles.getChallengeStats('ma').maxHp,95);assert.equal(storage.getItem(CHALLENGE_KEY),before);
 }finally{x.close();}
});
test('a preview comic callback cannot reenter after test-mode exit and reentry',async()=>{
 const storage=seed(0),x=await starterGameEntry({storage,fresh:true});x.profiles.enterTestMode();x.start();x.profiles.exitTestMode();x.profiles.enterTestMode();const before=storage.getItem(CHALLENGE_KEY);x.$('[data-starter-skip]')?.click();await settle(x);assert.equal(x.context.challengeRun,null);assert.equal(x.starts,0);assert.equal(storage.getItem(CHALLENGE_KEY),before);x.close();
});
