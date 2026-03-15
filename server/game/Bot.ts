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
