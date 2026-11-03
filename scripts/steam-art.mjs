// Renders every Steam store, library, community and event image from the game's own art, at Steam's sizes,
// into steam/store/. Run with `npm run steam:art` (after `npm install`); it uses Playwright's Chromium.
// The pictures are made from the same drawings as the game (fry boats, fighters, creatures, planets, cards),
// so they always match it. Gameplay screenshots are made separately by scripts/steam-screenshots.mjs.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'steam/store');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

// The game's drawing code, bundled for the page.
const art = await esbuild.build({
  stdin: {
    contents: `
      export { renderBoat } from './src/art/fries.js';
      export { renderFryGuy } from './src/art/fryguy.js';
      export { planetSvg } from './src/art/planets.js';
      export { cardHtml } from './src/ui/dom.js';`,
    resolveDir: root,
  },
  bundle: true,
  format: 'iife',
  globalName: 'FF',
  write: false,
  logLevel: 'warning',
});
const fonts = [
  ['Lilita One', 400, '@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff2'],
  ['Nunito', 700, '@fontsource/nunito/files/nunito-latin-700-normal.woff2'],
  ['Nunito', 900, '@fontsource/nunito/files/nunito-latin-900-normal.woff2'],
]
  .map(
    ([family, weight, file]) =>
      `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(join(root, 'node_modules', file)).toString('base64')}) format('woff2')}`,
  )
  .join('');
const gameCss = readFileSync(join(root, 'styles.css'), 'utf8');

// Styles for the pictures: the diner sunburst, the logo, and how the drawings are placed.
const css = `
${fonts}
${gameCss}
html, body { margin: 0; background: transparent; overflow: hidden; }
.sa-stage { position: relative; overflow: hidden; font-family: var(--font-body); }
/* The sunburst: mustard rays from a point, red around the edges, a faint halftone over it all. */
.sa-burst { position: absolute; inset: 0;
  background:
    radial-gradient(circle at var(--bx) var(--by), rgba(255, 250, 240, .55) 0, transparent 34%),
    radial-gradient(circle at var(--bx) var(--by), transparent 38%, rgba(224, 52, 42, .82) 92%),
    repeating-conic-gradient(from 4deg at var(--bx) var(--by), #f6c844 0 6deg, #fbdc72 6deg 12deg); }
.sa-dots { position: absolute; inset: 0; opacity: .12;
  background: radial-gradient(circle, #2b1d14 1.4px, transparent 1.6px) 0 0 / 14px 14px; }
/* The counter along the bottom: red, with a white stripe and a dark edge. */
.sa-counter { position: absolute; left: 0; right: 0; bottom: 0; background: #e0342a;
  border-top: calc(var(--u) * .5) solid #2b1d14; box-shadow: inset 0 calc(var(--u) * 1.4) 0 #fffaf0, inset 0 calc(var(--u) * 1.9) 0 #2b1d14; }
.sa-counter::after { content: ''; position: absolute; inset: calc(var(--u) * 2.6) 0 0;
  background: repeating-linear-gradient(90deg, #e0342a 0 calc(var(--u) * 4), #c92a21 0 calc(var(--u) * 8)); }
/* The logo, as on the title screen: mustard "French", red "Fried!", thick ink outline and drop shadow. */
.sa-logo { position: absolute; margin: 0; display: flex; flex-direction: column; line-height: .84;
  font-family: var(--font-head); font-weight: 400; color: var(--mustard); white-space: nowrap;
  -webkit-text-stroke: .085em #2b1d14; paint-order: stroke fill;
  text-shadow: .06em .07em 0 #2b1d14, .02em .1em 0 #2b1d14; transform: translate(-50%, -50%) rotate(-5deg); }
.sa-logo span:last-child { color: var(--red); margin-left: .9em; }
.sa-item { position: absolute; transform: translate(-50%, -50%); }
.sa-item > svg { width: 100%; height: 100%; display: block; overflow: visible; }
.sa-shadow { filter: drop-shadow(0 calc(var(--u) * .7) 0 rgba(43, 29, 20, .35)); }
.sa-cardwrap { position: absolute; transform-origin: 50% 100%; }
.sa-cardwrap .card { box-shadow: 0 6px 0 #2b1d14; cursor: default; }
.sa-steam { position: absolute; width: calc(var(--u) * 1.2); border-radius: 50%;
  border: calc(var(--u) * .35) solid rgba(255, 250, 240, .8); border-color: rgba(255, 250, 240, .8) transparent transparent;
  height: calc(var(--u) * 5); }
`;

