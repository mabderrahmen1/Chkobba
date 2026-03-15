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
      className="h-full relative overflow-y-auto overflow-x-hidden bg-black flex flex-col"
    >
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-30 grayscale-[10%]"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      <div className="fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.6) 0%, rgba(26,18,14,0.9) 70%)'
      }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto my-auto py-8 px-4 flex-shrink-0">
        <div
          className="relative rounded-[40px] sm:rounded-[60px] border-[2px] sm:border-[4px] border-brass/20 px-6 py-8 sm:px-16 sm:py-14 overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(58, 107, 53, 0.95) 0%, rgba(45, 84, 41, 0.98) 60%, rgba(30, 58, 28, 1) 100%)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.8)',
            minHeight: '500px'
          }}
        >
          {/* Subtle felt texture overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          }} />
          <div className="absolute inset-0 rounded-[38px] sm:rounded-[56px] pointer-events-none border border-white/10" />

          <h2 className="text-center text-transparent bg-clip-text bg-gradient-to-b from-brass-light to-brass-dark font-ancient text-3xl sm:text-5xl font-extrabold mb-10 sm:mb-14 uppercase tracking-[0.2em] drop-shadow-md relative z-10">
            Game Setup
          </h2>

          {/* Game Type — two toggle buttons */}
          <div className="mb-10 sm:mb-14 relative z-10">
            <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
              Game Mode
            </div>
            <div className="flex justify-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 max-w-lg mx-auto shadow-inner-dark">
              <button
                onClick={() => handleGameTypeChange('chkobba')}
                className={`flex-1 py-4 sm:py-5 font-ancient text-base sm:text-xl font-bold uppercase tracking-widest transition-all duration-300 rounded-xl ${
                  gameType === 'chkobba'
                    ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                    : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                }`}
              >
                Chkobba
              </button>
              <button
                onClick={() => handleGameTypeChange('rummy')}
                className={`flex-1 py-4 sm:py-5 font-ancient text-base sm:text-xl font-bold uppercase tracking-widest transition-all duration-300 rounded-xl ${
                  gameType === 'rummy'
                    ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                    : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
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
              className="mb-10 sm:mb-14 relative z-10"
            >
              <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
                Target Score
              </div>
              <div className="flex justify-center gap-6 sm:gap-8">
                {[11, 21, 31].map((score) => (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTargetScore(score)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl font-ancient font-extrabold text-xl sm:text-2xl
                      transition-all duration-300 border-2 ${
                      targetScore === score
                        ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                    }`}
                  >
                    {score}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Players */}
          <div className="mb-10 sm:mb-14 relative z-10">
            <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
              Number of Players
            </div>
            {gameType === 'chkobba' ? (
              <div className="flex justify-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 max-w-[280px] mx-auto shadow-inner-dark">
                <button
                  onClick={() => setMaxPlayers(2)}
                  className={`flex-1 py-3 sm:py-4 font-ancient text-sm sm:text-lg font-bold tracking-widest transition-all duration-300 rounded-xl ${
                    maxPlayers === 2
                      ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                      : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                  }`}
                >
                  1 vs 1
                </button>
                <button
                  onClick={() => setMaxPlayers(4)}
                  className={`flex-1 py-3 sm:py-4 font-ancient text-sm sm:text-lg font-bold tracking-widest transition-all duration-300 rounded-xl ${
                    maxPlayers === 4
                      ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black shadow-glow-gold'
                      : 'bg-transparent text-cream/40 hover:text-cream/80 hover:bg-white/5'
                  }`}
                >
                  2 vs 2
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-4 sm:gap-6">
                {[2, 3, 4].map((n) => (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMaxPlayers(n)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-ancient font-extrabold text-lg sm:text-xl
                      transition-all duration-300 border-2 ${
                      maxPlayers === n
                        ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
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
              className="mb-10 sm:mb-14 relative z-10"
            >
              <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
                Choose Your Side
              </div>
              <div className="flex justify-center gap-4 sm:gap-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setHostTeam(0)}
                  className={`px-8 py-4 sm:py-5 rounded-2xl font-ancient font-extrabold text-sm sm:text-lg uppercase tracking-widest transition-all duration-300 border-2 shadow-inner-dark ${
                    hostTeam === 0
                      ? 'bg-gradient-to-b from-amber-400 to-amber-700 text-black border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                      : 'bg-black/40 text-cream/40 border-white/10 hover:border-amber-500/50 hover:bg-white/5'
                  }`}
                >
                  Team 1
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setHostTeam(1)}
                  className={`px-8 py-4 sm:py-5 rounded-2xl font-ancient font-extrabold text-sm sm:text-lg uppercase tracking-widest transition-all duration-300 border-2 shadow-inner-dark ${
                    hostTeam === 1
                      ? 'bg-gradient-to-b from-teal-400 to-teal-700 text-black border-teal-300 shadow-[0_0_25px_rgba(20,184,166,0.5)]'
                      : 'bg-black/40 text-cream/40 border-white/10 hover:border-teal-500/50 hover:bg-white/5'
                  }`}
                >
                  Team 2
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Turn Timeout (Chkobba only) */}
          {gameType === 'chkobba' && (
            <div className="mb-12 sm:mb-16 relative z-10">
              <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
                Thinking Time
              </div>
              <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
                {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                  <motion.button
                    key={v}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTurnTimeout(v)}
                    className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl font-ancient font-bold text-xs sm:text-base
                      transition-all duration-300 border-2 ${
                      turnTimeout === v
                        ? 'bg-gradient-to-b from-brass-light to-brass-dark text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-white/5 shadow-inner-dark'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 sm:gap-6 max-w-lg mx-auto relative z-50">
            <Button 
              onClick={handleCreate} 
              className="flex-1"
              size="lg"
            >
              Create Room
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setScreen('landing')} 
              className="flex-1"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
