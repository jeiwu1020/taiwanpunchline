import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {chapterSettingsMarkup} from '../dist/preview/campaign/chapter-settings-markup.mjs';
const root=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
for(const [name,html]of [['root',root],['chapters',chapterSettingsMarkup]])test(`${name}: settings retain controls and attribution with concise player copy`,()=>{
 const d=new JSDOM(html).window.document,panel=d.querySelector('#help-dialog');
 assert.doesNotMatch(panel.textContent,/V\d{2}|四路原音|清空待播|私人原型|章節共用|美術慢放|依雙方距離調整|增益/);
 assert.match(panel.textContent,/穩定視野固定人物大小/);assert.match(panel.textContent,/起跳不會讓人物縮小/);
 assert.match(panel.textContent,/島遊無界 \/ PlayFormosa/);assert.match(panel.textContent,/Kevin MacLeod/);assert.match(panel.textContent,/再利用授權/);
 for(const id of ['settings-master-muted','settings-sfx-muted','settings-sfx-volume','settings-voice-muted','settings-voice-volume','settings-music-muted','settings-music-volume','settings-page-zoom','rotate-mode','camera-mode','settings-reset','settings-confirm-reset','settings-demo-canvas','settings-move-source','close-help'])assert.ok(d.getElementById(id),id);
 assert.equal(d.querySelector('#settings-music-volume').getAttribute('value'),'22');assert.equal(d.querySelector('#settings-master-muted').checked,false);
 assert.equal(d.querySelector('#rotate-mode').getAttribute('aria-pressed'),'true');
 assert.equal(d.querySelector('a[href$="art.html"]'),null);
});
