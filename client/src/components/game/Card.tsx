import React, { useMemo } from 'react';
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

const FACE_COL: Record<string, number> = { J: 0, Q: 1, K: 2 };
const FACE_ROW: Record<string, number> = { spades: 0, diamonds: 1, clubs: 2, hearts: 3 };
const SUIT_NAMES: Record<string, string> = { spades: 'Spades', diamonds: 'Diamonds', clubs: 'Clubs', hearts: 'Hearts' };

function getFaceSpriteStyle(rank: string, suit: string): React.CSSProperties {
  const col = FACE_COL[rank] ?? 0;
  const row = FACE_ROW[suit] ?? 0;
  return {
    backgroundImage: 'url(/quadrilato.png)',
    backgroundSize: '400% 400%',
    backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}

const sharedClass = (small: boolean, selectable: boolean, selected: boolean) =>
  `rounded-md overflow-hidden select-none transition-shadow duration-200 ${
    small
      ? 'w-[30px] h-[42px] sm:w-[40px] sm:h-[56px] md:w-[45px] md:h-[63px]'
      : 'w-[var(--card-width)] h-[var(--card-height)]'
  } ${selectable ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2' : ''} ${
    selected ? 'ring-2 ring-accent shadow-md' : 'shadow-sm'
  }`;

function getA11yProps(card: CardType | undefined, faceDown: boolean, selectable: boolean, selected: boolean, onClick?: () => void) {
  const label = card && !faceDown
    ? `${card.rank} of ${SUIT_NAMES[card.suit] || card.suit}${selected ? ', selected' : ''}`
    : 'Face-down card';
  if (!selectable) return { 'aria-label': label };
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    'aria-pressed': selected,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } },
  };
}

export function Card({ card, faceDown = false, selectable = false, selected = false, small = false, onClick }: CardProps) {
  const gameType = useGameStore((s) => s.gameType || s.room?.gameType);
  const isFaceCard = !faceDown && card && gameType !== 'rummy' && (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K');
  const a11y = getA11yProps(card, faceDown, selectable, selected, onClick);

  if (isFaceCard) {
    return (
      <motion.div
        whileHover={selectable ? { y: -4, scale: 1.02 } : undefined}
        animate={selected ? { y: -6 } : { y: 0 }}
        onClick={selectable ? onClick : undefined}
        className={sharedClass(small, selectable, selected)}
        style={getFaceSpriteStyle(card!.rank as string, card!.suit)}
        {...a11y}
      />
    );
  }

  const style: CardStyle = gameType === 'rummy' ? 'bicycle' : 'chkobba';
  const svg = useMemo(
    () => faceDown || !card ? generateCardBackSVG() : generateCardSVG(card.rank, card.suit, style),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faceDown, card?.rank, card?.suit, style]
  );

  return (
    <motion.div
      whileHover={selectable ? { y: -4, scale: 1.02 } : undefined}
      animate={selected ? { y: -6 } : { y: 0 }}
      onClick={selectable ? onClick : undefined}
      className={sharedClass(small, selectable, selected)}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...a11y}
    />
  );
}
