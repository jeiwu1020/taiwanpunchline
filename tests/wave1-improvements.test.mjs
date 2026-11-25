import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Duel,GROUND} from '../dist/core.mjs';
import {ChallengeRoute} from '../dist/challenge-engine.mjs';
import {FinaleArena} from '../dist/preview/finale/finale-engine.mjs';
import {createFinaleBrawlSession} from '../dist/preview/finale/finale-brawl.mjs';
import {RANK5_PERKS,specialPerkFor,deriveFighterStats} from '../dist/fighter-attributes.mjs';
import {playProceduralSfx} from '../dist/sfx-synth.mjs';
import {rememberCombatFeedback} from '../dist/preview/campaign/combat-feedback.mjs';
import {rememberWorldFx,paintWorldFx,drawWorldFighterAuras,drawWorldProjectileExtra} from '../dist/preview/campaign/world-combat-fx.mjs';
import {battleResultCopy} from '../dist/stage-expansion.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const CHARACTERS=['wang','han','ma','su','huang','chen','ko'];

function perkStats(id){
 return deriveFighterStats(id,{challenge:true,skills:{special:5}});
}

function stepNoAI(duel,frames,playerInput={},enemyInput={}){
 for(let i=0;i<frames;i++)duel.step(1/60,playerInput,false,enemyInput);
}

function mockCtx(){
 const ops=[];
 const ctx=new Proxy({fillStyle:'',strokeStyle:'',lineWidth:1,lineCap:'',lineJoin:'',font:'',textAlign:'',textBaseline:'',globalAlpha:1},{
  get(target,prop){
   if(prop in target)return target[prop];
   if(prop==='fillText'){return (t,...rest)=>{ops.push(['fillText',t,...rest]);};}
   if(prop==='beginPath'||prop==='arc'||prop==='ellipse'||prop==='stroke'||prop==='fill'||prop==='fillRect'||prop==='strokeRect'||prop==='moveTo'||prop==='lineTo'||prop==='closePath'||prop==='save'||prop==='restore'||prop==='translate'||prop==='scale'){
    return (...args)=>{ops.push([prop,...args]);};
   }
   return ()=>{};
  },
  set(target,prop,val){target[prop]=val;return true;}
 });
 ctx.__ops=ops;
 return ctx;
}

function mockAudioContext(){
 const nodes=[];
 const param=(init=0)=>({
  value:init,
  setValueAtTime(){},
  exponentialRampToValueAtTime(){},
  linearRampToValueAtTime(){},
 });
 return {
  state:'running',
  currentTime:0,
  sampleRate:24000,
  nodes,
  createBuffer(channels,length,rate){
   const buf=new Float32Array(length);
   return {channels,length,rate,getChannelData:()=>buf};
  },
  createBufferSource(){
   const n={type:'buffer',buffer:null,onended:null,connect(){},disconnect(){},start(){nodes.push(n);},stop(){}};
   return n;
  },
  createOscillator(){
   const n={type:'sine',frequency:param(200),onended:null,connect(){},disconnect(){},start(){nodes.push(n);},stop(){}};
   return n;
  },
  createGain(){
   const n={gain:param(1),connect(){},disconnect(){}};
   return n;
  },
  createBiquadFilter(){
   return {type:'lowpass',frequency:param(800),Q:param(1),connect(){},disconnect(){}};
  },
 };
}

test('Rank-5 perks catalog and activation rules cover all seven fighters',()=>{
 for(const id of CHARACTERS){
  assert.ok(RANK5_PERKS[id]?.title,`${id} has Rank-5 perk`);
  assert.equal(specialPerkFor(id,4,true)?.active,false);
  assert.equal(specialPerkFor(id,5,false)?.active,false);
  assert.equal(specialPerkFor(id,5,true)?.active,true);
  const derived=perkStats(id);
  assert.equal(derived.perk.active,true);
  assert.equal(derived.perk.id,id);
 }
});

