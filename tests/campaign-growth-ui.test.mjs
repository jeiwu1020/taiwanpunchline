import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {fighterBaseStats,deriveFighterStats} from '../dist/fighter-attributes.mjs';
import {mountCampaignGrowthUI} from '../dist/preview/campaign/growth-ui.mjs';

const keys=['hp','move','basic','defense','special','rally','assist'];
const zero=()=>Object.fromEntries(keys.map(k=>[k,0]));
const clone=value=>JSON.parse(JSON.stringify(value));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

// This boundary fixture owns persistence and point rules, just as the injected
// controller does. Tests drive the real dialog with real DOM events.
function fixture(t,patch={}){
 const dom=new JSDOM('<button id="launcher">技能配點</button><button id="outside">遊戲按鈕</button>',{url:'https://growth.test/',pretendToBeVisual:true});
 const {window:w}=dom,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 Object.defineProperty(w,'localStorage',{get(){throw new Error('The UI must never read localStorage');}});
 const state={profileId:'slot-1',unlockedCharacters:['wang','han'],selection:{characterId:'wang',helperId:'han'},xp:160,characters:{wang:{xp:80,skills:zero()},han:{xp:40,skills:zero()}},persisted:true,busy:false,readOnly:false,reason:null,...patch};
 const characters={wang:{name:'王代表',tag:'街頭先鋒',portrait:'',base:{maxHp:123,moveSpeed:9}},han:{name:'韓代表'},huang:{name:'未解鎖角色'}};
 const originalCharacters=clone(characters),calls=[],changes=[],results=[];
 let readError=false;
 const controller={
  get(){if(readError)throw new Error('read failure');return clone(state);},
  async allocate(id,skill){calls.push(['allocate',id,skill]);const queued=results.shift();const result=queued?await queued():{accepted:true,persisted:true,reason:null};if(result.accepted){state.characters[id]??={xp:0,skills:zero()};state.characters[id].skills[skill]++;state.persisted=result.persisted;}return result;},
  async reset(id){calls.push(['reset',id]);const queued=results.shift();const result=queued?await queued():{accepted:true,persisted:true,reason:null};if(result.accepted){state.characters[id].skills=zero();state.persisted=result.persisted;}return result;}
 };
 const ui=mountCampaignGrowthUI({document:d,window:w,characters,controller,onChange:(...args)=>changes.push(args)});
 const q=selector=>ui.element.querySelector(selector),skill=k=>q(`[data-skill="${k}"]`),status=()=>q('[role="status"]').textContent;
 const select=id=>{const e=q('[data-character]');e.value=id;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const launcher=d.querySelector('#launcher');launcher.focus();
 t.after(()=>{ui.destroy();dom.window.close();});
 return {dom,w,d,ui,state,controller,characters,originalCharacters,calls,changes,results,q,skill,status,select,launcher,setReadError:v=>{readError=v;}};
}

test('opening uses the selected unlocked character; switching views never changes party selection',async t=>{
 const f=fixture(t);f.state.selection.characterId='han';f.ui.open();
 assert.equal(f.q('[data-character]').value,'han');
 assert.deepEqual([...f.q('[data-character]').options].map(o=>o.value),['wang','han']);
 f.select('wang');f.skill('hp').click();await flush();
 assert.deepEqual(f.calls,[['allocate','wang','hp']]);assert.equal(f.state.characters.wang.skills.hp,1);
 assert.equal(f.state.selection.characterId,'han');assert.equal(f.q('[data-stat="maxHp"]').textContent,String(Math.round(deriveFighterStats('wang',{challenge:true,skills:{hp:1}}).maxHp)));assert.equal(f.q('[data-stat="maxHp"]').textContent,'98');
 f.select('han');assert.equal(f.skill('hp').dataset.rank,'0');assert.match(f.q('[data-remaining]').textContent,/2/);
 assert.deepEqual(f.characters,f.originalCharacters);
 assert.match(f.ui.element.textContent,/技能只影響挑戰/);assert.match(f.ui.element.textContent,/下一個路段／戰鬥生效/);
});

test('each of seven branches can reach five, never six, and each character has its own 35-point allowance',async t=>{
 const f=fixture(t,{xp:2800});f.ui.open();
 for(const skill of keys){for(let n=0;n<5;n++){f.skill(skill).click();await flush();}assert.equal(f.skill(skill).disabled,true);f.skill(skill).click();}
 assert.equal(f.calls.length,35);assert.deepEqual(f.state.characters.wang.skills,{hp:5,move:5,basic:5,defense:5,special:5,rally:5,assist:5});
 assert.match(f.q('[data-remaining]').textContent,/0/);assert.equal(f.q('[data-stat="maxHp"]').textContent,String(Math.round(deriveFighterStats('wang',{challenge:true,skills:f.state.characters.wang.skills}).maxHp)));assert.equal(f.q('[data-stat="maxHp"]').textContent,'109');assert.equal(f.q('[data-stat="damageTakenMultiplier"]').textContent,'×0.925');
 f.select('han');assert.match(f.q('[data-remaining]').textContent,/35/);assert.equal(f.skill('hp').disabled,false);
});

for(const [xp,points] of [[0,0],[79,0],[80,1],[159,1],[160,2],[999999,35]]){
 test(`team XP ${xp} exposes ${points} points and cannot overspend`,async t=>{
  const f=fixture(t,{xp});f.ui.open();assert.match(f.q('[data-remaining]').textContent,new RegExp(`剩餘 ${points} 點`));
  if(points<=2){for(let n=0;n<points+1;n++){f.skill('basic').click();await flush();}assert.equal(f.calls.length,points);assert.equal(f.skill('move').disabled,true);}
 });
}

test('free reset returns only the selected character points and preserves XP and other characters',async t=>{
 const f=fixture(t);f.state.characters.wang.skills={...zero(),hp:1,basic:1};f.state.characters.han.skills.move=1;f.ui.open();
 f.q('[data-action="reset"]').click();await flush();assert.deepEqual(f.calls,[['reset','wang']]);assert.deepEqual(f.state.characters.wang.skills,zero());
 assert.equal(f.state.characters.wang.xp,80);assert.equal(f.state.characters.han.skills.move,1);assert.equal(f.state.xp,160);
 assert.equal(f.q('[data-action="reset"]').disabled,true);assert.match(f.status(),/已保存/);assert.match(f.q('[data-remaining]').textContent,/2/);
});

test('explicitly rejected async allocation offers a real retry and reports saved only after accepted persistence',async t=>{
 const f=fixture(t);f.results.push(async()=>({accepted:false,persisted:false,reason:'storage-unavailable'}));f.ui.open();f.skill('hp').click();await flush();
 assert.equal(f.state.characters.wang.skills.hp,0);assert.match(f.status(),/未.*套用|沒有.*套用/);assert.doesNotMatch(f.status(),/已保存/);assert.equal(f.changes.length,0);
 f.q('[data-action="retry"]').click();await flush();assert.equal(f.calls.length,2);assert.equal(f.state.characters.wang.skills.hp,1);assert.match(f.status(),/已保存/);
 assert.equal(f.changes[0][0].accepted,true);assert.deepEqual(f.changes[0][1],{action:'allocate',characterId:'wang',skill:'hp',profileId:'slot-1'});
});

test('accepted but unpersisted changes stay visible without a replay button or false saved claim',async t=>{
 const f=fixture(t);f.results.push(async()=>({accepted:true,persisted:false,reason:'quota-exceeded'}));f.ui.open();f.skill('assist').click();await flush();
 assert.equal(f.state.characters.wang.skills.assist,1);assert.equal(f.skill('assist').dataset.rank,'1');assert.match(f.status(),/尚未保存/);assert.doesNotMatch(f.status(),/已保存/);
 assert.equal(f.q('[data-action="retry"]'),null);assert.equal(f.changes[0][0].persisted,false);f.ui.refresh();assert.match(f.q('[data-storage]').textContent,/尚未保存/);assert.equal(f.calls.length,1);
});

test('thrown requests are uncertain and must refresh rather than automatically replay the mutation',async t=>{
 const f=fixture(t);f.results.push(async()=>{throw new Error('offline');});f.ui.open();f.skill('move').click();await flush();
 assert.match(f.status(),/無法確認/);assert.doesNotMatch(f.status(),/已保存/);assert.equal(f.q('[data-action="retry"]'),null);
 f.q('[data-action="reload"]').click();assert.equal(f.calls.length,1);assert.equal(f.skill('move').disabled,false);
});

test('pending operations reject double clicks, disable writes, and keep close available',async t=>{
 const f=fixture(t),wait=deferred();f.results.push(()=>wait.promise);f.ui.open();const oldButton=f.skill('special');oldButton.click();oldButton.dispatchEvent(new f.w.MouseEvent('click',{bubbles:true}));f.skill('hp').click();
 assert.equal(f.calls.length,1);assert.equal(f.q('[data-character]').disabled,true);assert.equal(f.skill('hp').disabled,true);assert.equal(f.q('[data-action="close"]').disabled,false);assert.equal(f.ui.element.getAttribute('aria-busy'),'true');
 wait.resolve({accepted:true,persisted:true});await flush();assert.equal(f.state.characters.wang.skills.special,1);assert.equal(f.ui.element.getAttribute('aria-busy'),'false');
});

for(const flags of [{busy:true},{readOnly:true,reason:'preview-only'},{testMode:true}]){
 test(`readonly/loading/test snapshot ${JSON.stringify(flags)} blocks all mutation events`,async t=>{
  const f=fixture(t);f.state.characters.wang.skills.hp=1;f.ui.open();Object.assign(f.state,flags);f.ui.refresh();
  for(const b of f.ui.element.querySelectorAll('[data-skill],[data-action="reset"]')){assert.equal(b.disabled,true);b.dispatchEvent(new f.w.MouseEvent('click',{bubbles:true}));}
  await flush();assert.equal(f.calls.length,0);assert.match(f.q('[data-warning]').textContent,/讀取|處理|唯讀|測試/);
 });
}

test('fresh state is checked at click time even without refresh, including locks and point loss',async t=>{
 const f=fixture(t);f.ui.open();f.state.readOnly=true;f.skill('hp').click();assert.equal(f.calls.length,0);
 f.state.readOnly=false;f.ui.refresh();f.state.xp=0;f.skill('hp').click();assert.equal(f.calls.length,0);
 f.state.xp=160;f.ui.refresh();f.state.unlockedCharacters=['han'];f.skill('hp').click();await flush();assert.equal(f.calls.length,0);assert.equal(f.q('[data-character]').value,'han');
});

test('changing profile invalidates the open dialog until explicitly closed and reopened',async t=>{
 const f=fixture(t);f.ui.open();const oldButton=f.skill('hp');f.state.profileId='slot-2';oldButton.click();await flush();assert.equal(f.calls.length,0);assert.match(f.q('[data-warning]').textContent,/存檔.*切換/);assert.equal(f.skill('hp').disabled,true);
 f.ui.refresh();assert.equal(f.skill('hp').disabled,true);f.ui.hide();f.ui.open();assert.equal(f.skill('hp').disabled,false);f.skill('hp').click();await flush();assert.equal(f.changes[0][1].profileId,'slot-2');
});

test('a pending result cannot announce the previous profile as saved in a newly opened profile',async t=>{
 const f=fixture(t),wait=deferred();f.results.push(()=>wait.promise);f.ui.open();f.skill('hp').click();f.ui.hide();f.state.profileId='slot-2';f.ui.open();wait.resolve({accepted:true,persisted:true});await flush();
 assert.doesNotMatch(f.status(),/已保存/);assert.equal(f.changes[0][1].profileId,'slot-1');assert.equal(f.ui.element.open,true);
});

test('unknown, malformed and missing skill data never render NaN and cannot make unsafe writes',t=>{
 const f=fixture(t);f.state.characters.wang.skills={hp:'broken',move:null,alien:99};f.ui.open();assert.doesNotMatch(f.ui.element.textContent,/NaN|undefined/);assert.equal(f.q('[data-stat="maxHp"]').textContent,String(fighterBaseStats('wang').maxHp));assert.equal(f.q('[data-stat="maxHp"]').textContent,'95');assert.equal(f.skill('hp').disabled,true);
 delete f.state.characters.wang;f.ui.refresh();assert.equal(f.skill('hp').dataset.rank,'0');assert.equal(f.skill('hp').disabled,false);
 f.ui.hide();f.ui.open({characterId:'huang'});assert.notEqual(f.q('[data-character]').value,'huang');assert.equal(f.q('[data-character] option[value="huang"]'),null);
});

test('empty unlocked roster and unreadable snapshots fail closed then recover on refresh',t=>{
 const f=fixture(t,{unlockedCharacters:[]});f.ui.open();assert.equal(f.q('[data-character]').disabled,true);assert.equal(f.skill('hp').disabled,true);
 f.state.unlockedCharacters=['wang'];f.setReadError(true);f.ui.refresh();assert.equal(f.skill('hp').disabled,true);assert.match(f.q('[data-warning]').textContent,/讀取/);
 f.setReadError(false);f.ui.refresh();assert.equal(f.skill('hp').disabled,false);
});

test('native modal close, Escape cancel and external close restore focus; modal input never reaches background controls',t=>{
 const f=fixture(t);let keys=0,pointers=0;f.w.addEventListener('keydown',()=>keys++);f.w.addEventListener('pointerdown',()=>pointers++);f.ui.open();assert.equal(f.ui.element.tagName,'DIALOG');assert.equal(f.ui.element.open,true);assert.equal(f.d.activeElement,f.q('[data-action="close"]'));
 f.skill('hp').dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'j',code:'KeyJ',bubbles:true}));f.skill('hp').dispatchEvent(new f.w.Event('pointerdown',{bubbles:true}));assert.equal(keys,0);assert.equal(pointers,0);
 f.ui.element.dispatchEvent(new f.w.Event('cancel',{cancelable:true}));assert.equal(f.ui.element.open,false);assert.equal(f.d.activeElement,f.launcher);
 f.ui.open();f.ui.element.close();assert.equal(f.d.activeElement,f.launcher);f.ui.open();f.q('[data-action="close"]').click();assert.equal(f.ui.element.open,false);assert.equal(f.d.activeElement,f.launcher);
 f.launcher.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'j',bubbles:true}));assert.equal(keys,1);
});

