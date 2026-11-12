import test from 'node:test';
import assert from 'node:assert/strict';
import {gameHarness,flush} from './helpers/game-harness.mjs';

async function setup(reducedMotion=false){const h=await gameHarness();h.ui.setScene({reducedMotion,artTime:6000,cameraView:{x:480,y:270,zoom:1,width:960,height:540},textPool:[]});h.ui.startGame();while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}return h;}
function finish(h){const d=h.ui.duel;d.player.x=420;d.enemy.x=510;d.enemy.hp=1;d.damage(d.player,d.enemy,8,0);for(const e of d.events.splice(0))if(e.type==='over')h.ui.Arena.prototype.event.call({},e);}
function advance(h,ms){for(let t=0;t<ms;t+=20)h.ui.updateMatchFinish(Math.min(20,ms-t));}
const key=(h,code,repeat=false)=>h.window.handlers.keydown({code,repeat,target:h.$('#game'),preventDefault(){}});

test('over event clears held attack/buffer, preserves active speech and delays result until final beat',async()=>{
 const h=await setup();key(h,'KeyJ');h.ui.duel.buffer={action:'punch',ttl:.15};await h.ui.playConfiguredVoice('coin',false,h.ui.duel.enemy);await flush();assert.equal(h.ui.hold.punch,true);finish(h);
 assert.equal(h.ui.duel.status,'over');assert.equal(h.ui.duel.buffer,null);assert.equal(Object.keys(h.ui.hold).length,0);assert.equal(h.$('#han-voice').playing,true);assert.equal(h.$('#result').classList.contains('hidden'),true);assert.equal(h.$('#match-finish').dataset.phase,'freeze');assert.equal(h.$('#settings-music-status').dataset.track,'battle');assert.equal(h.$('#pause').disabled,true);assert.equal(h.timers.size,0);
 advance(h,140);assert.equal(h.$('#match-finish').dataset.phase,'slow');advance(h,1800);assert.equal(h.$('#match-finish').dataset.phase,'announce');assert.match(h.$('#finish-winner').textContent,/恰吉王.*獲勝/);assert.equal(h.$('#result').classList.contains('hidden'),true);advance(h,700);assert.equal(h.ui.matchFinish,null);assert.equal(h.$('#result').classList.contains('hidden'),false);assert.equal(h.$('#settings-music-status').dataset.track,'menu');assert.equal(h.$('#han-voice').playing,true);h.$('#han-voice').emit('ended');assert.equal(h.$('#han-voice').playing,false);
 const duel=h.ui.duel;key(h,'KeyJ',true);h.$('#replay').onclick({detail:1,pointerId:8});assert.equal(h.ui.duel,duel);h.$('#replay').handlers.pointerdown({pointerId:9});h.$('#replay').onclick({detail:1,pointerId:9});assert.notEqual(h.ui.duel,duel);assert.equal(h.ui.duel.status,'countdown');assert.equal(Object.keys(h.ui.hold).length,0);
});
test('pause, background, home, menu and replay cannot leave stale result callbacks',async()=>{
 for(const leave of ['showTitle','showMenu','startGame']){const h=await setup();finish(h);advance(h,400);h.ui.pauseGame();assert.equal(h.ui.duel.status,'over');h.window.handlers.blur();advance(h,2000);assert.equal(h.ui.matchFinish.elapsed,400);h.window.handlers.focus();advance(h,100);assert.equal(h.ui.matchFinish.elapsed,500);h.ui[leave]();const duel=h.ui.duel;advance(h,4000);assert.equal(h.ui.matchFinish,null);assert.equal(h.ui.duel,duel);assert.equal(h.$('#match-finish').classList.contains('hidden'),true);assert.notEqual(h.ui.duel.status,'over');}
 const h=await setup();finish(h);h.document.hidden=true;h.document.handlers.visibilitychange();advance(h,2000);assert.equal(h.ui.matchFinish.elapsed,0);h.document.hidden=false;h.document.handlers.visibilitychange();advance(h,2640);assert.equal(h.ui.matchFinish,null);assert.equal(h.ui.duel.status,'over');
});
test('reduced motion is a short named-text finish without a slow animated phase',async()=>{const h=await setup(true);finish(h);assert.equal(h.$('#match-finish').dataset.phase,'announce');assert.equal(h.$('#match-finish').dataset.reduced,'true');advance(h,640);assert.ok(h.ui.matchFinish);advance(h,10);assert.equal(h.ui.matchFinish,null);});
test('a fresh keyboard press on the result, never a held repeat, can replay',async()=>{const h=await setup();finish(h);advance(h,2640);const button=h.$('#replay'),old=h.ui.duel;button.handlers.keydown({code:'Space',repeat:true});button.onclick({detail:0});assert.equal(h.ui.duel,old);button.handlers.keydown({code:'Enter',repeat:false});button.onclick({detail:0});assert.notEqual(h.ui.duel,old);});
