// Reading position is an offset into the original copy, never a save checkpoint.
// Reflow may split a sentence differently; the source offset survives rotation.
const END=/[。！？!?\n]/u,CLOSE=/[」』”’）)\]】》〉]/u;
const NO_START=/[，。、；：！？!?：:;,.」』”’）)\]】》〉]/u,NO_END=/[「『“‘（(\[【《〈]/u;
// Keep opening quotes with their word and closing punctuation with the prior
// character. The same units are used at both line and page boundaries.
function readingUnits(text){
 const units=[];let opening='';
 for(const ch of text){
  if(ch==='\n'){if(opening){units.push(opening);opening='';}units.push(ch);continue;}
  if(NO_END.test(ch)){opening+=ch;continue;}
  if(NO_START.test(ch)&&units.length&&!opening&&units.at(-1)!=='\n')units[units.length-1]+=ch;
  else{units.push(opening+ch);opening='';}
 }
 if(opening){if(units.length)units[units.length-1]+=opening;else units.push(opening);}
 return units;
}
export function comicTextLines(text,columns){
 const lines=[];let line='';
 for(const unit of readingUnits(text)){if(unit==='\n'){lines.push(line);line='';continue;}if(line&&Array.from(line+unit).length>columns){lines.push(line);line='';}line+=unit;}
 if(line||!lines.length)lines.push(line);return lines;
}
function sentences(copy){
 const units=[];let text='',start=0,ended=false;
 for(const ch of copy){
  if(ended&&!CLOSE.test(ch)&&!END.test(ch)){units.push({text,start,end:start+text.length});start+=text.length;text='';ended=false;}
  text+=ch;if(END.test(ch))ended=true;
 }
 if(text)units.push({text,start,end:copy.length});return units;
}
function fitFragments(copy,columns,maxLines){
 const out=[];
 for(const sentence of sentences(copy)){
  let text='',start=sentence.start;
  for(const unit of readingUnits(sentence.text)){
   if(text&&comicTextLines(text+unit,columns).length>maxLines){out.push({text,start,end:start+text.length});start+=text.length;text='';}
   text+=unit;
  }
  if(text)out.push({text,start,end:start+text.length});
 }
 return out.length?out:[{text:'',start:0,end:0}];
}
export function supportedComicSize(width,height){return Number.isFinite(width)&&Number.isFinite(height)&&width>=240&&height>=(width>height*1.35?180:260);}
export function layoutStoryComic({width,height,copy='',speaker='旁白',anchor=0,kind}={}){
 if(!supportedComicSize(width,height))throw new RangeError('Unsupported comic size');
 copy=String(copy);const landscape=width>height*1.35,pad=14,gap=16;
 const font=landscape&&height<400?24:Math.max(24,Math.min(30,Math.floor(width*.067)));
 const column=landscape?Math.min(360,width*.43,width*.5-44):width-pad*2;
 // At least 46% of the frame stays available to complete acting figures.
 const budget=landscape?height-pad*2:Math.floor(height*.54)-pad*2-gap;
 const columns=Math.max(1,Math.floor((column-32)/font)),maxLines=Math.max(1,Math.floor((budget-42)/(font*1.28)));
 const fragments=fitFragments(copy,columns,maxLines),pages=[];let page={bubbles:[],first:0,last:0},y=pad;
 for(const [i,f]of fragments.entries()){
  const lines=comicTextLines(f.text,columns),bh=lines.length*font*1.28+42;
  if(page.bubbles.length&&y+bh>pad+budget){pages.push(page);page={bubbles:[],first:i,last:i};y=pad;}
  const bubble={...f,speaker,kind:kind??(speaker==='旁白'||/廣播|裁判/.test(speaker)?'broadcast':'dialogue'),x:pad,y,width:column,height:bh,lines,index:page.bubbles.length};
  f.pageIndex=pages.length;f.bubbleIndex=page.bubbles.length;page.bubbles.push(bubble);page.last=i;y+=bh+gap;
 }
 pages.push(page);
 const currentIndex=anchor>=copy.length?fragments.length-1:Math.max(0,fragments.findIndex(f=>f.end>Math.max(0,Number(anchor)||0)));
 const current=fragments[currentIndex],pageIndex=current.pageIndex,currentPage=pages[pageIndex];
 const bottom=currentPage.bubbles.at(-1).y+currentPage.bubbles.at(-1).height;
 const art=landscape?{x:column+30,y:pad,width:width-column-44,height:height-pad*2}:{x:pad,y:bottom+gap,width:width-pad*2,height:height-bottom-gap-pad};
 return {width,height,font,landscape,pad,art,fragments,pages,current,currentIndex,pageIndex,
  bubbles:currentPage.bubbles.slice(0,current.bubbleIndex+1),
  previousAnchor:currentIndex>0?fragments[currentIndex-1].start:null,
  nextAnchor:currentIndex+1<fragments.length?fragments[currentIndex+1].start:null};
}
