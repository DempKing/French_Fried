// Sound: synthesized sound effects and the game's own music, all made live with Web Audio (no audio files).
// Each part of the game has its own piece (src/music/); moving between parts crossfades to it.
import { playCosmos } from './music/cosmos.js';
import { playFryer } from './music/fryer.js';
import { playKitchen } from './music/kitchen.js';
import { playLab } from './music/lab.js';

let ctx = null;
let master = null;
let musicGain = null;
const settings = { sfx: true, music: true, volume: 0.6 };

/** The pieces, by name. */
const PIECES = { kitchen: playKitchen, lab: playLab, fryer: playFryer, cosmos: playCosmos };
let scene = 'kitchen'; // the piece the current screen wants
let playing = null; // { name, piece } now playing

/** The shared AudioContext (created on first use). */
function ensure() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = settings.volume;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.8; // the music sits under the sound effects
  musicGain.connect(master);
  return ctx;
}

/**
 * iPhone and iPad mute Web Audio when the ring/silent switch is on silent. Asking for media playback,
 * or playing a silent media element, lets the game be heard like a video. Needs a tap, so it runs on unlock.
 */
let unmuted = false;
function unmuteIOS() {
  if (unmuted) return;
  unmuted = true;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    // Not supported: the silent clip below does the job.
  }
  // A tenth of a second of silence (8 kHz, 8-bit WAV), looping quietly in the background.
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at, str) => [...str].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, samples, true);
  bytes.fill(128, 44); // 8-bit silence is the middle value
  try {
    const el = new Audio(URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })));
    el.loop = true;
    el.setAttribute('playsinline', '');
    void el.play().catch(() => {});
  } catch {
    // No media playback here (tests, old browsers): nothing to unmute.
  }
}

/** Applies the sound settings. */
export function configureAudio(s) {
  Object.assign(settings, s);
  if (master) master.gain.value = settings.volume;
  updateMusic();
}

/** Starts audio after the first click (browsers require it). */
export function unlockAudio() {
  unmuteIOS();
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
  updateMusic();
}

/** Which piece should play: 'kitchen', 'lab', 'fryer' or 'cosmos' (the screen changed). */
export function setMusicScene(name) {
  scene = PIECES[name] ? name : 'kitchen';
  updateMusic();
}

/** Starts, switches or stops the music to match the scene and the Music setting. */
function updateMusic() {
  const want = settings.music && ensure() ? scene : null;
  if (playing?.name === want) return;
  if (playing) {
    playing.piece.stop(1.2);
    playing = null;
  }
  if (want) playing = { name: want, piece: PIECES[want](ctx, musicGain, ctx.currentTime + 0.05) };
}

/** A simple synth tone. */
function tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0, dest } = {}) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** A burst of filtered noise. */
function noise(dur, { vol = 0.2, filter = 2000, delay = 0 } = {}) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.random());
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filter;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

/** Each sound effect. */
const SFX = {
  card: () => {
    tone(520, 0.08, { type: 'triangle', vol: 0.18, slide: 200 });
    noise(0.05, { vol: 0.08, filter: 4000 });
  },
  draw: () => noise(0.09, { vol: 0.1, filter: 3000 }),
  remove: () => tone(420, 0.09, { type: 'triangle', vol: 0.15, slide: -180 }),
  sizzle: () => {
    noise(0.9, { vol: 0.22, filter: 5200 });
    noise(0.7, { vol: 0.12, filter: 2500, delay: 0.1 });
  },
  discover: () =>
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'square', vol: 0.12, delay: i * 0.09 })),
  known: () => [659, 784].forEach((f, i) => tone(f, 0.15, { type: 'triangle', vol: 0.15, delay: i * 0.08 })),
  fail: () => {
    tone(300, 0.25, { type: 'sawtooth', vol: 0.1, slide: -150 });
    tone(220, 0.3, { type: 'sawtooth', vol: 0.08, slide: -100, delay: 0.15 });
  },
  coin: () => {
    tone(988, 0.07, { type: 'square', vol: 0.1 });
    tone(1319, 0.18, { type: 'square', vol: 0.1, delay: 0.07 });
  },
  pack: () => {
    noise(0.3, { vol: 0.15, filter: 1500 });
    [392, 523, 659].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.14, delay: 0.15 + i * 0.06 }));
  },
  error: () => tone(160, 0.18, { type: 'square', vol: 0.1 }),
  hit: () => {
    noise(0.12, { vol: 0.25, filter: 900 });
    tone(140, 0.12, { type: 'square', vol: 0.12, slide: -60 });
  },
  crit: () => {
    noise(0.2, { vol: 0.3, filter: 1200 });
    tone(220, 0.2, { type: 'sawtooth', vol: 0.14, slide: -120 });
  },
  miss: () => tone(700, 0.12, { type: 'sine', vol: 0.08, slide: -400 }),
  heal: () => tone(600, 0.2, { type: 'sine', vol: 0.1, slide: 300 }),
  win: () =>
    [523, 659, 784, 659, 1047].forEach((f, i) =>
      tone(f, 0.2, { type: 'square', vol: 0.12, delay: i * 0.11 }),
    ),
  lose: () => {
    noise(1.2, { vol: 0.25, filter: 4500 });
    [392, 330, 262].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.14, delay: i * 0.2 }));
  },
  achievement: () =>
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.14, delay: i * 0.07 })),
  click: () => tone(880, 0.04, { type: 'triangle', vol: 0.08 }),
};

/** Plays a named sound effect. */
export function sfx(name) {
  if (!settings.sfx) return;
  try {
    SFX[name]?.();
  } catch {
    /* audio is best-effort */
  }
}
