/**
 * Scoring logic for Chkobba
 * Calculates points for each scoring category
 */
import * as rules from '../../shared/rules.js';
/**
 * Count cards by suit
 * @param {Card[]} capturedCards - All captured cards
 * @returns {Record<string, number>} Count per suit
 */
export function countBySuit(capturedCards) {
    const counts = {
        [rules.SUITS.HEARTS]: 0,
        [rules.SUITS.DIAMONDS]: 0,
        [rules.SUITS.CLUBS]: 0,
        [rules.SUITS.SPADES]: 0
    };
    for (const card of capturedCards) {
        counts[card.suit]++;
    }
    return counts;
}
/**
 * Count specific ranks in captured cards
 * @param {Card[]} capturedCards - All captured cards
 * @param {string} rank - Rank to count
 * @returns {number} Count of cards with that rank
 */
export function countRank(capturedCards, rank) {
    return capturedCards.filter(card => card.rank === rank).length;
}
/**
 * Calculate Carta points (most cards captured)
 * @param {Card[]} team0Cards - Team 0's captured cards
 * @param {Card[]} team1Cards - Team 1's captured cards
 * @returns {Object} { team0: points, team1: points }
 */
export function calculateCarta(team0Cards, team1Cards) {
    const team0Count = team0Cards.length;
    const team1Count = team1Cards.length;
    if (team0Count > team1Count) {
        return { team0: 1, team1: 0 };
    }
    else if (team1Count > team0Count) {
        return { team0: 0, team1: 1 };
    }
    return { team0: 0, team1: 0 }; // Tie
}
/**
 * Calculate Dinari points (most diamonds captured)
 * @param {Card[]} team0Cards - Team 0's captured cards
 * @param {Card[]} team1Cards - Team 1's captured cards
 * @returns {Object} { team0: points, team1: points }
 */
export function calculateDinari(team0Cards, team1Cards) {
    const team0Diamonds = countBySuit(team0Cards)[rules.SUITS.DIAMONDS];
    const team1Diamonds = countBySuit(team1Cards)[rules.SUITS.DIAMONDS];
    if (team0Diamonds > team1Diamonds) {
        return { team0: 1, team1: 0 };
    }
    else if (team1Diamonds > team0Diamonds) {
        return { team0: 0, team1: 1 };
    }
    return { team0: 0, team1: 0 }; // Tie
}
/**
 * Calculate Bermila points (most 7s, tiebreak: most 6s)
 * @param {Card[]} team0Cards - Team 0's captured cards
 * @param {Card[]} team1Cards - Team 1's captured cards
 * @returns {Object} { team0: points, team1: points }
 */
export function calculateBermila(team0Cards, team1Cards) {
    const team0Sevens = countRank(team0Cards, '7');
    const team1Sevens = countRank(team1Cards, '7');
    if (team0Sevens > team1Sevens) {
        return { team0: 1, team1: 0 };
    }
    else if (team1Sevens > team0Sevens) {
        return { team0: 0, team1: 1 };
    }
    // Tie on 7s, check 6s
    const team0Sixes = countRank(team0Cards, '6');
    const team1Sixes = countRank(team1Cards, '6');
    if (team0Sixes > team1Sixes) {
        return { team0: 1, team1: 0 };
    }
    else if (team1Sixes > team0Sixes) {
        return { team0: 0, team1: 1 };
    }
    return { team0: 0, team1: 0 }; // Tie
}
/**
 * Calculate Sabaa el Haya points (7 of diamonds)
 * @param {Card[]} team0Cards - Team 0's captured cards
 * @param {Card[]} team1Cards - Team 1's captured cards
 * @returns {Object} { team0: points, team1: points }
 */
export function calculateSabaaElHaya(team0Cards, team1Cards) {
    const team0HasSevenDiamonds = team0Cards.some(card => card.rank === '7' && card.suit === rules.SUITS.DIAMONDS);
    const team1HasSevenDiamonds = team1Cards.some(card => card.rank === '7' && card.suit === rules.SUITS.DIAMONDS);
    if (team0HasSevenDiamonds) {
        return { team0: 1, team1: 0 };
    }
    else if (team1HasSevenDiamonds) {
        return { team0: 0, team1: 1 };
    }
    return { team0: 0, team1: 0 };
}
/**
 * Calculate Chkobba points
 * @param {number} team0Chkobba - Team 0's sweep count
 * @param {number} team1Chkobba - Team 1's sweep count
 * @returns {Object} { team0: points, team1: points }
 */
export function calculateChkobba(team0Chkobba, team1Chkobba) {
    return {
        team0: team0Chkobba,
        team1: team1Chkobba
    };
}
/**
 * Calculate all round scores
 * @param {RoundData} roundData - Round data
 * @returns {ChkobbaRoundResult} Complete score breakdown
 */
export function calculateRoundScores({ team0Captured, team1Captured, team0Chkobba = 0, team1Chkobba = 0 }) {
    const carta = calculateCarta(team0Captured, team1Captured);
    const dinari = calculateDinari(team0Captured, team1Captured);
    const bermila = calculateBermila(team0Captured, team1Captured);
    const sabaaElHaya = calculateSabaaElHaya(team0Captured, team1Captured);
    const chkobba = calculateChkobba(team0Chkobba, team1Chkobba);
    const team0Total = carta.team0 + dinari.team0 + bermila.team0 + sabaaElHaya.team0 + chkobba.team0;
    const team1Total = carta.team1 + dinari.team1 + bermila.team1 + sabaaElHaya.team1 + chkobba.team1;
    return {
        breakdown: {
            carta,
            dinari,
            bermila,
            sabaaElHaya,
            chkobba
        },
        totals: {
            team0: team0Total,
            team1: team1Total
        }
    };
}
export default {
    calculateCarta,
    calculateDinari,
    calculateBermila,
    calculateSabaaElHaya,
    calculateChkobba,
    calculateRoundScores,
    countBySuit,
    countRank
};
