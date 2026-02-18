import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';

export function useGameSocket() {
  const {
    user, gamePhase,
    updateItem, setLeaderboard, setGamePhase,
    setWsConnected, addToast,
    setGameActive, setGameResult, updateBalance, setItems,
  } = useGame();

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onclose = () => {
      setWsConnected(false);
      // Auto-reconnect with exponential backoff (max 10s)
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'GAME_STARTED':
            setGameActive(true);
            setGamePhase('playing');
            addToast({ type: 'info', message: '🎮 Game has started! Shop now!' });
            break;

          case 'GAME_OVER':
            setGameActive(false);
            setGameResult({ winners: msg.winners || [] });
            setGamePhase('lobby');
            addToast({ type: 'info', message: '🏁 Game over! Check the results.' });
            break;

          case 'GAME_RESET':
            // Refresh items from server
            fetch('/api/items')
              .then(r => r.ok ? r.json() : [])
              .then(data => setItems(data))
              .catch(() => {});
            // Refresh user data
            if (user?.id) {
              fetch(`/api/me/${user.id}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                  if (data) updateBalance(data.balance);
                })
                .catch(() => {});
            }
            addToast({ type: 'info', message: '🔄 Game reset! Fresh round incoming.' });
            break;

          case 'ITEM_UPDATE':
            updateItem(msg);
            break;

          case 'LEADERBOARD_UPDATE':
            if (msg.leaderboard) {
              setLeaderboard(msg.leaderboard);
            }
            break;

          case 'PLAYER_FINISHED':
            addToast({
              type: 'winner',
              message: `🏆 ${msg.username} completed the collection!`,
            });
            break;

          default:
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };
  }, [setWsConnected, setGamePhase, setGameActive, setGameResult, updateItem, setLeaderboard, addToast, updateBalance, setItems, user?.id]);

  // Connect once user is logged in
  useEffect(() => {
    if (user && (gamePhase === 'lobby' || gamePhase === 'playing')) {
      connect();
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [user, gamePhase, connect]);

  return { wsRef };
}
