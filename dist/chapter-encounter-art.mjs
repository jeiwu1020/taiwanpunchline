// Ink-and-paper scene objects, drawn in the same world coordinates as actors.
const INK='#263c37',PAPER='#fff0cc',RED='#b34d39',GREEN='#39735a';
function text(ctx,copy,x,y,size=15,color=INK){ctx.font=`900 ${size}px Microsoft JhengHei,system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle=color===PAPER?INK:PAPER;ctx.strokeText(copy,x,y);ctx.fillStyle=color;ctx.fillText(copy,x,y);}
function box(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();ctx.stroke();}
function line(ctx,x,y,xx,yy,color=INK,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
function texturedProp(ctx,p,images){
 const im=images?.['chapter-encounter-props'];if(!im)return false;
 const draw=(r,w,h,x=0,y=0)=>ctx.drawImage(im,...r,x-w/2,y-h,w,h);
 const sign=[709,663,465,547],boxes=[706,58,457,525];
 if(p.kind==='sound'){
  draw(sign,145,250);box(ctx,-52,-177,104,103,'#345a51');for(let i=0;i<5;i++)line(ctx,-43,-160+i*17,43,-160+i*17,'#66877a',2);text(ctx,'噓！',0,-122,34,PAPER);
 }else if(p.kind==='rush'){
  draw(boxes,104,123,0,-15);for(const x of [-34,34]){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x,-6,12,0,7);ctx.fill();ctx.strokeStyle='#c5af79';ctx.lineWidth=3;ctx.stroke();}line(ctx,48,-20,64,-130,'#836138',7);line(ctx,62,-130,80,-130,INK,7);
 }else if(p.kind==='route'){
  draw(sign,130,175);text(ctx,p.uses%2?'退回重填':'照箭頭走',0,-83,17);text(ctx,p.uses%2?'←':'→',0,-50,25,GREEN);
 }else if(p.kind==='handshake'){
  line(ctx,0,-204,0,-10,'#94653b',9);line(ctx,-36,-184,42,-184,'#94653b',7);line(ctx,-34,0,34,0,'#94653b',7);
  const suit=images['roster-costumes'];if(suit){ctx.drawImage(suit,47,10,245,327,-29,-184,71,108);ctx.save();ctx.translate(23,-174);ctx.rotate(-.55);ctx.drawImage(suit,365,10,181,200,-5,0,25,72);ctx.restore();}
  ctx.fillStyle='#d9aa4e';ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-30,-158,16,Math.PI,0);ctx.lineTo(-14,-148);ctx.lineTo(-46,-148);ctx.closePath();ctx.fill();ctx.stroke();line(ctx,-30,-182,-30,-177,'#d9aa4e',5);text(ctx,'叮',-30,-127,17);
 }else{
  draw(boxes,150,270);
  if(p.active){box(ctx,-64,-172,128,57,'#173d33');for(let i=0;i<4;i++){box(ctx,-52+i*5,-163+i*6,89,25,'#f4e0ac');}box(ctx,-71,-133,142,39,'#406c4f');line(ctx,-20,-114,20,-114,'#d8aa5c',5);}
  // The existing rubber stamp becomes the cabinet's visible interaction handle.
  ctx.drawImage(im,453,87,116,131,36,-294,38,43);text(ctx,p.active?'收件中':'敲章開櫃',0,-244,16);
 }
 return true;
}
function prop(ctx,p,images){
 ctx.fillStyle='#263c3733';ctx.beginPath();ctx.ellipse(0,2,48,9,0,0,Math.PI*2);ctx.fill();
 if(texturedProp(ctx,p,images)){}
 else if(p.kind==='sound'){
  box(ctx,-43,-112,86,102,'#e7bf76');for(let i=0;i<4;i++)line(ctx,-31,-94+i*19,31,-94+i*19,'#9b7644',3);
  box(ctx,-32,-83,64,42,PAPER);text(ctx,'噓！',0,-62,24);line(ctx,-32,-10,-40,7);line(ctx,32,-10,40,7);
 }else if(p.kind==='rush'){
  for(const x of [-32,32]){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x,-2,10,0,7);ctx.fill();ctx.fillStyle='#c7d4bd';ctx.beginPath();ctx.arc(x,-2,4,0,7);ctx.fill();}
  box(ctx,-49,-45,98,32,'#c98b4e');box(ctx,-35,-90,66,45,'#f4d396');line(ctx,-35,-67,31,-67);line(ctx,40,-42,58,-90);line(ctx,58,-90,72,-90);text(ctx,'急件',0,-68,18);
 }else if(p.kind==='route'){
  line(ctx,0,-80,0,0,INK,7);line(ctx,-26,0,26,0,INK,5);box(ctx,-55,-113,110,59,'#e0efdc');text(ctx,'照箭頭走',0,-94,15);text(ctx,p.uses%2?'← 退回':'→ 出口',0,-72,18);
 }else if(p.kind==='handshake'){
  line(ctx,0,-125,0,-4,'#8e6040',8);line(ctx,-35,-110,35,-110,'#8e6040',5);line(ctx,-28,0,28,0,INK,6);
  box(ctx,5,-108,34,74,'#416a71');ctx.fillStyle='#d89a67';ctx.beginPath();ctx.arc(-24,-111,12,0,7);ctx.fill();ctx.stroke();box(ctx,-47,-53,42,30,'#edc363');text(ctx,'叮',-26,-38,18);
 }else{
  box(ctx,-43,-111,86,108,GREEN);for(let i=0;i<3;i++){box(ctx,-35,-102+i*31,70,26,p.active&&i===1?'#fff0cc':'#8fbc97');line(ctx,-10,-89+i*31,10,-89+i*31);}
  box(ctx,16,-134,25,21,'#ad6148');line(ctx,28,-134,28,-146,INK,8);text(ctx,p.active?'收件':'敲章',0,-121,15);
 }
 if(p.flash>0){ctx.strokeStyle='#efbc4f';ctx.lineWidth=4;for(let i=0;i<6;i++){const a=i*Math.PI/3;line(ctx,Math.cos(a)*53,-68+Math.sin(a)*60,Math.cos(a)*64,-68+Math.sin(a)*72,'#efbc4f',4);}}
 text(ctx,p.cooldown>0?'稍候…':'攻擊互動',0,23,13);
}
export function drawChapterEncounter(ctx,w,project,zoom=1,images={}){
 const s=w?.chapterEncounter;if(!s)return;
 ctx.save();
 for(const e of w.enemies??[w.enemy])if(e?.chapterTell&&e.hp>0){
  const t=e.chapterTell,a=project(e.x,430,t.depth),b=project(t.x,430,t.depth),r=s.kind==='route'?75:36;
  ctx.fillStyle='#be4e3933';ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.setLineDash([8*zoom,5*zoom]);
  const left=s.kind==='route'?b.x-r*zoom:Math.min(a.x,b.x),width=s.kind==='route'?r*2*zoom:Math.abs(b.x-a.x)+24*zoom;
  ctx.fillRect(left,b.y-18*zoom,width,36*zoom);ctx.strokeRect(left,b.y-18*zoom,width,36*zoom);ctx.setLineDash([]);
  text(ctx,s.kind==='handshake'?'握！':s.kind==='route'?'此路施工':s.kind==='paper'?'去 ↔ 回':'注意直線',b.x,b.y+34*zoom,Math.max(12,14*zoom),RED);
 }
 for(const p of s.props){const q=project(p.x,430,p.depth);ctx.save();ctx.translate(q.x,q.y);ctx.scale(zoom,zoom);prop(ctx,p,images);ctx.restore();}
 for(const h of s.hazards){const q=project(h.x,430,h.depth);ctx.save();ctx.translate(q.x,q.y);ctx.scale(zoom*h.direction,zoom);
  if(h.kind==='sound'){for(let i=0;i<3;i++){ctx.strokeStyle=i%2?PAPER:'#bf6a3c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-i*18,-70,36+i*8,-1,1);ctx.stroke();}}
  else if(h.kind==='paper'){ctx.translate(0,-100);ctx.fillStyle=PAPER;ctx.strokeStyle=GREEN;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-27,-15);ctx.lineTo(30,0);ctx.lineTo(-23,18);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.stroke();line(ctx,-12,0,30,0,GREEN,2);}
  else if(h.kind==='rush'){for(let i=0;i<3;i++)line(ctx,-80-i*14,-12-i*15,-45,-12-i*15,'#a06a3b',4);}
  else{box(ctx,-70,-22,140,33,'#bd5748');text(ctx,'退回重填',0,-6,20,PAPER);}
  ctx.restore();
 }
 for(const n of s.notes){const q=project(n.x,430,n.depth);ctx.save();ctx.globalAlpha=Math.min(1,n.life*2);text(ctx,n.text,q.x,q.y-150*zoom,Math.max(12,15*zoom),GREEN);ctx.restore();}
 ctx.restore();
}
