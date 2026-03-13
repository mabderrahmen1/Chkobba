/**
 * Rummy game logic
 * Handles all Rummy game mechanics: drawing, discarding, melding
 */

import { Card, RummyPlayer, RummyGameState, Meld, Winner, Player } from '../../shared/types.js';
import { RUMMY_INITIAL_HAND_SIZE, getDeckCountForPlayers, SUITS, RUMMY_RANKS, JOKER_RANK } from '../../shared/rules.js';

interface GamePlayer extends RummyPlayer {
  hand: Card[];
  melds: Meld[];
  team: number;
  wins?: number;
  losses?: number;
}

/**
 * Create a Rummy deck with specified number of decks (including jokers)
 * Uses standard 52-card deck + 2 jokers per deck
 * @param deckCount - Number of decks to use
 * @returns Array of cards
 */
export function createRummyDeck(deckCount: number): Card[] {
  const deck: Card[] = [];

  for (let d = 0; d < deckCount; d++) {
    // Standard 52 cards per deck
    for (const suit of Object.values(SUITS)) {
      for (const rank of RUMMY_RANKS) {
        deck.push({
          suit,
          rank,
          value: getRummyCardValue(rank),
          isJoker: false
        });
      }
    }
    // Add 2 jokers per deck
    deck.push({ suit: 'hearts', rank: JOKER_RANK, value: 0, isJoker: true });
    deck.push({ suit: 'diamonds', rank: JOKER_RANK, value: 0, isJoker: true });
  }

  return deck;
}

/**
 * Get card value for scoring
 */
function getRummyCardValue(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  if (rank === 'Joker') return 0;
  const num = parseInt(rank);
  return isNaN(num) ? 0 : num;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if cards form a valid set (3-4 cards of same rank)
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  
  const nonJokerCards = cards.filter(c => !c.isJoker);
  if (nonJokerCards.length === 0) return false; // Can't have all jokers
  
  const firstRank = nonJokerCards[0].rank;
  return nonJokerCards.every(c => c.rank === firstRank);
}

/**
 * Check if cards form a valid sequence (3+ consecutive cards of same suit)
 */
export function isValidSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  const nonJokerCards = cards.filter(c => !c.isJoker);
  const jokerCount = cards.length - nonJokerCards.length;
  if (nonJokerCards.length === 0) return false;

  // All non-joker cards must be same suit
  const firstSuit = nonJokerCards[0].suit;
  if (!nonJokerCards.every(c => c.suit === firstSuit)) return false;

  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const nonJokerRankIndices = nonJokerCards
    .map(c => rankOrder.indexOf(c.rank))
    .sort((a, b) => a - b);

  // Duplicate ranks are not valid in a sequence
  for (let i = 1; i < nonJokerRankIndices.length; i++) {
    if (nonJokerRankIndices[i] === nonJokerRankIndices[i - 1]) return false;
  }

  // Count how many jokers are needed to fill gaps between non-joker cards
  let jokersNeeded = 0;
  for (let i = 1; i < nonJokerRankIndices.length; i++) {
    const gap = nonJokerRankIndices[i] - nonJokerRankIndices[i - 1];
    jokersNeeded += gap - 1; // gap of 1 = consecutive, gap of 2 = 1 joker needed
  }

  return jokersNeeded <= jokerCount;
}

/**
 * Check if a meld is pure (no jokers)
 */
export function isPureMeld(cards: Card[]): boolean {
  return !cards.some(c => c.isJoker);
}

/**
 * Calculate penalty points for unmelded cards
 */
export function calculatePenaltyPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getRummyCardValue(card.rank), 0);
}

/**
 * Check if player has a pure sequence in their melds
 */
export function hasPureSequence(melds: Meld[]): boolean {
  return melds.some(m => m.type === 'sequence' && m.isPure);
}

/**
 * Rummy Game class
 */
export class RummyGame {
  roomId: string;
  players: GamePlayer[];
  drawPile: Card[] = [];
  discardPile: Card[] = [];
  currentTurn: string = '';
  turnOrder: string[] = [];
  tableMelds: Meld[] = [];
  winner: Winner | null = null;
  deckCount: number = 1;
  lastDrawSource: 'draw' | 'discard' | null = null;
  hasDrawn: boolean = false;
  canLayOff: boolean = true;

