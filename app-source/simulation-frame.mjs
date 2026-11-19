/** Match the main engine's 100ms catch-up policy, with <= 1/60s steps.
 * Callers consume edge-triggered input once per outer frame, then run steps.
 * No retained accumulator: paused/hidden time is intentionally discarded. */
export function planSimulationFrame(deltaMs,{paused=false}={}){
 const elapsed=Number.isFinite(deltaMs)&&deltaMs>0?deltaMs:0;
 const acceptedMs=paused?0:Math.min(100,elapsed),count=Math.ceil(acceptedMs/(1000/60));
 return {steps:count?Array(count).fill(acceptedMs/1000/count):[],acceptedMs,droppedMs:elapsed-acceptedMs};
}