test('refresh keeps a valid in-dialog focus target and destroy while saving never steals focus or remounts',async t=>{
 const f=fixture(t),wait=deferred();f.ui.open();f.skill('hp').focus();f.ui.refresh();assert.equal(f.d.activeElement,f.skill('hp'));
 f.results.push(()=>wait.promise);f.skill('hp').click();f.ui.destroy();assert.equal(f.d.activeElement,f.launcher);assert.equal(f.ui.element.isConnected,false);
 f.d.querySelector('#outside').focus();wait.resolve({accepted:true,persisted:true});await flush();assert.equal(f.d.activeElement.id,'outside');assert.equal(f.ui.element.isConnected,false);
});

// jsdom has no layout engine or media-query evaluation. Apply only the actual
// stylesheet's matching CSSOM rules, then inspect computed styles on real UI.
// Pixel overflow and native focus trapping remain the parent's browser QA.
function applyViewportCSS(document,width,height,files=['../dist/preview/campaign/growth-ui.css']){
 for(const file of files){
  const source=document.createElement('style');source.textContent=readFileSync(new URL(file,import.meta.url),'utf8');document.head.append(source);
  const active=[];function visit(rules){for(const rule of rules){if(rule.type===1){if(file.endsWith('/growth-ui.css'))assert.ok(rule.selectorText.split(',').every(s=>s.trim().startsWith('.campaign-growth-')),'CSS must remain namespaced');active.push(rule.cssText);}else if(rule.type===4){const matches=[...rule.conditionText.matchAll(/\(([^:]+):\s*([^)]+)\)/g)].every(([,feature,value])=>{const m=feature.trim().match(/^(min|max)-(width|height)$/);if(!m)return false;const actual=m[2]==='width'?width:height;return m[1]==='max'?actual<=parseFloat(value):actual>=parseFloat(value);});if(matches)visit(rule.cssRules);}}}visit(source.sheet.cssRules);source.remove();
  const sheet=document.createElement('style');sheet.textContent=active.join('\n');document.head.append(sheet);
 }
}
for(const [width,height,columns] of [[320,640,'minmax(0, 1fr)'],[844,390,'minmax(200px, .8fr) minmax(0, 1.2fr)']]){
 test(`effective CSS at ${width}×${height} keeps scroll, bounded panel and at least 44px controls`,t=>{
  const f=fixture(t);applyViewportCSS(f.d,width,height);f.ui.open();const css=e=>f.w.getComputedStyle(e),panel=css(f.ui.element);
  assert.equal(panel.overflowY,'auto');assert.ok(panel.maxHeight.includes('100'));assert.ok(panel.maxWidth.includes('100%'));assert.equal(css(f.q('.campaign-growth-layout')).gridTemplateColumns,columns);
  for(const e of f.ui.element.querySelectorAll('button,select'))assert.ok(parseFloat(css(e).minHeight)>=44,`${e.outerHTML} must retain a 44px target`);
  assert.equal(css(f.q('.campaign-growth-layout')).minWidth,'0');
 });
}

