import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {stylesAt} from './helpers/css-contracts.mjs';

const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const html=read('index.html');
const sheets=[...html.matchAll(/<link\b[^>]*href="([^"?]+\.css)(?:\?[^\"]*)?"[^>]*>/g)].map(match=>match[1]);
const css=sheets.map(read).join('\n');
const style=selectors=>stylesAt(css,selectors,{width:844,height:390});

// These are CSS cascade contracts, not an emulation of browser gesture handling.
// Safari/device QA must additionally exercise real double taps and pinch gestures.
function expectManipulation(selectors,label){
 const action=style(selectors)['touch-action'];
 const gestures=new Set((action||'auto').split(/\s+/));
 assert.ok(gestures.has('manipulation')||(
  gestures.has('pan-x')&&gestures.has('pan-y')&&gestures.has('pinch-zoom')
 ),`${label} must suppress double-tap zoom while allowing native pan and pinch; got ${action||'auto'}`);
 assert.equal(gestures.has('none'),false,`${label} must not disable all browser gestures`);
}

test('safe-area body gutters suppress double-tap zoom without locking pinch or pan',()=>{
 // viewport-boot fits the shell INSIDE safe insets; its rule alone cannot cover
 // touches landing on the surrounding body near a notch or home indicator.
 expectManipulation(['body'],'body gutters');
});

test('the fitted game shell suppresses pinch and repeated-tap zoom while retaining pan',()=>{
 assert.equal(style(['#viewport-shell'])['touch-action'],'pan-x pan-y');
 expectManipulation(['#viewport-shell','html[data-allow-page-zoom="true"] #viewport-shell'],'accessible reading mode');
});

test('the noninteractive battle canvas permits pinch zoom rather than taking over gestures',()=>{
 expectManipulation(['#game canvas'],'battle canvas');
});

test('Phaser canvas touch handlers do not cancel native pinch gestures',()=>{
 // Execute the production constructor boundary with only the heavyweight Phaser
 // engine replaced. Its default input.touch.capture is true, which cancels
 // touchstart/touchmove even if CSS permits pinch zoom.
 const source=read('game.mjs'),start=source.lastIndexOf('try{new Phaser.Game(');
 assert.ok(start>=0,'game exposes its guarded engine startup');
 let config;
 runInNewContext(source.slice(start),{
  Arena:class{},Phaser:{CANVAS:1,Scale:{NONE:0,NO_CENTER:0},Game:function(value){config=value;}}
 });
 assert.ok(config,'the engine receives its production configuration');
 assert.equal(config.input?.touch?.capture,false,'native canvas gestures must not be preventDefault-ed by Phaser');
});

test('game controls retain exclusive multitouch handling instead of enabling browser drags',()=>{
 for(const selectors of [
  ['.control-deck','.app[data-touch="true"] .control-deck','.app[data-touch="true"][data-layout="landscape"] .control-deck','.app[data-touch="true"][data-layout] .control-deck'],
  ['#touch-stick'],
  ['button','.control-deck button','.app[data-touch="true"][data-layout="landscape"] .control-deck button','.app[data-touch="true"][data-layout] .control-deck button']
 ])assert.equal(style(selectors)['touch-action'],'none');
});

test('settings and details keep native scroll with pinch available through accessible reading mode',()=>{
 for(const selector of ['.settings-scroll','.detail-scroll']){
  const computed=style([selector]);
  assert.equal(computed.overflow,'auto',`${selector} remains an independent scroller`);
  const gestures=new Set(computed['touch-action'].split(/\s+/));
  for(const gesture of ['pan-x','pan-y'])assert.ok(gestures.has(gesture),`${selector} retains ${gesture}`);
  assert.equal(gestures.has('pinch-zoom'),false);
  expectManipulation([selector,`html[data-allow-page-zoom="true"] ${selector}`],`${selector} accessible reading mode`);
 }
 assert.equal(style(['#menu']).overflow,'auto','the roster remains scrollable');
});

test('native settings inputs, selection and range dragging are not replaced by a gesture lock',()=>{
 for(const selectors of [['input'],['select'],['textarea'],['[contenteditable]']]){
  assert.equal(style(selectors)['touch-action']??'auto','auto');
 }
 assert.equal(style(['input','input[type="range"]','.settings-audio-row input[type="range"]'])['touch-action'],'pan-x');
 assert.notEqual(style(['#help-dialog'])['user-select'],'none');
 assert.notEqual(style(['#help-dialog'])['-webkit-user-select'],'none');
});

test('the viewport keeps browser zoom available rather than capping user scale',()=>{
 const viewport=html.match(/<meta\b[^>]*name="viewport"[^>]*content="([^"]*)"[^>]*>/)?.[1];
 assert.ok(viewport,'game declares its viewport');
 const directives=new Map(viewport.split(',').map(part=>part.trim().toLowerCase().split('=')));
 assert.equal(directives.get('width'),'device-width');
 assert.equal(directives.get('initial-scale'),'1');
 assert.equal(directives.has('maximum-scale'),false);
 assert.equal(directives.has('minimum-scale'),false);
 assert.equal(directives.has('user-scalable'),false);
});


test('direction-pad hot region explicitly rejects browser gestures, including its non-knob area',()=>{
 assert.equal(style(['.touch-pad'])['touch-action'],'none');
 assert.equal(style(['#touch-stick'])['touch-action'],'none');
});
