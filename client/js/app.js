/**
 * Main Application Logic
 * Handles screen navigation and user interactions
 */

class App {
  constructor() {
    this.currentScreen = 'landing';
    this.nickname = '';
    this.playerId = null;
    this.roomId = null;
    this.room = null;
    this.gameState = null;
    this.isHost = false;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Initialize socket client
    window.socketClient.connect();
    
    // Register socket event listeners
    this.registerSocketListeners();
    
    // Setup UI event listeners
    this.setupEventListeners();
    
    // Setup language toggle
    this.setupLanguageToggle();
    
    console.log('[App] Initialized');
  }

  /**
   * Register socket event listeners
   */
  registerSocketListeners() {
    const socket = window.socketClient;

    socket.on('connect', () => {
      this.hideErrorToast();
    });

    socket.on('disconnect', () => {
      this.showErrorToast('Disconnected from server');
    });

    socket.on('error', (data) => {
      this.showErrorToast(data.message || 'Something went wrong');
    });

    socket.on('room_created', (data) => {
      this.roomId = data.roomId;
      this.showScreen('lobby');
    });

    socket.on('room_joined', (data) => {
      this.roomId = data.room.id;
      this.playerId = data.player.id;
      this.isHost = data.player.isHost;
      this.room = data.room;
      this.updateLobbyUI();
      this.showScreen('lobby');
    });

    socket.on('room_update', (data) => {
      this.room = data;
      this.updateLobbyUI();
      this.updateGameUI();
    });

    socket.on('player_joined', (data) => {
      const { t } = window.i18n;
      this.addChatSystemMessage(t('playerJoined', { name: data.player.nickname }));
    });

    socket.on('player_disconnected', (data) => {
      const player = this.room?.players.find(p => p.id === data.playerId);
      if (player) {
        const { t } = window.i18n;
        this.addChatSystemMessage(t('playerLeft', { name: player.nickname }));
      }
    });

    socket.on('player_reconnected', (data) => {
      const player = this.room?.players.find(p => p.id === data.playerId);
      if (player) {
        this.addChatSystemMessage(`${player.nickname} reconnected`);
      }
    });

    socket.on('game_started', () => {
      this.showScreen('game');
      this.hideCaptureModal();
    });

    socket.on('game_state', (data) => {
      this.gameState = data;
      this.updateGameUI();
    });

    socket.on('capture_options', (data) => {
      // Capture options are handled by gameUI
    });

    socket.on('chkobba', (data) => {
      window.gameUI.showChkobba(data.playerNickname);
    });

    socket.on('round_end', (data) => {
      window.gameUI.showRoundEndModal(data);
    });

    socket.on('game_over', (data) => {
      const scores = this.gameState?.scores || { team0: 0, team1: 0 };
      window.gameUI.showGameOverModal(data.winner, this.playerId, scores);
    });

    socket.on('auto_win_warning', (data) => {
      window.gameUI.showAutoWinWarning(data);
    });

    socket.on('auto_win', (data) => {
      window.gameUI.hideAutoWinWarning();
      const scores = this.gameState?.scores || { team0: 0, team1: 0 };
      window.gameUI.showGameOverModal(data.winner, this.playerId, scores);
    });

    socket.on('chat_message', (data) => {
      this.addChatMessage(data);
    });
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      window.i18n.toggleTheme();
    });

    // Language toggle
    document.getElementById('langToggle')?.addEventListener('click', () => {
      const currentLang = window.i18n.getLanguage();
      window.i18n.setLanguage(currentLang === 'en' ? 'tn' : 'en');
    });

    // Landing screen
    document.getElementById('playNowBtn')?.addEventListener('click', () => {
      this.handleNicknameSubmit();
    });

    document.getElementById('createRoomBtn')?.addEventListener('click', () => {
      if (this.handleNicknameSubmit()) {
        this.showScreen('createRoom');
      }
    });

    document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
      if (this.handleNicknameSubmit()) {
        this.showScreen('joinRoom');
      }
    });

    document.getElementById('nicknameInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleNicknameSubmit();
      }
    });

    // Create room screen
    document.getElementById('confirmCreateRoomBtn')?.addEventListener('click', () => {
      this.handleCreateRoom();
    });

    document.getElementById('cancelCreateRoomBtn')?.addEventListener('click', () => {
      this.showScreen('landing');
    });

    // Join room screen
    document.getElementById('confirmJoinRoomBtn')?.addEventListener('click', () => {
      this.handleJoinRoom();
    });

    document.getElementById('cancelJoinRoomBtn')?.addEventListener('click', () => {
      this.showScreen('landing');
    });

    document.getElementById('roomCodeInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleJoinRoom();
      }
    });

    // Lobby screen
    document.getElementById('readyBtn')?.addEventListener('click', () => {
      this.handleReady();
    });

    document.getElementById('startGameBtn')?.addEventListener('click', () => {
      window.socketClient.startGame();
    });

    document.getElementById('leaveLobbyBtn')?.addEventListener('click', () => {
      this.handleLeaveLobby();
    });

    document.getElementById('copyRoomCodeBtn')?.addEventListener('click', () => {
      this.copyRoomCode();
    });

    // Game screen
    document.getElementById('newGameBtn')?.addEventListener('click', () => {
      window.gameUI.hideGameOverModal();
      this.showScreen('landing');
    });

    document.getElementById('rematchBtn')?.addEventListener('click', () => {
      window.gameUI.hideGameOverModal();
      // Request a rematch (new game with same players, reset scores)
      window.socketClient.startGame();
    });

    document.getElementById('continueBtn')?.addEventListener('click', () => {
      window.gameUI.hideRoundEndModal();
    });

    // Chat
    document.getElementById('chatToggleBtn')?.addEventListener('click', () => {
      this.toggleChat();
    });

    document.getElementById('chatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendChatMessage();
    });

    // Enter key on nickname inputs
    document.getElementById('roomCodeInput')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  /**
   * Setup language toggle button text
   */
  setupLanguageToggle() {
    // Initial text is set by i18n.js
  }

  /**
   * Handle nickname submission
   * @returns {boolean} Success
   */
  handleNicknameSubmit() {
    const input = document.getElementById('nicknameInput');
    this.nickname = input?.value?.trim() || '';
    
    if (!this.nickname) {
      this.showErrorToast('Please enter a nickname');
      return false;
    }
    
    if (this.nickname.length < 2) {
      this.showErrorToast('Nickname must be at least 2 characters');
      return false;
    }
    
    return true;
  }

  /**
   * Handle create room
   */
  handleCreateRoom() {
    const targetScore = parseInt(document.getElementById('targetScoreSelect')?.value || '21');
    const maxPlayers = parseInt(document.getElementById('maxPlayersSelect')?.value || '2');
    
    window.socketClient.createRoom(this.nickname, targetScore, maxPlayers);
  }

  /**
   * Handle join room
   */
  handleJoinRoom() {
    const roomCode = document.getElementById('roomCodeInput')?.value?.trim() || '';
    
    if (!roomCode) {
      this.showErrorToast('Please enter a room code');
      return;
    }
    
    if (roomCode.length !== 8) {
      this.showErrorToast('Room code must be 8 characters');
      return;
    }
    
    window.socketClient.joinRoom(roomCode, this.nickname);
  }

  /**
   * Handle ready button
   */
  handleReady() {
    window.socketClient.setReady();
  }

  /**
   * Handle leave lobby
   */
  handleLeaveLobby() {
    window.socketClient.leaveRoom();
    this.roomId = null;
    this.playerId = null;
    this.room = null;
    this.gameState = null;
    this.showScreen('landing');
  }

  /**
   * Copy room code to clipboard
   */
  copyRoomCode() {
    const roomCode = document.getElementById('lobbyRoomCode')?.textContent || '';
    navigator.clipboard?.writeText(roomCode).then(() => {
      this.showToast('Room code copied!', 'success');
    }).catch(() => {
      this.showErrorToast('Failed to copy');
    });
  }

  /**
   * Update lobby UI
   */
  updateLobbyUI() {
    if (!this.room) return;

    // Update room info
    document.getElementById('lobbyRoomCode').textContent = this.room.id;
    document.getElementById('lobbyTargetScore').textContent = this.room.targetScore;
    document.getElementById('lobbyMaxPlayers').textContent = 
      `${this.room.maxPlayers} Players`;

    // Update players list
    const playersList = document.getElementById('lobbyPlayersList');
    if (playersList) {
      playersList.innerHTML = '';
      
      this.room.players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = 'player-item';
        if (!player.isConnected) {
          playerEl.classList.add('disconnected');
        }
        
        let badges = '';
        if (player.isHost) {
          badges += `<span class="host-badge">${window.i18n.t('hostBadge')}</span>`;
        }
        if (player.isReady) {
          badges += `<span class="ready-badge">${window.i18n.t('ready')}</span>`;
        }
        
        playerEl.innerHTML = `
          <div class="player-name">
            <span>${this.escapeHtml(player.nickname)}</span>
            ${badges}
          </div>
          <span class="team-badge team${player.team}">Team ${player.team + 1}</span>
        `;
        
        playersList.appendChild(playerEl);
      });
    }

    // Update buttons
    const readyBtn = document.getElementById('readyBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const waitingMessage = document.getElementById('waitingMessage');
    
    if (readyBtn && startGameBtn) {
      const player = this.room.players.find(p => p.id === this.playerId);
      const isReady = player?.isReady;
      
      readyBtn.textContent = isReady ? '✓ Ready' : window.i18n.t('ready');
      readyBtn.disabled = isReady;
      
      // Show start button for host
      startGameBtn.style.display = this.isHost && this.room.players.length >= 2 ? 'block' : 'none';
    }
    
    if (waitingMessage) {
      waitingMessage.style.display = this.room.players.length < 2 ? 'block' : 'none';
    }
  }

  /**
   * Update game UI
   */
  updateGameUI() {
    if (!this.gameState || !this.playerId) return;
    
    window.gameUI.updateGameState(this.gameState, this.playerId);
  }

  /**
   * Handle card selection
   * @param {number} index - Card index
   */
  onCardSelected(index) {
    if (!this.gameState) return;
    
    // If card already selected, play it
    if (window.gameUI.selectedCardIndex === index) {
      window.socketClient.playCard(index);
      window.gameUI.clearSelectedCard();
    } else {
      window.gameUI.setSelectedCard(index);
    }
  }

  /**
   * Handle capture confirmation
   * @param {number} optionIndex - Selected option index
   */
  onCaptureConfirmed(optionIndex) {
    window.socketClient.selectCapture(optionIndex);
    window.gameUI.hideCaptureModal();
    window.gameUI.clearSelectedCard();
  }

  /**
   * Hide capture modal
   */
  hideCaptureModal() {
    window.gameUI.hideCaptureModal();
  }

  /**
   * Get player team
   * @param {string} playerId - Player ID
   * @returns {number} Team number
   */
  getPlayerTeam(playerId) {
    const player = this.gameState?.players.find(p => p.id === playerId);
    return player?.team ?? 0;
  }

  /**
   * Toggle chat panel
   */
  toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.classList.toggle('active');
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input?.value?.trim() || '';
    
    if (!message) return;
    
    window.socketClient.sendChatMessage(message);
    
    if (input) {
      input.value = '';
    }
  }

  /**
   * Add chat message to UI
   * @param {Object} data - Chat message data
   */
  addChatMessage(data) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    
    if (data.isSystem) {
      messageEl.classList.add('system');
      messageEl.innerHTML = `<span>${this.escapeHtml(data.message)}</span>`;
    } else {
      const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      messageEl.innerHTML = `
        <span class="message-sender">${this.escapeHtml(data.playerNickname)}</span>
        <span class="message-text">${this.escapeHtml(data.message)}</span>
        <span class="message-time">${time}</span>
      `;
    }
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /**
   * Add system message to chat
   * @param {string} message - System message
   */
  addChatSystemMessage(message) {
    this.addChatMessage({
      isSystem: true,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Show screen
   * @param {string} screenName - Screen to show
   */
  showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(`${screenName}Screen`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.currentScreen = screenName;
    }
    
    // Show/hide chat based on screen
    const chatPanel = document.getElementById('chatPanel');
    if (chatPanel) {
      chatPanel.style.display = screenName === 'game' ? 'flex' : 'none';
    }
  }

  /**
   * Show error toast
   * @param {string} message - Error message
   */
  showErrorToast(message) {
    this.showToast(message, 'error');
  }

  /**
   * Show toast notification
   * @param {string} message - Message
   * @param {string} type - Type (error, success, info)
   */
  showToast(message, type = 'error') {
    const toast = document.getElementById('errorToast');
    const messageEl = document.getElementById('errorMessage');
    
    if (!toast || !messageEl) return;
    
    toast.className = `toast ${type}`;
    messageEl.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
      toast.classList.remove('active');
    }, 5000);
  }

  /**
   * Hide error toast
   */
  hideErrorToast() {
    const toast = document.getElementById('errorToast');
    if (toast) {
      toast.classList.remove('active');
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make app globally accessible
window.app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
