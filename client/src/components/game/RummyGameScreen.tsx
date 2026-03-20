import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useSocketStore } from '../../stores/useSocketStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Card } from './Card';
import { Button } from '../ui/Button';
import { GameOverModal } from './GameOverModal';
import { MusicControl } from './MusicControl';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { DealingAnimation } from './DealingAnimation';
import type { RummyPlayer, Meld, MeldType, Card as CardType } from '@shared/types';

interface DragCard {
  cardIndex: number;
  playerId: string;
}

export function RummyGameScreen() {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [layOffMode, setLayOffMode] = useState(false);
  const [draggedCard, setDraggedCard] = useState<DragCard | null>(null);
  const [meldPreview, setMeldPreview] = useState<Meld | null>(null);
  const [sortMode, setSortMode] = useState<'suit' | 'rank' | 'none'>('none');

  const gameState = useGameStore((s) => s.rummyGameState);
  const playerId = useGameStore((s) => s.playerId);
  const gameOverData = useGameStore((s) => s.gameOverData);
  const isConnected = useSocketStore((s) => s.isConnected);
  const isDistributing = useGameStore((s) => s.isDistributing);
  const { playCardSlide, playCardPlace, playCardShuffle, playCardCapture } = useAmbianceSound();

  const [isOverMeldZone, setIsOverMeldZone] = useState(false);
  const prevDiscardCount = useRef(gameState.discardPile.length);

  useEffect(() => {
    if (gameState.discardPile.length < prevDiscardCount.current) {
      playCardCapture();
    }
    prevDiscardCount.current = gameState.discardPile.length;
  }, [gameState.discardPile.length, playCardCapture]);

  useEffect(() => {
    if (isDistributing) {
      playCardShuffle();
    }
  }, [isDistributing, playCardShuffle]);

  if (!gameState) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-bg">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-secondary animate-pulse text-sm">Preparing Table...</p>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isCurrentTurn = gameState.currentTurn === playerId;
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  const getSortedHand = () => {
    if (!currentPlayer?.hand) return [];
    if (sortMode === 'none') return currentPlayer.hand.map((_, i) => ({ card: _, index: i }));

    const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
    const rankOrder = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, Joker: 0 };

    const indexed = currentPlayer.hand.map((card, i) => ({ card, index: i }));

    if (sortMode === 'suit') {
      return indexed.sort((a, b) => {
        const suitDiff = suitOrder[a.card.suit as keyof typeof suitOrder] - suitOrder[b.card.suit as keyof typeof suitOrder];
        if (suitDiff !== 0) return suitDiff;
        return rankOrder[a.card.rank as keyof typeof rankOrder] - rankOrder[b.card.rank as keyof typeof rankOrder];
      });
    }

    if (sortMode === 'rank') {
      return indexed.sort((a, b) => {
        return rankOrder[b.card.rank as keyof typeof rankOrder] - rankOrder[a.card.rank as keyof typeof rankOrder];
      });
    }

    return indexed;
  };

  const sortedHand = getSortedHand();
  const hasDrawn = gameState.hasDrawn;

  const handleDraw = () => {
    if (!isCurrentTurn || !isConnected) return;
    playCardSlide();
    socket.emit('rummy_draw');
  };

  const handleDrawDiscard = () => {
    if (!isCurrentTurn || !isConnected) return;
    socket.emit('rummy_draw_discard');
  };

  const handleDiscard = (cardIndex: number) => {
    if (!isCurrentTurn || !isConnected) return;
    playCardPlace();
    socket.emit('rummy_discard', { cardIndex });
    setSelectedCards([]);
  };

  const handleCreateMeld = (type: 'set' | 'sequence') => {
    if (!isCurrentTurn || !isConnected) return;
    playCardPlace();
    socket.emit('rummy_meld', { cardIndices: selectedCards, type });
    setSelectedCards([]);
    setMeldPreview(null);
    setLayOffMode(false);
  };

  const handleLayOff = (meldId: string) => {
    if (!isCurrentTurn || !isConnected || selectedCards.length !== 1) return;
    playCardPlace();
    socket.emit('rummy_lay_off', { meldId, cardIndex: selectedCards[0] });
    setSelectedCards([]);
    setLayOffMode(false);
  };

  const handleLayOffDrop = (meldId: string) => {
    if (!isCurrentTurn || !isConnected || !draggedCard) return;
    playCardPlace();
    socket.emit('rummy_lay_off', { meldId, cardIndex: draggedCard.cardIndex });
    setSelectedCards([]);
    setLayOffMode(false);
    setDraggedCard(null);
    setIsOverMeldZone(false);
  };

  const toggleCardSelection = (index: number) => {
    setSelectedCards((prev) => {
      const next = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index];
      if (next.length === 1 && hasDrawn) setLayOffMode(true);
      else setLayOffMode(false);
      return next;
    });
  };

  const handleDragStart = (cardIndex: number) => {
    if (!isCurrentTurn) return;
    setDraggedCard({ cardIndex, playerId: playerId! });
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setIsOverMeldZone(false);
  };

  const handleDropOnMeldZone = () => {
    if (!draggedCard || !isCurrentTurn) return;

    const indices = selectedCards.includes(draggedCard.cardIndex)
      ? selectedCards
      : [...selectedCards, draggedCard.cardIndex];

    if (indices.length >= 3 && currentPlayer?.hand) {
      const cards = indices.map(i => currentPlayer.hand[i]);
      const nonJokers = cards.filter(c => !c.isJoker);

      let type: 'set' | 'sequence' = 'sequence';

      if (nonJokers.length >= 2) {
        if (nonJokers[0].rank === nonJokers[1].rank) {
          type = 'set';
        }
      } else if (nonJokers.length === 1) {
        type = 'set';
      }

      handleCreateMeld(type);
    }

    setDraggedCard(null);
    setIsOverMeldZone(false);
  };

  const handleLeave = () => {
    if (window.confirm("Are you sure you want to leave the game?")) {
      socket.emit('leave_room');
      useUIStore.getState().setIsSubmitting(false);
      useUIStore.getState().setScreen('landing');
      sessionStorage.removeItem('chkobba-storage');
      setTimeout(() => {
        useGameStore.getState().reset();
      }, 500);
    }
  };

  return (
    <motion.section
      id="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full flex flex-col bg-bg overflow-hidden relative"
    >
      <h1 className="sr-only">Rummy Game</h1>
      <DealingAnimation />

      {/* Top bar */}
      <div className="flex-none h-12 flex items-center justify-between px-4 sm:px-6 relative z-20 w-full mt-2">
        <div className="w-[100px]"></div>
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState.currentTurn}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full ${
              isCurrentTurn
                ? 'bg-accent/15 border border-accent/40'
                : 'bg-surface-2 border border-border'
            }`}
          >
            <motion.span
              animate={isCurrentTurn ? { opacity: [1, 0.6, 1] } : { opacity: 0.7 }}
              className={`text-[10px] sm:text-sm uppercase tracking-wider font-semibold ${
                isCurrentTurn ? 'text-accent' : 'text-text-tertiary'
              }`}
            >
              {isCurrentTurn ? 'Your Turn' : `${gameState.players.find(p => p.id === gameState.currentTurn)?.nickname || 'Player'}'s Turn`}
            </motion.span>
          </motion.div>
        </AnimatePresence>

        <div className="w-[100px] flex justify-end">
          <button
            onClick={handleLeave}
            className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs uppercase tracking-wider hover:bg-danger/20 transition-all"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Mobile opponent indicators */}
      <div className="lg:hidden flex-none flex justify-center gap-2 sm:gap-4 px-4 py-2">
        {gameState.players.filter(p => p.id !== playerId).map((player) => (
          <motion.div
            key={player.id}
            animate={gameState.currentTurn === player.id ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 ${
              gameState.currentTurn === player.id ? 'ring-1 ring-accent/50' : ''
            }`}
          >
            <div className="flex -space-x-2">
              {player.hand.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-7 sm:w-6 sm:h-8 bg-surface-3 rounded border border-border"
                />
              ))}
            </div>
            <span className="text-text-secondary text-[10px] sm:text-xs font-medium">{player.nickname}</span>
            <span className="text-text-tertiary text-[9px] sm:text-xs">{player.hand.length}</span>
          </motion.div>
        ))}
      </div>

      {/* Main game area */}
      <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
        {/* Left opponent */}
        {gameState.players.filter(p => p.id !== playerId).filter((_, i, arr) => arr.length > 1).slice(0, 1).map((player) => (
          <RummyPlayerZone
            key={player.id}
            player={player}
            position="left"
            isCurrentTurn={gameState.currentTurn === player.id}
            isDistributing={isDistributing}
          />
        ))}

        {/* Center table */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4">
          <TableArea
            gameState={gameState}
            isCurrentTurn={isCurrentTurn}
            onDraw={handleDraw}
            onDrawDiscard={handleDrawDiscard}
            topDiscard={topDiscard}
            playerId={playerId}
            draggedCard={draggedCard}
            isOverMeldZone={isOverMeldZone}
            setIsOverMeldZone={setIsOverMeldZone}
            onDrop={handleDropOnMeldZone}
            setDraggedCard={setDraggedCard}
            layOffMode={layOffMode && isCurrentTurn && hasDrawn}
            onLayOff={handleLayOff}
            onLayOffDrop={handleLayOffDrop}
            isDistributing={isDistributing}
          />
        </div>

        {/* Right opponent */}
        {gameState.players.filter(p => p.id !== playerId).filter((_, i, arr) => arr.length > 1).slice(1).map((player) => (
          <RummyPlayerZone
            key={player.id}
            player={player}
            position="right"
            isCurrentTurn={gameState.currentTurn === player.id}
            isDistributing={isDistributing}
          />
        ))}
      </div>

      {/* Player hand area */}
      <div className="flex-none p-2 sm:p-4 pb-4 sm:pb-6 relative z-20 w-full">
        <RummyPlayerHand
          sortedHand={sortedHand}
          selectedCards={selectedCards}
          isCurrentTurn={isCurrentTurn}
          onToggleCard={toggleCardSelection}
          onDiscard={handleDiscard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          selectedMeldType={meldPreview?.type || null}
          onCreateMeld={handleCreateMeld}
          sortMode={sortMode}
          onSortChange={setSortMode}
          isDistributing={isDistributing}
        />
      </div>

      {/* Music Control */}
      <MusicControl />

      {/* Game Over Modal */}
      {gameOverData && <GameOverModal />}
    </motion.section>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface RummyPlayerZoneProps {
  player: RummyPlayer;
  position: 'left' | 'right' | 'opponent' | 'self';
  isCurrentTurn: boolean;
  isDistributing: boolean;
}

function RummyPlayerZone({ player, position, isCurrentTurn, isDistributing }: RummyPlayerZoneProps) {
  return (
    <motion.div
      animate={isCurrentTurn ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`hidden lg:flex flex-col items-center p-3 sm:p-4 rounded-xl bg-surface-1 border border-border min-w-[120px] sm:min-w-[140px] mx-1 sm:mx-2 ${
        isCurrentTurn ? 'ring-2 ring-accent/40' : ''
      }`}
    >
      <div className={`text-xs sm:text-sm font-semibold mb-2 ${isCurrentTurn ? 'text-accent' : 'text-text-primary'}`}>
        {player.nickname}
      </div>
      <div className="flex -space-x-4 sm:-space-x-6">
        {!isDistributing && player.hand.slice(0, 5).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: i * 20 }}
            animate={{ x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-8 h-11 sm:w-10 sm:h-14 bg-surface-3 rounded border border-border shadow-sm"
          />
        ))}
        {!isDistributing && player.hand.length > 5 && (
          <div className="w-8 h-11 sm:w-10 sm:h-14 flex items-center justify-center text-text-tertiary text-xs font-bold">
            +{player.hand.length - 5}
          </div>
        )}
      </div>
      <div className="text-text-tertiary text-[10px] sm:text-xs mt-2">{!isDistributing ? player.hand.length : 0} cards</div>
      {!isDistributing && player.melds.length > 0 && (
        <div className="flex gap-1 mt-2">
          {player.melds.slice(0, 3).map((meld, idx) => (
            <div key={idx} className="w-5 h-7 sm:w-6 sm:h-8 bg-surface-3 rounded border border-border" />
          ))}
          {player.melds.length > 3 && (
            <span className="text-text-tertiary text-[10px]">+{player.melds.length - 3}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface TableAreaProps {
  gameState: any;
  isCurrentTurn: boolean;
  onDraw: () => void;
  onDrawDiscard: () => void;
  topDiscard?: any;
  playerId: string | null;
  draggedCard: DragCard | null;
  isOverMeldZone: boolean;
  setIsOverMeldZone: (v: boolean) => void;
  onDrop: () => void;
  setDraggedCard: (c: DragCard | null) => void;
  layOffMode: boolean;
  onLayOff: (meldId: string) => void;
  onLayOffDrop: (meldId: string) => void;
  isDistributing: boolean;
}

function TableArea({
  gameState,
  isCurrentTurn,
  onDraw,
  onDrawDiscard,
  topDiscard,
  playerId,
  draggedCard,
  isOverMeldZone,
  setIsOverMeldZone,
  onDrop,
  setDraggedCard,
  layOffMode,
  onLayOff,
  onLayOffDrop,
  isDistributing,
}: TableAreaProps) {
  const currentPlayer = gameState.players.find((p: RummyPlayer) => p.id === playerId);

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 py-4 sm:py-8">
      {/* Draw and Discard piles */}
      <div className="flex gap-3 sm:gap-6 md:gap-10 items-center">
        {/* Draw pile */}
        <motion.div
          className="flex flex-col items-center gap-2"
          whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
        >
          <div className="text-text-secondary text-[10px] sm:text-xs uppercase tracking-wider">Draw</div>
          <button
            onClick={onDraw}
            disabled={!isCurrentTurn || isDistributing}
            className={`relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg border-2 transition-all duration-300 ${
              isCurrentTurn && !isDistributing
                ? 'border-accent/50 cursor-pointer hover:border-accent'
                : 'border-border cursor-not-allowed opacity-40'
            } bg-surface-3`}
          >
            {!isDistributing && (
              <>
                <div className="absolute inset-2 rounded border border-border" />
                <div className="absolute inset-4 rounded border border-border/50" />
              </>
            )}
          </button>
          <div className="text-text-tertiary text-[10px] sm:text-xs">{!isDistributing ? gameState.drawPile.length : 0} cards</div>
        </motion.div>

        {/* Meld zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (isCurrentTurn) setIsOverMeldZone(true);
          }}
          onDragLeave={() => setIsOverMeldZone(false)}
          onDrop={(e) => {
            e.preventDefault();
            onDrop();
          }}
          className={`relative flex-1 min-w-[140px] sm:min-w-[240px] min-h-[100px] sm:min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-300 p-2 sm:p-4 ${
            layOffMode
              ? 'border-success/70 bg-success/10'
              : isOverMeldZone
              ? 'border-accent/50 bg-accent/5'
              : 'border-border bg-surface-2/50'
          }`}
        >
          {(() => {
            if (isDistributing) return null;
            const allMelds = gameState.players.flatMap((p: RummyPlayer) => p.melds);
            if (allMelds.length === 0) {
              return (
                <div className="flex items-center justify-center w-full h-full min-h-[80px]">
                  <div className="text-center">
                    <div className="text-text-tertiary text-xs uppercase tracking-wider mb-1">Meld Zone</div>
                    <div className="text-text-tertiary/60 text-xs">
                      {layOffMode ? 'No melds to lay off on' : 'Select 3+ cards to meld'}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="flex flex-wrap gap-1 sm:gap-2 items-start">
                {allMelds.map((meld: Meld, idx: number) => (
                  <motion.div
                    key={meld.id || idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => layOffMode && onLayOff(meld.id)}
                    onDragOver={(e) => {
                      if (draggedCard) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onDrop={(e) => {
                      if (draggedCard) {
                        e.preventDefault();
                        e.stopPropagation();
                        onLayOffDrop(meld.id);
                      }
                    }}
                    className={`flex gap-0.5 sm:gap-1 p-1 rounded-lg transition-all duration-200 ${
                      layOffMode
                        ? 'bg-success/10 border border-success/40 cursor-pointer hover:border-success'
                        : 'bg-surface-3 border border-transparent hover:border-success/40'
                    }`}
                  >
                    {meld.cards.map((card: CardType, cardIdx: number) => (
                      <div key={cardIdx} className="w-8 h-11 sm:w-10 sm:h-14">
                        <Card card={card} small />
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            );
          })()}
          {layOffMode && !isDistributing && (
            <div className="absolute top-1 right-2 text-success/80 text-[9px] uppercase tracking-wider">
              Click meld to lay off
            </div>
          )}
        </div>

        {/* Discard pile */}
        <motion.div
          className="flex flex-col items-center gap-2"
          whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
        >
          <div className="text-text-secondary text-[10px] sm:text-xs uppercase tracking-wider">Discard</div>
          {topDiscard && !isDistributing ? (
            <button
              onClick={onDrawDiscard}
              disabled={!isCurrentTurn}
              className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg transition-all duration-300 ${
                isCurrentTurn
                  ? 'cursor-pointer hover:ring-2 hover:ring-accent/30'
                  : 'cursor-not-allowed opacity-40'
              }`}
            >
              <Card card={topDiscard} small />
            </button>
          ) : (
            <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg border-2 border-dashed border-border bg-surface-2/50" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface SortedCard {
  card: any;
  index: number;
}

interface RummyPlayerHandProps {
  sortedHand: SortedCard[];
  selectedCards: number[];
  isCurrentTurn: boolean;
  onToggleCard: (i: number) => void;
  onDiscard: (i: number) => void;
  onDragStart: (i: number) => void;
  onDragEnd: () => void;
  selectedMeldType: MeldType | null;
  onCreateMeld: (type: MeldType) => void;
  sortMode: 'suit' | 'rank' | 'none';
  onSortChange: (mode: 'suit' | 'rank' | 'none') => void;
  isDistributing: boolean;
}

function RummyPlayerHand({
  sortedHand,
  selectedCards,
  isCurrentTurn,
  onToggleCard,
  onDiscard,
  onDragStart,
  onDragEnd,
  selectedMeldType,
  onCreateMeld,
  sortMode,
  onSortChange,
  isDistributing,
}: RummyPlayerHandProps) {
  const originalIndices = sortedHand.map(h => h.index);
  const mappedSelectedCards = selectedCards.filter(i => originalIndices.includes(i));

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Sort buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          variant={sortMode === 'none' ? 'primary' : 'secondary'}
          onClick={() => onSortChange('none')}
          className="px-3 py-1 text-xs"
        >
          Original
        </Button>
        <Button
          variant={sortMode === 'suit' ? 'primary' : 'secondary'}
          onClick={() => onSortChange('suit')}
          className="px-3 py-1 text-xs"
        >
          Sort by Suit
        </Button>
        <Button
          variant={sortMode === 'rank' ? 'primary' : 'secondary'}
          onClick={() => onSortChange('rank')}
          className="px-3 py-1 text-xs"
        >
          Sort by Rank
        </Button>
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {!isDistributing && mappedSelectedCards.length >= 3 && isCurrentTurn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex gap-2 flex-wrap justify-center"
          >
            <Button
              variant="secondary"
              onClick={() => onCreateMeld('set')}
              className="px-4 py-1.5 text-xs sm:text-sm"
            >
              Create Set
            </Button>
            <Button
              onClick={() => onCreateMeld('sequence')}
              className="px-4 py-1.5 text-xs sm:text-sm"
            >
              Create Sequence
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="flex justify-center items-end w-full px-4 overflow-visible">
        {!isDistributing && sortedHand.map((item, displayIndex) => {
          const originalIndex = item.index;
          const card = item.card;
          const isSelected = selectedCards.includes(originalIndex);
          const totalCards = sortedHand.length;

          const centerOffset = (displayIndex - (totalCards - 1) / 2);
          const rotation = centerOffset * 0.4;

          return (
            <motion.div
              key={originalIndex}
              layout
              initial={{ y: 50, opacity: 0 }}
              animate={{
                y: isSelected ? -16 : 0,
                opacity: 1,
                rotate: rotation,
              }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              draggable={isCurrentTurn}
              onDragStart={() => onDragStart(originalIndex)}
              onDragEnd={onDragEnd}
              onClick={() => onToggleCard(originalIndex)}
              className={`relative flex-shrink-0 transition-all duration-200 ${
                isCurrentTurn ? 'cursor-pointer hover:-translate-y-4' : 'cursor-not-allowed'
              } ${isSelected ? 'ring-2 ring-accent/80 ring-offset-1 ring-offset-bg' : ''}`}
              style={{
                width: 'clamp(50px, 9vw, 70px)',
                marginLeft: displayIndex > 0 ? 'clamp(-25px, -5vw, -40px)' : '0',
                zIndex: displayIndex,
              }}
            >
              <Card card={card} />

              {isCurrentTurn && isSelected && mappedSelectedCards.length === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
                >
                  <Button
                    variant="danger"
                    onClick={() => onDiscard(originalIndex)}
                    className="text-xs px-2 py-0.5"
                  >
                    Discard
                  </Button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
