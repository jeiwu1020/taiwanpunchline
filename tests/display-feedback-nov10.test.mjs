import test from 'node:test';
import assert from 'node:assert/strict';
import {createProloguePlayer} from '../dist/starter-prologue.mjs';
import {paintStarterComic} from '../dist/starter-comic-layout.mjs';
import {gameHarness} from './helpers/game-harness.mjs';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
for(const characterId of ['wang','han'])test(`${characterId}: sealed microphone remains until the disappearance sentence, including back/replay`,()=>{
 const player=createProloguePlayer({characterId});
 for(let i=0;i<4;i++)player.next();
 const sourceX=()=>{const calls=[],news={id:'news'};const ctx=new Proxy({drawImage:(...args)=>calls.push(args)},{get:(o,k)=>o[k]??(()=>{})});paintStarterComic(ctx,{news},player.scene,844,390);return calls.find(c=>c[0]===news)[1];};
 assert.equal(player.scene.id,'seal');assert.equal(player.scene.visibleBubbleCount,1);assert.equal(sourceX(),0);
 player.next();assert.equal(sourceX(),768);player.previous();assert.equal(sourceX(),0);player.replay();for(let i=0;i<4;i++)player.next();assert.equal(sourceX(),0);
});
test('hit popups show whole numbers without changing the fractional event amount',async()=>{
 const h=await gameHarness(),texts=[],amount=7.200000000000001;
 const e={type:'block',from:h.ui.duel.enemy,to:h.ui.duel.player,f:h.ui.duel.enemy,amount,impact:'punch'};
 const graphics=new Proxy({},{get:()=>()=>{}});
 h.ui.Arena.prototype.event.call({reducedMotion:true,popup:(x,y,text)=>texts.push(text),add:{graphics:()=>graphics},tweens:{add(){}},lastArtPose:new Map()},e);
 assert.ok(texts.includes('−7'));assert.equal(e.amount,amount);
});
test('route microphone no longer takes width from either health panel',()=>{
 for(const portrait of [false,true]){
  const opts={portrait,width:portrait?390:844,height:portrait?844:390},route=combatStyles({...opts,depth:true}),duel=combatStyles({...opts,depth:false});
  try{assert.equal(route.style('.dom-hud').right,duel.style('.dom-hud').right);}finally{route.close();duel.close();}
 }
});
