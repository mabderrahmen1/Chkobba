import { useGameStore } from '../../stores/useGameStore';
import { socket } from '../../lib/socket';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export function PlayerHand() {
  const { gameState, playerId, selectedCardIndex, setSelectedCard, selectedTableIndices, clearSelections, isDistributing } = useGameStore();
  const { playCardPlace, playCardHover } = useAmbianceSound();
  const handFlightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wasDistributing = useRef(isDistributing);

  useEffect(() => {
    const len = gameState?.hand?.length ?? 0;
    if (wasDistributing.current && !isDistributing && len > 0) {
      requestAnimationFrame(() => {
        const nodes = (gameState?.hand ?? [])
          .map((_, i) => handFlightRefs.current[i])
          .filter(Boolean) as HTMLDivElement[];
        if (nodes.length) {
          gsap.from(nodes, {
            y: -300,
            opacity: 0,
            scale: 0.5,
            duration: 0.45,
            stagger: 0.1,
            ease: 'power2.out',
          });
        }
      });
    }
    wasDistributing.current = isDistributing;
  }, [isDistributing, gameState?.hand, gameState?.hand?.length]);

  if (!gameState?.hand || !gameState?.tableCards || !playerId) return null;

  const isMyTurn = gameState.currentTurn === playerId;
  const canConfirm = isMyTurn && selectedCardIndex !== null && !isDistributing;

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
      playCardHover();
      setSelectedCard(index);
    }
  };

  const handleConfirmPlay = () => {
    if (!canConfirm || selectedCardIndex === null) return;

    if (selectedTableIndices.length === 0) {
      playCardPlace();
    }

    const idx = selectedCardIndex;
    const tableIdx = [...selectedTableIndices];
    const el = handFlightRefs.current[idx];

    const emit = () => {
      socket.emit('play_card', {
        cardIndex: idx,
        tableIndices: tableIdx,
      });
      clearSelections();
    };

    if (!el) {
      emit();
      return;
    }

    const felt = document.querySelector('[data-table-felt-center]');
    const rect = el.getBoundingClientRect();
    let tx = 0;
    let ty = -220;
    if (felt) {
      const fr = felt.getBoundingClientRect();
      tx = fr.left + fr.width / 2 - rect.left - rect.width / 2;
      ty = fr.top + fr.height / 2 - rect.top - rect.height / 2;
    }

    const isDrop = tableIdx.length === 0;
    const flightRot = isDrop ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 4;

    gsap.timeline({
      onComplete: () => {
        gsap.set(el, { clearProps: 'transform' });
        emit();
      },
    })
      .to(el, {
        x: tx,
        y: ty,
        scale: isDrop ? 1.08 : 1.06,
        rotation: flightRot,
        duration: 0.52,
        ease: 'power3.inOut',
      })
      .to(el, { y: '+=14', duration: 0.11, ease: 'power2.out' })
      .to(el, {
        y: '-=7',
        scale: isDrop ? 1.04 : 1.02,
        duration: 0.16,
        ease: 'bounce.out',
      });
  };

  const handSize = gameState.hand.length;

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

  const getButtonLabel = () => {
    if (isDrop) return 'Drop';
    if (selectedTableIndices.length > 0) {
      return isValidCapture ? 'Capture' : 'Invalid';
    }
    return 'Play';
  };

  const canPlay = canConfirm && (isDrop || isValidCapture);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4 w-full relative mt-2 sm:mt-4">
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

      <div
        className={`flex justify-center -space-x-6 sm:-space-x-4 relative min-h-[clamp(88px,16vh,180px)] sm:min-h-[140px] md:min-h-[180px] items-end pb-2 sm:pb-4 transition-opacity duration-300 ${
          isMyTurn ? 'opacity-100' : 'opacity-60'
        }`}
      >
        {!isDistributing &&
          gameState.hand.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const arc = getArcStyles(index, handSize);

            return (
              <div
                key={`${card.rank}-${card.suit}-${index}`}
                className="relative"
                style={{
                  transform: `rotate(${arc.rotate}deg) translateY(${arc.y}px)`,
                  transformOrigin: 'bottom center',
                  zIndex: isSelected ? 10 : index,
                }}
              >
                <div
                  ref={(el) => {
                    handFlightRefs.current[index] = el;
                  }}
                  className={`relative ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => handleCardClick(index)}
                  style={{ transformOrigin: 'bottom center' }}
                >
                  <Card card={card} selectable={isMyTurn} selected={isSelected} />
                </div>
              </div>
            );
          })}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isMyTurn ? 1 : 0,
          y: isMyTurn ? 0 : 20,
          scale: canPlay ? [1, 1.04, 1] : 1,
        }}
        transition={{
          scale: { repeat: canPlay ? Infinity : 0, duration: 2, ease: 'easeInOut' },
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
