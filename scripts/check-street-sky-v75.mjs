// Native Canvas composite of the actual production retained-layer renderer.
// Does not stand in for Safari/browser QA; checks real image alpha and placement.
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthBackdropLayout,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
const out=new URL('../docs/qa-v75-sky/',import.meta.url);mkdirSync(out,{recursive:true});
const paths={
 'challenge-street-deep':new URL('../dist/assets/challenge/street-deep-v2.webp',import.meta.url).pathname,
 'challenge-street-facade':process.argv[2]||new URL('../dist/assets/challenge/street-facade-v75.webp',import.meta.url).pathname,
 'challenge-street-sky':process.argv[3]||new URL('../dist/assets/challenge/street-sky-v75.webp',import.meta.url).pathname
};
const art=Object.fromEntries(await Promise.all(Object.entries(paths).map(async([key,path])=>[key,await loadImage(path)]))),results=[];
for(const [width,height,touch]of [[844,390,true],[390,844,true],[320,568,true],[1280,800,false]]){
 const textures=new Map(),tiles=[];
 const scene={textures:{createCanvas(key,w,h){const canvas=createCanvas(w,h),texture={canvas,width:w,height:h,refreshes:0,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,setSize(w,h){canvas.width=this.width=w;canvas.height=this.height=h;},refresh(){this.refreshes++;}};textures.set(key,texture);return texture;}},add:{image(x,y,key){const tile={key,visible:true,setOrigin(){return this;},setDepth(v){this.depth=v;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.width=w;this.height=h;return this;},setFlipX(v){this.flipX=v;return this;},setVisible(v){this.visible=v;return this;}};tiles.push(tile);return tile;}}};
 const renderer=createDepthBackdropRenderer(scene,art),ratio=Math.max(1,Math.min(2,2560/width,1800/height)),canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
 for(const [pose,y,depth,x]of [['stand',430,0,1100],['jump',53,-90,1750],['land',430,100,1950]]){
  const frame=depthRouteCameraFrame(width,height,{player:{x,y,depth},worldWidth:3600},{fullStage:true,touch,portrait:width<height}),bg=depthBackdropLayout(frame);
  renderer.draw(bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);
  const skies=tiles.filter(t=>t.key==='challenge-depth-sky'&&t.visible);assert.equal(skies.length,1);
  ctx.resetTransform();ctx.clearRect(0,0,width,height);ctx.scale(frame.zoom,frame.zoom);ctx.translate(-bg.camera,-bg.top);
  for(const tile of tiles.filter(t=>t.visible).sort((a,b)=>a.depth-b.depth)){
   const image=textures.get(tile.key).canvas;ctx.save();ctx.translate(tile.x,tile.y);if(tile.flipX){ctx.translate(tile.width,0);ctx.scale(-1,1);}ctx.drawImage(image,0,0,tile.width,tile.height);ctx.restore();
  }
  ctx.resetTransform();const pixels=ctx.getImageData(0,0,width,height).data;let minAlpha=255,badPixels=0;
  for(let i=3;i<pixels.length;i+=4){minAlpha=Math.min(minAlpha,pixels[i]);if(pixels[i]<255)badPixels++;}
  assert.equal(badPixels,0,`${width}x${height} ${pose} has uncovered/transparent pixels`);
  const name=`street-${width}x${height}-${pose}.png`;writeFileSync(new URL(name,out),canvas.toBuffer('image/png'));
  results.push({viewport:[width,height],pose,zoom:frame.zoom,minAlpha,badPixels,skyLayers:skies.length,facadeTiles:tiles.filter(t=>t.key==='challenge-depth-backdrop'&&t.visible).length,skyRefreshes:textures.get('challenge-depth-sky').refreshes,image:name});
 }
 assert.equal(textures.get('challenge-depth-sky').refreshes,1,'camera jump or horizontal movement cannot repaint/repeat the fixed sky');
}
writeFileSync(new URL('native-canvas-results.json',out),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
