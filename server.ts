import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncRuntime } from './scripts/sync-runtime.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

syncRuntime({ rootDir: __dirname });

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use((req, res, next) => {
  const reqPath = req.path || '/';
  if (reqPath === '/' || reqPath.endsWith('/') || reqPath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (typeof req.query?.v === 'string' || reqPath.startsWith('/assets/') || /\/assets\//.test(reqPath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  next();
});

app.use(express.static(distDir, { extensions: ['html'] }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
