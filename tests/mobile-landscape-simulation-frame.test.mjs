import test from 'node:test';import assert from 'node:assert/strict';
// Dynamic import makes missing public API a useful assertion rather than a loader error.
let api;try{api=await import('../dist/simulation-frame.mjs');}catch{api={};}
test('bounded frame planner accepts equal elapsed at 60, 30 and 20 Hz with edge input only once',()=>{
 assert.equal(typeof api.planSimulationFrame,'function');for(const hz of [60,30,20]){let elapsed=0,edges=0;for(let frame=0;frame<hz;frame++){const p=api.planSimulationFrame(1000/hz);assert.equal(p.droppedMs,0);p.steps.forEach((dt,i)=>{assert.ok(dt>0&&dt<=1/60);elapsed+=dt;if(i===0)edges++;});}assert.ok(Math.abs(elapsed-1)<1e-12);assert.equal(edges,hz);}
});
test('stalls report discarded time and invalid or paused frames never advance',()=>{assert.equal(typeof api.planSimulationFrame,'function');const p=api.planSimulationFrame(1000);assert.equal(p.acceptedMs,100);assert.equal(p.droppedMs,900);assert.equal(p.steps.length,6);for(const value of [0,-1,NaN,Infinity,undefined])assert.deepEqual(api.planSimulationFrame(value),{steps:[],acceptedMs:0,droppedMs:0});assert.deepEqual(api.planSimulationFrame(50,{paused:true}),{steps:[],acceptedMs:0,droppedMs:50});});
