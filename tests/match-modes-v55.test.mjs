import test from 'node:test';
import assert from 'node:assert/strict';
const modes=await import('../dist/match-modes.mjs').catch(()=>({}));
test('series controller preserves scores but draws replay the same small round',()=>{
 assert.equal(typeof modes.MatchSeries,'function');const s=new modes.MatchSeries('best-of-three');
 assert.equal(s.nextRound(),false);assert.equal(s.record('wrong'),null);s.record('player');s.record('player');assert.equal(s.score.player,1);assert.equal(s.nextRound(),true);assert.equal(s.round,2);
 s.record('draw');assert.deepEqual(s.score,{player:1,enemy:0});assert.equal(s.nextRound(),true);assert.equal(s.round,2);s.record('enemy');s.nextRound();assert.equal(s.round,3);assert.equal(s.record('player').complete,true);assert.equal(s.nextRound(),false);
});
test('one-round mode ends only on a win',()=>{assert.equal(typeof modes.MatchSeries,'function');const s=new modes.MatchSeries();assert.equal(s.record('draw').complete,false);s.nextRound();assert.equal(s.record('enemy').complete,true);assert.equal(s.last.winner,'enemy');});
test('difficulty labels and four roster targets preserve the approved mapping',()=>{assert.deepEqual(modes.DIFFICULTY_LABELS,{beginner:'簡單',easy:'一般',normal:'困難'});assert.deepEqual(modes.ROSTER_TARGETS,['player','playerAssist','opponent','enemyAssist']);assert.equal(modes.rosterTargetName('enemyAssist'),'對手助拳');});
