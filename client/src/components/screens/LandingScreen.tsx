import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore, type Screen } from '../../stores/useUIStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function LandingScreen() {
  const [nickname, setNicknameLocal] = useState(useGameStore.getState().nickname);
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
    setScreen(target);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center relative overflow-hidden"
    >
      {/* Background ambiance */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(90,53,32,0.4) 0%, rgba(26,18,14,1) 70%)'
      }} />
      <div className="absolute top-20 left-1/4 w-48 h-48 bg-brass/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-turquoise/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative border frame */}
      <div className="absolute inset-4 sm:inset-8 border border-brass/10 rounded-2xl pointer-events-none" />

      <div className="text-center px-4 sm:px-8 max-w-md w-full relative z-10">
        {/* Logo area */}
        <div className="mb-8">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-3 drop-shadow-lg"
          >
            <span className="inline-block" style={{ filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.3))' }}>&#127183;</span>
          </motion.div>
          <h1 className="font-ancient text-4xl sm:text-5xl font-bold text-brass tracking-wide" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.15)'
          }}>
            Chkobba
          </h1>
          <p className="text-cream-dark/60 font-body mt-2 text-sm tracking-wider">The Traditional Tunisian Card Game</p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-brass/30" />
          <span className="text-brass/40 text-xs">&#9830;</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-brass/30" />
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <Input
            value={nickname}
            onChange={(e) => setNicknameLocal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validateAndProceed('createRoom')}
            placeholder="Enter your nickname"
            maxLength={15}
            className="text-center"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => validateAndProceed('createRoom')}>Create Room</Button>
          <Button variant="secondary" onClick={() => validateAndProceed('joinRoom')}>
            Join Room
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
