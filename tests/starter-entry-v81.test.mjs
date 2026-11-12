import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileProgress,PROFILE_KEY,newProfileDocument} from '../dist/profile-progress.mjs';
import {createChallengeProgress} from '../dist/challenge-progress.mjs';
import {ChallengeSession} from '../dist/challenge-flow.mjs';
let api={};try{api=await import('../dist/starter-opening.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
function fixture(record){const saved=new Map(record?[[PROFILE_KEY,JSON.stringify(record)]]:[]),storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};const profiles=createProfileProgress({storage});return{saved,profiles,progress:createChallengeProgress({profiles})};}
test('only unstarted slots trigger the new comic, without extending the existing save document',()=>{
 assert.equal(typeof api.starterOpeningMode,'function');const f=fixture(),before=[...f.saved];
 for(const characterId of ['wang','han'])assert.equal(api.starterOpeningMode({profiles:f.profiles,characterId}),'new-run');
 assert.deepEqual([...f.saved],before);assert.deepEqual(f.profiles.getCurrentProfile().challenge,{});
 assert.equal(api.starterOpeningMode({profiles:f.profiles,characterId:'wang',replay:true}),'continue');
 assert.equal(api.starterOpeningMode({profiles:f.profiles,characterId:'ma'}),'legacy');
});
test('legacy checkpoint zero and completed slots never automatically replay wake-up',()=>{
 assert.equal(typeof api.starterOpeningMode,'function');const f=fixture();new ChallengeSession({progress:f.progress});
 const reloaded=fixture(f.profiles.get().document);
 for(const characterId of ['wang','han'])assert.equal(api.starterOpeningMode({profiles:reloaded.profiles,characterId}),'continue');
 assert.equal(reloaded.progress.get().checkpoint,0);reloaded.profiles.selectProfile('slot-2');
 assert.equal(api.starterOpeningMode({profiles:reloaded.profiles,characterId:'han'}),'new-run');
});
test('review is explicit, pure, and compatible with legacy empty slots and unsupported records',()=>{
 assert.equal(typeof api.starterOpeningMode,'function');const f=fixture(),before=[...f.saved];
 assert.equal(api.starterOpeningMode({profiles:f.profiles,characterId:'han',review:true}),'review');
 assert.deepEqual([...f.saved],before);
 const bad=newProfileDocument();bad.version=99;const b=fixture(bad);
 assert.equal(api.starterOpeningMode({profiles:b.profiles,characterId:'wang'}),'continue');
});
