import { useUIStore } from '../stores/useUIStore';

function getSfxLinear(): number {
  const { soundEffectsMuted, soundEffectsVolume } = useUIStore.getState();
  if (soundEffectsMuted) return 0;
  return soundEffectsVolume;
}

function getEffectiveSfxGain(): number {
  const linear = getSfxLinear();
  if (linear <= 0) return 0;
  return Math.pow(linear, 1.85);
}

/** Vite: bundled .mp3 under src/assets (only entries that exist at build time) */
const bundledSoundUrls = {
  ...import.meta.glob('../assets/sound_effects/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
  ...import.meta.glob('../assets/sounds/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
} as Record<string, string>;

function resolveBundledUrl(filename: string): string | undefined {
  const entry = Object.entries(bundledSoundUrls).find(([key]) => key.endsWith(`/${filename}`));
  return entry?.[1];
}

/** Static files from `client/public/` — works for MP3s you drop in without touching imports. */
function publicSoundUrl(subdir: 'sound_effects' | 'sounds', filename: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${subdir}/${encodeURIComponent(filename)}`;
}

function playSynthThud(): void {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    const g = ctx.createGain();
    const v = getEffectiveSfxGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35 * v, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    /* ignore */
  }
}

/** Chat / panel emotes — separate from Chkobba–Hayya celebration so card play does not cut regular emotes. */
let currentEmoteAudio: HTMLAudioElement | null = null;

/** Long MP3 from `playCelebrationFanfare` (Chkobba / 7 Hayya). */
let currentCelebrationEmoteAudio: HTMLAudioElement | null = null;

/** Pending fanfare MP3 after boom; cleared when another celebration starts or on card play. */
let celebrationFanfareTimer: ReturnType<typeof setTimeout> | null = null;

/** Boom from the celebration intro — tracked so we can stop it with the fanfare. */
let celebrationBoomAudio: HTMLAudioElement | null = null;

/** Stops overlapping Web Audio fallback beeps when switching emotes quickly. */
let stopEmoteFallbackSynth: (() => void) | null = null;
let emoteFallbackEndTimer: number | null = null;

function stopCurrentEmoteAudio(): void {
  if (!currentEmoteAudio) return;
  try {
    currentEmoteAudio.pause();
    currentEmoteAudio.currentTime = 0;
  } catch {
    /* ignore */
  }
  currentEmoteAudio = null;
}

function stopCelebrationEmoteAudio(): void {
  if (!currentCelebrationEmoteAudio) return;
  try {
    currentCelebrationEmoteAudio.pause();
    currentCelebrationEmoteAudio.currentTime = 0;
  } catch {
    /* ignore */
  }
  currentCelebrationEmoteAudio = null;
}

function stopEmoteFallback(): void {
  if (emoteFallbackEndTimer) {
    clearTimeout(emoteFallbackEndTimer);
    emoteFallbackEndTimer = null;
  }
  if (stopEmoteFallbackSynth) {
    try {
      stopEmoteFallbackSynth();
    } catch {
      /* ignore */
    }
    stopEmoteFallbackSynth = null;
  }
}

function stopAllEmotePlayback(): void {
  stopCurrentEmoteAudio();
  stopEmoteFallback();
}

/**
 * Stops Chkobba/Hayya celebration only: pending fanfare, celebration boom, and celebration MP3.
 * Does not stop regular emote sounds (chat emotes, previews).
 */
export function stopCelebrationPlayback(): void {
  if (celebrationFanfareTimer !== null) {
    clearTimeout(celebrationFanfareTimer);
    celebrationFanfareTimer = null;
  }
  stopCelebrationEmoteAudio();
  if (celebrationBoomAudio) {
    try {
      celebrationBoomAudio.pause();
      celebrationBoomAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    celebrationBoomAudio = null;
  }
}

/** Short click so emotes still give feedback if the MP3 is missing or blocked. */
function playSynthEmoteFallback(filename: string, context: string, intrinsicVolume: number): void {
  stopEmoteFallback();
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    let f = 520 + (filename.charCodeAt(0) % 8) * 40;
    if (filename === '67.mp3' || filename.startsWith('67-')) f = 670;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.75, now + 0.06);
    const v = getEffectiveSfxGain() * intrinsicVolume;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14 * v, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g).connect(ctx.destination);

    stopEmoteFallbackSynth = () => {
      try {
        osc.stop();
      } catch {
        /* ignore */
      }
      try {
        osc.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
      try {
        void ctx.close();
      } catch {
        /* ignore */
      }
    };

    osc.start(now);
    osc.stop(now + 0.12);
    emoteFallbackEndTimer = window.setTimeout(() => {
      emoteFallbackEndTimer = null;
      const fn = stopEmoteFallbackSynth;
      stopEmoteFallbackSynth = null;
      if (fn) fn();
    }, 200);
  } catch {
    /* ignore */
  }
  console.warn(
    `[sfx] Emote fallback beep — add ${filename} under client/public/sound_effects/ (see shared/emotes.ts) — ${context}`,
  );
}

export type ImpactBoomOptions = { celebration?: boolean };

/**
 * Single heavy impact for Chkobba / 7 Hayya — `boom.mp3` (table slam). Falls back to a short synth thud.
 * Pass `{ celebration: true }` for the intro boom bundled with `playCelebrationFanfare` so it stops with celebration audio.
 */
export function playImpactBoom(volumeScale = 1, opts?: ImpactBoomOptions): void {
  if (getSfxLinear() <= 0) return;

  if (opts?.celebration && celebrationBoomAudio) {
    try {
      celebrationBoomAudio.pause();
      celebrationBoomAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    celebrationBoomAudio = null;
  }

  const url = resolveBundledUrl('boom.mp3') ?? publicSoundUrl('sounds', 'boom.mp3');
  const audio = new Audio(url);
  audio.volume = Math.min(1, getEffectiveSfxGain() * Math.max(0, Math.min(1, volumeScale)));
  const onBoomFail = () => {
    if (opts?.celebration && celebrationBoomAudio === audio) celebrationBoomAudio = null;
    playSynthThud();
  };
  audio.addEventListener('error', onBoomFail, { once: true });

  if (opts?.celebration) {
    celebrationBoomAudio = audio;
    const clearBoom = () => {
      if (celebrationBoomAudio === audio) celebrationBoomAudio = null;
    };
    audio.addEventListener('ended', clearBoom, { once: true });
  }

  audio.play().catch(onBoomFail);
}

export type PlayAssetSoundOptions = { channel?: 'emote' | 'celebration' };

/**
 * Play a file from `public/sound_effects/` or bundled assets.
 * Default `channel: 'emote'` — only replaces other emote clips, not Chkobba/Hayya celebration.
 * Use `channel: 'celebration'` only from `playCelebrationFanfare`.
 */
export function playAssetSoundMp3(
  filename: string,
  context: string,
  intrinsicVolume = 1,
  options?: PlayAssetSoundOptions,
): void {
  if (getSfxLinear() <= 0) return;

  const channel = options?.channel ?? 'emote';

  if (channel === 'celebration') {
    stopCelebrationEmoteAudio();
  } else {
    stopAllEmotePlayback();
  }

  const url = resolveBundledUrl(filename) ?? publicSoundUrl('sound_effects', filename);
  const vol = Math.min(1, intrinsicVolume * getEffectiveSfxGain());

  const audio = new Audio(url);
  audio.volume = vol;
  if (channel === 'celebration') {
    currentCelebrationEmoteAudio = audio;
  } else {
    currentEmoteAudio = audio;
  }

  let done = false;
  const fail = (err?: unknown) => {
    if (done) return;
    done = true;
    if (channel === 'celebration') {
      if (currentCelebrationEmoteAudio === audio) currentCelebrationEmoteAudio = null;
    } else if (currentEmoteAudio === audio) {
      currentEmoteAudio = null;
    }
    if (err !== undefined) console.warn(`[sfx] Could not play ${filename} (${context}):`, err);
    playSynthEmoteFallback(filename, context, intrinsicVolume);
  };

  const clearIfThis = () => {
    if (channel === 'celebration') {
      if (currentCelebrationEmoteAudio === audio) currentCelebrationEmoteAudio = null;
    } else if (currentEmoteAudio === audio) {
      currentEmoteAudio = null;
    }
  };
  audio.addEventListener('ended', clearIfThis, { once: true });
  audio.addEventListener('error', () => fail(), { once: true });
  audio.play().catch((err) => fail(err));
}

/**
 * Table slam + chosen celebration emote. Stops any in-progress Chkobba/Hayya celebration (including the other type).
 * Clears short chat emote clips so the fanfare isn’t layered over a tiny emote beep.
 */
export function playCelebrationFanfare(emoteFilename: string, context: string, emoteIntrinsicVol = 1.12): void {
  if (getSfxLinear() <= 0) return;
  stopCelebrationPlayback();
  stopCurrentEmoteAudio();
  stopEmoteFallback();
  playImpactBoom(0.62, { celebration: true });
  celebrationFanfareTimer = setTimeout(() => {
    celebrationFanfareTimer = null;
    playAssetSoundMp3(emoteFilename, context, emoteIntrinsicVol, { channel: 'celebration' });
  }, 38);
}
