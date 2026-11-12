import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAST} from '../dist/roster.mjs';
import {mountTitleScreen,sampleTitlePair} from '../dist/title-screen.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';

const fixture=()=>readFileSync(new URL('./fixtures/title-screen-fragment.html',import.meta.url),'utf8');
const sheet=()=>readFileSync(new URL('../dist/title-screen.css',import.meta.url),'utf8');
const keys=Object.keys(CAST);
const sequence=values=>{let i=0;return()=>values[i++%values.length];};
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};

// Only the DOM boundary is replaced. The production controller and roster run
// unchanged, with no test-only branch or duplicate model of the controller.
function element(){
 const classes=new Set(),attrs=new Map(),children=new Map();
 return {hidden:false,inert:false,disabled:false,textContent:'',dataset:{},scrollTop:32,focusCount:0,
  style:{setProperty(name,value){this[name]=value;}},
  classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)},
  setAttribute(name,value){attrs.set(name,String(value));},getAttribute:name=>attrs.get(name),
  querySelector(name){if(!children.has(name))children.set(name,element());return children.get(name);},
  focus(){this.focusCount++;},addEventListener(name,fn){this['on'+name]=fn;},
 };
}
function harness(options={}){
 const root=element(),calls=[];
 const ui=mountTitleScreen({root,cast:CAST,onStart:()=>calls.push('start'),rng:sequence([0,.999,.8,.2]),...options});
 return {root,ui,calls,$:selector=>root.querySelector(selector),click:()=>root.querySelector('#title-start').onclick()};
}

test('two independently sampled indices always return distinct roster keys without mutation',()=>{
 const before=JSON.stringify(CAST);
 for(let first=0;first<7;first++)for(let second=0;second<6;second++){
  const pair=sampleTitlePair(CAST,sequence([(first+.5)/7,(second+.5)/6]));
  assert.equal(pair.length,2);assert.equal(pair[0],keys[first]);
  assert.notEqual(pair[0],pair[1]);assert.ok(keys.includes(pair[1]));
 }
 assert.equal(JSON.stringify(CAST),before);
});

test('all seven characters and all 42 ordered pairs are reachable',()=>{
 const pairs=new Set(),left=new Set(),right=new Set();
 for(let i=0;i<7;i++)for(let j=0;j<6;j++){
  const pair=sampleTitlePair(CAST,sequence([i/7,j/6]));
  left.add(pair[0]);right.add(pair[1]);pairs.add(pair.join('/'));
 }
 assert.deepEqual([...left].sort(),[...keys].sort());
 assert.deepEqual([...right].sort(),[...keys].sort());assert.equal(pairs.size,42);
});

test('sampler uses exactly two RNG draws and allows the same pair on later visits',()=>{
 let draws=0;const rng=()=>{draws++;return 0;};
 assert.deepEqual(sampleTitlePair(CAST,rng),['wang','han']);assert.equal(draws,2);
 assert.deepEqual(sampleTitlePair(CAST,rng),['wang','han']);assert.equal(draws,4);
 assert.deepEqual(sampleTitlePair(CAST,()=>.999999),['ko','chen']);
});

test('default random sampling always draws two different characters',()=>{
 for(let i=0;i<1000;i++){
  const pair=sampleTitlePair(CAST);assert.equal(pair.length,2);
  assert.notEqual(pair[0],pair[1]);assert.ok(pair.every(key=>keys.includes(key)));
 }
});

test('sampler fails clearly for too few characters and invalid RNG results',()=>{
 assert.throws(()=>sampleTitlePair({},()=>0),/two/i);
 assert.throws(()=>sampleTitlePair({only:CAST.wang},()=>0),/two/i);
 for(const bad of[-.01,1,NaN,Infinity])assert.throws(()=>sampleTitlePair(CAST,()=>bad),/random/i);
});

