/** Fixed-scale street-ground regression using production draws and real assets.
 * Native Canvas rendering only: this is not a phone screenshot or browser FPS.
 * Usage: node scripts/check-street-ground-v74.mjs /path/to/@napi-rs/canvas/index.js
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {drawChallengeBackdrop} from '../dist/challenge-art.mjs';
import {createDepthBackdropRenderer} from '../dist/challenge-backdrop-cache.mjs';
import {depthBackdropLayout,depthRouteCameraFrame} from '../dist/challenge-depth-render.mjs';
const modulePath=process.argv[2];if(!modulePath)throw new Error('Pass an installed @napi-rs/canvas module path. No new production dependency is required.');
const {createCanvas,loadImage}=await import(pathToFileURL(resolve(modulePath)));
const root=new URL('../',import.meta.url),baseline='7362f532b2c93ad929d8ba3cc177b5cee50df68d';
const toModule=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const baselineArt=execFileSync('git',['show',`${baseline}:dist/challenge-art.mjs`],{cwd:root,encoding:'utf8'}).replace("'./art-motion.mjs?v=44'",JSON.stringify(new URL('../dist/art-motion.mjs?v=44',import.meta.url).href));
const before=await import(toModule(baselineArt));
const baselineCache=readFileSync(new URL('../dist/challenge-backdrop-cache.mjs',import.meta.url),'utf8').replace("'./challenge-art.mjs?v=69'",JSON.stringify(toModule(baselineArt)));
const {createDepthBackdropRenderer:beforeRenderer}=await import(toModule(baselineCache));
const source=await loadImage(new URL('../dist/assets/challenge/street-deep-v2.webp',import.meta.url).pathname),images={'challenge-street-deep':source};
const draw=(fn,options)=>{const c=createCanvas(options.width,options.height);fn(c.getContext('2d'),images,options);return c;};
const options={width:1488,height:556,curbY:220,buildingHeight:489,camera:700,top:0,bottom:1068};
const old=draw(before.drawChallengeBackdrop,options),fixed=draw(drawChallengeBackdrop,options),edge=220+309*489/715;
const oldPixels=old.getContext('2d').getImageData(0,0,1488,556).data,newPixels=fixed.getContext('2d').getImageData(0,0,1488,556).data;
let originalChanged=0;for(let i=0;i<1488*(Math.floor(edge)-1)*4;i++)if(oldPixels[i]!==newPixels[i])originalChanged++;
assert.equal(originalChanged,0,'existing scene pixels above the one-pixel antialiased edge stay identical');
const short=draw(drawChallengeBackdrop,{width:800,height:1600,curbY:715,buildingHeight:715,bottom:1600});
const retained=draw(drawChallengeBackdrop,{width:800,height:1600,curbY:715,buildingHeight:715,bottom:2400});
assert.deepEqual(short.getContext('2d').getImageData(0,0,800,1600).data,retained.getContext('2d').getImageData(0,0,800,1600).data,'extra retained coverage must not rescale or move the visible grain');
function variation(data){let horizontal=0,vertical=0,n=0;for(let y=480;y<550;y++)for(let x=4;x<1484;x++){const i=(y*1488+x)*4;horizontal+=Math.abs(data[i]-data[i+4]);vertical+=Math.abs(data[i]-data[i+1488*4]);n++;}return {horizontal:horizontal/n,vertical:vertical/n};}
const grainBefore=variation(oldPixels),grainAfter=variation(newPixels);
assert.ok(grainAfter.vertical>grainBefore.vertical*4,'the repaired ground has real vertical grain instead of stretched columns');
const benchmarks=[];
for(const [width,height]of [[828,272],[390,592],[1200,750]])for(const [name,factory]of [['before',beforeRenderer],['after',createDepthBackdropRenderer]]){
 let refreshes=0,resizes=0,texture;const scene={textures:{createCanvas(key,w,h){const canvas=createCanvas(w,h);return texture={width:w,height:h,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,setSize(w,h){resizes++;this.width=canvas.width=w;this.height=canvas.height=h;},refresh(){refreshes++;}};}},add:{image(){return {setOrigin(){return this;},setDepth(){return this;},setPosition(){return this;},setDisplaySize(){return this;},setFlipX(){return this;},setVisible(){return this;}};}}};
 const renderer=factory(scene,images),ratio=Math.max(1,Math.min(2,2560/width,1800/height)),times=[];let firstMs;
 for(let i=0;i<150;i++){
  const route={player:{x:1100+i*2,y:430-377*Math.max(0,Math.sin(i*Math.PI/60)),depth:5+95*Math.cos(i*.05)},worldWidth:3600};
  const bg=depthBackdropLayout(depthRouteCameraFrame(width,height,route)),start=performance.now();renderer.draw(bg,Math.ceil(width*ratio)/bg.width,Math.ceil(height*ratio)/bg.height);
  const elapsed=performance.now()-start;if(i===0)firstMs=elapsed;else times.push(elapsed);
 }
 assert.equal(refreshes,1,'walking, depth travel and table jumps reuse one retained build');assert.equal(resizes,1,'only initial allocation may resize');
 times.sort((a,b)=>a-b);benchmarks.push({name,viewport:[width,height],frames:150,refreshes,resizes,texture:[texture.width,texture.height],firstBuildMs:+firstMs.toFixed(3),reuseP95Ms:+times[Math.floor(times.length*.95)].toFixed(4)});
}
const outputDir=new URL('../docs/qa-v74/',import.meta.url);mkdirSync(outputDir,{recursive:true});
const head=48,out=createCanvas(1488,(556+head)*2+48),ctx=out.getContext('2d');
for(const [i,c]of [old,fixed].entries()){
 const y=i*(556+head);ctx.fillStyle='#fff5db';ctx.fillRect(0,y,1488,head);ctx.fillStyle='#183a43';ctx.font='24px serif';ctx.fillText(i?'AFTER: same-scale asphalt grain, staggered overlaps':'BEFORE: final 16 source rows stretched into the retained cache',14,y+32);ctx.drawImage(c,0,y+head);
}
ctx.fillStyle='#fff5db';ctx.fillRect(0,out.height-48,1488,48);ctx.fillStyle='#183a43';ctx.font='21px serif';ctx.fillText('Production Canvas render, not a phone screenshot. Fixed 1488 x 556 layout; cache bottom includes 512 world units.',14,out.height-17);
writeFileSync(new URL('ground-before-after.png',outputDir),out.toBuffer('image/png'));
const report={scope:'Real production draw functions and native Canvas pixels. Not browser, phone, GPU or FPS measurement.',baseline,originalSceneChangedChannelValuesAboveEdgeAA:originalChanged,visiblePixelsInvariantAcrossBottom:[1600,2400],grainBefore,grainAfter,benchmarks};
writeFileSync(new URL('ground-check.json',outputDir),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
