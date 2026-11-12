import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('current game pages use the approved timeless name, including share metadata and settings',()=>{
 const index=read('dist/index.html');
 for(const page of ['index.html','moves.html','art.html']){
  const html=read('dist/'+page),title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title?.includes('拳民開講'),page);
  assert.ok(!/20\d{2}/.test(title),'no year in title');
  assert.ok(!html.includes('議場大亂鬥'),page+' current branding');
 }
 assert.match(index,/<span id="brand-title">拳民開講<\/span>/);
 assert.match(index,/<span id="profile-test-badge" role="status" hidden>測試模式<\/span>/);
 assert.match(index,/<strong id="settings-title">拳民開講 · 設定<\/strong>/);
 assert.match(index,/<meta property="og:title" content="拳民開講">/);
 assert.match(read('scripts/generate-moves-page.mjs'),/<title>拳民開講｜招式與原聲<\/title>/);
});
test('V39 entry and changed dependencies use new cache keys while prior history remains',()=>{
 const html=read('dist/index.html');
 assert.ok(html.includes(`src="game.mjs?v=${RUNTIME_VERSION}"`));
 assert.ok(html.includes(`interface-v33.css?v=${RUNTIME_VERSION}`));
 for(const path of ['viewport-boot.js','mobile-game.css'])assert.ok(html.includes(path+'?v='+RUNTIME_VERSION));
 assert.ok(html.includes(`settings.css?v=${RUNTIME_VERSION}`));
 assert.ok(read('dist/game.mjs').includes(`core.mjs?v=${RUNTIME_VERSION}'`));
 assert.ok(read('dist/game.mjs').includes(`page-zoom-gestures.mjs?v=${RUNTIME_VERSION}'`));
 assert.match(html,/V34 戰鬥手勢與側轉疊圖/);
 assert.match(html,/V33 手機橫向疊圖試版/);
 assert.match(html,/V32 操作與轉向修正/);
 assert.match(html,/21 句指定語音已接入/);
 assert.match(html,/Licensed under Creative Commons: By Attribution 4\.0/);
 assert.equal(JSON.parse(read('.openai/hosting.json')).project_id,'appgprj_6aeede2a09908191bcfc5c207636f63b');
});
