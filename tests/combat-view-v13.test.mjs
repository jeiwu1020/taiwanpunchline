import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVE_READABILITY,guardView,moveCue,combatStatus} from '../dist/combat-view.mjs';
import {CAST} from '../dist/roster.mjs';
test('every named special exposes a concrete action and a counter with no new buttons',()=>{
 const kinds=Object.values(CAST).flatMap(c=>c.moves.map(m=>m.kind));
 assert.deepEqual(Object.keys(MOVE_READABILITY).sort(),kinds.sort());
 for(const k of kinds){const v=MOVE_READABILITY[k];assert.ok(v.action.length>8,k);assert.ok(v.counter.length>6,k);assert.ok(v.label.length<=7,k);assert.ok(moveCue(k).includes(v.label));}
});
test('guard HUD clamps exactly three pips and prioritizes an actual break',()=>{
 assert.deepEqual(guardView({guardPips:2}),{pips:2,broken:false,label:'防守 2/3'});
 assert.equal(guardView({guardPips:3,guardBroken:.2}).label,'破防！');
 assert.equal(guardView({guardPips:-2}).pips,0);assert.equal(guardView({guardPips:9}).pips,3);
});
test('persistent status distinguishes damaged armor, slow, crouch and exhausted guard',()=>{
 assert.equal(combatStatus({armor:.7}), '吃一擊不停手');
 assert.equal(combatStatus({slow:.5}), '腳步變慢');
 assert.equal(combatStatus({lowProfile:true}), '低身躲高招');
 assert.equal(combatStatus({guardBroken:.2,armor:.4}), '破防空檔');
 assert.equal(combatStatus({}), '');
});
test('guide rules do not invent voice clearance or promise universal invulnerability',()=>{
 const s=JSON.stringify(MOVE_READABILITY);
 assert.ok(!s.includes('已授權'));assert.ok(!s.includes('全程無敵'));
 assert.match(MOVE_READABILITY.ma_handshake.counter,/跳|退/);
 assert.match(MOVE_READABILITY.huang_debt.action,/反射|掉頭/);
 assert.match(MOVE_READABILITY.chen_dream.action,/折返|飛回/);
 assert.match(MOVE_READABILITY.ko_resolve.counter,/第二|抓/);
});
import {readFileSync} from 'node:fs';
test('both HUDs expose three visible guard pips and live state labels',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const s of ['p','e']){assert.ok(html.includes(`id="${s}-guard"`));assert.ok(html.includes(`id="${s}-status"`));assert.match(html,new RegExp(`id="${s}-guard"[^>]*>[\\s\\S]*?<i></i><i></i><i></i>`));}
 assert.ok(!html.includes('蹲下不會縮小受擊範圍'));assert.ok(!html.includes('不能躲招'));
});
test('combat scene renders queue, reflected direction, word marks and bounded readable labels',()=>{
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
 assert.match(source,/duel\.obstacles/);assert.match(source,/p\.kind==='word'/);
 assert.match(source,/p\.vx<0\?-1:1/);assert.match(source,/guardBreak/);assert.match(source,/armorAbsorb/);
 assert.match(source,/textPool/);assert.match(source,/moveCaption\(kind\)/);
 const readability=readFileSync(new URL('../dist/move-readability.mjs',import.meta.url),'utf8');assert.match(readability,/subtitle:moveCue\(kind\)/);
});
test('hit feedback follows high low and middle contact bands',async()=>{
 const {impactY}=await import('../dist/combat-view.mjs');
 assert.equal(impactY({to:{y:430},height:'high'}),178);
 assert.equal(impactY({to:{y:430},height:'low'}),365);
 assert.equal(impactY({to:{y:430},height:'mid'}),285);
});
