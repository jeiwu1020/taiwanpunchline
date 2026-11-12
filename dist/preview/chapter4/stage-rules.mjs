import {COMBAT} from './combat-rules.mjs?v=post69-street-seam-cull-20261112-r1';
// V19 shared stage rules. No actor, character, health or difficulty biases.
export const STAGE_ITEMS=Object.freeze({
 // V47 opaque artwork is about 37x36 / 38x37 world pixels in flight.
 paper:Object.freeze({label:'紙團',damage:8,height:'high',speed:460,life:1.6,knock:14,radius:18}),
 rubber_duck:Object.freeze({label:'吱吱橡皮鴨',damage:10,height:'low',speed:360,life:1.8,knock:18,radius:18}),
});
export const ITEM_THROW=Object.freeze({start:.12,duration:.40});
export const ITEM_DROP=Object.freeze({minInterval:10,maxInterval:14,maxTotal:4,maxLive:2,fallTime:1,groundLife:10,pickupRange:52,avoidFighter:120,positions:Object.freeze([160,240,320,400,480,560,640,720,800])});
// A separate stream prevents AI decision count from changing the item schedule.
export function stageRandom(sample){let seed=(Math.floor(sample*4294967296)^0x9e3779b9)>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
// Successful special inputs get enough uninterrupted presentation to make the
// move legible. This never reduces damage or grants a cooldown refund. Offensive
// moves keep their last active phase; defense and drinking keep a short opening
// pose, then retain their existing counter/consume/interruption rules.
export const PERFORMANCE_GUARD=Object.freeze(Object.fromEntries(
 Object.entries(COMBAT).filter(([,m])=>m.cooldown).map(([kind,m])=>[kind,Object.freeze({
  start:0,end:m.behavior==='heal'?.4:['counter','reject','calm','armor'].includes(m.behavior)?m.start+.12:m.hits?Math.max(...m.hits.map(h=>h.end)):m.end??m.start+.06,
 })])
));
export function performanceGuardActive(f){const a=f?.attack,window=PERFORMANCE_GUARD[a?.kind];return !!(f?.hp>0&&window&&a.age>=window.start&&a.age<=window.end);}
