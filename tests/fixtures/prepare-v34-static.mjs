// Local QA only; remove all three temporary dist files before packaging.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,root),s);
write('dist/qa-v34-static.local.html',read('tests/fixtures/qa-v34-static.html'));
write('dist/qa-v34-scene.local.mjs',read('tests/fixtures/qa-v34-scene.mjs'));
write('dist/qa-v34-scene.local.html',read('dist/index.html').replace('<script src="vendor/phaser.min.js"></script>','').replace(/<script type="module" src="game\.mjs\?v=\d+"><\/script>/,'<script type="module" src="qa-v34-scene.local.mjs"></script>'));
