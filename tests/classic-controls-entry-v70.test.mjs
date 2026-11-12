import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('approved controls load last and do not retain a second horizontal charge meter',()=>{
 assert.equal((html.match(/class="charge-track"/g)||[]).length,0);
 assert.match(html,new RegExp(String.raw`combat-ui-v68\.css\?v=${RUNTIME_VERSION}"[^>]*>\s*<link[^>]*combat-controls-v70\.css\?v=${RUNTIME_VERSION}"`));
 for(const klass of ['rally-button','assist-button'])assert.ok(html.includes(klass));
});
test('all-mode jump keeps action binding with approved visible name while guard says 防守',()=>{
 assert.match(html,/<button id="challenge-jump"[^>]+data-action="jump"[^>]*><span>跳躍<\/span>/);
 assert.match(html,/<button[^>]+data-hold="guard"[^>]*><span>防守<\/span>/);
 for(const action of ['special1','special2','special3','rally','assist'])assert.ok(html.includes(`data-action="${action}"`));
});
