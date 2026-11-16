import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../dist/${path}`,import.meta.url),'utf8');

test('returning from chapter one opens the challenge overlay on the game menu without navigating away',()=>{
 const game=read('game.mjs'),body=game.match(/async function returnToChallengeOverview\(\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(body,'challenge overview return handler exists');
 assert.match(body,/showMenu\(\)/);
 assert.match(body,/openChallenge\(\)/);
 assert.doesNotMatch(body,/location\.(?:assign|replace)\(/);
});

test('the root challengeOverview route restores the menu and opens the challenge overlay',()=>{
 const html=read('index.html'),game=read('game.mjs');
 assert.doesNotMatch(html,/data-challenge-overview-route[^>]*location\.replace\("\/challenge-overview\/"\)/);
 assert.match(game,/challengeOverview[^;]{0,220}showMenu\(\)/);
 assert.match(game,/restoreChallengeOverviewSelection\(\);openChallenge\(\)/);
});

test('later chapter overview return navigates straight to the root overlay route',()=>{
 const bridge=read('preview/campaign/page-bridge.mjs');
 assert.match(bridge,/overview\s*\?\s*['"]\.\.\/\.\.\/\?challengeOverview=1['"]/);
 assert.doesNotMatch(bridge,/overview\s*\?\s*['"]\.\.\/\.\.\/challenge-overview\//);
});

test('the root victory result exposes exactly the unified skill and overview actions',()=>{
 const html=read('index.html'),game=read('game.mjs');
 assert.match(html,/id="challenge-result-overview"[^>]*>回挑戰總覽/);
 assert.match(game,/challenge-result-overview/);
 assert.match(game,/challengeBossVictory=!!challengeRun/);
 assert.match(game,/challengeBossVictory\?'強化技能'/);
});

for(const chapter of [2,3,4,5])test(`chapter ${chapter} boss victory uses the same three result actions`,()=>{
 const root=`preview/chapter${chapter}/`,html=read(`${root}index.html`),playable=read(`${root}chapter${chapter===3?'2':chapter}-playable.mjs`),bridge=read('preview/campaign/page-bridge.mjs');
 assert.match(html,/id="result-skill"[^>]*>強化技能/);
 assert.match(html,/id="result-home"[^>]*>回挑戰總覽/);
 assert.match(playable,/result-skill/);
 assert.match(playable,/continuation\?\.openPreparation\(\)/);
 assert.match(playable,/result-home/);
 assert.match(playable,/continuation\?\.returnOverview\(\{confirmed:true\}\)/);
 assert.match(bridge,/preparationActions\.hidden=.*s\.mode==='result'/);
});
