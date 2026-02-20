import { useState, useEffect, useCallback } from 'react';
import {
    Play, Square, RotateCcw, Users, Zap, Hash,
    ChevronDown, ChevronUp, Save, AlertTriangle,
    Trophy, Package, DollarSign, BarChart3, Crown, Skull
} from 'lucide-react';

export default function AdminPanel() {
    const [gameState, setGameState] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState('');
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [sortField, setSortField] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [topN, setTopN] = useState(0);
    const [resetResult, setResetResult] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // ── Fetch State ──────────────────────────────────────
    const fetchState = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/state');
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }
            if (res.ok) {
                setIsAuthenticated(true);
                setGameState(await res.json());
            }
        } catch { /* ignore */ }
    }, []);

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/api/items');
            if (res.ok) setItems(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchState();
        fetchItems();
        const interval = setInterval(() => {
            fetchState();
        }, 3000); // Check every 3s
        return () => clearInterval(interval);
    }, [fetchState, fetchItems]);

    // ── Actions ──────────────────────────────────────────
    async function doAction(url, label) {
        setLoading(label);
        setError('');
        setResetResult(null);
        try {
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || `${label} failed`);
            } else if (label === 'reset') {
                setResetResult(data);
            }
            await fetchState();
            await fetchItems();
        } catch {
            setError(`Network error during ${label}`);
        }
        setLoading('');
    }

    // ── Item Edit ────────────────────────────────────────
    function startEdit(item) {
        setEditingItem(item.id);
        setEditValues({
            current_price: item.current_price,
            current_stock: item.current_stock,
            base_price: item.base_price,
        });
    }

    async function saveEdit(itemId) {
        try {
            const res = await fetch(`/api/admin/update-item/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editValues),
            });
            if (res.ok) {
                setEditingItem(null);
                await fetchItems();
            }
        } catch { /* ignore */ }
    }

    // ── Sort ─────────────────────────────────────────────
    function toggleSort(field) {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    }

    const sortedItems = [...items].sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1;
        if (typeof a[sortField] === 'string') return a[sortField].localeCompare(b[sortField]) * mul;
        return ((a[sortField] ?? 0) - (b[sortField] ?? 0)) * mul;
    });

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
    };

    const isActive = gameState?.is_active;
    const totalStock = items.reduce((s, i) => s + i.current_stock, 0);
    const soldOutCount = items.filter(i => i.is_sold_out).length;

    const resetUrl = topN > 0
        ? `/api/admin/reset-game?top_n=${topN}`
        : '/api/admin/reset-game';

    // ── Login Handler ────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsAuthenticated(true);
                setPassword('');
                fetchState();
                fetchItems();
            } else {
                setLoginError('Access Denied: Invalid Credentials');
            }
        } catch (err) {
            setLoginError('Network Error');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setGameState(null);
        } catch { /* ignore */ }
    };

    if (!isAuthenticated) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0a0e1a] text-[#e2e8f0] font-mono">
                <div className="w-full max-w-md p-8 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-[#f59e0b]" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                        ADMIN ACCESS
                    </h1>
                    <p className="text-xs text-center text-[#64748b] tracking-[0.2em] uppercase mb-8">Restricted Area</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Code"
                                className="w-full bg-[#0f1629] border border-[#475569] rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]/30 transition-all placeholder:text-[#475569]"
                                autoFocus
                            />
                        </div>

                        {loginError && (
                            <div className="flex items-center gap-2 text-xs text-[#ef4444] bg-[#3b1214] border border-[#ef4444]/20 p-3 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-[#f59e0b] text-[#0a0e1a] font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-[#d97706] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                        >
                            Unlock Console
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0a0e1a] text-[#e2e8f0] font-mono">
            {/* ═══ HEADER ═══ */}
            <header className="border-b border-[#1e293b] bg-[#0f1629]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto !px-6 !py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#f59e0b]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                                COMMAND CENTER
                            </h1>
                            <p className="text-[10px] text-[#64748b] tracking-[0.2em] uppercase">Admin Console</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {gameState && (
                            <div className="flex items-center gap-2 text-xs">
                                <Users className="w-4 h-4 text-[#64748b]" />
                                <span className="text-[#94a3b8] font-medium">{gameState.connected_players} online</span>
                            </div>
                        )}
                        <div className={`flex items-center gap-2 !px-3 !py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border ${isActive
                            ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/10'
                            : 'border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#10b981] animate-pulse' : 'bg-[#ef4444]'}`} />
                            {isActive ? 'LIVE' : 'OFFLINE'}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-4 text-xs text-[#64748b] hover:text-white underline underline-offset-4"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto !px-6 !py-8">
                {/* ═══ GAME CONTROLS ═══ */}
                <section className="!mb-8">
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#64748b] !mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Game Session — Round {gameState?.round_number || 0}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Stats Cards */}
                        <div className="bg-[#1e293b] border border-[#334155] rounded-xl !p-5">
                            <p className="text-[10px] uppercase tracking-wider text-[#64748b] !mb-1">Status</p>
                            <p className={`text-2xl font-bold ${isActive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                {isActive ? 'ACTIVE' : 'STOPPED'}
                            </p>
                        </div>
                        <div className="bg-[#1e293b] border border-[#334155] rounded-xl !p-5">
                            <p className="text-[10px] uppercase tracking-wider text-[#64748b] !mb-1">Total Items</p>
                            <p className="text-2xl font-bold text-white">{items.length}</p>
                        </div>
                        <div className="bg-[#1e293b] border border-[#334155] rounded-xl !p-5">
                            <p className="text-[10px] uppercase tracking-wider text-[#64748b] !mb-1">Total Stock</p>
                            <p className="text-2xl font-bold text-[#06b6d4]">{totalStock}</p>
                        </div>
                        <div className="bg-[#1e293b] border border-[#334155] rounded-xl !p-5">
                            <p className="text-[10px] uppercase tracking-wider text-[#64748b] !mb-1">Sold Out</p>
                            <p className="text-2xl font-bold text-[#f59e0b]">{soldOutCount}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-end gap-3 !mt-5">
                        <button
                            onClick={() => doAction('/api/admin/start-game', 'start')}
                            disabled={isActive || !!loading}
                            className="flex items-center gap-2 !px-6 !py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all
                                bg-[#10b981] text-white hover:bg-[#059669] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]
                                disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            {loading === 'start' ? 'Starting...' : 'Start Game'}
                        </button>

                        <button
                            onClick={() => doAction('/api/admin/stop-game', 'stop')}
                            disabled={!isActive || !!loading}
                            className="flex items-center gap-2 !px-6 !py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all
                                bg-[#ef4444] text-white hover:bg-[#dc2626] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]
                                disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Square className="w-4 h-4" />
                            {loading === 'stop' ? 'Stopping...' : 'Stop Game'}
                        </button>

                        {/* ── Top N Selector + Reset ── */}
                        <div className="flex items-end gap-2 ml-auto">
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-[#f59e0b]" />
                                    Advance Top
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min={0}
                                        value={topN}
                                        onChange={e => setTopN(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 bg-[#0f1629] border border-[#475569] rounded-lg !px-2.5 !py-2.5 text-white text-sm font-mono text-center
                                            focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]/30 transition-all"
                                        placeholder="0"
                                    />
                                    <span className="text-[10px] text-[#64748b] whitespace-nowrap">
                                        {topN > 0 ? 'players' : '= All'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => doAction(resetUrl, 'reset')}
                                disabled={isActive || !!loading}
                                className={`flex items-center gap-2 !px-6 !py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all
                                    disabled:opacity-30 disabled:cursor-not-allowed
                                    ${topN > 0
                                        ? 'bg-gradient-to-r from-[#f59e0b] to-[#dc2626] text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                        : 'bg-[#f59e0b] text-[#0a0e1a] hover:bg-[#d97706] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                    }`}
                            >
                                {topN > 0 ? <Skull className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                {loading === 'reset' ? 'Resetting...' : topN > 0 ? `Eliminate & Reset` : 'Reset Round'}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="!mt-4 flex items-center gap-2 bg-[#3b1214] border border-[#ef4444]/50 rounded-lg !px-4 !py-3 text-sm text-[#fca5a5]">
                            <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Reset result feedback */}
                    {resetResult && resetResult.eliminated_count > 0 && (
                        <div className="!mt-4 flex items-center gap-2 bg-[#1a1207] border border-[#f59e0b]/40 rounded-lg !px-4 !py-3 text-sm text-[#fcd34d]">
                            <Skull className="w-4 h-4 text-[#f59e0b] shrink-0" />
                            {resetResult.message}
                        </div>
                    )}

                    {/* Winners from last round */}
                    {gameState?.winners?.length > 0 && !isActive && (
                        <div className="!mt-5 bg-[#1e293b] border border-[#f59e0b]/30 rounded-xl !p-5">
                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#f59e0b] !mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Last Round Winners
                            </h3>
                            <div className="space-y-2">
                                {gameState.winners.map((w) => (
                                    <div key={w.rank} className="flex items-center gap-3 text-sm">
                                        <span className={`text-lg ${w.rank === 1 ? 'text-[#eab308]' : w.rank === 2 ? 'text-[#94a3b8]' : 'text-[#cd7f32]'}`}>
                                            {w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : '🥉'}
                                        </span>
                                        <span className="font-bold text-white">{w.username}</span>
                                        {w.roll_number && <span className="text-[#64748b] font-mono text-xs">#{w.roll_number}</span>}
                                        <span className="ml-auto font-mono text-[#10b981]">₹{Math.round(w.balance).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* ═══ ITEMS TABLE ═══ */}
                <section>
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#64748b] !mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Market Items ({items.length})
                    </h2>

                    <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#334155] text-[10px] uppercase tracking-wider text-[#64748b]">
                                        {[
                                            ['id', '#'],
                                            ['name', 'Name'],
                                            ['category', 'Category'],
                                            ['base_price', 'Base Price'],
                                            ['current_price', 'Current Price'],
                                            ['current_stock', 'Stock'],
                                            ['is_sold_out', 'Status'],
                                        ].map(([field, label]) => (
                                            <th
                                                key={field}
                                                className="!px-4 !py-3 text-left cursor-pointer hover:text-white transition-colors select-none"
                                                onClick={() => toggleSort(field)}
                                            >
                                                {label} <SortIcon field={field} />
                                            </th>
                                        ))}
                                        <th className="!px-4 !py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedItems.map((item) => {
                                        const isEditing = editingItem === item.id;
                                        return (
                                            <tr key={item.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors">
                                                <td className="!px-4 !py-3 text-[#64748b] font-mono">{item.id}</td>
                                                <td className="!px-4 !py-3 font-medium text-white">{item.name}</td>
                                                <td className="!px-4 !py-3">
                                                    <span className="text-xs !px-2 !py-0.5 rounded bg-[#334155] text-[#94a3b8]">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="!px-4 !py-3 font-mono">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.base_price}
                                                            onChange={e => setEditValues(v => ({ ...v, base_price: +e.target.value }))}
                                                            className="w-24 bg-[#0f1629] border border-[#475569] rounded !px-2 !py-1 text-white text-xs font-mono"
                                                        />
                                                    ) : (
                                                        <span className="text-[#94a3b8]">₹{item.base_price.toLocaleString('en-IN')}</span>
                                                    )}
                                                </td>
                                                <td className="!px-4 !py-3 font-mono font-bold">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.current_price}
                                                            onChange={e => setEditValues(v => ({ ...v, current_price: +e.target.value }))}
                                                            className="w-24 bg-[#0f1629] border border-[#475569] rounded !px-2 !py-1 text-white text-xs font-mono"
                                                        />
                                                    ) : (
                                                        <span className={item.current_price > item.base_price * 2 ? 'text-[#ef4444]' : item.current_price < item.base_price ? 'text-[#10b981]' : 'text-white'}>
                                                            ₹{item.current_price.toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="!px-4 !py-3 font-mono">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editValues.current_stock}
                                                            onChange={e => setEditValues(v => ({ ...v, current_stock: +e.target.value }))}
                                                            className="w-16 bg-[#0f1629] border border-[#475569] rounded !px-2 !py-1 text-white text-xs font-mono"
                                                        />
                                                    ) : (
                                                        <span className={item.current_stock <= 3 ? 'text-[#ef4444]' : 'text-[#10b981]'}>
                                                            {item.current_stock}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="!px-4 !py-3">
                                                    {item.is_sold_out ? (
                                                        <span className="text-[10px] !px-2 !py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-bold uppercase">Sold Out</span>
                                                    ) : (
                                                        <span className="text-[10px] !px-2 !py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold uppercase">In Stock</span>
                                                    )}
                                                </td>
                                                <td className="!px-4 !py-3 text-right">
                                                    {isEditing ? (
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => saveEdit(item.id)}
                                                                className="text-[10px] !px-3 !py-1.5 rounded bg-[#10b981] text-white font-bold uppercase hover:bg-[#059669] transition-colors"
                                                            >
                                                                <Save className="w-3 h-3 inline !mr-1" /> Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingItem(null)}
                                                                className="text-[10px] !px-3 !py-1.5 rounded bg-[#334155] text-[#94a3b8] font-bold uppercase hover:bg-[#475569] transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEdit(item)}
                                                            className="text-[10px] !px-3 !py-1.5 rounded border border-[#475569] text-[#94a3b8] font-bold uppercase hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
