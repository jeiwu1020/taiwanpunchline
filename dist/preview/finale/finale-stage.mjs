import {finalePoint,FINALE_FLOOR} from './finale-camera.mjs?v=finale-arena-20261113-r4';
const FLOOR=FINALE_FLOOR;
// An open central debating floor, not a side-scrolling street. The original
// illustration is architecture beyond the back boundary; never a screen cover.
export function drawFinaleStage(ctx,image,width,height,frame){
 ctx.fillStyle='#c99b60';ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(-frame.left*frame.zoom,frame.base-430*frame.zoom);ctx.scale(frame.zoom,frame.zoom);
 const p=(x,z)=>finalePoint(x,430,z);
 const polygon=(points,fill,stroke='#725134',line=2)=>{ctx.beginPath();for(const [i,q]of points.entries())i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}};
 const rear=p(0,FLOOR.back).y;
 if(image){
  // Mirror the outer architecture beyond the central chamber so safe-pocket
  // cameras never expose blank side gutters when following a corner.
  for(let tile=-2;tile<=2;tile++){ctx.save();const x=-330+tile*1620;ctx.translate(tile%2?x+1620:x,0);if(tile%2)ctx.scale(-1,1);ctx.drawImage(image,0,0,image.width,image.height*.775,0,rear-800,1620,800);ctx.restore();}
 }
 else{ctx.fillStyle='#a47b49';ctx.fillRect(-1000,-1400,3000,rear+1400);}
 // Overscan is architecture only. The outlined inner floor is the legal foot anchors plus shoe/ring clearance,
 // including the perspective narrowing. Physics bounds are unchanged.
 polygon([p(-1200,FLOOR.back),p(2160,FLOOR.back),p(2160,1400),p(-1200,1400)],'#cba26d');
 for(let z=FLOOR.back;z<1400;z+=45){
  const shade=(Math.round((z-FLOOR.back)/45)%2)?'#d6b47d':'#dfbf88';
  polygon([p(-1200,z),p(2160,z),p(2160,z+45),p(-1200,z+45)],shade,'#aa8153',1.2);
  for(let x=-1000;x<2000;x+=160){const q=p(x+(z%90===0?80:0),z),r=p(x+(z%90===0?80:0),z+45);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.stroke();}
 }
 // Reuse the illustration's wood grain as a subtle surface texture, without
 // changing the exact projected floor edges or adding a raster dependency.
 if(image){ctx.save();ctx.globalAlpha=.24;ctx.drawImage(image,0,image.height*.80,image.width,image.height*.20,-1200,rear,3360,1500);ctx.restore();}
 const corners=[p(FLOOR.left,FLOOR.back),p(FLOOR.right,FLOOR.back),p(FLOOR.right,FLOOR.front),p(FLOOR.left,FLOOR.front)];
 polygon(corners,'#e9c89188','#59452f',8);
 polygon(corners,'#e9c89122','#eed394',3);
 // Four corner inlays and an unobtrusive central compass make depth legible.
 for(const x of [FLOOR.left,FLOOR.right])for(const z of [FLOOR.back,FLOOR.front]){
  const q=p(x,z);ctx.fillStyle='#725134';ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();
 }
 polygon([p(480,-80),p(605,0),p(480,80),p(355,0)],'#af885255','#9c774c',3);
 polygon([p(480,-54),p(565,0),p(480,54),p(395,0)],'#e5ca9555','#b18c59',2);
 // The perimeter, not invisible furniture, defines where all seven can move.
 for(const x of [FLOOR.left-45,FLOOR.right+45]){
  polygon([p(x-15,FLOOR.back),p(x+15,FLOOR.back),p(x+15,FLOOR.front+30),p(x-15,FLOOR.front+30)],'#876143','#5c452f',3);
 }
 ctx.restore();
}
