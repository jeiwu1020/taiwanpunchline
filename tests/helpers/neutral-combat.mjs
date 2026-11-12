// Explicit legacy-neutral fixtures for numerical move/timing regressions.
// These run the production simulations with effective stat overrides, never a
// mock engine. Character defaults and mode integration are tested separately in
// fighter-*-attributes.test.mjs and the real-stat all-pairs smoke tests.
import {Duel as ProductionDuel} from '../../dist/core.mjs';
import {ChallengeRoute as ProductionRoute} from '../../dist/challenge-engine.mjs';
import {ChallengeDepthRoute as ProductionDepthRoute} from '../../dist/challenge-depth-engine.mjs';
export {CAST,GROUND,performanceGuardActive} from '../../dist/core.mjs';
export {CHALLENGE_SECTIONS} from '../../dist/challenge-engine.mjs';
export const NEUTRAL_STATS=Object.freeze({maxHp:100,moveMultiplier:1,basicMultiplier:1,damageTakenMultiplier:1,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1});
export class Duel extends ProductionDuel {
 constructor(character='wang',difficulty='easy',rng=Math.random,opponent=character==='wang'?'han':'wang',options={}){
  const stats=side=>({...NEUTRAL_STATS,maxHp:options[side+'MaxHp']??100,...options[side+'Stats']});
  super(character,difficulty,rng,opponent,{...options,playerStats:stats('player'),enemyStats:stats('enemy')});
 }
}
export class ChallengeRoute extends ProductionRoute {
 constructor(character='wang',difficulty='easy',rng=Math.random,options={}){super(character,difficulty,rng,{...options,stats:{...NEUTRAL_STATS,...options.stats}});}
}
export class ChallengeDepthRoute extends ProductionDepthRoute {
 constructor(character='wang',difficulty='easy',rng=Math.random,options={}){super(character,difficulty,rng,{...options,stats:{...NEUTRAL_STATS,...options.stats}});}
}
