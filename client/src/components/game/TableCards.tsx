import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '@shared/types.js';
import { Card } from './Card';
import { useGameStore } from '../../stores/useGameStore';

interface TableCardsProps {
  cards: CardType[];
}

export function TableCards({ cards }: TableCardsProps) {
  const { toggleTableCard, selectedTableIndices, gameState, playerId } = useGameStore();
  const isMyTurn = gameState?.currentTurn === playerId;

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[var(--card-height)] p-4">
        <span className="text-cream-dark/30 italic text-sm font-ancient">Table is empty</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full min-h-[var(--card-height)] p-3 sm:p-4">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isSelected = selectedTableIndices.includes(index);
          return (
            <motion.div
              key={`${card.rank}-${card.suit}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.06 : 1,
                y: isSelected ? -8 : 0
              }}
              exit={{ opacity: 0, scale: 0.7, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative cursor-pointer"
              onClick={() => isMyTurn && toggleTableCard(index)}
            >
              <Card
                card={card}
                selected={isSelected}
                selectable={isMyTurn}
              />
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-md border-2 border-brass/70 shadow-glow-gold pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
