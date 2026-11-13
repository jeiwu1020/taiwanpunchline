import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../dist/story-comic-layout.mjs').catch(()=>({}));
const samples=[
 '什麼撕髮不公？只有我可以無髮無天！',
 '小馬哥守著輪鎖，柯P核對歸還標籤。器材車停在議場外的廟口歸還街；紙飛機徽記下，編號箱已排好，麥架也卸下了。',
 '電池背面畫著一張小地圖：東廊、第三盞燈、壁畫後方，接著是一段往下的階梯。盡頭只有三個字：「無限城」。這條藏在議會裡的路，七個人竟然都沒聽過。',
 '韓國魚比手畫腳，手肘一碰，阿扁仔手裡的電池滑進門邊的凹槽。眾人還在七嘴八舌，門裡忽然傳來一聲：「喀！」',
 '保留符號😀、引號「下一句！」與\n換行，不刪原文。'.repeat(8)
];
test('readable bubble pages preserve text and reserve a large full-actor stage',()=>{
 assert.equal(typeof module.layoutStoryComic,'function');
 for(const [width,height]of [[360,720],[352,260],[390,280],[500,360],[814,294],[1060,600]])for(const copy of samples){
  const l=module.layoutStoryComic({width,height,copy,speaker:'旁白',anchor:0});
  assert.equal(l.fragments.map(f=>f.text).join(''),copy);
  assert.ok(l.font>=(height<240?18:24));
  assert.ok(l.art.height>=height*.46);
  assert.ok(l.art.width>=width*(l.landscape?.5:.85));
  for(const page of l.pages)for(const b of page.bubbles){assert.ok(b.y+b.height<=height-14);assert.ok(b.lines.length*l.font*1.28+l.textOverhead<=b.height+.01);}
 }
});
test('end anchors clamp to the final sentence and grouped punctuation stays together',()=>{
 const copy='什麼！？「不要啊！！」接著走。';
 const view=anchor=>module.layoutStoryComic({width:814,height:294,copy,speaker:'韓國魚',anchor});
 assert.equal(view(copy.length).current.end,copy.length);
 assert.equal(view(copy.length+40).current.end,copy.length);
 assert.equal(view(-40).current.start,0);
 assert.equal(view(0).fragments[0].text,'什麼！？');
 assert.equal(view(0).fragments[1].text,'「不要啊！！」接著走。');
});
test('rotation preserves a source anchor and next/previous traverse exact text',()=>{
 assert.equal(typeof module.layoutStoryComic,'function');
 const copy=samples[4],a=module.layoutStoryComic({width:814,height:294,copy,speaker:'恰吉王',anchor:0});
 const anchor=a.fragments[Math.floor(a.fragments.length/2)].start;
 const rotated=module.layoutStoryComic({width:360,height:720,copy,speaker:'恰吉王',anchor});
 assert.ok(rotated.current.start<=anchor&&rotated.current.end>anchor);
 assert.equal(module.layoutStoryComic({width:360,height:720,copy,speaker:'恰吉王',anchor:Infinity}).current.end,copy.length);
 assert.ok(rotated.art.y>=rotated.bubbles[0].y+rotated.bubbles[0].height);
});
test('Chinese quotes and punctuation stay attached at line and page boundaries',()=>{
 const copy='正面印著「議會無限城製造」，底下的紅字完得刺眼：「過保失效」。石階盡頭，一扇刻著「無限城」的厚木門擋住去路。';
 for(const [width,height]of [[360,650],[352,260],[390,280],[814,294],[1060,600]]){
  const l=module.layoutStoryComic({width,height,copy});
  assert.equal(l.fragments.map(f=>f.text).join(''),copy);
  for(const page of l.pages)for(const b of page.bubbles){
   assert.equal(b.lines.join(''),b.text);
   for(const line of b.lines){assert.doesNotMatch(line,/^[，。、；：！？」』）]/u);assert.doesNotMatch(line,/[「『（]$/u);}
  }
 }
});
test('closing book brackets stay with the sentence and explicit newlines remain line breaks',()=>{
 const l=module.layoutStoryComic({width:814,height:294,copy:'請看【甲！】接著走。'});
 assert.equal(l.fragments[0].text,'請看【甲！】接著走。');
 assert.deepEqual(module.comicTextLines('甲「\n乙」。',4),['甲「','乙」。']);
});
test('quoted sound effects stay inside their enclosing narration',()=>{
 const copy='話才說完，音浪「啵！」地彈回來。';
 for(const [width,height]of [[828,400],[374,656]]){
  const l=module.layoutStoryComic({width,height,copy});
  assert.equal(l.fragments.length,1);assert.equal(l.bubbles[0].text,copy);
 }
 const l=module.layoutStoryComic({width:828,height:400,copy:'甲說完。乙回答。',anchor:4});
 assert.equal(l.bubbles.length,1);assert.equal(l.bubbles[0].text,'乙回答。');
});
test('portrait reserves space for the one visible utterance, not all hidden page bubbles',()=>{
 const l=module.layoutStoryComic({width:374,height:656,copy:'門沒有動。大家再試一次。這次還是沒有動。'});
 assert.equal(l.bubbles.length,1);
 assert.ok(l.art.y<=l.pad+Math.max(...l.pages[l.pageIndex].bubbles.map(b=>b.height))+16);
});
test('overflowing narration prefers the last complete clause and retains exact navigation offsets',()=>{
 const copy='最後一波音浪「啵！」地彈過街角，神麥又竄上騎樓高處。人還在喘，它倒像來逛早市的。';
 const l=module.layoutStoryComic({width:1164,height:624,copy});
 assert.equal(l.fragments[0].text,'最後一波音浪「啵！」地彈過街角，');
 assert.equal(l.fragments[1].text,'神麥又竄上騎樓高處。');
 assert.equal(l.fragments.map(f=>f.text).join(''),copy);
 for(const f of l.fragments){assert.equal(copy.slice(f.start,f.end),f.text);assert.equal(module.layoutStoryComic({width:1164,height:624,copy,anchor:f.start}).current.text,f.text);}
});
test('a quotation crossing capacity boundaries keeps its closing punctuation on the preceding page',()=>{
 const copy='廣播說：「請大家依照現場工作人員指示先排好隊伍再依序前往入口，」大家慢慢走到門邊準備排隊等待開門。';
 for(const [width,height]of [[1164,624],[374,656],[240,260]]){
  const l=module.layoutStoryComic({width,height,copy});
  assert.equal(l.fragments.map(f=>f.text).join(''),copy);
  for(const f of l.fragments){assert.doesNotMatch(f.text,/^[，。、；：！？」』）]/u);assert.equal(copy.slice(f.start,f.end),f.text);}
 }
});
