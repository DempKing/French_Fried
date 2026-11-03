// The Fryer theme: original arena rock for the Fryer's tournaments and battles. 150 bpm in E minor:
// distorted power-chord chugs, a driving bass, big drums with crashes and tom fills, and a singing lead.
//
// Form (bars): verse 0-7, verse 8-15 (busier hats), chorus 16-23 (open chords), verse 24-31. About 50 seconds.
import { boom, hit, hz, mixBus, noise, sequencer, stopper, tone } from './synth.js';

const BPM = 150;
const STEP = 60 / BPM / 4; // a 16th note

const ROOTS = { Em: 40, C: 36, D: 38, B: 35, Am: 45, G: 43 };
const VERSE = ['Em', 'C', 'D', 'B', 'Em', 'C', 'D', 'B'];
const CHORUS = ['Am', 'C', 'G', 'B', 'Am', 'C', 'G', 'B'];

/** Lead tunes: [bar of the section, 16th (0-15), length in 16ths, MIDI note]. */
// prettier-ignore
const TUNE_VERSE = [
  [0, 0, 4, 76], [0, 4, 2, 74], [0, 6, 2, 76], [0, 8, 8, 79],
  [1, 0, 4, 79], [1, 4, 4, 76], [1, 8, 8, 72],
  [2, 0, 4, 74], [2, 4, 2, 78], [2, 6, 2, 79], [2, 8, 8, 81],
  [3, 0, 8, 78], [3, 8, 8, 75],
  [4, 0, 4, 76], [4, 4, 2, 79], [4, 6, 2, 83], [4, 8, 8, 81],
  [5, 0, 4, 79], [5, 4, 4, 76], [5, 8, 8, 79],
  [6, 0, 4, 78], [6, 4, 4, 74], [6, 8, 8, 78],
  [7, 0, 16, 71],
];
// prettier-ignore
const TUNE_CHORUS = [
  [0, 0, 8, 81], [0, 8, 4, 79], [0, 12, 4, 76],
  [1, 0, 8, 79], [1, 8, 8, 76],
  [2, 0, 4, 74], [2, 4, 4, 79], [2, 8, 8, 83],
  [3, 0, 16, 78],
  [4, 0, 8, 84], [4, 8, 4, 83], [4, 12, 4, 81],
  [5, 0, 8, 79], [5, 8, 8, 76],
  [6, 0, 8, 79], [6, 8, 8, 78],
  [7, 0, 16, 75],
];

function barInfo(bar) {
  const b = bar % 32;
  const section = b < 8 ? 'verse' : b < 16 ? 'verse2' : b < 24 ? 'chorus' : 'verse';
  const inSection = b % 8;
  return { section, inSection, chord: (section === 'chorus' ? CHORUS : VERSE)[inSection] };
}

/** Plays the Fryer theme from `startAt` until stopped. */
export function playFryer(ctx, dest, startAt) {
  const { out, mix, room } = mixBus(ctx, dest, startAt, { fadeIn: 0.6, level: 0.33, wet: 0.14 });
  const hiss = noise(ctx, 2, 'white');

  // The guitar amp: a hard clip, then a speaker-ish low-pass.
  const amp = (drive) => {
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * drive);
    shaper.curve = curve;
    const cab = ctx.createBiquadFilter();
    cab.type = 'lowpass';
    cab.frequency.value = 3200;
    shaper.connect(cab);
    return { input: shaper, output: cab };
  };
  const rhythm = amp(6);
  const rhythmLevel = ctx.createGain();
  rhythmLevel.gain.value = 0.11;
  rhythm.output.connect(rhythmLevel).connect(mix);
  const lead = amp(3);
  const leadLevel = ctx.createGain();
  leadLevel.gain.value = 0.13;
  lead.output.connect(leadLevel);
  leadLevel.connect(mix);
  leadLevel.connect(room);

  /** A power chord (root, fifth, octave) into the rhythm amp: short and muted, or ringing. */
  const powerChord = (root, at, dur, muted) => {
    for (const n of [root + 12, root + 19, root + 24])
      tone(ctx, rhythm.input, {
        type: 'sawtooth',
        note: n,
        at,
        dur,
        vol: 0.5,
        release: muted ? 0.04 : 0.15,
        lowpass: muted ? 1100 : 2600,
      });
  };
  /** The lead guitar: a saw into its own amp, with vibrato coming in on long notes. */
  const leadNote = (note, at, dur) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz(note);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(dur > 0.4 ? hz(note) * 0.01 : 0, at + Math.min(0.4, dur));
    lfo.connect(depth).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.5, at + 0.01);
    g.gain.setValueAtTime(0.4, at + dur);
    g.gain.linearRampToValueAtTime(0, at + dur + 0.06);
    o.connect(g).connect(lead.input);
    const end = at + dur + 0.08;
    o.start(at);
    lfo.start(at);
    o.stop(end);
    lfo.stop(end);
  };

  const stopSeq = sequencer(ctx, STEP, startAt, (i, at) => {
    const bar = Math.floor(i / 16);
    const s = i % 16;
    const { section, inSection, chord } = barInfo(bar);
    const root = ROOTS[chord];
    const lastBar = inSection === 7;

    // Rhythm guitar: palm-muted 8th chugs in the verses, open ringing chords in the chorus.
    if (section === 'chorus') {
      if (s === 0 || s === 6 || s === 10) powerChord(root, at, s === 0 ? STEP * 5 : STEP * 3.5, false);
    } else if (s % 2 === 0) powerChord(root, at, STEP * 0.9, true);

    // Bass: driving 8ths on the root.
    if (s % 2 === 0)
      tone(ctx, mix, {
        type: 'sawtooth',
        note: root,
        at,
        dur: STEP * 1.6,
        vol: 0.06,
        lowpass: 600,
        lowpassTo: 250,
      });

    // Drums: kick on 1, the "and" of 2 and 3; snare on 2 and 4; hats (16ths in the second verse).
    if (s === 0 || s === 6 || s === 8) boom(ctx, mix, at, 140, 45, 0.25, 0.6);
    if (s === 4 || s === 12) {
      hit(ctx, mix, hiss, at, { type: 'bandpass', freq: 1800, q: 0.9, dur: 0.16, vol: 0.5 });
      boom(ctx, mix, at, 230, 170, 0.08, 0.25);
    }
    if (s % (section === 'verse2' ? 1 : 2) === 0)
      hit(ctx, mix, hiss, at, {
        type: 'highpass',
        freq: 8500,
        dur: 0.035,
        vol: s % 4 ? 0.05 : 0.09,
        pan: -0.2,
      });
    // A crash at the top of each section, and a tom fill at the end of it.
    if (s === 0 && inSection === 0)
      hit(ctx, mix, hiss, at, { type: 'highpass', freq: 5000, dur: 1.4, vol: 0.22, pan: 0.3 });
    if (lastBar && s >= 12) boom(ctx, mix, at, 200 - (s - 12) * 25, 120 - (s - 12) * 15, 0.15, 0.35);

    // The lead.
    const tune = section === 'chorus' ? TUNE_CHORUS : TUNE_VERSE;
    for (const [b, k, len, note] of tune)
      if (b === inSection && k === s) leadNote(note, at, len * STEP - 0.02);
  });

  return { stop: stopper(ctx, out, stopSeq) };
}
