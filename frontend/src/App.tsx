import { Toaster } from 'react-hot-toast';
import RegisterPage from './components/RegisterPage';
import GamePage from './pages/GamePage';
import { useGameStore } from './store/useGameStore';

export default function App() {
  const user = useGameStore((s) => s.user);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            background: '#ffffff',
            color: '#2d1f14',
            border: '1px solid #e0d5c8',
            boxShadow: '0 4px 16px rgba(45, 31, 20, 0.1)',
          },
        }}
      />
      {user ? <GamePage /> : <RegisterPage />}
    </>
  );
}
