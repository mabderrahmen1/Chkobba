import { useMemo } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';

export function PlayerHand() {
  const { gameState, playerId, selectedCardIndex, setSelectedCard, selectedTableIndices, clearSelections, isDistributing } = useGameStore();
  const { playCardPlace } = useAmbianceSound();

  if (!gameState?.hand || !gameState?.tableCards || !playerId) return null;

  const isMyTurn = gameState.currentTurn === playerId;
  const canConfirm = isMyTurn && selectedCardIndex !== null && !isDistributing;

  const selectedHandCard = selectedCardIndex !== null ? gameState.hand[selectedCardIndex] : null;
  const selectedTableCards = selectedTableIndices.filter(i => i >= 0 && i < gameState.tableCards.length).map(i => gameState.tableCards[i]);
  const tableSum = selectedTableCards.reduce((acc, c) => acc + c.value, 0);
  const handCardValue = selectedHandCard?.value ?? 0;
  const isValidCapture = selectedTableIndices.length > 0 && tableSum === handCardValue;
  const isDrop = selectedCardIndex !== null && selectedTableIndices.length === 0;

  const handleCardClick = (index: number) => {
    if (!isMyTurn || isDistributing) return;
    setSelectedCard(selectedCardIndex === index ? null : index);
  };

  const handleConfirmPlay = () => {
    if (!canConfirm || selectedCardIndex === null) return;
    if (selectedTableIndices.length === 0) playCardPlace();
    socket.emit('play_card', { cardIndex: selectedCardIndex, tableIndices: selectedTableIndices });
    clearSelections();
  };

  const handSize = gameState.hand.length;

  const arcStyles = useMemo(() => {
    const total = handSize;
    return gameState.hand.map((_, index) => {
      if (total === 1) return { rotate: 0, y: 0 };
      const maxAngle = Math.min(total * 8, 40);
      const radius = 300;
      const centerIndex = (total - 1) / 2;
      const normalizedPos = centerIndex === 0 ? 0 : (index - centerIndex) / centerIndex;
      const angleDeg = normalizedPos * (maxAngle / 2);
      const angleRad = (angleDeg * Math.PI) / 180;
      const yOffset = (radius - radius * Math.cos(angleRad)) * 1.5;
      return { rotate: angleDeg, y: yOffset };
    });
  }, [handSize, gameState.hand]);

  const getButtonLabel = () => {
    if (isDrop) return 'Drop';
    if (selectedTableIndices.length > 0) return isValidCapture ? `Capture ${selectedTableIndices.length}` : 'Invalid';
    return 'Play';
  };

  const canPlay = canConfirm && (isDrop || isValidCapture);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full relative mt-2 sm:mt-4">
      <div className={`flex justify-center -space-x-6 sm:-space-x-4 relative min-h-[120px] sm:min-h-[160px] md:min-h-[180px] items-end pb-2 sm:pb-4 transition-opacity duration-300 ${
        isMyTurn ? 'opacity-100' : 'opacity-60'
      }`}>
        <AnimatePresence mode="popLayout">
          {!isDistributing && gameState.hand.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const arc = arcStyles[index] ?? { rotate: 0, y: 0 };
            const dealDelay = Math.min(index * 0.06, 0.3);
            return (
              <motion.div
                key={`${card.rank}-${card.suit}`}
                layout
                initial={{ opacity: 0, y: -300, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  rotate: isSelected ? 0 : arc.rotate,
                  y: isSelected ? -24 : arc.y,
                  scale: isSelected ? 1.08 : 1,
                  zIndex: isSelected ? 10 : index
                }}
                exit={{ opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.2 } }}
                whileHover={isMyTurn && !isSelected ? { y: arc.y - 15, scale: 1.03 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 25, opacity: { duration: 0.2, delay: dealDelay }, y: { delay: dealDelay }, rotate: { delay: dealDelay }, scale: { delay: dealDelay } }}
                className={`relative ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleCardClick(index)}
                style={{ transformOrigin: 'bottom center' }}
              >
                <Card card={card} selectable={isMyTurn} selected={isSelected} />
                {isSelected && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-md border-2 border-accent/70 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Capture sum */}
      <AnimatePresence>
        {selectedCardIndex !== null && selectedTableIndices.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute right-0 sm:-right-8 bottom-[72px] px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-semibold ${
              isValidCapture ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'
            }`}>
            {handCardValue} {isValidCapture ? '=' : '\u2260'} {tableSum}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isMyTurn ? 1 : 0, y: isMyTurn ? 0 : 20, scale: canPlay ? [1, 1.03, 1] : 1 }}
        transition={{ scale: { repeat: canPlay ? Infinity : 0, duration: 2 } }}
        onClick={handleConfirmPlay}
        disabled={!canPlay}
        className={`absolute right-0 sm:-right-8 bottom-10 px-3 sm:px-5 py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
          canPlay ? 'bg-accent text-white cursor-pointer hover:bg-accent/90'
            : selectedTableIndices.length > 0 && !isValidCapture && canConfirm ? 'bg-danger/10 text-danger border border-danger/30 opacity-70 cursor-not-allowed'
            : 'bg-surface-2 border border-border text-text-tertiary opacity-40 cursor-not-allowed'
        }`}
      >
        {getButtonLabel()}
      </motion.button>

      {!isMyTurn && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
          className="absolute -bottom-6 text-text-secondary italic text-xs sm:text-sm">
          Waiting for opponent...
        </motion.div>
      )}
    </div>
  );
}
