/**
 * Server configuration
 * All environment variables and constants are defined here
 */
import { GAME_STATUS, INITIAL_HAND_SIZE, INITIAL_TABLE_CARDS, DEFAULT_TARGET_SCORE } from '../shared/rules.js';
export const config = {
    // Server port (Render will override this with process.env.PORT)
    PORT: process.env.PORT || 3000,
    // Node environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Disconnect timeout: 5 minutes before auto-win
    DISCONNECT_TIMEOUT_MS: 5 * 60 * 1000,
    // Default turn timeout in seconds (0 = off)
    DEFAULT_TURN_TIMEOUT: 60,
    // Warning before auto-win (1 minute before)
    AUTO_WIN_WARNING_MS: 4 * 60 * 1000,
    // Room code configuration
    ROOM_CODE_LENGTH: 8,
    ROOM_CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // No I, O, 0, 1 to avoid confusion
    // Game defaults
    DEFAULT_TARGET_SCORE,
    AVAILABLE_TARGET_SCORES: [11, 21, 31],
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 4,
    // Card dealing
    INITIAL_HAND_SIZE,
    INITIAL_TABLE_CARDS,
    // Cleanup interval for abandoned rooms (10 minutes)
    CLEANUP_INTERVAL_MS: 10 * 60 * 1000,
    // Game status
    GAME_STATUS
};
export default config;
