// Narrative visibility is separate from playable-character unlocks.
const REVEALED_STEPS=new Set(['boss-comic','boss','handoff-comic','roster-choice','complete']);
export const bossRevealed=state=>!!state&&REVEALED_STEPS.has(state.stepId);
export const soloMicX=(width,drift)=>width*(.65+.12*Math.max(0,Math.min(1,drift)));
export function storyActors(state,selected='wang'){
 const characterId=state?.characterId??selected;
 const cast=[{characterId,role:'player'}];
 if(state?.stepId==='miniboss-a')cast.push({characterId:'wang',role:'miniboss',mobKind:'mini_schedule'});
 else if(state?.stepId==='miniboss-b')cast.push({characterId:'huang',role:'miniboss',mobKind:'mini_marshal'});
 else if(bossRevealed(state))cast.push({characterId:characterId==='ma'?'wang':'ma',role:'boss'});
 return cast;
}
