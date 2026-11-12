import test from 'node:test';
import assert from 'node:assert/strict';
import {cooldownView,renderCooldownButton} from '../dist/cooldown-view.mjs';
import {gameHarness} from './helpers/game-harness.mjs';

test('remaining filled area shrinks at true full, half, final fraction and zero endpoints',()=>{
 for(const [remaining,ratio,ready,value] of [[6,1,false,'6.0'],[3,.5,false,'3.0'],[.01,.01/6,false,'0.1'],[0,0,true,'✓']]){
  const view=cooldownView(remaining,6);assert.equal(view.ratio,ratio);assert.equal(view.ready,ready);assert.equal(view.value,value);
 }
});
test('invalid, negative and overflow cooldown data never produce NaN or overdraw',()=>{
 for(const [remaining,total,ratio,ready] of [[-1,5,0,true],[20,5,1,false],[NaN,5,0,true],[Infinity,5,0,true],[undefined,5,0,true],[2,0,0,true],[2,Infinity,0,true],[2,-1,0,true]]){
  const view=cooldownView(remaining,total);assert.equal(view.ratio,ratio);assert.equal(view.ready,ready);assert.ok(!/NaN|Infinity|-/.test(view.value));
 }
});
test('button renders numeric time, accessible remaining and distinct ready state without live countdown spam',async()=>{
 const h=await gameHarness(),b=h.specials[0],move={name:'可以這樣插隊喔',hint:'示範 · 中距離',cooldown:6};
 renderCooldownButton(b,move,6);assert.equal(b.querySelector('.cooldown-value').textContent,'6.0');assert.equal(b.querySelector('.cooldown-label').textContent,'秒');
 assert.equal(b.querySelector('.cooldown-sector').getAttribute('d'),'M20 20 L20 3 A17 17 0 1 1 20 37 A17 17 0 1 1 20 3 Z');assert.equal(b.getAttribute('aria-disabled'),'true');assert.match(b.getAttribute('aria-label'),/剩餘 6 秒/);
 renderCooldownButton(b,move,3);assert.equal(b.querySelector('.cooldown-sector').getAttribute('d'),'M20 20 L20 3 A17 17 0 0 1 20 37 Z');
 const writes=b.attributeWrites.length;renderCooldownButton(b,move,2.99);renderCooldownButton(b,move,2.98);assert.equal(b.attributeWrites.length,writes,'stable whole-second accessible label is not rewritten every frame');
 renderCooldownButton(b,move,.01);assert.equal(b.querySelector('.cooldown-value').textContent,'0.1');assert.equal(b.getAttribute('aria-disabled'),'true');
 renderCooldownButton(b,move,0);assert.equal(b.querySelector('.cooldown-value').textContent,'✓');assert.equal(b.querySelector('.cooldown-label').textContent,'就緒');assert.equal(b.getAttribute('aria-disabled'),'false');assert.match(b.getAttribute('aria-label'),/冷卻完成/);assert.equal(b.classList.contains('cooling'),false);assert.equal(b.querySelector('.cooldown-sector').getAttribute('d'),'');
 assert.notEqual(b.getAttribute('aria-live'),'polite');assert.notEqual(b.querySelector('.cooldown-value').getAttribute('role'),'status');
});
test('selection and replay initialize all three cooldowns using the actual selected move metadata',async()=>{
 const h=await gameHarness();for(const type of Object.keys(h.CAST)){
  h.ui.showMenu();h.$('#player-card').onclick();h.$('#roster-'+type).onclick();
  for(const [i,m] of h.CAST[type].moves.entries()){
   const b=h.specials[i];assert.equal(b.querySelector('strong').textContent,m.name);assert.equal(b.querySelector('.cooldown-value').textContent,'✓');assert.match(b.getAttribute('aria-label'),new RegExp(m.name));
  }
 }
});
