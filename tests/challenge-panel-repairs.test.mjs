import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {mountChallengePreparation} from '../dist/challenge-preparation.mjs';
import {mountStarterOpening} from '../dist/starter-opening.mjs';
import {CAST} from '../dist/roster.mjs';
import {stylesAt} from './helpers/css-contracts.mjs';
const flush=()=>new Promise(r=>setImmediate(r));
const zero=()=>({hp:0,move:0,basic:0,defense:0,special:0,rally:0,assist:0});
function fixture(t,{rotation=0,width=844,height=390}={}){
 const dom=new JSDOM('<div id="viewport-shell"><main class="app"></main></div>',{url:'https://panel-repairs.test',pretendToBeVisual:true}),w=dom.window,d=w.document,app=d.querySelector('.app');app.style.width=width+'px';app.style.height=height+'px';app.dataset.rotation=String(rotation);
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const snapshot={profileId:'slot-1',revision:1,generation:0,initialized:true,characterId:'wang',helperId:'han',difficulty:'easy',allowance:3,characters:{wang:{skills:zero()},han:{skills:zero()}},unlockedCharacters:['wang','han']},calls=[],external=[];
 const controller={get:()=>({activeProfileId:'slot-1',initialized:true,persisted:true,revision:snapshot.revision,generation:0}),readProfile:()=>({characters:snapshot.characters,unlockedCharacters:snapshot.unlockedCharacters,campaign:{xp:240,chapterClears:[],cursor:{chapterId:'chapter-1',stepId:'entry'},selection:{characterId:snapshot.characterId,helperId:snapshot.helperId},difficulty:snapshot.difficulty}}),preparationSnapshot:()=>structuredClone(snapshot),savePreparation:async(draft,guard)=>{calls.push({draft,guard});Object.assign(snapshot,structuredClone(draft));snapshot.revision++;return {accepted:true,persisted:true};}};
 const ui=mountChallengeUI({controller,characters:CAST,parent:app,onPrepare:o=>external.push(o)});t.after(()=>{ui.destroy();w.close();});ui.open();return{ui,d,w,app,controller,snapshot,calls,external,q:s=>ui.element.querySelector(s)||ui.element.querySelector(s.replace(/#((?:preparation|challengePreparation)[A-Z]\w*)/g,'#overview-$1'))};
}
test('overview preparation is one same-shell tab and switching away discards an unsaved draft',t=>{
 const f=fixture(t),shell=f.ui.element,width=shell.style.width;f.q('[data-action="prepare"]').click();
 assert.equal(shell.open,true);assert.equal(shell.dataset.view,'preparation');assert.equal(f.d.querySelectorAll('dialog[open]').length,1);assert.equal(shell.style.width,width);assert.equal(f.external.length,0);
 assert.ok(f.q('#preparationMain'));f.q('[data-skill="hp"][data-delta="1"]').click();f.q('[data-view="save"]').click();assert.equal(shell.dataset.view,'save');assert.equal(f.calls.length,0);
 f.q('[data-action="prepare"]').click();assert.equal(f.q('[data-skill-card="hp"] b').textContent,'0 / 5');assert.equal(f.snapshot.characters.wang.skills.hp,0);
 f.q('#preparationCancel').click();assert.equal(shell.open,true);assert.equal(shell.dataset.view,'chapter');assert.equal(f.calls.length,0);
});
test('embedded preparation commits through guarded save-only then returns to overview without launch',async t=>{
 const f=fixture(t);f.ui.open({view:'preparation',characterId:'han'});assert.ok(f.q('#preparationInspect'),'preparation must be inside original shell');assert.equal(f.q('#preparationInspect').value,'han');f.q('[data-skill="hp"][data-delta="1"]').click();f.q('#preparationConfirm').click();await flush();
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].guard.intent,'save-only');assert.equal(f.calls[0].draft.characters.han.skills.hp,1);assert.equal(f.calls[0].draft.characterId,'wang');assert.equal(f.ui.element.open,true);assert.equal(f.ui.element.dataset.view,'chapter');assert.equal(f.external.length,0);
});
for(const rotation of [90,-90])test(`rotated ${rotation} embedded touch drag reaches the actual scroll body and cannot press a skill`,t=>{
 const f=fixture(t,{rotation});f.q('[data-action="prepare"]').click();const panel=f.q('.challenge-preparation-panel');assert.ok(panel,'inline scroll body exists');Object.defineProperty(panel,'scrollHeight',{value:2000});Object.defineProperty(panel,'clientHeight',{value:250});const target=f.q('[data-skill="hp"][data-delta="1"]');
 const pointer=(type,x)=>{const e=new f.w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:0});target.dispatchEvent(e);return e;};pointer('pointerdown',10);const end=10+100*Math.sign(rotation);assert.equal(pointer('pointermove',end).defaultPrevented,true);pointer('pointerup',end);assert.equal(panel.scrollTop,100);target.dispatchEvent(new f.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));assert.equal(f.q('[data-skill-card="hp"] b').textContent,'0 / 5');assert.equal(f.calls.length,0);
});
test('preparation footer is a sibling of the clipped scroller, not translucent sticky content',t=>{
 const f=fixture(t);const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST});t.after(()=>prep.destroy());prep.open({intent:'boundary'});const footer=prep.element.querySelector('.preparation-actions'),panel=prep.element.querySelector('.challenge-preparation-panel');assert.equal(panel.contains(footer),false);assert.equal(footer.parentElement,prep.element);
 const selector='.challenge-preparation-overlay[data-embedded] .preparation-actions';assert.equal(prep.element.dataset.embedded,'false');assert.equal(footer.matches(selector),true,'the shared scope also applies to a modal preparation');
 f.ui.open({view:'preparation'});const embedded=f.q('.challenge-preparation-overlay'),embeddedFooter=embedded.querySelector('.preparation-actions');assert.equal(embedded.dataset.embedded,'true');assert.equal(embeddedFooter.matches(selector),true);assert.equal(embedded.querySelector('.challenge-preparation-panel').contains(embeddedFooter),false);assert.equal(embeddedFooter.parentElement,embedded);
 const css=readFileSync(new URL('../dist/challenge-preparation.css',import.meta.url),'utf8'),rule=stylesAt(css,[selector],{width:1366,height:768});assert.equal(rule.position,'relative');assert.equal(rule.background,'var(--paper)');assert.equal(rule.margin,'0');
});
test('preparation keeps source open and busy until asynchronous destination is ready',async t=>{
 const f=fixture(t);let ready,applied=false;const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:()=>{applied=true;return new Promise(r=>ready=r);}});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(applied,true);assert.equal(prep.isOpen,true);assert.equal(prep.busy,true);assert.equal(prep.hide(),false);ready();await flush();assert.equal(prep.isOpen,false);assert.equal(prep.busy,false);
});
test('desktop prologue shows every frame and its controls within the one-page viewport',t=>{
 const f=fixture(t,{width:1366,height:768});let renders=[];const story=mountStarterOpening({document:f.d,reducedMotion:true,paint:(c,s,o)=>renders.push({c,s,o})});t.after(()=>story.destroy());story.show({characterId:'wang',mode:'review'});
 for(let n=0;n<12&&story.element.open;n++){const canvas=story.element.querySelector('canvas');assert.ok(parseFloat(canvas.style.height)+78<=parseFloat(story.element.style.maxHeight),`scene ${story.element.dataset.scene} must fit without scrolling`);assert.ok(parseFloat(canvas.style.width)+14<=parseFloat(story.element.style.width));story.element.querySelector('[data-starter-next]').click();}assert.ok(renders.length>=7);
});

