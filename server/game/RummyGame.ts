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
 * Create a Rummy deck with specified number of decks
 * Uses standard 52-card deck (NO JOKERS for Tunisian Rummy)
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
  }

  return deck;
}

/**
 * Get card value for scoring
 */
function getRummyCardValue(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
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
 * Check if cards form a valid set (3-4 cards of same rank, NO duplicate suits)
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 3 || cards.length > 4) return false;
  
  const firstRank = cards[0].rank;
  if (!cards.every(c => c.rank === firstRank)) return false;

  // Check for duplicate suits
  const suits = new Set(cards.map(c => c.suit));
  if (suits.size !== cards.length) return false;

  return true;
}

/**
 * Check if cards form a valid sequence (3+ consecutive cards of same suit, A is low)
 */
export function isValidSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  // All cards must be same suit
  const firstSuit = cards[0].suit;
  if (!cards.every(c => c.suit === firstSuit)) return false;

  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const indices = cards
    .map(c => rankOrder.indexOf(c.rank))
    .sort((a, b) => a - b);

  // Must be consecutive
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) return false;
  }

  return true;
}

/**
 * Check if a meld is pure (no jokers) - Always true now since we have no jokers
 */
export function isPureMeld(cards: Card[]): boolean {
  return true;
}

/**
 * Calculate penalty points for unmelded cards
 */
export function calculatePenaltyPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getRummyCardValue(card.rank), 0);
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
  roundNumber: number = 0;
  roundJustEnded: boolean = false;
  lastRoundResult: any = null;
  continuePlayers: Set<string> = new Set();

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
    this.roundNumber = 0;
    this.startNewRound();
    console.log(`[RummyGame ${this.roomId}] Game started with ${this.players.length} players, ${this.deckCount} deck(s)`);
    return this.getState();
  }

  /**
   * Start a new round
   */
  startNewRound(): void {
    this.roundNumber++;
    this.roundJustEnded = false;
    this.lastRoundResult = null;
    this.continuePlayers.clear();
    this.tableMelds = [];
    this.hasDrawn = false;
    this.lastDrawSource = null;

    // Setup deck
    const deck = shuffleDeck(createRummyDeck(this.deckCount));
    
    // Deal 13 cards to each player
    for (const player of this.players) {
      player.hand = deck.splice(0, RUMMY_INITIAL_HAND_SIZE);
      player.melds = [];
      player.penaltyPoints = 0;
    }

    this.drawPile = deck;
    this.discardPile = [deck.pop()!];

    // Rotate turn order
    this.turnOrder = this.players.map(p => p.id);
    const firstPlayerIdx = (this.roundNumber - 1) % this.turnOrder.length;
    this.currentTurn = this.turnOrder[firstPlayerIdx];
  }

  /**
   * Mark a player as ready to continue
   */
  playerContinue(playerId: string, connectedPlayerIds: string[]): boolean {
    this.continuePlayers.add(playerId);
    return connectedPlayerIds.every(id => this.continuePlayers.has(id));
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
      this.endRound(playerId);
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
      isPure: true
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
      if (card.rank !== meld.cards[0].rank) {
        return { success: false, error: 'Card does not match set rank' };
      }
      // Tunisia Rummy: No duplicate suits in set
      if (meld.cards.some(c => c.suit === card.suit)) {
        return { success: false, error: 'Duplicate suit in set' };
      }
    } else if (meld.type === 'sequence') {
      if (!isValidSequence([...meld.cards, card])) {
        // Try sorted
        const sortedCards = [...meld.cards, card].sort((a, b) => {
          const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
          return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        });
        if (!isValidSequence(sortedCards)) {
          return { success: false, error: 'Card cannot extend this sequence' };
        }
        // If sorted is valid, replace cards with sorted ones
        meld.cards = sortedCards;
        player.hand.splice(cardIndex, 1);
        return { success: true };
      }
    }

    player.hand.splice(cardIndex, 1);
    meld.cards.push(card);

    console.log(`[RummyGame ${this.roomId}] ${player.nickname} laid off card on meld`);
    return { success: true };
  }

  /**
   * End the round when a player goes out
   */
  endRound(winnerId: string): void {
    const winner = this.getPlayer(winnerId);
    if (!winner) return;

    // Calculate penalty points for all players
    const playersPenalties: Record<string, number> = {};
    for (const player of this.players) {
      player.penaltyPoints = calculatePenaltyPoints(player.hand);
      playersPenalties[player.id] = player.penaltyPoints;
      player.points += player.penaltyPoints; // Accumulate total points
    }

    this.roundJustEnded = true;
    this.lastRoundResult = {
      winnerId,
      winnerNickname: winner.nickname,
      penalties: playersPenalties
    };

    console.log(`[RummyGame ${this.roomId}] ${winner.nickname} went out and won the round!`);
  }

  /**
   * Force a team to win
   */
  forceWin(team: number): void {
    const teamPlayers = this.players.filter(p => (p as any).team === team);
    this.winner = {
      team,
      players: teamPlayers.map(p => p.nickname),
      reason: 'forfeit'
    };
  }

  /**
   * Create a dummy face-down card
   */
  private makeFaceDown(): Card {
    return { rank: 'A', suit: 'hearts', value: 1, isJoker: false };
  }

  /**
   * Get full state for a specific player
   */
  getFullState(playerId: string): RummyGameState {
    const player = this.getPlayer(playerId);
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
        isBot: p.isBot,
        team: p.team,
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
      hasDrawn: this.hasDrawn,
      roundNumber: this.roundNumber,
      roundJustEnded: this.roundJustEnded,
      lastRoundResult: this.lastRoundResult
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
