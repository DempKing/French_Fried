// The Kitchen theme: an original, cheerful diner shuffle for the title screen, the Kitchen, the Recipe book,
// the Deck, the Shop and the Thrift Store. 112 bpm swing in G major: ukulele strums, a marimba tune,
// a bouncing bass, handclaps and a shaker, and the faint sizzle of the fryer underneath.
//
// Form (bars): A 0-7, A' 8-15, bridge 16-23, A' 24-31, then round again. About 70 seconds.
import { boom, hit, hz, mixBus, noise, sequencer, stopper, swung, tone } from './synth.js';

const BPM = 112;
const BEAT = 60 / BPM;
const SWING = 0.62;

/** Chords: bass root (MIDI) and the ukulele's four strings. */
const CHORDS = {
  G: { root: 43, uke: [62, 67, 71, 74] },
  Em: { root: 40, uke: [64, 67, 71, 76] },
  C: { root: 36, uke: [64, 67, 72, 76] },
  D7: { root: 38, uke: [62, 66, 69, 72] },
  Cm: { root: 36, uke: [63, 67, 72, 75] },
  E7: { root: 40, uke: [62, 64, 68, 71] },
  A7: { root: 45, uke: [61, 64, 67, 69] },
};
const A = ['G', 'Em', 'C', 'D7', 'G', 'Em', 'C', 'D7'];
const BRIDGE = ['C', 'Cm', 'G', 'E7', 'A7', 'D7', 'G', 'D7'];

/** Tunes: [bar of the section, swung 8th (0-7), length in 8ths, MIDI note]. */
// prettier-ignore
const TUNE_A = [
  [0, 0, 2, 74], [0, 2, 1, 76], [0, 3, 1, 74], [0, 4, 4, 71],
  [1, 0, 2, 67], [1, 2, 2, 71], [1, 4, 2, 76], [1, 6, 2, 74],
  [2, 0, 3, 72], [2, 3, 1, 71], [2, 4, 2, 69], [2, 6, 2, 67],
  [3, 0, 2, 66], [3, 2, 2, 69], [3, 4, 4, 72],
  [4, 0, 2, 74], [4, 2, 1, 76], [4, 3, 1, 74], [4, 4, 2, 79], [4, 6, 2, 78],
  [5, 0, 2, 76], [5, 2, 2, 74], [5, 4, 4, 71],
  [6, 0, 2, 72], [6, 2, 2, 76], [6, 4, 2, 74], [6, 6, 2, 72],
  [7, 0, 4, 69], [7, 4, 4, 66],
];
/** The second A comes home to G. */
// prettier-ignore
const TUNE_A2 = [
  ...TUNE_A.filter(([bar]) => bar < 7),
  [7, 0, 2, 74], [7, 2, 2, 72], [7, 4, 4, 71],
];
// prettier-ignore
const TUNE_BRIDGE = [
  [0, 0, 3, 76], [0, 3, 1, 74], [0, 4, 4, 72],
  [1, 0, 3, 75], [1, 3, 1, 74], [1, 4, 4, 72],
  [2, 0, 2, 71], [2, 2, 2, 74], [2, 4, 4, 79],
  [3, 0, 2, 80], [3, 2, 2, 76], [3, 4, 4, 74],
  [4, 0, 2, 73], [4, 2, 2, 76], [4, 4, 4, 79],
  [5, 0, 2, 78], [5, 2, 2, 76], [5, 4, 2, 74], [5, 6, 2, 72],
  [6, 0, 6, 71],
  [7, 2, 1, 69], [7, 3, 1, 71], [7, 4, 2, 72], [7, 6, 2, 74],
];

/** Which section a bar is in and its chord. */
function barInfo(bar) {
  const b = bar % 32;
  const section = b < 8 ? 'A' : b < 16 ? 'A2' : b < 24 ? 'bridge' : 'A2';
  const inSection = b % 8;
  return { section, inSection, chord: (section === 'bridge' ? BRIDGE : A)[inSection] };
}

