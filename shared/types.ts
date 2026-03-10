import { Rank, Suit, GameStatus } from './rules.js';

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
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
