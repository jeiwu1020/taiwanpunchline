// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from './helpers/neutral-combat.mjs';

const DT=1/120;
const tick=(g,seconds,inputs={})=>{for(let t=0;t<seconds-1e-9;t+=DT)g.step(Math.min(DT,seconds-t),inputs.player??{},false,inputs.enemy??{});};
const cast=(g,f,slot)=>assert.equal(g.request(f,'special'+slot),true);
const scenario=(type,opponent,role,side,gap=110)=>{
 const g=new Duel(role==='player'?type:opponent,'normal',()=>.5,role==='enemy'?type:opponent);
 const f=g[role],o=g.other(f);f.x=side>0?350:610;o.x=f.x+gap*side;return{g,f,o};
};
const inputFor=(f,input)=>({[f.id]:input});
const events=(g,type,f)=>g.events.filter(e=>e.type===type&&(f===undefined||e.f===f));

// These regressions use accepted controls and physical contacts, never injected
// damage. Reversing actor and direction catches favorable-side-only defenses.
for(const role of ['player','enemy'])for(const side of [-1,1]){
 test(`Wang contact counter has noncontact shout and grab answers: ${role}/${side}`,()=>{
  const {g,f,o}=scenario('wang','wang',role,side);cast(g,f,2);tick(g,.1);assert.equal(g.request(o,'punch'),true);tick(g,.7);
  assert.equal(f.hp,100);assert.equal(o.hp,88);assert.equal(events(g,'counter',f).length,1);
  for(const [opponent,slot,damage]of [['su',1,14],['ma',1,12]]){
   const {g,f,o}=scenario('wang',opponent,role,side);cast(g,f,2);cast(g,o,slot);tick(g,1.2);
   assert.equal(f.hp,100-damage);assert.equal(o.hp,100);assert.equal(events(g,'counter',f).length,0);
  }
 });
 test(`Han folded knee ducks high coin but low bags still deal full damage: ${role}/${side}`,()=>{
  const high=scenario('han','han',role,side,260);cast(high.g,high.f,2);cast(high.g,high.o,1);tick(high.g,1.3);assert.equal(high.f.hp,100);
  const low=scenario('han','ko',role,side);cast(low.g,low.f,2);cast(low.g,low.o,1);tick(low.g,1.4);
  assert.equal(low.f.hp,86);assert.equal(low.o.hp,86);assert.equal(events(low.g,'performanceGuard',low.f).length,1);
  const block=scenario('han','wang',role,side);cast(block.g,block.f,2);tick(block.g,1.4,inputFor(block.o,{guard:true}));assert.equal(block.o.hp,98);
 });
 test(`Ma grab beats guard but jump and whiff punish beat grab: ${role}/${side}`,()=>{
  const hit=scenario('ma','wang',role,side);cast(hit.g,hit.f,1);tick(hit.g,1,inputFor(hit.o,{guard:true}));assert.equal(hit.o.hp,88);
  const jump=scenario('ma','wang',role,side);cast(jump.g,jump.f,1);tick(jump.g,.1);assert.equal(jump.g.request(jump.o,'jump'),true);tick(jump.g,1);assert.equal(jump.o.hp,100);
  const whiff=scenario('ma','wang',role,side,165);cast(whiff.g,whiff.f,1);tick(whiff.g,.42);assert.equal(whiff.g.request(whiff.f,'punch'),false);
  tick(whiff.g,.2,inputFor(whiff.o,side>0?{left:true}:{right:true}));assert.equal(whiff.g.request(whiff.o,'punch'),true);tick(whiff.g,.4);assert.equal(whiff.f.hp,94);
 });
 test(`Su shout pressures two guard pips but jump evades and block permits a punish: ${role}/${side}`,()=>{
  const hit=scenario('su','wang',role,side);cast(hit.g,hit.f,1);tick(hit.g,.6,inputFor(hit.o,{guard:true}));assert.equal(hit.o.hp,98);assert.equal(hit.o.guardPips,1);
  const jump=scenario('su','wang',role,side);cast(jump.g,jump.f,1);assert.equal(jump.g.request(jump.o,'jump'),true);tick(jump.g,.55);assert.equal(jump.o.hp,100);
  const punish=scenario('su','wang',role,side);cast(punish.g,punish.f,1);tick(punish.g,.46,inputFor(punish.o,{guard:true}));tick(punish.g,.01);
  assert.equal(punish.g.request(punish.o,'punch'),true);tick(punish.g,.3);assert.equal(punish.f.hp,94);
 });
 test(`Huang rejects physical coin but a grab and noncontact shout bypass it: ${role}/${side}`,()=>{
  const coin=scenario('huang','han',role,side,270);cast(coin.g,coin.o,1);tick(coin.g,.35);cast(coin.g,coin.f,2);tick(coin.g,.3);
  assert.equal(coin.f.hp,100);assert.equal(coin.o.hp,100);assert.equal(events(coin.g,'reflect',coin.f).length,1);
  tick(coin.g,.8,inputFor(coin.o,{guard:true}));assert.equal(coin.o.hp,98);
  for(const [opponent,slot,damage]of [['ma',1,12],['su',1,14]]){
   const {g,f,o}=scenario('huang',opponent,role,side);cast(g,f,2);cast(g,o,slot);tick(g,1.2);assert.equal(f.hp,100-damage);assert.equal(o.hp,100);assert.equal(events(g,'reject',f).length,0);
  }
 });
 test(`Chen calm absorbs one hit only; corner follow-up and grab still work: ${role}/${side}`,()=>{
  const {g,f,o}=scenario('chen','ko',role,side);f.x=side>0?68:892;o.x=f.x+110*side;cast(g,f,3);tick(g,.1);cast(g,o,1);tick(g,1.2);
  assert.equal(f.hp,88);assert.equal(o.hp,100);assert.equal(events(g,'calm',f).length,1);assert.equal(f.calm,0);
  const grab=scenario('chen','ma',role,side);cast(grab.g,grab.f,3);cast(grab.g,grab.o,1);tick(grab.g,1.2);assert.equal(grab.f.hp,88);
 });
 test(`Ko armor carries into jab, but second hit and grab beat it: ${role}/${side}`,()=>{
  const jab=scenario('ko','wang',role,side);cast(jab.g,jab.f,3);tick(jab.g,.44);assert.equal(jab.g.request(jab.o,'punch'),true);tick(jab.g,.06);assert.equal(jab.g.request(jab.f,'punch'),true);tick(jab.g,.5);
  assert.equal(jab.f.hp,96);assert.equal(jab.o.hp,94);assert.equal(jab.f.armor,0);
  const combo=scenario('ko','ko',role,side);cast(combo.g,combo.f,3);tick(combo.g,.2);cast(combo.g,combo.o,1);tick(combo.g,1.2);assert.equal(combo.f.hp,88);assert.equal(events(combo.g,'armorAbsorb',combo.f).length,1);
  const grab=scenario('ko','ma',role,side);cast(grab.g,grab.f,3);tick(grab.g,.2);cast(grab.g,grab.o,1);tick(grab.g,1.2);assert.equal(grab.f.hp,88);
 });
}

