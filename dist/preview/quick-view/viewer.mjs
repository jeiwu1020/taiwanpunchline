import {createQuickViewTools,bindQuickViewSize} from './header.mjs';
import {showIsolationFailure} from './failure.mjs';
import {quickViewAllowed,createQuickViewStorage,resetQuickViewChapter} from './session.mjs';
export function setupQuickView(window){
 const document=window.document,tools=createQuickViewTools(document),root=tools.root;
 bindQuickViewSize(root,document);
 const status=root.querySelector('#status'),frame=document.querySelector('#game'),load=root.querySelector('#load'),select=root.querySelector('#chapter'),advance=root.querySelector('#advance'),failure=document.querySelector('#failure-status');
 if(!quickViewAllowed(window.location.hostname)||window.parent!==window){
  failure.textContent='此功能僅限指定預覽版。正式版不提供快速通關。';failure.hidden=false;frame.remove();root.querySelector('.controls').hidden=true;status.textContent=failure.textContent;
  return {tools};
 }
 const initial=Number(new URL(window.location.href).searchParams.get('chapter'));
 if(Number.isInteger(initial)&&initial>=1&&initial<=6)select.value=String(initial);
 let handler=null,busy=false;const preparedDocuments=new WeakSet();
 function prepareDocument(gameDocument){
  tools.prepare(gameDocument);
  if(preparedDocuments.has(gameDocument))return;preparedDocuments.add(gameDocument);
  // Natural chapter links do not run enter(). Rescue the adopted shadow tree
  // before the departing iframe tears down its document and event listeners.
  gameDocument.defaultView.addEventListener('pagehide',()=>{
   if(tools.host.ownerDocument===gameDocument)session.clearHandler();
  });
 }
 const session={frame,local:createQuickViewStorage(),tab:createQuickViewStorage(),
  clearHandler(){handler=null;busy=false;advance.disabled=true;tools.mount(document);if(frame.contentDocument)prepareDocument(frame.contentDocument);},
  setHandler(next,gameDocument){handler=next;busy=false;advance.disabled=false;if(gameDocument){prepareDocument(gameDocument);tools.mount(gameDocument);}},
  report(text){status.textContent=text;},
  fail(source){if(source!==frame.contentWindow)return false;session.clearHandler();showIsolationFailure({frame,status:failure},source);failure.hidden=false;status.textContent=failure.textContent;tools.open();return true;}
 };
 Object.defineProperty(window,'__quickViewSession',{value:session});
 advance.onclick=async()=>{
  if(busy||!handler)return;
  const current=handler;busy=true;advance.disabled=true;
  try{const ok=await current();if(handler===current)session.report(ok?'已跳過目前路段／回合。請收合工具並按遊戲內的繼續，漫畫不會略過。':'目前不能跳過。請先開始、關閉選單或繼續漫畫。');}
  catch{if(handler===current)session.report('此段未能跳過，可正常遊玩或重新進入。原存檔不受影響。');}
  finally{if(handler===current){busy=false;advance.disabled=false;}}
 };
 function enter(){
  session.clearHandler();frame.hidden=false;failure.hidden=true;tools.close();
  const chapter=Number(select.value);resetQuickViewChapter(session,chapter);
  frame.src=chapter===1?'/?challengeOverview=1':chapter===6?'/preview/finale/?campaign=1&profile=slot-1':`/preview/chapter${chapter}/?campaign=1&profile=slot-1`;
  status.textContent='不讀寫原存檔。先按遊戲內的開始／接續；快速過關只跳過路段或回合，漫畫照常。工具收合與展開均不改變遊戲尺寸。切換章節保留本次音訊／側轉／視野設定。';
 }
 load.disabled=false;load.onclick=enter;enter();
 return {tools,session};
}
if(typeof window!=='undefined')setupQuickView(window);
