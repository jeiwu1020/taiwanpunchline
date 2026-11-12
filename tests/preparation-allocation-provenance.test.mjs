import test from 'node:test';
import assert from 'node:assert/strict';
import * as geometry from './qa-preparation-allocation/geometry-checks.mjs';

// Deliberately fully visible rectangles: these cases must fail on provenance,
// not because a shortened or narrowed override happens to clip a button.
const sample=(patch={})=>({view:'preparation',physical:{width:844,height:390},logical:{width:844,height:390,rotation:0},sample:{purpose:'editable-allocation',source:'direct-fixture',containerSizing:'natural',requestedContainerWidth:null},initialPairRequired:true,panel:{rect:{left:4,top:66,right:824,bottom:308},scrollTop:0},footer:{top:308},firstPair:[{left:292,top:250,right:336,bottom:295.5,width:44,height:45.5},{left:344,top:250,right:388,bottom:295.5,width:44,height:45.5}],...patch});
function standard(){assert.equal(typeof geometry.assertStandardInitialAllocation,'function','the public standard gate needs a provenance check before geometry');return geometry.assertStandardInitialAllocation;}
for(const width of [681,1200])test(`standard gate rejects a fully visible ${width}px override even with a stale required flag`,()=>{
 const m=sample({sample:{purpose:'editable-allocation',source:'direct-fixture',containerSizing:'override',requestedContainerWidth:width}});
 assert.equal(geometry.assertInitialRankPair(m).fullyVisible,true,'pure geometry remains reusable');const check=standard();assert.throws(()=>check(m),/natural|override/i);
});
for(const patch of [
 {logical:{width:932,height:430,rotation:0},physical:{width:932,height:430}},
 {sample:{purpose:'readonly-reference',source:'direct-fixture',containerSizing:'natural',requestedContainerWidth:null}},
 {view:'save'},
 {physical:{width:390,height:844}},
 {initialPairRequired:false},
 {sample:{purpose:'editable-allocation',source:'direct-fixture',containerSizing:'natural',requestedContainerWidth:1200}},
])test(`standard gate rejects wrong profile ${JSON.stringify(patch)}`,()=>{const check=standard();assert.throws(()=>check(sample(patch)),/standard|natural|profile|preparation|editable|applicable/i);});
for(const rotation of [0,90,-90])test(`natural standard profile ${rotation} validates real rectangles instead of accepting metadata alone`,()=>{
 const m=sample({logical:{width:844,height:390,rotation},physical:rotation?{width:390,height:844}:{width:844,height:390}}),check=standard();assert.equal(check(m).status,'PASS');
 const clipped={...m,firstPair:m.firstPair.map(t=>({...t,top:275,bottom:320.5}))};assert.throws(()=>check(clipped),/both complete 44px/);
});
test('nonstandard and override reports are N/A, never a formal standard pass',()=>{
 assert.equal(typeof geometry.standardInitialAllocationResult,'function');
 for(const m of [sample({logical:{width:568,height:320,rotation:0}}),sample({sample:{purpose:'editable-allocation',source:'single-profile',containerSizing:'override',requestedContainerWidth:681},initialPairRequired:false})])assert.equal(geometry.standardInitialAllocationResult(m).status,'N/A');
 assert.equal(geometry.standardInitialAllocationResult(sample()).status,'PASS');
 assert.equal(geometry.standardInitialAllocationResult(sample({panel:{rect:{left:4,top:66,right:824,bottom:280},scrollTop:0}})).status,'FAIL');
});
async function requests(){const mod=await import('./qa-preparation-allocation/fixture-requests.mjs').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});assert.equal(typeof mod.frameRequest,'function','the matrix needs an explicit natural-width request path');return mod.frameRequest;}
for(const width of ['681','1200'])test(`six-size matrix strips selected ${width}px override and records its natural-matrix source`,async()=>{
 const request=await requests(),url=new URL(request(['native844',844,390,0],{containerWidth:width,source:'six-size-natural-matrix'}).src,'https://fixture.test/');assert.equal(url.searchParams.has('containerWidth'),false);assert.equal(url.searchParams.get('sampleSource'),'six-size-natural-matrix');
});
test('single breakpoint request retains its override but cannot be mislabeled a natural matrix sample',async()=>{
 const request=await requests(),url=new URL(request(['native844',844,390,0],{containerWidth:'681'}).src,'https://fixture.test/');assert.equal(url.searchParams.get('containerWidth'),'681');assert.equal(url.searchParams.get('sampleSource'),'breakpoint-probe');
});
