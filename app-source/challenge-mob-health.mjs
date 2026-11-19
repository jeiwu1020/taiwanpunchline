export function drawStreetMobHealth(ctx,x,y,zoom,hp,maxHp){
 const maximum=Number(maxHp),current=Number(hp);
 if(!ctx||!Number.isFinite(maximum)||maximum<=0||!Number.isFinite(current)||current<=0)return;
 const width=Math.max(42,Math.min(90,68*zoom)),height=Math.max(4,Math.min(8,6*zoom)),left=x-width/2,top=y+Math.max(7,5*zoom),ratio=Math.max(0,Math.min(1,current/maximum));
 ctx.save();ctx.fillStyle='rgba(20,39,44,.9)';ctx.fillRect(left-2,top-2,width+4,height+4);ctx.fillStyle='#6c3c32';ctx.fillRect(left,top,width,height);ctx.fillStyle=ratio>.55?'#75c59a':ratio>.25?'#f0bd55':'#d55a46';ctx.fillRect(left,top,width*ratio,height);ctx.strokeStyle='#fff0c8';ctx.lineWidth=1;ctx.strokeRect(left-.5,top-.5,width+1,height+1);ctx.restore();
}
