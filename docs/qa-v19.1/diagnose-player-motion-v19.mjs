import assert from 'node:assert/strict';
import {Duel,CAST,GROUND} from '/workspace/scratch/1a1351aee944/parliament-art-spike/dist/core.mjs';
import {cameraFrame,backgroundFrame} from '/workspace/scratch/1a1351aee944/parliament-art-spike/dist/arena-presentation.mjs';
const types=Object.keys(CAST),DT=1/120;
const project=(d,w=960,h=540)=>{const c=cameraFrame(w,h,[d.player,d.enemy]),b=backgroundFrame(w,h,c);return {world:d.player.x,enemy:d.enemy.x,screen:w/2+(d.player.x-c.x)*c.zoom,cam:c.x,zoom:c.zoom,backgroundX:b.x};};
function logX(d){let x=d.player.x;const changes=[];Object.defineProperty(d.player,'x',{get:()=>x,set:n=>{if(n!==x)changes.push({time:+d.elapsed.toFixed(4),from:x,to:n,move:d.player.move,attack:d.player.attack?.kind,enemyAttack:d.enemy.attack?.kind,stack:new Error().stack.split('\n').slice(2,5).join(' | ')});x=n;},enumerable:true,configurable:true});return changes;}
function run(d,seconds,ai=true,input={}){for(let i=0;i<Math.ceil(seconds/DT)&&d.status==='active';i++)d.step(DT,input,ai,{});}
const results=[];
for(const type of types)for(const ai of [false,true]){
 const d=new Duel(type,'easy',()=>.5,'han');const changes=logX(d);const start=project(d);run(d,.8,ai);assert.equal(d.player.x,260);assert.equal(d.player.move,0);results.push({case:'opening',type,ai,start,end:project(d),worldChanges:changes.length});
}
for(const type of types)for(const ai of [false,true]){
 const d=new Duel(type,'easy',()=>.5,'han');d.aiWait=999;const changes=logX(d);d.nextItemAt=0;run(d,.05,ai);const spawn=d.items.map(i=>({x:i.x,state:i.state}));
 // Controlled pickup: a ground item inside player range. AI starts >320 away.
 d.items.push({id:'test-near-player',kind:'paper',x:280,y:GROUND,state:'ground',age:0,spawnedAt:0,landsAt:0,expiresAt:30});run(d,.6,ai);assert.equal(d.player.x,260);assert.equal(d.player.item?.kind,'paper');assert.equal(d.player.move,0);
 results.push({case:'spawn_and_pickup',type,ai,spawn,world:d.player.x,move:d.player.move,held:d.player.item,worldChanges:changes.length});
}
for(const type of types)for(const ai of [false,true]){
 const d=new Duel(type,'easy',()=>.5,'han');d.aiWait=999;const changes=logX(d);assert.equal(d.press('punch'),true);run(d,.7,ai);assert.equal(d.player.x,260);assert.equal(d.player.attack,null);assert.equal(d.player.move,0);results.push({case:'ordinary_attack_and_end',type,ai,world:d.player.x,worldChanges:changes.length,attack:d.player.attack});
}
for(const type of types){const d=new Duel(type,'easy',()=>.5,'han');const changes=logX(d);run(d,60,false);assert.equal(d.player.x,260);assert.equal(d.player.move,0);results.push({case:'full_round_no_ai',type,status:d.status,world:d.player.x,worldChanges:changes.length,itemSpawns:d.events.filter(e=>e.type==='itemSpawn').length});}
for(const type of types){const d=new Duel(type,'easy',()=>.5,'han');const changes=logX(d);run(d,60,true);assert.equal(d.player.move,0);const unexpected=changes.filter(c=>!c.stack.includes('moveFighter'));assert.equal(unexpected.length,0);results.push({case:'full_round_with_ai',type,status:d.status,world:d.player.x,worldChanges:changes.length,firstWorldChanges:changes.slice(0,3),itemSpawns:d.events.filter(e=>e.type==='itemSpawn').length});}
// Verify item-seeking AI cannot write into frozen caller input.
for(const type of types){const d=new Duel(type,'easy',()=>.5,'han');d.aiWait=999;d.items=[{id:'test-ai-target',kind:'paper',x:850,y:GROUND,state:'ground',age:0,spawnedAt:0,landsAt:0,expiresAt:30}];const input=Object.freeze({left:false,right:false});run(d,.8,true,input);assert.equal(d.player.x,260);assert.equal(d.player.move,0);results.push({case:'ai_seeks_item',type,world:d.player.x,move:d.player.move,enemy:d.enemy.x,aiInput:d.aiInput,input});}
for(const [w,h]of[[960,540],[370,570],[1180,550]]){const d=new Duel('wang','easy',()=>.5,'han');const start=project(d,w,h);run(d,.8,true);const end=project(d,w,h);results.push({case:'visual_projection',w,h,start,end,screenAdvance:end.screen-start.screen,worldAdvance:end.world-start.world});}
console.log(JSON.stringify({cases:results.length,results},null,2));
