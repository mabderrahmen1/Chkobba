import type { Player } from '@shared/types.js';
import { Card } from './Card';
import { motion } from 'framer-motion';

interface PlayerZoneProps {
  player: Player;
  position: 'top' | 'left' | 'right';
  isCurrentTurn?: boolean;
}

export function PlayerZone({ player, position, isCurrentTurn = false }: PlayerZoneProps) {
  const isVertical = position === 'left' || position === 'right';

  // Card fan spread based on position
  const getCardTransform = (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const offset = index - mid;

    if (isVertical) {
      return {
        rotate: position === 'left' ? 90 + offset * 5 : -90 + offset * 5,
        x: offset * 3,
        y: offset * 12,
      };
    }
    // Top position: cards fan horizontally
    return {
      rotate: offset * 5,
      x: 0,
      y: Math.abs(offset) * 3,
    };
  };

  return (
    <div className={`flex ${isVertical ? 'flex-row' : 'flex-col'} items-center gap-2`}>
      {/* Nameplate */}
      <motion.div
        animate={isCurrentTurn ? {
          boxShadow: ['0 0 0px #d4af37', '0 0 14px #d4af37', '0 0 0px #d4af37'],
        } : { boxShadow: '0 0 0px transparent' }}
        transition={{ duration: 2, repeat: isCurrentTurn ? Infinity : 0 }}
        className={`wood-nameplate px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 sm:gap-2 ${!player.isConnected ? 'opacity-40 grayscale' : ''}`}
      >
        {/* Turn dot: gold when active, green when connected, red when disconnected */}
        <motion.div
          animate={isCurrentTurn ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: isCurrentTurn ? Infinity : 0 }}
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
            isCurrentTurn
              ? 'bg-brass shadow-[0_0_6px_rgba(212,175,55,0.8)]'
              : player.isConnected
                ? 'bg-green-400'
                : 'bg-red-400/50'
          }`}
        />
        <span className="font-ancient text-[8px] sm:text-[10px] md:text-xs text-brass font-bold truncate max-w-[50px] sm:max-w-[80px]">
          {player.nickname}
        </span>
        {isCurrentTurn && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[7px] sm:text-[8px] font-ancient text-brass/70 uppercase tracking-wider"
          >
            playing
          </motion.span>
        )}
        {player.capturedCount > 0 && (
          <span className="text-[9px] font-ancient text-cream-dark/50 bg-black/20 px-1 rounded">
            {player.capturedCount}
          </span>
        )}
      </motion.div>

      {/* Face-down cards */}
      {player.handCount > 0 && (
        <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} justify-center items-center pointer-events-none ${
          isVertical ? '-space-y-10' : '-space-x-6 sm:-space-x-8'
        } h-16 sm:h-20`}>
          {Array.from({ length: player.handCount }).map((_, i) => {
            const transform = getCardTransform(i, player.handCount);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  transform: `rotate(${transform.rotate}deg) translateX(${transform.x}px)`,
                  zIndex: i,
                }}
              >
                <Card faceDown small />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
