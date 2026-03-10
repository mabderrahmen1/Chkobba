/**
 * Game UI Rendering
 * Handles all game-related UI updates
 */

class GameUI {
  constructor() {
    this.currentGameState = null;
    this.selectedCardIndex = null;
  }

  /**
   * Create card HTML element using SVG
   * @param {Object} card - Card object
   * @param {boolean} faceDown - Show card back
   * @param {boolean} selectable - Card is clickable
   * @param {number} index - Card index in hand
   * @returns {HTMLElement} Card element
   */
  createCardElement(card, faceDown = false, selectable = false, index = -1) {
    // Use SVG card generator if available
    if (window.cardSVG) {
      return window.cardSVG.createCardElement(card, faceDown, selectable, index);
    }

    // Fallback to CSS cards
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    if (faceDown) {
      cardEl.classList.add('card-back');
      cardEl.textContent = '🃏';
      return cardEl;
    }

    cardEl.classList.add(card.suit);

    if (selectable && index >= 0) {
      cardEl.dataset.cardIndex = index;
      cardEl.addEventListener('click', () => this.onCardClick(index));
    }

    if (this.selectedCardIndex === index) {
      cardEl.classList.add('selected');
    }

    return cardEl;
  }

  /**
   * Handle card click
   * @param {number} index - Card index
   */
  onCardClick(index) {
    if (window.app) {
      window.app.onCardSelected(index);
    }
  }

  /**
   * Render player's hand
   * @param {Array} hand - Player's cards
   * @param {boolean} canPlay - Player can play cards
   */
  renderHand(hand, canPlay = false) {
    const handEl = document.getElementById('playerHand');
    if (!handEl) return;

    handEl.innerHTML = '';
    
    hand.forEach((card, index) => {
      const cardEl = this.createCardElement(card, false, canPlay, index);
      handEl.appendChild(cardEl);
    });
  }

  /**
   * Render table cards
   * @param {Array} tableCards - Cards on table
   */
  renderTableCards(tableCards) {
    const tableEl = document.getElementById('tableCards');
    if (!tableEl) return;

    tableEl.innerHTML = '';
    
    tableCards.forEach(card => {
      const cardEl = this.createCardElement(card, false, false);
      tableEl.appendChild(cardEl);
    });
  }

  /**
   * Render opponent info
   * @param {Array} players - All players
   * @param {string} currentPlayerId - Current player ID
   */
  renderOpponentInfo(players, currentPlayerId) {
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return;

    // Filter opponents (not current player)
    const opponents = players.filter(p => p.id !== currentPlayerId);
    
    // Check if 4-player game
    const is4Player = players.length >= 4;
    
    // Show/hide side zones for 4-player
    const leftZone = document.getElementById('leftZone');
    const rightZone = document.getElementById('rightZone');
    const topZone = document.getElementById('topZone');
    
    if (leftZone && rightZone) {
      leftZone.style.display = is4Player ? 'flex' : 'none';
      rightZone.style.display = is4Player ? 'flex' : 'none';
    }

    if (is4Player) {
      // 4-player: teammate on top, opponents on sides
      const teammate = opponents.find(p => p.team === currentPlayer.team);
      const leftOpponent = opponents.find(p => p.team !== currentPlayer.team);
      const rightOpponent = opponents.find(p => p.team !== currentPlayer.team && p.id !== leftOpponent?.id);

      if (topZone && teammate) {
        document.getElementById('topPlayerName').textContent = teammate.nickname;
        document.getElementById('topPlayerCardCount').textContent = teammate.handCount;
      }
      if (leftOpponent) {
        document.getElementById('leftPlayerName').textContent = leftOpponent.nickname;
        document.getElementById('leftPlayerCardCount').textContent = leftOpponent.handCount;
      }
      if (rightOpponent) {
        document.getElementById('rightPlayerName').textContent = rightOpponent.nickname;
        document.getElementById('rightPlayerCardCount').textContent = rightOpponent.handCount;
      }
    } else {
      // 2-player: opponent on top
      const opponent = opponents[0];
      if (topZone && opponent) {
        document.getElementById('topPlayerName').textContent = opponent.nickname;
        document.getElementById('topPlayerCardCount').textContent = opponent.handCount;
      }
    }
  }

  /**
   * Update scores
   * @param {Object} scores - Team scores
   * @param {Object} gameState - Full game state for captured counts
   */
  updateScores(scores, gameState) {
    const scoreTeam0 = document.getElementById('scoreTeam0');
    const scoreTeam1 = document.getElementById('scoreTeam1');
    const capturedPileTeam0 = document.querySelector('#capturedPileTeam0 .pile-count');
    const capturedPileTeam1 = document.querySelector('#capturedPileTeam1 .pile-count');

    if (scoreTeam0) scoreTeam0.textContent = scores.team0;
    if (scoreTeam1) scoreTeam1.textContent = scores.team1;
    
    // Update captured piles if game state is provided
    if (gameState && gameState.players) {
      const team0Captured = gameState.players
        .filter(p => p.team === 0)
        .reduce((sum, p) => sum + p.capturedCount, 0);
      const team1Captured = gameState.players
        .filter(p => p.team === 1)
        .reduce((sum, p) => sum + p.capturedCount, 0);
      
      if (capturedPileTeam0) capturedPileTeam0.textContent = team0Captured;
      if (capturedPileTeam1) capturedPileTeam1.textContent = team1Captured;
    }
  }