test('Wang Rank-5 perk empowers heal (+14 HP + armor) and counter window/knockback',()=>{
 const d=new Duel('wang','beginner',()=>.5,'han',{playerStats:perkStats('wang')});
 d.player.hp=50;
 assert.equal(d.press('special3'),true);
 // COMBAT.heal.start is 1.0s
 stepNoAI(d,68);
 assert.equal(d.player.hp,64,`expected 64 HP, got ${d.player.hp}`);
 assert.ok(d.player.armor>0,'gold bell armor granted on heal');
 assert.ok(d.events.some(e=>e.type==='perkTrigger'&&e.f===d.player),'emits perkTrigger');

 d.player.cooldowns[1]=0;d.player.attack=null;
 d.player.x=420;d.enemy.x=480;
 assert.equal(d.press('special2'),true);
 stepNoAI(d,6);
 assert.ok(d.player.counter>.35,'Wang Rank-5 counter window extended beyond standard');
 d.damage(d.enemy,d.player,6,15,'punch');
 assert.ok(d.events.some(e=>e.type==='perkTrigger'&&e.kind==='counter'),'Wang Rank-5 counter emits perkTrigger');
});

test('Han Rank-5 perk fires mega coin + second mini coin and widens arrow landing mark',()=>{
 const d=new Duel('han','beginner',()=>.5,'wang',{playerStats:perkStats('han')});
 d.player.x=180;d.enemy.x=800;
 assert.equal(d.press('special1'),true);
 stepNoAI(d,16);
 assert.equal(d.projectiles.length,2,'two coins fired');
 assert.ok(d.projectiles.some(p=>p.perk&&!p.miniCoin&&p.radius>=19),'mega coin present');
 assert.ok(d.projectiles.some(p=>p.miniCoin&&p.perk),'mini coin present');

 d.projectiles.length=0;d.player.attack=null;
 assert.equal(d.press('special3'),true);
 stepNoAI(d,20);
 const arrow=d.projectiles.find(p=>p.kind==='arrow');
 assert.ok(arrow,'arrow fired');
 assert.equal(arrow.hitRadius,64);
 assert.equal(arrow.markWidth,148);
});

test('Su Rank-5 perk shatters all 3 guard pips on shout and breaks queues on rush',()=>{
 const d=new Duel('su','beginner',()=>.5,'huang',{playerStats:perkStats('su'),enemyStats:perkStats('huang')});
 d.player.x=360;d.enemy.x=490;
 assert.equal(d.press('special1'),true); // su_shout
 stepNoAI(d,25,{},{guard:true});
 assert.equal(d.enemy.guardPips,0,'all 3 guard pips shattered');
 assert.ok(d.enemy.guardBroken>0,'target entered guardBroken state');

 d.obstacles.push({owner:d.enemy,x:480,y:GROUND,life:2,damage:9,knock:30,hits:new Set(),dead:false});
 d.player.x=400;d.enemy.x=780;d.player.cooldowns[1]=0;d.player.attack=null;
 assert.equal(d.press('special2'),true); // su_rush
 stepNoAI(d,30);
 assert.ok(d.obstacles.every(o=>o.dead),'Su rush broke queue obstacle');
 assert.ok(d.events.some(e=>e.type==='queueBreak'));
});

test('Huang Rank-5 perk reflects projectiles at 1.6x damage and strengthens queue obstacles',()=>{
 const d=new Duel('huang','beginner',()=>.5,'han',{playerStats:perkStats('huang')});
 d.obstacles.length=0;
 assert.equal(d.press('special3'),true);
 stepNoAI(d,25);
 assert.equal(d.obstacles.length,1);
 assert.equal(d.obstacles[0].guardCost,2);
 assert.equal(d.obstacles[0].perk,true);

 d.player.cooldowns[1]=0;d.player.attack=null;d.player.face=1;d.player.x=300;d.enemy.x=650;
 assert.equal(d.press('special2'),true);
 stepNoAI(d,10);
 assert.ok(d.player.reject>0,'Huang reject active');
 d.projectiles.push({owner:d.enemy,originalOwner:d.enemy,category:'special',kind:'coin',impact:'coin',x:330,y:GROUND-252,vx:-300,vy:0,gravity:0,radius:13,phase:'outbound',direction:-1,travelDir:-1,life:2,age:0,damage:10,knock:20,hits:new Set(),dead:false});
 stepNoAI(d,2);
 const refl=d.projectiles[0];
 assert.equal(refl.reflected,true);
 assert.equal(refl.perk,true);
 assert.equal(refl.damage,16);
 assert.equal(refl.owner,d.player);
});

