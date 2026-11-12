// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
// V23 replaces the old three-move/one-hit rule while retaining its regression
// coverage for real contacts, mirror sides, full damage and lifecycle bounds.
// V39: an actual grab/counter is now an explicit protection exception.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST,performanceGuardActive} from './helpers/neutral-combat.mjs';
import {PERFORMANCE_GUARD} from '../dist/stage-rules.mjs';
const DT=1/120;
const tick=(g,s)=>{for(let t=0;t<s-1e-9;t+=DT)g.step(Math.min(DT,s-t),{},false,{});};
const moves=[['han',2,'han_knee',0,.74],['su',1,'su_shout',0,.44],['ma',3,'ma_cough',0,.52]];
const setup=(type,slot,role='player',side=1,attacker='wang')=>{const g=new Duel(role==='player'?type:attacker,'normal',()=>.5,role==='enemy'?type:attacker),f=g[role],o=g.other(f);f.x=side>0?350:610;o.x=f.x+140*side;g.request(f,'special'+slot);return{g,f,o,a:f.attack};};

for(const[type,slot,kind,start,end]of moves)for(const role of ['player','enemy'])for(const side of [-1,1])test(`${kind}/${role}/${side}: repeated in-window hits take full damage and preserve that cast`,()=>{
 const{g,f,o,a}=setup(type,slot,role,side);a.age=.15;const x=f.x,cd=f.cooldowns[slot-1];
 for(const amount of [11,7]){g.damage(o,f,amount,30);assert.equal(f.attack,a);assert.equal(f.x,x);assert.equal(f.stun,0);assert.equal(f.reaction,0);assert.equal(f.cooldowns[slot-1],cd);}
 assert.equal(f.hp,82);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,1,'one popup per cast, not one per hit');
 assert.deepEqual(g.events.filter(e=>e.type==='hit').map(e=>[e.performanceGuard,e.amount]),[[true,11],[true,7]]);
 a.age=end+.001;g.damage(o,f,6,30);assert.equal(f.hp,76);assert.equal(f.attack,null);assert.equal(f.stun,.16);assert.notEqual(f.x,x);
});

for(const[type,slot,kind,start,end]of moves)for(const[where,age,protectedHit]of [['before',-.001,false],['start',start,true],['end',end,true],['after',end+.001,false]])test(`${kind}: ${where} boundary is ${protectedHit?'protected':'interruptible'}`,()=>{
 const{g,f,o,a}=setup(type,slot);a.age=age;g.damage(o,f,6);assert.equal(f.hp,94);assert.equal(f.attack,protectedHit?a:null);assert.equal(g.events.some(e=>e.type==='performanceGuard'),protectedHit);
});

for(const[type,slot,kind]of moves)for(const role of ['player','enemy'])test(`${kind}/${role}: grab and lethal hit both cancel while keeping full damage`,()=>{
 for(const outcome of ['grab','lethal']){const{g,f,o,a}=setup(type,slot,role,1,'ma');a.age=.15;if(outcome==='lethal')f.hp=6;
  g.damage(o,f,outcome==='grab'?12:6,0,outcome==='grab'?'ma_handshake':'punch');assert.equal(f.attack,null);assert.equal(f.performance,null);assert.equal(f.hp,outcome==='grab'?88:0);assert.equal(g.events.some(e=>e.type==='performanceGuard'),false);if(outcome==='lethal')assert.equal(g.status,'over');
 }
});

for(const[type,slot,kind]of moves)for(const role of ['player','enemy'])for(const side of [-1,1])test(`${kind}/${role}/${side}: an actual startup jab cannot erase the signature`,()=>{
 const{g,f,o}=setup(type,slot,role,side);o.x=f.x+110*side;g.request(o,'punch');tick(g,1.7);
 assert.equal(f.hp,94);assert.ok(o.hp<100);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,1);assert.equal(f.attack,null);assert.ok(f.cooldowns[slot-1]>0);
});

for(const[type,slot,kind]of moves)test(`${kind}: a new legal cast gets fresh protection, never a cooldown refund`,()=>{
 const{g,f,o,a}=setup(type,slot);a.age=.15;g.damage(o,f,6);assert.equal(g.request(f,'special'+slot),false);tick(g,1.5);assert.equal(g.request(f,'special'+slot),false);tick(g,7);
 assert.equal(g.request(f,'special'+slot),true);g.damage(o,f,6);assert.ok(f.attack);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,2);
});

