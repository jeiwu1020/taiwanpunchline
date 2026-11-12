// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,GROUND} from './helpers/neutral-combat.mjs';
const DT=1/120;
const tick=(g,seconds,ai=true)=>{for(let t=0;t<seconds-1e-9;t+=DT)g.step(Math.min(DT,seconds-t),{},ai,ai?null:{});};
const close=(player='han',difficulty='normal',enemy='ma',rng=()=>0)=>{const g=new Duel(player,difficulty,rng,enemy);g.player.x=400;g.enemy.x=510;g.aiWait=10;return g;};
const reacting=g=>g.enemy.guard||g.enemy.crouch||g.enemy.y<GROUND||g.enemy.attack!==null;
const quiet=(g,seconds)=>{for(let t=0;t<seconds-1e-9;t+=DT){g.step(Math.min(DT,seconds-t),{},true);assert.equal(reacting(g),false,`no reaction at ${g.elapsed.toFixed(3)}s`);}};

// Break caught: treating a recheck timer as the first response delay.
for(const [difficulty,quietUntil,respondBy] of [['normal',.20,.26],['easy',.44,.51]])test(`${difficulty} waits after first seeing a slow attack, then can defend`,()=>{
 const g=close('han',difficulty);g.press('special2');quiet(g,quietUntil);
 assert.equal(reacting(g),false,'a fresh observed attack cannot trigger an immediate defense');
 tick(g,respondBy-quietUntil);assert.equal(g.enemy.guard,true,'a still-visible threat eventually permits a response');
});

test('a new jab lands before an unprepared normal AI can visually react',()=>{
 const g=close('wang','normal','han',()=>.5);g.press('punch');tick(g,.14);
 assert.equal(g.enemy.hp,94);assert.equal(g.events.some(e=>e.type==='block'),false);
});

// Break caught: the offensive candidate branch reads attack intent before the
// observation deadline, bypassing the defensive reaction path entirely.
for(const difficulty of ['normal','easy'])test(`${difficulty} cannot instantly choose a counter stance from fresh attack input`,()=>{
 const g=close('chen',difficulty,'wang');g.aiWait=0;g.enemy.cooldowns=[9,0,9];g.press('special2');g.step(DT,{},true);
 assert.notEqual(g.enemy.attack?.kind,'counter');
 assert.equal(g.events.some(e=>e.f===g.enemy&&e.type==='move'&&e.kind==='counter'),false);
});

for(const difficulty of ['normal','easy'])for(const kind of ['projectile','queue'])test(`${difficulty} gives a newly visible ${kind} its own first-observation delay`,()=>{
 const g=close(kind==='projectile'?'han':'huang',difficulty,'ma');g.enemy.x=650;
 g.press(kind==='projectile'?'special1':'special3');tick(g,kind==='projectile'?.20:.32,false);g.aiWait=10;
 assert.equal(kind==='projectile'?g.projectiles.length:g.obstacles.length,1);quiet(g,.10);
 assert.equal(reacting(g),false);
});

// Break caught: a new cast inherits elapsed reaction time from a prior cast.
test('a replacement attack must earn a new observation delay',()=>{
 const g=close();g.press('special2');tick(g,.20);g.player.attack=null;g.press('special3');tick(g,.11);
 assert.equal(reacting(g),false);
});

// Break caught: old visible attacks/projectiles remain usable after vanishing.
test('a disappearing threat cannot cause a delayed phantom defense',()=>{
 const g=close();g.press('special2');tick(g,.15);g.player.attack=null;tick(g,.30);
 assert.equal(reacting(g),false);
});

// Break caught: offensive wait runs out during a long attack and a follow-up
// starts on the very next legal frame instead of leaving a recovery opening.
for(const [difficulty,minGap] of [['normal',.14],['easy',.26]])for(const action of ['punch','special2'])test(`${difficulty} leaves a real post-${action} gap even when the decision timer is ready`,()=>{
 const g=close('wang',difficulty,'han',()=>.9);g.aiWait=0;g.request(g.enemy,action);const first=g.enemy.attack;
 for(let n=0;n<250&&g.enemy.attack===first;n++)g.step(DT,{},true);
 assert.equal(g.enemy.attack,null,'the original action must complete');const endedAt=g.elapsed;g.player.x=g.enemy.x-110;
 for(let n=0;n<Math.floor(minGap/DT);n++){g.step(DT,{},true);assert.equal(g.enemy.attack,null,`no follow-up at ${(g.elapsed-endedAt).toFixed(3)}s`);}
 for(let n=0;n<240&&!g.enemy.attack;n++)g.step(DT,{},true);
 assert.ok(g.enemy.attack,'AI eventually resumes attacking');
});

