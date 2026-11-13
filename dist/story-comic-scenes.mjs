// One visual script shared by normal play and quick view. No progress, dialogue,
// combat moves, or save rules live here. Each frame stages its existing text.
const CAST=['wang','han','huang','su','ko','ma','chen'];
const NAMES={恰吉王:'wang',韓國魚:'han',咆哮哥:'huang',電火球:'su',柯P:'ko',小馬哥:'ma',阿扁仔:'chen'};
const BOSS={1:'huang',2:'su',3:'ko',4:'ma',5:'chen'};
const PREVIOUS={2:'huang',3:'su',4:'ko',5:'ma'};
const pose={
 wang:{talk:2,react:2,celebrate:0,mic:1,push:3,inspect:2,point:2,listen:2},
 han:{talk:2,react:1,celebrate:2,mic:2,push:2,inspect:1,point:0,listen:1,bump:3},
 huang:{talk:0,react:1,celebrate:3,mic:0,push:0,inspect:2,point:0,listen:2,count:1},
 su:{talk:0,react:3,celebrate:0,mic:2,push:1,inspect:2,point:0,listen:3},
 ko:{talk:3,react:1,celebrate:3,mic:3,push:2,inspect:0,point:2,listen:1},
 ma:{talk:1,react:3,celebrate:1,mic:1,push:2,inspect:1,point:0,listen:1,handshake:0},
 chen:{talk:0,react:0,celebrate:0,mic:0,push:2,inspect:1,point:0,listen:0,drop:3}
};
const actor=(id,action='talk',extra={})=>({id,action,pose:pose[id]?.[action]??0,...extra});
function cast(lead,second,ids,leadAction='talk',secondAction='react'){
 const ordered=[...new Set([lead,second,...ids].filter(Boolean))];
 const slots=[...ordered].sort((a,b)=>CAST.indexOf(a)-CAST.indexOf(b));
 return ordered.map((id,i)=>{const x=(slots.indexOf(id)+.5)/slots.length;return actor(id,i===0?leadAction:i===1?secondAction:'listen',i<2?{x,foot:.98,height:.88,face:x<=.5?1:-1,layer:i===0?2:1}:{x,foot:.62,height:.35,face:x<=.5?1:-1,layer:0});});
}
const chapterStages={
 1:{entry:['sound-trail','follow-mic'],boss:['challenge','answer'],handoff:['handover','listen-mic','sound-bounce']},
 2:{entry:['sound-trail','follow-mic','broadcast'],boss:['reveal','agreement','listen-mic'],handoff:['handover','ribbon-catch','follow-parade']},
 3:{entry:['ribbon-follow','read-tag','broadcast'],boss:['untie-ribbon','agreement','arrange-truck'],handoff:['read-route','load-truck','follow-truck']},
 4:{entry:['unload-truck','inspect-stand','broadcast'],boss:['lock-stand','agreement','handshake'],handoff:['assign-return','load-truck','follow-truck']},
 5:{entry:['unload-truck','inspect-stand','read-tag'],boss:['read-list','agreement','read-manual'],handoff:['handover','objection','team-count','park-mic']}
};
const ending=[
 {action:'celebrate',lead:'player',other:'huang',leadAction:'celebrate',otherAction:'celebrate',prop:'mic',holder:'player'},
 {action:'dead-mic',lead:'player',other:'su',leadAction:'mic',otherAction:'react',prop:'mic',holder:'player'},
 {action:'check-mic',lead:'su',other:'player',leadAction:'mic',otherAction:'react',prop:'mic',holder:'su'},
 {action:'inspect-battery',lead:'chen',other:'ko',leadAction:'inspect',prop:'battery-front',holder:'chen'},
 {action:'question-battery',lead:'huang',other:'chen',leadAction:'talk',otherAction:'inspect',holder:'chen'},
 {action:'turn-battery',lead:'ko',other:'chen',leadAction:'inspect',otherAction:'talk',prop:'battery-map',holder:'ko'},
 {action:'read-map',lead:'ko',other:'chen',leadAction:'point',otherAction:'inspect',holder:'chen'},
 {action:'find-stairs',lead:'player',other:'ko',leadAction:'react',otherAction:'point',backdrop:'comic-mural-hall'},
 {action:'descend',lead:'ma',other:'player',leadAction:'talk',backdrop:'comic-hidden-stairs'},
 {action:'try-door',lead:'ma',other:'wang',leadAction:'push',otherAction:'react',focus:'door-push',backdrop:'comic-door-closed',prop:'closed-door'},
 {action:'push-door',lead:'su',other:'ma',leadAction:'push',otherAction:'react',focus:'door-push',backdrop:'comic-door-closed',prop:'closed-door'},
 {action:'crowded-door',lead:'han',other:'chen',leadAction:'bump',otherAction:'inspect',backdrop:'comic-door-closed',prop:'closed-door',holder:'chen'},
 {action:'accidental-key',lead:'chen',other:'han',leadAction:'drop',otherAction:'bump',backdrop:'comic-door-closed',prop:'battery-key',holder:'chen'},
 {action:'discover-key',lead:'chen',other:'han',leadAction:'talk',otherAction:'react',backdrop:'comic-door-closed',prop:'battery-key'},
 {action:'leave-key',lead:'ko',other:'chen',leadAction:'point',otherAction:'react',backdrop:'comic-door-closed',prop:'battery-key'},
 {action:'open-door',lead:'player',other:'huang',leadAction:'react',otherAction:'listen',backdrop:'comic-door-open',prop:'open-door'},
 {action:'look-inside',lead:'player',other:'ko',leadAction:'talk',otherAction:'listen',backdrop:'comic-door-open',prop:'open-door'},
 {action:'cross-threshold',lead:'player',other:'han',leadAction:'react',otherAction:'listen',backdrop:'corridor'}
];

