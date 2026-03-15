import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function JoinRoomScreen() {
  const [roomCode, setRoomCode] = useState('');
  const nickname = useGameStore((s) => s.nickname);
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      addToast('Please enter a room code', 'error');
      return;
    }
    if (code.length !== 8) {
      addToast('Room code must be 8 characters', 'error');
      return;
    }
    socket.emit('join_room', { roomId: code, nickname });
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
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.5) 0%, rgba(26,18,14,0.9) 80%)'
      }} />

      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-8 px-4 flex-shrink-0">
        <div className="bg-surface-glass backdrop-blur-xl border border-brass/20 rounded-[32px] p-8 sm:p-12 shadow-glass-panel relative overflow-hidden">
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl sm:text-4xl font-ancient font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-brass-light to-brass-dark tracking-widest drop-shadow-md">JOIN ROOM</h2>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-ancient text-xs text-cream/50 tracking-[0.2em] uppercase ml-1">Room Code</label>
              <Input
                value={roomCode}
                onChange={(val) => setRoomCode(val.toUpperCase())}
                onKeyDown={(e: any) => e.key === 'Enter' && handleJoin()}
                placeholder="ABCD1234"
                maxLength={8}
                className="text-center uppercase tracking-[0.3em] font-mono text-xl sm:text-2xl"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={handleJoin} className="flex-1" size="lg">Join</Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  useUIStore.getState().setIsSubmitting(false);
                  setScreen('landing');
                }} 
                className="flex-1" 
                size="md"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
