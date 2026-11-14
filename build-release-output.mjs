import {readFileSync,readdirSync,statSync,existsSync,mkdirSync,copyFileSync,linkSync,renameSync,mkdtempSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {playerReleasePath} from './build/player-release-policy.mjs';
const root=dirname(fileURLToPath(import.meta.url)),source=join(root,'dist'),output=join(root,'out');
// Explicit recovery-only mode. Inputs and output are frozen after creation;
// no workflow edits these linked files in place. Normal builds copy bytes.
const linkImmutableOutput=process.argv.includes('--link-immutable-output');
const plan=JSON.parse(readFileSync(join(root,'build/asset-release-plan.json'),'utf8'));
const {channel}=JSON.parse(readFileSync(join(root,'build/release-channel.json'),'utf8'));
if(!['production','preview'].includes(channel))throw Error('An explicit release channel is required');
const development=channel==='preview';
const featureBytes=Buffer.from(`// Generated release policy. No URL or saved preference can enable tools.\nexport const DEVELOPMENT_TOOLS=${development};\n`);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.isSymbolicLink())throw Error('Release inputs cannot be symbolic links');const p=join(dir,e.name);return e.isDirectory()?files(p):[p];});}
for(const item of plan.exclude)if(hash(join(source,item.path))!==item.sha256)throw Error('Reviewed excluded asset changed: '+item.path);
for(const item of plan.equivalentAliases)if(hash(join(source,item.originalDistPath))!==item.sha256||hash(join(source,item.canonicalDistPath))!==item.sha256)throw Error('Shared images differ: '+item.originalDistPath);
for(const item of plan.previouslyMissingCharacterAliases)if(hash(join(source,item.canonicalDistPath))!==item.sha256)throw Error('Existing character art changed: '+item.canonicalDistPath);
const excluded=new Set(plan.exclude.map(x=>x.path));
const selected=files(source).filter(p=>!excluded.has(relative(source,p))&&(development||playerReleasePath(relative(source,p))));
const manifest=Object.fromEntries(selected.map(p=>[relative(source,p),relative(source,p)==='release-features.mjs'?createHash('sha256').update(featureBytes).digest('hex'):hash(p)]));
if(existsSync(output)){
 const current=files(output),same=current.length===selected.length&&current.every(p=>manifest[relative(output,p)]===hash(p));
 if(same){console.log(JSON.stringify({output,files:selected.length,bytes:selected.reduce((n,p)=>n+statSync(p).size,0),reused:true}));process.exit(0);}
}
const stage=mkdtempSync(join(root,'.release-output-build-'));
for(const p of selected){const name=relative(source,p),target=join(stage,name);mkdirSync(dirname(target),{recursive:true});if(name==='release-features.mjs')writeFileSync(target,featureBytes);else (linkImmutableOutput?linkSync:copyFileSync)(p,target);if(hash(target)!==manifest[name])throw Error('Release copy verification failed');}
if(existsSync(output)){const backups=join(root,'release-output-backups');mkdirSync(backups,{recursive:true});renameSync(output,join(backups,new Date().toISOString().replace(/[:.]/g,'-')));}
renameSync(stage,output);
console.log(JSON.stringify({output,channel,files:selected.length,bytes:selected.reduce((n,p)=>n+statSync(p).size,0),reused:false,excluded:excluded.size,linkImmutableOutput}));
