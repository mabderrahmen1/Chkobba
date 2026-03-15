/**
 * Bot player logic for Chkobba
 * Smart strategy: capture-focused, no card counting or opponent prediction
 */

import { Card } from '../../shared/types.js';
import Game from './Game.js';

export const BOT_NAMES = [
  'Farès', 'Aymen', 'Slim', 'Skander', 'Bilel',
  'Hamza', 'Yassine', 'Malek', 'Rami', 'Nidhal',
  'Marwa', 'Jihen', 'Yasmine', 'Amani', 'Rania'
];

export function getRandomBotName(existingNames: string[]): string {
  const available = BOT_NAMES.filter(n => !existingNames.includes(n));
  const pool = available.length > 0 ? available : BOT_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface BotMove {
  cardIndex: number;
  tableIndices: number[];
}

/**
 * Find all combinations of table card indices that sum to target value
 */
export function findCombinations(tableCards: Card[], target: number): number[][] {
  const result: number[][] = [];

  function search(startIdx: number, remaining: number, current: number[]) {
    if (remaining === 0 && current.length > 0) {
      result.push([...current]);
      return;
    }
    for (let i = startIdx; i < tableCards.length; i++) {
      if (tableCards[i].value <= remaining) {
        current.push(i);
        search(i + 1, remaining - tableCards[i].value, current);
        current.pop();
      }
    }
  }

  search(0, target, []);
  return result;
}

/**
 * Calculate the best move for a bot
 *
 * Strategy (in priority order):
 * 1. Capture the 7 of diamonds (Hayya) if possible
 * 2. Make a Chkobba (clear the table) if possible
 * 3. Best capture: prefer more cards; tiebreak by highest total value
 * 4. If no capture: discard the lowest-value card that won't hand the
 *    opponent a single-match capture. If every card would do so, just
 *    discard the lowest-value card overall.
 */
export function getBotMove(game: Game, botPlayerId: string): BotMove {
  const player = game.getPlayer(botPlayerId);
  if (!player) throw new Error('Bot player not found');

  const hand = player.hand;
  const table = game.tableCards;

  type Capture = {
    cardIndex: number;
    tableIndices: number[];
    cardCount: number;   // how many table cards captured
    totalValue: number;  // sum of all captured card values (incl. played card)
    isChkobba: boolean;
    isHayya: boolean;
  };

  const captures: Capture[] = [];

  for (let cardIdx = 0; cardIdx < hand.length; cardIdx++) {
    const card = hand[cardIdx];

    // Single-card match
    const singleMatchIdx = table.findIndex(c => c.value === card.value);
    if (singleMatchIdx !== -1) {
      const capturedCards = [table[singleMatchIdx]];
      captures.push({
        cardIndex: cardIdx,
        tableIndices: [singleMatchIdx],
        cardCount: 1,
        totalValue: capturedCards.reduce((s, c) => s + c.value, 0) + card.value,
        isChkobba: table.length === 1,
        isHayya:
          (card.rank === '7' && card.suit === 'diamonds') ||
          capturedCards.some(c => c.rank === '7' && c.suit === 'diamonds'),
      });
      // Rule: If there’s an exact single-card match, it takes priority.
      // Do not consider combinations for this card if a single match exists.
      continue;
    }

    // Combination captures (only if no single match exists for this card)
    const combos = findCombinations(table, card.value);
    for (const combo of combos) {
      // Skip single-element combos — already added as the single-match entry above
      if (combo.length === 1) continue;
      const capturedCards = combo.map(i => table[i]);
      captures.push({
        cardIndex: cardIdx,
        tableIndices: combo,
        cardCount: combo.length,
        totalValue: capturedCards.reduce((s, c) => s + c.value, 0) + card.value,
        isChkobba: combo.length === table.length,
        isHayya:
          (card.rank === '7' && card.suit === 'diamonds') ||
          capturedCards.some(c => c.rank === '7' && c.suit === 'diamonds'),
      });
    }
  }

  if (captures.length > 0) {
    // Priority 1: capture the 7 of diamonds
    const hayyaCapture = captures.find(c => c.isHayya);
    if (hayyaCapture) {
      return { cardIndex: hayyaCapture.cardIndex, tableIndices: hayyaCapture.tableIndices };
    }

    // Priority 2: Chkobba (clear table)
    const chkobbaCapture = captures.find(c => c.isChkobba);
    if (chkobbaCapture) {
      return { cardIndex: chkobbaCapture.cardIndex, tableIndices: chkobbaCapture.tableIndices };
    }

    // Priority 3: most table cards captured; tiebreak by highest total value
    captures.sort((a, b) =>
      b.cardCount !== a.cardCount
        ? b.cardCount - a.cardCount
        : b.totalValue - a.totalValue
    );
    return { cardIndex: captures[0].cardIndex, tableIndices: captures[0].tableIndices };
  }

  // No captures available → discard a card
  // Prefer to discard a card whose value does NOT appear on the table
  // (to avoid gifting the opponent a free single-match capture).
  // Among safe discards, choose the lowest-value card.
  let bestIdx = -1;
  let lowestSafe = Infinity;

  for (let i = 0; i < hand.length; i++) {
    const givesCapture = table.some(c => c.value === hand[i].value);
    if (!givesCapture && hand[i].value < lowestSafe) {
      lowestSafe = hand[i].value;
      bestIdx = i;
    }
  }

  // If every card would gift a capture, fall back to overall lowest value
  if (bestIdx === -1) {
    bestIdx = hand.reduce(
      (minIdx, c, i) => (c.value < hand[minIdx].value ? i : minIdx),
      0
    );
  }

  return { cardIndex: bestIdx, tableIndices: [] };
}

/**
 * Basic AI for Rummy
 */

// Helper to get numeric value for ranking logic (A is 1, K is 13)
function getRankValue(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank) || 0;
}

