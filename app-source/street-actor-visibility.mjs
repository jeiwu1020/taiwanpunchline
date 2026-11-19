// Render-only policy shared by all street chapters. Keep a generous world-space
// envelope for arms, props, falling bodies and ground shadows. No vertical cull:
// a jumping mob outside the frame can still have a visible shadow. Simulation,
// projectiles, player/helper callbacks and clasp presentation are never skipped.
export function streetActorNeedsPaint(actor,{left,right}){
 if(!actor?.mobKind||actor.helper||actor.grabPose>0||actor.grabbedPose>0)return true;
 if(![actor.x,left,right].every(Number.isFinite)||right<left)return true;
 return actor.x>=left-420&&actor.x<=right+420;
}
