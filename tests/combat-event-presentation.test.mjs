import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {presentCombatEvents,combatEventAnnouncement,announceCombatEvent} from '../dist/preview/campaign/combat-event-presentation.mjs';
import {paintCombatFeedback} from '../dist/preview/campaign/combat-feedback.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const actor=(type,x)=>({type,x,y:430,depth:0,hp:100,face:1});
const world=()=>({player:actor('wang',300),enemy:actor('han',640)});

test('supply and assist show as world pop-ups, never as a DOM bar',()=>{
 const w=world(),feedback=[],callouts=new Map(),live={textContent:''};
 const helper={x:420,y:430,depth:0};
 presentCombatEvents([{type:'supply',amount:30},{type:'assistStart',f:w.player,helper:'su',kind:'su_shout',name:'太離譜了',assist:{actor:helper,owner:w.player,displayName:'蘇'}}],w,{callouts,feedback,live,now:1000});
 const texts=feedback.map(item=>item.text);
 assert.ok(texts.includes('補給到手！HP 全滿'));
 assert.ok(texts.includes('蘇 · 太離譜了'));
 const supply=feedback.find(item=>item.text.startsWith('補給')),assist=feedback.find(item=>item.text.includes('太離譜了'));
 assert.equal(supply.x,w.player.x,'supply anchors to the player like chapter one');
 assert.equal(assist.x,helper.x);assert.ok(assist.duration>supply.duration,'assist name stays readable a little longer');
 assert.equal(callouts.size,0,'assist is not a second centred caption');
});

test('rally start no longer paints a long instruction bar; it is only announced to assistive tech',()=>{
 const w=world(),feedback=[],callouts=new Map(),live={textContent:''};
 const event={type:'rally',f:w.player};
 presentCombatEvents([event],w,{callouts,feedback,live,now:5});
 assert.equal(feedback.length,0);assert.equal(callouts.size,0);
 assert.match(live.textContent,/集合！/);
 assert.equal(combatEventAnnouncement(event,w,[event,{type:'rally',f:w.enemy}]).startsWith('雙方'),true);
});

test('named moves and boss warnings still become screen-lane callouts',()=>{
 const w=world(),callouts=new Map(),feedback=[];
 presentCombatEvents([{type:'minibossWarning',f:w.enemy,name:'大絕招',action:'special1'}],w,{callouts,feedback,now:10});
 assert.equal(callouts.get(w.enemy).caption.text,'大絕招');
});

test('pop-ups are painted within the combat canvas frame',()=>{
 const feedback=[{x:300,y:130,depth:0,text:'補給到手！HP 全滿',color:'#b6f1ba',size:23,started:0,duration:850,rise:20}];
 const calls=[];
 const ctx={save(){},restore(){},strokeText(t){calls.push(t);},fillText(t){calls.push(t);},set font(v){},set textAlign(v){},set textBaseline(v){},set lineJoin(v){},set lineWidth(v){},set strokeStyle(v){},set fillStyle(v){},globalAlpha:1};
 paintCombatFeedback(ctx,feedback,{zoom:1,left:100,base:300,height:600},430,390,100);
 assert.ok(calls.includes('補給到手！HP 全滿'));
});

test('chapter markup keeps #feedback only as a hidden live region',()=>{
 const shell=read('dist/preview/campaign/chapter-shell.css');
 assert.match(shell,/#feedback\{[^}]*width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\)/);
 assert.doesNotMatch(shell,/#feedback\{[^}]*background/);
 assert.doesNotMatch(read('dist/preview/campaign/chapter-ui.css'),/#feedback/);
 assert.doesNotMatch(read('dist/preview/campaign/landscape-safe.css'),/#feedback/);
});