for(const [width,height,mode,pageHeight] of [[320,740,'portrait','45px'],[844,390,'compact','36px']]){
 test(`real chapter styles at ${width}×${height} cannot force a short pale growth header`,t=>{
  const f=fixture(t);f.d.body.dataset[mode]='true';
  const game=f.d.createElement('main');game.id='trial-app';game.innerHTML='<header><div><b>拳民開講</b><span>第三章</span></div></header>';f.d.body.prepend(game);
  applyViewportCSS(f.d,width,height,[
   '../dist/preview/chapter3/chapter2-base.css',
   '../dist/preview/chapter3/chapter2-playable.css',
   '../dist/preview/campaign/growth-ui.css'
  ]);f.ui.open();const css=e=>f.w.getComputedStyle(e),header=f.q('.campaign-growth-header'),style=css(header);
  assert.equal(style.height,'auto','the modal title must determine its own height, not inherit the game 45/36px bar');
  assert.ok(parseFloat(style.minHeight)>=44);assert.equal(style.color,'rgb(22, 46, 53)');assert.equal(style.position,'relative');assert.equal(style.flexShrink,'0');
  assert.equal(css(header.firstElementChild).minWidth,'0');assert.equal(css(header.firstElementChild).flexGrow,'1');
  assert.equal(css(f.q('.campaign-growth-title')).marginTop,'0px');assert.equal(css(f.q('.campaign-growth-title')).marginBottom,'0px');
  assert.equal(css(f.q('.campaign-growth-eyebrow')).marginTop,'0px');assert.equal(css(f.q('.campaign-growth-eyebrow')).marginBottom,'3px');
  assert.equal(css(f.q('.campaign-growth-close')).flexShrink,'0');assert.ok(parseFloat(css(f.q('.campaign-growth-close')).minHeight)>=44);
  assert.equal(css(game.querySelector('header')).height,pageHeight,'the existing game header must remain unchanged');
  assert.equal(css(game.querySelector('header')).color,'rgb(255, 243, 213)');
 });
}

