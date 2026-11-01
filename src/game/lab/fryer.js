// The Fryer: leagues, opponents, battles and tournament runs.
import { CREATURE_MAP, WORLD_ARENAS, WORLD_MAP } from '../../data/worlds.js';
import { makeRng } from '../rng.js';
import { busy, computeStats, getFry, LAB_TRAITS, TRAITS } from './breeding.js';

// The Fryer
// Bracket tournaments. Rounds = log2(entrants). Each round won pays `prize`
// (growing 50% per round); winning the final pays the champion purse instead.
export const LEAGUES = [
  {
    id: 'rookie',
    name: 'Rookie Basket',
    rounds: 3,
    power: 0.72,
    prize: 300,
    champBonus: 1000,
    needs: null,
    entry: 0,
  },
  {
    id: 'pro',
    name: 'Pro Fryer',
    rounds: 4,
    power: 1.25,
    prize: 800,
    champBonus: 4000,
    needs: 'rookie',
    entry: 250,
  },
  {
    id: 'master',
    name: 'Master Deep-Fry',
    rounds: 4,
    power: 1.8,
    prize: 2000,
    champBonus: 10000,
    needs: 'pro',
    entry: 750,
  },
  {
    id: 'legend',
    name: 'Legendary Vat',
    rounds: 5,
    power: 2.6,
    prize: 5000,
    champBonus: 30000,
    needs: 'master',
    entry: 2000,
  },
];
export const ALL_LEAGUES = [...LEAGUES, ...WORLD_ARENAS];
export const WORLD_ARENA_LIST = WORLD_ARENAS;
export const LEAGUE_MAP = Object.fromEntries(ALL_LEAGUES.map((l) => [l.id, l]));
/** Names for opponent fries. */
const NPC_NAMES = [
  'Grease Lightning',
  'The Soggy Bandit',
  'Captain Crunch-ish',
  'Fry Hard',
  'Spud Vicious',
  'Tater Ripper',
  'Mash Mayhem',
  'Hash Brown Hulk',
  'Wedge Antonio',
  'Curly Sue-preme',
  'Count Frycula',
  'Starch Wars',
  'Deep Fried Dave',
  'The Golden Crisp',
  'Oil Baron',
  'Salt Bae-by',
  'Frytanic',
  'Sir Mashalot',
  'Sweet Pota-Toe-Kick',
  'Crinkle Cutthroat',
  'Frying Dutchman',
  'Russet Crowe',
  'Tot-alitarian',
  'Waffle Wolverine',
  'Spudzilla',
  'Lord of the Fries',
  'Mashter Chief',
  'Hashtag Brown',
  'Fry Guy Fieri',
  'The Big Dipper',
  'Crispy Kreme',
  'Potato Pancake Pete',
];
/** An NPC fry for a Fryer league. `strength` scales its stats around the league power. */
export function npcFry(leagueId, strength, seed) {
  const L = LEAGUE_MAP[leagueId];
  const li = Math.max(0, LEAGUES.indexOf(L));
  const rng = makeRng(seed);
  const scale = L.power * strength;
  const nTraits = Math.min(3, li + (strength > 1.05 ? 1 : 0));
  const traits = rng
    .shuffle(LAB_TRAITS.filter((t) => t.id !== 'golden'))
    .slice(0, nTraits)
    .map((t) => t.id);
  return {
    id: -1,
    npc: true,
    name: rng.pick(NPC_NAMES),
    gen: 1 + li,
    base: {
      hp: Math.round(rng.int(62, 78) * scale),
      atk: Math.round(rng.int(10, 13) * scale),
      def: Math.round(rng.int(3, 5) * scale),
      spd: Math.round(rng.int(6, 10) * scale),
    },
    traits,
    trained: 0,
    wins: 0,
    titles: [],
    hue: rng.int(0, 360),
  };
}
/** A creature from a world, with stats scaled by `mult`. */
export function creatureEntity(creatureId, mult, rng, extra = {}) {
  const c = CREATURE_MAP[creatureId];
  const w = WORLD_MAP[c.world];
  const k = (v) => Math.max(1, Math.round(v * mult * rng.range(0.92, 1.08)));
  const extraTraits = c.rarity === 'legendary' ? 2 : c.rarity === 'rare' ? 1 : 0;
  const traits = [
    w.trait,
    ...rng
      .shuffle(TRAITS.filter((t) => t.species === c.world))
      .slice(0, extraTraits)
      .map((t) => t.id),
  ];
  return {
    id: -1,
    name: c.name,
    species: c.world,
    creature: c.id,
    gen: 1,
    base: {
      hp: k(70 * w.bias.hp),
      atk: k(12 * w.bias.atk),
      def: k(4.5 * w.bias.def),
      spd: k(8 * w.bias.spd),
    },
    traits,
    trained: 0,
    wins: 0,
    titles: [],
    hue: rng.int(0, 360),
    ...extra,
  };
}
/** Bracket entrant for a league or world arena. Stronger seeds tend to reach the final. */
function makeEntrant(L, strength, seed) {
  if (!L.world) return npcFry(L.id, strength, seed);
  const rng = makeRng(seed);
  const pool =
    L.id === 'universe' && rng() < 0.4
      ? rng.pick(Object.values(WORLD_MAP).filter((w) => !w.secret)).creatures
      : WORLD_MAP[L.world].creatures;
  const c = rng.pick(strength > 1.12 ? pool.filter((x) => x.rarity !== 'common') : pool);
  const e = creatureEntity(c.id, L.power * strength, rng, { npc: true });
  e.name =
    `${c.name} ${rng.pick(['the Bold', 'Jr.', 'the Swift', 'Prime', 'the Mighty', 'III', 'the Tough', 'the Sly', ''])}`.trim();
  return e;
}
/** Deterministic turn-based battle. Returns the winner and a play-by-play. */
export function simulateBattle(fa, fb, rng) {
  const A = { ...computeStats(fa), side: 'a' };
  const B = { ...computeStats(fb), side: 'b' };
  for (const F of [A, B]) {
    F.max = F.hp;
    F.cur = F.hp;
    F.burn = 0;
    F.bleed = 0;
    F.stunned = false;
    F.shield = F.effects.has('shield');
  }
  const events = [];
  const snap = (e) =>
    events.push({ ...e, hpA: Math.max(0, Math.round(A.cur)), hpB: Math.max(0, Math.round(B.cur)) });

  const attack = (X, Y, bonus = false) => {
    if (X.stunned) {
      X.stunned = false;
      snap({ who: X.side, kind: 'skip', msg: `${X.name} is stunned!` });
      return;
    }
    const miss = 0.05 + Y.dodge + (Y.effects.has('blind') ? 0.15 : 0);
    if (rng() < miss) {
      snap({ who: X.side, kind: 'miss', msg: `${X.name} swings... and misses!` });
      return;
    }
    const rage = X.effects.has('relish') && X.cur < X.max / 2 ? 1.3 : 1;
    let dmg = Math.max(1, X.atk * rage * rng.range(0.85, 1.15) - Y.def * 0.6);
    const crit = rng() < X.crit;
    if (crit) dmg *= 1.8;
    if (Y.shield) {
      dmg *= 0.3;
      Y.shield = false;
    }
    dmg = Math.max(1, Math.round(dmg));
    Y.cur -= dmg;
    snap({
      who: X.side,
      kind: crit ? 'crit' : 'hit',
      amount: dmg,
      msg: crit ? `CRITICAL! ${X.name} deals ${dmg}!` : `${X.name} hits for ${dmg}.`,
    });
    if (X.effects.has('lifesteal')) {
      const h = Math.round(dmg * 0.3);
      X.cur = Math.min(X.max, X.cur + h);
      if (h) snap({ who: X.side, kind: 'heal', amount: h, msg: `${X.name} drains ${h} starch.` });
    }
    if (Y.effects.has('thorns')) {
      const r = Math.max(1, Math.round(dmg * 0.2));
      X.cur -= r;
      snap({ who: Y.side, kind: 'thorns', amount: r, msg: `Crinkle spikes reflect ${r}!` });
    }
    if (X.effects.has('burn') && rng() < 0.3) {
      Y.burn = 3;
      snap({ who: X.side, kind: 'status', msg: `${Y.name} is set on fire!` });
    }
    if (X.effects.has('bleed') && rng() < 0.25) {
      Y.bleed = 3;
      snap({ who: X.side, kind: 'status', msg: `${Y.name} is bleeding salt!` });
    }
    if (X.effects.has('stun') && rng() < 0.15) {
      Y.stunned = true;
      snap({ who: X.side, kind: 'status', msg: `${Y.name} is dazed by a tot-slam!` });
    }
    if (!bonus && X.effects.has('fizz') && Y.cur > 0 && X.cur > 0 && rng() < 0.25) {
      snap({ who: X.side, kind: 'status', msg: `Fizz burst! ${X.name} strikes again!` });
      attack(X, Y, true);
    }
  };

  const tick = (F) => {
    if (F.burn > 0) {
      const d = Math.max(1, Math.round(F.max * 0.04));
      F.cur -= d;
      F.burn--;
      snap({ who: F.side === 'a' ? 'b' : 'a', kind: 'dot', amount: d, msg: `${F.name} burns for ${d}.` });
    }
    if (F.bleed > 0) {
      const d = Math.max(1, Math.round(F.max * 0.035));
      F.cur -= d;
      F.bleed--;
      snap({ who: F.side === 'a' ? 'b' : 'a', kind: 'dot', amount: d, msg: `${F.name} bleeds for ${d}.` });
    }
    if (F.effects.has('fluff') && F.cur > 0 && F.cur < F.max) {
      const h = Math.max(1, Math.round(F.max * 0.03));
      F.cur = Math.min(F.max, F.cur + h);
      snap({ who: F.side, kind: 'heal', amount: h, msg: `${F.name} fluffs up for ${h}.` });
    }
    if (F.effects.has('regen') && F.cur > 0 && F.cur < F.max) {
      const h = Math.max(1, Math.round(F.max * 0.05));
      F.cur = Math.min(F.max, F.cur + h);
      snap({ who: F.side, kind: 'heal', amount: h, msg: `${F.name} regenerates ${h}.` });
    }
  };

  let round = 0;
  while (A.cur > 0 && B.cur > 0 && round < 60) {
    round++;
    const order = A.spd + rng() * 3 >= B.spd + rng() * 3 ? [A, B] : [B, A];
    for (const [X, Y] of [order, [order[1], order[0]]]) {
      if (X.cur <= 0 || Y.cur <= 0) break;
      attack(X, Y);
    }
    if (A.cur > 0 && B.cur > 0) {
      tick(A);
      tick(B);
    }
  }
  let winner;
  if (A.cur <= 0 && B.cur <= 0) winner = A.cur >= B.cur ? 'a' : 'b';
  else if (A.cur <= 0) winner = 'b';
  else if (B.cur <= 0) winner = 'a';
  else winner = A.cur / A.max >= B.cur / B.max ? 'a' : 'b';
  snap({ who: winner, kind: 'end', msg: `${winner === 'a' ? A.name : B.name} wins!` });
  return { winner, events, maxA: A.max, maxB: B.max };
}
export const worldOwned = (state, id) =>
  id === 'alien' ? !!state.worlds?.alien : !!state.worlds?.owned?.includes(id);
