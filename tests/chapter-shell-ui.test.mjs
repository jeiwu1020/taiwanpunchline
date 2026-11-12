import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const root=new URL('../dist/',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
for(const n of [2,3,4])test(`chapter ${n} uses the shared HUD, controls and settings shell`,()=>{
 const d=new JSDOM(read(`preview/chapter${n}/index.html`)).window.document;
 assert.ok(d.querySelector('.control-deck .movement'),'desktop four-way movement exists');
 assert.equal(d.querySelectorAll('.control-deck .specials .move-copy strong').length,3);
 assert.ok(d.querySelector('#hud .hud-side .guard-row'),'guard UI matches chapter 1');
 for(const id of ['home','help','pause','sound','timer','match-score','p-hp','e-hp'])assert.ok(d.getElementById(id),id);
 for(const file of ['combat-controls-v70.css','combat-controls-v71.css','combat-controls-v73.css'])assert.ok([...d.querySelectorAll('link')].some(l=>l.href.includes(file)));
});
test('a single later chapter UI module is shared across all chapters',()=>{assert.ok(existsSync(new URL('preview/campaign/chapter-ui.mjs',root)));for(const n of [2,3,4])assert.match(read(`preview/chapter${n}/chapter${n===3?2:n}-playable.mjs`),/mountChapterInterface/)});
test('title ensemble assigns one equal image row to every landscape slot',()=>{const css=read('title-screen.css');assert.match(css,/--title-face-height:/);assert.match(css,/grid-template-rows:var\(--title-face-height\) auto/);});
