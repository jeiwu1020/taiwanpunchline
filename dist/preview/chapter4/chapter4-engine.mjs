import {installBossEncounter} from '../../chapter-encounters.mjs?v=chapter-upgrade-r1';
import {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=chapter-upgrade-r1';
import {Duel,GROUND} from './core.mjs?v=campaign-boot-20261112-r3';
import {ChallengeDepthRoute,DEPTH} from './challenge-depth-engine.mjs?v=campaign-boot-20261112-r3';
import {CHAPTER4} from './chapter4-content.mjs?v=campaign-boot-20261112-r3';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'wang',mobKind:'mini_schedule',name:'班表主任',pattern:[{action:'punch',name:'班表更新中！',range:112,warning:.55,rest:.65},{action:'punch',name:'還是即將抵達！',range:112,warning:.85,rest:1.25}]},
 'miniboss-b':{type:'huang',mobKind:'mini_marshal',name:'里程總監',pattern:[{action:'special3',name:'完賽證明呢！',range:220,warning:1.0,rest:1.6},{action:'special2',name:'缺一份口渴證明！',range:145,warning:.9,rest:1.8},{action:'special1',name:'最後一公里！',range:190,warning:1.0,rest:1.9}]}
});

export function createChapter4Duel({stepId,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,stats}={}){
 const spec=Object.hasOwn(MINIBOSS_PATTERNS,stepId)?MINIBOSS_PATTERNS[stepId]:null;
 if(spec)return new ChapterMiniDuel(spec,{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-four duel');
 const d=new Duel(characterId,difficulty,rng,'ma',{playerAssist:helperId,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='小馬哥';d.drainEvents=()=>d.events.splice(0);return installBossEncounter(d,4);
}
export function createChapter4Route({routeIndex,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,carry=null,stats}={}){
 if(!Number.isInteger(routeIndex)||routeIndex<0||routeIndex>2)throw new RangeError('Unknown route');
 const route=new ChallengeDepthRoute(characterId,difficulty,rng,{section:0,playerAssist:helperId,carry,stats,runId:'chapter-4'});
 route.section=CHAPTER4.routes[routeIndex];route.sectionIndex=routeIndex;route.worldWidth=route.section.width;
 route.platforms=route.section.platforms.map(p=>({...p,depthHalf:p.depthHalf??DEPTH.platform}));return route;
}

export function chapter4ActorProjection(actor,{left=0,base=430,zoom=1}={}){
 return {x:(actor.x-left)*zoom,y:base+((actor.y??GROUND)-GROUND+(actor.depth??0)*.65)*zoom};
}

export {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=chapter-upgrade-r1';
