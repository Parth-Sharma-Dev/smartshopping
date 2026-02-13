import { useGameStore } from '../store/useGameStore';
import { Wifi, WifiOff, Loader2, TrendingUp } from 'lucide-react';

export default function Header() {
  const user = useGameStore((s) => s.user);
  const items = useGameStore((s) => s.items);
  const wsStatus = useGameStore((s) => s.wsStatus);
  const totalItemCount = useGameStore((s) => s.totalItemCount);

  const ownedUniqueCount = user
    ? Object.keys(user.inventory).filter((k) => user.inventory[Number(k)] > 0).length
    : 0;

  return (
    <header
      className="sticky top-0 z-50 border-b w-full"
      style={{
        backgroundColor: 'rgba(250, 246, 241, 0.92)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border-warm)',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex items-center justify-between gap-4 sm:gap-6">
        {/* ── Logo ─────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg font-bold font-heading"
            style={{
              background: 'linear-gradient(135deg, var(--terracotta), var(--saffron))',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow-terracotta)',
            }}
          >
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              className="font-heading font-bold text-base sm:text-lg tracking-wide leading-none"
              style={{ color: 'var(--text-heading)' }}
            >
              Smart Shopping
            </h1>
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              2026 Edition
            </span>
          </div>
        </div>

        {/* ── Progress Bar ─────────────────────────────── */}
        <div className="hidden sm:flex flex-col items-center gap-1.5 flex-1 max-w-xl">
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] font-mono uppercase tracking-wider shrink-0" style={{ color: 'var(--text-muted)' }}>
              Progress
            </span>
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: totalItemCount || items.length }).map((_, i) => (
                <div
                  key={i}
                  className="progress-segment h-3 rounded-sm flex-1"
                  style={{
                    backgroundColor:
                      i < ownedUniqueCount
                        ? 'var(--olive)'
                        : 'var(--border-warm)',
                    boxShadow:
                      i < ownedUniqueCount
                        ? '0 0 6px rgba(74, 103, 65, 0.3)'
                        : 'none',
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-sm font-bold shrink-0" style={{ color: 'var(--terracotta)' }}>
              {ownedUniqueCount}/{totalItemCount || items.length}
            </span>
          </div>
        </div>

        {/* ── Right Section: WS Status + Balance ─────── */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* WS Status Indicator */}
          <div className="flex items-center gap-2">
            {wsStatus === 'connected' ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--olive)' }} />
                <Wifi size={16} style={{ color: 'var(--olive)' }} />
              </div>
            ) : wsStatus === 'connecting' ? (
              <Loader2 size={16} style={{ color: 'var(--saffron)' }} className="animate-spin" />
            ) : (
              <WifiOff size={16} style={{ color: 'var(--terracotta)' }} />
            )}
            {wsStatus !== 'connected' && (
              <span
                className="text-[11px] font-mono font-semibold uppercase hidden md:inline"
                style={{ color: wsStatus === 'connecting' ? 'var(--saffron)' : 'var(--terracotta)' }}
              >
                {wsStatus === 'connecting' ? 'Reconnecting…' : 'Disconnected'}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px" style={{ backgroundColor: 'var(--border-warm)' }} />

          {/* Balance */}
          {user && (
            <div className="text-right">
              <div
                className="font-mono text-lg sm:text-xl font-bold leading-none"
                style={{ color: 'var(--olive)' }}
              >
                ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: user.is_finished ? 'var(--saffron)' : 'var(--olive)',
                  }}
                />
                <span
                  className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold"
                  style={{
                    color: user.is_finished ? 'var(--saffron)' : 'var(--olive)',
                  }}
                >
                  {user.is_finished ? 'Finished' : 'Active'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Progress Bar ──────────────────────── */}
      <div className="sm:hidden px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-[2px] flex-1">
            {Array.from({ length: totalItemCount || items.length }).map((_, i) => (
              <div
                key={i}
                className="progress-segment h-2 rounded-sm flex-1"
                style={{
                  backgroundColor:
                    i < ownedUniqueCount ? 'var(--olive)' : 'var(--border-warm)',
                }}
              />
            ))}
          </div>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--terracotta)' }}>
            {ownedUniqueCount}/{totalItemCount || items.length}
          </span>
        </div>
      </div>
    </header>
  );
}
