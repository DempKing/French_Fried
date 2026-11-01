// The Lab: growing fries, traits, splicing, training and breeding.
import { SPECIES_TRAINING, SPECIES_TRAITS, TRAINING_COST_MULT } from '../../data/species.js';
import { WORLD_MAP } from '../../data/worlds.js';

export const LAB_CAPACITY = 12;
export const WILD_PARENT = 'wild';
export const GROW_COST = 300;
export const BREED_COST = 250;
export const PURGE_COST = 50;
export const COMPOST_VALUE = 40;
/** All traits a fry or creature can have. */
export const TRAITS = [
  { id: 'crispy', name: 'Extra Crispy', cost: 220, desc: '+20% attack.', mods: { atk: 0.2 } },
  { id: 'thick', name: 'Thick Cut', cost: 220, desc: '+25% starch (HP).', mods: { hp: 0.25 } },
  {
    id: 'curly',
    name: 'Curly',
    cost: 260,
    desc: '+12% dodge. Hard to pin down.',
    mods: { dodge: 0.12 },
    shape: 'curly',
  },
  {
    id: 'waffle',
    name: 'Waffle Lattice',
    cost: 260,
    desc: '+50% grease armor (defense).',
    mods: { def: 0.5 },
    shape: 'waffle',
  },
  {
    id: 'shoestring',
    name: 'Shoestring',
    cost: 200,
    desc: '+35% speed, -10% HP.',
    mods: { spd: 0.35, hp: -0.1 },
    shape: 'shoestring',
  },
  {
    id: 'spicy',
    name: 'Spicy Gene',
    cost: 320,
    desc: '30% chance to burn the foe for 3 turns.',
    effect: 'burn',
  },
  {
    id: 'cheesy',
    name: 'Cheesy Armor',
    cost: 300,
    desc: 'The first hit taken is reduced by 70%.',
    effect: 'shield',
  },
  { id: 'truffle', name: 'Truffle Aura', cost: 340, desc: '+15% critical chance.', mods: { crit: 0.15 } },
  {
    id: 'glow',
    name: 'Glow-in-the-Dark',
    cost: 280,
    desc: 'Dazzles foes: they miss 15% more.',
    effect: 'blind',
  },
  {
    id: 'regen',
    name: 'Regenerating Starch',
    cost: 360,
    desc: 'Heals 5% max HP each round.',
    effect: 'regen',
  },
  {
    id: 'sweet',
    name: 'Sweet Potato',
    cost: 240,
    desc: '+35% HP, -10% speed.',
    mods: { hp: 0.35, spd: -0.1 },
    color: '#e8823a',
  },
  {
    id: 'double',
    name: 'Double Fried',
    cost: 380,
    desc: '+12% attack, +10% crit.',
    mods: { atk: 0.12, crit: 0.1 },
  },
  { id: 'salted', name: 'Salted Edge', cost: 300, desc: '25% chance to cause bleeding.', effect: 'bleed' },
  { id: 'vampire', name: 'Vampire Spud', cost: 420, desc: 'Heals 30% of damage dealt.', effect: 'lifesteal' },
  {
    id: 'tot',
    name: 'Tater Tot Form',
    cost: 400,
    desc: '15% chance to stun the foe.',
    effect: 'stun',
    shape: 'tot',
  },
  {
    id: 'crinkle',
    name: 'Crinkle Cut',
    cost: 300,
    desc: 'Reflects 20% of damage taken.',
    effect: 'thorns',
    shape: 'crinkle',
  },
  {
    id: 'golden',
    name: 'Golden Genes',
    cost: 500,
    desc: '+50% Fryer prize money.',
    effect: 'golden',
    color: '#f2c94c',
  },
  {
    id: 'purple',
    name: 'Purple Majesty',
    cost: 260,
    desc: '+10% to all stats. Very regal.',
    mods: { hp: 0.1, atk: 0.1, def: 0.1, spd: 0.1 },
    color: '#8e5bd6',
  },
  // World DNA traits: only obtainable from creature DNA.
  {
    id: 'relish',
    name: 'Relish Rage',
    cost: 0,
    world: 'hotdog',
    desc: '+30% attack while below half HP.',
    effect: 'relish',
  },
  {
    id: 'stack',
    name: 'Double Stack',
    cost: 0,
    world: 'burger',
    desc: '+30% HP and +25% defense.',
    mods: { hp: 0.3, def: 0.25 },
  },
  {
    id: 'fizz',
    name: 'Fizz Burst',
    cost: 0,
    world: 'soda',
    desc: '25% chance to strike twice.',
    effect: 'fizz',
  },
  {
    id: 'fluff',
    name: 'Sugar Fluff',
    cost: 0,
    world: 'cottoncandy',
    desc: '+15% dodge and heals 3% HP each round.',
    mods: { dodge: 0.15 },
    effect: 'fluff',
  },
  {
    id: 'xenoform',
    name: 'Xeno Physiology',
    cost: 0,
    world: 'alien',
    desc: '+15% to all stats.',
    mods: { hp: 0.15, atk: 0.15, def: 0.15, spd: 0.15 },
  },
];
/** Fry gene-splicing traits (world traits come from DNA; creatures have their own sets). */
export const LAB_TRAITS = TRAITS.filter((t) => !t.world);
for (const [species, list] of Object.entries(SPECIES_TRAITS))
  for (const t of list) TRAITS.push({ ...t, species });