for(const difficulty of ['normal','easy'])test(`${difficulty} starts a fresh gap when its action is interrupted and does not refund cooldown`,()=>{
 const g=close('wang',difficulty,'han',()=>.9);g.aiWait=0;g.request(g.enemy,'special2');tick(g,.80);
 const cd=g.enemy.cooldowns[1];g.damage(g.player,g.enemy,6);g.player.x=g.enemy.x-110;const endedAt=g.elapsed;
 while(g.elapsed-endedAt<.20-DT/2){g.step(DT,{},true);assert.equal(g.enemy.attack,null);}
 assert.equal(g.enemy.hp,94);assert.ok(g.enemy.cooldowns[1]<cd&&g.enemy.cooldowns[1]>4);
 assert.ok(g.elapsed-endedAt>=.20-DT/2);
});

// Break caught: paused/frozen render frames let perception or recovery timers
// elapse even though the simulation has not advanced.
test('pause and hitstop do not burn the pending observation delay',()=>{
 const g=close();g.press('special2');tick(g,.15);const at=g.elapsed;
 g.status='paused';tick(g,2);assert.equal(g.elapsed,at);g.status='active';g.freeze=.5;tick(g,.4);assert.equal(g.elapsed,at);
 g.freeze=0;tick(g,.05);assert.equal(reacting(g),false);tick(g,.06);assert.equal(g.enemy.guard,true);
});

for(const [difficulty,quietUntil,respondBy] of [['normal',.35,.39],['easy',.73,.79]])test(`${difficulty} honors the long end of the sampled first-observation delay`,()=>{
 let rolls=0;const g=close('su',difficulty,'han',()=>rolls++===0?.999999:0);g.press('special3');quiet(g,quietUntil);tick(g,respondBy-quietUntil);assert.equal(g.enemy.guard,true);
});

test('an old cast newly entering observation cannot reuse its total animation age as reaction time',()=>{
 const g=close();g.press('special2');tick(g,.43,false);quiet(g,.12);
});

test('a threat leaving perception range and returning must be observed again',()=>{
 const g=close('su','normal','han');g.press('special3');quiet(g,.20);g.player.x=68;g.step(DT,{},true);g.player.x=g.enemy.x-110;quiet(g,.14);tick(g,.04);assert.equal(g.enemy.guard,true);
});

test('round restart cannot inherit a completed observation deadline or a recovery gap',()=>{
 const old=close('su','normal','han');old.press('special3');tick(old,.28);assert.equal(old.enemy.guard,true);
 const fresh=close('su','normal','han');fresh.press('special3');quiet(fresh,.20);tick(fresh,.06);assert.equal(fresh.enemy.guard,true);
 const attack=close('wang','normal','han',()=>.9);attack.aiWait=0;attack.step(DT,{},true);assert.equal(attack.enemy.attack?.kind,'punch');
});

// Real reject consumption ends its owner's action without applying hitstun.
// Break caught: a recovery gap is tracked only for normal animation completion.
for(const difficulty of ['normal','easy'])test(`${difficulty} leaves a recovery opening after its rejection stance is consumed`,()=>{
 const g=close('wang',difficulty,'huang',()=>.9);g.request(g.enemy,'special2');tick(g,.16);g.aiWait=0;g.press('punch');
 for(let n=0;n<30&&!g.events.some(e=>e.type==='reject');n++)g.step(DT,{},true);
 assert.ok(g.events.some(e=>e.type==='reject'));assert.equal(g.enemy.stun,0);assert.equal(g.enemy.attack,null);for(let n=0;n<15;n++){g.step(DT,{},true);assert.equal(g.enemy.attack,null);}
});

test('an AI recovery guard can be punished by a player grab',()=>{
 const g=close('ma','normal','han',()=>.9);g.aiWait=0;g.enemy.x=650;g.request(g.enemy,'punch');
 for(let n=0;n<60&&g.enemy.attack;n++)g.step(DT,{},true);
 g.player.x=g.enemy.x-110;g.press('special1');tick(g,.35);
 assert.equal(g.enemy.hp,88);assert.ok(g.events.some(e=>e.type==='capture'));assert.equal(g.events.some(e=>e.type==='block'),false);
});

test('pause and hitstop preserve the full remaining post-action opening',()=>{
 const g=close('wang','normal','han',()=>.9);g.aiWait=0;g.request(g.enemy,'punch');
 for(let n=0;n<80&&g.enemy.attack;n++)g.step(DT,{},true);
 g.player.x=g.enemy.x-110;const endedAt=g.elapsed;g.status='paused';tick(g,2);g.status='active';g.freeze=.5;tick(g,.4);assert.equal(g.elapsed,endedAt);
 g.freeze=0;for(let n=0;n<24;n++){g.step(DT,{},true);assert.equal(g.enemy.attack,null);}tick(g,.04);assert.equal(g.enemy.attack?.kind,'punch');
});

