// Local QA only. All generated files use .local. names and must not be deployed.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=new URL('../../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8'),write=(p,s)=>writeFileSync(new URL(p,root),s);
write('dist/qa-v38-title-baseline.local.css',execFileSync('git',['show','7d48b033:dist/title-screen.css'],{cwd:root,encoding:'utf8'}));
const scene=read('dist/index.html').replace('<script src="vendor/phaser.min.js"></script>','').replace(/<script type="module" src="game\.mjs\?v=\d+"><\/script>/,'<script type="module" src="qa-v38-title-scene.local.mjs"></script>');
write('dist/qa-v38-title-scene.local.html',scene);
write('dist/qa-v38-title-before.local.html',scene.replace(/title-screen\.css\?v=\d+/,'qa-v38-title-baseline.local.css'));
write('dist/qa-v38-title-scene.local.mjs',read('tests/qa-v38-title/scene.mjs'));
write('dist/qa-v38-title.local.html',read('tests/qa-v38-title/fixture.html'));
