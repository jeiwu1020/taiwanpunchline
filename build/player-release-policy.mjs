const PLAYER_HTML=new Set(['index.html','moves.html','challenge-overview/index.html','preview/chapter2/index.html','preview/chapter3/index.html','preview/chapter4/index.html','preview/chapter5/index.html','preview/finale/index.html']);
export function playerReleasePath(path){
 if(path.startsWith('preview/quick-view/'))return path==='preview/quick-view/hook.mjs';
 if(path.endsWith('.html'))return PLAYER_HTML.has(path);
 if(/(?:^|\/)(?:qa[-/]|tests?\/|__tests__\/)/i.test(path))return false;
 return !['art-view.mjs','street-trial.mjs'].includes(path);
}
