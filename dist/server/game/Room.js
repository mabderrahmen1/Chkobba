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
    status;
    players;
    createdAt;
    lastActivity;
    disconnectTimer = null;
    chatHistory = [];
    /**
     * Create a new room
     * @param {string} id - Room code
     * @param {string} hostId - Host player ID
     * @param {number} targetScore - Target score to win
     * @param {number} maxPlayers - Maximum players (2 or 4)
     */
    constructor(id, hostId, targetScore, maxPlayers) {
        this.id = id;
        this.hostId = hostId;
        this.targetScore = targetScore || config.DEFAULT_TARGET_SCORE;
        this.maxPlayers = maxPlayers || 2;
        this.status = config.GAME_STATUS.LOBBY;
        this.players = [];
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.disconnectTimer = null;
        this.chatHistory = [];
    }
    /**
     * Add a player to the room
     * @param {string} nickname - Player nickname
     * @param {string|null} rejoinId - ID of player to rejoin as (optional)
     * @returns {Object} { player, error }
     */
    addPlayer(nickname, rejoinId = null) {
        // Check if rejoining
        if (rejoinId) {
            const existingPlayer = this.players.find(p => p.id === rejoinId);
            if (existingPlayer) {
                existingPlayer.isConnected = true;
                existingPlayer.nickname = nickname; // Update nickname if changed
                this.lastActivity = Date.now();
                console.log(`[Room ${this.id}] Player reconnected: ${nickname}`);
                return { player: existingPlayer, error: null };
            }
        }
        // Check if room is full
        if (this.players.length >= this.maxPlayers) {
            return { player: null, error: 'Room is full' };
        }
        // Check if nickname is taken (for non-disconnected players)
        const nicknameTaken = this.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase() && p.isConnected);
        if (nicknameTaken) {
            return { player: null, error: 'Nickname already taken' };
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
            chkobbaCount: 0
        };
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
     * Remove a player from the room
     * @param {string} playerId - Player ID
     * @returns {Player|null} The removed player or null
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1)
            return null;
        const player = this.players[index];
        player.isConnected = false;
        this.lastActivity = Date.now();
        console.log(`[Room ${this.id}] Player disconnected: ${player.nickname}`);
        // If host disconnected, assign new host
        if (player.isHost) {
            const connectedPlayer = this.players.find(p => p.id !== playerId && p.isConnected);
            if (connectedPlayer) {
                connectedPlayer.isHost = true;
            }
        }
        return player;
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
        return this.players.every(p => p.isConnected && p.isReady);
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
            status: this.status,
            players: this.players.map(p => ({ ...p })),
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }
}
export default Room;
