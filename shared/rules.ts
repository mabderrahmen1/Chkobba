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
export type Rank = typeof RANKS[number];

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