// Detect if a set of cards contains a valid sequence of length >= minLength
function findSequences(hand: Card[], minLength: number = 3): number[][] {
  const sequences: number[][] = [];
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  
  for (const suit of suits) {
    // Get cards of this suit with their original indices
    const suitCards = hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(item => item.card.suit === suit)
      .sort((a, b) => getRankValue(a.card.rank) - getRankValue(b.card.rank));

    if (suitCards.length < minLength) continue;

    let currentSeq = [suitCards[0].index];
    for (let i = 1; i < suitCards.length; i++) {
      const prevVal = getRankValue(suitCards[i - 1].card.rank);
      const currVal = getRankValue(suitCards[i].card.rank);

      if (currVal === prevVal + 1) {
        currentSeq.push(suitCards[i].index);
      } else if (currVal !== prevVal) {
        if (currentSeq.length >= minLength) {
          sequences.push([...currentSeq]);
        }
        currentSeq = [suitCards[i].index];
      }
    }
    if (currentSeq.length >= minLength) {
      sequences.push([...currentSeq]);
    }
  }

  return sequences;
}

// Detect if a set of cards contains a valid set (3 or 4 cards of same rank, different suits)
function findSets(hand: Card[]): number[][] {
  const sets: number[][] = [];
  const rankGroups: Record<string, number[]> = {};

  hand.forEach((c, i) => {
    if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
    // Only add if suit isn't already in this rank group (no duplicate suits)
    const hasSuit = rankGroups[c.rank].some(idx => hand[idx].suit === c.suit);
    if (!hasSuit) {
      rankGroups[c.rank].push(i);
    }
  });

  for (const rank in rankGroups) {
    if (rankGroups[rank].length >= 3) {
      sets.push([...rankGroups[rank]]);
    }
  }

  return sets;
}

// Check if adding the top discard card would immediately create a new meld
function doesDiscardHelp(hand: Card[], topDiscard: Card): boolean {
  const hypotheticalHand = [...hand, topDiscard];
  
  // Check sequences
  const seqsBefore = findSequences(hand).length;
  const seqsAfter = findSequences(hypotheticalHand).length;
  if (seqsAfter > seqsBefore) return true;

  // Check sets
  const setsBefore = findSets(hand).length;
  const setsAfter = findSets(hypotheticalHand).length;
  if (setsAfter > setsBefore) return true;

  return false;
}

// Calculate how "isolated" a card is (higher score = more isolated = better to discard)
function calculateIsolationScore(card: Card, hand: Card[]): number {
  let score = 0;
  const val = getRankValue(card.rank);
  
  // High cards are penalized if not part of anything
  score += val; 

  // Check for same rank neighbors (potential sets)
  const sameRankCount = hand.filter(c => c.rank === card.rank && c !== card).length;
  if (sameRankCount === 0) score += 20; // Highly isolated rank-wise
  else if (sameRankCount === 1) score -= 10; // Might form a set soon

  // Check for sequence neighbors (same suit, adjacent value)
  const seqNeighbors = hand.filter(c => c.suit === card.suit && Math.abs(getRankValue(c.rank) - val) <= 2 && c !== card).length;
  if (seqNeighbors === 0) score += 20; // Highly isolated suit-wise
  else if (seqNeighbors > 0) score -= (seqNeighbors * 10); // Close to forming a sequence

  return score;
}

export function executeRummyBotTurn(game: any, botPlayerId: string): void {
  const player = game.getPlayer(botPlayerId);
  if (!player || game.currentTurn !== botPlayerId || game.winner) return;

  // 1. Draw phase
  if (!game.hasDrawn) {
    const topDiscard = game.discardPile[game.discardPile.length - 1];
    let takeDiscard = false;
    
    if (topDiscard && doesDiscardHelp(player.hand, topDiscard)) {
      takeDiscard = true;
    }

    if (takeDiscard && game.discardPile.length > 0) {
      game.drawFromDiscard(botPlayerId);
    } else {
      game.drawCard(botPlayerId);
    }
  }

  // 2. Meld phase
  let madeMeld = true;
  while (madeMeld && !game.winner) {
    madeMeld = false;
    
    // Priority 1: Sequences
    const seqs = findSequences(player.hand);
    if (seqs.length > 0) {
      const indices = seqs[0]; // Take first available sequence
      const result = game.createMeld(botPlayerId, indices, 'sequence');
      if (result.success) {
        madeMeld = true;
        continue;
      }
    }

    // Priority 2: Sets
    const sets = findSets(player.hand);
    if (sets.length > 0) {
      const indices = sets[0]; // Take first available set
      const result = game.createMeld(botPlayerId, indices, 'set');
      if (result.success) {
        madeMeld = true;
        continue;
      }
    }
  }

  // 3. Discard phase
  if (!game.winner && player.hand.length > 0) {
    let discardIdx = 0;
    let highestIsolationScore = -Infinity;
    
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      const score = calculateIsolationScore(card, player.hand);
      
      if (score > highestIsolationScore) {
        highestIsolationScore = score;
        discardIdx = i;
      }
    }
    
    game.discardCard(botPlayerId, discardIdx);
  }
}
