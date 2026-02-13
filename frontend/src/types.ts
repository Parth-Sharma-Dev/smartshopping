// ── Domain Types ────────────────────────────────────────

export interface Item {
    id: number;
    name: string;
    base_price: number;
    current_price: number;
    current_stock: number;
    is_sold_out: boolean;
}

export interface User {
    id: string;
    username: string;
    balance: number;
    is_finished: boolean;
    inventory: Record<number, number>; // item_id → count owned
}

// ── API Types ───────────────────────────────────────────

export interface RegisterRequest {
    username: string;
}

export interface BuyRequest {
    user_id: string;
    item_id: number;
}

export interface BuyResponse {
    success: boolean;
    message: string;
    new_balance: number | null;
    item: Item | null;
    is_finished: boolean;
}

export interface LeaderboardEntry {
    username: string;
    balance: number;
    is_finished: boolean;
}

// ── WebSocket Payloads ──────────────────────────────────

export type WSPayload =
    | {
        type: 'ITEM_UPDATE';
        item_id: number;
        name: string;
        new_price: number;
        new_stock: number;
        is_sold_out: boolean;
    }
    | {
        type: 'PLAYER_FINISHED';
        username: string;
        balance: number;
    };

// ── UI State ────────────────────────────────────────────

export type WSStatus = 'connecting' | 'connected' | 'disconnected';

export type CardBuyState = 'idle' | 'loading' | 'success' | 'error';
