import {memoryLocks,memoryStorage} from './main-unified-fixture.mjs';
import {allUnlockedStorage} from './profile-fixtures.mjs';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

// Only browser/media boundaries are replaced. Core combat, cue scheduling and UI
// modules are imported from production so routing and lifecycle effects stay real.
// The name fitter is a browser-layout boundary, covered with real DOM/Canvas
// in special-name-fit-v73 and the native Canvas audit rather than this fake DOM.
// An explicit mountChallengeOverview override can observe the overview handoff;
// it does not establish dialog DOM behavior, which requires separate real jsdom.
export async function gameHarness({initialize=true,storage,newProfile=false,mountChallengeOverview,bootArtLoader}={}){
 const elements=new Map(),timers=new Map();let timerId=0;
 function element(dataset={}){
  const children=new Map(),classes=new Set(),attributes=new Map();
  return {dataset,tagName:'BUTTON',style:{setProperty(key,value){this[key]=value;}},replaceChildren(...nodes){this.children=nodes;},append(node){this.children??=[];this.children.push(node);},value:'easy',textContent:'',innerHTML:'',handlers:{},attributeWrites:[],playing:false,plays:[],pauses:0,currentTime:0,
   classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},
   querySelector(key){if(!children.has(key))children.set(key,element());return children.get(key);},querySelectorAll(){return[];},
   setAttribute(k,v){attributes.set(k,String(v));this.attributeWrites.push([k,String(v)]);},getAttribute:k=>attributes.get(k),removeAttribute:k=>attributes.delete(k),
   addEventListener(name,fn){this.handlers[name]=fn;},
   pause(){this.playing=false;this.pauses++;},play(){this.playing=true;this.plays.push(this.src);return this.playResult?this.playResult():Promise.resolve();},
   emit(name){if(name==='ended'||name==='error')this.playing=false;this['on'+name]?.();this.handlers[name]?.();},
   focus(){},closest(){return null;},setPointerCapture(){},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();}
  };
 }
 const window=element(),document=element();window.localStorage=newProfile?(storage??memoryStorage()):allUnlockedStorage(storage);window.navigator={locks:memoryLocks()};window.location={href:'https://game-harness.test/',origin:'https://game-harness.test',assign(url){this.assigned=url;}};document.documentElement=element();document.body=element();
 const $=key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key);};
 const specials=[1,2,3].map(i=>$(`[data-action="special${i}"]`));specials.forEach((b,i)=>b.dataset.action='special'+(i+1));
 document.createElement=()=>element();document.querySelector=$;document.querySelectorAll=s=>s==='[data-hold],[data-action]'?specials:[];document.hasFocus=()=>true;
 const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){}});
 window.AudioContext=class{constructor(){this.currentTime=0;this.destination={};}resume(){}createOscillator(){return{frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}createGain(){return{gain:param(),connect(){},disconnect(){}};}};
 const context={document,window,console,URL,queueMicrotask,setTimeout:fn=>{const id=++timerId;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),Phaser:{Scene:class{},Game:class{},Loader:{File:class{constructor(loader,config){this.loader=loader;Object.assign(this,config);}}},Scale:{RESIZE:0,NO_CENTER:0}}};
 const url=new URL('../../dist/game.mjs',import.meta.url);let source=await readFile(url,'utf8');
 for(const match of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];$/gm)){
  const exports=await import(new URL(match[2],url));for(const name of match[1].split(',').map(s=>s.trim()))context[name]=name==='createBootArtLoader'&&bootArtLoader?bootArtLoader:name==='mountSpecialNameFit'?()=>({refresh(){},destroy(){}}):name==='mountChallengeUI'&&mountChallengeOverview?mountChallengeOverview:exports[name];
 }
 source=source.replace(/^import .*;$/gm,'');
 await vm.runInNewContext('(async()=>{'+source+'\nglobalThis.ui={startChallenge,startChallengePhase,restartPreparedEncounter,handleChallengeEvent,handleChallengeFrameEvents,returnToChallengeOverview,get challenge(){return challengeRun;},get challengeProgress(){return challengeProgress;},get settleChallenge(){return async()=>{await challengeOperations;await challengeRun?.flush();await new Promise(resolve=>queueMicrotask(resolve));};},get profiles(){return profileProgress;},refreshProfileAccess,get titleUI(){return typeof titleUI==="undefined"?undefined:titleUI;},get entered(){return typeof hasEntered==="undefined"?false:hasEntered;},get enterFromTitle(){return typeof enterFromTitle==="undefined"?undefined:enterFromTitle;},get showTitle(){return typeof showTitle==="undefined"?undefined:showTitle;},get matchFinish(){return matchFinish;},get hold(){return hold;},beginMatchFinish,updateMatchFinish,cancelMatchFinish,testSoundEffects,stopEffects,initializeRoster,showMenu,startGame,pauseGame,result,Arena,playConfiguredVoice,drainVoiceCues,stopVoice,primeVoice,get duel(){return duel;},get series(){return matchSeries;},get gameMode(){return gameMode;},get settings(){return typeof settingsStore==="undefined"?undefined:settingsStore;},setScene(value={}){scene=value;},setViewport(value){viewportUI=value;},activate(){sound=true;voiceEnabled=true;duel.status="active";}};})();',context);
 if(initialize)context.ui.initializeRoster();
 return {...context,$,specials,elements,timers};
}
export const flush=async()=>{await Promise.resolve();await Promise.resolve();};
export const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
export function move(h,actor,kind){h.ui.Arena.prototype.event.call({spitStart:new WeakMap(),popup(){},wordBlast(){},banner(){}},{type:'move',f:actor,kind});}
