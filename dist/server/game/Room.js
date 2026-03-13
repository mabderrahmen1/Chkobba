/**
 * Room management
 * Handles player joining, leaving, and team assignment
 */
import config from '../config.js';
/**
 * Generate a unique player ID
 * @returns {string} Player ID
 */
export function generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Room class
 * Manages players and room state
 */
export class Room {
    id;
    hostId;
    targetScore;
    maxPlayers;
    turnTimeout;
    status;
    players;
    createdAt;
    lastActivity;
    disconnectTimer = null;
    chatHistory = [];
    gameType = 'chkobba';
    /**
     * Create a new room
     * @param {string} id - Room code
     * @param {string} hostId - Host player ID
     * @param {number} targetScore - Target score to win
     * @param {number} maxPlayers - Maximum players (2 or 4)
     * @param {GameType} gameType - Type of game to play
     */
    constructor(id, hostId, targetScore, maxPlayers, gameType, turnTimeout) {
        this.id = id;
        this.hostId = hostId;
        this.targetScore = targetScore || config.DEFAULT_TARGET_SCORE;
        this.maxPlayers = maxPlayers || 2;
        this.turnTimeout = turnTimeout ?? config.DEFAULT_TURN_TIMEOUT;
        this.status = config.GAME_STATUS.LOBBY;
        this.players = [];
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.disconnectTimer = null;
        this.chatHistory = [];
        this.gameType = gameType || 'chkobba';
    }
    /**
     * Add a player to the room
     * @param {string} nickname - Player nickname
     * @param {string|null} rejoinId - ID of player to rejoin as (optional)
     * @returns {Object} { player, error }
     */
    addPlayer(nickname, rejoinId = null) {
        // Check if rejoining by ID
        if (rejoinId) {
            const existingPlayer = this.players.find(p => p.id === rejoinId);
            if (existingPlayer) {
                existingPlayer.isConnected = true;
                existingPlayer.nickname = nickname;
                this.lastActivity = Date.now();
                console.log(`[Room ${this.id}] Player reconnected by ID: ${nickname}`);
                return { player: existingPlayer, error: null };
            }
        }
        // Auto-detect rejoin by nickname if disconnected
        const disconnectedSameName = this.players.find(p => !p.isConnected && p.nickname.toLowerCase() === nickname.toLowerCase());
        if (disconnectedSameName) {
            disconnectedSameName.isConnected = true;
            this.lastActivity = Date.now();
            console.log(`[Room ${this.id}] Player reconnected by nickname: ${nickname}`);
            return { player: disconnectedSameName, error: null };
        }
        // Check if nickname is taken by an ACTIVE player
        const nicknameTaken = this.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase() && p.isConnected);
        if (nicknameTaken) {
            return { player: null, error: 'Nickname already taken' };
        }
        // Check if room is full (only if not rejoining)
        if (this.players.length >= this.maxPlayers) {
            return { player: null, error: 'Room is full' };
        }
        // Create new player
        const player = {
            id: generatePlayerId(),
            nickname,
            team: this.calculateTeam(),
            isHost: this.players.length === 0,
            isConnected: true,
            isReady: false,
            handCount: 0,
            capturedCount: 0,
            chkobbaCount: 0,
            dinariCount: 0,
            sevensCount: 0,
            hasHaya: false,
            wins: 0,
            losses: 0
        };
        if (player.isHost) {
            this.hostId = player.id;
        }
        this.players.push(player);
        this.lastActivity = Date.now();
        console.log(`[Room ${this.id}] Player joined: ${nickname} (team ${player.team})`);
        return { player, error: null };
    }
    /**
     * Calculate team for new player
     * @returns {number} Team number (0 or 1)
     */
    calculateTeam() {
        if (this.maxPlayers === 2) {
            // 2-player: alternating teams
            return this.players.length % 2;
        }
        else {
            // 4-player: first 2 on team 0, next 2 on team 1
            return this.players.length < 2 ? 0 : 1;
        }
    }
    /**
     * Remove a player from the room (mark as disconnected)
     * @param {string} playerId - Player ID
     * @param {boolean} permanent - If true, remove from players array entirely
     * @returns {Player|null} The removed player or null
     */
    removePlayer(playerId, permanent = false) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1)
            return null;
        const player = this.players[index];
        const wasHost = player.isHost;
        player.isConnected = false;
        if (permanent) {
            this.players.splice(index, 1);
        }
        this.lastActivity = Date.now();
        console.log(`[Room ${this.id}] Player ${permanent ? 'removed' : 'disconnected'}: ${player.nickname}`);
        // If host left, assign new host to another CONNECTED player
        if (wasHost) {
            player.isHost = false;
            const nextHost = this.players.find(p => p.isConnected);
            if (nextHost) {
                nextHost.isHost = true;
                this.hostId = nextHost.id;
                console.log(`[Room ${this.id}] New host assigned: ${nextHost.nickname}`);
            }
        }
        return player;
    }
    /**
     * Update room settings (Host only)
     */
    updateSettings(maxPlayers, gameType, targetScore, turnTimeout) {
        // If switching from 4-player to 2-player, reset teams
        if (this.maxPlayers === 4 && maxPlayers === 2) {
            this.players.forEach((p, i) => {
                p.team = i % 2;
            });
        }
        // Remove excess bots if player count reduced
        while (this.players.filter(p => p.isBot).length > 0 && this.players.length > maxPlayers) {
            const lastBotIdx = this.players.map(p => p.isBot).lastIndexOf(true);
            if (lastBotIdx !== -1)
                this.players.splice(lastBotIdx, 1);
        }
        this.maxPlayers = maxPlayers;
        this.gameType = gameType;
        this.targetScore = targetScore;
        this.turnTimeout = turnTimeout;
        this.lastActivity = Date.now();
    }
    /**
     * Mark a player as ready
     * @param {string} playerId - Player ID
     * @param {boolean} isReady
     * @returns {boolean} True if successful
     */
    setReady(playerId, isReady) {
        const player = this.players.find(p => p.id === playerId);
        if (!player)
            return false;
        player.isReady = isReady;
        this.lastActivity = Date.now();
        return true;
    }
    /**
     * Check if all players are ready
     * @returns {boolean}
     */
    allPlayersReady() {
        if (this.players.length < 2)
            return false;
        // Bots are always considered ready; only check human players
        return this.players.every(p => p.isBot || (p.isConnected && p.isReady));
    }
    /**
     * Get connected players
     * @returns {Player[]}
     */
    getConnectedPlayers() {
        return this.players.filter(p => p.isConnected);
    }
    /**
     * Get players by team
     * @param {number} team - Team number
     * @returns {Player[]}
     */
    getTeam(team) {
        return this.players.filter(p => p.team === team);
    }
    /**
     * Add a chat message to history
     * @param {string} playerId - Player ID
     * @param {string} message - Message text
     * @param {boolean} isSystem - Is this a system message
     */
    addChatMessage(playerId, message, isSystem = false) {
        this.chatHistory.push({
            playerId,
            message,
            isSystem,
            timestamp: Date.now()
        });
        // Keep only last 50 messages
        if (this.chatHistory.length > 50) {
            this.chatHistory.shift();
        }
        this.lastActivity = Date.now();
    }
    /**
     * Get chat history
     * @returns {ChatMessage[]}
     */
    getChatHistory() {
        return this.chatHistory;
    }
    /**
     * Get a sanitized room state for clients
     * @returns {RoomState}
     */
    toPublicState() {
        return {
            id: this.id,
            hostId: this.hostId,
            targetScore: this.targetScore,
            maxPlayers: this.maxPlayers,
            turnTimeout: this.turnTimeout,
            status: this.status,
            players: this.players.map(p => ({
                ...p,
                wins: p.wins || 0,
                losses: p.losses || 0
            })),
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            gameType: this.gameType
        };
    }
}
export default Room;
