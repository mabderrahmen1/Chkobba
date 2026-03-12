import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '@shared/types.js';

interface LogEntry {
  id: string;
  type: 'play' | 'capture';
  nickname: string;
  card: CardType;
  capturedCards?: CardType[];
  isChkobba?: boolean;
  isHayya?: boolean;
  timestamp: number;
}

export function MoveLog() {
  const gameState = useGameStore((s) => s.gameState);
  const players = gameState?.players || [];
  const lastAction = gameState?.lastAction;
  const roundNumber = gameState?.roundNumber;
  const matchId = gameState?.roomId; // Use roomId as a base match tracker
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastProcessedTimestamp = useRef<number>(0);

  // 1. Aggressive clear on any significant game transition
  useEffect(() => {
    if (!gameState || gameState.winner) {
      setLogs([]);
      lastProcessedTimestamp.current = 0;
    }
  }, [gameState === null, !!gameState?.winner]);

  useEffect(() => {
    // Clear logs if room ID or round number changes (new game or round)
    setLogs([]);
    lastProcessedTimestamp.current = 0;
  }, [matchId, roundNumber]);

  // 2. Process new actions
  useEffect(() => {
    // Only log capture actions (eated cards)
    if (lastAction && lastAction.type === 'capture' && lastAction.timestamp > lastProcessedTimestamp.current) {
      lastProcessedTimestamp.current = lastAction.timestamp;
      
      const player = players.find(p => p.id === lastAction.playerId);
      const newEntry: LogEntry = {
        id: `log-${lastAction.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
        ...lastAction,
        nickname: player?.nickname || 'Player'
      };
      
      setLogs(prev => [newEntry, ...prev].slice(0, 4));
    }
  }, [lastAction?.timestamp, players]);

  if (logs.length === 0 || !gameState) return null;

  return (
    <div className="fixed top-[320px] left-4 z-40 w-[240px] pointer-events-none hidden lg:block">
      <div className="flex items-center gap-2 mb-4 ml-1">
        <div className="w-1.5 h-1.5 bg-brass rounded-full shadow-glow-brass" />
        <div className="text-[10px] text-brass/60 font-ancient uppercase tracking-[0.3em] font-bold">
          Captured Cards
        </div>
      </div>
      
      <div className="flex flex-col gap-4 relative">
        <AnimatePresence initial={false} mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, x: -40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-3 rounded-2xl border-l-4 bg-black/90 backdrop-blur-xl shadow-2xl transition-all ${
                log.isChkobba ? 'border-l-accent ring-1 ring-accent/20' : 'border-l-brass/60'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[11px] font-ancient uppercase font-bold tracking-widest ${log.isChkobba ? 'text-accent' : 'text-brass-light'}`}>
                  {log.nickname}
                </span>
                {log.isChkobba && (
                  <span className="text-[8px] bg-accent text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                    CHKOBBA
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0 relative">
                  <Card card={log.card} small />
                  <div className="absolute -inset-1 rounded border border-white/5 pointer-events-none" />
                </div>

                <div className="flex-1 flex justify-center items-center">
                  <motion.div 
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-brass/80 font-bold text-3xl drop-shadow-glow-gold"
                  >
                    ➝
                  </motion.div>
                </div>

                <div className="flex flex-row-reverse -space-x-reverse -space-x-14 pr-2">
                  {log.capturedCards?.map((c, i) => (
                    <motion.div 
                      key={i} 
                      style={{ zIndex: i }}
                      className="drop-shadow-lg transform rotate-1 shrink-0"
                    >
                      <Card card={c} small />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
