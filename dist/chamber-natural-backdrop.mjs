// One outpainted room, registered to the unchanged V19 auditorium. The
// extension is a scene, not a repeated ceiling-material swatch. World units,
// camera, original desk support row 581 and bottom row 692 are unchanged.
export const CHAMBER_EXTENSION_ASSET='assets/arena-chamber-extended-v77.png';
export const CHAMBER_EXTENSION_ANCHOR=Object.freeze({x:559,y:532.75,width:418,height:235.25});

export function naturalChamberFrame(chamber,image){
 const a=CHAMBER_EXTENSION_ANCHOR,scale=chamber.width/a.width;
 return {x:chamber.x-chamber.width/2-a.x*scale,y:chamber.y-chamber.height*chamber.floorRatio-a.y*scale,width:image.width*scale,height:image.height*scale};
}

export function createNaturalChamberBackdrop(scene,chamber){
 if(!scene.textures.exists?.('arena-chamber-extended'))return null;
 const image=scene.textures.get('arena-chamber-extended').getSourceImage();
 if(!(image?.width>0&&image?.height>0))return null;
 const original=scene.textures.get('arena-chamber').getSourceImage();
 const anchorKey='arena-chamber-natural-anchor',anchor=scene.textures.createCanvas(anchorKey,original.width,original.height),ctx=anchor.getContext();
 ctx.drawImage(original,0,0);
 // Only the outer border dissolves into the registered outpainting. All
 // central seating and collision-bearing desktop remain original pixels.
 const feather=96;ctx.save();ctx.globalCompositeOperation='destination-out';
 for(let i=0;i<feather;i++){
  ctx.globalAlpha=1-(i+.5)/feather;
  ctx.fillRect(i,0,1,original.height);ctx.fillRect(original.width-1-i,0,1,original.height);
  ctx.fillRect(feather,original.height-1-i,original.width-feather*2,1);
 }
 for(let i=0;i<192;i++){ctx.globalAlpha=1-(i+.5)/192;ctx.fillRect(feather,i,original.width-feather*2,1);}
 ctx.restore();anchor.refresh();
 // Retained floor continuation is independent of the camera. Only wood is
 // continued beyond the generated room; the ceiling is always one image.
 const roomKey='arena-chamber-natural-room',room=scene.textures.createCanvas(roomKey,image.width,image.height+1024),floor=room.getContext();
 floor.drawImage(image,0,0);
 const band=128;for(let y=image.height;y<image.height+1024;y+=band){
  const flip=((y-image.height)/band)%2===0;floor.save();
  if(flip){floor.translate(0,2*y+band);floor.scale(1,-1);}
  floor.drawImage(image,0,image.height-band,image.width,band,0,y-.5,image.width,band+1);floor.restore();
 }
 room.refresh();
 const bounds=naturalChamberFrame(chamber,room.getCanvas());
 const display=scene.add.image(bounds.x,bounds.y,roomKey).setOrigin(0).setDisplaySize(bounds.width,bounds.height).setDepth(-11);
 return {anchorKey,bounds,displays:[display],draw(){display.setVisible(true);}};
}
