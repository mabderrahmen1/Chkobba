import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore, type Screen } from '../../stores/useUIStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ChkobbaRulesContent } from './ChkobbaRulesContent';
import { socket } from '../../lib/socket';

export function LandingScreen() {
  const [nickname, setNicknameLocal] = useState(useGameStore.getState().nickname);
  const { roomId, playerId } = useGameStore((s) => ({ roomId: s.roomId, playerId: s.playerId }));
  const setNickname = useGameStore((s) => s.setNickname);
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const isSubmitting = useUIStore((s) => s.isSubmitting);
  const setIsSubmitting = useUIStore((s) => s.setIsSubmitting);
  const [rulesOpen, setRulesOpen] = useState(false);

  const validateAndProceed = (target: Screen) => {
    if (isSubmitting) return;

    const trimmed = nickname.trim();
    if (!trimmed) {
      addToast('Please enter a nickname', 'error');
      return;
    }
    if (trimmed.length < 2) {
      addToast('Nickname must be at least 2 characters', 'error');
      return;
    }
    setNickname(trimmed);

    if (target === 'createRoom') {
      setIsSubmitting(true);
      socket.emit('create_room', {
        nickname: trimmed,
        targetScore: 21,
        maxPlayers: 2,
        gameType: 'chkobba',
      });
    } else {
      setScreen(target);
    }
  };

  const handleRejoin = () => {
    if (roomId && playerId && !isSubmitting) {
      setIsSubmitting(true);
      socket.emit('rejoin_game', { roomId, playerId });
    }
  };

  useEffect(() => {
    const handleSuccess = () => setIsSubmitting(false);
    socket.on('room_joined', handleSuccess);
    return () => {
      socket.off('room_joined', handleSuccess);
    };
  }, [setIsSubmitting]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] relative overflow-x-hidden overflow-y-auto bg-transparent flex flex-col"
    >
      {/* Decorative Coffee Steam Particles */}
      <div className="absolute bottom-0 left-1/4 z-10 pointer-events-none opacity-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="smoke-particle animate-smoke"
            style={{
              '--dur': `${4 + i}s`,
              '--delay': `${i * 0.8}s`,
              left: `${i * 20}px`,
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
            } as Record<string, string | number>}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14 w-full max-w-md mx-auto">
        {/* Logo / Title Area */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-10 sm:mb-12 text-center"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-metallic-gold tracking-tighter mb-2">
            CHKOBBA
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brass/50" />
            <p className="text-brass font-ancient text-[10px] sm:text-sm tracking-[0.35em] sm:tracking-[0.4em] font-bold uppercase">
              The Café Experience
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brass/50" />
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full glass-panel-heavy p-7 sm:p-10 rounded-[2.5rem] border-brass/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

          <div className="space-y-8 relative z-10">
            <Input
              label="Player Nickname"
              placeholder="Enter your name..."
              value={nickname}
              onChange={setNicknameLocal}
              maxLength={15}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="flex flex-col gap-4 pt-2">
              <Button
                onClick={() => validateAndProceed('createRoom')}
                disabled={isSubmitting}
                variant="brass"
                size="xl"
                className="w-full"
              >
                {isSubmitting ? 'Entering...' : 'Create Table'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => validateAndProceed('joinRoom')}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                Join Private Room
              </Button>

              <Button
                variant="ghost"
                onClick={() => setRulesOpen(true)}
                disabled={isSubmitting}
                size="lg"
                className="w-full border border-white/10 text-cream/85 hover:text-cream hover:bg-white/5"
              >
                Règles du jeu
              </Button>
            </div>

            {roomId && playerId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-white/5"
              >
                <Button
                  variant="secondary"
                  onClick={handleRejoin}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl"
                >
                  Return to Active Session
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-cream/30 text-[10px] uppercase tracking-[0.2em] font-ancient text-center"
        >
          Mediterranean Card Games • Est. 2024
        </motion.p>
      </div>

      <Modal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        panelClassName="max-w-4xl w-full text-left"
      >
        <h2 className="sr-only">Règles et FAQ — Chkobba</h2>
        <ChkobbaRulesContent />
      </Modal>
    </motion.section>
  );
}
