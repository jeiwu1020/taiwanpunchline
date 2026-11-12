import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import {loadGameImports} from './helpers/game-imports.mjs';
const gameImports=await loadGameImports();
import {createProfileProgress,createFiveTapGate,PROFILE_IDS} from '../dist/profile-progress.mjs';
import {allUnlockedStorage} from './helpers/profile-fixtures.mjs';
import {MatchSeries,DIFFICULTY_LABELS,ROSTER_TARGETS,rosterTargetName} from '../dist/match-modes.mjs';
import {FinishPressGate} from '../dist/match-finish.mjs';
import {moveCaption,captionPosition} from '../dist/move-readability.mjs';
import {mountTitleScreen} from '../dist/title-screen.mjs';
import {mountBattleGestures} from '../dist/battle-gestures.mjs';
import {mountPageZoomGuard,bindPageZoomPreference} from '../dist/page-zoom-gestures.mjs';
import {createBackgroundMusic} from '../dist/background-music.mjs';
import {createSettingsStore} from '../dist/settings-state.mjs';
import {bindTouchControls} from '../dist/touch-controls.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {MOVE_READABILITY,impactY,moveCue} from '../dist/combat-view.mjs';
import {VoiceChannels} from '../dist/voice-channels.mjs';
import {renderCooldownButton} from '../dist/cooldown-view.mjs';
import {VoiceCueQueue} from '../dist/voice-cues.mjs';
import {playableVoice}from'../dist/voice-slots.mjs';
import {fighterBaseStats} from '../dist/fighter-attributes.mjs';
import {Duel,CAST,GROUND} from '../dist/core.mjs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const gameSource=()=>readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
async function harness(){
 const element=(dataset={})=>{
  const children=new Map(),classes=new Set(),attributes=new Map();
  return {dataset,tagName:'BUTTON',style:{setProperty(key,value){this[key]=value;}},replaceChildren(...nodes){this.children=nodes;},append(node){this.children??=[];this.children.push(node);},value:'easy',textContent:'',innerHTML:'',handlers:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},querySelector(key){if(!children.has(key))children.set(key,element());return children.get(key);},setAttribute:(k,v)=>attributes.set(k,v),getAttribute:k=>attributes.get(k),addEventListener(name,fn){this.handlers[name]=fn;},pause(){},play(){return Promise.resolve();},focus(){},closest(){return null;}};
 };
 const elements=new Map(),window=element(),document=element();window.location={href:'https://roster-harness.test/'};document.documentElement=element();document.body=element();
 const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){}});
 window.AudioContext=class{constructor(){this.currentTime=0;this.destination={};}resume(){}createOscillator(){return{frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}createGain(){return{gain:param(),connect(){},disconnect(){}};}};
 document.querySelector=key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key);};
 document.querySelectorAll=()=>[];
 document.hasFocus=()=>true;
 const timers=new Map();let timerId=0;
 window.localStorage=allUnlockedStorage(window.localStorage);
 const context={...gameImports,URL,createProfileProgress,createFiveTapGate,PROFILE_IDS,MatchSeries,DIFFICULTY_LABELS,ROSTER_TARGETS,rosterTargetName,FinishPressGate,moveCaption,captionPosition,mountTitleScreen,mountBattleGestures,mountPageZoomGuard,bindPageZoomPreference,createBackgroundMusic,createSettingsStore,bindTouchControls,document,window,Duel,CAST,GROUND,playableVoice,VoiceCueQueue,VoiceChannels,renderCooldownButton,MOVE_READABILITY,impactY,moveCue,console,setTimeout:fn=>{const id=++timerId;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),Phaser:{Scene:class{},Game:class{},Scale:{RESIZE:0,NO_CENTER:0}}};
 await vm.runInNewContext('(async()=>{'+gameSource()+'\nglobalThis.ui={initializeRoster,showMenu,startGame,result,movePresentation,Arena,drainVoiceCues,stopVoice,get duel(){return duel;},setScene(){scene={};sound=false;},enableAudio(){sound=true;duel.status="active";},get selected(){return selected;},get opponent(){return opponent;}};})();',context);
 context.ui.initializeRoster();context.ui.showMenu();
 return {...context,$:document.querySelector,timers};
}

