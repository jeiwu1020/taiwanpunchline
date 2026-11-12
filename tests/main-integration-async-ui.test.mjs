import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {createProfileProgress} from '../dist/profile-progress.mjs';
import {createChallengeProgress} from '../dist/challenge-progress.mjs';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const dom=new JSDOM('<main></main>',{pretendToBeVisual:true,url:'https://main-ui.test/'}),{window}=dom;
 const previous={document:globalThis.document,window:globalThis.window};globalThis.document=window.document;globalThis.window=window;
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const profiles=createProfileProgress({storage:window.localStorage}),base=createChallengeProgress({profiles});base.rewardEncounter({encounterId:'fixture',xp:160,characterId:'wang'});
 let resolve,changed=0,calls=0;
 const progress={...base,allocate:()=>{calls++;return new Promise(r=>{resolve=r;});}};
 const ui=mountChallengeUI({progress,characters:{wang:{name:'恰吉王'},han:{name:'韓國魚'}},onChange:()=>changed++,onContinue:async()=>({accepted:false,reason:'cancelled'})});ui.open({view:'character'});
 return{ui,window,resolve:value=>resolve(value),get calls(){return calls;},get changed(){return changed;},close(){ui.destroy();dom.window.close();for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
test('skill allocation waits for durable result and prevents duplicate pending clicks',async()=>{
 const f=fixture();try{const button=f.ui.element.querySelector('[data-skill="hp"]');button.click();button.click();assert.equal(f.calls,1);assert.equal(f.changed,0);assert.match(f.ui.element.textContent,/儲存中/);f.resolve({accepted:true,persisted:true});await flush();assert.equal(f.changed,1);assert.match(f.ui.element.querySelector('[role="status"]').textContent,/\+1/);}finally{f.close();}
});
test('failed async allocation never announces saved points',async()=>{
 const f=fixture();try{f.ui.element.querySelector('[data-skill="hp"]').click();f.resolve({accepted:true,persisted:false,reason:'write-failed'});await flush();assert.equal(f.changed,0);assert.match(f.ui.element.querySelector('[role="status"]').textContent,/未保存|尚未保存/);assert.doesNotMatch(f.ui.element.querySelector('[role="status"]').textContent,/\+1/);}finally{f.close();}
});

test('an incomplete first chapter has only one normal challenge launch action',()=>{const f=fixture();try{f.ui.open({view:'chapter'});const first=f.ui.element.querySelector('[data-action="start"]');assert.ok(first.parentElement.classList.contains('challenge-launch-actions'));assert.equal(first.parentElement.querySelectorAll('button').length,1);assert.match(first.textContent,/開始挑戰/);}finally{f.close();}});
