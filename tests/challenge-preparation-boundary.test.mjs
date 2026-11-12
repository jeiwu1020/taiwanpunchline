import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveFighterStats} from '../dist/fighter-attributes.mjs';

const carried={hp:37,rally:41,assist:{helper:'han',used:true,active:false,charge:12,damageTaken:29.26}};
const factories=await Promise.all([2,3,4].map(async n=>[n,(await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`)).createPlayableChapter]));
for(const [n,create] of factories){
 const fresh=(step='entry')=>create({characterId:'wang',helperId:'han',difficulty:'easy',initialStepId:step,initialCarry:structuredClone(carried),statsForCharacter:id=>deriveFighterStats(id,{challenge:true}),rng:()=>.2});
 test(`chapter ${n} boundary preparation preserves story position and carried resources`,()=>{
  const c=fresh(),before=c.view();
  c.nextStory(before.token);const frame=c.view().frameIndex;
  const draft={...c.preparationSnapshot(),characterId:'han',helperId:'wang'};
  const result=c.prepareEncounter(draft,{token:c.view().token,intent:'boundary',carry:{...structuredClone(carried),assist:{...carried.assist,helper:'wang',damageTaken:32.34}}});
  assert.equal(result.accepted,true);assert.equal(c.view().mode,'story');assert.equal(c.view().frameIndex,frame,'editing must not restart the comic');
  while(c.view().mode==='story')assert.equal(c.nextStory(c.view().token),true);
  assert.equal(c.world.player.type,'han');assert.equal(c.world.player.hp,37);assert.equal(c.world.player.rally,41);assert.equal(c.world.player.assist.helper,'wang');assert.equal(c.world.player.assist.charge,12);assert.equal(c.world.player.assist.used,true);
 });
 test(`chapter ${n} active or paused battle cannot silently mutate through preparation`,()=>{
  const c=fresh('route-a'),world=c.world,before=c.view(),draft={...c.preparationSnapshot(),characterId:'han'};
  assert.equal(c.prepareEncounter(draft,{token:before.token}).accepted,false);
  assert.equal(c.world,world);assert.equal(c.view().characterId,'wang');
  c.setPaused(true,c.view().token);
  assert.equal(c.prepareEncounter(draft,{token:c.view().token,intent:'boundary'}).accepted,false);
  assert.equal(c.world,world);
 });
 test(`chapter ${n} explicit retry resets this route without changing resource rules`,()=>{
  const c=fresh('route-a');c.setPaused(true,c.view().token);const previous=c.world;
  const result=c.prepareEncounter({...c.preparationSnapshot(),characterId:'han',helperId:'wang'},{token:c.view().token,intent:'retry'});
  assert.equal(result.accepted,true);assert.notEqual(c.world,previous);assert.equal(c.world.player.hp,c.world.player.maxHp);assert.equal(c.world.player.rally,0);assert.equal(c.world.player.assist.charge,100);assert.equal(c.world.player.assist.helper,'wang');
 });
 test(`chapter ${n} safe completed battle edits remain on result until continue`,()=>{
  const c=fresh('miniboss-a');while(c.view().mode==='story')c.nextStory(c.view().token);
  c.world.player.hp=37;c.world.player.rally=41;c.world.player.assist={...carried.assist};c.world.status='over';c.world.winner='player';c.step(0);
  const before=c.view(),oldWorld=c.world;assert.equal(before.result.matchWon,true);
  assert.equal(c.prepareEncounter({...c.preparationSnapshot(),characterId:'han',helperId:'wang'},{token:before.token,intent:'boundary',carry:{...structuredClone(carried),assist:{...carried.assist,helper:'wang',damageTaken:32.34}}}).accepted,true);
  assert.equal(c.view().mode,'result');assert.equal(c.view().stepId,'miniboss-a');assert.equal(c.world,oldWorld);
  assert.equal(c.continueResult(c.view().token),true);assert.equal(c.view().stepId,'route-b');assert.equal(c.world.player.type,'han');assert.equal(c.world.player.hp,37);assert.equal(c.world.player.assist.helper,'wang');assert.equal(c.world.player.assist.charge,12);
 });
}
