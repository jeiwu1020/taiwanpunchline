import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

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
