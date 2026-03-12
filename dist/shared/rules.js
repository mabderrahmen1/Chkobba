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
export const JOKER_RANK = 'Joker';
export const RUMMY_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
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
export const GAME_TYPE = {
    CHKOBBA: 'chkobba',
    RUMMY: 'rummy'
};
// Rummy-specific constants
export const RUMMY_INITIAL_HAND_SIZE = 13;
export const RUMMY_MIN_SEQUENCE_LENGTH = 3;
export const RUMMY_MIN_SET_SIZE = 3;
export const RUMMY_MAX_PLAYERS_SINGLE_DECK = 6;
export const RUMMY_MAX_PLAYERS_TWO_DECKS = 8;
export const RUMMY_MAX_PLAYERS_THREE_DECKS = 12;
export function getDeckCountForPlayers(playerCount) {
    if (playerCount <= RUMMY_MAX_PLAYERS_SINGLE_DECK)
        return 1;
    if (playerCount <= RUMMY_MAX_PLAYERS_TWO_DECKS)
        return 2;
    return 3;
}
