/**
 * Game state machine
 * Handles all game logic: dealing, playing cards, capturing, scoring
 */

import config from '../config.js';
import Deck from './Deck.js';
import scoring from './scoring.js';
import { Card, Player, GameState, CaptureOption, Winner } from '../../shared/types.js';
import { findCombinations } from './Bot.js';

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
  originalPlayers: Player[]; // Persistent session stats reference
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
  continuePlayers: Set<string> = new Set();
  lastAction: GameState['lastAction'] = null;

  /**
   * Create a new game
   * @param {string} roomId - Room ID
   * @param {Player[]} players - Players in the room
   * @param {number} targetScore - Target score to win
   */
  constructor(roomId: string, players: Player[], targetScore: number) {
    this.roomId = roomId;
    this.targetScore = targetScore;
    this.originalPlayers = players;
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
   * Mark a player as ready to continue to the next round
   * @param {string} playerId - Player who clicked continue
   * @param {string[]} connectedPlayerIds - IDs of currently connected players (from Room)
   * @returns {boolean} True if ALL connected players are now ready (new round should start)
   */
  playerContinue(playerId: string, connectedPlayerIds: string[]): boolean {
    this.continuePlayers.add(playerId);
    return connectedPlayerIds.every(id => this.continuePlayers.has(id));
  }

  /**
   * Start a new round
   */
  startNewRound(): void {
    this.roundNumber++;
    this.roundScores = { team0: 0, team1: 0 };
    this.lastCapturer = null;
    this.continuePlayers.clear();
    this.lastAction = null;
    this.roundJustEnded = false; // Reset this so timers can start

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

    // Set turn order with alternating teams
    // For 4-player (2v2): Team1 -> Team2 -> Team1 -> Team2
    // For 2-player: Team0 -> Team1
    this.turnOrder = [];
    const team0Players = this.getTeam(0);
    const team1Players = this.getTeam(1);
    
    if (team0Players.length === 2 && team1Players.length === 2) {
      // 4-player 2v2: alternate teams
      // Rotate starting player each round for fairness
      const startWithTeam1 = this.roundNumber % 2 === 0;
      if (startWithTeam1) {
        this.turnOrder.push(team0Players[0].id, team1Players[0].id, team0Players[1].id, team1Players[1].id);
      } else {
        this.turnOrder.push(team1Players[0].id, team0Players[0].id, team1Players[1].id, team0Players[1].id);
      }
    } else {
      // 2-player: simple alternation
      this.turnOrder = this.players.map(p => p.id);
    }
    
    // First player is determined by rotation (dealer concept)
    const firstPlayerIndex = (this.roundNumber - 1) % this.turnOrder.length;
    this.currentTurn = this.turnOrder[firstPlayerIndex];

    this.pendingCapture = null;

    console.log(`[Game ${this.roomId}] Round ${this.roundNumber} started, turn order: ${this.turnOrder.join(' -> ')}`);
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
   * Check if any combination of table cards sums to target value
   */
  canCaptureCombo(target: number): boolean {
    const combos = findCombinations(this.tableCards, target);
    return combos.length > 0;
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

    // Chkobba Rule: If there’s an exact single-card match, it takes priority.
    // Check if any single card on the table matches the played card's value.
    const singleMatchIndex = this.tableCards.findIndex(c => c.value === playedCard.value);
    const hasSingleMatch = singleMatchIndex !== -1;

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

      // Rule Enforcement: Single-card match takes priority
      if (hasSingleMatch) {
        if (selectedTableCards.length !== 1 || selectedTableCards[0].value !== playedCard.value) {
          return { 
            success: false, 
            error: `If there’s an exact single-card match, it takes priority. You must capture the ${this.tableCards[singleMatchIndex].rank} on the table.` 
          };
        }
      }

      const isSingleMatch = selectedTableCards.length === 1 && selectedTableCards[0].value === playedCard.value;
      const isSumMatch = sum === playedCard.value;

      if (!isSingleMatch && !isSumMatch) {
        return { success: false, error: `Invalid capture: Selection sums to ${sum}, but card is ${playedCard.value}` };
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

      // Track last action for animation
      this.lastAction = {
        type: 'capture',
        playerId,
        card: { ...playedCard },
        capturedCards: selectedTableCards.map(c => ({ ...c })),
        isChkobba: this.tableCards.length === 0 && !this.isRoundOver(),
        isHayya: capturedCards.some(c => c.rank === '7' && c.suit === 'diamonds'),
        timestamp: Date.now()
      };

      // Check for Chkobba
      const isChkobba = this.tableCards.length === 0 && !this.isRoundOver();
      if (isChkobba) {
        player.chkobbaCount++;
      }

      this.afterCardPlayed(playerId, isChkobba);

      return {
        success: true,
        capture: {
          player: playerId,
          cards: capturedCards,
          isChkobba,
          isHayya: this.lastAction.isHayya
        }
      };
    } 

    // Case 2: Discard Intent (No selection)
    // Mandatory capture rule: If ANY capture is possible, you must take it.
    if (hasSingleMatch) {
      return { 
        success: false, 
        error: `If there’s an exact single-card match, it takes priority. You must capture the ${this.tableCards[singleMatchIndex].rank} on the table.` 
      };
    }

    // Check for combination captures
    // Import helper from Bot or shared if needed, or implement here.
    // Given the request specifically emphasized single-card match, 
    // I'll ensure it's handled. For combination matches, the standard 
    // rule says they are also mandatory if no single match exists.

    // Check if any combination matches the played card's value
    // We can use a simple subset sum or just check if any combination exists.
    const hasComboMatch = this.canCaptureCombo(playedCard.value);
    if (hasComboMatch) {
      return { success: false, error: 'A capture is possible with this card. You must select the cards to capture.' };
    }

    player.hand.splice(cardIndex, 1);
    this.tableCards.push(playedCard);
    // Track last action for animation
    this.lastAction = {
      type: 'play',
      playerId,
      card: { ...playedCard },
      timestamp: Date.now()
    };

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
    let winningTeam = -1;
    if (this.scores.team0 > this.scores.team1) {
      winningTeam = 0;
      this.winner = { team: 0, players: this.getTeam(0).map(p => p.nickname) };
    } else if (this.scores.team1 > this.scores.team0) {
      winningTeam = 1;
      this.winner = { team: 1, players: this.getTeam(1).map(p => p.nickname) };
    } else {
      this.startNewRound();
      return;
    }

    if (winningTeam !== -1) {
      // Update persistent stats in the original player objects (reference to Room players)
      this.players.forEach(p => {
        const orig = this.originalPlayers.find(op => op.id === p.id);
        if (p.team === winningTeam) {
          p.wins = (p.wins || 0) + 1;
          if (orig) orig.wins = (orig.wins || 0) + 1;
        } else {
          p.losses = (p.losses || 0) + 1;
          if (orig) orig.losses = (orig.losses || 0) + 1;
        }
      });
    }
  }

  getState(): GameState {
    return {
      roomId: this.roomId,
      targetScore: this.targetScore,
      roundNumber: this.roundNumber,
      tableCards: this.tableCards,
      players: this.players.map(p => {
        // Sync isHost from the original players reference
        const orig = this.originalPlayers.find(op => op.id === p.id);
        return {
          id: p.id,
          nickname: p.nickname,
          team: p.team,
          handCount: p.hand?.length || 0,
          capturedCount: p.capturedCards?.length || 0,
          chkobbaCount: p.chkobbaCount || 0,
          dinariCount: p.capturedCards ? p.capturedCards.filter(c => c.suit === 'diamonds').length : 0,
          sevensCount: p.capturedCards ? p.capturedCards.filter(c => c.rank === '7').length : 0,
          hasHaya: p.capturedCards ? p.capturedCards.some(c => c.rank === '7' && c.suit === 'diamonds') : false,
          wins: p.wins || 0,
          losses: p.losses || 0,
          isConnected: p.isConnected,
          isHost: orig?.isHost || p.isHost,
          isReady: p.isReady
        };
      }),
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
      winner: this.winner,
      lastAction: this.lastAction
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

  /**
   * DEBUG FEATURE: Force a team to win
   * @param {number} team - Team to win
   */
  forceWin(team: number): void {
    if (team === 0) {
      this.scores.team0 = this.targetScore;
    } else {
      this.scores.team1 = this.targetScore;
    }
    this.endGame();
  }
}

export default Game;
