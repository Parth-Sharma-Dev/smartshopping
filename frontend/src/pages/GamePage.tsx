import { useEffect } from 'react';
import Header from '../components/Header';
import MarketGrid from '../components/MarketGrid';
import WinOverlay from '../components/WinOverlay';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../store/useGameStore';
import { fetchItems, fetchMe } from '../api';

export default function GamePage() {
  const user = useGameStore((s) => s.user);
  const setItems = useGameStore((s) => s.setItems);
  const setUser = useGameStore((s) => s.setUser);

  // Initial data fetch
  useEffect(() => {
    fetchItems().then(setItems);

    if (user?.id) {
      fetchMe(user.id).then(setUser);
    }
  }, []);

  // WebSocket connection
  useWebSocket();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <MarketGrid />
      </main>
      <WinOverlay />
    </div>
  );
}
