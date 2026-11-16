import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../dist/${path}`,import.meta.url),'utf8');
const chapters=[
 ['chapter2/chapter2-playable.mjs','chapter2/index.html'],
 ['chapter3/chapter2-playable.mjs','chapter3/index.html'],
 ['chapter4/chapter4-playable.mjs','chapter4/index.html'],
 ['chapter5/chapter5-playable.mjs','chapter5/index.html']
];

for(const [index,[playablePath,pagePath]] of chapters.entries()){
 const number=index+2;
 test(`chapter ${number} does not announce recruitment twice across boss result and unlock card`,async()=>{
  const source=await read(`preview/${playablePath}`);
  assert.doesNotMatch(source,/outcome\.subtitle\s*\+\s*\(s\.result\.matchWon\s*&&\s*s\.stepId\s*===\s*'boss'[^\n]*加入/);
 });
 test(`chapter ${number} renders the unlock card in the shared chapter-one paper style`,async()=>{
  const html=await read(`preview/${pagePath}`);
  const card=html.match(/<div id="choice-panel"[\s\S]*?<\/section>/)?.[0]??'';
  assert.match(card,/class="card compact paper choice-paper"/);
 });
}
