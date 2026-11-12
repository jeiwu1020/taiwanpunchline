import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {gameHarness} from './helpers/game-harness.mjs';
import {memoryStorage} from './helpers/main-unified-fixture.mjs';
import {completedChallengeEnvelope} from './helpers/profile-fixtures.mjs';
import {CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';

// Keep the #67 game entry and persistence real. Its existing fake media/Phaser
// boundaries remain, while the overview is the production UI in a real DOM.
async function fixture(t){
 const dom=new JSDOM('<main class="app"></main>',{url:'https://exit-toolbar.test/',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const storage=memoryStorage({[CHALLENGE_KEY]:JSON.stringify(completedChallengeEnvelope())}),writes=[],write=storage.setItem;
 storage.setItem=(key,value)=>{writes.push([key,value]);write(key,value);};let overview;
 const h=await gameHarness({newProfile:true,storage,mountChallengeOverview:options=>(overview=mountChallengeUI({...options,parent:d.querySelector('main')}))});
 h.ui.setScene({artImages:{}});h.document.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 t.after(()=>{overview?.destroy();w.close();});
 return {...h,storage,writes,get overview(){return overview;}};
}
function ordinary(h,status){assert.equal(h.ui.challenge,null);assert.equal(h.ui.gameMode,'battle');assert.equal(h.ui.duel.status,status);assert.equal(h.$('#challenge-save-slot').hidden,true,'ordinary screens must not retain the challenge save cell');}

test('real entry initializes and clears the save cell after actual overview, VS selection and battle',async t=>{
 const h=await fixture(t);h.ui.showTitle();assert.equal(h.ui.challenge,null);assert.equal(h.ui.duel.status,'title');
 await h.ui.startChallenge({replay:true});assert.ok(h.ui.challenge);assert.equal(h.$('#challenge-save-slot').hidden,false);
 const writes=h.writes.length;assert.equal(await h.ui.returnToChallengeOverview(),true);assert.equal(h.overview.element.open,true);ordinary(h,'title');
 h.overview.element.querySelector('[data-action="close"]').click();assert.equal(h.overview.element.open,false);
 h.ui.showMenu();ordinary(h,'menu');await h.ui.startGame();ordinary(h,'countdown');assert.equal(h.writes.length,writes,'exit and ordinary VS must add no progress writes');
});
test('repeated challenge entries clear status on both direct menu and title exits',async t=>{
 const h=await fixture(t);
 for(const target of ['showMenu','showTitle','showMenu']){await h.ui.startChallenge({replay:true});assert.equal(h.$('#challenge-save-slot').hidden,false);const writes=h.writes.length;h.ui[target]();ordinary(h,target==='showTitle'?'title':'menu');assert.equal(h.writes.length,writes);}
});
test('canceling the actual return confirmation retains the current run and visible saved status',async t=>{
 const h=await fixture(t);await h.ui.startChallenge({replay:true});const run=h.ui.challenge,world=h.ui.duel,writes=h.writes.length;
 h.$('#home').onclick();assert.equal(h.$('#home-confirm').classList.contains('hidden'),false);h.$('#home-cancel').onclick();
 assert.equal(h.$('#home-confirm').classList.contains('hidden'),true);assert.equal(h.ui.challenge,run);assert.equal(h.ui.duel,world);assert.equal(h.ui.gameMode,'challenge');assert.equal(h.$('#challenge-save-slot').hidden,false);assert.equal(h.$('#challenge-save-slot').dataset.status,'saved');assert.equal(h.writes.length,writes);
});
test('failed progress save blocks return and leaves recovery plus the full failure explanation visible',async t=>{
 const h=await fixture(t);await h.ui.startChallenge({replay:true});const run=h.ui.challenge,world=h.ui.duel,write=h.storage.setItem;
 h.storage.setItem=(key,value)=>{if(key===CHALLENGE_KEY)throw Error('quota');write(key,value);};
 h.ui.handleChallengeFrameEvents([{type:'enemyDefeated',encounterId:'toolbar-failure',xp:8,f:world.player}],{popup(){},banner(){}});await h.ui.settleChallenge();
 assert.equal(await h.ui.returnToChallengeOverview(),false);assert.equal(h.ui.challenge,run);assert.equal(h.ui.duel,world);assert.equal(h.ui.gameMode,'challenge');
 const slot=h.$('#challenge-save-slot');assert.equal(slot.hidden,false);assert.equal(slot.dataset.status,'error');assert.match(slot.getAttribute('aria-label'),/尚未保存.*復原與備份/);assert.equal(slot.getAttribute('title'),slot.getAttribute('aria-label'));
 const recovery=h.$('#result .paper').children.find(e=>e.id==='challengeRecoveryPanel');assert.equal(recovery.hidden,false);assert.equal(h.ui.profiles.get().dirty,true);assert.equal(h.overview,undefined);
});
