import { useRef, useCallback } from 'react';

// Cache to avoid multiple network requests for frequent sounds
let shuffleBufferCache: AudioBuffer | null = null;
let dealBufferCache: AudioBuffer | null = null;
let captureBufferCache: AudioBuffer | null = null;

/**
 * Sound system for interaction sounds (Hookah, Coffee, Lighter, Waitress).
 * Background music is now handled by the VintageRadio YouTube player.
 */
export function useAmbianceSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

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

  // Card slide sound (drawing card)
  const playCardSlide = useCallback(() => {
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
  }, [getCtx]);

  // Card place sound (discarding/playing card)
  const playCardPlace = useCallback(() => {
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
  }, [getCtx]);

  // Dramatic sound for Chkobba!
  const playChkobbaSound = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    // Play GOOBA sound with fade in/out
    const audio = new Audio('/gooba.mp3');
    audio.volume = 0; // Start at 0 for manual fade if needed, but Audio element is easier for long files
    
    // Using AudioContext for precise control and fading
    fetch('/gooba.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = ctx.createGain();
        
        // Smooth fade in (0.5s)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.5);
        
        // Smooth fade out after 4 seconds (total play time ~5s)
        gainNode.gain.setValueAtTime(0.8, now + 4.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 5);
        
        source.connect(gainNode).connect(ctx.destination);
        source.start(now);
        source.stop(now + 5);
      })
      .catch(err => {
        console.error('Failed to play gooba.mp3:', err);
        // Fallback to synthesis
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
  }, [getCtx]);

  // Mystical/Legendary sound for Hayya! (7 of Diamonds)
  const playHayyaSound = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    // Play YEAH BOIII sound with fade in/out
    fetch('/yeah-boiii.mp3')
      .then(res => res.arrayBuffer())
      .then(buffer => ctx.decodeAudioData(buffer))
      .then(audioBuffer => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = ctx.createGain();
        
        // Smooth fade in (0.3s)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + 0.3);
        
        // Smooth fade out after 3.5 seconds
        gainNode.gain.setValueAtTime(0.8, now + 3.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 4);
        
        source.connect(gainNode).connect(ctx.destination);
        source.start(now);
        source.stop(now + 4);
      })
      .catch(err => {
        console.error('Failed to play yeah-boiii.mp3:', err);
        // Fallback: sparkle arpeggio
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
  }, [getCtx]);

  // Realistic card shuffle sound (Riffle)
  const playCardShuffle = useCallback(() => {
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
        // Fallback to synthetic shuffle if file fails
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
  }, [getCtx]);

  // Fast card dealing sound (Short segment from the long deal file)
  const playCardDealShort = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    
    const playSlice = (buf: AudioBuffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      source.connect(g).connect(ctx.destination);
      // Randomize start between 0.5s and 2.0s of the file
      const startTime = 0.5 + Math.random() * 1.5; 
      source.start(now, startTime, 0.15); // play a quick 0.15s slice
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
      .catch(() => playCardSlide()); // Fallback
  }, [getCtx, playCardSlide]);

  // Sound when a player "eats" (captures) a card
  const playCardCapture = useCallback(() => {
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
      .catch(() => playCardPlace()); // Fallback
  }, [getCtx, playCardPlace]);

  return { playClink, playLighter, playBubble, playWaitressVoice, playCardSlide, playCardPlace, playCardShuffle, playChkobbaSound, playHayyaSound, playCardDealShort, playCardCapture };
}
