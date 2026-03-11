import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { socket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { GameType } from '@shared/rules.js';

export function CreateRoomScreen() {
  const [gameType, setGameType] = useState<GameType>('chkobba');
  const [targetScore, setTargetScore] = useState(21);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const nickname = useGameStore((s) => s.nickname);
  const setScreen = useUIStore((s) => s.setScreen);

  const handleCreate = () => {
    socket.emit('create_room', { nickname, targetScore, maxPlayers, gameType });
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
        <h2 className="text-2xl font-ancient font-bold text-center text-brass">Create New Room</h2>

        <div className="flex flex-col gap-2">
          <label className="font-ancient text-sm text-cream-dark">Game Type</label>
          <Select value={gameType} onChange={(e) => setGameType(e.target.value as GameType)}>
            <option value="chkobba">Chkobba</option>
            <option value="rummy">Rummy</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-ancient text-sm text-cream-dark">Target Score</label>
          <Select value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))}>
            <option value={11}>11</option>
            <option value={21}>21</option>
            <option value={31}>31</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-ancient text-sm text-cream-dark">Players</label>
          <Select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
            <option value={2}>2 Players</option>
            <option value={4}>4 Players (2v2)</option>
          </Select>
        </div>

        <div className="flex gap-4 mt-4">
          <Button onClick={handleCreate} className="flex-1">Create</Button>
          <Button variant="secondary" onClick={() => setScreen('landing')} className="flex-1">Cancel</Button>
        </div>
      </div>
    </motion.section>
  );
}
