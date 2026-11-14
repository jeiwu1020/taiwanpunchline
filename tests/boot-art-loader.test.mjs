import test from 'node:test';
import assert from 'node:assert/strict';

import {createBootArtLoader} from '../dist/boot-art-loader.mjs';

function fixture(entries,options={}){
 const requests=[],timers=new Map();let serial=0,state;
 const createImage=()=>{
  const image={naturalWidth:100,naturalHeight:100,removeAttribute(){this.src='';}};
  Object.defineProperty(image,'src',{get(){return this.url;},set(url){this.url=url;if(url)requests.push(image);},configurable:true});return image;
 };
 const loader=createBootArtLoader({entries,createImage,timeoutMs:50,retries:1,limit:2,
  setTimer:fn=>{timers.set(++serial,fn);return serial;},clearTimer:id=>timers.delete(id),onChange:next=>state=next,...options});
 return {loader,requests,get state(){return state;},success(i){requests[i].onload?.();},error(i){requests[i].onerror?.();},expire(){for(const [id,fn]of [...timers])if(timers.delete(id))fn();},timers};
}
const entries=(count=4)=>Array.from({length:count},(_,i)=>({key:'art-'+i,url:'assets/'+i+'.png'}));

test('boot artwork loading is bounded and advances without animation frames',()=>{
 assert.equal(typeof createBootArtLoader,'function','boot loading needs a bounded native image loader');
 const h=fixture(entries());h.loader.start();assert.equal(h.requests.length,2);h.success(0);assert.equal(h.requests.length,3);h.success(1);h.success(2);h.success(3);
 assert.equal(h.state.status,'ready');assert.equal(Object.keys(h.state.images).length,4);assert.equal(h.state.progress,1);assert.equal(h.timers.size,0);
});
test('a stalled image times out, retries once, then reports failure rather than hanging',()=>{
 const h=fixture(entries(1));h.loader.start();const stale=h.requests[0].onload;h.expire();assert.equal(h.requests.length,2);assert.equal(h.state.retrying,1);stale();assert.equal(h.state.status,'loading');h.expire();assert.equal(h.state.status,'failed');assert.deepEqual(h.state.failed,['art-0']);assert.equal(h.timers.size,0);
});
test('retry only requests unsuccessful images and keeps loaded artwork',()=>{
 const h=fixture(entries(2));h.loader.start();h.success(0);const first=h.state.images['art-0'];h.error(1);h.error(2);assert.equal(h.state.status,'failed');h.loader.retry();assert.equal(h.requests.length,4);h.success(3);assert.equal(h.state.status,'ready');assert.equal(h.state.images['art-0'],first);
});
test('timed-out attempts use fresh URLs so a browser cannot reuse the hung request',()=>{
 const h=fixture(entries(1));h.loader.start();const first=h.requests[0].src;h.expire();const second=h.requests[1].src;assert.notEqual(second,first);h.expire();h.loader.retry();assert.notEqual(h.requests[2].src,first);assert.notEqual(h.requests[2].src,second);
});
test('optional scenery falls back after bounded retries; required artwork cannot be skipped',()=>{
 const h=fixture([{key:'room',url:'room.png',optional:true},...entries(1)]);h.loader.start();h.error(0);h.error(2);h.success(1);assert.equal(h.state.status,'ready');assert.deepEqual([...h.state.optionalFailures],['room']);assert.equal(h.state.images.room,undefined);
});
test('disposal cancels timers and ignores late image callbacks',()=>{
 const h=fixture(entries());h.loader.start();const stale=h.requests[0].onload;h.loader.dispose();stale();assert.equal(h.requests.length,2);assert.equal(h.timers.size,0);assert.equal(h.state.status,'loading');
});
test('a cached image completion and duplicate events cannot advance a job twice',()=>{
 const h=fixture(entries(1));h.loader.start();const done=h.requests[0].onload;done();done();assert.equal(h.state.status,'ready');assert.equal(Object.keys(h.state.images).length,1);
});
