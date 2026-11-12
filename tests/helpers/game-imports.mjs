import {readFile} from 'node:fs/promises';
// Real named dependencies for VM harnesses that deliberately omit browser imports.
export async function loadGameImports(){
 const url=new URL('../../dist/game.mjs',import.meta.url),source=await readFile(url,'utf8'),bindings={};
 for(const match of source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];$/gm)){
  const module=await import(new URL(match[2],url));
  for(const declaration of match[1].split(',')){
   const [exported,local=exported]=declaration.trim().split(/\s+as\s+/);
   if(!(exported in module))throw new Error(`Missing game import ${exported}`);
   // These VM harnesses do not provide layout, Canvas, or DOM observers.
   // Real fitting is covered separately by its DOM tests and native audit.
   bindings[local]=exported==='mountSpecialNameFit'?()=>({refresh(){},destroy(){}}):module[exported];
  }
 }
 return bindings;
}
