import { useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';

/** Linear 0–1 from UI; used to decide whether to start a one-shot sound. */
function getSfxLinear(): number {
  const { soundEffectsMuted, soundEffectsVolume } = useUIStore.getState();
  if (soundEffectsMuted) return 0;
  return soundEffectsVolume;
}

/**
 * Perceptual master gain (0–1). Power curve so mid/low slider positions reduce loudness
 * more than linear; matches how ears perceive volume.
 */
function getEffectiveSfxGain(): number {
  const linear = getSfxLinear();
  if (linear <= 0) return 0;
  return Math.pow(linear, 1.85);
}

// Cache to avoid multiple network requests for frequent sounds
let shuffleBufferCache: AudioBuffer | null = null;
let dealBufferCache: AudioBuffer | null = null;
let captureBufferCache: AudioBuffer | null = null;
let hoverBufferCache: AudioBuffer | null = null;

let sfxMasterGain: GainNode | null = null;
let sfxMasterCtx: BaseAudioContext | null = null;
let sfxStoreSubscribed = false;

/** Single master output: all SFX connect here; gain tracks UI store in real time. */
function getSfxOut(ctx: AudioContext): AudioNode {
  if (!sfxMasterGain || sfxMasterCtx !== ctx) {
    sfxMasterCtx = ctx;
    sfxMasterGain = ctx.createGain();
    sfxMasterGain.connect(ctx.destination);

    const syncMaster = () => {
      if (!sfxMasterGain) return;
      const v = getEffectiveSfxGain();
      try {
        sfxMasterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
      } catch {
        sfxMasterGain.gain.value = v;
      }
    };
    syncMaster();
    if (!sfxStoreSubscribed) {
      sfxStoreSubscribed = true;
      useUIStore.subscribe(syncMaster);
    }
  }
  return sfxMasterGain;
}

function connectHtmlAudioToSfx(ctx: AudioContext, audio: HTMLAudioElement, intrinsicVolume: number) {
  /** MediaElementSource ignores element.volume in some engines; keep at 1 and rely on master gain. */
  audio.volume = Math.min(1, intrinsicVolume);
  const mes = ctx.createMediaElementSource(audio);
  mes.connect(getSfxOut(ctx));
}

/**
 * Sound system for interaction sounds (Hookah, Coffee, Lighter, Waitress).
 * Background music is now handled by the VintageRadio YouTube player.
 */
/** One shared context so all SFX share the same master gain (live volume/mute updates). */
let sharedSfxCtx: AudioContext | null = null;
function getSharedCtx(): AudioContext {
  if (!sharedSfxCtx) {
    sharedSfxCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedSfxCtx.state === 'suspended') void sharedSfxCtx.resume();
  return sharedSfxCtx;
}

export function useAmbianceSound() {
  const getCtx = useCallback(() => getSharedCtx(), []);

  // Hookah smoking sound
  const playBubble = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const audio = new Audio('/pics/freesound_community-hookah-bubling-69642.mp3');
    try {
      connectHtmlAudioToSfx(ctx, audio, 0.7);
      audio.play().catch(() => {
        const now = ctx.currentTime;
        for (let i = 0; i < 8; i++) {
          const popTime = now + i * 0.15;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150 + Math.random() * 100, popTime);
          osc.frequency.exponentialRampToValueAtTime(40, popTime + 0.1);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, popTime);
          g.gain.linearRampToValueAtTime(0.05, popTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, popTime + 0.1);
          osc.connect(g).connect(getSfxOut(ctx));
          osc.start(popTime);
          osc.stop(popTime + 0.15);
        }
      });
    } catch {
      audio.volume = Math.min(1, 0.7 * getEffectiveSfxGain());
      audio.play().catch(() => {});
    }
  }, [getCtx]);

  // Coffee drinking sound
  const playClink = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const audio = new Audio('/pics/freesound_community-drinking-coffe-107121.mp3');
    try {
      connectHtmlAudioToSfx(ctx, audio, 0.6);
      audio.play().catch(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g).connect(getSfxOut(ctx));
        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch {
      audio.volume = Math.min(1, 0.6 * getEffectiveSfxGain());
      audio.play().catch(() => {});
    }
  }, [getCtx]);

  // Lighter flick sound
  const playLighter = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const audio = new Audio('/pics/freesound_community-cigarette-cracklings-lighter-smoke-6693.mp3');
    try {
      connectHtmlAudioToSfx(ctx, audio, 0.6);
      audio.play().catch(() => {
        const now = ctx.currentTime;
        const bufLen = ctx.sampleRate * 0.1;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = 0.1;
        src.connect(g).connect(getSfxOut(ctx));
        src.start(now);
      });
    } catch {
      audio.volume = Math.min(1, 0.6 * getEffectiveSfxGain());
      audio.play().catch(() => {});
    }
  }, [getCtx]);

  // Waitress Voice
  const playWaitressVoice = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const audio = new Audio('/pics/ai_mee_universe-ai_mee_universe-te-gusta-mi-bikini-150219.mp3');
    try {
      connectHtmlAudioToSfx(ctx, audio, 0.8);
      audio.play().catch(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.1, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g).connect(getSfxOut(ctx));
        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch {
      audio.volume = Math.min(1, 0.8 * getEffectiveSfxGain());
      audio.play().catch(() => {});
    }
  }, [getCtx]);

  // Card slide sound (drawing card)
  const playCardSlide = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const bufLen = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.connect(filter).connect(g).connect(getSfxOut(ctx));
    src.start(now);
  }, [getCtx]);

  // Card place sound (discarding/playing card)
  const playCardPlace = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.1, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g).connect(getSfxOut(ctx));
    osc.start(now);
    osc.stop(now + 0.2);
  }, [getCtx]);

  // Realistic card shuffle sound (Riffle)
  const playCardShuffle = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      source.connect(g).connect(getSfxOut(ctx));
      source.start(now);
    };

    if (shuffleBufferCache) {
      playBuf(shuffleBufferCache);
      return;
    }

    fetch('/pics/riffle-shuffle.mp3')
      .then((res) => res.arrayBuffer())
      .then((buffer) => ctx.decodeAudioData(buffer))
      .then((audioBuffer) => {
        shuffleBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => {
        for (let i = 0; i < 12; i++) {
          const snapTime = now + i * 0.08;
          const bufLen = ctx.sampleRate * 0.1;
          const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let j = 0; j < bufLen; j++) d[j] = (Math.random() * 2 - 1) * 0.1;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1000 + i * 100, snapTime);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, snapTime);
          g.gain.linearRampToValueAtTime(0.1, snapTime + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.08);
          src.connect(filter).connect(g).connect(getSfxOut(ctx));
          src.start(snapTime);
        }
      });
  }, [getCtx]);

  // Fast card dealing sound (Short segment from the long deal file)
  const playCardDealShort = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playSlice = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      source.connect(g).connect(getSfxOut(ctx));
      const startTime = 0.5 + Math.random() * 1.5;
      source.start(now, startTime, 0.15);
    };

    if (dealBufferCache) {
      playSlice(dealBufferCache);
      return;
    }

    fetch('/pics/card-deal.mp3')
      .then((res) => res.arrayBuffer())
      .then((buffer) => ctx.decodeAudioData(buffer))
      .then((audioBuffer) => {
        dealBufferCache = audioBuffer;
        playSlice(audioBuffer);
      })
      .catch(() => playCardSlide());
  }, [getCtx, playCardSlide]);

  // Sound when a player "eats" (captures) a card
  const playCardCapture = useCallback(() => {
    if (getSfxLinear() <= 0) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      source.connect(g).connect(getSfxOut(ctx));
      source.start(now);
    };

    if (captureBufferCache) {
      playBuf(captureBufferCache);
      return;
    }

    fetch('/card-capture.mp3')
      .then((res) => res.arrayBuffer())
      .then((buffer) => ctx.decodeAudioData(buffer))
      .then((audioBuffer) => {
        captureBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => playCardPlace());
  }, [getCtx, playCardPlace]);

  /** Short snap when clicking to select a hand card (not on deselect; not play/capture). */
  const playCardHover = useCallback(() => {
    if (getSfxLinear() <= 0) return;

    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      source.connect(g).connect(getSfxOut(ctx));
      const dur = Math.min(buf.duration, 0.22);
      source.start(now, 0, dur);
    };

    if (hoverBufferCache) {
      playBuf(hoverBufferCache);
      return;
    }

    fetch('/card-hover-snap.wav')
      .then((res) => res.arrayBuffer())
      .then((buffer) => ctx.decodeAudioData(buffer))
      .then((audioBuffer) => {
        hoverBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => {
        playCardSlide();
      });
  }, [getCtx, playCardSlide]);

  return {
    playClink,
    playLighter,
    playBubble,
    playWaitressVoice,
    playCardSlide,
    playCardPlace,
    playCardShuffle,
    playCardDealShort,
    playCardCapture,
    playCardHover,
  };
}
