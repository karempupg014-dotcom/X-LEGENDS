/**
 * Procedural Web Audio API sound synthesizer for X Legends
 * No external MP3 files required; instant latency, no broken sound assets.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // UI Click / Hover
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Sword Swing
  public playSwordSwing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    // White noise swoosh + pitched whistle
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  public playSword() {
    this.playSwordSwing();
  }

  public playHoly() {
    this.playJudgement();
  }

  public playCoin() {
    this.playPickup();
  }

  // Hit Impact
  public playHit(isCrit: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'triangle';
    const baseFreq = isCrit ? 280 : 160;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + (isCrit ? 0.2 : 0.12));

    gain.gain.setValueAtTime(isCrit ? 0.45 : 0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (isCrit ? 0.2 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + (isCrit ? 0.2 : 0.12));
  }

  // Whirlwind Skill
  public playWhirlwind() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    for (let i = 0; i < 3; i++) {
      const delay = i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200 + i * 100, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + delay + 0.15);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.15);
    }
  }

  // Dash / Charge Skill
  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // War Cry / Roar
  public playRoar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.45);

    osc2.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.45);
    osc2.stop(this.ctx.currentTime + 0.45);
  }

  // Heavenly Blade Rain (Judgement)
  public playJudgement() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5 major
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.ctx!.currentTime + idx * 0.05);
      osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.6);
    });
  }

  // Level Up Fanfare
  public playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      const startTime = this.ctx!.currentTime + index * 0.09;
      const duration = index === notes.length - 1 ? 0.6 : 0.12;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // Potion Drink / Healing
  public playPotion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // Loot pickup
  public playPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Monster Roar / Death
  public playMonsterDeath() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Quest Complete
  public playQuestComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const chords = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      const start = this.ctx!.currentTime + idx * 0.1;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }
}

export const sound = new SoundSystem();
