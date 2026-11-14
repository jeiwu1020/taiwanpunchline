import {installBossEncounter} from '../../chapter-encounters.mjs?v=street-object-polish-r2';
import {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=street-object-polish-r3';
import {Duel,GROUND} from './core.mjs?v=campaign-boot-20261112-r3';
import {ChallengeDepthRoute,DEPTH} from './challenge-depth-engine.mjs?v=street-object-polish-r3';
import {CHAPTER2} from './chapter2-content.mjs?v=campaign-boot-20261112-r3';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'su',mobKind:'mini_mic',name:'催場隊長',pattern:[{action:'special2',name:'驗章衝三步！跳開！',range:210,warning:.8,rest:2.1},{action:'punch',name:'章沒乾，補一下！',range:112,warning:.55,rest:1.1}]},
 'miniboss-b':{type:'su',mobKind:'mini_guard',name:'動線總管',pattern:[{action:'special2',name:'直線通行！跳開！',range:210,warning:.65,rest:1.1},{action:'special1',name:'出口用喊的！退遠！',range:185,warning:.8,rest:1.5},{action:'punch',name:'回來補章！',range:112,warning:.45,rest:1.2}]}
});

export function createChapter2Duel({stepId,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,stats}={}){
 const spec=Object.hasOwn(MINIBOSS_PATTERNS,stepId)?MINIBOSS_PATTERNS[stepId]:null;
 if(spec)return new ChapterMiniDuel(spec,{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-two duel');
 const d=new Duel(characterId,difficulty,rng,'su',{playerAssist:helperId,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='電火球';d.drainEvents=()=>d.events.splice(0);return installBossEncounter(d,2);
}
export function createChapter2Route({routeIndex,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,carry=null,stats}={}){
 if(!Number.isInteger(routeIndex)||routeIndex<0||routeIndex>2)throw new RangeError('Unknown route');
 const route=new ChallengeDepthRoute(characterId,difficulty,rng,{section:0,playerAssist:helperId,carry,stats,runId:'chapter-2'});
 route.section=CHAPTER2.routes[routeIndex];route.sectionIndex=routeIndex;route.worldWidth=route.section.width;
 route.platforms=route.section.platforms.map(p=>({...p,depthHalf:p.depthHalf??DEPTH.platform}));return route;
}

export function chapter2ActorProjection(actor,{left=0,base=430,zoom=1}={}){
 return {x:(actor.x-left)*zoom,y:base+((actor.y??GROUND)-GROUND+(actor.depth??0)*.65)*zoom};
}
