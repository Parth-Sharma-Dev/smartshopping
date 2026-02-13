import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  previousPrice: number;
}

export default function PriceTicker({ price, previousPrice }: PriceTickerProps) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const direction = useRef<'up' | 'down' | 'none'>('none');

  useEffect(() => {
    if (price > previousPrice) direction.current = 'up';
    else if (price < previousPrice) direction.current = 'down';
    else direction.current = 'none';

    setDisplayPrice(price);
  }, [price, previousPrice]);

  const formatted = `₹${displayPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={displayPrice}
          initial={{ y: direction.current === 'up' ? 12 : -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction.current === 'up' ? -12 : 12, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="font-mono text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-heading)' }}
        >
          {formatted}
        </motion.span>
      </AnimatePresence>

      <AnimatePresence>
        {direction.current !== 'none' && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {direction.current === 'up' ? (
              <TrendingUp size={18} style={{ color: 'var(--terracotta)' }} />
            ) : (
              <TrendingDown size={18} style={{ color: 'var(--olive)' }} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
