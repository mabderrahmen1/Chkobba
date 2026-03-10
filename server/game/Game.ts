/**
 * Game state machine
 * Handles all game logic: dealing, playing cards, capturing, scoring
 */

import config from '../config.js';
import Deck from './Deck.js';
import scoring from './scoring.js';
import { Card, Player, GameState, CaptureOption, Winner } from '../../shared/types.js';

interface GamePlayer extends Player {
  hand: Card[];
  capturedCards: Card[];
}

/**
 * Game class
 * Manages the game state for a room
 */
export class Game {
  roomId: string;
  targetScore: number;
  players: GamePlayer[];
  deck: Card[] = [];
  tableCards: Card[] = [];
  currentTurn: string = '';
  turnOrder: string[] = [];
  roundNumber: number = 0;
  scores = {
    team0: 0,
    team1: 0
  };
  roundScores = {
    team0: 0,
    team1: 0
  };
  lastCapturer: string | null = null;
  pendingCapture: {
    playerId: string;
    playedCard: Card;
    options: any[]; // Use any[] temporarily or define proper type
  } | null = null;
  winner: Winner | null = null;
  lastRoundResult: any = null;
  roundJustEnded: boolean = false;

  /**
   * Create a new game
   * @param {string} roomId - Room ID
   * @param {Player[]} players - Players in the room
   * @param {number} targetScore - Target score to win
   */
  constructor(roomId: string, players: Player[], targetScore: number) {
    this.roomId = roomId;
    this.targetScore = targetScore;
    this.players = players.map(p => ({
      ...p,
      hand: [],
      capturedCards: [],
      chkobbaCount: 0
    }));
  }

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {GamePlayer|null}
   */
  getPlayer(playerId: string): GamePlayer | null {
    return this.players.find(p => p.id === playerId) || null;
  }

  /**
   * Get next player in turn order
   * @returns {string} Next player ID
   */
  getNextPlayerId(): string {
    const currentIndex = this.turnOrder.indexOf(this.currentTurn);
    const nextIndex = (currentIndex + 1) % this.turnOrder.length;
    return this.turnOrder[nextIndex];
  }

  /**
   * Get team players
   * @param {number} team - Team number
   * @returns {GamePlayer[]}
   */
  getTeam(team: number): GamePlayer[] {
    return this.players.filter(p => p.team === team);
  }

  /**
   * Start a new game
   * @returns {GameState} Game state
   */
  start(): GameState {
    this.roundNumber = 0;
    this.scores = { team0: 0, team1: 0 };
    this.startNewRound();
    return this.getState();
  }

  /**
   * Start a new round
   */
  startNewRound(): void {
    this.roundNumber++;
    this.roundScores = { team0: 0, team1: 0 };
    this.lastCapturer = null;

    // Reset player hands and captured cards
    for (const player of this.players) {
      player.hand = [];
      player.capturedCards = [];
      player.chkobbaCount = 0;
    }

    // Setup deck and table
    const setup = Deck.setupGame();
    this.deck = setup.deck;
    this.tableCards = setup.tableCards;

    // Deal initial hands
    this.dealHands();

    // Set turn order (starting with player after dealer)
    this.turnOrder = this.players.map(p => p.id);
    this.currentTurn = this.turnOrder[1 % this.turnOrder.length];

    this.pendingCapture = null;

    console.log(`[Game ${this.roomId}] Round ${this.roundNumber} started`);
  }

  /**
   * Deal cards to all players
   */
  dealHands(): void {
    for (const player of this.players) {
      const cards = Deck.deal(this.deck, config.INITIAL_HAND_SIZE);
      player.hand.push(...cards);
    }
  }

  /**
   * Check if all cards have been played
   * @returns {boolean}
   */
  isRoundOver(): boolean {
    if (this.deck.length > 0) return false;
    return this.players.every(p => p.hand.length === 0);
  }

  /**
   * Play a card from hand
   * @param {string} playerId - Player ID
   * @param {number} cardIndex - Index of card in hand
   * @param {number[]} tableIndices - Indices of table cards to capture
   * @returns {Object} { success, capture, error }
   */
  playCard(playerId: string, cardIndex: number, tableIndices: number[] = []): { success: boolean; capture?: any; error?: string } {
    const player = this.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.currentTurn !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      return { success: false, error: 'Invalid card index' };
    }

    const playedCard = player.hand[cardIndex];

