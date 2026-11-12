import test from 'node:test';
import assert from 'node:assert/strict';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
const actions=['.rally-button','.assist-button','#challenge-jump','[data-hold="guard"]','.punch'];
const deck='.control-deck',specials=`${deck} .specials`;
test('portrait D keeps fixed 52px utilities and 110x52px specials at every approved phone width',()=>{
 for(const width of [320,360,375,390,430])for(const depth of [false,true]){const h=combatStyles({portrait:true,width,height:844,depth}),d=h.style(deck),s=h.style(specials);
  assert.equal(d['--action-size'],'52px');assert.equal(d['--special-height'],'52px');
  assert.equal(s.display,'grid');assert.equal(s.position,'relative');assert.equal(s.width,'226px');assert.equal(s.height,'110px');assert.equal(s['grid-column'],'2/6');assert.equal(s['grid-row'],'1/3');
  assert.equal(s['pointer-events'],'none','empty lower-right wrapper cell cannot intercept assist/jump');
  for(const [i,col,row]of [[1,'1','2'],[2,'1','1'],[3,'2','1']]){const selector=`${specials} button:nth-child(${i})`,button=h.style(selector),name=h.style(`${selector} strong`);
   assert.equal(button.width,'110px');assert.equal(button.height,'52px');assert.equal(button['grid-column'],col);assert.equal(button['grid-row'],row);assert.equal(button['pointer-events'],'auto');assert.equal(name['white-space'],'nowrap');
  }
  assert.deepEqual(actions.map(a=>{const s=h.style(`${deck} ${a}`);return[s['grid-column'],s['grid-row']];}),[['3','3'],['4','2'],['5','2'],['4','3'],['5','3']]);
  for(const key of h.document.querySelectorAll(`${deck} kbd`))assert.equal(h.style(key).display,'none');
  const inner=h.cabinetWidth-16,stick=Math.min(100,inner-226-6);assert.ok(stick>=56&&stick<=100);assert.ok(stick+6+226<=inner);if(width>=375)assert.equal(stick,100);h.close();
 }
});
test('single-line fitting is available on landscape and desktop without changing their control geometry',()=>{
 for(const options of [{touch:false,width:1200},{width:844,height:390},{width:320,height:568,sideways:true}]){const h=combatStyles(options),s=h.style(specials),n=h.style(`${specials} strong`);
  assert.equal(n['white-space'],'nowrap');assert.equal(n['overflow-wrap'],'normal');
  if(options.touch===false){assert.equal(h.style(deck)['--action-size'],'64px');assert.equal(s['grid-column'],'7');}
  else{assert.equal(h.style(deck)['--action-size'],'54px');assert.equal(s['grid-column'],'3/8');}h.close();
 }
});
test('portrait HUD still retains its pre-change cascade',()=>{
 const options={portrait:true,width:390,height:844},before=combatStyles({...options,exclude:['combat-controls-v73.css']}),after=combatStyles(options);
 for(const selector of ['.stage-wrap','.dom-hud','.hud-side','.hud-name','.hp-track','.timer'])assert.deepEqual(after.style(selector),before.style(selector));before.close();after.close();
});
test('52px portrait utility buttons retain complete four-character secondary labels',()=>{
 const h=combatStyles({portrait:true,width:320,height:568});
 for(const action of actions){const selector=`${deck} ${action}`,small=h.document.querySelector(`${selector} small`);if(!small)continue;
  const button=h.style(selector),text=h.style(small),inner=52-6-parseFloat(button['padding-left'])-parseFloat(button['padding-right']);
  assert.ok([...small.textContent].length*parseFloat(text['font-size'])<=inner,`${small.textContent} fits the fixed utility width`);
 }h.close();
});
test('unexpected overflow is visibly exposed rather than clipped inside a fixed card',()=>{
 const h=combatStyles({portrait:true,width:320,height:568}),name=h.document.querySelector(`${specials} strong`);name.dataset.nameFitOverflow='true';
 assert.equal(h.style(`${specials} button`).overflow,'visible');h.close();
});
