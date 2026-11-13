import {chromium} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('dist/preview/quick-view/index.html','utf8');
const {bindQuickViewHelp}=await import('../dist/preview/quick-view/header.mjs');
mkdirSync('qa/header-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const [width,height] of [[568,320],[844,390],[390,844],[1280,800]]){
 const page=await browser.newPage({viewport:{width,height}});
 await page.setContent(html);
 await page.evaluate(String(bindQuickViewHelp)+';bindQuickViewHelp(document)');
 const m=await page.evaluate(()=>{const h=document.querySelector('header').getBoundingClientRect(),f=document.querySelector('#game').getBoundingClientRect();return {header:h.height,game:f.height,controls:[...document.querySelectorAll('select,button,a')].filter(e=>getComputedStyle(e).display!=='none').map(e=>({x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,bottom:e.getBoundingClientRect().bottom}))};});
 assert.ok(m.game>0);
 if(height<=450){
  assert.ok(m.header<=52,JSON.stringify(m));
  assert.ok(m.game>=height-52);
  assert.ok(m.controls.every(c=>c.x>=0&&c.right<=width&&c.bottom<=52),JSON.stringify(m));
  await page.click('#toggle-help');
  assert.equal(await page.locator('#status').isVisible(),true);
  assert.equal(await page.locator('#game').evaluate(e=>e.getBoundingClientRect().height),m.game);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#status').isVisible(),false);
  await page.evaluate(()=>{const s=document.querySelector('#status');s.dataset.failure='true';s.textContent='Isolation failed';s.setAttribute('role','alert');document.querySelector('#game').hidden=true;});
  assert.equal(await page.locator('#status').isVisible(),true);
 }
 await page.screenshot({path:`qa/header-screenshots/${width}x${height}.png`});
 console.log({width,height,...m});await page.close();
}
await browser.close();
