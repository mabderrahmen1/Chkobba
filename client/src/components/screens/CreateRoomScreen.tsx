import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import type { GameType } from '@shared/rules.js';

export function CreateRoomScreen() {
  const [gameType, setGameType] = useState<GameType>('chkobba');
  const [targetScore, setTargetScore] = useState(21);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [hostTeam, setHostTeam] = useState(0);
  const [turnTimeout, setTurnTimeout] = useState(60);
  const nickname = useGameStore((s) => s.nickname);
  const setScreen = useUIStore((s) => s.setScreen);

  const handleCreate = () => {
    socket.emit('create_room', { nickname, targetScore, maxPlayers, gameType, turnTimeout, hostTeam: maxPlayers === 2 && gameType === 'chkobba' ? hostTeam : undefined });
  };

  const handleGameTypeChange = (type: GameType) => {
    setGameType(type);
    // Reset settings to defaults for the chosen game
    if (type === 'rummy') {
      setMaxPlayers(2);
      setTargetScore(0); // Rummy doesn't use target score
    } else {
      setMaxPlayers(2);
      setTargetScore(21);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.3) 0%, rgba(26,18,14,1) 70%)'
      }} />

      {/* The Table */}
      <div className="relative z-10 w-full max-w-xl mx-4">
        <div
          className="relative rounded-[32px] sm:rounded-[40px] border-[5px] sm:border-[7px] border-amber-900/80 px-6 py-7 sm:px-10 sm:py-9"
          style={{
            background: 'radial-gradient(circle, #3a6b35 0%, #2d5429 60%, #1e3a1c 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] pointer-events-none"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} />

          <h2 className="text-center text-brass font-ancient text-lg sm:text-xl font-bold mb-6 sm:mb-8 uppercase tracking-widest">
            Set Up Game
          </h2>

          {/* Game Type — two toggle buttons */}
          <div className="mb-6 sm:mb-8">
            <div className="text-cream/30 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-center mb-3">
              Game
            </div>
            <div className="flex justify-center gap-0 rounded-lg overflow-hidden border border-brass/30 max-w-xs mx-auto">
              <button
                onClick={() => handleGameTypeChange('chkobba')}
                className={`flex-1 py-2.5 sm:py-3 font-ancient text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 ${
                  gameType === 'chkobba'
                    ? 'bg-brass/90 text-black'
                    : 'bg-black/40 text-cream/25 hover:text-cream/40'
                }`}
              >
                Chkobba
              </button>
              <button
                onClick={() => handleGameTypeChange('rummy')}
                className={`flex-1 py-2.5 sm:py-3 font-ancient text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-200 ${
                  gameType === 'rummy'
                    ? 'bg-brass/90 text-black'
                    : 'bg-black/40 text-cream/25 hover:text-cream/40'
                }`}
              >
                Rummy
              </button>
            </div>
          </div>

          {/* Chkobba-specific settings */}
          {gameType === 'chkobba' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 sm:mb-8"
            >
              <div className="text-cream/30 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-center mb-3">
                Target Score
              </div>
              <div className="flex justify-center gap-3 sm:gap-4">
                {[11, 21, 31].map((score) => (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTargetScore(score)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full font-ancient font-bold text-sm sm:text-base
                      transition-all duration-200 border-2 ${
                      targetScore === score
                        ? 'bg-brass/90 text-black border-brass shadow-[0_0_16px_rgba(212,175,55,0.5)] scale-110'
                        : 'bg-black/30 text-cream/40 border-brass/20 hover:border-brass/40'
                    }`}
                  >
                    {score}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Players */}
          <div className="mb-7 sm:mb-9">
            <div className="text-cream/30 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-center mb-3">
              Players
            </div>
            {gameType === 'chkobba' ? (
              <div className="flex justify-center gap-0 rounded-lg overflow-hidden border border-brass/30 max-w-[200px] mx-auto">
                <button
                  onClick={() => setMaxPlayers(2)}
                  className={`flex-1 py-2 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 ${
                    maxPlayers === 2
                      ? 'bg-brass/90 text-black'
                      : 'bg-black/40 text-cream/25 hover:text-cream/40'
                  }`}
                >
                  1 vs 1
                </button>
                <button
                  onClick={() => setMaxPlayers(4)}
                  className={`flex-1 py-2 sm:py-2.5 font-ancient text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 ${
                    maxPlayers === 4
                      ? 'bg-brass/90 text-black'
                      : 'bg-black/40 text-cream/25 hover:text-cream/40'
                  }`}
                >
                  2 vs 2
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-2 sm:gap-3">
                {[2, 3, 4].map((n) => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMaxPlayers(n)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full font-ancient font-bold text-sm
                      transition-all duration-200 border-2 ${
                      maxPlayers === n
                        ? 'bg-brass/90 text-black border-brass shadow-[0_0_16px_rgba(212,175,55,0.5)] scale-110'
                        : 'bg-black/30 text-cream/40 border-brass/20 hover:border-brass/40'
                    }`}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Team Selection (Chkobba 2-player only) */}
          {gameType === 'chkobba' && maxPlayers === 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-7 sm:mb-9"
            >
              <div className="text-cream/30 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-center mb-3">
                Your Team
              </div>
              <div className="flex justify-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHostTeam(0)}
                  className={`px-4 py-2.5 sm:py-3 rounded-lg font-ancient font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-200 border-2 ${
                    hostTeam === 0
                      ? 'bg-amber-600/80 text-black border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                      : 'bg-black/30 text-cream/40 border-brass/20 hover:border-brass/40'
                  }`}
                >
                  Team 1
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHostTeam(1)}
                  className={`px-4 py-2.5 sm:py-3 rounded-lg font-ancient font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-200 border-2 ${
                    hostTeam === 1
                      ? 'bg-teal-600/80 text-black border-teal-500 shadow-[0_0_16px_rgba(20,184,166,0.4)]'
                      : 'bg-black/30 text-cream/40 border-brass/20 hover:border-brass/40'
                  }`}
                >
                  Team 2
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Turn Timeout (Chkobba only) */}
          {gameType === 'chkobba' && (
            <div className="mb-7 sm:mb-9">
              <div className="text-cream/30 font-ancient text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-center mb-3">
                Turn Timeout
              </div>
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                  <motion.button
                    key={v}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTurnTimeout(v)}
                    className={`w-12 h-10 sm:w-14 sm:h-11 rounded-lg font-ancient font-bold text-xs sm:text-sm
                      transition-all duration-200 border-2 ${
                      turnTimeout === v
                        ? 'bg-brass/90 text-black border-brass shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105'
                        : 'bg-black/30 text-cream/40 border-brass/20 hover:border-brass/40'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
              {turnTimeout > 0 && (
                <p className="text-cream/20 font-ancient text-[8px] text-center mt-2">
                  AFK players are replaced by a bot after {turnTimeout}s
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 sm:gap-4 max-w-sm mx-auto">
            <Button onClick={handleCreate} className="flex-1">Create</Button>
            <Button variant="secondary" onClick={() => setScreen('landing')} className="flex-1">Cancel</Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
