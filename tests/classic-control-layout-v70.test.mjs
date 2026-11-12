import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stylesAt,padding} from './helpers/css-contracts.mjs';

const file=new URL('../dist/combat-controls-v70.css',import.meta.url);
const css=existsSync(file)?readFileSync(file,'utf8'):'';
const base='.app[data-touch][data-layout][data-overlay-controls]';
const portrait='.app[data-touch="true"][data-layout="portrait"][data-overlay-controls="false"]';
const overlay='.app[data-touch="true"][data-layout="landscape"][data-overlay-controls="true"]';
const desktop='.app[data-touch="false"][data-layout][data-overlay-controls="false"]';
const action='.control-deck .basic button';
const guard='.control-deck .touch-aux button';
const parts={rally:'.control-deck .rally-button',assist:'.control-deck .assist-button',jump:'.control-deck #challenge-jump',guard:'.control-deck [data-hold="guard"]',attack:'.control-deck .punch'};
function style(part,context=portrait,{depth=true,width=320,height=568,extra=[]}={}){
 return stylesAt(css,[`${base} ${part}`,`${base}[data-depth-route="${depth}"] ${part}`,`${context} ${part}`,`${context}[data-depth-route="${depth}"] ${part}`,...extra],{width,height});
}
function placements(context,depth=true){
 return Object.entries(parts).filter(([name])=>depth||name!=='jump').map(([name,part])=>{const s=style(part,context,{depth});return {name,column:Number(s['grid-column']),row:Number(s['grid-row'])};});
}

test('classic portrait places assist/jump above rally/guard/attack with no shared cells',()=>{
 assert.equal(style('.control-deck .basic').display,'contents');
 assert.equal(style('.control-deck .touch-aux').display,'contents');
 const expected=[{name:'rally',column:3,row:3},{name:'assist',column:4,row:2},{name:'jump',column:5,row:2},{name:'guard',column:4,row:3},{name:'attack',column:5,row:3}];
 assert.deepEqual(placements(portrait),expected);
 assert.equal(style('.control-deck .touch-pad')['grid-column'],'1');
 assert.equal(style('.control-deck .touch-pad')['grid-row'],'2/4');
 for(const depth of [true,false]){const cells=placements(portrait,depth).map(p=>`${p.column}:${p.row}`);assert.equal(new Set(cells).size,cells.length);}
});

test('all five portrait action targets are equal and fit beside the complete stick at 320px',()=>{
 const deck=style('.control-deck'),p=padding(deck),size=parseFloat(deck['--action-size']);
 assert.ok(size>=44);assert.equal(size,54);
 for(const part of [action,guard]){const s=style(part);assert.equal(s.width,'var(--action-size)');assert.equal(s.height,'var(--action-size)');assert.equal(s['max-width'],'none');assert.ok(parseFloat(s['min-width'])>=44);}
 assert.equal(deck['grid-template-columns'],'100px minmax(0,1fr) repeat(3,var(--action-size))');
 assert.equal(deck['grid-template-rows'],'66px repeat(2,var(--action-size))');
 const gap=parseFloat(deck.gap),border=parseFloat(deck['border-top']);
 for(const width of [320,360,390,430]){
  const available=width-12-4-p[1]-p[3];
  assert.ok(100+3*size+4*gap<=available,`${width}px fits joystick and action columns`);
 }
 const height=Number(style('.cabinet')['grid-template-rows'].match(/ (\d+)px$/)?.[1]);
 assert.ok(66+2*size+2*gap+p[0]+p[2]+border<=height,'three rows fit the reserved portrait dock');
 assert.equal(style('.control-deck #touch-stick').width,'100px');
});

test('native landscape and CSS sideways use the same ordered overlay independent of physical orientation',()=>{
 for(const [width,height] of [[844,390],[568,320],[390,844]]){
  const deck=style('.control-deck',overlay,{width,height});
  assert.equal(deck.position,'absolute');assert.equal(deck.background,'transparent');assert.equal(deck['pointer-events'],'none');
  assert.equal(style('.cabinet',overlay,{width,height})['grid-template-rows'],'minmax(0,1fr)');
  assert.equal(style('.control-deck button',overlay,{width,height})['pointer-events'],'auto');
  assert.equal(style('.control-deck #touch-stick',overlay,{width,height})['pointer-events'],'auto');
 }
 const ordered=placements(overlay).sort((a,b)=>a.column-b.column);
 assert.deepEqual(ordered.map(p=>p.name),['rally','assist','jump','guard','attack']);
 assert.ok(ordered.every(p=>p.row===2));
 assert.equal(style('.control-deck',overlay)['--action-size'],'58px');
 // Smallest supported landscape: cabinet subtracts 12px app padding + 4px border.
 const width=568-16-24;
 assert.ok(112+5*58+6*6<=width,'112px stick and five 58px buttons fit without overlap');
});

