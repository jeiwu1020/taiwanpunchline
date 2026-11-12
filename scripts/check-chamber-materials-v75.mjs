import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fullStageCameraFrame,chamberBackdropTiles} from '../dist/combat-presentation.mjs';
import {cameraFrame,stableCameraFrame} from '../dist/arena-presentation.mjs';
import {CHAMBER} from '../dist/stage-expansion.mjs';
const image=await loadImage(new URL('../dist/assets/arena-chamber-v19.webp',import.meta.url).pathname),out=new URL('../docs/qa-v75-chamber/',import.meta.url);mkdirSync(out,{recursive:true});const results=[];
for(const [width,height,touch]of [[320,568,true],[390,844,true],[844,390,true],[1280,800,false]])for(const [name,camera]of [['dynamic',cameraFrame],['stable',stableCameraFrame]])for(const [pose,y]of [['stand',430],['jump',53]]){
 const fighters=[{x:68,y},{x:892,y:430}],frame=fullStageCameraFrame(camera,width,height,fighters,null,16,{touch,portrait:width<height}),tiles=chamberBackdropTiles(frame,CHAMBER),canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
 ctx.scale(frame.zoom,frame.zoom);ctx.translate(width/(2*frame.zoom)-frame.x,height/(2*frame.zoom)-frame.y);
 for(const t of tiles){ctx.save();ctx.translate(t.left,t.top);if(t.flipX){ctx.translate(t.width,0);ctx.scale(-1,1);}if(t.flipY){ctx.translate(0,t.height);ctx.scale(1,-1);}ctx.drawImage(image,...t.source,0,0,t.width,t.height);ctx.restore();}
 ctx.resetTransform();const pixels=ctx.getImageData(0,0,width,height).data;let badPixels=0,minAlpha=255;
 for(let i=3;i<pixels.length;i+=4){minAlpha=Math.min(minAlpha,pixels[i]);if(pixels[i]===0)badPixels++;}assert.equal(badPixels,0);
 const filename=`chamber-${width}x${height}-${name}-${pose}.png`;writeFileSync(new URL(filename,out),canvas.toBuffer('image/png'));
 results.push({viewport:[width,height],camera:name,pose,tiles:tiles.length,ceiling:tiles.filter(t=>t.frame==='chamber-ceiling').length,floor:tiles.filter(t=>t.frame==='chamber-floor').length,minAlpha,blankPixels:badPixels,image:filename});
}
writeFileSync(new URL('native-canvas-results.json',out),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