export const TRAIT_MAP = Object.fromEntries(TRAITS.map((t) => [t.id, t]));
// Name parts for new fries.
const NAME_A = [
  'Spud',
  'Tater',
  'Frita',
  'Crispin',
  'Russet',
  'Yukon',
  'Wedgie',
  'Sir Fry',
  'Lady Crisp',
  'Chip',
  'Hashley',
  'Tot',
  'Fryan',
  'Spudrick',
  'Frydrich',
  'Potatina',
  'Ketchum',
  'Starchy',
  'Salty Pete',
  'Greasy Gus',
];
const NAME_B = [
  ' McFryface',
  ' the Crisp',
  ' Jr.',
  ' III',
  '-o-Matic',
  ' Supreme',
  'zilla',
  ' Prime',
  ' the Bold',
  ' Deluxe',
  ' 9000',
  ' the Golden',
  ' von Fry',
  ' Maximus',
  '',
];
export function fryName(rng) {
  return rng.pick(NAME_A) + rng.pick(NAME_B);
}
/** A new fry fighter. */
export function newFry(state, rng, overrides = {}) {
  const f = {
    id: state.lab.nextId++,
    name: fryName(rng),
    gen: 1,
    base: { hp: rng.int(70, 90), atk: rng.int(10, 14), def: rng.int(3, 6), spd: rng.int(6, 10) },
    traits: [],
    trained: 0,
    wins: 0,
    titles: [],
    hue: rng.int(38, 52),
    ...overrides,
  };
  return f;
}
/** A fry's stats with its traits applied. */
export function computeStats(fry) {
  const m = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, dodge: 0 };
  const effects = new Set();
  for (const tid of fry.traits) {
    const t = TRAIT_MAP[tid];
    if (!t) continue;
    for (const [k, v] of Object.entries(t.mods || {})) m[k] += v;
    if (t.effect) effects.add(t.effect);
  }
  return {
    name: fry.name,
    hp: Math.round(fry.base.hp * (1 + m.hp)),
    atk: Math.round(fry.base.atk * (1 + m.atk) * 10) / 10,
    def: Math.round(fry.base.def * (1 + m.def) * 10) / 10,
    spd: Math.round(fry.base.spd * (1 + m.spd) * 10) / 10,
    crit: 0.05 + m.crit,
    dodge: 0.04 + m.dodge,
    effects,
  };
}
/** A fry's overall power. */
export function power(fry) {
  const s = computeStats(fry);
  return Math.round(s.hp * 0.5 + s.atk * 4 + s.def * 3 + s.spd * 2 + fry.traits.length * 8);
}
/** A fry's body shape. */
export function fryShape(fry) {
  for (const tid of fry.traits) if (TRAIT_MAP[tid]?.shape) return TRAIT_MAP[tid].shape;
  return 'straight';
}
/** A fry's colour. */
export function fryColor(fry) {
  for (const tid of fry.traits) if (TRAIT_MAP[tid]?.color) return TRAIT_MAP[tid].color;
  return `hsl(${fry.hue} 88% 62%)`;
}
export const busy = (state, id) => state.fryer.run && state.fryer.run.fryId === id;
/** Which trait list and treatments apply: fries (and fry hybrids) or a creature species. */
export const speciesOf = (fry) => (fry.species && fry.species !== 'fry' ? fry.species : 'fry');
/** Fighters taking up Lab vats (Hall of Famers have their own hall). */
export const labCount = (state) => state.lab.fries.filter((f) => !f.hof).length;
const labFull = (state) => labCount(state) >= LAB_CAPACITY;
/** Is this fry in the Hall of Fame? */
const retired = (f) =>
  f?.hof
    ? { ok: false, reason: `${f.name} is retired in the Hall of Fame and can only be used for breeding.` }
    : null;
