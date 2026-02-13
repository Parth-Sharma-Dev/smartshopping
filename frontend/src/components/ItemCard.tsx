import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Check,
  PackageX,
  Timer,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PriceTicker from './PriceTicker';
import { useGameStore } from '../store/useGameStore';
import { buyItem, fetchMe } from '../api';
import type { Item, CardBuyState } from '../types';

// ── Product thumbnail URLs (Unsplash) ───────────────────
const ITEM_IMAGES: Record<string, string> = {
  'Basmati Rice (1kg)':       'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop&q=80',
  'Olive Oil (500ml)':        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop&q=80',
  'Dark Chocolate Bar':       'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=300&fit=crop&q=80',
  'Green Tea (100 bags)':     'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&h=300&fit=crop&q=80',
  'Almonds (250g)':           'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&h=300&fit=crop&q=80',
  'Saffron (1g)':             'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop&q=80',
  'Protein Powder (1kg)':     'https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=400&h=300&fit=crop&q=80',
  'Manuka Honey (250g)':      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop&q=80',
  'Truffle Salt (100g)':      'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&h=300&fit=crop&q=80',
  'Wagyu Beef Strips (200g)': 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=300&fit=crop&q=80',
  'Imported Cheese Wheel':    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop&q=80',
  'Avocado Pack (6)':         'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop&q=80',
  'Quinoa (500g)':            'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop&q=80&crop=entropy',
  'Vanilla Extract (50ml)':   'https://images.unsplash.com/photo-1631209121750-a9f656d1cae0?w=400&h=300&fit=crop&q=80',
  'Açaí Berry Pack (300g)':   'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=300&fit=crop&q=80',
};

const ITEM_EMOJIS: Record<string, string> = {
  'Basmati Rice (1kg)': '🍚',
  'Olive Oil (500ml)': '🫒',
  'Dark Chocolate Bar': '🍫',
  'Green Tea (100 bags)': '🍵',
  'Almonds (250g)': '🥜',
  'Saffron (1g)': '🧡',
  'Protein Powder (1kg)': '💪',
  'Manuka Honey (250g)': '🍯',
  'Truffle Salt (100g)': '🧂',
  'Wagyu Beef Strips (200g)': '🥩',
  'Imported Cheese Wheel': '🧀',
  'Avocado Pack (6)': '🥑',
  'Quinoa (500g)': '🌾',
  'Vanilla Extract (50ml)': '🌿',
  'Açaí Berry Pack (300g)': '🫐',
};

const RESTOCK_SECONDS = 15;

interface ItemCardProps {
  item: Item;
  previousPrice: number;
}

