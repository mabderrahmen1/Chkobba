import { useState, useEffect } from 'react';
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
  const isSubmitting = useUIStore((s) => s.isSubmitting);
  const setIsSubmitting = useUIStore((s) => s.setIsSubmitting);

  const handleCreate = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    socket.emit('create_room', { nickname, targetScore, maxPlayers, gameType, turnTimeout, hostTeam: maxPlayers === 2 && gameType === 'chkobba' ? hostTeam : undefined });
  };

  useEffect(() => {
    const handleError = () => setIsSubmitting(false);
    const handleSuccess = () => setIsSubmitting(false);

    socket.on('error', handleError);
    socket.on('room_joined', handleSuccess);
    return () => { 
      socket.off('error', handleError); 
      socket.off('room_joined', handleSuccess);
    };
  }, [setIsSubmitting]);

  const handleGameTypeChange = (type: GameType) => {
    if (isSubmitting) return;
    setGameType(type);
    if (type === 'rummy') {
      setMaxPlayers(2);
      setTargetScore(0);
    } else {
      setMaxPlayers(2);
      setTargetScore(21);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="h-full relative overflow-y-auto overflow-x-hidden bg-transparent flex flex-col"
    >
      {/* Cinematic Background (Provided by App.tsx) */}
      <div className="fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.6) 0%, rgba(26,18,14,0.9) 70%)'
      }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto my-auto py-8 px-4 flex-shrink-0">
        <div
          className="relative rounded-3xl border border-white/10 px-6 py-8 sm:px-16 sm:py-14 overflow-hidden"
          style={{
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            minHeight: '500px'
          }}
        >
          <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/5" />

          <h2 className="text-center text-white font-ancient text-3xl sm:text-4xl font-black mb-10 sm:mb-14 uppercase tracking-[0.25em] drop-shadow-md relative z-10">
            Game Setup
          </h2>

          {/* Game Type — two toggle buttons */}
          <div className="mb-10 sm:mb-14 relative z-10">
            <div className="text-cream/50 font-ancient text-[11px] sm:text-xs uppercase tracking-[0.4em] text-center mb-5 font-bold">
              Game Mode
            </div>
            <div className="flex justify-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 max-w-lg mx-auto shadow-inner-dark relative">
              {(['chkobba', 'rummy'] as const).map((type) => (
                <button
                  key={type}
                  disabled={isSubmitting}
                  onClick={() => handleGameTypeChange(type)}
                  className={`relative flex-1 py-4 sm:py-5 font-ancient text-base sm:text-xl font-bold uppercase tracking-widest transition-all duration-300 rounded-xl z-10 ${
                    gameType === type ? 'text-black' : 'text-cream/40 hover:text-cream/80'
                  }`}
                >
                  {gameType === type && (
                    <motion.div
                      layoutId="gameType"
                      className="absolute inset-0 bg-gradient-to-b from-brass-light to-brass-dark rounded-xl shadow-glow-gold -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {type}
                </button>
              ))}
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
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                    onClick={() => setTargetScore(score)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl font-ancient font-extrabold text-xl sm:text-2xl
                      transition-all duration-300 border-2 z-10 overflow-hidden ${
                      targetScore === score
                        ? 'text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                    }`}
                  >
                    {targetScore === score && (
                      <motion.div
                        layoutId="targetScore"
                        className="absolute inset-0 bg-gradient-to-b from-brass-light to-brass-dark -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
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
              <div className="flex justify-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 max-w-[280px] mx-auto shadow-inner-dark relative">
                {[{val: 2, label: '1 vs 1'}, {val: 4, label: '2 vs 2'}].map(({val, label}) => (
                  <button
                    key={val}
                    disabled={isSubmitting}
                    onClick={() => setMaxPlayers(val)}
                    className={`relative flex-1 py-3 sm:py-4 font-ancient text-sm sm:text-lg font-bold tracking-widest transition-all duration-300 rounded-xl z-10 ${
                      maxPlayers === val ? 'text-black' : 'text-cream/40 hover:text-cream/80'
                    }`}
                  >
                    {maxPlayers === val && (
                      <motion.div
                        layoutId="maxPlayersChkobba"
                        className="absolute inset-0 bg-gradient-to-b from-brass-light to-brass-dark rounded-xl shadow-glow-gold -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center gap-4 sm:gap-6">
                {[2, 3, 4].map((n) => (
                  <motion.button
                    key={n}
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                    onClick={() => setMaxPlayers(n)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-ancient font-extrabold text-lg sm:text-xl
                      transition-all duration-300 border-2 z-10 overflow-hidden ${
                      maxPlayers === n
                        ? 'text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-black/60 shadow-inner-dark'
                    }`}
                  >
                    {maxPlayers === n && (
                      <motion.div
                        layoutId="maxPlayersRummy"
                        className="absolute inset-0 bg-gradient-to-b from-brass-light to-brass-dark -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
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
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.03 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                  onClick={() => setHostTeam(0)}
                  className={`relative px-8 py-4 sm:py-5 rounded-2xl font-ancient font-extrabold text-sm sm:text-lg uppercase tracking-widest transition-all duration-300 border-2 shadow-inner-dark z-10 overflow-hidden ${
                    hostTeam === 0
                      ? 'text-black border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                      : 'bg-black/40 text-cream/40 border-white/10 hover:border-amber-500/50 hover:bg-white/5'
                  }`}
                >
                  {hostTeam === 0 && (
                    <motion.div
                      layoutId="teamSelection"
                      className="absolute inset-0 bg-gradient-to-b from-amber-400 to-amber-700 -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  Team 1
                </motion.button>
                <motion.button
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.03 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                  onClick={() => setHostTeam(1)}
                  className={`relative px-8 py-4 sm:py-5 rounded-2xl font-ancient font-extrabold text-sm sm:text-lg uppercase tracking-widest transition-all duration-300 border-2 shadow-inner-dark z-10 overflow-hidden ${
                    hostTeam === 1
                      ? 'text-black border-teal-300 shadow-[0_0_25px_rgba(20,184,166,0.5)]'
                      : 'bg-black/40 text-cream/40 border-white/10 hover:border-teal-500/50 hover:bg-white/5'
                  }`}
                >
                  {hostTeam === 1 && (
                    <motion.div
                      layoutId="teamSelection"
                      className="absolute inset-0 bg-gradient-to-b from-teal-400 to-teal-700 -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
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
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                    onClick={() => setTurnTimeout(v)}
                    className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-xl font-ancient font-bold text-xs sm:text-base
                      transition-all duration-300 border-2 z-10 overflow-hidden ${
                      turnTimeout === v
                        ? 'text-black border-brass-light shadow-glow-gold'
                        : 'bg-black/40 text-cream/40 border-white/10 hover:border-brass/30 hover:bg-white/5 shadow-inner-dark'
                    }`}
                  >
                    {turnTimeout === v && (
                      <motion.div
                        layoutId="turnTimeout"
                        className="absolute inset-0 bg-gradient-to-b from-brass-light to-brass-dark -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
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
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsSubmitting(false); // Force reset loading state if stuck
                setScreen('landing');
              }} 
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
