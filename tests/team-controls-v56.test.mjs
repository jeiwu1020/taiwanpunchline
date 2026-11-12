import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stylesAt,padding} from './helpers/css-contracts.mjs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/match-modes.css',import.meta.url),'utf8');
const portrait='.app[data-touch="true"][data-layout="portrait"]';
const style=(part,width=320,height=568)=>stylesAt(css,[part,`${portrait} ${part}`],{width,height});
// The main card and both tickets must share the same team boundary, so
// inserting an opponent target below the player card cannot silently pass.
function teamSections(){
 return [...html.matchAll(/<section\b[^>]*data-roster-team="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
}
test('selection keeps each main card with only its own fighter and helper targets',()=>{
 const groups=teamSections();assert.equal(groups.length,2,'two identifiable teams');
 for(const [side,card,targets] of [['player','player-card',['player','playerAssist']],['enemy','opponent-card',['opponent','enemyAssist']]]){
  const group=groups.find(g=>g[1]===side);assert.ok(group,side);
  assert.ok(group[2].includes(`id="${card}"`));
  assert.deepEqual([...group[2].matchAll(/data-roster-target="([^"]+)"/g)].map(m=>m[1]),targets);
  assert.ok(group[2].indexOf(`id="${card}"`)<group[2].indexOf('class="roster-targets"'),'targets sit below the main card');
 }
 assert.equal((html.match(/id="roster-grid"/g)||[]).length,1,'all four roles reuse the existing portrait gallery');
 assert.deepEqual([...html.matchAll(/data-roster-target="([^"]+)"/g)].map(m=>m[1]),['player','playerAssist','opponent','enemyAssist']);
});
test('team tickets retain two equal touch targets under each card',()=>{
 const tickets=style('.roster-targets'),button=style('.roster-targets button');
 assert.equal(tickets['grid-template-columns'],'repeat(2,minmax(0,1fr))');
 assert.ok(parseFloat(button['min-width'])>=44);assert.ok(parseFloat(button['min-height'])>=44);
});
test('portrait action row is assist, rally, attack, guard beside the separate stick',()=>{
 const deck=style('.control-deck');
 assert.equal(deck['grid-template-columns'],'84px repeat(4,minmax(44px,1fr))');
 assert.equal(deck['grid-template-rows'],'84px 88px');
 assert.equal(style('.basic')['grid-column'],'2/5');assert.equal(style('.basic')['grid-row'],'2');
 for(const [part,column] of [['.basic .assist-button','1'],['.basic .rally-button','2'],['.basic .punch','3']]){
  assert.equal(style(part)['grid-column'],column,part);assert.equal(style(part)['grid-row'],'1',part);
 }
 assert.equal(style('.touch-aux')['grid-column'],'5');assert.equal(style('.touch-aux')['grid-row'],'2');
 assert.equal(style('.touch-pad')['grid-column'],'1');assert.equal(style('.touch-pad')['grid-row'],'2');
 assert.equal(style('.specials')['grid-column'],'1/-1');assert.equal(style('.specials')['grid-row'],'1');
});
test('320px portrait budget fits full stick and four 44px targets without overlap',()=>{
 for(const width of [320,360,390,430]){
  const deck=style('.control-deck',width),p=padding(deck);
  const available=width-12-4-p[1]-p[3]; // app padding and cabinet borders
  const actionWidth=(available-84-4*4)/4;
  assert.ok(actionWidth>=44,`${width}px allows ${actionWidth}px action targets`);
  const button=style('.basic button',width),guard=style('.touch-aux button',width);
  for(const target of [button,guard]){assert.equal(target.width,'100%');assert.ok(parseFloat(target['min-width'])>=44);assert.ok(parseFloat(target['min-height'])>=44);}
  assert.equal(style('#touch-stick',width).width,'84px');
  assert.ok(84+88+parseFloat(deck.gap)+p[0]+p[2]+2<=192,'all controls fit the 192px dock');
 }
});

// Preserve the original guard track and center; all visible gaps become 4px.
test('portrait has equal compact gaps while preserving the original guard edge',()=>{
 for(const width of [320,360,390,430,600]){
  const basic=style('.basic',width),deck=style('.control-deck',width),p=padding(deck);
  assert.equal(basic.display,'grid');assert.equal(basic['justify-self'],'end');
  assert.equal(basic.width,'170px');assert.equal(basic['max-width'],'100%');
  assert.equal(basic['margin-right'],'min(0px,calc((54px - (100% - 8px)/3)/2))');
  const area=width-12-4-p[1]-p[3],track=(area-84-16)/4,groupArea=3*track+8;
  const gap=parseFloat(basic.gap),groupWidth=Math.min(parseFloat(basic.width),groupArea);
  const buttonWidth=(groupWidth-2*gap)/3,margin=Math.min(0,(54-track)/2);
  const groupLeft=88+groupArea-groupWidth-margin;
  const guardLeft=88+3*(track+4)+(track-Math.min(track,54))/2;
  const lefts=[0,1,2].map(i=>groupLeft+i*(buttonWidth+gap));lefts.push(guardLeft);
  for(let i=0;i<3;i++)assert.ok(Math.abs(lefts[i+1]-lefts[i]-buttonWidth-4)<.001,`${width}px gap ${i} is 4px`);
  assert.ok(buttonWidth>=44&&buttonWidth<=54,'targets remain 44–54px wide');
  assert.ok(groupLeft>=88,'the full 84px stick remains separate');
  assert.equal(style('.touch-aux')['grid-column'],'5','guard stays in its original track');
  assert.equal(style('.touch-aux').width,'100%');
 }
});

// At the 44px minimum target, the rally chip's horizontal padding previously
// left too little room for two main characters / three state characters.
test('320px portrait action labels stay horizontal inside each 44px target',()=>{
 const main=style('.basic button span'),rallyName=style('.basic .rally-button span'),state=style('.basic .rally-button .rally-label');
 const mainFont=parseFloat(main['font-size']),stateFont=parseFloat(state['font-size']);
 assert.equal(main['white-space'],'nowrap');assert.equal(state['white-space'],'nowrap');
 assert.ok(mainFont>=15&&mainFont<=16);assert.ok(stateFont<=10);
 const contentWidth=44-4-4; // border + button padding
 assert.ok(2*mainFont+2*parseFloat(rallyName['padding-inline'])<=contentWidth,'揪團 fits on one line');
 assert.ok(3*stateFont+2*parseFloat(state['padding-inline'])<=contentWidth,'集氣中 fits on one line');
});
