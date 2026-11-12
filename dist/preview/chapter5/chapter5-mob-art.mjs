import {drawChapter4Miniboss as drawClerkRig} from '../chapter4/chapter4-mob-art.mjs?v=campaign-visuals-20261112-r2';
// New chapter-five heads/vests/held objects, with the accepted shared limb rig.
export const CHAPTER5_MINI_CROPS=Object.freeze([
 {head:[32,17,456,456],body:[532,62,471,425],prop:[1073,30,390,464]},
 {head:[32,527,440,456],body:[575,550,384,440],prop:[1062,570,424,400]}
]);
export const drawChapter5Miniboss=(ctx,images,mob,time,options={})=>drawClerkRig(ctx,images,mob,time,{...options,atlasKey:'chapter5-miniboss-atlas',crops:CHAPTER5_MINI_CROPS,headOffsets:[16,0],idleWrists:[{x:48,y:-88},{x:42,y:-82}],heldProps:[{width:55,height:66,fit:true,anchor:[.15,.9,-.12]},{width:68,height:64,fit:true,anchor:[.08,.88,-.1]}]});
