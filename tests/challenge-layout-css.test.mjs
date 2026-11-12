import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';
const path=new URL('../dist/challenge-layout.css',import.meta.url);
test('permanent save slot has a bounded single line independent of status length',()=>{
 assert.ok(existsSync(path),'common challenge stylesheet must exist');
 const css=readFileSync(path,'utf8'),rule=stylesAt(css,['.challenge-save-slot'],{width:844,height:390});
 assert.equal(rule.width,'104px');assert.equal(rule.height,'32px');assert.equal(rule.overflow,'hidden');
 assert.equal(rule['white-space'],'nowrap');assert.equal(rule['flex-shrink'],'0');
});
test('shared layout consumes logical insets, not physical env values a second time',()=>{
 assert.ok(existsSync(path),'common challenge stylesheet must exist');const css=readFileSync(path,'utf8');
 assert.doesNotMatch(css,/env\(safe-area-inset/);assert.match(css,/--challenge-safe-bottom/);
 const prep=stylesAt(css,['.challenge-preparation-panel'],{width:568,height:320});
 assert.equal(prep['overflow-y'],'auto');assert.equal(prep['min-height'],'0');
});
test('legacy campaign bar positioning cannot override the permanent save cell',()=>{
 const css=readFileSync(path,'utf8'),rule=stylesAt(css,['#campaign-bar.challenge-save-slot','#campaign-bar.challenge-save-slot.campaign-bar-combat'],{width:390,height:844});
 assert.equal(rule.position,'static');assert.equal(rule['max-height'],'32px');assert.equal(rule.transform,'none');assert.equal(rule['flex-wrap'],'nowrap');
});
test('short logical landscape shares a compact HUD budget without affecting desktop or portrait',()=>{
 const css=readFileSync(path,'utf8');
 for(const selector of ['#trial-app.cabinet.app[data-touch="true"][data-layout="landscape"][data-compact="true"] #hud.dom-hud','#viewport-shell>.app[data-game-mode="challenge"][data-touch="true"][data-layout="landscape"][data-compact="true"] .dom-hud']){
  const rule=stylesAt(css,[selector],{width:844,height:390});assert.equal(rule.height,'48px');assert.equal(rule.top,'calc(var(--challenge-safe-top) + 40px)');
 }
});
test('blocked-entry recovery is an independently scrolling foreground surface',()=>{
 const rule=stylesAt(readFileSync(path,'utf8'),['#challengeRecoveryPanel[data-floating="true"]'],{width:568,height:320});
 assert.equal(rule.position,'absolute');assert.equal(rule['overflow-y'],'auto');assert.ok(Number(rule['z-index'])>30);
});
test('a hidden save slot stays hidden before a formal challenge begins',()=>{
 const rule=stylesAt(readFileSync(path,'utf8'),['.challenge-save-slot[hidden]'],{width:390,height:844});assert.equal(rule.display,'none!important');
});
test('bound top-layer dialogs override sideways centering with their own anchor coordinates',()=>{
 const rule=stylesAt(readFileSync(path,'utf8'),['html body[data-sideways="true"]>dialog[data-viewport-anchor]'],{width:390,height:844});
 assert.equal(rule.left,'var(--challenge-dialog-left)!important');assert.equal(rule.top,'var(--challenge-dialog-top)!important');
});

// A declaration/cascade contract, not painted geometry: evaluate each shipped
// HTML stylesheet stack against its actual DOM and physical media-query width.
import {JSDOM} from 'jsdom';
function shippedStyles(chapter,{width=390,height=844,touch=true,portrait=true}={}){
 const entry=new URL(chapter===1?'../dist/index.html':`../dist/preview/chapter${chapter}/index.html`,import.meta.url),html=readFileSync(entry,'utf8');
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,'')),d=dom.window.document,app=d.querySelector(chapter===1?'.app':'#trial-app');
 for(const el of [app,d.body])Object.assign(el.dataset,{touch:String(touch),layout:portrait?'portrait':'landscape',compact:String(height<=500),challengeLayout:'true',gameMode:'challenge'});
 if(chapter!==1){const bar=d.createElement('aside');bar.id='campaign-bar';bar.className='challenge-save-slot campaign-bar-combat';bar.dataset.status='saved';bar.innerHTML='<span id="campaign-save-state">已保存</span>';app.querySelector('header').insertBefore(bar,app.querySelector('.toolbar'));}
 for(const el of app.querySelectorAll('.toolbar button'))el.dataset.shortLabel='設定';
 const sheets=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^\"]*)?"/g)].map(m=>readFileSync(new URL(m[1],entry),'utf8').replace(/\/\*[\s\S]*?\*\//g,''));
 const specificity=s=>(s.match(/#[\w-]+/g)||[]).length*10000+(s.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\(|has\(|is\()[\w-]+/g)||[]).length*100+(s.replace(/\[[^\]]+\]|\.[\w-]+|#[\w-]+|:[\w-]+(?:\([^)]*\))?/g,'').match(/\b[a-z]+\b/g)||[]).length;
 const condition=query=>[...query.matchAll(/\(([^:]+):\s*([^\)]+)\)/g)].every(([,feature,value])=>{feature=feature.trim();value=value.trim();if(feature==='orientation')return value===(width>height?'landscape':'portrait');const m=feature.match(/^(min|max)-(width|height)$/);if(!m)return false;const actual=m[2]==='width'?width:height;return m[1]==='min'?actual>=parseFloat(value):actual<=parseFloat(value);});
 function style(selector,pseudo=''){
  const el=typeof selector==='string'?app.querySelector(selector):selector,result={},priorities={};let order=0;
  function visit(source){let start=0;while(start<source.length){const open=source.indexOf('{',start);if(open<0)break;let depth=1,end=open+1;while(depth&&end<source.length){if(source[end]==='{')depth++;if(source[end]==='}')depth--;end++;}const selector=source.slice(start,open).trim(),body=source.slice(open+1,end-1);start=end;if(selector.startsWith('@media')){if(condition(selector))visit(body);continue;}if(selector.startsWith('@'))continue;
   for(const raw of selector.split(/,(?![^()]*\))/)){const s=raw.trim(),suffix=s.match(/::?(before|after)$/)?.[1]||'';if(suffix!==pseudo||/:focus|:active|:hover/.test(s))continue;let matches=false;try{matches=el.matches(s.replace(/::?(before|after)$/,''));}catch{}if(!matches)continue;for(const declaration of body.split(';')){const colon=declaration.indexOf(':');if(colon<0)continue;const key=declaration.slice(0,colon).trim();let value=declaration.slice(colon+1).trim();const score=(value.includes('!important')?1e12:0)+specificity(s)*1e6+(order++);value=value.replace(/\s*!important/,'');if(score>=(priorities[key]??-1)){priorities[key]=score;result[key]=value;}}}
  }}for(const sheet of sheets)visit(sheet);return result;
 }
 return{d,app,style,close:()=>dom.window.close()};
}
for(const chapter of [1,2,3,4])for(const width of [320,360,390,430])test(`chapter ${chapter}, ${width}px: real stylesheet stack reserves one 44px portrait row without shrinking controls`,()=>{
 const f=shippedStyles(chapter,{width});try{
  const h=f.style('header'),brand=f.style('.brand'),wordmark=f.style('.brand > span:not(.brand-icon)'),icon=f.style('.brand-icon'),toolbar=f.style('.toolbar'),save=f.style('.challenge-save-slot');
  assert.equal(h.height,'44px');assert.equal(h['grid-template-rows'],'44px');assert.equal(h['grid-template-columns'],width<390?'44px 44px minmax(0,1fr)':'104px 44px minmax(0,1fr)');assert.equal(h['column-gap'],'4px');assert.match(h.inset,/\+ 6px\)/);
  assert.equal(toolbar.display,'grid');assert.equal(toolbar['grid-template-columns'],'repeat(4,minmax(0,1fr))');assert.equal(toolbar.gap,'3px');assert.equal(toolbar.width,'100%');
  assert.equal(brand['min-height'],'44px');assert.equal(brand['min-width'],'44px');assert.equal(brand.overflow,'visible');assert.equal(wordmark.display,width<390?'none':'block');assert.equal(icon.display,'inline-block');assert.equal(f.app.querySelector('.brand').getAttribute('aria-label'),'拳民開講，回首頁');
  for(const id of ['home','sound','pause','help']){const b=f.style('#'+id);assert.equal(b['min-width'],'44px',id);assert.equal(b['min-height'],'44px',id);assert.equal(b.height,'44px',id);assert.equal(b['font-size'],'0',id);const label=f.style('#'+id,'after');assert.equal(label.content,'attr(data-short-label)');assert.equal(label['font-size'],'12px');}
  for(const key of ['width','min-width','max-width','height','min-height','max-height'])assert.equal(save[key],'44px','save '+key);assert.equal(save['font-size'],'0');assert.equal(f.style('.dom-hud').top,'calc(var(--challenge-safe-top) + 70px)');
 }finally{f.close();}
});
for(const chapter of [1,2,3,4])test(`chapter ${chapter} save pseudo-label follows all four status values without discarding full text`,()=>{
 const f=shippedStyles(chapter);try{const slot=f.app.querySelector('.challenge-save-slot'),text=slot.textContent;for(const [status,label]of [['saved','已保存'],['busy','保存中'],['error','需處理'],['preview','不保存']]){slot.dataset.status=status;assert.equal(f.style(slot,'after').content,`'${label}'`);assert.equal(f.style(slot,'after')['font-size'],'12px');assert.equal(slot.textContent,text);}}finally{f.close();}
});
for(const chapter of [1,2,3,4])test(`chapter ${chapter} native/sideways landscape and desktop exclude compact portrait labels`,()=>{
 for(const options of [{width:844,height:390,portrait:false},{width:390,height:844,portrait:false},{width:1366,height:768,touch:false,portrait:false},...(chapter===1?[{width:390,height:844,touch:false,portrait:true}]:[])]){
  const f=shippedStyles(chapter,options);try{assert.notEqual(f.style('header')['grid-template-rows'],'44px');assert.notEqual(f.style('.brand-icon').display,'none');for(const id of ['home','sound','pause','help'])assert.notEqual(f.style('#'+id,'after').content,'attr(data-short-label)');assert.equal(f.style('.challenge-save-slot').width,'104px');}finally{f.close();}
 }
});

