import test from 'node:test';
import assert from 'node:assert/strict';
import * as attributes from '../dist/fighter-attributes.mjs';
const rows={wang:[95,1.06,.96,1],han:[105,.94,.96,1],ma:[95,1.04,1.02,1],su:[110,.96,1.04,1.04],huang:[95,1,.98,.96],chen:[95,1.04,.98,.98],ko:[105,.96,1.06,1.04]};
const full={hp:5,move:5,basic:5,defense:5,special:5,rally:5,assist:5};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(const [id,[maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier]] of Object.entries(rows)){
 test(`${id}: immutable base feeds all seven actual attributes`,()=>{
  const b=attributes.fighterBaseStats(id);assert.deepEqual(b,{maxHp,moveMultiplier,basicMultiplier,damageTakenMultiplier,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1});
  assert.equal(Object.isFrozen(attributes.FIGHTER_BASE_ATTRIBUTES),true);assert.equal(Object.isFrozen(attributes.FIGHTER_BASE_ATTRIBUTES[id]),true);
  assert.throws(()=>{attributes.FIGHTER_BASE_ATTRIBUTES[id].maxHp=1;},TypeError);
 });
 test(`${id}: challenge applies full ranks once and exposes base, factors and differences`,()=>{
  const s=attributes.deriveFighterStats(id,{skills:full,challenge:true});
  for(const [key,want] of Object.entries({maxHp:maxHp*1.15,moveMultiplier:moveMultiplier*1.05,basicMultiplier:basicMultiplier*1.1,damageTakenMultiplier:damageTakenMultiplier*.925,specialMultiplier:1.1,rallyMultiplier:1.1,assistMultiplier:1.1})){
   close(s[key],want);close(s.base[key]+s.bonus[key],want);
  }
  assert.equal(s.spent,35);assert.deepEqual(s.skills,full);assert.equal(s.challenge,true);
 });
 test(`${id}: default and nonchallenge ignore supplied ranks while zero challenge agrees`,()=>{
  const plain=attributes.deriveFighterStats(id),ignored=attributes.deriveFighterStats(id,{skills:full}),zero=attributes.deriveFighterStats(id,{challenge:true});
  for(const key of Object.keys(attributes.fighterBaseStats(id))){assert.equal(plain[key],ignored[key]);assert.equal(plain[key],zero[key]);}
  assert.equal(ignored.spent,0);assert.ok(Object.values(ignored.skills).every(x=>x===0));
 });
}
test('unknown fighters and malformed challenge ranks never produce invalid combat stats',()=>{
 for(const id of ['unknown','toString','__proto__',null])assert.throws(()=>attributes.fighterBaseStats(id),RangeError);
 for(const hp of [-1,6,1.2,Infinity,NaN,'3',null])assert.throws(()=>attributes.deriveFighterStats('wang',{challenge:true,skills:{hp}}),RangeError);
});
