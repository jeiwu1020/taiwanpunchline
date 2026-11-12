// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';import assert from 'node:assert/strict';import {Duel} from './helpers/neutral-combat.mjs';
const make=(options={})=>new Duel('wang','easy',()=>0,'han',options);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
for(const side of ['player','enemy'])test(`${side} optional source multipliers are separate and defense applies before HP loss`,()=>{
 for(const [impact,metadata,factor]of [['punch',{},1.1],['item_paper',{p:{itemId:'test'}},1.1],['coin',{},1.2],['rally',{},1.3],['su_shout',{assist:true},1.4]]){
  const other=side==='player'?'enemy':'player';const g=make({[side+'Stats']:{basicMultiplier:1.1,specialMultiplier:1.2,rallyMultiplier:1.3,assistMultiplier:1.4},[other+'Stats']:{defenseMultiplier:.8},[other+'Assist']:'su'});
  const f=g[side],to=g[other];g.request(to,'assist');g.applyDamage({from:f,to,raw:10,impact,castId:30,direction:f.face,knock:0,...metadata});
  close(to.hp,100-10*factor*.8);close(to.assist.damageTaken,10*factor*.8);close(f.rally,impact==='rally'?0:Math.min(25,10*factor*.8*2.5));
 }
});
test('configured HP supports base override, healing, training and recharge threshold',()=>{
 const g=make({playerMaxHp:120,playerStats:{maxHp:130},mode:'training',repeatAssist:false,playerAssist:'su'});assert.equal(g.player.maxHp,130);assert.equal(g.player.hp,130);g.press('assist');g.damage(g.enemy,g.player,20,0);assert.equal(g.player.hp,130);assert.equal(g.player.assist.damageTaken,20);
});
test('movement boost changes walking, not baseline opponent or jump physics',()=>{
 const g=make({playerStats:{moveMultiplier:1.1}});g.step(.02,{right:true},false,{left:true});close(g.player.x,260+245*.02*1.1);close(g.enemy.x,700-245*.02);assert.equal(g.player.vy,0);
});
test('damageTakenMultiplier progression alias reduces actual damage and fixed guard chip',()=>{
 const g=make({enemyStats:{damageTakenMultiplier:.85},playerStats:{basicMultiplier:2}});g.enemy.guard=true;g.damage(g.player,g.enemy,10,0);close(g.enemy.hp,98.3);assert.equal(g.player.rally,0);
});
test('defense combines with armor and calm while baseline no-stats damage stays unchanged',()=>{
 for(const [stance,expected]of [['armor',4.8],['calm',3.2]]){const g=make({enemyStats:{defenseMultiplier:.8}});g.enemy[stance]=1;g.damage(g.player,g.enemy,10,0);close(g.enemy.hp,100-expected);}
 const g=make();g.damage(g.player,g.enemy,10,0);assert.equal(g.enemy.hp,90);
});
test('invalid configured combat multipliers are rejected',()=>{for(const value of [-1,0,Infinity,NaN,'1.2'])assert.throws(()=>make({playerStats:{basicMultiplier:value}}),RangeError);});
test('wall bonus defense reduction counts once toward actual damage',()=>{const g=make({enemyStats:{defenseMultiplier:.8}});g.enemy.x=892;g.applyDamage({from:g.player,to:g.enemy,raw:10,wallBonus:3,direction:1,knock:20,impact:'punch',castId:1});close(g.enemy.hp,89.6);});
