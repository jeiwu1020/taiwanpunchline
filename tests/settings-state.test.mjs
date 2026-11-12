import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,normalizeSettings,createSettingsStore} from '../dist/settings-state.mjs';

const defaults={version:1,sfxVolume:1,voiceVolume:1,musicVolume:.22,sfxMuted:false,voiceMuted:false,musicMuted:false,masterMuted:false,rotate:true,camera:'classic'};
const settingsKey='parliament-settings-v1';

function memoryStorage(entries={}){
 const values=new Map(Object.entries(entries));
 return {
  values,reads:[],writes:[],removals:[],
  getItem(key){this.reads.push(key);return values.get(key)??null;},
  setItem(key,value){this.writes.push([key,value]);values.set(key,String(value));},
  removeItem(key){this.removals.push(key);values.delete(key);},
  clear(){assert.fail('Settings must never clear unrelated storage.');}
 };
}

test('defaults preserve existing audio levels and cannot be mutated',()=>{
 assert.deepEqual(DEFAULT_SETTINGS,defaults);
 assert.equal(Object.isFrozen(DEFAULT_SETTINGS),true);
 assert.throws(()=>{DEFAULT_SETTINGS.sfxVolume=.2;},TypeError);
 assert.deepEqual(normalizeSettings(),defaults);
 assert.equal('bgmVolume' in DEFAULT_SETTINGS,false);
});

test('normalization accepts partial settings and fills omitted fields',()=>{
 assert.deepEqual(normalizeSettings({voiceVolume:.3,rotate:false,camera:'stable'}),{
  ...defaults,voiceVolume:.3,rotate:false,camera:'stable'
 });
});

test('normalization clamps finite volumes and preserves zero',()=>{
 assert.equal(normalizeSettings({sfxVolume:-5,voiceVolume:4}).sfxVolume,0);
 assert.equal(normalizeSettings({sfxVolume:-5,voiceVolume:4}).voiceVolume,1);
 assert.deepEqual(normalizeSettings({sfxVolume:0,voiceVolume:.46}),{...defaults,sfxVolume:0,voiceVolume:.46});
});

test('normalization rejects non-finite volumes and coerced types',()=>{
 for(const value of [NaN,Infinity,-Infinity,'0.5','',true,false,null,{},[]]){
  assert.deepEqual(normalizeSettings({sfxVolume:value,voiceVolume:value}),defaults);
 }
});

test('normalization requires booleans and known camera modes',()=>{
 for(const value of [0,1,'true','false',null,{},[]]){
  assert.deepEqual(normalizeSettings({sfxMuted:value,voiceMuted:value,masterMuted:value,rotate:value}),defaults);
 }
 for(const camera of ['unknown','CLASSIC','',null,1,{},[]])assert.equal(normalizeSettings({camera}).camera,'classic');
 assert.deepEqual(normalizeSettings({sfxMuted:true,voiceMuted:true,masterMuted:true,rotate:false,camera:'stable'}),{
  ...defaults,sfxMuted:true,voiceMuted:true,masterMuted:true,rotate:false,camera:'stable'
 });
});

test('normalization treats arrays, null, primitives and unknown versions as defaults',()=>{
 for(const value of [null,[],[{voiceVolume:.2}],true,0,'{"voiceVolume":0.2}'])assert.deepEqual(normalizeSettings(value),defaults);
 for(const version of [0,2,-1,'1',null,false])assert.deepEqual(normalizeSettings({version,voiceVolume:.2}),defaults);
 assert.deepEqual(normalizeSettings({version:1,voiceVolume:.2}),{...defaults,voiceVolume:.2});
});

test('normalization whitelists own data without prototype pollution or getter execution',()=>{
 const input=JSON.parse('{"version":1,"sfxVolume":0.2,"bgmVolume":0.4,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');
 assert.deepEqual(normalizeSettings(input),{...defaults,sfxVolume:.2});
 assert.equal({}.polluted,undefined);
 const inherited=Object.create({sfxMuted:true});
 inherited.voiceVolume=.4;
 Object.defineProperty(inherited,'sfxVolume',{get(){assert.fail('Must not execute input getters.');}});
 assert.deepEqual(normalizeSettings(inherited),{...defaults,voiceVolume:.4});
});

test('normalization returns fresh snapshots without mutating its input',()=>{
 const input=Object.freeze({sfxVolume:.3});
 const one=normalizeSettings(input),two=normalizeSettings(input);
 assert.notEqual(one,two);
 one.sfxVolume=.9;
 assert.equal(two.sfxVolume,.3);
 assert.deepEqual(input,{sfxVolume:.3});
});

