import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createCampaignHandoff,consumeCampaignHandoff} from '../dist/preview/campaign/navigation.mjs';
import {prepareMainContinuation} from '../dist/main-campaign-bridge.mjs';
import {openUnifiedProgress} from '../dist/preview/campaign/unified/progress.mjs';
import {legacy,memoryStorage,serialLocks} from './helpers/formal-flow-fixtures.mjs';
const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
async function setup(profileId='slot-1'){
 const data=legacy({checkpoint:6,completed:true});data.profiles=data.profiles.map(p=>({...structuredClone(data.profiles[0]),id:p.id}));data.activeProfileId=profileId;
 const storage=memoryStorage({'taiwanpunchline-progress-v1':JSON.stringify(data)}),api=await openUnifiedProgress({storage,locks:serialLocks()}),d=new JSDOM('',{url:'https://example.test/'}),nav=[];
 const window={location:{href:d.window.location.href,origin:d.window.location.origin,assign:url=>nav.push(url)},crypto:d.window.crypto,sessionStorage:d.window.sessionStorage,confirm:()=>true,addEventListener(){}};
 const elements=new Map();const context={window,profileProgress:api,selected:'han',playerAssist:'wang',difficulty:'normal',partySelectionTouched:true,challengeOperations:Promise.resolve(),challengeRun:null,prepareMainContinuation,createCampaignHandoff,chooseAdoptionSource:()=>{throw Error('Unexpected ambiguity');},adoptionConfirmation:()=>'',saveIssueText:x=>x,$:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('let campaignNavigationPending='),source.indexOf("window.addEventListener('storage'")),context);
 return {api,d,storage,nav,context,elements};
}
for(const slot of ['slot-1','slot-2','slot-3'])test(`real main continuation issues the exact selected ${slot} once, preserving other slots`,async()=>{const x=await setup(slot),before=x.api.get().document.profiles.filter(p=>p.id!==slot);const a=x.context.continueCampaign(),b=x.context.continueCampaign();assert.equal((await b).reason,'busy');assert.equal((await a).accepted,true);assert.equal(x.nav.length,1);assert.match(x.nav[0],new RegExp(`chapter2/\\?campaign=1&profile=${slot}&handoff=`));x.d.reconfigure({url:x.nav[0]});const h=consumeCampaignHandoff({window:x.d.window,chapterId:'chapter-2'}).handoff;assert.equal(h.profileId,slot);assert.equal(h.difficulty,'hard');assert.deepEqual(x.api.get().document.profiles.filter(p=>p.id!==slot),before);assert.equal((await x.context.continueCampaign()).reason,'busy');x.d.window.close();});
test('main test mode navigates only to isolated preview without reading session storage',async()=>{const x=await setup();x.api.enterTestMode();Object.defineProperty(x.context.window,'sessionStorage',{get(){throw Error('No test-mode access');}});assert.equal((await x.context.continueCampaign()).accepted,true);assert.equal(x.nav[0],'preview/chapter2/?test=1&profile=slot-1');x.d.window.close();});
test('navigation storage failure never claims that the already verified chapter save was lost',async()=>{const x=await setup();let saveFailures=0;x.context.challengeRun={flush:async()=>{}};x.context.showChallengeSaveFailure=()=>saveFailures++;Object.defineProperty(x.context.window,'sessionStorage',{get(){throw Error('blocked');}});const r=await x.context.continueCampaign();assert.equal(r.accepted,false);assert.equal(r.reason,'handoff-unavailable');assert.equal(x.api.get().persisted,true);assert.equal(saveFailures,0);assert.match(x.elements.get('#result-sub').textContent,/已保存/);assert.equal(x.nav.length,0);x.d.window.close();});