export function storyComicScene(chapterId,state){
 const player=state.characterId??'wang',frame=state.storyFrame??{},index=state.frameIndex??0,speaking=NAMES[frame.speaker];
 if(chapterId==='finale-3v4'){
  const resolve=id=>id==='player'?player:id;
  const shot=state.mode==='intro'?[
   {action:'three-against-four',lead:'huang',other:'han',leadAction:'count',otherAction:'react'},
   {action:'bald-retort',lead:'han',other:'huang',leadAction:'point',otherAction:'react'},
   {action:'referee-bell',lead:'huang',other:'han',leadAction:'react',otherAction:'talk'}
  ][index]:ending[index];
  if(!shot)throw new RangeError('Unknown finale comic frame');
  const lead=resolve(shot.lead),second=resolve(shot.other),team=state.team??[player,...CAST.filter(id=>id!==player).slice(0,2)];
  const micHolder=state.mode==='story'?(index<2?player:index<9?'su':'wang'):null;
  return {...shot,id:`finale:${state.mode}:${index}`,chapterId,framing:state.mode==='story'&&index<15?'close':'wide',speakerId:speaking??null,backdrop:shot.backdrop??'finale-arena',
   holder:resolve(shot.holder),micHolder,actors:cast(lead,second,CAST,shot.leadAction,shot.otherAction).map(a=>({...a,team:team.includes(a.id)?0:1,...(a.id==='wang'&&a.id!==micHolder&&a.action==='celebrate'?{pose:pose.wang.react,action:'react'}:{}),...(a.id===micHolder?{pose:a.id==='wang'&&index===0?0:pose[a.id].mic,action:'mic',...(!['wang','su'].includes(a.id)?{variant:`${a.id}-held-mic`}:{})}:{}),...(state.mode==='story'&&index===5&&a.id==='ko'?{variant:'ko-battery',action:'inspect'}:{})})),
   team:[...team],motion:shot.action==='accidental-key'?'bump-drop-slide':shot.action==='open-door'?'doors-apart':shot.action==='cross-threshold'?'walk-in':'acting',
   revealAt:shot.action==='accidental-key'?.62:null};
 }
 const n=Number(chapterId.split('-').at(-1));if(!chapterStages[n])throw new RangeError('Unknown comic chapter');
 const step=state.stepId??'entry',boss=BOSS[n],previous=PREVIOUS[n],mini=step.startsWith('miniboss');
 const segment=step==='entry'?'entry':step==='handoff-comic'?'handoff':'boss';
 const action=mini?(index===0?'stop-player':index%2?'answer-miniboss':'miniboss-warning'):chapterStages[n][segment][index];
 if(!action)throw new RangeError('Unknown chapter comic frame');
 const revealed=!mini&&segment!=='entry',allowed=CAST.slice(0,n+1),ensemble=[player];
 // Before a Boss reveal, only companions from completed chapters can appear.
 if(previous&&n>=3)ensemble.push(previous);
 if(speaking&&speaking!==player&&allowed.includes(speaking)&&(![boss].includes(speaking)||revealed))ensemble.push(speaking);
 if(revealed)ensemble.push(boss);
 // Narrators describe visible work too. Do not infer the entire cast only
 // from the current speaker: these named actions must have an acting role.
 if(n===4&&segment==='handoff'&&index===0)ensemble.push('ko','su');
 if(n===5&&segment==='entry'&&index===0)ensemble.push('ma','ko');
 if(n===5&&segment==='handoff'&&index>=1)ensemble.push(...CAST);
 const lead=n===5&&segment==='entry'&&index===0?'ma':speaking&&ensemble.includes(speaking)?speaking:player;
 const second=n===5&&segment==='entry'&&index===0?'ko':ensemble.find(id=>id!==lead);
 const actors=cast(lead,second,ensemble,action==='handshake'?'handshake':action==='inspect-stand'?'point':/read|route|manual/.test(action)&&lead==='ko'?'inspect':'talk');
 if(n===4&&segment==='handoff'&&index===0||n===5&&segment==='entry'&&index===0){
  for(const a of actors){if(a.id==='ko'){a.action='inspect';a.pose=pose.ko.inspect;}if(a.id==='su'){a.action='point';a.pose=pose.su.point;}}
 }
 const crew=n===3&&segment==='handoff'&&index===1||n===4&&(segment==='entry'&&index===0||segment==='handoff'&&index===1);
 if(crew){
  for(const a of actors){a.height*=.76;a.x*=.7;}
  actors.push({id:'stagehand',mob:true,role:'stagehand',x:.78,foot:.98,height:.84,face:-1,layer:2,action:'carry-cable-box',pose:0});
 }
 const miniId=frame.shot??(step==='miniboss-a'?'mini_mic':'mini_guard');
 if(mini){const playerActor=actors.find(a=>a.id===player);actors.splice(0,actors.length,playerActor);}
 if(mini)actors.push({id:miniId,mob:true,x:.74,foot:.98,height:.86,face:-1,layer:2,action:'announce',pose:0});
 if(mini){actors[0].x=.23;actors[0].face=1;actors[0].height=.77;}
 const route=step==='entry'||step==='miniboss-a'?0:step==='miniboss-b'?1:2;
 const backdrop=n===1?'challenge-street':`chapter${n===3?2:n}-scene-${route}`;
 const prop=mini?'gate':n===1?'flying-mic':n===2?(segment==='entry'?'flying-mic':segment==='handoff'&&index===1?'lifting-mic':segment==='handoff'&&index===2?'ribbon-mic':'resting-mic'):segment==='entry'&&n===3?'ribbon-mic':/truck/.test(action)?'truck-stand':'mic-stand';
 return {id:`${chapterId}:${step}:${index}`,chapterId,action,backdrop,actors,speakerId:frame.speaker==='場務工讀生'?'stagehand':speaking??(mini&&!['旁白','你','player'].includes(frame.speaker)?miniId:null),prop,
  holder:null,micState:prop==='resting-mic'?'resting-on-open-stand':n<3?'out-of-reach':'locked-to-stand',bossRevealed:revealed,motion:/follow|trail/.test(action)?'travel':/load|push/.test(action)?'transport':action==='ribbon-catch'?'ribbon-lift':action==='sound-bounce'?'sound-bounce':'acting'};
}

export const CHAPTER_COMIC_FRAME_COUNTS=Object.freeze({1:{boss:2,handoff:3},2:{entry:3,boss:3,handoff:3},3:{entry:3,boss:3,handoff:3},4:{entry:3,boss:3,handoff:3},5:{entry:3,boss:3,handoff:4},finale:{intro:3,ending:18}});
