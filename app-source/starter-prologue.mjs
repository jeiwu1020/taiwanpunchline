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
  {id:'wake',art:'wake',bubbles:[bubble('電視','快報！神麥失蹤！','broadcast'),bubble(speaker,wang?'本來應該從容睡覺，\n現在連夢都被搶麥！':'鄉親啊，天沒亮，\n麥就先開講？')]},
  ...COMMON_NEWS,
  {id:'window',art:'window',bubbles:[bubble('窗外','神麥在這啦！','offscreen'),bubble(speaker,wang?'睡得匆匆忙忙，\n外面倒喊得從從容容！':'有神麥，聲音出去，\n人潮就進來啦！')]},
  {id:'wardrobe',art:'wardrobe',bubbles:[bubble(speaker,wang?'先吃一口，\n才有力氣問到底！':'早餐帶出來，\n氣勢喊出來！')]},
  {id:'chase',art:'chase',bubbles:[bubble(speaker,wang?'我還沒問，\n你就連滾帶爬？':'麥留下來！\n鄉親還沒聽我講！')]},
  {id:'street',art:'street',bubbles:[bubble(speaker,wang?'你也追來了？\n這麥比早餐還熱門！':'老兄也來啦？\n那就一起把麥追回來！'),bubble(NAMES[wang?'han':'wang'],wang?'人跟上來，麥追回來！\n先追，等一下再聊！':'別從容聊天了！\n再聊就只能連滾帶爬！')],entry:{chapterId:'chapter-1',checkpoint:0,sectionId:'street'}},
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