test('store loads partial saved settings with no constructor writes or callbacks',()=>{
 const storage=memoryStorage({[settingsKey]:'{"voiceVolume":0.25,"voiceMuted":true}'}),changes=[];
 const store=createSettingsStore({storage,onChange:state=>changes.push(state)});
 assert.deepEqual(store.get(),{...defaults,voiceVolume:.25,voiceMuted:true});
 assert.equal(store.persisted,true);
 assert.deepEqual(storage.reads,[settingsKey]);
 assert.equal(storage.writes.length,0);
 assert.equal(changes.length,0);
});

test('corrupt, non-object and future-version saved records safely fall back',()=>{
 for(const raw of ['{bad JSON','null','[]','7','"settings"','{"version":99,"sfxMuted":true}']){
  const storage=memoryStorage({[settingsKey]:raw});
  const store=createSettingsStore({storage});
  assert.deepEqual(store.get(),defaults);
  assert.equal(store.persisted,false);
  assert.equal(storage.writes.length,0);
 }
});

test('malicious saved JSON cannot add settings or pollute prototypes',()=>{
 const storage=memoryStorage({[settingsKey]:'{"__proto__":{"polluted":true},"voiceVolume":0.6,"sfxMuted":"false","extra":42}'});
 const store=createSettingsStore({storage});
 assert.deepEqual(store.get(),{...defaults,voiceVolume:.6});
 assert.equal({}.polluted,undefined);
 store.update({sfxVolume:.2});
 assert.deepEqual(JSON.parse(storage.values.get(settingsKey)),{...defaults,voiceVolume:.6,sfxVolume:.2});
});

test('missing or inaccessible storage still supports in-memory settings',()=>{
 for(const storage of [null,{}, {getItem(){throw new Error('Denied');},setItem(){throw new Error('Denied');},removeItem(){throw new Error('Denied');}}]){
  const store=createSettingsStore({storage});
  assert.deepEqual(store.get(),defaults);
  assert.equal(store.persisted,false);
  assert.deepEqual(store.update({sfxVolume:.4}),{...defaults,sfxVolume:.4});
  assert.equal(store.persisted,false);
  assert.deepEqual(store.reset(),defaults);
  assert.equal(store.persisted,false);
 }
});

test('default localStorage access catches a throwing browser property getter',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('SecurityError');}});
 try{
  const store=createSettingsStore();
  assert.deepEqual(store.update({masterMuted:true}),{...defaults,masterMuted:true});
  assert.equal(store.persisted,false);
 }finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);
  else delete globalThis.localStorage;
 }
});

test('explicit storage overrides the default browser storage',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 const storage=memoryStorage();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){assert.fail('Explicit storage must not access browser storage.');}});
 try{
  createSettingsStore({storage}).update({rotate:false});
  assert.equal(JSON.parse(storage.values.get(settingsKey)).rotate,false);
 }finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);
  else delete globalThis.localStorage;
 }
});

test('updates retain independent channel volume and mute preferences',()=>{
 const storage=memoryStorage(),store=createSettingsStore({storage});
 store.update({sfxVolume:.2,voiceVolume:.7,sfxMuted:true});
 store.update({masterMuted:true});
 store.update({voiceMuted:true});
 assert.deepEqual(store.get(),{...defaults,sfxVolume:.2,voiceVolume:.7,sfxMuted:true,voiceMuted:true,masterMuted:true});
 store.update({masterMuted:false,sfxMuted:false});
 assert.deepEqual(store.get(),{...defaults,sfxVolume:.2,voiceVolume:.7,voiceMuted:true});
 assert.deepEqual(createSettingsStore({storage}).get(),store.get());
});

test('updates ignore invalid and unknown fields without resetting existing values',()=>{
 const store=createSettingsStore({storage:null});
 store.update({sfxVolume:.25,voiceVolume:.75,sfxMuted:true,rotate:false,camera:'stable'});
 for(const patch of [null,[],3,'x',{sfxVolume:NaN,voiceVolume:Infinity,sfxMuted:'false',rotate:1,camera:'wrong',version:2,bgmVolume:0}]){
  assert.deepEqual(store.update(patch),{...defaults,sfxVolume:.25,voiceVolume:.75,sfxMuted:true,rotate:false,camera:'stable'});
 }
 assert.deepEqual(store.update({voiceVolume:-2,sfxVolume:2}),{...defaults,sfxVolume:1,voiceVolume:0,sfxMuted:true,rotate:false,camera:'stable'});
});

