/** Production Canvas frames, not screenshots or a browser/phone performance test.
 * node scripts/render-opening-v74.mjs /path/to/installed/@napi-rs/canvas/index.js
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {OPENING_SHEETS} from '../dist/challenge-opening-assets.mjs';
import {paintOpeningComic} from '../dist/challenge-opening-art.mjs';
const modulePath=process.argv[2];if(!modulePath)throw new Error('Pass an installed native Canvas module path.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(modulePath)));
const root=new URL('../',import.meta.url),out=new URL('../docs/qa-v74/',import.meta.url);mkdirSync(out,{recursive:true});
const images={},checks=[];
for(const sheet of Object.values(OPENING_SHEETS)){
 const path=new URL('dist/assets/'+sheet.file,root).pathname;
 if(!existsSync(path)){console.log('Pending asset: '+sheet.character);continue;}
 const image=await loadImage(path);images[sheet.key]=image;
 assert.equal(image.width,sheet.width);assert.equal(image.height,sheet.height);
 for(const [x,y,w,h]of sheet.panels)assert.ok(x>=0&&y>=0&&x+w<=image.width&&y+h<=image.height);
 checks.push({character:sheet.character,width:image.width,height:image.height,panels:sheet.panels});
 for(const [name,width,height]of [['portrait',720,1296],['landscape',1000,620]]){
  const montage=createCanvas(width*2,height*2+48),ctx=montage.getContext('2d');
  for(const [i,shot]of ['bulletin','wake','wardrobe','chase'].entries()){
   const canvas=createCanvas(width,height),state=paintOpeningComic(canvas.getContext('2d'),images,{shot},sheet.character,width,height,2400);
   assert.equal(state.ready,true);if(shot==='wake')writeFileSync(new URL(`opening-${sheet.character}-${name}-wake.png`,out),canvas.toBuffer('image/png'));ctx.drawImage(canvas,i%2*width,Math.floor(i/2)*height);
  }
  ctx.fillStyle='#fff3d3';ctx.fillRect(0,height*2,width*2,48);ctx.fillStyle='#173239';ctx.font='21px sans-serif';ctx.fillText(sheet.character+' | Production native Canvas render, not a phone screenshot | Bulletin / Wake / Breakfast / Chase',18,height*2+30);
  writeFileSync(new URL(`opening-${sheet.character}-${name}.png`,out),montage.toBuffer('image/png'));
 }
}
assert.equal(checks.length,Object.keys(OPENING_SHEETS).length,'all seven runtime sheets must be present before final QA');
writeFileSync(new URL('opening-assets-check.json',out),JSON.stringify({scope:'Saved production artwork dimensions, measured panel bounds, real production renderer in native Canvas. Not browser/phone validation.',assets:checks},null,2)+'\n');
console.log(JSON.stringify({rendered:checks.map(x=>x.character),count:checks.length}));
