import { useGame } from '../context/GameContext';
import { Wifi, WifiOff, Radio } from 'lucide-react';

export default function Lobby() {
    const { user, wsConnected, setGamePhase } = useGame();

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--color-void)] relative overflow-hidden">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Radar / Pulse animation */}
            <div className="relative !mb-12">
                {/* Outer rings */}
                <div className="w-40 h-40 rounded-full border border-[var(--color-edge)] flex items-center justify-center relative shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                    <div
                        className="absolute inset-0 rounded-full border border-[var(--color-primary)] opacity-20"
                        style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                    />
                    <div
                        className="absolute inset-3 rounded-full border border-[var(--color-cyan)] opacity-10"
                        style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.5s' }}
                    />
                    <div
                        className="absolute inset-6 rounded-full border border-[var(--color-primary)] opacity-5"
                        style={{ animation: 'pulse-glow 2s ease-in-out infinite 1s' }}
                    />

                    {/* Radar sweep line */}
                    <div className="absolute inset-0 animate-radar">
                        <div
                            className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left"
                            style={{
                                background: 'linear-gradient(90deg, var(--color-primary), transparent)',
                            }}
                        />
                    </div>

                    {/* Center icon */}
                    <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)] flex items-center justify-center">
                        <Radio className="w-5 h-5 text-[var(--color-cyan)]" />
                    </div>
                </div>
            </div>

            {/* Text */}
            <h2 className="font-heading text-2xl font-bold text-[var(--color-bright)] !mb-2 tracking-tight">
                Waiting for Host
            </h2>
            <p className="text-[var(--color-muted)] text-sm !mb-8 max-w-xs text-center leading-relaxed">
                The game will start automatically once the host triggers it. Stay on this screen.
            </p>

            {/* Connected badge - IMPROVED VISIBILITY */}
            <div className={`flex items-center gap-2 !px-5 !py-2.5 rounded-full border text-xs font-bold tracking-wider uppercase transition-colors ${wsConnected
                ? 'border-[var(--color-profit)] text-[var(--color-profit)] bg-[rgba(16,185,129,0.1)] shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'border-[var(--color-loss)] text-[var(--color-loss)] bg-[rgba(239,68,68,0.1)]'
                }`}>
                {wsConnected ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span>Connected</span>
                        <span className="w-2 h-2 rounded-full bg-[var(--color-profit)] animate-pulse shadow-[0_0_8px_var(--color-profit)]" />
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span>Reconnecting...</span>
                    </>
                )}
            </div>

            {/* Player info */}
            {user && (
                <div className="!mt-8 text-center !px-6 !py-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)] block !mb-1">
                        Logged in as
                    </span>
                    <p className="text-lg font-bold text-[var(--color-primary)] font-heading">
                        {user.username}
                    </p>
                    <span className="text-[var(--color-muted)] font-mono text-xs block !mt-0.5">
                        #{user.rollNo}
                    </span>
                </div>
            )}

            {/* Dev skip button */}
            <button
                onClick={() => setGamePhase('playing')}
                className="absolute bottom-6 right-6 text-[10px] text-[var(--color-muted)] border border-[var(--color-edge)] !px-3 !py-1.5 rounded hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] transition-colors uppercase tracking-wider"
            >
                Skip → Dashboard
            </button>
        </div>
    );
}
