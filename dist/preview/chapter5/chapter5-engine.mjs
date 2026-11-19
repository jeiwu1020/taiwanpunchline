import {installBossEncounter} from '../../chapter-encounters.mjs?v=chapter-presentation-20261117-r1';
import {Duel} from '../../core.mjs?v=chapter-presentation-20261117-r1';
import {ChallengeDepthRoute,DEPTH} from '../../challenge-depth-engine.mjs?v=chapter-presentation-20261117-r1';
import {ChapterMiniDuel} from '../campaign/chapter-mini-duel.mjs?v=chapter-presentation-20261117-r1';
import {CHAPTER5} from './chapter5-content.mjs?v=chapter-presentation-20261117-r1';
export const MINIBOSS_PATTERNS=Object.freeze({
 'miniboss-a':{type:'wang',mobKind:'mini_schedule',name:'清點隊長',moves:['mini_baton_upper','mini_megaphone_blast','mini_whistle_charge'],pattern:[{action:'punch',name:'清點第一下！',range:112,warning:.6,rest:.55},{action:'punch',name:'清點第二下！',range:112,warning:.7,rest:1.3}]},
 'miniboss-b':{type:'huang',mobKind:'mini_marshal',name:'試音總管',moves:['mini_megaphone_blast','mini_whistle_double','mini_barrier_drop'],pattern:[{action:'special3',name:'請站在線後！',range:210,warning:1,rest:1.5},{action:'special1',name:'測試，一、二！',range:185,warning:1.1,rest:1.8}]}
});
// `type` supplies the move kit only; the already-met fictional NPC keeps its own art and name.
const BOSS_ASSIST_ROSTER=Object.freeze(Object.values(MINIBOSS_PATTERNS).map(({type,mobKind,name,moves})=>({helper:type,mobKind,displayName:name,moves:moves.slice(0,2)})));
export function createChapter5Duel({stepId,characterId='wang',helperId='han',difficulty='easy',rng=Math.random,stats}={}){
 if(Object.hasOwn(MINIBOSS_PATTERNS,stepId))return new ChapterMiniDuel(MINIBOSS_PATTERNS[stepId],{characterId,helperId,difficulty,rng,stats});
 if(stepId!=='boss')throw new RangeError('Unknown chapter-five duel');
 const d=new Duel(characterId,difficulty,rng,'chen',{playerAssist:helperId,enemyAssist:BOSS_ASSIST_ROSTER[0].helper,enemyAssistRoster:BOSS_ASSIST_ROSTER,playerStats:stats});d.nextItemAt=Infinity;d.enemy.displayName='阿扁仔';d.drainEvents=()=>d.events.splice(0);return installBossEncounter(d,5);
}
export function createChapter5Route({routeIndex,characterId='wang',helperId='han',difficulty='easy',rng=Math.random,carry=null,stats}={}){
 if(!Number.isInteger(routeIndex)||routeIndex<0||routeIndex>2)throw new RangeError('Unknown route');
 const r=new ChallengeDepthRoute(characterId,difficulty,rng,{section:0,playerAssist:helperId,carry,stats,runId:'chapter-5'});
 r.section=CHAPTER5.routes[routeIndex];r.sectionIndex=routeIndex;r.worldWidth=r.section.width;r.platforms=r.section.platforms.map(p=>({...p,depthHalf:p.depthHalf??DEPTH.platform}));return r;
}
