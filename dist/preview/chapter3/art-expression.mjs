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
 const t=p.age,k=p.kind,durations={ma_gaze:.72,ma_cough:.82,su_shout:.64,su_rush:.72,su_dare:.88,huang_shout:.68,huang_debt:.82,huang_queue:.74,chen_dream:.72,chen_question:.76,chen_calm:.82,ko_name:.74,ko_resolve:.92},duration=durations[k]||.8,fade=Math.min(1,t/.08,Math.max(0,(duration-t)/.12));
 if(layer==='back'){
  if(k==='su_shout')drawAccent(ctx,images,'microphone',56,-104-p.bodyY,103,218,0,fade);
  if(k==='su_rush'&&t>.12){drawAccent(ctx,images,'dust',-57,-8-p.bodyY,100,47,0,fade*.7);readable(ctx,face,-64,-136,'衝',28,'#a86526',fade);}
  // Persistent queue is drawn from the engine obstacle, never a second decorative barrier.
  if(k==='ma_cough'&&p.farArm){
   const w=p.farArm.wrist,flutter=Math.sin(t*31)*.07;
   ctx.save();ctx.globalAlpha*=fade;ctx.translate(w.x+12,w.y+25);ctx.rotate(.10+flutter);ctx.fillStyle='#fff7e4';ctx.strokeStyle='#8c806b';ctx.lineWidth=1.8;
   ctx.beginPath();ctx.moveTo(-18,-24);ctx.lineTo(19,-24);ctx.lineTo(22,27);ctx.lineTo(-17,25);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.strokeStyle='#83928e';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-10,-12+i*8);ctx.lineTo(12,-12+i*8);ctx.stroke();}ctx.restore();
  }
 }
 if(layer==='front'){
  if(k==='ma_cough'){
   const local=t<.36?(t-.16)/.18:(t-.40)/.22;
   if(local>=0&&local<=1){ctx.save();ctx.globalAlpha*=fade*Math.sin(local*Math.PI)*.85;ctx.strokeStyle='#b29b7d';ctx.lineWidth=3;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(49+i*19+local*13,-182+i*4,8+i*3,5+i*2,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  }
  if(k==='ma_gaze'&&t>.13&&t<.35){ctx.save();ctx.globalAlpha=fade*.6;ctx.setLineDash([4,4]);ctx.strokeStyle='#85704c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(35,-232);ctx.lineTo(105,-217);ctx.stroke();ctx.restore();}
  if(k==='su_dare'&&t>.20)readable(ctx,face,110,-176,p.rosterAction?.outcome==='counter'?'！':p.rosterAction?.outcome==='whiff'?'…？':'來？',23,'#91642e',fade);
  if(k==='huang_debt'&&t>.16){drawAccent(ctx,images,'question',90,-219,45,45,.06,fade,face);readable(ctx,face,-51,-143,'？',21,'#795d8c',fade);}
  if(k==='huang_queue'&&p.rosterAction?.prop==='queue-pull'&&p.arm&&p.farArm){
   const a=p.arm.wrist,b=p.farArm.wrist;ctx.save();ctx.globalAlpha*=fade;ctx.strokeStyle='#b3473d';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x,b.y+8);ctx.quadraticCurveTo((a.x+b.x)/2,a.y+23,a.x,a.y+8);ctx.stroke();ctx.restore();
  }
  if(k==='huang_queue'&&t>.24)readable(ctx,face,96,-132,'停',24,'#a74433',fade);
  if(k==='chen_dream'&&t<.32)readable(ctx,face,72,-216,'✧',30,'#caa151',fade);
  if(k==='chen_question'&&t>.18&&t<.60){const second=t>=.40;drawAccent(ctx,images,'question',second?85:57,second?-91:-242,second?53:42,second?53:42,0,fade,face);}
  if(k==='chen_calm'&&t>.14){drawAccent(ctx,images,'reply',82,-222,63,42,0,fade);readable(ctx,face,80,-218,'…',19,'#3e7055',fade);}
  // Full-size name lives in the shared title bubble and falling name tile.
  if(k==='ko_name'&&t>.26&&t<.48){ctx.save();ctx.globalAlpha*=fade;ctx.strokeStyle='#658b8d';ctx.lineWidth=2.5;for(let i=0;i<3;i++){const y=-210+i*12;ctx.beginPath();ctx.moveTo(57,y);ctx.lineTo(66,y-3);ctx.lineTo(72,y+2);ctx.lineTo(83,y-2);ctx.stroke();}ctx.restore();}
  if(k==='ko_resolve'&&t>.12){ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#347f89';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-43,-2-p.bodyY);ctx.lineTo(43,-2-p.bodyY);ctx.stroke();ctx.restore();}
 }
}
// Signature atlas uses a fixed 3x2 layout; image bounds are assigned after asset review.
export const SIGNATURE_PROP_FRAMES={dream:[0,0,512,512],queue:[512,0,512,512],slides:[1024,0,512,512],crack:[0,512,512,512],questionA:[512,512,512,512],questionB:[1024,512,512,512]};
export function drawSignatureProp(ctx,images,name,x,y,w,h,angle=0,alpha=1){const im=images['signature-props'],r=SIGNATURE_PROP_FRAMES[name];if(!im||!r)return;ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,alpha));ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(im,...r,-w/2,-h/2,w,h);ctx.restore();}