test('Ma Rank-5 perk applies dizzyStar on handshake and multi-erases enemy projectiles on cough',()=>{
 const d=new Duel('ma','beginner',()=>.5,'han',{playerStats:perkStats('ma')});
 d.player.x=380;d.enemy.x=475;
 assert.equal(d.press('special1'),true); // ma_handshake (grab)
 stepNoAI(d,25);
 assert.ok(d.enemy.dizzyStar>0,'handshake inflicts dizzyStar');
 assert.ok(d.enemy.slow>0,'handshake applies slow');

 d.player.x=300;d.enemy.x=700;d.player.face=1;d.player.attack=null;
 d.projectiles.push(
  {owner:d.enemy,kind:'coin',x:380,y:GROUND-252,vx:-200,radius:13,life:2,age:0,damage:10,knock:20,hits:new Set(),dead:false},
  {owner:d.enemy,kind:'dream',x:400,y:GROUND-252,vx:-200,radius:13,life:2,age:0,damage:10,knock:20,hits:new Set(),dead:false}
 );
 assert.equal(d.press('special3'),true); // ma_cough
 stepNoAI(d,20);
 assert.ok(d.projectiles.every(p=>p.dead),'cough swept all straight enemy projectiles in one go');
 assert.ok(d.events.some(e=>e.type==='perkTrigger'&&e.kind==='ma_cough'));
});

test('Chen Rank-5 perk boosts paper plane speed/distance/damage and heals +4 on calm absorb',()=>{
 const base=new Duel('chen','beginner',()=>.5,'wang');
 base.player.x=200;base.enemy.x=800;
 base.press('special1');
 stepNoAI(base,22);
 const basePlane=base.projectiles[0];

 const perked=new Duel('chen','beginner',()=>.5,'wang',{playerStats:perkStats('chen')});
 perked.player.x=200;perked.enemy.x=800;
 perked.press('special1');
 stepNoAI(perked,22);
 const perkPlane=perked.projectiles[0];
 assert.ok(perkPlane&&basePlane,'both paper planes launched');
 assert.ok(perkPlane.vx>basePlane.vx,'Rank-5 plane is faster');
 assert.equal(perkPlane.turnX,basePlane.turnX+120);
 assert.equal(perkPlane.damage,basePlane.damage+3);
 assert.equal(perkPlane.returnDamage,basePlane.returnDamage+3);

 perked.player.hp=50;perked.player.cooldowns[2]=0;perked.player.attack=null;
 perked.press('special3');
 stepNoAI(perked,10);
 assert.ok(perked.player.calm>0,'Chen calm active');
 perked.player.x=400;perked.enemy.x=480;perked.player.face=1;
 perked.damage(perked.enemy,perked.player,12,20,'punch');
 // 50 - min(4, 12) + 4 heal == 50! (Without perk, HP drops to 46)
 assert.ok(perked.player.hp>46,`expected calm +4 heal above 46, got ${perked.player.hp}`);
 assert.ok(perked.events.some(e=>e.type==='perkTrigger'&&e.kind==='chen_calm'));
});

