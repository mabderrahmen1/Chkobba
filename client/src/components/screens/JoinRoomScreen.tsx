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
    if (!code) { addToast('Please enter a room code', 'error'); return; }
    if (code.length !== 8) { addToast('Room code must be 8 characters', 'error'); return; }
    socket.emit('join_room', { roomId: code, nickname });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="h-full relative bg-bg flex flex-col"
    >
      <div className="w-full max-w-md mx-auto my-auto py-8 px-4 flex-shrink-0">
        <div className="bg-surface-1 rounded-2xl border border-border p-7 sm:p-10">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary mb-1">Join Room</h1>
              <p className="text-text-secondary text-sm">Enter the code shared by the host</p>
            </div>

            <Input
              value={roomCode}
              onChange={(val) => setRoomCode(val.toUpperCase())}
              onKeyDown={(e: any) => e.key === 'Enter' && handleJoin()}
              placeholder="ABCD1234"
              maxLength={8}
              className="text-center uppercase tracking-[0.2em] font-mono text-xl"
              autoComplete="off"
            />

            <div className="flex gap-3 mt-2">
              <Button onClick={handleJoin} className="flex-1" size="lg">Join</Button>
              <Button variant="secondary" onClick={() => { useUIStore.getState().setIsSubmitting(false); setScreen('landing'); }} className="flex-1" size="lg">Back</Button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
