import test from 'node:test';
import assert from 'node:assert/strict';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {createChallengeProgress} from '../dist/challenge-progress.mjs';
import {createProfileProgress} from '../dist/profile-progress.mjs';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';

// Use the real dialog under the real .app and every stylesheet in index.html.
// A challenge.css-only contract missed combat header rules taking this title
// out of flow. Geometry and text shaping still require the browser matrix.
const sizes=[
 {width:320,height:568,portrait:true},
 {width:360,height:740,portrait:true},
 {width:375,height:667,portrait:true},
 {width:390,height:844,portrait:true},
 {width:430,height:932,portrait:true},
 {width:568,height:320},
 {width:844,height:390},
 {width:390,height:844,sideways:true,rotation:90},
 {width:390,height:844,sideways:true,rotation:-90},
 {width:1200,height:800,touch:false},
];

for(const size of sizes)test(`challenge headings retain flow and pointer access at ${JSON.stringify(size)}`,()=>{
 const f=combatStyles(size),doc=f.document,win=doc.defaultView,app=doc.querySelector('.app');
 const previousDocument=globalThis.document;globalThis.document=doc;
 app.style.width=(size.sideways?size.height:size.width)+'px';
 app.style.height=(size.sideways?size.width:size.height)+'px';
 app.dataset.rotation=String(size.rotation||0);
 win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 win.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const saved=new Map(),profiles=createProfileProgress({storage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}});
 const ui=mountChallengeUI({parent:app,progress:createChallengeProgress({profiles}),characters:{wang:{name:'恰吉王'},han:{name:'韓國魚'}}});
 try{
  const initialSave=[...saved];
  for(const view of ['chapter','character','save','chapter']){
   ui.open({view});
   const heading=doc.querySelector('.challenge-head'),style=f.style(heading);
   assert.ok(!['absolute','fixed'].includes(style.position),`${view}: title must reserve its own height before tabs`);
   assert.ok(!style.height||style.height==='auto',`${view}: toolbar height cannot clip a wrapping title`);
   assert.notEqual(style['pointer-events'],'none',`${view}: dialog heading cannot inherit the combat overlay hit-test rule`);
   assert.ok(!style.filter||style.filter==='none',`${view}: combat toolbar shadow does not belong on the dialog title`);
   assert.ok(!style['z-index']||style['z-index']==='auto',`${view}: title cannot stack above tabs`);
   assert.equal(heading.nextElementSibling.className,'challenge-tabs');
   assert.ok(heading.querySelector('h2').textContent.length>0);
   // The actual app toolbar remains an overlay; a blanket header reset would
   // fix the dialog while regressing the full-stage combat presentation.
   assert.equal(f.style(app.querySelector(':scope > header')).position,'absolute');
   assert.equal(f.style(app.querySelector(':scope > header'))['pointer-events'],'none');
   doc.querySelector('.challenge-close').click();assert.equal(ui.element.open,false);
  }
  assert.deepEqual([...saved],initialSave,'opening, switching, closing and reopening views do not change saved progress');
 }finally{ui.destroy();f.close();if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
