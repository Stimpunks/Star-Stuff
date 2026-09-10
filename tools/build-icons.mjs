#!/usr/bin/env node
/**
 * build-icons.mjs — every raster icon on the site, from the one SVG.
 *
 * WHY IT EXISTS
 * The site shipped a single `favicon.svg` and nothing else, which covers the modern
 * tab strip and no other surface: `/favicon.ico` 404'd for every crawler and old
 * browser that asks for it unprompted, iOS had no home-screen icon, and Android had
 * no launcher icon because there was no manifest to put one in.
 *
 * Five files, all derived from `favicon.svg` so the mark cannot drift between them —
 * which is the failure mode of a hand-made icon set, and the reason this is a tool
 * rather than five exports somebody did once.
 *
 * WHY THERE IS NO --check, WHICH IS A DEPARTURE FROM EVERY OTHER GENERATOR HERE
 * The other generators byte-compare their output, and that works because they emit
 * text this repo controls. A PNG is produced by Chrome's encoder: the bytes depend on
 * the Chrome build, and a gate that fails whenever the browser updates is a gate
 * somebody disables. So this regenerates on demand and is NOT in the ship routine.
 * That is a real hole and worth naming: nothing will notice if `favicon.svg` is
 * edited and these are not rebuilt. The mitigation is that the mark changes roughly
 * never, and that the manifest and the head links are checked by other means.
 *
 * WHAT MASKABLE MEANS, AND WHY IT IS A SEPARATE RENDER
 * Android crops an adaptive icon to a circle, a squircle or a rounded square of its
 * own choosing, so the important content must sit inside the central 80%. The rounded
 * rectangle in favicon.svg is exactly the kind of thing that crop eats: the corners go
 * first and the mark ends up in a clipped box inside another box. So the maskable
 * render drops the rounded rect for a full-bleed ground and scales the star to 80%.
 * The `purpose: any` icons keep the rounded rect, because that is what most launchers
 * and every desktop surface show unmasked.
 *
 * Usage
 *   node tools/build-icons.mjs          # write every icon
 *   node tools/build-icons.mjs --list   # say what would be written, touch nothing
 *
 * Requires: Google Chrome. Node 22+.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9415;
const LIST = process.argv.includes('--list');

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('No Chrome/Chromium found.'); process.exit(1); }

const SVG = fs.readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8');

/* The ground and the star, lifted from favicon.svg rather than restated, so a palette
   change there reaches every icon. If either regex stops matching, the file has been
   restructured and this tool should fail loudly rather than invent a colour. */
const ground = SVG.match(/<rect[^>]*fill="(#[0-9a-fA-F]{3,8})"/);
const star = SVG.match(/<polygon([^>]*)\/>/);
if (!ground || !star) {
  console.error('favicon.svg no longer has the <rect fill> + <polygon> shape this tool reads.\n'
    + 'Fix the tool against the new file rather than hardcoding a colour here.');
  process.exit(1);
}
const GROUND = ground[1];
const STAR_ATTRS = star[1];

/* Full-bleed: no rounded corners, no transparency. iOS composites an
   apple-touch-icon onto nothing and shows the alpha as a hole, and Android masks the
   maskable one itself, so both want a square that reaches every edge. */
const bleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">`
  + `<rect width="32" height="32" fill="${GROUND}"/>`
  + `<g transform="translate(16 16) scale(${scale}) translate(-16 -16)"><polygon${STAR_ATTRS}/></g>`
  + `</svg>`;

/* `alpha` is not cosmetic, and the first run of this tool got it wrong: Chrome
   composites a screenshot onto WHITE unless the default background colour is
   overridden, so the rounded-corner icons came out as a dark rounded rect inside a
   white square — RGB, no alpha channel, visibly wrong on any dark tab strip. Every
   rounded target therefore asks for alpha, and every full-bleed one refuses it,
   because iOS renders an apple-touch-icon's transparency as a hole. */
const TARGETS = [
  /* purpose: any, and every desktop surface — keep the rounded rectangle. */
  { file: 'icon-192.png', size: 192, svg: SVG, alpha: true },
  { file: 'icon-512.png', size: 512, svg: SVG, alpha: true },
  /* iOS home screen. 180x180 is the size iOS asks for, and it must be opaque. */
  { file: 'apple-touch-icon.png', size: 180, svg: bleed(1) },
  /* Android adaptive. Full bleed, star inside the central 80%. */
  { file: 'icon-maskable-512.png', size: 512, svg: bleed(0.8) },
  /* The three the ICO carries. Not shipped as PNGs. */
  { file: null, size: 48, svg: SVG, ico: true, alpha: true },
  { file: null, size: 32, svg: SVG, ico: true, alpha: true },
  { file: null, size: 16, svg: SVG, ico: true, alpha: true },
];

