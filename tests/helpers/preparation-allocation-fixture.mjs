import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {mountChallengeUI} from '../../dist/challenge-ui.mjs';
import {mountChallengePreparation} from '../../dist/challenge-preparation.mjs';
import {CAST} from '../../dist/roster.mjs';
import {openChallengeProgress,CHALLENGE_KEY} from '../../dist/preview/campaign/fresh/progress.mjs';
import {newEnvelope} from '../../dist/preview/campaign/fresh/schema.mjs';
import {memoryStorage,memoryLocks} from './main-unified-fixture.mjs';

export const preparationSizes=[
 {name:'portrait390',width:390,height:844,logicalWidth:390,logicalHeight:844,containerWidth:366},
 {name:'portrait320',width:320,height:568,logicalWidth:320,logicalHeight:568,containerWidth:296},
 {name:'native844',width:844,height:390,logicalWidth:844,logicalHeight:390,containerWidth:820},
 {name:'sideways390',width:390,height:844,logicalWidth:844,logicalHeight:390,rotation:90,containerWidth:820},
 {name:'native932',width:932,height:430,logicalWidth:932,logicalHeight:430,containerWidth:908},
 {name:'native568',width:568,height:320,logicalWidth:568,logicalHeight:320,containerWidth:544},
];
export const flush=()=>new Promise(resolve=>setImmediate(resolve));
export async function preparationFixture(t,{size=preparationSizes[2],readOnly=false,standalone=false}={}){
 const dom=new JSDOM('<main class="app"><button id="launch">出戰準備</button></main>',{url:'https://synthetic-allocation.test',pretendToBeVisual:true}),w=dom.window,d=w.document,app=d.querySelector('.app');
 Object.assign(app.dataset,{layout:size.logicalWidth>size.logicalHeight?'landscape':'portrait',rotation:String(size.rotation||0),touch:'true'});
 Object.assign(app.style,{width:size.logicalWidth+'px',height:size.logicalHeight+'px'});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const envelope=newEnvelope();envelope.campaign.profiles[0].campaign.xp=160;
 const storage=memoryStorage({[CHALLENGE_KEY]:JSON.stringify(envelope)}),writes=[],set=storage.setItem;
 storage.setItem=(key,value)=>{writes.push({key,value});set(key,value);};
 const controller=await openChallengeProgress({storage,locks:memoryLocks()});
 const ui=standalone?mountChallengePreparation({document:d,window:w,parent:app,controller,characters:CAST}):mountChallengeUI({controller,characters:CAST,parent:app});
 ui.open(standalone?{intent:'save-only',characterId:'han',readOnly}:{view:'preparation',characterId:'han'});
 const prep=d.querySelector('.challenge-preparation-overlay');
 for(const node of [ui.element,prep])Object.assign(node.dataset,{layout:app.dataset.layout,compact:String(size.logicalHeight<=500),rotation:String(size.rotation||0),touch:'true'});
 const q=selector=>prep.querySelector(selector),id=s=>q(`[id$="${s}"]`);
 const change=(name,value)=>{id(name).value=value;id(name).dispatchEvent(new w.Event('change',{bubbles:true}));};
 t.after(()=>{ui.destroy();w.close();});
 return {dom,w,d,app,ui,prep,q,id,change,storage,writes,controller,size,raw:()=>storage.getItem(CHALLENGE_KEY)};
}
// JSDOM does not lay out or evaluate media/container queries. Select which
// declarations apply, then let its CSS cascade expose property regressions.
// This is a CSS/DOM contract check, never a pixel-geometry measurement.
export function cssAt(css,size,{containerWidth=size.containerWidth}={}){
 css=css.replace(/\/\*[\s\S]*?\*\//g,'');let output='',from=0;
 while(from<css.length){const open=css.indexOf('{',from);if(open<0)break;let depth=1,end=open+1;while(depth&&end<css.length){if(css[end]==='{')depth++;if(css[end]==='}')depth--;end++;}const selector=css.slice(from,open).trim(),body=css.slice(open+1,end-1);from=end;
  if(selector.startsWith('@media')||selector.startsWith('@container')){
   const container=selector.startsWith('@container');const matches=[...selector.matchAll(/\((min|max)-(width|height):\s*([\d.]+)px\)/g)].every(([,bound,axis,n])=>{if(container&&!Number.isFinite(containerWidth))throw new Error('Pass the named container inline-size explicitly');const actual=container?containerWidth:size[axis];return bound==='max'?actual<=+n:actual>=+n;});
   if(matches)output+=cssAt(body,size,{containerWidth});continue;
  }
  if(!selector.startsWith('@'))output+=`${selector}{${body}}`;
 }return output;
}
export function injectPreparationCSS(f){
 const style=f.d.createElement('style');
 style.textContent=['challenge.css','challenge-layout.css','game-select.css','challenge-preparation.css'].map(file=>cssAt(readFileSync(new URL('../../dist/'+file,import.meta.url),'utf8'),f.size)).join('\n');
 f.d.head.append(style);return element=>f.w.getComputedStyle(typeof element==='string'?f.q(element):element);
}
