// Explicit neutral stats isolate historical move/timing rules; real defaults have separate mode coverage.
import {loadGameImports} from './helpers/game-imports.mjs';
const gameImports=await loadGameImports();
import {createProfileProgress,createFiveTapGate,PROFILE_IDS} from '../dist/profile-progress.mjs';
import {allUnlockedStorage} from './helpers/profile-fixtures.mjs';
import {MatchSeries,DIFFICULTY_LABELS,ROSTER_TARGETS,rosterTargetName} from '../dist/match-modes.mjs';
import {FinishPressGate} from '../dist/match-finish.mjs';
import {mountTitleScreen} from '../dist/title-screen.mjs';
import {mountBattleGestures} from '../dist/battle-gestures.mjs';
import {mountPageZoomGuard,bindPageZoomPreference} from '../dist/page-zoom-gestures.mjs';
import {createBackgroundMusic} from '../dist/background-music.mjs';
import {createSettingsStore} from '../dist/settings-state.mjs';
import {bindTouchControls} from '../dist/touch-controls.mjs';
import {VoiceChannels} from '../dist/voice-channels.mjs';
import {renderCooldownButton} from '../dist/cooldown-view.mjs';
import {VoiceCueQueue} from '../dist/voice-cues.mjs';
import {playableVoice} from '../dist/voice-slots.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel,GROUND} from './helpers/neutral-combat.mjs';

const tick=(duel,seconds,input={})=>{for(let elapsed=0;elapsed<seconds-1e-8;elapsed+=1/120)duel.step(Math.min(1/120,seconds-elapsed),input,false);};

test('held crouch plants the foot root and suppresses voluntary movement until released',async()=>{
 const g=new Duel(),x=g.player.x;
 g.step(1/120,{crouch:true,right:true},false);
 assert.equal(g.player.crouch,true);
 assert.equal(g.player.move,0);
 assert.equal(g.player.x,x);
 assert.equal(g.player.y,GROUND);
 assert.ok(g.player.crouchBlend>0&&g.player.crouchBlend<1);
 tick(g,.15,{crouch:true,right:true});
 assert.equal(g.player.crouchBlend,1);
 assert.equal(g.player.x,x);
 g.step(1/120,{right:true},false);
 assert.equal(g.player.crouch,false);
 assert.ok(g.player.crouchBlend>0&&g.player.crouchBlend<1);
 assert.ok(g.player.x>x);
 tick(g,.15);
 assert.equal(g.player.crouchBlend,0);
});

test('back plus crouch guards using raw directions without sliding or bypassing attack restrictions',async()=>{
 for(const side of ['left','right']){
  const g=new Duel();g.enemy.x=side==='left'?500:100;
  const x=g.player.x;
  g.step(1/60,{crouch:true,[side]:true},false);
  assert.equal(g.player.guard,true);
  assert.equal(g.player.crouch,true);
  assert.equal(g.player.x,x);
  assert.equal(g.press('punch'),false);
  assert.equal(g.player.attack,null);
  assert.equal(g.player.crouch,true);
  g.step(1/60,{crouch:true,left:true,right:true},false);
  assert.equal(g.player.guard,false);
  assert.equal(g.player.move,0);
 }
});

test('successful jump exits crouch, stays standing in the air, then holding down crouches again',async()=>{
 const g=new Duel();g.player.x=100;tick(g,.15,{crouch:true});
 assert.equal(g.press('jump'),true);
 assert.equal(g.player.crouch,false);
 g.step(1/120,{crouch:true},false);
 assert.ok(g.player.y<GROUND);
 assert.equal(g.player.crouch,false);
 tick(g,.4,{crouch:true});
 assert.equal(g.player.crouch,false);
 tick(g,.85,{crouch:true});
 assert.equal(g.player.y,GROUND);
 assert.equal(g.player.crouch,true);
});

test('landing reports a short visual countdown without moving the foot root',async()=>{
 const g=new Duel();g.player.x=100;g.press('jump');
 let landed=false;
 for(let i=0;i<150;i++){
  const airborne=g.player.y<GROUND;
  g.step(1/120,{},false);
  if(airborne&&g.player.y===GROUND){landed=true;break;}
 }
 assert.equal(landed,true);
 assert.ok(g.player.land>0&&g.player.land<=.18);
 const remaining=g.player.land;
 g.step(1/120,{},false);
 assert.ok(g.player.land<remaining);
 assert.equal(g.player.y,GROUND);
 tick(g,.2);
 assert.equal(g.player.land,0);
});