  /**
   * Update target score display
   * @param {number} targetScore - Target score
   */
  updateTargetScore(targetScore) {
    const targetEl = document.getElementById('targetScoreDisplay');
    if (targetEl) targetEl.textContent = targetScore;
  }

  /**
   * Update round number
   * @param {number} round - Round number
   */
  updateRoundNumber(round) {
    const roundEl = document.getElementById('roundNumber');
    if (roundEl) roundEl.textContent = round;
  }

  /**
   * Update turn indicator
   * @param {string} currentTurn - Current player ID
   * @param {string} playerId - Current player's ID
   */
  updateTurnIndicator(currentTurn, playerId) {
    const turnEl = document.getElementById('turnIndicator');
    if (!turnEl) return;

    const { t } = window.i18n;
    
    if (currentTurn === playerId) {
      turnEl.textContent = t('yourTurn');
      turnEl.classList.remove('hidden');
    } else {
      turnEl.textContent = t('opponentTurn');
      turnEl.classList.add('hidden');
    }
  }

  /**
   * Update captured cards count
   * @param {number} count - Number of captured cards
   */
  updateCapturedCount(count) {
    const countEl = document.getElementById('playerCapturedCount');
    if (countEl) countEl.textContent = count;
  }

  /**
   * Show capture options modal
   * @param {Array} options - Capture options
   */
  showCaptureModal(options) {
    const modal = document.getElementById('captureModal');
    const optionsEl = document.getElementById('captureOptions');
    
    if (!modal || !optionsEl) return;

    const { t } = window.i18n;

    optionsEl.innerHTML = '';
    
    options.forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'capture-option';
      optionEl.addEventListener('click', () => this.onCaptureSelected(index));
      
      const cardsPreview = document.createElement('div');
      cardsPreview.className = 'cards-preview';
      
      option.cards.forEach(card => {
        const cardEl = this.createCardElement(card, false, false);
        cardsPreview.appendChild(cardEl);
      });
      
      const label = option.type === 'single' 
        ? t('captureSingle')
        : t('captureCombination', { count: option.cards.length });
      
      const labelEl = document.createElement('div');
      labelEl.className = 'option-label';
      labelEl.textContent = label;
      
      optionEl.appendChild(cardsPreview);
      optionEl.appendChild(labelEl);
      optionsEl.appendChild(optionEl);
    });

    modal.classList.add('active');
  }

  /**
   * Hide capture modal
   */
  hideCaptureModal() {
    const modal = document.getElementById('captureModal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.selectedCardIndex = null;
  }

  /**
   * Handle capture selection
   * @param {number} optionIndex - Selected option index
   */
  onCaptureSelected(optionIndex) {
    if (window.app) {
      window.app.onCaptureConfirmed(optionIndex);
    }
  }

  /**
   * Show round end modal
   * @param {Object} roundResult - Round scoring result
   */
  showRoundEndModal(roundResult) {
    const modal = document.getElementById('roundEndModal');
    const breakdownEl = document.getElementById('scoreBreakdown');

    if (!modal || !breakdownEl) return;

    const { t } = window.i18n;
    const breakdown = roundResult.breakdown;

    breakdownEl.innerHTML = `
      ${this.renderScoreCategory(t('carta'), breakdown.carta)}
      ${this.renderScoreCategory(t('dinari'), breakdown.dinari)}
      ${this.renderScoreCategory(t('bermila'), breakdown.bermila)}
      ${this.renderScoreCategory(t('sabaaElHaya'), breakdown.sabaaElHaya)}
      ${this.renderScoreCategory(t('chkobba'), breakdown.chkobba)}
      <div class="score-category" style="margin-top: 1rem; border-top: 2px solid var(--border-color); padding-top: 1rem;">
        <span class="category-name" style="font-weight: bold;">${t('roundOver')}</span>
        <span class="category-score team0">${roundResult.totals.team0}</span>
        <span class="category-score team1">${roundResult.totals.team1}</span>
      </div>
    `;

    modal.classList.add('active');
    // Don't auto-hide - user clicks Continue
  }

  /**
   * Render score category row
   * @param {string} name - Category name
   * @param {Object} scores - Category scores
   * @returns {string} HTML
   */
  renderScoreCategory(name, scores) {
    return `
      <div class="score-category">
        <span class="category-name">${name}</span>
        <span class="category-score team0">${scores.team0}</span>
        <span class="category-score team1">${scores.team1}</span>
      </div>
    `;
  }

  /**
   * Hide round end modal
   */
  hideRoundEndModal() {
    const modal = document.getElementById('roundEndModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Show game over modal
   * @param {Object} winner - Winner info
   * @param {string} playerId - Current player ID
   * @param {Object} scores - Final scores
   */
  showGameOverModal(winner, playerId, scores) {
    const modal = document.getElementById('gameOverModal');
    const titleEl = document.getElementById('gameOverTitle');
    const messageEl = document.getElementById('gameOverMessage');
    const finalScoresEl = document.getElementById('finalScores');

    if (!modal || !titleEl || !messageEl) return;

    const { t } = window.i18n;

    titleEl.textContent = t('gameOver');

    // Show winner message
    if (winner) {
      const playerTeam = window.app?.getPlayerTeam(playerId);
      const winningTeam = winner.team;

      if (playerTeam === winningTeam) {
        messageEl.textContent = t('youWin');
        messageEl.style.color = 'var(--accent-success)';
      } else {
        messageEl.textContent = t('youLose');
        messageEl.style.color = 'var(--accent-danger)';
      }
    }

    // Show final scores
    if (scores && finalScoresEl) {
      finalScoresEl.innerHTML = `
        <div class="final-score-row team0">
          <span class="team-name">${t('team1')}</span>
          <span class="score-value">${scores.team0}</span>
        </div>
        <div class="final-score-row team1">
          <span class="team-name">${t('team2')}</span>
          <span class="score-value">${scores.team1}</span>
        </div>
      `;
    }

    modal.classList.add('active');
  }

  /**
   * Hide game over modal
   */
  hideGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Show auto win warning
   * @param {Object} data - Warning data
   */
  showAutoWinWarning(data) {
    const modal = document.getElementById('autoWinModal');
    const messageEl = document.getElementById('autoWinMessage');
    const countdownEl = document.getElementById('autoWinCountdown');
    
    if (!modal || !messageEl || !countdownEl) return;

    const { t } = window.i18n;

    messageEl.textContent = t('autoWinWarning', { 
      name: data.playerNickname,
      time: Math.round(data.timeRemaining / 1000)
    });

    modal.classList.add('active');

    // Update countdown
    let seconds = Math.round(data.timeRemaining / 1000);
    const interval = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(interval);
        this.hideAutoWinWarning();
      } else {
        countdownEl.textContent = `${seconds}s`;
      }
    }, 1000);
  }

  /**
   * Hide auto win warning
   */
  hideAutoWinWarning() {
    const modal = document.getElementById('autoWinModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Show Chkobba celebration
   * @param {string} playerNickname - Player who made Chkobba
   */
  showChkobba(playerNickname) {
    const { t } = window.i18n;
    window.app?.showToast(t('chkobbaMessage', { name: playerNickname }), 'success');
  }

  /**
   * Set selected card
   * @param {number} index - Card index
   */
  setSelectedCard(index) {
    this.selectedCardIndex = index;
    
    // Update visual selection
    const handEl = document.getElementById('playerHand');
    if (handEl) {
      const cards = handEl.querySelectorAll('.card');
      cards.forEach((card, i) => {
        if (i === index) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }
  }

  /**
   * Clear selected card
   */
  clearSelectedCard() {
    this.selectedCardIndex = null;
    
    const handEl = document.getElementById('playerHand');
    if (handEl) {
      handEl.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected');
      });
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

  /**
   * Update game state
   * @param {Object} gameState - Full game state
   * @param {string} playerId - Current player ID
   */
  updateGameState(gameState, playerId) {
    this.currentGameState = gameState;

    // Update all game UI elements
    this.updateScores(gameState.scores, gameState);
    this.updateRoundNumber(gameState.roundNumber);
    this.updateTargetScore(gameState.targetScore);
    this.renderTableCards(gameState.tableCards);
    this.renderOpponentInfo(gameState.players, playerId);
    this.updateTurnIndicator(gameState.currentTurn, playerId);

    // Update player info
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      this.updateCapturedCount(player.capturedCount);
      const nicknameEl = document.getElementById('playerNicknameDisplay');
      if (nicknameEl) nicknameEl.textContent = player.nickname;
    }

    // Render hand if available
    if (gameState.hand) {
      const canPlay = gameState.currentTurn === playerId && !gameState.pendingCapture;
      this.renderHand(gameState.hand, canPlay);
    }

    // Show table empty message if no cards
    const tableEmptyMsg = document.getElementById('tableEmptyMessage');
    if (tableEmptyMsg) {
      tableEmptyMsg.style.display = gameState.tableCards.length === 0 ? 'block' : 'none';
    }

    // Show capture modal if pending
    if (gameState.pendingCapture && gameState.pendingCapture.playerId === playerId) {
      this.showCaptureModal(gameState.pendingCapture.options);
    }
  }
}

// Create global instance
window.gameUI = new GameUI();
