// Building blocks for the music, made live with Web Audio: notes, drums, noise, reverb, a step sequencer,
// and the mix bus and stop that every piece shares. The pieces are kitchen.js, lab.js, fryer.js and cosmos.js.

/**
 * A piece that is playing.
 * @typedef {{ stop: (fade?: number) => void }} Playing
 */

/** MIDI note number to frequency in Hz. */
export const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/**
 * A buffer of noise: white (hiss) or brown (a low rumble).
 * @param {BaseAudioContext} ctx
 * @param {number} seconds
 * @param {'white' | 'brown'} kind
 */
export function noise(ctx, seconds, kind) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = kind === 'brown' ? (last + 0.02 * w) / 1.02 : w;
    d[i] = kind === 'brown' ? last * 3.5 : w;
  }
  return buf;
}

/** A simple room reverb: decaying noise as the impulse response. */
export function reverb(ctx, seconds, decay) {
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

/**
 * Calls `fn(step, time)` for each step a little ahead of time, until the returned function is called.
 * @param {BaseAudioContext} ctx
 * @param {number} stepSeconds
 * @param {number} startAt
 * @param {(step: number, at: number) => void} fn
 */
export function sequencer(ctx, stepSeconds, startAt, fn) {
  let next = startAt;
  let step = 0;
  // Live: keep 0.3s ahead. Rendering offline (for tests): schedule the whole length at once.
  const offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
  const tick = () => {
    const until = offline ? ctx.length / ctx.sampleRate : ctx.currentTime + 0.3;
    while (next < until) {
      fn(step++, next);
      next += stepSeconds;
    }
  };
  tick();
  if (offline) return () => {};
  const id = setInterval(tick, 50);
  return () => clearInterval(id);
}

/**
 * One note: an oscillator through an optional low-pass filter and a volume envelope.
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out
 * @param {{ type: OscillatorType, note: number, at: number, dur: number, vol: number, attack?: number,
 *   release?: number, detune?: number, lowpass?: number, lowpassTo?: number, pan?: number }} o
 *   `note` is a MIDI note, `dur` the seconds held before the release, `detune` in cents, and the low-pass
 *   can sweep down to `lowpassTo`.
 */
export function tone(ctx, out, o) {
  const attack = o.attack ?? 0.005;
  const release = o.release ?? 0.08;
  const osc = ctx.createOscillator();
  osc.type = o.type;
  osc.frequency.value = hz(o.note);
  osc.detune.value = o.detune ?? 0;
  const g = ctx.createGain();
  const hold = o.at + Math.max(attack, o.dur);
  g.gain.setValueAtTime(0, o.at);
  g.gain.linearRampToValueAtTime(o.vol, o.at + attack);
  g.gain.setValueAtTime(o.vol, hold);
  g.gain.exponentialRampToValueAtTime(0.0001, hold + release);
  let node = osc;
  if (o.lowpass) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(o.lowpass, o.at);
    if (o.lowpassTo) f.frequency.exponentialRampToValueAtTime(o.lowpassTo, hold + release);
    node.connect(f);
    node = f;
  }
  node.connect(g);
  connectPanned(ctx, g, out, o.pan);
  osc.start(o.at);
  osc.stop(hold + release + 0.05);
}

/**
 * A burst of filtered noise: drums, shakers, sizzles.
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out
 * @param {AudioBuffer} buf
 * @param {number} at
 * @param {{ type: BiquadFilterType, freq: number, q?: number, dur: number, vol: number, pan?: number }} o
 */
export function hit(ctx, out, buf, at, o) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = o.type;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + o.dur);
  src.connect(f).connect(g);
  connectPanned(ctx, g, out, o.pan);
  src.start(at, Math.random() * (buf.duration - o.dur - 0.01));
  src.stop(at + o.dur + 0.02);
}

/** A drum: a sine that drops in pitch (a kick, a tom, a bongo). */
export function boom(ctx, out, at, from, to, dur, vol) {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + dur * 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Connects `node` to `out`, through a stereo panner when `pan` is set. */
function connectPanned(ctx, node, out, pan) {
  if (!pan) return void node.connect(out);
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  node.connect(p).connect(out);
}

/**
 * The mix every piece plays into: a fade-in, a gentle compressor, rumble filtered out, and a room reverb.
 * Returns `mix` (play notes into it), `room` (send notes here for reverb) and `out` (for stopping).
 */
export function mixBus(ctx, dest, startAt, { fadeIn = 1, level = 0.6, roomSize = 1.8, wet = 0.22 } = {}) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, startAt);
  out.gain.linearRampToValueAtTime(1, startAt + fadeIn);
  out.connect(dest);
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -20;
  glue.ratio.value = 3;
  const clean = ctx.createBiquadFilter();
  clean.type = 'highpass';
  clean.frequency.value = 38;
  const mix = ctx.createGain();
  mix.gain.value = level;
  mix.connect(clean).connect(glue).connect(out);
  const room = reverb(ctx, roomSize, 2.8);
  const wetGain = ctx.createGain();
  wetGain.gain.value = wet;
  room.connect(wetGain).connect(mix);
  return { out, mix, room };
}

/**
 * Stopping a piece: fade its output, end its sequencer and let the tails ring out.
 * @returns {(fade?: number) => void}
 */
export function stopper(ctx, out, stopSeq, cleanup = () => {}) {
  return (fade = 1.5) => {
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + fade);
    stopSeq();
    setTimeout(
      () => {
        cleanup();
        out.disconnect();
      },
      (fade + 2.5) * 1000,
    );
  };
}

/** Swing time: where 8th number `k` of the bar starts, from the start of its beat. */
export const swung = (k, beat, swing) => (k % 2 ? swing * beat : 0);
