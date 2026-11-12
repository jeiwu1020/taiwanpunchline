import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from '../dist/core.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {deriveFighterStats} from '../dist/fighter-attributes.mjs';
import {deriveStats,newDocument} from '../dist/preview/campaign/core/model.mjs';
import {createProfileProgress} from '../dist/profile-progress.mjs';
import {createChallengeProgress} from '../dist/challenge-progress.mjs';
const rows={wang:[95,1.06,.96,1],han:[105,.94,.96,1],ma:[95,1.04,1.02,1],su:[110,.96,1.04,1.04],huang:[95,1,.98,.96],chen:[95,1.04,.98,.98],ko:[105,.96,1.06,1.04]};
const full={hp:5,move:5,basic:5,defense:5,special:5,rally:5,assist:5};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const [id,[hp,speed,basic,defense]] of Object.entries(rows))for(const mode of ['vs','training'])test(`${mode} ${id}: both sides use real base HP, walk, basic and defense without profile growth`,()=>{
 const profile=newDocument().profiles[0];profile.campaign.xp=2800;profile.characters[id]={skills:full,xp:2800};
 const g=new Duel(id,'easy',()=>.5,id,{mode,trainingBehavior:'ai',infiniteHealth:false,profile,skills:full});
 for(const f of [g.player,g.enemy]){assert.equal(f.hp,hp);assert.equal(f.maxHp,hp);assert.equal(f.guardPips,3);close(f.combatStats.moveMultiplier,speed);close(f.combatStats.basicMultiplier,basic);close(f.combatStats.defenseMultiplier,defense);}
 g.step(.02,{right:true},false,{left:true});close(g.player.x-260,245*.02*speed);close(700-g.enemy.x,245*.02*speed);
 for(const side of ['player','enemy']){const from=g[side],to=g.other(from),before=to.hp;g.applyDamage({from,to,raw:6,impact:'punch',castId:9,direction:from.face,knock:0});close(before-to.hp,6*basic*defense);}
});
for(const [id,[hp,speed,basic,defense]] of Object.entries(rows))for(const Route of [ChallengeRoute,ChallengeDepthRoute])test(`${Route.name} ${id}: zero point defaults, two axes, mob rules and damage use base once`,()=>{
 const g=new Route(id,'easy',()=>.5);assert.equal(g.player.maxHp,hp);assert.equal(g.player.hp,hp);g.spawn();const e=g.enemies[0];assert.equal(e.maxHp,e.spec.hp);assert.equal(e.combatStats,undefined,'ordinary mobs must not retain a named fighter stat block');
 const before=e.hp;g.hit(g.player,e,6,0);close(before-e.hp,6*basic);const pBefore=g.player.hp;g.hit(e,g.player,10,0);close(pBefore-g.player.hp,8*defense);
 g.enemies=[];g.section={...g.section,spawns:[]};g.player.stun=0;const x=g.player.x;g.step(.02,{right:true});close(g.player.x-x,250*.02*speed);
 if(g.depthMode){const z=g.player.depth;g.step(.02,{down:true});close(g.player.depth-z,190*.02*speed);}
});
test('effective overrides and explicit miniboss HP take precedence without duplicate base multiplication',()=>{
 const s=deriveFighterStats('su',{skills:full,challenge:true});const g=new Duel('su','hard',()=>.5,'ko',{playerStats:s,enemyStats:{maxHp:70},playerMaxHp:500});
 close(g.player.maxHp,126.5);close(g.player.combatStats.basicMultiplier,1.144);assert.equal(g.enemy.maxHp,70);assert.equal(g.enemy.combatStats.basicMultiplier,1.06);
 for(const Route of [ChallengeRoute,ChallengeDepthRoute]){const r=new Route('su','hard',()=>.5,{stats:s});close(r.player.maxHp,126.5);close(r.growth.basicMultiplier,1.144);close(r.growth.moveMultiplier,1.008);close(r.growth.defenseMultiplier,.962);}
});
test('both growth entrypoints derive character-specific stats from saved ranks only',()=>{
 const p=newDocument().profiles[0];p.campaign.xp=2800;p.characters.wang={skills:full,xp:2800};const s=deriveStats(p,'wang');close(s.maxHp,109.25);close(s.moveMultiplier,1.113);close(s.basicMultiplier,1.056);close(s.damageTakenMultiplier,.925);assert.equal(s.allowance,35);
 const values=new Map(),profiles=createProfileProgress({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}}),progress=createChallengeProgress({profiles});
 for(let i=0;i<7;i++)assert.ok(progress.rewardEncounter({encounterId:`r${i}`,xp:400}));for(const key of Object.keys(full))for(let n=0;n<5;n++)assert.ok(progress.allocate('wang',key));
 const a=progress.derivedStats('wang');close(a.maxHp,109.25);close(a.moveMultiplier,1.113);close(a.basicMultiplier,1.056);
 assert.equal(Object.hasOwn(profiles.getCurrentProfile().characters.wang,'maxHp'),false);
});
for(const [a,b,winner,reason] of [[47.5,52.5,'draw','timeout'],[50,52,'player','timeout'],[45,52,'enemy','timeout'],[0,1,'enemy','ko'],[1,0,'player','ko'],[0,0,'draw','double-ko']])test(`finish ${a}/${b} chooses ${winner} with ${reason}`,()=>{
 const g=new Duel('wang','easy',()=>.5,'han');g.player.hp=a;g.enemy.hp=b;g.remaining=0;g.finish();assert.equal(g.winner,winner);assert.equal(g.finishSnapshot.reason,reason);
});
for(const difficulty of ['easy','normal','beginner'])test(`${difficulty} heal eligibility follows maximum HP ratio`,()=>{
 const limit=difficulty==='beginner'?.7:.85;
 for(const hp of [95,200])for(const below of [true,false]){
  const g=new Duel('han',difficulty,()=>0,'wang',{enemyMaxHp:hp});g.enemy.hp=hp*(limit+(below?-.001:.001));g.enemy.cooldowns=[9,9,0];g.aiWait=0;g.think(.01);assert.equal(g.aiAction==='special3',below,`${difficulty} max=${hp} actual=${g.enemy.hp}`);
 }
});
test('warmup heal movement prioritization uses 80 percent HP independently of 85 percent cast ceiling',()=>{
 for(const hp of [95,200])for(const below of [true,false]){const g=new Duel('han','easy',()=>.9,'wang',{enemyMaxHp:hp});g.enemy.hp=hp*(below?.799:.801);g.aiWait=10;g.think(.01);assert.equal(!!g.aiInput.left,!below);}
});
