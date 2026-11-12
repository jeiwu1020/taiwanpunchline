// Native Canvas pixel audit of the production boss renderer, not browser/Safari QA.
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createChallengeRenderer} from '../dist/challenge-render.mjs';
import {fullStageCameraFrame} from '../dist/combat-presentation.mjs';
import {cameraFrame,stableCameraFrame} from '../dist/arena-presentation.mjs';
import {DESK} from '../dist/stage-expansion.mjs';
import {JUMP_SPEED,GRAVITY} from '../dist/combat-rules.mjs';
const out=new URL('../docs/qa-v76-boss/',import.meta.url);mkdirSync(out,{recursive:true});
const art={};for(const [key,file]of Object.entries({'challenge-arena':'arena-v2.webp','challenge-street-sky':'street-sky-v75.webp','challenge-street':'street-v1.webp','challenge-street-props':'street-props-v2.webp'}))art[key]=await loadImage(new URL('../dist/assets/challenge/'+file,import.meta.url).pathname);
function fixture(){
 const textures=new Map(),tiles=[],document={createElement:()=>createCanvas(1,1)},noop=new Proxy({},{get:()=>()=>noop});
 const manager={createCanvas(key,w,h){return this.addCanvas(key,createCanvas(w,h));},addCanvas(key,canvas){const texture={canvas,width:canvas.width,height:canvas.height,refreshes:0,getContext:()=>canvas.getContext('2d'),getCanvas:()=>canvas,refresh(){this.refreshes++;},setSize(w,h){canvas.width=this.width=w;canvas.height=this.height=h;}};textures.set(key,texture);return texture;}};
 return{textures,tiles,scene:{sys:{game:{canvas:{ownerDocument:document}}},textures:manager,add:{graphics:()=>noop,image(x,y,key){const tile={key,visible:true,setOrigin(){return this;},setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.width=w;this.height=h;return this;}};tiles.push(tile);return tile;}}}};
}
const views=[[320,568,0,true],[390,720,0,true],[390,844,0,true],[430,932,0,true],[844,390,0,true],[568,320,0,true],[390,844,90,true],[390,844,-90,true],[1280,800,0,false]];
const apex=DESK.y-JUMP_SPEED**2/(2*GRAVITY)-4;
const poses=[['ground',68,892,430],['desk-apex',68,892,apex],['left-apex',68,180,apex],['right-apex',780,892,apex]];
const results=[],canvas=createCanvas(1,1);
for(const variant of ['normal','missing-sky','legacy']){
 const images={...art};if(variant!=='normal')delete images['challenge-street-sky'];if(variant==='legacy')delete images['challenge-arena'];
 const h=fixture(),renderer=createChallengeRenderer(h.scene,images);
 for(const [physicalW,physicalH,rotation,touch]of views)for(const section of [0,1,2])for(const [cameraName,camera]of [['dynamic',cameraFrame],['stable',stableCameraFrame]])for(const [pose,x1,x2,y]of poses){
  const width=rotation?physicalH:physicalW,height=rotation?physicalW:physicalH;
  const frame=fullStageCameraFrame(camera,width,height,[{x:x1,y},{x:x2,y:430}],null,16,{touch,portrait:width<height});renderer.drawArena(section,0,frame);
  if(canvas.width!==physicalW)canvas.width=physicalW;if(canvas.height!==physicalH)canvas.height=physicalH;const ctx=canvas.getContext('2d');ctx.resetTransform();ctx.clearRect(0,0,physicalW,physicalH);
  if(rotation===90){ctx.translate(physicalW,0);ctx.rotate(Math.PI/2);}else if(rotation===-90){ctx.translate(0,physicalH);ctx.rotate(-Math.PI/2);}
  ctx.scale(frame.zoom,frame.zoom);ctx.translate(width/(2*frame.zoom)-frame.x,height/(2*frame.zoom)-frame.y);
  for(const tile of h.tiles.filter(t=>t.visible).sort((a,b)=>a.depth-b.depth))ctx.drawImage(h.textures.get(tile.key).canvas,tile.x,tile.y,tile.width,tile.height);
  ctx.resetTransform();const pixels=ctx.getImageData(0,0,physicalW,physicalH).data;let transparent=0,minAlpha=255;
  for(let i=3;i<pixels.length;i+=4){minAlpha=Math.min(minAlpha,pixels[i]);if(pixels[i]<254)transparent++;}
  const name=`${variant}-boss${section+1}-${physicalW}x${physicalH}-r${rotation}-${cameraName}-${pose}`;
  const capture=cameraName==='dynamic'&&pose==='desk-apex'&&(variant==='normal'||physicalW===390&&physicalH===844&&rotation===0)&&((section===0||section===2)&&[390,844,1280].includes(physicalW));
  if(capture||transparent)writeFileSync(new URL(name+'.png',out),canvas.toBuffer('image/png'));
  results.push({name,viewport:[physicalW,physicalH],rotation,section,camera:cameraName,pose,variant,minAlpha,transparent,zoom:frame.zoom,apex:y});
  assert.equal(transparent,0,name+' has partially transparent seams or uncovered pixels');
 }
 assert.equal(h.textures.get('challenge-arena-facade').refreshes,1);assert.equal(h.textures.get('challenge-arena-road').refreshes,1);assert.equal(h.textures.size,5);
}
writeFileSync(new URL('native-canvas-results.json',out),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({composites:results.length,minimumAlpha:Math.min(...results.map(r=>r.minAlpha)),transparentPixels:results.reduce((s,r)=>s+r.transparent,0),variants:['normal','missing-sky','legacy'],maximumDeskJumpApex:apex,rotations:[0,90,-90]},null,2));
