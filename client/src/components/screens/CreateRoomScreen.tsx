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
    return () => { socket.off('error', handleError); socket.off('room_joined', handleSuccess); };
  }, [setIsSubmitting]);

  const handleGameTypeChange = (type: GameType) => {
    if (isSubmitting) return;
    setGameType(type);
    if (type === 'rummy') { setMaxPlayers(2); setTargetScore(0); }
    else { setMaxPlayers(2); setTargetScore(21); }
  };

  const Pill = ({ active, onClick, children, className = '' }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      disabled={isSubmitting}
      onClick={onClick}
      className={`relative flex-1 py-3 font-semibold text-sm transition-colors duration-150 rounded-lg z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'
      } ${className}`}
    >
      {active && (
        <motion.div
          layoutId="pill-bg"
          className="absolute inset-0 bg-accent rounded-lg -z-10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {children}
    </button>
  );

  const Chip = ({ active, onClick, children, layoutId }: { active: boolean; onClick: () => void; children: React.ReactNode; layoutId: string }) => (
    <motion.button
      disabled={isSubmitting}
      whileHover={!isSubmitting ? { scale: 1.03 } : {}}
      whileTap={!isSubmitting ? { scale: 0.97 } : {}}
      onClick={onClick}
      className={`relative px-5 py-2.5 rounded-lg font-semibold text-sm border transition-colors duration-150 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? 'text-white border-accent' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
      }`}
    >
      {active && <motion.div layoutId={layoutId} className="absolute inset-0 bg-accent -z-10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="h-full relative overflow-y-auto bg-bg flex flex-col"
    >
      <div className="w-full max-w-2xl mx-auto my-auto py-8 px-4 flex-shrink-0">
        <div className="bg-surface-1 rounded-2xl border border-border px-6 py-8 sm:px-12 sm:py-10">
          <h1 className="text-center text-text-primary text-2xl sm:text-3xl font-bold mb-8">
            Game Setup
          </h1>

          {/* Game Type */}
          <div className="mb-8">
            <div className="text-text-secondary text-xs font-medium text-center mb-3">Game Mode</div>
            <div className="flex bg-surface-2 p-1 rounded-lg border border-border max-w-xs mx-auto">
              {(['chkobba', 'rummy'] as const).map((type) => (
                <Pill key={type} active={gameType === type} onClick={() => handleGameTypeChange(type)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Pill>
              ))}
            </div>
          </div>

          {/* Target Score */}
          {gameType === 'chkobba' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
              <div className="text-text-secondary text-xs font-medium text-center mb-3">Target Score</div>
              <div className="flex justify-center gap-3">
                {[11, 21, 31].map((score) => (
                  <Chip key={score} active={targetScore === score} onClick={() => setTargetScore(score)} layoutId="targetScore">{score}</Chip>
                ))}
              </div>
            </motion.div>
          )}

          {/* Players */}
          <div className="mb-8">
            <div className="text-text-secondary text-xs font-medium text-center mb-3">Players</div>
            {gameType === 'chkobba' ? (
              <div className="flex bg-surface-2 p-1 rounded-lg border border-border max-w-[220px] mx-auto">
                {[{val: 2, label: '1v1'}, {val: 4, label: '2v2'}].map(({val, label}) => (
                  <button
                    key={val}
                    disabled={isSubmitting}
                    onClick={() => setMaxPlayers(val)}
                    className={`relative flex-1 py-2.5 font-semibold text-sm transition-colors duration-150 rounded-lg z-10 ${
                      maxPlayers === val ? 'text-white' : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {maxPlayers === val && <motion.div layoutId="maxPlayersChkobba" className="absolute inset-0 bg-accent rounded-lg -z-10" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                {[2, 3, 4].map((n) => (
                  <Chip key={n} active={maxPlayers === n} onClick={() => setMaxPlayers(n)} layoutId="maxPlayersRummy">{n}</Chip>
                ))}
              </div>
            )}
          </div>

          {/* Team Selection */}
          {gameType === 'chkobba' && maxPlayers === 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
              <div className="text-text-secondary text-xs font-medium text-center mb-3">Your Team</div>
              <div className="flex justify-center gap-3">
                <motion.button disabled={isSubmitting} whileTap={{ scale: 0.97 }} onClick={() => setHostTeam(0)}
                  aria-pressed={hostTeam === 0}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    hostTeam === 0 ? 'bg-team1 text-white border-team1' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
                  }`}>Team 1</motion.button>
                <motion.button disabled={isSubmitting} whileTap={{ scale: 0.97 }} onClick={() => setHostTeam(1)}
                  aria-pressed={hostTeam === 1}
                  className={`px-6 py-2.5 rounded-lg font-semibold text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    hostTeam === 1 ? 'bg-team2 text-white border-team2' : 'bg-surface-2 text-text-tertiary border-border hover:border-text-tertiary'
                  }`}>Team 2</motion.button>
              </div>
            </motion.div>
          )}

          {/* Turn Timeout */}
          {gameType === 'chkobba' && (
            <div className="mb-10">
              <div className="text-text-secondary text-xs font-medium text-center mb-3">Turn Timer</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {[{ v: 0, label: 'Off' }, { v: 30, label: '30s' }, { v: 60, label: '60s' }, { v: 90, label: '90s' }, { v: 120, label: '2m' }].map(({ v, label }) => (
                  <Chip key={v} active={turnTimeout === v} onClick={() => setTurnTimeout(v)} layoutId="turnTimeout">{label}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 max-w-sm mx-auto">
            <Button onClick={handleCreate} disabled={isSubmitting} className="flex-1" size="lg">
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </Button>
            <Button variant="secondary" onClick={() => { setIsSubmitting(false); setScreen('landing'); }} className="flex-1" size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
