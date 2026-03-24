import React, { forwardRef, useEffect, useRef } from 'react';
import gsap from 'gsap';
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

const SELECT_GLOW =
  '0 0 20px rgba(212,175,55,0.75), 0 0 6px rgba(253,224,71,0.5), 0 4px 14px rgba(0,0,0,0.35)';

// Sprite sheet: quadrilato.png is a 4-column x 4-row grid
const FACE_COL: Record<string, number> = { J: 0, Q: 1, K: 2 };
const FACE_ROW: Record<string, number> = { spades: 0, diamonds: 1, clubs: 2, hearts: 3 };

const SUIT_NAMES: Record<string, string> = {
  spades: 'Spades', diamonds: 'Diamonds', clubs: 'Clubs', hearts: 'Hearts'
};

function getFaceSpriteStyle(rank: string, suit: string): React.CSSProperties {
  const col = FACE_COL[rank] ?? 0;
  const row = FACE_ROW[suit] ?? 0;
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
  `rounded-md overflow-hidden select-none ${
    small
      ? 'w-[30px] h-[42px] sm:w-[40px] sm:h-[56px] md:w-[45px] md:h-[63px]'
      : 'w-[var(--card-width)] h-[var(--card-height)]'
  } ${selectable ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-brass focus-visible:outline-offset-2' : ''} ${
    selected ? '' : 'shadow-theme-sm'
  }`;

function getA11yProps(
  card: CardType | undefined,
  faceDown: boolean,
  selectable: boolean,
  selected: boolean,
  onClick?: () => void,
) {
  const label = card && !faceDown
    ? `${card.rank} of ${SUIT_NAMES[card.suit] || card.suit}${selected ? ', selected' : ''}`
    : 'Face-down card';

  if (!selectable) return { 'aria-label': label };

  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    'aria-pressed': selected,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
  };
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    card,
    faceDown = false,
    selectable = false,
    selected = false,
    small = false,
    onClick,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gameType = useGameStore((s) => s.gameType || s.room?.gameType);
  const isFaceCard =
    !faceDown &&
    card &&
    gameType !== 'rummy' &&
    (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K');

  const setRefs = (el: HTMLDivElement | null) => {
    (rootRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const a11y = getA11yProps(card, faceDown, selectable, selected, onClick);

  // Select / deselect (skip heavy GSAP on small thumbnails)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || small) return;
    gsap.killTweensOf(el);
    if (selected) {
      gsap.to(el, {
        y: -22,
        scale: 1.08,
        duration: 0.2,
        ease: 'back.out(2.5)',
        boxShadow: SELECT_GLOW,
      });
    } else {
      gsap.to(el, {
        y: 0,
        scale: 1,
        duration: 0.15,
        ease: 'power2.out',
        boxShadow: '0 0 0 rgba(0,0,0,0)',
      });
    }
  }, [selected, small]);

  // Hover (hand / table interaction cards only)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !selectable || small) return;

    const onEnter = () => {
      if (selected) return;
      gsap.to(el, { y: -12, scale: 1.05, duration: 0.15, ease: 'back.out(1.7)' });
    };
    const onLeave = () => {
      if (selected) {
        gsap.to(el, {
          y: -22,
          scale: 1.08,
          duration: 0.12,
          ease: 'back.out(2.5)',
          boxShadow: SELECT_GLOW,
        });
      } else {
        gsap.to(el, { y: 0, scale: 1, duration: 0.15, ease: 'power2.out', boxShadow: '0 0 0 rgba(0,0,0,0)' });
      }
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [selectable, selected, small]);

  if (isFaceCard) {
    return (
      <div
        ref={setRefs}
        onClick={selectable ? onClick : undefined}
        className={sharedClass(small, selectable, selected)}
        style={{ ...getFaceSpriteStyle(card!.rank as string, card!.suit), transformOrigin: 'bottom center' }}
        {...a11y}
      />
    );
  }

  const style: CardStyle = gameType === 'rummy' ? 'bicycle' : 'chkobba';
  const svg =
    faceDown || !card ? generateCardBackSVG() : generateCardSVG(card.rank, card.suit, style);

  return (
    <div
      ref={setRefs}
      onClick={selectable ? onClick : undefined}
      className={sharedClass(small, selectable, selected)}
      style={{ transformOrigin: 'bottom center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...a11y}
    />
  );
});
