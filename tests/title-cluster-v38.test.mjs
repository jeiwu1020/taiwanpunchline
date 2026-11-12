import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const css=readFileSync(new URL('../dist/title-screen.css',import.meta.url),'utf8');
const marker='/* V38 lively cluster';
const baseline=css.split(marker)[0];
const cluster=css.slice(css.indexOf(marker));
const scope='.app:is([data-touch="false"],[data-touch="true"][data-layout="landscape"])';

test('phone portrait retains the complete V37 title stylesheet unchanged',()=>{
 assert.equal(createHash('sha256').update(baseline).digest('hex'),'264effe357845af928aeec5d6b0b405c805e2c93b5534d3b81b085da50eef841');
});

test('the lively cluster is opt-in only for desktop or logical landscape',()=>{
 assert.ok(css.includes(marker),'V38 scoped cluster is present');
 const rules=cluster.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{/g);
 let scoped=0;
 for(const[,raw]of rules){
  const selector=raw.trim();
  if(selector.startsWith('@')||/^(?:from|to|[\d.% ,]+)$/.test(selector))continue;
  assert.ok(selector.startsWith(scope),`Unscoped title override: ${selector}`);scoped++;
 }
 assert.ok(scoped>=8,'Layout and characters are intentionally scoped');
});

test('the cluster leaves central Start above decoration and provides reduced motion',()=>{
 assert.match(cluster,/\.title-actions\{[^}]*z-index:10/);
 assert.match(cluster,/\.title-character\{[^}]*pointer-events:none/);
 assert.match(cluster,/@media\s*\(prefers-reduced-motion:reduce\)/);
 assert.match(cluster,/animation:none/);
 assert.match(cluster,/title-cameo-bob/);
 assert.match(cluster,/\.title-ensemble\{[^}]*max-width:660px/);
});
