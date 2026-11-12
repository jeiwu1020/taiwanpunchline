// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST,GROUND} from './helpers/neutral-combat.mjs';
const DT=1/120;
const tick=(g,s,a={},b={},ai=false)=>{for(let t=0;t<s-1e-9;t+=DT)g.step(Math.min(DT,s-t),a,ai,ai?null:b);};
const spawn=(g)=>{g.player.x=68;g.enemy.x=892;assert.ok(Array.isArray(g.items),'world exposes ground items');for(let n=0;n<1900&&!g.items.some(i=>i.state==='ground');n++)g.step(DT,{},false,{});assert.ok(g.items.some(i=>i.state==='ground'),'a warned pickup lands');};
const held=(kind='paper',type='wang',role='player',side=1)=>{const g=new Duel(type,'normal',()=>.5,type);spawn(g);const f=g[role],o=g.other(f);g.items[0].kind=kind;f.x=g.items[0].x;o.x=f.x<480?892:68;g.step(DT,{},false,{});assert.equal(f.item?.kind,kind,'walk-near auto pickup');f.x=side>0?260:700;o.x=f.x+300*side;return{g,f,o};};

// Breaks: uncontrolled random spawning, missing warning/expiration, or biased positions.
test('a round has bounded seeded random falling pickups, warnings, lifetime and reachable positions',()=>{
 const rngFor=initial=>{let seed=initial;return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
 const play=(seed,swap=false,hp=100)=>{const g=new Duel('wang','normal',rngFor(seed),'wang');g.player.x=swap?892:68;g.enemy.x=swap?68:892;g.player.hp=hp;const spawns=[];
  for(let n=0;n<7201&&g.status==='active';n++){g.step(DT,{},false,{});for(const e of g.events)if(e.type==='itemSpawn'){const i=e.item;assert.equal(i.state,'falling');assert.ok(i.landsAt-g.elapsed>=.99);assert.ok(i.x>=160&&i.x<=800);assert.ok(Math.abs(i.x-g.player.x)>=120&&Math.abs(i.x-g.enemy.x)>=120);spawns.push([Number(g.elapsed.toFixed(4)),i.kind,i.x]);}g.events=[];assert.ok(g.items.length<=2);}
  assert.ok(spawns.length>=3&&spawns.length<=4);for(let n=0;n<spawns.length;n++){const gap=spawns[n][0]-(spawns[n-1]?.[0]??0);assert.ok(gap>=10&&gap<=14.01);}assert.equal(g.items.length,0);return spawns;};
 assert.deepEqual(play(17),play(17));assert.deepEqual(play(17),play(17,true,32));assert.notDeepEqual(play(17),play(42));
});
test('falling items do not collide, cannot be picked up and land before their ten-second ground expiry',()=>{
 const g=new Duel();g.player.x=68;g.enemy.x=892;assert.ok(Array.isArray(g.items));for(let n=0;n<1800&&!g.items.length;n++)g.step(DT,{},false,{});
 const item=g.items[0];assert.equal(item.state,'falling');g.player.x=item.x;tick(g,.6);assert.equal(g.player.item,null);assert.equal(g.player.hp,100);assert.ok(item.y<GROUND);
 g.player.x=68;tick(g,.5);assert.equal(item.state,'ground');assert.equal(item.y,GROUND);tick(g,10.1);assert.equal(g.items.includes(item),false);assert.ok(g.events.some(e=>e.type==='itemExpire'&&e.item.id===item.id));
});

for(const type of Object.keys(CAST))for(const role of ['player','enemy'])for(const kind of ['paper','rubber_duck'])for(const side of [-1,1])test(`${type}/${role}/${side}/${kind}: identical automatic pickup and one accepted punch throw`,()=>{
 const{g,f,o}=held(kind,type,role,side);assert.equal(g.items.length,0);assert.equal(g.events.filter(e=>e.type==='itemPickup'&&e.f===f).length,1);
 const inventory=f.item;f.stun=.1;assert.equal(g.request(f,'punch'),false);assert.equal(f.item,inventory);f.stun=0;
 const cooldowns=[...f.cooldowns],basic=f.basicStep;assert.equal(g.request(f,'punch'),true);assert.equal(f.attack.kind,'item_throw');assert.equal(f.attack.itemKind,kind);assert.equal(f.item,null);
 assert.equal(g.request(f,'punch'),false);assert.equal(f.basicStep,basic);assert.deepEqual(f.cooldowns,cooldowns);
 tick(g,1.2);assert.equal(o.hp,kind==='paper'?92:90);assert.equal(g.events.filter(e=>e.type==='itemThrow'&&e.f===f).length,1);assert.equal(g.events.filter(e=>e.type==='hit'&&e.from===f).length,1);
 assert.equal(g.request(f,'punch'),true);assert.equal(f.attack.kind,'punch');assert.equal(f.attack.variant,'left');
});

for(const role of ['player','enemy'])for(const side of [-1,1])for(const kind of ['paper','rubber_duck'])test(`${role}/${side}/${kind}: block, crouch and early jump follow visible flight height`,()=>{
 for(const defense of ['guard','crouch','jump']){
  const{g,f,o}=held(kind,'wang',role,side),input=defense==='jump'?{}:{[defense]:true};
  if(defense==='crouch')tick(g,.16,role==='player'?{}:input,role==='enemy'?{}:input);
  if(defense==='jump')g.request(o,'jump');g.request(f,'punch');tick(g,1.1,role==='player'?{}:input,role==='enemy'?{}:input);
  // V54 paper is visibly high: this early jump puts the extended feet in its
  // lane. Crouch genuinely clears it; the low duck clears the same jump.
  assert.equal(o.hp,defense==='guard'?98:defense==='jump'?(kind==='paper'?92:100):kind==='paper'&&defense==='crouch'?100:90,defense);
 }
});

// Break: the first actor visited gets an exactly contested item.
for(const swap of [false,true])test(`equal-distance pickup remains contested until one fighter is nearer, swap=${swap}`,()=>{
 const g=new Duel();spawn(g);const x=g.items[0].x;g.player.x=x+(swap?44:-44);g.enemy.x=x+(swap?-44:44);g.step(DT,{},false,{});
 assert.equal(g.player.item,null);assert.equal(g.enemy.item,null);assert.equal(g.items.length,1);
 g.player.x+=swap?-5:5;g.enemy.x+=swap?-5:5;g.step(DT,{},false,{});assert.ok(g.player.item);assert.equal(g.enemy.item,null);
});

for(const unavailable of ['airborne','stun','attack','guardBroken','dead'])test(`${unavailable} fighters cannot pick up an item`,()=>{
 const g=new Duel();spawn(g);const f=g.player;f.x=g.items[0].x;
 if(unavailable==='airborne'){f.y=GROUND-30;f.vy=-20;}else if(unavailable==='stun'||unavailable==='guardBroken')f[unavailable]=.3;else if(unavailable==='attack')g.request(f,'punch');else f.hp=0;
 g.step(DT,{},false,{});assert.equal(f.item,null);assert.equal(g.events.filter(e=>e.type==='itemPickup').length,0);
});

test('a full slot and repeated same-frame presses cannot duplicate or immediately refill inventory',()=>{
 const{g,f}=held();const second={id:'fixture-second',kind:'rubber_duck',x:f.x,y:GROUND,state:'ground',spawnedAt:g.elapsed,landsAt:g.elapsed,expiresAt:g.elapsed+10};g.items.push(second);g.step(DT,{},false,{});assert.equal(f.item.kind,'paper');
 const first=f.item.id;for(let n=0;n<20;n++)g.press('punch');assert.equal(f.item,null);assert.equal(g.events.filter(e=>e.type==='itemPickup'&&e.f===f).length,1);
 tick(g,.10);assert.equal(f.item,null);assert.equal(g.events.filter(e=>e.type==='itemThrow'&&e.itemId===first).length,0);
 tick(g,.05);assert.equal(g.events.filter(e=>e.type==='itemThrow'&&e.itemId===first).length,1);
});

test('a special leaves held item untouched and an interrupted pre-release throw cannot respawn it',()=>{
 const{g,f,o}=held();const item=f.item;g.request(f,'special3');tick(g,.5);assert.equal(f.item,item);g.damage(o,f,6);tick(g,.3);
 g.request(f,'punch');tick(g,.06);g.damage(o,f,6);tick(g,1);assert.equal(f.item,null);assert.equal(g.events.filter(e=>e.type==='itemThrow').length,0);
});

test('airborne rubber duck visibly falls, with no remote hit before reaching the target',()=>{
 const{g,f,o}=held('rubber_duck');g.request(f,'jump');tick(g,.30);g.request(f,'punch');tick(g,.15);
 const p=g.projectiles.find(p=>p.kind==='rubber_duck');assert.ok(p);assert.equal(p.phase,'falling');assert.ok(p.y<GROUND-35);assert.equal(o.hp,100);
 tick(g,2);assert.equal(g.projectiles.filter(p=>p.kind==='rubber_duck').length,0);
});

test('pause and hitstop freeze spawn, expiration, held state and projectile motion',()=>{
 const g=new Duel();tick(g,9.99);const elapsed=g.elapsed;g.status='paused';tick(g,2);assert.equal(g.elapsed,elapsed);assert.deepEqual(g.items,[]);g.status='active';g.freeze=.5;tick(g,.4);assert.equal(g.elapsed,elapsed);
 g.freeze=0;spawn(g);g.player.x=g.items[0].x;g.step(DT,{},false,{});g.request(g.player,'punch');tick(g,.15);const p=g.projectiles.find(p=>p.itemId),x=p.x,age=p.age;
 g.status='paused';tick(g,2);assert.equal(p.x,x);assert.equal(p.age,age);
});

test('round finish clears live pickups, held items and thrown items; a fresh duel restarts the schedule',()=>{
 const{g,f,o}=held();g.request(f,'punch');tick(g,.15);assert.ok(g.projectiles.some(p=>p.itemId));g.enemy.item={id:'fixture-held',kind:'rubber_duck'};o.hp=1;g.damage(f,o,6);
 assert.equal(g.status,'over');assert.deepEqual(g.items,[]);assert.equal(f.item,null);assert.equal(o.item,null);assert.equal(g.projectiles.filter(p=>p.itemId).length,0);const elapsed=g.elapsed;tick(g,20);assert.equal(g.elapsed,elapsed);
 const fresh=new Duel();assert.equal(fresh.player.item,null);assert.equal(fresh.enemy.item,null);assert.deepEqual(fresh.items,[]);spawn(fresh);assert.equal(fresh.items.length,1);
});

for(const difficulty of ['easy','normal'])test(`${difficulty} AI observes a pickup before changing its movement and uses ordinary offensive timing to throw`,()=>{
 const g=new Duel('wang',difficulty,()=>0,'ma');spawn(g);g.player.x=200;g.enemy.x=780;g.aiWait=10;g.items[0].kind='rubber_duck';
 // Enemy normally moves left; put the visible item to its right so pursuit is distinguishable.
 g.items[0].x=870;g.step(DT,{},true);assert.equal(g.aiInput.right,false);assert.equal(g.enemy.item,null);
 tick(g,difficulty==='easy'?.3:.10,{}, {},true);assert.equal(g.aiInput.right,false);
 tick(g,.5,{}, {},true);assert.equal(g.aiInput.right,true);tick(g,2.2,{}, {},true);assert.equal(g.enemy.item?.kind,'rubber_duck');assert.equal(g.enemy.attack,null);
 g.player.x=g.enemy.x-250;g.aiWait=0;g.step(DT,{},true);assert.equal(g.enemy.attack?.kind,'item_throw');tick(g,1,{}, {},true);assert.ok(g.events.some(e=>e.type==='itemThrow'&&e.f===g.enemy));
});

// Compatibility and shared-snapshot checks use the production movement/contact
// paths. A just-hit actor cannot win a pickup before the other actor is advanced.
for(const role of ['player','enemy'])test(`${role}: same-frame hit denies pickup after shared contact resolution`,()=>{
 const g=new Duel();spawn(g);const f=g[role],o=g.other(f);f.x=g.items[0].x;o.x=f.x+110;g.request(o,'punch');
 // Keep target unavailable until the attack reaches its real contact frame.
 f.stun=.10;tick(g,.12);assert.equal(f.hp,94);assert.equal(f.item,null);assert.ok(g.items.some(i=>i.state==='ground'));
});

for(const role of ['player','enemy'])test(`${role}: only one of two reachable ground items is acquired per shared simulation step`,()=>{
 const g=new Duel();spawn(g);const f=g[role];f.x=g.items[0].x;g.other(f).x=f.x<480?892:68;g.items.push({...g.items[0],id:'fixture-extra'});
 g.step(DT,{},false,{});assert.ok(f.item);assert.equal(g.items.length,1);assert.equal(g.events.filter(e=>e.type==='itemPickup'&&e.f===f).length,1);
});

for(const kind of ['paper','rubber_duck'])test(`${kind}: queue collision consumes it once and does not damage through the line`,()=>{
 const{g,f,o}=held(kind,'huang');f.x=300;o.x=600;g.request(o,'special3');tick(g,.8);assert.equal(g.obstacles.length,1);g.request(f,'punch');tick(g,1.5);
 assert.equal(g.obstacles.length,0);assert.equal(o.hp,100);assert.equal(g.projectiles.filter(p=>p.itemId).length,0);assert.equal(g.events.filter(e=>e.type==='queueBreak').length,1);
});

test('independent item random stream is not shifted by arbitrary AI random draws',()=>{
 const rngFor=initial=>{let seed=initial;return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
 const trace=extra=>{const g=new Duel('wang','normal',rngFor(2026),'wang');g.player.x=68;g.enemy.x=892;const seen=[];
  for(let n=0;n<7200&&g.status==='active';n++){if(extra)for(let k=0;k<5;k++)g.rng();g.step(DT,{},false,{});for(const e of g.events)if(e.type==='itemSpawn')seen.push([g.elapsed,e.item.kind,e.item.x]);g.events=[];}return seen;};
 assert.deepEqual(trace(false),trace(true));
});

for(const kind of ['paper','rubber_duck'])test(`${kind}: held item cannot bypass guard, airborne-jump or special cooldown legality`,()=>{
 const{g,f}=held(kind);const item=f.item;g.setGuard(f,true);assert.equal(g.request(f,'punch'),false);assert.equal(f.item,item);g.setGuard(f,false);
 g.request(f,'jump');assert.equal(g.request(f,'jump'),false);f.cooldowns[0]=4;assert.equal(g.request(f,'special1'),false);assert.equal(f.item,item);assert.equal(g.request(f,'punch'),true);assert.equal(f.item,null);
});

for(const role of ['player','enemy'])for(const side of [-1,1])test(`airborne duck hits visible contact during its fall exactly once, ${role}/${side}`,()=>{
 const{g,f,o}=held('rubber_duck','wang',role,side);g.request(f,'jump');tick(g,.30);g.request(f,'punch');tick(g,.15);const p=g.projectiles.find(p=>p.kind==='rubber_duck');
 assert.ok(p);assert.equal(p.phase,'falling');assert.equal(o.hp,100);tick(g,1.6);assert.equal(p.phase,'falling');assert.equal(p.dead,true);assert.equal(o.hp,90);assert.equal(g.events.filter(e=>e.type==='hit'&&e.from===f&&e.impact==='item_rubber_duck').length,1);assert.equal(g.projectiles.includes(p),false);
});
