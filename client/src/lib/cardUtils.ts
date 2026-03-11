/**
 * Standard playing-card SVG generator for Chkobba
 * Suits: spades, hearts, diamonds, clubs (classic French/Anglo deck)
 *
 * Number cards (A–7): no text — value shown only by repeating the suit
 *   symbol in classic symmetric pip layouts.
 * Face cards (J, Q, K): centred letter + decorative frame + mini suit pips.
 * White background, thin border, balanced spacing.
 */

// ── Suit definitions ────────────────────────────────────────────────────────

interface SuitDef {
  color: string;
  /** SVG snippet centred at (0,0). `s` = uniform scale factor. */
  pip: (s: number) => string;
  /** Fixed-size mini symbol for face-card corners. */
  mini: string;
}

const SUITS: Record<string, SuitDef> = {
  spades: {
    color: '#1a1a2e',
    pip: (s) => {
      const h = 8 * s;   // half-height of the spade body
      const w = 7.5 * s;  // half-width
      return `
        <path d="M 0 ${-h}
                 C ${-w*0.3} ${-h*0.4}, ${-w} ${-h*0.1}, ${-w} ${h*0.25}
                 C ${-w} ${h*0.65}, ${-w*0.2} ${h*0.7}, 0 ${h*0.45}
                 C ${w*0.2} ${h*0.7}, ${w} ${h*0.65}, ${w} ${h*0.25}
                 C ${w} ${-h*0.1}, ${w*0.3} ${-h*0.4}, 0 ${-h} Z"
              fill="#1a1a2e"/>
        <rect x="${-0.9*s}" y="${h*0.3}" width="${1.8*s}" height="${h*0.65}"
              rx="${0.5*s}" fill="#1a1a2e"/>`;
    },
    mini: `<path d="M0-4 C-1.2-2.5,-3.5-0.5,-3.5 1.2 C-3.5 3,-0.8 3.2,0 2
                     C0.8 3.2,3.5 3,3.5 1.2 C3.5-0.5,1.2-2.5,0-4Z" fill="#1a1a2e"/>
            <rect x="-0.5" y="1.5" width="1" height="2.5" rx="0.3" fill="#1a1a2e"/>`,
  },

  hearts: {
    color: '#c0392b',
    pip: (s) => {
      const h = 8 * s;
      const w = 7.5 * s;
      return `
        <path d="M 0 ${h}
                 C ${-w*0.3} ${h*0.5}, ${-w} ${h*0.2}, ${-w} ${-h*0.15}
                 C ${-w} ${-h*0.7}, ${-w*0.5} ${-h}, 0 ${-h*0.55}
                 C ${w*0.5} ${-h}, ${w} ${-h*0.7}, ${w} ${-h*0.15}
                 C ${w} ${h*0.2}, ${w*0.3} ${h*0.5}, 0 ${h} Z"
              fill="#c0392b"/>`;
    },
    mini: `<path d="M0 4 C-1.5 2.5,-3.5 0.8,-3.5-0.8 C-3.5-2.5,-2-3.8,0-2
                     C2-3.8,3.5-2.5,3.5-0.8 C3.5 0.8,1.5 2.5,0 4Z" fill="#c0392b"/>`,
  },

  diamonds: {
    color: '#c0392b',
    pip: (s) => {
      const h = 9 * s;   // half-height
      const w = 6.5 * s;  // half-width
      return `
        <path d="M 0 ${-h}
                 C ${w*0.35} ${-h*0.35}, ${w} ${-h*0.1}, ${w} 0
                 C ${w} ${h*0.1}, ${w*0.35} ${h*0.35}, 0 ${h}
                 C ${-w*0.35} ${h*0.35}, ${-w} ${h*0.1}, ${-w} 0
                 C ${-w} ${-h*0.1}, ${-w*0.35} ${-h*0.35}, 0 ${-h} Z"
              fill="#c0392b"/>`;
    },
    mini: `<path d="M0-4.5 C1.5-1.5,3 0,3 0 C3 0,1.5 1.5,0 4.5
                     C-1.5 1.5,-3 0,-3 0 C-3 0,-1.5-1.5,0-4.5Z" fill="#c0392b"/>`,
  },

  clubs: {
    color: '#1a1a2e',
    pip: (s) => {
      const r = 4.5 * s;  // lobe radius
      return `
        <circle cx="0" cy="${-r*1.15}" r="${r}" fill="#1a1a2e"/>
        <circle cx="${-r*1.0}" cy="${r*0.35}" r="${r}" fill="#1a1a2e"/>
        <circle cx="${r*1.0}" cy="${r*0.35}" r="${r}" fill="#1a1a2e"/>
        <rect x="${-0.9*s}" y="${r*0.2}" width="${1.8*s}" height="${r*1.5}"
              rx="${0.5*s}" fill="#1a1a2e"/>`;
    },
    mini: `<circle cx="0" cy="-2.2" r="2" fill="#1a1a2e"/>
            <circle cx="-2" cy="0.8" r="2" fill="#1a1a2e"/>
            <circle cx="2" cy="0.8" r="2" fill="#1a1a2e"/>
            <rect x="-0.4" y="0.5" width="0.8" height="3" rx="0.3" fill="#1a1a2e"/>`,
  },
};

