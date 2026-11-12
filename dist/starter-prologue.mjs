/** Isolated preview data. No storage, rewards, combat, or production imports. */
const NAMES={wang:'恰吉王',han:'韓國魚'};
const bubble=(speaker,text,kind='speech')=>({speaker,text,kind});
const news=(id,bubbles,art)=>({id,news:true,art,bubbles:bubbles.map(text=>bubble('晨間快報',text,'broadcast'))});
const COMMON_NEWS=[
 news('legend',['據傳，對神麥說的話\n都能成真。','昔日不少領袖，\n靠它掌握政權。'],'legend'),
 news('seal',['力量太強，\n只好封進議會殿堂。','如今神麥失蹤，\n全城搶著找！'],'seal'),
];
export function starterPrologue(characterId){
 if(typeof characterId!=='string'||!Object.hasOwn(NAMES,characterId))throw new RangeError('Unsupported starter character');
 const wang=characterId==='wang',speaker=NAMES[characterId];
 return structuredClone([
  {id:'wake',art:'wake',bubbles:[bubble('電視','快報！神麥失蹤！','broadcast'),bubble(speaker,wang?'連睡個覺，\n都有人搶麥。':'什麼事，\n比早餐還早？')]},
  ...COMMON_NEWS,
  {id:'window',art:'window',bubbles:[bubble('窗外','神麥在這啦！','offscreen'),bubble(speaker,wang?'鬧鐘都下班了，\n外面還在吵？':'有這支，\n還用喊到燒聲？')]},
  {id:'wardrobe',art:'wardrobe',bubbles:[bubble(speaker,wang?'我只講兩句，\n早餐先拿著。':'先吃飽，\n才有力氣講！')]},
  {id:'chase',art:'chase',bubbles:[bubble(speaker,wang?'看到我要講，\n就跑喔？':'別跑！\n我還沒開始講！')]},
  {id:'street',art:'street',bubbles:[bubble(speaker,'你也來了？'),bubble(NAMES[wang?'han':'wang'],'先追！\n等一下再聊！')],entry:{chapterId:'chapter-1',checkpoint:0,sectionId:'street'}},
 ].map(scene=>({...scene,characterId,fictional:true,description:scene.news?'電視正在播放遊戲世界的虛構新聞。':({wake:'主角在同一天清晨被鬧鐘與新聞吵醒。',window:'新聞中的金色神麥從窗外飛過。',wardrobe:'主角換好衣服，拿著早餐準備出門。',chase:'主角追著神麥來到街頭。',street:'恰吉王與韓國魚在同一街口會合，追向同一個方向。'}[scene.id])})));
}
/** The eventual game integration supplies profile state; this function never writes it. */
export function prologueEntry({chapterId='chapter-1',checkpoint=0,completed=false,prologueSeen,openingState,isReplay=false,review=false}={}){
 if(review)return 'review';
 const unseen=openingState===undefined?prologueSeen===false:openingState==='unseen';
 return chapterId==='chapter-1'&&checkpoint===0&&!completed&&unseen&&!isReplay?'new-run':'continue';
}
export function createProloguePlayer({characterId,mode='new-run',context={},onComplete=()=>{}}={}){
 if(!['new-run','review'].includes(mode))throw new RangeError('Unsupported prologue mode');
 const scenes=starterPrologue(characterId),initialContext=structuredClone(context);let index=0,bubbleIndex=0,done=false;
 function finish(reason){if(done)return;done=true;onComplete({reason,characterId,context:structuredClone(initialContext),entry:structuredClone(scenes.at(-1).entry),markSeen:mode==='new-run',startChallenge:mode==='new-run'});}
 return {get index(){return index;},get scene(){return {...structuredClone(scenes[index]),visibleBubbleCount:bubbleIndex+1};},get count(){return scenes.length;},get done(){return done;},
  next(){if(done)return;if(bubbleIndex<scenes[index].bubbles.length-1)bubbleIndex++;else if(index<scenes.length-1){index++;bubbleIndex=0;}else finish('complete');},
  previous(){if(done)return;if(bubbleIndex>0)bubbleIndex--;else if(index>0){index--;bubbleIndex=scenes[index].bubbles.length-1;}},
  replay(){index=0;bubbleIndex=0;done=false;},skip(){finish('skip');},close(){done=true;}
 };
}
