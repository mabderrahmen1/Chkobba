/**
 * Sound emotes — filenames under `client/public/sound_effects/`.
 * Labels: first token before `-` or `_` (e.g. fein-nokia.mp3 → FEIN, 67-kid.mp3 → 67).
 */

const EMOTE_FILES = [
  '67-kid-phonk.mp3',
  'dexter-meme.mp3',
  'fein-nokia.mp3',
  'la-vida-es-un-carrusel.mp3',
  'movie_1.mp3',
  'oh-my-god-bro-oh-hell-nah-man.mp3',
  'oh-no-no-no-no-laugh.mp3',
  'sad-meow-song.mp3',
  'slap-oh_LGvkhyt.mp3',
  'studio-audience-awwww-sound-fx.mp3',
] as const;

const EMOTE_ICONS = ['🔥', '☕', '📱', '🎠', '📽️', '😤', '😂', '😿', '👋', '👏'] as const;

/** Display label from filename: first segment before `-` / `_`, uppercased (numeric segments kept). */
export function labelFromSoundFilename(filename: string): string {
  const base = filename.replace(/\.mp3$/i, '').trim();
  if (!base) return '?';
  const first = base.split(/[-_]/)[0] ?? base;
  if (/^\d+$/.test(first)) return first;
  return first.toUpperCase();
}

/** Stable socket id: lowercase slug with underscores. */
export function emoteIdFromFilename(filename: string): string {
  const base = filename.replace(/\.mp3$/i, '');
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug || 'emote';
}

export const GAME_EMOTES = EMOTE_FILES.map((file, i) => ({
  id: emoteIdFromFilename(file),
  file,
  label: labelFromSoundFilename(file),
  icon: EMOTE_ICONS[i % EMOTE_ICONS.length],
}));

export type GameEmoteId = (typeof GAME_EMOTES)[number]['id'];

const ID_SET = new Set<string>(GAME_EMOTES.map((e) => e.id));

export function isValidGameEmoteId(id: string): id is GameEmoteId {
  return ID_SET.has(id);
}

export const GAME_EMOTE_COOLDOWN_MS = 8000;
