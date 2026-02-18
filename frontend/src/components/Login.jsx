import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Zap, User, Hash, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
    const { setUser, setGamePhase, setGameActive } = useGame();
    const [username, setUsername] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const canSubmit = username.trim().length >= 2 && rollNumber.trim().length > 0;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    roll_number: rollNumber.trim(),
                }),
            });

            if (res.status === 409) {
                setError('Username already taken. Pick another.');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Registration failed.');
                setLoading(false);
                return;
            }

            const data = await res.json();
            setUser({
                id: data.id,
                username: data.username,
                rollNo: data.roll_number || rollNumber.trim(),
                balance: data.balance,
                inventory: data.inventory || {},
                isFinished: data.is_finished,
            });
            if (data.game_active) {
                setGameActive(true);
                setGamePhase('playing');
            } else {
                setGamePhase('lobby');
            }
        } catch {
            setError('Network error. Is the server running?');
            setLoading(false);
        }
    }

    return (
        <div className="h-full w-full flex items-center justify-center bg-[var(--color-void)] relative overflow-hidden">
            {/* Background grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Diagonal accent line */}
            <div
                className="absolute top-0 right-0 w-[600px] h-[2px] bg-[var(--color-cyan)] opacity-20 origin-top-right"
                style={{ transform: 'rotate(-35deg) translateX(100px)' }}
            />
            <div
                className="absolute bottom-0 left-0 w-[400px] h-[2px] bg-[var(--color-primary)] opacity-10 origin-bottom-left"
                style={{ transform: 'rotate(-35deg) translateX(-100px)' }}
            />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-md !mx-4 animate-float-in"
            >
                {/* Top accent bar */}
                <div className="h-[3px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-cyan)] to-transparent rounded-t" />

                <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] !p-8 rounded-b-lg shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 !mb-2">
                        <div className="w-10 h-10 rounded bg-[var(--color-primary)] bg-opacity-20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[var(--color-bright)]">
                                SMART SHOPPING
                            </h1>
                        </div>
                    </div>
                    <p className="text-[var(--color-muted)] text-xs !mb-8 tracking-widest uppercase">
                        Competitive Market Simulation
                    </p>

                    {/* Username */}
                    <div className="!mb-5">
                        <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)] !mb-2">
                            <User className="w-3 h-3" />
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your handle"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={50}
                            className="w-full bg-[var(--color-slab)] border border-[var(--color-edge)] rounded !px-4 !py-3 text-sm text-[var(--color-bright)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-mono"
                        />
                    </div>

                    {/* Roll Number */}
                    <div className="!mb-6">
                        <label className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)] !mb-2">
                            <Hash className="w-3 h-3" />
                            Roll Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 2024CS101"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            maxLength={50}
                            className="w-full bg-[var(--color-slab)] border border-[var(--color-edge)] rounded !px-4 !py-3 text-sm text-[var(--color-bright)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-mono"
                        />
                    </div>

                    {/* Error - IMPROVED VISIBILITY */}
                    {error && (
                        <div className="flex items-start gap-2 !mb-5 bg-[#3B1214] border border-[var(--color-loss)] rounded !px-3 !py-2.5 text-xs text-[#FF8888] font-bold shadow-lg animate-glitch">
                            <AlertCircle className="w-4 h-4 !mt-0.5 shrink-0 text-[var(--color-loss)]" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-bright)] font-heading font-bold text-sm tracking-wider uppercase !py-3.5 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-primary-dim)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="animate-pulse">Connecting...</span>
                        ) : (
                            <>
                                Enter Lobby
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-center text-[var(--color-muted)] text-[10px] !mt-4 tracking-wide">
                    By entering, you agree to play fair ⚡
                </p>
            </form>
        </div>
    );
}
