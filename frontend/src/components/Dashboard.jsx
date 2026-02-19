import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import MarketGrid, { ALL_CATEGORIES } from './MarketGrid';
import Leaderboard from './Leaderboard';
import {
    Wallet, Wifi, WifiOff, User, Hash,
    Utensils, Gem, Shirt, Cpu, Package, LayoutGrid,
    Menu, X
} from 'lucide-react';

const CATEGORY_ICONS = {
    All: LayoutGrid,
    Food: Utensils,
    Electronics: Cpu,
    Clothing: Shirt,
    Luxury: Gem,
    General: Package,
};

export default function Dashboard() {
    const { user, items, setItems, wsConnected } = useGame();
    const [activeCategory, setActiveCategory] = useState('All');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch items on mount
    useEffect(() => {
        async function loadItems() {
            try {
                const res = await fetch('/api/items');
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch {
                setTimeout(loadItems, 2000);
            }
        }
        loadItems();
    }, [setItems]);

    return (
        // Added !p-4 and gap-4 to the main container for global breathing room
        <div className="h-full w-full flex flex-col bg-[var(--color-void)] relative !p-4 md:!p-6 gap-4 md:gap-6 overflow-hidden">

            {/* Scanline overlay - kept distinct but behind content */}
            <div className="scanline-overlay pointer-events-none" />

            {/* ═══ HEADER (HUD) ═══ */}
            {/* Changed from full-width border to a Floating Card design */}
            <header className="flex-none h-16 bg-[var(--color-slab)] rounded-xl border border-[var(--color-edge)] shadow-lg flex items-center !px-6 gap-6 z-20 relative">

                {/* Mobile hamburger */}
                <button
                    className="lg:hidden text-[var(--color-muted)] hover:text-[var(--color-bright)] transition-colors !p-1"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>

                {/* Left — Player info */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-panel)] border border-[var(--color-edge)] flex items-center justify-center shrink-0 shadow-inner">
                        <User className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="min-w-0 hidden sm:block">
                        <p className="text-sm font-bold text-[var(--color-bright)] truncate leading-tight tracking-wide">
                            {user?.username || 'Guest User'}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] flex items-center gap-1.5 !mt-0.5">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono opacity-70">{user?.rollNo || '0000'}</span>
                        </p>
                    </div>
                </div>

                {/* Center — Wallet (Expanded size for emphasis) */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl !px-6 !py-2 shadow-sm">
                        <Wallet className="w-5 h-5 text-[var(--color-profit)]" />
                        <span className="font-mono text-xl font-bold text-[var(--color-profit)] tabular-nums glow-profit tracking-tight">
                            ₹{user ? Math.round(user.balance).toLocaleString('en-IN') : '---'}
                        </span>
                    </div>
                </div>

                {/* Right — Connection Status */}
                <div className="flex items-center gap-3 shrink-0 bg-[var(--color-void)]/30 !px-3 !py-1.5 rounded-lg border border-[var(--color-edge)]/50">
                    <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${wsConnected ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'
                        }`}>
                        {wsConnected ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-profit)] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-profit)]"></span>
                                </span>
                                <span className="hidden sm:inline">System Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                <span className="hidden sm:inline">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ═══ BODY: SIDEBAR + MAIN + LEADERBOARD ═══ */}
            {/* Added gap-6 to separate the panels visually */}
            <div className="flex-1 flex overflow-hidden gap-4 md:gap-6 relative z-10">

                {/* ── LEFT SIDEBAR (Categories & Thumbnail) ── */}
                <aside className={`
                    flex-none w-64 flex flex-col gap-4 transition-transform duration-300
                    ${mobileMenuOpen ? 'absolute inset-0 bg-[var(--color-void)] z-30 !p-4 translate-x-0' : 'hidden lg:flex translate-x-0'}
                `}>

                    {/* Navigation Panel */}
                    <div className="flex-1 bg-[var(--color-slab)] rounded-xl border border-[var(--color-edge)] overflow-hidden flex flex-col shadow-lg">
                        <div className="!px-6 !py-5 border-b border-[var(--color-edge)]/50">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-muted)] flex items-center gap-2">
                                <LayoutGrid className="w-3 h-3" />
                                Market Access
                            </span>
                        </div>

                        <nav className="flex-1 !px-4 !py-4 space-y-2 overflow-y-auto custom-scrollbar">
                            {ALL_CATEGORIES.map((cat) => {
                                const Icon = CATEGORY_ICONS[cat] || Package;
                                const active = activeCategory === cat;

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full group flex items-center gap-4 !px-4 !py-3 rounded-l text-sm transition-all duration-200 border ${active
                                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-bright)] shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                            : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-bright)] hover:bg-[var(--color-surface)]'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-bright)]'}`} />
                                        <span className="flex-1 text-left font-medium">{cat}</span>
                                        {cat === 'All' && (
                                            <span className={`text-[10px] font-mono !py-0.5 !px-2 rounded-l bg-[var(--color-void)] ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
                                                {items.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>


                </aside>

                {/* ── MAIN CONTENT (Market Grid) ── */}
                <main className="flex-1 min-w-0 bg-[var(--color-slab)] rounded-xl border border-[var(--color-edge)] shadow-lg flex flex-col overflow-hidden relative">
                    {/* Inner padding container for the grid */}
                    <div className="flex-1 overflow-hidden !p-1">
                        {/* We pass a class to Grid if it accepts className, or wrap it */}
                        <div className="h-full w-full overflow-y-auto !p-4 md:!p-6">
                            <MarketGrid activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                        </div>
                    </div>
                </main>

                {/* ── RIGHT SIDEBAR (Leaderboard) ── */}
                <aside className="hidden md:flex flex-col w-72 bg-[var(--color-slab)] rounded-xl border border-[var(--color-edge)] shadow-lg overflow-hidden">
                    <div className="!px-6 !py-5 border-b border-[var(--color-edge)]/50">
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-muted)]">
                            Top Players
                        </span>
                    </div>
                    <div className="flex-1 overflow-hidden !p-2">
                        <Leaderboard />
                    </div>
                </aside>
            </div>

            {/* Mobile overlay backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}