// Presentation keys only; quoted names are not proof of verified original audio.
export const MOVE_VISUALS={
 rush:{head:'wang-shock',accent:'roll',label:'驚慌蜷身／向前翻滾'},
 counter:{head:'wang-head',accent:'glasses',label:'從容笑臉／抬手戴墨鏡'},
 heal:{head:'wang-sip',accent:'cup',label:'啜飲嘴型／手杯一體'},
 coin:{head:'han-head',accent:'coin',label:'撇嘴送幣／金幣拖影'},
 han_knee:{head:'han-shout',accent:'knees',label:'盤腿膝行／交替支膝／抬頭喊話'},
 arrow:{head:'han-aim',accent:'bow',label:'瞇眼瞄準／拉弓放箭'},
 ma_handshake:{head:'ma-head',accent:'handshake',label:'欠身伸手／落空端詳手掌'},
 ma_gaze:{head:'ma-gaze',accent:'gaze',label:'抬眼端詳／抬掌攔跳'},
 ma_cough:{head:'ma-cough',accent:'cough',label:'掩口兩咳／簡報下一頁'},
 su_shout:{head:'su-shout',accent:'microphone',label:'立麥怒喊／抬手質問'},
 su_rush:{head:'su-head',accent:'charge',label:'三拍踏步／末步急煞站穩'},
 su_dare:{head:'su-slam',accent:'beckon',label:'咬牙挑眉／勾手邀戰'},
 huang_shout:{head:'huang-shout',accent:'shout',label:'指向前方／怒喊離譜'},
 huang_debt:{head:'huang-head',accent:'palms',label:'雙手攤開／後收反問'},
 huang_queue:{head:'huang-press',accent:'queue',label:'雙手抽帶／立掌放下隊線'},
 chen_dream:{head:'chen-step',accent:'dream',label:'抬頭放飛／夢想紙飛機'},
 chen_question:{head:'chen-wave',accent:'questions',label:'左右攤手／兩拍反問'},
 chen_calm:{head:'chen-head',accent:'shrug',label:'淡笑聳肩／減傷退開'},
 ko_bags:{head:'ko-head',accent:'bags',label:'沉肩提重袋／藍低掃綠接揮'},
 ko_name:{head:'ko-counter',accent:'name',label:'抬手呼喊／破音名牌'},
 ko_resolve:{head:'ko-sweep',accent:'resolve',label:'咬牙握拳／一次受傷不停手'},
};
const reactions={su:'su-shout',huang:'huang-shout',chen:'chen-wave',ko:'ko-sweep'};
export function expressionFor(type,p,f={}){
 if(p.kind==='ma_cough'&&(p.age<.10||p.age>.69))return 'ma-head';
 if(f.reaction>0&&reactions[type])return reactions[type];
 return MOVE_VISUALS[p.kind]?.head||type+'-head';
}
const frames={stopwatch:[0,0,512,512],microphone:[630,25,230,487],binder:[1024,0,512,512],reply:[0,512,512,512],question:[512,512,512,512],dust:[1024,512,512,512]};
export function drawAccent(ctx,images,name,x,y,w,h,angle=0,alpha=1,face=1){
 if(!images['move-accents']||!frames[name])return;
 ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.translate(x,y);ctx.rotate(angle);ctx.scale(face,1);ctx.drawImage(images['move-accents'],...frames[name],-w/2,-h/2,w,h);ctx.restore();
}
// Readable comic symbols are rendered outside character mirroring.
function readable(ctx,face,x,y,copy,size=21,color='#674a35',alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(face,1);ctx.font=`bold ${size}px system-ui`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(copy,0,0);ctx.restore();}
export function drawMoveAccent(ctx,images,p,layer,face=1){
 const t=p.age,k=p.kind,perk=!!p.perk,durations={ma_handshake:.56,ma_gaze:.72,ma_cough:.82,su_shout:.64,su_rush:.96,su_dare:.88,huang_shout:.68,huang_debt:.82,huang_queue:.74,chen_dream:.72,chen_question:.76,chen_calm:.82,ko_bags:.78,ko_name:.74,ko_resolve:.92},duration=durations[k]||.8,fade=Math.min(1,t/.06,Math.max(0,(duration-t)/.12));
 const outcome=p.rosterAction?.outcome??p.outcome??'pending',outcomeAge=p.outcomeAge||0;
 if(layer==='back'){
  if(k==='su_shout'){
   drawAccent(ctx,images,'microphone',56,-104-p.bodyY,103,218,0,fade);
   if(t>.18){const pulse=Math.sin(t*36)*.5+.5;ctx.save();ctx.globalAlpha*=fade*(perk?.95:.75);ctx.strokeStyle=perk?'#ffe875':'#ffd45c';ctx.lineWidth=perk?4.5:3;ctx.beginPath();ctx.arc(56,-205-p.bodyY,(perk?18:14)+pulse*10,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  if(k==='su_rush'&&t>.10){
   drawAccent(ctx,images,'dust',-57,-8-p.bodyY,perk?138:116,perk?62:52,0,fade*.85);
   ctx.save();ctx.globalAlpha*=fade*(perk?.85:.55);ctx.strokeStyle=perk?'#ffcf48':'#f59f42';ctx.lineWidth=perk?5.5:4;ctx.lineCap='round';
   for(let i=0;i<(perk?5:3);i++){const yy=-174+i*(perk?28:42)-p.bodyY;ctx.beginPath();ctx.moveTo(-25-i*14,yy);ctx.lineTo((perk?-122:-92)-i*18,yy);ctx.stroke();}
   ctx.restore();
   readable(ctx,face,-68,-140,perk?'猛衝！':'衝',perk?34:30,perk?'#d9621a':'#b85d19',fade);
  }
  if(k==='chen_calm'&&t>.10){
   const pulse=Math.sin(t*12)*4;ctx.save();ctx.globalAlpha*=fade*(perk?.65:.45);ctx.strokeStyle=perk?'#ffe26e':'#6cc997';ctx.fillStyle='#a8f0c822';ctx.lineWidth=perk?5.5:4;
   ctx.beginPath();ctx.arc(0,-132,(perk?84:72)+pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  if(k==='ma_cough'&&p.farArm){
   const w=p.farArm.wrist,flutter=Math.sin(t*31)*.07;
   ctx.save();ctx.globalAlpha*=fade;ctx.translate(w.x+12,w.y+25);ctx.rotate(.10+flutter);ctx.fillStyle='#fff7e4';ctx.strokeStyle='#8c806b';ctx.lineWidth=1.8;
   ctx.beginPath();ctx.moveTo(-18,-24);ctx.lineTo(19,-24);ctx.lineTo(22,27);ctx.lineTo(-17,25);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='#83928e';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-10,-12+i*8);ctx.lineTo(12,-12+i*8);ctx.stroke();}ctx.restore();
  }
 }
 if(layer==='front'){
  if(k==='ma_cough'){
   const local=t<.38?(t-.14)/.22:(t-.38)/.26;
   if(local>=0&&local<=1){ctx.save();ctx.globalAlpha*=fade*Math.sin(local*Math.PI)*.92;ctx.strokeStyle=perk?'#ffe488':'#e8dcc4';ctx.fillStyle='#fff7e02a';ctx.lineWidth=perk?5:4;
    const clouds=perk?5:3;
    for(let i=0;i<clouds;i++){const rx=55+i*(perk?42:38)+local*(perk?64:48),ry=-184+i*5,rad=16+i*9+local*(perk?18:14);ctx.beginPath();ctx.ellipse(rx,ry,rad*1.25,rad*.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.strokeStyle='#ffd47a';ctx.lineWidth=perk?4.5:3;ctx.beginPath();ctx.arc(46,-184,26+local*(perk?168:128),-.35,.35);ctx.stroke();ctx.restore();}
  }
  if(k==='ma_gaze'&&t>.10&&t<.60){
   const beam=Math.min(1,(t-.10)/.15);ctx.save();ctx.globalAlpha*=fade*(perk?.95:.8);
   ctx.fillStyle=perk?'#ffe46b3c':'#ffe27a28';ctx.beginPath();ctx.moveTo(32,-226);ctx.lineTo(perk?178:148,perk?-262:-246);ctx.lineTo(perk?164:138,-176);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#f5c84c';ctx.lineWidth=perk?4:3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(35,-226);ctx.lineTo((perk?168:140)*beam+35*(1-beam),-212);ctx.stroke();ctx.setLineDash([]);
   if(t>.22&&t<.56){const arc=(t-.22)/.34;ctx.globalAlpha=fade*Math.sin(arc*Math.PI)*.95;ctx.strokeStyle='#73b9ff';ctx.lineWidth=perk?9:7;ctx.beginPath();ctx.arc(42,-165,(perk?104:88)+arc*24,-1.35,-.15);ctx.stroke();ctx.strokeStyle='#fff7cf';ctx.lineWidth=perk?4.5:3.5;ctx.beginPath();ctx.arc(42,-165,(perk?94:80)+arc*24,-1.25,-.22);ctx.stroke();}
   ctx.restore();
  }
  if(k==='su_shout'&&t>.20&&t<.62){
   const u=(t-.20)/.42;ctx.save();ctx.globalAlpha*=fade*Math.sin(u*Math.PI)*.92;
   const arcs=perk?6:4;
   for(let i=0;i<arcs;i++){ctx.strokeStyle=i%2?'#ffdf59':'#e06d2b';ctx.lineWidth=(perk?7:5.5)-i*.7;ctx.beginPath();ctx.arc(42,-188,26+u*(perk?145:110)+i*24,-.6,.6);ctx.stroke();}
   ctx.restore();
  }
  if(k==='su_rush'&&t>.12&&t<.82){
   const wave=Math.abs(Math.sin((t-.12)*15));ctx.save();ctx.globalAlpha*=fade*(.55+.4*wave);
   ctx.strokeStyle=perk?'#ffd84f':'#ffba4a';ctx.lineWidth=perk?7:5;ctx.beginPath();ctx.moveTo(64,-178);ctx.lineTo(perk?136:118,-132);ctx.lineTo(64,-86);ctx.stroke();
   ctx.strokeStyle='#fff3c4';ctx.lineWidth=perk?3.5:2.5;ctx.beginPath();ctx.moveTo(48,-168);ctx.lineTo(perk?112:96,-132);ctx.lineTo(48,-96);ctx.stroke();
   ctx.restore();
  }
  if(k==='su_dare'&&t>.18){
   ctx.save();ctx.globalAlpha*=fade;
   if(outcome==='counter'&&outcomeAge<.28){
    const kU=outcomeAge/.28;ctx.strokeStyle=perk?'#ffe05c':'#ff8a3d';ctx.lineWidth=(perk?11:8)*(1-kU*.5);ctx.beginPath();ctx.arc(54,-146,35+kU*(perk?118:92),-.85,.85);ctx.stroke();
    ctx.strokeStyle='#fff5be';ctx.lineWidth=perk?5:4;ctx.beginPath();ctx.moveTo(45,-148);ctx.lineTo((perk?165:135)+kU*30,-148);ctx.stroke();
   }else{
    const ping=(t*3.2)%1;ctx.strokeStyle=perk?'#ffe268':'#f5ae42';ctx.lineWidth=perk?4:3;ctx.globalAlpha*=1-ping;ctx.beginPath();ctx.arc(62,-160,18+ping*(perk?48:36),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
   readable(ctx,face,112,-178,outcome==='counter'?'！':outcome==='whiff'?'…？':'來？',perk?28:25,'#91642e',fade);
  }
  if(k==='huang_shout'&&t>.22&&t<.64){
   const u=(t-.22)/.42;ctx.save();ctx.globalAlpha*=fade*Math.sin(u*Math.PI)*.92;
   ctx.fillStyle=perk?'#b98aff3a':'#a87ee626';ctx.beginPath();ctx.moveTo(45,-190);ctx.lineTo(perk?240:205,perk?-264:-248);ctx.lineTo(perk?240:205,-118);ctx.closePath();ctx.fill();
   const arcs=perk?6:4;
   for(let i=0;i<arcs;i++){ctx.strokeStyle=i%2?'#ffd56b':'#9666d6';ctx.lineWidth=(perk?7:5.5)-i*.7;ctx.beginPath();ctx.arc(44,-186,28+u*(perk?165:135)+i*24,-.55,.55);ctx.stroke();}
   ctx.restore();
  }
  if(k==='huang_debt'&&t>.14){
   const flare=['reject','reflect'].includes(outcome)&&outcomeAge<.26?Math.sin(outcomeAge/.26*Math.PI):0;
   ctx.save();ctx.globalAlpha*=fade*(.65+.35*flare);ctx.strokeStyle=(flare>.1||perk)?'#ffe488':'#8be2d8';ctx.fillStyle=(flare>.1||perk)?'#ffe48844':'#9e83cc26';ctx.lineWidth=(perk?5.5:4)+flare*3;
   const xMax=perk?114:106;
   ctx.beginPath();ctx.moveTo(86,-226);ctx.lineTo(xMax,-184);ctx.lineTo(xMax,-106);ctx.lineTo(82,-70);ctx.lineTo(64,-106);ctx.lineTo(64,-184);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   drawAccent(ctx,images,'question',94,-226,48,48,.06,fade,face);readable(ctx,face,-51,-143,'？',22,'#795d8c',fade);
  }
  if(k==='huang_queue'&&p.rosterAction?.prop==='queue-pull'&&p.arm&&p.farArm){
   const a=p.arm.wrist,b=p.farArm.wrist;ctx.save();ctx.globalAlpha*=fade;ctx.strokeStyle=perk?'#ffdf6b':'#cf4436';ctx.lineWidth=perk?10:8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x,b.y+8);ctx.quadraticCurveTo((a.x+b.x)/2,a.y+23,a.x,a.y+8);ctx.stroke();ctx.restore();
  }
  if(k==='huang_queue'&&t>.24){
   if(t<.54){const u=(t-.24)/.30;ctx.save();ctx.globalAlpha*=fade*(1-u)*.9;ctx.strokeStyle=perk?'#ffe066':'#d44c3b';ctx.lineWidth=perk?6:4;ctx.beginPath();ctx.ellipse(98,-4,28+u*(perk?74:55),8+u*(perk?14:10),0,0,Math.PI*2);ctx.stroke();ctx.restore();}
   readable(ctx,face,96,-132,perk?'特警停！':'停',perk?28:26,'#a74433',fade);
  }
  if(k==='chen_dream'&&t<.52){
   const u=t/.52;ctx.save();ctx.globalAlpha*=fade*(1-u*.35);ctx.strokeStyle=perk?'#ffe36e':'#88dba0';ctx.lineWidth=perk?5:3.5;ctx.beginPath();ctx.arc(62,-206,14+u*(perk?48:34),0,Math.PI*2);ctx.stroke();if(perk){ctx.strokeStyle='#88dba0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(62,-206,24+u*48,0,Math.PI*2);ctx.stroke();}ctx.restore();
   if(t<.34)readable(ctx,face,72,-216,'✧',perk?38:32,'#caa151',fade);
  }
  if(k==='chen_question'&&t>.14&&t<.68){
   const first=t>=.14&&t<.38,second=t>=.36&&t<.66;
   ctx.save();
   if(first){const u=(t-.14)/.24;ctx.globalAlpha=fade*Math.sin(u*Math.PI)*.92;ctx.strokeStyle='#72cf96';ctx.lineWidth=perk?9:7;ctx.beginPath();ctx.arc(36,-152,(perk?68:58)+u*28,-1.15,.15);ctx.stroke();drawAccent(ctx,images,'question',57,-242,44,44,0,fade,face);}
   if(second){const u=(t-.36)/.30;ctx.globalAlpha=fade*Math.sin(u*Math.PI)*.92;ctx.strokeStyle='#f2cc68';ctx.lineWidth=perk?9:7;ctx.beginPath();ctx.arc(38,-102,(perk?74:64)+u*32,-.15,.95);ctx.stroke();drawAccent(ctx,images,'question',88,-92,56,56,0,fade,face);}
   ctx.restore();
  }
  if(k==='chen_calm'&&t>.14){
   drawAccent(ctx,images,'reply',84,-224,66,44,0,fade);readable(ctx,face,82,-220,'…',21,'#3e7055',fade);
   if(outcome==='calm'&&outcomeAge<.32){const u=outcomeAge/.32;ctx.save();ctx.globalAlpha*=fade*(1-u);ctx.strokeStyle=perk?'#ffe36e':'#7ed9a4';ctx.lineWidth=perk?6:4;ctx.beginPath();ctx.ellipse(0,-135,(perk?68:55)+u*48,(perk?84:72)+u*24,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  if(k==='ko_bags'){
   if(t>=.13&&t<=.38){const u=(t-.13)/.25;ctx.save();ctx.globalAlpha=fade*Math.sin(u*Math.PI)*.92;ctx.strokeStyle='#4da3eb';ctx.lineWidth=perk?10:8;ctx.beginPath();ctx.arc(32,-104,(perk?82:70)+u*26,-.25,.95);ctx.stroke();ctx.strokeStyle=perk?'#ffe57a':'#dff2ff';ctx.lineWidth=perk?4:3;ctx.beginPath();ctx.arc(32,-104,(perk?88:76)+u*26,-.15,.85);ctx.stroke();ctx.restore();}
   if(t>=.36&&t<=.62){const u=(t-.36)/.26;ctx.save();ctx.globalAlpha=fade*Math.sin(u*Math.PI)*.92;ctx.strokeStyle='#52c478';ctx.lineWidth=perk?10:8;ctx.beginPath();ctx.arc(36,-132,(perk?88:76)+u*28,-1.05,.25);ctx.stroke();ctx.strokeStyle=perk?'#ffe57a':'#e3ffe9';ctx.lineWidth=perk?4:3;ctx.beginPath();ctx.arc(36,-132,(perk?94:82)+u*28,-.95,.15);ctx.stroke();ctx.restore();}
  }
  if(k==='ko_name'&&t>.22&&t<.56){
   const u=(t-.22)/.34;ctx.save();ctx.globalAlpha*=fade*Math.sin(u*Math.PI);
   const arcs=perk?5:3;
   for(let i=0;i<arcs;i++){ctx.strokeStyle=i%2&&perk?'#ffe470':'#5bb5bf';ctx.lineWidth=perk?5:3.5;ctx.beginPath();ctx.arc(54,-204,14+u*(perk?66:48)+i*14,-.6,.6);ctx.stroke();}
   ctx.restore();
  }
  if(k==='ko_resolve'&&t>.10){
   const pulse=Math.sin(t*20)*.5+.5;ctx.save();ctx.globalAlpha*=fade;
   ctx.strokeStyle=perk?'#ffe26e':'#5ee1ed';ctx.lineWidth=perk?6.5:5;ctx.beginPath();ctx.ellipse(0,-2-p.bodyY,(perk?60:52)+pulse*6,10,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#5ee1ed1e';ctx.beginPath();ctx.ellipse(0,-135,perk?64:58,perk?132:125,0,0,Math.PI*2);ctx.fill();ctx.lineWidth=perk?4.5:3.5;ctx.stroke();
   ctx.restore();
  }
 }
}
// Signature atlas uses a fixed 3x2 layout; image bounds are assigned after asset review.
export const SIGNATURE_PROP_FRAMES={dream:[0,0,512,512],queue:[512,0,512,512],slides:[1024,0,512,512],crack:[0,512,512,512],questionA:[512,512,512,512],questionB:[1024,512,512,512]};
export function drawSignatureProp(ctx,images,name,x,y,w,h,angle=0,alpha=1){const im=images['signature-props'],r=SIGNATURE_PROP_FRAMES[name];if(!im||!r)return;ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(im,...r,-w/2,-h/2,w,h);ctx.restore();}
