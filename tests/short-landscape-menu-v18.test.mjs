import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stylesAt,padding} from './helpers/css-contracts.mjs';
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const styles=(v,...selectors)=>stylesAt(css,selectors,v);
const number=(style,key,fallback=0)=>parseFloat(style[key])||fallback;

// Parent CUA measurement at 568×320 before this fix. This is a CSS flex-budget
// regression using those real stage bounds, not a replacement for browser QA.
const observed={viewport:{width:568,height:320},menu:{top:57,bottom:312,width:326},beforeStart:{top:279.2,bottom:323.2,height:44}};
function menuGeometry(viewport,rect){
 const menu=styles(viewport,'.menu'),title=styles(viewport,'h1','.menu-copy h1'),matchup=styles(viewport,'.matchup'),card=styles(viewport,'.matchup-card'),field=styles(viewport,'.roster-field'),start=styles(viewport,'.start-row'),button=styles(viewport,'.primary','.start-row .primary');
 const p=padding(menu),gap=number(menu,'gap');
 const titleHeight=number(title,'font-size')*number(title,'line-height',1.1);
 const [matchTop,matchBottom]=matchup.margin.split(/\s+/).length===3?[parseFloat(matchup.margin),parseFloat(matchup.margin.split(/\s+/)[2])]:[parseFloat(matchup.margin),parseFloat(matchup.margin)];
 const rowHeight=Math.max(number(start,'min-height'),number(button,'min-height'));
 const childHeight=titleHeight+matchTop+number(card,'height')+matchBottom+number(field,'height')+number(start,'margin-top')+rowHeight+3*gap;
 const requiredHeight=p[0]+childHeight+p[2],availableHeight=rect.bottom-rect.top;
 const firstTop=rect.top+p[0]+(availableHeight-requiredHeight)/2;
 const startTop=firstTop+childHeight-rowHeight;
 return{requiredHeight,availableHeight,startTop,startBottom:startTop+rowHeight,startHeight:rowHeight,selectorHeight:number(field,'height')};
}
test('observed 568×320 menu bounds contain the entire 44px start row and both selectors',()=>{
 const g=menuGeometry(observed.viewport,observed.menu);
 assert.ok(g.requiredHeight<=g.availableHeight,`menu needs ${g.requiredHeight}px within the measured ${g.availableHeight}px`);
 assert.ok(g.startBottom<=observed.menu.bottom-7,`start bottom ${g.startBottom} must keep the existing bottom inset`);
 assert.ok(g.startTop>=observed.menu.top);assert.ok(g.startHeight>=44);assert.ok(g.selectorHeight>=44);
 assert.ok(g.startBottom<observed.beforeStart.bottom,'fix must reclaim the observed clipped area');
});
test('320px-high landscape compaction keeps artwork within its card and leaves action touch targets intact',()=>{
 const v=observed.viewport,card=styles(v,'.matchup-card'),image=styles(v,'.matchup-card img'),field=styles(v,'.roster-field'),button=styles(v,'.primary','.start-row .primary');
 assert.ok(number(image,'height')<=number(card,'height')-6,'portrait fits within the card border height');
 assert.ok(number(field,'height')>=44);assert.ok(number(button,'min-height')>=44);
});
test('previously verified portrait, standard landscape and desktop menu dimensions are unchanged',()=>{
 for(const expected of [
  {width:320,height:568,cardHeight:'93px',imageHeight:'57px',imageWidth:'62px',titleSize:'21px'},
  {width:390,height:844,cardHeight:'153px',imageHeight:'92px',imageWidth:'90px',titleSize:'26px'},
  {width:844,height:390,cardHeight:'96px',imageHeight:'90px',imageWidth:'72px',titleSize:'24px'},
  {width:1440,height:900,cardHeight:'148px',imageHeight:'142px',imageWidth:'116px',titleSize:'clamp(25px,3.6vw,49px)'}
 ]){
  const card=styles(expected,'.matchup-card'),image=styles(expected,'.matchup-card img'),title=styles(expected,'h1','.menu-copy h1');
  assert.deepEqual({cardHeight:card.height,imageHeight:image.height,imageWidth:image.width,titleSize:title['font-size']},{cardHeight:expected.cardHeight,imageHeight:expected.imageHeight,imageWidth:expected.imageWidth,titleSize:expected.titleSize},`${expected.width}×${expected.height}`);
 }
});
