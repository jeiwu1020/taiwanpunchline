import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const moduleURL=new URL('../dist/preview/chapter5/chapter5-controller.mjs',import.meta.url);
test('chapter five plays all three routes, two minibosses, BO3 and unlocks the seventh character',async()=>{
 assert.equal(existsSync(moduleURL),true,'fifth chapter must exist');
 const {createPlayableChapter}=await import(moduleURL);const c=createPlayableChapter({characterId:'han',rng:()=>.3});
 const advance=()=>{let n=0;while(c.view().mode==='story'){assert.ok(++n<20);assert.equal(c.nextStory(c.view().token),true);}};
 advance();
 for(let route=0;route<3;route++){
  assert.equal(c.view().mode,'route');assert.ok(c.world.depthMode);c.world.player.x=c.world.worldWidth-100;c.step(.016,{});advance();
  assert.equal(c.view().mode,'battle');assert.equal(c.world.enemy.type,route===2?'chen':route===0?'wang':'huang');
  c.world.enemy.hp=0;c.step(.016);assert.equal(c.view().result.matchWon,route!==2);c.continueResult(c.view().token);
  if(route===2){assert.equal(c.view().mode,'battle');c.world.enemy.hp=0;c.step(.016);assert.equal(c.view().result.matchWon,true);c.continueResult(c.view().token);}
  advance();
 }
 assert.equal(c.view().mode,'choice');assert.ok(c.view().unlocked.includes('chen'));assert.equal(c.finishChapter(c.view().token),true);assert.equal(c.view().nextChapterId,'finale-3v4');
});
