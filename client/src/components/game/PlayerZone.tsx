import type { Player } from '@shared/types.js';
import { Card } from './Card';
import { motion } from 'framer-motion';

interface PlayerZoneProps {
  player: Player;
  position: 'top' | 'left' | 'right';
  isCurrentTurn?: boolean;
  isTeammate?: boolean;
}

export function PlayerZone({ player, position, isCurrentTurn = false, isTeammate = false }: PlayerZoneProps) {
  const isVertical = position === 'left' || position === 'right';

  const getCardTransform = (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;
    if (isVertical) return { rotate: position === 'left' ? 90 + offset * 5 : -90 + offset * 5, x: offset * 3, y: offset * 12 };
    return { rotate: offset * 5, x: 0, y: Math.abs(offset) * 3 };
  };

  return (
    <div className={`flex ${isVertical ? 'flex-row' : 'flex-col'} items-center gap-3`}>
      <motion.div
        animate={isCurrentTurn ? { boxShadow: ['0 0 0px transparent', '0 0 12px rgba(16,185,129,0.4)', '0 0 0px transparent'] } : { boxShadow: '0 0 0px transparent' }}
        transition={{ duration: 2, repeat: isCurrentTurn ? Infinity : 0 }}
        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2 bg-surface-2 border border-border ${
          !player.isConnected ? 'opacity-40 grayscale' : ''
        }`}
      >
        <motion.div
          animate={isCurrentTurn ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: isCurrentTurn ? Infinity : 0 }}
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
            isCurrentTurn ? 'bg-accent' : player.isConnected ? 'bg-success' : 'bg-danger/50'
          }`}
        />
        <span className="text-[10px] sm:text-xs text-text-primary font-medium truncate max-w-[60px] sm:max-w-[90px]">
          {player.nickname}
        </span>
        <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
          player.team === 0 ? 'bg-team1/10 text-team1' : 'bg-team2/10 text-team2'
        }`}>T{player.team + 1}</span>
        {isCurrentTurn && (
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] sm:text-[10px] text-accent/70 shrink-0">▶</motion.span>
        )}
        {player.capturedCount > 0 && (
          <span className="text-[10px] sm:text-xs text-text-tertiary bg-surface-3 px-1.5 rounded shrink-0">{player.capturedCount}</span>
        )}
      </motion.div>

      {player.handCount > 0 && (
        <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} justify-center items-center pointer-events-none ${
          isVertical ? '-space-y-10' : '-space-x-6 sm:-space-x-8'
        } h-16 sm:h-24`}>
          {Array.from({ length: player.handCount }).map((_, i) => {
            const transform = getCardTransform(i, player.handCount);
            return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                style={{ transform: `rotate(${transform.rotate}deg) translateX(${transform.x}px)`, zIndex: i }}>
                <Card faceDown small />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