test('mount starts gated and show safely paints existing portraits, names and colors',()=>{
 const h=harness();assert.equal(h.$('#title-start').disabled,true);
 h.ui.show();assert.equal(h.root.hidden,false);assert.equal(h.root.inert,false);
 assert.equal(h.root.classList.contains('hidden'),false);assert.equal(h.root.getAttribute('aria-hidden'),'false');
 assert.equal(h.root.scrollTop,0);assert.equal(h.$('#title-heading').focusCount,1);
 for(const[side,key]of[['left','wang'],['right','ko']]){
  const card=h.$(`[data-title-character="${side}"]`);
  assert.equal(card.dataset.character,key);assert.equal(card.querySelector('img').getAttribute('src'),CAST[key].portrait);
  assert.equal(card.querySelector('img').getAttribute('alt'),CAST[key].name+'，虛構戲仿角色');
  assert.equal(card.querySelector('[data-title-name]').textContent,CAST[key].name);
  assert.equal(card.style['--title-character-color'],CAST[key].colorCSS);
 }
 h.click();assert.equal(h.calls.length,0);
});

test('show resamples each visit and never edits the supplied cast',()=>{
 const before=JSON.stringify(CAST),h=harness();h.ui.show();
 assert.equal(h.$('[data-title-character="left"]').dataset.character,'wang');
 h.ui.hide();h.ui.show();assert.equal(h.$('[data-title-character="left"]').dataset.character,'chen');
 assert.equal(JSON.stringify(CAST),before);
});

test('every title visit shows all seven characters exactly once, including the five supporting cameos',()=>{
 const h=harness();
 for(let visit=0;visit<12;visit++){
  h.ui.show();
  const cards=['left','right','back-0','back-1','back-2','back-3','back-4'].map(slot=>h.$(`[data-title-character="${slot}"]`));
  assert.deepEqual(cards.map(card=>card.dataset.character).sort(),[...keys].sort());
  for(const card of cards){
   const character=CAST[card.dataset.character];
   assert.equal(card.querySelector('img').getAttribute('src'),character.portrait);
   assert.equal(card.querySelector('img').getAttribute('alt'),character.name+'，虛構戲仿角色');
   assert.equal(card.querySelector('[data-title-name]').textContent,character.name);
   assert.equal(card.style['--title-character-color'],character.colorCSS);
  }
  h.ui.hide();
 }
});

test('every possible foreground pair leaves exactly the other five characters in the ensemble',()=>{
 for(let first=0;first<7;first++)for(let second=0;second<6;second++){
  const h=harness({rng:sequence([(first+.5)/7,(second+.5)/6])});h.ui.show();
  const foreground=['left','right'].map(slot=>h.$(`[data-title-character="${slot}"]`).dataset.character);
  const supporting=[0,1,2,3,4].map(index=>h.$(`[data-title-character="back-${index}"]`).dataset.character);
  assert.equal(new Set([...foreground,...supporting]).size,7);
  assert.deepEqual([...foreground,...supporting].sort(),[...keys].sort());
  assert.ok(supporting.every(key=>!foreground.includes(key)));
 }
});

test('a new foreground pair moves former foreground characters into supporting slots',()=>{
 const h=harness();h.ui.show();
 assert.equal(h.$('[data-title-character="back-0"]').dataset.character,'han');
 assert.equal(h.$('[data-title-character="back-4"]').dataset.character,'chen');
 h.ui.hide();h.ui.show();
 assert.equal(h.$('[data-title-character="left"]').dataset.character,'chen');
 assert.equal(h.$('[data-title-character="right"]').dataset.character,'han');
 assert.equal(h.$('[data-title-character="back-0"]').dataset.character,'wang');
 assert.equal(h.$('[data-title-character="back-4"]').dataset.character,'ko');
});

test('ready gate and custom status can recover from loading failures',()=>{
 const h=harness();h.ui.show();h.ui.setReady(false,'載入失敗，請重新整理。');
 assert.equal(h.$('#title-start').disabled,true);assert.equal(h.$('#title-status').textContent,'載入失敗，請重新整理。');
 h.ui.setReady(true);assert.equal(h.$('#title-start').disabled,false);
 assert.equal(h.$('#title-start').getAttribute('aria-busy'),'false');
 assert.equal(h.$('#title-status').textContent,'七位角色，選誰上場？');
 h.ui.setReady(false);assert.equal(h.$('#title-start').disabled,true);
 assert.equal(h.$('#title-status').textContent,'正在準備角色與舞台…');
});

test('start callback runs synchronously in the gesture stack and rejects repeat entry',()=>{
 let clicked=false,inside=false,calls=0;const h=harness({onStart:()=>{assert.equal(clicked,true);inside=true;calls++;}});
 h.ui.show();h.ui.setReady(true);clicked=true;h.click();clicked=false;
 assert.equal(inside,true);assert.equal(h.$('#title-start').disabled,true);
 assert.equal(h.$('#title-start').getAttribute('aria-busy'),'true');
 h.click();assert.equal(calls,1);assert.equal(h.$('#title-start-label').textContent,'準備開吵…');
});

