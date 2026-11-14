import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const url=new URL('../dist/preview/campaign/chapter-street-motifs.mjs',import.meta.url);
test('chapters two to four have distinct street stations without pre-Boss names or portraits',async()=>{
 assert.ok(existsSync(url),'street features are actually rendered');const {streetMotifPlan}=await import(url);const kinds=[];
 for(const chapter of [2,3,4])for(let route=0;route<3;route++){const p=streetMotifPlan(chapter,route,2600);assert.ok(p.length>=2);assert.ok(p.some(x=>x.x<500));assert.ok(p.every(x=>x.depth<-150));if(route===0)kinds.push(p[0].kind);if(chapter===2)assert.doesNotMatch(JSON.stringify(p),/電火球|蘇貞昌|su-head|su_slam|fireball/);}
 assert.equal(new Set(kinds).size,3);assert.deepEqual(streetMotifPlan(1,0,2500),[]);
});
