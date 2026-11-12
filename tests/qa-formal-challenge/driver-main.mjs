// Appended by local QA server only. World injection exercises real event/save pipeline.
const qaWorldIds=new WeakMap();let qaWorldSerial=0;
window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||!e.data?.formalQA)return;try{
 const action=e.data.action;if(duel&&!qaWorldIds.has(duel))qaWorldIds.set(duel,++qaWorldSerial);
 if(action==='mob-defeat'&&challengeRun&&duel.depthMode){const target=duel.enemies.find(f=>f.hp>0);if(!target)throw Error('No actual spawned mob');duel.events.push({type:'enemyDefeated',f:target,encounterId:target.id,key:`${duel.runId}:${target.id}`,characterId:duel.player.type,xp:target.spec.xp,cp:target.spec.cp});}
 if(action==='gate'&&challengeRun&&duel.depthMode){const carry=duel.exportCarry();duel.events.push({type:'routeGate',carry});}
 if(action==='loss'&&challengeRun){duel.player.hp=0;if(duel.status==='paused')duel.status='active';}
 if(action==='win'&&challengeRun&&!duel.depthMode){duel.enemy.hp=0;if(duel.status==='paused')duel.status='active';}
 if(action==='weaken'&&challengeRun){duel.player.hp=41;duel.player.rally=31;duel.player.assist={...duel.player.assist,ready:false,used:true,active:false};}
 parent.postMessage({formalQA:true,camera:{frame:scene?.cameraView,safety:scene?.combatOverlay?.cameraSafety,mode:viewportUI?.camera,subjects:[duel?.player,duel?.enemy,...(duel?.assists||[]).map(a=>a.actor)].filter(Boolean).map(f=>({type:f.type,x:f.x,y:f.y,depth:f.depth,attack:f.attack?.kind,hp:f.hp}))},state:{chapterId:'chapter-1',mode:gameMode,selected,helper:playerAssist,difficulty,attemptId:challengeRun?.attemptId,carry:challengeRun?.carry,saveBlocked:challengeSaveBlocked,busy:challengeActionBusy,phase:challengeRun?.phase,status:duel?.status,profile:profileProgress.get()},world:duel?{id:qaWorldIds.get(duel),x:duel.player.x,depth:duel.player.depth,type:duel.player.type,hp:duel.player.hp,rally:duel.player.rally,assist:duel.player.assist,status:duel.status}:null},location.origin);
}catch(error){parent.postMessage({formalQA:true,error:String(error.stack)},location.origin);}});