test('VS removes the independent jump and compacts the remaining landscape/desktop actions',()=>{
 assert.equal(style(parts.jump,overlay,{depth:false}).display,'none');
 assert.equal(style(parts.jump,overlay,{depth:true}).display,'flex');
 for(const context of [overlay,desktop]){
  const ordered=placements(context,false).sort((a,b)=>a.column-b.column);
  assert.deepEqual(ordered.map(p=>p.name),['rally','assist','guard','attack']);
  assert.ok(ordered.every(p=>p.row===2));
  assert.equal(new Set(ordered.map(p=>p.column)).size,4);
  const columns=style('.control-deck',context,{depth:false})['grid-template-columns'];
  assert.ok(columns.includes('repeat(4,var(--action-size))'),'VS has no empty jump track');
 }
});

test('desktop keeps keyboard movement and the matching five-button sequence',()=>{
 const ordered=placements(desktop).sort((a,b)=>a.column-b.column);
 assert.deepEqual(ordered.map(p=>p.name),['rally','assist','jump','guard','attack']);
 assert.equal(style('.control-deck .movement',desktop).display,'flex');
 assert.equal(style('.control-deck .movement button',desktop)['min-width'],'44px');
 assert.equal(style('.control-deck .touch-pad',desktop).display,'none');
 assert.equal(style('.control-deck kbd',desktop).display,'block');
});

test('long special names have their own two-line area, clear of the cooldown and extra copy',()=>{
 for(const context of [portrait,overlay,desktop]){
  const card=style('.control-deck .specials button',context),name=style('.control-deck .specials strong',context),dial=style('.control-deck .specials .cooldown',context);
  assert.equal(card['grid-template-rows'],'minmax(0,1fr) 20px');
  assert.equal(name['font-size'],'18px');assert.equal(name['line-height'],'19px');assert.equal(name['white-space'],'normal');
  assert.equal(style('.control-deck .specials .move-copy',context)['grid-row'],'1');assert.equal(dial['grid-row'],'2');
  assert.equal(dial.height,'20px');
  for(const part of ['small','kbd','.cooldown-label'])assert.equal(style(`.control-deck .specials ${part}`,context).display,'none');
 }
 // 320px portrait: 304px deck, 16px padding, two 6px gaps, three 92px cards.
 const cardWidth=(304-16-12)/3,contentWidth=cardWidth-6-6;
 for(const name of ['我把你當人看','可以這樣插隊喔','垃圾不分藍綠']){
  assert.ok(Math.ceil(name.length/Math.floor(contentWidth/18))*19<=38,`${name} fits the two-line name area`);
 }
 assert.ok(38+20+6+2<=66,'name + cooldown + borders/padding fit card height');
});

test('assist and rally use a single bottom-up meter without an extra track or animation',()=>{
 for(const [name,variable] of [['rally','--charge'],['assist','--assist-charge']]){
  const s=style(parts[name]),ready=style(`${parts[name]}.ready`);
  assert.ok(s.background?.startsWith('linear-gradient(to top,'),'button background is its bottom-up charge meter');
  assert.ok(s.background.includes(`var(${variable},0%)`));
  assert.equal(s.opacity,'1');assert.equal(s.filter,'none');
  assert.equal(ready.animation,'none');assert.ok(ready['box-shadow'].includes('inset'),'ready remains distinguishable without a flashing palette');
 }
 assert.equal(style('.control-deck .charge-track').display,'none');
 const label=style('.control-deck .basic button small');assert.equal(label['font-size'],'11px');assert.equal(label['white-space'],'nowrap');
});

test('opening a blocking screen keeps the portrait dock out of the menu layout',()=>{
 const root=`${base} .cabinet:has(#menu:not(.hidden))`;
 assert.equal(stylesAt(css,[root],{width:320,height:568})['grid-template-rows'],'minmax(0,1fr)');
 assert.equal(style('.stage-wrap:has(#menu:not(.hidden))~.control-deck').display,'none');
 assert.equal(style('.control-deck[inert]')['pointer-events'],'none');
});

test('VS special names keep two lines after the independent jump column disappears',()=>{
 for(const context of [overlay,desktop]){
  const specials=style('.control-deck .specials',context,{depth:false});
  const groupWidth=specials.width==='100%'?4*58+3*6:parseFloat(specials.width);
  const nameWidth=(groupWidth-12)/3-12;
  assert.ok(Math.ceil('可以這樣插隊喔'.length/Math.floor(nameWidth/18))*19<=38,'VS must not squeeze seven-character names into three lines');
 }
});
