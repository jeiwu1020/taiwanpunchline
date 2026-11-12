import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChallengeStory} from '../dist/challenge-story.mjs';
import {deferred} from './helpers/game-harness.mjs';
const beats=[{title:'頭目前',speaker:'王',copy:'準備出發'}];
function fixture(t){const dom=new JSDOM('<main class="app"></main>',{pretendToBeVisual:true}),{window}=dom,document=window.document;window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};const ui=mountChallengeStory({document,paint(){}});t.after(()=>{ui.destroy();window.close();});return {ui,root:document.querySelector('dialog')};}
test('boss comic stays visible and ignores double-advance until the destination presentation resolves',async t=>{
 const {ui,root}=fixture(t),pending=deferred();let completions=0;ui.show(beats,{onComplete(){completions++;return pending.promise;}});
 root.querySelector('[data-story-next]').click();root.querySelector('[data-story-next]').click();assert.equal(root.open,true);assert.equal(completions,1);
 pending.resolve(true);await Promise.resolve();assert.equal(root.open,false);
});
test('an old rendered completion cannot close a newer story',async t=>{
 const {ui,root}=fixture(t),pending=deferred();ui.show(beats,{onComplete:()=>pending.promise});root.querySelector('[data-story-next]').click();ui.show([{...beats[0],title:'新的章節'}]);pending.resolve(true);await Promise.resolve();assert.equal(root.open,true);assert.equal(root.querySelector('h2').textContent,'新的章節');
});
test('only an explicit current scene-unavailable recovery keeps the story actionable',async t=>{
 const {ui,root}=fixture(t),retry=deferred();let calls=0;
 ui.show(beats,{onComplete:()=>({accepted:false,reason:'scene-unavailable',message:'配置已保存，但場景尚未顯示。',retryPresentation:()=>{calls++;return retry.promise;},returnToOverview:()=>{}})});root.querySelector('[data-story-next]').click();
 assert.equal(root.open,true);assert.match(root.querySelector('.story-copy p').textContent,/已保存/);assert.equal(root.querySelector('[data-story-next]').disabled,false);root.querySelector('[data-story-next]').click();root.querySelector('[data-story-next]').click();assert.equal(calls,1);assert.equal(root.open,true);retry.resolve(true);await Promise.resolve();assert.equal(root.open,false);
});
for(const result of [false,{accepted:false,reason:'cancelled'},{accepted:false,reason:'scene-unavailable'}])test(`a non-retryable ${JSON.stringify(result)} completion closes instead of trapping the story`,t=>{
 const {ui,root}=fixture(t);ui.show(beats,{onComplete:()=>result});root.querySelector('[data-story-next]').click();assert.equal(root.open,false);
});
test('a stale recovery result cannot reopen or replace a newer story',async t=>{
 const {ui,root}=fixture(t),pending=deferred();ui.show(beats,{onComplete:()=>pending.promise});root.querySelector('[data-story-next]').click();ui.show([{...beats[0],title:'新的章節'}]);pending.resolve({accepted:false,reason:'scene-unavailable',message:'舊失敗',retryPresentation:()=>true,returnToOverview:()=>{}});await Promise.resolve();assert.equal(root.open,true);assert.equal(root.querySelector('h2').textContent,'新的章節');assert.equal(root.querySelector('[data-story-next]').textContent,'出發 →');
});
test('a recovery that lost its runtime owner before promise delivery closes instead of reopening actions',async t=>{
 const {ui,root}=fixture(t),pending=deferred();ui.show(beats,{onComplete:()=>pending.promise});root.querySelector('[data-story-next]').click();pending.resolve({accepted:false,reason:'scene-unavailable',isCurrent:()=>false,retryPresentation:()=>true,returnToOverview:()=>{}});await Promise.resolve();assert.equal(root.open,false);
});
