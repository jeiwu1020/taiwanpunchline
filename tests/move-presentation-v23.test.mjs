// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,CAST,performanceGuardActive} from './helpers/neutral-combat.mjs';
import {COMBAT} from '../dist/combat-rules.mjs';
import {fighterPose} from '../dist/art-motion.mjs';
import {gameHarness,flush,deferred,move} from './helpers/game-harness.mjs';
const tick=(g,s)=>{for(let t=0;t<s-1e-9;t+=1/120)g.step(Math.min(1/120,s-t),{},false,{});};
const lastKey=m=>m.behavior==='heal'?.4:['counter','reject','calm','armor'].includes(m.behavior)?m.start+.12:m.hits?Math.max(...m.hits.map(h=>h.end)):m.end??m.start+.06;

// Break: any accepted special loses its first key pose to a startup jab, or a
// second strike consumes the old one-hit guard before the actual move release.
for(const [type,cast] of Object.entries(CAST))for(const [idx,m] of cast.moves.entries())for(const role of ['player','enemy'])test(`${m.kind}/${role}: key performance survives repeated startup damage, not KO`,()=>{
 const g=new Duel(type,'normal',()=>.5,type),f=g[role],o=g.other(f);f.x=350;o.x=600;
 assert.equal(g.request(f,'special'+(idx+1)),true);const a=f.attack,cd=f.cooldowns[idx],x=f.x;
 for(const age of [0,.02]){a.age=age;g.damage(o,f,6);assert.equal(f.attack,a);assert.equal(f.reaction,0);assert.equal(f.stun,0);assert.equal(f.x,x);}
 assert.equal(f.hp,88);assert.equal(f.cooldowns[idx],cd);assert.equal(g.request(f,'special'+(idx+1)),false);
 f.hp=5;g.damage(o,f,6);assert.equal(g.status,'over');assert.equal(f.attack,null);
});

for(const [type,cast] of Object.entries(CAST))for(const [idx,m] of cast.moves.entries())test(`${m.kind}: protection ends after its key presentation, not after its cooldown`,()=>{
 const g=new Duel(type),f=g.player;g.press('special'+(idx+1));const end=lastKey(COMBAT[m.kind]);
 f.attack.age=end;assert.equal(performanceGuardActive(f),true);
 f.attack.age=end+.001;assert.equal(performanceGuardActive(f),false);
});

test('drink visibly reaches the mouth before becoming interruptible; late damage still cancels recovery',()=>{
 const g=new Duel('wang');g.player.hp=60;g.press('special3');g.damage(g.enemy,g.player,6);tick(g,.36);
 assert.equal(g.player.attack?.kind,'heal');assert.equal(g.player.hp,54);
 const p=fighterPose(g.player);assert.equal(p.head,'sip');assert.ok(p.arm.wrist.y<-165,'cup reaches the mouth');
 tick(g,.14);g.damage(g.enemy,g.player,6);assert.equal(g.player.attack,null);tick(g,1.2);
 assert.equal(g.player.hp,48);assert.equal(g.events.filter(e=>e.type==='spit').length,1);
});

test('real early multi-hit pressure does not suppress Han knee shout',()=>{
 const g=new Duel('han','normal',()=>.5,'ko');g.player.x=350;g.enemy.x=460;g.press('special2');g.request(g.enemy,'special1');tick(g,1.4);
 assert.equal(g.player.hp,86);assert.equal(g.enemy.hp,86);assert.equal(g.player.attack,null);
 assert.equal(g.events.filter(e=>e.type==='hit'&&e.impact==='han_knee').length,1);
});

test('V39 grab is a tactical interruption of an accepted key performance',()=>{
 const g=new Duel('han','normal',()=>.5,'ma');g.player.x=350;g.enemy.x=460;g.press('special2');g.request(g.enemy,'special1');tick(g,1.4);
 assert.equal(g.player.hp,88);assert.equal(g.enemy.hp,100);assert.equal(g.player.performance,null);assert.equal(g.events.filter(e=>e.type==='capture').length,1);
});

test('new accepted move waits for the current phrase without touching opponent',async()=>{
 const h=await gameHarness();h.ui.activate();const p=h.$('#move-voice'),e=h.$('#han-voice');
 const player={id:'player',type:'ma',x:350,y:430,attack:{kind:'ma_cough',age:0}},enemy={id:'enemy',type:'han',x:700,y:430};
 h.ui.playConfiguredVoice('coin',false,enemy);h.ui.playConfiguredVoice('ma_handshake',false,player);
 move(h,player,'ma_cough');assert.equal(p.plays.length,1);assert.match(p.src,/handshake/);assert.equal(e.playing,true);
 player.attack=null;h.ui.drainVoiceCues();assert.equal(p.plays.length,1);p.emit('ended');await flush();
 assert.equal(p.plays.length,2);assert.match(p.src,/cough/);assert.equal(p.playing,true);assert.equal(e.playing,true);
});

test('queued playback ignores stale callbacks from failed media',async()=>{
 const h=await gameHarness();h.ui.activate();const p=h.$('#move-voice'),old=deferred();p.playResult=()=>old.promise;
 h.ui.playConfiguredVoice('su_shout');const oldError=p.onerror,oldEnd=p.onended;p.playResult=null;
 assert.equal(h.ui.playConfiguredVoice('su_rush'),true);await flush();old.reject(Error('late abort'));oldError();oldEnd();await flush();
 assert.equal(p.playing,true);assert.match(p.src,/su-rush/);assert.match(h.$('#voice-status').textContent,/衝衝衝/);
});

test('accepted special clears a finished hit reaction so its key pose is visible immediately',()=>{
 const g=new Duel('wang');g.player.reaction=.20;g.player.stun=0;assert.equal(g.press('special3'),true);
 assert.equal(g.player.reaction,0);assert.equal(fighterPose(g.player).head,'sip');
});

for(const hp of [100,16])test(`protected move preserves Huang wall bonus and its lethal outcome from ${hp} HP`,()=>{
 const g=new Duel('huang','normal',()=>.5,'wang');g.player.x=760;g.enemy.x=892;g.enemy.hp=hp;
 g.press('special1');tick(g,.25);g.request(g.enemy,'special3');const a=g.enemy.attack;tick(g,.3);
 assert.equal(g.enemy.hp,Math.max(0,hp-17));assert.equal(g.stats.damage,hp===100?17:16);
 if(hp===100){assert.equal(g.enemy.attack,a);assert.equal(g.enemy.x,892);assert.equal(g.events.filter(e=>e.type==='wallHit').length,1);}
 else{assert.equal(g.status,'over');assert.equal(g.enemy.attack,null);}
});
