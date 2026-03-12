import { Rank, Suit, GameStatus, GameType, CardRank, RummyRank } from './rules.js';

export interface Card {
  rank: CardRank | RummyRank;
  suit: Suit;
  value: number;
  isJoker?: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  team: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  handCount: number;
  capturedCount: number;
  chkobbaCount: number;
  dinariCount: number;
  sevensCount: number;
  hasHaya: boolean;
  wins: number;
  losses: number;
}

export interface RoomState {
  id: string;
  hostId: string;
  targetScore: number;
  maxPlayers: number;
  status: GameStatus;
  players: Player[];
  createdAt: number;
  lastActivity: number;
  gameType: GameType;
}

export interface CaptureOption {
  index: number;
  type: 'single' | 'combination';
  cards: Card[];
}

export interface PendingCapture {
  playerId: string;
  playedCard: Card;
  options: CaptureOption[];
}

export interface GameState {
  roomId: string;
  roundNumber: number;
  targetScore: number;
  currentTurn: string;
  tableCards: Card[];
  hand?: Card[];
  scores: { team0: number; team1: number };
  roundScores: { team0: number; team1: number };
  players: Player[];
  pendingCapture: PendingCapture | null;
  winner: Winner | null;
  lastAction?: {
    type: 'play' | 'capture';
    playerId: string;
    card: Card;
    capturedCards?: Card[];
    isChkobba?: boolean;
    isHayya?: boolean;
    timestamp: number;
  } | null;
}

export interface ChatMessage {
  playerId?: string;
  playerNickname?: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoundResult {
  breakdown: {
    carta: { team0: number; team1: number };
    dinari: { team0: number; team1: number };
    bermila: { team0: number; team1: number };
    sabaaElHaya: { team0: number; team1: number };
    chkobba: { team0: number; team1: number };
  };
  totals: { team0: number; team1: number };
}

export interface Winner {
  team: number;
  players?: string[];
  reason?: string;
}

// Rummy-specific types
export type MeldType = 'set' | 'sequence';

export interface Meld {
  id: string;
  type: MeldType;
  cards: Card[];
  playerId: string;
  isPure: boolean; // No jokers used
}

export interface RummyPlayer {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hand: Card[];
  melds: Meld[];
  points: number; // Points from melds
  penaltyPoints: number; // Points from unmelded cards
}

export interface RummyGameState {
  roomId: string;
  currentTurn: string;
  drawPile: Card[];
  discardPile: Card[];
  players: RummyPlayer[];
  tableMelds: Meld[]; // All melds on the table
  winner: Winner | null;
  deckCount: number; // Number of decks used
  canLayOff: boolean; // Can players lay off cards on existing melds
  hasDrawn: boolean; // Whether current player has drawn this turn
}
