import { useRef, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';

// Cache to avoid multiple network requests for frequent sounds
let shuffleBufferCache: AudioBuffer | null = null;
let dealBufferCache: AudioBuffer | null = null;
let captureBufferCache: AudioBuffer | null = null;
let chkobbaBufferCache: AudioBuffer | null = null;
let hayyaBufferCache: AudioBuffer | null = null;

/**
 * Sound system for game interaction sounds.
 * Background music is handled by the MusicControl YouTube player.
 */
export function useAmbianceSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const soundEffectsMuted = useUIStore((s) => s.soundEffectsMuted);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Card slide sound (drawing card)
  const playCardSlide = useCallback(() => {
    if (soundEffectsMuted) return;
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
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
  }, [getCtx, soundEffectsMuted]);

  // Card place sound (discarding/playing card)
  const playCardPlace = useCallback(() => {
    if (soundEffectsMuted) return;
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
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }, [getCtx, soundEffectsMuted]);

  // Dramatic sound for Chkobba!
  const playChkobbaSound = useCallback(() => {
    if (soundEffectsMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (audioBuffer: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.8, now + 0.5);
      gainNode.gain.setValueAtTime(0.8, now + 4.5);
      gainNode.gain.linearRampToValueAtTime(0, now + 5);
      source.connect(gainNode).connect(ctx.destination);
      source.start(now);
      source.stop(now + 5);
    };

    if (chkobbaBufferCache) { playBuf(chkobbaBufferCache); return; }

    fetch('/gooba.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        chkobbaBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => {
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 1.2);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.5, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc1.connect(g1).connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.2);
      });
  }, [getCtx, soundEffectsMuted]);

  // Mystical/Legendary sound for Hayya! (7 of Diamonds)
  const playHayyaSound = useCallback(() => {
    if (soundEffectsMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (audioBuffer: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.8, now + 0.3);
      gainNode.gain.setValueAtTime(0.8, now + 3.5);
      gainNode.gain.linearRampToValueAtTime(0, now + 4);
      source.connect(gainNode).connect(ctx.destination);
      source.start(now);
      source.stop(now + 4);
    };

    if (hayyaBufferCache) { playBuf(hayyaBufferCache); return; }

    fetch('/yeah-boiii.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        hayyaBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => {
        [0, 4, 7, 12, 16, 19, 24].forEach((semi, i) => {
          const startTime = now + i * 0.08;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440 * Math.pow(2, semi / 12), startTime);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 2);
          osc.connect(g).connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 2);
        });
      });
  }, [getCtx, soundEffectsMuted]);

  // Realistic card shuffle sound (Riffle)
  const playCardShuffle = useCallback(() => {
    if (soundEffectsMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      source.connect(g).connect(ctx.destination);
      source.start(now);
    };

    if (shuffleBufferCache) {
      playBuf(shuffleBufferCache);
      return;
    }

    fetch('/pics/riffle-shuffle.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
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
          src.connect(filter).connect(g).connect(ctx.destination);
          src.start(snapTime);
        }
      });
  }, [getCtx, soundEffectsMuted]);

  // Fast card dealing sound
  const playCardDealShort = useCallback(() => {
    if (soundEffectsMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playSlice = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      source.connect(g).connect(ctx.destination);
      const startTime = 0.5 + Math.random() * 1.5;
      source.start(now, startTime, 0.15);
    };

    if (dealBufferCache) {
      playSlice(dealBufferCache);
      return;
    }

    fetch('/pics/card-deal.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        dealBufferCache = audioBuffer;
        playSlice(audioBuffer);
      })
      .catch(() => playCardSlide());
  }, [getCtx, playCardSlide, soundEffectsMuted]);

  // Sound when a player captures a card
  const playCardCapture = useCallback(() => {
    if (soundEffectsMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playBuf = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      source.connect(g).connect(ctx.destination);
      source.start(now);
    };

    if (captureBufferCache) {
      playBuf(captureBufferCache);
      return;
    }

    fetch('/card-capture.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        captureBufferCache = audioBuffer;
        playBuf(audioBuffer);
      })
      .catch(() => playCardPlace());
  }, [getCtx, playCardPlace, soundEffectsMuted]);

  return { playCardSlide, playCardPlace, playCardShuffle, playChkobbaSound, playHayyaSound, playCardDealShort, playCardCapture };
}
