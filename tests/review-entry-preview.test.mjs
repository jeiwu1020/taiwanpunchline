import test from 'node:test';
import assert from 'node:assert/strict';
import {starterGameEntry} from './helpers/starter-game-entry.mjs';
import {memoryStorage} from './helpers/main-unified-fixture.mjs';

test('review: actual root overview can enter first-chapter preview without writing saves', async()=>{
 const storage=memoryStorage(),x=await starterGameEntry({storage,fresh:true});
 try {
  globalThis.document=x.document;
  x.profiles.enterTestMode();
  x.context.openChallenge();
  const start=x.$('.challenge-overview-v4 [data-action="start"]');
  assert.equal(start.disabled,false);
  start.click();
  assert.equal(x.$('#challengePreparationOverlay').open,true);
  x.$('#preparationConfirm').click();
  await x.settle();
  assert.equal(storage.entries.size,0,'preview must not persist');
  assert.ok(x.$('.starter-opening')?.open||x.context.challengeRun,
   'confirming the actual overview preparation must enter the comic or preview run, rather than rejecting test-mode');
 } finally {x.close();}
});
