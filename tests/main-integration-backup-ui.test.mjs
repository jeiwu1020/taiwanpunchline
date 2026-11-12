import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountChallengeUI} from '../dist/challenge-ui.mjs';
import {openUnifiedProgress} from '../dist/preview/campaign/unified/progress.mjs';
import {createMainCampaignBridge} from '../dist/main-campaign-bridge.mjs';
import {newProfileDocument,PROFILE_KEY} from '../dist/profile-progress.mjs';
import {memoryLocks,memoryStorage} from './helpers/main-unified-fixture.mjs';
async function fixture(){
 const dom=new JSDOM('<main/>',{pretendToBeVisual:true,url:'https://backup.test/'}),{window}=dom,previous={document:globalThis.document,window:globalThis.window};globalThis.document=window.document;globalThis.window=window;
 window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const storage=memoryStorage({[PROFILE_KEY]:JSON.stringify(newProfileDocument())}),api=await openUnifiedProgress({storage,locks:memoryLocks()}),progress=createMainCampaignBridge(api),prompts=[];
 window.confirm=question=>{prompts.push(question);return true;};
 const ui=mountChallengeUI({progress,characters:{wang:{name:'恰吉王'},han:{name:'韓國魚'}}});ui.open({view:'save'});
 return {ui,api,storage,prompts,window,async import(text){const input=ui.element.querySelector('[data-import]');Object.defineProperty(input,'files',{value:[{size:text.length,text:async()=>text}]});await input.onchange();},status:()=>ui.element.querySelector('[role="status"]').textContent,close(){ui.destroy();dom.window.close();for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
test('old save import asks before writing, backs up, adopts all slots and preserves the original bytes',async()=>{
 const f=await fixture();try{const old=f.storage.getItem(PROFILE_KEY),incoming=newProfileDocument();incoming.profiles[1].unlockedCharacters.push('huang');await f.import(JSON.stringify(incoming));assert.equal(f.prompts.length,1);assert.match(f.prompts[0],/三格完整採用/);assert.match(f.status(),/已匯入並保存/);assert.equal(f.storage.getItem(PROFILE_KEY),old);assert.ok(f.api.readProfile('slot-2').campaign);assert.ok(f.api.readProfile('slot-2').unlockedCharacters.includes('huang'));assert.ok([...f.storage.entries.keys()].some(key=>key.includes(':backup:')));}finally{f.close();}
});
test('cancelled import and malformed versions leave every stored byte unchanged',async()=>{
 const f=await fixture();try{const before=[...f.storage.entries];f.window.confirm=()=>false;await f.import(JSON.stringify(newProfileDocument()));assert.match(f.status(),/已取消/);assert.deepEqual([...f.storage.entries],before);await f.import('{bad');assert.match(f.status(),/無法讀取/);assert.deepEqual([...f.storage.entries],before);await f.import('{"version":99}');assert.match(f.status(),/不支援/);assert.deepEqual([...f.storage.entries],before);}finally{f.close();}
});
test('backup write failure never announces imported data or overwrites the old save',async()=>{
 const f=await fixture();try{const before=[...f.storage.entries],write=f.storage.setItem;f.storage.setItem=(key,value)=>{if(key.includes(':backup:'))throw Error('quota');write(key,value);};await f.import(JSON.stringify(newProfileDocument()));assert.match(f.status(),/尚未匯入保存/);assert.deepEqual([...f.storage.entries],before);}finally{f.close();}
});
