let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.connect(g);
  g.connect(ac.destination);
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.type = type;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function noise(duration: number, gainVal = 0.15) {
  const ac = getCtx();
  const bufSize = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  src.connect(g);
  g.connect(ac.destination);
  g.gain.setValueAtTime(gainVal, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.start();
}

export const sfx = {
  select() {
    beep(660, 0.08, 'sine', 0.2);
  },
  move() {
    beep(280, 0.12, 'triangle', 0.25);
    noise(0.05, 0.08);
  },
  capture() {
    beep(180, 0.15, 'sawtooth', 0.3);
    noise(0.12, 0.2);
    setTimeout(() => beep(120, 0.18, 'triangle', 0.2), 60);
  },
  king() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'sine', 0.25), i * 80));
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.35, 'sine', 0.3), i * 100));
  },
  lose() {
    [392, 349, 294, 247].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'sine', 0.25), i * 120));
  },
  tick() {
    beep(880, 0.04, 'sine', 0.1);
  },
};
