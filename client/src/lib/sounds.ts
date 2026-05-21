let ctx: AudioContext | null = null;

const STORAGE_KEY = 'damka.audio';

interface AudioPrefs {
  muted: boolean;
  volume: number;
  sfxPack: 'classic' | 'dombra';
}

function readPrefs(): AudioPrefs {
  if (typeof localStorage === 'undefined') return { muted: false, volume: 1, sfxPack: 'classic' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, volume: 1, sfxPack: 'classic' };
    const parsed = JSON.parse(raw);
    return {
      muted: !!parsed.muted,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 1,
      sfxPack: parsed.sfxPack === 'dombra' ? 'dombra' : 'classic',
    };
  } catch {
    return { muted: false, volume: 1, sfxPack: 'classic' };
  }
}

let prefs: AudioPrefs = readPrefs();
const listeners = new Set<(p: AudioPrefs) => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
  listeners.forEach(l => l(prefs));
}

export const audioPrefs = {
  get(): AudioPrefs { return { ...prefs }; },
  setMuted(m: boolean) { prefs = { ...prefs, muted: m }; persist(); },
  setVolume(v: number) { prefs = { ...prefs, volume: Math.max(0, Math.min(1, v)) }; persist(); },
  setSfxPack(pack: 'classic' | 'dombra') { prefs = { ...prefs, sfxPack: pack }; persist(); },
  toggleMute() { prefs = { ...prefs, muted: !prefs.muted }; persist(); },
  subscribe(fn: (p: AudioPrefs) => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

function gainMult(): number {
  return prefs.muted ? 0 : prefs.volume;
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// --- Classic Chess/Checkers Sounds ---

// Wooden checker hitting the board: low-freq thud + brief click transient
function woodClack(gain = 0.55) {
  gain *= gainMult();
  if (gain <= 0) return;
  const ac = getCtx();
  const now = ac.currentTime;

  // Body: frequency-swept sine (wood resonance — starts at impact freq, decays down)
  const osc = ac.createOscillator();
  const envGain = ac.createGain();
  osc.connect(envGain);
  envGain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.065);
  envGain.gain.setValueAtTime(gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  osc.start(now);
  osc.stop(now + 0.07);

  // Click: short burst of bandpass-filtered noise (the contact transient)
  const bufSize = Math.floor(ac.sampleRate * 0.025);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * (1 - i / bufSize);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;

  const clickGain = ac.createGain();
  src.connect(filter);
  filter.connect(clickGain);
  clickGain.connect(ac.destination);
  clickGain.gain.setValueAtTime(gain * 0.5, now);
  src.start(now);
}

// Double clack for captures (piece removed from board)
function woodClackDouble(gain = 0.5) {
  if (gainMult() <= 0) return;
  woodClack(gain);
  const adjusted = gain * gainMult();

  // Second lighter tap (piece being taken off) — slightly higher pitch, softer
  setTimeout(() => {
    const ac2 = getCtx();
    const n = ac2.currentTime;
    const osc = ac2.createOscillator();
    const g = ac2.createGain();
    osc.connect(g);
    g.connect(ac2.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, n);
    osc.frequency.exponentialRampToValueAtTime(100, n + 0.045);
    g.gain.setValueAtTime(adjusted * 0.4, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + 0.05);
    osc.start(n);
    osc.stop(n + 0.05);
  }, 80);
}

// Soft click for selection (piece picked up)
function softClick(gain = 0.2) {
  gain *= gainMult();
  if (gain <= 0) return;
  const ac = getCtx();
  const now = ac.currentTime;

  const bufSize = Math.floor(ac.sampleRate * 0.015);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  const g = ac.createGain();
  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
  src.start(now);
}

// Ascending tones for king promotion
function chime(freqs: number[], duration: number, gain = 0.2) {
  gain *= gainMult();
  if (gain <= 0) return;
  const ac = getCtx();
  freqs.forEach((f, i) => {
    setTimeout(() => {
      const n = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.connect(g);
      g.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(gain, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + duration);
      osc.start(n);
      osc.stop(n + duration + 0.02);
    }, i * 90);
  });
}

// --- Synthesised Kazakh Dombra String Plucks ---

function playDombraPluck(freq: number, duration: number, gainVal = 0.45) {
  gainVal *= gainMult();
  if (gainVal <= 0) return;
  const ac = getCtx();
  const now = ac.currentTime;

  // 1. Pluck Transient (Simulates finger tip hitting the string)
  const noiseBufSize = Math.floor(ac.sampleRate * 0.008); // 8ms burst
  const noiseBuf = ac.createBuffer(1, noiseBufSize, ac.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseBufSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseBufSize);
  }
  const noiseSrc = ac.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(gainVal * 0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

  // 2. Fundamental String Resonator (Triangle wave)
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  // Dombra tension drop bend (gives characteristic "ping" quality)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.992, now + 0.06);

  // 3. Sharp Harmonic (Sawtooth wave representing bright nylon sound)
  const oscHarmonic = ac.createOscillator();
  oscHarmonic.type = 'sawtooth';
  oscHarmonic.frequency.setValueAtTime(freq * 2, now);

  const harmonicGain = ac.createGain();
  harmonicGain.gain.setValueAtTime(gainVal * 0.12, now);
  // Harmonic decays much faster than fundamental
  harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.25);

  // 4. Lowpass resonant sweep filter
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 2.8, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 0.6, now + duration);
  filter.Q.value = 2.5; // string twang factor

  // 5. Main gain envelope
  const mainGain = ac.createGain();
  mainGain.gain.setValueAtTime(gainVal * 0.7, now);
  mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connections
  noiseSrc.connect(noiseGain);
  noiseGain.connect(filter);

  osc.connect(filter);
  
  oscHarmonic.connect(harmonicGain);
  harmonicGain.connect(filter);

  filter.connect(mainGain);
  mainGain.connect(ac.destination);

  // Trigger nodes
  noiseSrc.start(now);
  osc.start(now);
  oscHarmonic.start(now);

  osc.stop(now + duration + 0.05);
  oscHarmonic.stop(now + duration + 0.05);
}

function playDombraStrum(notes: number[], duration: number, gainVal = 0.45, strumDelayMs = 20) {
  notes.forEach((f, i) => {
    setTimeout(() => {
      playDombraPluck(f, duration, gainVal);
    }, i * strumDelayMs);
  });
}

export const sfx = {
  select() {
    softClick(0.25);
  },
  move() {
    if (prefs.sfxPack === 'dombra') {
      // D4 (293.66) and G4 (392.00) light strum
      playDombraStrum([293.66, 392.00], 0.35, 0.45, 15);
    } else {
      woodClack(0.55);
    }
  },
  capture() {
    if (prefs.sfxPack === 'dombra') {
      // Rapid back-and-forth strum: first down, then up
      playDombraStrum([293.66, 392.00], 0.35, 0.5, 12);
      setTimeout(() => {
        playDombraStrum([392.00, 587.33], 0.3, 0.45, 10);
      }, 70);
    } else {
      woodClackDouble(0.6);
    }
  },
  king() {
    if (prefs.sfxPack === 'dombra') {
      // Ascending arpeggio strum
      playDombraStrum([293.66, 392.00, 587.33], 0.5, 0.55, 30);
      setTimeout(() => {
        playDombraPluck(587.33, 0.8, 0.5);
      }, 100);
    } else {
      chime([523, 659, 784, 880], 0.22, 0.18);
    }
  },
  win() {
    if (prefs.sfxPack === 'dombra') {
      // Upbeat Dombra fanfare strum sequence
      playDombraStrum([293.66, 392.00], 0.4, 0.5, 15);
      setTimeout(() => playDombraStrum([329.63, 440.00], 0.4, 0.5, 15), 140);
      setTimeout(() => playDombraStrum([392.00, 587.33], 0.45, 0.5, 15), 280);
      setTimeout(() => playDombraStrum([587.33, 784.00], 0.6, 0.6, 12), 420);
    } else {
      chime([523, 659, 784, 1047, 1175], 0.28, 0.2);
    }
  },
  lose() {
    if (prefs.sfxPack === 'dombra') {
      // Mournful descending sequence
      playDombraPluck(440.00, 0.4, 0.4);
      setTimeout(() => playDombraPluck(392.00, 0.4, 0.4), 220);
      setTimeout(() => playDombraPluck(329.63, 0.45, 0.4), 440);
      setTimeout(() => playDombraPluck(293.66, 0.8, 0.5), 660);
    } else {
      chime([392, 349, 294, 247], 0.25, 0.15);
    }
  },
  tick() {
    softClick(0.15);
  },
};
