import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stylesAt} from './helpers/css-contracts.mjs';
const read=()=>readFileSync(new URL('../dist/interface-v30.css',import.meta.url),'utf8');
const t='.app[data-touch="true"][data-layout]',l='.app[data-touch="true"][data-layout="landscape"]',p='.app[data-touch="true"][data-layout="portrait"]',d='.app[data-touch="false"]';
const css=(sels,width=568,height=320)=>stylesAt(read(),sels,{width,height});
test('V30 phone dock uses one short row with attack and stationary guard side by side',()=>{
 assert.equal(css([t+' .cabinet',l+' .cabinet'])['grid-template-rows'],'minmax(0,1fr) 70px');
 assert.equal(css([t+' .control-deck'])['grid-template-columns'],'64px minmax(0,1fr) 54px 54px');
 assert.equal(css([t+' .basic'])['grid-column'],'3');assert.equal(css([t+' .touch-aux'])['grid-column'],'4');
 assert.equal(css([t+' .touch-aux button'])['min-width'],'48px');
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');const aux=html.match(/<div class="touch-aux">([\s\S]*?)<div class="movement">/)[1];
 assert.match(aux,/data-hold="guard"/);
 // Four-way challenge owns an explicit jump, but VS must keep its existing
 // one-button auxiliary dock. Check the visibility contract, not DOM absence.
 assert.match(aux,/id="challenge-jump"[^>]*data-action="jump"/);
 const streetCSS=readFileSync(new URL('../dist/combat-ui-v68.css',import.meta.url),'utf8');
 assert.equal(stylesAt(streetCSS,['#challenge-jump'],{width:568,height:320}).display,'none');
 assert.equal(stylesAt(streetCSS,['#challenge-jump','.app[data-depth-route=true] #challenge-jump'],{width:568,height:320}).display,'flex');
 assert.equal(stylesAt(streetCSS,['.app[data-depth-route=true][data-touch=true] .touch-aux button'],{width:390,height:844})['min-height'],'44px');
});
test('HUD is a separate grid row and actual canvas has no HUD overlay reserve',()=>{
 assert.equal(css(['.app .stage-wrap']).display,'grid');
 assert.equal(css(['.app #game']).position,'relative');assert.equal(css(['.app #game'])['grid-row'],'2');
 assert.equal(css(['.app .dom-hud']).position,'relative');assert.equal(css(['.app .dom-hud'])['grid-row'],'1');
 assert.equal(css([t+' .stage-wrap',l+' .stage-wrap'])['grid-template-rows'],'54px minmax(0,1fr)');
});
test('upright and desktop save stage space without eliminating required controls',()=>{
 assert.equal(css([p+' .cabinet'],320,568)['grid-template-rows'],'minmax(0,1fr) 160px');
 assert.equal(css([d+' .cabinet'],1180,757)['grid-template-rows'],'minmax(0,1fr) 62px');
 assert.equal(css([d+' .under'],1180,757).display,'none');
 assert.equal(css([p+' .specials'],320,568)['grid-column'],'1 / -1');
});

test('short desktop keeps move cards horizontal despite inherited landscape styles',()=>{assert.equal(css([d+' .specials'],844,390)['flex-direction'],'row');});

import{createHash}from'node:crypto';
test('historical sources and version notes stay intact except the current audio URL and corrected voice behavior',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),a=html.indexOf('<div id="settings-legacy"'),b=html.indexOf('</details>',a);
 // Normalize only the approved current-playback corrections. All clip source,
 // license, attribution and historical edit details keep the original checksum.
 const preserved=html.slice(a,b)
  .replace('assets/voice/coin-user-selected-v31.wav','assets/voice/han-fa-da-cai-20190513.mp3')
  .replace('不是逐字對嘴動畫。現行對戰使用四路獨立原音，成功發招後各路依序播完，不以新句截斷舊句。','不是逐字對嘴動畫，雙方語音分開播放；每次成功發招立即播放對應音訊，同一角色的新招接替舊句，不再略過新句或排隊。')
  .replace('我方主角、對手主角與雙方助拳的四路原音各自依出招順序播完，不會互相截斷；同一角色選在不同位置也分開播放。暫停、靜音、重新開局或離開對戰會停止語音並清空待播。試聽一次只播單句，會先停止對戰語音；音效可與語音並存。','對戰最多同時播放雙方各一句，同一角色的新招即時接替舊句；試聽只播單句並停止對戰語音。音效可與語音並存。');
 assert.equal(createHash('sha256').update(preserved).digest('hex'),'cf56caa788bcfdb684161cb8925d549c6794afebdbb0ade5c01069a86b57ab21');
});
test('upright status gets its own row so armor cannot wrap the guard label over HP',()=>{assert.equal(css([p+' .hud-status'],320,568)['grid-row'],'4');assert.equal(css([p+' .guard-row'],320,568)['grid-column'],'1 / -1');assert.equal(css([p+' .stage-wrap'],320,568)['grid-template-rows'],'64px minmax(0,1fr)');});
test('extra narrow logical landscape reserves enough height for long names and purposes',()=>{assert.match(read(),/\.app\{container-type:inline-size\}/);assert.match(read(),/@container\(max-width:520px\)\{\.app\[data-touch="true"\]\[data-layout="landscape"\] \.cabinet\{grid-template-rows:minmax\(0,1fr\) 82px\}/);});
test('short desktop attack text stays stacked and readable instead of inheriting a squeezed row',()=>{assert.equal(css([d+' .basic button'],844,390)['flex-direction'],'column');});
