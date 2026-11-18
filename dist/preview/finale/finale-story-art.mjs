import {ENCOUNTER_SPRITES} from '../../chapter-encounter-art.mjs?v=chapter-presentation-20261117-r1';
const INK='#263c37',PAPER='#fff0cc',GOLD='#e7b64c',RED='#b34d39';
function rect(c,x,y,w,h,fill){c.fillStyle=fill;c.strokeStyle=INK;c.lineWidth=4;c.beginPath();c.roundRect(x,y,w,h,7);c.fill();c.stroke();}
function text(c,t,x,y,size=24,color=INK){c.font=`900 ${size}px Microsoft JhengHei,system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
function line(c,x,y,xx,yy,color=INK,width=4){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function battery(c,map=false){
 rect(c,-81,-115,35,18,GOLD);rect(c,43,-115,35,18,'#aaa99c');rect(c,-125,-98,250,213,'#6b9275');rect(c,-116,-76,232,179,PAPER);
 if(!map){text(c,'議會無限城製造',0,-45,27);c.save();c.rotate(-.08);c.strokeStyle=RED;c.lineWidth=5;c.strokeRect(-96,-13,192,48);text(c,'過保失效',0,12,31,RED);c.restore();text(c,'＋',-70,78,27);text(c,'－',70,78,27);}
 else{const points=[[-73,-36],[65,-36],[-73,20],[65,20],[0,75]];c.strokeStyle=RED;c.lineWidth=3;c.setLineDash([5,4]);c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.setLineDash([]);for(const [i,[x,y]]of points.entries()){c.fillStyle=GOLD;c.beginPath();c.arc(x,y,6,0,7);c.fill();text(c,['東廊','第三盞燈','壁畫','階梯','無限城'][i],x,y-16,17);}text(c,'議會內密道',0,-66,23);}
}
function corridor(c,time,images){
 const im=images['finale-corridor'];if(im){c.drawImage(im,-360,-240,720,480);return;}
 c.fillStyle='#1b3030';c.fillRect(-360,-230,720,470);
 for(let i=5;i>=0;i--){const d=i*22;rect(c,-300+d,-200+d,600-d*2,420-d*1.5,i%2?'#746f50':'#526357');}
 c.fillStyle='#102829';c.fillRect(-132,-75,264,150);
 for(let i=0;i<7;i++){const y=45+i*24,half=72+i*27;c.fillStyle=i%2?'#b7ab79':'#8c926d';c.strokeStyle=INK;c.lineWidth=4;c.beginPath();c.moveTo(-half,y);c.lineTo(half,y);c.lineTo(half+24,y+24);c.lineTo(-half-24,y+24);c.closePath();c.fill();c.stroke();}
 for(const x of [-220,220]){line(c,x,-75,x,-40,GOLD,6);c.fillStyle='#f4c96b';c.beginPath();c.ellipse(x,-85,10+Math.sin(time/350)*2,19,0,0,7);c.fill();}
}
/** Comic inserts use the same prop atlas, palette and ink as the streets. */
export function drawFinaleStoryArt(c,images,shot,w,h,time=0){
 if(!shot)return false;c.save();c.translate(w/2,h*.49);const z=Math.min(w/600,h/400);c.scale(z,z);
 if(shot==='battery'||shot==='battery-map'){
  c.fillStyle='#f3e2bb';c.fillRect(-360,-240,720,480);
  for(let i=0;i<20;i++){const a=i*Math.PI/10;line(c,Math.cos(a)*190,Math.sin(a)*155,Math.cos(a)*360,Math.sin(a)*300,'#d3b67d',2);}
  c.save();c.rotate(shot==='battery-map'?.04:-.04);battery(c,shot==='battery-map');c.restore();
 }else{
  corridor(c,time,images);
  if(shot!=='corridor'){
   const image=images['chapter-encounter-props'],r=ENCOUNTER_SPRITES.door,opening=shot==='open-door',gap=opening?82:0;
   if(image){if(opening){c.drawImage(image,r[0],r[1],r[2]/2,r[3],-147-gap,-175,147,334);c.drawImage(image,r[0]+r[2]/2,r[1],r[2]/2,r[3],gap,-175,147,334);}else c.drawImage(image,...r,-147,-175,294,334);}
   else rect(c,-147,-175,294,334,'#8a613f');
   rect(c,-65,-168,130,35,'#8c693b');text(c,'無限城',0,-151,25,PAPER);
   if(shot==='battery-key'||opening){c.save();c.translate(128+gap,36);c.scale(.13,.13);battery(c);c.restore();if(!opening)text(c,'喀！',196,16,36,GOLD);}
   else{rect(c,112,19,27,31,INK);text(c,'？',190,31,35,GOLD);}
   if(opening){for(let i=0;i<4;i++){c.save();c.globalAlpha=.9-i*.16;text(c,'…',15+i*13,1-i*24,24,PAPER);c.restore();}}
  }else{rect(c,-237,-168,135,34,PAPER);text(c,'第三盞燈',-170,-151,22);}
 }
 c.restore();return true;
}
