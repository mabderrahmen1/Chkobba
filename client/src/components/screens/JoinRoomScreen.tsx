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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex items-center justify-center relative"
    >
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(90,53,32,0.3) 0%, rgba(26,18,14,1) 70%)'
      }} />

      <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-8 max-w-md w-full relative z-10">
        <h2 className="text-2xl font-ancient font-bold text-center text-brass">Join Room</h2>

        <div className="flex flex-col gap-2">
          <label className="font-ancient text-sm text-cream-dark">Room Code</label>
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="ABCD1234"
            maxLength={8}
            className="text-center uppercase tracking-widest font-mono text-xl"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <Button onClick={handleJoin} className="flex-1">Join</Button>
          <Button variant="secondary" onClick={() => setScreen('landing')} className="flex-1">Cancel</Button>
        </div>
      </div>
    </motion.section>
  );
}
