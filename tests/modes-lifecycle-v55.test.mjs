import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterBaseStats} from '../dist/fighter-attributes.mjs';
import {gameHarness,flush} from './helpers/game-harness.mjs';
function countdown(h){while(h.timers.size){const [id,fn]=h.timers.entries().next().value;h.timers.delete(id);fn();}}
function press(h,id){const b=h.$(id);b.handlers.pointerdown({pointerId:7});b.onclick({detail:1,pointerId:7});}
function finish(h,winner){const d=h.ui.duel;d.winner=winner;d.status='over';h.ui.result();return d;}
async function menu(){const h=await gameHarness();h.ui.showMenu();h.ui.setScene({});return h;}

test('fresh next round preserves score but replaces HP, rally, assist, cooldowns and stats',async()=>{
 const h=await menu();h.$('#format-series').onclick();h.ui.startGame();countdown(h);
 const first=h.ui.duel;first.player.hp=12;first.enemy.hp=0;first.player.rally=90;first.player.assist.used=true;first.stats.damage=78;first.player.cooldowns[0]=3;
 finish(h,'player');assert.equal(h.ui.series.score.player,1);assert.equal(h.$('#next-round').hidden,false);assert.equal(h.$('#replay').hidden,true);
 h.$('#next-round').onclick({detail:1,pointerId:7});assert.equal(h.ui.duel,first,'old release cannot advance');
 press(h,'#next-round');const second=h.ui.duel;assert.notEqual(second,first);assert.equal(h.ui.series.score.player,1);assert.equal(h.ui.series.round,2);assert.equal(second.status,'countdown');
 assert.equal(second.player.hp,fighterBaseStats('wang').maxHp);assert.equal(second.enemy.hp,fighterBaseStats('han').maxHp);assert.equal(second.player.hp,95);assert.equal(second.enemy.hp,105);assert.equal(second.player.rally,0);assert.equal(second.player.assist.used,false);assert.equal(second.stats.damage,0);assert.deepEqual([...second.player.cooldowns],[0,0,0]);
 h.$('#next-round').handlers.pointerdown({pointerId:8});h.$('#next-round').onclick({detail:1,pointerId:8});assert.equal(h.ui.duel,second,'double click cannot replace countdown');
 countdown(h);finish(h,'enemy');press(h,'#next-round');countdown(h);finish(h,'player');
 assert.equal(h.ui.series.score.player,2);assert.equal(h.ui.series.score.enemy,1);assert.equal(h.$('#next-round').hidden,true);assert.equal(h.$('#replay').hidden,false);
 press(h,'#replay');assert.equal(h.ui.series.score.player,0);assert.equal(h.ui.series.round,1);assert.equal(h.ui.duel.status,'countdown');
});
test('draw replay does not award points or advance small-round number; leaving clears series',async()=>{
 const h=await menu();h.$('#format-series').onclick();h.ui.startGame();countdown(h);finish(h,'draw');
 assert.equal(h.ui.series.score.player+h.ui.series.score.enemy,0);assert.match(h.$('#next-round').textContent,/平手/);
 press(h,'#next-round');assert.equal(h.ui.series.round,1);countdown(h);finish(h,'player');press(h,'#reselect');
 assert.equal(h.ui.series,null);assert.equal(h.ui.duel.status,'menu');assert.equal(h.timers.size,0);
 h.ui.startGame();assert.equal(h.ui.series.score.player,0);h.ui.showTitle();assert.equal(h.ui.series,null);assert.equal(h.timers.size,0);
});
test('single round retains common fresh replay and a fresh draw replay',async()=>{
 const h=await menu();h.ui.startGame();countdown(h);const first=finish(h,'enemy');
 assert.equal(h.$('#next-round').hidden,true);assert.equal(h.$('#replay').hidden,false);press(h,'#replay');assert.notEqual(h.ui.duel,first);assert.equal(h.ui.series.target,1);
 countdown(h);finish(h,'draw');assert.equal(h.$('#next-round').hidden,false);assert.equal(h.$('#replay').hidden,true);
});
test('four roster targets are independent and permit all mirror combinations',async()=>{
 const h=await menu();h.$('[data-roster-target="playerAssist"]').onclick();h.$('#roster-ko').onclick();
 assert.equal(h.ui.duel.player.type,'wang');assert.equal(h.ui.duel.enemy.type,'han');assert.equal(h.ui.duel.player.assist.helper,'ko');
 h.$('[data-roster-target="enemyAssist"]').onclick();h.$('#roster-ko').onclick();assert.equal(h.ui.duel.enemy.assist.helper,'ko');
 h.$('[data-roster-target="player"]').onclick();h.$('#roster-ko').onclick();assert.equal(h.ui.duel.player.type,'ko');assert.equal(h.ui.duel.player.assist.helper,'ko');
 assert.match(h.$('#roster-ko').getAttribute('aria-label'),/你、我方助拳、對手助拳/);
 h.ui.startGame();countdown(h);const d=h.ui.duel;h.$('[data-roster-target="enemyAssist"]').onclick();h.$('#roster-ma').onclick();assert.equal(h.ui.duel,d);assert.equal(d.enemy.assist.helper,'ko');
});
test('training starts infinite, allows paused behavior changes, and requires a fresh restart',async()=>{
 const h=await menu();h.$('#mode-training').onclick();h.$('#training-behavior').onchange({target:{value:'guard'}});h.ui.startGame();countdown(h);
 const d=h.ui.duel;assert.equal(h.ui.gameMode,'training');assert.equal(h.ui.series,null);assert.equal(d.training.enabled,true);assert.equal(d.training.opponent,'guard');assert.equal(d.training.infiniteHealth,true);assert.equal(d.training.repeatAssist,true);
 h.ui.pauseGame();assert.equal(h.$('#training-pause-options').hidden,false);h.$('#training-live-behavior').value='ai';h.$('#training-infinite').checked=false;h.$('#training-repeat').checked=false;h.$('#training-live-behavior').onchange();
 assert.equal(d.training.opponent,'ai');assert.equal(d.training.infiniteHealth,false);assert.equal(d.training.repeatAssist,false);
 h.$('#training-restart').onclick({detail:1,pointerId:7});assert.equal(h.ui.duel,d);
 h.$('#training-restart').handlers.keydown({code:'Space',repeat:true});h.$('#training-restart').onclick({detail:0});assert.equal(h.ui.duel,d);
 press(h,'#training-restart');assert.notEqual(h.ui.duel,d);assert.equal(h.ui.duel.status,'countdown');assert.equal(h.ui.duel.training.opponent,'ai');assert.equal(h.ui.duel.player.hp,fighterBaseStats('wang').maxHp);assert.equal(h.ui.duel.player.hp,95);
 countdown(h);h.ui.pauseGame();h.$('#leave').onclick();assert.equal(h.ui.duel.status,'paused');h.$('#home-select').handlers.pointerdown({pointerId:7});h.$('#home-select').onclick({detail:1,pointerId:7});assert.equal(h.ui.duel.status,'menu');assert.equal(h.timers.size,0);h.$('#mode-battle').onclick();h.ui.startGame();assert.equal(h.ui.duel.training.enabled,false);
});
test('H triggers assist, L remains rally, and helper speech never impersonates a main fighter',async()=>{
 const h=await menu();h.ui.startGame();countdown(h);const d=h.ui.duel;
 const key=(code,repeat=false)=>h.window.handlers.keydown({code,repeat,target:h.$('#game'),preventDefault(){}});
 key('KeyH');assert.equal(d.assists.length,1);assert.equal(d.player.assist.used,true);assert.equal(d.player.rally,0);key('KeyH',true);assert.equal(d.assists.length,1);
 d.player.rally=100;key('KeyL');assert.equal(d.rallies.length,1);
 const playerPlays=h.$('#move-voice').plays.length,enemyPlays=h.$('#han-voice').plays.length;
 h.ui.Arena.prototype.event.call({},{type:'move',f:d.assists[0].actor,kind:'ma_handshake',assist:true,helper:'ma'});await flush();assert.equal(h.$('#move-voice').plays.length,playerPlays);assert.equal(h.$('#han-voice').plays.length,enemyPlays);
});
test('series title names the actual winning fighter and disambiguates mirror teams',async()=>{
 for(const winner of ['player','enemy'])for(const mirror of [false,true]){
  const h=await menu();if(mirror){h.$('#opponent-card').onclick();h.$('#roster-wang').onclick();}
  h.$('#format-series').onclick();h.ui.startGame();countdown(h);finish(h,winner);press(h,'#next-round');countdown(h);finish(h,winner);
  const title=h.$('#result-title').textContent;assert.match(title,winner==='player'||mirror?/恰吉王/:/韓國魚/);assert.match(title,/拿下這場對戰/);if(mirror)assert.match(title,winner==='player'?/（玩家）/:/（AI）/);assert.ok(h.$('#result-sub').textContent.length>0,'humorous subtitle remains');
 }
});
