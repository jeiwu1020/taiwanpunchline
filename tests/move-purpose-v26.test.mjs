import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{CAST}from'../dist/roster.mjs';import{COMBAT}from'../dist/combat-rules.mjs';import{gameHarness}from'./helpers/game-harness.mjs';import{renderCooldownButton}from'../dist/cooldown-view.mjs?v=26';
test('all twenty-one moves have concise numeric-free purposes independent of combat hints',()=>{
 const moves=Object.values(CAST).flatMap(c=>c.moves);assert.equal(moves.length,21);for(const m of moves){assert.equal(typeof m.purpose,'string',m.kind);assert.ok(m.purpose.length>=5&&m.purpose.length<=16,m.kind);assert.doesNotMatch(m.purpose,/[0-9%％+＋]|傷害|冷卻/,m.kind);assert.equal(m.hint,COMBAT[m.kind].hint);}
});
test('all actual character selections show purpose in visible copy, tooltip and accessible label',async()=>{
 const h=await gameHarness();for(const c of Object.keys(CAST)){
  h.ui.showMenu();h.$('#player-card').onclick();h.$('#roster-'+c).onclick();
  for(const [i,m]of CAST[c].moves.entries()){
   const b=h.specials[i];assert.equal(b.querySelector('strong').textContent,m.name);assert.equal(b.querySelector('small').textContent,m.purpose,m.kind);assert.equal(b.title,m.purpose,m.kind);assert.equal(b.getAttribute('aria-label'),`${m.name}，${m.purpose}，冷卻完成`);
   renderCooldownButton(b,m,m.cooldown);assert.equal(b.getAttribute('aria-label'),`${m.name}，${m.purpose}，冷卻剩餘 ${Math.ceil(m.cooldown)} 秒`);assert.equal(b.querySelector('.cooldown-value').textContent,m.cooldown.toFixed(1));
  }
 }
});
test('detailed move information retains each exact cooldown and mechanical damage values',()=>{
 const html=readFileSync(new URL('../dist/moves.html',import.meta.url),'utf8');const articles=[...html.matchAll(/<article>(.*?)<\/article>/g)].map(x=>x[1]);assert.equal(articles.length,21);
 for(const m of Object.values(CAST).flatMap(c=>c.moves)){
  const article=articles.find(a=>a.includes(`<h3>${m.name}</h3>`));assert.ok(article,m.kind);assert.ok(article.includes(`冷卻 ${m.cooldown} 秒`),m.kind);
  const stats=COMBAT[m.kind];if(m.kind==='ma_gaze')assert.ok(article.includes(`地面 ${stats.damage}／對空 ${stats.airDamage} 傷害`),m.kind);
  else if(m.kind==='chen_dream')assert.ok(article.includes(`${stats.damage} 去程／${stats.returnDamage} 回程傷害`),m.kind);
  else if(m.behavior==='counter')assert.ok(article.includes(`反擊 ${stats.damage}`),m.kind);
  else if(stats.hits)assert.ok(article.includes(stats.hits.map(x=>x.damage).join('＋')+' 傷害'),m.kind);
  else if(stats.damage&&m.kind!=='ma_gaze'&&m.kind!=='chen_dream'&&m.behavior!=='counter')assert.ok(article.includes(stats.damage+' 傷害'),m.kind);
 }
});
test('purpose presentation is loaded after legacy mobile rules that hid explanations',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.ok(html.includes(`href="move-purpose.css?v=${RUNTIME_VERSION}"`));assert.ok(html.indexOf('move-purpose.css')>html.indexOf('mobile-game.css'));
});
test('the newer user cut is selected while both previously confirmed Chen files are retained byte-identically',async()=>{
 const {playableVoice}=await import('../dist/voice-slots.mjs');const{createHash}=await import('node:crypto');const v=playableVoice('chen_dream');
 assert.equal(v.src,'assets/voice/chen-dream-user-selected-v31.wav');assert.equal(v.sourceRange.start,7.760);assert.equal(v.sourceRange.end,9.62);assert.match(v.status,/使用者確認區間/);assert.equal(v.originalVerified,false);
 const hash=p=>createHash('sha256').update(readFileSync(new URL('../dist/assets/voice/'+p,import.meta.url))).digest('hex');
 assert.equal(hash('chen-dream-user-confirmed-v26.mp3'),'4f31d0cb1f9eff429b06fb19863d9dad464a2ad5a06fc3718944bf2cbbdae9a9');assert.equal(hash('chen-dream-user-candidate-v201.mp3'),'fef9b40261b220e8066693292cd83089b9db885102b11c741cbb5369a4ccbc7a');
});
