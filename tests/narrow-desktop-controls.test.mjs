import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const entry=new URL('../dist/preview/finale/index.html',import.meta.url);
// Use the shipped entry's complete DOM and stylesheet order. JSDOM does not
// lay out grids: activate concrete viewport/container rules, then calculate
// track bounds from those computed declarations. Browser hit testing remains
// a separate release check.
function fixture(width,height,touch=false){
 const dom=new JSDOM(readFileSync(entry,'utf8'),{url:entry.href}),d=dom.window.document;
 const source=file=>readFileSync(file,'utf8').replace(/@import\s+url\(["']?([^"')]+)["']?\);/g,(_,path)=>source(new URL(path.split('?')[0],file)));
 for(const el of [d.body,d.querySelector('#trial-app')])Object.assign(el.dataset,{touch:String(touch),layout:width<height?'portrait':'landscape',overlayControls:String(touch&&width>height),depthRoute:'true',noncombat:'false'});
 function active(condition){
  const sizes=[...condition.matchAll(/\((min|max)-(width|height):\s*(\d+)px\)/g)];
  return sizes.length>0&&sizes.every(([,bound,axis,value])=>bound==='max'?(axis==='width'?width:height)<=+value:(axis==='width'?width:height)>=+value);
 }
 for(const link of [...d.querySelectorAll('link[rel="stylesheet"]')]){
  const style=d.createElement('style');style.textContent=source(new URL(link.getAttribute('href').split('?')[0],entry));link.replaceWith(style);
  const rules=[];function visit(list){for(const r of list)if(r.cssRules){if(active(r.conditionText??''))visit(r.cssRules);}else if(r.selectorText)rules.push(r.cssText);}
  visit(style.sheet.cssRules);style.textContent=rules.join('\n');
 }
 const css=selector=>dom.window.getComputedStyle(d.querySelector(selector));
 const deck=css('#controls');
 const resolve=s=>s.replace(/var\((--[\w-]+)\)/g,(_,key)=>deck.getPropertyValue(key).trim());
 const columns=resolve(deck.gridTemplateColumns),rows=resolve(deck.gridTemplateRows);
 return {dom,d,css,deck,columns,rows,resolve};
}
for(const width of [320,390])test(`non-touch ${width}px finale keeps every action within the deck`,()=>{
 const f=fixture(width,844);try{
  const {css,deck,d}=f,available=width-16,content=available-2*parseFloat(deck.paddingLeft);
  const movement=css('#controls .movement'),size=parseFloat(deck.getPropertyValue('--action-size')),movementWidth=parseFloat(f.resolve(movement.width)),gap=parseFloat(deck.columnGap||deck.gap);
  assert.ok(movementWidth+3*size+3*gap<=content,`action tracks need ${movementWidth+3*size+3*gap}px; only ${content}px available`);
  const specials=css('#specials');assert.equal(specials.gridColumn.replaceAll(' ',''),'1/-1');assert.equal(specials.gridRow,'1');
  const cardWidth=(content-2*parseFloat(specials.columnGap||specials.gap))/3;assert.ok(cardWidth>=80,'all three special cards retain readable full-width targets');
  const rows=f.rows.match(/\d+(?:\.\d+)?px/g)?.map(parseFloat)??[];
  assert.ok(parseFloat(deck.height)>=rows[0]+2*size+2*gap+2*parseFloat(deck.paddingTop),'deck reserves all three rows');
  const occupied=new Set();for(const selector of ['.rally-button','.assist-button','#challenge-jump','[data-hold="guard"]','.punch']){
   const c=css('#controls '+selector),column=+c.gridColumn,row=+c.gridRow,key=`${column}:${row}`;
   assert.ok(column>=2&&column<=4&&row>=2&&row<=3);assert.equal(occupied.has(key),false,'action targets cannot overlap');occupied.add(key);assert.ok(size>=44);
  }
  assert.equal(d.querySelectorAll('#specials button').length,3);assert.deepEqual([...d.querySelectorAll('#specials kbd')].map(e=>e.textContent),['U','I','O']);
  assert.notEqual(css('#controls .movement').display,'none');assert.notEqual(css('#specials kbd').display,'none');assert.notEqual(deck.overflowX,'scroll');
 }finally{f.dom.window.close();}
});
for(const [width,height,expected] of [[844,390,'114px repeat(5,54px) minmax(300px,1fr)'],[1280,720,'274px repeat(5,64px) minmax(300px,1fr)']])test(`existing ${width}x${height} desktop tracks stay unchanged`,()=>{
 const f=fixture(width,height);try{assert.equal(f.columns,expected);assert.equal(f.css('#specials').gridRow,'1');assert.equal(f.css('#specials').gridColumn,'7');}finally{f.dom.window.close();}
});
for(const [width,height] of [[390,844],[844,390]])test(`touch ${width}x${height} keeps its existing control layout`,()=>{
 const f=fixture(width,height,true);try{assert.equal(f.css('#controls .movement').display,'none');assert.equal(f.css('#specials kbd').display,'none');assert.equal(f.css('#specials').gridRow,width<height?'1/3':'1');assert.equal(f.css('#specials').gridColumn.replaceAll(' ',''),width<height?'2/6':'3/8');}finally{f.dom.window.close();}
});
