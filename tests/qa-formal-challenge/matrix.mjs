// In-page integration runner. Real DOM handlers, real rendered layout/save APIs.
// Synthetic outcome controls remain separate and explicitly recorded.
export function installMatrix({loadFormal,capture,saveReport,frame,events}){
const $=s=>document.querySelector(s);let stopped=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
async function until(fn,label,timeout=25000){const start=performance.now();while(!fn()){if(stopped)throw Error('Matrix stopped');if(performance.now()-start>timeout)throw Error('Timeout: '+label);await delay(40);}await settle();}
const checks=[];
function verify(label){const o=capture(label),problems=[];if(!o.formal)problems.push('Not formal runtime');if(o.document[0]>o.size[0]+1||o.document[1]>o.size[1]+1)problems.push('Document overflow '+o.document);const slot=o.regions.find(r=>r.selector==='#campaign-bar');if(!slot||Math.abs(Math.max(slot.rect.w,slot.rect.h)-104)>.5||Math.abs(Math.min(slot.rect.w,slot.rect.h)-32)>.5)problems.push('Save slot not104x32');const canvas=o.regions.find(r=>r.selector==='#game-canvas');if(!canvas||canvas.rect.w<100||canvas.rect.h<100)problems.push('Actual game canvas not rendered');const modal=o.controls.some(c=>c.modal);for(const c of o.controls)if(!c.disabled&&(!modal&&c.combatControl)&&c.outside)problems.push('Control outside '+c.id+'/'+c.text);const check={label,passed:!problems.length,problems};checks.push(check);events.push({assertions:check});if(problems.length)throw Error(problems.join('; '));return o;}
function doc(){return frame.contentDocument;}
async function click(selector){const e=doc().querySelector(selector);if(!e||e.disabled||e.hidden)throw Error('Missing/disabled UI '+selector);e.scrollIntoView({block:'nearest',inline:'nearest'});await settle();const r=e.getBoundingClientRect(),hit=doc().elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!r.width||!r.height||!hit||!(hit===e||e.contains(hit)))throw Error('UI center unreachable '+selector+' hit '+(hit?.id||hit?.tagName));e.click();events.push({uiClick:selector});await delay(80);await settle();}
const mode=()=>doc()?.body?.dataset.chapterMode;
async function injected(action){frame.contentWindow.postMessage({formalQA:true,action},location.origin);events.push({controlledWorldInjection:action});await delay(120);await settle();}
async function load(n,config,step='entry'){for(const [id,value]of Object.entries({chapter:String(n),step,size:config.size,rotate:String(config.rotate),camera:config.camera,safe:config.safe}))$('#'+id).value=value;await loadFormal();await until(()=>doc()?.body?.dataset.campaignMode==='true'&&doc().querySelector('#campaign-prepare'),'formal asset entry');await settle();}
const result=[];
$('#stop-matrix').onclick=()=>{stopped=true;};
$('#matrix').onclick=async()=>{stopped=false;const configs=[];for(const camera of ['classic','stable'])for(const preset of [
 ['portrait390','390,844',false,'0,0'],['portrait375','375,667',false,'0,0'],['native','844,390',false,'0,0'],['native-left','844,390',false,'44,0'],['native-right','844,390',false,'0,44'],['sideways','390,844',true,'0,0'],['desktop1440','1440,900',false,'0,0'],['desktop1280','1280,720',false,'0,0']])configs.push({name:preset[0],size:preset[1],rotate:preset[2],safe:preset[3],camera});
 try{for(const n of [2,3,4])for(const config of configs){if(stopped)throw Error('Matrix stopped');const key=`chapter${n}-${config.name}-${config.camera}`;$('#status').textContent='Matrix '+key;try{
 await load(n,config);verify(key+'-story');
 await click('#campaign-prepare');verify(key+'-preparation');await click('#preparationCancel');
 while(mode()==='story')await click('#story-next');await until(()=>mode()==='route','street');verify(key+'-street');
 await click('#pause');verify(key+'-pause');await click('#restart-match');verify(key+'-restart-confirm');await click('#restart-cancel');
 await click('#help');verify(key+'-settings');await click('#close-help');await click('#resume');
 await injected('gate');await until(()=>mode()==='story','mini story');verify(key+'-mini-story');while(mode()==='story')await click('#story-next');verify(key+'-mini-battle');
 await injected('loss');await until(()=>mode()==='result','mini result');verify(key+'-mini-result');
 await load(n,config,'boss');verify(key+'-boss');await injected('win');await until(()=>mode()==='result','BO3 result');verify(key+'-boss-result');
 await click('#result-next');await until(()=>mode()==='battle','BO3 next round');verify(key+'-boss-round2');
 result.push({key,passed:true});
 }catch(e){const item={key,passed:false,error:String(e.stack)};result.push(item);events.push(item);capture(key+'-FAILED');}
 await saveReport();}
 }catch(e){events.push({matrixError:String(e)});}finally{events.push({matrixResults:result,assertionResults:checks});await saveReport();$('#status').textContent=`Matrix finished: ${result.filter(x=>x.passed).length}/${result.length} cases passed; `+result.filter(x=>!x.passed).map(x=>x.key+': '+x.error.split('\n')[0]).join('; ');}}
}
