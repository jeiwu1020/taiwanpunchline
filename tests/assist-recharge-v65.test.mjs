// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from './helpers/neutral-combat.mjs';
const create=(options={})=>new Duel('wang','easy',()=>0,'han',{playerAssist:'su',enemyAssist:'su',...options});
const tick=(g,seconds)=>{for(let t=0;t<seconds;t+=1/120)g.step(1/120,{},false,{});};
for(const side of ['player','enemy']){
 test(`${side}: starts ready, consumes once, and recharges at 35 effective HP damage`,()=>{
  const g=create(),f=g[side],opponent=g.other(f);assert.equal(f.maxHp,100);assert.equal(f.assist.charge,100);
  assert.equal(g.request(f,'assist'),true);assert.equal(f.assist.charge,0);assert.equal(f.assist.damageTaken,0);
  g.damage(opponent,f,34,0);assert.equal(f.assist.used,true);assert.equal(f.assist.damageTaken,34);assert.ok(f.assist.charge<100);
  g.damage(opponent,f,1,0);assert.equal(f.assist.used,false);assert.equal(f.assist.charge,100);
  assert.equal(g.request(f,'assist'),false,'active helper prevents overlapping');tick(g,4);
  assert.equal(g.request(f,'assist'),true);assert.equal(f.assist.damageTaken,0);assert.equal(f.assist.charge,0);
 });
 test(`${side}: stored full meter discards damage and resets on new round`,()=>{
  const g=create(),f=g[side];g.damage(g.other(f),f,40,0);assert.equal(f.assist.damageTaken,0);tick(g,.3);
  assert.equal(g.request(f,'assist'),true);assert.equal(f.assist.charge,0);g.damage(g.other(f),f,40,0);
  assert.equal(f.assist.damageTaken,35);assert.equal(f.assist.charge,100);tick(g,4);
  assert.equal(g.request(f,'assist'),true);assert.equal(f.assist.charge,0);
  const next=create();assert.equal(next[side].assist.used,false);assert.equal(next[side].assist.charge,100);assert.equal(next[side].rally,0);
 });
}
test('mitigated chip, armor and calm charge only their actual HP loss',()=>{
 for(const [defense,loss]of [['guard',2],['armor',6],['calm',4],['reject',0],['counter',0]]){
  const g=create();g.request(g.enemy,'assist');g.enemy[defense]=defense==='guard'?true:1;g.damage(g.player,g.enemy,10,0);
  assert.equal(g.enemy.assist.damageTaken,loss,defense);assert.equal(g.enemy.hp,100-loss,defense);
 }
});
test('healing never clears accumulated damage; normal healing respects max HP',()=>{
 const g=create();g.press('assist');g.damage(g.enemy,g.player,20,0);tick(g,4);
 assert.equal(g.press('special3'),true);tick(g,2);assert.ok(g.player.hp>80);assert.equal(g.player.assist.damageTaken,20);
 g.damage(g.enemy,g.player,15,0);assert.equal(g.player.assist.charge,100);
});
test('overkill is capped to HP loss, including training auto-heal',()=>{
 const g=create({mode:'training',repeatAssist:false});g.request(g.enemy,'assist');g.enemy.hp=3;
 g.damage(g.player,g.enemy,80,0);assert.equal(g.enemy.assist.damageTaken,3);assert.equal(g.enemy.hp,100);
});
test('wall damage counts once and threshold scales to configured max HP',()=>{
 const g=create({enemyMaxHp:200});assert.equal(g.enemy.hp,200);assert.equal(g.enemy.maxHp,200);g.request(g.enemy,'assist');
 g.enemy.x=892;g.player.x=780;
 g.applyDamage({from:g.player,to:g.enemy,raw:10,knock:20,wallBonus:3,direction:1,castId:2,impact:'punch'});
 assert.equal(g.enemy.assist.damageTaken,13);assert.equal(g.enemy.hp,187);
 g.damage(g.player,g.enemy,57,0);assert.equal(g.enemy.assist.charge,100);assert.equal(g.enemy.assist.damageTaken,70);
});
test('damage without a helper does not accumulate an unusable reserve',()=>{const g=new Duel();g.damage(g.player,g.enemy,30,0);assert.equal(g.enemy.assist.damageTaken,0);assert.equal(g.assistReady(g.enemy),false);});
test('meter view exposes charging, active and ready without changing state',async()=>{
 const {assistMeterView}=await import('../dist/assist-rules.mjs');assert.equal(typeof assistMeterView,'function');
 const g=create();assert.deepEqual(assistMeterView(g.player),{charge:100,ready:true,active:false,damageTaken:0,damageRequired:35});
 g.press('assist');g.damage(g.enemy,g.player,7,0);assert.deepEqual(assistMeterView(g.player),{charge:20,ready:false,active:true,damageTaken:7,damageRequired:35});
});
