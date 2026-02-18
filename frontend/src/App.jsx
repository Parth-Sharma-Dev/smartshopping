import { GameProvider, useGame } from './context/GameContext';
import { useGameSocket } from './hooks/useGameSocket';
import Login from './components/Login';
import Lobby from './components/Lobby';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import GameOverModal from './components/GameOverModal';
import ToastContainer from './components/ToastContainer';
import './index.css';

function AppRouter() {
  const { gamePhase, sessionLoading, gameResult } = useGame();

  // Connect WebSocket when in lobby or playing
  useGameSocket();

  // Admin panel — check URL hash for simple routing
  if (window.location.pathname === '/admin') {
    return <AdminPanel />;
  }

  if (sessionLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--color-void)]">
        <div className="text-[var(--color-muted)] text-sm tracking-widest uppercase animate-pulse font-heading">
          Restoring session…
        </div>
      </div>
    );
  }

  return (
    <>
      {gamePhase === 'login' && <Login />}
      {gamePhase === 'lobby' && <Lobby />}
      {gamePhase === 'playing' && <Dashboard />}
      <GameOverModal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
