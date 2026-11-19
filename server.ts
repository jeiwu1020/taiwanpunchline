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

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(express.static(distDir, { extensions: ['html'] }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