test('preview-only reason is itself a write barrier even if readonly flag is missing',async t=>{
 const f=fixture(t,{reason:'preview-only'});f.ui.open();f.skill('hp').click();await flush();assert.equal(f.calls.length,0);assert.equal(f.skill('hp').disabled,true);
});

test('unpersisted result cannot be contradicted by a stale saved snapshot',async t=>{
 const f=fixture(t);f.controller.allocate=async(id,skill)=>{f.calls.push(['allocate',id,skill]);f.state.characters[id].skills[skill]++;return {accepted:true,persisted:false,reason:'quota-exceeded'};};
 f.ui.open();f.skill('hp').click();await flush();assert.match(f.ui.element.textContent,/尚未保存/);assert.doesNotMatch(f.ui.element.textContent,/已保存/);
 f.ui.refresh();assert.doesNotMatch(f.ui.element.textContent,/已保存/);
 f.state.persisted=false;f.ui.refresh();f.state.persisted=true;f.ui.refresh();assert.match(f.q('[data-storage]').textContent,/已保存/);
});

test('rejected reset retries the reset rather than replaying a previous allocation',async t=>{
 const f=fixture(t);f.state.characters.wang.skills.hp=1;f.results.push(async()=>({accepted:false,persisted:false,reason:'storage-unavailable'}));f.ui.open();f.q('[data-action="reset"]').click();await flush();assert.equal(f.state.characters.wang.skills.hp,1);
 f.q('[data-action="retry"]').click();await flush();assert.deepEqual(f.calls,[['reset','wang'],['reset','wang']]);assert.deepEqual(f.state.characters.wang.skills,zero());
});

