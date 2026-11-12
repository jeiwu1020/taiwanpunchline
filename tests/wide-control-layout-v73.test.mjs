import test from 'node:test';
import assert from 'node:assert/strict';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
const actions=['.rally-button','.assist-button','#challenge-jump','[data-hold="guard"]','.punch'];
const deck='.control-deck',specials=`${deck} .specials`,card=`${specials} button`,movement=`${deck} .movement`;
const num=value=>parseFloat(value);
const desktopWidths=[650,740,844,1028,1200,1440];

test('desktop places utility controls after movement and lets specials fill the far right',()=>{
 for(const width of desktopWidths){const h=combatStyles({touch:false,width}),s=h.style(specials),d=h.style(deck),positions=actions.map(a=>h.style(`${deck} ${a}`));
  assert.ok(positions.every(p=>Number(p['grid-column'])>1&&Number(p['grid-column'])<Number(s['grid-column'])),'utility cells lie between movement and specials');
  assert.equal(s.width,'100%');assert.equal(s['max-width'],'none');
  assert.equal(d['--special-height'],d['--action-size']);
  assert.equal(new Set(positions.map(p=>`${p['grid-column']}:${p['grid-row']}`)).size,5);
  assert.ok(positions.every(p=>p['align-self']===s['align-self']),'utility and special cards share the row alignment');
  const columns=new Set(positions.map(p=>p['grid-column'])).size;
  const required=num(d['--movement-width'])+columns*num(d['--action-size'])+num(d['--special-min-width'])+(columns+1)*num(d['column-gap'])+num(d['padding-left'])+num(d['padding-right']);
  assert.ok(required<=h.cabinetWidth,`${width}px desktop requires ${required}px, available ${h.cabinetWidth}px`);
  assert.match(d['grid-template-columns'],/minmax\(var\(--special-min-width\),1fr\)$/);
  if(width>=1200)assert.equal(d['column-gap'],'8px','retain existing desktop utility spacing');h.close();
 }
});
test('desktop movement squares match attack size and carry thicker, larger arrows',()=>{
 for(const width of desktopWidths){const h=combatStyles({touch:false,width}),d=h.style(deck),button=h.style(`${movement} button`),arrow=h.style(`${movement} span`);
  assert.equal(button.width,'var(--action-size)');assert.equal(button.height,'var(--action-size)');
  assert.ok(num(d['--action-size'])>=54);assert.ok(num(arrow['font-size'])>=28);assert.ok(num(arrow['-webkit-text-stroke'])>=1);
  assert.equal(h.style(`${movement} small`).display,'none');h.close();
 }
});
test('landscape and CSS-sideways keep three specials above five equal utilities',()=>{
 for(const depth of [false,true])for(const [width,height,sideways]of [[844,390,false],[650,320,false],[568,320,false],[390,844,true],[320,568,true]]){
  const h=combatStyles({depth,width,height,sideways}),d=h.style(deck),s=h.style(specials),positions=actions.map(a=>h.style(`${deck} ${a}`));
  assert.equal(s['grid-column'],'3/8');assert.equal(s['grid-row'],'1');assert.equal(s.width,'100%');assert.equal(s['max-width'],'none');
  assert.deepEqual(positions.map(p=>p['grid-column']),['3','4','5','6','7']);assert.ok(positions.every(p=>p['grid-row']==='2'));
  assert.equal(d['--action-size'],'54px');assert.equal(d['--special-height'],'54px');
  const required=num(d['--movement-width'])+5*54+6*num(d['column-gap']);assert.ok(required<=h.cabinetWidth-24,'complete control groups fit the narrow logical deck');
  const labelStyles=actions.map(a=>h.style(`${deck} ${a} span`));assert.equal(new Set(labelStyles.map(s=>`${s['font-size']}:${s['line-height']}`)).size,1);
  const buttonStyles=actions.map(a=>h.style(`${deck} ${a}`));assert.equal(new Set(buttonStyles.map(s=>`${s['justify-content']}:${s['padding-top']}`)).size,1);
  for(const key of h.document.querySelectorAll(`${deck} kbd`))assert.equal(h.style(key).display,'none','no keyboard hints on a phone landscape');h.close();
 }
});
test('single-line special names have separate footer room, with centered desktop keys',()=>{
 for(const options of [{touch:false,width:1200},{touch:false,width:740},{width:568,height:320},{width:320,height:568,sideways:true}]){
  const h=combatStyles(options),d=h.style(deck),c=h.style(card),name=h.style(`${card} strong`),cd=h.style(`${card} .cooldown`),key=h.style(`${card} kbd`);
  assert.equal(name['white-space'],'nowrap');
  assert.ok(num(name['line-height'])+num(d['--special-footer'])+6+num(c['padding-top'])*2<=num(d['--special-height']),'single-line name cannot collide with the footer');
  assert.equal(cd.position,'absolute');assert.notEqual(cd.right,'auto');assert.notEqual(cd.bottom,'auto');
  assert.equal(cd.visibility,'hidden','no ready checkmark');
  h.document.querySelector(card).classList.add('cooling');assert.notEqual(h.style(`${card} .cooldown`).visibility,'hidden','live cooldown remains visible');
  if(options.touch===false){assert.equal(key['grid-column'],'1');assert.equal(key['justify-self'],'center');}
  h.close();
 }
});
test('wide HUD gives names, health bars, guard row, and item status their own visible space',()=>{
 for(const options of [{touch:false,width:1200},{width:844,height:390},{width:320,height:568,sideways:true}]){
  const h=combatStyles(options),name=h.style('.hud-name'),bar=h.style('.hp-track'),side=h.style('.hud-side'),stage=h.style('.stage-wrap');
  assert.ok(num(name['font-size'])>=20);assert.ok(num(bar.height)>=11);assert.equal(side['grid-template-rows'],'24px 11px 11px');
  assert.equal(stage.position,'absolute','full-stage canvas stays behind the HUD');
  assert.equal(h.style('.dom-hud').position,'absolute','HUD overlays without reducing canvas');
  assert.equal(h.style('#item-status').position,'absolute');h.close();
 }
});

