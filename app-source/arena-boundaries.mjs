// The engine stops fighter centers here; the rail faces sit outside the feet.
// These are presentation coordinates only. No collision or world rule is changed.
export const ARENA_BOUNDS=Object.freeze({centerLeft:68,centerRight:892,ground:430,innerLeft:24,innerRight:936});
export function drawArenaBoundaries(g){
 const {ground,innerLeft,innerRight}=ARENA_BOUNDS;
 for(const [face,out]of[[innerLeft,-1],[innerRight,1]]){
  const post=out<0?face-12:face;
  g.lineStyle(5,0x665541,.8);g.lineBetween(face+out*6,ground-51,face+out*126,ground-51);
  g.lineStyle(2,0xd1b276,.9);g.lineBetween(face+out*6,ground-55,face+out*126,ground-55);
  g.fillStyle(0x796247,1);g.fillRoundedRect(post,ground-78,12,78,3);
  g.lineStyle(2,0x3c443b,.9);g.strokeRoundedRect(post,ground-78,12,78,3);
  g.fillStyle(0xc8ad6f,1);g.fillRoundedRect(post-2,ground-82,16,8,3);
  g.fillStyle(0x4b4a38,.2);g.fillEllipse(face+out*3,ground+3,37,9);
  g.lineStyle(2,0x9f8963,.7);g.lineBetween(face,ground+5,face-out*44,ground+5);
 }
}