test('show clears an earlier entry error but preserves the current readiness message',()=>{
 const h=harness({onStart:()=>false});h.ui.show();h.ui.setReady(true);h.click();
 assert.equal(h.$('#title-status').textContent,'暫時無法進入，請再試一次。');
 h.ui.hide();h.ui.show();assert.equal(h.$('#title-status').textContent,'七位角色，選誰上場？');
 h.ui.hide();h.ui.setReady(false,'尚未載入完成');h.ui.show();
 assert.equal(h.$('#title-status').textContent,'尚未載入完成');
});

test('hide removes the entire screen from display, input and accessibility',()=>{
 const h=harness();h.ui.show();h.ui.setReady(true);h.ui.hide();
 assert.equal(h.root.hidden,true);assert.equal(h.root.inert,true);
 assert.equal(h.root.classList.contains('hidden'),true);assert.equal(h.root.getAttribute('aria-hidden'),'true');
 h.click();assert.equal(h.calls.length,0);
 h.ui.show();h.click();assert.equal(h.calls.length,1);
});

test('throwing or returning false from entry leaves a retryable home screen',()=>{
 for(const onStart of[()=>{throw Error('entry failed');},()=>false]){
  const h=harness({onStart});h.ui.show();h.ui.setReady(true);assert.doesNotThrow(()=>h.click());
  assert.equal(h.root.hidden,false);assert.equal(h.$('#title-start').disabled,false);
  assert.equal(h.$('#title-start-label').textContent,'開始遊戲');
  assert.equal(h.$('#title-status').textContent,'暫時無法進入，請再試一次。');
 }
});

test('a rejected async entry restores readiness without unhandled rejection',async()=>{
 const waiting=deferred(),h=harness({onStart:()=>waiting.promise});
 h.ui.show();h.ui.setReady(true);h.click();assert.equal(h.$('#title-start').disabled,true);
 waiting.reject(Error('blocked'));await flush();assert.equal(h.$('#title-start').disabled,false);
 assert.equal(h.$('#title-status').textContent,'暫時無法進入，請再試一次。');
});

test('async false restores entry, while resolved success waits for parent navigation',async()=>{
 for(const outcome of[false,true]){
  const h=harness({onStart:()=>Promise.resolve(outcome)});h.ui.show();h.ui.setReady(true);h.click();await flush();
  assert.equal(h.$('#title-start').disabled,outcome);assert.equal(h.root.hidden,false);
 }
});

test('late failure from an old visit never overwrites a new visit or reopens hidden UI',async()=>{
 const waiting=deferred(),h=harness({onStart:()=>waiting.promise});
 h.ui.show();h.ui.setReady(true);h.click();h.ui.hide();h.ui.show();
 h.ui.setReady(false,'新一輪載入中');waiting.reject(Error('stale'));await flush();
 assert.equal(h.$('#title-status').textContent,'新一輪載入中');assert.equal(h.$('#title-start').disabled,true);
 h.ui.hide();assert.equal(h.root.hidden,true);
});

test('hiding synchronously inside onStart is safe and never steals focus afterward',async()=>{
 let h;h=harness({onStart:()=>{h.ui.hide();return Promise.reject(Error('audio unavailable'));}});
 h.ui.show();h.ui.setReady(true);h.click();await flush();assert.equal(h.root.hidden,true);
 assert.equal(h.$('#title-heading').focusCount,1);
});

test('audio status is plain display text, independent of the start readiness gate',()=>{
 const h=harness();h.ui.show();h.ui.setReady(true);h.ui.setAudioStatus('已靜音，可在上方開啟聲音。');
 assert.equal(h.$('#title-audio-status').textContent,'已靜音，可在上方開啟聲音。');
 assert.equal(h.$('#title-audio-status').hidden,false);assert.equal(h.$('#title-start').disabled,false);
 h.ui.setAudioStatus();assert.equal(h.$('#title-audio-status').hidden,true);
 assert.equal(h.$('#title-audio-status').textContent,'');
});

