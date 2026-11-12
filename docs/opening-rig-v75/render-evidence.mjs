// Real production Canvas evidence. Pass an installed @napi-rs/canvas module path.
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {ART_FILES} from '../../dist/art-render.mjs';
import {CHALLENGE_ART_FILES} from '../../dist/challenge-art.mjs';
import {paintOpeningComic} from '../../dist/challenge-opening-art.mjs';
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(process.argv[2])));
const root=new URL('../../',import.meta.url),out=new URL('../qa-v75-opening/articulated/',import.meta.url);mkdirSync(out,{recursive:true});
const images={};for(const[key,file]of Object.entries({...ART_FILES,...CHALLENGE_ART_FILES}))images[key]=await loadImage(new URL('dist/assets/'+file,root).pathname);
let count=0;
for(const character of ['wang','han','ma','su','huang','chen','ko'])for(const[w,h]of [[844,390],[390,700]])for(const group of ['wake','scenes']){
 const canvas=createCanvas(w*3,h+30),ctx=canvas.getContext('2d');
 for(let i=0;i<3;i++){
  const shot=group==='wake'?'wake':['bulletin','wardrobe','chase'][i],time=group==='wake'?[0,780,1800][i]:2400;
  const frame=createCanvas(w,h),state=paintOpeningComic(frame.getContext('2d'),images,{shot},character,w,h,time);
  if(state.mode!=='articulated'||state.scenes!==1)throw Error('Not one articulated scene');
  ctx.drawImage(frame,i*w,0);count++;
 }
 ctx.fillStyle='#fff3d3';ctx.fillRect(0,h,w*3,30);ctx.fillStyle='#173239';ctx.font='16px sans-serif';
 ctx.fillText(character+' | '+(group==='wake'?'wake 0 / 780 / 1800 ms':'bulletin / wardrobe / chase')+' | production Canvas; not browser screenshots',10,h+20);
 writeFileSync(new URL(character+(group==='scenes'?'-scenes':'')+'-'+w+'.png',out),canvas.toBuffer('image/png'));
}
console.log(JSON.stringify({rendered:count}));
