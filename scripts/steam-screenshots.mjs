// Takes the Steam store screenshots (1920x1080) from the real game: builds a late-game save with the game's
// own rules, loads the built game (dist/index.html) in Playwright's Chromium, and photographs each part of it
// into steam-images/screenshots/. Run with `npm run steam:screenshots` (it builds the game first).
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RECIPES } from '../src/data/recipes.js';
import { ALL_INGREDIENTS } from '../src/data/ingredients.js';
import { OBJECTS } from '../src/data/objects.js';
import { ACHIEVEMENTS } from '../src/game/achievements.js';
import { newFry } from '../src/game/lab/breeding.js';
import { makeRng } from '../src/game/rng.js';
import { defaultState, SAVE_KEY } from '../src/game/state.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'steam-images/screenshots');
const { chromium } = createRequire(import.meta.url)('playwright');

/** A late-game save: everything unlocked, a full Lab, lots of recipes found, two worlds visited. */
function showcaseSave() {
  const now = Date.now();
  const s = defaultState(now);
  const rng = makeRng('steam-showcase');
  s.tutorialDone = true;
  s.money = 184250;
  s.lifetime = 2650000;
  s.unlocks = { premium: true, thrift: true, lab: true, fryer: true, masterchef: true };
  for (const c of ALL_INGREDIENTS) s.deck[c.id] = 2;
  for (const o of OBJECTS.slice(0, 24)) s.deck[o.id] = 1;
  // About 430 of the 1,001 recipes, found over the last few weeks.
  RECIPES.filter((r, i) => i % 7 < 3).forEach((r, i) => (s.discovered[r.key] = now - i * 3.6e6));
  // The Lab: fighters with traits, wins and titles, plus two grown from world DNA.
  const fighters = [
    { name: 'Sir Crisps', traits: ['curly', 'spicy'], wins: 41, titles: ['rookie', 'pro', 'master'], gen: 6 },
    {
      name: 'Goldie',
      traits: ['golden', 'crispy', 'salted'],
      wins: 58,
      titles: ['rookie', 'pro', 'master', 'legend'],
      gen: 9,
    },
    { name: 'Count Spudula', traits: ['vampire', 'purple'], wins: 23, titles: ['rookie'], gen: 4 },
    { name: 'Waffles', traits: ['waffle', 'cheesy'], wins: 17, titles: ['rookie'], gen: 3 },
    { name: 'Tiny Tot', traits: ['tot', 'regen'], wins: 12, gen: 2 },
    { name: 'Ridges', traits: ['crinkle', 'thick'], wins: 9, gen: 2 },
    { name: 'Glowbert', traits: ['glow', 'shoestring'], wins: 5, gen: 1 },
    { name: 'Sir Loin', traits: [], species: 'burger', creature: 'doubledecker', wins: 14, gen: 1 },
    { name: 'Corny', traits: [], species: 'hotdog', creature: 'corndogknight', wins: 19, gen: 1 },
  ];
  for (const f of fighters) s.lab.fries.push(newFry(s, rng, { titles: [], ...f }));
  s.fryer.champions = { rookie: 3, pro: 2, master: 1, legend: 1 };
  s.fryer.wins = 214;
  s.fryer.losses = 31;
  s.worlds.owned = ['hotdog', 'burger'];
  s.worlds.seen = { wienerwhelp: 3, chilibrute: 2, corndogknight: 1, sliderling: 2, doubledecker: 1 };
  s.worlds.dna = { corndogknight: 2, doubledecker: 1, chilibrute: 1 };
  s.worlds.explores = 18;
  s.worlds.dnaCollected = 14;
  Object.assign(s.stats, {
    cooks: 1840,
    packs: 96,
    objects: 24,
    bred: 30,
    spuds: 22,
    spliced: 41,
    maxGen: 9,
  });
  // Achievements already earned, so their pop-ups don't cover the screenshots.
  for (const a of ACHIEVEMENTS) s.achievements[a.id] = now;
  s.settings.music = false; // quiet while photographing
  return s;
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
// A 1280x720 window at 1.5x: 1920x1080 pictures, with the interface at a comfortable size.
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
const save = JSON.stringify(showcaseSave());
await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, save]);
await page.goto(pathToFileURL(join(root, 'dist/index.html')).href);
await page.click('#playBtn');
await page.waitForTimeout(600);

const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, name) });
  console.log('  ' + name);
};
const go = async (screen) => {
  await page.click(`[data-go="${screen}"]`);
  await page.waitForTimeout(500);
};
const closeModal = async () => {
  const close = page.locator('[data-close]:visible').first();
  if (await close.count()) await close.click();
  await page.waitForTimeout(300);
};

// 1. The Kitchen: the tastiest-looking cards in the hand played into the boat.
await go('kitchen');
const LOOKS_GOOD =
  /cheese|chili|bacon|ketchup|gravy|ranch|jalape|bbq|sriracha|truffle|egg|hat|crown|glasses|mustard|curd/i;
// The hand redraws after every card, so look it up afresh each time.
for (let played = 0; played < 4; played++) {
  const titles = await page.locator('.hand .card:visible').evaluateAll((cards) => cards.map((c) => c.title));
  const pick = titles.findIndex((t) => LOOKS_GOOD.test(t));
  if (pick < 0) break;
  await page.locator('.hand .card:visible').nth(pick).click();
  await page.waitForTimeout(300);
}
await shot('01_kitchen.png');
// 2. Frying a new recipe: clear the boat, let the Master Chef pick the cards, fry them.
const clear = page.locator('button:has-text("Clear"):visible').first();
if (await clear.count()) await clear.click();
await page.waitForTimeout(300);
const chef = page.locator('[data-chef]:visible').first();
if (await chef.count()) await chef.click();
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForTimeout(1600);
await shot('02_new_recipe.png');
await closeModal();
// 3. The recipe book.
await go('book');
await shot('03_recipe_book.png');
// 4. The Lab.
await go('lab');
await shot('04_lab.png');
// 5. The Fryer: pick the champion, enter the Legendary Vat, and catch the battle mid-fight.
await go('fryer');
await shot('05_fryer.png');
const visible = (sel) => page.locator(`${sel}:visible`).first();
const tap = async (sel) => {
  const el = visible(sel);
  if (!(await el.count())) return false;
  await el.click();
  await page.waitForTimeout(400);
  return true;
};
await tap('[data-fry]');
await tap('[data-league="legend"]');
await tap('button:has-text("Enter")');
const fight = visible('button:has-text("Fight")');
if (await fight.count()) {
  await fight.click();
  await page.waitForTimeout(1400);
  // The fight log scrolls the page down; bring the two fighters back into view.
  await page.evaluate(() => document.querySelector('#fa')?.scrollIntoView({ block: 'center' }));
  await shot('06_battle.png');
}
// 7. Worlds.
await page.goto(pathToFileURL(join(root, 'dist/index.html')).href);
await page.click('#playBtn');
await go('worlds');
await shot('07_worlds.png');
// 8. The Shop.
await go('shop');
await shot('08_shop.png');
await browser.close();
console.log(`Screenshots in ${out}`);
