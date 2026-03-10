/**
 * Socket.IO Client
 * Handles WebSocket communication with the server
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.eventListeners = new Map();
    this.connected = false;
    this.playerId = null;
    this.roomId = null;
  }

  /**
   * Connect to the server
   */
  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.connected = true;
      this.emitEvent('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      this.connected = false;
      this.emitEvent('disconnect');
    });

    this.socket.on('error', (data) => {
      console.error('[Socket] Error:', data);
      this.emitEvent('error', data);
    });

    // Room events
    this.socket.on('room_created', (data) => {
      console.log('[Socket] Room created:', data);
      this.roomId = data.roomId;
      this.emitEvent('room_created', data);
    });

    this.socket.on('room_joined', (data) => {
      console.log('[Socket] Room joined:', data);
      this.roomId = data.room.id;
      this.playerId = data.player.id;
      this.emitEvent('room_joined', data);
    });

    this.socket.on('room_update', (data) => {
      console.log('[Socket] Room updated:', data);
      this.emitEvent('room_update', data);
    });

    this.socket.on('player_joined', (data) => {
      console.log('[Socket] Player joined:', data);
      this.emitEvent('player_joined', data);
    });

    this.socket.on('player_disconnected', (data) => {
      console.log('[Socket] Player disconnected:', data);
      this.emitEvent('player_disconnected', data);
    });

    this.socket.on('player_reconnected', (data) => {
      console.log('[Socket] Player reconnected:', data);
      this.emitEvent('player_reconnected', data);
    });

    // Game events
    this.socket.on('game_started', () => {
      console.log('[Socket] Game started');
      this.emitEvent('game_started');
    });

    this.socket.on('game_state', (data) => {
      console.log('[Socket] Game state:', data);
      this.emitEvent('game_state', data);
    });

    this.socket.on('turn_change', (data) => {
      console.log('[Socket] Turn changed:', data);
      this.emitEvent('turn_change', data);
    });

    this.socket.on('capture_options', (data) => {
      console.log('[Socket] Capture options:', data);
      this.emitEvent('capture_options', data);
    });

    this.socket.on('capture_result', (data) => {
      console.log('[Socket] Capture result:', data);
      this.emitEvent('capture_result', data);
    });

    this.socket.on('chkobba', (data) => {
      console.log('[Socket] Chkobba!', data);
      this.emitEvent('chkobba', data);
    });

    this.socket.on('round_end', (data) => {
      console.log('[Socket] Round ended:', data);
      this.emitEvent('round_end', data);
    });

    this.socket.on('game_over', (data) => {
      console.log('[Socket] Game over:', data);
      this.emitEvent('game_over', data);
    });

    this.socket.on('auto_win_warning', (data) => {
      console.log('[Socket] Auto win warning:', data);
      this.emitEvent('auto_win_warning', data);
    });

    this.socket.on('auto_win', (data) => {
      console.log('[Socket] Auto win:', data);
      this.emitEvent('auto_win', data);
    });

    // Chat events
    this.socket.on('chat_message', (data) => {
      this.emitEvent('chat_message', data);
    });

    // Setup complete
    console.log('[Socket] Event listeners registered');
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emitEvent(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[Socket] Error in ${event} listener:`, err);
        }
      });
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.connected) {
      console.warn('[Socket] Not connected, cannot emit:', event);
      return;
    }
    console.log('[Socket] Emitting:', event, data);
    this.socket.emit(event, data);
  }

  // ==================== Room Actions ====================

  /**
   * Create a new room
   * @param {string} nickname - Player nickname
   * @param {number} targetScore - Target score
   * @param {number} maxPlayers - Maximum players
   */
  createRoom(nickname, targetScore, maxPlayers) {
    this.emit('create_room', { nickname, targetScore, maxPlayers });
  }

  /**
   * Join an existing room
   * @param {string} roomId - Room code
   * @param {string} nickname - Player nickname
   */
  joinRoom(roomId, nickname) {
    this.emit('join_room', { roomId, nickname });
  }

  /**
   * Rejoin a room after disconnect
   * @param {string} roomId - Room code
   * @param {string} nickname - Player nickname
   */
  rejoinRoom(roomId, nickname) {
    this.emit('rejoin_room', { roomId, nickname });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    this.emit('leave_room');
    this.roomId = null;
    this.playerId = null;
  }

  /**
   * Mark player as ready
   */
  setReady() {
    this.emit('player_ready');
  }

  /**
   * Start the game (host only)
   */
  startGame() {
    this.emit('start_game');
  }

  // ==================== Game Actions ====================

  /**
   * Play a card
   * @param {number} cardIndex - Index of card in hand
   */
  playCard(cardIndex) {
    this.emit('play_card', { cardIndex });
  }

  /**
   * Select capture option
   * @param {number} optionIndex - Index of capture option
   */
  selectCapture(optionIndex) {
    this.emit('select_capture', { optionIndex });
  }

  // ==================== Chat Actions ====================

  /**
   * Send chat message
   * @param {string} message - Message text
   */
  sendChatMessage(message) {
    this.emit('chat_message', { message });
  }

  /**
   * Get current player ID
   * @returns {string|null}
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Get current room ID
   * @returns {string|null}
   */
  getRoomId() {
    return this.roomId;
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }
}

// Create global instance
window.socketClient = new SocketClient();
