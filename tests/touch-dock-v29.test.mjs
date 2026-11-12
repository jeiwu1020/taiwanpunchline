import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';
const path=new URL('../dist/interface-v29.css',import.meta.url);
const css=()=>readFileSync(path,'utf8');
const touch='.app[data-touch="true"][data-layout]';
const landscape='.app[data-touch="true"][data-layout="landscape"]';
const portrait='.app[data-touch="true"][data-layout="portrait"]';
function style(part,mode,width,height){return stylesAt(css(),[`${touch} ${part}`,`${mode} ${part}`],{width,height});}

test('native and rotated landscape reserve a separate controls row rather than placing buttons over fighters',()=>{
 for(const [width,height]of[[568,320],[844,390]]){
  const cabinet=style('.cabinet',landscape,width,height),stage=style('.stage-wrap',landscape,width,height),deck=style('.control-deck',landscape,width,height);
  assert.equal(cabinet.display,'grid');assert.equal(cabinet['grid-template-columns'],'minmax(0,1fr)');assert.equal(cabinet['grid-template-rows'],'minmax(0,1fr) 104px');
  assert.equal(stage.position,'relative');assert.equal(deck.position,'relative');assert.equal(deck.display,'grid');
  assert.equal(deck['grid-template-columns'],'84px minmax(0,1fr) 96px');
  // 10px app vertical padding + 40px header + 4px gap + 6px cabinet border.
  assert.ok(height-60-104>=156);
 }
});

test('rotation off reuses touch stick, guard, jump and attack below arena even at 320px wide',()=>{
 for(const [width,height]of[[320,568],[390,720]]){
  assert.equal(style('.movement',portrait,width,height).display,'none');
  assert.equal(style('.touch-pad',portrait,width,height).display,'flex');assert.equal(style('.touch-aux',portrait,width,height).display,'flex');
  assert.equal(style('.cabinet',portrait,width,height)['grid-template-rows'],'minmax(0,1fr) 216px');
  assert.equal(style('.control-deck',portrait,width,height)['grid-template-columns'],'88px minmax(0,1fr) 64px');
  assert.equal(style('.specials',portrait,width,height)['grid-column'],'1 / -1');
  // Smallest portrait: 16px app padding, 6px border, 16px deck padding,
  // joystick 88 + attack 64 + gaps 12 leaves two 44px aux targets plus 6px gap.
  assert.ok(width-16-6-16-88-64-12>=94);
  assert.ok(height-12-64-6-6-216>=260);
 }
});

test('touch move labels and cooldown discs are larger while purpose stays visible',()=>{
 const strong=style('.specials strong',landscape,568,320),disc=style('.specials .cooldown',landscape,568,320),purpose=style('.specials small',landscape,568,320);
 assert.match(strong['font-size'],/14px/);assert.equal(disc.width,'32px');assert.equal(disc.height,'32px');assert.equal(purpose.display,'block');
 assert.equal(style('.touch-aux button',portrait,320,568)['min-width'],'44px');
 assert.equal(style('.specials button',landscape,568,320)['min-height'],'44px');
});