/** Plays the Kitchen theme from `startAt` until stopped. */
export function playKitchen(ctx, dest, startAt) {
  const { out, mix, room } = mixBus(ctx, dest, startAt, { level: 0.84, wet: 0.18 });
  const hiss = noise(ctx, 2, 'white');

  // The fryer's sizzle: quiet filtered noise all the way through.
  const sizzle = ctx.createBufferSource();
  sizzle.buffer = noise(ctx, 3, 'white');
  sizzle.loop = true;
  const sizzleF = ctx.createBiquadFilter();
  sizzleF.type = 'highpass';
  sizzleF.frequency.value = 5000;
  const sizzleG = ctx.createGain();
  sizzleG.gain.value = 0.006;
  sizzle.connect(sizzleF).connect(sizzleG).connect(mix);
  sizzle.start(startAt);

  /** A ukulele strum: the four strings plucked one after another (down or up). */
  const strum = (notes, at, down, vol) => {
    const order = down ? notes : [...notes].reverse();
    order.forEach((n, i) =>
      tone(ctx, mix, {
        type: 'triangle',
        note: n,
        at: at + i * 0.012,
        dur: 0.02,
        vol,
        release: 0.28,
        lowpass: 3500,
        lowpassTo: 1400,
      }),
    );
  };
  /** A marimba note: a sine and its bright 4th partial, with a soft wooden knock. */
  const marimba = (note, at, dur) => {
    tone(ctx, mix, {
      type: 'sine',
      note,
      at,
      dur: 0.01,
      vol: 0.17,
      attack: 0.003,
      release: Math.min(0.9, 0.3 + dur),
    });
    tone(ctx, mix, { type: 'sine', note: note + 24, at, dur: 0.01, vol: 0.03, attack: 0.002, release: 0.12 });
    tone(ctx, room, { type: 'sine', note, at, dur: 0.01, vol: 0.06, attack: 0.003, release: 0.5 });
    hit(ctx, mix, hiss, at, { type: 'bandpass', freq: hz(note) * 2, q: 3, dur: 0.02, vol: 0.05 });
  };

  const stopSeq = sequencer(ctx, BEAT, startAt, (i, at) => {
    const bar = Math.floor(i / 4);
    const beat = i % 4;
    const { section, inSection, chord } = barInfo(bar);
    const c = CHORDS[chord];

    // Bass: root on 1, fifth on 3, and a walk up on 4 every other bar.
    if (beat === 0 || beat === 2)
      tone(ctx, mix, {
        type: 'sine',
        note: c.root + (beat ? 7 : 0),
        at,
        dur: BEAT * 0.7,
        vol: 0.06,
        release: 0.08,
      });
    if (beat === 3 && bar % 2)
      tone(ctx, mix, { type: 'sine', note: c.root + 9, at, dur: BEAT * 0.5, vol: 0.045, release: 0.06 });

    // Ukulele: down on the beat, up on the swung off-beat (a lighter up-strum on 1 and 3).
    strum(c.uke, at, true, beat % 2 ? 0.035 : 0.04);
    strum(c.uke, at + SWING * BEAT, false, 0.022);

    // Drums: soft kick on 1 and 3, handclaps on 2 and 4, a shaker on every 8th.
    if (beat % 2 === 0) boom(ctx, mix, at, 110, 48, 0.2, 0.35);
    if (beat % 2)
      for (const d of [0, 0.008, 0.017])
        hit(ctx, mix, hiss, at + d, { type: 'bandpass', freq: 1400, q: 1.2, dur: 0.07, vol: 0.12 });
    for (const k of [0, 1])
      hit(ctx, mix, hiss, at + swung(k, BEAT, SWING), {
        type: 'highpass',
        freq: 7000,
        dur: 0.04,
        vol: k ? 0.035 : 0.05,
        pan: 0.25,
      });
    // Now and then, a pop from the fryer.
    if (Math.random() < 0.12)
      hit(ctx, mix, hiss, at + Math.random() * BEAT, {
        type: 'bandpass',
        freq: 3000,
        q: 4,
        dur: 0.015,
        vol: 0.06,
        pan: -0.4,
      });

    // The tune on marimba.
    const tune = section === 'A' ? TUNE_A : section === 'A2' ? TUNE_A2 : TUNE_BRIDGE;
    for (const [b, k, len, note] of tune)
      if (b === inSection && Math.floor(k / 2) === beat)
        marimba(note, at + swung(k, BEAT, SWING), len * (BEAT / 2));
  });

  return { stop: stopper(ctx, out, stopSeq, () => sizzle.stop()) };
}
