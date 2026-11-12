import {readFileSync,writeFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {RUNTIME_VERSION} from './runtime-version.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]);
const quoted= /(["'`])((?:\.{1,2}\/|\/)?[^\s"'`<>?]+?\.(?:mjs|js|css))(\?[^\s"'`<>]*)?\1/g;
export function runtimeVersionIssues({write=false}={}){
 const issues=[];
 for(const file of walk(root)){
  if(!['.mjs','.js','.css','.html'].includes(extname(file)))continue;
  const source=readFileSync(file,'utf8'),next=source.replace(quoted,(literal,quote,path,query='')=>{
   if(/^(?:https?:|data:|node:)/.test(path)||path.includes('${'))return literal;
   const target=resolve(path.startsWith('/')?root:dirname(file),path.replace(/^\//,''));
   if(!target.startsWith(root+'/')||!existsSync(target)||!statSync(target).isFile())return literal;
   const expected='?v='+RUNTIME_VERSION;
   if(query!==expected)issues.push({file:relative(root,file),path,query,expected});
   return quote+path+expected+quote;
  });
  if(write&&next!==source)writeFileSync(file,next);
 }
 return issues;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const write=process.argv.includes('--write'),issues=runtimeVersionIssues({write});
 console.log(JSON.stringify({version:RUNTIME_VERSION,write,referencesChanged:issues.length,files:[...new Set(issues.map(x=>x.file))]}));
 if(!write&&issues.length)process.exitCode=1;
}
