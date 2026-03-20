import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '@shared/types.js';
import { Card } from './Card';
import { useGameStore } from '../../stores/useGameStore';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { useRef, useEffect } from 'react';

interface TableCardsProps {
  cards: CardType[];
}

export function TableCards({ cards }: TableCardsProps) {
  const { toggleTableCard, selectedTableIndices, gameState, playerId, isDistributing } = useGameStore();
  const { playCardCapture } = useAmbianceSound();
  const isMyTurn = gameState?.currentTurn === playerId;
  const prevCount = useRef(cards.length);
  const wasCapture = useRef(false);

  useEffect(() => {
    if (cards.length < prevCount.current) {
      wasCapture.current = true;
      playCardCapture();
    } else {
      wasCapture.current = false;
    }
    prevCount.current = cards.length;
  }, [cards.length, playCardCapture]);

  const lastAction = gameState?.lastAction;
  const wasMe = lastAction?.playerId === playerId && lastAction.type === 'capture';

  if (cards.length === 0 || isDistributing) {
    return (
      <div className="flex items-center justify-center min-h-[var(--card-height)] p-4">
        {!isDistributing && <span className="text-text-tertiary italic text-sm">Table is empty</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full min-h-[150px] sm:min-h-[200px] p-4 sm:p-6">
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => {
          const isSelected = selectedTableIndices.includes(index);
          return (
            <motion.div
              key={`${card.rank}-${card.suit}`}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -30 }}
              animate={{ opacity: 1, scale: isSelected ? 1.06 : 1, y: isSelected ? -8 : 0 }}
              exit={wasMe ? { opacity: 0, scale: 0, transition: { duration: 0 } } : {
                opacity: 0, scale: 0.3, y: 40, rotate: (Math.random() - 0.5) * 20, transition: { duration: 0.4 },
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative cursor-pointer"
              onClick={() => isMyTurn && toggleTableCard(index)}
            >
              <Card card={card} selected={isSelected} selectable={isMyTurn} />
              {isSelected && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-md border-2 border-accent/70 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
