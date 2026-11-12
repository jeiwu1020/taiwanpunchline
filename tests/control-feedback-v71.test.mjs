import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameHarness} from './helpers/game-harness.mjs';
import {renderCooldownButton} from '../dist/cooldown-view.mjs';

test('cooldown bottom-up readiness grows from empty to full without changing actual time',async()=>{
 const h=await gameHarness(),b=h.specials[0],m={name:'連滾帶爬',purpose:'翻滾',cooldown:8};
 for(const [remaining,fill,text] of [[8,'0%','8.0'],[6,'25%','6.0'],[4,'50%','4.0'],[0,'100%','✓']]){
  renderCooldownButton(b,m,remaining);assert.equal(b.style['--cooldown-ready'],fill);assert.equal(b.querySelector('.cooldown-value').textContent,text);
 }
 renderCooldownButton(b,m,.01);assert.ok(parseFloat(b.style['--cooldown-ready'])<100);assert.equal(b.getAttribute('aria-disabled'),'true');
});
test('keyboard jump presses every equivalent jump button and releases on keyup or pause',async()=>{
 const h=await gameHarness();const jump=h.$('#challenge-jump');jump.dataset.action='jump';h.specials.push(jump);
 h.ui.setScene();h.ui.startGame();for(let i=0;i<5;i++){const tasks=[...h.timers.entries()];h.timers.clear();for(const [,fn]of tasks)fn();}h.ui.activate();
 const e=code=>({code,target:h.$('#game'),preventDefault(){},repeat:false});
 h.window.handlers.keydown(e('Space'));assert.equal(jump.classList.contains('key-pressed'),true);
 h.window.handlers.keyup(e('Space'));assert.equal(jump.classList.contains('key-pressed'),false);
 h.window.handlers.keydown(e('KeyW'));assert.equal(jump.classList.contains('key-pressed'),true);
 h.ui.pauseGame();assert.equal(jump.classList.contains('key-pressed'),false);
});
test('universal jump copy and the new final stylesheet are present without altering existing shortcuts',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/id="challenge-jump"[^>]*data-action="jump"[^>]*><span>跳躍<\/span>/);
 assert.match(html,new RegExp(String.raw`combat-controls-v70\.css\?v=${RUNTIME_VERSION}"[^>]*>\s*<link[^>]*combat-controls-v71\.css\?v=${RUNTIME_VERSION}"`));
 for(const key of ['U','I','O'])assert.ok(html.includes(`<kbd>${key}</kbd>`));
});
