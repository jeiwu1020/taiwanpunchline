// Front lip coordinates measured in the existing costume images. Reuse those
// pixels, rather than adding a raised collar or painting over a character's jaw.
const EDGES={
 wang:[[238,40],[248,56],[280,77],[316,91],[339,87],[349,75]],
 han:[[238,40],[248,56],[280,77],[316,91],[339,87],[349,75]],
 ma:[[138,21],[147,36],[173,51],[199,61],[215,56],[220,44]],
 su:[[139,363],[149,378],[173,393],[202,402],[216,397],[221,383]],
 huang:[[138,695],[148,708],[176,723],[203,731],[215,725],[221,715]],
 chen:[[143,31],[153,45],[177,62],[207,76],[225,72],[233,60]],
 ko:[[150,554],[159,573],[185,592],[214,607],[235,603],[244,583]],
 roll:[[340,87],[367,116],[431,153],[504,183],[555,191],[582,170]],
 arrow:[[459,321],[478,345],[514,363],[555,381],[585,383],[603,367]],
 lotus:[[330,102],[348,111],[372,123],[397,137],[413,125],[419,105]],
};
// Portrait sizes and head rotation remain unchanged. The small seating offset
// tucks the original neck's cut edge into the shirt opening instead of leaving
// it on top of the collar. Integrated action bodies already have seated heads.
export const HEAD_SEAT={wang:4.8,han:4.8,ma:3.8,su:3.6,huang:3.4,chen:3.6,ko:3.6};

export function drawCollarFront(ctx,image,source,destination,key){
 const edge=EDGES[key];if(!edge)return;
 const [sx,sy,sw,sh]=source,[x,y,w,h]=destination;
 const point=([a,b])=>[x+(a-sx)*w/sw,y+(b-sy)*h/sh];
 const first=edge[0],last=edge.at(-1),bottom=Math.max(...edge.map(p=>p[1]))+48;
 const outline=[[first[0]-12,first[1]],...edge,[last[0]+12,last[1]],[last[0]+12,bottom],[first[0]-12,bottom]];
 ctx.save();ctx.beginPath();outline.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...point(p)));ctx.closePath();ctx.clip();
 ctx.drawImage(image,...source,...destination);ctx.restore();
}
