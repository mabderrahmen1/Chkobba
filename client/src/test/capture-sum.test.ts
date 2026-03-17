import { describe, it, expect } from 'vitest';

// Pure logic extracted from PlayerHand.tsx for testing capture sum calculations.
// This mirrors the exact logic used in the component.

interface Card {
  rank: string;
  suit: string;
  value: number;
}

function computeCaptureState(
  hand: Card[],
  tableCards: Card[],
  selectedCardIndex: number | null,
  selectedTableIndices: number[],
) {
  const selectedHandCard = selectedCardIndex !== null ? hand[selectedCardIndex] : null;

  // Defensive bounds filtering (matches the component's implementation)
  const validIndices = selectedTableIndices.filter(
    (i) => i >= 0 && i < tableCards.length,
  );
  const selectedTableCards = validIndices.map((i) => tableCards[i]);

  const tableSum = selectedTableCards.reduce((acc, c) => acc + c.value, 0);
  const handCardValue = selectedHandCard?.value ?? 0;
  const isValidCapture = validIndices.length > 0 && tableSum === handCardValue;
  const isDrop = selectedCardIndex !== null && validIndices.length === 0;

  return { tableSum, handCardValue, isValidCapture, isDrop, selectedTableCards };
}

const makeCard = (rank: string, suit: string, value: number): Card => ({
  rank,
  suit,
  value,
});

describe('Capture sum calculation', () => {
  const hand = [
    makeCard('7', 'diamonds', 7),
    makeCard('K', 'spades', 10),
    makeCard('3', 'hearts', 3),
  ];

  const tableCards = [
    makeCard('3', 'clubs', 3),
    makeCard('4', 'diamonds', 4),
    makeCard('A', 'hearts', 1),
    makeCard('6', 'spades', 6),
  ];

  it('detects valid single capture (7 = 3 + 4)', () => {
    const result = computeCaptureState(hand, tableCards, 0, [0, 1]);
    expect(result.handCardValue).toBe(7);
    expect(result.tableSum).toBe(7);
    expect(result.isValidCapture).toBe(true);
    expect(result.isDrop).toBe(false);
  });

  it('detects invalid capture (7 != 3 + 1)', () => {
    const result = computeCaptureState(hand, tableCards, 0, [0, 2]);
    expect(result.handCardValue).toBe(7);
    expect(result.tableSum).toBe(4);
    expect(result.isValidCapture).toBe(false);
    expect(result.isDrop).toBe(false);
  });

  it('detects drop (no table cards selected)', () => {
    const result = computeCaptureState(hand, tableCards, 0, []);
    expect(result.isDrop).toBe(true);
    expect(result.isValidCapture).toBe(false);
  });

  it('handles no hand card selected', () => {
    const result = computeCaptureState(hand, tableCards, null, []);
    expect(result.handCardValue).toBe(0);
    expect(result.isDrop).toBe(false);
    expect(result.isValidCapture).toBe(false);
  });

  it('valid capture with king (10 = 4 + 6)', () => {
    const result = computeCaptureState(hand, tableCards, 1, [1, 3]);
    expect(result.handCardValue).toBe(10);
    expect(result.tableSum).toBe(10);
    expect(result.isValidCapture).toBe(true);
  });

  it('valid capture single match (3 = 3)', () => {
    const result = computeCaptureState(hand, tableCards, 2, [0]);
    expect(result.handCardValue).toBe(3);
    expect(result.tableSum).toBe(3);
    expect(result.isValidCapture).toBe(true);
  });

  it('filters out-of-bounds table indices', () => {
    // Index 10 doesn't exist - should be filtered out, not crash
    const result = computeCaptureState(hand, tableCards, 0, [0, 10]);
    expect(result.tableSum).toBe(3); // Only index 0 counted
    expect(result.selectedTableCards).toHaveLength(1);
    expect(result.isValidCapture).toBe(false);
  });

  it('filters negative indices', () => {
    const result = computeCaptureState(hand, tableCards, 0, [-1, 0]);
    expect(result.tableSum).toBe(3);
    expect(result.selectedTableCards).toHaveLength(1);
  });

  it('handles empty table', () => {
    const result = computeCaptureState(hand, [], 0, []);
    expect(result.isDrop).toBe(true);
    expect(result.isValidCapture).toBe(false);
  });

  it('handles all table cards selected for valid chkobba', () => {
    // 7 + 3 = 10 = K
    const smallTable = [makeCard('7', 'clubs', 7), makeCard('3', 'clubs', 3)];
    const result = computeCaptureState(hand, smallTable, 1, [0, 1]);
    expect(result.handCardValue).toBe(10);
    expect(result.tableSum).toBe(10);
    expect(result.isValidCapture).toBe(true);
  });
});
