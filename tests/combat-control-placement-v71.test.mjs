import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

// Historical V71 contract. V73 intentionally replaces its wide layouts; current
// all-sheets desktop/landscape/portrait coverage is wide-control-layout-v73.
// Contract/budget checks, not a browser replacement. Read every loaded sheet in
// order and rank actual matching declarations by importance and specificity.
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const sheets=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(name=>name!=='combat-controls-v73.css');
if(!sheets.includes('combat-controls-v71.css'))sheets.push('combat-controls-v71.css');
const css=sheets.map(name=>{const path=new URL(`../dist/${name}`,import.meta.url);return existsSync(path)?readFileSync(path,'utf8'):'';}).join('\n').replace(/\/\*[\s\S]*?\*\//g,'');
const node=(tag,classes=[],attrs={})=>({tag,classes,attrs});
const parts={
 deck:[node('div',['control-deck'])],
 movement:[node('div',['control-deck']),node('div',['movement'])],
 moveButton:[node('div',['control-deck']),node('div',['movement']),node('button')],
 specials:[node('div',['control-deck']),node('div',['specials'])],
 special:[node('div',['control-deck']),node('div',['specials']),node('button',[],{'data-action':'special1'})],
 name:[node('div',['control-deck']),node('div',['specials']),node('button'),node('span',['move-copy']),node('strong')],
 key:[node('div',['control-deck']),node('div',['specials']),node('button'),node('kbd')],
 cooldown:[node('div',['control-deck']),node('div',['specials']),node('button'),node('span',['cooldown'])],
 dial:[node('div',['control-deck']),node('div',['specials']),node('button'),node('span',['cooldown']),node('svg',['cooldown-dial'])],
 value:[node('div',['control-deck']),node('div',['specials']),node('button',['cooling']),node('span',['cooldown']),node('span',['cooldown-value'])],
 stick:[node('div',['control-deck']),node('div',['touch-pad']),node('div',[],{id:'touch-stick'})],
 rally:[node('div',['control-deck']),node('div',['basic']),node('button',['rally-button'],{'data-action':'rally'})],
 rallyLabel:[node('div',['control-deck']),node('div',['basic']),node('button',['rally-button'],{'data-action':'rally'}),node('small',['rally-label'])],
 assist:[node('div',['control-deck']),node('div',['basic']),node('button',['assist-button'],{'data-action':'assist'})],
 jump:[node('div',['control-deck']),node('div',['touch-aux']),node('button',[],{id:'challenge-jump','data-action':'jump'})],
 guard:[node('div',['control-deck']),node('div',['touch-aux']),node('button',[],{'data-hold':'guard'})],
 attack:[node('div',['control-deck']),node('div',['basic']),node('button',['punch'],{'data-hold':'punch'})],
 cabinet:[],
};
function matchesToken(token,n){
 if(/:has|::|:focus|:active|:nth|:disabled/.test(token))return false;
 let valid=true;
 token=token.replace(/:not\(([^)]+)\)/g,(_,inner)=>{if(matchesToken(inner,n))valid=false;return '';});
 if(!valid)return false;
 token=token.replace(/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/g,(_,key,value)=>{if(!(key in n.attrs)||(value!==undefined&&n.attrs[key]!==value))valid=false;return '';});
 token=token.replace(/#([\w-]+)/g,(_,id)=>{if(n.attrs.id!==id)valid=false;return '';});
 token=token.replace(/\.([\w-]+)/g,(_,name)=>{if(!n.classes.includes(name))valid=false;return '';});
 return valid&&(token===''||token==='*'||token===n.tag);
}
function matches(selector,path){
 const tokens=selector.trim().replace(/\s*>\s*/g,' > ').split(/\s+/);let p=path.length-1;
 if(!matchesToken(tokens.pop(),path[p--]))return false;
 while(tokens.length){let token=tokens.pop();if(token==='>'){if(p<0||!matchesToken(tokens.pop(),path[p--]))return false;}else{while(p>=0&&!matchesToken(token,path[p]))p--;if(p--<0)return false;}}
 return true;
}
function rank(selector){return (selector.match(/#[\w-]+/g)||[]).length*10000+((selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!not)[\w-]+/g)||[]).length)*100+(selector.replace(/\[[^\]]+\]|\.[\w-]+|#[\w-]+|:[\w-]+(?:\([^)]*\))?/g,'').match(/\b[a-z]+\b/g)||[]).length;}
function style(part,{touch=true,portrait=false,depth=false,width=844,height=390,sideways=false}={}){
 const logicalWidth=sideways?height:width;
 const cabinetWidth=logicalWidth-(touch?16:28);
 const app=node('main',['app'],{'data-touch':String(touch),'data-layout':portrait?'portrait':'landscape','data-overlay-controls':String(touch&&!portrait),'data-depth-route':String(depth)});
 const path=[app,node('section',['cabinet']),...parts[part]];const result={},priority={};let order=0;
 function condition(query,container=false){return [...query.matchAll(/\(([^:]+):\s*([^\)]+)\)/g)].every(([,feature,value])=>{feature=feature.trim();value=value.trim();if(feature==='orientation')return value===(width>height?'landscape':'portrait');const m=feature.match(/^(min|max)-(width|height)$/);if(!m)return false;const actual=container?cabinetWidth:(m[2]==='width'?width:height);return m[1]==='min'?actual>=parseFloat(value):actual<=parseFloat(value);});}
 function visit(source){let start=0;while(start<source.length){const open=source.indexOf('{',start);if(open<0)break;let count=1,end=open+1;while(count&&end<source.length){if(source[end]==='{')count++;if(source[end]==='}')count--;end++;}const selector=source.slice(start,open).trim(),body=source.slice(open+1,end-1);start=end;if(selector.startsWith('@media')){if(condition(selector))visit(body);continue;}if(selector.startsWith('@container')){if(condition(selector,true))visit(body);continue;}if(selector.startsWith('@'))continue;for(const s of selector.split(',')){if(!matches(s,path))continue;for(const declaration of body.split(';')){const colon=declaration.indexOf(':');if(colon<0)continue;const key=declaration.slice(0,colon).trim();let value=declaration.slice(colon+1).trim();const important=value.includes('!important');value=value.replace(/\s*!important/,'');const score=(important?1e9:0)+rank(s)*10000+(order++);if(score>=(priority[key]??-1)){priority[key]=score;result[key]=value;}}}}}
 visit(css);return result;
}
const actionNames=['rally','assist','jump','guard','attack'];
function positions(options){return actionNames.map(name=>{const s=style(name,options);return{name,col:Number(s['grid-column']),row:Number(s['grid-row'])};});}
function pixels(value){assert.match(value,/^\d+(?:\.\d+)?px$/);return parseFloat(value);}
function budget(options){const deck=style('deck',options),p=(deck.padding||'0').split(/\s+/).map(parseFloat),paddingX=p.length===1?p[0]*2:p[1]*2;const action=pixels(deck['--action-size']);const special=pixels(deck['--special-min-width']);const movement=pixels(deck['--movement-width']);const columns=positions(options);const actionCols=new Set(columns.map(x=>x.col)).size;const gap=parseFloat(deck['column-gap']||deck.gap.split(/\s+/).at(-1));const logicalWidth=options.sideways?options.height:options.width;const deckWidth=logicalWidth-(options.touch===false?28:16)-(options.touch===false?0:24);return {required:movement+special+actionCols*action+(actionCols+1)*gap+paddingX,available:deckWidth,action,special,deck};}

test('VS and street both keep five equal action targets without competing cells',()=>{
 for(const touch of [false,true])for(const depth of [false,true])for(const width of [650,740,844,1280]){
  const options={touch,depth,width},pos=positions(options);assert.equal(style('jump',options).display,'flex');
  assert.equal(new Set(pos.map(x=>`${x.col}:${x.row}`)).size,5);
  const dimensions=actionNames.map(name=>{const s=style(name,options);return `${s.width}:${s.height}`;});assert.equal(new Set(dimensions).size,1);
  assert.ok(pixels(style('deck',options)['--action-size'])>=54);
 }
});

test('desktop and logical landscape specials occupy the bottom center between movement and actions',()=>{
 for(const options of [{touch:false,width:1280},{width:844},{width:740},{width:650},{width:390,height:844,sideways:true}]){
  const specials=style('specials',options),pos=positions(options);assert.equal(specials['grid-column'],'2');assert.equal(specials['align-self'],'end');
  assert.ok(Number(specials['grid-row'])===Math.max(...pos.map(x=>x.row)),'specials stay on the lowest control row');
  assert.ok(pos.every(x=>x.col>2),'all actions are to the right of specials');
  assert.deepEqual([...pos].sort((a,b)=>a.row-b.row||a.col-b.col).map(x=>x.name),actionNames);
  const b=budget(options);assert.ok(b.required<=b.available,`${JSON.stringify(options)} requires ${b.required}px, available ${b.available}px`);
 }
});

test('650px landscape uses two action rows rather than shrinking labels or overlapping the center',()=>{
 assert.equal(new Set(positions({width:650}).map(p=>p.row)).size,2);
 for(const width of [740,844])assert.equal(new Set(positions({width}).map(p=>p.row)).size,1);
 for(const options of [{width:650},{width:320,height:650,sideways:true}])assert.ok(budget(options).required<=budget(options).available);
});

test('portrait preserves its existing action cells and 320px dock budget',()=>{
 const options={portrait:true,width:320,height:568};
 assert.deepEqual(positions(options),[{name:'rally',col:3,row:3},{name:'assist',col:4,row:2},{name:'jump',col:5,row:2},{name:'guard',col:4,row:3},{name:'attack',col:5,row:3}]);
 assert.equal(style('specials',options)['grid-column'],'1/-1');assert.equal(style('specials',options)['grid-row'],'1');
 const deck=style('deck',options);assert.equal(deck['--action-size'],'54px');assert.ok(100+3*54+4*6+16<=320-16);
});

test('every special retains a readable key and seconds in separate cells below the complete name',()=>{
 for(const options of [{portrait:true,width:320,height:568},{width:650},{width:740},{width:844},{touch:false,width:1280}]){
  const key=style('key',options),cooldown=style('cooldown',options),name=style('name',options),card=style('special',options);
  assert.equal(key.display,'block');assert.ok(parseFloat(key['font-size'])>=13);assert.equal(key['grid-row'],'2');assert.equal(cooldown['grid-row'],'2');assert.notEqual(key['grid-column'],cooldown['grid-column']);
  assert.ok(parseFloat(name['font-size'])>=18);assert.ok(parseFloat(style('value',options)['font-size'])>=13);
  const width=options.portrait?(320-16-16-12)/3:(pixels(style('deck',options)['--special-min-width'])-12)/3;
  const charsPerLine=Math.floor((width-6-6)/parseFloat(name['font-size']));
  const nameHeight=Math.ceil(7/charsPerLine)*parseFloat(name['line-height']);
  assert.ok(nameHeight+20+6+2<=pixels(style('deck',options)['--special-height']),`seven-character move fits ${JSON.stringify(options)}`);
  assert.equal(card['grid-template-rows'],'minmax(0,1fr) 20px');
 }
});

test('special cooldown uses a bottom-up ready fill and readable seconds rather than a pie',()=>{
 const s=style('special');assert.ok(s.background?.startsWith('linear-gradient(to top,'));assert.ok(s.background.includes('var(--cooldown-ready,100%)'));
 assert.equal(style('dial').display,'none');assert.notEqual(style('value').display,'none');assert.equal(style('value')['text-shadow'],'none');
});

test('desktop reserves the measured dock height without querying its own cabinet size',()=>{
 for(const width of [650,740,844,1280]){
  const options={touch:false,width},deck=style('deck',options),cabinet=style('cabinet',options);
  assert.equal(cabinet['grid-template-rows'],'minmax(0,1fr) auto');
  const rowHeight=new Set(positions(options).map(p=>p.row)).size===2?42+pixels(deck['--special-height']):width-28<=1000?104:pixels(deck['--special-height']);
  assert.ok(pixels(deck.height)>=rowHeight+16+3,'dock content, padding and border fit');
 }
});

test('568px native and sideways landscape keep complete controls inside the cabinet',()=>{
 for(const options of [{width:568,height:320},{width:320,height:568,sideways:true}]){
  const b=budget(options);
  assert.ok(b.required<=b.available,`compact logical landscape requires ${b.required}px, available ${b.available}px`);
  assert.ok(b.action>=54,'right-side labels keep the same readable action targets');
  assert.ok(pixels(style('stick',options).width)>=44,'the compact stick remains a usable touch target');
  assert.equal(pixels(style('stick',options).width),pixels(b.deck['--movement-width']),'the whole stick fits its reserved track');
  assert.ok(parseFloat(style('name',options)['font-size'])>=18);
  assert.ok(parseFloat(style('key',options)['font-size'])>=13);
  assert.ok(parseFloat(style('value',options)['font-size'])>=13);
 }
});


test('compact rally status keeps three readable characters on one unpadded line',()=>{
 for(const options of [{width:568,height:320},{width:320,height:568,sideways:true}]){
  const label=style('rallyLabel',options),button=style('rally',options),deck=style('deck',options);
  assert.equal(label['font-size'],'14px');
  assert.equal(label['white-space'],'nowrap');assert.equal(label['flex-shrink'],'0');
  assert.equal(label.width,'max-content');assert.equal(label.padding,'0');
  const buttonPadding=button.padding.split(/\s+/).map(parseFloat),horizontalPadding=2*(buttonPadding[1]??buttonPadding[0]);
  const available=pixels(deck['--action-size'])-2*parseFloat(button.border)-horizontalPadding;
  assert.ok(3*parseFloat(label['font-size'])<=available,'集氣中 fits without losing a character to another line');
 }
 assert.equal(style('rallyLabel',{width:844})['font-size'],'11px','ordinary landscape status stays unchanged');
 assert.equal(style('rallyLabel',{portrait:true,width:320,height:568})['font-size'],'11px','upright phone status stays unchanged');
});