  constructor(roomId: string, players: Player[], deckCount: number) {
    this.roomId = roomId;
    this.players = players.map(p => ({
      ...p,
      hand: [],
      melds: [],
      points: 0,
      penaltyPoints: 0
    }));
    this.deckCount = deckCount;
  }

  getPlayer(playerId: string): GamePlayer | null {
    return this.players.find(p => p.id === playerId) || null;
  }

  getNextPlayerId(): string {
    const currentIndex = this.turnOrder.indexOf(this.currentTurn);
    const nextIndex = (currentIndex + 1) % this.turnOrder.length;
    return this.turnOrder[nextIndex];
  }

  /**
   * Start a new Rummy game
   */
  start(): RummyGameState {
    // Setup deck based on player count
    const deck = shuffleDeck(createRummyDeck(this.deckCount));
    
    // Deal 13 cards to each player
    for (const player of this.players) {
      player.hand = deck.splice(0, RUMMY_INITIAL_HAND_SIZE);
      player.melds = [];
      player.points = 0;
      player.penaltyPoints = 0;
    }

    // Set up draw and discard piles
    this.drawPile = deck;
    this.discardPile = [deck.pop()!];

    // Set turn order (rotate dealer each round)
    this.turnOrder = this.players.map(p => p.id);
    this.currentTurn = this.turnOrder[0];
    this.hasDrawn = false;
    this.lastDrawSource = null;

    console.log(`[RummyGame ${this.roomId}] Game started with ${this.players.length} players, ${this.deckCount} deck(s)`);
    
    return this.getState();
  }

