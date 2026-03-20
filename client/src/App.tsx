import { lazy, Suspense } from 'react';
import { useSocket } from './hooks/useSocket';
import { useUIStore } from './stores/useUIStore';
import { ChatPanel } from './components/layout/ChatPanel';
import { Toast } from './components/ui/Toast';
import { LandingScreen } from './components/screens/LandingScreen';
import { motion, AnimatePresence } from 'framer-motion';

const CreateRoomScreen = lazy(() => import('./components/screens/CreateRoomScreen').then(m => ({ default: m.CreateRoomScreen })));
const JoinRoomScreen = lazy(() => import('./components/screens/JoinRoomScreen').then(m => ({ default: m.JoinRoomScreen })));
const LobbyScreen = lazy(() => import('./components/screens/LobbyScreen').then(m => ({ default: m.LobbyScreen })));
const GameScreen = lazy(() => import('./components/screens/GameScreen').then(m => ({ default: m.GameScreen })));

export default function App() {
  useSocket();
  const screen = useUIStore((s) => s.screen);

  return (
    <div className="h-full w-full relative overflow-hidden bg-bg">
      <main className="relative h-full">
        <Suspense fallback={<div className="h-full flex items-center justify-center bg-bg"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
          <AnimatePresence mode="wait">
            {screen === 'landing' && <LandingScreen key="landing" />}
            {screen === 'createRoom' && <CreateRoomScreen key="createRoom" />}
            {screen === 'joinRoom' && <JoinRoomScreen key="joinRoom" />}
            {screen === 'lobby' && <LobbyScreen key="lobby" />}
            {screen === 'game' && <GameScreen key="game" />}
          </AnimatePresence>
        </Suspense>
        {screen === 'game' && <ChatPanel />}
      </main>
      <Toast />
    </div>
  );
}