test('basic and special attacks exit crouch and cannot be cancelled by holding down',async()=>{
 for(const character of ['wang','han'])for(const action of ['punch','special1','special2','special3']){
  const g=new Duel(character);tick(g,.15,{crouch:true});
  assert.equal(g.press(action),true);
  assert.equal(g.player.crouch,false);
  const attack=g.player.attack;
  g.step(.034,{crouch:true},false);
  assert.equal(g.player.attack,attack);
  assert.equal(g.player.crouch,false);
  tick(g,1.4,{crouch:true});
  assert.equal(g.player.crouch,true);
  if(action!=='punch')assert.ok(g.player.cooldowns[Number(action.at(-1))-1]>0);
 }
});

test('crouch cannot clear stun or shorten its remaining duration',async()=>{
 const g=new Duel();g.player.x=100;tick(g,.15,{crouch:true});
 g.damage(g.enemy,g.player,6);
 assert.equal(g.player.crouch,false);
 g.freeze=0;const stun=g.player.stun;
 g.step(1/120,{crouch:true},false);
 assert.equal(g.player.crouch,false);
 assert.ok(g.player.stun>0);
 assert.equal(g.player.stun,stun-1/120);
 assert.equal(g.press('punch'),false);
 tick(g,.3,{crouch:true});
 assert.equal(g.player.crouch,true);
});

test('holding crouch preserves the 0.15-second input buffer and late basic-to-special cancel window',async()=>{
 const g=new Duel();g.press('punch');tick(g,.1,{crouch:true});
 assert.equal(g.press('special1'),false);
 assert.equal(g.buffer.ttl,.15);
 tick(g,.13,{crouch:true});
 assert.equal(g.player.attack.kind,'rush');
 assert.equal(g.player.crouch,false);
 assert.equal(g.buffer,null);
 const missed=new Duel();missed.press('special1');
 assert.equal(missed.press('punch'),false);
 tick(missed,.2,{crouch:true});
 assert.equal(missed.buffer,null);
 assert.equal(missed.player.attack.kind,'rush');
});

test('each fighter cycles only accepted basic attacks and restarts after an idle gap',async()=>{
 for(const character of ['wang','han'])for(const who of ['player','enemy']){
  const g=new Duel(character),f=g[who];
  for(const variant of ['left','right','kick','left']){
   assert.equal(g.request(f,'punch'),true);
   assert.equal(f.attack.kind,'punch');
   assert.equal(f.attack.variant,variant);
   assert.equal(g.request(f,'punch'),false);
   tick(g,.6);
  }
  tick(g,1.2);
  assert.equal(g.request(f,'punch'),true);
  assert.equal(f.attack.variant,'left');
 }
});

test('all three cosmetic variants keep basic damage, reach and timing',async()=>{
 for(let index=0;index<3;index++){
  const g=new Duel();
  for(let earlier=0;earlier<index;earlier++){g.press('punch');tick(g,.34);}
  g.enemy.x=g.player.x+110;
  g.press('punch');
  assert.equal(g.player.attack.variant,['left','right','kick'][index]);
  tick(g,.1);assert.equal(g.enemy.hp,100);
  tick(g,.01);assert.equal(g.enemy.hp,94);
  g.freeze=0;
  tick(g,.20);assert.notEqual(g.player.attack,null);
  tick(g,.02);assert.equal(g.player.attack,null);
  assert.equal(g.enemy.hp,94);
 }
});

test('V13 crouch ducks high coin, while mid punch and ground arrow retain their hits',async()=>{
 for(const kind of ['punch','coin','arrow'])for(const crouch of [false,true]){
  const g=new Duel('wang','normal');g.enemy.x=g.player.x+(kind==='punch'?110:380);
  if(crouch)tick(g,.15,{crouch:true});
  g.request(g.enemy,kind==='punch'?'punch':kind==='coin'?'special1':'special3');
  tick(g,kind==='punch'?.7:2,{crouch});
  assert.equal(g.player.hp,kind==='coin'&&crouch?100:{punch:94,coin:89,arrow:80}[kind]);
 }
});

test('back plus crouch keeps the existing reduced guard damage',async()=>{
 const g=new Duel('wang','normal');g.enemy.x=370;
 tick(g,.15,{left:true,crouch:true});
 g.request(g.enemy,'punch');tick(g,.7,{left:true,crouch:true});
 assert.equal(g.player.hp,98);
 assert.equal(g.stats.blocks,1);
});