// Difficulty (unlocked by winning the Champions of the Universe): tougher foes, bigger purses.
export const DIFFICULTY = {
  normal: { name: 'Normal', power: 1, reward: 1 },
  hard: { name: 'Hard', power: 1.5, reward: 1.5 },
  brutal: { name: 'Brutal', power: 2.25, reward: 2 },
  impossible: { name: 'Impossible', power: 3.5, reward: 3 },
};
export const difficultyUnlocked = (state) => (state.universe?.champions || 0) > 0;
/** The current difficulty setting. */
export function difficultyKey(state) {
  return (
    (difficultyUnlocked(state) && DIFFICULTY[state.settings?.difficulty] && state.settings.difficulty) ||
    'normal'
  );
}
export function getDifficulty(state) {
  return (difficultyUnlocked(state) && DIFFICULTY[state.settings?.difficulty]) || DIFFICULTY.normal;
}
/** The trophy a fighter must already hold before entering this league or arena. */
function prerequisite(L) {
  if (L.invite) return null;
  if (L.needs) return L.needs;
  return L.world ? LEAGUES[LEAGUES.length - 1].id : null;
}
/** Why a fighter can't enter a league (or null if it can). Progress is earned per fighter. */
export function enterReason(state, leagueId, fry) {
  const L = LEAGUE_MAP[leagueId];
  if (!L) return 'Unknown tournament.';
  if (L.world && !worldOwned(state, L.world))
    return L.world === 'alien'
      ? 'Reach the Alien Planet first.'
      : `Travel to ${WORLD_MAP[L.world].name} first.`;
  if (!fry) return 'Pick a fighter.';
  if (fry.hof) return `${fry.name} is retired in the Hall of Fame.`;
  if (L.invite && !fry.invited) return `Only fighters invited by the mysterious letter may enter.`;
  const need = prerequisite(L);
  if (need && !fry.titles?.includes(need)) return `${fry.name} must win ${LEAGUE_MAP[need].name} first.`;
  return null;
}
export function canEnter(state, leagueId, fry) {
  return !enterReason(state, leagueId, fry);
}
/** Every trophy currently on offer (Fryer leagues + arenas in the worlds you've unlocked). */
export function trophiesOffered(state) {
  return [...LEAGUES.map((l) => l.id), ...WORLD_ARENAS.filter((a) => a.world !== 'alien').map((a) => a.id)];
}
/** A fighter holding every trophy from the home world and all four food worlds earns the mysterious letter. */
export function letterEligible(state, fry) {
  if (!fry || fry.hof || fry.invited || fry.letter) return false;
  return trophiesOffered(state).every((id) => fry.titles?.includes(id));
}
/** Accepting the letter: the fighter is invited and the Alien Planet opens. */
export function acceptLetter(state, fryId) {
  const f = getFry(state, fryId);
  if (!f || !f.letter) return { ok: false, reason: 'No letter to answer.' };
  f.letter = false;
  f.invited = true;
  state.universe.letters = (state.universe.letters || 0) + 1;
  state.worlds.alien = true;
  return { ok: true, fry: f };
}
/** Retire a Champion of the Universe into the Hall of Fame (breeding only, doubles offspring stats). */
export function induct(state, fryId) {
  const f = getFry(state, fryId);
  if (!f) return { ok: false, reason: 'Pick a fighter.' };
  if (!(state.universe?.champions > 0))
    return { ok: false, reason: 'Win the Champions of the Universe to open the Hall of Fame.' };
  if (f.hof) return { ok: false, reason: 'Already in the Hall of Fame.' };
  if (busy(state, fryId)) return { ok: false, reason: 'That fighter is mid-tournament.' };
  if (!f.titles?.includes('universe'))
    return { ok: false, reason: 'Only a Champion of the Universe can enter the Hall of Fame.' };
  f.hof = true;
  f.inducted = Date.now();
  state.stats.inducted = (state.stats.inducted || 0) + 1;
  return { ok: true };
}
/** Names of the tournament rounds. */
export const ROUND_NAMES = [
  'Round of 128',
  'Round of 64',
  'Round of 32',
  'Round of 16',
  'Quarterfinal',
  'Semifinal',
  'Final',
];
export function roundName(L, round) {
  return ROUND_NAMES[ROUND_NAMES.length - (L.rounds - round)];
}
/** Starts a tournament run with a fry. */
export function startRun(state, fryId, leagueId, now = Date.now()) {
  if (state.fryer.run) return { ok: false, reason: 'Finish your current tournament first.' };
  const f = getFry(state, fryId);
  if (!f) return { ok: false, reason: 'Pick a fighter.' };
  const why = enterReason(state, leagueId, f);
  if (why) return { ok: false, reason: why };
  const L = LEAGUE_MAP[leagueId];
  if (state.money < L.entry) return { ok: false, reason: `Entry fee is $${L.entry.toLocaleString()}` };
  state.money -= L.entry;
  const seed = `${now}-${fryId}-${leagueId}`;
  const rng = makeRng(seed);
  const size = 2 ** L.rounds;
  // Slot 0 is the player. NPC strengths spread from 0.8x to 1.2x league power.
  const slots = [{ player: true }];
  const diff = getDifficulty(state).power;
  for (let i = 1; i < size; i++)
    slots.push(makeEntrant(L, (0.8 + (0.4 * (i - 1)) / Math.max(1, size - 2)) * diff, `${seed}-e${i}`));
  // Every entrant gets a unique name.
  const pool = rng.shuffle(NPC_NAMES);
  const used = new Set();
  slots.slice(1).forEach((e, i) => {
    if (!L.world) e.name = pool[i % pool.length];
    let name = e.name;
    for (let n = 2; used.has(name); n++)
      name = `${e.name} ${['', '', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] || n}`;
    e.name = name;
    used.add(name);
  });
  // Shuffle the NPC seeding so the strong ones aren't all on one side.
  const order = [0, ...rng.shuffle(Array.from({ length: size - 1 }, (_, i) => i + 1))];
  state.fryer.run = { fryId, league: leagueId, round: 0, seed, slots, rounds: [order], earned: 0 };
  return { ok: true };
}
/** The bracket position the player is in this round, and their opponent's slot. */
export function currentMatch(run) {
  const alive = run.rounds[run.round];
  const i = alive.indexOf(0);
  const oppSlot = alive[i % 2 ? i - 1 : i + 1];
  return { oppSlot, opp: run.slots[oppSlot] };
}
/** Prize money for winning a round. */
export function roundPrize(state, fry, L, round) {
  const golden = fry.traits.includes('golden') ? 1.5 : 1;
  return Math.round(L.prize * (1 + round * 0.5) * golden * getDifficulty(state).reward);
}
export function champPrize(state, fry, L) {
  return Math.round(L.champBonus * (fry.traits.includes('golden') ? 1.5 : 1) * getDifficulty(state).reward);
}
/** Fights the next round of the current run. */
export function fightRound(state, rng) {
  const run = state.fryer.run;
  if (!run) return { ok: false, reason: 'No tournament running.' };
  const fry = getFry(state, run.fryId);
  if (!fry) {
    state.fryer.run = null;
    return { ok: false, reason: 'Your fighter vanished!' };
  }
  const L = LEAGUE_MAP[run.league];
  const { opp } = currentMatch(run);
  const battle = simulateBattle(fry, opp, rng);
  const round = run.round;
  const out = { ok: true, battle, fry, opp, league: L, round };
  // Resolve every other match in this round.
  const alive = run.rounds[round];
  const next = [];
  for (let i = 0; i < alive.length; i += 2) {
    const [x, y] = [alive[i], alive[i + 1]];
    if (x === 0 || y === 0) next.push(battle.winner === 'a' ? 0 : x === 0 ? y : x);
    else next.push(simulateBattle(run.slots[x], run.slots[y], rng).winner === 'a' ? x : y);
  }
  run.rounds.push(next);
  out.bracket = { slots: run.slots, rounds: run.rounds.slice(), league: L.id };
  if (battle.winner === 'a') {
    fry.wins++;
    state.fryer.wins++;
    run.round++;
    if (run.round >= L.rounds) {
      const bonus = champPrize(state, fry, L);
      state.money += bonus;
      state.lifetime += bonus;
      run.earned += bonus;
      if (!fry.titles.includes(L.id)) fry.titles.push(L.id);
      state.fryer.champions[L.id] = (state.fryer.champions[L.id] || 0) + 1;
      state.fryer.run = null;
      out.champion = true;
      out.bonus = bonus;
      if (L.id === 'universe') {
        state.universe = state.universe || { champions: 0 };
        state.universe.champions++;
        // Remember the difficulty it was won on (for the Hard / Brutal / Impossible achievements).
        const dk = difficultyKey(state);
        state.universe.wins = {
          ...(state.universe.wins || {}),
          [dk]: ((state.universe.wins || {})[dk] || 0) + 1,
        };
        out.universe = true;
      }
      if (letterEligible(state, fry)) {
        fry.letter = true;
        out.letter = true;
      }
    } else {
      const prize = roundPrize(state, fry, L, round);
      state.money += prize;
      state.lifetime += prize;
      run.earned += prize;
      out.prize = prize;
    }
  } else {
    state.lab.fries = state.lab.fries.filter((f) => f.id !== fry.id);
    state.fryer.run = null;
    state.fryer.losses++;
    state.stats.fried++;
    out.fried = true;
  }
  return out;
}
/** Leaves the current tournament. */
export function withdraw(state) {
  if (!state.fryer.run) return { ok: false };
  state.fryer.run = null;
  return { ok: true };
}
