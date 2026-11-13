import {bindQuickViewHelp,bindQuickViewSize} from './header.mjs';
import {showIsolationFailure} from './failure.mjs';
import {quickViewAllowed,createQuickViewStorage,resetQuickViewChapter} from './session.mjs';
bindQuickViewHelp(document);
bindQuickViewSize(document);
const status=document.querySelector('#status'),frame=document.querySelector('#game'),load=document.querySelector('#load'),select=document.querySelector('#chapter');
if(!quickViewAllowed(location.hostname)||window.parent!==window){
 status.dataset.failure='true';status.setAttribute('role','alert');status.textContent='此功能僅限指定預覽版。正式版不提供快速通關。';frame.remove();document.querySelector('.controls').hidden=true;
}else{
 const initial=Number(new URL(location.href).searchParams.get('chapter'));
 if(Number.isInteger(initial)&&initial>=1&&initial<=6)select.value=String(initial);
 let handler=null;
 const session={frame,local:createQuickViewStorage(),tab:createQuickViewStorage(),clearHandler(){handler=null;},setHandler(next){handler=next;},report(text){status.textContent=text;},fail(source){handler=null;return showIsolationFailure({frame,status},source);}};
 Object.defineProperty(window,'__quickViewSession',{value:session});
 function enter(){
  frame.hidden=false;status.setAttribute('role','status');delete status.dataset.failure;
  session.clearHandler();
  const chapter=Number(select.value);resetQuickViewChapter(session,chapter);
  frame.src=chapter===1?'/?challengeOverview=1':chapter===6?'/preview/finale/?campaign=1&profile=slot-1':`/preview/chapter${chapter}/?campaign=1&profile=slot-1`;
  status.textContent='預覽限定，不讀寫原存檔。載入後按遊戲內的開始／接續。漫畫與選角照常操作；遊戲內「快速過關」按一次跳過一回合。切換章節只重設進度，音訊／側轉／視野設定會保留到離開或重整本頁。';
 }
 load.disabled=false;load.onclick=enter;

 enter();
}
