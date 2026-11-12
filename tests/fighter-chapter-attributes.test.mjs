import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveFighterStats} from '../dist/fighter-attributes.mjs';
const rows={wang:[95,1.06,.96,1],han:[105,.94,.96,1],ma:[95,1.04,1.02,1],su:[110,.96,1.04,1.04],huang:[95,1,.98,.96],chen:[95,1.04,.98,.98],ko:[105,.96,1.06,1.04]};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const chapter of [2,3,4]){
 const module=await import(`../dist/preview/chapter${chapter}/chapter${chapter===3?2:chapter}-engine.mjs`);
 const route=module[`createChapter${chapter===3?2:chapter}Route`],duel=module[`createChapter${chapter===3?2:chapter}Duel`];
 for(const [id,[hp,speed,basic,defense]] of Object.entries(rows))test(`chapter ${chapter} ${id}: actual chapter factory uses shared zero growth for streets and bosses`,()=>{
  for(const stats of [undefined,deriveFighterStats(id,{challenge:true})]){
   for(const routeIndex of [0,1,2]){const g=route({routeIndex,characterId:id,stats});assert.equal(g.player.maxHp,hp);close(g.growth.moveMultiplier,speed);close(g.growth.basicMultiplier,basic);close(g.growth.defenseMultiplier,defense);g.spawn();for(const e of g.enemies){assert.equal(e.maxHp,e.spec.hp);assert.equal(e.combatStats,undefined);}}
   for(const stepId of ['miniboss-a','miniboss-b','boss']){const g=duel({stepId,characterId:id,stats});assert.equal(g.player.maxHp,hp);close(g.player.combatStats.moveMultiplier,speed);close(g.player.combatStats.basicMultiplier,basic);close(g.player.combatStats.defenseMultiplier,defense);if(stepId!=='boss')assert.equal(g.enemy.maxHp,70);}
  }
 });
}
for(const chapter of [2,3,4]){
 const {createPlayableChapter}=await import(`../dist/preview/chapter${chapter}/chapter${chapter===3?2:chapter}-controller.mjs`);
 for(const [id,[hp,speed,basic,defense]] of Object.entries(rows))test(`chapter ${chapter} ${id}: controller's real resumed street and boss use zero-point character defaults`,()=>{
  for(const initialStepId of ['route-a','route-b','route-c','miniboss-a','miniboss-b','boss']){
   const c=createPlayableChapter({initialStepId,characterId:id,unlockedIds:Object.keys(rows),helperId:'han',statsForCharacter:id=>deriveFighterStats(id,{challenge:true})});
   while(c.view().mode==='story')c.nextStory(c.view().token);
   const g=c.world;assert.equal(g.player.maxHp,hp);close((g.growth??g.player.combatStats).moveMultiplier,speed);close((g.growth??g.player.combatStats).basicMultiplier,basic);close((g.growth??g.player.combatStats).defenseMultiplier,defense);
   if(initialStepId.startsWith('miniboss'))assert.equal(g.enemy.maxHp,70);
  }
 });
}
