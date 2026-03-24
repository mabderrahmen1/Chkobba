export {
  GAME_EMOTES as EMOTE_LIST,
  type GameEmoteId as EmoteId,
  isValidGameEmoteId as isValidEmoteId,
  GAME_EMOTE_COOLDOWN_MS as EMOTE_COOLDOWN_MS,
} from '@shared/emotes';

import { GAME_EMOTES, type GameEmoteId, isValidGameEmoteId } from '@shared/emotes';

export function getEmoteById(id: string) {
  return GAME_EMOTES.find((e) => e.id === id);
}
