import test from 'node:test';
import assert from 'node:assert/strict';
import {CAST,Duel,GROUND} from '../dist/core.mjs';

const IDS=['wang','han','ma','su','huang','chen','ko'];
const tick=(g,seconds,input={},ai=false)=>{for(let time=0;time<seconds-1e-8;time+=1/120)g.step(Math.min(1/120,seconds-time),input,ai);};
const seeded=(seed=246813579)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);

test('roster exposes seven distinct playable IDs with complete UI and move metadata',()=>{
 assert.deepEqual(Object.keys(CAST),IDS);
 for(const [id,character] of Object.entries(CAST)){
  for(const key of ['name','tag','tip','roast','portrait','colorCSS'])assert.equal(typeof character[key],'string',`${id}.${key}`);
  assert.ok(character.name&&character.tip&&character.roast);
  assert.match(character.portrait,/^assets\/.+\.webp$/);
  assert.match(character.colorCSS,/^#[0-9a-f]{6}$/i);
  assert.ok(Number.isInteger(character.color));
  assert.equal(character.moves.length,3);
  for(const move of character.moves){
   for(const key of ['name','hint','kind'])assert.equal(typeof move[key],'string',`${id}.${key}`);
   assert.ok(Number.isFinite(move.cooldown)&&move.cooldown>0);
   assert.equal(typeof move.fictional,'boolean');
  }
 }
 for(const id of ['ma','su','huang'])assert.equal(CAST[id].portrait,`assets/${id}-head-v${id==='su'?8:5}.webp`);
});

test('signature metadata distinguishes text sources, cough sound and name interpretation from original audio',()=>{
 const expected=[['ma',0,'謝謝指教','https://news.tvbs.com.tw/politics/377788'],['su',0,'在那叫什麼','https://ivod.ly.gov.tw/Demand/Speech/136457'],['huang',0,'太離譜了','https://kuochang.tw/quote/Beyavja1r7'],['chen',2,'有這麼嚴重嗎','https://www.youtube.com/watch?v=2XE0FXgjw2s'],['ko',0,'垃圾不分藍綠','https://www.cna.com.tw/news/aloc/201611140250.aspx']];
 for(const [id,slot,word,url] of expected){const move=CAST[id].moves[slot];assert.equal(move.word,word);assert.equal(move.source,url);}
 for(const character of Object.values(CAST))for(const move of character.moves){
  assert.equal(move.fictional,true);assert.equal(move.audio,undefined);
  if(move.source){assert.match(move.sourceNote,/未聽驗/);assert.match(move.sourceNote,/未確認影音再利用權/);}
 }
 assert.equal(CAST.ma.moves[2].word,'咳、咳');assert.equal(CAST.ma.moves[2].memeType,'cough');assert.match(CAST.ma.moves[2].sourceNote,/不是配偶或本人說出的三字引言/);
 assert.equal(CAST.ko.moves[1].intendedName,'賴清德');assert.match(CAST.ko.moves[1].sourceNote,/迷因解讀/);
 assert.match(CAST.han.moves[1].sourceNote,/兩個事件拼接/);assert.match(CAST.huang.moves[2].sourceNote,/指控/);
 assert.equal(CAST.chen.moves[2].sourceText,'https://news.pts.org.tw/article/359147');
});

test('optional fourth opponent argument preserves legacy defaults and supports mirrored matches',()=>{
 assert.equal(new Duel().enemy.type,'han');
 assert.equal(new Duel('han').enemy.type,'wang');
 for(const id of IDS){
  assert.equal(new Duel(id).enemy.type,id==='wang'?'han':'wang');
  const g=new Duel(id,'normal',undefined,id);
  assert.equal(g.player.type,id);assert.equal(g.enemy.type,id);assert.equal(g.difficulty,'normal');
  assert.notEqual(g.player,g.enemy);assert.notEqual(g.player.cooldowns,g.enemy.cooldowns);
 }
});

test('invalid player and explicit opponent IDs fail immediately rather than creating corrupt matches',()=>{
 for(const invalid of ['',null,0,{},[],['ma'],'missing','constructor','toString','__proto__']){
  assert.throws(()=>new Duel(invalid),{name:'RangeError'},`player ${String(invalid)}`);
  assert.throws(()=>new Duel('wang','easy',Math.random,invalid),{name:'RangeError'},`opponent ${String(invalid)}`);
 }
});

for(const player of IDS)for(const opponent of IDS)test(`${player} vs ${opponent}: selected pair stays finite and AI attacks and recovers`,()=>{
 const g=new Duel(player,'normal',seeded(),opponent);
 assert.equal(g.player.type,player);assert.equal(g.enemy.type,opponent);
 tick(g,22,{},true);
 assert.ok(g.player.hp<g.player.maxHp,`${opponent} AI must damage its opponent`);
 for(const f of [g.player,g.enemy]){
  for(const key of ['x','y','hp','counter','brace','stun'])assert.ok(Number.isFinite(f[key]),key);
  assert.ok(f.x>=68&&f.x<=892);assert.ok(f.hp>=0&&f.hp<=f.maxHp);
  assert.ok(f.cooldowns.every(t=>Number.isFinite(t)&&t>=0));
  assert.ok(!f.attack||f.attack.age<1.2,'AI must not be trapped in an unfinished attack');
 }
});
