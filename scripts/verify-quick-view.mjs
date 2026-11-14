// Run in a browser-capable environment against exact-base preview + local override files.
// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/verify-quick-view.mjs
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist'),host='codex-complete-challenge-story-taiwanpunchline.playformosa.workers.dev',base='https://'+host;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const errors=[];
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500});
  await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!==host)return route.continue();const file=resolve(root,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(file.startsWith(root+'/')&&existsSync(file)){const type={'.html':'text/html; charset=utf-8','.mjs':'application/javascript','.js':'application/javascript','.css':'text/css'}[extname(file)];return route.fulfill({body:readFileSync(file),contentType:type||'application/octet-stream'});}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await context.addInitScript(()=>{if(window===window.parent){localStorage.setItem('owner-save-sentinel','untouched');}});
  // Do not boot chapter 1 twice while testing chapter 5; avoid fixed-time frame races.
  await page.goto(base+'/preview/quick-view/?chapter=5',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>{try{return document.querySelector('#game')?.contentWindow.location.pathname==='/preview/chapter5/';}catch{return false;}},{},{timeout:60000});
  const frame=page.frames().find(f=>new URL(f.url()).pathname==='/preview/chapter5/');assert.ok(frame);
  await frame.locator('#quick-view-advance').waitFor({timeout:60000});
  await frame.locator('body[data-viewport-ready="true"]').waitFor({timeout:60000});
  await frame.locator('#start:not([disabled])').waitFor({state:'attached',timeout:60000});
  await frame.click('#campaign-resume');
  for(let until=Date.now()+60000;Date.now()<until;){
   const mode=await frame.locator('body').getAttribute('data-chapter-mode');if(mode==='route')break;
   const next=frame.locator('#story-next');if(await next.isVisible())await next.click();else await frame.waitForTimeout(250);
  }
  await frame.waitForFunction(()=>document.body.dataset.chapterMode==='route',{},{timeout:60000});
  const before=await frame.evaluate(()=>({mode:document.body.dataset.chapterMode,viewportReady:document.body.dataset.viewportReady,buttonDisabled:document.querySelector('#quick-view-advance')?.disabled,focused:document.hasFocus()}));
  const previous=await page.locator('#status').textContent();
  await frame.click('#quick-view-advance');
  try{
   // A rejection is a completed response too: record it, never hang waiting only for success.
   await page.waitForFunction(old=>document.querySelector('#status').textContent!==old,previous,{timeout:15000});
   const observed=await page.locator('#status').textContent();
   const after=await frame.evaluate(()=>({mode:document.body.dataset.chapterMode,viewportReady:document.body.dataset.viewportReady,buttonDisabled:document.querySelector('#quick-view-advance')?.disabled,focused:document.hasFocus()}));
   console.log(JSON.stringify({viewport,before,observed,after,errors}));
   assert.match(observed,/^已跳過/);
  }catch(error){
   console.error(JSON.stringify({viewport,before,status:await page.locator('#status').textContent(),errors}));
   await page.screenshot({path:`quick-view-failure-${viewport.width}.png`});throw error;
  }
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),{'owner-save-sentinel':'untouched'});
  assert.equal(await frame.evaluate(()=>window.localStorage===window.parent.localStorage),false);
  const box=await frame.locator('#quick-view-advance').boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=viewport.width,'mobile quick-view button inside viewport');
  await page.screenshot({path:`quick-view-${viewport.width}.png`});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile real fast-forward and original storage isolation');
}finally{await browser.close();}
