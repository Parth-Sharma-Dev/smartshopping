import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, fetchMe } from '../api';
import { useGameStore } from '../store/useGameStore';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const setUser = useGameStore((s) => s.setUser);

  // Auto-login from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('ss_user_id');
    if (savedId) {
      fetchMe(savedId)
        .then((user) => {
          setUser(user);
        })
        .catch(() => {
          localStorage.removeItem('ss_user_id');
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || loading) return;

    setLoading(true);
    try {
      const user = await registerUser(username.trim());
      localStorage.setItem('ss_user_id', user.id);
      setUser(user);
      toast.success(`Welcome, ${user.username}!`, {
        style: { background: '#ffffff', color: '#4a6741', border: '1px solid #4a6741' },
        iconTheme: { primary: '#4a6741', secondary: '#ffffff' },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed';
      toast.error(msg, {
        style: { background: '#ffffff', color: '#c2553a', border: '1px solid #c2553a' },
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-cream)' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32, borderTopColor: 'var(--terracotta)' }} />
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Reconnecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-cream)' }}>
      {/* Warm subtle pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(194, 85, 58, 0.15) 2px, rgba(194, 85, 58, 0.15) 4px)',
          animation: 'scanline 8s linear infinite',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ boxShadow: ['0 4px 20px rgba(194,85,58,0.15)', '0 8px 36px rgba(194,85,58,0.3)', '0 4px 20px rgba(194,85,58,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--terracotta), var(--saffron))',
            }}
          >
            <Zap size={40} color="#ffffff" strokeWidth={2.5} />
          </motion.div>

          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-1"
            style={{ color: 'var(--text-heading)' }}
          >
            Smart Shopping
          </h1>
          <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--text-muted)' }}>
            2026 Competitive Edition
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
            boxShadow: 'var(--shadow-card-lg)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Users size={16} style={{ color: 'var(--terracotta)' }} />
            <h2 className="font-heading font-bold text-sm tracking-wider uppercase" style={{ color: 'var(--text-heading)' }}>
              Enter the Market
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Trader Callsign
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                maxLength={50}
                autoFocus
                className="w-full px-4 py-3 rounded-xl font-mono text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-offset-0"
                style={{
                  backgroundColor: 'var(--bg-warm)',
                  color: 'var(--text-heading)',
                  border: '1px solid var(--border-warm)',
                  '--tw-ring-color': 'var(--terracotta)',
                } as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim() || loading}
              className="w-full py-3 rounded-xl font-heading font-bold tracking-wider text-sm uppercase
                         transition-all duration-200 flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--terracotta), var(--saffron))',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                if (!loading && username.trim()) {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(194, 85, 58, 0.35)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <span className="spinner" style={{ borderTopColor: '#ffffff' }} />
              ) : (
                <>
                  Join Game <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-warm)' }} />
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              Rules
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-warm)' }} />
          </div>

          <ul className="mt-4 flex flex-col gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--terracotta)' }}>▸</span>
              Buy all items to complete your set
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--olive)' }}>▸</span>
              Prices change in real time — buy low!
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--plum)' }}>▸</span>
              Max 2 of each item per player
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--saffron)' }}>▸</span>
              Sold-out items restock at +20% price penalty
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
          ₹100,000 STARTING BALANCE • 15 UNIQUE ITEMS • REAL-TIME MARKETS
        </p>
      </motion.div>
    </div>
  );
}