/** Gene-splicing options for this fighter, with prices. */
export function traitsFor(fry) {
  const sp = speciesOf(fry);
  if (sp === 'fry') return LAB_TRAITS;
  const own = TRAITS.filter((t) => t.species === sp);
  const w = WORLD_MAP[sp];
  return w ? [...own, { ...TRAIT_MAP[w.trait], cost: 600 }] : own;
}
/** Treatments for this fighter's species. */
export function trainingFor(fry) {
  const table = SPECIES_TRAINING[speciesOf(fry)] || SPECIES_TRAINING.fry;
  const label = { hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD' };
  return Object.fromEntries(
    Object.entries(table).map(([k, t]) => [k, { ...t, label: `+${t.gain} ${label[k]}` }]),
  );
}
/** Grows a new spud in the lab. */
export function growSpud(state, rng) {
  if (labFull(state)) return { ok: false, reason: `Lab is full (${LAB_CAPACITY} fighters max).` };
  if (state.money < GROW_COST) return { ok: false, reason: `Need $${GROW_COST}` };
  state.money -= GROW_COST;
  const f = newFry(state, rng);
  state.lab.fries.push(f);
  state.stats.spuds = (state.stats.spuds || 0) + 1;
  return { ok: true, fry: f };
}
export function getFry(state, id) {
  return state.lab.fries.find((f) => f.id === id);
}
/** Splices a trait into a fry. */
export function splice(state, fryId, traitId) {
  const f = getFry(state, fryId);
  const t = TRAIT_MAP[traitId];
  if (!f || !t) return { ok: false, reason: 'Nope' };
  if (retired(f)) return retired(f);
  const offer = traitsFor(f).find((x) => x.id === traitId);
  if (!offer) return { ok: false, reason: `${t.name} isn't available for this kind of fighter.` };
  if (busy(state, fryId)) return { ok: false, reason: 'That fighter is mid-tournament.' };
  if (f.traits.includes(traitId)) return { ok: false, reason: 'Already has that trait.' };
  if (f.traits.length >= 3) return { ok: false, reason: 'Max 3 traits. Remove one first.' };
  if (state.money < offer.cost) return { ok: false, reason: `Need $${offer.cost}` };
  state.money -= offer.cost;
  f.traits.push(traitId);
  state.stats.spliced = (state.stats.spliced || 0) + 1;
  return { ok: true };
}
/** Removes a trait from a fry. */
export function purgeTrait(state, fryId, traitId) {
  const f = getFry(state, fryId);
  if (!f || !f.traits.includes(traitId)) return { ok: false, reason: 'Nope' };
  if (retired(f)) return retired(f);
  if (busy(state, fryId)) return { ok: false, reason: 'That fry is mid-tournament.' };
  if (state.money < PURGE_COST) return { ok: false, reason: `Need $${PURGE_COST}` };
  state.money -= PURGE_COST;
  f.traits = f.traits.filter((t) => t !== traitId);
  state.stats.purged = (state.stats.purged || 0) + 1;
  return { ok: true };
}
/** Fry treatments (other species: see trainingFor). */
export const TRAINING = trainingFor({});
export function trainCost(fry) {
  return Math.round((60 + 18 * fry.trained) * (TRAINING_COST_MULT[speciesOf(fry)] || 1));
}
/** Trains one of a fry's stats. */
export function train(state, fryId, stat) {
  const f = getFry(state, fryId);
  const table = f && trainingFor(f);
  if (!f || !table[stat]) return { ok: false, reason: 'Nope' };
  if (retired(f)) return retired(f);
  if (busy(state, fryId)) return { ok: false, reason: 'That fighter is mid-tournament.' };
  const cost = trainCost(f);
  if (state.money < cost) return { ok: false, reason: `Need $${cost}` };
  state.money -= cost;
  f.base[stat] += table[stat].gain;
  f.trained++;
  state.stats.trained = (state.stats.trained || 0) + 1;
  return { ok: true, cost };
}
/** A random gen-1 spud used as a donor parent, so breeding works even with one fighter. */
function wildParent(rng) {
  return newFry({ lab: { nextId: 0 } }, rng, { name: 'Wild Spud' });
}
/** Breeds two fries into a new one. */
export function breed(state, aId, bId, rng) {
  const a = aId === WILD_PARENT ? wildParent(rng) : getFry(state, aId);
  const b = bId === WILD_PARENT ? wildParent(rng) : getFry(state, bId);
  if (!a || !b || (a === b && aId !== WILD_PARENT))
    return { ok: false, reason: 'Pick two different parents.' };
  if (busy(state, aId) || busy(state, bId)) return { ok: false, reason: 'A parent is mid-tournament.' };
  if (labFull(state))
    return { ok: false, reason: `Lab is full (${LAB_CAPACITY} fighters max). Compost one to make room.` };
  if (state.money < BREED_COST) return { ok: false, reason: `Need $${BREED_COST}` };
  state.money -= BREED_COST;
  const base = {};
  for (const k of ['hp', 'atk', 'def', 'spd']) {
    const avg = (a.base[k] + b.base[k]) / 2;
    const hi = Math.max(a.base[k], b.base[k]);
    // Children lean toward the stronger parent, with a little mutation.
    base[k] = Math.max(1, Math.round((avg * 0.5 + hi * 0.5) * rng.range(0.94, 1.1)));
  }
  // A Hall of Fame bloodline doubles the offspring's stats.
  const legacy = !!(a.hof || b.hof);
  if (legacy) for (const k of Object.keys(base)) base[k] *= 2;
  const inherited = rng.shuffle([...new Set([...a.traits, ...b.traits])]).slice(0, rng.int(1, 2));
  let mutation = null;
  if (rng.chance(0.2)) {
    const pool = traitsFor(a).filter((t) => !t.world && !inherited.includes(t.id));
    mutation = rng.pick(pool).id;
    if (inherited.length < 3) inherited.push(mutation);
  }
  const child = newFry(state, rng, {
    gen: Math.max(a.gen, b.gen) + 1,
    base,
    traits: inherited.slice(0, 3),
    hue: Math.round((a.hue + b.hue) / 2 + rng.int(-4, 4)),
    hybrid:
      a.hybrid ||
      b.hybrid ||
      (a.species && a.species !== 'fry' ? a.species : null) ||
      (b.species && b.species !== 'fry' ? b.species : null) ||
      undefined,
  });
  if (!child.hybrid) delete child.hybrid;
  state.lab.fries.push(child);
  state.stats.bred++;
  state.stats.maxGen = Math.max(state.stats.maxGen || 1, child.gen);
  if (legacy) state.stats.legacy = (state.stats.legacy || 0) + 1;
  return { ok: true, fry: child, mutation, legacy };
}
/** Composts a fry for money. */
export function compost(state, fryId) {
  if (retired(getFry(state, fryId))) return retired(getFry(state, fryId));
  if (busy(state, fryId)) return { ok: false, reason: 'That fry is mid-tournament.' };
  const i = state.lab.fries.findIndex((f) => f.id === fryId);
  if (i < 0) return { ok: false };
  state.lab.fries.splice(i, 1);
  state.money += COMPOST_VALUE;
  state.stats.composted = (state.stats.composted || 0) + 1;
  return { ok: true };
}
