import test from 'node:test';
import assert from 'node:assert/strict';
import {quickViewAllowed,createQuickViewStorage,seedChapter} from '../dist/preview/quick-view/session.mjs';
import {validateEnvelope,CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
const host='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev';
test('quick view rejects production, foreign and lookalike hosts',()=>{assert.equal(quickViewAllowed(host),true);for(const h of ['taiwanpunchline.playformosa.workers.dev','localhost',host+'.evil.test','evil.'+host])assert.equal(quickViewAllowed(h),false);});
test('all chapter seeds pass the actual campaign validator',()=>{for(let n=1;n<=6;n++){const e=seedChapter(n);assert.equal(validateEnvelope(e).ok,true);assert.equal(e.campaign.profiles[0].campaign.chapterClears.length,n-1);assert.equal(e.campaign.profiles[0].campaign.cursor.chapterId,n===6?'finale-3v4':`chapter-${n}`);}});
test('preview storage never touches browser storage and sessions are isolated',()=>{const a=createQuickViewStorage(),b=createQuickViewStorage();a.setItem(CHALLENGE_KEY,JSON.stringify(seedChapter(5)));assert.equal(b.getItem(CHALLENGE_KEY),null);a.clear();assert.equal(a.length,0);assert.equal(a.getItem(CHALLENGE_KEY),null);});
test('invalid chapter choice fails closed',()=>{for(const n of [0,7,1.5,'2',null])assert.throws(()=>seedChapter(n));});
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {registerQuickView,requireQuickViewIsolation} from '../dist/preview/quick-view/hook.mjs';
const bootstrap=readFileSync(new URL('../dist/preview/quick-view/bootstrap.js',import.meta.url),'utf8');
function frameFixture({production=false,broken=false}={}){
 let reads=0,writes=0,stopped=false;const loc={hostname:production?'taiwanpunchline.playformosa.workers.dev':host,origin:'https://'+host};
 const win={location:loc,stop(){stopped=true;}};Object.defineProperty(win,'localStorage',{configurable:!broken,get(){reads++;throw Error('real storage read');}});Object.defineProperty(win,'sessionStorage',{configurable:true,get(){reads++;throw Error('real storage read');}});
 const session={frame:{contentWindow:win},local:createQuickViewStorage(),tab:createQuickViewStorage(),clearHandler(){},setHandler(h){this.handler=h;}};
 const parent={location:{origin:loc.origin,pathname:'/preview/quick-view/'},__quickViewSession:session};win.parent=parent;
 const document={open(){},write(){writes++;},close(){}};
 return {win,session,context:{window:win,parent,location:loc,document},reads:()=>reads,writes:()=>writes,stopped:()=>stopped};
}
test('early bootstrap substitutes storage without reading existing storage',()=>{const f=frameFixture();vm.runInNewContext(bootstrap,f.context);assert.equal(f.reads(),0);assert.equal(f.win.localStorage,f.session.local);assert.equal(f.win.sessionStorage,f.session.tab);assert.equal(f.win.__quickViewIsolated,f.session);});
test('production bootstrap is inert',()=>{const f=frameFixture({production:true});vm.runInNewContext(bootstrap,f.context);assert.equal(f.win.__quickViewIsolated,undefined);assert.equal(f.reads(),0);});
test('isolation failure aborts document before game scripts',()=>{const f=frameFixture({broken:true});assert.throws(()=>vm.runInNewContext(bootstrap,f.context));assert.equal(f.stopped(),true);assert.equal(f.writes(),1);assert.equal(f.reads(),0);});
test('fast forward requires isolated frame and rejects obsolete frame storage',async()=>{const f=frameFixture();vm.runInNewContext(bootstrap,f.context);let calls=0;assert.equal(registerQuickView(f.win,()=>++calls),true);await f.session.handler();assert.equal(calls,1);f.session.local=createQuickViewStorage();assert.equal(await f.session.handler(),false);assert.equal(calls,1);});
test('query or production cannot register a fast-forward hook',()=>{const f=frameFixture({production:true});assert.equal(registerQuickView(f.win,()=>true),false);assert.equal(f.session.handler,undefined);});
test('isolation script is first executable script on every game entry',()=>{for(const path of ['index.html',...Array.from({length:4},(_,i)=>`preview/chapter${i+2}/index.html`),'preview/finale/index.html']){const html=readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');assert.match(html.match(/<script[^>]*>/)[0],/data-quick-view-isolation/);}});

test('missing bootstrap is rejected before game initialization',()=>{const f=frameFixture();assert.throws(()=>requireQuickViewIsolation(f.win),/isolation is required/);assert.equal(f.reads(),0);});
test('failed isolation reports to the surviving parent before stopping the frame',()=>{const f=frameFixture({broken:true});const calls=[];f.session.fail=win=>calls.push(win);assert.throws(()=>vm.runInNewContext(bootstrap,f.context));assert.deepEqual(calls,[f.win]);assert.equal(f.reads(),0);});
import {showIsolationFailure,ISOLATION_FAILURE} from '../dist/preview/quick-view/failure.mjs';
test('parent error remains visible independently of failed iframe document',()=>{const source={},status={dataset:{},setAttribute(k,v){this[k]=v;}},frame={contentWindow:source,hidden:false};assert.equal(showIsolationFailure({frame,status},source),true);assert.equal(frame.hidden,true);assert.equal(status.textContent,ISOLATION_FAILURE);assert.equal(status.role,'alert');assert.equal(status.dataset.failure,'true');});
test('unrelated frame cannot replace the parent error state',()=>{const status={dataset:{}},frame={contentWindow:{},hidden:false};assert.equal(showIsolationFailure({frame,status},{}),false);assert.equal(frame.hidden,false);assert.equal(status.textContent,undefined);});
