/** Built-in image-generated scenes. Bounds are measured from the saved rasters,
 * never inferred from the requested grid: Wang has measured unequal rows.
 * Insets remove only the generated one-pixel divider, not character anatomy.
 */
const squarePanels=()=>Array.from({length:6},(_,i)=>[i%2*627+2,Math.floor(i/2)*418+2,623,414]);
const sheets={};
for(const character of ['wang','han','ma','su','huang','chen','ko'])sheets[character]={
 character,key:`opening-${character}`,file:`challenge/opening-v74/${character}-sheet.webp`,
 width:character==='wang'?724:1254,height:character==='wang'?2172:1254,
 panels:character==='wang'?[[2,2,358,838],[364,2,358,838],[2,843,358,784],[364,843,358,784],[2,1631,358,539],[364,1631,358,539]]:squarePanels()
};
export const OPENING_SHEETS=Object.freeze(sheets);
export const OPENING_ART_FILES=Object.freeze({'opening-pajamas-v75':'challenge/opening-pajamas-v75.png','opening-props-v75':'challenge/opening-props-v75.png','opening-bedroom-v75':'challenge/opening-bedroom-v75.png'});
export const openingSheet=character=>OPENING_SHEETS[character]||null;

// Tight measured bounds with 3px padding preserve soft alpha edges and exclude neighbors.
export const OPENING_PAJAMA_PARTS=Object.freeze({
 torso:[88,67,165,212],leftUpper:[405,84,137,179],rightUpper:[713,85,138,181],leftFore:[1031,81,112,187],
 rightFore:[104,377,124,205],leftHand:[412,381,145,201],rightHand:[699,382,140,200],leftReach:[980,397,219,143],
 leftThigh:[88,683,157,197],rightThigh:[408,683,148,196],leftShin:[723,686,117,188],rightShin:[1031,688,113,187],
 leftSlipper:[69,1029,186,111],rightSlipper:[379,1029,190,107],cloth:[677,1021,196,129],rightReach:[987,1015,204,123]
});
export const OPENING_PROP_PARTS=Object.freeze({
 blanket:[10,111,502,336],pillow:[543,144,445,250],bed:[1037,143,476,257],
 clock:[108,555,312,431],breakfast:[591,544,337,436],microphone:[1186,543,192,444]
});
