// A narrow CSS declaration/cascade reader for layout budget tests, not a browser
// layout engine. Parent browser QA remains responsible for painted overflow.
export function stylesAt(css,selectors,viewport){
 const result={};css=css.replace(/\/\*[\s\S]*?\*\//g,'');
 const matches=query=>[...query.matchAll(/\(([^:]+):\s*([^\)]+)\)/g)].every(([,feature,value])=>{
  const key=feature.trim();value=value.trim();
  if(key==='orientation')return value===(viewport.width>viewport.height?'landscape':'portrait');
  if(key==='prefers-reduced-motion')return value===(viewport.reducedMotion?'reduce':'no-preference');
  const m=key.match(/^(min|max)-(width|height)$/);if(!m)return false;
  return m[1]==='min'?viewport[m[2]]>=parseFloat(value):viewport[m[2]]<=parseFloat(value);
 });
 function visit(source){
  let from=0;
  while(from<source.length){
   const open=source.indexOf('{',from);if(open<0)break;
   let depth=1,end=open+1;while(depth&&end<source.length){if(source[end]==='{')depth++;if(source[end]==='}')depth--;end++;}
   const selector=source.slice(from,open).trim(),body=source.slice(open+1,end-1);from=end;
   if(selector.startsWith('@media')){if(matches(selector))visit(body);continue;}
   if(!selector.split(',').some(s=>selectors.includes(s.trim())))continue;
   for(const declaration of body.split(';')){const colon=declaration.indexOf(':');if(colon>0)result[declaration.slice(0,colon).trim()]=declaration.slice(colon+1).trim();}
  }
 }
 visit(css);return result;
}
export function padding(style){const a=(style.padding||'0').split(/\s+/).map(parseFloat);return[a[0],a[1]??a[0],a[2]??a[0],a[3]??a[1]??a[0]];}
