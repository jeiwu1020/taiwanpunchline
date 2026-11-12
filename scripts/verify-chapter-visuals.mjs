// Local visual QA only. Intercepted observation hooks never enter release assets.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE??'http://127.0.0.1:4174',out=resolve('docs/campaign-complete/visuals');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']}),report={base,scope:'rendered game, controlled preview step/position; not physical-device acceptance',checks:[],screenshots:[],errors:[]};let current;
const record=name=>{report.checks.push(name);console.log(name);};
async function setup(width=1280,height=800,mobile=false){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 await context.route('**/*.mjs*',async route=>{const path=new URL(route.request().url()).pathname;if(path==='/game.mjs'||/\/chapter[245]-playable\.mjs$/.test(path)){const response=await route.fetch(),source=await response.text();const hook=path==='/game.mjs'?'window.__visualQA={get world(){return duel}};':`window.__visualQA={get chapter(){return chapter},get world(){return chapter?.world},ui,sync,showStep(step){chapter=createPlayableChapter({characterId:'wang',difficulty:'beginner',initialStepId:step});sync();}};`;await route.fulfill({response,body:source+'\n'+hook});}else await route.continue();});
 const page=await context.newPage();current=page;page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(String(e.stack)));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url()+':'+r.status());});return {page,context};
}
async function click(p,s){await p.locator(s).click();}
async function ready(p){await p.waitForFunction(()=>window.__visualQA&&(location.pathname==='/'||document.body.dataset.viewportReady==='true'));await p.waitForTimeout(250);}
async function snap(p,name){await p.screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:88});report.screenshots.push(name+'.jpg');}
async function step(p,id){await p.evaluate(s=>window.__visualQA.showStep(s),id);await ready(p);await p.waitForFunction(()=>window.__visualQA.chapter?.view().stepId!==undefined);}
async function controls(p,rotate){await click(p,'#help');await click(p,'#settings-tab-controls');if((await p.locator('#rotate-mode').getAttribute('aria-pressed')==='true')!==rotate)await click(p,'#rotate-mode');await click(p,'#close-help');await ready(p);}
try{
 const {page:p,context}=await setup();await p.goto(base+'/');await click(p,'#title-start');await click(p,'#mode-challenge');await click(p,'[data-action="start"]');await click(p,'#preparationConfirm');await click(p,'[data-starter-skip]');await p.waitForFunction(()=>window.__visualQA.world?.depthMode&&window.__visualQA.world.status==='active');await snap(p,'chapter1-entry-desktop');record('chapter one accepted street and opening preserved');
 for(const n of [2,3,4,5]){
  await p.goto(base+`/preview/chapter${n}/?previewOnly=1`);await ready(p);await click(p,'#start');await step(p,'route-a');await snap(p,`chapter${n}-entry-desktop`);
  if(n===2){for(const id of ['entry','route-a','miniboss-a','route-b','miniboss-b','route-c']){await step(p,id);assert.doesNotMatch(await p.locator('body').innerText(),/電火球|蘇貞昌/);}record('chapter two: all pre-Boss streets/minis keep identity anonymous');await step(p,'route-b');await snap(p,'chapter2-temple-desktop');await step(p,'route-c');await snap(p,'chapter2-square-desktop');}
  if(n===3||n===4){await step(p,'route-b');await snap(p,`chapter${n}-middle-desktop`);}
  if(n===5){for(const id of ['route-b','route-c','miniboss-a','miniboss-b','boss']){await step(p,id);if(id.startsWith('miniboss')){while(await p.evaluate(()=>window.__visualQA.chapter.view().mode==='story'))await click(p,'#story-next');await ready(p);}await snap(p,'chapter5-'+id+'-desktop');}
   await step(p,'route-b');await p.evaluate(()=>{const g=window.__visualQA.world;g.enemies=[];g.section={...g.section,spawns:[]};g.player.x=1450;});await p.keyboard.down('KeyD');await p.keyboard.down('KeyW');await p.waitForTimeout(280);await p.keyboard.up('KeyD');await p.keyboard.up('KeyW');await p.mouse.click(600,400);await p.keyboard.press('Space');await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>window.__visualQA.world.player.y<430));await snap(p,'chapter5-mid-route-jump-desktop');record('chapter five: all three streets, two new staff, Boss and actual four-way/jump input render');
  }
 }
 await context.close();
 for(const [name,width,height,rotate]of [['portrait',390,844,false],['landscape',844,390,false],['sideways',390,844,true]]){
  const {page,context:c}=await setup(width,height,true);await page.goto(base+'/preview/chapter5/?previewOnly=1');await ready(page);await click(page,'#start');await controls(page,rotate);
  for(const id of ['route-a','route-b','route-c']){await step(page,id);await snap(page,'chapter5-'+id+'-'+name);assert.equal(await page.locator('body').getAttribute('data-viewport-ready'),'true');}
  await step(page,'route-c');const b=await page.locator('[data-action="jump"]').first().boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(90);assert.ok(await page.evaluate(()=>window.__visualQA.world.player.y<430));await snap(page,'chapter5-jump-'+name);record('chapter five '+name+': three streets, committed viewport, real touch jump');await c.close();
 }
 assert.deepEqual(report.errors,[]);report.success=true;
}catch(e){report.success=false;report.failure=String(e.stack);if(current&&!current.isClosed())await current.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw e;}
finally{writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
