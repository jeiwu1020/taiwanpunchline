import assert from 'node:assert/strict';
import {ART_FILES} from '../../dist/art-render.mjs';
import {CHALLENGE_ART_FILES} from '../../dist/challenge-art.mjs';
// DOM Canvas and Phaser are browser boundaries. The stand-in retains the
// browser's first-getContext-wins behavior, then records real paint calls.
export function sceneFixture(){
 const textures=new Map(),images=[],draws=[];let canvasCount=0;
 const document={createElement(tag){assert.equal(tag,'canvas');canvasCount++;let attributes;
  const ctx=new Proxy({globalAlpha:1,measureText:s=>({width:s.length*18}),drawImage(image,...args){draws.push({image,args});},getContextAttributes:()=>attributes},{get:(o,k)=>o[k]??(()=>{})});
  const canvas={ownerDocument:document,width:0,height:0,getContext(type,options){assert.equal(type,'2d');attributes??={willReadFrequently:!!options?.willReadFrequently};return ctx;}};ctx.canvas=canvas;return canvas;
 }};
 const manager={
  createCanvas(key,w,h){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return this.addCanvas(key,canvas);},
  // Keep explicit paint/build completions separate from Phaser's implicit
  // resize refresh. Native recovery tests also exercise total upload refreshes.
  addCanvas(key,canvas){const context=canvas.getContext('2d',{willReadFrequently:true}),texture={width:canvas.width,height:canvas.height,getContext:()=>context,getCanvas:()=>canvas,setSize(w,h=w){if(w===this.width&&h===this.height)return this;this.width=canvas.width=w;this.height=canvas.height=h;this.resizeRefreshes=(this.resizeRefreshes??0)+1;return this;},refresh(){this.refreshes=(this.refreshes??0)+1;return this;}};textures.set(key,texture);return texture;}
 };
 const scene={sys:{game:{canvas:{ownerDocument:document}}},textures:manager,add:{image(x,y,key){const image={key,visible:true,setTexture(k){this.key=k;return this;},setOrigin(){return this;},setFlipX(v){this.flipX=v;return this;},setDepth(v){this.depth=v;return this;},setVisible(v){this.visible=v;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.width=w;this.height=h;return this;}};images.push(image);return image;}}};
 return {scene,textures,images,draws,get canvasCount(){return canvasCount;}};
}
// Historical cache tests deliberately exercise legacy fallback; V75 layered tests add both new images explicitly.
export const artImages=Object.fromEntries(Object.keys({...ART_FILES,...CHALLENGE_ART_FILES}).filter(id=>!['challenge-arena-layer','challenge-arena-sky','challenge-street-facade','challenge-street-sky','challenge-street-left-repair','challenge-street-right-repair'].includes(id)).map(id=>[id,{id,width:1536,height:1024}]));

