import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from '../dist/core.mjs';
import {COMBAT,JUMP_SPEED} from '../dist/combat-rules.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {deriveFighterStats} from '../dist/fighter-attributes.mjs';
const full={hp:5,move:5,basic:5,defense:5,special:5,rally:5,assist:5};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const mode of ['vs','training','challenge'])for(const side of ['player','enemy'])test(`${mode}/${side}: item shares basic, each special category uses its own multiplier, assist recharges on effective HP loss`,()=>{
 for(const [impact,extra,factor] of [['punch',{},1.06],['item_paper',{p:{itemId:'paper'}},1.06],['ko_bags',{},1],['rally',{},1],['su_shout',{assist:true},1]]){
  const stats=mode==='challenge'?deriveFighterStats('ko',{skills:full,challenge:true}):undefined;
  const g=new Duel('ko','easy',()=>.5,'ko',{mode:mode==='training'?'training':'vs',infiniteHealth:false,repeatAssist:false,playerAssist:'su',enemyAssist:'su',playerStats:stats,enemyStats:stats});
  const from=g[side],to=g.other(from);g.request(to,'assist');const before=to.hp,damage=6*factor*(mode==='challenge'?1.1:1)*1.04*(mode==='challenge'?.925:1);
  g.applyDamage({from,to,raw:6,knock:0,direction:from.face,castId:1,impact,...extra});
  close(before-to.hp,damage);close(to.assist.damageTaken,damage);close(to.assist.charge,damage/(to.maxHp*.35)*100);close(from.rally,impact==='rally'?0:Math.min(25,damage*2.5));
 }
});
for(const id of Object.keys(CAST))for(const fullPoints of [false,true])test(`${id}/${fullPoints?'max':'zero'}: duel and routes require exactly 35 percent max HP to restore assist, not received raw damage`,()=>{
 const stats=deriveFighterStats(id,{skills:full,challenge:fullPoints});
 for(const kind of ['duel','route','depth']){
  const g=kind==='duel'?new Duel(id,'easy',()=>.5,'han',{playerAssist:'su',playerStats:stats}):new (kind==='route'?ChallengeRoute:ChallengeDepthRoute)(id,'easy',()=>.5,{playerAssist:'su',stats});
  if(kind!=='duel')g.spawn();const p=g.player,e=kind==='duel'?g.enemy:g.enemies[0];assert.equal(g.press('assist'),true);
  const need=p.maxHp*.35;
  const hit=loss=>{if(kind==='duel')g.applyDamage({from:e,to:p,raw:loss/stats.damageTakenMultiplier,impact:'coin',direction:-1,knock:0,castId:7});else{p.invulnerable=0;g.hit(e,p,loss/(.8*stats.damageTakenMultiplier),0);}};
  hit(need-.25);assert.equal(p.assist.used,true);assert.ok(p.assist.charge<100);hit(.25);assert.equal(p.assist.used,false);close(p.assist.charge,100);close(p.assist.damageTaken,need);
 }
});
test('three defense pips and raw punch six remain independent of attributes',()=>{assert.equal(COMBAT.punch.damage,6);for(const id of Object.keys(CAST)){const g=new Duel(id);assert.equal(g.player.guardPips,3);assert.equal(g.enemy.guardPips,3);}});
for(const id of Object.keys(CAST))test(`${id}: all three specials preserve source windows, cooldowns and action travel with base walk versus neutral walk`,()=>{
 for(const [i,move] of CAST[id].moves.entries()){
  const a=new Duel(id,'easy',()=>.5,'han'),b=new Duel(id,'easy',()=>.5,'han',{playerStats:{moveMultiplier:1}});
  for(const g of [a,b]){g.player.x=300;g.enemy.x=850;assert.equal(g.press('special'+(i+1)),true);assert.equal(g.player.attack.kind,move.kind);assert.equal(g.player.cooldowns[i],COMBAT[move.kind].cooldown);}
  for(let n=0;n<150;n++){a.step(1/120,{},false,{});b.step(1/120,{},false,{});close(a.player.x,b.player.x);close(a.player.y,b.player.y);assert.equal(a.player.attack?.kind,b.player.attack?.kind);}
 }
 const g=new Duel(id);assert.equal(g.press('jump'),true);assert.equal(g.player.vy,-JUMP_SPEED);
});
test('assist threshold precision never grants an appreciably incomplete recharge',()=>{
 for(const kind of ['duel','route','depth']){
  const stats=deriveFighterStats('wang',{skills:full,challenge:true});
  const g=kind==='duel'?new Duel('wang','easy',()=>.5,'han',{playerAssist:'su',playerStats:stats}):new (kind==='route'?ChallengeRoute:ChallengeDepthRoute)('wang','easy',()=>.5,{playerAssist:'su',stats});
  if(kind!=='duel')g.spawn();const p=g.player,e=kind==='duel'?g.enemy:g.enemies[0];g.press('assist');const loss=p.maxHp*.35-1e-6;
  if(kind==='duel')g.applyDamage({from:e,to:p,raw:loss/stats.damageTakenMultiplier,impact:'coin',direction:-1,knock:0,castId:1});else g.hit(e,p,loss/(.8*stats.damageTakenMultiplier),0);
  assert.equal(p.assist.used,true);assert.ok(p.assist.charge<100);
 }
});
