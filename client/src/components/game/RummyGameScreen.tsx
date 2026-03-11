import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useSocketStore } from '../../stores/useSocketStore';
import { socket } from '../../lib/socket';
import { Card } from './Card';
import { Button } from '../ui/Button';
import { GameOverModal } from './GameOverModal';
import { VintageRadio } from './ambiance/VintageRadio';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import type { RummyPlayer, Meld, MeldType } from '@shared/types';

interface DragCard {
  cardIndex: number;
  playerId: string;
}

export function RummyGameScreen() {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [draggedCard, setDraggedCard] = useState<DragCard | null>(null);
  const [meldPreview, setMeldPreview] = useState<Meld | null>(null);
  const [sortMode, setSortMode] = useState<'suit' | 'rank' | 'none'>('none');
  
  const gameState = useGameStore((s) => s.rummyGameState);
  const playerId = useGameStore((s) => s.playerId);
  const gameOverData = useGameStore((s) => s.gameOverData);
  const isConnected = useSocketStore((s) => s.isConnected);
  const { playCardSlide, playCardPlace } = useAmbianceSound();

  const [isOverMeldZone, setIsOverMeldZone] = useState(false);

  if (!gameState) return null;

  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isCurrentTurn = gameState.currentTurn === playerId;
  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  // Sort hand based on sort mode
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
  const hasDrawn = true; // Simplified - would track from game state

  const handleDraw = () => {
    if (!isCurrentTurn || !isConnected) return;
    playCardSlide();
    socket.emit('rummy_draw');
  };

  const handleDrawDiscard = () => {
    if (!isCurrentTurn || !isConnected) return;
    playCardSlide();
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
  };

  const toggleCardSelection = (index: number) => {
    setSelectedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Drag handlers
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
    
    // Auto-detect meld type based on selected cards
    const indices = selectedCards.includes(draggedCard.cardIndex)
      ? selectedCards
      : [...selectedCards, draggedCard.cardIndex];
    
    if (indices.length >= 3) {
      // Would need to validate meld type here
      // For now, just create with first valid type
      handleCreateMeld('set');
    }
    
    setDraggedCard(null);
    setIsOverMeldZone(false);
  };

  // Get player position for horizontal layout
  const getPlayerPosition = (index: number, total: number) => {
    if (total === 2) {
      return index === 0 ? 'opponent' : 'self';
    }
    if (total === 3) {
      if (gameState.players[index].id === playerId) return 'self';
      return index < total / 2 ? 'left' : 'right';
    }
    // 4+ players
    if (gameState.players[index].id === playerId) return 'self';
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    const relativeIndex = (index - playerIndex + total) % total;
    if (relativeIndex === 0) return 'self';
    if (relativeIndex === total / 2) return 'opponent';
    if (relativeIndex < total / 2) return 'right';
    return 'left';
  };

  return (
    <div className="h-full w-full flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3a2818] via-[#1a120e] to-[#0d0907] overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(90,53,32,0.15) 0%, transparent 40%)'
      }} />
      
      {/* Top bar - Turn indicator */}
      <div className="flex-none h-12 flex items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState.currentTurn}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full backdrop-blur-md ${
              isCurrentTurn
                ? 'bg-brass/20 border border-brass/50'
                : 'bg-black/25 border border-white/10'
            }`}
          >
            <motion.span
              animate={isCurrentTurn ? { opacity: [1, 0.6, 1] } : { opacity: 0.7 }}
              className={`font-ancient text-[10px] sm:text-sm uppercase tracking-[0.2em] font-bold ${
                isCurrentTurn ? 'text-brass' : 'text-cream-dark/60'
              }`}
            >
              {isCurrentTurn ? 'Your Turn' : `${currentPlayer?.nickname || 'Player'}'s Turn`}
            </motion.span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile opponent indicators */}
      <div className="lg:hidden flex-none flex justify-center gap-2 sm:gap-4 px-4 py-2">
        {gameState.players.filter(p => p.id !== playerId).map((player) => (
          <motion.div
            key={player.id}
            animate={gameState.currentTurn === player.id ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 ${
              gameState.currentTurn === player.id ? 'ring-1 ring-yellow-400/50' : ''
            }`}
          >
            <div className="flex -space-x-2">
              {player.hand.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-7 sm:w-6 sm:h-8 bg-gradient-to-br from-[#8B4513] to-[#5D2906] rounded border border-[#A0522D]"
                />
              ))}
            </div>
            <span className="text-cream/80 text-[10px] sm:text-xs font-medium">{player.nickname}</span>
            <span className="text-cream/50 text-[9px] sm:text-xs">{player.hand.length}</span>
          </motion.div>
        ))}
      </div>

      {/* Main game area */}
      <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden">
        {/* Left opponent */}
        {gameState.players.filter(p => p.id !== playerId).filter((_, i, arr) => arr.length > 1).slice(0, 1).map((player) => (
          <PlayerZone
            key={player.id}
            player={player}
            position="left"
            isCurrentTurn={gameState.currentTurn === player.id}
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
          />
        </div>

        {/* Right opponent */}
        {gameState.players.filter(p => p.id !== playerId).filter((_, i, arr) => arr.length > 1).slice(1).map((player) => (
          <PlayerZone
            key={player.id}
            player={player}
            position="right"
            isCurrentTurn={gameState.currentTurn === player.id}
          />
        ))}
      </div>

      {/* Player hand area */}
      <div className="flex-none p-2 sm:p-4 pb-4 sm:pb-6 relative z-20 w-full">
        <PlayerHand
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
        />
      </div>

      {/* Vintage Radio */}
      <VintageRadio />

      {/* Game Over Modal */}
      {gameOverData && <GameOverModal />}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface PlayerZoneProps {
  player: RummyPlayer;
  position: 'left' | 'right' | 'opponent';
  isCurrentTurn: boolean;
}

function PlayerZone({ player, position, isCurrentTurn }: PlayerZoneProps) {
  return (
    <motion.div
      animate={isCurrentTurn ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`hidden lg:flex flex-col items-center p-3 sm:p-4 rounded-xl bg-black/30 backdrop-blur-sm min-w-[120px] sm:min-w-[140px] mx-1 sm:mx-2 ${
        isCurrentTurn ? 'ring-2 ring-yellow-400/50' : ''
      }`}
    >
      <div className={`text-cream text-xs sm:text-sm font-bold mb-2 ${isCurrentTurn ? 'text-brass' : ''}`}>
        {player.nickname}
      </div>
      <div className="flex -space-x-4 sm:-space-x-6">
        {player.hand.slice(0, 5).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: i * 20 }}
            animate={{ x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-8 h-11 sm:w-10 sm:h-14 bg-gradient-to-br from-[#8B4513] to-[#5D2906] rounded border border-[#A0522D] shadow-lg"
          />
        ))}
        {player.hand.length > 5 && (
          <div className="w-8 h-11 sm:w-10 sm:h-14 flex items-center justify-center text-cream/60 text-xs font-bold">
            +{player.hand.length - 5}
          </div>
        )}
      </div>
      <div className="text-cream/60 text-[10px] sm:text-xs mt-2">{player.hand.length} cards</div>
      {player.melds.length > 0 && (
        <div className="flex gap-1 mt-2">
          {player.melds.slice(0, 3).map((meld, idx) => (
            <div key={idx} className="w-5 h-7 sm:w-6 sm:h-8 bg-amber-900/40 rounded border border-amber-700/30" />
          ))}
          {player.melds.length > 3 && (
            <span className="text-cream/40 text-[10px]">+{player.melds.length - 3}</span>
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
}: TableAreaProps) {
  const currentPlayer = gameState.players.find((p: RummyPlayer) => p.id === playerId);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Draw and Discard piles */}
      <div className="flex gap-4 sm:gap-8 md:gap-12 items-center">
        {/* Draw pile */}
        <motion.div
          className="flex flex-col items-center gap-2"
          whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
        >
          <div className="text-cream/80 text-[10px] sm:text-xs uppercase tracking-wider">Draw</div>
          <button
            onClick={onDraw}
            disabled={!isCurrentTurn}
            className={`relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg border-2 transition-all duration-300 ${
              isCurrentTurn
                ? 'border-yellow-400/60 cursor-pointer hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                : 'border-[#5D2906] cursor-not-allowed opacity-40'
            } bg-gradient-to-br from-[#8B4513] to-[#5D2906]`}
          >
            {/* Card back pattern */}
            <div className="absolute inset-2 rounded border border-[#A0522D]/30" />
            <div className="absolute inset-4 rounded border border-[#A0522D]/20" />
          </button>
          <div className="text-cream/50 text-[10px] sm:text-xs">{gameState.drawPile.length} cards</div>
        </motion.div>

        {/* Meld zone - center */}
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
          className={`flex-1 min-w-[200px] sm:min-w-[300px] min-h-[100px] sm:min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center p-2 sm:p-4 ${
            isOverMeldZone
              ? 'border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_30px_rgba(212,175,55,0.2)]'
              : 'border-[#5D2906]/40 bg-black/20'
          }`}
        >
          <div className="text-center pointer-events-none">
            <div className="text-cream/40 text-[9px] sm:text-xs uppercase tracking-widest mb-1">Meld Zone</div>
            <div className="text-cream/30 text-[9px] sm:text-xs">Drag cards here</div>
          </div>
          
          {/* Existing melds */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4 pointer-events-none overflow-hidden">
            {gameState.players.flatMap((p: RummyPlayer) => p.melds).map((meld: Meld, idx: number) => (
              <motion.div
                key={meld.id || idx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex gap-0.5 sm:gap-1 p-1 bg-black/30 rounded-lg backdrop-blur-sm"
              >
                {meld.cards.map((card, cardIdx) => (
                  <div key={cardIdx} className="w-8 h-11 sm:w-10 sm:h-14">
                    <Card card={card} small />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Discard pile */}
        <motion.div
          className="flex flex-col items-center gap-2"
          whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
        >
          <div className="text-cream/80 text-[10px] sm:text-xs uppercase tracking-wider">Discard</div>
          {topDiscard ? (
            <button
              onClick={onDrawDiscard}
              disabled={!isCurrentTurn}
              className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg transition-all duration-300 ${
                isCurrentTurn
                  ? 'cursor-pointer hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                  : 'cursor-not-allowed opacity-40'
              }`}
            >
              <Card card={topDiscard} small />
            </button>
          ) : (
            <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-lg border-2 border-dashed border-[#5D2906]/40 bg-black/20" />
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

interface PlayerHandProps {
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
}

function PlayerHand({
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
}: PlayerHandProps) {
  // Get the original indices from sorted hand
  const originalIndices = sortedHand.map(h => h.index);
  const mappedSelectedCards = selectedCards.filter(i => originalIndices.includes(i));

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Sort buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          onClick={() => onSortChange('none')}
          className={`px-3 py-1 text-xs ${sortMode === 'none' ? 'bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Original
        </Button>
        <Button
          onClick={() => onSortChange('suit')}
          className={`px-3 py-1 text-xs ${sortMode === 'suit' ? 'bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Sort by Suit
        </Button>
        <Button
          onClick={() => onSortChange('rank')}
          className={`px-3 py-1 text-xs ${sortMode === 'rank' ? 'bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Sort by Rank
        </Button>
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {mappedSelectedCards.length >= 3 && isCurrentTurn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex gap-2 flex-wrap justify-center"
          >
            <Button
              onClick={() => onCreateMeld('set')}
              className="px-4 py-1.5 text-xs sm:text-sm bg-amber-700 hover:bg-amber-600"
            >
              Create Set
            </Button>
            <Button
              onClick={() => onCreateMeld('sequence')}
              className="px-4 py-1.5 text-xs sm:text-sm bg-emerald-700 hover:bg-emerald-600"
            >
              Create Sequence
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="flex justify-center items-end w-full px-4 overflow-visible">
        {sortedHand.map((item, displayIndex) => {
          const originalIndex = item.index;
          const card = item.card;
          const isSelected = selectedCards.includes(originalIndex);
          const totalCards = sortedHand.length;
          
          // Calculate position based on display index
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
              } ${isSelected ? 'ring-2 ring-green-400/80 ring-offset-1 ring-offset-[#1a120e]' : ''}`}
              style={{
                width: 'clamp(50px, 9vw, 70px)',
                marginLeft: displayIndex > 0 ? 'clamp(-25px, -5vw, -40px)' : '0',
                zIndex: displayIndex,
              }}
            >
              <Card card={card} />
              
              {/* Discard hint */}
              {isCurrentTurn && isSelected && mappedSelectedCards.length === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
                >
                  <Button
                    onClick={() => onDiscard(originalIndex)}
                    className="text-xs px-2 py-0.5 bg-red-600 hover:bg-red-700"
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
