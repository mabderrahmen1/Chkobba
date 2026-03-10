/**
 * Shared game rules and constants
 * Used by both client and server
 */
export const SUITS = {
    HEARTS: 'hearts',
    DIAMONDS: 'diamonds',
    CLUBS: 'clubs',
    SPADES: 'spades'
};
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
export const CARD_VALUES = {
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
export function getCardValue(rank) {
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
};
export const DEFAULT_TARGET_SCORE = 21;
export const GAME_STATUS = {
    LOBBY: 'lobby',
    PLAYING: 'playing',
    FINISHED: 'finished'
};
