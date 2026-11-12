import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const charge=await import('../dist/charge-view.mjs').catch(()=>({}));
const selection=await import('../dist/gameplay-selection.mjs').catch(()=>({}));

test('charge bars show empty, partial, full and active without rounding 99.9 to ready',()=>{
 assert.equal(typeof charge.chargeMeterView,'function');
 for(const [input,expected] of [[{charge:0},{percent:0,ratio:0,text:'0%'}],[{charge:49.7},{percent:49,ratio:.497,text:'49%'}],[{charge:99.9},{percent:99,ratio:.9990000000000001,text:'99%'}],[{charge:100,ready:true},{percent:100,ratio:1,text:'可用'}],[{charge:100,active:true},{percent:100,ratio:1,text:'登場中'}]]){
  const actual=charge.chargeMeterView(input);assert.equal(actual.percent,expected.percent);assert.ok(Math.abs(actual.ratio-expected.ratio)<1e-10);assert.equal(actual.text,expected.text);
 }
 for(const bad of [NaN,Infinity,-2])assert.equal(charge.chargeMeterView({charge:bad}).percent,0);
});
test('charge renderer writes actual horizontal bar width and numeric accessible progress',()=>{
 assert.equal(typeof charge.renderChargeMeter,'function');const attrs={},fill={style:{}},button={querySelector:s=>s==='.charge-fill'?fill:null,setAttribute:(k,v)=>attrs[k]=v};
 charge.renderChargeMeter(button,{charge:42.5});assert.equal(fill.style.transform,'scaleX(0.425)');assert.equal(attrs['data-charge-percent'],'42');
 charge.renderChargeMeter(button,{charge:100,ready:true});assert.equal(fill.style.transform,'scaleX(1)');
});
test('long-press selection/context menus are blocked on gameplay overlays but editable fields remain native',()=>{
 assert.equal(typeof selection.mountGameplaySelectionGuard,'function');
 const handlers={};const root={addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener(){}};
 selection.mountGameplaySelectionGuard({root,ownsTarget:t=>t.owned});
 for(const name of ['selectstart','contextmenu','dragstart'])for(const [owned,editable,expected] of [[true,false,true],[true,true,false],[false,false,false]]){
  const event={cancelable:true,target:{owned,closest:()=>editable?{}:null},preventDefault(){this.cancelled=true;}};
  handlers[name](event);assert.equal(!!event.cancelled,expected,`${name} owned=${owned} editable=${editable}`);
 }
 assert.equal(handlers.touchstart,undefined,'do not consume settings scrolling or form gestures');
});
test('trial retains its bars, main game uses only button fill, and only challenge exposes the extra jump',async()=>{
 const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');const html=await read('index.html'),trial=await read('street-trial.html'),css=await read('combat-ui-v68.css').catch(()=>''),trialCSS=await read('street-trial.css');
 assert.match(html,/id="challenge-jump"[^>]*data-action="jump"/);assert.match(html,/combat-ui-v68\.css/);
 assert.equal((html.match(/class="charge-fill"/g)||[]).length,0);assert.equal((trial.match(/class="charge-fill"/g)||[]).length,2);assert.equal((trial.match(/class="trial-cooldown"/g)||[]).length,3);
 assert.match(css,/#challenge-jump\{display:none/);assert.match(css,/data-depth-route=true[^}]+#challenge-jump\{display:flex/);
 assert.match(trialCSS,/-webkit-user-select:none/);assert.match(css,/\.broadcast[^}]*background:/);
});
test('current settings distinguish four-way street movement from ordinary duel controls',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const controls=html.match(/<h3>手機操作<\/h3>([\s\S]*?)<h3>模式、揪團與助拳<\/h3>/)?.[1];
 assert.ok(controls,'current control help exists');
 assert.match(controls,/街道[\s\S]*?上下左右走位[\s\S]*?獨立[\s\S]*?跳[\s\S]*?空白鍵/);
 assert.match(controls,/一般對戰[\s\S]*?上推跳[\s\S]*?下推蹲/);
});
