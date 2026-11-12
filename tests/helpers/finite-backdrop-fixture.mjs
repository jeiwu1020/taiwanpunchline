import {createDepthBackdropRenderer} from '../../dist/challenge-backdrop-cache.mjs';
// Cache-mechanism tests deliberately select the finite policy independent of
// their synthetic world/viewport sizes. Profile routing is tested separately.
export const finitePresentation=Object.freeze({width:844,height:390,touch:true});
export function createFiniteBackdropRenderer(...args){
 const renderer=createDepthBackdropRenderer(...args),draw=renderer.draw;
 renderer.draw=(bg,sx,sy,retained)=>draw(bg,sx,sy,retained,finitePresentation);
 return renderer;
}
