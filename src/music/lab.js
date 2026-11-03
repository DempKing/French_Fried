// The Lab theme: original playful mad science for the Lab. A lilting 6/8 in A minor (100 dotted-quarter
// beats a minute): a gliding, wobbly theremin tune, plucked oom-pah-pah bass, music-box arpeggios,
// woodblock ticks and bubbling beakers.
//
// Form (bars of 6/8): A 0-7 (theremin), A' 8-15 (music box, theremin underneath), B 16-23, A' 24-31.
// About 40 seconds, then round again.
import { boom, hit, hz, mixBus, noise, sequencer, stopper, tone } from './synth.js';

const EIGHTH = 0.2;

/** Chords: bass root (MIDI) and the music box's chord. */
const CHORDS = {
  Am: { root: 45, box: [57, 60, 64] },
  F: { root: 41, box: [57, 60, 65] },
  Dm: { root: 38, box: [57, 62, 65] },
  E7: { root: 40, box: [56, 59, 62, 64] },
  G: { root: 43, box: [55, 59, 62] },
};
const A = ['Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E7', 'E7'];
const B = ['Am', 'G', 'F', 'E7', 'Am', 'G', 'F', 'E7'];

/** Tunes: [bar of the section, 8th (0-5), length in 8ths, MIDI note]. */
// prettier-ignore
const TUNE_A = [
  [0, 0, 3, 76], [0, 3, 3, 72], [1, 0, 2, 69], [1, 2, 1, 71], [1, 3, 3, 72],
  [2, 0, 3, 77], [2, 3, 3, 76], [3, 0, 6, 72],
  [4, 0, 3, 74], [4, 3, 2, 77], [4, 5, 1, 76], [5, 0, 3, 74], [5, 3, 3, 69],
  [6, 0, 3, 71], [6, 3, 3, 68], [7, 0, 6, 76],
];
// prettier-ignore
const TUNE_B = [
  [0, 0, 3, 72], [0, 3, 3, 76], [1, 0, 3, 74], [1, 3, 3, 71],
  [2, 0, 3, 72], [2, 3, 3, 69], [3, 0, 6, 68],
  [4, 0, 2, 69], [4, 2, 1, 71], [4, 3, 3, 72], [5, 0, 2, 71], [5, 2, 1, 72], [5, 3, 3, 74],
  [6, 0, 3, 76], [6, 3, 3, 77], [7, 0, 6, 76],
];
/** Under the music box, the theremin holds long notes, two bars each. */
// prettier-ignore
const HOLDS = [[0, 0, 12, 64], [2, 0, 12, 65], [4, 0, 12, 62], [6, 0, 12, 64]];

function barInfo(bar) {
  const b = bar % 32;
  const section = b < 8 ? 'A' : b < 16 ? 'A2' : b < 24 ? 'B' : 'A2';
  const inSection = b % 8;
  return { section, inSection, chord: (section === 'B' ? B : A)[inSection] };
}

/** Plays the Lab theme from `startAt` until stopped. */
export function playLab(ctx, dest, startAt) {
  const { out, mix, room } = mixBus(ctx, dest, startAt, { level: 0.7, roomSize: 2.4, wet: 0.28 });
  const hiss = noise(ctx, 2, 'white');
  let lastNote = 72;

  /** The theremin: a sine that glides up from the last note, swells in, and wobbles with a wide vibrato. */
  const theremin = (note, at, dur, vol = 0.085) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(hz(lastNote), at);
    o.frequency.exponentialRampToValueAtTime(hz(note), at + 0.09);
    lastNote = note;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6.2;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(hz(note) * 0.004, at);
    depth.gain.linearRampToValueAtTime(hz(note) * 0.014, at + Math.min(0.5, dur));
    lfo.connect(depth).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.07);
    g.gain.setValueAtTime(vol, at + dur);
    g.gain.linearRampToValueAtTime(0, at + dur + 0.12);
    o.connect(g);
    g.connect(mix);
    g.connect(room);
    const end = at + dur + 0.15;
    o.start(at);
    lfo.start(at);
    o.stop(end);
    lfo.stop(end);
  };
  /** A music-box tine: a bell-like sine with a sparkle of the 4th partial. */
  const musicBox = (note, at, vol) => {
    tone(ctx, mix, { type: 'sine', note, at, dur: 0.01, vol, attack: 0.002, release: 0.7 });
    tone(ctx, room, {
      type: 'sine',
      note: note + 24,
      at,
      dur: 0.01,
      vol: vol * 0.25,
      attack: 0.002,
      release: 0.3,
    });
  };
  /** A bubble: a little sine that swoops upward. */
  const bubble = (at) => {
    const o = ctx.createOscillator();
    const f = 500 + Math.random() * 600;
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(f * 2.4, at + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.025, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    const p = ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.4 - 0.7;
    o.connect(g).connect(p).connect(mix);
    o.start(at);
    o.stop(at + 0.1);
  };

  const stopSeq = sequencer(ctx, EIGHTH, startAt, (i, at) => {
    const bar = Math.floor(i / 6);
    const e = i % 6;
    const { section, inSection, chord } = barInfo(bar);
    const c = CHORDS[chord];

    // Oom-pah-pah: a plucked bass on 1 and 4, music-box chords on the others.
    if (e === 0 || e === 3)
      tone(ctx, mix, {
        type: 'triangle',
        note: c.root + (e ? 7 : 0),
        at,
        dur: 0.06,
        vol: 0.13,
        release: 0.25,
        lowpass: 900,
        lowpassTo: 300,
      });
    else musicBox(c.box[(e + bar) % c.box.length] + 12, at, section === 'A2' ? 0.03 : 0.045);

    // Woodblock ticks, and a low tom at the top of every other bar.
    if (e === 0 || e === 3)
      hit(ctx, mix, hiss, at, {
        type: 'bandpass',
        freq: 2600,
        q: 8,
        dur: 0.03,
        vol: e ? 0.12 : 0.18,
        pan: 0.3,
      });
    if (e === 0 && bar % 2 === 0) boom(ctx, mix, at, 140, 90, 0.3, 0.3);
    // The beakers bubble now and then.
    if (Math.random() < 0.18) bubble(at + Math.random() * EIGHTH);

    // The tune: theremin in A and B; music box (an octave up) in A', with the theremin holding underneath.
    const play = (list, fn) => {
      for (const [b, k, len, note] of list) if (b === inSection && k === e) fn(note, len * EIGHTH - 0.03);
    };
    if (section === 'A') play(TUNE_A, (n, d) => theremin(n, at, d));
    if (section === 'B') play(TUNE_B, (n, d) => theremin(n, at, d));
    if (section === 'A2') {
      play(TUNE_A, (n) => musicBox(n + 12, at, 0.12));
      play(HOLDS, (n, d) => theremin(n, at, d, 0.075));
    }
  });

  return { stop: stopper(ctx, out, stopSeq) };
}
