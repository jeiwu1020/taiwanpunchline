import http from 'node:http';
import {readFileSync,existsSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const repo=resolve(import.meta.dirname,'../..'),root=resolve(repo,'dist'),qa=import.meta.dirname,port=Number(process.env.PORT||process.env.QA_PORT||4173);
const mime={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const later=readFileSync(resolve(qa,'driver-later.mjs'),'utf8');
const main=readFileSync(resolve(qa,'driver-main.mjs'),'utf8');
const server=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1');
 if(u.pathname==='/qa-results'&&req.method==='POST'){let data='';req.on('data',b=>{data+=b;if(data.length>64000000)req.destroy();});req.on('end',()=>{JSON.parse(data);mkdirSync(resolve(qa,'evidence'),{recursive:true});writeFileSync(resolve(qa,'evidence/latest-browser-report.json'),data);res.end('saved');});return;}
 let path=u.pathname==='/'?'/index.html':u.pathname;if(path.endsWith('/'))path+='index.html';let p=resolve(path.startsWith('/qa/')?qa:root,'.'+(path.startsWith('/qa/')?path.slice(3):path));if(!p.startsWith(root+sep)&&!p.startsWith(qa+sep))throw Error('outside roots');if(!existsSync(p)||!statSync(p).isFile()){res.writeHead(404);res.end('Not found');return;}
 let data=readFileSync(p);if(/\/chapter[24]-playable\.mjs$/.test(p))data=Buffer.from(data+'\n'+readFileSync(resolve(qa,'driver-later.mjs'),'utf8'));if(p===resolve(root,'game.mjs'))data=Buffer.from(data+'\n'+readFileSync(resolve(qa,'driver-main.mjs'),'utf8'));
 if(extname(p)==='.html'&&!p.startsWith(qa))data=Buffer.from(data.toString().replace('<head>','<head><script type="module" src="/qa/storage-faults.mjs"></script>'));
 if(extname(p)==='.css'){const left=/qa-safe-left=(\d+)/.exec(req.headers.cookie||'')?.[1]||'0',right=/qa-safe-right=(\d+)/.exec(req.headers.cookie||'')?.[1]||'0';if(left!=='0'||right!=='0')data=Buffer.from(data.toString().replace(/env\(safe-area-inset-left(?:,[^)]*)?\)/g,left+'px').replace(/env\(safe-area-inset-right(?:,[^)]*)?\)/g,right+'px'));}
 res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(e){res.writeHead(500);res.end(String(e.stack));}});
server.listen(port,'0.0.0.0',()=>console.log(`Formal synthetic QA server http://127.0.0.1:${port}/qa/ ; production inputs are read-only`));
