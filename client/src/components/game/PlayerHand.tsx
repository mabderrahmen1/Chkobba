import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

export function PlayerHand() {
  const { gameState, playerId, selectedCardIndex, setSelectedCard, selectedTableIndices, clearSelections } = useGameStore();
  const { playCardPlace } = useAmbianceSound();

  if (!gameState?.hand || !playerId) return null;

  const isMyTurn = gameState.currentTurn === playerId;
  const canConfirm = isMyTurn && selectedCardIndex !== null;

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    if (selectedCardIndex === index) {
      setSelectedCard(null);
    } else {
      setSelectedCard(index);
    }
  };

  const handleConfirmPlay = () => {
    if (!canConfirm || selectedCardIndex === null) return;
    playCardPlace();
    socket.emit('play_card', {
      cardIndex: selectedCardIndex,
      tableIndices: selectedTableIndices
    });
    clearSelections();
  };

  const handSize = gameState.hand.length;
  const getArcStyles = (index: number) => {
    if (handSize === 1) return { rotate: 0, y: 0 };
    if (handSize === 2) {
      return index === 0 ? { rotate: -5, y: 0 } : { rotate: 5, y: 0 };
    }
    if (index === 0) return { rotate: -8, y: 5 };
    if (index === 1) return { rotate: 0, y: -10 };
    return { rotate: 8, y: 5 };
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full relative mt-2 sm:mt-4">
      {/* Turn glow behind cards */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 -inset-y-4 rounded-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 80%, rgba(212,175,55,0.15) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Hand Cards */}
      <div className={`flex justify-center -space-x-6 sm:-space-x-4 relative h-[100px] sm:h-[130px] md:h-[150px] items-end pb-2 sm:pb-4 transition-opacity duration-300 ${
        isMyTurn ? 'opacity-100' : 'opacity-60'
      }`}>
        <AnimatePresence mode="popLayout">
          {gameState.hand.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const arc = getArcStyles(index);

            return (
              <motion.div
                key={`${card.rank}-${card.suit}`}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  rotate: isSelected ? 0 : arc.rotate,
                  y: isSelected ? -24 : arc.y,
                  scale: isSelected ? 1.08 : 1,
                  zIndex: isSelected ? 10 : index
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0 },
                }}
                whileHover={isMyTurn && !isSelected ? { y: arc.y - 15, scale: 1.03 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`relative ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleCardClick(index)}
                style={{ transformOrigin: 'bottom center' }}
              >
                <Card
                  card={card}
                  selectable={isMyTurn}
                  selected={isSelected}
                />
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-lg border-2 border-green-400/70 shadow-glow-green pointer-events-none"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Play Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isMyTurn ? 1 : 0,
          y: isMyTurn ? 0 : 20,
          scale: canConfirm ? [1, 1.04, 1] : 1
        }}
        transition={{
          scale: { repeat: canConfirm ? Infinity : 0, duration: 2, ease: "easeInOut" }
        }}
        onClick={handleConfirmPlay}
        disabled={!canConfirm}
        className={`absolute -right-4 sm:-right-8 bottom-10 px-4 sm:px-6 py-2 rounded-lg font-ancient font-bold tracking-widest uppercase text-xs sm:text-sm transition-all duration-300 ${
          canConfirm
            ? 'bg-emerald-600 border-2 border-emerald-400/60 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] cursor-pointer hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]'
            : 'bg-wood-dark border-2 border-wood-light text-foreground-muted opacity-40 cursor-not-allowed'
        }`}
      >
        Play
      </motion.button>

      {!isMyTurn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="absolute -bottom-6 text-cream-dark font-ancient italic tracking-wider text-xs sm:text-sm"
        >
          Waiting for opponent...
        </motion.div>
      )}
    </div>
  );
}