// ── Classic pip positions (100 × 140 viewBox) ───────────────────────────────
// Two columns at x = 32 / 68, centre at x = 50.

const PIP_LAYOUTS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 70 }],
  2: [
    { x: 50, y: 34 },
    { x: 50, y: 106 },
  ],
  3: [
    { x: 50, y: 28 },
    { x: 50, y: 70 },
    { x: 50, y: 112 },
  ],
  4: [
    { x: 32, y: 30 }, { x: 68, y: 30 },
    { x: 32, y: 110 }, { x: 68, y: 110 },
  ],
  5: [
    { x: 32, y: 30 }, { x: 68, y: 30 },
    { x: 50, y: 70 },
    { x: 32, y: 110 }, { x: 68, y: 110 },
  ],
  6: [
    { x: 32, y: 28 }, { x: 68, y: 28 },
    { x: 32, y: 70 }, { x: 68, y: 70 },
    { x: 32, y: 112 }, { x: 68, y: 112 },
  ],
  7: [
    { x: 32, y: 28 }, { x: 68, y: 28 },
    { x: 50, y: 49 },
    { x: 32, y: 70 }, { x: 68, y: 70 },
    { x: 32, y: 112 }, { x: 68, y: 112 },
  ],
  8: [
    { x: 32, y: 28 }, { x: 68, y: 28 },
    { x: 50, y: 49 },
    { x: 32, y: 70 }, { x: 68, y: 70 },
    { x: 50, y: 91 },
    { x: 32, y: 112 }, { x: 68, y: 112 },
  ],
  9: [
    { x: 32, y: 26 }, { x: 68, y: 26 },
    { x: 50, y: 44 },
    { x: 32, y: 62 }, { x: 68, y: 62 },
    { x: 50, y: 78 },
    { x: 32, y: 96 }, { x: 68, y: 96 },
    { x: 50, y: 114 },
  ],
  10: [
    { x: 32, y: 24 }, { x: 68, y: 24 },
    { x: 50, y: 40 },
    { x: 32, y: 56 }, { x: 68, y: 56 },
    { x: 50, y: 70 },
    { x: 32, y: 84 }, { x: 68, y: 84 },
    { x: 50, y: 100 },
    { x: 32, y: 116 }, { x: 68, y: 116 },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pipScale(count: number): number {
  if (count <= 1) return 1.2;
  if (count <= 3) return 1.0;
  if (count <= 5) return 0.88;
  return 0.78;
}

const RANK_TO_PIPS: Record<string, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10,
};

// ── Corner rank indicator ──────────────────────────────────────────────────

function generateCornerRank(rank: string, suit: SuitDef, isTop: boolean = true): string {
  const transform = isTop ? '' : `rotate(180 50 70)`;
  const x = isTop ? 14 : 86;
  const y = isTop ? 22 : 118;
  const textAnchor = isTop ? 'start' : 'end';
  
  // Handle 10 specially (wider)
  const isTen = rank === '10';
  const fontSize = isTen ? 10 : 11;
  const rankX = isTop ? (isTen ? 10 : 14) : (isTen ? 90 : 86);
  
  return `
    <g transform="${transform}">
      <text x="${rankX}" y="${y}" 
            font-family="'Playfair Display','Cinzel','Georgia',serif" 
            font-size="${fontSize}" font-weight="700" fill="${suit.color}"
            text-anchor="${textAnchor}">${rank}</text>
      <g transform="translate(${rankX}, ${y + 10}) scale(0.5)">${suit.mini}</g>
    </g>`;
}

// ── Face cards ──────────────────────────────────────────────────────────────

function faceCardContent(rank: string, suit: SuitDef): string {
  const c = suit.color;

  // Outer + inner decorative frame
  const frame = `
    <rect x="12" y="18" width="76" height="104" rx="4"
          fill="none" stroke="${c}" stroke-width="1.2" opacity="0.2"/>
    <rect x="16" y="22" width="68" height="96" rx="2"
          fill="none" stroke="${c}" stroke-width="0.6" opacity="0.12"/>`;

  // Large centred rank letter
  const letter = `
    <text x="50" y="82"
          font-family="'Playfair Display','Cinzel','Georgia',serif"
          font-size="40" font-weight="700" fill="${c}"
          text-anchor="middle" dominant-baseline="middle">${rank}</text>`;

  // Corner rank indicators (top-left and bottom-right)
  const cornerRanks = `
    <g transform="translate(0, 0)">
      <text x="14" y="24" 
            font-family="'Playfair Display','Cinzel','Georgia',serif" 
            font-size="11" font-weight="700" fill="${c}"
            text-anchor="start">${rank}</text>
      <g transform="translate(14, 34) scale(0.55)">${suit.mini}</g>
    </g>
    <g transform="rotate(180 50 70)">
      <text x="14" y="24" 
            font-family="'Playfair Display','Cinzel','Georgia',serif" 
            font-size="11" font-weight="700" fill="${c}"
            text-anchor="start">${rank}</text>
      <g transform="translate(14, 34) scale(0.55)">${suit.mini}</g>
    </g>`;

  return frame + letter + cornerRanks;
}

