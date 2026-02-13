import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useGameStore } from '../store/useGameStore';
import { fetchItems, fetchMe } from '../api';
import type { WSPayload } from '../types';

const WS_URL =
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
    window.location.host +
    '/ws';

const MAX_RETRY_DELAY = 10_000;

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const retryDelay = useRef(1000);
    const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    const { setWsStatus, updateItem } = useGameStore.getState();
    const userId = useGameStore((s) => s.user?.id);

    const reconnect = useCallback(() => {
        if (!mountedRef.current) return;
        retryTimeout.current = setTimeout(() => {
            retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_DELAY);
            connect();
        }, retryDelay.current);
    }, []);

    const connect = useCallback(() => {
        if (!mountedRef.current) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setWsStatus('connecting');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) return;
            retryDelay.current = 1000;
            setWsStatus('connected');

            // Catch up on missed updates
            fetchItems().then((items) => useGameStore.getState().setItems(items));
            if (userId) {
                fetchMe(userId).then((u) => useGameStore.getState().setUser(u));
            }
        };

        ws.onmessage = (event) => {
            if (!mountedRef.current) return;
            try {
                const payload: WSPayload = JSON.parse(event.data);
                if (payload.type === 'ITEM_UPDATE') {
                    updateItem(payload.item_id, payload.new_price, payload.new_stock, payload.is_sold_out);
                } else if (payload.type === 'PLAYER_FINISHED') {
                    toast(`🏆 ${payload.username} completed their set!`, {
                        icon: '🎉',
                        style: {
                            background: '#ffffff',
                            color: '#2d1f14',
                            border: '1px solid #c2553a',
                        },
                    });
                }
            } catch {
                // ignore malformed messages
            }
        };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            setWsStatus('disconnected');
            reconnect();
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [userId]);

    useEffect(() => {
        mountedRef.current = true;
        connect();

        return () => {
            mountedRef.current = false;
            if (retryTimeout.current) clearTimeout(retryTimeout.current);
            wsRef.current?.close();
        };
    }, [connect]);
}
