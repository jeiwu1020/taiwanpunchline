// Disposable trial: shared movement/combat, its own short route and no saves.
import {ChallengeDepthRoute} from './challenge-depth-engine.mjs?v=campaign-complete-20261112-r1';
export {DEPTH,depthDrawOrder as trialDrawOrder} from './challenge-depth-engine.mjs?v=campaign-complete-20261112-r1';
export class StreetTrial extends ChallengeDepthRoute {
 constructor(character='wang',rng=Math.random){
  super(character,'beginner',rng,{playerAssist:character==='wang'?'han':'wang'});
  this.mode='street-trial';this.section={id:'trial',name:'巷口借過・走位試玩',width:2300,platforms:[],gate:{kind:'trial',name:'試玩終點'},spawns:[['placard',550],['leaflet',1050],['barricade',1500],['placard',1820]],supplyX:1250};
  this.worldWidth=this.section.width;this.platforms=[];
 }
}