test('updates notify once per actual change and never for no-op patches',()=>{
 const changes=[],storage=memoryStorage(),store=createSettingsStore({storage,onChange:value=>changes.push(value)});
 store.update({sfxVolume:.5,voiceVolume:.3,rotate:false});
 store.update({sfxVolume:.5});
 store.update({sfxVolume:'bad'});
 store.update({});
 assert.deepEqual(changes,[{...defaults,sfxVolume:.5,voiceVolume:.3,rotate:false}]);
 assert.equal(storage.writes.length,1);
 assert.equal(store.persisted,true);
});

test('returned and callback snapshots cannot mutate internal state',()=>{
 let callbackValue;
 const store=createSettingsStore({storage:null,onChange:value=>{callbackValue=value;value.voiceVolume=.9;}});
 const updated=store.update({voiceVolume:.2});
 assert.deepEqual(updated,{...defaults,voiceVolume:.2});
 updated.voiceVolume=.6;
 const one=store.get(),two=store.get();
 one.sfxMuted=true;
 assert.notEqual(one,two);
 assert.notEqual(callbackValue,two);
 assert.deepEqual(two,{...defaults,voiceVolume:.2});
 const reset=store.reset();
 reset.sfxMuted=true;
 assert.deepEqual(store.get(),defaults);
});

test('failed saves retain live settings and callbacks and can recover on later edits',()=>{
 const storage=memoryStorage(),changes=[];
 let fail=true;
 const save=storage.setItem;
 storage.setItem=function(key,value){if(fail)throw new Error('QuotaExceededError');save.call(this,key,value);};
 const store=createSettingsStore({storage,onChange:value=>changes.push(value)});
 assert.deepEqual(store.update({voiceVolume:.4}),{...defaults,voiceVolume:.4});
 assert.equal(store.persisted,false);
 assert.deepEqual(changes,[{...defaults,voiceVolume:.4}]);
 fail=false;
 store.update({sfxMuted:true});
 assert.equal(store.persisted,true);
 assert.deepEqual(JSON.parse(storage.values.get(settingsKey)),{...defaults,voiceVolume:.4,sfxMuted:true});
});

test('a failed save after a successful load marks the current snapshot unsaved',()=>{
 const storage=memoryStorage({[settingsKey]:'{"voiceVolume":0.4}'});
 const store=createSettingsStore({storage});
 assert.equal(store.persisted,true);
 storage.setItem=()=>{throw new Error('QuotaExceededError');};
 store.update({voiceVolume:.8});
 assert.equal(store.persisted,false);
 assert.equal(store.get().voiceVolume,.8);
});

test('reset restores defaults and removes only its own key',()=>{
 const storage=memoryStorage({'unrelated-save':'keep',[settingsKey]:'{"sfxMuted":true,"camera":"stable"}'}),changes=[];
 const store=createSettingsStore({storage,onChange:value=>changes.push(value)});
 assert.deepEqual(store.reset(),defaults);
 assert.deepEqual(changes,[defaults]);
 assert.equal(storage.values.has(settingsKey),false);
 assert.equal(storage.values.get('unrelated-save'),'keep');
 assert.deepEqual(storage.removals,[settingsKey]);
 assert.equal(store.persisted,true);
 store.reset();
 assert.equal(changes.length,1);
});

test('reset failure still restores defaults and reports unsaved settings',()=>{
 const storage=memoryStorage({[settingsKey]:'{"sfxMuted":true}'}),changes=[];
 storage.removeItem=()=>{throw new Error('Denied');};
 const store=createSettingsStore({storage,onChange:value=>changes.push(value)});
 assert.deepEqual(store.reset(),defaults);
 assert.equal(store.persisted,false);
 assert.deepEqual(changes,[defaults]);
 assert.equal(storage.values.get(settingsKey),'{"sfxMuted":true}');
});

test('custom settings key is used for reads, writes and reset without touching the default key',()=>{
 const key='test-game-settings',storage=memoryStorage({[settingsKey]:'keep',[key]:'{"rotate":false}'});
 const store=createSettingsStore({storage,key});
 assert.equal(store.get().rotate,false);
 store.update({voiceMuted:true});
 assert.equal(JSON.parse(storage.values.get(key)).voiceMuted,true);
 store.reset();
 assert.equal(storage.values.has(key),false);
 assert.equal(storage.values.get(settingsKey),'keep');
 assert.deepEqual(storage.reads,[key]);
});