test('fragment exposes all seven original portraits, one gated CTA and an honest disclaimer',()=>{
 const html=fixture();
 assert.match(html,/<section id="title-screen" class="screen title-screen"/);
 assert.match(html,/aria-labelledby="title-heading"/);assert.match(html,/aria-describedby="title-disclaimer"/);
 assert.match(html,/id="title-heading"[^>]*tabindex="-1"/);
 assert.equal([...html.matchAll(/<img\b/g)].length,7);assert.equal([...html.matchAll(/<button\b/g)].length,1);
 assert.match(html,/<button[^>]*id="title-start"[^>]*disabled/);
 assert.match(html,/政治戲仿創作。角色、招式與情節均為虛構，不代表本人參與或代言。/);
 assert.doesNotMatch(html,/挑戰賽|升級|裝備|道具|https?:|iframe|onclick=/);
 for(const[,src]of html.matchAll(/<img[^>]*src="([^"]+)"/g))assert.ok(Object.values(CAST).some(c=>c.portrait===src));
});

test('title owns the cabinet-sized scroll surface without changing gameplay grids',()=>{
 const css=sheet(),root=stylesAt(css,['.title-screen'],{width:1180,height:757});
 assert.equal(root.position,'absolute');assert.equal(root.inset,'0');assert.equal(root['z-index'],'8');
 assert.equal(root['overflow-y'],'auto');assert.equal(root['touch-action'],'pan-y pinch-zoom');
 assert.equal(stylesAt(css,['.title-screen[hidden]'],{width:320,height:568}).display,'none');
 assert.doesNotMatch(css.split('/* Integration:')[0],/\.cabinet\s*\{|\.control-deck|\.dom-hud|\.stage-wrap|body\s*\{/);
 assert.match(css,/\.cabinet\{position:relative\}/);
 assert.doesNotMatch((css.split('/* Integration:')[1]||'').split('/* Audio errors')[0],/grid-template|(?:^|[;{])(?:height|width):/);
});

test('CTA and disclaimer retain readable minimum sizes across all logical layouts',()=>{
 for(const[width,height]of[[320,568],[568,320],[844,390],[1180,757]]){
  const button=stylesAt(sheet(),['.title-screen .title-start'],{width,height});
  const note=stylesAt(sheet(),['.title-disclaimer'],{width,height});
  assert.ok(parseFloat(button['min-height'])>=44);assert.ok(parseFloat(note['font-size'])>=12);
  assert.ok(parseFloat(note['line-height'])>=1.4);assert.notEqual(note.display,'none');
 }

 assert.match(sheet(),/@container\s*\(max-width:\s*480px\)/);
 assert.match(sheet(),/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('all title surfaces center Start inside a seven-character surround',()=>{
 const css=sheet().replace(/@container(?: title-poster)?/g,'@media');
 for(const[width,height]of[[356,750],[296,450],[810,336],[534,266],[446,266],[1134,620]]){
  const viewport={width,height};
  const poster=stylesAt(css,['.title-poster'],viewport);
  const ensemble=stylesAt(css,['.title-ensemble'],viewport);
  const actions=stylesAt(css,['.title-actions'],viewport);
  assert.equal(poster['grid-template-columns'],'minmax(0,1fr)');
  assert.equal(ensemble['grid-template-rows'],height<=300?'minmax(0,1fr) minmax(70px,1fr) minmax(0,1fr)':'repeat(3,minmax(0,1fr))');
  assert.equal(actions['grid-column'],'4 / 10');assert.equal(actions['grid-row'],'2');
  assert.equal(actions['align-self'],'center');
  for(const[slot,column,row]of[['back-0','2 / 5','1'],['back-1','5 / 9','1'],['back-2','9 / 12','1'],['left','1 / 4','2'],['right','10 / 13','2'],['back-3','3 / 6','3'],['back-4','8 / 11','3']]){
   const character=stylesAt(css,[`.title-character--${slot}`],viewport);
   assert.equal(character['grid-column'],column);assert.equal(character['grid-row'],row);
  }
 }
 assert.equal(stylesAt(sheet(),['.title-screen'],{width:844,height:390})['container-type'],'size');
});

test('controller has no storage, media, timers, selected-player or HTML injection side effects',()=>{
 const source=readFileSync(new URL('../dist/title-screen.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage|AudioContext|new Audio\b|\.play\(|setTimeout|setInterval|innerHTML|insertAdjacentHTML|selectedPlayer|selectedOpponent/);
});