    // Case 1: Capture Intent
    if (tableIndices.length > 0) {
      // Validate indices
      for (const idx of tableIndices) {
        if (idx < 0 || idx >= this.tableCards.length) {
          return { success: false, error: 'Invalid table selection' };
        }
      }

      const selectedTableCards = tableIndices.map(i => this.tableCards[i]);
      const sum = selectedTableCards.reduce((acc, c) => acc + c.value, 0);

      // Chkobba Rule: If a single card matches the value, you MUST take it (or another sum)
      // but usually the rules are simplified for digital: we just validate the specific intent.
      
      const isSingleMatch = selectedTableCards.length === 1 && selectedTableCards[0].value === playedCard.value;
      const isSumMatch = sum === playedCard.value;

      if (!isSingleMatch && !isSumMatch) {
        return { success: false, error: `Invalid capture: Selection sums to ${sum}, but card is ${playedCard.value}` };
      }

      // Priority Rule check: If a single card matches value, you can't take a sum of other cards
      // if those cards don't include the matching card (depends on variant, but let's implement standard)
      const hasSingleMatchOnTable = this.tableCards.some(c => c.value === playedCard.value);
      if (hasSingleMatchOnTable && !isSingleMatch) {
        return { success: false, error: 'Must capture the single card with same value' };
      }

      // Execute Capture
      player.hand.splice(cardIndex, 1);
      
      const capturedCards = [playedCard, ...selectedTableCards];
      
      // Remove in reverse order
      const sortedIndices = [...tableIndices].sort((a, b) => b - a);
      for (const index of sortedIndices) {
        this.tableCards.splice(index, 1);
      }

      player.capturedCards.push(...capturedCards);
      this.lastCapturer = playerId;

      // Check for Chkobba
      const isChkobba = this.tableCards.length === 0 && !this.isRoundOver();
      if (isChkobba) {
        player.chkobbaCount++;
      }

      // Check for Hayya (7 of diamonds captured)
      const isHayya = capturedCards.some(c => c.rank === '7' && c.suit === 'diamonds');

      this.afterCardPlayed(playerId, isChkobba);

      return {
        success: true,
        capture: {
          player: playerId,
          cards: capturedCards,
          isChkobba,
          isHayya
        }
      };
    } 
    
    // Case 2: Discard Intent (No selection)
    // Validate that NO captures are possible (Optional, but good for competitive play)
    // For now, allow discard if user explicitly chose no table cards.
    
    player.hand.splice(cardIndex, 1);
    this.tableCards.push(playedCard);
    console.log(`[Game ${this.roomId}] ${player.nickname} played ${playedCard.rank} of ${playedCard.suit} (discard)`);
    
    this.afterCardPlayed(playerId);
    return { success: true };
  }

  afterCardPlayed(playerId: string, isChkobba = false): void {
    this.roundJustEnded = false;
    this.lastRoundResult = null;

    if (this.isRoundOver()) {
      this.endRound();
      this.roundJustEnded = true;
      return;
    }

    if (this.players.every(p => p.hand.length === 0) && this.deck.length > 0) {
      this.dealHands();
    }

    this.currentTurn = this.getNextPlayerId();
  }

  endRound(): void {
    if (this.tableCards.length > 0 && this.lastCapturer) {
      const lastCapturer = this.getPlayer(this.lastCapturer);
      if (lastCapturer) {
        lastCapturer.capturedCards.push(...this.tableCards);
      }
      this.tableCards = [];
    }

    const team0Players = this.getTeam(0);
    const team1Players = this.getTeam(1);

    const team0Captured = team0Players.flatMap(p => p.capturedCards);
    const team1Captured = team1Players.flatMap(p => p.capturedCards);
    const team0Chkobba = team0Players.reduce((sum, p) => sum + p.chkobbaCount, 0);
    const team1Chkobba = team1Players.reduce((sum, p) => sum + p.chkobbaCount, 0);

    const roundResult = scoring.calculateRoundScores({
      team0Captured,
      team1Captured,
      team0Chkobba,
      team1Chkobba
    });

    this.roundScores = roundResult.totals;
    this.scores.team0 += roundResult.totals.team0;
    this.scores.team1 += roundResult.totals.team1;

    this.lastRoundResult = roundResult;

    if (this.scores.team0 >= this.targetScore || this.scores.team1 >= this.targetScore) {
      this.endGame();
    }
  }

  endGame(): void {
    if (this.scores.team0 > this.scores.team1) {
      this.winner = { team: 0, players: this.getTeam(0).map(p => p.nickname) };
    } else if (this.scores.team1 > this.scores.team0) {
      this.winner = { team: 1, players: this.getTeam(1).map(p => p.nickname) };
    } else {
      this.startNewRound();
      return;
    }
  }

  getState(): GameState {
    return {
      roomId: this.roomId,
      targetScore: this.targetScore,
      roundNumber: this.roundNumber,
      tableCards: this.tableCards,
      players: this.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        team: p.team,
        handCount: p.hand.length,
        capturedCount: p.capturedCards.length,
        chkobbaCount: p.chkobbaCount,
        isConnected: p.isConnected,
        isHost: p.isHost,
        isReady: p.isReady
      })),
      currentTurn: this.currentTurn,
      scores: this.scores,
      roundScores: this.roundScores,
      pendingCapture: this.pendingCapture ? {
        playerId: this.pendingCapture.playerId,
        playedCard: this.pendingCapture.playedCard,
        options: this.pendingCapture.options.map((o, i) => ({
          index: i,
          type: o.type,
          cards: o.cards
        }))
      } : null,
      winner: this.winner
    };
  }

  getFullState(playerId: string): GameState {
    const state = this.getState();
    const player = this.getPlayer(playerId);
    if (player) {
      state.hand = player.hand;
    }
    return state;
  }
}

export default Game;