// Independently transcribed from the six portrait toolbar rules in
// 806f00c3f16d51708c7bd52f4da8ca57825f7b89:dist/challenge-layout.css, lines 31–42.
// The later-chapter non-touch profile must retain these #67 declarations, not
// inherit the generic desktop fallback when the touch design changes.
const nonTouchPortrait67={
 header:{height:'38px','grid-template-columns':'56px 62px minmax(0,1fr)','grid-template-rows':'32px','column-gap':'4px','row-gap':'0','align-content':'center'},
 '.brand':{'grid-column':'1','grid-row':'1','justify-self':'start','font-size':'14px','line-height':'20px',gap:'0'},
 '.brand-icon':{display:'none'},
 '.challenge-save-slot':{'grid-column':'2','grid-row':'1',width:'62px','min-width':'62px','max-width':'62px','font-size':'10px',padding:'3px 2px'},
 '.toolbar':{'grid-column':'3','grid-row':'1',gap:'3px','min-width':'0','align-items':'center'},
};
const nonTouchPortraitButton67={'min-width':'30px','min-height':'32px',height:'32px',padding:'3px 3px','font-size':'10px','letter-spacing':'0','white-space':'nowrap'};
for(const chapter of [2,3,4])for(const width of [320,360,390,430])test(`chapter ${chapter}, ${width}px: non-touch portrait retains the #67 toolbar in its shipped stylesheet stack`,()=>{
 const f=shippedStyles(chapter,{width,touch:false});try{
  for(const [selector,expected]of Object.entries(nonTouchPortrait67))for(const [key,value]of Object.entries(expected))assert.equal(f.style(selector)[key],value,`${selector} ${key}`);
  for(const id of ['home','sound','pause','help']){
   const button=f.style('#'+id);for(const [key,value]of Object.entries(nonTouchPortraitButton67))assert.equal(button[key],value,`${id} ${key}`);
   assert.notEqual(f.style('#'+id,'after').content,'attr(data-short-label)');
  }
  assert.notEqual(f.style('.challenge-save-slot','after').content,"'已保存'");
 }finally{f.close();}
});
