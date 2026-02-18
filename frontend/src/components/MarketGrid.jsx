import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import {
    Search, ShoppingCart, Package, AlertTriangle,
    Utensils, Gem, Shirt, Cpu, Loader2, Image as ImageIcon
} from 'lucide-react';

const CATEGORY_MAP = {
    Food: { icon: Utensils, keywords: ['rice', 'oil', 'chocolate', 'tea', 'almond', 'saffron', 'protein', 'honey', 'truffle', 'wagyu', 'cheese', 'avocado', 'quinoa', 'vanilla', 'açaí', 'berry', 'matcha', 'peanut', 'chia', 'coconut', 'yogurt', 'beef', 'butter', 'seeds', 'water', 'extract', 'salt', 'bar', 'pack'] },
    Electronics: { icon: Cpu, keywords: ['earbuds', 'usb', 'keyboard', 'ssd', 'watch band', 'webcam', 'speaker', 'power bank', 'headphone', 'lamp', 'mouse', 'stand', 'plug', 'hdmi', 'cable', 'cooling', 'laptop', 'phone', 'bluetooth', 'wireless', 'smart', 'led', 'noise'] },
    Clothing: { icon: Shirt, keywords: ['shirt', 'jeans', 'shoes', 'belt', 'beanie', 'hoodie', 'scarf', 'sneaker', 'sunglasses', 'shorts', 'socks', 'jacket', 'cap', 'backpack', 'linen', 'cotton', 'denim', 'wool', 'canvas', 'cargo', 'cashmere', 'windbreaker', 'baseball', 'running', 'sports', 'polarized'] },
    Luxury: { icon: Gem, keywords: ['perfume', 'swiss', 'wallet', 'cufflink', 'crystal', 'fountain', 'pen', 'tie', 'frame', 'candle', 'towel', 'chess', 'journal', 'wine', 'coaster', 'telescope', 'marble', 'brass', 'leather', 'silver', 'gold', 'designer', 'monogram', 'electric', 'scented', 'travel', 'replica'] },
};

function categorizeItem(item) {
    if (item.category && item.category !== 'General') return item.category;
    const lower = item.name.toLowerCase();
    for (const [cat, { keywords }] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some((kw) => lower.includes(kw))) return cat;
    }
    return 'General';
}

function getCategoryIcon(category) {
    const entry = CATEGORY_MAP[category];
    return entry ? entry.icon : Package;
}

const ALL_CATEGORIES = ['All', 'Food', 'Electronics', 'Clothing', 'Luxury', 'General'];