// Exercise the real game input handlers with the browser boundary replaced;
// the Phaser renderer is intentionally not started by these control tests.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CAST} from './helpers/neutral-combat.mjs';
const controlHarness=async()=>{
 const element=(dataset={})=>{
  const handlers={},classes=new Set(),children=new Map();
  return {style:{setProperty(k,v){this[k]=v;}},querySelector(k){if(!children.has(k))children.set(k,element());return children.get(k);},dataset,handlers,tagName:'BUTTON',classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},addEventListener(n,fn){(handlers[n]??=[]).push(fn);},emit(n,props={}){for(const fn of handlers[n]||[])fn({preventDefault(){},target:this,...props});},closest(){return null;},setPointerCapture(){},setAttribute(){},pause(){},focus(){}};
 };
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const buttons=[...html.matchAll(/<button[^>]*data-(hold|action)="([^"]+)"[^>]*>/g)].map(m=>element({[m[1]]:m[2]}));
 const ids=new Map(),window=element(),document=element();document.documentElement=element();document.body=element();
 document.querySelector=selector=>{if(!ids.has(selector))ids.set(selector,element());return ids.get(selector);};
 document.querySelectorAll=selector=>selector==='[data-hold],[data-action]'?buttons:selector==='.held'?buttons.filter(b=>b.classList.contains('held')):[];
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
 window.localStorage=allUnlockedStorage(window.localStorage);
 const context={...gameImports,createProfileProgress,createFiveTapGate,PROFILE_IDS,MatchSeries,DIFFICULTY_LABELS,ROSTER_TARGETS,rosterTargetName,FinishPressGate,mountTitleScreen,mountBattleGestures,mountPageZoomGuard,bindPageZoomPreference,createBackgroundMusic,createSettingsStore,bindTouchControls,document,window,Duel,CAST,GROUND,VoiceCueQueue,VoiceChannels,renderCooldownButton,playableVoice,console,clearTimeout,setTimeout,Phaser:{Scene:class{},Game:class{},Scale:{RESIZE:0,NO_CENTER:0}}};
 await vm.runInNewContext('(async()=>{'+source+'\nglobalThis.controls={get duel(){return duel;},get hold(){return hold;},start(){started=true;duel.status="active";},clearHold,pauseGame,resumeGame};})();',context);
 context.controls.start();
 return {...context,buttons,key:(type,code)=>window.emit(type,{code,repeat:false})};
};

test('S and down-arrow are held inputs and releasing either alias preserves the other',async()=>{
 const h=await controlHarness();
 h.key('keydown','KeyS');h.key('keydown','ArrowDown');
 h.controls.duel.step(1/60,h.controls.hold,false);
 assert.equal(h.controls.duel.player.crouch,true);
 h.key('keyup','KeyS');h.controls.duel.step(1/60,h.controls.hold,false);
 assert.equal(h.controls.duel.player.crouch,true);
 h.key('keyup','ArrowDown');h.controls.duel.step(1/60,h.controls.hold,false);
 assert.equal(h.controls.duel.player.crouch,false);
});

test('held touch crouch releases on pointer cancel and lost capture',async()=>{
 for(const ending of ['pointerup','pointercancel','lostpointercapture']){
  const h=await controlHarness(),button=h.buttons.find(b=>b.dataset.hold==='crouch');
  assert.ok(button,'a held touch crouch control is available');
  button.emit('pointerdown',{pointerId:1});h.controls.duel.step(1/60,h.controls.hold,false);
  assert.equal(h.controls.duel.player.crouch,true);
  button.emit(ending,{pointerId:1});h.controls.duel.step(1/60,h.controls.hold,false);
  assert.equal(h.controls.duel.player.crouch,false);
 }
});

test('pause and blur clear active crouch, and keys pressed while paused do not rearm it',async()=>{
 for(const stop of ['pause','blur','clear']){
  const h=await controlHarness();h.key('keydown','KeyS');
  h.controls.duel.step(.034,h.controls.hold,false);
  assert.equal(h.controls.duel.player.crouch,true);
  if(stop==='pause')h.controls.pauseGame();else if(stop==='blur')h.window.emit('blur');else h.controls.clearHold();
  assert.equal(h.controls.duel.player.crouch,false);
  assert.equal(h.controls.duel.player.crouchBlend,0);
  assert.equal(!!h.controls.hold.crouch,false);
  if(stop!=='clear'){
   h.key('keydown','ArrowDown');h.controls.resumeGame();
   h.controls.duel.step(1/60,h.controls.hold,false);
   assert.equal(h.controls.duel.player.crouch,false);
  }
 }
});
