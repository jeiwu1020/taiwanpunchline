import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {stylesAt,padding} from './helpers/css-contracts.mjs';
import {PointerControls,bindTouchControls} from '../dist/touch-controls.mjs';

const file=name=>new URL('../dist/'+name,import.meta.url);
const read=name=>existsSync(file(name))?readFileSync(file(name),'utf8'):'';
const source=()=>['style.css','mobile-game.css','interface-v29.css','interface-v30.css','interface-v32.css'].map(read).join('\n');
const t='.app[data-touch="true"][data-layout]',l='.app[data-touch="true"][data-layout="landscape"]',p='.app[data-touch="true"][data-layout="portrait"]',d='.app[data-touch="false"]';
const style=(selectors,width=568,height=320)=>stylesAt(source(),selectors,{width,height});
const touch=(part,layout,width,height)=>style([part,'.app '+part,t+' '+part,(layout==='portrait'?p:l)+' '+part],width,height);
const pixels=value=>parseFloat(value)||0;

test('desktop exposes a normal pointer-enabled guard button beside attack, without replacing crouch',()=>{
 const aux=style(['.touch-aux',d+' .touch-aux'],1180,757);
 assert.notEqual(aux.display,'none');assert.equal(aux.display,'flex');assert.notEqual(aux['pointer-events'],'none');
 const button=style(['.control-deck button',d+' .touch-aux button'],1180,757);
 assert.ok(pixels(button.width)>=64);assert.ok(pixels(button.height)>=44);
 assert.equal(pixels(style([d+' .touch-aux']).order),pixels(style([d+' .basic']).order)+1);
 const html=read('index.html');
 const guard=html.match(/<button[^>]*data-hold="guard"[^>]*>[\s\S]*?<\/button>/)?.[0]||'';
 assert.match(guard,/<span>防守<\/span>/);assert.match(guard,/<kbd>K<\/kbd>/);assert.match(guard,/aria-label="按住原地防守；鍵盤 K 或左 Shift"/);
 assert.ok(html.indexOf('interface-v32.css')>html.indexOf('interface-v30.css'),'V32 overrides must be linked after V30');
 assert.match(html,/data-hold="crouch"/);assert.doesNotMatch(html,/擋[／/]蹲/);
});

test('displayed guard keys match real keyboard bindings and down remains only crouch',()=>{
 const source=read('game.mjs').match(/const keys=(\{[^;]+\});/)[1];
 const keys=runInNewContext('('+source+')');
 assert.equal(keys.KeyK,'guard');assert.equal(keys.ShiftLeft,'guard');
 assert.equal(keys.ArrowDown,'crouch');assert.equal(keys.KeyS,'crouch');
});

for(const [label,width,height,layout] of [
 ['upright 320',320,568,'portrait'],['landscape 568',568,320,'landscape'],
 ['landscape 844',844,390,'landscape'],['rotated portrait logical 844',844,390,'landscape'],
 ['safe-area-reduced logical 480',480,320,'landscape']
])test(`${label}: stick stays at least 76px, inset, and inside its reserved dock`,()=>{
 const stick=touch('#touch-stick',layout,width,height),deck=touch('.control-deck',layout,width,height),pad=touch('.touch-pad',layout,width,height),cabinet=touch('.cabinet',layout,width,height);
 const diameter=pixels(stick.width);assert.ok(diameter>=76&&diameter<=88,`stick width ${diameter}`);assert.equal(pixels(stick.height),diameter);
 assert.notEqual(pad.position,'absolute');assert.ok(!pad.transform||pad.transform==='none','stick must not overlap the canvas');
 const inset=padding(deck);assert.ok(inset[3]>=12,'reachable left dock inset');
 const dockHeight=pixels(cabinet['grid-template-rows'].match(/ (\d+)px$/)?.[1]);
 const rows=deck['grid-template-rows'];
 const stickRow=layout==='portrait'?pixels(rows.trim().split(/\s+/).at(-1)):dockHeight-inset[0]-inset[2]-2;
 assert.ok(stickRow>=diameter,`${stickRow}px row contains ${diameter}px stick`);
 if(layout==='portrait'){
  const rowTotal=rows.split(/\s+/).reduce((sum,r)=>sum+pixels(r),0)+pixels(deck.gap)+inset[0]+inset[2]+2;
  assert.ok(rowTotal<=dockHeight,'upright rows fit the dock');
  assert.equal(touch('.specials',layout,width,height)['grid-column'],'1 / -1');
 }else{
  const tracks=deck['grid-template-columns'].split(/\s+/),fixed=tracks.filter(x=>x.endsWith('px')).reduce((sum,x)=>sum+pixels(x),0);
  const moveArea=width-12-4-inset[1]-inset[3]-fixed-pixels(deck.gap)*3;
  assert.ok((moveArea-10)/3>=64,'each of three move cards retains a usable width');
 }
 assert.equal(touch('.basic',layout,width,height)['grid-column'],'3');
 assert.equal(touch('.touch-aux',layout,width,height)['grid-column'],'4');
 for(const selector of ['.basic .punch','.touch-aux button']){
  const control=touch(selector,layout,width,height);assert.ok(pixels(control.width)>=48);assert.ok(pixels(control.height)>=48);
 }
 assert.notEqual(touch('.specials',layout,width,height).display,'none');
 assert.notEqual(touch('.specials button',layout,width,height)['pointer-events'],'none');
});

test('stationary guard can be held beside stick movement and released independently',()=>{
 const input=new PointerControls();
 input.button(2,'guard',true);input.stick(1,35,0,42);
 assert.ok(input.held.has('guard'));assert.ok(input.held.has('right'));assert.equal(input.held.has('crouch'),false);
 input.release(1);assert.deepEqual([...input.held],['guard']);
 input.stick(3,0,35,42);assert.ok(input.held.has('crouch'));assert.ok(input.held.has('guard'));
 input.release(2);assert.deepEqual([...input.held],['crouch']);input.clear();assert.equal(input.held.size,0);
});

// The browser event boundary is replaced; the production pointer binder runs.
test('desktop primary mouse press activates the shown guard and cancellation releases it',()=>{
 const events={},classes=new Set(),captured=new Set(),states=[];
 const guard={dataset:{hold:'guard'},disabled:false,
  classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
  addEventListener:(type,fn)=>{events[type]=fn;},
  setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)
 };
 const binding=bindTouchControls({document:{querySelector:()=>null,querySelectorAll:()=>[guard]},window:{addEventListener(){}},active:()=>true,rotation:()=>0,onHold:(action,on)=>states.push([action,on])});
 const event={pointerId:7,pointerType:'mouse',button:0,buttons:1,preventDefault(){}};
 events.pointerdown({...event,button:2});assert.equal(binding.input.held.size,0);
 events.pointerdown(event);assert.ok(binding.input.held.has('guard'));assert.ok(classes.has('held'));
 events.pointercancel(event);assert.equal(binding.input.held.size,0);assert.equal(classes.has('held'),false);
 assert.deepEqual(states,[['guard',true],['guard',false]]);
});
