/**
 * Card SVG generators
 *
 * Chkobba style: Suit pips only (no rank text). Tunisian parchment theme.
 * Bicycle style: Standard playing cards with rank + pips. For Rummy.
 */

export type CardStyle = 'chkobba' | 'bicycle';

// ── Shared constants ────────────────────────────────────────────────────────

const SYM: Record<string, string> = {
  spades: '\u2660', hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663',
};
const CLR: Record<string, string> = {
  spades: '#1a1a2e', hearts: '#c0392b', diamonds: '#c0392b', clubs: '#1a1a2e',
};

const RANK_COUNT: Record<string, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10,
};

// Classic pip positions in a 100×140 viewBox
const PIPS: Record<number, { x: number; y: number }[]> = {
  1:  [{ x: 50, y: 70 }],
  2:  [{ x: 50, y: 35 }, { x: 50, y: 105 }],
  3:  [{ x: 50, y: 28 }, { x: 50, y: 70 }, { x: 50, y: 112 }],
  4:  [{ x: 32, y: 32 }, { x: 68, y: 32 }, { x: 32, y: 108 }, { x: 68, y: 108 }],
  5:  [{ x: 32, y: 32 }, { x: 68, y: 32 }, { x: 50, y: 70 },
       { x: 32, y: 108 }, { x: 68, y: 108 }],
  6:  [{ x: 32, y: 28 }, { x: 68, y: 28 }, { x: 32, y: 70 },
       { x: 68, y: 70 }, { x: 32, y: 112 }, { x: 68, y: 112 }],
  7:  [{ x: 32, y: 28 }, { x: 68, y: 28 }, { x: 50, y: 49 },
       { x: 32, y: 70 }, { x: 68, y: 70 }, { x: 32, y: 112 }, { x: 68, y: 112 }],
  8:  [{ x: 32, y: 24 }, { x: 68, y: 24 }, { x: 50, y: 44 },
       { x: 32, y: 62 }, { x: 68, y: 62 }, { x: 50, y: 82 },
       { x: 32, y: 100 }, { x: 68, y: 100 }],
  9:  [{ x: 32, y: 24 }, { x: 68, y: 24 }, { x: 32, y: 48 },
       { x: 68, y: 48 }, { x: 50, y: 70 }, { x: 32, y: 92 },
       { x: 68, y: 92 }, { x: 32, y: 116 }, { x: 68, y: 116 }],
  10: [{ x: 32, y: 22 }, { x: 68, y: 22 }, { x: 50, y: 38 },
       { x: 32, y: 54 }, { x: 68, y: 54 }, { x: 32, y: 86 },
       { x: 68, y: 86 }, { x: 50, y: 102 }, { x: 32, y: 118 }, { x: 68, y: 118 }],
};

function pipFS(n: number) {
  if (n <= 1) return 28;
  if (n <= 3) return 22;
  if (n <= 5) return 18;
  if (n <= 7) return 16;
  return 14;
}

function renderPips(positions: { x: number; y: number }[], sym: string, color: string, fontSize: number) {
  return positions.map(p =>
    `<text x="${p.x}" y="${p.y}" font-size="${fontSize}" fill="${color}" text-anchor="middle" dominant-baseline="central">${sym}</text>`
  ).join('');
}

// ── Chkobba cards (pips only, no rank text) ─────────────────────────────────

