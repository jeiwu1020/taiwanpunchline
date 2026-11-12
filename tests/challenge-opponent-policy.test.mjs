import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fighterBaseStats} from '../dist/fighter-attributes.mjs';
import {Duel} from '../dist/core.mjs';
const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
const neutral={moveMultiplier:1,basicMultiplier:1,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1,defenseMultiplier:1};
for(const n of [2,3,4])test(`chapter ${n} fictional minibosses retain their own neutral stats, named boss uses real base`,async()=>{
 const factory=(await import(`../dist/preview/chapter${n}/chapter${n===4?4:2}-engine.mjs`))[`createChapter${n===4?4:2}Duel`];
 for(const stepId of ['miniboss-a','miniboss-b']){const d=factory({stepId});assert.equal(d.enemy.maxHp,70);assert.deepEqual(d.enemy.combatStats,neutral);}
 const boss=factory({stepId:'boss'});assert.equal(boss.enemy.maxHp,fighterBaseStats(boss.enemy.type).maxHp);assert.equal(boss.enemy.combatStats.basicMultiplier,fighterBaseStats(boss.enemy.type).basicMultiplier);
});
test('chapter one uses the same named-boss and fictional-miniboss stat policy',async()=>{
 const policy=await import('../dist/challenge-opponent-policy.mjs').catch(()=>({}));
 const context={Duel,...policy,challengeRun:{phase:{gate:{opponent:'huang',kind:'boss',name:'Boss'},section:0}},gameMode:'challenge',selected:'wang',difficulty:'easy',playerAssist:'han',challengeProgress:{derivedStats:fighterBaseStats},profileProgress:{progressContext:()=>({})}};
 vm.runInNewContext(source.slice(source.indexOf('function newDuel()'),source.indexOf('const resultPressGates=')),context);let d=context.newDuel();assert.equal(d.enemy.maxHp,95);assert.equal(d.enemy.combatStats.defenseMultiplier,.96);
 context.challengeRun.phase.gate={opponent:'wang',kind:'miniboss',name:'Mini'};d=context.newDuel();assert.equal(d.enemy.maxHp,70);assert.deepEqual(d.enemy.combatStats,neutral);
});
