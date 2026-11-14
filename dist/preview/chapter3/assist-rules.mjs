import {CAST} from './roster.mjs?v=campaign-boot-20261112-r3';
// A helper is one transient cast, never another controllable fighter.
// Explicitly exclude defensive hazards and stances, even when they list damage.
export const ASSIST_WARNING=.9;
export const ASSIST_EXIT=.28;
export const ASSIST_MOVES=Object.freeze({
 wang:Object.freeze(['rush']),han:Object.freeze(['coin','han_knee','arrow']),
 ma:Object.freeze(['ma_handshake','ma_gaze','ma_cough']),su:Object.freeze(['su_shout','su_rush']),
 huang:Object.freeze(['huang_shout']),chen:Object.freeze(['chen_dream','chen_question']),ko:Object.freeze(['ko_bags','ko_name']),
});
export function chooseAssistMove(helper,rng=Math.random){
 const kinds=ASSIST_MOVES[helper];if(!kinds)throw new RangeError('Unknown assist ID');
 const roll=Math.min(.999999999,Math.max(0,rng()));return CAST[helper].moves.find(m=>m.kind===kinds[Math.floor(roll*kinds.length)]);
}

// One stored call; only damage after spending it contributes to the next call.
export const ASSIST_RECHARGE_RATIO=.35;
export function assistMeterView(f){
 const a=f?.assist,active=!!a?.active;
 return {charge:a?.charge??0,ready:!!a?.helper&&!a.used&&!active,active,damageTaken:a?.damageTaken??0,damageRequired:(f?.maxHp??100)*ASSIST_RECHARGE_RATIO};
}
