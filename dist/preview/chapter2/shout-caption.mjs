// Screen-fixed shout typography: no actor coordinates, tails or backing boards.
export function shoutCaptionLayout(copy,side,view={},safe={},meta={}){
 const W=view.width||960,H=view.height||540,z=view.zoom||1,top=safe.top??64,bottom=safe.bottom??18;
 const lane=W*.4,margin=Math.min(20,W*.035),size=W<480?30:Math.min(46,Math.max(34,W*.047));
 const capacity=Math.max(3,Math.floor((lane-2*margin-28)/(size*1.2))),chars=[...copy],columns=Math.ceil(chars.length/Math.ceil(chars.length/capacity)),lines=[];
 for(let i=0;i<chars.length;i+=columns)lines.push(chars.slice(i,i+columns).join(''));
 const width=Math.max(...lines.map(s=>[...s].length))*size+14,height=lines.length*size*1.18+10;
 const screenX=side==='enemy'?W*.8:W*.2,screenY=Math.min(H-bottom-height*.6,top+21+height*.6+8),style=comicMoveStyle(meta.kind,meta.actor),tagY=screenY-height*.6-17;
 return {text:lines.join('\n'),size,width,height,screenX,screenY,tagY,tag:(side==='enemy'?'':'你 · ')+style.label,style,rotation:style.treatment==='seal'?.025:side==='enemy'?.045:-.045,color:meta.actor?style.face:side==='enemy'?'#a5f4ff':'#ffdf79',x:(view.x??480)+(screenX-W/2)/z,y:(view.y??270)+(screenY-H/2)/z,zoom:z};
}
export function shoutCaptionBeat(age,duration=1350,reduced=false){
 const t=Math.max(0,age),scale=reduced?1:t<80?.92+.18*t/80:t<200?1.1-.1*(t-80)/120:1;
 return {scale,alpha:Math.max(0,Math.min(1,(duration-t)/260)),done:t>=duration};
}
const CHARACTER_INK={
 wang:{label:'恰吉王',accent:'#ffab68',face:'#fff0bf'},han:{label:'韓國魚',accent:'#ffdc42',face:'#fff7b0'},
 ma:{label:'小馬哥',accent:'#5ee6ef',face:'#cfffff'},su:{label:'電火球',accent:'#ff7962',face:'#ffe7da'},
 huang:{label:'咆哮哥',accent:'#b6a0ff',face:'#f0e5ff'},chen:{label:'阿扁仔',accent:'#92eb7c',face:'#e3ffbd'},ko:{label:'柯P',accent:'#ff9ecb',face:'#ffe5f0'},
 mini:{label:'場務',accent:'#f2b84b',face:'#fff4cc'}
};
const TREATMENTS={rush:'speed',counter:'seal',heal:'pulse',coin:'flight',han_knee:'impact',arrow:'flight',ma_handshake:'grip',ma_gaze:'impact',ma_cough:'combo',su_shout:'impact',su_rush:'speed',su_dare:'seal',huang_shout:'impact',huang_debt:'seal',huang_queue:'combo',chen_dream:'flight',chen_question:'combo',chen_calm:'pulse',ko_bags:'combo',ko_name:'flight',ko_resolve:'seal',mini_flyer_shot:'flight',mini_whistle_charge:'speed',mini_megaphone_blast:'impact',mini_step_rush:'speed',mini_notice_lob:'flight',mini_folder_combo:'combo',mini_pass_grab:'grip',mini_baton_upper:'impact',mini_whistle_double:'combo',mini_barrier_drop:'combo'};
export function comicMoveStyle(kind,actor){return {...(CHARACTER_INK[actor]||{label:'招式',accent:'#ffdc42',face:'#fff7b0'}),treatment:TREATMENTS[kind]||'impact'};}
export function comicAccentState(age,duration=1350,reduced=false){
 return {alpha:Math.max(0,Math.min(.96,(duration-age)/260)),spread:reduced?1:Math.min(1,Math.max(.75,.75+age/440)),done:age>=duration};
}
export function paintComicAccent(g,p,state){
 g.clear();if(state.done){g.setVisible(false);return;}
 const z=p.zoom,w=p.width/2/z,h=p.height/2/z,c=parseInt(p.style.accent.slice(1),16),s=state.spread;
 g.setVisible(true).setPosition(p.x,p.y).setAlpha(state.alpha);
 const line=(x1,y1,x2,y2)=>{g.lineStyle(6/z,0x102934,1);g.lineBetween(x1,y1,x2,y2);g.lineStyle(3/z,c,1);g.lineBetween(x1,y1,x2,y2);};
 const t=p.style.treatment;
 if(t==='impact'){
  const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=i%2?.82:1;return {x:Math.cos(a)*(w+8/z*s)*r,y:Math.sin(a)*(h+8/z*s)*r};});
  points.forEach((p,i)=>{const q=points[(i+1)%points.length];line(p.x,p.y,q.x,q.y);});
  line(-w*.8,h+4/z,w*.6,h+1/z);
 }else if(t==='speed'){
  for(let i=0;i<3;i++){const y=(-.5+i*.5)*h;line(-w-7/z,y+5/z,-w+12/z,y-5/z);line(w-12/z,y+5/z,w+7/z,y-5/z);}
  line(-w*.9,h+5/z,w*.85,h-1/z);
 }else if(t==='combo'){
  line(-w*.9,h+2/z,w*.9,h-3/z);line(-w*.65,h+9/z,w*.75,h+4/z);
  for(const side of [-1,1]){line(side*(w+3/z),-h*.6,side*(w+6/z),-h*.1);line(side*(w+6/z),h*.1,side*(w+3/z),h*.6);}
 }else if(t==='seal'){
  for(const side of [-1,1]){line(side*w,-h*.8,side*(w+4/z),h*.7);line(side*w,-h*.8,side*(w-13/z),-h*.8);line(side*(w+4/z),h*.7,side*(w-9/z),h*.7);}
  line(-w*.45,h+6/z,w*.45,h+6/z);
 }else if(t==='flight'){
  line(-w*.85,h+5/z,w*.75,h-1/z);line(w*.75,h-1/z,w*.55,h-9/z);line(w*.75,h-1/z,w*.52,h+9/z);
  line(-w-4/z,-h*.5,-w+12/z,-h*.8);line(-w-6/z,0,-w+8/z,-h*.25);
 }else if(t==='grip'){
  for(const side of [-1,1]){line(side*(w+4/z),-h*.6,side*(w-5/z),0);line(side*(w-5/z),0,side*(w+4/z),h*.6);}
  line(-w*.6,h+5/z,w*.6,h+5/z);
 }else{
  for(const side of [-1,1]){const x=side*(w+1/z);line(x-4/z,0,x+4/z,0);line(x,-5/z,x,5/z);}
  line(-w*.65,h+3/z,0,h+7/z);line(0,h+7/z,w*.65,h+3/z);
 }
}
