let qaCamera=null;const qaOriginalCameraFrame=mobileCamera.frame.bind(mobileCamera);mobileCamera.frame=(preferred,world,options)=>{const result=qaOriginalCameraFrame(preferred,world,options);qaCamera={preferred,result,options,subjects:[world.player,...(world.enemies||[world.enemy]).filter(Boolean),...(world.assists||[]).map(a=>a.actor)].map(f=>({type:f.type,x:f.x,y:f.y,depth:f.depth,attack:f.attack?.kind,hp:f.hp}))};return result;};
// Appended by local QA server only. Controlled world outcomes are NOT player-input coverage.
window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||!e.data?.formalQA)return;try{
 const action=e.data.action;if(!chapter)return;let s=chapter.view();
 if(action==='gate'&&s.mode==='route'){if(s.paused)chapter.setPaused(false,s.token);chapter.world.status='gate';chapter.step(0,{});}
 if(['win','loss'].includes(action)&&['route','battle'].includes(s.mode)){if(s.paused)chapter.setPaused(false,s.token);if(s.mode==='route'){chapter.world.status='lost';chapter.world.player.hp=0;}else{chapter.world.status='over';chapter.world.winner=action==='win'?'player':'enemy';}chapter.step(0,{});}
 if(action==='weaken'&&chapter.world){chapter.world.player.hp=41;chapter.world.player.rally=31;chapter.world.player.assist={...chapter.world.player.assist,ready:false,used:true,active:false};}
 if(action==='snapshot'){parent.postMessage({formalQA:true,camera:qaCamera,state:chapter.view(),world:chapter.world?{hp:chapter.world.player.hp,rally:chapter.world.player.rally,assist:chapter.world.player.assist,status:chapter.world.status}:null},location.origin);return;}
 await chapter.flush?.();sync();parent.postMessage({formalQA:true,camera:qaCamera,state:chapter.view(),world:chapter.world?{hp:chapter.world.player.hp,rally:chapter.world.player.rally,assist:chapter.world.player.assist,status:chapter.world.status}:null},location.origin);
}catch(error){parent.postMessage({formalQA:true,error:String(error.stack)},location.origin);}});
