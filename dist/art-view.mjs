import {moveCaption,drawComicCaption,SIGNATURE_SIZE,presentationFighter,gazeGlyph,drawHumanGlyph} from './move-readability.mjs?v=campaign-complete-20261112-r1';
import {MOVE_VISUALS,drawSignatureProp} from './art-expression.mjs?v=campaign-complete-20261112-r1';
import {CAST} from './core.mjs?v=campaign-complete-20261112-r1';
import {loadArtImages,drawFighterArt,drawProp} from './art-render.mjs?v=campaign-complete-20261112-r1';
import {arrowPresentation,fighterPose} from './art-motion.mjs?v=campaign-complete-20261112-r1';
const $=s=>document.querySelector(s),images=await loadArtImages().catch(error=>{$('#note').textContent='部分素材載入失敗，請重新整理。';throw error}),ctx=$('#art').getContext('2d');
const moves={idle:['從容待機',1.3],walk:['走路',1.2],jump:['跳躍／落地',1.0],punch:['右拳',.32],leftJab:['左拳',.32],kick:['前踢',.32],crouch:['蹲下／站起',1.3],guard:['防禦',1.0],rush:['連滾帶爬',.72],counter:['從從容容',.84],heal:['喝水回氣',1.2],spit:['喝水被打斷',1],spitEarly:['起手被打斷',.62],spitLate:['收杯被打斷',1.52],coin:['發財金幣波',.42],han_knee:['可憐哪',1.08],arrow:['一支穿雲箭',.55]};
const notes={crouch:'按住 S／↓ 或蹲按鈕降低姿勢，放開站起。低姿真的能閃高招，中段、低掃與抓取仍能命中。',leftJab:'左手出拳、右手收防，兩隻手身份固定。基本攻擊的傷害與時機不變。',kick:'前腳踢出、後腳支撐，雙手保持平衡；只是基本攻擊演出變化，不額外增加傷害。',rush:'蜷起身體後再翻滾，保留原本的衝撞時機。',counter:'墨鏡跟著頭部，反擊判定沿用對戰規則。',heal:'右手背遮住杯身；膚色改為較接近臉部的暖桃色。對戰中在 1 秒回氣，1.2 秒結束。',spit:'被打斷後保持同一隻手與水杯，水花從嘴邊噴出。',coin:'同筆觸金幣，實際對戰中的投射物與冷卻不變。',han_knee:'膝行與可憐哪來自不同事件，這裡是遊戲組合；低姿能閃高招，但中段、低掃與抓取仍會命中。',arrow:'兩手、弓弦、弓與上身使用一體動作圖，避免手與道具分離。',idle:'近側右手背、遠側左掌與西裝各自保持固定層級。',walk:'雙臂反向擺動，髖、膝、踝各自帶動跨步；腳掌分別離地與踩回。',jump:'空中雙膝收起、雙手平衡；落地屈膝，腳影留在地面。',punch:'肩、肘、腕用連續曲線帶動，拳頭與前臂保持連接。',guard:'防禦時手臂留在身體前方，避免手肘反折。'};
for(const c of ['wang','han','ma','su','huang','chen','ko'])for(const m of CAST[c].moves){moves[m.kind]=[m.name,m.duration||moves[m.kind]?.[1]||.8];notes[m.kind]=MOVE_VISUALS[m.kind].label+'。'+m.hint+'。招式與效果為遊戲創作；新招暫用合成音效，原聲狀態見招式清單。';}
notes.han_knee='盤腿結構收在身前，抬臀以雙膝交替支撐。參照原節目的新聞靜圖；原影片播放未成功，步頻與動作銜接是漫畫設計，不是逐幀還原。低姿現在會降低受擊高度，仍會被中段、低掃與抓取打中。';
$('#character').replaceChildren(...Object.entries(CAST).map(([value,c])=>Object.assign(document.createElement('option'),{value,textContent:c.name})));
let t=0,playing=true,face=1,last=0;
function setup(){const common=['idle','walk','jump','leftJab','punch','kick','crouch','guard'];const list=common.concat($('#character').value==='wang'?['rush','counter','heal','spit','spitEarly','spitLate']:CAST[$('#character').value].moves.map(m=>m.kind));$('#move').replaceChildren(...list.map(key=>Object.assign(document.createElement('option'),{value:key,textContent:moves[key][0]})));reset()}
function reset(){t=0;playing=true;$('#timeline').max=moves[$('#move').value][1]+.4;$('#note').textContent=notes[$('#move').value]||notes.spit}
$('#character').onchange=setup;$('#move').onchange=reset;$('#flip').onclick=()=>{face*=-1};$('#play').onclick=()=>{playing=!playing};$('#timeline').oninput=e=>{t=Number(e.target.value);playing=false};
function render(ts){const dt=Math.min(.05,(ts-last)/1000);last=ts;const type=$('#character').value,kind=$('#move').value,duration=moves[kind][1];if(playing)t=(t+dt*Number($('#speed').value))%(duration+.4);
 const active=t<=duration,f={type,x:0,y:430,face,move:kind==='walk'?1:0,guard:kind==='guard'&&active,stun:0,flash:0,counter:active&&(kind==='counter'||(CAST[type].moves.find(m=>m.kind===kind)?.behavior==='counter'&&t>=(CAST[type].moves.find(m=>m.kind===kind)?.start||0)&&t<(CAST[type].moves.find(m=>m.kind===kind)?.start||0)+(CAST[type].moves.find(m=>m.kind===kind)?.window||0)))?.7:0,brace:active&&kind==='ko_resolve'&&t>.12&&t<.77?.65:0,reaction:0};
 if(kind==='jump'){if(active){f.y=430-Math.sin(t/duration*Math.PI)*65;f.vy=-Math.cos(t/duration*Math.PI)*200;}else f.land=Math.max(0,.18-(t-duration));}
 if(kind==='crouch'){f.crouch=active;f.crouchBlend=active?Math.min(1,t/.14,(duration-t)/.14):0;}
 if(!['idle','walk','jump','guard','crouch','spit','spitEarly','spitLate'].includes(kind)&&active)f.attack={kind:kind==='leftJab'||kind==='kick'?'punch':kind,age:t,variant:kind==='leftJab'?'left':kind==='kick'?'kick':'right'};
 const special=CAST[type].moves.find(m=>m.kind===kind);
 if(special)f.performance=t<special.duration+(kind==='han_knee'?0:.28)?{kind,age:t,actionDuration:special.duration,duration:special.duration+(kind==='han_knee'?0:.28),outcome:kind==='ma_handshake'&&t>special.end||kind==='su_dare'&&t>special.start+special.window?'whiff':'pending',outcomeAge:0}:null;
 let spit=0,impact=null;if(kind.startsWith('spit')&&active){const hitAt=kind==='spitEarly'?.05:kind==='spitLate'?.95:.4;if(t<hitAt)f.attack={kind:'heal',age:t};else{const elapsed=t-hitAt;spit=elapsed<.52?Math.max(.001,elapsed):0;f.reaction=Math.max(0,.52-elapsed);const hit=fighterPose({...f,reaction:0,attack:{kind:'heal',age:hitAt}},hitAt*1000);impact={wrist:{x:hit.arm.wrist.x,y:hit.arm.wrist.y-hit.bob},headAngle:hit.headAngle};}}

 ctx.clearRect(0,0,900,440);ctx.fillStyle='#dce2d1';ctx.fillRect(0,0,900,440);ctx.strokeStyle='#b8c3af';ctx.beginPath();ctx.moveTo(80,396);ctx.lineTo(820,396);ctx.stroke();
 ctx.save();ctx.translate(450,396);ctx.scale(face*1.04,1.04);ctx.translate(0,-(430-f.y));drawFighterArt(ctx,images,presentationFighter(f),t*1000,{spit,impact});
 if(kind==='coin'&&t>.16&&t<.9)drawProp(ctx,images,'coin',60+(t-.16)*270,-252,26,27,t*6);
 if(kind==='chen_dream'&&t>.30&&t<1.5)drawSignatureProp(ctx,images,'dream',60+(t-.3)*180,-252,SIGNATURE_SIZE.dream.width,SIGNATURE_SIZE.dream.height);
 if(kind==='arrow'&&t>.24&&t<.95){const age=t-.24,p={x:45+age*187.5,y:-140-495*age+475*age*age,vx:187.5,vy:-495+950*age,age},v=arrowPresentation(p);drawProp(ctx,images,'arrow',v.x,v.y,v.width,v.height,v.angle);}
 if(kind==='huang_queue'&&t>.28)drawSignatureProp(ctx,images,'queue',110,-37,92,74);
 ctx.restore();if(kind==='ma_gaze'){ctx.save();ctx.translate(450,396);ctx.scale(1.04,1.04);drawHumanGlyph(ctx,gazeGlyph(t),0,0,face);ctx.restore();}const caption=moveCaption(kind);if(caption&&t<caption.duration)drawComicCaption(ctx,caption,450,55);
 $('#time').textContent=t.toFixed(2)+'s';$('#timeline').value=t;$('#play').textContent=playing?'暫停':'播放';requestAnimationFrame(render)
}
setup();requestAnimationFrame(render);
