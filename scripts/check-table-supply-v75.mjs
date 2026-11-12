import {createCanvas,loadImage} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js';
import {writeFileSync} from 'node:fs';
import {drawChallengeStreetProp,drawChallengeSupply} from '../dist/challenge-art.mjs';
const root=new URL('../',import.meta.url),images={};for(const [k,f]of [['challenge-street-props','street-props-v2.webp'],['challenge-supply','supply-stand-v75.webp']])images[k]=await loadImage(new URL('dist/assets/challenge/'+f,root).pathname);
const c=createCanvas(1080,520),ctx=c.getContext('2d');ctx.fillStyle='#eee3d0';ctx.fillRect(0,0,1080,520);ctx.scale(2,2);ctx.fillStyle='#17333b';ctx.font='12px sans-serif';ctx.fillText('Original compressed top',20,25);ctx.fillText('Projected landing surface',285,25);
drawChallengeStreetProp(ctx,images,'table',{x:135,y:160,width:230,height:88});drawChallengeStreetProp(ctx,images,'table',{x:400,y:160,width:230,height:88,depthHalf:36});
ctx.setLineDash([3,3]);ctx.strokeStyle='#478d80';ctx.strokeRect(285,72-23.4,230,46.8);ctx.setLineDash([]);ctx.fillText('Generated supply (90 world px)',20,192);drawChallengeSupply(ctx,images,{x:310,y:250});writeFileSync(new URL('docs/qa-v75/table-supply-native-canvas.png',root),c.toBuffer('image/png'));
