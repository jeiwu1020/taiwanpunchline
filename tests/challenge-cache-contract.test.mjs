import {RUNTIME_VERSION} from '../build/runtime-version.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,relative,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../dist'),contract=JSON.parse(readFileSync(new URL('./fixtures/challenge-cache-contract.json',import.meta.url),'utf8'));
const targets=new Set(contract.targets.map(p=>resolve(root,p)));
const files=path=>readdirSync(path,{withFileTypes:true}).flatMap(e=>e.name==='vendor'?[]:e.isDirectory()?files(resolve(path,e.name)):[resolve(path,e.name)]);
test('all direct and transitive references to changed challenge modules use one coherent release key',()=>{
 const failures=[];let checked=0;
 for(const path of files(root).filter(p=>['.mjs','.js','.html','.css'].includes(extname(p)))){
  const text=readFileSync(path,'utf8');
  for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|(?:src|href)\s*=\s*)['"]([^'"]+)['"]/g)){
   const ref=match[1];if(ref.includes('://')||ref.startsWith('/')||ref.startsWith('#')||ref.startsWith('data:'))continue;
   const target=resolve(dirname(path),ref.split(/[?#]/)[0]);if(!targets.has(target))continue;checked++;
   if(new URL(ref,'https://test.invalid/').searchParams.get('v')!==RUNTIME_VERSION)failures.push(`${relative(root,path)} -> ${ref}`);
  }
 }
 assert.ok(checked>50,'the actual transitive production graph was inspected');assert.deepEqual(failures,[]);
});
