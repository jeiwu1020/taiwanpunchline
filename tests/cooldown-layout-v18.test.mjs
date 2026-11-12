import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {stylesAt,padding} from './helpers/css-contracts.mjs';
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8'),html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const style=(viewport,...selectors)=>stylesAt(css,selectors,viewport),px=(s,key)=>parseFloat(s[key]);
test('all three controls preserve keys/names and expose a decorative filled sector without a live timer',()=>{
 const buttons=[...html.matchAll(/<button data-action="special([123])">([\s\S]*?)<\/button>/g)];assert.equal(buttons.length,3);
 for(const [index,[,,content]] of buttons.entries()){
  assert.ok(content.includes(`<kbd>${['U','I','O'][index]}</kbd>`));assert.match(content,/<strong>[^<]+<\/strong>/);
  assert.match(content,/class="cooldown" aria-hidden="true"/);assert.match(content,/<path class="cooldown-sector"/);assert.match(content,/class="cooldown-value">✓/);assert.match(content,/class="cooldown-label" aria-hidden="true">就緒/);
  assert.ok(!/aria-live|role="status"/.test(content));
 }
});
test('320px and 390px portrait budgets fit three 44px-or-larger specials and the movement row',()=>{
 for(const v of [{width:320,height:568},{width:390,height:844}]){
 const app=style(v,'.app'),cabinet=style(v,'.cabinet'),deck=style(v,'.control-deck'),movement=style(v,'.movement'),move=style(v,'.control-deck button','.movement button'),basic=style(v,'.control-deck button','.basic button'),specials=style(v,'.specials'),button=style(v,'.control-deck button','.specials button');
 const ap=padding(app),dp=padding(deck),width=v.width-ap[1]-ap[3]-6-dp[1]-dp[3];
 assert.ok(4*px(move,'min-width')+3*px(movement,'gap')+px(basic,'width')+px(deck,'gap')<=width);
 assert.ok((width-2*px(specials,'gap'))/3>=44);assert.ok(px(button,'height')>=44);
 assert.ok(px(move,'height')+px(button,'height')+px(deck,'gap')+dp[0]+dp[2]+3<=parseFloat(cabinet['grid-template-rows'].match(/(\d+)px$/)[1]));
 assert.equal(style(v,'.specials strong')['white-space'],'normal');assert.equal(style(v,'.specials small').display,'none');
 }
});
test('568×320, 667×375 and 844×390 landscape controls fit their declared vertical budget',()=>{
 for(const v of [{width:568,height:320},{width:667,height:375},{width:844,height:390}]){
  const app=style(v,'.app'),deck=style(v,'.control-deck'),movement=style(v,'.movement'),move=style(v,'.control-deck button','.movement button'),basic=style(v,'.control-deck button','.basic button'),specials=style(v,'.specials'),button=style(v,'.control-deck button','.specials button');
  const ap=padding(app),dp=padding(deck),columns=Number(movement['grid-template-columns'].match(/repeat\((\d+)/)[1]);
  const movementHeight=Math.ceil(4/columns)*px(move,'height')+(Math.ceil(4/columns)-1)*px(movement,'gap');
  const required=movementHeight+px(basic,'height')+3*px(button,'height')+2*px(specials,'gap')+2*px(deck,'gap')+dp[0]+dp[2];
  const available=v.height-ap[0]-ap[2]-44-px(app,'gap')-6;
  assert.ok(required<=available,`${v.width}×${v.height}: controls need ${required}px, have ${available}px`);
  assert.ok(px(button,'height')>=44);assert.ok(px(move,'height')>=44);
  const rows=button['grid-template-rows'].split(' ').map(parseFloat),bp=padding(button);
  assert.ok(rows.reduce((a,b)=>a+b,0)+bp[0]+bp[2]+4<=px(button,'height'),'sector and ready label fit within the button');
 }
});
test('desktop special controls keep readable wrapping and reduced-motion disables decorative animation',()=>{
 const v={width:1440,height:900};assert.ok(px(style(v,'.control-deck button','.specials button'),'min-height')>=44);assert.equal(style(v,'.specials strong')['white-space'],'normal');
 const ring=style({...v,reducedMotion:true},'.cooldown-sector');assert.equal(ring.transition,'none');assert.equal(ring.animation,'none');
});