test('rejected destination leaves preparation open with recovery instead of dismissing the source',async t=>{
 const f=fixture(t);const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>({accepted:false,persisted:false,reason:'quota-exceeded'})});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(prep.isOpen,true);assert.equal(prep.busy,false);assert.match(prep.element.querySelector('#challengePreparationStatus').textContent,/尚未.*|無法.*/);assert.ok(prep.element.querySelector('[data-recovery="current"]'));
});
test('modal and embedded preparations keep unique IDs and each custom picker targets its own draft',async t=>{
 const f=fixture(t),modal=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST});t.after(()=>modal.destroy());
 const unique=()=>{const ids=[...f.d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'no duplicate DOM identifiers across preparation instances');};
 modal.open({readOnly:true,intent:'resume'});modal.hide();f.ui.open({view:'preparation',characterId:'han'});unique();
 const page=f.q('[data-embedded="true"]'),title=f.d.getElementById(page.getAttribute('aria-labelledby'));assert.ok(page.contains(title));
 const trigger=page.querySelector('[data-game-select-for$="preparationMain"]');trigger.click();const menu=f.d.getElementById(trigger.getAttribute('aria-controls'));menu.querySelector('[data-value="han"]').click();assert.equal(page.querySelector('select[id$="preparationMain"]').value,'han');assert.equal(f.snapshot.characterId,'wang');
 f.q('[data-view="chapter"]').click();modal.open({intent:'boundary'});unique();const modalTrigger=modal.element.querySelector('[data-game-select-for="preparationHelper"]');modalTrigger.click();f.d.getElementById(modalTrigger.getAttribute('aria-controls')).querySelector('[data-value="wang"]').click();assert.equal(modal.element.querySelector('#preparationHelper').value,'wang');assert.equal(f.snapshot.helperId,'han');modal.hide();await flush();assert.equal(f.calls.length,0);
});
test('cancelled destination dismisses superseded preparation without close callback or focus restoration',async t=>{
 const f=fixture(t);let closes=0;const old=f.d.createElement('button'),current=f.d.createElement('button');f.d.body.append(old,current);old.focus();const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>{current.focus();return{accepted:false,reason:'cancelled'};},onClose:()=>closes++});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(prep.isOpen,false);assert.equal(f.d.activeElement,current);assert.equal(closes,0);
});
test('saved configuration with unavailable destination offers dismissal rather than retrying a successful save',async t=>{
 const f=fixture(t);const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>({accepted:false,persisted:true,reason:'scene-unavailable'})});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(prep.isOpen,true);assert.match(prep.element.querySelector('#challengePreparationStatus').textContent,/已保存/);assert.equal(prep.element.querySelector('[data-recovery="retry"]'),null);assert.equal(prep.element.querySelector('#preparationCancel').disabled,false);
});
test('portrait toolbar reserves one ordered row for brand, saved state, and all four active buttons',()=>{
 const css=readFileSync(new URL('../dist/challenge-layout.css',import.meta.url),'utf8');
 for(const width of [320,390,430])for(const prefix of ['#trial-app.cabinet.app[data-challenge-layout][data-touch="true"][data-layout="portrait"]>header','#viewport-shell>.app[data-game-mode="challenge"][data-touch="true"][data-layout="portrait"]>header']){
  const header=stylesAt(css,[prefix],{width,height:844}),brand=stylesAt(css,[prefix+' .brand'],{width,height:844}),status=stylesAt(css,[prefix+' .challenge-save-slot'],{width,height:844}),toolbar=stylesAt(css,[prefix+' .toolbar'],{width,height:844});
  assert.equal(header['grid-template-rows'],'44px');assert.equal(header.height,'44px');const button=stylesAt(css,[prefix+' .toolbar button'],{width,height:844});assert.equal(button['min-width'],'44px');assert.equal(button['min-height'],'44px');assert.equal(brand['grid-column'],'1');assert.equal(status['grid-column'],'2');assert.equal(toolbar['grid-column'],'3');assert.equal(brand['grid-row'],'1');assert.equal(status['grid-row'],'1');assert.equal(toolbar['grid-row'],'1');
 }
});
test('same-shell compact chrome and body survive the complete historical stylesheet cascade',async t=>{
 const {combatStyles}=await import('./helpers/loaded-combat-styles.mjs'),f=fixture(t),loaded=combatStyles({width:390,height:844,sideways:true}),d=loaded.document,app=d.querySelector('.app');app.style.width='844px';app.style.height='390px';
 d.defaultView.HTMLDialogElement.prototype.showModal=function(){this.open=true;};d.defaultView.HTMLDialogElement.prototype.close=function(){this.open=false;};const ui=mountChallengeUI({controller:f.controller,characters:CAST,parent:app});t.after(()=>{ui.destroy();loaded.close();});
 for(const view of ['chapter','save','preparation']){ui.open({view});const paper=ui.element.querySelector(':scope > .challenge-paper');assert.equal(loaded.style(paper).display,'grid',view);assert.equal(loaded.style(paper)['grid-template-columns'],'minmax(0,1fr)',view);assert.equal(loaded.style(paper).padding,'0',view);if(view==='chapter')assert.equal(loaded.style(ui.element.querySelector('.challenge-chapter')).display,'block');}
});
test('portrait instruction strip is anchored below the whole HUD instead of occupying its timer row',async()=>{
 const {combatStyles}=await import('./helpers/loaded-combat-styles.mjs'),f=combatStyles({width:390,height:844,portrait:true,depth:true});try{f.document.querySelector('.app').dataset.gameMode='challenge';const hint=f.document.querySelector('#item-status');hint.textContent='上下左右走位 · 向右前進';const style=f.style(hint);assert.equal(style.position,'absolute');assert.equal(style.top,'calc(100% + 6px)');assert.equal(style['grid-area'],'auto');}finally{f.close();}
});
test('closing preparation shell then reopening default overview never returns an empty preparation page',t=>{
 const f=fixture(t);f.ui.open({view:'preparation'});f.q('[data-action="close"]').click();assert.equal(f.ui.element.open,false);f.ui.open();assert.equal(f.ui.element.open,true);assert.ok(f.q('[data-action="start"]'));assert.equal(f.ui.element.dataset.view,'chapter');
});
test('disposed pending preparation cannot release a newer busy owner',async t=>{
 const f=fixture(t);let resolve,ownerBusy=false;f.controller.savePreparation=()=>new Promise(r=>resolve=r);const old=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onBusy:b=>ownerBusy=b});old.open({intent:'save-only'});old.element.querySelector('[data-skill="hp"][data-delta="1"]').click();old.element.querySelector('#preparationConfirm').click();old.destroy();ownerBusy=true;resolve({accepted:true,persisted:true});await flush();assert.equal(ownerBusy,true);
});
test('a thrown destination callback after confirmed persistence does not relabel it as a failed save',async t=>{
 const f=fixture(t);const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>{throw Error('renderer unavailable');}});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(prep.isOpen,true);assert.match(prep.element.querySelector('#challengePreparationStatus').textContent,/已保存/);assert.equal(prep.element.querySelector('[data-recovery="retry"]'),null);
});
test('preview destination failure says applied test configuration and exposes no formal save retry',async t=>{
 const f=fixture(t);f.snapshot.testMode=true;f.controller.preparePreview=async()=>({accepted:true,preview:true});const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>{throw Error('renderer unavailable');}});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('#preparationConfirm').click();await flush();assert.equal(prep.isOpen,true);assert.match(prep.element.querySelector('#challengePreparationStatus').textContent,/測試配置已套用/);assert.doesNotMatch(prep.element.querySelector('#challengePreparationStatus').textContent,/配置已保存|重試保存/);assert.equal(prep.element.querySelector('[data-recovery="retry"]'),null);
});
test('saved destination rejection retains its exact navigation explanation without formal retry',async t=>{
 const f=fixture(t),message='第五章尚未開放；可重訪已完成章節，原進度不變。';const prep=mountChallengePreparation({document:f.d,controller:f.controller,characters:CAST,onApplied:async()=>({accepted:false,persisted:true,reason:'content-locked',message})});t.after(()=>prep.destroy());prep.open({intent:'save-only'});prep.element.querySelector('[data-skill="hp"][data-delta="1"]').click();prep.element.querySelector('#preparationConfirm').click();await flush();assert.ok(prep.element.querySelector('#challengePreparationStatus').textContent.includes(message));assert.equal(prep.element.querySelector('[data-recovery="retry"]'),null);
});
test('comic art respects the scrollbar-reduced content width and the hidden transcript adds no overflow',()=>{
 const css=readFileSync(new URL('../dist/starter-opening.css',import.meta.url),'utf8'),canvas=stylesAt(css,['.starter-opening .starter-panel canvas'],{width:390,height:844}),transcript=stylesAt(css,['.starter-opening .starter-transcript'],{width:390,height:844});assert.equal(canvas['max-width'],'100%');assert.equal(transcript.top,'0');assert.equal(transcript.left,'0');assert.equal(transcript.margin,'0');
});
