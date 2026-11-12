import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as ui from '../dist/challenge-ui.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';
import {preparationFixture,injectPreparationCSS} from './helpers/preparation-allocation-fixture.mjs';

function frame(input){assert.equal(typeof ui.challengePickerFrame,'function','the chooser needs logical, rotation-independent overlay placement');return ui.challengePickerFrame(input);}
test('chooser floats below a high trigger without changing the panel layout',()=>{
 assert.deepEqual(frame({left:30,top:90,width:160,height:44,panelWidth:374,panelHeight:650,optionCount:2}),{left:30,top:140,width:220,maxHeight:133,placement:'below'});
});
test('low portrait trigger flips the chooser above rather than pushing the start action down',()=>{
 assert.deepEqual(frame({left:200,top:540,width:160,height:44,panelWidth:374,panelHeight:650,optionCount:7}),{left:144,top:264,width:220,maxHeight:270,placement:'above'});
});
test('short logical landscape bounds the list and all rotations use identical logical geometry',()=>{
 const input={left:600,top:180,width:180,height:44,panelWidth:828,panelHeight:358,optionCount:7};
 for(const rotation of [0,90,-90])assert.deepEqual(frame({...input,rotation}),{left:598,top:10,width:220,maxHeight:164,placement:'above'});
});
test('very small available panel still keeps the floating list inside its borders',()=>{
 const f=frame({left:10,top:150,width:60,height:44,panelWidth:190,panelHeight:180,optionCount:7});
 assert.ok(f.left>=10&&f.left+f.width<=180);assert.ok(f.top>=10&&f.top+f.maxHeight<=170);assert.ok(f.maxHeight>0);
});
test('chooser CSS is outside document flow and backup shares the compact header grid',()=>{
 const css=readFileSync(new URL('../dist/challenge.css',import.meta.url),'utf8'),viewport={width:390,height:844};
 const menu=stylesAt(css,['.challenge-pick-menu'],viewport);assert.equal(menu.position,'fixed');assert.equal(menu['z-index'],'20');
 const shared='.challenge-dialog[data-compact="true"][data-layout="landscape"][data-view]';
 const paper=stylesAt(css,[shared+' >.challenge-paper'],viewport);assert.equal(paper.display,'grid');assert.equal(paper['grid-template-columns'],'minmax(160px,.8fr) minmax(0,1.2fr)');
 const tabs=stylesAt(css,[shared+' .challenge-tabs'],viewport);assert.equal(tabs['grid-row'],'1');assert.equal(tabs['grid-column'],'2');
 const backup=stylesAt(css,['.challenge-dialog[data-layout="landscape"] .challenge-save-actions'],viewport);assert.equal(backup['grid-template-columns'],'repeat(2,minmax(0,1fr))');
});
test('compact shell grid matches only its direct paper and excludes the real nested preparation paper',async t=>{
 const f=await preparationFixture(t),outer=f.ui.element.querySelector(':scope > .challenge-paper'),nested=f.prep.querySelector('.challenge-preparation-panel.challenge-paper'),style=injectPreparationCSS(f),shared='.challenge-dialog[data-compact="true"][data-layout="landscape"][data-view]';
 assert.equal(outer.parentElement,f.ui.element);assert.equal(outer.contains(nested),true);assert.equal(outer.matches(shared+' >.challenge-paper'),true);assert.equal(nested.matches(shared+' >.challenge-paper'),false,'the outer grid must never match nested allocation content');assert.equal(nested.matches(shared+' .challenge-paper'),true,'the old descendant selector would incorrectly match this real nested paper');
 assert.equal(style(outer).display,'grid');assert.equal(style(outer).gridTemplateColumns,'minmax(0,1fr)','the current v4 shell retains its explicit one-column override');assert.equal(style(nested).display,'block','nested preparation remains its own scrolling block, not the outer grid');
});
