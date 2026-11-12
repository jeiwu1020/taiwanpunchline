import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const url=new URL('../dist/preview/finale/finale-engine.mjs',import.meta.url);
async function arena(options={}){assert.equal(existsSync(url),true,'playable arena engine exists');const {FinaleArena}=await import(url);return new FinaleArena({team:['wang','han','chen'],rng:()=>.37,...options});}
const run=(g,seconds,input={})=>{for(let i=0;i<seconds*60&&g.status==='active';i++)g.step(1/60,input);};
test('arena has seven unique fighters, three allies, four opponents and normalized four-way movement',async()=>{
 const a=await arena(),b=await arena();assert.equal(a.actors.length,7);assert.equal(new Set(a.actors.map(f=>f.type)).size,7);assert.equal(a.actors.filter(f=>f.team===0).length,3);a.aiEnabled=b.aiEnabled=false;
 const p=a.player,q=b.player,x=p.x,z=p.depth;run(a,.25,{right:true});run(b,.25,{right:true,down:true});assert.ok(Math.abs(Math.hypot(p.x-x,p.depth-z)-Math.hypot(q.x-x,q.depth-z))<.1);
});
test('friendly fire and cross-lane melee cannot damage; original offensive and defensive rules apply',async()=>{
 const g=await arena();g.aiEnabled=false;const p=g.player,friend=g.actors.find(f=>f!==p&&f.team===0),enemy=g.actors.find(f=>f.team===1);Object.assign(p,{x:300,depth:0});Object.assign(friend,{x:390,depth:0});Object.assign(enemy,{x:390,depth:100});
 const fhp=friend.hp,ehp=enemy.hp;g.damage(p,friend,50);assert.equal(friend.hp,fhp);g.press('punch');run(g,.4);assert.equal(enemy.hp,ehp);
 Object.assign(friend,{depth:-135});Object.assign(enemy,{x:p.x+110,depth:p.depth});g.press('punch');run(g,.2);assert.ok(enemy.hp<ehp);assert.ok(p.rally>0);
});
test('AI attacks other AI and switches target after a fighter falls',async()=>{
 const g=await arena();g.player.hp=0;const friendly=g.actors.filter(f=>f.team===0&&f.hp>0),enemy=g.actors.find(f=>f.team===1);assert.ok(g.targetFor(enemy));assert.notEqual(g.targetFor(enemy),g.player);const hp=g.actors.reduce((n,f)=>n+f.hp,0);run(g,12);assert.ok(g.actors.reduce((n,f)=>n+f.hp,0)<hp);assert.ok(g.drainEvents().some(e=>e.type==='hit'&&e.from!==g.player&&e.to!==g.player));
 enemy.hp=0;assert.ok(friendly.every(f=>g.targetFor(f)!==enemy));
});
test('fallen player can win through surviving teammates; time ties never award a clear',async()=>{
 const g=await arena();g.aiEnabled=false;g.player.hp=0;for(const f of g.actors)if(f.team===1)f.hp=0;g.step(.016);assert.equal(g.winner,'player');assert.equal(g.status,'over');
 const tied=await arena();tied.aiEnabled=false;tied.actors.find(f=>f.team===1).hp=0;tied.remaining=.001;tied.step(.016);assert.equal(tied.winner,'draw');
});
test('all 21 existing special moves run in the team arena without corrupting state',async()=>{
 for(const id of ['wang','han','huang','su','ko','ma','chen'])for(let i=1;i<=3;i++){
  const team=[id,...['wang','han','huang','su','ko','ma','chen'].filter(x=>x!==id).slice(0,2)],g=await arena({team});g.aiEnabled=false;const target=g.targetFor(g.player);Object.assign(g.player,{x:300,depth:0});Object.assign(target,{x:410,depth:0});g.player.hp=Math.min(g.player.hp,50);assert.equal(g.press('special'+i),true,`${id}:${i}`);run(g,2);
  assert.ok(g.actors.every(f=>Number.isFinite(f.hp)&&Number.isFinite(f.x)&&Number.isFinite(f.depth)),`${id}:${i} finite`);assert.ok(g.player.cooldowns[i-1]>0,`${id}:${i} spends cooldown`);
 }
});
test('lobbed arrows land in the marked depth lane and can be evaded sideways',async()=>{
 for(const dodge of [false,true]){
  const g=await arena({team:['han','wang','chen']});g.aiEnabled=false;const p=g.player,e=g.enemies[0];for(const a of g.actors)if(a!==p&&a!==e)Object.assign(a,{x:850,depth:130});Object.assign(p,{x:280,depth:0});Object.assign(e,{x:410,depth:90});const hp=e.hp;
  assert.equal(g.press('special3'),true);run(g,.4);assert.equal(g.projectiles[0].targetDepth,90);if(dodge)e.depth=-100;run(g,1.6);assert.equal(e.hp<hp,!dodge);
 }
});
test('deferred queue spawns keep their caster lane for rendering and crossings',async()=>{
 const g=await arena({team:['huang','wang','han']});g.aiEnabled=false;Object.assign(g.player,{x:280,depth:110});assert.equal(g.press('special3'),true);run(g,.6);
 const q=g.obstacles[0];assert.ok(q);assert.equal(q.depth,110);assert.ok(Number.isFinite(q.y+q.depth*.65));
 const enemy=g.enemies[0],hp=enemy.hp;Object.assign(enemy,{x:q.x-30,depth:0});g.queueCrossings(enemy,q.x-30,q.x+30);g.resolveContacts();assert.equal(enemy.hp,hp);
 enemy.depth=110;g.queueCrossings(enemy,q.x-30,q.x+30);g.resolveContacts();assert.ok(enemy.hp<hp);
});
test('melee and projectiles break only hostile queues in the same depth lane',async()=>{
 for(const type of ['ko','han'])for(const scenario of ['far-lane','friendly','hostile']){
  const g=await arena({team:[type,'wang','chen']});g.aiEnabled=false;const p=g.player,owner=scenario==='friendly'?g.actors[1]:g.enemies.find(f=>f.type==='huang');Object.assign(p,{x:200,depth:100});
  for(const a of g.actors)if(a!==p)Object.assign(a,{x:800,depth:-100});
  const q={kind:'queue',owner,x:350,y:430,depth:scenario==='far-lane'?-100:100,life:10,castId:999,damage:10,knock:65,direction:-1,dead:false};g.obstacles.push(q);
  assert.equal(g.press('special1'),true);run(g,.65);assert.equal(q.dead,scenario==='hostile',`${type}:${scenario}`);
 }
});
