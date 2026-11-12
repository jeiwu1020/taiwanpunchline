import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CAST} from '../dist/roster.mjs';
const aliases={wang:['恰吉王','王世堅'],han:['韓國魚','韓國瑜'],ma:['小馬哥','馬英九'],su:['電火球','蘇貞昌'],huang:['咆哮哥','黃國昌'],chen:['阿扁仔','陳水扁'],ko:['柯P','柯文哲']};
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all seven stable IDs use exact chosen display names and separate real source attribution',()=>{
 assert.deepEqual(Object.keys(CAST),Object.keys(aliases));
 for(const[id,[name,sourceName]]of Object.entries(aliases)){assert.equal(CAST[id].name,name);assert.equal(CAST[id].sourceName,sourceName);}
});
test('V13 keeps stable move names, portraits and factual sources while explicitly changing rules',()=>{
 const baseline=JSON.parse(read('tests/fixtures/roster-v11-gameplay.json'));
 for(const[id,c]of Object.entries(CAST)){
  assert.equal(c.portrait,baseline[id].portrait);
  for(const[i,m]of c.moves.entries())for(const key of ['kind','name','word','source','sourceText','sourceMeme','sourceNote','intendedName','fictional'])assert.equal(m[key],m.kind==='chen_calm'&&['name','word'].includes(key)?'有這麼嚴重嗎':baseline[id].moves[i][key],id+' '+key);
 }
});
test('move guide uses aliases as headings and real names only as labelled provenance',()=>{
 const page=read('dist/moves.html');
 for(const[name,real]of Object.values(aliases)){assert.ok(page.includes(`<h2>${name} `));assert.ok(page.includes(`來源人物：${real}`));assert.ok(!page.includes(`<h2>${real} `));}
 assert.match(page,/韓國瑜「高雄發大財」/);assert.match(page,/兩個使用者提供音檔/);
});
test('static menu and art fallbacks use aliases while audio source stays truthful',()=>{
 const html=read('dist/index.html'),art=read('dist/art.html');
 assert.ok(art.includes('value="wang">恰吉王</option>'));assert.ok(art.includes('value="han">韓國魚</option>'));
 assert.match(html,/<strong id="player-name">恰吉王<\/strong>/);assert.match(html,/<strong id="opponent-name">韓國魚<\/strong>/);
 assert.ok(html.includes('alt="恰吉王原創諷刺漫畫"'));assert.ok(html.includes('韓國瑜於 2019-05-13'));
 assert.match(read('dist/voice-slots.mjs'),/馬英九東吳演講咳嗽/);
});
test('V13 preserves the verified existing audio bytes instead of substituting an imitation',()=>{
 const bytes=readFileSync(new URL('../dist/assets/voice/han-fa-da-cai-20190513.mp3',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'eda509cd3c4847a52237c88dbdcfc71cfa660aeb06375000d290504bf8ab4492');
 assert.match(read('dist/voice-slots.mjs'),/ma_cough:\{src:'assets\/voice\/user-cough-full-v14.mp3',originalVerified:false,userProvided:true/);
});
