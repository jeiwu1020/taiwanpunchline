// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST} from './helpers/neutral-combat.mjs';

const DT=1/120;
const tick=(g,seconds,player={},enemy={})=>{for(let t=0;t<seconds-1e-9;t+=DT)g.step(Math.min(DT,seconds-t),player,false,enemy);};
const setup=(type,role='player',side=1,opponent='wang')=>{
 const g=new Duel(role==='player'?type:opponent,'normal',()=>.5,role==='enemy'?type:opponent);
 const f=g[role],o=g.other(f);f.x=side>0?220:740;o.x=f.x+440*side;return{g,f,o};
};
const cast=(g,f,slot)=>assert.equal(g.request(f,'special'+slot),true);
const near=(f,o,side)=>{o.x=f.x+110*side;};

// Break: presentation state being the same object as the live attack, or being
// discarded by ordinary recovery damage even though no new action was chosen.
const recoveryMoves=[['han',2,.76],['ma',1,.38],['ma',2,.40],['ma',3,.54],['su',1,.46],['huang',1,.44],['chen',2,.54],['ko',1,.53]];
for(const[type,slot,recovery]of recoveryMoves)for(const role of ['player','enemy'])for(const side of [-1,1])test(`${type}/${slot}/${role}/${side}: a real recovery jab hurts and cancels combat, not the bounded presentation`,()=>{
 const{g,f,o}=setup(type,role,side);cast(g,f,slot);tick(g,recovery);near(f,o,side);const a=f.attack,record=f.performance;
 assert.ok(record,'accepted special has a separate presentation');assert.notEqual(record,a);assert.equal(record.castId,a.castId);
 assert.equal(g.request(o,'punch'),true);tick(g,.12);
 assert.equal(f.hp,94);assert.equal(f.attack,null);assert.ok(f.stun>0);assert.ok(f.reaction>0);
 assert.equal(f.performance,record);assert.equal(record.kind,CAST[type].moves[slot-1].kind);assert.ok(record.age>recovery);
 assert.equal(o.hp,100,'visual continuation must never produce a late hit');
 tick(g,2);assert.equal(f.performance,null);assert.equal(o.hp,100);assert.ok(f.cooldowns[slot-1]>0,'no cooldown refund');
});

// Break: presentation clocks growing through pause/hitstop, outliving the
// existing move, or becoming a second attack/defense activation source.
for(const[type,c]of Object.entries(CAST))for(let slot=1;slot<=3;slot++)test(`${c.moves[slot-1].kind}: simulation-owned release keeps the V36 tail without extending the action`,()=>{
 const{g,f}=setup(type);cast(g,f,slot);const record=f.performance;assert.ok(record);assert.equal(record.age,0);assert.equal(record.actionDuration,c.moves[slot-1].duration);
 tick(g,.05);const age=record.age;g.status='paused';tick(g,.2);assert.equal(record.age,age);g.status='active';g.freeze=.3;tick(g,.2);assert.equal(record.age,age);
 g.freeze=0;tick(g,c.moves[slot-1].duration+.02);assert.equal(f.attack,null);
 if(record.kind==='han_knee')assert.equal(f.performance,null);else assert.equal(f.performance,record,'existing readable release must not be shortened');
 tick(g,.29);assert.equal(f.performance,null);
});

