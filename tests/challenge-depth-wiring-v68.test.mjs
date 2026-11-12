import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
test('main challenge route creates reusable depth engine, while boss factory remains Duel',()=>{assert.match(game,/duel=new ChallengeDepthRoute\(selected,difficulty/);assert.match(game,/function newDuel\(\).*?const next=new Duel\(/s);});
test('original controls choose mode-aware vertical intent and isolate depth draw passes',()=>{assert.match(game,/directionMode:\(\)=>duel\.depthMode\?'depth':'duel'/);assert.match(game,/challengeKeyAction\(e\.code,keys,!!duel\.depthMode\)/);assert.match(game,/hidden:!!matchFinish\|\|!!duel\.depthMode/);});
