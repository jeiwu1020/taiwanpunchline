import {fighterBaseStats} from './fighter-attributes.mjs?v=campaign-boot-20261112-r3';
// Fictional minibosses only borrow move animations. They are not the named
// fighter and must retain authored difficulty instead of inheriting new traits.
export function challengeOpponentStats(characterId,{kind='boss'}={}){
 if(kind==='miniboss')return {maxHp:70,moveMultiplier:1,basicMultiplier:1,damageTakenMultiplier:1,specialMultiplier:1,rallyMultiplier:1,assistMultiplier:1};
 if(kind!=='boss')throw new RangeError('Unknown challenge opponent kind');
 return fighterBaseStats(characterId);
}
