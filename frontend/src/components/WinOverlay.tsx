import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

const CONFETTI_COLORS = [
  '#c2553a', '#e8a838', '#4a6741', '#6b3a5d', '#f5c96b',
  '#a04530', '#6b8c5e', '#8e5a7e', '#d4956b', '#7c9a6e',
];

function ConfettiPiece({ index }: { index: number }) {
  const style = useMemo(() => {
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 10;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 3;
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    const rotation = Math.random() * 360;
    const shape = Math.random() > 0.5 ? '50%' : '0%';

    return {
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      borderRadius: shape,
      transform: `rotate(${rotation}deg)`,
    };
  }, [index]);

  return <div className="confetti-piece" style={style} />;
}

export default function WinOverlay() {
  const user = useGameStore((s) => s.user);
  const isFinished = user?.is_finished ?? false;

  return (
    <AnimatePresence>
      {isFinished && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(45, 31, 20, 0.85)' }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
            className="relative text-center p-8 sm:p-10 rounded-2xl border max-w-lg mx-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--saffron)',
              boxShadow: '0 8px 60px rgba(232, 168, 56, 0.25), 0 0 120px rgba(232, 168, 56, 0.08)',
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Trophy size={72} style={{ color: 'var(--saffron)' }} className="mx-auto mb-4" />
            </motion.div>

            <h1
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2"
              style={{ color: 'var(--text-heading)' }}
            >
              Set Completed!
            </h1>

            <div className="flex items-center justify-center gap-2 mb-6" style={{ color: 'var(--saffron)' }}>
              <Star size={16} />
              <span className="font-heading text-sm tracking-wider uppercase">Champion</span>
              <Star size={16} />
            </div>

            <div className="mb-6">
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                Remaining Balance
              </p>
              <p
                className="font-mono text-3xl sm:text-4xl font-bold"
                style={{ color: 'var(--olive)' }}
              >
                ₹{user?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0'}
              </p>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(232, 168, 56, 0.08)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-warm)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--saffron)' }}
              />
              Waiting for final results…
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
