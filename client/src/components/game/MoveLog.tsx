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
  const matchId = gameState?.roomId;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastProcessedTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!gameState || gameState.winner) {
      setLogs([]);
      lastProcessedTimestamp.current = 0;
    }
  }, [gameState === null, !!gameState?.winner]);

  useEffect(() => {
    setLogs([]);
    lastProcessedTimestamp.current = 0;
  }, [matchId, roundNumber]);

  useEffect(() => {
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
    <div className="fixed top-[160px] left-4 z-40 w-[300px] pointer-events-none hidden lg:flex flex-col gap-2.5">
      <div className="flex items-center gap-2 mb-1 ml-1">
        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
        <h3 className="text-[10px] text-text-tertiary font-semibold uppercase tracking-widest">
          Move History
        </h3>
      </div>

      <div className="flex flex-col gap-2 relative">
        <AnimatePresence initial={false} mode="popLayout">
          {logs.slice(0, 4).map((log) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95, transition: { duration: 0.2 } }}
              className={`relative z-10 py-3 px-3.5 rounded-xl transition-all duration-300 flex flex-col gap-2 ${
                log.isChkobba
                  ? 'bg-accent/15 border-l-2 border-accent'
                  : 'bg-surface-1/80 border-l border-border backdrop-blur-sm'
              }`}
            >
              <div className="flex justify-between items-center px-0.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${log.isChkobba ? 'text-accent' : 'text-text-tertiary'}`}>
                  {log.nickname}
                </span>
                {log.isChkobba && (
                  <span className="text-[9px] text-white font-bold tracking-wider px-1.5 py-0.5 bg-accent rounded-sm">
                    CHKOBBA
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pl-0.5">
                <div className="shrink-0 scale-75 origin-left">
                  <Card card={log.card} small />
                </div>

                <div className="flex flex-col items-center justify-center opacity-40">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                <div className="flex flex-row-reverse -space-x-reverse -space-x-10 scale-75 origin-left">
                  {log.capturedCards?.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ rotate: 0 }}
                      animate={{ rotate: (i * 2) - (log.capturedCards!.length) }}
                      style={{ zIndex: i }}
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
