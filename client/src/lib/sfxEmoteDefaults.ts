import { GAME_EMOTES, isValidGameEmoteId } from '@shared/emotes';

/** Default fanfare: 🎠 LA (`la-vida-es-un-carrusel`) */
export const DEFAULT_CHKOBBA_SFX_EMOTE_ID = GAME_EMOTES[3].id;

/** Default fanfare: 😂 OH (`oh-no-no-no-no-laugh`) */
export const DEFAULT_HAYYA_SFX_EMOTE_ID = GAME_EMOTES[6].id;

export function normalizeChkobbaSfxEmoteId(id: string | null | undefined): string {
  if (id && isValidGameEmoteId(id)) return id;
  return DEFAULT_CHKOBBA_SFX_EMOTE_ID;
}

export function normalizeHayyaSfxEmoteId(id: string | null | undefined): string {
  if (id && isValidGameEmoteId(id)) return id;
  return DEFAULT_HAYYA_SFX_EMOTE_ID;
}