if (LIST) {
  for (const t of TARGETS) console.log(`  ${(t.file || 'favicon.ico (' + t.size + 'px layer)').padEnd(28)} ${t.size}px`);
  console.log('  favicon.ico                  16 + 32 + 48, packed');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Pack PNGs into an ICO. The format is a 6-byte header, one 16-byte directory entry
 * per image, then the payloads — and a PNG payload is legal in an ICO (Vista onward),
 * which is what lets this avoid a BMP encoder entirely.
 *
 * The one trap: a 256px layer writes its dimension as 0. Nothing here is 256px, but
 * the guard stays because the next person to add a size will not know that.
 */
function ico(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);            // reserved
  head.writeUInt16LE(1, 2);            // type 1 = icon
  head.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const dir = [];
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);   // width
    e.writeUInt8(size >= 256 ? 0 : size, 1);   // height
    e.writeUInt8(0, 2);                        // palette count
    e.writeUInt8(0, 3);                        // reserved
    e.writeUInt16LE(1, 4);                     // colour planes
    e.writeUInt16LE(32, 6);                    // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([head, ...dir, ...pngs.map((p) => p.data)]);
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(fs.mkdtempSync('/tmp/ss-icons-'), 'profile')}`,
    '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); }
  }

  const icoLayers = [];
  try {
    for (const t of TARGETS) {
      /* A data: URL of the SVG in an <img> at the exact pixel size, on a page with no
         margin, so the screenshot IS the icon. Rendering the SVG document directly
         would inherit the viewport rather than the size asked for. */
      const page = `<!doctype html><meta charset="utf-8">`
        + `<style>html,body{margin:0;padding:0;background:transparent}`
        + `img{display:block;width:${t.size}px;height:${t.size}px}</style>`
        + `<img src="data:image/svg+xml;base64,${Buffer.from(t.svg, 'utf8').toString('base64')}">`;
      const url = 'data:text/html;base64,' + Buffer.from(page, 'utf8').toString('base64');

      const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      let id = 0; const pending = new Map();
      const send = (method, params = {}) => new Promise((res) => {
        const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
      });
      ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', {
        width: t.size, height: t.size, deviceScaleFactor: 1, mobile: false,
      });
      if (t.alpha) {
        await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
      }
      await sleep(220);
      const shot = await send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true, fromSurface: true,
        clip: { x: 0, y: 0, width: t.size, height: t.size, scale: 1 },
      });
      if (!shot.result || !shot.result.data) throw new Error(`capture failed at ${t.size}px`);
      const data = Buffer.from(shot.result.data, 'base64');
      if (data.length < 100) throw new Error(`suspiciously small PNG at ${t.size}px (${data.length}B)`);
      /* Read the colour type back out of the IHDR rather than trusting the request:
         6 is RGBA, 2 is RGB. This is the assertion that would have caught the white
         corners on the first run, and it costs four lines. */
      const colourType = data[25];
      if (t.alpha && colourType !== 6) {
        throw new Error(`${t.file || t.size + 'px ICO layer'}: asked for alpha, got PNG colour type ${colourType}`);
      }
      if (!t.alpha && colourType === 6) {
        throw new Error(`${t.file}: must be opaque for iOS and Android, got RGBA`);
      }

      if (t.ico) icoLayers.push({ size: t.size, data });
      else {
        fs.writeFileSync(path.join(ROOT, t.file), data);
        console.log(`  wrote ${t.file.padEnd(28)} ${t.size}x${t.size}  ${(data.length / 1024).toFixed(1)} KB`);
      }
      ws.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
    }
  } finally {
    chrome.kill();
  }

  const packed = ico(icoLayers);
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), packed);
  console.log(`  wrote favicon.ico                 ${icoLayers.map((l) => l.size).join(' + ')}  ${(packed.length / 1024).toFixed(1)} KB`);
  console.log('\nRebuild these whenever favicon.svg changes — NOTHING CHECKS IT (see the header).');
}

main().catch((e) => { console.error(e); process.exit(1); });
