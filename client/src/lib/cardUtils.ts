const SUITS: Record<string, { symbol: string; color: string; path: string }> = {
  hearts: { 
    symbol: '🦩', 
    color: '#c0392b', 
    // Stylized sea bird / swan
    path: 'M 0 -10 C 10 -20 20 -10 10 0 C 0 10 -10 20 0 30 C -10 20 -20 10 -10 0 C -20 -10 -10 -20 0 -10 Z' // A stylized drop/bird shape
  },
  diamonds: { 
    symbol: '🏛️', 
    color: '#d35400', 
    // Stylized column
    path: 'M -5 -15 L 5 -15 L 5 -10 L 3 -10 L 3 10 L 5 10 L 5 15 L -5 15 L -5 10 L -3 10 L -3 -10 L -5 -10 Z'
  },
  clubs: { 
    symbol: '🌿', 
    color: '#2c3e50', 
    // Stylized palm leaf
    path: 'M 0 15 C -5 5 -15 0 -5 -5 C -10 -10 0 -15 0 -15 C 0 -15 10 -10 5 -5 C 15 0 5 5 0 15 Z'
  },
  spades: { 
    symbol: '☀️', 
    color: '#34495e', 
    // Stylized sun disk
    path: 'M 0 -15 A 10 10 0 1 1 0 5 A 10 10 0 1 1 0 -15 M 0 5 L 0 15 M -8 0 L -12 0 M 8 0 L 12 0 M -6 -11 L -9 -14 M 6 -11 L 9 -14'
  },
};

function getPipPositions(rank: string): { x: number; y: number }[] {
  const positions: Record<string, { x: number; y: number }[]> = {
    '2': [{ x: 50, y: 35 }, { x: 50, y: 105 }],
    '3': [{ x: 50, y: 30 }, { x: 50, y: 70 }, { x: 50, y: 110 }],
    '4': [{ x: 30, y: 35 }, { x: 70, y: 35 }, { x: 30, y: 105 }, { x: 70, y: 105 }],
    '5': [{ x: 30, y: 35 }, { x: 70, y: 35 }, { x: 50, y: 70 }, { x: 30, y: 105 }, { x: 70, y: 105 }],
    '6': [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }, { x: 30, y: 110 }, { x: 70, y: 110 }],
    '7': [{ x: 30, y: 25 }, { x: 70, y: 25 }, { x: 30, y: 55 }, { x: 70, y: 55 }, { x: 30, y: 85 }, { x: 70, y: 85 }, { x: 50, y: 115 }],
  };
  return positions[rank] || [];
}

function getFaceName(rank: string): string {
  const names: Record<string, string> = { J: 'Jack', Q: 'Queen', K: 'King' };
  return names[rank] || '';
}

function generatePips(rank: string, path: string, color: string): string {
  return getPipPositions(rank)
    .map((p) => `<g transform="translate(${p.x}, ${p.y}) scale(0.6)"><path d="${path}" fill="${color}" stroke="${color}" stroke-width="1"/></g>`)
    .join('');
}

export function generateCardSVG(rank: string, suit: string): string {
  const suitData = SUITS[suit];
  if (!suitData) return '';
  const { color, path, symbol } = suitData;

  let centerContent = '';
  if (['2', '3', '4', '5', '6', '7'].includes(rank)) {
    centerContent = generatePips(rank, path, color);
  } else {
    // Face cards / Ace
    const scale = rank === 'A' ? '2' : '1.5';
    const yOffset = rank === 'A' ? '70' : '65';
    centerContent = `<g transform="translate(50, ${yOffset}) scale(${scale})"><path d="${path}" fill="${color}"/></g>`;
    if (['J', 'Q', 'K'].includes(rank)) {
      centerContent += `
        <rect x="20" y="30" width="60" height="80" fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
        <text x="50" y="85" font-family="Cinzel, serif" font-size="12" fill="${color}" text-anchor="middle" font-weight="bold">${getFaceName(rank)}</text>
      `;
    }
  }

  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg shadow-md drop-shadow-md">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.05 0" />
      </filter>
      <pattern id="linen" patternUnits="userSpaceOnUse" width="10" height="10">
        <image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMTBMMTAgME0tMSAxTDEgLTFNOSAxMUwxMSA5IiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+" x="0" y="0" width="10" height="10"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="100" height="140" rx="6" ry="6" fill="#fdfbf7" stroke="#b0a084" stroke-width="1"/>
    <rect x="0" y="0" width="100" height="140" rx="6" ry="6" fill="url(#linen)" opacity="0.6"/>
    
    <text x="14" y="22" font-family="Cinzel, serif" font-size="16" font-weight="bold" fill="${color}" text-anchor="middle">${rank}</text>
    <g transform="translate(14, 34) scale(0.4)"><path d="${path}" fill="${color}"/></g>
    
    ${centerContent}
    
    <g transform="translate(86, 118) rotate(180)">
      <text x="0" y="0" font-family="Cinzel, serif" font-size="16" font-weight="bold" fill="${color}" text-anchor="middle">${rank}</text>
      <g transform="translate(0, 12) scale(0.4)"><path d="${path}" fill="${color}"/></g>
    </g>
    
    <rect x="0" y="0" width="100" height="140" rx="6" ry="6" fill="url(#noise)" pointer-events="none"/>
  </svg>`;
}

export function generateCardBackSVG(): string {
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg shadow-md drop-shadow-md">
    <defs>
      <filter id="noise-back">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
      </filter>
      <pattern id="moorish" patternUnits="userSpaceOnUse" width="20" height="20">
        <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.5"/>
        <circle cx="10" cy="10" r="2" fill="#d4af37" opacity="0.5"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="100" height="140" rx="6" ry="6" fill="#2a1610" stroke="#d4af37" stroke-width="1"/>
    
    <rect x="4" y="4" width="92" height="132" rx="4" ry="4" fill="url(#moorish)"/>
    <rect x="8" y="8" width="84" height="124" rx="2" ry="2" fill="none" stroke="#d4af37" stroke-width="1"/>
    
    <circle cx="50" cy="70" r="22" fill="#2a1610" stroke="#d4af37" stroke-width="1.5"/>
    <text x="50" y="76" font-family="Cinzel, serif" font-size="18" fill="#d4af37" text-anchor="middle" font-weight="bold">CX</text>
    
    <rect x="0" y="0" width="100" height="140" rx="6" ry="6" fill="url(#noise-back)" pointer-events="none"/>
  </svg>`;
}
