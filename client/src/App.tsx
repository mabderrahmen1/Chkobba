import { useSocket } from './hooks/useSocket';
import { useUIStore } from './stores/useUIStore';
import { ChatPanel } from './components/layout/ChatPanel';
import { Toast } from './components/ui/Toast';
import { LandingScreen } from './components/screens/LandingScreen';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen';
import { JoinRoomScreen } from './components/screens/JoinRoomScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { GameScreen } from './components/screens/GameScreen';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  useSocket();
  const screen = useUIStore((s) => s.screen);

  return (
    <div className="h-full w-full relative">
      <AnimatePresence mode="wait">
        {screen === 'landing' && <LandingScreen key="landing" />}
        {screen === 'createRoom' && <CreateRoomScreen key="createRoom" />}
        {screen === 'joinRoom' && <JoinRoomScreen key="joinRoom" />}
        {screen === 'lobby' && <LobbyScreen key="lobby" />}
        {screen === 'game' && <GameScreen key="game" />}
      </AnimatePresence>
      {screen === 'game' && <ChatPanel />}
      <Toast />
    </div>
  );
}
