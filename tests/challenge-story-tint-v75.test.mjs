import test from 'node:test';
import assert from 'node:assert/strict';
import {paintChallengeStory} from '../dist/challenge-story-art.mjs';
test('boss face-off has no rectangular half-scene color overlay',()=>{
 const fills=[],lines=[];const ctx={clearRect(){},save(){},restore(){},beginPath(){},closePath(){},fill(){},ellipse(){},rect(){},clip(){},stroke(){},translate(){},scale(){},rotate(){},strokeRect(){},fillText(){},drawImage(){},measureText(){return {width:80};},moveTo(...a){lines.push(a);},lineTo(...a){lines.push(a);},fillRect(...a){fills.push([this.fillStyle,...a]);}};
 paintChallengeStory({width:720,height:620,getContext(){return ctx;}},{},{phase:4},'wang',0);
 assert.ok(!fills.some(([color])=>color==='#fff3d940'));
 assert.ok(lines.some(([x,y])=>x===720*.54&&y===0));
 assert.ok(lines.some(([x,y])=>x===720*.46&&y===620));
});
