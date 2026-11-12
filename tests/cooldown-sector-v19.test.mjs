import test from 'node:test';
import assert from 'node:assert/strict';
import * as cooldown from '../dist/cooldown-view.mjs';
import {readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';

const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
// Catch reversed sweep, a missing center join, and stroke-only progress: each
// literal is a hand-derived portion of a 17px radius disk starting at 12 o'clock.
test('cooldown geometry fills the whole disk and then center-connected quarter, half and three-quarter sectors',()=>{
 assert.equal(typeof cooldown.cooldownSectorPath,'function','missing solid-sector geometry');
 for(const [ratio,expected] of [
  [1,'M20 20 L20 3 A17 17 0 1 1 20 37 A17 17 0 1 1 20 3 Z'],
  [.75,'M20 20 L20 3 A17 17 0 1 1 3 20 Z'],
  [.5,'M20 20 L20 3 A17 17 0 0 1 20 37 Z'],
  [.25,'M20 20 L20 3 A17 17 0 0 1 37 20 Z'],
  [0,'']
 ])assert.equal(cooldown.cooldownSectorPath(ratio),expected);
});
test('colored area declines with true remaining time without an inner hole or an early ready state',()=>{
 assert.equal(typeof cooldown.cooldownSectorPath,'function');
 let previousArea=Math.PI*17*17;
 for(const remaining of [5.4,4.2,3,1.2,.01]){
  const view=cooldown.cooldownView(remaining,6),path=cooldown.cooldownSectorPath(view.ratio);
  const match=path.match(/^M20 20 L20 3 A17 17 0 ([01]) 1 ([\d.-]+) ([\d.-]+) Z$/);
  assert.ok(match,'sector must run from center to outer edge with one arc, not a hollow ring');
  const x=Number(match[2])-20,y=Number(match[3])-20;
  assert.ok(Math.abs(Math.hypot(x,y)-17)<.00001,'endpoint stays on the outside of the disk');
  let angle=Math.atan2(x,-y);if(angle<0)angle+=Math.PI*2;
  assert.equal(Number(match[1]),angle>Math.PI?1:0,'large arc chooses remaining area, not elapsed area');
  const area=angle*17*17/2;
  assert.ok(area>0&&area<previousArea,'every positive countdown retains a smaller visible sector');
  assert.ok(Math.abs(area/(Math.PI*17*17)-remaining/6)<.000001);
  assert.equal(view.ready,false);previousArea=area;
 }
});
test('sector clamps invalid/overflow inputs and no positive countdown is labeled ready',()=>{
 assert.equal(typeof cooldown.cooldownSectorPath,'function');
 for(const input of [0,-1,NaN,Infinity,undefined])assert.equal(cooldown.cooldownSectorPath(input),'');
 assert.equal(cooldown.cooldownSectorPath(4),'M20 20 L20 3 A17 17 0 1 1 20 37 A17 17 0 1 1 20 3 Z');
 assert.notEqual(cooldown.cooldownSectorPath(.000001),'');
 assert.equal(cooldown.cooldownView(.000001,6).value,'0.1');
});
test('painted countdown is filled rather than stroked and text does not mask it into a donut',()=>{
 const v={width:390,height:844};
 const sector=stylesAt(css,['.cooldown-sector'],v),track=stylesAt(css,['.cooldown-track'],v),value=stylesAt(css,['.cooldown-value'],v);
 assert.ok(sector.fill&&sector.fill!=='none','remaining time must color the interior');
 assert.equal(sector.stroke,'none');assert.ok(track.fill&&track.fill!=='none');
 assert.equal(value.background,undefined,'numeric text must not punch a round hole through the sector');
 assert.ok(value['text-shadow'],'numbers have contrasting edges instead of an opaque center mask');
});
test('item feedback has a single non-interactive HUD slot and stays visible in portrait and landscape',()=>{
 assert.equal((html.match(/id="item-status"/g)||[]).length,1);
 assert.match(html,/<span id="item-status"[^>]*role="status"[^>]*>走近拿道具 · 攻擊鍵投擲<\/span>/);
 assert.equal((html.match(/data-action="special[123]"/g)||[]).length,3);
 for(const [width,height] of [[320,568],[390,844],[568,320],[667,375],[1440,900]]){
  const v={width,height},status=stylesAt(css,['#item-status'],v),hud=stylesAt(css,['.dom-hud'],v);
  assert.equal(status['grid-column'],'1 / -1');assert.notEqual(status.display,'none');
  assert.equal(hud['row-gap'],'3px');assert.equal(status['pointer-events'],'none');
  assert.ok(parseFloat(status['font-size'])>=9);assert.equal(status['white-space'],'nowrap');
  assert.equal(status['max-width'],'100%');
 }
});
