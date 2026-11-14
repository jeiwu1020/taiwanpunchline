import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {mountChallengePreparation} from '../dist/challenge-preparation.mjs';
import {createFinalePreview} from '../dist/preview/finale/finale-preview.mjs';
import {CAST} from '../dist/core.mjs';
import {CHARACTER_IDS} from '../dist/preview/campaign/core/catalog.mjs';

const source=readFileSync(new URL('../dist/preview/finale/finale-playable.mjs',import.meta.url),'utf8');
const entry=source.slice(source.indexOf('async function ensureSelectedTeam(){'),source.indexOf("$('#story-next').onclick="));
function fixture({accepted=true,mode='team-select'}={}){
 const buttons={},calls=[];
 const context=vm.createContext({draftTeam:['huang','han','wang'],chapter:null,
  $:id=>buttons[id]??=( {} ),media:{unlock(){}},view:()=>({mode}),sync(){},
  openPreparation:()=>calls.push('prepare'),
 });
 context.attach=async()=>{if(!accepted)return false;context.draftTeam=['wang','han','huang'];context.chapter={start:async team=>calls.push(Array.from(team))};return true;};
 vm.runInContext(entry,context);
 return {buttons,calls,context};
}
test('direct finale entry starts the displayed team in one click',async()=>{
 const f=fixture();await f.buttons['#start'].onclick();assert.deepEqual(f.calls,[['huang','han','wang']]);
});
test('direct preparation keeps the chosen team while attaching progress',async()=>{
 const f=fixture();await f.buttons['#finale-prepare'].onclick();assert.deepEqual(Array.from(f.context.draftTeam),['huang','han','wang']);assert.deepEqual(f.calls,['prepare']);
});
test('blocked save cannot start the finale or open preparation',async()=>{
 const f=fixture({accepted:false});await f.buttons['#start'].onclick();await f.buttons['#finale-prepare'].onclick();assert.deepEqual(f.calls,[]);
});
test('resuming a saved battle does not replace its team or start it again',async()=>{
 const f=fixture({mode:'battle'});await f.buttons['#start'].onclick();assert.deepEqual(Array.from(f.context.draftTeam),['wang','han','huang']);assert.deepEqual(f.calls,[]);
});

async function preparationFixture(t,{battle=false,attached=false}={}){
 const dom=new JSDOM('<main class="app"><button id="start"></button><button id="finale-prepare"></button><button id="leave"></button></main>',{pretendToBeVisual:true});
 const {window}=dom,document=window.document;
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 window.HTMLDialogElement.prototype.close=function(){this.open=false;};window.matchMedia=()=>({matches:true});
 const {chapter}=await createFinalePreview();if(battle)await chapter.start(['wang','han','chen']);
 const context=vm.createContext({document,window,CAST,CHARACTER_IDS,mountChallengePreparation,
  chapter:attached||battle?chapter:null,preparation:null,preparationBusy:false,draftTeam:['huang','han','wang'],
  $:selector=>document.querySelector(selector),view:()=>context.chapter?.view(),sync(){},media:{unlock(){}},
  pauseForUI(){if(context.chapter?.view().mode==='battle')context.chapter.setPaused(true);},
 });
 context.attach=async()=>{context.chapter=chapter;context.draftTeam=['wang','han','huang'];return true;};
 const preparationSource=source.slice(source.indexOf('function openPreparation(readOnly=false){'),source.indexOf('function openRecovery(){'));
 vm.runInContext(preparationSource+'\n'+entry,context);
 t.after(()=>{context.preparation?.destroy();window.close();});return {document,context,chapter};
}

test('real direct-entry preparation shows and confirms the selected main without reordering the team',async t=>{
 const f=await preparationFixture(t);await f.document.querySelector('#finale-prepare').onclick();
 assert.equal(f.document.querySelector('#preparationMain').value,'huang');
 await f.document.querySelector('#preparationConfirm').onclick();
 assert.equal(f.chapter.preparationSnapshot().characterId,'huang');
 assert.deepEqual(Array.from(f.context.draftTeam),['huang','han','wang']);
 await f.document.querySelector('#start').onclick();assert.deepEqual(f.chapter.world.team,['huang','han','wang']);
});

for(const battle of [false,true])test(`real ${battle?'battle':'explicit read-only'} preparation ignores an unsaved team draft`,async t=>{
 const f=await preparationFixture(t,{battle,attached:true});const before=f.chapter.preparationSnapshot().characterId,team=f.chapter.view().team;
 if(battle)f.context.openPreparation();else f.context.openPreparation(true);
 const main=f.document.querySelector('#preparationMain');assert.equal(main.value,before);assert.equal(main.disabled,true);
 assert.equal(f.document.querySelector('#preparationConfirm').hidden,true);
 f.document.querySelector('#preparationCancel').onclick();
 assert.equal(f.chapter.preparationSnapshot().characterId,before);assert.deepEqual(f.chapter.view().team,team);
 assert.deepEqual(Array.from(f.context.draftTeam),['huang','han','wang']);
});
