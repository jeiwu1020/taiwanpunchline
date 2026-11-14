// Browser-only observations and fault injection. No hooks enter release files.
import {webkit,devices} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {newEnvelope,CHALLENGE_KEY} from '../dist/preview/campaign/fresh/schema.mjs';
const base=process.env.QA_BASE??'http://127.0.0.1:4174',out=resolve(process.env.QA_OUT??'docs/campaign-complete/boot');
mkdirSync(out,{recursive:true});
const browser=await webkit.launch({headless:true,...(base.startsWith('https:')?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
const report={base,browser:'Playwright WebKit; mobile emulation, not physical iPhone acceptance',checks:[],errors:[]};
let current;
async function replaceSource(route,transform){const response=await route.fetch(),headers=response.headers();delete headers['content-encoding'];delete headers['content-length'];await route.fulfill({status:response.status(),headers,body:transform(await response.text())});}
try{
 for(const [mode,layout]of [['network-recovery','portrait'],['timeout-recovery','portrait'],['paused-frames','portrait'],['normal','landscape'],['normal','sideways']]){
  if(process.env.QA_CASES&&!process.env.QA_CASES.split(',').includes(mode+'-'+layout))continue;
  const context=await browser.newContext({...devices['iPhone 13'],viewport:layout==='landscape'?{width:844,height:390}:{width:390,height:844}}),page=await context.newPage();current=page;
  let failedRequests=0,blocked=true;const requests=new Map(),seed=JSON.stringify(newEnvelope());
  await context.addInitScript(({seed,key,rotate})=>{localStorage.setItem(key,seed);localStorage.setItem('parliament-settings-v1',JSON.stringify({version:1,rotate}));},{seed,key:CHALLENGE_KEY,rotate:layout==='sideways'});
  await context.route('**/game.mjs*',route=>replaceSource(route,source=>source+'\nwindow.__bootQA={get world(){return duel}};'));
  if(mode==='paused-frames')await context.addInitScript(()=>{
   const native=requestAnimationFrame,nativeCancel=cancelAnimationFrame,queued=new Map();let enabled=false,serial=0;
   window.requestAnimationFrame=fn=>{if(enabled)return native(fn);const id=--serial;queued.set(id,fn);return id;};
   window.cancelAnimationFrame=id=>{if(id<0)queued.delete(id);else nativeCancel(id);};
   window.__resumeFrames=()=>{enabled=true;for(const fn of queued.values())native(fn);queued.clear();};
  });
  // Accelerate only the loader's deadline in this intercepted test response.
  if(mode==='timeout-recovery')await context.route('**/boot-art-loader.mjs*',route=>replaceSource(route,source=>source.replace('timeoutMs=45000','timeoutMs=2500')));
  await context.route('**/assets/**',async route=>{
   const path=new URL(route.request().url()).pathname;requests.set(path,(requests.get(path)??0)+1);
   if(mode.endsWith('recovery')&&path.endsWith('/handshake-v13.png')&&blocked){
    failedRequests++;
    if(mode==='network-recovery')return route.abort('failed');
    await new Promise(done=>setTimeout(done,5500));await route.abort('failed').catch(()=>{});return;
   }
   await route.continue();
  });
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  if(mode.endsWith('recovery')){
   await page.locator('#boot-art-retry:visible').waitFor({timeout:30000});assert.equal(failedRequests,2);
   assert.equal(await page.locator('#title-start').isDisabled(),true);assert.match(await page.locator('#title-status').textContent(),/未能載入/);
   const before=new Map(requests);blocked=false;await page.locator('#boot-art-retry').tap();
   await page.locator('#title-start:enabled').waitFor({timeout:30000});
   for(const [url,count]of before)if(!url.endsWith('/handshake-v13.png'))assert.equal(requests.get(url),count,'successful artwork was fetched again: '+url);
  }else{
   await page.locator('#title-start:enabled').waitFor({timeout:30000});
   if(mode==='paused-frames')await page.evaluate(()=>window.__resumeFrames());
  }
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),CHALLENGE_KEY),seed,'boot cannot rewrite saves');
  assert.equal(await page.locator('#title-screen').getAttribute('data-boot-state'),'ready');
  await page.waitForFunction(()=>document.querySelector('.app').dataset.viewportReady==='true');await page.waitForTimeout(300);
  assert.equal(await page.locator('.app').getAttribute('data-rotation'),layout==='sideways'?'90':'0');
  await page.screenshot({path:resolve(out,mode+'-'+layout+'-ready.jpg'),type:'jpeg',quality:85});
  const menuClick=async selector=>{
   const control=page.locator(selector);await control.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.app').dataset.viewportReady==='true');
   // Let the modal's 240ms orientation/geometry guard settle after auto-scroll.
   await page.waitForTimeout(300);await control.click();
  };
  await menuClick('#title-start');await menuClick('#mode-challenge');
  await menuClick('[data-action="start"]');await menuClick('#preparationConfirm');await menuClick('[data-starter-skip]');
  await page.waitForFunction(()=>window.__bootQA.world.depthMode&&window.__bootQA.world.status==='active');
  await page.waitForFunction(()=>document.querySelector('.app').dataset.viewportReady==='true');await page.waitForTimeout(300);
  await page.locator('#challenge-jump').tap();await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>window.__bootQA.world.player.y<430),'real touch jump must move the player');
  await page.screenshot({path:resolve(out,mode+'-'+layout+'-playing.jpg'),type:'jpeg',quality:85});
  report.checks.push({mode,layout,failedRequests,uniqueAssets:requests.size,enteredChallenge:true,touchJump:true,savesPreservedDuringBoot:true});
  console.log(mode+' / '+layout+' passed');await context.close();
 }
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(error){report.success=false;report.failure=String(error.stack);if(current&&!current.isClosed())await current.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw error;}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
