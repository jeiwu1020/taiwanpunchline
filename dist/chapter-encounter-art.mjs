// Shared ink-and-paper props; every point uses the actors' world projection.
const INK='#263c37',PAPER='#fff0cc',RED='#b34d39',GREEN='#39735a',GOLD='#e7b64c';
export const ENCOUNTER_SPRITES=Object.freeze({sound:[28,45,467,437],rush:[531,120,475,346],route:[1089,11,420,488],handshake:[69,522,338,489],paper:[554,523,373,476],door:[1049,526,416,473]});
const LABELS={sound:'敲板止聲',rush:'推車',route:'切換通道',handshake:'敲鈴誘敵',paper:'蓋章開櫃'};
function text(c,t,x,y,size=15,color=INK){c.font=`900 ${size}px Microsoft JhengHei,system-ui`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle=color===PAPER?INK:PAPER;c.strokeText(t,x,y);c.fillStyle=color;c.fillText(t,x,y);}
function line(c,x,y,xx,yy,color=INK,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function box(c,x,y,w,h,fill){c.fillStyle=fill;c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,5);c.fill();c.stroke();}
function ring(c,x,y,r,color=GOLD){c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}
function arrow(c,x,y,dir=1,color=GREEN){line(c,x-dir*26,y,x+dir*26,y,color,7);line(c,x+dir*26,y,x+dir*10,y-13,color,7);line(c,x+dir*26,y,x+dir*10,y+13,color,7);}
function paper(c,x,y,dir=1,stamped=false){c.save();c.translate(x,y);c.scale(dir,1);c.fillStyle=PAPER;c.strokeStyle=GREEN;c.lineWidth=3;c.beginPath();c.moveTo(-27,-15);c.lineTo(30,0);c.lineTo(-23,18);c.lineTo(-12,0);c.closePath();c.fill();c.stroke();line(c,-12,0,30,0,GREEN,2);if(stamped){c.strokeStyle=RED;c.lineWidth=3;c.strokeRect(-18,-9,13,13);line(c,-15,-5,-9,0,RED,2);}c.restore();}
function prop(c,p,images,time,near){
 const im=images?.['chapter-encounter-props'],r=ENCOUNTER_SPRITES[p.kind],height={sound:190,rush:135,route:180,handshake:200,paper:195}[p.kind],width=height*r[2]/r[3];
 c.fillStyle='#263c3733';c.beginPath();c.ellipse(0,2,width*.43,9,0,0,7);c.fill();c.save();
 if(p.kind==='handshake'&&p.lureTime>0)c.rotate(Math.sin(time*20)*.035);
 if(p.kind==='rush'&&p.vx)c.translate(0,Math.sin(time*35)*2);
 if(im)c.drawImage(im,...r,-width/2,-height,width,height);
 else{box(c,-width/2,-height,width,height-4,p.kind==='paper'?GREEN:'#b68b4b');text(c,LABELS[p.kind],0,-height/2,17,PAPER);}
 if(p.kind==='paper'){box(c,-width*.3,-height*.43,width*.6,height*.16,p.active?'#182f29':'#779681');line(c,-15,-height*.35,15,-height*.35,GOLD,4);if(p.active){paper(c,0,-height*.48,1);text(c,'收件',0,-height*.23,16,PAPER);}}
 if(p.kind==='sound'){text(c,'噓！',0,-height*.56,28,PAPER);if(p.flash>0)ring(c,0,-height*.5,42+p.flash*25);}
 if(p.kind==='route')text(c,p.gate?'改道':'退回',0,-height*.72,16,PAPER);
 c.restore();
 if(p.kind==='rush'&&p.vx)for(let i=0;i<3;i++){c.globalAlpha=.5;ring(c,-Math.sign(p.vx)*(width*.4+i*18),-6-i*4,6+i*2,'#ba9c6f');}c.globalAlpha=1;
 if(p.kind==='handshake'&&p.lureTime>0){ring(c,-30,-height*.6,25+(time*22)%20);text(c,'握這邊！',0,-height-17,17,GREEN);}
 if(near){text(c,p.cooldown>0?`${Math.ceil(p.cooldown)} 秒`:`攻擊 · ${LABELS[p.kind]}`,0,25,14);if(p.cooldown>0){line(c,-27,37,27,37,'#263c3744',4);line(c,-27,37,-27+54*(1-p.cooldown/5),37,GREEN,4);}}
}
function gate(c,g,project,z,time){
 const q=project((g.left+g.right)/2,430,g.depth),open=project((g.left+g.right)/2,430,-g.depth);c.save();c.translate(q.x,q.y);c.scale(z,z);
 c.fillStyle='#263c3733';c.beginPath();c.ellipse(0,1,61,13,0,0,7);c.fill();
 for(const x of [-40,40]){box(c,x-5,-91,10,92,'#9e6e3f');line(c,x-15,0,x+15,0,INK,5);}
 c.save();c.translate(-40,-74);if(g.pending!==null)c.rotate(-.12-Math.abs(Math.sin(time*5))*.24);box(c,0,-14,80,27,'#edcc75');for(let x=8;x<80;x+=22)line(c,x,-12,x-12,11,RED,8);c.restore();
 if(g.pending!==null)text(c,'等路人先過',0,-112,14);c.restore();c.save();c.translate(open.x,open.y);c.scale(z,z*.65);arrow(c,0,0,1);c.restore();
}
function effect(c,e,project,z){
 const q=project(e.x,430,e.depth),t=e.age/e.life;c.save();c.translate(q.x,q.y);c.scale(z,z);c.globalAlpha=Math.min(1,(1-t)*3);
 if(['absorb','screen'].includes(e.kind)){for(let i=0;i<3;i++){const d=e.direction??1;c.strokeStyle=i%2?GOLD:PAPER;c.lineWidth=5;c.beginPath();c.arc(-d*(12+(1-t)*55+i*17),-90,15+(1-t)*25,-1,1);c.stroke();}text(c,'噓——',0,-215,22,GREEN);}
 else if(['crash','push'].includes(e.kind)){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=30+t*45;line(c,Math.cos(a)*r,-65+Math.sin(a)*r,Math.cos(a)*(r+23),-65+Math.sin(a)*(r+23),i%2?GOLD:PAPER,6);}if(e.kind==='crash')text(c,'煞！',0,-120,32,RED);}
 else if(e.kind==='redirect'){arrow(c,0,-50,1,GREEN);arrow(c,0,-88,-1,GOLD);}
 else if(e.kind==='bell'||e.kind==='handshake'){ring(c,-25,-140,18+t*55);ring(c,-25,-140,8+t*35,PAPER);text(c,e.kind==='bell'?'叮！':'握錯啦！',15,-215,25,GREEN);}
 else if(e.kind==='stamp'){c.save();c.translate(0,-115-Math.max(0,.25-t)*170);c.rotate(-.15);c.strokeStyle=RED;c.lineWidth=5;c.strokeRect(-36,-26,72,52);text(c,'退件',0,0,24,RED);c.restore();}
 else if(e.kind==='tea'){const to=project(e.targetX,430,e.targetDepth);c.translate((to.x-q.x)/z*t,-80+(to.y-q.y)/z*t-Math.sin(t*Math.PI)*80);box(c,-12,-20,24,27,PAPER);ring(c,17,-7,7,GREEN);text(c,'+3',0,-40,17,GREEN);}
 c.restore();
}
export function drawChapterEncounter(c,w,project,zoom=1,images={}){
 const s=w?.chapterEncounter;if(!s)return;c.save();
 for(const e of w.enemies??[w.enemy])if(e?.chapterTell&&e.hp>0){const t=e.chapterTell,a=project(e.x,430,t.depth),b=project(t.x,430,t.depth),r=s.kind==='route'?75:36;c.fillStyle='#be4e3933';c.strokeStyle=RED;c.lineWidth=2;c.setLineDash([8*zoom,5*zoom]);const left=s.kind==='route'?b.x-r*zoom:Math.min(a.x,b.x),width=s.kind==='route'?r*2*zoom:Math.abs(b.x-a.x)+24*zoom;c.fillRect(left,b.y-18*zoom,width,36*zoom);c.strokeRect(left,b.y-18*zoom,width,36*zoom);c.setLineDash([]);text(c,s.kind==='handshake'?'握！':s.kind==='route'?'此路施工':s.kind==='paper'?'去 ↔ 回':'注意直線',b.x,b.y+42*zoom,Math.max(12,14*zoom),RED);}
 for(const g of s.gates??[])gate(c,g,project,zoom,s.time);
 for(const p of s.props){const q=project(p.x,430,p.depth),near=Math.abs(w.player.x-p.x)<190&&Math.abs((w.player.depth??0)-p.depth)<55;c.save();c.translate(q.x,q.y);c.scale(zoom,zoom);prop(c,p,images,s.time,near);c.restore();}
 for(const h of s.hazards){const q=project(h.x,430,h.depth);c.save();c.translate(q.x,q.y);c.scale(zoom*h.direction,zoom);if(h.kind==='sound'){for(let i=0;i<3;i++){c.strokeStyle=i%2?PAPER:'#bf6a3c';c.lineWidth=5;c.beginPath();c.arc(-i*18,-70,36+i*8,-1,1);c.stroke();}}else if(h.kind==='paper')paper(c,0,-100);else if(h.kind==='rush'){for(let i=0;i<3;i++)line(c,-80-i*14,-12-i*15,-45,-12-i*15,'#a06a3b',4);}else{box(c,-70,-22,140,33,RED);text(c,'退回重填',0,-6,20,PAPER);}c.restore();}
 for(const p of s.parcels??[]){const q=project(p.x,330,p.depth);c.save();c.translate(q.x,q.y);c.scale(zoom,zoom);paper(c,0,0,p.direction,true);c.restore();}
 for(const e of s.effects??[])effect(c,e,project,zoom);
 for(const n of s.notes){const q=project(n.x,430,n.depth);c.save();c.globalAlpha=Math.min(1,n.life*2);text(c,n.text,q.x,q.y-250*zoom,Math.max(12,15*zoom),GREEN);c.restore();}c.restore();
}
