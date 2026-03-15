import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { useEffect } from 'react';

export function DealingAnimation() {
  const isDistributing = useGameStore((s) => s.isDistributing);
  const players = useGameStore((s) => s.gameState?.players || []);
  const myId = useGameStore((s) => s.playerId);
  const { playCardDealShort } = useAmbianceSound();

  if (!isDistributing) return null;

  // Simulate 3 cards being dealt to each player
  const cards = [];
  for (let p = 0; p < players.length; p++) {
    for (let c = 0; c < 3; c++) {
      cards.push({ playerIndex: p, cardIndex: c });
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[80] flex items-center justify-center">
      <AnimatePresence>
        {cards.map((item, i) => (
          <DealingCard 
            key={`${item.playerIndex}-${item.cardIndex}`} 
            item={item} 
            index={i} 
            players={players}
            myId={myId}
            onAppear={playCardDealShort}
          />
        ))}
      </AnimatePresence>
      
      {/* Central Deck Pile during dealing */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="w-[70px] h-[95px] bg-wood-dark rounded-lg border-2 border-brass/30 shadow-inner flex items-center justify-center"
      >
        <div className="text-brass/20 font-ancient text-[8px] uppercase text-center px-1">Dealing...</div>
      </motion.div>
    </div>
  );
}

function DealingCard({ item, index, players, myId, onAppear }: { item: any; index: number; players: any[]; myId: string | null; onAppear: () => void }) {
  // The new audio is trimmed and starts instantly. 
  // We want the cards to start flying shortly after the sound starts.
  
  const totalCards = players.length * 3;
  const startDelay = 200; // Small delay to let the initial riffle sound hit
  const timePerCard = 80; // Delay between each card being thrown
  
  const myDelay = startDelay + (index * timePerCard);

  useEffect(() => {
    const timer = setTimeout(() => {
      onAppear();
    }, myDelay);
    return () => clearTimeout(timer);
  }, [myDelay, onAppear]);

  const { x, y } = getPlayerPosition(item.playerIndex, players, myId);

  return (
    <motion.div
      initial={{ scale: 0.5, x: 0, y: 0, rotate: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        x, 
        y,
        rotate: 360,
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 0.4, // Fast flight
        delay: myDelay / 1000,
        ease: "easeOut"
      }}
      className="absolute w-[60px] h-[84px] bg-white rounded-lg border-2 border-brass shadow-2xl overflow-hidden"
    >
      <img src="/card_back.png" alt="card" className="w-full h-full object-cover" />
    </motion.div>
  );
}

function getPlayerPosition(playerIndex: number, players: any[], myId: string | null) {
  if (!myId || players.length === 0) return { x: 0, y: 0 };
  
  const me = players.find(p => p.id === myId);
  const targetPlayer = players[playerIndex];
  
  if (!me || !targetPlayer) return { x: 0, y: 0 };
  if (me.id === targetPlayer.id) return { x: 0, y: 300 }; // Bottom (Me)

  if (players.length >= 4) {
    if (targetPlayer.team === me.team) return { x: 0, y: -300 }; // Top (Teammate)
    
    // Opponents: right or left based on turn order logic.
    const turnOrder = players.map(p => p.id);
    const myIdx = turnOrder.indexOf(me.id);
    const nextIdx = (myIdx + 1) % turnOrder.length;
    
    if (targetPlayer.id === turnOrder[nextIdx]) {
      return { x: 300, y: 0 }; // Right
    } else {
      return { x: -300, y: 0 }; // Left
    }
  } else {
    // 2 players
    return { x: 0, y: -300 }; // Top
  }
}
