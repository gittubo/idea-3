/**
 * Ambient soundscape, synthesised in the browser (no audio files).
 *
 * - One large-hall reverb that everything passes through.
 * - Room I (oils, left): a low, warm drone and distant rain on the roof.
 * - Room II (drawings, right): a cooler, airy tone and a far-off bell now and then.
 *   The two crossfade as the visitor walks across the hall.
 * - Footsteps on concrete while walking.
 * - Inside a painting the hall sound dims and muffles.
 * - The guided view: a soft chime at each stop, a deeper resolving bell at the hidden detail.
 *
 * Off by default; it only starts from a visitor's tap or click (browsers require it).
 */
export class Soundscape {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bed!: GainNode;         // everything ambient, ducked inside a painting
  private muffle!: BiquadFilterNode;
  private wet!: GainNode;         // reverb send
  private warm!: GainNode;
  private cool!: GainNode;
  private bellTimer = 0;
  private side = 0.5;             // 0 = warm side, 1 = cool side
  private focus = -1;
  on = false;

  get started() { return this.ctx !== null; }

  async setOn(on: boolean) {
    this.on = on;
    if (on) {
      if (!this.ctx) this.build();
      const ctx = this.ctx!;
      await ctx.resume();
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
      this.scheduleBell();
    } else if (this.ctx) {
      const ctx = this.ctx;
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
      clearTimeout(this.bellTimer);
      setTimeout(() => { if (!this.on) ctx.suspend(); }, 1600);
    }
  }

  /** Visitor's position across the hall (metres, left negative). */
  setPosition(x: number) {
    const side = 1 / (1 + Math.exp(-x / 1.1));
    if (!this.ctx || Math.abs(side - this.side) < 0.01) return;
    this.side = side;
    const t = this.ctx.currentTime;
    this.warm.gain.setTargetAtTime(Math.cos((side * Math.PI) / 2), t, 0.4);
    this.cool.gain.setTargetAtTime(Math.sin((side * Math.PI) / 2), t, 0.4);
  }

  /** 0 = in the hall, 1 = inside a painting (hall dims and muffles). */
  setFocus(k: number) {
    if (!this.ctx || Math.abs(k - this.focus) < 0.01) return;
    this.focus = k;
    const t = this.ctx.currentTime;
    this.bed.gain.setTargetAtTime(1 - 0.55 * k, t, 0.25);
    this.muffle.frequency.setTargetAtTime(9000 * Math.pow(900 / 9000, k), t, 0.25);
  }

  /** One footstep on concrete. */
  step() {
    const ctx = this.ctx;
    if (!ctx || !this.on) return;
    const t = ctx.currentTime + 0.005;
    const v = 0.75 + Math.random() * 0.4;
    const src = ctx.createBufferSource();
    src.buffer = this.noise(0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 650 + Math.random() * 250; bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16 * v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.11);
    src.connect(bp).connect(g);
    const thump = ctx.createOscillator();
    thump.frequency.setValueAtTime(85, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.12 * v, t);
    tg.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
    thump.connect(tg);
    for (const n of [g, tg]) { n.connect(this.muffle); n.connect(this.wet); }
    src.start(t); src.stop(t + 0.2);
    thump.start(t); thump.stop(t + 0.12);
  }

  /** The guided view reached a stop; the hidden detail gets a deeper, resolving bell. */
  chime(hidden: boolean) {
    if (!this.ctx || !this.on) return;
    if (hidden) {
      this.bell(196, 0.16, 0, 7);      // G3
      this.bell(293.7, 0.075, 0.08, 6); // D4
    } else this.bell(587.3 + Math.random() * 40, 0.055, 0, 3.5);
  }