test('every special exposes a finite guard followed by normal recovery vulnerability',()=>{
 for(const[type,c]of Object.entries(CAST))for(let slot=1;slot<=3;slot++){
  const{g,f,o,a}=setup(type,slot),window=PERFORMANCE_GUARD[a.kind];assert.ok(window&&window.end< c.moves[slot-1].duration);
  a.age=window.end+.001;g.damage(o,f,6);assert.equal(f.hp,94);assert.equal(f.attack,null);assert.equal(g.events.some(e=>e.type==='performanceGuard'),false);
 }
});

test('Ko one-hit 60% armor still retains its existing damage reduction',()=>{
 const g=new Duel('ko','normal',()=>.5,'wang');g.player.x=350;g.enemy.x=600;g.press('special3');tick(g,.5);g.press('punch');const a=g.player.attack;g.damage(g.enemy,g.player,10);assert.equal(g.player.hp,94);assert.equal(g.player.attack,a);assert.equal(g.events.some(e=>e.type==='performanceGuard'),false);assert.ok(g.events.some(e=>e.type==='armorAbsorb'));g.damage(g.enemy,g.player,10);assert.equal(g.player.hp,84);assert.equal(g.player.attack,null);
});

test('pause and hitstop cannot age the guard window, and finish clears the performance',()=>{
 const{g,f,o,a}=setup('han',2);a.age=.2;g.status='paused';tick(g,2);assert.equal(a.age,.2);g.status='active';g.freeze=.5;tick(g,.4);assert.equal(a.age,.2);g.freeze=0;g.damage(o,f,6);assert.equal(f.attack,a);g.finish();assert.equal(f.attack,null);assert.equal(g.request(f,'special2'),false);
 const fresh=new Duel('han');fresh.press('special2');assert.equal(fresh.player.attack.performanceGuardShown,false);
});

test('renderer guard predicate follows the complete live window and ends on KO',()=>{
 for(const[type,slot,kind,start,end]of moves){const{g,f,o,a}=setup(type,slot);a.age=-.001;assert.equal(performanceGuardActive(f),false);a.age=start;assert.equal(performanceGuardActive(f),true);a.age=end;assert.equal(performanceGuardActive(f),true);a.age=end+.001;assert.equal(performanceGuardActive(f),false);a.age=start;g.damage(o,f,6);assert.equal(performanceGuardActive(f),true);f.hp=0;assert.equal(performanceGuardActive(f),false);}
 assert.equal(performanceGuardActive(new Duel().player),false);assert.equal(performanceGuardActive(null),false);
});

for(const role of ['player','enemy'])for(const side of [-1,1])test(`two actual combo strikes both hurt but retain Han shout, ${role}/${side}`,()=>{
 const{g,f,o}=setup('han',2,role,side,'ko');o.x=f.x+110*side;g.request(o,'special1');tick(g,1.4);
 assert.equal(f.hp,86);assert.equal(f.attack,null);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,1);assert.equal(g.events.filter(e=>e.type==='hit'&&e.from===o).length,2);assert.equal(o.hp,86);
});

for(const role of ['player','enemy'])for(const side of [-1,1])test(`a real grounded grab interrupts Han's accepted shout, ${role}/${side}`,()=>{
 const{g,f,o}=setup('han',2,role,side,'ma');o.x=f.x+110*side;g.request(o,'special1');tick(g,1.4);
 assert.equal(f.hp,88);assert.equal(f.attack,null);assert.equal(f.performance,null);assert.equal(o.hp,100);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,0);assert.equal(g.events.filter(e=>e.type==='capture').length,1);
});

for(const role of ['player','enemy'])test(`a real high projectile preserves a protected shout without reduced damage, ${role}`,()=>{
 const{g,f,o}=setup('su',1,role,1,'han');g.request(o,'special1');tick(g,.6);
 assert.equal(f.hp,89);assert.equal(g.events.filter(e=>e.type==='performanceGuard').length,1);assert.equal(o.hp,86);assert.ok(g.events.some(e=>e.type==='hit'&&e.impact==='coin'&&e.performanceGuard));
});
