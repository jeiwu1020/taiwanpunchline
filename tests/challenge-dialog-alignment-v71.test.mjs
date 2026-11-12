import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {challengeDialogFrame,mountChallengeDialogViewport} from '../dist/challenge-dialog-viewport.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';

test('challenge panels anchor eight logical pixels below the same viewport top at every rotation',()=>{
 const cases=[
  {rotation:0,screenWidth:844,screenHeight:390,left:434,top:32},
  {rotation:90,screenWidth:390,screenHeight:844,left:394,top:446},
  {rotation:-90,screenWidth:390,screenHeight:844,left:20,top:446},
 ];
 for(const c of cases){
  const frame=challengeDialogFrame({width:844,height:390,left:12,top:24,rotation:c.rotation,screenWidth:c.screenWidth,screenHeight:c.screenHeight});
  assert.equal(frame.left,c.left,`rotation ${c.rotation}: logical top center X`);
  assert.equal(frame.top,c.top,`rotation ${c.rotation}: logical top center Y`);
  assert.equal(frame.maxHeight,374);
 }
 const portrait=challengeDialogFrame({width:390,height:844});
 assert.equal(portrait.left,195);assert.equal(portrait.top,8);
});

test('changing a dialog content height cannot recenter its top edge',()=>{
 for(const rotation of [0,90,-90]){
  const app={dataset:{rotation:String(rotation)},style:{width:'844px',height:'390px'}},shell={getBoundingClientRect:()=>({left:0,top:0,width:rotation?390:844,height:rotation?844:390})};
  const win={innerWidth:844,innerHeight:390,addEventListener(){},removeEventListener(){}},doc={defaultView:win,querySelector:s=>s==='.app'?app:shell};
  const dialog={ownerDocument:doc,dataset:{},style:{setProperty(){}},clientHeight:330};
  const binding=mountChallengeDialogViewport(dialog),initial={left:dialog.style.left,top:dialog.style.top};
  for(const contentHeight of [330,374,240,330]){
   dialog.clientHeight=contentHeight;binding.sync();
   assert.deepEqual({left:dialog.style.left,top:dialog.style.top},initial);
   assert.equal(dialog.style.transformOrigin,'50% 0');
   assert.equal(dialog.style.transform,`translate(-50%,0) rotate(${rotation}deg)`);
  }
  binding.destroy();
 }
});

test('the corner close stays above scrolling pages and outside compact header columns',()=>{
 const css=readFileSync(new URL('../dist/challenge.css',import.meta.url),'utf8');
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:568,height:320}]){
  const tools=stylesAt(css,['.challenge-tools'],viewport);
  assert.equal(tools.position,'sticky');assert.equal(tools.top,'0');assert.equal(tools.height,'0');
  assert.ok(Number(tools['z-index'])>20,'close stays above the floating chooser');
  const close=stylesAt(css,['.challenge-dialog button','.challenge-dialog .challenge-close'],viewport);
  assert.equal(close.position,'absolute');assert.equal(close.top,'8px');assert.equal(close.right,'8px');
  assert.ok(parseFloat(close.width)>=44);assert.ok(parseFloat(close['min-height'])>=44);
  const header=stylesAt(css,['.challenge-dialog[data-view] .challenge-head'],viewport);
  assert.ok(parseFloat(header['padding-right'])>=52,'title reserves a close-button gutter');
  const tabs=stylesAt(css,['.challenge-dialog[data-compact="true"][data-layout="landscape"][data-view] .challenge-tabs'],viewport);
  assert.ok(parseFloat(tabs['padding-right'])>=52,'compact tabs reserve the same corner gutter');
 }
});
