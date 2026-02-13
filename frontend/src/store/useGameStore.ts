import { create } from 'zustand';
import type { Item, User, WSStatus } from '../types';

interface GameState {
    // Data
    user: User | null;
    items: Item[];
    previousPrices: Record<number, number>;
    totalItemCount: number;

    // WebSocket
    wsStatus: WSStatus;

    // Actions
    setUser: (user: User | null) => void;
    updateBalance: (balance: number) => void;
    markFinished: () => void;
    addToInventory: (itemId: number) => void;
    setItems: (items: Item[]) => void;
    updateItem: (itemId: number, price: number, stock: number, isSoldOut: boolean) => void;
    setWsStatus: (status: WSStatus) => void;
}

export const useGameStore = create<GameState>((set) => ({
    user: null,
    items: [],
    previousPrices: {},
    totalItemCount: 0,
    wsStatus: 'disconnected',

    setUser: (user) => set({ user }),

    updateBalance: (balance) =>
        set((state) => ({
            user: state.user ? { ...state.user, balance } : null,
        })),

    markFinished: () =>
        set((state) => ({
            user: state.user ? { ...state.user, is_finished: true } : null,
        })),

    addToInventory: (itemId) =>
        set((state) => {
            if (!state.user) return {};
            const inv = { ...state.user.inventory };
            inv[itemId] = (inv[itemId] || 0) + 1;
            return { user: { ...state.user, inventory: inv } };
        }),

    setItems: (items) =>
        set({
            items,
            totalItemCount: items.length,
            previousPrices: items.reduce(
                (acc, item) => ({ ...acc, [item.id]: item.current_price }),
                {} as Record<number, number>,
            ),
        }),

    updateItem: (itemId, price, stock, isSoldOut) =>
        set((state) => ({
            previousPrices: {
                ...state.previousPrices,
                [itemId]: state.items.find((i) => i.id === itemId)?.current_price ?? price,
            },
            items: state.items.map((item) =>
                item.id === itemId
                    ? { ...item, current_price: price, current_stock: stock, is_sold_out: isSoldOut }
                    : item,
            ),
        })),

    setWsStatus: (wsStatus) => set({ wsStatus }),
}));