test('Ko Rank-5 perk grants 2-hit armor + empowered next punch, and widens word mark',()=>{
 const d=new Duel('ko','beginner',()=>.5,'wang',{playerStats:perkStats('ko')});
 assert.equal(d.press('special3'),true);
 stepNoAI(d,15);
 assert.equal(d.player.armorCount,2,'2-layer armor');
 assert.ok(d.player.brace>0,'brace empowered punch ready');
 d.player.x=400;d.enemy.x=490;d.player.face=1;
 d.damage(d.enemy,d.player,10,15,'punch');
 assert.equal(d.player.armorCount,1,'first hit strips 1 armor layer');
 assert.ok(d.player.armor>0,'armor remains after 1st hit');
 d.damage(d.enemy,d.player,10,15,'punch');
 assert.equal(d.player.armorCount,0,'second hit exhausts armor');

 // Wait for ko_resolve duration to finish so punch can trigger +20% brace perk
 stepNoAI(d,20);
 d.player.attack=null;d.player.x=400;d.enemy.x=490;
 assert.equal(d.press('punch'),true);
 stepNoAI(d,12);
 assert.ok(d.events.some(e=>e.type==='perkTrigger'&&e.kind==='ko_resolve'),'Ko brace empowered punch emitted perkTrigger');

 d.player.cooldowns[1]=0;d.player.attack=null;
 assert.equal(d.press('special2'),true);
 stepNoAI(d,25);
 const word=d.projectiles.find(p=>p.kind==='word');
 assert.ok(word&&word.markWidth===132&&word.perk,'widened Rank-5 word projectile');
});

test('Rank-5 perks work in ChallengeRoute and FinaleArena too',()=>{
 const route=new ChallengeRoute('su','easy',()=>.5,{stats:perkStats('su')});
 assert.equal(route.player.perk.active,true);
 route.spawn();
 route.obstacles.push({owner:route.enemies[0],x:route.player.x+70,y:GROUND,life:3,damage:8,knock:20,hits:new Set(),dead:false});
 assert.equal(route.press('special2'),true); // su_rush
 stepNoAI(route,30);
 assert.ok(route.obstacles.every(o=>o.dead),'ChallengeRoute su_rush breaks queue obstacles');

 const arena=new FinaleArena({team:['han','wang','ko'],difficulty:'easy',statsForCharacter:id=>perkStats(id)});
 assert.ok(arena.actors.every(a=>a.perk?.active),'all 7 FinaleArena actors have Rank-5 perks active');
 arena.press('special1');
 for(let i=0;i<18;i++)arena.step(1/60,{});
 assert.ok(arena.projectiles.some(p=>p.miniCoin),'Han fires twin coins in FinaleArena');
});

test('sfx-synth synthesizes multi-layered comedy effects without errors',()=>{
 for(const kind of ['hit','block','jump','heal','counter','spit','launch','whiff','start','win','lose','guardBreak','reflect','reject','erase','armorAbsorb','calm','queueBreak','capture','wallBounce','wallHit','performanceGuard','perkTrigger','han_coin','ko_name','ma_handshake','su_shout']){
  const ctx=mockAudioContext();
  const ok=playProceduralSfx(ctx,ctx.createGain(),kind);
  assert.equal(ok,true,`${kind} should play`);
  assert.ok(ctx.nodes.length>=1,`${kind} creates Web Audio nodes`);
 }
});

test('world-combat-fx and combat-feedback draw Rank-5 auras, counters, stars, and perkTrigger text',()=>{
 const feedback=[],worldFx=[];
 const fakePlayer={x:300,y:GROUND,supportY:GROUND,depth:0,hp:80,maxHp:100,face:1,armor:1.5,armorCount:2,brace:1.2,dizzyStar:1,perk:{active:true}};
 rememberCombatFeedback(feedback,{type:'perkTrigger',f:fakePlayer,label:'發財雙金幣！'},100);
 rememberWorldFx(worldFx,{type:'perkTrigger',f:fakePlayer},100);
 rememberWorldFx(worldFx,{type:'hit',to:fakePlayer,amount:20,combo:2,impact:'han_knee'},100);
 assert.equal(feedback.length,1);
 assert.equal(feedback[0].text,'★ 發財雙金幣！');
 assert.equal(worldFx.length,2);

 const ctx=mockCtx(),proj=(x,y)=>({x,y,scale:1});
 drawWorldFighterAuras(ctx,fakePlayer,proj,1,250);
 drawWorldProjectileExtra(ctx,{kind:'arrow',x:360,y:GROUND-200,targetX:500,targetDepth:0,markWidth:148,age:.2,flight:.8,perk:true,reflected:true},proj,1,250);
 paintWorldFx(ctx,worldFx,proj,1,250);
 assert.ok(ctx.__ops.some(([op,t])=>op==='fillText'&&t==='×2'),'renders ×2 armor badge');
 assert.ok(ctx.__ops.some(([op])=>op==='ellipse'),'renders aura & lob rings');
});

