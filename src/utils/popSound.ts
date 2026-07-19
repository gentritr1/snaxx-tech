/* ------------------------------------------------------------------ */
/* Toy-box burst sound — a synthesized "popcorn" pop, no audio assets.  */
/* Lazily creates the AudioContext inside the click gesture so it is    */
/* autoplay-safe. Everything runs through a compressor to stay clean.   */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getBus(): { ctx: AudioContext; master: GainNode } | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return { ctx, master: master! };
  } catch {
    return null;
  }
}

type Bus = { ctx: AudioContext; master: GainNode };

function pop(bus: Bus, when: number, startFreq: number, volume: number, dur = 0.11) {
  const { ctx: ac, master: out } = bus;

  // body: sine dropping fast in pitch — the "pop"
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, when);
  osc.frequency.exponentialRampToValueAtTime(startFreq * 0.22, when + dur);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(volume, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(when);
  osc.stop(when + dur + 0.02);

  // snap: 30 ms of decaying filtered noise — the "crackle"
  const len = Math.floor(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1600 + Math.random() * 900;
  bp.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.value = volume * 0.5;
  src.connect(bp);
  bp.connect(ng);
  ng.connect(out);
  src.start(when);
}

/** One main pop plus a few staggered mini pops — a tiny confetti-cannon volley. */
export function playBurstPop(mega = false) {
  const bus = getBus();
  if (!bus) return;
  const t0 = bus.ctx.currentTime + 0.01;
  if (mega) {
    // deeper, fatter main pop + a longer popcorn tail for the mega burst
    pop(bus, t0, 330 + Math.random() * 60, 0.3, 0.16);
    const extra = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extra; i++) {
      pop(bus, t0 + 0.06 + i * (0.045 + Math.random() * 0.04), 380 + Math.random() * 560, 0.12);
    }
    return;
  }
  pop(bus, t0, 520 + Math.random() * 80, 0.22);
  const extra = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < extra; i++) {
    pop(bus, t0 + 0.05 + i * (0.05 + Math.random() * 0.04), 420 + Math.random() * 480, 0.1);
  }
}

/** A single soft pop — used by party mode's automatic mini-bursts. */
export function playMiniPop() {
  const bus = getBus();
  if (!bus) return;
  pop(bus, bus.ctx.currentTime + 0.01, 640 + Math.random() * 320, 0.07);
}
