import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dist=process.env.RELEASE_DIST?resolve(process.env.RELEASE_DIST):resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const imp=p=>import(pathToFileURL(resolve(dist,p)).href);
async function chapter(number){
 const dir=`preview/chapter${number}`,tag=number===4?'chapter4':'chapter2';
 const [assets,art,backdrop,renderer,core]=await Promise.all([
  imp(`${dir}/${tag}-assets.mjs`),imp(`${dir}/${tag}-new-art.mjs`),imp(`${dir}/street-backdrop.mjs`),imp(`${dir}/art-render.mjs`),imp(`${dir}/core.mjs`)
 ]);
 const source=readFileSync(resolve(dist,dir,`${tag}-playable.mjs`),'utf8');
 const expression=source.match(/const allFiles=(\{[^;]+\});let loaded=0;/)?.[1];assert.ok(expression,'actual preload declaration');
 const files=new Function('SKY_EXTENSION_FILES','STREET_SEAM_FILES','ASSET_FILES','CHAPTER2_NEW_ART','CHAPTER4_NEW_ART','ART_FILES',`return (${expression})`)(backdrop.SKY_EXTENSION_FILES,backdrop.STREET_SEAM_FILES,assets.ASSET_FILES,art.CHAPTER2_NEW_ART,art.CHAPTER4_NEW_ART,renderer.ART_FILES);
 let assetURL=file=>'assets/'+file;
 if(existsSync(resolve(dist,'preview/shared-asset-urls.mjs'))){const shared=await imp('preview/shared-asset-urls.mjs');assetURL=file=>shared.chapterAssetURL(`chapter${number}`,file);}
 return {dir,source,files,assetURL,renderer,core};
}
function checkingCanvas(){return new Proxy({}, {get(target,key){
 if(key==='drawImage')return image=>assert.ok(image,'every rendered image must be preloaded');
 if(key==='createLinearGradient'||key==='createRadialGradient')return()=>({addColorStop(){}});
 if(key==='measureText')return()=>({width:10});
 return ()=>{};
},set(target,key,value){target[key]=value;return true;}});}
for(const number of [2,3,4]){
 test(`chapter ${number} resolves actual preload files and seven portraits`,async()=>{
  const c=await chapter(number);
  for(const file of [...Object.values(c.files),...Object.values(c.core.CAST).map(v=>v.portrait.replace(/^assets\//,''))])assert.ok(existsSync(resolve(dist,c.dir,c.assetURL(file))),file);
 });
 test(`chapter ${number} renders every previously unlocked character and move from its preload`,async()=>{
  const c=await chapter(number),images=Object.fromEntries(Object.keys(c.files).map(k=>[k,{key:k}]));
  for(const id of Object.keys(c.core.CAST)){
   const fighter=new c.core.Duel(id,'beginner',()=>.5,id).player;
   c.renderer.drawFighterArt(checkingCanvas(),images,fighter,0);
   for(const move of c.core.CAST[id].moves)for(const age of [.1,.3,.6,1,1.6]){
    const actor={...fighter,attack:{kind:move.kind,age,hit:false}};
    c.renderer.drawFighterArt(checkingCanvas(),images,actor,1000);
   }
  }
 });
}