// The cast, drawn from the game: fighters, creatures, boats and planets.
const FIGHTERS = {
  curly: { name: 'Curly', traits: ['curly'], hue: 44 },
  golden: { name: 'Goldie', traits: ['golden'], hue: 44, titles: ['champ'] },
  spicy: { name: 'Blaze', traits: ['spicy', 'thick'], hue: 40 },
  tot: { name: 'Tot', traits: ['tot'], hue: 46 },
  vampire: { name: 'Count', traits: ['vampire', 'purple'], hue: 44 },
  waffle: { name: 'Waffles', traits: ['waffle'], hue: 44 },
  crinkle: { name: 'Crinkle', traits: ['crinkle'], hue: 44 },
  plain: { name: 'Spud', traits: [], hue: 45 },
  corndog: { name: 'Knight', traits: [], species: 'hotdog', creature: 'corndogknight' },
  burger: { name: 'Decker', traits: [], species: 'burger', creature: 'doubledecker' },
  soda: { name: 'Gulp', traits: [], species: 'soda', creature: 'megagulp' },
  candy: { name: 'Storm', traits: [], species: 'cottoncandy', creature: 'rainbowwisp' },
  alien: { name: 'Empress', traits: [], species: 'alien', creature: 'xenoempress' },
  squid: { name: 'Tentaclor', traits: [], species: 'alien', creature: 'tentaclor' },
};
const HERO_BOAT = ['chili', 'cheddar', 'bacon', 'jalapeno', 'cowboyhat'];

/**
 * One picture, described as pieces placed on a w x h stage. Positions are fractions of the stage
 * (x, y = the piece's center); sizes are fractions of the stage height.
 */
function stage(w, h, pieces, { burst = [0.5, 0.45], counter = 0, transparent = false } = {}) {
  const u = h / 100; // one "unit": a hundredth of the height
  const px = (f) => `${(f * h).toFixed(1)}px`;
  const at = (p) => `left:${(p.x * w).toFixed(1)}px;top:${(p.y * h).toFixed(1)}px`;
  const body = pieces
    .map((p) => {
      if (p.logo)
        return `<h1 class="sa-logo" style="${at(p)};font-size:${px(p.logo)}"><span>French</span><span>Fried!</span></h1>`;
      if (p.cards) {
        // A fan of ingredient cards, spreading from one point.
        const n = p.cards.length;
        return p.cards
          .map((id, i) => {
            const turn = (p.tilt ?? 0) + (i - (n - 1) / 2) * (p.spread ?? 11);
            return `<div class="sa-cardwrap" style="${at(p)};transform:translate(-50%,-100%) rotate(${turn}deg) scale(${(p.size * h) / 168})"><div class="sa-scope">${'@CARD:' + id}</div></div>`;
          })
          .join('');
      }
      const svg = p.boat
        ? `@BOAT:${p.boat.join(',')}`
        : p.fighter
          ? `@FIGHTER:${p.fighter}:${p.mood ?? 'happy'}:${p.flip ? 1 : 0}`
          : p.planet
            ? `@PLANET:${p.planet}`
            : '';
      const size = px(p.size);
      return `<div class="sa-item ${p.shadow === false ? '' : 'sa-shadow'}" style="${at(p)};width:${size};height:${size};transform:translate(-50%,-50%) rotate(${p.rot ?? 0}deg)">${svg}</div>`;
    })
    .join('');
  const bg = transparent
    ? ''
    : `<div class="sa-burst" style="--bx:${burst[0] * 100}%;--by:${burst[1] * 100}%"></div><div class="sa-dots"></div>${
        counter ? `<div class="sa-counter" style="height:${px(counter)}"></div>` : ''
      }`;
  return `<div class="sa-stage" style="width:${w}px;height:${h}px;--u:${u}px">${bg}${body}</div>`;
}