export default function ItemCard({ item, previousPrice }: ItemCardProps) {
  const user = useGameStore((s) => s.user);
  const wsStatus = useGameStore((s) => s.wsStatus);
  const [buyState, setBuyState] = useState<CardBuyState>('idle');
  const [flashClass, setFlashClass] = useState('');
  const [restockCountdown, setRestockCountdown] = useState(RESTOCK_SECONDS);
  const [imgError, setImgError] = useState(false);
  const soldOutTimeRef = useRef<number | null>(null);

  const ownedCount = user?.inventory[item.id] ?? 0;
  const isMaxed = ownedCount >= 2;
  const isOwned = ownedCount > 0;

  // ── Price flash animation ─────────────────────────────
  useEffect(() => {
    if (item.current_price > previousPrice) {
      setFlashClass('card-flash-red');
    } else if (item.current_price < previousPrice) {
      setFlashClass('card-flash-green');
    }
    const timer = setTimeout(() => setFlashClass(''), 800);
    return () => clearTimeout(timer);
  }, [item.current_price, previousPrice]);

  // ── Restock countdown timer ───────────────────────────
  useEffect(() => {
    if (item.is_sold_out) {
      if (!soldOutTimeRef.current) {
        soldOutTimeRef.current = Date.now();
      }
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - soldOutTimeRef.current!) / 1000);
        const remaining = Math.max(0, RESTOCK_SECONDS - elapsed);
        setRestockCountdown(remaining);
      }, 200);
      return () => clearInterval(interval);
    } else {
      soldOutTimeRef.current = null;
      setRestockCountdown(RESTOCK_SECONDS);
    }
  }, [item.is_sold_out]);

  // ── Buy handler ───────────────────────────────────────
  const handleBuy = useCallback(async () => {
    if (!user || buyState === 'loading') return;

    setBuyState('loading');
    try {
      const res = await buyItem(user.id, item.id);
      setBuyState('success');

      useGameStore.getState().updateBalance(res.new_balance!);
      useGameStore.getState().addToInventory(item.id);

      if (res.is_finished) {
        useGameStore.getState().markFinished();
      }

      toast.success(`Purchased ${item.name} for ₹${res.item?.current_price ? (res.item.current_price / 1.02).toFixed(2) : '??'}`, {
        style: { background: '#ffffff', color: '#4a6741', border: '1px solid #4a6741' },
        iconTheme: { primary: '#4a6741', secondary: '#ffffff' },
      });

      fetchMe(user.id).then((u) => useGameStore.getState().setUser(u));
      setTimeout(() => setBuyState('idle'), 1200);
    } catch (err: any) {
      setBuyState('error');
      const msg = err?.response?.data?.detail || 'Transaction failed!';

      if (msg.includes('Insufficient')) {
        toast.error(`⚠️ Insufficient Funds!`, {
          style: { background: '#ffffff', color: '#e8a838', border: '1px solid #e8a838' },
        });
      } else if (msg.includes('SOLD OUT') || msg.includes('out of stock')) {
        toast.error(`❌ Transaction Failed: Out of Stock!`, {
          style: { background: '#ffffff', color: '#c2553a', border: '1px solid #c2553a' },
        });
      } else if (msg.includes('Max') || msg.includes('already own')) {
        toast.error(`🚫 Max limit reached for ${item.name}`, {
          style: { background: '#ffffff', color: '#e8a838', border: '1px solid #e8a838' },
        });
      } else {
        toast.error(msg, {
          style: { background: '#ffffff', color: '#c2553a', border: '1px solid #c2553a' },
        });
      }

      setTimeout(() => setBuyState('idle'), 600);
    }
  }, [user, item.id, item.name, buyState]);

  // ── Card classes ──────────────────────────────────────
  const cardBaseClass = `
    relative rounded-2xl overflow-hidden transition-all duration-200
    border
    ${flashClass}
    ${buyState === 'error' ? 'card-shake' : ''}
    ${isMaxed ? 'card-owned' : ''}
    ${item.is_sold_out && !isMaxed ? 'opacity-60' : ''}
  `;

  const emoji = ITEM_EMOJIS[item.name] || '📦';
  const imageUrl = ITEM_IMAGES[item.name];
  const restockPrice = (item.current_price * 1.2).toFixed(2);
  const priceChangePct = ((item.current_price - item.base_price) / item.base_price * 100).toFixed(1);
  const isAboveBase = item.current_price > item.base_price;

  const isDisabled = item.is_sold_out || isMaxed || wsStatus !== 'connected' || buyState === 'loading' || buyState === 'success';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cardBaseClass}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-warm)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* ── Product Thumbnail ─────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '140px', backgroundColor: 'var(--bg-warm)' }}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ filter: item.is_sold_out && !isMaxed ? 'grayscale(0.7) brightness(0.7)' : 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl" style={{ backgroundColor: 'var(--bg-warm)' }}>
            {emoji}
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(transparent, var(--bg-card))' }}
        />

        {/* Owned Badge */}
        {isMaxed && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'rgba(232, 168, 56, 0.15)',
              color: 'var(--saffron)',
              border: '1px solid var(--saffron)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Crown size={12} />
            <span>OWNED {ownedCount}/2</span>
          </div>
        )}

        {/* Partial Ownership Badge */}
        {isOwned && !isMaxed && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(74, 103, 65, 0.12)',
              color: 'var(--olive)',
              border: '1px solid rgba(74, 103, 65, 0.35)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Check size={12} />
            <span>{ownedCount}/2</span>
          </div>
        )}

        {/* Price Change Badge */}
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
          style={{
            backgroundColor: isAboveBase ? 'rgba(194, 85, 58, 0.12)' : 'rgba(74, 103, 65, 0.12)',
            color: isAboveBase ? 'var(--terracotta)' : 'var(--olive)',
            border: `1px solid ${isAboveBase ? 'rgba(194, 85, 58, 0.3)' : 'rgba(74, 103, 65, 0.3)'}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {isAboveBase ? '▲' : '▼'} {isAboveBase ? '+' : ''}{priceChangePct}%
        </div>
      </div>

      {/* ── Sold Out Overlay ──────────────────────────── */}
      {item.is_sold_out && !isMaxed && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl"
          style={{ backgroundColor: 'rgba(250, 246, 241, 0.75)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <PackageX size={28} style={{ color: 'var(--terracotta)' }} />
            <span
              className="font-heading text-xl font-bold tracking-wider uppercase"
              style={{ color: 'var(--terracotta)', animation: 'sold-out-pulse 2s ease-in-out infinite' }}
            >
              Sold Out
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--saffron)' }}>
            <Timer size={16} />
            <span className="font-mono text-sm font-semibold">
              Restocking in {String(Math.floor(restockCountdown / 60)).padStart(2, '0')}:
              {String(restockCountdown % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Next Price: </span>
            <span className="font-mono font-semibold" style={{ color: 'var(--saffron)' }}>
              ₹{Number(restockPrice).toLocaleString('en-IN')} (+20%)
            </span>
          </div>
        </div>
      )}

      {/* ── Card Body ─────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3">
        {/* Name + Base Price */}
        <div>
          <h3 className="font-heading font-bold text-base leading-tight" style={{ color: 'var(--text-heading)' }}>
            {item.name}
          </h3>
          <span className="text-[11px] font-mono mt-0.5 inline-block" style={{ color: 'var(--text-muted)' }}>
            BASE ₹{item.base_price.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Price */}
        <PriceTicker price={item.current_price} previousPrice={previousPrice} />

        {/* Stock */}
        <div className="flex items-center justify-between">
          <div className="text-xs">
            {item.is_sold_out ? (
              <span style={{ color: 'var(--terracotta)' }} className="font-semibold">Out of Stock</span>
            ) : item.current_stock <= 3 ? (
              <span style={{ color: 'var(--terracotta)' }} className="flex items-center gap-1 font-semibold">
                <AlertTriangle size={12} /> Only {item.current_stock} left!
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Stock: {item.current_stock}</span>
            )}
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={isDisabled}
          className="w-full py-3 rounded-xl font-heading font-bold tracking-wider text-sm uppercase
                     transition-all duration-200 flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed
                     cursor-pointer mt-1"
          style={{
            backgroundColor: isMaxed
              ? 'rgba(232, 168, 56, 0.1)'
              : buyState === 'success'
                ? 'rgba(74, 103, 65, 0.1)'
                : 'rgba(194, 85, 58, 0.08)',
            color: isMaxed
              ? 'var(--saffron)'
              : buyState === 'success'
                ? 'var(--olive)'
                : 'var(--terracotta)',
            border: `1px solid ${
              isMaxed
                ? 'var(--saffron)'
                : buyState === 'success'
                  ? 'var(--olive)'
                  : 'rgba(194, 85, 58, 0.3)'
            }`,
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(194, 85, 58, 0.15)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-glow-terracotta)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(194, 85, 58, 0.08)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }
          }}
        >
          {buyState === 'loading' ? (
            <span className="spinner" />
          ) : buyState === 'success' ? (
            <>
              <Check size={16} /> Purchased
            </>
          ) : isMaxed ? (
            'Max Reached'
          ) : (
            <>
              <ShoppingCart size={16} /> Buy
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
