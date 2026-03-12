/**
 * Chkobba Server
 * Express + Socket.IO server for multiplayer card game
 */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import store from './store.js';
import Game from './game/Game.js';
import { RummyGame } from './game/RummyGame.js';
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
const chkobbaGames = new Map();
const rummyGames = new Map();
// Player to socket mapping
const playerSockets = new Map();
/**
 * Get or create Chkobba game for a room
 * @param {string} roomId - Room ID
 * @param {Room} room - Room object
 * @returns {Game}
 */
function getOrCreateChkobbaGame(roomId, room) {
    if (!chkobbaGames.has(roomId)) {
        const game = new Game(roomId, room.players, room.targetScore);
        chkobbaGames.set(roomId, game);
    }
    return chkobbaGames.get(roomId);
}
/**
 * Get or create Rummy game for a room
 * @param {string} roomId - Room ID
 * @param {Room} room - Room object
 * @returns {RummyGame}
 */
function getOrCreateRummyGame(roomId, room) {
    if (!rummyGames.has(roomId)) {
        const deckCount = room.players.length <= 6 ? 1 : room.players.length <= 8 ? 2 : 3;
        const game = new RummyGame(roomId, room.players, deckCount);
        rummyGames.set(roomId, game);
    }
    return rummyGames.get(roomId);
}
/**
 * Delete games for a room
 * @param {string} roomId - Room ID
 */
function deleteGames(roomId) {
    chkobbaGames.delete(roomId);
    rummyGames.delete(roomId);
}
/**
 * Broadcast room state to all players
 * @param {string} roomId - Room ID
 */
function broadcastRoomUpdate(roomId) {
    const room = store.getRoom(roomId);
    if (!room)
        return;
    io.to(roomId).emit('room_update', room.toPublicState());
}
/**
 * Broadcast Chkobba game state to all players
 * @param {string} roomId - Room ID
 */
function broadcastChkobbaGameState(roomId) {
    const game = chkobbaGames.get(roomId);
    if (!game)
        return;
    const room = store.getRoom(roomId);
    if (!room)
        return;
    console.log(`[Server] Broadcasting Chkobba game state for room ${roomId}, players: ${room.players.length}`);
    // Send full state to each player (with their hand)
    for (const player of room.players) {
        if (player.isConnected) {
            const socket = getSocketByPlayerId(player.id);
            if (socket) {
                const fullState = game.getFullState(player.id);
                console.log(`[Server] Sending Chkobba game state to ${player.nickname}, hand: ${fullState.hand?.length || 0} cards`);
                socket.emit('game_state', fullState);
            }
            else {
                console.log(`[Server] Could not find socket for player ${player.id} (${player.nickname})`);
            }
        }
    }
}
/**
 * Broadcast Rummy game state to all players
 * @param {string} roomId - Room ID
 */
function broadcastRummyGameState(roomId) {
    const game = rummyGames.get(roomId);
    if (!game)
        return;
    const room = store.getRoom(roomId);
    if (!room)
        return;
    console.log(`[Server] Broadcasting Rummy game state for room ${roomId}, players: ${room.players.length}`);
    // Send full state to each player (with their hand)
    for (const player of room.players) {
        if (player.isConnected) {
            const socket = getSocketByPlayerId(player.id);
            if (socket) {
                const fullState = game.getFullState(player.id);
                socket.emit('game_state', fullState);
            }
        }
    }
}
/**
 * Broadcast game state based on room game type
 * @param {string} roomId - Room ID
 */
function broadcastGameState(roomId) {
    const room = store.getRoom(roomId);
    if (!room)
        return;
    if (room.gameType === 'rummy') {
        broadcastRummyGameState(roomId);
    }
    else {
        broadcastChkobbaGameState(roomId);
    }
}
/**
 * Get socket by player ID
 * @param {string} playerId - Player ID
 * @returns {Socket|null}
 */
function getSocketByPlayerId(playerId) {
    const socketId = playerSockets.get(playerId);
    if (socketId) {
        return io.sockets.sockets.get(socketId) || null;
    }
    return null;
}
/**
 * Handle player disconnect
 * @param {Socket} socket - Socket
 * @param {Room} room - Room
 * @param {Player} player - Player
 */