// Every image: its file, its size, and what's on it.
const ART = [
  // The capsules: logo big and legible, the boat and a few of the cast around it.
  {
    file: 'header_capsule.png',
    w: 920,
    h: 430,
    pieces: [
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.69, y: 1.02, size: 0.4, spread: 12, tilt: -30 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.83, y: 1.02, size: 0.4, spread: 12, tilt: 30 },
      { boat: HERO_BOAT, x: 0.76, y: 0.6, size: 0.82 },
      { fighter: 'golden', x: 0.95, y: 0.76, size: 0.36, rot: 8, flip: true },
      { logo: 0.25, x: 0.33, y: 0.47 },
    ],
    opts: { burst: [0.72, 0.5], counter: 0.12 },
  },
  {
    file: 'small_capsule.png',
    w: 462,
    h: 174,
    pieces: [
      { boat: HERO_BOAT, x: 0.82, y: 0.56, size: 0.98 },
      { logo: 0.33, x: 0.38, y: 0.5 },
    ],
    opts: { burst: [0.8, 0.5] },
  },
  {
    file: 'main_capsule.png',
    w: 1232,
    h: 706,
    pieces: [
      { planet: 'burger', x: 0.08, y: 0.15, size: 0.17, rot: -10 },
      { planet: 'alien', x: 0.92, y: 0.15, size: 0.2, rot: 8 },
      { planet: 'cottoncandy', x: 0.2, y: 0.08, size: 0.09 },
      { planet: 'soda', x: 0.81, y: 0.07, size: 0.08 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.43, y: 1.0, size: 0.3, spread: 12, tilt: -32 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.57, y: 1.0, size: 0.3, spread: 12, tilt: 32 },
      { boat: HERO_BOAT, x: 0.5, y: 0.66, size: 0.56 },
      { fighter: 'corndog', x: 0.1, y: 0.7, size: 0.3, rot: -6 },
      { fighter: 'curly', x: 0.25, y: 0.8, size: 0.25, rot: -4 },
      { fighter: 'golden', x: 0.75, y: 0.8, size: 0.25, rot: 5, flip: true },
      { fighter: 'soda', x: 0.9, y: 0.7, size: 0.3, rot: 6, flip: true },
      { logo: 0.18, x: 0.5, y: 0.22 },
    ],
    opts: { burst: [0.5, 0.55], counter: 0.1 },
  },
  {
    file: 'vertical_capsule.png',
    w: 748,
    h: 896,
    pieces: [
      { planet: 'alien', x: 0.86, y: 0.08, size: 0.13, rot: 8 },
      { planet: 'burger', x: 0.12, y: 0.4, size: 0.08 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.42, y: 1.0, size: 0.25, spread: 12, tilt: -32 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.58, y: 1.0, size: 0.25, spread: 12, tilt: 32 },
      { boat: HERO_BOAT, x: 0.5, y: 0.64, size: 0.46 },
      { fighter: 'curly', x: 0.14, y: 0.8, size: 0.21, rot: -6 },
      { fighter: 'golden', x: 0.86, y: 0.8, size: 0.21, rot: 6, flip: true },
      { logo: 0.16, x: 0.5, y: 0.22 },
    ],
    opts: { burst: [0.5, 0.6], counter: 0.08 },
  },
  // The page background: the sunburst and planets, no text (Steam darkens and fades it).
  {
    file: 'page_background.png',
    w: 1438,
    h: 810,
    pieces: [
      { planet: 'burger', x: 0.07, y: 0.2, size: 0.18 },
      { planet: 'soda', x: 0.93, y: 0.45, size: 0.15 },
      { planet: 'cottoncandy', x: 0.12, y: 0.75, size: 0.12 },
      { planet: 'alien', x: 0.9, y: 0.12, size: 0.14 },
    ],
    opts: { burst: [0.5, 0.35] },
  },
  // The library: a tall capsule, a wide header, a hero with no text, and the logo on its own.
  {
    file: 'library_capsule.png',
    w: 600,
    h: 900,
    pieces: [
      { planet: 'alien', x: 0.86, y: 0.08, size: 0.13, rot: 8 },
      { planet: 'burger', x: 0.12, y: 0.4, size: 0.08 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.42, y: 1.0, size: 0.23, spread: 12, tilt: -32 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.58, y: 1.0, size: 0.23, spread: 12, tilt: 32 },
      { boat: HERO_BOAT, x: 0.5, y: 0.63, size: 0.42 },
      { fighter: 'curly', x: 0.14, y: 0.8, size: 0.19, rot: -6 },
      { fighter: 'golden', x: 0.86, y: 0.8, size: 0.19, rot: 6, flip: true },
      { logo: 0.135, x: 0.5, y: 0.21 },
    ],
    opts: { burst: [0.5, 0.6], counter: 0.08 },
  },
  {
    file: 'library_header.png',
    w: 920,
    h: 430,
    pieces: [
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.69, y: 1.02, size: 0.4, spread: 12, tilt: -30 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.83, y: 1.02, size: 0.4, spread: 12, tilt: 30 },
      { boat: HERO_BOAT, x: 0.76, y: 0.6, size: 0.82 },
      { fighter: 'golden', x: 0.95, y: 0.76, size: 0.36, rot: 8, flip: true },
      { logo: 0.25, x: 0.33, y: 0.47 },
    ],
    opts: { burst: [0.72, 0.5], counter: 0.12 },
  },
  {
    // No text: Steam puts the library logo over it. The main content stays in the middle.
    file: 'library_hero.png',
    w: 3840,
    h: 1240,
    pieces: [
      { planet: 'hotdog', x: 0.12, y: 0.22, size: 0.2, rot: -8 },
      { planet: 'cottoncandy', x: 0.25, y: 0.12, size: 0.1 },
      { planet: 'soda', x: 0.75, y: 0.12, size: 0.1 },
      { planet: 'alien', x: 0.88, y: 0.22, size: 0.22, rot: 8 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.47, y: 1.0, size: 0.32, spread: 12, tilt: -34 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.53, y: 1.0, size: 0.32, spread: 12, tilt: 34 },
      { boat: HERO_BOAT, x: 0.5, y: 0.6, size: 0.6 },
      { fighter: 'curly', x: 0.37, y: 0.76, size: 0.3, rot: -5 },
      { fighter: 'golden', x: 0.63, y: 0.76, size: 0.3, rot: 5, flip: true },
      { fighter: 'corndog', x: 0.27, y: 0.72, size: 0.32, rot: -4 },
      { fighter: 'soda', x: 0.73, y: 0.72, size: 0.32, rot: 4, flip: true },
      { fighter: 'burger', x: 0.17, y: 0.76, size: 0.28, rot: -6 },
      { fighter: 'candy', x: 0.83, y: 0.74, size: 0.3, rot: 6, flip: true },
      { fighter: 'alien', x: 0.07, y: 0.74, size: 0.3, rot: -4 },
      { fighter: 'squid', x: 0.93, y: 0.76, size: 0.28, rot: 4, flip: true },
    ],
    opts: { burst: [0.5, 0.55], counter: 0.1 },
  },
  {
    file: 'library_logo.png',
    w: 1280,
    h: 720,
    pieces: [{ logo: 0.38, x: 0.5, y: 0.5 }],
    opts: { transparent: true },
  },
  // News posts.
  {
    file: 'event_cover.png',
    w: 800,
    h: 450,
    pieces: [
      { planet: 'alien', x: 0.9, y: 0.16, size: 0.2, rot: 8 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.42, y: 1.0, size: 0.32, spread: 12, tilt: -32 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.58, y: 1.0, size: 0.32, spread: 12, tilt: 32 },
      { boat: HERO_BOAT, x: 0.5, y: 0.68, size: 0.5 },
      { fighter: 'curly', x: 0.16, y: 0.76, size: 0.32, rot: -6 },
      { fighter: 'golden', x: 0.84, y: 0.76, size: 0.32, rot: 6, flip: true },
      { logo: 0.16, x: 0.5, y: 0.2 },
    ],
    opts: { burst: [0.5, 0.6], counter: 0.1 },
  },
  {
    file: 'event_header.png',
    w: 1920,
    h: 622,
    pieces: [
      { planet: 'burger', x: 0.95, y: 0.2, size: 0.18 },
      { planet: 'alien', x: 0.52, y: 0.18, size: 0.14, rot: 8 },
      { cards: ['ketchup', 'cheddar', 'bacon'], x: 0.69, y: 1.02, size: 0.38, spread: 12, tilt: -30 },
      { cards: ['truffleoil', 'cowboyhat', 'crown'], x: 0.79, y: 1.02, size: 0.38, spread: 12, tilt: 30 },
      { boat: HERO_BOAT, x: 0.74, y: 0.6, size: 0.72 },
      { fighter: 'curly', x: 0.55, y: 0.78, size: 0.34, rot: -8 },
      { fighter: 'golden', x: 0.92, y: 0.78, size: 0.34, rot: 8, flip: true },
      { logo: 0.26, x: 0.27, y: 0.5 },
    ],
    opts: { burst: [0.72, 0.5], counter: 0.1 },
  },
  // Icons: the boat from the app icon, on ketchup red.
  {
    file: 'community_icon.jpg',
    w: 184,
    h: 184,
    pieces: [{ boat: ['ketchup', 'salt', 'sunglasses'], x: 0.5, y: 0.54, size: 1.02, shadow: false }],
    opts: { icon: true },
  },
  // The client icons: the same rounded icon at every size Windows and Linux ask for (packed into an .ico below).
  ...[16, 24, 32, 48, 64, 96, 128, 256].map((n) => ({
    file: `icons/icon_${n}.png`,
    w: n,
    h: n,
    pieces: [{ boat: ['ketchup', 'salt', 'sunglasses'], x: 0.5, y: 0.54, size: 1.02, shadow: false }],
    opts: { icon: true, round: true },
  })),
];

