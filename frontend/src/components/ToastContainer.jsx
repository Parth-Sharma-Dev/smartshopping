import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { X, Trophy, Info, Zap, AlertCircle } from 'lucide-react';

export default function ToastContainer() {
    const { toasts, removeToast } = useGame();

    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
}

function Toast({ toast, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const variants = {
        winner: {
            container: 'border-[var(--color-gold)] bg-[var(--color-slab)]/90',
            iconColor: 'text-[var(--color-gold)]',
            icon: Trophy,
        },
        info: {
            container: 'border-[var(--color-cyan)] bg-[var(--color-slab)]/90',
            iconColor: 'text-[var(--color-cyan)]',
            icon: Info,
        },
        success: {
            container: 'border-[var(--color-profit)] bg-[var(--color-slab)]/90',
            iconColor: 'text-[var(--color-profit)]',
            icon: Zap,
        },
        error: {
            container: 'border-[var(--color-loss)] bg-[var(--color-slab)]/90',
            iconColor: 'text-[var(--color-loss)]',
            icon: AlertCircle,
        },
    };

    const v = variants[toast.type] || variants.info;
    const Icon = v.icon;

    return (
        <div
            className={`
                pointer-events-auto
                animate-toast-in 
                flex items-start gap-4 
                border-l-4 ${v.container} 
                backdrop-blur-md shadow-2xl 
                rounded-xl !px-5 !py-4
                transform transition-all duration-300 hover:scale-[1.02]
            `}
        >
            <div className={`!mt-0.5 shrink-0 ${v.iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-bright)] leading-snug">
                    {toast.message}
                </p>
            </div>

            <button
                onClick={() => onDismiss(toast.id)}
                className="text-[var(--color-muted)] hover:text-[var(--color-bright)] transition-colors shrink-0 !-mt-1 !-mr-2 !p-2 rounded-lg hover:bg-[var(--color-void)]"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
