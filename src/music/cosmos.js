// The Cosmos theme: original, wide-eyed space music for the Worlds, the Alien Planet and the Hall of Fame.
// 84 bpm in D Lydian (D major with a bright G-sharp): warm swelling pads, a twinkling echoed arpeggio,
// a deep soft bass and a floating, whistling tune.
//
// Form (bars): A 0-7, A' 8-15 (the tune an octave up, softer), then round again. About 45 seconds.
import { boom, hz, mixBus, sequencer, stopper, tone } from './synth.js';

const BPM = 84;
const STEP = 60 / BPM / 4; // a 16th note

/** Chords, two bars each: bass root (MIDI) and the pad voicing. */
const CHORDS = [
  { root: 38, pad: [57, 61, 64, 66] }, // Dmaj7
  { root: 38, pad: [56, 59, 64, 68] }, // E/D, the Lydian lift
  { root: 47, pad: [54, 57, 62, 66] }, // Bm7
  { root: 43, pad: [54, 57, 61, 66] }, // Gmaj7#11
];
/** The arpeggio's order through the pad notes (an octave up), one note per 16th. */
const ARP = [0, 1, 2, 3, 2, 1, 3, 2];
/** The tune: [bar (0-7), 16th (0-15), length in 16ths, MIDI note]. */
// prettier-ignore
const TUNE = [
  [0, 0, 8, 78], [0, 8, 4, 76], [0, 12, 4, 73],
  [1, 0, 16, 74],
  [2, 0, 6, 76], [2, 6, 2, 80], [2, 8, 8, 83],
  [3, 0, 16, 80],
  [4, 0, 8, 78], [4, 8, 8, 81],
  [5, 0, 8, 78], [5, 8, 8, 74],
  [6, 0, 6, 73], [6, 6, 2, 74], [6, 8, 8, 76],
  [7, 0, 16, 78],
];

/** Plays the Cosmos theme from `startAt` until stopped. */
export function playCosmos(ctx, dest, startAt) {
  const { out, mix, room } = mixBus(ctx, dest, startAt, { fadeIn: 2, level: 0.64, roomSize: 3.5, wet: 0.35 });
  // A ping-pong echo for the arpeggio: left, then right.
  const echoL = ctx.createDelay(1);
  const echoR = ctx.createDelay(1);
  echoL.delayTime.value = STEP * 3;
  echoR.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  const panL = ctx.createStereoPanner();
  panL.pan.value = -0.6;
  const panR = ctx.createStereoPanner();
  panR.pan.value = 0.6;
  echoL.connect(panL).connect(mix);
  echoL.connect(echoR);
  echoR.connect(panR).connect(mix);
  echoR.connect(feedback).connect(echoL);
  const arpBus = ctx.createGain();
  arpBus.connect(mix);
  arpBus.connect(echoL);

  /** A whistling space tune: a pure sine with a slow, wide vibrato, swelling in. */
  const whistle = (note, at, dur, vol) => {
    const o = ctx.createOscillator();
    o.frequency.value = hz(note);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4.8;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(hz(note) * 0.008, at + Math.min(0.6, dur));
    lfo.connect(depth).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.12);
    g.gain.setValueAtTime(vol, at + dur);
    g.gain.linearRampToValueAtTime(0, at + dur + 0.3);
    o.connect(g);
    g.connect(mix);
    g.connect(room);
    const end = at + dur + 0.35;
    o.start(at);
    lfo.start(at);
    o.stop(end);
    lfo.stop(end);
  };

  const stopSeq = sequencer(ctx, STEP, startAt, (i, at) => {
    const bar = Math.floor(i / 16);
    const s = i % 16;
    const inA = bar % 16 < 8;
    const c = CHORDS[Math.floor(bar / 2) % 4];

    // Pads: detuned saws, softened and slow to swell, two bars per chord.
    if (s === 0 && bar % 2 === 0)
      for (const n of c.pad)
        for (const d of [-9, 9])
          tone(ctx, mix, {
            type: 'sawtooth',
            note: n,
            at,
            dur: 32 * STEP,
            vol: 0.017,
            detune: d,
            attack: 1.5,
            release: 1.6,
            lowpass: 1300,
          });
    // Deep bass with a soft thump at the top of each bar.
    if (s === 0) {
      tone(ctx, mix, {
        type: 'sine',
        note: c.root,
        at,
        dur: 14 * STEP,
        vol: 0.05,
        attack: 0.05,
        release: 0.5,
      });
      boom(ctx, mix, at, 80, 45, 0.4, 0.14);
    }
    // The twinkling arpeggio, an octave up, on every 16th (accented on the beat).
    tone(ctx, arpBus, {
      type: 'triangle',
      note: c.pad[ARP[s % 8]] + 12,
      at,
      dur: 0.02,
      vol: s % 4 ? 0.025 : 0.04,
      release: 0.25,
      lowpass: 4000,
    });

    // The tune: low and clear the first time, an octave up and softer the second.
    for (const [b, k, len, note] of TUNE)
      if (b === bar % 8 && k === s) whistle(note + (inA ? 0 : 12), at, len * STEP - 0.05, inA ? 0.09 : 0.06);
  });

  return { stop: stopper(ctx, out, stopSeq) };
}
