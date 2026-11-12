import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {stylesAt} from './helpers/css-contracts.mjs';
const read=p=>readFileSync(new URL('../dist/'+p,import.meta.url),'utf8');
test('only the locked battle cabinet suppresses single-finger pan as well as zoom',()=>{
 const css=['style.css','mobile-game.css','settings.css','interface-v33.css'].map(read).join('\n');
 const style=selectors=>stylesAt(css,selectors,{width:844,height:390});
 assert.equal(style(['.cabinet','.cabinet[data-gesture-locked="true"]'])['touch-action'],'none');
 assert.notEqual(style(['.cabinet'])['touch-action'],'none','menu/pause/result retain single-finger scrolling');
 assert.equal(style(['body'])['touch-action'],'manipulation');
 for(const part of ['#viewport-shell','.settings-scroll','.detail-scroll'])assert.equal(style([part])['touch-action'],'pan-x pan-y');
});
test('surface locking synchronizes exact combat states, never settings or text overlays',()=>{
 const s=read('game.mjs'),logic=s.match(/function battleSurfaceProtected\(\)\{[^\n]+\}/)?.[0],sync=s.match(/function syncBattleSurface\(\)\{[^\n]+\}/)?.[0];
 assert.ok(logic&&sync,'production state boundary exists');
 for(const status of ['menu','countdown','active','paused','over'])for(const opened of [true,false]){
  const cabinet={dataset:{}},ctx={matchFinish:null,battleGestures:{reset(){cabinet.resets=(cabinet.resets||0)+1;}},duel:{status},$:selector=>selector==='#help-dialog'?{open:opened}:cabinet};
  runInNewContext(logic+'\n'+sync+'\nsyncBattleSurface();',ctx);
  assert.equal(cabinet.dataset.gestureLocked,String(!opened&&['countdown','active'].includes(status)),status+' settings '+opened);
  assert.equal(cabinet.resets||0,(!opened&&['countdown','active'].includes(status))?0:1); 
 }
 for(const name of ['showMenu','startRound','pauseGame','resumeGame','result']){
  const fn=s.slice(s.indexOf('function '+name+'(')).split('\n').slice(0,3).join('\n');
  assert.match(fn,/syncBattleSurface\(\)/,name+' synchronizes CSS before browser gesture');
 }
 const entry=s.split('\n').find(line=>line.startsWith('async function startGame('));let starts=0;
 const entryContext={challengeRun:null,entryPreparationSession:null,gameMode:'battle',roundFormat:'single',MatchSeries:class{},startRound(){starts++;}};
 runInNewContext(entry+'\nstartGame();',entryContext);assert.equal(starts,1,'new matches share the synchronously locked round entry');
 assert.match(s,/mountBattleGestures\(\{root:\$\('#viewport-shell'\),isProtected:battleSurfaceProtected\}\)/);
});
test('the overlay CSS and camera use the same logical overlay flag',()=>{
 const css=read('interface-v33.css'),game=read('game.mjs');
 assert.match(css,/data-overlay-controls="true"/);
 assert.doesNotMatch(css,/data-native-landscape="true"/);
 assert.match(game,/viewportUI\?\.overlayControls===true/);
});
