import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_ROOT = resolve(__dirname, '..');

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function syncDirectory(srcDir, destDir, { force = false, prune = false } = {}) {
  if (!existsSync(srcDir)) {
    throw new Error(`Missing protected source directory: ${srcDir}`);
  }
  mkdirSync(destDir, { recursive: true });

  const srcFiles = walkFiles(srcDir);
  const expectedRelPaths = new Set();
  let copied = 0;

  for (const srcPath of srcFiles) {
    const relPath = relative(srcDir, srcPath);
    expectedRelPaths.add(relPath);
    const destPath = join(destDir, relPath);
    const srcStat = statSync(srcPath);

    let needsCopy = force || !existsSync(destPath);
    if (!needsCopy) {
      const destStat = statSync(destPath);
      if (
        destStat.size !== srcStat.size ||
        Math.abs(destStat.mtimeMs - srcStat.mtimeMs) > 2
      ) {
        needsCopy = true;
      }
    }

    if (needsCopy) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      utimesSync(destPath, srcStat.atime, srcStat.mtime);
      copied++;
    }
  }

  let removed = 0;
  if (prune) {
    for (const destPath of walkFiles(destDir)) {
      const relPath = relative(destDir, destPath);
      if (!expectedRelPaths.has(relPath)) {
        rmSync(destPath, { force: true });
        removed++;
      }
    }
  }

  return { total: srcFiles.length, copied, removed };
}

export function syncRuntime({
  rootDir = DEFAULT_ROOT,
  force = false,
  prune = true,
  quiet = false,
} = {}) {
  const pairs = [
    ['app-source', 'dist'],
    ['release-config', 'build'],
  ];
  const summary = {};
  for (const [srcName, destName] of pairs) {
    const srcDir = join(rootDir, srcName);
    const destDir = join(rootDir, destName);
    if (!existsSync(srcDir) && existsSync(destDir)) {
      const seeded = syncDirectory(destDir, srcDir, { force, prune: false });
      if (!quiet) {
        console.log(
          `[sync-runtime] initialized ${srcName} from ${destName} (${seeded.copied}/${seeded.total})`,
        );
      }
    }
    summary[destName] = syncDirectory(srcDir, destDir, { force, prune });
  }
  if (
    !quiet &&
    (summary.dist.copied > 0 || summary.dist.removed > 0 || summary.build.copied > 0 || summary.build.removed > 0)
  ) {
    console.log(
      `[sync-runtime] dist: ${summary.dist.copied} copied, ${summary.dist.removed} stale removed, ${summary.dist.total} source files; build: ${summary.build.copied} copied, ${summary.build.removed} stale removed, ${summary.build.total} source files`,
    );
  }
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  const force = process.argv.includes('--force');
  const prune = !process.argv.includes('--no-prune');
  const quiet = process.argv.includes('--quiet');
  syncRuntime({ force, prune, quiet });
}
