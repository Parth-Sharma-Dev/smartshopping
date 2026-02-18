import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Medal, Crown, User } from 'lucide-react';

export default function Leaderboard() {
    const { leaderboard, setLeaderboard, user } = useGame();

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data);
            }
        } catch { /* silent */ }
    }, [setLeaderboard]);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    return (
        <div className="flex flex-col h-full bg-[var(--color-slab)]">
            {/* List Container - Added padding and gap */}
            <div className="flex-1 overflow-y-auto !p-4 custom-scrollbar">
                {leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-[var(--color-muted)] text-xs gap-2">
                        <User className="w-8 h-8 opacity-20" />
                        <span>No players yet</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {leaderboard.map((entry, index) => {
                            const isMe = user && entry.username === user.username;
                            const rank = index + 1;

                            return (
                                <div
                                    key={entry.username}
                                    className={`
                                        flex items-center gap-4 !px-4 !py-4 rounded-xl text-sm transition-all relative overflow-hidden group border
                                        ${isMe
                                            ? 'bg-[var(--color-cyan)]/10 border-[var(--color-cyan)] shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                                            : 'bg-[var(--color-panel)] border-[var(--color-edge)] hover:border-[var(--color-muted)]'
                                        } 
                                        ${rank <= 3 ? 'shadow-sm' : ''}
                                    `}
                                >
                                    {/* Rank Icon/Number */}
                                    <div className="w-8 text-center shrink-0 flex items-center justify-center">
                                        {rank === 1 ? (
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-[var(--color-gold)] blur-lg opacity-40"></div>
                                                <Crown className="w-6 h-6 text-[var(--color-gold)] relative z-10" />
                                            </div>
                                        ) : rank === 2 ? (
                                            <Medal className="w-6 h-6 text-[#C0C0C0] drop-shadow-sm" />
                                        ) : rank === 3 ? (
                                            <Medal className="w-6 h-6 text-[#CD7F32] drop-shadow-sm" />
                                        ) : (
                                            <span className={`font-mono font-bold text-lg opacity-50 ${isMe ? 'text-[var(--color-cyan)]' : 'text-[var(--color-muted)]'}`}>
                                                {rank}
                                            </span>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className={`truncate font-bold tracking-tight text-sm ${isMe ? 'text-[var(--color-cyan)]' : 'text-[var(--color-bright)]'}`}>
                                                {entry.username}
                                            </p>
                                            {isMe && (
                                                <span className="!px-1.5 !py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--color-cyan)] text-[var(--color-void)]">
                                                    YOU
                                                </span>
                                            )}
                                        </div>
                                        {entry.roll_number && (
                                            <p className="text-[10px] text-[var(--color-muted)] font-mono opacity-80">
                                                #{entry.roll_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Balance */}
                                    <div className="text-right shrink-0">
                                        <p className={`font-mono font-bold tabular-nums text-sm ${
                                            isMe ? 'text-[var(--color-cyan)]' : entry.is_finished ? 'text-[var(--color-profit)]' : 'text-[var(--color-bright)]'
                                        }`}>
                                            ₹{Math.round(entry.balance).toLocaleString('en-IN')}
                                        </p>
                                        {entry.is_finished && (
                                            <span className="text-[9px] text-[var(--color-profit)] uppercase tracking-wider flex items-center justify-end gap-1 font-bold !mt-0.5">
                                                <Trophy className="w-3 h-3" /> Done
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
