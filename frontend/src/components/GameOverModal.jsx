import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, X } from 'lucide-react';

const RANK_CONFIG = [
    {
        emoji: '🥇',
        label: 'Winner',
        borderColor: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.4)',
        bgColor: 'rgba(234, 179, 8, 0.08)',
        textColor: '#fde047',
    },
    {
        emoji: '🥈',
        label: '1st Runner-up',
        borderColor: '#94a3b8',
        glowColor: 'rgba(148, 163, 184, 0.3)',
        bgColor: 'rgba(148, 163, 184, 0.06)',
        textColor: '#cbd5e1',
    },
    {
        emoji: '🥉',
        label: '2nd Runner-up',
        borderColor: '#cd7f32',
        glowColor: 'rgba(205, 127, 50, 0.3)',
        bgColor: 'rgba(205, 127, 50, 0.06)',
        textColor: '#e8a96b',
    },
];

export default function GameOverModal() {
    const { gameResult, clearGameResult } = useGame();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (gameResult && !dismissed) {
            // Slight delay for dramatic effect
            const timer = setTimeout(() => setVisible(true), 300);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [gameResult, dismissed]);

    // Auto-dismiss after 20 seconds
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => handleDismiss(), 20000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    // Reset dismissed state when a new result arrives
    useEffect(() => {
        if (gameResult) setDismissed(false);
    }, [gameResult]);

    function handleDismiss() {
        setVisible(false);
        setDismissed(true);
        setTimeout(() => clearGameResult(), 400);
    }

    if (!gameResult || dismissed) return null;

    const winners = gameResult.winners || [];

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleDismiss}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#0a0e1a]/90 backdrop-blur-md" />

            {/* Confetti particles (CSS-only) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-particle"
                        style={{
                            '--x': `${Math.random() * 100}vw`,
                            '--delay': `${Math.random() * 3}s`,
                            '--duration': `${2 + Math.random() * 3}s`,
                            '--color': ['#eab308', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b'][i % 6],
                            '--size': `${4 + Math.random() * 6}px`,
                            '--rotation': `${Math.random() * 360}deg`,
                        }}
                    />
                ))}
            </div>

            {/* Modal Card */}
            <div
                className={`relative z-10 w-full max-w-lg !mx-4 transition-all duration-700 ${visible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#64748b] hover:text-white hover:border-[#ef4444] transition-all z-20"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-[#eab308] via-[#10b981] to-[#8b5cf6] rounded-t-xl" />

                <div className="bg-[#0f1629] border border-[#1e293b] border-t-0 rounded-b-xl !p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center !mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#eab308]/10 border border-[#eab308]/30 !mb-4 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                            <Trophy className="w-8 h-8 text-[#eab308]" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight !mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                            GAME OVER
                        </h2>
                        <p className="text-xs text-[#64748b] tracking-[0.2em] uppercase">Final Results</p>
                    </div>

                    {/* Podium */}
                    <div className="space-y-3">
                        {winners.map((winner, i) => {
                            const config = RANK_CONFIG[i] || RANK_CONFIG[2];
                            return (
                                <div
                                    key={winner.rank}
                                    className="flex items-center gap-4 rounded-xl !p-4 border transition-all"
                                    style={{
                                        borderColor: config.borderColor,
                                        backgroundColor: config.bgColor,
                                        boxShadow: i === 0 ? `0 0 20px ${config.glowColor}` : 'none',
                                        animationDelay: `${i * 200 + 400}ms`,
                                    }}
                                >
                                    <span className="text-3xl">{config.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs uppercase tracking-wider !mb-0.5" style={{ color: config.borderColor }}>
                                            {config.label}
                                        </p>
                                        <p className="text-lg font-bold text-white truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                                            {winner.username}
                                        </p>
                                        {winner.roll_number && (
                                            <p className="text-xs text-[#64748b] font-mono">#{winner.roll_number}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] text-[#64748b] uppercase">Balance</p>
                                        <p className="text-lg font-bold font-mono text-[#10b981] tabular-nums">
                                            ₹{Math.round(winner.balance).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {winners.length === 0 && (
                            <p className="text-center text-[#64748b] text-sm !py-8">No players this round.</p>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[10px] text-[#475569] !mt-6 tracking-wider uppercase">
                        Tap anywhere to dismiss • Auto-closes in 20s
                    </p>
                </div>
            </div>
        </div>
    );
}
