let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Wooden checker hitting the board: low-freq thud + brief click transient
function woodClack(gain = 0.55) {
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
  woodClack(gain);
  const ac = getCtx();
  const now = ac.currentTime;

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
    g.gain.setValueAtTime(gain * 0.4, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + 0.05);
    osc.start(n);
    osc.stop(n + 0.05);
  }, 80);
}

// Soft click for selection (piece picked up)
function softClick(gain = 0.2) {
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

export const sfx = {
  select() {
    softClick(0.25);
  },
  move() {
    woodClack(0.55);
  },
  capture() {
    woodClackDouble(0.6);
  },
  king() {
    chime([523, 659, 784, 880], 0.22, 0.18);
  },
  win() {
    chime([523, 659, 784, 1047, 1175], 0.28, 0.2);
  },
  lose() {
    chime([392, 349, 294, 247], 0.25, 0.15);
  },
  tick() {
    softClick(0.15);
  },
};
