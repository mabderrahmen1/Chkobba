/**
 * SVG Card Generator
 * Creates SVG playing cards using open-source design
 * Based on svg-cards (https://github.com/hayeah/svg-cards) - MIT License
 */

const SUITS = {
  hearts: { symbol: '♥', color: '#e94560', name: 'hearts' },
  diamonds: { symbol: '♦', color: '#e94560', name: 'diamonds' },
  clubs: { symbol: '♣', color: '#1a1a2e', name: 'clubs' },
  spades: { symbol: '♠', color: '#1a1a2e', name: 'spades' }
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];

/**
 * Generate SVG for a playing card
 * @param {string} rank - Card rank (A, 2-7, J, Q, K)
 * @param {string} suit - Card suit (hearts, diamonds, clubs, spades)
 * @returns {string} SVG string
 */
function generateCardSVG(rank, suit) {
  const suitData = SUITS[suit];
  const color = suitData.color;
  const symbol = suitData.symbol;
  
  // Center symbol based on rank
  let centerContent = '';
  
  if (['2', '3', '4', '5', '6'].includes(rank)) {
    // Multiple symbols for number cards
    centerContent = generatePips(rank, symbol, color);
  } else {
    // Single large symbol for face cards and others
    const fontSize = rank === 'A' ? '45' : '35';
    const yOffset = rank === 'A' ? '52' : '50';
    centerContent = `<text x="50" y="${yOffset}" font-size="${fontSize}" fill="${color}" text-anchor="middle">${symbol}</text>`;
    
    // Add rank for face cards
    if (['J', 'Q', 'K'].includes(rank)) {
      centerContent += `<text x="50" y="75" font-size="10" fill="${color}" text-anchor="middle">${getFaceName(rank)}</text>`;
    }
  }
  
  return `
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
      <!-- Card background -->
      <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="white" stroke="#ddd" stroke-width="2"/>
      
      <!-- Top left rank and suit -->
      <text x="18" y="22" font-size="16" font-weight="bold" fill="${color}" text-anchor="middle">${rank}</text>
      <text x="18" y="38" font-size="14" fill="${color}" text-anchor="middle">${symbol}</text>
      
      <!-- Center content -->
      ${centerContent}
      
      <!-- Bottom right rank and suit (rotated) -->
      <g transform="translate(82, 118) rotate(180)">
        <text x="0" y="0" font-size="16" font-weight="bold" fill="${color}" text-anchor="middle">${rank}</text>
        <text x="0" y="16" font-size="14" fill="${color}" text-anchor="middle">${symbol}</text>
      </g>
    </svg>
  `;
}

/**
 * Generate pips (symbols) for number cards
 */
function generatePips(rank, symbol, color) {
  const pipPositions = getPipPositions(rank);
  let pips = '';
  
  for (const pos of pipPositions) {
    pips += `<text x="${pos.x}" y="${pos.y}" font-size="18" fill="${color}" text-anchor="middle">${symbol}</text>`;
  }
  
  return pips;
}

/**
 * Get pip positions for each rank
 */
function getPipPositions(rank) {
  const positions = {
    '2': [{x: 50, y: 35}, {x: 50, y: 105}],
    '3': [{x: 50, y: 30}, {x: 50, y: 70}, {x: 50, y: 110}],
    '4': [{x: 30, y: 35}, {x: 70, y: 35}, {x: 30, y: 105}, {x: 70, y: 105}],
    '5': [{x: 30, y: 35}, {x: 70, y: 35}, {x: 50, y: 70}, {x: 30, y: 105}, {x: 70, y: 105}],
    '6': [{x: 30, y: 30}, {x: 70, y: 30}, {x: 30, y: 70}, {x: 70, y: 70}, {x: 30, y: 110}, {x: 70, y: 110}],
    '7': [{x: 30, y: 25}, {x: 70, y: 25}, {x: 30, y: 55}, {x: 70, y: 55}, {x: 30, y: 85}, {x: 70, y: 85}, {x: 50, y: 115}]
  };
  
  return positions[rank] || [];
}

/**
 * Get face card name
 */
function getFaceName(rank) {
  const names = {
    'J': 'Jack',
    'Q': 'Queen',
    'K': 'King'
  };
  return names[rank] || '';
}

/**
 * Generate card back SVG
 * @returns {string} SVG string
 */
function generateCardBackSVG() {
  return `
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
      <!-- Card background -->
      <rect x="2" y="2" width="96" height="136" rx="8" ry="8" fill="#0f3460" stroke="#1a1a2e" stroke-width="2"/>
      
      <!-- Decorative pattern -->
      <rect x="8" y="8" width="84" height="128" rx="5" ry="5" fill="none" stroke="#e94560" stroke-width="1" stroke-dasharray="4,4"/>
      
      <!-- Center design -->
      <circle cx="50" cy="70" r="25" fill="none" stroke="#e94560" stroke-width="2"/>
      <text x="50" y="75" font-size="24" fill="#e94560" text-anchor="middle">🃏</text>
      
      <!-- Corner decorations -->
      <circle cx="20" cy="20" r="5" fill="#e94560" opacity="0.5"/>
      <circle cx="80" cy="20" r="5" fill="#e94560" opacity="0.5"/>
      <circle cx="20" cy="120" r="5" fill="#e94560" opacity="0.5"/>
      <circle cx="80" cy="120" r="5" fill="#e94560" opacity="0.5"/>
    </svg>
  `;
}

/**
 * Create card element with SVG
 * @param {Object} card - Card object with rank and suit
 * @param {boolean} faceDown - Show card back
 * @param {boolean} selectable - Card is clickable
 * @param {number} index - Card index
 * @returns {HTMLElement} Card element
 */
function createCardElement(card, faceDown = false, selectable = false, index = -1) {
  const cardEl = document.createElement('div');
  cardEl.className = `card ${card.suit || ''}`;
  
  if (faceDown) {
    cardEl.classList.add('card-back');
    cardEl.innerHTML = generateCardBackSVG();
    return cardEl;
  }
  
  if (selectable && index >= 0) {
    cardEl.dataset.cardIndex = index;
    cardEl.addEventListener('click', () => {
      if (window.gameUI) {
        window.gameUI.onCardClick(index);
      }
    });
  }
  
  if (window.gameUI && window.gameUI.selectedCardIndex === index) {
    cardEl.classList.add('selected');
  }
  
  cardEl.innerHTML = generateCardSVG(card.rank, card.suit);
  
  return cardEl;
}

// Export functions
window.cardSVG = {
  generateCardSVG,
  generateCardBackSVG,
  createCardElement,
  SUITS,
  RANKS
};