  // ---- building the graph ----------------------------------------------------------
  private build() {
    const ctx = (this.ctx = new AudioContext());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // big hall: a long, dark reverb
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(4.2, 3.4);
    const rvLow = ctx.createBiquadFilter();
    rvLow.type = 'lowpass'; rvLow.frequency.value = 4200;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.wet.connect(reverb).connect(rvLow).connect(this.master);

    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = 'lowpass'; this.muffle.frequency.value = 9000; this.muffle.Q.value = 0.4;
    this.muffle.connect(this.master);
    this.bed = ctx.createGain();
    this.bed.connect(this.muffle);
    this.bed.connect(this.wet);

    // room tone, everywhere: soft brown noise
    const tone = this.loop(this.brown(6));
    const toneLp = ctx.createBiquadFilter();
    toneLp.type = 'lowpass'; toneLp.frequency.value = 260;
    const toneG = ctx.createGain(); toneG.gain.value = 0.11;
    tone.connect(toneLp).connect(toneG).connect(this.bed);

    // Room I · warm: low drone + distant rain
    this.warm = ctx.createGain();
    this.warm.gain.value = Math.cos(this.side * Math.PI / 2);
    this.warm.connect(this.bed);
    this.drone([55, 82.41, 110.2, 164.9], [0.03, 0.022, 0.012, 0.005], 0.045, this.warm);
    const rain = this.loop(this.noise(5));
    const rainBp = ctx.createBiquadFilter();
    rainBp.type = 'bandpass'; rainBp.frequency.value = 1500; rainBp.Q.value = 0.5;
    const rainLp = ctx.createBiquadFilter();
    rainLp.type = 'lowpass'; rainLp.frequency.value = 2600;
    const rainG = ctx.createGain(); rainG.gain.value = 0.018;
    this.lfo(rainG.gain, 0.07, 0.006);
    rain.connect(rainBp).connect(rainLp).connect(rainG).connect(this.warm);

    // Room II · cool: airy fifths + breath of air
    this.cool = ctx.createGain();
    this.cool.gain.value = Math.sin(this.side * Math.PI / 2);
    this.cool.connect(this.bed);
    this.drone([146.83, 220.6, 293.2, 440.9], [0.012, 0.01, 0.006, 0.0025], 0.06, this.cool);
    const air = this.loop(this.noise(5));
    const airHp = ctx.createBiquadFilter();
    airHp.type = 'highpass'; airHp.frequency.value = 3500;
    const airG = ctx.createGain(); airG.gain.value = 0.006;
    this.lfo(airG.gain, 0.04, 0.003);
    air.connect(airHp).connect(airG).connect(this.cool);

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else if (this.on) this.ctx.resume();
    });
  }

  /** Slowly breathing sine partials. */
  private drone(freqs: number[], gains: number[], rate: number, out: AudioNode) {
    const ctx = this.ctx!;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = gains[i];
      this.lfo(g.gain, rate * (1 + i * 0.37), gains[i] * 0.6);
      o.connect(g).connect(out);
      o.start();
    });
  }

  private lfo(param: AudioParam, rate: number, depth: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.value = rate;
    o.type = 'sine';
    const d = ctx.createGain();
    d.gain.value = depth;
    o.connect(d).connect(param);
    o.start(ctx.currentTime + Math.random() * 3);
  }

  /** A far-off bell on the cool side, every half minute or so. */
  private scheduleBell() {
    clearTimeout(this.bellTimer);
    this.bellTimer = window.setTimeout(() => {
      if (!this.on) return;
      const near = Math.sin(this.side * Math.PI / 2);
      if (near > 0.15) this.bell(392 + (Math.random() < 0.5 ? 0 : 48.9), 0.03 * near * (1 - 0.6 * Math.max(0, this.focus)), 0, 6, true);
      this.scheduleBell();
    }, 18000 + Math.random() * 17000);
  }

  /** Struck bell: inharmonic partials with long decays. */
  private bell(f: number, gain: number, delay: number, length: number, distant = false) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.02 + delay;
    const partials: [number, number, number][] = [[1, 1, 1], [2.76, 0.45, 0.6], [5.4, 0.25, 0.35], [8.93, 0.12, 0.2], [0.5, 0.3, 1.3]];
    const out = ctx.createGain();
    out.gain.value = gain;
    if (distant) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1800;
      out.connect(lp); lp.connect(this.wet); lp.connect(this.muffle);
    } else { out.connect(this.muffle); out.connect(this.wet); }
    for (const [ratio, amp, decay] of partials) {
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + length * decay);
      o.connect(g).connect(out);
      o.start(t); o.stop(t + length * decay + 0.05);
    }
  }

  private loop(buffer: AudioBuffer) {
    const s = this.ctx!.createBufferSource();
    s.buffer = buffer; s.loop = true;
    s.start(this.ctx!.currentTime, Math.random() * buffer.duration);
    return s;
  }

  private noise(seconds: number) {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  private brown(seconds: number) {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    // fade the loop seam
    const f = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < f; i++) { d[i] *= i / f; d[d.length - 1 - i] *= i / f; }
    return b;
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
}