test('menu offers seven portrait buttons and two selectable role cards',async()=>{
 const h=await harness();
 const ids=[...h.$('#roster-grid').innerHTML.matchAll(/data-character="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids,['wang','han','ma','su','huang','chen','ko']);
 assert.equal((html.match(/class="matchup-card/g)||[]).length,2);
});

test('all selected pairings update portraits, controls and fresh duel across replay and reselect',async()=>{
 const h=await harness();h.ui.setScene();
 for(const selected of ['wang','han','ma','su','huang','chen','ko'])for(const opponent of ['wang','han','ma','su','huang','chen','ko']){
  h.$('#player-card').onclick();h.$('#roster-'+selected).onclick();
  h.$('#opponent-card').onclick();h.$('#roster-'+opponent).onclick();
  assert.equal(h.ui.duel.player.type,selected);assert.equal(h.ui.duel.enemy.type,opponent);
  assert.equal(h.$('#player-portrait').src,CAST[selected].portrait);
  assert.equal(h.$('#player-name').textContent,CAST[selected].name);assert.equal(h.$('#player-portrait').alt,CAST[selected].name+'原創諷刺漫畫');
  assert.equal(h.$('#opponent-name').textContent,CAST[opponent].name);assert.equal(h.$('#opponent-portrait').alt,CAST[opponent].name+'原創諷刺漫畫');
  assert.equal(h.$('#opponent-portrait').src,CAST[opponent].portrait);
  for(const [index,move] of CAST[selected].moves.entries())assert.equal(h.$(`[data-action="special${index+1}"]`).querySelector('strong').textContent,move.name);
  assert.equal(h.$('#player-card').style['--cast-color'],CAST[selected].colorCSS);
  assert.equal(h.$('#opponent-card').style['--cast-color'],CAST[opponent].colorCSS);
  h.ui.startGame();assert.equal(h.ui.duel.player.type,selected);assert.equal(h.ui.duel.enemy.type,opponent);
  h.ui.duel.player.hp=24;h.ui.startGame();assert.equal(h.ui.duel.player.hp,fighterBaseStats(selected).maxHp);assert.equal(h.ui.duel.player.hp,({wang:95,han:105,ma:95,su:110,huang:95,chen:95,ko:105})[selected]);assert.equal(h.ui.duel.enemy.type,opponent);
  h.ui.showMenu();assert.equal(h.ui.duel.status,'menu');assert.equal(h.ui.duel.enemy.type,opponent);
 }
});

test('new moves use their own metadata and never inherit Wang or Han captions',async()=>{
 const h=await harness();
 for(const id of ['ma','su','huang','chen','ko'])for(const move of CAST[id].moves){
  const view=h.ui.movePresentation({type:id},move.kind);
  assert.equal(view.word,move.word||move.name);
  assert.ok(view.banner.includes(move.name));
  assert.ok(!/墨鏡|從容失敗|連滾帶爬|可憐哪/.test(view.banner));
 }
 const ma={type:'ma',x:200,y:430};const calls=[];
 h.ui.Arena.prototype.event.call({wordBlast:(f,word)=>calls.push(word),banner:word=>calls.push(word),popup:(x,y,word)=>calls.push(word)}, {type:'counter',f:ma});
 assert.ok(!calls.some(word=>/墨鏡|游刃有餘|從容/.test(word)));
});

test('changing only opponent refreshes HUD cache key',async()=>{
 const source=gameSource();
 assert.match(source,/const stamp=\[fs\[0\]\.type,fs\[1\]\.type,/);
 assert.match(source,/stopVoice\(\);clearHold\(\);duel\.status='paused'/);
});

test('new source links and explicit research/audio limits are present without changing Han clip',async()=>{
 const moves=readFileSync(new URL('../dist/moves.html',import.meta.url),'utf8');
 for(const page of [html,moves]){
  assert.ok(page.includes('R8vDOQt-V4A'));if(page===moves)for(const c of Object.values(CAST))for(const m of c.moves)assert.ok(page.includes(m.name));
  assert.match(page,/尚未聆聽/);assert.match(page,/標題、說明或逐字稿/);assert.match(page,/21 招/);assert.match(page,/不仿聲/);assert.match(page,/再利用權限尚未確認/);
 }
 assert.ok(html.includes('assets/voice/coin-user-selected-v31.wav'));
 assert.ok(html.includes(`style.css?v=${RUNTIME_VERSION}`));assert.ok(html.includes(`game.mjs?v=${RUNTIME_VERSION}`));
});


test('repeated start replaces countdown and returning to menu cancels the pending start',async()=>{
 const h=await harness();h.ui.setScene();
 h.ui.startGame();assert.equal(h.timers.size,1);
 h.ui.startGame();assert.equal(h.timers.size,1);
 h.ui.showMenu();assert.equal(h.timers.size,0);assert.equal(h.ui.duel.status,'menu');
});

test('fictional attack-name banners are never labeled as a candidate quotation',async()=>{
 const h=await harness();
 for(const id of ['ma','su','huang','chen','ko'])for(const move of CAST[id].moves){
  const view=h.ui.movePresentation({type:id},move.kind);
  assert.equal(view.fictional,true,`${move.kind} banner contains a fictional move name`);
 }
});

test('Chen and Ko special events do not trigger the original Han voice player',async()=>{
 let voicePlays=0;
 for(const id of ['chen','ko'])for(const move of CAST[id].moves){
  const h=await harness();h.ui.enableAudio();h.$('#han-voice').play=()=>{voicePlays++;return Promise.resolve();};
  const words=[],actor={type:id,id:'player',x:260,y:430,attack:{kind:move.kind}};
  const arena={spitStart:new WeakMap(),popup:(x,y,word)=>words.push(word),wordBlast:(f,word)=>words.push(word),banner:copy=>words.push(copy)};
  h.ui.Arena.prototype.event.call(arena,{type:'move',f:actor,name:move.name,kind:move.kind});
  assert.ok(words.includes(move.name));assert.ok(words.includes(move.word||move.name));
 }
 assert.equal(voicePlays,0);
 const h=await harness();h.ui.enableAudio();h.$('#move-voice').play=()=>{voicePlays++;return Promise.resolve();};
 h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){}},{type:'move',f:{type:'han',id:'player',x:260,y:430},kind:'coin',name:'發財金幣波'});
 assert.equal(voicePlays,1,'the original Han coin still plays its clip in the player lane');assert.match(h.$('#move-voice').src,/coin-user-selected-v31/);
});


test('idle Han and cough voices start on accepted moves and repeated speech waits for completion',async()=>{
 const h=await harness();h.ui.enableAudio();let plays=0,stops=0;
 h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};h.$('#move-voice').pause=()=>stops++;
 const arena={spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}};
 const f={type:'han',x:0,y:430,attack:{kind:'han_knee',age:0}};
 h.ui.Arena.prototype.event.call(arena,{type:'move',f,kind:'han_knee'});
 assert.equal(plays,1,'no .62-second wait after an accepted Han move');assert.match(h.$('#move-voice').src,/han-knee-user-selected-v31/);
 h.ui.drainVoiceCues();assert.equal(plays,1);await Promise.resolve();assert.match(h.$('#voice-status').textContent,/使用者提供/);
 h.$('#move-voice').onended(); // Explicit ending also releases the actor lane.
 const m={type:'ma',x:0,y:430,attack:{kind:'ma_cough',age:0}};
 h.ui.Arena.prototype.event.call(arena,{type:'move',f:m,kind:'ma_cough'});h.ui.drainVoiceCues();assert.equal(plays,2);
 m.attack.age=.20;h.ui.drainVoiceCues();assert.equal(plays,2);assert.match(h.$('#move-voice').src,/cough/);
 m.attack={kind:'ma_cough',age:0};h.ui.Arena.prototype.event.call(arena,{type:'move',f:m,kind:'ma_cough'});m.attack=null;h.ui.drainVoiceCues();assert.equal(plays,2);h.$('#move-voice').onended();assert.equal(plays,3);
 h.$('#pause').onclick();assert.equal(h.ui.duel.status,'paused');assert.ok(stops>=1);
});
test('manual sample uses the selected clip and respects mute and close lifecycle',async()=>{
 const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};
 h.$('#voice-sample').value='ma_cough';h.$('#play-voice').onclick();assert.equal(plays,1);assert.match(h.$('#move-voice').src,/cough/);
 h.$('#sound').onclick();h.$('#play-voice').onclick();assert.equal(plays,1);assert.match(h.$('#voice-status').textContent,/開啟/);
});


