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
  /* The per-page Markdown siblings. Production sets this in _headers; the local
     server needs it too, or a render check sees application/octet-stream and the
     browser offers to download the file — which is the first mistake the spec's
     markdown-source-endpoints page lists. */
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
  /* Installability depends on this exact type: served as anything else, Chromium
     declines to install and says so nowhere a reader would look. Production sets it
     in _headers; a local check that got application/octet-stream would look fine. */
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

/* /.well-known/api-catalog has NO EXTENSION, so the table above cannot reach it, and
   the RFC 9727 type is not optional — an agent that type-checks strictly skips
   anything that is not a Linkset. Keyed by exact path for that reason, and this is
   the only entry that needs to be. */
const EXACT = {
  '/.well-known/api-catalog': 'application/linkset+json; charset=utf-8',
  /* These two have extensions, but the extension gives the WRONG answer: .xml maps to
     application/xml and .txt to text/plain, where _headers sends application/rss+xml
     and text/markdown. Listed so a local check reflects what a reader gets — the spec
     warns that a feed served as application/xml is ignored by some readers, and that
     is exactly the kind of thing a faithful local server should be able to show. */
  '/feed.xml': 'application/rss+xml; charset=utf-8',
  '/llms.txt': 'text/markdown; charset=utf-8',
  /* The SKILL.md is under a directory whose .md mapping is already right, so it needs
     no entry — but the index has no extension problem and every other agent-facing file
     here has bitten us on Content-Type once, so it is listed for symmetry with what
     _headers actually sends. */
  '/.well-known/agent-skills/index.json': 'application/json; charset=utf-8',
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
      'content-type': EXACT[rel] || TYPES[extname(target)] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}).listen(PORT, () => console.log(`serving ${ROOT} at http://localhost:${PORT}`));
