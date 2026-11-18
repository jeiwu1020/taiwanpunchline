import './viewport-core.js?v=chapter-presentation-20261117-r1';
export const {gameViewport,viewportSample}=globalThis.parliamentViewportCore;
export function logicalPointer(clientX,clientY,bounds,rotation,width,height){
 const x=(clientX-bounds.left)/Math.max(1,bounds.width),y=(clientY-bounds.top)/Math.max(1,bounds.height);
 return rotation===90?{x:y*width,y:(1-x)*height}:{x:x*width,y:y*height};
}