test('character names are text, and malformed results never announce success',async t=>{
 const f=fixture(t);f.characters.wang.name='<img src=x onerror=alert(1)>';f.results.push(async()=>({accepted:'yes',persisted:true}));f.ui.open();assert.equal(f.q('img'),null);assert.equal(f.q('.campaign-growth-name').textContent,'<img src=x onerror=alert(1)>');
 f.skill('hp').click();await flush();assert.match(f.status(),/無法確認/);assert.equal(f.changes.length,0);
});

for(const [key,code] of [['Escape','Escape'],[' ','Space'],['ArrowUp','ArrowUp'],['ArrowDown','ArrowDown'],['ArrowLeft','ArrowLeft'],['ArrowRight','ArrowRight']]){
 test(`dialog ${code} cannot toggle or control background combat, and native keyboard default is preserved`,t=>{
  const f=fixture(t);let background=0;f.w.addEventListener('keydown',()=>background++);f.w.addEventListener('keyup',()=>background++);f.ui.open();
  for(const type of ['keydown','keyup']){const event=new f.w.KeyboardEvent(type,{key,code,bubbles:true,cancelable:true});f.q('[data-character]').dispatchEvent(event);assert.equal(event.defaultPrevented,false);}
  assert.equal(background,0);assert.equal(f.ui.element.open,true);
  if(code==='Escape'){f.ui.element.dispatchEvent(new f.w.Event('cancel',{cancelable:true}));assert.equal(f.ui.element.open,false);assert.equal(f.d.activeElement,f.launcher);}
 });
}

