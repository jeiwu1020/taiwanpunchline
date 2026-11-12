import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterGazeGlyph,gazeGlyph} from '../dist/move-readability.mjs';
import {readFileSync} from 'node:fs';
test('live human glyph follows authoritative performance age, not wall-clock speech/caption state',()=>{
 const f={hp:100,performance:{kind:'ma_gaze',age:.3,duration:1}};
 assert.deepEqual(fighterGazeGlyph(f),gazeGlyph(.3));
 for(const change of [{performance:null},{hp:0},{performance:{kind:'ma_cough',age:.3,duration:1}},{performance:{kind:'ma_gaze',age:1,duration:1}}])assert.equal(fighterGazeGlyph({...f,...change}),null);
});
test('production glyph uses fighter lifecycle rather than stale moveBeats',()=>{
 const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
 assert.match(source,/const v=fighterGazeGlyph\(f\)/);
 assert.doesNotMatch(source,/gazeGlyph\(\(time-beat.started\)/);
});
