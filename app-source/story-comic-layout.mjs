// Reading position is an offset into the original copy, never a save checkpoint.
// A complete sentence is one reading step at every size; rotation keeps its offset.
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
 const units=[];let text='',start=0,ended=false;const quotes=[];
 const pairs={'「':'」','『':'』','“':'”','‘':'’','【':'】','《':'》','（':'）','(':')','[':']'};
 for(const ch of copy){
  if(ended&&!CLOSE.test(ch)&&!END.test(ch)){units.push({text,start,end:start+text.length});start+=text.length;text='';ended=false;}
  const previous=text.at(-1);text+=ch;if(pairs[ch])quotes.push(pairs[ch]);else if(ch===quotes.at(-1)){
   quotes.pop();
   // Explicit attributed speech ends at its closing quote. Embedded sound
   // effects (音浪「啵！」地…) still belong to the enclosing narration.
   if(!quotes.length&&END.test(previous??'')&&/^[^：「『]{1,12}[：:][「『]/u.test(text))ended=true;
  }
  // An exclamation inside a quotation can be an embedded sound effect, not
  // the end of its enclosing narration (音浪「啵！」地彈回來).
  if(END.test(ch)&&quotes.length===0)ended=true;
 }
 if(text)units.push({text,start,end:copy.length});return units;
}
export function supportedComicSize(width,height){return Number.isFinite(width)&&Number.isFinite(height)&&width>=240&&height>=(width>height*1.35?180:260);}
export function layoutStoryComic({width,height,copy='',speaker='旁白',anchor=0,kind,readAsOne=false,sideDialogue=false,wideDialogue=false}={}){
 if(!supportedComicSize(width,height))throw new RangeError('Unsupported comic size');
 copy=String(copy);const landscape=width>height*1.35,pad=14,gap=16,short=landscape&&height<240,overhead=short?32:42;
 const fragments=readAsOne?[{text:copy,start:0,end:copy.length}]:sentences(copy);if(!fragments.length)fragments.push({text:'',start:0,end:0});
 const preferredFont=short?18:landscape&&height<400?24:Math.max(24,Math.min(30,Math.floor(width*.067)));
 // Selected shallow shots use the empty middle of the frame before reducing
 // their actors. The longest sentence fixes this width for the whole shot.
 const singleLineWidth=32+preferredFont*Math.max(...fragments.map(f=>Array.from(f.text).length));
 const preferredWidth=landscape?(wideDialogue?Math.min(width-pad*2,singleLineWidth):Math.min(360,width*.43,width*.5-44)):Math.min(width-pad*2,width*.84),maxWidth=sideDialogue&&landscape?preferredWidth:width-pad*2;
 // Budget every sentence before revealing the first. Grow into safe horizontal
 // space before reducing type; never create a capacity-based Next click.
 const budget=landscape?(sideDialogue?height-pad*2:Math.min(height-pad*2-64,overhead+preferredFont*1.28*2)):Math.max(68,Math.floor(height*.54)-pad*2-gap);
 const reservedBandHeight=(landscape&&sideDialogue)?0:Math.min(budget,overhead+preferredFont*1.28*(landscape?2:3));
 let font=preferredFont,column=preferredWidth,columns=1;
 const fits=(limit=budget)=>{columns=Math.max(1,Math.floor((column-32)/font));return fragments.every(f=>comicTextLines(f.text,columns).length*font*1.28+overhead<=limit);};
 if(!landscape&&reservedBandHeight>0){
  const targetFloor=Math.max(18,preferredFont-4);
  while(!fits(reservedBandHeight)&&column<maxWidth)column=Math.min(maxWidth,column+font);
  while(!fits(reservedBandHeight)&&font>targetFloor)font--;
  if(!fits(reservedBandHeight)){font=preferredFont;column=preferredWidth;}
 }
 while(!fits()&&column<maxWidth)column=Math.min(maxWidth,column+font);
 while(!fits()&&font>18)font--;
 // Very small frames keep complete copy at the readable floor. The actual
 // longest utterance determines the fixed band, rather than hiding its end.
 fits();const pages=[],reservations=[];
 for(const [i,f]of fragments.entries()){
  const lines=comicTextLines(f.text,columns),bh=lines.length*font*1.28+overhead;
  const voice=/^([^：「『]{1,12})[：:][「『]/u.exec(f.text)?.[1]??speaker;
  const bubble={...f,speaker:voice,kind:kind??(voice==='旁白'||/廣播|裁判|觀眾/.test(voice)?'broadcast':'dialogue'),x:pad,y:pad,width:column,height:bh,lines,index:0};
  f.pageIndex=i;f.bubbleIndex=0;pages.push({bubbles:[bubble],first:i,last:i});reservations.push({...bubble});
 }
 const currentIndex=anchor>=copy.length?fragments.length-1:Math.max(0,fragments.findIndex(f=>f.end>Math.max(0,Number(anchor)||0)));
 const current=fragments[currentIndex],pageIndex=current.pageIndex,currentPage=pages[pageIndex];
 // One live bubble; the cast uses the union of ALL utterance reservations.
 // Keep a steady dialogue band height so actors do not pop taller or shorter between sentences.
 const bottom=pad+Math.max(reservedBandHeight,...reservations.map(b=>b.height));
 const art=landscape?{x:pad,y:pad,width:width-pad*2,height:height-pad*2}:{x:pad,y:bottom+gap,width:width-pad*2,height:height-bottom-gap-pad};
 return {width,height,font,landscape,pad,art,fragments,pages,reservations,reservedBandHeight,current,currentIndex,pageIndex,textOverhead:overhead,sideDialogue:sideDialogue&&landscape,
  // One live utterance keeps the frame clear; Previous remains available for
  // every earlier sentence. Older boxes no longer accumulate over the cast.
  bubbles:[{...currentPage.bubbles[current.bubbleIndex],y:pad}],
  previousAnchor:currentIndex>0?fragments[currentIndex-1].start:null,
  nextAnchor:currentIndex+1<fragments.length?fragments[currentIndex+1].start:null};
}