test('Rank-5 perk hides spoilers before rank 5 and reveals compact title, short text, and banner at rank 5',async t=>{
 const f=fixture(t,{xp:2800});f.state.characters.wang.skills={...zero(),special:4};f.ui.open();
 const perkAt4=deriveFighterStats('wang',{challenge:true,skills:f.state.characters.wang.skills}).perk;
 assert.equal(perkAt4.unlocked,false);
 assert.doesNotMatch(f.ui.element.textContent,new RegExp(perkAt4.title));
 assert.doesNotMatch(f.ui.element.textContent,new RegExp(perkAt4.short.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(f.q('[data-perk-summary="wang"]').textContent,/隱藏|5\/5/);
 assert.match(f.skill('special').textContent,/5\/5 解鎖隱藏質變/);

 f.skill('special').click();await flush();
 assert.equal(f.state.characters.wang.skills.special,5);
 assert.ok(f.q('[data-perk-summary="wang"]').classList.contains('is-unlocked'));
 assert.ok(f.q('[data-perk-summary="wang"]').textContent.includes(perkAt4.title));
 assert.ok(f.q('[data-perk-summary="wang"]').textContent.includes(perkAt4.move));
 assert.ok(f.q('[data-perk-summary="wang"]').textContent.includes(perkAt4.summary));
 assert.ok(f.skill('special').textContent.includes(perkAt4.short));
});
