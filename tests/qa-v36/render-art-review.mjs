// Local visual audit. CANVAS_MODULE may name a compatible @napi-rs/canvas install.
import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
import {ART_FILES,drawFighterArt} from '../../dist/art-render.mjs';import {CAST} from '../../dist/core.mjs';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const images=Object.fromEntries(await Promise.all(Object.entries(ART_FILES).map(async([key,file])=>[key,await loadImage(new URL('../../dist/assets/'+file,import.meta.url).pathname)])));
const typeArg=process.argv.find(a=>a.startsWith('--type='))?.split('=')[1],mirror=process.argv.includes('--mirror');
let selected=process.argv.includes('--all')?Object.entries(CAST).flatMap(([type,c])=>[['idle',0],...c.moves.flatMap(m=>[.08,.28,.55,.8].map(u=>[m.kind,u*m.duration]))].map(([kind,age])=>({type,kind,age}))):[{type:'su',kind:'su_dare',age:.4},{type:'huang',kind:'huang_debt',age:.3},{type:'ma',kind:'ma_cough',age:.3},{type:'wang',kind:'counter',age:.3},{type:'ma',kind:'ma_handshake',age:.25},{type:'chen',kind:'chen_calm',age:.3}];
if(process.argv.includes('--peaks'))selected=Object.entries(CAST).flatMap(([type,c])=>c.moves.map(m=>({type,kind:m.kind,age:.4*m.duration})));
if(typeArg)selected=selected.filter(x=>x.type===typeArg);
const cols=typeArg||process.argv.includes('--peaks')?3:process.argv.includes('--all')?7:3,cellW=400,cellH=480,canvas=createCanvas(cols*cellW,Math.ceil(selected.length/cols)*cellH),ctx=canvas.getContext('2d');ctx.fillStyle='#e9e4d8';ctx.fillRect(0,0,canvas.width,canvas.height);
for(const [i,{type,kind,age}] of selected.entries()){ctx.save();ctx.translate((i%cols)*cellW,Math.floor(i/cols)*cellH);ctx.fillStyle='#19383a';ctx.font='18px sans-serif';ctx.fillText(`${type} ${kind} ${age.toFixed(2)}s`,12,25);ctx.translate(mirror?240:160,445);ctx.scale(mirror?-1.45:1.45,1.45);drawFighterArt(ctx,images,{type,y:430,face:mirror?-1:1,move:0,guard:false,stun:0,reaction:0,attack:kind==='idle'?null:{kind,age}},age*1000);ctx.restore();}
const out=process.argv.find(a=>a.endsWith('.png'))||'docs/v36/limb-review.png';await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,canvas.toBuffer('image/png'));console.log(out);
