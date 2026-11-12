import test from 'node:test';
import assert from 'node:assert/strict';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';

for(const overlay of ['#pause-screen','#result','#home-confirm','#menu'])test(`portrait ${overlay} fills the cabinet without a reserved control row and restores controls on dismiss`,()=>{
 for(const width of [320,390,430])for(const depth of [false,true]){
  const h=combatStyles({portrait:true,width,height:844,depth}),panel=h.document.querySelector(overlay);
  const before=h.style('.cabinet')['grid-template-rows'];assert.equal(before,'none');
  panel.classList.remove('hidden');
  assert.equal(h.style('.cabinet')['grid-template-rows'],'none',`${width}px, depth ${depth}`);
  assert.equal(h.style('.control-deck').visibility,'hidden');
  assert.equal(h.style('.control-deck button')['pointer-events'],'none');
  panel.classList.add('hidden');assert.equal(h.style('.cabinet')['grid-template-rows'],before);assert.equal(h.style('.control-deck').display,'grid');h.close();
 }
});
test('portrait nested retry/home cancellation keeps the full pause surface until resume',()=>{
 const h=combatStyles({portrait:true,width:390,height:844,depth:true});
 const pause=h.document.querySelector('#pause-screen'),home=h.document.querySelector('#home-confirm'),retry=h.document.querySelector('#restart-confirm');
 pause.classList.remove('hidden');retry.hidden=false;assert.equal(h.style('.cabinet')['grid-template-rows'],'none');
 home.classList.remove('hidden');retry.hidden=true;home.classList.add('hidden');assert.equal(h.style('.cabinet')['grid-template-rows'],'none');
 pause.classList.add('hidden');assert.equal(h.style('.cabinet')['grid-template-rows'],'none');h.close();
});
test('hidden restart button stays hidden despite the menu-action display rule',()=>{
 const h=combatStyles({portrait:true,width:390,height:844});h.document.querySelector('#pause-screen').classList.remove('hidden');
 const button=h.document.querySelector('#restart-match');button.hidden=true;assert.equal(h.style(button).display,'none');
 button.hidden=false;assert.equal(h.style(button).display,'block');h.close();
});
test('portrait overlay repair does not change wide layout geometry',()=>{
 for(const options of [{touch:false,width:1280,height:800},{width:844,height:390},{width:390,height:844,sideways:true}]){
  const h=combatStyles(options),rows=h.style('.cabinet')['grid-template-rows'];
  h.document.querySelector('#pause-screen').classList.remove('hidden');assert.equal(h.style('.cabinet')['grid-template-rows'],rows);h.close();
 }
});
