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
    // Corner rank indicators (top-left and bottom-right)
    const cornerRank = `
      <text x="14" y="22" font-family="'Playfair Display','Cinzel','Georgia',serif" 
            font-size="18" font-weight="700" fill="${color}" text-anchor="start">${rank}</text>
      <text x="16" y="20" font-size="10" fill="${color}" text-anchor="start">${sym}</text>
      <g transform="rotate(180 50 70)">
        <text x="14" y="22" font-family="'Playfair Display','Cinzel','Georgia',serif" 
              font-size="18" font-weight="700" fill="${color}" text-anchor="start">${rank}</text>
        <text x="16" y="20" font-size="10" fill="${color}" text-anchor="start">${sym}</text>
      </g>`;
    
    // Face card artwork with distinct character designs
    let faceArt = '';
    
    if (rank === 'J') {
      // Jack - Young page/soldier with green cap, profile view, simpler outfit
      faceArt = `
        <g transform="translate(50,70)">
          <!-- Body/robe - red with green accents -->
          <path d="M-16,28 L-16,8 Q-16,-8 0,-8 Q16,-8 16,8 L16,28 Q16,38 0,38 Q-16,38 -16,28" 
                fill="#c0392b" stroke="#1a1a2e" stroke-width="0.5"/>
          <!-- Green diagonal sash -->
          <path d="M-16,-5 L16,20" stroke="#27ae60" stroke-width="6" opacity="0.7"/>
          <!-- White collar -->
          <ellipse cx="0" cy="-5" rx="10" ry="3" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="0.3"/>
          <!-- Head - profile view -->
          <ellipse cx="0" cy="-16" rx="8" ry="10" fill="#f5d5b8" stroke="#d35400" stroke-width="0.3"/>
          <!-- Green cap with feather -->
          <ellipse cx="0" cy="-22" rx="10" ry="4" fill="#27ae60" stroke="#1e8449" stroke-width="0.3"/>
          <path d="M8,-24 Q14,-26 16,-20" stroke="#f1c40f" stroke-width="1.5" fill="none"/>
          <!-- Brown hair -->
          <path d="M-8,-20 Q-9,-12 -8,-6 Q-5,-2 0,-2 Q5,-2 8,-6 Q9,-12 8,-20" fill="#8b4513" opacity="0.7"/>
          <!-- Face features - profile -->
          <circle cx="-3" cy="-17" r="0.8" fill="#2c3e50"/>
          <path d="M-2,-15 Q0,-14 2,-15" fill="none" stroke="#c0392b" stroke-width="0.4"/>
          <path d="M-1,-13 Q0,-12 1,-13" fill="none" stroke="#c0392b" stroke-width="0.3"/>
          <!-- Young smooth chin -->
          <path d="M-4,-8 Q0,-4 4,-8" fill="none" stroke="#d35400" stroke-width="0.3"/>
        </g>`;
    } else if (rank === 'Q') {
      // Queen - Royal woman with elaborate crown, veil, and jewelry
      faceArt = `
        <g transform="translate(50,70)">
          <!-- Body/robe - purple with gold trim -->
          <path d="M-20,30 L-20,5 Q-20,-12 0,-12 Q20,-12 20,5 L20,30 Q20,42 0,42 Q-20,42 -20,30" 
                fill="#8e44ad" stroke="#1a1a2e" stroke-width="0.5"/>
          <!-- Gold bodice with pattern -->
          <path d="M-10,-8 L0,12 L10,-8" fill="#f1c40f" opacity="0.8" stroke="#d35400" stroke-width="0.3"/>
          <circle cx="0" cy="2" r="2" fill="#e74c3c" opacity="0.8"/>
          <!-- White collar -->
          <ellipse cx="0" cy="-8" rx="11" ry="3" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="0.3"/>
          <!-- Head -->
          <ellipse cx="0" cy="-18" rx="8" ry="10" fill="#f5d5b8" stroke="#d35400" stroke-width="0.3"/>
          <!-- Elaborate crown with points -->
          <path d="M-9,-28 L-9,-38 L-4,-32 L0,-42 L4,-32 L9,-38 L9,-28 Z" 
                fill="#f1c40f" stroke="#d35400" stroke-width="0.4"/>
          <circle cx="0" cy="-37" r="2" fill="#e74c3c"/>
          <circle cx="-7" cy="-33" r="1.5" fill="#3498db"/>
          <circle cx="7" cy="-33" r="1.5" fill="#3498db"/>
          <!-- Translucent veil -->
          <path d="M-9,-24 Q-14,-10 -12,8 Q0,12 12,8 Q14,-10 9,-24" 
                fill="none" stroke="#ecf0f1" stroke-width="1.5" opacity="0.6"/>
          <!-- Blonde hair -->
          <path d="M-8,-22 Q-9,-14 -8,-8 Q-6,-3 0,-3 Q6,-3 8,-8 Q9,-14 8,-22" fill="#f5d5b8" stroke="#d35400" stroke-width="0.3"/>
          <path d="M-8,-22 Q-10,-10 -9,5" fill="none" stroke="#f5d5b8" stroke-width="2"/>
          <path d="M8,-22 Q10,-10 9,5" fill="none" stroke="#f5d5b8" stroke-width="2"/>
          <!-- Face features - frontal view -->
          <ellipse cx="-3" cy="-19" rx="1.2" ry="1.5" fill="#fff" opacity="0.5"/>
          <circle cx="-2.5" cy="-19" r="0.6" fill="#2c3e50"/>
          <ellipse cx="3" cy="-19" rx="1.2" ry="1.5" fill="#fff" opacity="0.5"/>
          <circle cx="3.5" cy="-19" r="0.6" fill="#2c3e50"/>
          <path d="M-1,-15 Q0,-14 1,-15" fill="none" stroke="#c0392b" stroke-width="0.3"/>
          <!-- Necklace with pendant -->
          <ellipse cx="0" cy="-5" rx="7" ry="2" fill="none" stroke="#f1c40f" stroke-width="0.4"/>
          <circle cx="0" cy="-2" r="2" fill="#e74c3c"/>
          <!-- Earrings -->
          <circle cx="-6" cy="-14" r="1" fill="#f1c40f"/>
          <circle cx="6" cy="-14" r="1" fill="#f1c40f"/>
        </g>`;
    } else if (rank === 'K') {
      // King - Bearded ruler with large crown, scepter, and royal mantle
      faceArt = `
        <g transform="translate(50,70)">
          <!-- Body/robe - red with purple mantle -->
          <path d="M-24,32 L-24,2 Q-24,-14 0,-14 Q24,-14 24,2 L24,32 Q24,44 0,44 Q-24,44 -24,32" 
                fill="#c0392b" stroke="#1a1a2e" stroke-width="0.5"/>
          <!-- Purple royal mantle with ermine trim -->
          <path d="M-24,-10 Q-30,5 -24,32" fill="#6c3483" opacity="0.8" stroke="#5b2c6f" stroke-width="0.3"/>
          <path d="M24,-10 Q30,5 24,32" fill="#6c3483" opacity="0.8" stroke="#5b2c6f" stroke-width="0.3"/>
          <!-- Ermine trim triangles -->
          <path d="M-22,28 L-20,32 L-18,28 L-16,32 L-14,28" fill="#ecf0f1" stroke="#2c3e50" stroke-width="0.2"/>
          <path d="M22,28 L20,32 L18,28 L16,32 L14,28" fill="#ecf0f1" stroke="#2c3e50" stroke-width="0.2"/>
          <!-- Gold chest plate with jewels -->
          <rect x="-10" y="-6" width="20" height="24" rx="3" fill="#f1c40f" opacity="0.8" stroke="#d35400" stroke-width="0.3"/>
          <circle cx="0" cy="4" r="4" fill="#e74c3c" opacity="0.9"/>
          <circle cx="-6" cy="-2" r="2" fill="#3498db" opacity="0.8"/>
          <circle cx="6" cy="-2" r="2" fill="#3498db" opacity="0.8"/>
          <!-- Gold collar -->
          <ellipse cx="0" cy="-10" rx="15" ry="4" fill="#f1c40f" stroke="#d35400" stroke-width="0.3"/>
          <!-- Head -->
          <ellipse cx="0" cy="-22" rx="9" ry="11" fill="#f5d5b8" stroke="#d35400" stroke-width="0.3"/>
          <!-- Large royal crown -->
          <path d="M-11,-32 L-11,-44 L-6,-36 L0,-48 L6,-36 L11,-44 L11,-32 Z" 
                fill="#f1c40f" stroke="#d35400" stroke-width="0.5"/>
          <circle cx="0" cy="-44" r="3" fill="#e74c3c"/>
          <circle cx="-8" cy="-38" r="2" fill="#3498db"/>
          <circle cx="8" cy="-38" r="2" fill="#3498db"/>
          <!-- Full beard - distinctive feature -->
          <path d="M-8,-16 Q-10,-8 -7,8 Q0,18 7,8 Q10,-8 8,-16" fill="#f5d5b8" stroke="#d35400" stroke-width="0.3"/>
          <!-- Beard detail lines -->
          <path d="M-6,-12 L-5,2 M-3,-12 L-2,4 M0,-12 L0,6 M3,-12 L2,4 M6,-12 L5,2" 
                stroke="#d35400" stroke-width="0.4" opacity="0.4"/>
          <!-- Mustache -->
          <path d="M-4,-10 Q-2,-12 0,-10 Q2,-12 4,-10" fill="none" stroke="#8b4513" stroke-width="0.5"/>
          <!-- Long hair flowing from crown -->
          <path d="M-10,-26 Q-12,-16 -11,-6" fill="none" stroke="#f5d5b8" stroke-width="2.5"/>
          <path d="M10,-26 Q12,-16 11,-6" fill="none" stroke="#f5d5b8" stroke-width="2.5"/>
          <!-- Face features - mature, stern -->
          <ellipse cx="-3.5" cy="-24" rx="1.2" ry="1.5" fill="#fff" opacity="0.5"/>
          <circle cx="-3" cy="-24" r="0.6" fill="#2c3e50"/>
          <ellipse cx="3.5" cy="-24" rx="1.2" ry="1.5" fill="#fff" opacity="0.5"/>
          <circle cx="4" cy="-24" r="0.6" fill="#2c3e50"/>
          <path d="M-3,-20 Q0,-19 3,-20" fill="none" stroke="#c0392b" stroke-width="0.4"/>
          <!-- Scepter on right side -->
          <line x1="16" y1="-8" x2="16" y2="28" stroke="#f1c40f" stroke-width="2"/>
          <circle cx="16" cy="-12" r="3" fill="#e74c3c"/>
          <path d="M13,-12 L19,-12" stroke="#f1c40f" stroke-width="1"/>
        </g>`;
    }
    
    inner = `${cornerRank}
      ${faceArt}`;
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
  <rect width="100" height="140" rx="7" ry="7" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <image href="/card_back.png" x="2" y="2" width="96" height="136" preserveAspectRatio="xMidYMid slice" />
</svg>`;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function generateCardSVG(rank: string, suit: string, style: CardStyle = 'chkobba'): string {
  if (rank === 'Joker') return jokerSVG();
  return style === 'bicycle' ? bicycleCard(rank, suit) : chkobbaCard(rank, suit);
}
