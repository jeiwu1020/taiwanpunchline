import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeRoute,CHALLENGE_SECTIONS} from '../dist/challenge-engine.mjs';
import {StreetTrial} from '../dist/street-trial-engine.mjs';
import {Duel,GROUND} from '../dist/core.mjs';
const {ChallengeDepthRoute}=await import(new URL(`../dist/challenge-depth-engine.mjs?v=${RUNTIME_VERSION}`,import.meta.url));
const create=(options={},character='wang',difficulty='easy')=>new ChallengeDepthRoute(character,difficulty,()=>.5,{playerAssist:'han',...options});
const advance=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.step(1/60,input);};
function scene(options={},character='wang'){
 const g=create(options,character);g.player.x=480;g.spawn();
 const e=g.enemies[0];Object.assign(e,{x:550,depth:0,aiWait:999,spec:{...e.spec,speed:0}});
 g.enemies=[e];g.section={...g.section,spawns:[]};return {g,p:g.player,e};
}

test('chapter depth engine is exported separately from the unchanged legacy route',()=>{
 assert.equal(typeof ChallengeDepthRoute,'function');assert.notEqual(ChallengeDepthRoute,ChallengeRoute);
});
test('all real chapter sections preserve gates, growth, difficulty and carry',()=>{
 for(let section=0;section<3;section++){
  const carry={hp:67,rally:83,assist:{helper:'su',used:true,charge:40,damageTaken:14,active:true}};
  const g=create({section,runId:'attempt-9',carry,stats:{maxHp:120,basicMultiplier:1.1,moveMultiplier:1.04,damageTakenMultiplier:.9}},'wang','hard');
  assert.equal(g.mode,'challenge-depth');assert.equal(g.section.id,CHALLENGE_SECTIONS[section].id);
  assert.equal(g.worldWidth,CHALLENGE_SECTIONS[section].width);assert.deepEqual(g.section.gate,CHALLENGE_SECTIONS[section].gate);
  assert.equal(g.player.maxHp,120);assert.equal(g.player.hp,67);assert.equal(g.player.rally,83);
  assert.equal(g.player.assist.helper,'su');assert.equal(g.player.assist.active,false);assert.equal(g.player.assist.used,true);
  assert.equal(g.growth.basicMultiplier,1.1);assert.equal(g.growth.defenseMultiplier,.9);assert.equal(g.tuning.damage,1.15);
  assert.equal(g.player.depth,0);assert.equal(g.runId,'attempt-9');
 }
});
test('depth movement stays on the ground and jump remains an independent action',()=>{
 const {g,p}=scene();g.enemies=[];advance(g,.2,{up:true});assert.ok(p.depth<0);assert.equal(p.y,GROUND);assert.equal(p.crouch,false);
 assert.equal(g.press('jump'),true);advance(g,.2,{down:true});assert.ok(p.y<300);assert.ok(p.depth>-38);assert.equal(p.crouch,false);
});
test('growth boosts both street axes and diagonal input is normalized',()=>{
 const a=create({stats:{moveMultiplier:1.1}}),b=create({stats:{moveMultiplier:1}}),c=create({stats:{moveMultiplier:1}});
 for(const g of [a,b,c])g.section={...g.section,spawns:[]};
 advance(a,.1,{down:true});advance(b,.1,{down:true});advance(c,.1,{right:true,down:true});
 assert.ok(Math.abs(a.player.depth/b.player.depth-1.1)<1e-9);
 assert.ok(Math.abs(c.player.depth/b.player.depth-Math.SQRT1_2)<1e-9);
 assert.equal(a.growth.moveMultiplier,1.1);
});
test('same-depth body blocks walking, different-depth walking bypasses it',()=>{
 for(const depth of [0,90]){const {g,p,e}=scene();e.depth=depth;advance(g,.6,{right:true});assert.equal(p.x>e.x,depth===90);}
});
test('a real section table supports only its bounded lane and releases when walking out',()=>{
 const {g,p}=scene();g.enemies=[];const t=g.platforms[0];p.x=(t.left+t.right)/2;p.y=t.y-30;p.vy=100;p.depth=90;
 advance(g,.5);assert.equal(p.y,GROUND,'no invisible support in another depth lane');
 p.depth=0;p.y=t.y-30;p.vy=100;advance(g,.4);assert.equal(p.y,t.y);
 advance(g,.4,{down:true});assert.ok(p.depth>36);advance(g,.5);assert.equal(p.y,GROUND,'walk off the front edge instead of floating');
});
test('same-depth table bodies block, bodies on the street beneath do not',()=>{
 for(const sameSupport of [false,true]){const {g,p,e}=scene();g.platforms=[{left:400,right:800,y:370,depth:0}];p.y=p.supportY=370;if(sameSupport)e.y=e.supportY=370;
  advance(g,.6,{right:true});assert.equal(p.x>e.x,!sameSupport);
 }
});
test('off-lane melee does not consume a cast hit before target enters the lane',()=>{
 const {g,p,e}=scene();e.depth=90;g.press('punch');g.attackPlayer(.11);assert.equal(e.hp,e.maxHp);assert.equal(p.attack.routeHits.size,0);
 e.depth=0;g.attackPlayer(.03);assert.ok(e.hp<e.maxHp);assert.equal(p.attack.routeHits.size,1);
});
test('projectile, rally and helper retain their own launch lane when the player moves',()=>{
 for(const action of ['special1','rally','assist']){const {g,p,e}=scene({},'han');e.x=750;e.depth=90;p.rally=100;g.press(action);
  if(action==='assist')assert.equal(g.assists[0].actor.depth,0);
  if(action==='rally')assert.equal(g.rallies[0].depth,0);
  advance(g,.36);p.depth=90;advance(g,1.8);assert.equal(e.hp,e.maxHp,action+' must not follow player depth');
 }
});
test('enemy paper keeps launch depth even when its owner approaches another lane',()=>{
 const {g,p,e}=scene();e.x=700;e.depth=0;p.depth=90;
 g.projectiles.push({owner:e,kind:'paper',x:600,y:GROUND-252,vx:-300,age:0,life:2,damage:5,knock:0,face:-1,hits:new Set(),dead:false});
 g.updateEffects(.01);assert.equal(g.projectiles[0].depth,0);e.depth=90;g.updateEffects(.5);assert.equal(p.hp,p.maxHp);
});
test('projectile erasure only affects the active attack lane',()=>{
 const {g,p,e}=scene({},'ma');e.x=800;
 const shot=depth=>({owner:e,kind:'paper',x:p.x+40,y:p.y-252,vx:0,age:0,life:2,damage:5,knock:0,hits:new Set(),dead:false,depth});
 const off=shot(90),on=shot(0);g.projectiles.push(off,on);g.press('special3');g.attackPlayer(.21);
 assert.equal(off.dead,false);assert.equal(on.dead,true);
});
test('queue obstacles do not consume contacts in another lane and can hit table occupants',()=>{
 const {g,p,e}=scene({},'huang');e.depth=90;e.x=600;
 const obstacle={owner:p,x:600,y:370,depth:0,life:2,damage:10,knock:0,hits:new Set()};g.obstacles.push(obstacle);
 e.y=e.supportY=370;g.updateEffects(.01);assert.equal(e.hp,e.maxHp);assert.equal(obstacle.hits.size,0);
 e.depth=0;g.updateEffects(.01);assert.ok(e.hp<e.maxHp);
});
test('enemy depth-only pursuit supplies a walking gait and a stopped attack does not glide',()=>{
 const {g,p,e}=scene();e.x=p.x+70;e.depth=90;e.aiWait=0;const depth=e.depth;g.step(1/60);
 assert.ok(e.depth<depth);assert.notEqual(e.move,0,'depth pursuit animates its feet');
 e.attack={kind:'punch',age:0,windup:.8,fired:false};const x=e.x,z=e.depth;g.step(1/60);
 assert.equal(e.x,x);assert.equal(e.depth,z);assert.equal(e.move,0);
});
test('stationary and body-blocked actors do not report a walking gait',()=>{
 const {g,p,e}=scene();e.x=p.x+62;e.move=1;advance(g,.1,{right:true});assert.equal(p.move,0);assert.equal(e.move,0);
});
test('supply only heals once in its lane and awards never mutate section data',()=>{
 const {g,p,e}=scene({runId:'attempt-9'});p.x=g.section.supplyX;p.hp=40;p.depth=90;g.step(.01);assert.equal(p.hp,40);assert.equal(g.supplyUsed,false);
 p.depth=0;g.step(.01);assert.equal(p.hp,58);g.step(.01);assert.equal(p.hp,58);
 e.depth=0;g.hit(p,e,1000,0);g.hit(p,e,1000,0);const events=g.drainEvents().filter(e=>e.type==='enemyDefeated');
 assert.equal(events.length,1);assert.equal(events[0].key,'attempt-9:street-0');assert.equal(g.cleared,1);
 assert.equal(CHALLENGE_SECTIONS[0].spawns.length,6);
});
test('gates export survivor state exactly once at any street depth and death blocks transition',()=>{
 for(const depth of [-90,100]){const g=create({section:2,carry:{hp:63,rally:47}});g.section={...g.section,spawns:[]};g.player.x=g.gateX;g.player.depth=depth;g.step(.01);
  assert.equal(g.status,'gate');const gates=g.drainEvents().filter(e=>e.type==='routeGate');assert.equal(gates.length,1);assert.equal(gates[0].section,2);assert.equal(gates[0].carry.hp,63);assert.equal(gates[0].carry.rally,47);
  g.step(.1);assert.equal(g.drainEvents().length,0);
 }
 const {g,p,e}=scene();p.hp=1;g.hit(e,p,100,0);p.x=g.gateX;g.step(.1);assert.equal(g.status,'lost');assert.ok(!g.drainEvents().some(e=>e.type==='routeGate'));
});
test('trial reuses shared depth simulation but remains short, isolated and without progression',()=>{
 const trial=new StreetTrial('wang',()=>.5),other=new StreetTrial('wang',()=>.5);
 assert.ok(trial instanceof ChallengeDepthRoute);assert.equal(trial.mode,'street-trial');assert.equal(trial.worldWidth,2300);assert.equal(trial.section.spawns.length,4);
 trial.section.name='changed';assert.notEqual(other.section.name,'changed');assert.equal(create().section.name,CHALLENGE_SECTIONS[0].name);assert.ok(!('progress' in trial));
});
test('ordinary route and Duel keep one-dimensional movement and existing jump behavior',()=>{
 const old=new ChallengeRoute();old.step(.02,{up:true});assert.equal(old.player.depth,undefined);assert.equal(old.player.y,GROUND);old.step(.02,{down:true});assert.equal(old.player.crouch,true);
 const duel=new Duel();assert.equal(duel.player.depth,undefined);assert.equal(duel.press('jump'),true);duel.step(.02);assert.ok(duel.player.y<GROUND);
});
test('a swept projectile guards from its incoming direction rather than its overshoot position',()=>{
 const {g,p,e}=scene();p.face=1;p.guard=true;e.x=p.x+220;
 const q={owner:e,kind:'paper',x:p.x+10,y:p.y-252,vx:-300,age:0,life:2,damage:10,knock:18,face:-1,hits:new Set(),dead:false,depth:0};
 g.projectiles.push(q);g.updateEffects(.1);
 assert.equal(p.hp,p.maxHp-2);assert.equal(p.guardPips,2);assert.ok(g.events.some(e=>e.type==='block'));assert.equal(g.projectiles.length,0);
});
test('a returning projectile knocks in its travel direction even after its caster walks away',()=>{
 const {g,p,e}=scene({},'chen');e.x=600;p.x=480;p.depth=90;
 g.projectiles.push({owner:p,kind:'dream',x:650,y:e.y-252,vx:-350,age:.5,life:3,damage:6,knock:14,face:1,phase:'return',hits:new Set(),dead:false,depth:0});
 g.updateEffects(.2);assert.ok(e.hp<e.maxHp);assert.equal(e.x,586);
});
test('an attack does not drift sideways when another body overlaps it',()=>{
 const {g,e}=scene();const other={...e,id:'overlap',cooldowns:[0,0,0],spec:{...e.spec},x:e.x+10};g.enemies.push(other);
 e.attack={kind:'punch',age:0,windup:.8,fired:false};const x=e.x;g.step(1/60);assert.equal(e.x,x);assert.equal(e.move,0);
});
