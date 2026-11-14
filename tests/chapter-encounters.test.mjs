import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {Duel,CAST} from '../dist/core.mjs';
import {COMBAT} from '../dist/combat-rules.mjs';
import {installBossEncounter} from '../dist/chapter-encounters.mjs';
const route=n=>new ChallengeDepthRoute('wang','easy',()=>.5,{runId:`chapter-${n}`});
test('five chapters expose distinct encounters without changing character moves or mob health',()=>{
 const ids=[];
 for(let n=1;n<=5;n++){const r=route(n);r.step(.016);assert.ok(r.chapterEncounter,`chapter ${n} needs encounter rules`);ids.push(r.chapterEncounter.kind);for(const e of r.enemies)assert.equal(e.maxHp,e.spec.hp);}
 assert.equal(new Set(ids).size,5);for(const f of Object.values(CAST))assert.equal(f.moves.length,3);
});
test('chapter warnings commit a target lane and a miss leaves a punish window',()=>{
 for(let n=1;n<=5;n++){const r=route(n);r.player.x=430;r.step(.016);const e=r.enemies[0];e.x=580;e.depth=0;e.aiWait=0;r.player.depth=0;r.step(.016);
 assert.ok(e.chapterTell,`chapter ${n} must telegraph`);const locked=e.chapterTell.depth;r.player.depth=90;r.step(.1);assert.equal(e.chapterTell.depth,locked);
 for(let i=0;i<80;i++)r.step(1/60);assert.ok(r.player.hp===r.player.maxHp,`chapter ${n} dodge lane`);
 }
});
test('punch operates a nearby prop once per cooldown; restarting creates fresh state',()=>{
 for(let n=1;n<=5;n++){const r=route(n);r.step(.016);const prop=r.chapterEncounter.props[0];r.player.x=prop.x-55;r.player.depth=prop.depth;r.player.face=1;
 assert.equal(r.press('punch'),true);assert.ok(prop.cooldown>0);const once=prop.uses;r.press('punch');assert.equal(prop.uses,once);const fresh=route(n);fresh.step(.016);assert.equal(fresh.chapterEncounter.props[0].uses,0);
 }
});
test('existing shared combat specs remain the source for all twenty-one moves',()=>{
 for(const id of Object.keys(CAST)){const d=new Duel(id,'easy',()=>.5,id);for(const [i,m]of CAST[id].moves.entries()){assert.ok(COMBAT[m.kind]);assert.equal(d.player.cooldowns.length,3);assert.equal(d.enemy.type,id);}}
});
test('five actual boss worlds run accepted three moves, pause and environmental interaction',()=>{
 for(const [n,id]of ['huang','su','ko','ma','chen'].entries()){
  const d=installBossEncounter(new Duel('wang','easy',()=>.5,id),n+1);d.nextItemAt=Infinity;
  for(let i=0;i<3;i++){d.enemy.attack=null;d.enemy.stun=0;d.enemy.cooldowns[i]=0;assert.equal(d.request(d.enemy,'special'+(i+1)),true);for(let f=0;f<75;f++)d.step(1/60,{},false);}
  assert.ok(Number.isFinite(d.player.hp));const t=d.chapterEncounter.time;d.status='paused';d.step(.016);assert.equal(d.chapterEncounter.time,t);
 }
});
