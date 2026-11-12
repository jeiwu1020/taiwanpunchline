import test from 'node:test';
import assert from 'node:assert/strict';
import {Duel} from '../dist/core.mjs';
import {supporterFormation} from '../dist/stage-expansion.mjs';
const banner=d=>supporterFormation(d).find(m=>m.side==='enemy'&&m.flag);

test('miniboss supporters use the neutral display name rather than their borrowed fighter identity',()=>{
 const d=new Duel('wang','easy',()=>.5,'han');
 Object.assign(d.enemy,{rally:100,mobKind:'placard',displayName:'擴音隊長',name:'口號跑腿'});
 assert.equal(banner(d).name,'擴音隊長');
 d.enemy.displayName='';assert.equal(banner(d).name,'口號跑腿');
});

test('VS supporter flags keep the roster character name even if another display name is present',()=>{
 const d=new Duel('wang','easy',()=>.5,'han');
 Object.assign(d.enemy,{rally:100,displayName:'擴音隊長',name:'口號跑腿'});
 assert.equal(banner(d).name,'韓國魚');
});