/** A Windows .ico holding PNG images (supported since Windows Vista). */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e); // 0 means 256
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // color planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const html = (inner) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${inner}</body></html>`;

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'icons'), { recursive: true });
const browser = await chromium.launch();
for (const a of ART) {
  const page = await browser.newPage({ viewport: { width: a.w, height: a.h } });
  let inner = stage(a.w, a.h, a.pieces, a.opts);
  if (a.opts?.icon)
    inner = `<div style="width:${a.w}px;height:${a.h}px;background:#e0342a;border-radius:${a.opts.round ? '18%' : '0'};overflow:hidden;position:relative">${stage(a.w, a.h, a.pieces, { transparent: true })}</div>`;
  await page.setContent(html(inner));
  await page.addScriptTag({ content: art.outputFiles[0].text });
  // Swap the placeholders for the game's drawings.
  await page.evaluate((FIGHTERS) => {
    const F = window.FF;
    for (const el of document.querySelectorAll('.sa-item, .sa-scope')) {
      const [kind, ...rest] = el.textContent.split(':');
      if (kind === '@BOAT') el.innerHTML = F.renderBoat(rest[0].split(','));
      else if (kind === '@FIGHTER')
        el.innerHTML = F.renderFryGuy(FIGHTERS[rest[0]], { mood: rest[1], flip: rest[2] === '1' });
      else if (kind === '@PLANET')
        el.innerHTML = `<svg viewBox="-4 -4 108 108">${F.planetSvg(rest[0])}</svg>`;
      else if (kind === '@CARD') el.outerHTML = F.cardHtml(rest[0], { tag: 'div' });
    }
  }, FIGHTERS);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const jpg = a.file.endsWith('.jpg');
  await page.screenshot({
    path: join(out, a.file),
    clip: { x: 0, y: 0, width: a.w, height: a.h },
    ...(jpg ? { type: 'jpeg', quality: 92 } : { omitBackground: !!a.opts?.transparent || !!a.opts?.round }),
  });
  await page.close();
  console.log('  ' + a.file, `${a.w}x${a.h}`);
}
await browser.close();
const sizes = [16, 24, 32, 48, 64, 128, 256];
writeFileSync(
  join(out, 'icons/client_icon.ico'),
  ico(sizes.map((size) => ({ size, data: readFileSync(join(out, `icons/icon_${size}.png`)) }))),
);
console.log('  icons/client_icon.ico', sizes.join(', '));
console.log(`Steam art in ${out}`);
