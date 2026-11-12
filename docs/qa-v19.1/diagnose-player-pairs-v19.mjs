import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Duel,CAST,GROUND} from '/workspace/scratch/1a1351aee944/parliament-art-spike/dist/core.mjs';
import {fighterPose} from '/workspace/scratch/1a1351aee944/parliament-art-spike/dist/art-motion.mjs';
const results=[];
for(const player of Object.keys(CAST))for(const enemy of Object.keys(CAST))for(const difficulty of ['easy','normal']){
 const d=new Duel(player,difficulty,()=>.5,enemy);
 for(let n=0;n<96;n++){d.step(1/120,{},true);assert.equal(d.player.x,260);assert.equal(d.player.move,0);const pose=fighterPose(d.player,n*1000/120);assert.equal(Math.abs(pose.walking),0);assert.equal(Math.abs(pose.bodyX),0);}
 results.push({player,enemy,difficulty,playerX:d.player.x,playerMove:d.player.move,enemyX:d.enemy.x});
}
for(const player of Object.keys(CAST))for(const itemX of [400,850]){
 const d=new Duel(player,'easy',()=>.5,'han');d.aiWait=999;d.nextItemAt=999;d.items=[{id:'ai-pickup',kind:'paper',x:itemX,y:GROUND,state:'ground',age:0,spawnedAt:0,landsAt:0,expiresAt:30}];
 for(let n=0;n<1200;n++){d.step(1/120,Object.freeze({}),true);assert.equal(d.player.x,260);assert.equal(d.player.move,0);}
 assert.equal(d.enemy.item?.kind,'paper');results.push({case:'AI pickup without player input',player,itemX,playerX:d.player.x,playerMove:d.player.move,enemyX:d.enemy.x});
}
fs.writeFileSync('/workspace/shared/diagnose-player-pairs-v19.json',JSON.stringify({passed:results.length,results},null,2));
console.log('Pair opening/art and AI item pickup checks:',results.length);
console.log('Input checks:',JSON.parse(fs.readFileSync('/workspace/shared/diagnose-player-input-v19.json')).passed);
