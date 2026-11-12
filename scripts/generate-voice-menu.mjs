import {readFileSync,writeFileSync} from 'node:fs';
import {VOICE_SLOTS,playableVoice} from '../dist/voice-slots.mjs';
import {CAST} from '../dist/roster.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ordered=['coin',...Object.values(CAST).flatMap(c=>c.moves.map(m=>m.kind)).filter(k=>k!=='coin')].filter(playableVoice);
const options=ordered.map(kind=>{const c=Object.values(CAST).find(c=>c.moves.some(m=>m.kind===kind));const v=VOICE_SLOTS[kind];const source=v.sourceFile?.endsWith('.mp3')?'使用者提供':v.sourceFile?'錄影試剪':v.userProvided?'使用者提供':v.catalogProvided?'語錄站':'既有原片';return `<option value="${kind}">${esc(c.name)} · ${esc(v.label)} · ${source}</option>`;}).join('');
const file='dist/index.html',html=readFileSync(file,'utf8');
if(!/<select id="voice-sample">[\s\S]*?<\/select>/.test(html))throw Error('Voice menu marker not found');
writeFileSync(file,html.replace(/<select id="voice-sample">[\s\S]*?<\/select>/,`<select id="voice-sample">${options}</select>`));
