import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';

const GameContext = createContext(null);

const SESSION_KEY = 'smartshopping_user_id';

const initialState = {
    user: null,          // { id, username, rollNo, balance, inventory, isFinished }
    items: [],           // full items array from API
    leaderboard: [],     // sorted leaderboard entries
    gamePhase: 'login',  // 'login' | 'lobby' | 'playing'
    gameActive: false,   // mirrors server game_state.is_active
    gameResult: null,    // { winners: [...] } when game ends
    wsConnected: false,
    toasts: [],          // { id, type, message, timestamp }
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };

        case 'SET_ITEMS':
            return { ...state, items: action.payload };

        case 'UPDATE_ITEM': {
            const update = action.payload;
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === update.item_id
                        ? {
                            ...item,
                            current_price: update.new_price,
                            current_stock: update.new_stock,
                            is_sold_out: update.is_sold_out,
                            _priceDirection: update.new_price > item.current_price ? 'up' : update.new_price < item.current_price ? 'down' : null,
                        }
                        : item
                ),
            };
        }

        case 'CLEAR_PRICE_DIRECTION': {
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === action.payload ? { ...item, _priceDirection: null } : item
                ),
            };
        }

        case 'SET_LEADERBOARD':
            return { ...state, leaderboard: action.payload };

        case 'SET_GAME_PHASE':
            return { ...state, gamePhase: action.payload };

        case 'SET_GAME_ACTIVE':
            return { ...state, gameActive: action.payload };

        case 'SET_GAME_RESULT':
            return { ...state, gameResult: action.payload };

        case 'CLEAR_GAME_RESULT':
            return { ...state, gameResult: null };

        case 'UPDATE_BALANCE':
            return {
                ...state,
                user: state.user ? { ...state.user, balance: action.payload } : null,
            };

        case 'SET_WS_CONNECTED':
            return { ...state, wsConnected: action.payload };

        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [...state.toasts, { ...action.payload, id: Date.now(), timestamp: Date.now() }],
            };

        case 'REMOVE_TOAST':
            return {
                ...state,
                toasts: state.toasts.filter(t => t.id !== action.payload),
            };

        case 'LOGOUT':
            sessionStorage.removeItem(SESSION_KEY);
            return { ...initialState };

        default:
            return state;
    }
}

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [sessionLoading, setSessionLoading] = useState(true);

    // ── Restore session on mount ─────────────────────────
    useEffect(() => {
        const storedId = sessionStorage.getItem(SESSION_KEY);
        if (!storedId) {
            setSessionLoading(false);
            return;
        }

        fetch(`/api/me/${storedId}`)
            .then((res) => {
                if (!res.ok) throw new Error('Session expired');
                return res.json();
            })
            .then((data) => {
                dispatch({
                    type: 'SET_USER',
                    payload: {
                        id: data.id,
                        username: data.username,
                        rollNo: data.roll_number,
                        balance: data.balance,
                        inventory: data.inventory || {},
                        isFinished: data.is_finished,
                    },
                });
                dispatch({ type: 'SET_GAME_ACTIVE', payload: !!data.game_active });
                // If game is active, go directly to playing; otherwise lobby
                dispatch({
                    type: 'SET_GAME_PHASE',
                    payload: data.game_active ? 'playing' : 'lobby',
                });
            })
            .catch(() => {
                sessionStorage.removeItem(SESSION_KEY);
            })
            .finally(() => {
                setSessionLoading(false);
            });
    }, []);

    // ── Persist user ID to sessionStorage when it changes ──
    useEffect(() => {
        if (state.user?.id) {
            sessionStorage.setItem(SESSION_KEY, state.user.id);
        }
    }, [state.user?.id]);

    const setUser = useCallback((user) => dispatch({ type: 'SET_USER', payload: user }), []);
    const setItems = useCallback((items) => dispatch({ type: 'SET_ITEMS', payload: items }), []);
    const updateItem = useCallback((data) => dispatch({ type: 'UPDATE_ITEM', payload: data }), []);
    const clearPriceDirection = useCallback((id) => dispatch({ type: 'CLEAR_PRICE_DIRECTION', payload: id }), []);
    const setLeaderboard = useCallback((lb) => dispatch({ type: 'SET_LEADERBOARD', payload: lb }), []);
    const setGamePhase = useCallback((phase) => dispatch({ type: 'SET_GAME_PHASE', payload: phase }), []);
    const setGameActive = useCallback((v) => dispatch({ type: 'SET_GAME_ACTIVE', payload: v }), []);
    const setGameResult = useCallback((r) => dispatch({ type: 'SET_GAME_RESULT', payload: r }), []);
    const clearGameResult = useCallback(() => dispatch({ type: 'CLEAR_GAME_RESULT' }), []);
    const updateBalance = useCallback((bal) => dispatch({ type: 'UPDATE_BALANCE', payload: bal }), []);
    const setWsConnected = useCallback((v) => dispatch({ type: 'SET_WS_CONNECTED', payload: v }), []);
    const addToast = useCallback((toast) => dispatch({ type: 'ADD_TOAST', payload: toast }), []);
    const removeToast = useCallback((id) => dispatch({ type: 'REMOVE_TOAST', payload: id }), []);
    const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

    return (
        <GameContext.Provider
            value={{
                ...state,
                sessionLoading,
                setUser, setItems, updateItem, clearPriceDirection,
                setLeaderboard, setGamePhase, setGameActive,
                setGameResult, clearGameResult,
                updateBalance, setWsConnected, addToast, removeToast, logout,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}