// Break caught: treating attack recovery as a freeze also disables legal
// movement/guard and hands every close opponent a guaranteed free jab.
for(const difficulty of ['normal','easy'])test(`${difficulty} can retreat and guard during recovery while follow-up attacks wait`,()=>{
 const g=close('wang',difficulty,'han',()=>.9);g.aiWait=0;g.enemy.x=650;g.request(g.enemy,'punch');
 for(let n=0;n<60&&g.enemy.attack;n++)g.step(DT,{},true);
 g.player.x=g.enemy.x-110;const x=g.enemy.x;
 g.step(DT,{},true);assert.ok(g.enemy.x>x,'recovery must not freeze movement');assert.equal(g.enemy.guard,true);
 for(let n=0;n<12;n++){g.step(DT,{},true);assert.equal(g.enemy.attack,null);}
});

test('an actual block during recovery cannot make a buffered punch skip its remaining gap',()=>{
 const g=close('wang','normal','han',()=>.9);g.aiWait=0;g.request(g.enemy,'punch');
 for(let n=0;n<80&&g.enemy.attack;n++)g.step(DT,{},true);
 g.player.x=g.enemy.x-110;g.setGuard(g.enemy,true);g.damage(g.player,g.enemy,6);tick(g,.12);
 assert.equal(g.enemy.attack,null);assert.equal(g.enemy.guard,true);assert.equal(g.enemy.hp,98);
});

test('recovery retreat is the same with or without a fresh unseen opponent attack',()=>{
 const run=attack=>{const g=close('ma','normal','han',()=>.9);g.aiWait=0;g.request(g.enemy,'punch');for(let n=0;n<80&&g.enemy.attack;n++)g.step(DT,{},true);g.player.x=g.enemy.x-110;if(attack)g.press('special1');tick(g,.10);return{x:g.enemy.x,guard:g.enemy.guard,attack:g.enemy.attack?.kind,y:g.enemy.y};};
 assert.deepEqual(run(false),run(true));
});

test('recovery guard uses the same pips and can be broken then hit',()=>{
 const g=close('wang','normal','han',()=>.9);g.aiWait=0;g.enemy.x=650;g.request(g.enemy,'punch');
 for(let n=0;n<60&&g.enemy.attack;n++)g.step(DT,{},true);
 g.enemy.guardPips=1;g.player.x=g.enemy.x-110;g.press('punch');tick(g,.36);g.press('punch');tick(g,.16);
 assert.ok(g.events.some(e=>e.type==='guardBreak'&&e.f===g.enemy));assert.equal(g.enemy.hp,92);assert.ok(g.events.some(e=>e.type==='hit'&&e.to===g.enemy));
});

// P2 review regression: recovery direction updates must not erase a matured
// defense selected on the previous frame. This uses real attack/projectile
// lifecycles, not synthetic AI input or a manually assigned defense timer.
test('recovery retreat preserves a legitimately selected projectile crouch on the next frame',()=>{
 const g=new Duel('chen','normal',()=>0,'ma');g.player.x=400;g.enemy.x=560;g.aiWait=10;
 g.request(g.enemy,'special2');tick(g,.30);g.press('special1');
 for(let n=0;n<90&&!g.enemy.crouch;n++)g.step(DT,{},true);
 assert.equal(g.enemy.crouch,true);assert.ok(g.aiRecovery>DT);const blend=g.enemy.crouchBlend;
 assert.ok(g.elapsed>=.76,'the first-observation deadline must still elapse');
 g.step(DT,{},true);assert.equal(g.enemy.crouch,true);assert.ok(g.enemy.crouchBlend>blend,'lowering continues instead of restarting');assert.equal(g.enemy.attack,null);
});

test('explicit mature guard survives recovery retreat and the transition out of recovery',()=>{
 const g=new Duel('su','normal',()=>0,'ma');g.player.x=400;g.enemy.x=560;g.aiWait=10;
 g.request(g.enemy,'special2');tick(g,.56);g.press('special3');
 for(let n=0;n<90&&!(g.aiDefense>0&&g.aiInput.guard);n++)g.step(DT,{},true);
 assert.ok(g.aiRecovery>0);assert.ok(g.aiDefense>.25);assert.equal(g.enemy.guard,true);
 for(let n=0;n<30&&g.aiRecovery>0;n++){g.step(DT,{},true);assert.equal(g.enemy.guard,true);assert.equal(g.enemy.attack,null);}
 assert.equal(g.aiRecovery,0);assert.ok(g.aiDefense>0);assert.equal(g.enemy.guard,true,'explicit guard lasts beyond the movement-only recovery fallback');
});
