import { motion } from 'framer-motion';
import type { Card as CardType } from '@shared/types.js';
import { generateCardSVG, generateCardBackSVG } from '../../lib/cardUtils';
import { useGameStore } from '../../stores/useGameStore';
import type { CardStyle } from '../../lib/cardUtils';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  selectable?: boolean;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
}

// Sprite sheet: quadrilato.png is a 4-column × 4-row grid
//   Columns (left→right): J, Q, K, card-back
//   Rows    (top→bottom): ♠, ♦, ♣, ♥
const FACE_COL: Record<string, number> = { J: 0, Q: 1, K: 2 };
const FACE_ROW: Record<string, number> = { spades: 0, diamonds: 1, clubs: 2, hearts: 3 };

function getFaceSpriteStyle(rank: string, suit: string): React.CSSProperties {
  const col = FACE_COL[rank] ?? 0;
  const row = FACE_ROW[suit] ?? 0;
  // background-size: 400% 400% makes the whole image 4× the element size,
  // so each cell exactly fills the element.
  // background-position uses the (n/(total-1)*100%) formula for CSS sprites.
  const x = (col / 3) * 100;
  const y = (row / 3) * 100;
  return {
    backgroundImage: 'url(/quadrilato.png)',
    backgroundSize: '400% 400%',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
  };
}

const sharedClass = (small: boolean, selectable: boolean, selected: boolean) =>
  `rounded-md overflow-hidden select-none transition-shadow duration-200 ${
    small
      ? 'w-[30px] h-[42px] sm:w-[40px] sm:h-[56px] md:w-[45px] md:h-[63px]'
      : 'w-[var(--card-width)] h-[var(--card-height)]'
  } ${selectable ? 'cursor-pointer' : ''} ${
    selected
      ? 'ring-2 ring-green-400/80 ring-offset-1 ring-offset-felt-dark shadow-glow-green'
      : 'shadow-theme-sm'
  }`;

export function Card({
  card,
  faceDown = false,
  selectable = false,
  selected = false,
  small = false,
  onClick,
}: CardProps) {
  const gameType = useGameStore((s) => s.gameType || s.room?.gameType);
  const isFaceCard =
    !faceDown &&
    card &&
    gameType !== 'rummy' &&
    (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K');

  if (isFaceCard) {
    return (
      <motion.div
        whileHover={selectable ? { y: -4, scale: 1.02 } : undefined}
        animate={selected ? { y: -6 } : { y: 0 }}
        onClick={selectable ? onClick : undefined}
        className={sharedClass(small, selectable, selected)}
        style={getFaceSpriteStyle(card!.rank as string, card!.suit)}
      />
    );
  }

  const style: CardStyle = gameType === 'rummy' ? 'bicycle' : 'chkobba';
  const svg =
    faceDown || !card ? generateCardBackSVG() : generateCardSVG(card.rank, card.suit, style);

  return (
    <motion.div
      whileHover={selectable ? { y: -4, scale: 1.02 } : undefined}
      animate={selected ? { y: -6 } : { y: 0 }}
      onClick={selectable ? onClick : undefined}
      className={sharedClass(small, selectable, selected)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
