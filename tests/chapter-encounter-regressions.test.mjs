import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeDepthRoute} from '../dist/challenge-depth-engine.mjs';
import {createChapter2Route,createChapter2Duel} from '../dist/preview/chapter2/chapter2-engine.mjs';
import {createChapter5Duel} from '../dist/preview/chapter5/chapter5-engine.mjs';
import {ensureChapterEncounter,stepChapterMob,updateChapterEncounter} from '../dist/chapter-encounters.mjs';

function fixture(chapter,character='wang'){
 const r=chapter===2?createChapter2Route({routeIndex:0,characterId:character,rng:()=>.5}):new ChallengeDepthRoute(character,'easy',()=>.5,{runId:`chapter-${chapter}`});
 r.player.x=400;r.player.depth=0;r.spawn();const e=r.enemies[0];r.enemies=[e];
 // Isolate one live encounter, retaining the actual route hit/defense pipeline.
 r.spawn=()=>{};r.platforms=[];e.x=500;e.depth=0;e.aiWait=0;
 ensureChapterEncounter(r);r.chapterEncounter.props=[];return {r,e};
}
function hazard(r,e,kind,x,direction=1){const h={kind,owner:e,x,origin:x,depth:0,direction,age:0,life:1.7,damage:10,hits:new Set(),dead:false};r.chapterEncounter.hazards=[h];return h;}

test('committed handshake cannot grab behind its marked direction, but still hits in front',()=>{
 for(const side of [-1,1]){
  const {r,e}=fixture(4);r.player.x=e.x+side*100;stepChapterMob(r,e,.01);
  const tell={...e.chapterTell},before=r.player.hp;r.player.x=e.x-side*100;
  stepChapterMob(r,e,tell.delay+.01);assert.equal(r.player.hp,before,'crossing behind the locked tell must escape');
  e.chapterRest=0;e.aiWait=0;stepChapterMob(r,e,.01);stepChapterMob(r,e,e.chapterTell.delay+.01);
  assert.ok(r.player.hp<before,'the same grounded grab must remain dangerous in its committed direction');
 }
});

for(const kind of ['paper','sound'])for(const direction of [-1,1]){
 test(`${kind} crossing a defender preserves incoming side and forward knockback (${direction})`,()=>{
  const blocked=fixture(kind==='paper'?5:1);blocked.r.player.face=-direction;blocked.r.player.guard=true;
  hazard(blocked.r,blocked.e,kind,400-direction,direction);const hp=blocked.r.player.hp;
  updateChapterEncounter(blocked.r,1/60);
  assert.ok(blocked.r.events.some(e=>e.type==='block'),'a swept crossing must remain blockable from the incoming side');
  const chip=hp-blocked.r.player.hp;
  const open=fixture(kind==='paper'?5:1);open.r.player.face=-direction;
  hazard(open.r,open.e,kind,400-direction,direction);const fullHp=open.r.player.hp;
  updateChapterEncounter(open.r,1/60);
  assert.ok(fullHp-open.r.player.hp>chip);assert.ok((open.r.player.x-400)*direction>0,'knockback must follow travel, even after the projectile crosses the center');
 });
}

test('a live chapter-two rush body remains on its telegraphed lane throughout travel',()=>{
 const {r,e}=fixture(2);r.player.x=800;e.x=950;stepChapterMob(r,e,.01);
 stepChapterMob(r,e,e.chapterTell.delay+.01);assert.equal(r.chapterEncounter.hazards.length,1);r.player.depth=90;
 for(let frame=0;frame<85;frame++){
  r.step(1/60);const h=r.chapterEncounter.hazards.find(h=>h.kind==='rush');assert.ok(h,'rush must still be in flight in this fixture');
  assert.equal(e.depth,h.depth,'rendered attacker must not chase a different lane from its hit volume');
 }
});

for(const [character,stance] of [['wang','counter'],['su','su_dare']]){
 test(`${character} contact counter still stops a physical chapter-two rush`,()=>{
  const {r,e}=fixture(2,character);r.player.face=-1;r.player.counter=.5;r.player.attack={kind:stance};e.x=360;
  hazard(r,e,'rush',360);const hp=r.player.hp,enemyHp=e.hp;updateChapterEncounter(r,1/60);
  assert.equal(r.player.hp,hp);assert.ok(e.hp<enemyHp);assert.ok(r.events.some(e=>e.type==='counter'));
 });
}

test('boss guidance uses available duel movement instead of street lane instructions',()=>{
 const rush=createChapter2Duel({stepId:'boss'}),paper=createChapter5Duel({stepId:'boss'});
 for(const d of [rush,paper]){assert.ok(!d.depthMode);assert.doesNotMatch(d.chapterEncounter.hint,/換道|上下走位/);}
});

test('chapter-five boss cabinet delivers its promised tea once and catches before collision',()=>{
 const d=createChapter5Duel({stepId:'boss',rng:()=>.5});d.status='active';d.player.hp=50;
 const cabinet=d.chapterEncounter.props[0];d.player.x=cabinet.x-55;d.player.face=1;
 assert.equal(d.request(d.player,'punch'),true);assert.equal(cabinet.active,true);
 const shot=()=>({kind:'dream',owner:d.enemy,x:cabinet.x-46,y:178,vx:350,life:3,age:0,phase:'outbound',originX:cabinet.x-46,travel:450,hits:new Set(),damage:8,knock:14,dead:false});
 const first=shot();d.projectiles=[first];d.updateProjectiles(1/60);assert.equal(first.dead,true);assert.equal(d.player.hp,53);
 const second=shot();d.projectiles=[second];d.updateProjectiles(1/60);assert.equal(second.dead,true);assert.equal(d.player.hp,53,'the same cabinet cannot repeatedly heal');
});
