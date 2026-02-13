import { useGameStore } from '../store/useGameStore';
import ItemCard from './ItemCard';

export default function MarketGrid() {
  const items = useGameStore((s) => s.items);
  const previousPrices = useGameStore((s) => s.previousPrices);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-warm)' }} />
        <h2
          className="font-heading font-bold text-sm tracking-[0.25em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Live Market
        </h2>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-warm)' }} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            previousPrice={previousPrices[item.id] ?? item.current_price}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-24">
          <div className="text-5xl mb-5">🏪</div>
          <p className="font-heading text-lg" style={{ color: 'var(--text-muted)' }}>
            Loading market data...
          </p>
        </div>
      )}
    </div>
  );
}
