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

  const validateAndProceed = (target: Screen) => {
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
    if (roomId && playerId) {
      socket.emit('rejoin_game', { roomId, playerId });
    }
  };

  useEffect(() => {
    const handleError = (data: { message: string }) => {
      if (data.message.toLowerCase().includes('not found')) {
        useGameStore.getState().reset();
        sessionStorage.removeItem('chkobba-storage');
      }
    };
    socket.on('error', handleError);
    return () => { socket.off('error', handleError); };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center relative overflow-hidden bg-black"
    >
      {/* Immersive Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale-[20%]"
        style={{ backgroundImage: "url('/tun1.jpg')" }}
      />
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(26,18,14,0.6) 0%, rgba(26,18,14,1) 85%)'
      }} />
      <div className="absolute inset-4 sm:inset-8 border border-brass/10 rounded-2xl pointer-events-none z-10" />

      <div className="text-center px-4 sm:px-8 max-w-md w-full relative z-10">
        <div className="mb-8 relative">
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
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center justify-center origin-bottom"
          >
            <img 
              src="/tunisia.png" 
              alt="Tunisian Flag" 
              className="w-20 h-auto sm:w-24 drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))' }}
            />
          </motion.div>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-3 mt-8"
          >
            <span className="inline-block" style={{ filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.3))' }}>&#127183;</span>
          </motion.div>
          <h1 className="font-ancient text-4xl sm:text-5xl font-bold text-brass tracking-wide">Chkobba</h1>
          <p className="text-cream-dark/60 font-body mt-2 text-sm tracking-wider uppercase opacity-50">Tunisian Tradition</p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <Input
            value={nickname}
            onChange={(e) => setNicknameLocal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validateAndProceed('createRoom')}
            placeholder="ENTER NICKNAME"
            maxLength={15}
            className="text-center font-ancient tracking-widest"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-3">
          {roomId && playerId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-5 rounded-2xl bg-black/40 border border-brass/30 text-center backdrop-blur-md shadow-2xl"
            >
              <p className="text-[10px] text-brass font-ancient uppercase tracking-[0.3em] mb-3 opacity-60">Session Found</p>
              <Button onClick={handleRejoin} className="w-full py-4 text-lg">Rejoin Game</Button>
              <button 
                onClick={() => {
                  useGameStore.getState().reset();
                  sessionStorage.removeItem('chkobba-storage');
                }}
                className="mt-3 text-[10px] text-cream/30 hover:text-cream/60 transition-colors uppercase tracking-widest underline decoration-dotted"
              >
                Clear Session
              </button>
            </motion.div>
          )}

          <Button onClick={() => validateAndProceed('createRoom')} variant="primary" className="py-4 text-lg">
            Create Room
          </Button>
          <Button variant="secondary" onClick={() => validateAndProceed('joinRoom')} className="py-4">
            Join Room
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
