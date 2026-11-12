import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,GROUND} from '../dist/core.mjs';
import {createFinishSequence,finishBeat,finishFighterView,FinishPressGate} from '../dist/match-finish.mjs';

function knockOut(){const d=new Duel('wang','easy',()=>.3,'han');d.player.x=420;d.enemy.x=510;d.enemy.hp=1;d.player.attack={kind:'punch',age:.13,variant:'right',castId:42};d.buffer={action:'special1',ttl:.15};d.damage(d.player,d.enemy,8,0);return d;}
test('real lethal hit locks the winner, snapshots the final pose, and clears combat input',()=>{
 const d=knockOut();assert.equal(d.status,'over');assert.equal(d.winner,'player');assert.equal(d.buffer,null);assert.equal(d.finishSnapshot.reason,'ko');assert.equal(d.finishSnapshot.fighters[0].attack.kind,'punch');assert.equal(d.player.attack,null);
 const before=JSON.stringify({hp:[d.player.hp,d.enemy.hp],stats:d.stats,remaining:d.remaining,winner:d.winner});for(let i=0;i<180;i++){d.press('punch');d.step(1/60,{punch:true});}assert.equal(JSON.stringify({hp:[d.player.hp,d.enemy.hp],stats:d.stats,remaining:d.remaining,winner:d.winner}),before);
 assert.equal(d.events.filter(e=>e.type==='over').length,1);
});
test('finish is a short freeze, 1.8 second visual slow motion, named announcement, then result',()=>{
 const d=knockOut(),seq=createFinishSequence(d,{artTime:5000});const a=finishBeat(seq,0),b=finishBeat(seq,139),c=finishBeat(seq,1040),e=finishBeat(seq,1940),f=finishBeat(seq,2640);
 assert.equal(a.phase,'freeze');assert.equal(a.artTime,b.artTime);assert.equal(c.phase,'slow');assert.equal(c.artTime,5250);assert.equal(e.phase,'announce');assert.equal(f.done,true);assert.match(seq.title,/恰吉王.*獲勝/);
 const loser=finishFighterView(seq,1,c),winner=finishFighterView(seq,0,c);assert.notEqual(loser.rotation,0);assert.ok(loser.fighter.crouchBlend>0);assert.equal(winner.role,'winner');assert.equal(winner.fighter.hp,d.player.hp);assert.equal(d.enemy.y,GROUND);
});
test('timeout and draw outcomes stay faithful, and timeouts do not fake a KO',()=>{
 for(const [a,b,w]of [[70,30,'player'],[30,70,'enemy'],[47.5,52.5,'draw']]){const d=new Duel();d.player.hp=a;d.enemy.hp=b;d.remaining=.001;d.step(.016,{},false);assert.equal(d.winner,w);const seq=createFinishSequence(d);assert.equal(seq.reason,'timeout');assert.match(seq.cue,/時間到/);const v=finishFighterView(seq,w==='player'?1:0,finishBeat(seq,900));assert.ok(Math.abs(v.rotation)<.13);if(w==='draw')assert.match(seq.title,/平手/);}
 const d=new Duel();d.player.hp=0;d.enemy.hp=0;d.finish();const seq=createFinishSequence(d);assert.equal(seq.reason,'double-ko');assert.equal(seq.winner,'draw');assert.match(seq.cue,/雙方倒下/);assert.equal(finishFighterView(seq,0,finishBeat(seq,900)).role,'defeated');assert.equal(finishFighterView(seq,1,finishBeat(seq,900)).role,'defeated');
});
test('reduced motion is static and text-only, with a shorter bounded duration',()=>{
 const seq=createFinishSequence(knockOut(),{reducedMotion:true,artTime:100});for(const age of [0,100,649]){const b=finishBeat(seq,age);assert.equal(b.phase,'announce');assert.equal(b.artTime,100);const v=finishFighterView(seq,1,b);assert.equal(v.rotation,0);assert.equal(v.fighter.flash,0);assert.equal(v.fighter.y,seq.fighters[1].y);}assert.equal(finishBeat(seq,650).done,true);
});
test('old held input cannot activate result; a fresh press is needed after result becomes ready',()=>{
 const gate=new FinishPressGate();gate.pointerDown(7);gate.keyDown('Space',false);gate.arm();assert.equal(gate.click({detail:1,pointerId:7}),false);assert.equal(gate.click({detail:0}),false);gate.keyDown('Space',true);assert.equal(gate.click({detail:0}),false);gate.pointerDown(8);assert.equal(gate.click({detail:1,pointerId:8}),true);assert.equal(gate.click({detail:1,pointerId:8}),false);gate.keyDown('Enter',false);assert.equal(gate.click({detail:0}),true);gate.cancel();gate.pointerDown(9);assert.equal(gate.click({detail:1,pointerId:9}),false);
});

test('trusted assistive activation is accepted without a fake pointer, while held keyboard activation stays blocked',()=>{const gate=new FinishPressGate();gate.arm();assert.equal(gate.click({detail:0,isTrusted:true}),true);gate.keyDown('Space',true);assert.equal(gate.click({detail:0,isTrusted:true}),false);assert.equal(gate.click({detail:0,isTrusted:false}),false);gate.pointerDown(3);assert.equal(gate.click({detail:1,pointerId:4,isTrusted:true}),false);});
