#!/usr/bin/env node
/* Minimal static file server for local render checks — the print, contrast and
   "does the diagram mean the right thing" passes need the site served, because
   opening a file:// URL drops the relative stylesheet and starstuff.js.
   Local dev tool. Netlify does not run it. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.argv[2]) || 8765;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    // Keep the server inside ROOT: normalize, then reject anything climbing out.
    const path = normalize(join(ROOT, rel));
    if (!path.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

    let target = path;
    try { if ((await stat(target)).isDirectory()) target = join(target, 'index.html'); }
    catch { /* fall through to the .html retry below */ }

    let body;
    try {
      body = await readFile(target);
    } catch {
      // Netlify serves clean URLs, so /changelog must answer as changelog.html.
      target = path + '.html';
      body = await readFile(target);
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(target)] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}).listen(PORT, () => console.log(`serving ${ROOT} at http://localhost:${PORT}`));
