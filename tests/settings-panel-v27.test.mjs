import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import{CAST}from'../dist/roster.mjs';
const path=new URL('../dist/settings-view.mjs',import.meta.url);
test('settings has four reachable sections and keeps legacy source history',()=>{const h=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(h,/id="help"[^>]*>⚙ 設定/);for(const tab of ['audio','controls','moves','about'])assert.ok(h.includes(`id="settings-tab-${tab}"`));assert.ok(h.includes('id="settings-history"'));assert.ok(h.includes('id="settings-reset-confirm"'));assert.ok(h.includes('id="settings-cancel-reset"'));assert.doesNotMatch(h,/id="(?:bgm|music)[^"]*"/);for(const v of ['V19','V25','V26','V13'])assert.ok(h.includes(v));});
test('move information covers all21 with purpose, bindings, cooldown and numeric details',async()=>{assert.ok(existsSync(path),'settings view module exists');const{moveInformation}=await import(path);for(const[id,c]of Object.entries(CAST))for(const[i,m]of c.moves.entries()){const info=moveInformation(id,m.kind);assert.equal(info.name,m.name);assert.equal(info.purpose,m.purpose);assert.equal(info.key,['U','I','O'][i]);assert.equal(info.cooldown,m.cooldown);assert.equal(typeof info.details,'string');assert.doesNotMatch(info.details,/undefined|NaN/);assert.ok(info.details.length>5);}assert.equal(moveInformation('wang','chen_dream'),null);assert.equal(moveInformation('missing','x'),null);});

test('controls pane stays self-contained while the detailed moves and source routes remain available',()=>{
 const h=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const controls=h.match(/<section id="settings-pane-controls"[^>]*>([\s\S]*?)<\/section>/)[1];
 assert.equal((controls.match(/href="moves.html"/g)||[]).length,0);
 const about=h.slice(h.indexOf('<section id="settings-pane-about"'));
 for(const route of ['moves.html','art.html','assets/music/CREDITS.txt','vendor/PHASER-LICENSE.md'])assert.ok(about.includes(`href="${route}"`),route);
 for(const id of ['settings-page-zoom','rotate-mode','camera-mode'])assert.ok(controls.includes(`id="${id}"`));
});
