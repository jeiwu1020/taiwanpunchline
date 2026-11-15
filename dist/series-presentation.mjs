const roundWords=['','第一','第二','第三'];
export function roundName(round){const index=Math.max(1,Math.trunc(Number(round)||1));return `${roundWords[index]??`第 ${index}`}局`;}
export function roundAnnouncement({format='single',round=1,training=false}={}){
 if(training)return '自由練習！';
 return format==='best-of-three'?`三戰兩勝 ${roundName(round)}！`:'一局決勝！';
}
export function predictRoundResult(series,winner){
 if(!series)return null;const score={...series.score};if(winner==='player'||winner==='enemy')score[winner]++;
 const complete=score.player>=series.target||score.enemy>=series.target;
 return {round:series.round,score,complete,winner:complete?winner:null,roundWinner:winner,draw:winner==='draw'};
}
export function roundResultCopy(result,format='single',playerName='你',enemyName='對手'){
 const score=result?.score??{player:0,enemy:0},player=score.player??0,enemy=score.enemy??0,round=Math.max(1,Math.trunc(Number(result?.round)||1)),series=format==='best-of-three',scoreText=`${player}：${enemy}`;
 if(result?.draw){
  return {eyebrow:series?'局間結果':'本局結果',title:series?`${roundName(round)}平手`:'本局平手',subtitle:series?'重賽本局，勝局不變。':'一局決勝，本局平手，重賽決定勝者。',score:series?`三戰兩勝 · 目前比分 ${scoreText}`:'一局決勝',action:series?`重賽${roundName(round)} →`:'重賽本局 →',complete:false};
 }
 if(result?.complete){
  const winnerName=result.winner==='player'?playerName:enemyName;
  return {eyebrow:series?'對戰結果':'本局結果',title:series?`勝負已分！${winnerName}拿下這場對戰`:`勝負已分！${winnerName}贏下本局`,subtitle:series?'這場對戰已結束。':'本局結果已定。',score:series?`三戰兩勝 · 最終比分 ${scoreText}`:'一局決勝',action:null,complete:true};
 }
 const winnerName=result?.roundWinner==='player'?playerName:enemyName;
 const subtitle=result?.roundWinner==='player'?'再贏 1 局即可拿下這場對戰。':'這場對戰還沒結束，你仍可追平。';
 return {eyebrow:'局間結果',title:`${winnerName}拿下${roundName(round)}！`,subtitle,score:`三戰兩勝 · 目前比分 ${scoreText}`,action:`進入${roundName(round+1)} →`,complete:false};
}
export function chapterRoundResultCopy(state,enemyName='對手'){
 const rounds=state?.rounds??{player:0,enemy:0},sum=(rounds.player??0)+(rounds.enemy??0),draw=state?.result?.winner==='draw',complete=!!(state?.result?.matchWon||state?.result?.matchLost);
 const winner=state?.result?.matchWon?'player':state?.result?.matchLost?'enemy':null;
 return roundResultCopy({round:Math.max(1,draw?sum+1:sum),score:rounds,complete,winner,roundWinner:state?.result?.winner,draw},state?.stepId==='boss'?'best-of-three':'single','你',enemyName);
}
function microphone(documentRef){
 const ns='http://www.w3.org/2000/svg',svg=documentRef.createElementNS(ns,'svg'),image=documentRef.createElementNS(ns,'image');
 svg.setAttribute('viewBox','1186 543 192 444');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 image.setAttribute('href',new URL('./assets/challenge/opening-props-v75.png',import.meta.url).href);image.setAttribute('x','0');image.setAttribute('y','0');image.setAttribute('width','1536');image.setAttribute('height','1024');svg.append(image);return svg;
}
export function setSeriesWinMarkers(documentRef,playerWins=0,enemyWins=0,enabled=true){
 for(const [id,wins,name] of [['p-series-wins',playerWins,'你'],['e-series-wins',enemyWins,'對手']]){
  const node=documentRef.getElementById(id);if(!node)continue;const count=enabled?Math.max(0,Math.floor(Number(wins)||0)):0;
  if(node.dataset.wins===String(count))continue;
  node.dataset.wins=String(count);node.replaceChildren();node.hidden=count===0;node.setAttribute('aria-label',`${name}已拿下 ${count} 局`);node.setAttribute('role','img');
  for(let i=0;i<count;i++)node.append(microphone(documentRef));
 }
}
export function mountChapterCountdown({documentRef=document,getState,getChapter,onStart}){
 const panel=documentRef.getElementById('series-countdown'),formatNode=documentRef.getElementById('series-countdown-format'),numberNode=documentRef.getElementById('series-countdown-number');let activeToken=null,timer=null;
 const hide=()=>{clearTimeout(timer);timer=null;activeToken=null;if(panel)panel.classList.add('hidden');};
 function sync(state=getState?.()){
  if(!panel||!formatNode||!numberNode||state?.mode!=='countdown'){hide();return;}
  if(activeToken===state.token)return;
  hide();activeToken=state.token;const token=state.token,series=state.stepId==='boss',round=(state.rounds?.player??0)+(state.rounds?.enemy??0)+1;
  panel.dataset.phase='intro';formatNode.textContent=roundAnnouncement({format:series?'best-of-three':'single',round});numberNode.textContent='';panel.classList.remove('hidden');
  const values=['3','2','1','開麥！'];
  const show=index=>{
   const current=getState?.();if(activeToken!==token||current?.token!==token||current?.mode!=='countdown'){hide();return;}
   panel.dataset.phase='counting';numberNode.textContent=values[index];
   if(index<values.length-1){timer=setTimeout(()=>show(index+1),480);return;}
   timer=setTimeout(()=>{const chapter=getChapter?.();if(activeToken!==token||chapter?.beginBattle?.(token)!==true){hide();return;}hide();const battle=getState?.();if(documentRef.hidden&&battle?.mode==='battle')chapter.setPaused(true,battle.token);onStart?.();},480);
  };
  timer=setTimeout(()=>show(0),850);
 }
 return {sync,hide};
}
