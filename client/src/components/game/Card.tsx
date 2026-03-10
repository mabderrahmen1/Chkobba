import { motion } from 'framer-motion';
import type { Card as CardType } from '@shared/types.js';
import { generateCardSVG, generateCardBackSVG } from '../../lib/cardUtils';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  selectable?: boolean;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export function Card({
  card,
  faceDown = false,
  selectable = false,
  selected = false,
  small = false,
  onClick,
}: CardProps) {
  const svg = faceDown || !card ? generateCardBackSVG() : generateCardSVG(card.rank, card.suit);

  return (
    <motion.div
      whileHover={selectable ? { y: -4, scale: 1.02 } : undefined}
      animate={selected ? { y: -6 } : { y: 0 }}
      onClick={selectable ? onClick : undefined}
      className={`rounded-md overflow-hidden select-none transition-shadow duration-200 ${
        small ? 'w-[30px] h-[42px] sm:w-[40px] sm:h-[56px] md:w-[45px] md:h-[63px]' : 'w-[var(--card-width)] h-[var(--card-height)]'
      } ${selectable ? 'cursor-pointer' : ''} ${
        selected ? 'ring-2 ring-green-400/80 ring-offset-1 ring-offset-felt-dark shadow-glow-green' : 'shadow-theme-sm'
      }`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