function jokerCardSVG(): string {
  const gradient = `
    <defs>
      <linearGradient id="jokerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#9b59b6;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#e74c3c;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f39c12;stop-opacity:1" />
      </linearGradient>
      <pattern id="jokerPattern" patternUnits="userSpaceOnUse" width="15" height="15">
        <circle cx="7.5" cy="7.5" r="2" fill="#fff" opacity="0.3"/>
      </pattern>
    </defs>`;
  
  const frame = `
    <rect x="2" y="2" width="96" height="136" rx="7" fill="#2c1810" stroke="#9b59b6" stroke-width="1.5"/>
    <rect x="5" y="5" width="90" height="130" rx="5" fill="url(#jokerPattern)" opacity="0.2"/>
    <rect x="8" y="8" width="84" height="124" rx="3" fill="none" stroke="url(#jokerGradient)" stroke-width="1"/>`;
  
  const star = `
    <g transform="translate(50, 50)">
      <path d="M0-18 L4-6 L17-6 L7 3 L11 15 L0 8 L-11 15 L-7 3 L-17-6 L-4-6 Z" 
            fill="url(#jokerGradient)" stroke="#fff" stroke-width="0.5"/>
    </g>`;
  
  const text = `
    <text x="50" y="95" font-family="'Cinzel','Georgia',serif" font-size="28" 
          font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="3">JOKER</text>
    <text x="22" y="28" font-family="'Cinzel','Georgia',serif" font-size="14" fill="#e74c3c">J</text>
    <g transform="translate(78, 22) rotate(180)">
      <text font-family="'Cinzel','Georgia',serif" font-size="14" fill="#e74c3c">J</text>
    </g>`;
  
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
    ${gradient}
    ${frame}
    ${star}
    ${text}
  </svg>`;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function generateCardSVG(rank: string, suit: string): string {
  // Handle Joker cards
  if (rank === 'Joker') {
    return jokerCardSVG();
  }

  const s = SUITS[suit];
  if (!s) return '';

  const isFace = rank === 'J' || rank === 'Q' || rank === 'K';
  let inner: string;

  if (isFace) {
    inner = faceCardContent(rank, s);
  } else {
    const count = RANK_TO_PIPS[rank] ?? 1;
    const positions = PIP_LAYOUTS[count] ?? PIP_LAYOUTS[1];
    const sc = pipScale(count);
    inner = positions
      .map((p) => `<g transform="translate(${p.x},${p.y})">${s.pip(sc)}</g>`)
      .join('');
  }

  const c = s.color;
  
  // Add corner rank indicators for non-face cards
  const cornerRanks = isFace ? '' : `
    ${generateCornerRank(rank, s, true)}
    ${generateCornerRank(rank, s, false)}
  `;
  
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <rect width="100" height="140" rx="7" ry="7" fill="#fdfdfd"
        stroke="#b5b5b5" stroke-width="1"/>
  <rect x="2" y="2" width="96" height="136" rx="5" ry="5"
        fill="none" stroke="${c}" stroke-width="0.4" opacity="0.18"/>
  ${cornerRanks}
  ${inner}
</svg>`;
}

export function generateCardBackSVG(): string {
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <defs>
    <pattern id="moorish" patternUnits="userSpaceOnUse" width="20" height="20">
      <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="#d4af37"
            stroke-width="0.5" opacity="0.5"/>
      <circle cx="10" cy="10" r="2" fill="#d4af37" opacity="0.5"/>
    </pattern>
  </defs>
  <rect width="100" height="140" rx="7" ry="7" fill="#2a1610"
        stroke="#d4af37" stroke-width="1"/>
  <rect x="4" y="4" width="92" height="132" rx="4" fill="url(#moorish)"/>
  <rect x="8" y="8" width="84" height="124" rx="2" fill="none"
        stroke="#d4af37" stroke-width="1"/>
  <circle cx="50" cy="70" r="18" fill="#2a1610" stroke="#d4af37"
          stroke-width="1.5"/>
  <circle cx="50" cy="70" r="8" fill="none" stroke="#d4af37"
          stroke-width="0.8" opacity="0.6"/>
</svg>`;
}
