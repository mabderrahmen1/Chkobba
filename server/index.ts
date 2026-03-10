/**
 * Chkobba Server
 * Express + Socket.IO server for multiplayer card game
 */

import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import store from './store.js';
import Game from './game/Game.js';
import { Room } from './game/Room.js';
import { Player } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files from client dist directory
// Path is relative to project root, not compiled dist/server/
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Serve main HTML for all routes (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Game instances stored by room ID
const games = new Map<string, Game>();

// Player to socket mapping
const playerSockets = new Map<string, string>();

/**
 * Get or create game for a room
 * @param {string} roomId - Room ID
 * @param {Room} room - Room object
 * @returns {Game}
 */
function getOrCreateGame(roomId: string, room: Room): Game {
  if (!games.has(roomId)) {
    const game = new Game(roomId, room.players, room.targetScore);
    games.set(roomId, game);
  }
  return games.get(roomId)!;
}

/**
 * Delete game for a room
 * @param {string} roomId - Room ID
 */
function deleteGame(roomId: string): void {
  games.delete(roomId);
}

/**
 * Broadcast room state to all players
 * @param {string} roomId - Room ID
 */
function broadcastRoomUpdate(roomId: string): void {
  const room = store.getRoom(roomId);
  if (!room) return;

  io.to(roomId).emit('room_update', room.toPublicState());
}

/**
 * Broadcast game state to all players
 * @param {string} roomId - Room ID
 */
function broadcastGameState(roomId: string): void {
  const game = games.get(roomId);
  if (!game) return;

  const room = store.getRoom(roomId);
  if (!room) return;

  console.log(`[Server] Broadcasting game state for room ${roomId}, players: ${room.players.length}`);

  // Send full state to each player (with their hand)
  for (const player of room.players) {
    if (player.isConnected) {
      const socket = getSocketByPlayerId(player.id);
      if (socket) {
        const fullState = game.getFullState(player.id);
        console.log(`[Server] Sending game state to ${player.nickname}, hand: ${fullState.hand?.length || 0} cards`);
        socket.emit('game_state', fullState);
      } else {
        console.log(`[Server] Could not find socket for player ${player.id} (${player.nickname})`);
      }
    }
  }
}

/**
 * Get socket by player ID
 * @param {string} playerId - Player ID
 * @returns {Socket|null}
 */
function getSocketByPlayerId(playerId: string): Socket | null {
  const socketId = playerSockets.get(playerId);
  if (socketId) {
    return (io.sockets.sockets.get(socketId) as Socket) || null;
  }
  return null;
}

/**
 * Handle player disconnect
 * @param {Socket} socket - Socket
 * @param {Room} room - Room
 * @param {Player} player - Player
 */
function handleDisconnect(socket: Socket, room: Room, player: Player): void {
  room.removePlayer(player.id);
  
  // Notify others
  socket.to(room.id).emit('player_disconnected', { playerId: player.id });
  broadcastRoomUpdate(room.id);

  // If game is playing, start disconnect timer
  if (room.status === 'playing') {
    // Clear existing timer
    if (room.disconnectTimer) {
      clearTimeout(room.disconnectTimer);
    }

    // Check if all opposing team players are disconnected
    const opposingTeam = room.getTeam(player.team === 0 ? 1 : 0);
    const allOpponentsDisconnected = opposingTeam.every(p => !p.isConnected);

    if (allOpponentsDisconnected) {
      // Our team wins by default
      room.status = 'finished';
      io.to(room.id).emit('auto_win', { 
        winner: { team: player.team, reason: 'opponents_timeout' }
      });
      store.deleteRoom(room.id);
      deleteGame(room.id);
      return;
    }

    // Start timer for auto-win
    room.disconnectTimer = setTimeout(() => {
      const updatedRoom = store.getRoom(room.id);
      if (!updatedRoom) return;

      // Check if player reconnected
      const updatedPlayer = updatedRoom.players.find(p => p.id === player.id);
      if (updatedPlayer && !updatedPlayer.isConnected) {
        // Still disconnected - auto win for other team
        updatedRoom.status = 'finished';
        const winningTeam = player.team === 0 ? 1 : 0;
        io.to(room.id).emit('auto_win', { 
          winner: { team: winningTeam, reason: 'timeout' }
        });
        store.deleteRoom(room.id);
        deleteGame(room.id);
      }
    }, config.DISCONNECT_TIMEOUT_MS);

    // Send warning before auto-win
    setTimeout(() => {
      const stillRoom = store.getRoom(room.id);
      const stillPlayer = stillRoom?.players.find(p => p.id === player.id);
      if (stillPlayer && !stillPlayer.isConnected) {
        io.to(room.id).emit('auto_win_warning', { 
          timeRemaining: 60,
          playerNickname: player.nickname
        });
      }
    }, config.DISCONNECT_TIMEOUT_MS - 60000);

    console.log(`[Server] Disconnect timer started for ${player.nickname} in room ${room.id}`);
  }
}

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  let currentRoom: Room | null = null;
  let currentPlayer: Player | null = null;

  /**
   * Create a new room
   */
  socket.on('create_room', ({ nickname, targetScore, maxPlayers }: { nickname: string, targetScore: number, maxPlayers: number }) => {
    console.log('[Server] create_room event:', { nickname, targetScore, maxPlayers });
    try {
      const room = store.createRoom(socket.id, targetScore, maxPlayers);
      const { player, error } = room.addPlayer(nickname);

      if (error || !player) {
        socket.emit('error', { message: error || 'Failed to add player' });
        store.deleteRoom(room.id);
        return;
      }

      currentRoom = room;
      currentPlayer = player;

      // Map player to socket
      playerSockets.set(player.id, socket.id);

      socket.join(room.id);
      
      socket.emit('room_created', { roomId: room.id });
      socket.emit('room_joined', { 
        room: room.toPublicState(),
        player 
      });

      console.log(`[Server] Room created: ${room.id} by ${nickname}`);
    } catch (err: any) {
      console.error('[Server] Error creating room:', err);
      socket.emit('error', { message: 'Failed to create room: ' + err.message });
    }
  });

  /**
   * Join an existing room
   */
  socket.on('join_room', ({ roomId, nickname }: { roomId: string, nickname: string }) => {
    try {
      const room = store.getRoom(roomId.toUpperCase());
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status !== 'lobby') {
        socket.emit('error', { message: 'Game already started' });
        return;
      }

      const { player, error } = room.addPlayer(nickname);

      if (error || !player) {
        socket.emit('error', { message: error || 'Failed to add player' });
        return;
      }

      currentRoom = room;
      currentPlayer = player;

      // Map player to socket
      playerSockets.set(player.id, socket.id);

      socket.join(room.id);

      socket.emit('room_joined', {
        room: room.toPublicState(),
        player
      });

      // Notify others
      socket.to(room.id).emit('player_joined', { player });
      broadcastRoomUpdate(room.id);

      console.log(`[Server] ${nickname} joined room ${roomId}`);
    } catch (err) {
      console.error('[Server] Error joining room:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * Rejoin a room after disconnect
   */
  socket.on('rejoin_room', ({ roomId, nickname }: { roomId: string, nickname: string }) => {
    try {
      const room = store.getRoom(roomId.toUpperCase());
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Find disconnected player
      const disconnectedPlayer = room.players.find(
        p => !p.isConnected && p.nickname.toLowerCase() === nickname.toLowerCase()
      );

      if (!disconnectedPlayer) {
        socket.emit('error', { message: 'No disconnected player found with that nickname' });
        return;
      }

      // Reconnect
      const { player } = room.addPlayer(nickname, disconnectedPlayer.id);

      if (!player) {
        socket.emit('error', { message: 'Failed to rejoin' });
        return;
      }

      currentRoom = room;
      currentPlayer = player;

      // Map player to socket
      playerSockets.set(player.id, socket.id);

      socket.join(room.id);

      // Clear disconnect timer
      if (room.disconnectTimer) {
        clearTimeout(room.disconnectTimer);
        room.disconnectTimer = null;
      }

      socket.emit('room_joined', { 
        room: room.toPublicState(),
        player 
      });

      // Send game state if game is playing
      if (room.status === 'playing') {
        const game = games.get(room.id);
        if (game) {
          socket.emit('game_state', game.getFullState(player.id));
        }
      }

      // Notify others
      socket.to(room.id).emit('player_reconnected', { playerId: player.id });
      broadcastRoomUpdate(room.id);

      console.log(`[Server] ${nickname} rejoined room ${roomId}`);
    } catch (err) {
      console.error('[Server] Error rejoining room:', err);
      socket.emit('error', { message: 'Failed to rejoin room' });
    }
  });

  /**
   * Mark player as ready
   */
  socket.on('player_ready', () => {
    if (!currentRoom || !currentPlayer) return;

    currentRoom.setReady(currentPlayer.id, true);
    broadcastRoomUpdate(currentRoom.id);

    // Auto-start if all players ready
    if (currentRoom.allPlayersReady() && currentRoom.players.length >= 2) {
      // In a real app, you might want the host to explicitly start
      // But for now we follow the existing logic
      socket.emit('start_game');
    }
  });

  /**
   * Start the game (host only)
   */
  socket.on('start_game', () => {
    if (!currentRoom || !currentPlayer) return;
    if (!currentPlayer.isHost) {
      socket.emit('error', { message: 'Only host can start game' });
      return;
    }

    if (currentRoom.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players' });
      return;
    }

    // Create and start game
    const game = getOrCreateGame(currentRoom.id, currentRoom);
    currentRoom.status = 'playing';
    
    game.start();

    io.to(currentRoom.id).emit('game_started');
    broadcastGameState(currentRoom.id);
    broadcastRoomUpdate(currentRoom.id);

    console.log(`[Server] Game started in room ${currentRoom.id}`);
  });

  /**
   * Play a card
   */
  socket.on('play_card', ({ cardIndex, tableIndices }: { cardIndex: number, tableIndices?: number[] }) => {
    if (!currentRoom || !currentPlayer) return;

    const game = games.get(currentRoom.id);
    if (!game) return;

    const result = game.playCard(currentPlayer.id, cardIndex, tableIndices || []);

    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastGameState(currentRoom.id);

    if (result.capture?.isChkobba) {
      io.to(currentRoom.id).emit('chkobba', {
        playerId: currentPlayer.id,
        playerNickname: currentPlayer.nickname
      });
    }

    if (result.capture?.isHayya) {
      io.to(currentRoom.id).emit('hayya_captured', {
        playerId: currentPlayer.id,
        playerNickname: currentPlayer.nickname
      });
    }

    // Check if round just ended
    if (game.roundJustEnded && game.lastRoundResult) {
      io.to(currentRoom.id).emit('round_end', game.lastRoundResult);

      // Check if game is over
      if (game.winner) {
        io.to(currentRoom.id).emit('game_over', {
          winner: game.winner,
          scores: game.scores
        });
      }
    }
  });

  /**
   * Continue to next round (after round end modal)
   */
  socket.on('continue_round', () => {
    if (!currentRoom || !currentPlayer) return;

    const game = games.get(currentRoom.id);
    if (!game) return;

    // Only start new round if game isn't over
    if (!game.winner) {
      game.startNewRound();
      broadcastGameState(currentRoom.id);
    }
  });

  /**
   * Reset lobby (go back to lobby after game over)
   */
  socket.on('reset_lobby', () => {
    if (!currentRoom || !currentPlayer) return;

    // Delete the game instance
    deleteGame(currentRoom.id);

    // Reset room to lobby state
    currentRoom.status = 'lobby';
    for (const player of currentRoom.players) {
      player.isReady = false;
    }

    io.to(currentRoom.id).emit('lobby_reset');
    broadcastRoomUpdate(currentRoom.id);
  });

  /**
   * Send chat message
   */
  socket.on('chat_message', ({ message }: { message: string }) => {
    if (!currentRoom || !currentPlayer) return;

    const sanitizedMessage = message.slice(0, 200).trim();
    if (!sanitizedMessage) return;

    currentRoom.addChatMessage(currentPlayer.id, sanitizedMessage, false);

    io.to(currentRoom.id).emit('chat_message', {
      playerId: currentPlayer.id,
      playerNickname: currentPlayer.nickname,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
  });

  /**
   * Leave room
   */
  socket.on('leave_room', () => {
    if (!currentRoom || !currentPlayer) return;

    playerSockets.delete(currentPlayer.id);
    handleDisconnect(socket, currentRoom, currentPlayer);

    currentRoom = null;
    currentPlayer = null;
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`[Server] Client disconnected: ${socket.id}`);

    if (currentPlayer) {
      playerSockets.delete(currentPlayer.id);
    }

    if (currentRoom && currentPlayer) {
      handleDisconnect(socket, currentRoom, currentPlayer);
    }

    currentRoom = null;
    currentPlayer = null;
  });
});

// Start cleanup timer
store.startCleanupTimer();

// Start server
server.listen(config.PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🃏 Chkobba Server Running               ║
║                                           ║
║   Port: ${config.PORT}${' '.repeat(27 - String(config.PORT).length)}║
║   Environment: ${config.NODE_ENV}${' '.repeat(20 - String(config.NODE_ENV).length)}║
║                                           ║
║   Open http://localhost:${config.PORT}        ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

export { app, server, io };
