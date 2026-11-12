import test from 'node:test';
import assert from 'node:assert/strict';
const factories=await Promise.all([2,3,4].map(async n=>[n,(await import(`../dist/preview/chapter${n}/${n===4?'chapter4':'chapter2'}-controller.mjs`)).createPlayableChapter]));
for(const [chapter,create] of factories)for(const [from,to,oldMax,newMax] of [['han','wang',105,95],['wang','han',95,105]])test(`chapter ${chapter} default factory ${from} to ${to} preserves 50% assist charge through actual next street`,()=>{
 const carry={hp:40,rally:31,assist:{helper:to,used:true,active:false,charge:50,damageTaken:oldMax*.35*.5}};
 const c=create({characterId:from,helperId:to,initialStepId:'entry',initialCarry:carry});
 assert.equal(c.prepareEncounter({...c.preparationSnapshot(),characterId:to,helperId:from},{token:c.view().token,intent:'boundary'}).accepted,true);
 while(c.view().mode==='story')assert.equal(c.nextStory(c.view().token),true);
 assert.equal(c.view().stepId,'route-a');assert.equal(c.world.player.maxHp,newMax);assert.equal(c.world.player.hp,40);assert.equal(c.world.player.rally,31);assert.equal(c.world.player.assist.charge,50);assert.equal(c.world.player.assist.used,true);
 assert.ok(Math.abs(c.world.player.assist.damageTaken-newMax*.35*.5)<1e-10,`expected ${newMax*.35*.5}, got ${c.world.player.assist.damageTaken}`);
});
