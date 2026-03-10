/**
 * Deck management
 * Creates, shuffles, and deals cards from a 40-card Chkobba deck
 */
import * as rules from '../../shared/rules.js';
/**
 * Create a new 40-card Chkobba deck
 * @returns {Card[]} Array of card objects
 */
export function createDeck() {
    const deck = [];
    for (const suit of Object.values(rules.SUITS)) {
        for (const rank of rules.RANKS) {
            deck.push({
                suit,
                rank,
                value: rules.getCardValue(rank)
            });
        }
    }
    return deck;
}
/**
 * Shuffle a deck using Fisher-Yates algorithm
 * @param {Card[]} deck - The deck to shuffle
 * @returns {Card[]} The shuffled deck
 */
export function shuffle(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * Deal cards from the deck
 * @param {Card[]} deck - The deck (will be mutated)
 * @param {number} count - Number of cards to deal
 * @returns {Card[]} Array of dealt cards
 */
export function deal(deck, count) {
    const dealt = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
        const card = deck.pop();
        if (card)
            dealt.push(card);
    }
    return dealt;
}
/**
 * Check if the initial table cards are valid
 * (no 3 or 4 cards of the same rank)
 * @param {Card[]} tableCards - Cards on the table
 * @returns {boolean} True if valid
 */
export function isValidTableSetup(tableCards) {
    if (tableCards.length !== rules.INITIAL_TABLE_CARDS) {
        return false;
    }
    // Count cards by rank
    const rankCounts = {};
    for (const card of tableCards) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    }
    // Check if any rank has 3 or 4 cards
    for (const count of Object.values(rankCounts)) {
        if (count >= 3) {
            return false;
        }
    }
    return true;
}
/**
 * Create and shuffle a new deck, then deal initial table cards
 * Ensures valid table setup (no 3-4 of same rank)
 * @returns {Object} { deck: remaining deck, tableCards: cards on table }
 */
export function setupGame() {
    let deck = [];
    let tableCards = [];
    // Keep trying until we get a valid table setup
    do {
        deck = shuffle(createDeck());
        tableCards = deal(deck, rules.INITIAL_TABLE_CARDS);
    } while (!isValidTableSetup(tableCards));
    return { deck, tableCards };
}
export default {
    createDeck,
    shuffle,
    deal,
    isValidTableSetup,
    setupGame
};
