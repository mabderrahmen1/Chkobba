/**
 * Shared game rules and constants
 * Used by both client and server
 */

export const SUITS = {
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades'
} as const;

export type Suit = typeof SUITS[keyof typeof SUITS];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'] as const;
export const JOKER_RANK = 'Joker' as const;
export const RUMMY_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = typeof RANKS[number];
export type CardRank = Rank | typeof JOKER_RANK;
export type RummyRank = typeof RUMMY_RANKS[number] | typeof JOKER_RANK;

export const CARD_VALUES: Record<Rank, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  'J': 9,
  'Q': 8,
  'K': 10
};

export function getCardValue(rank: Rank): number {
  return CARD_VALUES[rank] || 0;
}

export const DECK_SIZE = 40;
export const CARDS_PER_SUIT = 10;

export const INITIAL_HAND_SIZE = 3;
export const INITIAL_TABLE_CARDS = 4;

export const SCORING = {
  CARTA: 'carta',
  DINARI: 'dinari',
  BERMILA: 'bermila',
  SABAA_EL_HAYA: 'sabaa_el_haya',
  CHKOBBA: 'chkobba'
} as const;

export const DEFAULT_TARGET_SCORE = 21;

export const GAME_STATUS = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished'
} as const;

export type GameStatus = typeof GAME_STATUS[keyof typeof GAME_STATUS];

export const GAME_TYPE = {
  CHKOBBA: 'chkobba',
  RUMMY: 'rummy'
} as const;

export type GameType = typeof GAME_TYPE[keyof typeof GAME_TYPE];

// Rummy-specific constants
export const RUMMY_INITIAL_HAND_SIZE = 13;
export const RUMMY_MIN_SEQUENCE_LENGTH = 3;
export const RUMMY_MIN_SET_SIZE = 3;
export const RUMMY_MAX_PLAYERS_SINGLE_DECK = 6;
export const RUMMY_MAX_PLAYERS_TWO_DECKS = 8;
export const RUMMY_MAX_PLAYERS_THREE_DECKS = 12;

export function getDeckCountForPlayers(playerCount: number): number {
  if (playerCount <= RUMMY_MAX_PLAYERS_SINGLE_DECK) return 1;
  if (playerCount <= RUMMY_MAX_PLAYERS_TWO_DECKS) return 2;
  return 3;
}
