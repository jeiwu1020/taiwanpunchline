import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Preserve the entry's complete stylesheet sequence. jsdom does not fetch links
// by default; replacing them in place also makes CSS parse failures explicit.
export function loadChapterEntryStyles(document,entry){
 const links=[...document.querySelectorAll('link[rel="stylesheet"]')],sources=[];
 for(const link of links){
  const file=new URL(link.getAttribute('href').split('?')[0],entry),style=document.createElement('style');
  style.textContent=readFileSync(file,'utf8');link.replaceWith(style);
  assert.ok(style.sheet,'Failed to parse chapter stylesheet '+file.pathname);sources.push(file.pathname);
 }
 assert.equal(document.styleSheets.length,links.length,'Every entry stylesheet must be loaded in its original position');return sources;
}

// A bounded assertion of this concrete display contract, not a general CSS
// engine or browser layout substitute. jsdom 26 computes matching declarations
// in source order and cannot establish this specificity-sensitive result.
const specificity=new Map([
 ['body[data-noncombat=true] #controls',[1,1,1]],
 ['.app[data-touch][data-layout][data-overlay-controls] .control-deck',[0,5,0]],
 ['body[data-noncombat="true"] #trial-app:not([data-retained-combat-layout="true"]) #controls',[2,2,1]],
 ['body[data-noncombat="true"] #trial-app[data-retained-combat-layout="true"] #controls',[2,2,1]],
]);
export function chapterControlsDisplay(document){
 const target=document.querySelector('#controls'),candidates=[];
 function visit(rules,context=[]){for(const rule of rules){
  assert.notEqual(rule.type,3,'Imported stylesheet requires explicit display-cascade review');
  if(rule.cssRules)visit(rule.cssRules,[...context,rule.conditionText||rule.cssText.slice(0,80)]);
  const display=rule.style?.getPropertyValue('display');if(!display||!rule.selectorText||!target.matches(rule.selectorText))continue;
  assert.deepEqual(context,[],'Conditional display rule requires explicit review');
  const spec=specificity.get(rule.selectorText);assert.ok(spec,'Unknown display selector requires explicit specificity review: '+rule.selectorText);
  candidates.push({display,important:rule.style.getPropertyPriority('display')==='important',specificity:spec,selector:rule.selectorText,order:candidates.length});
 }}
 for(const sheet of document.styleSheets)visit(sheet.cssRules);
 assert.equal(target.style.display,'','Unexpected inline display requires explicit review');
 return candidates.sort((a,b)=>Number(a.important)-Number(b.important)||a.specificity[0]-b.specificity[0]||a.specificity[1]-b.specificity[1]||a.specificity[2]-b.specificity[2]||a.order-b.order).at(-1)?.display;
}