// Break: reducing cooldown, refunded failures, buffering multiple copies, or a
// defensive resource that remains live after its explicit one-hit/time limit.
const cooldowns={wang:[4,6,10],han:[4,5.5,7],ma:[5,5.5,6],su:[5,5.5,7],huang:[5.5,6,6.5],chen:[6,4.5,7],ko:[4.5,6,7]};
test('all 21 cooldowns retain their approved values',()=>{for(const[type,values]of Object.entries(cooldowns))assert.deepEqual(CAST[type].moves.map(m=>m.cooldown),values);});
for(const[type,slot]of [['wang',2],['han',2],['ma',1],['su',1],['huang',2],['chen',3],['ko',3]])test(`${type} signature cannot be spammed or leave permanent defense`,()=>{
 const {g,f}=scenario(type,'wang','player',1,400),kind=CAST[type].moves[slot-1].kind,cooldown=CAST[type].moves[slot-1].cooldown;
 let lastAccepted=-Infinity,count=0;
 for(let n=0;n<12/DT;n++){
  if(g.request(f,'special'+slot)){assert.ok(g.elapsed-lastAccepted>=cooldown-DT);lastAccepted=g.elapsed;count++;}
  g.step(DT,{},false,{});
 }
 assert.equal(count,Math.ceil(12/cooldown));assert.equal(g.events.filter(e=>e.type==='move'&&e.kind===kind).length,count);
 tick(g,2);for(const k of ['counter','reject','calm','armor'])assert.equal(f[k],0,k);
});
