import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';

// Singleton music instance — shared across all hook consumers
let musicInstance: HTMLAudioElement | null = null;

function getMusicInstance() {
  if (!musicInstance) {
    musicInstance = new Audio('/pics/song.mp3');
    musicInstance.loop = true;
    musicInstance.volume = useUIStore.getState().musicVolume;
  }
  return musicInstance;
}

/**
 * Enhanced sound system.
 * ambianceSoundOn + musicVolume control the background MUSIC.
 * Interaction sounds (Hookah, Coffee, Lighter) ALWAYS work with synthetic fallbacks.
 */
export function useAmbianceSound() {
  const ambianceSoundOn = useUIStore((s) => s.ambianceSoundOn);
  const musicVolume = useUIStore((s) => s.musicVolume);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Handle music play/pause based on toggle
  useEffect(() => {
    const music = getMusicInstance();
    if (ambianceSoundOn) {
      music.play().catch(() => {});
    } else {
      music.pause();
    }
  }, [ambianceSoundOn]);

  // Handle volume changes
  useEffect(() => {
    const music = getMusicInstance();
    music.volume = musicVolume;
  }, [musicVolume]);

  // Hookah smoking sound
  const playBubble = useCallback(() => {
    const audio = new Audio('/pics/freesound_community-hookah-bubling-69642.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {
      const ctx = getCtx();
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
        osc.connect(g).connect(ctx.destination);
        osc.start(popTime);
        osc.stop(popTime + 0.15);
      }
    });
  }, [getCtx]);

  // Coffee drinking sound
  const playClink = useCallback(() => {
    const audio = new Audio('/pics/freesound_community-drinking-coffe-107121.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }, [getCtx]);

  // Lighter flick sound
  const playLighter = useCallback(() => {
    const audio = new Audio('/pics/freesound_community-cigarette-cracklings-lighter-smoke-6693.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const bufLen = ctx.sampleRate * 0.1;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.1;
      src.connect(g).connect(ctx.destination);
      src.start(now);
    });
  }, [getCtx]);

  // Waitress Voice
  const playWaitressVoice = useCallback(() => {
    const audio = new Audio('/pics/ai_mee_universe-ai_mee_universe-te-gusta-mi-bikini-150219.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.1, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }, [getCtx]);

  return { playClink, playLighter, playBubble, playWaitressVoice };
}
