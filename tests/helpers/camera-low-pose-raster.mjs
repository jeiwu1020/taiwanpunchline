import {createCanvas,loadImage} from '@napi-rs/canvas';
import {ART_FILES,drawFighterArt} from '../../dist/art-render.mjs';
import {Duel} from '../../dist/core.mjs';
export const lowPoseCast=['wang','han','ma','su','huang','chen','ko'];
export async function loadLowPoseArt(){
 const images={},keys=['wang-parts','han-parts','art-limbs','left-arms','roster-costumes','final-costumes','roster-props','wang-roll','wang-shock','han-shock','han-shout','han-lotus-body',...lowPoseCast.map(c=>c+'-head')];
 for(const key of keys)images[key]=await loadImage(new URL('../../dist/assets/'+ART_FILES[key],import.meta.url).pathname);return images;
}
export function lowPoseActor(type,pose={}){return {...new Duel(type,'easy',()=>.2,'han',{mode:'training',trainingBehavior:'stand'}).player,x:700,y:430,vy:0,depth:0,face:1,assist:{helper:null},...pose};}
export function lowPoseSamples(){return [
 ...lowPoseCast.flatMap(type=>[0,.5,1].map(crouchBlend=>({name:`${type}-crouch-${crouchBlend}`,actor:lowPoseActor(type,{crouchBlend})}))),
 ...[.12,.16,.20,.24,.28,.32,.36,.40,.44,.48,.50,.56].map(age=>({name:`wang-rush-${age}`,actor:lowPoseActor('wang',{attack:{kind:'rush',age}})})),
 ...[.06,.12,.4,.7,.97,1.02].map(age=>({name:`han-knee-${age}`,actor:lowPoseActor('han',{attack:{kind:'han_knee',age}})}))
 ];}
export function rasterLowPose(images,actor,{headOnly=false,time=0}={}){
 const canvas=createCanvas(768,768),raw=canvas.getContext('2d');raw.translate(384,600);raw.scale(actor.face||1,1);
 const heads=new Set(Object.entries(images).filter(([key])=>key.endsWith('-head')||['wang-shock','han-shock','han-shout'].includes(key)).map(([,image])=>image));
 const ctx=headOnly?new Proxy(raw,{get(t,k){if(k==='drawImage')return(img,...args)=>{if(heads.has(img))t.drawImage(img,...args);};return typeof t[k]==='function'?t[k].bind(t):t[k];},set(t,k,v){t[k]=v;return true;}}):raw;
 drawFighterArt(ctx,images,actor,time,{shadow:false});const pixels=raw.getImageData(0,0,768,768).data;let left=768,right=0,top=768,bottom=0,total=0;
 for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(pixels[(y*768+x)*4+3]>=16){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);total++;}
 const width=right-left,height=bottom-top,stride=width+1,sums=new Uint32Array(stride*(height+1));
 for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){row+=pixels[((y+top)*768+x+left)*4+3]>=16?1:0;sums[(y+1)*stride+x+1]=sums[y*stride+x+1]+row;}}
 return {left:left-384,right:right-384,top:top-600,bottom:bottom-600,width,height,total,sums,stride};
}
// Count alpha pixel centres in the union, not summed rectangle areas. This
// handles overlapping parent/buttons exactly and never treats CSS as opaque.
export function alphaCoverage(raster,frame,actor,rectangles){
 const clamp=(v,n)=>Math.max(0,Math.min(n,v)),z=frame.zoom,anchorY=actor.y+(actor.depth||0)*.65;
 const rects=rectangles.map(r=>({
  left:clamp(Math.ceil((r.left-frame.width/2)/z+frame.x-actor.x-.5)-raster.left,raster.width),
  right:clamp(Math.ceil((r.right-frame.width/2)/z+frame.x-actor.x-.5)-raster.left,raster.width),
  top:clamp(Math.ceil((r.top-frame.height/2)/z+frame.y-anchorY-.5)-raster.top,raster.height),
  bottom:clamp(Math.ceil((r.bottom-frame.height/2)/z+frame.y-anchorY-.5)-raster.top,raster.height)
 })).filter(r=>r.left<r.right&&r.top<r.bottom);
 const ys=[...new Set(rects.flatMap(r=>[r.top,r.bottom]))].sort((a,b)=>a-b),{sums:s,stride:w}=raster;let covered=0;
 const area=(l,t,r,b)=>s[b*w+r]-s[b*w+l]-s[t*w+r]+s[t*w+l];
 for(let i=1;i<ys.length;i++){const top=ys[i-1],bottom=ys[i],xs=rects.filter(r=>r.top<=top&&r.bottom>=bottom).sort((a,b)=>a.left-b.left);let left=null,right=0;
  for(const r of xs){if(left===null){left=r.left;right=r.right;}else if(r.left<=right)right=Math.max(right,r.right);else{covered+=area(left,top,right,bottom);left=r.left;right=r.right;}}
  if(left!==null)covered+=area(left,top,right,bottom);
 }
 return {total:raster.total,covered,outside:raster.total-covered,fraction:covered/raster.total};
}
