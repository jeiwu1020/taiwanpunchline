import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

// Cascade/size-contract evaluator only. It does not paint, shape text, or replace
// browser QA. Selectors match the shipped DOM; width conditions use its logical
// cabinet size, including CSS-sideways mode.
const html=readFileSync(new URL('../../dist/index.html',import.meta.url),'utf8');
export const loadedCombatSheets=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^\"]*)?"/g)].map(m=>m[1]);
const sheets=loadedCombatSheets.map(name=>({name,css:readFileSync(new URL(`../../dist/${name}`,import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'')}));
const specificity=selector=>(selector.match(/#[\w-]+/g)||[]).length*10000+(selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\(|has\(|is\()[\w-]+/g)||[]).length*100+(selector.replace(/\[[^\]]+\]|\.[\w-]+|#[\w-]+|:[\w-]+(?:\([^)]*\))?/g,'').match(/\b[a-z]+\b/g)||[]).length;
export function combatStyles({touch=true,portrait=false,depth=false,width=844,height=390,sideways=false,exclude=[]}={}){
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,''));
 const document=dom.window.document,app=document.querySelector('.app');
 Object.assign(app.dataset,{touch:String(touch),layout:portrait?'portrait':'landscape',overlayControls:String(touch&&!portrait),depthRoute:String(depth),titleOpen:'false',rotation:sideways?'90':'0'});
 document.querySelectorAll('.screen').forEach(el=>el.classList.add('hidden'));document.querySelector('.control-deck').removeAttribute('inert');
 const logicalWidth=sideways?height:width,cabinetWidth=logicalWidth-(touch?16:28);
 function condition(query,container){
  return [...query.matchAll(/\(([^:]+):\s*([^\)]+)\)/g)].every(([,feature,value])=>{
   feature=feature.trim();value=value.trim();
   if(feature==='orientation')return value===(width>height?'landscape':'portrait');
   const m=feature.match(/^(min|max)-(width|height)$/);if(!m)return false;
   const actual=container?cabinetWidth:(m[2]==='width'?width:height);
   return m[1]==='min'?actual>=parseFloat(value):actual<=parseFloat(value);
  });
 }
 function style(selector){
  const element=typeof selector==='string'?document.querySelector(selector):selector;
  if(!element)throw new Error(`No shipped element: ${selector}`);
  const result={},priorities={};let order=0;
  function put(key,value,score){if(score>=(priorities[key]??-1)){priorities[key]=score;result[key]=value;}}
  function visit(source){
   let start=0;while(start<source.length){
    const open=source.indexOf('{',start);if(open<0)break;let count=1,end=open+1;
    while(count&&end<source.length){if(source[end]==='{')count++;if(source[end]==='}')count--;end++;}
    const selector=source.slice(start,open).trim(),body=source.slice(open+1,end-1);start=end;
    if(selector.startsWith('@media')){if(condition(selector,false))visit(body);continue;}
    if(selector.startsWith('@container')){if(condition(selector,true))visit(body);continue;}
    if(selector.startsWith('@'))continue;
    for(const s of selector.split(',')){
     if(/::|:before|:after|:focus|:active|:hover/.test(s))continue;
     let matches=false;try{matches=element.matches(s);}catch{continue;}if(!matches)continue;
     for(const declaration of body.split(';')){
      const colon=declaration.indexOf(':');if(colon<0)continue;
      const key=declaration.slice(0,colon).trim();let value=declaration.slice(colon+1).trim();
      const important=value.includes('!important');value=value.replace(/\s*!important/,'');
      const score=(important?1e12:0)+specificity(s)*1e6+(order++);put(key,value,score);
      if(key==='gap'){const values=value.split(/\s+/);put('row-gap',values[0],score);put('column-gap',values[1]||values[0],score);}
      if(key==='padding'||key==='inset'){const p=value.split(/\s+/);['top','right','bottom','left'].forEach((side,i)=>put(key==='padding'?`padding-${side}`:side,[p[0],p[1]||p[0],p[2]||p[0],p[3]||p[1]||p[0]][i],score));}
     }
    }
   }
  }
  for(const sheet of sheets)if(!exclude.includes(sheet.name))visit(sheet.css);return result;
 }
 return{style,document,logicalWidth,cabinetWidth,close:()=>dom.window.close()};
}
