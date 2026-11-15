import {installBossEncounter} from '../../chapter-encounters.mjs?v=street-object-polish-r2';
import {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=rally-consistency-20261115-r1';
import {Duel,GROUND} from './core.mjs?v=rally-consistency-20261115-r1';
import {ChallengeDepthRoute,DEPTH} from './challenge-depth-engine.mjs?v=campaign-state-supply-20261115-r1';
import {CHAPTER2} from './chapter2-content.mjs?v=campaign-boot-20261112-r3';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'ko',mobKind:'mini_mic',name:'民調隊長',pattern:[{action:'special2',name:'題目落地！離開標記！',range:230,warning:.95,rest:2.3},{action:'punch',name:'答案請交到這裡！',range:112,warning:.6,rest:1.6}]},
 'miniboss-b':{type:'ko',mobKind:'mini_guard',name:'程序總管',pattern:[{action:'special2',name:'退件通知！離開標記！',range:230,warning:.75,rest:1.4},{action:'special1',name:'附件兩袋！擋完再回！',range:150,warning:.65,rest:1.5},{action:'punch',name:'還缺一個章！',range:112,warning:.45,rest:1.3}]}
});
// `type` supplies the move kit only; the already-met fictional NPC keeps its own art and name.
const BOSS_ASSIST_ROSTER=Object.freeze(Object.values(MINIBOSS_PATTERNS).map(({type,mobKind,name})=>({helper:type,mobKind,displayName:name})));

export function createChapter2Duel({stepId,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,stats}={}){
 const spec=Object.hasOwn(MINIBOSS_PATTERNS,stepId)?MINIBOSS_PATTERNS[stepId]:null;
 if(spec)return new ChapterMiniDuel(spec,{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-three duel');
 const d=new Duel(characterId,difficulty,rng,'ko',{playerAssist:helperId,enemyAssist:BOSS_ASSIST_ROSTER[0].helper,enemyAssistRoster:BOSS_ASSIST_ROSTER,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='柯P';d.drainEvents=()=>d.events.splice(0);return installBossEncounter(d,3);
}
export function createChapter2Route({routeIndex,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,carry=null,stats}={}){
 if(!Number.isInteger(routeIndex)||routeIndex<0||routeIndex>2)throw new RangeError('Unknown route');
 const route=new ChallengeDepthRoute(characterId,difficulty,rng,{section:0,playerAssist:helperId,carry,stats,runId:'chapter-3'});
 route.section=CHAPTER2.routes[routeIndex];route.sectionIndex=routeIndex;route.worldWidth=route.section.width;
 route.platforms=route.section.platforms.map(p=>({...p,depthHalf:p.depthHalf??DEPTH.platform}));return route;
}

export function chapter2ActorProjection(actor,{left=0,base=430,zoom=1}={}){
 return {x:(actor.x-left)*zoom,y:base+((actor.y??GROUND)-GROUND+(actor.depth??0)*.65)*zoom};
}
