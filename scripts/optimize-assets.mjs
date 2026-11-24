import {readdirSync,statSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,relative,extname,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Set(process.argv.slice(2));
const apply = args.has('--write');
const includeAudio = args.has('--audio');
const targetDir = join(root, 'app-source', 'assets');
const backupDir = join(root, '.asset-backups');

function hasTool(cmd) {
  const res = spawnSync('which', [cmd], {encoding: 'utf8'});
  return res.status === 0;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const tools = {
  pngquant: hasTool('pngquant'),
  optipng: hasTool('optipng'),
  cwebp: hasTool('cwebp'),
  ffmpeg: hasTool('ffmpeg'),
};

console.log('=== 拳民開講｜本地素材無損／輕量壓縮助手 ===');
console.log(`模式: ${apply ? '實際覆寫 (--write)' : '預覽統計 (乾跑模式，加上 --write 才會修改檔案)'}`);
console.log('偵測到的工具:', JSON.stringify(tools));
console.log('⚠️ 注意：若執行 --write 修改了 app-source/assets 內的檔案，請同步更新 build/asset-release-plan.json 的 SHA-256 雜湊後再執行 build-release-output.mjs。');

const files = walk(targetDir);
let totalBytes = 0;
let savedBytes = 0;
let pngCount = 0;
let webpCount = 0;
let audioCount = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const rel = relative(root, file);
  const before = statSync(file).size;
  totalBytes += before;

  if (ext === '.png') pngCount++;
  else if (ext === '.webp') webpCount++;
  else if (ext === '.mp3' || ext === '.wav' || ext === '.ogg') audioCount++;

  if (!apply) continue;

  if (ext === '.png' && (tools.pngquant || tools.optipng)) {
    const backup = join(backupDir, rel);
    mkdirSync(dirname(backup), {recursive: true});
    if (!existsSync(backup)) copyFileSync(file, backup);
    if (tools.pngquant) {
      spawnSync('pngquant', ['--quality=75-92', '--speed=1', '--force', '--output', file, file], {stdio: 'ignore'});
    }
    if (tools.optipng) {
      spawnSync('optipng', ['-o2', '-quiet', file], {stdio: 'ignore'});
    }
    const after = statSync(file).size;
    if (after > before) copyFileSync(backup, file);
    else savedBytes += (before - after);
  } else if (includeAudio && ext === '.mp3' && tools.ffmpeg) {
    const backup = join(backupDir, rel);
    mkdirSync(dirname(backup), {recursive: true});
    if (!existsSync(backup)) copyFileSync(file, backup);
    const tmp = `${file}.tmp.mp3`;
    const r = spawnSync('ffmpeg', ['-y', '-i', file, '-ac', '1', '-ar', '24000', '-b:a', '64k', tmp], {stdio: 'ignore'});
    if (r.status === 0 && existsSync(tmp)) {
      const after = statSync(tmp).size;
      if (after < before) {
        copyFileSync(tmp, file);
        savedBytes += (before - after);
      }
      spawnSync('rm', ['-f', tmp]);
    }
  }
}

console.log(JSON.stringify({
  scannedFiles: files.length,
  pngCount,
  webpCount,
  audioCount,
  totalMB: Number((totalBytes / 1048576).toFixed(2)),
  savedMB: Number((savedBytes / 1048576).toFixed(2)),
  applied: apply,
}, null, 2));