function handleDisconnect(socket, room, player) {
    const wasHost = player.isHost;
    room.removePlayer(player.id);
    // If host left, and we are not playing, we should promote new host immediately
    if (wasHost && room.status === config.GAME_STATUS.LOBBY) {
        const newHost = room.players.find(p => p.isHost && p.isConnected);
        if (newHost) {
            const hostSocket = getSocketByPlayerId(newHost.id);
            if (hostSocket) {
                hostSocket.emit('error', { message: 'The host left. You are now the host!' });
            }
        }
    }
    // Notify others
    socket.to(room.id).emit('player_disconnected', { playerId: player.id });
    broadcastRoomUpdate(room.id);
    // If game is playing, start disconnect timer
    if (room.status === config.GAME_STATUS.PLAYING) {
        // Clear existing timer
        if (room.disconnectTimer) {
            clearTimeout(room.disconnectTimer);
        }
        // Check if all opposing team players are disconnected
        const opposingTeam = room.getTeam(player.team === 0 ? 1 : 0);
        // Important: Only trigger auto-win if there actually are opponents present
        const allOpponentsDisconnected = opposingTeam.length > 0 && opposingTeam.every(p => !p.isConnected);
        if (allOpponentsDisconnected) {
            console.log(`[Server] All opponents disconnected in room ${room.id}. Match paused.`);
            // We no longer delete the room immediately. 
            // The store's cleanupTimer will handle it if nobody returns for 10 minutes.
            return;
        }
        // Start timer for auto-win (Match remains alive)
        room.disconnectTimer = setTimeout(() => {
            const updatedRoom = store.getRoom(room.id);
            if (!updatedRoom)
                return;
            // Check if player reconnected
            const updatedPlayer = updatedRoom.players.find(p => p.id === player.id);
            if (updatedPlayer && !updatedPlayer.isConnected) {
                // Still disconnected - auto win for other team
                updatedRoom.status = 'finished';
                const winningTeam = player.team === 0 ? 1 : 0;
                io.to(room.id).emit('auto_win', {
                    winner: { team: updatedRoom.gameType === 'rummy' ? 0 : winningTeam, reason: 'timeout' }
                });
                // We STILL don't delete the room here, let them see the result or lobby reset
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
io.on('connection', (socket) => {
    console.log(`[Server] Client connected: ${socket.id}`);
    let currentRoom = null;
    let currentPlayer = null;
    /**
     * Create a new room
     */
    socket.on('create_room', ({ nickname, targetScore, maxPlayers, gameType }) => {
        console.log('[Server] create_room event:', { nickname, targetScore, maxPlayers, gameType });
        try {
            const room = store.createRoom(socket.id, targetScore, maxPlayers, gameType || 'chkobba');
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
            console.log(`[Server] Room created: ${room.id} by ${nickname} (${room.gameType})`);
        }
        catch (err) {
            console.error('[Server] Error creating room:', err);
            socket.emit('error', { message: 'Failed to create room: ' + err.message });
        }
    });
    /**
     * Rejoin a room using playerId (Persistence)
     */
    socket.on('rejoin_game', ({ roomId, playerId }) => {
        console.log(`[Server] Persistent rejoin request: Room ${roomId}, Player ${playerId}, New Socket ${socket.id}`);
        try {
            const room = store.getRoom(roomId.toUpperCase());
            if (!room) {
                console.log(`[Server] Rejoin failed: Room ${roomId} not found`);
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            const existingPlayer = room.players.find(p => p.id === playerId);
            if (!existingPlayer) {
                console.log(`[Server] Rejoin failed: Player ${playerId} not in room ${roomId}`);
                socket.emit('error', { message: 'Session not found in this room' });
                return;
            }
            // Important: Force update socket mapping even if they appear "connected"
            // This happens when they refresh faster than the server registers a disconnect.
            const oldSocketId = playerSockets.get(playerId);
            if (oldSocketId && oldSocketId !== socket.id) {
                console.log(`[Server] Overriding old socket ${oldSocketId} with new socket ${socket.id} for player ${playerId}`);
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket)
                    oldSocket.disconnect(true);
            }
            existingPlayer.isConnected = true;
            playerSockets.set(playerId, socket.id);
            currentRoom = room;
            currentPlayer = existingPlayer;
            socket.join(room.id);
            // Cancel any auto-win/disconnect timers
            if (room.disconnectTimer) {
                clearTimeout(room.disconnectTimer);
                room.disconnectTimer = null;
            }
            socket.emit('room_joined', {
                room: room.toPublicState(),
                player: existingPlayer
            });
            // Crucial: Send immediate game state if playing
            if (room.status === config.GAME_STATUS.PLAYING) {
                const game = room.gameType === 'rummy' ? rummyGames.get(room.id) : chkobbaGames.get(room.id);
                if (game) {
                    const fullState = game.getFullState(playerId);
                    socket.emit('game_state', fullState);
                    console.log(`[Server] Restored game state for ${existingPlayer.nickname}`);
                }
            }
            socket.to(room.id).emit('player_reconnected', { playerId });
            broadcastRoomUpdate(room.id);
        }
        catch (err) {
            console.error('[Server] Rejoin error:', err);
        }
    });
    /**
     * Join an existing room
     */
    socket.on('join_room', ({ roomId, nickname }) => {
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
            // Clear disconnect timer if rejoining
            if (room.disconnectTimer) {
                clearTimeout(room.disconnectTimer);
                room.disconnectTimer = null;
            }
            socket.emit('room_joined', {
                room: room.toPublicState(),
                player
            });
            // Notify others
            socket.to(room.id).emit('player_joined', { player });
            broadcastRoomUpdate(room.id);
            console.log(`[Server] ${nickname} joined room ${roomId}`);
        }
        catch (err) {
            console.error('[Server] Error joining room:', err);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    /**
     * Rejoin a room after disconnect (Legacy/Manual)
     */
    socket.on('rejoin_room', ({ roomId, nickname }) => {
        try {
            const room = store.getRoom(roomId.toUpperCase());
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            // Find player by name (connected or not)
            const existingPlayer = room.players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
            if (!existingPlayer) {
                socket.emit('error', { message: 'No player found with that nickname' });
                return;
            }
            // Reconnect
            const { player } = room.addPlayer(nickname, existingPlayer.id);
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
            if (room.status === config.GAME_STATUS.PLAYING) {
                const game = room.gameType === 'rummy' ? rummyGames.get(room.id) : chkobbaGames.get(room.id);
                if (game) {
                    socket.emit('game_state', game.getFullState(player.id));
                }
            }
            // Notify others
            socket.to(room.id).emit('player_reconnected', { playerId: player.id });
            broadcastRoomUpdate(room.id);
            console.log(`[Server] ${nickname} rejoined room ${roomId}`);
        }
        catch (err) {
            console.error('[Server] Error rejoining room:', err);
            socket.emit('error', { message: 'Failed to rejoin room' });
        }
    });
    /**
     * Update room settings (Host only)
     */
    socket.on('update_room_settings', ({ maxPlayers, gameType, targetScore }) => {
        if (!currentRoom || !currentPlayer)
            return;
        if (!currentPlayer.isHost) {
            socket.emit('error', { message: 'Only host can change settings' });
            return;
        }
        console.log(`[Server] Updating settings for room ${currentRoom.id}: ${gameType}, ${maxPlayers} players`);
        currentRoom.updateSettings(maxPlayers, gameType, targetScore);
        // If team size changed, we might need to re-balance teams or clear games
        deleteGames(currentRoom.id);
        broadcastRoomUpdate(currentRoom.id);
    });
    /**
     * Mark player as ready
     */
    socket.on('player_ready', () => {
        if (!currentRoom || !currentPlayer)
            return;
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
        if (!currentRoom || !currentPlayer)
            return;
        if (!currentPlayer.isHost) {
            socket.emit('error', { message: 'Only host can start game' });
            return;
        }
        if (currentRoom.players.length < 2) {
            socket.emit('error', { message: 'Need at least 2 players' });
            return;
        }
        // Create and start game based on game type
        currentRoom.status = 'playing';
        if (currentRoom.gameType === 'rummy') {
            const game = getOrCreateRummyGame(currentRoom.id, currentRoom);
            game.start();
        }
        else {
            const game = getOrCreateChkobbaGame(currentRoom.id, currentRoom);
            game.start();
        }
        io.to(currentRoom.id).emit('game_started');
        broadcastGameState(currentRoom.id);
        broadcastRoomUpdate(currentRoom.id);
        console.log(`[Server] ${currentRoom.gameType} game started in room ${currentRoom.id}`);
    });
    /**
     * Play a card (Chkobba)
     */
    socket.on('play_card', ({ cardIndex, tableIndices }) => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room' });
            return;
        }
        if (currentRoom.gameType !== 'chkobba') {
            socket.emit('error', { message: 'Not a Chkobba game' });
            return;
        }
        const game = chkobbaGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        currentRoom.lastActivity = Date.now();
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
     * Draw card from draw pile (Rummy)
     */
    socket.on('rummy_draw', () => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room' });
            return;
        }
        if (currentRoom.gameType !== 'rummy') {
            socket.emit('error', { message: 'Not a Rummy game' });
            return;
        }
        const game = rummyGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        currentRoom.lastActivity = Date.now();
        const result = game.drawCard(currentPlayer.id);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        broadcastGameState(currentRoom.id);
    });
    /**
     * Draw card from discard pile (Rummy)
     */
    socket.on('rummy_draw_discard', () => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room' });
            return;
        }
        if (currentRoom.gameType !== 'rummy') {
            socket.emit('error', { message: 'Not a Rummy game' });
            return;
        }
        const game = rummyGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        currentRoom.lastActivity = Date.now();
        const result = game.drawFromDiscard(currentPlayer.id);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        broadcastGameState(currentRoom.id);
    });
    /**
     * Discard card (Rummy)
     */
    socket.on('rummy_discard', ({ cardIndex }) => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room' });
            return;
        }
        if (currentRoom.gameType !== 'rummy') {
            socket.emit('error', { message: 'Not a Rummy game' });
            return;
        }
        const game = rummyGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        currentRoom.lastActivity = Date.now();
        const result = game.discardCard(currentPlayer.id, cardIndex);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        broadcastGameState(currentRoom.id);
        // Check if game is over
        if (game.winner) {
            io.to(currentRoom.id).emit('game_over', {
                winner: game.winner,
                scores: {}
            });
        }
    });
    /**
     * Create meld (Rummy)
     */
    socket.on('rummy_meld', ({ cardIndices, type }) => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room' });
            return;
        }
        if (currentRoom.gameType !== 'rummy') {
            socket.emit('error', { message: 'Not a Rummy game' });
            return;
        }
        const game = rummyGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        currentRoom.lastActivity = Date.now();
        const result = game.createMeld(currentPlayer.id, cardIndices, type);
        if (result.error) {
            socket.emit('error', { message: result.error });
            return;
        }
        broadcastGameState(currentRoom.id);
    });
    /**
     * Continue to next round (after round end modal) - Chkobba only
     */
    socket.on('continue_round', () => {
        if (!currentRoom || !currentPlayer) {
            socket.emit('error', { message: 'Not connected to a room. Please refresh.' });
            return;
        }
        if (currentRoom.gameType !== 'chkobba') {
            socket.emit('error', { message: 'Not a Chkobba game' });
            return;
        }
        const game = chkobbaGames.get(currentRoom.id);
        if (!game) {
            socket.emit('error', { message: 'Game not found. Please refresh.' });
            return;
        }
        currentRoom.lastActivity = Date.now();
        // Don't start a new round if game is over
        if (game.winner)
            return;
        // Mark this player as ready to continue; only start when all connected players confirm
        const connectedIds = currentRoom.getConnectedPlayers().map(p => p.id);
        const allReady = game.playerContinue(currentPlayer.id, connectedIds);
        if (allReady) {
            game.startNewRound();
            broadcastGameState(currentRoom.id);
        }
    });
    /**
     * Forfeit match
     */
    socket.on('forfeit', () => {
        if (!currentRoom || !currentPlayer)
            return;
        const game = chkobbaGames.get(currentRoom.id) || rummyGames.get(currentRoom.id);
        if (!game)
            return;
        console.log(`[Server] Forfeit by ${currentPlayer.nickname} in room ${currentRoom.id}`);
        // Determine winning team (the other one)
        const winningTeam = currentPlayer.team === 0 ? 1 : 0;
        // Set game winner
        game.winner = {
            team: winningTeam,
            players: currentRoom.getTeam(winningTeam).map(p => p.nickname),
            reason: 'forfeit'
        };
        // Update session wins/losses
        currentRoom.players.forEach(p => {
            if (p.team === winningTeam) {
                p.wins = (p.wins || 0) + 1;
            }
            else {
                p.losses = (p.losses || 0) + 1;
            }
        });
        // Notify everyone
        io.to(currentRoom.id).emit('game_over', {
            winner: game.winner,
            scores: game.scores || {}
        });
        broadcastGameState(currentRoom.id);
        broadcastRoomUpdate(currentRoom.id);
    });
    /**
     * Play again (reset scores and start new match immediately)
     */
    socket.on('play_again', () => {
        if (!currentRoom || !currentPlayer)
            return;
        const game = chkobbaGames.get(currentRoom.id);
        // Clear the current game data
        chkobbaGames.delete(currentRoom.id);
        rummyGames.delete(currentRoom.id);
        // Start a fresh game in same room
        const newGame = getOrCreateChkobbaGame(currentRoom.id, currentRoom);
        newGame.start();
        io.to(currentRoom.id).emit('game_started');
        broadcastGameState(currentRoom.id);
        console.log(`[Server] Room ${currentRoom.id} started a new match (Play Again)`);
    });
    /**
     * Reset game (play again in same room)
     */
    socket.on('reset_game', () => {
        if (!currentRoom || !currentPlayer) {
            console.log('[Server] reset_game failed: No currentRoom or currentPlayer');
            return;
        }
        console.log(`[Server] Resetting game for room ${currentRoom.id} (triggered by ${currentPlayer.nickname})`);
        // Reset room status but KEEP players and their wins/losses
        currentRoom.status = 'lobby';
        for (const player of currentRoom.players) {
            player.isReady = false;
        }
        // Delete existing game instance
        chkobbaGames.delete(currentRoom.id);
        rummyGames.delete(currentRoom.id);
        // Notify ALL players to clear their game states and return to lobby
        io.to(currentRoom.id).emit('lobby_reset');
        // Also broadcast the room update so players see everyone is unready
        broadcastRoomUpdate(currentRoom.id);
    });
    /**
     * Reset lobby (legacy)
     */
    socket.on('reset_lobby', () => {
        if (!currentRoom || !currentPlayer)
            return;
        // Delete the game instance(s)
        deleteGames(currentRoom.id);
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
    socket.on('chat_message', ({ message }) => {
        if (!currentRoom || !currentPlayer)
            return;
        const sanitizedMessage = message.slice(0, 200).trim();
        if (!sanitizedMessage)
            return;
        currentRoom.addChatMessage(currentPlayer.id, sanitizedMessage, false);
        io.to(currentRoom.id).emit('chat_message', {
            playerId: currentPlayer.id,
            playerNickname: currentPlayer.nickname,
            message: sanitizedMessage,
            timestamp: Date.now()
        });
    });
    /**
     * DEBUG: Force win
     */
    socket.on('debug_force_win', () => {
        if (!currentRoom || !currentPlayer)
            return;
        const game = chkobbaGames.get(currentRoom.id);
        if (!game)
            return;
        console.log(`[DEBUG] Force win triggered by ${currentPlayer.nickname} for team ${currentPlayer.team}`);
        game.forceWin(currentPlayer.team);
        io.to(currentRoom.id).emit('game_over', {
            winner: game.winner,
            scores: game.scores
        });
        broadcastGameState(currentRoom.id);
    });
    /**
     * Leave room (Permanent)
     */
    socket.on('leave_room', () => {
        if (!currentRoom || !currentPlayer)
            return;
        const playerId = currentPlayer.id;
        const nickname = currentPlayer.nickname;
        const wasHost = currentPlayer.isHost;
        console.log(`[Server] Player ${nickname} is leaving room ${currentRoom.id} permanently`);
        // Remove player permanently
        currentRoom.removePlayer(playerId, true);
        playerSockets.delete(playerId);
        // If host left, we MUST reset the room to lobby so new host can manage it
        if (wasHost) {
            currentRoom.status = 'lobby';
            // Clear any active games
            deleteGames(currentRoom.id);
            // Notify everyone about the host change and reset
            io.to(currentRoom.id).emit('lobby_reset');
            const newHost = currentRoom.players.find(p => p.isHost && p.isConnected);
            if (newHost) {
                const hostSocket = getSocketByPlayerId(newHost.id);
                if (hostSocket) {
                    hostSocket.emit('error', { message: 'The host left. You are now the host!' });
                }
            }
            // CRITICAL: Broadcast the update so the client sees the new hostId
            broadcastRoomUpdate(currentRoom.id);
        }
        // Notify others
        socket.to(currentRoom.id).emit('player_left', { playerId, nickname });
        broadcastRoomUpdate(currentRoom.id);
        // Add system message to chat
        currentRoom.addChatMessage('system', `${nickname} left the room`, true);
        io.to(currentRoom.id).emit('chat_message', {
            playerId: 'system',
            playerNickname: 'System',
            message: `${nickname} left the room`,
            isSystem: true,
            timestamp: Date.now()
        });
        currentRoom = null;
        currentPlayer = null;
    });
    /**
     * Handle player disconnect
     */
    socket.on('disconnect', () => {
        console.log(`[Server] Client disconnected: ${socket.id}`);
        if (currentPlayer) {
            // ONLY process disconnect if this socket is still the one assigned to the player
            // This prevents rapid refreshes from clearing the state of the new connection
            if (playerSockets.get(currentPlayer.id) === socket.id) {
                console.log(`[Server] Cleaning up session for ${currentPlayer.nickname} (${currentPlayer.id})`);
                playerSockets.delete(currentPlayer.id);
                if (currentRoom) {
                    handleDisconnect(socket, currentRoom, currentPlayer);
                }
            }
            else {
                console.log(`[Server] Disconnect ignored for ${currentPlayer.nickname} (old ghost socket)`);
            }
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
