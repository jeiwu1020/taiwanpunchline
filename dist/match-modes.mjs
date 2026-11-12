// Series state never retains a Duel: every accepted next round starts fresh.
export const DIFFICULTY_LABELS=Object.freeze({beginner:'簡單',easy:'一般',normal:'困難'});
export const ROSTER_TARGETS=Object.freeze(['player','playerAssist','opponent','enemyAssist']);
export function rosterTargetName(target){return {player:'你',opponent:'對手',playerAssist:'我方助拳',enemyAssist:'對手助拳'}[target]||'你';}
export class MatchSeries{
 constructor(format='single'){this.format=format==='best-of-three'?'best-of-three':'single';this.target=this.format==='single'?1:2;this.score={player:0,enemy:0};this.round=1;this.last=null;}
 record(winner){if(this.last)return this.last;if(!['player','enemy','draw'].includes(winner))return null;if(winner!=='draw')this.score[winner]++;const complete=this.score.player>=this.target||this.score.enemy>=this.target;this.last=Object.freeze({complete,winner:complete?winner:null,roundWinner:winner,round:this.round,draw:winner==='draw',score:Object.freeze({...this.score})});return this.last;}
 nextRound(){if(!this.last||this.last.complete)return false;if(!this.last.draw)this.round++;this.last=null;return true;}
}
