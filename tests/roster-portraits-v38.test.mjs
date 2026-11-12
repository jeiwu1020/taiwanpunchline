import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stylesAt,padding} from './helpers/css-contracts.mjs';
const css=readFileSync(new URL('../dist/roster-picker.css',import.meta.url),'utf8');
const landscape='.app[data-touch="true"][data-layout="landscape"]';
const compact='.app[data-touch="true"][data-compact="true"]';
const portrait='.app[data-touch="true"][data-layout="portrait"]';
const num=(v,fallback=0)=>Number.parseFloat(v)||fallback;
function length(value,available,v){
 if(!value||value==='none')return Infinity;
 if(value==='100%')return available;
 if(value.startsWith('clamp(')){const [lo,preferred,hi]=value.slice(6,-1).split(',');return Math.max(num(lo),Math.min(preferred.includes('vh')?num(preferred)*v.height/100:num(preferred),num(hi)));}
 return num(value);
}
// CSS-contract budget tests, not a replacement for painted CUA verification.
// These catch the old 34px cap and height-based vh sizing on small phones.
for(const c of [
 {name:'desktop',width:1180,height:757,prefix:[],tile:[138,170],minimum:110},
 {name:'landscape phone',width:844,height:390,prefix:[landscape],tile:[104,108],minimum:70},
 {name:'compact landscape phone',width:568,height:320,prefix:[landscape,compact],tile:[68,86],minimum:50},
 {name:'upright phone',width:390,height:720,prefix:[portrait],tile:[84,0],menuHeight:652,minimum:66},
 {name:'small upright phone',width:320,height:568,prefix:[portrait],tile:[66.5,0],menuHeight:500,minimum:50}
])test(`${c.name} roster spends its available image slot on a recognizably larger head`,()=>{
 const selectors=s=>[s,...c.prefix.map(p=>p+' '+s)];
 const button=stylesAt(css,selectors('.roster-option'),c),img=stylesAt(css,selectors('.roster-option img'),c),name=stylesAt(css,selectors('.roster-option strong'),c);
 const p=padding(button),border=num(button['border-width']||button.border,2);
 let tileHeight=c.tile[1];
 if(c.menuHeight){
  const menu=stylesAt(css,['#menu',portrait+' #menu'],c),mp=padding(menu);
  const heading=stylesAt(css,['.selection-heading h1',portrait+' .selection-heading h1'],c);
  const picker=stylesAt(css,['.roster-picker',portrait+' .roster-picker'],c);
  const instruction=stylesAt(css,['#roster-instruction',portrait+' #roster-instruction'],c);
  const start=stylesAt(css,['#menu .start-row',portrait+' #menu .start-row'],c);
  const grid=stylesAt(css,['#roster-grid',portrait+' #roster-grid'],c);
  const tracks=[...menu['grid-template-rows'].matchAll(/minmax\((\d+)px,([\d.]+)fr\)/g)].map(m=>({min:+m[1],fr:+m[2]}));
  const available=c.menuHeight-mp[0]-mp[2]-3*num(menu.gap)-num(heading['font-size'])*num(heading['line-height'],1.2)-num(start.height);
  let unit=available/(tracks[0].fr+tracks[1].fr),rosterHeight=unit*tracks[1].fr;
  if(unit*tracks[0].fr<tracks[0].min)rosterHeight=available-tracks[0].min;
  rosterHeight=Math.max(tracks[1].min,Math.min(rosterHeight,num(picker['max-height'],Infinity)));
  tileHeight=(rosterHeight-num(instruction['line-height'])-num(picker.gap)-num(grid.gap))/2;
 }

 const slotWidth=c.tile[0]-p[1]-p[3]-border*2;
 const slotHeight=tileHeight-p[0]-p[2]-border*2-num(button.gap)-num(name['line-height']);
 const width=Math.min(slotWidth,length(img.width,slotWidth,c),length(img['max-width'],slotWidth,c));
 const height=Math.min(slotHeight,length(img.height,slotHeight,c),length(img['max-height'],slotHeight,c));
 assert.ok(Math.min(width,height)>=c.minimum,`head is ${width}×${height}, expected at least ${c.minimum}px in both axes`);
 assert.ok(num(name['font-size'])>=13,'names should stay readable, not shrink to make room');
 assert.ok(num(button['min-height'])>=44 && num(button['min-width'])>=44,'portrait buttons remain touch targets');
});
test('larger selected desktop heads have enough width to use their height',()=>{
 const img=stylesAt(css,['#menu .matchup-card img'],{width:1180,height:757});
 assert.ok(num(img.width)>=130,'selected portrait must not remain width-limited to 90px');
 assert.ok(num(img['max-height'])>=160);
});
test('difficulty and start retain 44px touch targets in every selector mode',()=>{
 for(const p of ['',landscape,compact,portrait]){
  const button=stylesAt(css,['.difficulty-picker button',p+' .difficulty-picker button'],{width:568,height:320});
  const start=stylesAt(css,['#menu .start-row .primary',p+' #menu .start-row .primary'],{width:568,height:320});
  assert.ok(num(button['min-height'])>=44);assert.ok(num(start['min-height'])>=44);
 }
});
