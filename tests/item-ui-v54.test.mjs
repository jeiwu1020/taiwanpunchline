import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
test('V54 ready mobile meter overrides touch control color with legible dark-on-green',()=>{
 const css=read('rally-controls.css');
 assert.match(css,/\.app\[data-touch\] \.basic \.rally-button\.ready\{color:#082c26;background:#7df3bd!important/);
 assert.match(css,/\.rally-button:not\(\.ready\) \.rally-label\{background:#173e36/);
 assert.match(css,/\.rally-button:disabled\{opacity:1/);
});
test('V54 finish and result selection protection stays scoped away from settings and inputs',()=>{
 const css=read('match-finish.css');
 assert.match(css,/#result,#result \*/);
 assert.match(css,/-webkit-user-select:none;user-select:none;-webkit-touch-callout:none/);
 assert.doesNotMatch(css,/(?:^|\})\s*(?:html|body|input|dialog|#help-dialog|\*)\s*\{/);
});
