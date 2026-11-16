import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import * as series from '../dist/series-presentation.mjs';
import {layoutCombatCallouts,makeCombatCallout} from '../dist/preview/campaign/combat-callouts.mjs';

const read=path=>readFileSync(new URL(`../dist/${path}`,import.meta.url),'utf8');

test('first and later chapter win markers clip the sprite atlas at the microphone',()=>{
 const html='<!doctype html><html><head></head><body><main id="trial-app"><div id="hud" class="dom-hud"><div class="hud-side"><div class="hud-name"><span>電火球</span><span id="e-series-wins" class="series-wins"></span></div></div></div></main></body></html>';
 const dom=new JSDOM(html),{document}=dom.window;
 for(const stylesheet of ['style.css','series-presentation.css']){const node=document.createElement('style');node.textContent=read(stylesheet);document.head.append(node);}
 series.setSeriesWinMarkers(document,0,1,true);
 const rootOverflow=dom.window.getComputedStyle(document.querySelector('svg')).overflow;
 assert.equal(rootOverflow,'hidden','the root game must not paint sprite-atlas neighbors outside the mic crop');
 dom.window.close();

 const chapterDom=new JSDOM(html),chapterDocument=chapterDom.window.document;
 for(const stylesheet of ['series-presentation.css']){const node=chapterDocument.createElement('style');node.textContent=read(stylesheet);chapterDocument.head.append(node);}
 series.setSeriesWinMarkers(chapterDocument,0,1,true);
 const marker=chapterDocument.querySelector('svg');
 assert.equal(chapterDom.window.getComputedStyle(marker).overflow,'hidden','chapters 2–5 must use the same clipped microphone marker');
 chapterDom.window.close();
});

test('challenge result actions use the same concise victory label and omit optional result details',()=>{
 assert.equal(typeof series.challengeResultActions,'function','the result action policy is shared instead of branching by chapter');
 const win=series.challengeResultActions({challenge:true,resultReady:true,winner:'player'});
 assert.deepEqual({...win},{preparationLabel:'強化技能',showOverview:true,showPreparation:true,showPerformanceStats:false,showFictionNote:false});
 const loss=series.challengeResultActions({challenge:true,resultReady:true,winner:'enemy'});
 assert.equal(loss.preparationLabel,'整備後重試');assert.equal(loss.showOverview,true);assert.equal(loss.showPreparation,false);
 const versus=series.challengeResultActions({challenge:false,resultReady:true,winner:'player'});
 assert.equal(versus.showPerformanceStats,true);assert.equal(versus.showFictionNote,true);
 const main=read('game.mjs');assert.match(main,/challengeResultActions\(/);assert.doesNotMatch(main,/本局結果 · 本存檔/);
});

test('main and later chapters load one shared challenge-result card design',()=>{
 const css=read('challenge-layout.css');
 assert.match(css,/#result \.result-paper[\s\S]*#trial-app #result-panel \.result-paper/);
 assert.match(css,/result-paper \.menu-action/);
 assert.match(read('index.html'),/challenge-layout\.css\?v=chapter-presentation-20261117-r1/);
 for(const chapter of [2,3,4,5])assert.match(read(`preview/chapter${chapter}/index.html`),/challenge-layout\.css\?v=chapter-presentation-20261117-r1/);
});

test('chapter combat move callouts stay in the same player and opponent lanes when actors move',()=>{
 const player={id:'player',type:'wang',x:260,y:430,face:1},enemy={id:'enemy',type:'su',x:700,y:430,face:-1};
 const frame={left:0,base:470,zoom:1.1},width=390,height=640,ground=430;
 const makeEntries=()=>[
  {actor:player,player:true,caption:makeCombatCallout('連滾帶爬','', 'rush','wang'),started:0,until:2000},
  {actor:enemy,player:false,caption:makeCombatCallout('衝衝衝','', 'su_rush','su'),started:0,until:2000}
 ];
 const positions=actors=>layoutCombatCallouts(makeEntries(),actors,frame,width,height,ground,16,500,108).map(item=>({
  x:(item.placement.x-frame.left)*frame.zoom,
  y:frame.base+(item.placement.y-ground)*frame.zoom
 }));
 const first=positions([player,enemy]);
 player.x=500;enemy.x=460;
 const moved=positions([player,enemy]);
 assert.deepEqual(moved,first,'callouts must follow the first-chapter screen lanes, not actor coordinates');
 assert.ok(first[0].x<width/2&&first[1].x>width/2);
 assert.ok(first.every(point=>point.y>108));
});

test('all later chapter result panels use the shared victory preparation label',()=>{
 for(const chapter of [2,3,4,5]){
  const path=chapter===3?'preview/chapter3/chapter2-playable.mjs':chapter===5?'preview/chapter5/chapter5-playable.mjs':`preview/chapter${chapter}/chapter${chapter}-playable.mjs`;
  const source=read(path);
  assert.ok(source.includes('challengeResultActions('),`chapter ${chapter} result action policy`);
  assert.match(source,/function shout\(copy\).*#feedback/);
  assert.doesNotMatch(source,/label\(caption,w\/2/,'chapter callouts must not create a large extra caption beneath the HUD');
  assert.doesNotMatch(source,/else if\(e\.type==='move'\)shout\(/,'assist moves should not duplicate the actor callout with a second centered caption');
 }
});

test('chapter handoff shows one concise loading state and restores recovery options on failure',()=>{
 const shell=read('preview/campaign/chapter-shell.css'),bridge=read('preview/campaign/page-bridge.mjs');
 assert.match(shell,/data-campaign-loading[^{}]*#[^{}]*::after[\s\S]*載入中/);
 assert.match(bridge,/menuStatus\.textContent='載入中…'/);
 assert.match(bridge,/delete document\.documentElement\.dataset\.campaignLoading/);
 for(const chapter of [2,3,4,5]){
  const html=read(`preview/chapter${chapter}/index.html`);
  assert.match(html,/new URLSearchParams\(location\.search\)\.has\('handoff'\).*dataset\.campaignLoading/);
 }
});
