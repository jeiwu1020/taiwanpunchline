import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountChallengeStory} from '../dist/challenge-story.mjs';
import {BOSS_DIALOGUES,challengeOpening} from '../dist/challenge-flow.mjs';
import {combatStyles} from './helpers/loaded-combat-styles.mjs';
import {deferred} from './helpers/game-harness.mjs';

// Loaded stylesheet cascade + explicit track budgets, not painted browser
// geometry. Native/sideways visible intersection and hit testing remain QA gates.
const profiles=[[568,320,0],[568,320,90],[568,320,-90],[844,390,0],[844,390,90],[390,844,0],[320,568,0],[1440,900,0]];
function fixture(t,{width=568,height=320,rotation=0,cinematic=false}={}){
 const f=combatStyles({width,height,portrait:width<height,touch:width<1000}),doc=f.document,win=doc.defaultView,app=doc.querySelector('.app');
 app.style.width=width+'px';app.style.height=height+'px';app.dataset.rotation=String(rotation);win.requestAnimationFrame=()=>1;win.cancelAnimationFrame=()=>{};win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const ui=mountChallengeStory({document:doc}),root=doc.querySelector('.challenge-story'),beats=cinematic?challengeOpening('han'):BOSS_DIALOGUES[2];t.after(()=>{ui.destroy();f.close();});
 const next=root.querySelector('[data-story-next]'),back=root.querySelector('[data-story-return]'),count=root.querySelector('.story-actions>span');
 const advance=()=>{for(let i=0;i<8&&root.open&&!root.dataset.displayRecovery&&root.getAttribute('aria-busy')!=='true';i++)next.click();};
 return {...f,doc,win,app,ui,root,beats,next,back,count,advance};
}
function recovery(mode,extra={}){return {accepted:false,reason:'scene-unavailable',isCurrent:()=>true,message:'配置已保存，但場景尚未顯示。請重試顯示或返回總覽。',...(mode!=='return'?{retryPresentation:()=>true}:{}),...(mode!=='retry'?{returnToOverview:()=>{}}:{}),...extra};}
function assertTrackContract(f,mode){
 const actions=f.style(f.root.querySelector('.story-actions')),columns=mode==='both'?2:1;
 assert.equal(actions.display,'grid');assert.equal(actions['grid-template-columns'],columns===2?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)');assert.equal(actions['min-width'],'0');assert.equal(f.style(f.count).display,'none','page count must not consume a recovery action track');
 assert.equal(f.root.dataset.displayRecovery,mode);
 for(const control of [f.next,f.back]){const style=f.style(control);if(control.hidden){assert.equal(style.display,'none');continue;}
  assert.equal(style['grid-column'],'auto','cinematic next must not retain its normal full-row span');assert.equal(style['min-width'],'0','the compact 110px minimum must not force overflow');assert.equal(style.width,'100%');assert.equal(style['box-sizing'],'border-box');assert.ok(parseFloat(style['min-height'])>=44);assert.equal(style['font-size'],'16px');
 }
 // Conservative copy-inner widths, including the smallest 220px cinematic
 // caption minus padding/border. No text shaping or screen pixels are inferred.
 for(const available of [193,209,240,300,600]){const gap=parseFloat(actions.gap),track=(available-gap*(columns-1))/columns;assert.ok(track>=88,'the conservative track budget leaves a useful label/padding width');assert.ok(columns*track+(columns-1)*gap<=available+1e-9);}
}
for(const cinematic of [false,true])for(const mode of ['both','retry','return'])test(`${cinematic?'cinematic':'boss'} recovery ${mode} uses bounded full-width tracks across logical layouts`,t=>{
 for(const[width,height,rotation]of profiles){const f=fixture(t,{width,height,rotation,cinematic});f.ui.show(f.beats,{onComplete:()=>recovery(mode)});f.advance();assert.equal(f.root.open,true);assert.equal(f.next.hidden,mode==='return');assert.equal(f.back.hidden,mode==='retry');assertTrackContract(f,mode);}
});
test('the loaded recovery CSS itself removes the compact min-width and counter even before controller activation',t=>{
 const f=fixture(t);f.ui.show(f.beats);f.root.dataset.displayRecovery='both';f.back.hidden=false;assertTrackContract(f,'both');
});
for(const mode of ['both','retry','return'])test(`direct round recovery ${mode} follows the same layout contract`,t=>{
 const f=fixture(t);let activated=0;assert.equal(f.ui.showRecovery(recovery(mode,{...(mode!=='return'?{retryPresentation:()=>{activated++;return true;}}:{}),...(mode!=='retry'?{returnToOverview:()=>activated++}:{})}),f.beats),true);assertTrackContract(f,mode);(mode==='retry'?f.next:f.back).click();assert.equal(activated,1);assert.equal(f.root.open,false);assert.equal(f.root.dataset.displayRecovery,undefined);
});
for(const cinematic of [false,true])test(`${cinematic?'cinematic':'boss'} recovery keeps geometry during busy, second failure, rotation, close and normal reopening`,async t=>{
 const f=fixture(t,{cinematic}),pending=deferred();let calls=0,returns=0;
 f.ui.show(f.beats);const normal=()=>[f.root.querySelector('.story-actions'),f.count,f.next,f.root.querySelector('.story-copy')].map(node=>f.style(node)),before=normal();
 const result=recovery('both',{retryPresentation:()=>{calls++;return pending.promise;},returnToOverview:()=>returns++});f.ui.show(f.beats,{onComplete:()=>result});f.advance();assertTrackContract(f,'both');f.next.click();f.next.click();assert.equal(calls,1);assert.equal(f.next.disabled,true);assert.equal(f.back.disabled,true);assertTrackContract(f,'both');
 f.app.dataset.rotation='90';f.win.dispatchEvent(new f.win.Event('resize'));assert.equal(f.root.dataset.rotation,'90');assertTrackContract(f,'both');
 f.app.style.width='390px';f.app.style.height='844px';f.win.dispatchEvent(new f.win.Event('resize'));assert.equal(f.root.dataset.layout,'portrait');assert.equal(f.root.dataset.displayRecovery,'both');
 pending.resolve(recovery('both',{retryPresentation:()=>true,returnToOverview:()=>returns++}));await Promise.resolve();assert.equal(f.root.open,true);assert.equal(f.next.disabled,false);assert.equal(f.back.disabled,false);f.back.click();f.back.click();assert.equal(returns,1);assert.equal(f.root.open,false);assert.equal(f.root.dataset.displayRecovery,undefined);
 f.app.style.width='568px';f.app.style.height='320px';f.app.dataset.rotation='0';f.ui.show(f.beats);assert.equal(f.root.dataset.displayRecovery,undefined);assert.deepEqual(normal(),before,'ordinary story cascade must be unchanged after recovery');assert.equal(f.back.hidden,true);
 f.ui.show(f.beats,{onComplete:()=>recovery('retry')});f.advance();f.next.click();assert.equal(f.root.open,false);assert.equal(f.root.dataset.displayRecovery,undefined);
});
test('close removes recovery state even when a stale pending retry later resolves',async t=>{
 const f=fixture(t),pending=deferred();f.ui.showRecovery(recovery('both',{retryPresentation:()=>pending.promise}),f.beats);f.next.click();f.ui.close();f.ui.show(f.beats);pending.resolve(recovery('return'));await Promise.resolve();assert.equal(f.root.dataset.displayRecovery,undefined);assert.equal(f.back.hidden,true);assert.equal(f.next.textContent,'下一格 →');
});

test('new caption rules only match explicit story recovery, never normal comics or chapter pages',()=>{
 const css=readFileSync(new URL('../dist/challenge-game.css',import.meta.url),'utf8'),rules=css.slice(css.indexOf('/* Saved-scene recovery')).replace(/\/\*[\s\S]*?\*\//g,'');let count=0;
 for(const match of rules.matchAll(/([^{}]+)\{[^{}]*\}/g))for(const selector of match[1].trim().split(',')){count++;assert.match(selector,/^\.challenge-story\[data-display-recovery(?:[=\]])/);}
 assert.ok(count>=5);
});
test('a retry failure can narrow to the sole return action without reserving a hidden retry track',async t=>{
 const f=fixture(t),pending=deferred();let returned=0;f.ui.showRecovery(recovery('both',{retryPresentation:()=>pending.promise}),f.beats);f.next.click();pending.resolve(recovery('return',{returnToOverview:()=>returned++}));await Promise.resolve();assertTrackContract(f,'return');assert.equal(f.next.hidden,true);assert.equal(f.back.disabled,false);f.back.click();assert.equal(returned,1);assert.equal(f.root.open,false);assert.equal(f.root.dataset.displayRecovery,undefined);
});
