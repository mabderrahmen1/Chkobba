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

  // Capture sum logic
  const selectedHandCard = selectedCardIndex !== null ? gameState.hand[selectedCardIndex] : null;
  const selectedTableCards = selectedTableIndices
    .filter(i => i >= 0 && i < gameState.tableCards.length)
    .map(i => gameState.tableCards[i]);
  const tableSum = selectedTableCards.reduce((acc, c) => acc + c.value, 0);
  const handCardValue = selectedHandCard?.value ?? 0;
  const isValidCapture = selectedTableIndices.length > 0 && tableSum === handCardValue;
  const isDrop = selectedCardIndex !== null && selectedTableIndices.length === 0;

  const handleCardClick = (index: number) => {
    if (!isMyTurn || isDistributing) return;
    if (selectedCardIndex === index) {
      setSelectedCard(null);
    } else {
      setSelectedCard(index);
    }
  };

  const handleConfirmPlay = () => {
    if (!canConfirm || selectedCardIndex === null) return;

    if (selectedTableIndices.length === 0) {
      playCardPlace();
    }

    socket.emit('play_card', {
      cardIndex: selectedCardIndex,
      tableIndices: selectedTableIndices
    });
    clearSelections();
  };

  const handSize = gameState.hand.length;

  // Mathematical radial fan calculation
  const getArcStyles = (index: number, total: number) => {
    if (total === 1) return { rotate: 0, y: 0 };

    const maxAngle = Math.min(total * 8, 40);
    const radius = 300;
    const centerIndex = (total - 1) / 2;
    const normalizedPos = centerIndex === 0 ? 0 : (index - centerIndex) / centerIndex;
    const angleDeg = normalizedPos * (maxAngle / 2);
    const angleRad = (angleDeg * Math.PI) / 180;
    const yOffset = (radius - radius * Math.cos(angleRad)) * 1.5;

    return { rotate: angleDeg, y: yOffset };
  };

  // Contextual button label
  const getButtonLabel = () => {
    if (isDrop) return 'Drop';
    if (selectedTableIndices.length > 0) {
      return isValidCapture ? `Capture ${selectedTableIndices.length}` : 'Invalid';
    }
    return 'Play';
  };

  // Button should be disabled for invalid captures
  const canPlay = canConfirm && (isDrop || isValidCapture);

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
      <div className={`flex justify-center -space-x-6 sm:-space-x-4 relative min-h-[120px] sm:min-h-[160px] md:min-h-[180px] items-end pb-2 sm:pb-4 transition-opacity duration-300 ${
        isMyTurn ? 'opacity-100' : 'opacity-60'
      }`}>
        <AnimatePresence mode="popLayout">
          {!isDistributing && gameState.hand.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const arc = getArcStyles(index, handSize);

            return (
              <motion.div
                key={`${card.rank}-${card.suit}`}
                layout
                initial={{ opacity: 0, y: -300, x: 0, scale: 0.5, rotate: 0 }}
                animate={{
                  opacity: 1,
                  rotate: isSelected ? 0 : arc.rotate,
                  y: isSelected ? -24 : arc.y,
                  x: 0,
                  scale: isSelected ? 1.08 : 1,
                  zIndex: isSelected ? 10 : index
                }}
                exit={{
                  opacity: 0,
                  y: -50,
                  scale: 0.8,
                  transition: { duration: 0.2 },
                }}
                whileHover={isMyTurn && !isSelected ? { y: arc.y - 15, scale: 1.03 } : undefined}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  opacity: { duration: 0.2, delay: index * 0.1 },
                  y: { type: 'spring', stiffness: 300, damping: 25, delay: index * 0.1 },
                  rotate: { type: 'spring', stiffness: 300, damping: 25, delay: index * 0.1 },
                  scale: { type: 'spring', stiffness: 300, damping: 25, delay: index * 0.1 }
                }}
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

      {/* Capture sum indicator */}
      <AnimatePresence>
        {selectedCardIndex !== null && selectedTableIndices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute right-0 sm:-right-8 bottom-[72px] px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold backdrop-blur-sm ${
              isValidCapture
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-900/80 text-red-300 border border-red-500/40'
            }`}
          >
            {handCardValue} {isValidCapture ? '=' : '\u2260'} {tableSum}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Play Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isMyTurn ? 1 : 0,
          y: isMyTurn ? 0 : 20,
          scale: canPlay ? [1, 1.04, 1] : 1
        }}
        transition={{
          scale: { repeat: canPlay ? Infinity : 0, duration: 2, ease: "easeInOut" }
        }}
        onClick={handleConfirmPlay}
        disabled={!canPlay}
        className={`absolute right-0 sm:-right-8 bottom-10 px-3 sm:px-6 py-2 rounded-lg font-ancient font-bold tracking-widest uppercase text-[10px] sm:text-sm transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center ${
          canPlay
            ? 'bg-emerald-600 border-2 border-emerald-400/60 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] cursor-pointer hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]'
            : selectedTableIndices.length > 0 && !isValidCapture && canConfirm
              ? 'bg-red-900/60 border-2 border-red-500/40 text-red-300 opacity-70 cursor-not-allowed'
              : 'bg-wood-dark border-2 border-wood-light text-foreground-muted opacity-40 cursor-not-allowed'
        }`}
      >
        {getButtonLabel()}
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
