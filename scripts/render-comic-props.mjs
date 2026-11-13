import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {writeFileSync} from 'node:fs';
import {drawChapterEncounter} from '../dist/chapter-encounter-art.mjs';
import {drawFinaleStoryArt} from '../dist/preview/finale/finale-story-art.mjs';
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc','Microsoft JhengHei');
const images={'chapter-encounter-props':await loadImage('dist/assets/challenge/encounter-props-v2.png'),'finale-corridor':await loadImage('dist/assets/challenge/infinite-corridor-v1.png')};
const kinds=['sound','rush','route','handshake','paper'],c=createCanvas(1300,680),ctx=c.getContext('2d');ctx.fillStyle='#f2e2bd';ctx.fillRect(0,0,c.width,c.height);
for(const [i,kind]of kinds.entries())for(let row=0;row<2;row++){
 const x=130+i*260,y=295+row*340,p={x,depth:0,kind,active:!!row,uses:row,cooldown:row?3:0,flash:row?.5:0,vx:kind==='rush'&&row?100:0,lureTime:row?2:0},e={kind:['absorb','crash','redirect','bell','stamp'][i],x,depth:0,age:.25,life:1.1};
 const w={player:{x:x-80,depth:0},enemies:[],chapterEncounter:{kind,time:.4,props:[p],hazards:[],parcels:kind==='paper'&&row?[{x:x+60,depth:0,direction:1}]:[],effects:row?[e]:[],notes:[],gates:kind==='route'?[{left:x+55,right:x+130,depth:45,pending:row?-45:null}]:[]}};
 drawChapterEncounter(ctx,w,(xx,yy=430,d=0)=>({x:xx,y:y+(yy-430)+d*.65}),.9,images);
}
writeFileSync('qa-images/props-v2-states.png',c.toBuffer('image/png'));
const shots=['battery','battery-map','corridor','sealed-door','battery-key','open-door'],out=createCanvas(1200,800),o=out.getContext('2d');for(const [i,shot]of shots.entries()){o.save();o.translate(i%3*400,Math.floor(i/3)*400);drawFinaleStoryArt(o,images,shot,400,360,200);o.restore();}writeFileSync('qa-images/ending-comic-scenes.png',out.toBuffer('image/png'));