// Catch label/key overlaps at the actual compact card height, rather than only
// asserting that both pieces of text exist in the DOM.
test('desktop utility hints finish above the separately centered keyboard row',()=>{
 for(const width of [650,740,1200]){const h=combatStyles({touch:false,width}),size=num(h.style(deck)['--action-size']);
  for(const action of ['.rally-button','.assist-button','.punch','[data-hold="guard"]']){
   const selector=`${deck} ${action}`,button=h.style(selector),name=h.style(`${selector} span`),hint=h.style(`${selector} small`),key=h.style(`${selector} kbd`);
   const hintBottom=3+num(button['padding-top'])+num(name['line-height'])+num(button.gap)+num(hint['line-height']);
   const keyTop=size-3-num(key.bottom)-num(key['line-height']);
   assert.ok(hintBottom<=keyTop,`${width}px ${action}: hint ends at ${hintBottom}, key begins at ${keyTop}`);
  }h.close();
 }
});
test('desktop special footer reserves room beside a centered key for a two-digit countdown',()=>{
 for(const width of desktopWidths){const h=combatStyles({touch:false,width}),d=h.style(deck),key=h.style(`${card} kbd`),cd=h.style(`${card} .cooldown`);
  h.document.querySelector(card).classList.add('cooling');const value=h.style(`${card} .cooldown-value`);
  const minCard=(num(d['--special-min-width'])-12)/3;
  // Monospaced digits are approximately .6em. Budget .62em, including a
  // reduced-size unit and its existing 1px margin, rather than exact glyph QA.
  const keyRight=minCard/2+num(key['font-size'])*.62/2;
  const secondsLeft=minCard-3-num(cd.right)-(4+.6)*num(value['font-size'])*.62-1;
  assert.ok(keyRight<=secondsLeft,`${width}px: key ends ${keyRight}, countdown starts ${secondsLeft}`);
  assert.equal(cd['grid-area'],'auto','absolute footer must not keep the old second grid column');
  h.close();
 }
});

test('narrow landscape rally status uses the same line height as the other phone sizes',()=>{
 for(const options of [{width:568,height:320},{width:320,height:568,sideways:true}]){const h=combatStyles(options),label=h.style('.rally-label');
  assert.equal(label['font-size'],'11px');assert.equal(label['line-height'],'13px');h.close();
 }
});