function chkobbaCard(rank: string, suit: string): string {
  const sym = SYM[suit], color = CLR[suit];
  if (!sym) return '';

  const isFace = rank === 'J' || rank === 'Q' || rank === 'K';
  let inner: string;

  if (isFace) {
    // Decorative frames: J=1 ring, Q=2 rings, K=3 rings
    const rings = rank === 'J' ? 1 : rank === 'Q' ? 2 : 3;
    let frames = '';
    for (let i = 0; i < rings; i++) {
      const ins = 16 + i * 5;
      frames += `<rect x="${ins}" y="${28 + i * 5}" width="${100 - ins * 2}" height="${84 - i * 10}" rx="${4 - i}"
        fill="none" stroke="#d4af37" stroke-width="${0.8 - i * 0.15}" opacity="${0.4 - i * 0.1}"/>`;
    }
    inner = `${frames}
      <text x="50" y="62" font-size="36" fill="${color}" text-anchor="middle" dominant-baseline="central">${sym}</text>
      <text x="50" y="100" font-family="'Playfair Display','Cinzel','Georgia',serif"
            font-size="14" fill="${color}" text-anchor="middle" opacity="0.35" font-weight="700">${rank}</text>`;
  } else {
    const count = RANK_COUNT[rank] || 1;
    const pos = PIPS[count] || PIPS[1];
    inner = renderPips(pos, sym, color, pipFS(count));
  }

  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <rect width="100" height="140" rx="7" ry="7" fill="#f5f0e1" stroke="#c4a86c" stroke-width="1"/>
  <rect x="5" y="5" width="90" height="130" rx="4" ry="4" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.35"/>
  <path d="M9 22 Q9 9,22 9" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.25"/>
  <path d="M78 9 Q91 9,91 22" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.25"/>
  <path d="M9 118 Q9 131,22 131" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.25"/>
  <path d="M78 131 Q91 131,91 118" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.25"/>
  ${inner}
</svg>`;
}

// ── Bicycle / standard cards (rank + pips) ──────────────────────────────────

function bicycleCard(rank: string, suit: string): string {
  const sym = SYM[suit], color = CLR[suit];
  if (!sym) return '';

  const isFace = rank === 'J' || rank === 'Q' || rank === 'K';
  const isTen = rank === '10';
  const cfs = isTen ? 10 : 12;
  const cx = isTen ? 10 : 12;

  const corners = `
    <text x="${cx}" y="20" font-family="Arial,Helvetica,sans-serif" font-size="${cfs}" font-weight="700" fill="${color}" text-anchor="start">${rank}</text>
    <text x="${cx + 1}" y="31" font-size="10" fill="${color}" text-anchor="start">${sym}</text>
    <g transform="rotate(180 50 70)">
      <text x="${cx}" y="20" font-family="Arial,Helvetica,sans-serif" font-size="${cfs}" font-weight="700" fill="${color}" text-anchor="start">${rank}</text>
      <text x="${cx + 1}" y="31" font-size="10" fill="${color}" text-anchor="start">${sym}</text>
    </g>`;

  let inner: string;
  if (isFace) {
    inner = `
      <rect x="20" y="32" width="60" height="76" rx="3" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.15"/>
      <text x="50" y="70" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="${color}" text-anchor="middle" dominant-baseline="central">${rank}</text>`;
  } else {
    const count = RANK_COUNT[rank] || 1;
    const pos = PIPS[count] || PIPS[1];
    inner = renderPips(pos, sym, color, pipFS(count));
  }

  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <rect width="100" height="140" rx="7" ry="7" fill="#ffffff" stroke="#b5b5b5" stroke-width="1"/>
  <rect x="2" y="2" width="96" height="136" rx="5" ry="5" fill="none" stroke="${color}" stroke-width="0.3" opacity="0.15"/>
  ${corners}
  ${inner}
</svg>`;
}

// ── Joker ────────────────────────────────────────────────────────────────────

function jokerSVG(): string {
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <rect width="100" height="140" rx="7" ry="7" fill="#2c1810" stroke="#9b59b6" stroke-width="1.5"/>
  <rect x="5" y="5" width="90" height="130" rx="5" fill="none" stroke="#9b59b6" stroke-width="0.6" opacity="0.3"/>
  <g transform="translate(50,50)">
    <path d="M0-18 L4-6 L17-6 L7 3 L11 15 L0 8 L-11 15 L-7 3 L-17-6 L-4-6Z" fill="#e74c3c" stroke="#f39c12" stroke-width="0.5" opacity="0.8"/>
  </g>
  <text x="50" y="95" font-family="'Cinzel','Georgia',serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">JOKER</text>
  <text x="14" y="22" font-family="'Cinzel','Georgia',serif" font-size="13" font-weight="700" fill="#e74c3c">J</text>
  <g transform="rotate(180 50 70)"><text x="14" y="22" font-family="'Cinzel','Georgia',serif" font-size="13" font-weight="700" fill="#e74c3c">J</text></g>
</svg>`;
}

// ── Card back ───────────────────────────────────────────────────────────────

export function generateCardBackSVG(): string {
  return `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" class="card-svg">
  <defs>
    <pattern id="moorish" patternUnits="userSpaceOnUse" width="20" height="20">
      <path d="M10 0 L20 10 L10 20 L0 10Z" fill="none" stroke="#d4af37" stroke-width="0.5" opacity="0.5"/>
      <circle cx="10" cy="10" r="2" fill="#d4af37" opacity="0.5"/>
    </pattern>
  </defs>
  <rect width="100" height="140" rx="7" ry="7" fill="#2a1610" stroke="#d4af37" stroke-width="1"/>
  <rect x="4" y="4" width="92" height="132" rx="4" fill="url(#moorish)"/>
  <rect x="8" y="8" width="84" height="124" rx="2" fill="none" stroke="#d4af37" stroke-width="1"/>
  <circle cx="50" cy="70" r="18" fill="#2a1610" stroke="#d4af37" stroke-width="1.5"/>
  <circle cx="50" cy="70" r="8" fill="none" stroke="#d4af37" stroke-width="0.8" opacity="0.6"/>
</svg>`;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function generateCardSVG(rank: string, suit: string, style: CardStyle = 'chkobba'): string {
  if (rank === 'Joker') return jokerSVG();
  return style === 'bicycle' ? bicycleCard(rank, suit) : chkobbaCard(rank, suit);
}
