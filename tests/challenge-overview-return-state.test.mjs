import test from 'node:test';
import assert from 'node:assert/strict';
import {createChallengeOverviewReturnState} from '../dist/preview/campaign/overview-return-state.mjs';

function memoryStorage(){
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('challenge menu state survives a chapter navigation and is consumed once on return',()=>{
 const storage=memoryStorage(),first=createChallengeOverviewReturnState(storage),menu={selected:'wang',opponent:'han',difficulty:'hard',roundFormat:'best-of-three',gameMode:'battle'};
 assert.equal(first.save(menu),true);
 const afterNavigation=createChallengeOverviewReturnState(storage);
 assert.deepEqual(afterNavigation.take(),menu);
 assert.equal(afterNavigation.take(),null);
});

test('challenge menu state stores only selection fields and tolerates unavailable session storage',()=>{
 const storage=memoryStorage(),state=createChallengeOverviewReturnState(storage);
 state.save({selected:'wang',password:'should-not-persist'});
 assert.deepEqual(createChallengeOverviewReturnState(storage).take(),{selected:'wang'});
 assert.equal(createChallengeOverviewReturnState({setItem(){throw new Error('blocked');},getItem(){throw new Error('blocked');}}).save({selected:'han'}),false);
});
