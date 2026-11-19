import {installBossEncounter} from '../../chapter-encounters.mjs?v=chapter-presentation-20261117-r1';
import {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=chapter-presentation-20261117-r1';
import {Duel,GROUND} from './core.mjs?v=chapter-presentation-20261117-r1';
import {ChallengeDepthRoute,DEPTH} from './challenge-depth-engine.mjs?v=chapter-presentation-20261117-r1';
import {CHAPTER4} from './chapter4-content.mjs?v=chapter-presentation-20261117-r1';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'ma',mobKind:'mini_schedule',name:'班表主任',moves:['mini_pass_grab','mini_baton_upper','mini_whistle_double'],pattern:[{action:'special1',name:'查驗通行證！跳開！',range:135,warning:.7,rest:1.9},{action:'punch',name:'班表再蓋一下！',range:112,warning:.55,rest:1.4}]},
 'miniboss-b':{type:'ma',mobKind:'mini_marshal',name:'里程總監',moves:['mini_pass_grab','mini_baton_upper','mini_whistle_double'],pattern:[{action:'special1',name:'伸手查證！跳開！',range:135,warning:.6,rest:1.3},{action:'special2',name:'上托點名！別再跳！',range:145,warning:.8,rest:1.5},{action:'special3',name:'補給前連吹高哨！蹲低！',range:160,warning:.65,rest:1.6}]}
});
// `type` supplies the move kit only; the already-met fictional NPC keeps its own art and name.
const BOSS_ASSIST_ROSTER=Object.freeze(Object.values(MINIBOSS_PATTERNS).map(({type,mobKind,name,moves})=>({helper:type,mobKind,displayName:name,moves:moves.slice(0,2)})));

export function createChapter4Duel({stepId,characterId='wang',helperId='han',difficulty='beginner',rng=Math.random,stats}={}){
 const spec=Object.hasOwn(MINIBOSS_PATTERNS,stepId)?MINIBOSS_PATTERNS[stepId]:null;
 if(spec)return new ChapterMiniDuel(spec,{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-four duel');
 const d=new Duel(characterId,difficulty,rng,'ma',{playerAssist:helperId,enemyAssist:BOSS_ASSIST_ROSTER[0].helper,enemyAssistRoster:BOSS_ASSIST_ROSTER,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='小馬哥';d.drainEvents=()=>d.events.splice(0);return installBossEncounter(d,4);
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

export {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=chapter-presentation-20261117-r1';
