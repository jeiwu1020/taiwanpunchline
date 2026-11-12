// Presentation-only cue scheduling. No wall timers or combat-state mutation.
export class VoiceCueQueue {
 constructor(resolve){this.resolve=resolve;this.pending=[];}
 schedule(f,kind){
  const clip=this.resolve(kind);if(!clip)return false;
  const at=Math.max(0,Number(clip.cue)||0);
  if(!at)return true;
  if(f.attack?.kind!==kind)return false;
  this.pending=this.pending.filter(p=>p.f!==f);
  this.pending.push({f,kind,attack:f.attack,at});return false;
 }
 ready(){const ready=[];this.pending=this.pending.filter(p=>{
  if(p.f.attack!==p.attack||p.f.attack?.kind!==p.kind)return false;
  if(p.attack.age>=p.at){ready.push({f:p.f,kind:p.kind});return false;}return true;
 });return ready;}
 clear(){this.pending=[];}
}
