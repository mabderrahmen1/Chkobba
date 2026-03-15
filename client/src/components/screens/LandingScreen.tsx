import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore, type Screen } from '../../stores/useUIStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { socket } from '../../lib/socket';

export function LandingScreen() {
  const [nickname, setNicknameLocal] = useState(useGameStore.getState().nickname);
  const { roomId, playerId } = useGameStore((s) => ({ roomId: s.roomId, playerId: s.playerId }));
  const setNickname = useGameStore((s) => s.setNickname);
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const isSubmitting = useUIStore((s) => s.isSubmitting);
  const setIsSubmitting = useUIStore((s) => s.setIsSubmitting);

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
    
    // Create room instantly
    if (target === 'createRoom') {
      setIsSubmitting(true);
      socket.emit('create_room', { 
        nickname: trimmed,
        targetScore: 21,
        maxPlayers: 2,
        gameType: 'chkobba'
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
    const handleError = (data: { message: string }) => {
      setIsSubmitting(false);
      if (data.message.toLowerCase().includes('not found')) {
        useGameStore.getState().reset();
        sessionStorage.removeItem('chkobba-storage');
      }
    };
    const handleSuccess = () => setIsSubmitting(false);

    socket.on('error', handleError);
    socket.on('room_joined', handleSuccess);
    return () => { 
      socket.off('error', handleError); 
      socket.off('room_joined', handleSuccess);
    };
  }, [setIsSubmitting]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full relative overflow-y-auto overflow-x-hidden bg-black flex flex-col"
    >
      {/* Immersive Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale-[20%]"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      {/* Cinematic Overlays */}
      <div className="fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(26,18,14,0.6) 0%, rgba(26,18,14,1) 85%)'
      }} />
      <div className="fixed inset-4 sm:inset-8 border border-brass/10 rounded-2xl pointer-events-none z-10" />

      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-8 px-4 flex-shrink-0 text-center">
        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="mb-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -4, 0]
              }}
              transition={{ 
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center justify-center origin-bottom"
            >
              <img 
                src="/tunisia.png" 
                alt="Tunisian Flag" 
                className="w-20 h-auto sm:w-24 drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl sm:text-7xl mb-4 mt-8"
            >
              <span className="inline-block" style={{ filter: 'drop-shadow(0 4px 12px rgba(212,175,55,0.4))' }}>&#127183;</span>
            </motion.div>
            {/* Added solid text with drop shadow instead of complex gradient for a cleaner pro look */}
            <h1 className="font-ancient text-5xl sm:text-6xl font-black text-white tracking-[0.2em] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] mb-2">CHKOBBA</h1>
            <p className="text-brass-light font-ancient text-[10px] sm:text-xs tracking-[0.5em] uppercase font-bold drop-shadow-md">Tunisian Traditional Card Game</p>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            <Input
              value={nickname}
              onChange={(e) => setNicknameLocal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validateAndProceed('createRoom')}
              placeholder="ENTER NICKNAME"
              maxLength={15}
              autoComplete="off"
              disabled={isSubmitting}
            />

            <div className="flex flex-col gap-4 mt-2">
              {roomId && playerId && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-2 p-5 rounded-2xl bg-black/60 border border-brass/40 shadow-[0_0_30px_rgba(212,175,55,0.15)] text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-brass/5 animate-pulse pointer-events-none" />
                  <p className="text-[10px] text-brass-light font-ancient uppercase tracking-[0.3em] mb-4 opacity-80">Active Session Found</p>
                  <Button onClick={handleRejoin} disabled={isSubmitting} className="w-full" size="md">
                    {isSubmitting ? 'Connecting...' : 'Rejoin Game'}
                  </Button>
                  <button 
                    onClick={() => {
                      useGameStore.getState().reset();
                      sessionStorage.removeItem('chkobba-storage');
                    }}
                    disabled={isSubmitting}
                    className="mt-4 text-[10px] text-cream/30 hover:text-red-400 transition-colors uppercase tracking-widest underline decoration-dashed underline-offset-4 disabled:opacity-50"
                  >
                    Clear Session
                  </button>
                </motion.div>
              )}

              <Button onClick={() => validateAndProceed('createRoom')} disabled={isSubmitting} variant="primary" size="lg" className="w-full">
                {isSubmitting ? 'Creating...' : 'Create Room'}
              </Button>
              <Button variant="secondary" onClick={() => validateAndProceed('joinRoom')} disabled={isSubmitting} size="md" className="w-full">
                Join Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