// Break: a whiff being reported on input, a hit guessed from proximity, or an
// opponent jumping/guarding being mistaken for a successful handshake.
for(const role of ['player','enemy'])for(const side of [-1,1])test(`handshake outcome comes from actual capture and respects its window: ${role}/${side}`,()=>{
 const hit=setup('ma',role,side);near(hit.f,hit.o,side);cast(hit.g,hit.f,1);tick(hit.g,.27);assert.equal(hit.f.performance?.outcome,'pending');
 tick(hit.g,.06,role==='player'?{}:{guard:true},role==='enemy'?{}:{guard:true});assert.equal(hit.o.hp,88);assert.equal(hit.f.performance?.outcome,'hit');assert.equal(hit.g.events.filter(e=>e.type==='capture').length,1);
 const miss=setup('ma',role,side);cast(miss.g,miss.f,1);tick(miss.g,.35);assert.equal(miss.f.performance?.outcome,'pending');tick(miss.g,.03);assert.equal(miss.f.performance?.outcome,'whiff');assert.equal(miss.o.hp,100);
 const jump=setup('ma',role,side);near(jump.f,jump.o,side);cast(jump.g,jump.f,1);assert.equal(jump.g.request(jump.o,'jump'),true);tick(jump.g,.4);assert.equal(jump.f.performance?.outcome,'whiff');assert.equal(jump.o.hp,100);
});
for(const role of ['player','enemy'])for(const side of [-1,1])test(`Su dare distinguishes a real counter from waiting out its window: ${role}/${side}`,()=>{
 const hit=setup('su',role,side);near(hit.f,hit.o,side);cast(hit.g,hit.f,3);tick(hit.g,.22);assert.equal(hit.g.request(hit.o,'punch'),true);tick(hit.g,.12);
 assert.equal(hit.f.hp,100);assert.equal(hit.o.hp,82);assert.equal(hit.f.attack,null);assert.equal(hit.f.performance?.outcome,'counter');assert.equal(hit.f.counter,0);
 const miss=setup('su',role,side);cast(miss.g,miss.f,3);tick(miss.g,.48);assert.equal(miss.f.performance?.outcome,'pending');tick(miss.g,.05);assert.equal(miss.f.performance?.outcome,'whiff');
});

// Break: lingering performance hiding a user's next legal choice or defeat.
for(const action of ['punch','special1','jump','move','guard','crouch'])test(`interrupted recovery yields immediately to legal ${action}`,()=>{
 const{g,f,o}=setup('ma');cast(g,f,2);tick(g,.4);near(f,o,1);g.request(o,'punch');tick(g,.12);assert.ok(f.performance);tick(g,.2);assert.ok(f.performance);
 if(['punch','special1','jump'].includes(action))assert.equal(g.request(f,action),true);
 else g.step(DT,action==='move'?{right:true}:{[action]:true},false,{});
 if(action==='special1')assert.equal(f.performance?.kind,'ma_handshake');else assert.equal(f.performance,null);
});
test('knockout and round finish clear all presentation records',()=>{
 const{g,f,o}=setup('ma');cast(g,f,2);f.hp=6;near(f,o,1);g.request(o,'punch');tick(g,.12);assert.equal(f.hp,0);assert.equal(g.status,'over');assert.equal(f.performance,null);assert.equal(o.performance,null);
 const other=setup('su');cast(other.g,other.f,3);other.g.finish();assert.equal(other.f.performance,null);
});
test('a real late hit still interrupts drinking and preserves its spit outcome',()=>{
 const{g,f,o}=setup('wang');f.hp=70;cast(g,f,3);tick(g,.5);near(f,o,1);g.request(o,'punch');tick(g,.12);assert.equal(f.hp,64);assert.equal(f.attack,null);assert.equal(f.performance,null);assert.equal(g.events.filter(e=>e.type==='spit').length,1);tick(g,1);assert.equal(f.hp,64);
});

// Break: presentation protection acting like grab immunity or ignoring a
// successful counter. These special answers must cancel later damage phases.
for(const[type,slot,returnDamage]of [['han',2,0],['su',1,0],['ma',3,4]])for(const role of ['player','enemy'])for(const side of [-1,1])test(`a real grab interrupts ${type}/${slot} with visible capture: ${role}/${side}`,()=>{
 const{g,f,o}=setup(type,role,side,'ma');near(f,o,side);cast(g,f,slot);cast(g,o,1);tick(g,.34);
 assert.equal(f.hp,88);assert.equal(f.attack,null);assert.equal(f.performance,null);assert.ok(f.grabbedPose>0);assert.ok(o.grabPose>0);
 tick(g,1);assert.equal(o.hp,100-returnDamage);assert.equal(g.events.filter(e=>e.type==='capture').length,1);
});
for(const[type,slot]of [['su',2],['chen',2],['ko',1]])for(const role of ['player','enemy'])for(const side of [-1,1])test(`a real counter interrupts ${type}/${slot} before its next hit: ${role}/${side}`,()=>{
 const{g,f,o}=setup(type,role,side,'wang');near(f,o,side);cast(g,o,2);cast(g,f,slot);tick(g,.30);
 assert.equal(f.hp,88);assert.equal(f.attack,null);assert.equal(f.performance,null);assert.equal(o.hp,100);assert.equal(o.performance?.outcome,'counter');
 tick(g,1);assert.equal(o.hp,100);assert.equal(g.events.filter(e=>e.type==='counter').length,1);
});
