// Chapter-owned tactics. CAST/COMBAT are deliberately not copied or modified.
const GROUND=430,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const CHAPTER_TACTICS=Object.freeze([
 {kind:'sound',prop:'隔音板',tell:'吸氣了！找板子或換道',hint:'聲浪吸氣後直衝！換道躲，或敲隔音板打斷。',joke:'請降低音量，板子也要休息。'},
 {kind:'rush',prop:'煞車推車',tell:'直線衝！換道誘撞車',hint:'敵人壓低身體就要衝！換道誘撞，攻擊推車。',joke:'衝第一名，煞車最後一名。'},
 {kind:'route',prop:'改道流程牌',tell:'路線已畫好！離開紅格',hint:'敲牌切換欄杆通道；紅格亮起就離開，也能跳過欄杆。',joke:'流程已改善：這次真的換一條路。'},
 {kind:'handshake',prop:'禮貌衣架',tell:'手伸出來了！跳開躲抓',hint:'伸手才握！跳開躲抓，落空反擊；敲鈴引開他。',joke:'外套已握手，本人先借過。'},
 {kind:'paper',prop:'退件檔案櫃',tell:'紙機要回來！留意回程',hint:'敲章開櫃，接住紙機再退回寄件人；留意來回路線。',joke:'已蓋章，原件退回。免附影本！'}
]);
const chapterOf=w=>Number(String(w.runId??'chapter-1').match(/chapter-(\d)/)?.[1]??1);
const sameLane=(a,b,range=36)=>Math.abs((a.depth??0)-(b.depth??0))<=range;
const between=(x,a,b)=>x>=Math.min(a,b)&&x<=Math.max(a,b);
function message(w,text,x=w.player.x,depth=w.player.depth??0){w.chapterEncounter.notes.push({text,x,depth,life:1.8});w.chapterEncounter.notes=w.chapterEncounter.notes.slice(-5);}
function effect(w,kind,prop,extra={}){w.chapterEncounter.effects.push({kind,x:prop.x,depth:prop.depth??0,age:0,life:1.1,...extra});w.chapterEncounter.effects=w.chapterEncounter.effects.slice(-24);}
function receivePaper(w,prop,source,damage){
 const s=w.chapterEncounter;prop.flash=.9;effect(w,'stamp',prop);
 if(source?.hp>0)s.parcels.push({x:prop.x,depth:prop.depth??0,direction:Math.sign(source.x-prop.x)||1,damage:Math.max(0,damage??8),delay:.35,age:0,life:2.2,dead:false,castId:w.nextCast? w.nextCast++:s.time});
 if(!prop.tea){prop.tea=true;w.player.hp=Math.min(w.player.maxHp,w.player.hp+3);effect(w,'tea',prop,{targetX:w.player.x,targetDepth:w.player.depth??0});message(w,'收件送茶，退件找本人！',prop.x,prop.depth);}
}
export function ensureChapterEncounter(w,chapter=chapterOf(w),boss=false){
 const key=`${chapter}:${boss?'boss':w.section?.id}`;
 if(w.chapterEncounter?.key===key)return w.chapterEncounter;
 const spec=CHAPTER_TACTICS[chapter-1];if(!spec)return null;
 const width=boss?960:w.worldWidth;
 // Keep the last optional interaction distinct from the supply stop. These are
 // authored street positions; boss arenas and combat rules stay unchanged.
 const lastProp={'chapter-3:route-a':2210,'chapter-4:route-a':2200,'chapter-5:route-c':2580};
 const points=boss?[330,650]:[360,Math.round(width*.49),lastProp[w.section?.id]??width-470];
 const props=points.map((x,i)=>({x,depth:boss?0:[0,65,-65][i],kind:spec.kind,active:spec.kind!=='paper',cooldown:0,uses:0,flash:0,vx:0,tea:false}));
 // Keep interactive props in walkable space, away from the existing tables.
 for(const p of props)for(const t of w.platforms??[])if(p.x>t.left-100&&p.x<t.right+100&&Math.abs(p.depth-(t.depth??0))<(t.depthHalf??36)+45)p.depth=(t.depth??0)>0?-65:65;
 const bossHints=[
  '隔音板擋喊話，排隊線跳過；近身別貪拳。',
  '敲推車誘撞衝刺；看清出招，閃開再反擊。',
  '敲流程牌退通知；避開落字，再回頭反擊。',
  '敲衣架鈴引握手；跳開躲抓，落空再反擊。',
  '敲章開櫃，把紙機蓋章退回；首件送茶。'
 ];
 const gates=[];
 if(spec.kind==='route'&&!boss)for(const prop of props){
  const offset=[130,-180,300,-330].find(n=>prop.x+n>110&&prop.x+n+75<width-100&&!(w.platforms??[]).some(t=>prop.x+n<t.right+65&&prop.x+n+75>t.left-65)&&!gates.some(g=>Math.abs(g.left-prop.x-n)<170));
  if(offset===undefined)continue;const gate={left:prop.x+offset,right:prop.x+offset+75,y:GROUND-85,depth:45,depthHalf:52,pending:null,wait:0,prop};prop.gate=gate;gates.push(gate);
 }
 return w.chapterEncounter={key,chapter,boss,...spec,hint:boss?bossHints[chapter-1]:spec.hint,props,gates,hazards:[],parcels:[],effects:[],notes:[],time:0};
}
function stopMob(e,seconds=1.15){e.attack=null;e.chapterTell=null;e.warning=0;e.aiWait=seconds;e.chapterRest=seconds;e.move=0;}
function covered(s,a,b){return s.props.find(p=>p.active&&sameLane(p,b,42)&&between(p.x,a.x,b.x));}
export function canInteractChapterProp(w,prop,actor=w.player){
 return !!(w.chapterEncounter&&actor===w.player&&prop.cooldown<=0&&sameLane(prop,actor,48)&&Math.abs(prop.x-actor.x)<115&&(prop.x-actor.x)*(actor.face||1)>=-20&&actor.y>=GROUND-60);
}
export function chapterPropHint(w){
 const p=w?.player;if(!p||p.y<GROUND-60)return null;
 const props=w.chapterEncounter?.props??[];
 const ready=props.find(prop=>canInteractChapterProp(w,prop));
 if(ready)return {prop:ready,state:'ready'};
 const near=props.filter(prop=>Math.abs(prop.x-p.x)<190&&sameLane(prop,p,48)).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
 if(!near)return null;
 return {prop:near,state:Math.abs(near.x-p.x)>=115?'approach':(near.x-p.x)*(p.face||1)<-20?'turn':near.cooldown>0?'cooldown':'approach'};
}
export function interactChapterProp(w,actor=w.player){
 const s=w.chapterEncounter;if(!s||actor!==w.player)return false;
 const prop=s.props.find(p=>canInteractChapterProp(w,p,actor));
 if(!prop)return false;
 prop.cooldown=5;prop.flash=.7;prop.uses++;
 effect(w,{sound:'screen',rush:'push',route:'redirect',handshake:'bell',paper:'stamp'}[s.kind],prop);
 if(s.kind==='rush')prop.vx=(actor.face||1)*360;
 else if(s.kind==='paper')prop.active=true;
 else if(s.kind==='route'){
  if(prop.gate){prop.gate.pending=-prop.gate.depth;prop.gate.wait=.35;}
  const h=s.hazards.find(h=>Math.abs(h.x-prop.x)<280);if(h)h.dead=true;
  const e=(w.enemies??[w.enemy]).find(e=>e?.chapterTell&&Math.abs(e.x-prop.x)<280);if(e)stopMob(e);
 }else for(const e of w.enemies??[w.enemy])if(e?.hp>0&&Math.abs(e.x-prop.x)<240){
  if(s.kind==='handshake'){e.chapterLure={x:prop.x,depth:prop.depth,life:3};prop.lureTime=3;if(e.chapterTell)Object.assign(e.chapterTell,{x:prop.x,depth:prop.depth,direction:Math.sign(prop.x-e.x)||e.face});}
  else if(e.chapterTell)stopMob(e);
 }
 message(w,s.joke,prop.x,prop.depth);return true;
}
export function stepChapterMob(w,e,dt){
 const s=w.chapterEncounter;if(!s||s.boss||!e.mobKind)return false;
 const p=w.player,target=e.chapterLure??p,dx=target.x-e.x,dir=dx>=0?1:-1;e.move=0;
 if(e.chapterRest>0){e.chapterRest=Math.max(0,e.chapterRest-dt);e.aiWait=e.chapterRest;return true;}
 if(e.chapterTell){
  const t=e.chapterTell;t.age+=dt;e.warning=Math.max(0,t.delay-t.age);e.face=t.direction;
  if(e.attack)e.attack.age=t.age;
  if(t.age<t.delay)return true;
  const h={kind:s.kind,owner:e,x:e.x,origin:e.x,depth:t.depth,direction:t.direction,age:0,life:1.7,damage:e.spec.damage,hits:new Set(),dead:false};
  if(s.kind==='route'){h.x=t.x;h.life=.4;h.radius=75;}
  if(s.kind==='handshake'){
   const rack=covered(s,e,{x:t.x,depth:t.depth});
   if(rack){rack.flash=.65;effect(w,'handshake',rack,{fromX:e.x});message(w,'這件外套很有禮貌！',rack.x,rack.depth);}
   else if((p.x-e.x)*t.direction>=0&&Math.abs(p.x-e.x)<175&&sameLane(p,t)&&p.y>GROUND-65)w.hit(e,p,e.spec.damage,20,{ignoreGuard:true,height:'grab'});
   stopMob(e,1.65);return true;
  }
  s.hazards.push(h);stopMob(e,s.kind==='rush'?1.9:1.35);return true;
 }
 e.face=dir;e.aiWait-=dt;
 // Approach first: attacks do not begin from distant, unreadable spawns.
 const range=s.kind==='handshake'?165:260;
 if(Math.abs(dx)>range){if(Math.abs(dx)<680){e.x+=dir*e.spec.speed*w.tuning.speed*dt;e.move=dir;}return true;}
 if(e.aiWait>0||!sameLane(e,target))return true;
 const lure=e.chapterLure??p;e.chapterLure=null;
 const delay=(s.kind==='handshake'?1:.85)*w.tuning.windup;
 e.chapterTell={x:lure.x,depth:lure.depth??0,direction:Math.sign(lure.x-e.x)||dir,delay,age:0};
 e.attack={kind:'punch',age:0,windup:delay,fired:false,variant:'left',chapterOwned:true};e.warning=delay;e.chapterCaption=s.tell;
 return true;
}
export function updateChapterEncounter(w,dt){
 const s=w.chapterEncounter;if(!s)return;s.time+=dt;
 const p=w.player;
 const actors=[p,...(w.enemies??[w.enemy])].filter(Boolean);
 for(const e of actors)if(e.chapterLure){e.chapterLure.life-=dt;if(e.chapterLure.life<=0)e.chapterLure=null;}
 for(const g of s.gates??[])if(g.pending!==null){g.wait=Math.max(0,g.wait-dt);const occupied=actors.some(a=>a.hp>0&&a.y>g.y&&a.x>g.left-44&&a.x<g.right+44&&Math.abs((a.depth??0)-g.pending)<g.depthHalf);if(!g.wait&&!occupied){g.depth=g.pending;g.pending=null;g.prop.flash=.8;effect(w,'redirect',{x:(g.left+g.right)/2,depth:-g.depth});}}
 for(const e of w.enemies??[w.enemy])if(e?.chapterTell&&(!e.attack||e.stun>0||e.hp<=0))stopMob(e);
 for(const prop of s.props){prop.cooldown=Math.max(0,prop.cooldown-dt);prop.flash=Math.max(0,prop.flash-dt);prop.lureTime=Math.max(0,(prop.lureTime??0)-dt);
  if(prop.vx){const old=prop.x,dir=Math.sign(prop.vx);let next=clamp(prop.x+prop.vx*dt,90,(w.worldWidth??960)-90);
   for(const t of w.platforms??[])if(sameLane(prop,t,(t.depthHalf??36)+12)&&between(dir>0?t.left-42:t.right+42,old,next)){next=dir>0?t.left-42:t.right+42;prop.vx=0;effect(w,'crash',prop);}
   prop.x=next;prop.roll=(prop.roll??0)+(next-old)/12;prop.vx*=Math.exp(-2.4*dt);if(Math.abs(prop.vx)<20)prop.vx=0;
   for(const e of w.enemies??[w.enemy])if(e?.hp>0&&sameLane(e,prop,42)&&between(e.x,Math.min(old,prop.x)-38,Math.max(old,prop.x)+38)&&prop.vx){e.stun=Math.max(e.stun,1);stopMob(e);prop.vx=0;prop.flash=.8;effect(w,'crash',prop);message(w,'急件請走樓梯！',prop.x,prop.depth);}
  }
 }
 for(const h of s.hazards){
  if(h.dead)continue;
  if(h.owner.hp<=0||(h.kind==='rush'&&h.owner.stun>0)){h.dead=true;continue;}
  const old=h.x;h.age+=dt;
  if(h.kind==='route'){
   if(!h.hits.has(p)&&Math.abs(p.x-h.x)<h.radius&&sameLane(p,h)&&p.y>GROUND-65){h.hits.add(p);w.hit(h.owner,p,h.damage,20,{origin:h});}
  }else{
   const speed=h.kind==='rush'?340:h.kind==='paper'?280:250;
   if(h.kind==='paper'&&!h.returned&&h.age>.7){h.returned=true;h.direction*=-1;h.hits.clear();}
   h.x+=h.direction*speed*dt;
   const block=s.props.find(q=>q.active&&sameLane(q,h,42)&&between(q.x,old-h.direction*12,h.x+h.direction*12));
   if(block){h.dead=true;block.flash=.7;if(h.kind==='rush'){h.owner.stun=1.2;stopMob(h.owner,1.5);effect(w,'crash',block);}if(h.kind==='sound')effect(w,'absorb',block,{direction:h.direction});if(h.kind==='paper')receivePaper(w,block,h.owner,h.damage);continue;}
   if(h.kind==='rush'){const before={x:h.owner.x,depth:h.owner.depth};h.owner.depth=h.depth;h.owner.x=clamp(h.x,55,w.worldWidth-80);w.resolveTableMotion?.(h.owner,before);h.owner.move=h.direction;if(Math.abs(h.owner.x-h.x)>2){h.dead=true;stopMob(h.owner);continue;}}
   if(!h.hits.has(p)&&sameLane(p,h)&&between(p.x,Math.min(old,h.x)-35,Math.max(old,h.x)+35)&&p.y>GROUND-100){h.hits.add(p);const origin={x:p.x-h.direction*40,depth:h.depth,face:h.direction};w.hit(h.owner,p,h.damage,24,{origin,contact:h.kind==='rush'});}
  }
  if(h.age>h.life||h.owner.hp<=0)h.dead=true;
 }
 for(const q of s.parcels??[]){q.age+=dt;if(q.delay>0){q.delay-=dt;continue;}const old=q.x;q.x+=q.direction*360*dt;
  for(const e of w.enemies??[w.enemy])if(e?.hp>0&&sameLane(e,q)&&e.y>GROUND-130&&between(e.x,Math.min(old,q.x)-30,Math.max(old,q.x)+30)){
   const origin={x:e.x-q.direction*40,depth:q.depth,face:q.direction};
   if(s.boss)w.resolveHit({from:p,to:e,raw:q.damage,knock:16,impact:'chen_dream',direction:q.direction,castId:q.castId,origin,height:'mid',contact:false,guardCost:1});
   else w.hit(p,e,q.damage,16,{origin,projectile:true,contact:false,impact:'chen_dream'});
   effect(w,'stamp',{x:e.x,depth:q.depth});q.dead=true;break;
  }if(q.age>q.life)q.dead=true;
 }
 s.parcels=(s.parcels??[]).filter(q=>!q.dead);for(const e of s.effects??[])e.age+=dt;s.effects=(s.effects??[]).filter(e=>e.age<e.life);
 s.hazards=s.hazards.filter(h=>!h.dead);for(const n of s.notes)n.life-=dt;s.notes=s.notes.filter(n=>n.life>0);
}
/** Bosses retain the accepted Duel and its three moves. Only scene props react. */
export function installBossEncounter(w,chapter){
 ensureChapterEncounter(w,chapter,true);const request=w.request.bind(w),step=w.step.bind(w),resolveHit=w.resolveHit.bind(w),updateProjectiles=w.updateProjectiles.bind(w);
 w.request=function(f,action){const ok=request(f,action);if(ok&&action==='punch')interactChapterProp(this,f);return ok;};
 w.step=function(dt,...args){if(this.status==='active'&&this.freeze<=0)updateChapterEncounter(this,Math.min(.034,Math.max(0,dt)));return step(dt,...args);};
 // Intercept before Duel resolves contacts, including a complete crossing in one tick.
 // Both scene objects retain their ground placement; high arcs clear their tops.
 w.updateProjectiles=function(dt){const s=this.chapterEncounter;
  for(const q of this.projectiles??[])if(!q.dead&&q.owner!==this.player){
   const end=q.x+q.vx*Math.min(dt,q.life),prop=s.props.find(p=>p.active&&between(p.x,Math.min(q.x,end)-45,Math.max(q.x,end)+45));
   if(prop&&((s.kind==='paper'&&q.kind==='dream')||(s.kind==='route'&&prop.cooldown>0&&q.kind==='word'&&q.y>GROUND-160))){q.dead=true;prop.flash=.65;if(s.kind==='paper')receivePaper(this,prop,q.owner,q.damage);else effect(this,'redirect',prop);message(this,s.joke,prop.x,0);}
  }
  return updateProjectiles(dt);
 };
 w.resolveHit=function(contact){const s=this.chapterEncounter,{from:source,to:target,impact}=contact;
  const prop=target===this.player&&covered(s,source,target);
  if(prop&&((s.kind==='sound'&&impact==='huang_shout')||(s.kind==='rush'&&impact==='su_rush')||(s.kind==='handshake'&&impact==='ma_handshake'&&prop.cooldown>0))){
   prop.flash=.65;effect(this,s.kind==='sound'?'absorb':s.kind==='rush'?'crash':'handshake',prop,{direction:source.face,fromX:source.x});if(s.kind!=='sound'){source.stun=Math.max(source.stun,1);source.attack=null;source.performance=null;}message(this,s.joke,prop.x,0);return false;
  }
  return resolveHit(contact);};
 return w;
}