test('manual preview stops on close, window blur, and hidden document even outside active duel',async()=>{
 for(const state of ['menu','paused','over'])for(const event of ['close','blur','hidden']){
  const h=await harness();h.ui.enableAudio();h.ui.duel.status=state;let stops=0;h.$('#move-voice').pause=()=>stops++;
  h.$('#voice-sample').value='ma_cough';h.$('#play-voice').onclick();stops=0;
  if(event==='close')h.$('#help-dialog').handlers.close();
  if(event==='blur')h.window.handlers.blur();
  if(event==='hidden'){h.document.hidden=true;h.document.handlers.visibilitychange();}
  assert.ok(stops>0,state+' '+event);
 }
});

test('three catalog moves play immediately with catalog provenance, even if later interrupted',async()=>{
 for(const kind of ['huang_shout','huang_debt','huang_queue']){
  const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};
  const clip=playableVoice(kind),actor={type:'huang',x:0,y:430,attack:{kind,age:0}};
  const arena={spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}};
  h.ui.Arena.prototype.event.call(arena,{type:'move',f:actor,kind});
  assert.equal(plays,1);actor.attack.age=clip.cue||0;h.ui.drainVoiceCues();h.ui.drainVoiceCues();assert.equal(plays,1);
  assert.equal(h.$('#move-voice').src,clip.src);await Promise.resolve();assert.match(h.$('#voice-status').textContent,/語錄站音檔/);assert.ok(!h.$('#voice-status').textContent.includes('使用者提供'));
  if(clip.cue){actor.attack={kind,age:0};h.ui.Arena.prototype.event.call(arena,{type:'move',f:actor,kind});actor.attack=null;h.ui.drainVoiceCues();assert.equal(plays,2);}
 }
});