test('stage-expansion battleResultCopy delivers rival pair roasts and all 7 mirror lines',()=>{
 const rivalDuel=new Duel('wang','easy',()=>0,'han');
 rivalDuel.winner='player';
 const rivalCopy=battleResultCopy(rivalDuel);
 assert.match(rivalCopy.subtitle,/韓國魚|從容/);

 for(const id of CHARACTERS){
  const mirrorDuel=new Duel(id,'easy',()=>0,id);
  mirrorDuel.winner='enemy';
  const mirrorCopy=battleResultCopy(mirrorDuel);
  assert.match(mirrorCopy.title,/（AI）獲勝！$/);
  assert.ok(mirrorCopy.subtitle.length>10,`${id} mirror roast populated`);
 }
});

test('createFinaleBrawlSession unlocks all 7 fighters, never touches localStorage, and toggles Rank-5 perks',async()=>{
 const originalLocalStorage=globalThis.localStorage;
 Object.defineProperty(globalThis,'localStorage',{value:{getItem(){throw Error('must not touch localStorage');},setItem(){throw Error('must not touch localStorage');}},configurable:true});
 try{
  const brawl=createFinaleBrawlSession({difficulty:'hard',rank5Perks:true,team:['wang','han','huang']});
  assert.equal(brawl.view().unlocked.length,7);
  assert.equal(brawl.view().brawl,true);
  await brawl.start(['ko','chen','su']);
  assert.equal(brawl.view().mode,'battle');
  assert.ok(brawl.world.actors.every(a=>a.perk?.active),'all 7 fighters start with Rank-5 perk active');

  brawl.setPaused(true,brawl.view().token);
  brawl.setOptions({rank5Perks:false});
  const restarted=await brawl.restartSegment();
  assert.equal(restarted.accepted,true);
  assert.ok(brawl.world.actors.every(a=>!a.perk?.active),'toggling Rank-5 off disables perks cleanly');

  for(const a of brawl.world.actors)if(a.team===1)a.hp=0;
  brawl.step(1/60,{});
  assert.equal(brawl.view().mode,'result');
  assert.equal(brawl.view().result.winner,'player');
  await brawl.continueResult();
  assert.equal(brawl.view().mode,'battle');
  await brawl.reselect();
  assert.equal(brawl.view().mode,'team-select');
 }finally{
  Object.defineProperty(globalThis,'localStorage',{value:originalLocalStorage,configurable:true});
 }
});

test('Brawl entry point and Finale UI wiring match Wave-1 contracts',()=>{
 const rootHtml=readFileSync(resolve(root,'dist/index.html'),'utf8');
 const finaleHtml=readFileSync(resolve(root,'dist/preview/finale/index.html'),'utf8');
 const finaleJs=readFileSync(resolve(root,'dist/preview/finale/finale-playable.mjs'),'utf8');
 const gameJs=readFileSync(resolve(root,'dist/game.mjs'),'utf8');
 const overviewJs=readFileSync(resolve(root,'dist/challenge-overview.mjs'),'utf8');

 assert.match(rootHtml,/id="mode-brawl"[^>]*>3v4 大亂鬥<\/button>/);
 assert.ok(gameJs.includes("$('#mode-brawl')")&&gameJs.includes("preview/finale/?brawl=1"),'game.mjs wires #mode-brawl to preview/finale/?brawl=1');
 assert.match(overviewJs,/mode-brawl.*\/preview\/finale\/\?brawl=1/);
 assert.match(finaleHtml,/id="brawl-options"/);
 assert.match(finaleHtml,/id="result-scoreboard"/);
 assert.match(finaleHtml,/id="result-mvp-roast"/);
 assert.match(finaleHtml,/id="ending-winners"/);
 assert.ok(finaleJs.startsWith('import {DEVELOPMENT_TOOLS}'),'DEVELOPMENT_TOOLS hoisted to top of finale-playable.mjs');
 assert.match(finaleJs,/brawl=query\.has\('brawl'\)/,'?brawl=1 is available without DEVELOPMENT_TOOLS gating');
});