  /**
   * Draw a card from draw pile
   */
  drawCard(playerId: string): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.currentTurn !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.hasDrawn) {
      return { success: false, error: 'You have already drawn a card' };
    }

    if (this.drawPile.length === 0) {
      // Reshuffle discard pile (except top card)
      if (this.discardPile.length > 1) {
        const topDiscard = this.discardPile.pop()!;
        this.drawPile = shuffleDeck(this.discardPile);
        this.discardPile = [topDiscard];
        console.log(`[RummyGame ${this.roomId}] Reshuffled discard pile`);
      } else {
        return { success: false, error: 'No cards left to draw' };
      }
    }

    const card = this.drawPile.pop()!;
    player.hand.push(card);
    this.hasDrawn = true;
    this.lastDrawSource = 'draw';

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} drew from draw pile`);
    
    return { success: true };
  }

  /**
   * Draw a card from discard pile
   */
  drawFromDiscard(playerId: string): { success: boolean; card?: Card; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.currentTurn !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.hasDrawn) {
      return { success: false, error: 'You have already drawn a card' };
    }

    if (this.discardPile.length === 0) {
      return { success: false, error: 'Discard pile is empty' };
    }

    const card = this.discardPile.pop()!;
    player.hand.push(card);
    this.hasDrawn = true;
    this.lastDrawSource = 'discard';

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} drew ${card.rank} of ${card.suit} from discard`);
    
    return { success: true, card };
  }

  /**
   * Discard a card
   */
  discardCard(playerId: string, cardIndex: number): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.currentTurn !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (!this.hasDrawn) {
      return { success: false, error: 'You must draw a card first' };
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { success: false, error: 'Invalid card index' };
    }

    const card = player.hand.splice(cardIndex, 1)[0];
    this.discardPile.push(card);

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} discarded ${card.rank} of ${card.suit}`);

    // Check if player went out (all cards melded)
    if (player.hand.length === 0 && player.melds.length > 0) {
      this.endGame(playerId);
    } else {
      // Move to next player
      this.currentTurn = this.getNextPlayerId();
      this.hasDrawn = false;
      this.lastDrawSource = null;
    }

    return { success: true };
  }

  /**
   * Create a meld (set or sequence)
   */
  createMeld(playerId: string, cardIndices: number[], type: 'set' | 'sequence'): { success: boolean; meld?: Meld; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.currentTurn !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (!this.hasDrawn) {
      return { success: false, error: 'You must draw a card first' };
    }

    if (cardIndices.length < 3) {
      return { success: false, error: 'Meld requires at least 3 cards' };
    }

    // Validate indices
    for (const idx of cardIndices) {
      if (idx < 0 || idx >= player.hand.length) {
        return { success: false, error: 'Invalid card index' };
      }
    }

    const cards = cardIndices.map(i => player.hand[i]);

    // Validate meld type
    if (type === 'set' && !isValidSet(cards)) {
      return { success: false, error: 'Invalid set: must be 3-4 cards of same rank' };
    }
    if (type === 'sequence' && !isValidSequence(cards)) {
      return { success: false, error: 'Invalid sequence: must be 3+ consecutive cards of same suit' };
    }

    // Remove cards from hand
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      player.hand.splice(idx, 1);
    }

    // Create meld
    const meld: Meld = {
      id: `meld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      cards,
      playerId,
      isPure: isPureMeld(cards)
    };

    player.melds.push(meld);

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} created ${type} meld`);

    return { success: true, meld };
  }

  /**
   * Lay off a card on an existing meld (any player's meld)
   */
  layOffCard(playerId: string, meldId: string, cardIndex: number): { success: boolean; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, error: 'Player not found' };
    if (this.currentTurn !== playerId) return { success: false, error: 'Not your turn' };
    if (!this.hasDrawn) return { success: false, error: 'You must draw a card first' };
    if (cardIndex < 0 || cardIndex >= player.hand.length) return { success: false, error: 'Invalid card index' };

    // Search across all players' melds
    let meld: Meld | undefined;
    for (const p of this.players) {
      meld = p.melds.find(m => m.id === meldId);
      if (meld) break;
    }
    if (!meld) return { success: false, error: 'Meld not found' };

    const card = player.hand[cardIndex];

    if (meld.type === 'set') {
      if (meld.cards.length >= 4) return { success: false, error: 'Set already has maximum cards' };
      const nonJokerCards = meld.cards.filter(c => !c.isJoker);
      if (!card.isJoker && nonJokerCards.length > 0 && card.rank !== nonJokerCards[0].rank) {
        return { success: false, error: 'Card does not match set rank' };
      }
    } else if (meld.type === 'sequence') {
      if (!isValidSequence([...meld.cards, card])) {
        return { success: false, error: 'Card cannot extend this sequence' };
      }
    }

    player.hand.splice(cardIndex, 1);
    meld.cards.push(card);
    meld.isPure = isPureMeld(meld.cards);

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} laid off card on meld`);
    return { success: true };
  }

  /**
   * End the game when a player goes out
   */
  endGame(winnerId: string): void {
    const winner = this.getPlayer(winnerId);
    if (!winner) return;

    // Calculate penalty points for all players
    for (const player of this.players) {
      player.penaltyPoints = calculatePenaltyPoints(player.hand);
    }

    this.winner = {
      team: winner.team,
      players: [winner.nickname],
      reason: 'went_out'
    };

    console.log(`[RummyGame ${this.roomId}] ${winner.nickname} went out and won!`);
  }

  /**
   * Create a dummy face-down card (used to hide hand contents from opponents)
   */
  private makeFaceDown(): Card {
    return { rank: 'A', suit: 'hearts', value: 1, isJoker: false };
  }

  /**
   * Get full state for a specific player (their hand visible, others hidden)
   */
  getFullState(playerId: string): RummyGameState {
    const player = this.getPlayer(playerId);
    // Draw pile: send dummy cards so client knows the count but not the cards
    const hiddenDrawPile = this.drawPile.map(() => this.makeFaceDown());

    return {
      roomId: this.roomId,
      currentTurn: this.currentTurn,
      drawPile: hiddenDrawPile,
      discardPile: this.discardPile,
      players: this.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        isHost: p.isHost,
        isReady: p.isReady,
        isConnected: p.isConnected,
        hand: p.id === playerId
          ? (player?.hand ?? [])
          : p.hand.map(() => this.makeFaceDown()),
        melds: p.melds,
        points: p.points,
        penaltyPoints: p.penaltyPoints
      })),
      tableMelds: this.tableMelds,
      winner: this.winner,
      deckCount: this.deckCount,
      canLayOff: this.canLayOff,
      hasDrawn: this.hasDrawn
    };
  }

  /**
   * @deprecated Use getFullState(playerId) directly
   */
  getState(): RummyGameState {
    return this.getFullState('');
  }
}

export default RummyGame;