export default function MarketGrid({ activeCategory, setActiveCategory }) {
    const { items, user, updateBalance, setItems, addToast, clearPriceDirection } = useGame();
    const [search, setSearch] = useState('');
    const [buyingId, setBuyingId] = useState(null);

    // Categorize items
    const categorized = items.map((item) => ({
        ...item,
        _category: categorizeItem(item),
    }));

    // Filter
    const filtered = categorized.filter((item) => {
        const matchCat = activeCategory === 'All' || item._category === activeCategory;
        const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const handleBuy = useCallback(async (item) => {
        if (!user || buyingId) return;
        setBuyingId(item.id);

        try {
            const res = await fetch('/api/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, item_id: item.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                addToast({ type: 'error', message: data.detail || 'Purchase failed' });
                setBuyingId(null);
                return;
            }

            updateBalance(data.new_balance);
            addToast({ type: 'success', message: data.message });

            if (data.item) {
                setItems(items.map((i) => i.id === data.item.id ? { ...i, ...data.item } : i));
            }
        } catch {
            addToast({ type: 'error', message: 'Network error during purchase' });
        }
        setBuyingId(null);
    }, [user, buyingId, items, updateBalance, setItems, addToast]);

    return (
        <div className="flex flex-col h-full">
            {/* Search bar & Header - Added Padding */}
            <div className="!px-6 !pt-6 !pb-4 w-6/12">
                <div className="relative !mb-1">
                    <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input
                        type="text"
                        placeholder="Search for assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl !pl-6 !pr-6 !py-3.5 text-sm text-[var(--color-bright)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all font-mono"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-muted)]">
                        {activeCategory} Market
                    </span>
                    <span className="text-xs text-[var(--color-muted)] font-mono bg-[var(--color-panel)] !px-2 !py-1 rounded">
                        {filtered.length} results
                    </span>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto !px-6 !pb-6">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[var(--color-muted)]">
                        <Package className="w-12 h-12 !mb-4 opacity-20" />
                        <p className="text-sm tracking-wide">No items matching criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filtered.map((item, index) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                user={user}
                                buying={buyingId === item.id}
                                onBuy={() => handleBuy(item)}
                                clearDir={() => clearPriceDirection(item.id)}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {/* Footer Section - Inside scroll view */}
                <footer className="!mt-12 !pt-8 !pb-4 border-t border-[var(--color-edge)]/50 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)] opacity-60">
                        Market Mayhem System v2.0
                    </p>
                    <p className="text-[10px] text-[var(--color-muted)] !mt-2 opacity-40">
                        © 2026 AI Nexus • Secure Transaction Layer
                    </p>
                </footer>
            </div>
        </div>
    );
}

function ItemCard({ item, user, buying, onBuy, clearDir, index }) {
    const Icon = getCategoryIcon(item._category);
    const oos = item.is_sold_out || item.current_stock <= 0;
    const cantAfford = user && user.balance < item.current_price;
    const disabled = oos || cantAfford || buying;

    const stockPercent = Math.min((item.current_stock / 15) * 100, 100);
    const stockLow = item.current_stock <= 3 && item.current_stock > 0;

    // Price flash animation
    const priceRef = useRef(null);
    useEffect(() => {
        if (!item._priceDirection || !priceRef.current) return;
        const el = priceRef.current;
        const cls = item._priceDirection === 'up' ? 'animate-price-hike' : 'animate-price-drop';
        el.classList.add(cls);
        const timer = setTimeout(() => {
            el.classList.remove(cls);
            clearDir();
        }, 1200);
        return () => clearTimeout(timer);
    }, [item._priceDirection, item.current_price, clearDir]);

    return (
        <div
            className={`
                group relative flex flex-col bg-[var(--color-panel)] 
                border border-[var(--color-edge)] rounded-2xl overflow-hidden 
                transition-all duration-300 hover:border-[var(--color-muted)] hover:shadow-xl hover:-translate-y-1
                animate-float-in
                ${stockLow ? 'fire-sale-pulse' : ''}
            `}
            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
        >
            {/* 1. Thumbnail Area */}
            <div className="aspect-[423/480] w-full bg-[var(--color-void)] relative border-b border-[var(--color-edge)] overflow-hidden">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${oos ? 'grayscale opacity-50' : ''}`}
                    />
                ) : (
                    // Fallback Placeholder
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-void)] relative">
                        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />
                        <Icon className={`w-12 h-12 text-[var(--color-muted)] opacity-20 group-hover:scale-110 transition-transform duration-500 ${oos ? '' : 'group-hover:text-[var(--color-primary)] group-hover:opacity-40'}`} />
                    </div>
                )}

                {/* Status Badges (Overlay) */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    {oos && (
                        <span className="bg-[var(--color-loss)] text-white text-[10px] font-bold !px-2 !py-1 rounded-md uppercase tracking-wider shadow-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sold Out
                        </span>
                    )}
                    {!oos && stockLow && (
                        <span className="bg-[var(--color-loss)]/90 text-white text-[10px] font-bold !px-2 !py-1 rounded-md uppercase tracking-wider shadow-md animate-pulse">
                            Low Stock
                        </span>
                    )}
                </div>
            </div>

            {/* 2. Content Body - Added Padding */}
            <div className="flex-1 !p-5 flex flex-col gap-3">

                {/* Title */}
                <div>
                    <h3 className="text-sm font-bold text-[var(--color-bright)] leading-tight line-clamp-2 min-h-[2.5em]" title={item.name}>
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-2 !mt-1">
                        <Icon className="w-3 h-3 text-[var(--color-muted)]" />
                        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">{item._category}</span>
                    </div>
                </div>

                {/* Price Block */}
                <div className="bg-[var(--color-void)]/50 rounded-lg !p-3 border border-[var(--color-edge)]/50 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-[var(--color-muted)]">Current Price</p>
                        <p ref={priceRef} className="text-lg font-bold text-[var(--color-bright)] font-mono tabular-nums leading-none !mt-0.5">
                            ₹{item.current_price.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-[var(--color-muted)]">Base</p>
                        <p className="text-xs text-[var(--color-muted)] line-through decoration-[var(--color-loss)]/50 decoration-2">
                            ₹{item.base_price.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                {/* Stock Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-[var(--color-muted)] font-medium">Availability</span>
                        <span className={`font-mono font-bold ${stockLow ? 'text-[var(--color-loss)]' : 'text-[var(--color-profit)]'}`}>
                            {item.current_stock} <span className="text-[var(--color-muted)] font-normal">/ 15</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-void)] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stockLow ? 'bg-[var(--color-loss)]' : stockPercent > 50 ? 'bg-[var(--color-profit)]' : 'bg-[var(--color-primary)]'
                                }`}
                            style={{ width: `${stockPercent}%` }}
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={onBuy}
                    disabled={disabled}
                    className={`
                        !mt-2 w-full !py-3 rounded-xl text-xs font-bold uppercase tracking-wider 
                        flex items-center justify-center gap-2 transition-all duration-200
                        ${disabled
                            ? 'bg-[var(--color-void)] text-[var(--color-muted)] border border-[var(--color-edge)] cursor-not-allowed opacity-70'
                            : 'bg-[var(--color-primary)] text-[var(--color-bright)] hover:bg-[var(--color-primary-dim)] hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] active:scale-[0.98]'
                        }
                    `}
                >
                    {buying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <ShoppingCart className="w-4 h-4" />
                            {oos ? 'Sold Out' : cantAfford ? 'Insuff. Funds' : 'Buy Now'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export { ALL_CATEGORIES };
