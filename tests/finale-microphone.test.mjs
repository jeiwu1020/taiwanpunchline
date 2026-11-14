import test from 'node:test';
import assert from 'node:assert/strict';
import {drawFinaleLockedStand} from '../dist/preview/finale/finale-stage.mjs';
test('the arena uses the intact canonical locked stand with its base on the floor',()=>{
 const calls=[],ctx={drawImage:(...args)=>calls.push(args)},image={width:1024,height:1536};
 for(const height of [100,210,420]){assert.equal(drawFinaleLockedStand(ctx,image,{x:480,foot:430,height}),true);const [im,sx,sy,sw,sh,x,y,w,h]=calls.at(-1);assert.equal(im,image);assert.deepEqual([sx,sy,sw,sh],[270,34,390,1482]);assert.equal(y+h,430);assert.equal(x+w/2,480);}
 assert.equal(drawFinaleLockedStand(ctx,null,{x:0,foot:0,height:210}),false);
});