test('all nine supplied recording excerpts trigger the matching move without a delayed timer',async()=>{
 for(const kind of ['arrow','ko_bags','ma_gaze','chen_calm','ko_name','ko_resolve','chen_question','counter','rush']){
  const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};
  const type=Object.entries(CAST).find(([,c])=>c.moves.some(m=>m.kind===kind))[0],actor={type,x:0,y:430,attack:{kind,age:0}};
  h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f:actor,kind});
  assert.equal(plays,1,kind);assert.equal(h.$('#move-voice').src,playableVoice(kind).src);h.ui.drainVoiceCues();assert.equal(plays,1);
  await Promise.resolve();assert.match(h.$('#voice-status').textContent,/使用者提供音檔/);assert.match(h.$('#voice-status').textContent,/未獨立認證/);
 }
});

test('accepted Su shout plays its uploaded file once immediately',async()=>{const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};const f={type:'su',x:0,y:430,attack:{kind:'su_shout',age:0}};h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f,kind:'su_shout',name:'在那叫什麼'});assert.equal(plays,1);assert.match(h.$('#move-voice').src,/su-shout.*v31/);h.ui.drainVoiceCues();assert.equal(plays,1);await Promise.resolve();assert.match(h.$('#voice-status').textContent,/使用者提供音檔：在那叫什麼/);});

test('user-selected Su rush and dare clips each play once on acceptance',async()=>{for(const kind of ['su_rush','su_dare']){const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};const f={type:'su',x:0,y:430,attack:{kind,age:0}};h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f,kind});assert.equal(plays,1,kind);assert.match(h.$('#move-voice').src,new RegExp(kind.replace('_','-')+'.*v31'));h.ui.drainVoiceCues();assert.equal(plays,1);}});

test('accepted handshake plays its uploaded phrase once without waiting for hit',async()=>{const h=await harness();h.ui.enableAudio();let plays=0;h.$('#move-voice').play=()=>{plays++;return Promise.resolve();};const f={type:'ma',x:0,y:430,attack:{kind:'ma_handshake',age:0}};h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f,kind:'ma_handshake'});assert.equal(plays,1);assert.match(h.$('#move-voice').src,/ma-handshake.*v31/);h.ui.drainVoiceCues();assert.equal(plays,1);});

test('accepted Chen dream plays once at acceptance on the proper actor lane',async()=>{for(const id of ['player','enemy']){const h=await harness();h.ui.enableAudio();let plays=0;const media=id==='player'?'#move-voice':'#han-voice';h.$(media).play=()=>{plays++;return Promise.resolve();};const f={id,type:'chen',x:0,y:430,attack:{kind:'chen_dream',age:0}};h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f,kind:'chen_dream'});assert.equal(plays,1,id);assert.match(h.$(media).src,/chen-dream-user-selected-v31\.wav$/);h.ui.drainVoiceCues();assert.equal(plays,1);}});
