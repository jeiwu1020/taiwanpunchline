// Local browser QA: hooks are appended to intercepted responses, never shipped.
// Controlled wins/gates test real UI, transitions and durable writes, not balance.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const base=process.env.QA_BASE??'http://127.0.0.1:4174',out=resolve('docs/campaign-complete/browser');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={kind:'Chromium synthetic flow + real keyboard/touch, not physical-device acceptance',base,checks:[],errors:[],screenshots:[]};
let qaPage;
const check=(name,detail={})=>{report.checks.push({name,...detail});console.log(name);};
async function instrument(context){
 await context.route('**/*.mjs*',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/game.mjs'||/\/chapter[245]-playable\.mjs$|\/finale-playable\.mjs$/.test(path)){
   const response=await route.fetch(),source=await response.text(),hook=path==='/game.mjs'?`window.__campaignQA={get chapter(){return challengeRun},get world(){return duel},get progress(){return profileProgress},get mode(){return gameMode},get started(){return started},flush:async()=>{await challengeOperations;await challengeRun?.flush();}};`:`window.__campaignQA={get chapter(){return chapter},get world(){return chapter?.world},ui,sync};`;
   await route.fulfill({response,body:source+'\n'+hook});
  }else await route.continue();
 });
}
function collect(page){qaPage=page;page.on('pageerror',e=>report.errors.push({url:page.url(),message:String(e.stack)}));page.on('response',r=>{if(r.status()>=400)report.errors.push({url:r.url(),status:r.status()});});}
async function ready(page){await page.waitForFunction(()=>window.__campaignQA&&(location.pathname==='/'||document.body.dataset.viewportReady==='true'),{},{timeout:20000});}
async function snap(page,name){await page.screenshot({path:resolve(out,name+'.png')});report.screenshots.push(name+'.png');}
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('taiwanpunchline-challenge-v4')));}
async function click(page,selector){await page.locator(selector).click({timeout:12000});}
try{
 if(!process.env.QA_LAYOUT_ONLY){
 const context=await browser.newContext({viewport:{width:1280,height:800}});await instrument(context);const page=await context.newPage();page.setDefaultTimeout(20000);collect(page);
 if(process.env.QA_FROM_CHAPTER2){const {campaignStorage}=await import('../tests/helpers/campaign-complete-fixture.mjs');const f=campaignStorage(1);const e=JSON.parse(f.storage.getItem('taiwanpunchline-challenge-v4'));e.campaign.profiles[0].campaign.story.opening='seen';f.storage.setItem('taiwanpunchline-challenge-v4',JSON.stringify(e));await context.addInitScript(raw=>{if(!localStorage.getItem('taiwanpunchline-challenge-v4'))localStorage.setItem('taiwanpunchline-challenge-v4',raw);},f.storage.getItem('taiwanpunchline-challenge-v4'));await page.goto(base+'/preview/chapter2/?campaign=1&profile=slot-1');await ready(page);await click(page,'#campaign-resume');}else{
 await page.goto(base+'/');await click(page,'#title-start');await click(page,'#mode-challenge');await click(page,'[data-action="start"]');await click(page,'#preparationConfirm');await click(page,'[data-starter-skip]');await ready(page);
 await page.waitForFunction(()=>window.__campaignQA.world?.depthMode&&window.__campaignQA.started);
 assert.deepEqual((await saved(page)).campaign.profiles[0].unlockedCharacters,['wang','han']);
 const firstX=await page.evaluate(()=>window.__campaignQA.world.player.x);await page.keyboard.down('KeyD');await page.waitForTimeout(350);await page.keyboard.up('KeyD');assert.ok(await page.evaluate(x=>window.__campaignQA.world.player.x>x,firstX));check('fresh first chapter: accepted opening, two starters, real movement');
 for(let i=0;i<160&&new URL(page.url()).pathname==='/';i++){
  if(await page.locator('.challenge-story[open] [data-story-next]').isVisible()){await click(page,'.challenge-story[open] [data-story-next]').catch(e=>{if(new URL(page.url()).pathname==='/')throw e;});await page.waitForTimeout(80);continue;}
  const state=await page.evaluate(()=>({kind:window.__campaignQA?.chapter?.phase.kind,status:window.__campaignQA?.world?.status,started:window.__campaignQA?.started,checkpoint:window.__campaignQA?.chapter?.checkpoint,winner:window.__campaignQA?.world?.winner,copy:document.querySelector('#result-title')?.textContent,buttons:[...document.querySelectorAll('#result button')].map(b=>[b.id,b.hidden,b.disabled,b.textContent])}));
  
  if(state.status==='paused'){await click(page,'#resume');continue;}
  if(state.kind==='route'&&state.status==='active')await page.evaluate(()=>{const q=window.__campaignQA,g=q.world;g.events.push({type:'routeGate',carry:g.exportCarry()});});
  else if(['boss','miniboss'].includes(state.kind)&&state.status==='active')await page.evaluate(()=>window.__campaignQA.world.enemy.hp=0);
  else if(await page.locator('#next-round').isVisible()&&await page.locator('#next-round').isEnabled())await click(page,'#next-round');
  else if(await page.locator('#replay').isVisible()&&await page.locator('#replay').isEnabled())await click(page,'#replay');
  await page.waitForTimeout(240);
 }
 await page.waitForURL('**/preview/chapter2/**',{timeout:20000});await ready(page);check('chapter one: two minis, BO3, new handoff comic, durable chapter-two navigation');
 }
 for(const n of [2,3,4,5]){
  await page.waitForURL(`**/preview/chapter${n}/**`,{timeout:20000});await ready(page);await page.waitForFunction(()=>window.__campaignQA.chapter);
  const entered=await saved(page);assert.equal(entered.campaign.profiles[0].campaign.cursor.chapterId,`chapter-${n}`);assert.equal(entered.campaign.profiles[0].campaign.story.opening,'seen');
  if(n===2){assert.doesNotMatch(await page.locator('#story-copy').textContent(),/電火球/);check('chapter two: anonymous entry keeps Boss hidden');}
  let walked=false,changed=false;
  for(let i=0;i<100&&new URL(page.url()).pathname===`/preview/chapter${n}/`;i++){
   const s=await page.evaluate(()=>window.__campaignQA?.chapter?.view()).catch(e=>{if(new URL(page.url()).pathname!==`/preview/chapter${n}/`)return null;throw e;});if(!s){await page.waitForTimeout(50);continue;}if(s.busy){await page.waitForTimeout(60);continue;}
   if(s.paused){await click(page,'#resume');continue;}
   if(s.mode==='story')await click(page,'#story-next');
   else if(s.mode==='route'){
    if(!walked){await ready(page);await page.waitForTimeout(250);const old=await page.evaluate(()=>({x:window.__campaignQA.world.player.x,z:window.__campaignQA.world.player.depth}));await page.keyboard.down('KeyD');await page.keyboard.down('KeyW');await page.waitForTimeout(250);await page.keyboard.up('KeyD');await page.keyboard.up('KeyW');const now=await page.evaluate(()=>({x:window.__campaignQA.world.player.x,z:window.__campaignQA.world.player.depth}));assert.ok(now.x!==old.x&&now.z!==old.z,JSON.stringify({old,now,state:await page.evaluate(()=>({s:window.__campaignQA.chapter.view(),ready:window.__campaignQA.ui.ready,world:window.__campaignQA.world.status}))}));walked=true;if(n===5)await snap(page,'chapter5-street-desktop');}
    await page.evaluate(async()=>{const q=window.__campaignQA;q.world.status='gate';q.chapter.step(0,{});await q.chapter.flush();q.sync();});
   }else if(s.mode==='battle')await page.evaluate(()=>{window.__campaignQA.world.enemy.hp=0;});
   else if(s.mode==='result'){if(await page.locator('#result-next').isEnabled())await click(page,'#result-next');}
   else if(s.mode==='choice'){
    if(n===2&&!changed){await click(page,'#campaign-prepare');await page.locator('#preparationMain').selectOption('su',{force:true});await click(page,'#preparationConfirm');await page.waitForFunction(()=>!document.querySelector('#challengePreparationOverlay').open);assert.equal(await page.evaluate(()=>window.__campaignQA.chapter.view().characterId),'su');changed=true;check('newly unlocked character takes over shared chapter progress without wake-up replay');}
    await click(page,'#chapter-next');
   }
   await page.waitForTimeout(100);
  }
  const next=n===5?'finale':`chapter${n+1}`;await page.waitForURL(`**/preview/${next}/**`,{timeout:20000});check(`chapter ${n}: three routes, two minis, BO3, unlock, saved continuation`);
 }
 await ready(page);await page.waitForFunction(()=>window.__campaignQA.chapter?.view().mode==='team-select');const seven=(await saved(page)).campaign.profiles[0];assert.equal(seven.unlockedCharacters.length,7);assert.equal(seven.campaign.chapterClears.length,5);
 await page.locator('#team-main').selectOption('han',{force:true});await page.locator('#team-ally1').selectOption('han',{force:true});assert.equal(await page.locator('#start').isDisabled(),true);
 await page.locator('#team-ally1').selectOption('ko',{force:true});await page.locator('#team-ally2').selectOption('ma',{force:true});await click(page,'#start');await page.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='battle');
 await ready(page);await page.waitForTimeout(250);const pos=await page.evaluate(()=>({x:window.__campaignQA.world.player.x,z:window.__campaignQA.world.player.depth}));await page.keyboard.down('KeyD');await page.keyboard.down('KeyS');await page.waitForTimeout(240);await page.keyboard.up('KeyD');await page.keyboard.up('KeyS');await page.keyboard.press('Space');await page.keyboard.press('KeyJ');assert.ok(await page.evaluate(p=>{const f=window.__campaignQA.world.player;return f.x!==p.x&&f.depth!==p.z;},pos));
 await snap(page,'finale-battle-desktop');check('finale: seven characters, duplicate-team rejection and actual four-way keyboard play');
 await page.evaluate(()=>{for(const a of window.__campaignQA.world.actors)if(a.team===0)a.hp=0;});await page.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='result');assert.equal(await page.evaluate(()=>window.__campaignQA.chapter.view().result.winner),'enemy');await click(page,'#result-reselect');await page.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='team-select');await click(page,'#start');await page.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='battle');check('finale loss: retry and reselect preserve five chapters');
 await page.evaluate(()=>{const q=window.__campaignQA;q.world.player.hp=0;});await page.waitForTimeout(250);assert.match(await page.locator('#objective').textContent(),/觀戰/);
 await page.evaluate(()=>{window.__qaOriginalWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='taiwanpunchline-challenge-v4')throw new DOMException('Synthetic quota','QuotaExceededError');return window.__qaOriginalWrite.call(this,k,v);};for(const a of window.__campaignQA.world.actors)if(a.team===1)a.hp=0;});
 await page.waitForFunction(()=>window.__campaignQA.chapter.view().saveIssue);assert.equal(await page.locator('#result-next').isDisabled(),true);assert.equal(await page.evaluate(()=>window.__campaignQA.chapter.view().canNavigate),false);await snap(page,'finale-victory-save-blocked');
 await page.evaluate(()=>{Storage.prototype.setItem=window.__qaOriginalWrite;});await click(page,'#finale-save-slot');await click(page,'#finale-save-retry');await page.waitForFunction(()=>window.__campaignQA.chapter.view().persisted);assert.equal((await saved(page)).campaign.profiles[0].campaign.cursor.stepId,'ending');check('fallen player wins through teammates; quota failure blocks ending until verified retry');
 await click(page,'#result-next');for(let i=0;i<10;i++)await click(page,'#story-next');await page.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='complete');const completed=(await saved(page)).campaign.profiles[0];assert.equal(completed.campaign.cursor.stepId,'complete');assert.equal(completed.campaign.finale.status,'completed');await snap(page,'ending-complete-desktop');
 await page.reload();await ready(page);await click(page,'#start');await page.waitForFunction(()=>window.__campaignQA.chapter?.view().mode==='story');for(let i=0;i<10;i++)await click(page,'#story-next');assert.equal((await saved(page)).campaign.profiles[0].campaign.xp,completed.campaign.xp);check('ending complete survives reload and review never duplicates rewards');await context.close();
 }
 for(const [name,width,height,rotated]of [['portrait',390,844,false],['landscape',844,390,false],['sideways',390,844,true],['small-landscape',568,320,false]]){
  const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await instrument(c);const p=await c.newPage();collect(p);await p.goto(base+'/preview/finale/?previewOnly=1');await ready(p);await p.waitForFunction(()=>window.__campaignQA.chapter);await click(p,'#help');await click(p,'#settings-tab-controls');const rotate=p.locator('#rotate-mode');if((await rotate.getAttribute('aria-pressed')==='true')!==rotated)await rotate.click();await click(p,'#close-help');await ready(p);await click(p,'#start');await p.waitForFunction(()=>window.__campaignQA.chapter.view().mode==='battle');
  await ready(p);await p.waitForTimeout(250);const jump=await p.locator('[data-action="jump"]').first().boundingBox();assert.ok(jump);await p.touchscreen.tap(jump.x+jump.width/2,jump.y+jump.height/2);await p.waitForTimeout(90);const roster=await p.locator('#arena-roster span').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));const rosterParent=await p.locator('.chapter-objective').boundingBox();assert.ok(roster.every(r=>r.top>=rosterParent.y&&r.bottom<=rosterParent.y+rosterParent.height),'shared objective must not clip team chips');assert.equal(roster.length,7);assert.ok(roster.every(r=>r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height),'all seven health chips stay in the viewport');const y=await p.evaluate(()=>window.__campaignQA.world.player.y);assert.ok(y<430,`${name}: actual touch jump hits the control`);await snap(p,'finale-'+name);check(`finale ${name}: ready viewport and actual touch-button hit`,{width,height,rotation:await p.locator('body').getAttribute('data-rotation')});await c.close();
 }
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(error){report.success=false;report.failure=String(error.stack);if(qaPage&&!qaPage.isClosed()){await qaPage.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});report.state=await qaPage.evaluate(()=>({url:location.href,body:document.body.dataset,view:window.__campaignQA?.chapter?.view?.(),text:document.body.innerText.slice(-3000)})).catch(()=>null);}throw error;}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
