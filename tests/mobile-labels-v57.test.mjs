import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAST} from '../dist/roster.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';
const css=readFileSync(new URL('../dist/match-modes.css',import.meta.url),'utf8');
const touch='.app[data-touch="true"][data-layout]';
const portrait='.app[data-touch="true"][data-layout="portrait"]';
const overlay='.app[data-touch="true"][data-overlay-controls="true"]';
const style=(selector,mode,width,height)=>stylesAt(css,[`${touch} ${selector}`,`${mode} ${selector}`],{width,height});
// A reverted small font or single-line clipping makes real roster names fail
// this size budget. Browser QA verifies the actual painted glyphs separately.
for(const [width,height] of [[320,568],[390,844],[568,320],[640,360]])test(`${width}px mobile move names are prominent and reserve enough room for the longest name`,()=>{
 const mode=width<height?portrait:overlay,name=style('.specials strong',mode,width,height),purpose=style('.specials small',mode,width,height),button=style('.specials button',mode,width,height);
 const font=parseFloat(name['font-size']),secondary=parseFloat(purpose['font-size']);
 assert.ok(font>=16,'main name is at least 16px');assert.ok(font>secondary,'name is stronger than its subtitle');
 assert.equal(name['white-space'],'normal');assert.equal(name['overflow-wrap'],'anywhere');
 const cardWidth=width<height?(width-24-10)/3:(width-44-84-174-54-18-10)/3;
 const textWidth=cardWidth-(width<height?12:8),chars=Math.floor(textWidth/font);
 const maxLines=Math.max(...Object.values(CAST).flatMap(c=>c.moves).map(m=>Math.ceil(m.name.length/chars)));
 const titleHeight=maxLines*font*parseFloat(name['line-height']);
 const available=parseFloat(button.height)-(width<height?10+30+2:8+18+1);
 assert.ok(titleHeight<=available,`${maxLines} name lines need ${titleHeight}px; ${available}px reserved`);
});

// Simulate this sheet's explicit deck-container breakpoint, not viewport width.
for(const width of [700,760,844,932])test(`${width}px landscape cards compact whitespace without shrinking names`,()=>{
 const containerCSS=css.replaceAll('@container','@media');
 const get=part=>stylesAt(containerCSS,[`${touch} ${part}`,`${overlay} ${part}`],{width:width-44,height:390});
 const button=get('.specials button'),name=get('.specials strong'),subtitle=get('.specials small');
 assert.equal(button.height,'68px');assert.equal(button['min-height'],'68px');
 assert.equal(get('.specials').height,button.height);
 assert.equal(name['font-size'],'16px');assert.equal(subtitle['font-size'],'9px');
 const cardWidth=(width-44-84-174-54-18-10)/3,chars=Math.floor((cardWidth-8)/16);
 for(const move of Object.values(CAST).flatMap(c=>c.moves)){
  const titleHeight=Math.ceil(move.name.length/chars)*16*1.1;
  assert.ok(titleHeight<=68-8-22-1,`${move.name} fits without clipping`);
 }
});
