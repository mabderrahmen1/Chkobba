/**
 * In-memory room storage
 * Handles room creation, retrieval, and cleanup
 */
import config from './config.js';
import Room from './game/Room.js';
// Store rooms in memory
const rooms = new Map();
// Cleanup timer reference
let cleanupTimer = null;
/**
 * Generate a random room code
 * @returns {string} 8-character room code
 */
function generateRoomCode() {
    let code = '';
    for (let i = 0; i < config.ROOM_CODE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * config.ROOM_CODE_CHARS.length);
        code += config.ROOM_CODE_CHARS[randomIndex];
    }
    return code;
}
/**
 * Create a new room
 * @param {string} hostId - Host player ID
 * @param {number} targetScore - Target score to win
 * @param {number} maxPlayers - Maximum players (2 or 4)
 * @param {GameType} gameType - Type of game to play
 * @returns {Room} The created room
 */
export function createRoom(hostId, targetScore, maxPlayers, gameType = 'chkobba') {
    let roomCode;
    do {
        roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
    const room = new Room(roomCode, hostId, targetScore, maxPlayers, gameType);
    rooms.set(roomCode, room);
    console.log(`[Store] Room created: ${roomCode} by ${hostId} (${gameType})`);
    return room;
}
/**
 * Get a room by code
 * @param {string} roomCode - Room code
 * @returns {Room|null} The room or null if not found
 */
export function getRoom(roomCode) {
    return rooms.get(roomCode) || null;
}
/**
 * Delete a room
 * @param {string} roomCode - Room code
 * @returns {boolean} True if deleted
 */
export function deleteRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (room) {
        if (room.disconnectTimer)
            clearTimeout(room.disconnectTimer);
        rooms.delete(roomCode);
        console.log(`[Store] Room deleted: ${roomCode}`);
        return true;
    }
    return false;
}
/**
 * Update room last activity timestamp
 * @param {string} roomCode - Room code
 */
export function touchRoom(roomCode) {
    const room = rooms.get(roomCode);
    if (room) {
        room.lastActivity = Date.now();
    }
}
/**
 * Get all rooms (for cleanup)
 * @returns {Map<string, Room>} All rooms
 */
export function getAllRooms() {
    return rooms;
}
/**
 * Start the cleanup timer for abandoned rooms
 */
export function startCleanupTimer() {
    if (cleanupTimer)
        return;
    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [code, room] of rooms.entries()) {
            if (now - room.lastActivity > 30 * 60 * 1000) {
                console.log(`[Store] Cleaning up abandoned room: ${code}`);
                rooms.delete(code);
            }
        }
    }, config.CLEANUP_INTERVAL_MS);
    console.log('[Store] Cleanup timer started');
}
/**
 * Stop the cleanup timer
 */
export function stopCleanupTimer() {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }
}
export default {
    createRoom,
    getRoom,
    deleteRoom,
    touchRoom,
    getAllRooms,
    startCleanupTimer,
    stopCleanupTimer
};
